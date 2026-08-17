<?php

namespace HeadlessCommerceCore\API\GraphQL;

use HeadlessCommerceCore\Core\StoreMode;
use HeadlessCommerceCore\SEO\SEOService;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Native GraphQL Endpoint & Schema Resolvers
 */
class Schema {

	public static function init(): void {
		add_action( 'rest_api_init', function () {
			register_rest_route( HCC_REST_NAMESPACE, '/graphql', array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'handle_graphql_query' ),
				'permission_callback' => '__return_true',
			) );
		} );
	}

	public static function handle_graphql_query( \WP_REST_Request $request ): \WP_REST_Response {
		$params    = $request->get_json_params();
		$query     = $params['query'] ?? '';
		$variables = $params['variables'] ?? array();

		if ( empty( $query ) ) {
			return new \WP_REST_Response( array(
				'errors' => array( array( 'message' => 'GraphQL query is required.' ) ),
			), 400 );
		}

		// Lightweight Schema Execution Engine for Native GraphQL Domain Queries
		$response_data = array();

		if ( strpos( $query, 'storeConfig' ) !== false ) {
			$response_data['storeConfig'] = array(
				'name'              => get_bloginfo( 'name' ),
				'storeMode'         => StoreMode::get_current_mode(),
				'purchasingEnabled' => StoreMode::is_purchasing_enabled(),
				'currency'          => get_woocommerce_currency(),
			);
		}

		if ( strpos( $query, 'products' ) !== false ) {
			$raw_products = wc_get_products( array( 'limit' => 12 ) );
			$products     = array();
			foreach ( $raw_products as $p ) {
				$img_id     = $p->get_image_id();
				$products[] = array(
					'id'          => $p->get_id(),
					'name'        => $p->get_name(),
					'slug'        => $p->get_slug(),
					'price'       => (float) $p->get_price(),
					'stockStatus' => $p->get_stock_status(),
					'image'       => $img_id ? wp_get_attachment_image_url( $img_id, 'full' ) : '',
				);
			}
			$response_data['products'] = $products;
		}

		if ( strpos( $query, 'product(' ) !== false && ! empty( $variables['slug'] ) ) {
			$id = wc_get_product_id_by_slug( sanitize_text_field( $variables['slug'] ) );
			if ( $id ) {
				$p     = wc_get_product( $id );
				$img_id = $p->get_image_id();
				$response_data['product'] = array(
					'id'          => $p->get_id(),
					'name'        => $p->get_name(),
					'slug'        => $p->get_slug(),
					'price'       => (float) $p->get_price(),
					'description' => wp_kses_post( $p->get_description() ),
					'stockStatus' => $p->get_stock_status(),
					'image'       => $img_id ? wp_get_attachment_image_url( $img_id, 'full' ) : '',
					'seo'         => SEOService::get_seo( $id, 'post' ),
				);
			}
		}

		return new \WP_REST_Response( array( 'data' => $response_data ), 200 );
	}
}
