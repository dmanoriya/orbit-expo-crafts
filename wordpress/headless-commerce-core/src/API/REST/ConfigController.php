<?php

namespace HeadlessCommerceCore\API\REST;

use HeadlessCommerceCore\Core\StoreMode;
use HeadlessCommerceCore\Admin\HomepageManager;
use HeadlessCommerceCore\Admin\TypographyManager;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * REST Store Config & Homepage Controller
 */
class ConfigController extends RestController {

	public function register_routes() {
		register_rest_route( $this->namespace, '/config', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_config' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( $this->namespace, '/homepage', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_homepage' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( $this->namespace, '/footer', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_footer' ),
			'permission_callback' => '__return_true',
		) );
	}

	public function get_config( $request ) {
		$typo = TypographyManager::get_typography_data();

		return $this->success_response( array(
			'name'              => get_bloginfo( 'name' ),
			'description'       => get_bloginfo( 'description' ),
			'storeMode'         => StoreMode::get_current_mode(),
			'purchasingEnabled' => StoreMode::is_purchasing_enabled(),
			'isHeadless'        => StoreMode::is_headless(),
			'currency'          => function_exists( 'get_woocommerce_currency' ) ? get_woocommerce_currency() : 'INR',
			'currencySymbol'    => function_exists( 'get_woocommerce_currency_symbol' ) ? get_woocommerce_currency_symbol() : '₹',
			'version'           => HCC_VERSION,
			'fonts'             => array(
				'fontHeading' => $typo['font_heading'],
				'fontBody'    => $typo['font_body'],
				'fontMenu'    => $typo['font_menu'],
				'fontButton'  => $typo['font_button'],
				'fontMono'    => $typo['font_mono'],
			),
			'footer'            => \HeadlessCommerceCore\Admin\FooterManager::get_footer_data(),
		) );
	}

	public function get_homepage( $request ) {
		$hp = HomepageManager::get_homepage_data();
		return $this->success_response( $hp );
	}

	public function get_footer( $request ) {
		$ft = \HeadlessCommerceCore\Admin\FooterManager::get_footer_data();
		return $this->success_response( $ft );
	}
}
