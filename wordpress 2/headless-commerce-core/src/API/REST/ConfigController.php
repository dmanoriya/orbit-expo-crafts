<?php

namespace HeadlessCommerceCore\API\REST;

use HeadlessCommerceCore\Core\StoreMode;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * REST Store Config Controller
 */
class ConfigController extends RestController {

	public function register_routes(): void {
		register_rest_route( $this->namespace, '/config', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_config' ),
			'permission_callback' => '__return_true',
		) );
	}

	public function get_config( \WP_REST_Request $request ): \WP_REST_Response {
		return $this->success_response( array(
			'name'              => get_bloginfo( 'name' ),
			'description'       => get_bloginfo( 'description' ),
			'storeMode'         => StoreMode::get_current_mode(),
			'purchasingEnabled' => StoreMode::is_purchasing_enabled(),
			'isHeadless'        => StoreMode::is_headless(),
			'currency'          => function_exists( 'get_woocommerce_currency' ) ? get_woocommerce_currency() : 'USD',
			'currencySymbol'    => function_exists( 'get_woocommerce_currency_symbol' ) ? get_woocommerce_currency_symbol() : '$',
			'version'           => HCC_VERSION,
		) );
	}
}
