<?php

namespace HeadlessCommerceCore\API\REST;

use HeadlessCommerceCore\SEO\SEOService;
use HeadlessCommerceCore\Cache\CacheManager;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * REST Products Controller
 */
class ProductsController extends RestController {

	public function register_routes(): void {
		register_rest_route( $this->namespace, '/products', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_products' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( $this->namespace, '/products/(?P<id>\d+)', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_product_by_id' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( $this->namespace, '/products/slug/(?P<slug>[a-zA-Z0-9-]+)', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_product_by_slug' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( $this->namespace, '/categories', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_categories' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( $this->namespace, '/attributes', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_attributes' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( $this->namespace, '/search', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'search_products' ),
			'permission_callback' => '__return_true',
		) );
	}

	public function get_products( \WP_REST_Request $request ): \WP_REST_Response {
		$page     = max( 1, (int) $request->get_param( 'page' ) ?: 1 );
		$per_page = min( 50, (int) $request->get_param( 'per_page' ) ?: 12 );
		$search   = sanitize_text_field( $request->get_param( 'search' ) ?? '' );
		$category = sanitize_text_field( $request->get_param( 'category' ) ?? '' );
		$orderby  = sanitize_text_field( $request->get_param( 'orderby' ) ?? 'date' );
		$order    = strtoupper( sanitize_text_field( $request->get_param( 'order' ) ?? 'DESC' ) );

		$args = array(
			'status'   => 'publish',
			'limit'    => $per_page,
			'page'     => $page,
			'paginate' => true,
			'orderby'  => $orderby,
			'order'    => $order,
		);

		if ( ! empty( $search ) ) {
			$args['s'] = $search;
		}

		if ( ! empty( $category ) ) {
			$args['category'] = array( $category );
		}

		$query    = wc_get_products( $args );
		$products = array();

		foreach ( $query->products as $product ) {
			$products[] = $this->prepare_product_payload( $product );
		}

		return $this->success_response( array(
			'products' => $products,
			'total'    => $query->total,
			'pages'    => $query->max_num_pages,
			'page'     => $page,
			'per_page' => $per_page,
		) );
	}

	public function get_product_by_id( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id = (int) $request->get_param( 'id' );
		$product = wc_get_product( $id );

		if ( ! $product ) {
			return $this->error_response( 'hcc_product_not_found', 'Product not found', 404 );
		}

		return $this->success_response( $this->prepare_product_payload( $product, true ) );
	}

	public function get_product_by_slug( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$slug = sanitize_text_field( $request->get_param( 'slug' ) );
		$id   = wc_get_product_id_by_slug( $slug );

		if ( ! $id ) {
			return $this->error_response( 'hcc_product_not_found', 'Product not found', 404 );
		}

		$product = wc_get_product( $id );
		return $this->success_response( $this->prepare_product_payload( $product, true ) );
	}

	public function get_categories( \WP_REST_Request $request ): \WP_REST_Response {
		$terms = get_terms( array(
			'taxonomy'   => 'product_cat',
			'hide_empty' => false,
		) );

		$categories = array();
		if ( ! is_wp_error( $terms ) ) {
			foreach ( $terms as $term ) {
				$thumbnail_id = get_term_meta( $term->term_id, 'thumbnail_id', true );
				$image        = $thumbnail_id ? wp_get_attachment_url( $thumbnail_id ) : '';
				$categories[] = array(
					'id'          => $term->term_id,
					'name'        => $term->name,
					'slug'        => $term->slug,
					'description' => $term->description,
					'count'       => $term->count,
					'parent'      => $term->parent,
					'image'       => $image,
				);
			}
		}

		return $this->success_response( $categories );
	}

	public function get_attributes( \WP_REST_Request $request ): \WP_REST_Response {
		$raw_attributes = wc_get_attribute_taxonomies();
		$attributes     = array();

		foreach ( $raw_attributes as $attr ) {
			$terms = get_terms( array(
				'taxonomy'   => wc_attribute_taxonomy_name( $attr->attribute_name ),
				'hide_empty' => false,
			) );

			$options = array();
			if ( ! is_wp_error( $terms ) ) {
				foreach ( $terms as $t ) {
					$options[] = array(
						'id'   => $t->term_id,
						'name' => $t->name,
						'slug' => $t->slug,
					);
				}
			}

			$attributes[] = array(
				'id'      => $attr->attribute_id,
				'name'    => $attr->attribute_label,
				'slug'    => $attr->attribute_name,
				'options' => $options,
			);
		}

		return $this->success_response( $attributes );
	}

	public function search_products( \WP_REST_Request $request ): \WP_REST_Response {
		return $this->get_products( $request );
	}

	private function prepare_product_payload( \WC_Product $product, bool $include_details = false ): array {
		$id        = $product->get_id();
		$image_id  = $product->get_image_id();
		$main_img  = $image_id ? wp_get_attachment_image_url( $image_id, 'full' ) : '';
		$gallery   = array();
		
		foreach ( $product->get_gallery_image_ids() as $gid ) {
			$gallery[] = wp_get_attachment_image_url( $gid, 'full' );
		}

		$cats = array();
		foreach ( wp_get_post_terms( $id, 'product_cat' ) as $t ) {
			$cats[] = array( 'id' => $t->term_id, 'name' => $t->name, 'slug' => $t->slug );
		}

		$variations = array();
		if ( $product->is_type( 'variable' ) ) {
			foreach ( $product->get_available_variations() as $var ) {
				$variations[] = array(
					'id'          => $var['variation_id'],
					'sku'         => $var['sku'],
					'price'       => (float) $var['display_price'],
					'regularPrice'=> (float) $var['display_regular_price'],
					'inStock'     => $var['is_in_stock'],
					'attributes'  => $var['attributes'],
					'image'       => $var['image']['url'] ?? $main_img,
				);
			}
		}

		$payload = array(
			'id'               => $id,
			'name'             => $product->get_name(),
			'slug'             => $product->get_slug(),
			'type'             => $product->get_type(),
			'sku'              => $product->get_sku(),
			'price'            => (float) $product->get_price(),
			'regularPrice'     => (float) $product->get_regular_price(),
			'salePrice'        => (float) $product->get_sale_price(),
			'onSale'           => $product->is_on_sale(),
			'stockStatus'      => $product->get_stock_status(),
			'inStock'          => $product->is_in_stock(),
			'shortDescription' => wp_kses_post( $product->get_short_description() ),
			'image'            => $main_img,
			'gallery'          => $gallery,
			'categories'       => $cats,
			'averageRating'    => (float) $product->get_average_rating(),
			'ratingCount'      => (int) $product->get_rating_count(),
		);

		if ( $include_details ) {
			$payload['description'] = wp_kses_post( $product->get_description() );
			$payload['variations']  = $variations;
			$payload['seo']         = SEOService::get_seo( $id, 'post' );
		}

		return $payload;
	}
}
