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

	public function register_routes() {
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

		register_rest_route( $this->namespace, '/seed', array(
			'methods'             => \WP_REST_Server::CREATABLE,
			'callback'            => array( $this, 'seed_sample_data' ),
			'permission_callback' => '__return_true',
		) );
	}

	public function get_products( $request ) {
		if ( ! function_exists( 'wc_get_products' ) ) {
			return $this->error_response( 'hcc_wc_inactive', 'WooCommerce is not active.', 500 );
		}

		$page     = max( 1, (int) $request->get_param( 'page' ) ?: 1 );
		$raw_per  = $request->get_param( 'per_page' );
		$per_page = ( $raw_per === '-1' || $raw_per === -1 ) ? -1 : min( 200, (int) ( $raw_per ?: 100 ) );

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

		if ( $query && isset( $query->products ) && is_array( $query->products ) ) {
			foreach ( $query->products as $product ) {
				$products[] = $this->prepare_product_payload( $product );
			}
		}

		return $this->success_response( array(
			'products' => $products,
			'total'    => isset( $query->total ) ? $query->total : count( $products ),
			'pages'    => isset( $query->max_num_pages ) ? $query->max_num_pages : 1,
			'page'     => $page,
			'per_page' => $per_page,
		) );
	}

	public function get_product_by_id( $request ) {
		if ( ! function_exists( 'wc_get_product' ) ) {
			return $this->error_response( 'hcc_wc_inactive', 'WooCommerce is not active.', 500 );
		}

		$id      = (int) $request->get_param( 'id' );
		$product = wc_get_product( $id );

		if ( ! $product ) {
			return $this->error_response( 'hcc_product_not_found', 'Product not found', 404 );
		}

		return $this->success_response( $this->prepare_product_payload( $product, true ) );
	}

	public function get_product_by_slug( $request ) {
		if ( ! class_exists( 'WooCommerce' ) && ! function_exists( 'wc_get_product' ) ) {
			return $this->error_response( 'hcc_wc_inactive', 'WooCommerce is not active.', 500 );
		}

		$slug = sanitize_text_field( $request->get_param( 'slug' ) );
		$args = array(
			'name'        => $slug,
			'post_type'   => 'product',
			'post_status' => 'publish',
			'numberposts' => 1,
		);
		$posts = get_posts( $args );

		if ( empty( $posts ) ) {
			return $this->error_response( 'hcc_product_not_found', 'Product not found', 404 );
		}

		$product = wc_get_product( $posts[0]->ID );
		if ( ! $product ) {
			return $this->error_response( 'hcc_product_not_found', 'Product not found', 404 );
		}

		return $this->success_response( $this->prepare_product_payload( $product, true ) );
	}

	public function get_categories( $request ) {
		$terms = get_terms( array(
			'taxonomy'   => 'product_cat',
			'hide_empty' => false,
		) );

		$categories = array();
		if ( ! is_wp_error( $terms ) && is_array( $terms ) ) {
			foreach ( $terms as $term ) {
				$thumbnail_id = get_term_meta( $term->term_id, 'thumbnail_id', true );
				$image        = $thumbnail_id ? wp_get_attachment_url( $thumbnail_id ) : '';
				$categories[] = array(
					'id'          => $term->term_id,
					'name'        => $this->decode_str( $term->name ),
					'slug'        => $term->slug,
					'description' => $this->decode_str( $term->description ),
					'count'       => $term->count,
					'parent'      => $term->parent,
					'image'       => $image ? $image : '',
				);
			}
		}

		return $this->success_response( $categories );
	}

	public function get_attributes( $request ) {
		if ( ! function_exists( 'wc_get_attribute_taxonomies' ) ) {
			return $this->success_response( array() );
		}

		$raw_attributes = wc_get_attribute_taxonomies();
		$attributes     = array();

		if ( is_array( $raw_attributes ) ) {
			foreach ( $raw_attributes as $attr ) {
				$tax_name = wc_attribute_taxonomy_name( $attr->attribute_name );
				$terms    = get_terms( array(
					'taxonomy'   => $tax_name,
					'hide_empty' => false,
				) );

				$options = array();
				if ( ! is_wp_error( $terms ) && is_array( $terms ) ) {
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
		}

		return $this->success_response( $attributes );
	}

	public function search_products( $request ) {
		return $this->get_products( $request );
	}

	public function seed_sample_data( $request ) {
		if ( ! function_exists( 'wc_get_product' ) || ! class_exists( 'WC_Product_Simple' ) ) {
			return $this->error_response( 'hcc_wc_inactive', 'WooCommerce is not active.', 500 );
		}

		// 1. Create Sample Categories
		$categories = array(
			'Seating'            => 'Dining chairs, armchairs, lounge chairs and bar stools.',
			'Tables & Desks'     => 'Dining tables, coffee tables, console tables and desks.',
			'Sofas & Lounge'     => 'Three-seaters, sectional sofas, chesterfields and daybeds.',
			'Beds & Bedroom'     => 'King canopy beds, upholstered beds and nightstands.',
			'Storage & Casegoods'=> 'Sideboards, wardobes, almirahs and display cabinets.',
			'Lighting'           => 'Pendants, floor lamps, wall sconces and chandeliers.',
			'Outdoor & Poolside' => 'Outdoor dining sets, rope loungers and garden benches.',
			'Decor & Mirrors'    => 'Arched wall mirrors, jaali screens and carved panels.',
		);

		$cat_ids = array();
		foreach ( $categories as $cat_name => $cat_desc ) {
			$term = get_term_by( 'name', $cat_name, 'product_cat' );
			if ( ! $term ) {
				$inserted = wp_insert_term( $cat_name, 'product_cat', array(
					'description' => $cat_desc,
					'slug'        => sanitize_title( $cat_name ),
				) );
				if ( ! is_wp_error( $inserted ) && isset( $inserted['term_id'] ) ) {
					$cat_ids[ $cat_name ] = $inserted['term_id'];
				}
			} else {
				$cat_ids[ $cat_name ] = $term->term_id;
			}
		}

		// 2. Create Sample Products
		$sample_items = array(
			array(
				'name'      => 'Marwar Teak Dining Chair',
				'cat'       => 'Seating',
				'sku'       => 'ORB-1001',
				'price'     => 14500,
				'short'     => 'Handcrafted solid teak dining chair with cane woven backrest.',
				'desc'      => 'Built to order in solid teak wood with natural cane lattice weave. Designed for fine dining, hotels and luxury villa dining rooms.',
				'moq'       => 12,
				'lead'      => 21,
				'material'  => 'Solid Teak',
				'dims'      => '48 x 52 x 86 cm',
				'image'     => 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
			),
			array(
				'name'      => 'Chittor Bone Inlay Console',
				'cat'       => 'Tables & Desks',
				'sku'       => 'ORB-1002',
				'price'     => 32000,
				'short'     => 'Bone inlay hallway console table with antique brass legs.',
				'desc'      => 'Intricate hand-cut bone inlay patterns embedded in black resin over seasoned solid wood structure.',
				'moq'       => 2,
				'lead'      => 30,
				'material'  => 'Bone Inlay',
				'dims'      => '140 x 40 x 76 cm',
				'image'     => 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=800&q=80',
			),
			array(
				'name'      => 'Amrai Deep Button Velvet Sofa',
				'cat'       => 'Sofas & Lounge',
				'sku'       => 'ORB-1003',
				'price'     => 68000,
				'short'     => 'Three-seater deep buttoned velvet lounge sofa.',
				'desc'      => 'Kiln-dried hardwood internal frame with high-density profiling foam and plush jewel-tone velvet upholstery.',
				'moq'       => 2,
				'lead'      => 25,
				'material'  => 'Upholstery Fabric',
				'dims'      => '210 x 88 x 80 cm',
				'image'     => 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
			),
			array(
				'name'      => 'Jaisalmer Canopy Poster Bed',
				'cat'       => 'Beds & Bedroom',
				'sku'       => 'ORB-1004',
				'price'     => 85000,
				'short'     => 'Solid Sheesham king size poster bed with brass accents.',
				'desc'      => 'Architectural four-poster king canopy bed built from kiln-dried Sheesham timber with hand-turned posts.',
				'moq'       => 4,
				'lead'      => 35,
				'material'  => 'Solid Sheesham',
				'dims'      => '198 x 203 x 210 cm',
				'image'     => 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
			),
			array(
				'name'      => 'Ranakpur Hand-Carved Sideboard',
				'cat'       => 'Storage & Casegoods',
				'sku'       => 'ORB-1005',
				'price'     => 45000,
				'short'     => 'Hand-carved wooden sideboard with jaali door panels.',
				'desc'      => 'Traditional Jodhpur hand carving on solid mango wood doors with soft-close concealed European hinges.',
				'moq'       => 3,
				'lead'      => 28,
				'material'  => 'Solid Mango',
				'dims'      => '160 x 45 x 85 cm',
				'image'     => 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
			),
			array(
				'name'      => 'Udaipur Brass Dome Pendant',
				'cat'       => 'Lighting',
				'sku'       => 'ORB-1006',
				'price'     => 12500,
				'short'     => 'Hand-hammered antique brass dome pendant fixture.',
				'desc'      => 'Crafted by copper and brass artisans in Jaipur with hand-beaten texture and warm gold interior reflection.',
				'moq'       => 10,
				'lead'      => 14,
				'material'  => 'Brass & Bronze',
				'dims'      => '45 x 45 x 40 cm',
				'image'     => 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
			),
			array(
				'name'      => 'Mehrangarh Rope Weave Outdoor Lounge',
				'cat'       => 'Outdoor & Poolside',
				'sku'       => 'ORB-1007',
				'price'     => 42000,
				'short'     => 'All-weather synthetic rope outdoor daybed sofa.',
				'desc'      => 'Powder coated aluminum structure wrapped in UV resistant olefin rope weave with Sunbrella outdoor fabric cushions.',
				'moq'       => 6,
				'lead'      => 24,
				'material'  => 'Rope Weave',
				'dims'      => '180 x 80 x 72 cm',
				'image'     => 'https://images.unsplash.com/photo-1540518614846-7ede433c517a?auto=format&fit=crop&w=800&q=80',
			),
			array(
				'name'      => 'Jaipur Carved Arch Mirror',
				'cat'       => 'Decor & Mirrors',
				'sku'       => 'ORB-1008',
				'price'     => 18500,
				'short'     => 'Ornate arched wall mirror with antique finish frame.',
				'desc'      => 'Heritage arched profile with hand-carved floral motif frame and 5mm distortion-free silver glass.',
				'moq'       => 5,
				'lead'      => 15,
				'material'  => 'Hand Carving',
				'dims'      => '90 x 5 x 150 cm',
				'image'     => 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
			)
		);

		$created_count = 0;

		foreach ( $sample_items as $item ) {
			$slug_name   = sanitize_title( $item['name'] );
			$existing    = get_posts( array(
				'name'        => $slug_name,
				'post_type'   => 'product',
				'post_status' => 'any',
				'numberposts' => 1,
			) );
			$existing_id = ! empty( $existing ) ? $existing[0]->ID : 0;

			if ( $existing_id ) {
				$product = wc_get_product( $existing_id );
			} else {
				$product = new \WC_Product_Simple();
				$product->set_name( $item['name'] );
				$product->set_slug( $slug_name );
			}

			$product->set_sku( $item['sku'] );
			$product->set_regular_price( $item['price'] );
			$product->set_short_description( $item['short'] );
			$product->set_description( $item['desc'] );
			$product->set_status( 'publish' );

			if ( isset( $cat_ids[ $item['cat'] ] ) ) {
				$product->set_category_ids( array( $cat_ids[ $item['cat'] ] ) );
			}

			// Store metadata
			$product->update_meta_data( '_moq', $item['moq'] );
			$product->update_meta_data( '_lead_time', $item['lead'] );
			$product->update_meta_data( '_material', $item['material'] );
			$product->update_meta_data( '_dimensions_text', $item['dims'] );
			$product->save();

			$created_count++;
		}

		return $this->success_response( array(
			'message' => "Successfully seeded {$created_count} WooCommerce products and categories into WordPress.",
			'count'   => $created_count,
		) );
	}

	private function decode_str( $str ) {
		return html_entity_decode( (string) $str, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
	}

	private function prepare_product_payload( $product, $include_details = false ) {
		$id        = $product->get_id();
		$image_id  = $product->get_image_id();
		$main_img  = $image_id ? wp_get_attachment_image_url( $image_id, 'full' ) : '';

		$gallery     = array();
		$gallery_ids = method_exists( $product, 'get_gallery_image_ids' ) ? $product->get_gallery_image_ids() : array();
		if ( is_array( $gallery_ids ) && ! empty( $gallery_ids ) ) {
			foreach ( $gallery_ids as $gid ) {
				$g_url = wp_get_attachment_image_url( $gid, 'full' );
				if ( $g_url ) {
					$gallery[] = $g_url;
				}
			}
		}

		$cats  = array();
		$terms = wp_get_post_terms( $id, 'product_cat' );
		if ( ! is_wp_error( $terms ) && is_array( $terms ) ) {
			foreach ( $terms as $t ) {
				$cats[] = array( 'id' => $t->term_id, 'name' => $this->decode_str( $t->name ), 'slug' => $t->slug );
			}
		}

		// Attributes
		$attributes_data = array();
		$attributes      = $product->get_attributes();
		if ( is_array( $attributes ) ) {
			foreach ( $attributes as $attr_key => $attr_val ) {
				if ( is_object( $attr_val ) ) {
					$opts = $attr_val->get_options();
					$resolved_opts = array();

					if ( $attr_val->is_taxonomy() && is_array( $opts ) ) {
						$tax_name = $attr_val->get_name();
						foreach ( $opts as $opt_id ) {
							if ( is_numeric( $opt_id ) ) {
								$term = get_term( (int) $opt_id, $tax_name );
								if ( $term && ! is_wp_error( $term ) ) {
									$resolved_opts[] = $this->decode_str( $term->name );
								} else {
									$resolved_opts[] = (string) $opt_id;
								}
							} else {
								$resolved_opts[] = $this->decode_str( (string) $opt_id );
							}
						}
					} else {
						$resolved_opts = is_array( $opts ) ? array_map( array( $this, 'decode_str' ), $opts ) : array( $this->decode_str( $opts ) );
					}

					$attributes_data[ $attr_key ] = $resolved_opts;
				}
			}
		}

		$fallback_img = \HeadlessCommerceCore\Admin\AdminSettings::get_default_fallback_image_url();
		$final_image  = $main_img ? $main_img : $fallback_img;

		$moq            = (int) ( $product->get_meta( '_moq' ) ?: 1 );
		$lead_time      = (int) ( $product->get_meta( '_lead_time' ) ?: 21 );
		$material       = (string) ( $product->get_meta( '_material' ) ?: 'Solid Wood' );
		$material2      = (string) ( $product->get_meta( '_material2' ) ?: 'Brass Detailing' );
		$segment        = (string) ( $product->get_meta( '_segment' ) ?: 'Hotel Guestroom' );
		$color          = (string) ( $product->get_meta( '_color' ) ?: 'Natural Oil' );
		$dimensions     = (string) ( $product->get_meta( '_dimensions_text' ) ?: 'Customisable' );
		$packing        = (string) ( $product->get_meta( '_packing_text' ) ?: 'Export-grade carton, knock-down where possible' );
		$lead_time_text = (string) ( $product->get_meta( '_lead_time_text' ) ?: sprintf( '%d working days after sample approval', $lead_time ) );
		$price_note     = (string) ( $product->get_meta( '_price_note' ) ?: 'Quoted to your spec & quantity' );
		$raw_badge      = (string) ( $product->get_meta( '_badge' ) ?: '' );
		$badge          = null;

		// Extract terms from WooCommerce Taxonomies if assigned
		$seg_terms = wp_get_post_terms( $id, 'pa_segment' );
		if ( ! is_wp_error( $seg_terms ) && ! empty( $seg_terms ) ) {
			$segment = $seg_terms[0]->name;
		}

		$mat_terms = wp_get_post_terms( $id, 'pa_material' );
		if ( ! is_wp_error( $mat_terms ) && ! empty( $mat_terms ) ) {
			$material = $mat_terms[0]->name;
		}

		$col_terms = wp_get_post_terms( $id, 'pa_color' );
		$all_pa_colors = array();
		if ( ! is_wp_error( $col_terms ) && ! empty( $col_terms ) ) {
			$color = $col_terms[0]->name;
			foreach ( $col_terms as $ct ) {
				$all_pa_colors[] = $this->decode_str( $ct->name );
			}
		}

		if ( ! empty( $all_pa_colors ) ) {
			$available_colors = $all_pa_colors;
		} else {
			$raw_avail_colors = $product->get_meta( '_available_colors' );
			$available_colors = array();

			if ( ! empty( $raw_avail_colors ) ) {
				$decoded = json_decode( $raw_avail_colors, true );
				if ( is_array( $decoded ) ) {
					$available_colors = array_map( array( $this, 'decode_str' ), $decoded );
				}
			}

			if ( empty( $available_colors ) && ! empty( $color ) ) {
				$available_colors = array( $this->decode_str( $color ) );
			}
		}

		$variations_payload = array();
		if ( $product->is_type( 'variable' ) || method_exists( $product, 'get_children' ) ) {
			$children_ids = $product->get_children();
			if ( is_array( $children_ids ) ) {
				foreach ( $children_ids as $var_id ) {
					$var_obj = wc_get_product( $var_id );
					if ( ! $var_obj ) continue;

					$var_color_slug = get_post_meta( $var_id, 'attribute_pa_color', true );
					$var_color_name = '';
					if ( $var_color_slug ) {
						$t = get_term_by( 'slug', $var_color_slug, 'pa_color' );
						if ( $t ) {
							$var_color_name = $t->name;
						}
					}

					$var_img_id = get_post_thumbnail_id( $var_id );
					$var_img    = $var_img_id ? wp_get_attachment_url( $var_img_id ) : $final_image;

					$variations_payload[] = array(
						'id'        => $var_id,
						'sku'       => $var_obj->get_sku(),
						'price'     => (float) $var_obj->get_price(),
						'color'     => $this->decode_str( $var_color_name ),
						'colorSlug' => $var_color_slug,
						'image'     => $var_img ? $var_img : $final_image,
					);
				}
			}
		}

		$specs = array(
			'dimensions' => $this->decode_str( $dimensions ),
			'material'   => $this->decode_str( $material ),
			'material2'  => $this->decode_str( $material2 ),
			'moq'        => sprintf( '%d units', $moq ),
			'leadTime'   => $this->decode_str( $lead_time_text ),
			'packing'    => $this->decode_str( $packing ),
			'priceNote'  => $this->decode_str( $price_note ),
		);

		$payload = array(
			'id'               => $id,
			'name'             => $this->decode_str( $product->get_name() ),
			'slug'             => $product->get_slug(),
			'type'             => $product->get_type(),
			'sku'              => $product->get_sku(),
			'price'            => (float) $product->get_price(),
			'regularPrice'     => (float) $product->get_regular_price(),
			'salePrice'        => (float) $product->get_sale_price(),
			'onSale'           => $product->is_on_sale(),
			'badge'            => $this->decode_str( $badge ),
			'stockStatus'      => $product->get_stock_status(),
			'inStock'          => $product->is_in_stock(),
			'shortDescription' => $this->decode_str( $product->get_short_description() ),
			'image'            => $final_image,
			'gallery'          => $gallery,
			'categories'       => $cats,
			'attributes'       => $attributes_data,
			'moq'              => $moq,
			'leadTime'         => $lead_time,
			'material'         => $this->decode_str( $material ),
			'material2'        => $this->decode_str( $material2 ),
			'segment'          => $this->decode_str( $segment ),
			'color'            => $this->decode_str( $color ),
			'availableColors'  => $available_colors,
			'variations'       => $variations_payload,
			'dimensions'       => $this->decode_str( $dimensions ),
			'packing'          => $this->decode_str( $packing ),
			'leadTimeText'     => $this->decode_str( $lead_time_text ),
			'priceNote'        => $this->decode_str( $price_note ),
			'specs'            => $specs,
			'averageRating'    => (float) $product->get_average_rating(),
			'ratingCount'      => (int) $product->get_rating_count(),
		);

		if ( $include_details ) {
			$payload['description'] = $this->decode_str( $product->get_description() );
			$payload['seo']         = SEOService::get_seo( $id, 'post' );
		}

		return $payload;
	}
}
