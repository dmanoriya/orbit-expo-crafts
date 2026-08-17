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

	private static ?Plugin $instance = null;

	public static function get_instance(): Plugin {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		$this->init_components();
		$this->register_catalog_mode_hooks();
	}

	private function init_components(): void {
		// Initialize Security & CORS
		SecurityManager::init();

		// Initialize Cache Manager
		CacheManager::init();

		// Initialize SEO Service
		SEOService::init();

		// Initialize REST Controllers
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );

		// Initialize GraphQL Schema & Endpoint
		Schema::init();

		// Initialize Admin Settings
		if ( is_admin() ) {
			AdminSettings::init();
		}
	}

	public function register_rest_routes(): void {
		$controllers = array(
			new \HeadlessCommerceCore\API\REST\ProductsController(),
			new \HeadlessCommerceCore\API\REST\CartController(),
			new \HeadlessCommerceCore\API\REST\CheckoutController(),
			new \HeadlessCommerceCore\API\REST\AuthController(),
			new \HeadlessCommerceCore\API\REST\SEOController(),
			new \HeadlessCommerceCore\API\REST\ConfigController(),
		);

		foreach ( $controllers as $controller ) {
			$controller->register_routes();
		}
	}

	/**
	 * Register catalog mode hooks to disable purchasing when StoreMode is CATALOG or HEADLESS_CATALOG
	 */
	private function register_catalog_mode_hooks(): void {
		add_action( 'init', function () {
			if ( ! is_admin() && class_exists( 'WooCommerce' ) && ! StoreMode::is_purchasing_enabled() ) {
				// Disable purchasing in WooCommerce natively when CATALOG mode is active
				add_filter( 'woocommerce_is_purchasable', '__return_false' );
				remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_add_to_cart', 30 );
				remove_action( 'woocommerce_after_shop_loop_item', 'woocommerce_template_loop_add_to_cart', 10 );
			}
		} );
	}

	public static function activate(): void {
		if ( ! get_option( 'hcc_store_mode' ) ) {
			update_option( 'hcc_store_mode', StoreMode::HEADLESS_STORE );
		}
		flush_rewrite_rules();
	}

	public static function deactivate(): void {
		flush_rewrite_rules();
	}
}
