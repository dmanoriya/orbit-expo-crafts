<?php
/**
 * Plugin Name: Headless Commerce Core
 * Plugin URI: https://github.com/antigravity/headless-commerce-core
 * Description: Production-ready high-performance API, SEO, and store management layer for headless WooCommerce & Next.js storefronts.
 * Version: 1.0.0
 * Author: Antigravity Engineering
 * Text Domain: headless-commerce-core
 * Domain Path: /languages
 * Requires at least: 6.2
 * Requires PHP: 8.1
 * WC requires at least: 8.0
 * WC tests up to: 9.2
 *
 * @package HeadlessCommerceCore
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'HCC_VERSION', '1.0.0' );
define( 'HCC_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'HCC_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'HCC_REST_NAMESPACE', 'hcc/v1' );

// PSR-4 Autoloader for Plugin Src
spl_autoload_register( function ( $class ) {
	$prefix = 'HeadlessCommerceCore\\';
	$base_dir = HCC_PLUGIN_DIR . 'src/';

	$len = strlen( $prefix );
	if ( strncmp( $prefix, $class, $len ) !== 0 ) {
		return;
	}

	$relative_class = substr( $class, $len );
	$file = $base_dir . str_replace( '\\', '/', $relative_class ) . '.php';

	if ( file_exists( $file ) ) {
		require_once $file;
	}
} );

/**
 * Declare High-Performance Order Storage (HPOS) compatibility.
 */
add_action( 'before_woocommerce_init', function () {
	if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
		\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
	}
} );

/**
 * Bootstrap Plugin
 */
function hcc_init() {
	if ( ! class_exists( 'WooCommerce' ) ) {
		add_action( 'admin_notices', function () {
			echo '<div class="notice notice-error"><p><strong>Headless Commerce Core</strong> requires <strong>WooCommerce</strong> plugin to be installed and active.</p></div>';
		} );
		return;
	}
	return \HeadlessCommerceCore\Core\Plugin::get_instance();
}

add_action( 'plugins_loaded', 'hcc_init' );

// Activation & Deactivation Hooks
register_activation_hook( __FILE__, array( '\HeadlessCommerceCore\Core\Plugin', 'activate' ) );
register_deactivation_hook( __FILE__, array( '\HeadlessCommerceCore\Core\Plugin', 'deactivate' ) );
