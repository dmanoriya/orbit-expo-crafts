<?php

namespace HeadlessCommerceCore\Core;

use HeadlessCommerceCore\API\REST\RestController;
use HeadlessCommerceCore\API\GraphQL\Schema;
use HeadlessCommerceCore\SEO\SEOService;
use HeadlessCommerceCore\Cache\CacheManager;
use HeadlessCommerceCore\Security\SecurityManager;
use HeadlessCommerceCore\Admin\AdminSettings;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Main Plugin Singleton Class
 */
class Plugin {

	private static $instance = null;

	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		$this->init_components();
		$this->register_catalog_mode_hooks();
	}

	private function init_components() {
		// Initialize Security & CORS
		SecurityManager::init();

		// Initialize Cache Manager
		CacheManager::init();

		// Initialize SEO Service
		SEOService::init();

		// Register Navigation Menu Location
		add_action( 'after_setup_theme', function() {
			register_nav_menus( array(
				'next_menu' => __( 'Next Menu (Headless Storefront Header)', 'headless-commerce-core' ),
			) );
		} );

		// Initialize REST Controllers
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );

		// Initialize GraphQL Schema & Endpoint
		Schema::init();

		// Initialize Admin Settings & Managers
		if ( is_admin() ) {
			AdminSettings::init();
			\HeadlessCommerceCore\Admin\HomepageManager::init();
			\HeadlessCommerceCore\Admin\TypographyManager::init();
			\HeadlessCommerceCore\Admin\FooterManager::init();
			\HeadlessCommerceCore\Admin\CategoryTaxonomyManager::init();
		}
		\HeadlessCommerceCore\Admin\FormEntriesManager::init();
		\HeadlessCommerceCore\Admin\CategoryTaxonomyManager::init();
	}

	public function register_rest_routes() {
		$controllers = array(
			new \HeadlessCommerceCore\API\REST\ProductsController(),
			new \HeadlessCommerceCore\API\REST\CartController(),
			new \HeadlessCommerceCore\API\REST\CheckoutController(),
			new \HeadlessCommerceCore\API\REST\AuthController(),
			new \HeadlessCommerceCore\API\REST\SEOController(),
			new \HeadlessCommerceCore\API\REST\ConfigController(),
			new \HeadlessCommerceCore\API\REST\MenuController(),
			new \HeadlessCommerceCore\API\REST\PostsController(),
			new \HeadlessCommerceCore\API\REST\AttributesController(),
			new \HeadlessCommerceCore\API\REST\FormEntriesController(),
		);

		foreach ( $controllers as $controller ) {
			$controller->register_routes();
		}
	}

	/**
	 * Register catalog mode hooks to disable purchasing, hide prices and remove payment gateways when Catalog Mode is active
	 */
	private function register_catalog_mode_hooks() {
		add_action( 'init', function () {
			if ( class_exists( 'WooCommerce' ) && ! StoreMode::is_purchasing_enabled() ) {
				// 1. Disable purchasing & Add to Cart
				add_filter( 'woocommerce_is_purchasable', '__return_false' );
				remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_add_to_cart', 30 );
				remove_action( 'woocommerce_after_shop_loop_item', 'woocommerce_template_loop_add_to_cart', 10 );

				// 2. Hide prices natively across WooCommerce frontend
				add_filter( 'woocommerce_get_price_html', function( $price, $product ) {
					return '<span class="price-on-request" style="font-weight:600; color:#0E5C63;">Price on Request</span>';
				}, 10, 2 );

				// 3. Disable all WooCommerce Payment Gateways
				add_filter( 'woocommerce_available_payment_gateways', '__return_empty_array' );

				// 4. Replace Add to Cart button on native single product with B2B Enquiry button
				add_action( 'woocommerce_single_product_summary', function() {
					echo '<a href="#enquiry" class="button alt" style="background:#0E5C63; color:#fff; padding:12px 24px; border-radius:999px; text-decoration:none; display:inline-block; font-weight:700;">Request a Quote</a>';
				}, 30 );
			}
		} );
	}

	public static function activate() {
		if ( ! get_option( 'hcc_store_mode' ) ) {
			update_option( 'hcc_store_mode', StoreMode::HEADLESS_CATALOG );
		}
		flush_rewrite_rules();
	}

	public static function deactivate() {
		flush_rewrite_rules();
	}
}
