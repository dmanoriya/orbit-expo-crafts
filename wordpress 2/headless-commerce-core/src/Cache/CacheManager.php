<?php

namespace HeadlessCommerceCore\Cache;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * High-Performance Multi-Layer Cache & Instant Revalidation Manager
 */
class CacheManager {

	public static function init() {
		// Product Hooks
		add_action( 'save_post_product', array( __CLASS__, 'purge_product_cache' ), 10, 1 );
		add_action( 'woocommerce_update_product', array( __CLASS__, 'purge_product_cache' ), 10, 1 );
		add_action( 'woocommerce_product_set_stock', array( __CLASS__, 'purge_product_cache' ), 10, 1 );
		add_action( 'wp_trash_post', array( __CLASS__, 'purge_product_cache' ), 10, 1 );
		add_action( 'untrash_post', array( __CLASS__, 'purge_product_cache' ), 10, 1 );
		add_action( 'before_delete_post', array( __CLASS__, 'purge_product_cache' ), 10, 1 );

		// Category Hooks
		add_action( 'edited_product_cat', array( __CLASS__, 'purge_catalog_cache' ) );
		add_action( 'create_product_cat', array( __CLASS__, 'purge_catalog_cache' ) );
		add_action( 'delete_product_cat', array( __CLASS__, 'purge_catalog_cache' ) );

		// Attribute & Theme Setting Hooks
		add_action( 'woocommerce_attribute_added', array( __CLASS__, 'purge_attribute_cache' ) );
		add_action( 'woocommerce_attribute_updated', array( __CLASS__, 'purge_attribute_cache' ) );
		add_action( 'woocommerce_attribute_deleted', array( __CLASS__, 'purge_attribute_cache' ) );
		add_action( 'updated_option_hcc_frontend_url', array( __CLASS__, 'purge_all_cache' ) );
		add_action( 'updated_option_hcc_homepage_data', array( __CLASS__, 'purge_all_cache' ) );
	}

	public static function get( $key ) {
		$group = 'hcc_cache';
		return wp_cache_get( $key, $group );
	}

	public static function set( $key, $data, $ttl = 3600 ) {
		$group = 'hcc_cache';
		return wp_cache_set( $key, $data, $group, (int) $ttl );
	}

	public static function delete( $key ) {
		$group = 'hcc_cache';
		return wp_cache_delete( $key, $group );
	}

	public static function purge_product_cache( $product_id ) {
		$id = is_object( $product_id ) && method_exists( $product_id, 'get_id' ) ? $product_id->get_id() : (int) $product_id;
		self::delete( 'product_' . $id );
		self::delete( 'products_list_all' );
		self::notify_nextjs_revalidate( array( 'wp-products', 'wp-categories' ), $id );
	}

	public static function purge_catalog_cache() {
		self::delete( 'categories_list' );
		delete_transient( 'hcc_public_mega_menu' );
		self::notify_nextjs_revalidate( array( 'wp-categories', 'wp-products', 'mega-menu' ), 0 );
	}

	public static function purge_attribute_cache() {
		self::delete( 'attributes_list' );
		self::notify_nextjs_revalidate( array( 'wp-attributes', 'wp-products' ), 0 );
	}

	public static function purge_all_cache() {
		self::delete( 'products_list_all' );
		self::delete( 'categories_list' );
		self::delete( 'attributes_list' );
		delete_transient( 'hcc_public_mega_menu' );
		self::notify_nextjs_revalidate( array( 'wp-products', 'wp-categories', 'wp-attributes', 'wp-homepage', 'wp-config', 'mega-menu' ), 0 );
	}

	/**
	 * Instant Webhook Ping to Next.js Storefront Cache Revalidation Route
	 */
	private static function notify_nextjs_revalidate( $tags, $id ) {
		$frontend_url      = get_option( 'hcc_frontend_url', '' );
		$revalidate_secret = get_option( 'hcc_revalidate_secret', 'orbit_headless_revalidate_2026' );

		$host = isset( $_SERVER['HTTP_HOST'] ) ? sanitize_text_field( $_SERVER['HTTP_HOST'] ) : '';
		$is_local_wp = ( strpos( $host, '.local' ) !== false || strpos( $host, 'localhost' ) !== false || strpos( $host, '127.0.0.1' ) !== false );

		if ( empty( $frontend_url ) ) {
			$frontend_url = $is_local_wp ? 'http://localhost:3000' : 'https://orbitexpocrafts.com';
		}

		$targets = array( rtrim( $frontend_url, '/' ) );
		if ( $is_local_wp && ! in_array( 'http://localhost:3000', $targets ) ) {
			$targets[] = 'http://localhost:3000';
		}

		foreach ( $targets as $target_base ) {
			$revalidate_url = "{$target_base}/api/revalidate?secret={$revalidate_secret}";
			wp_remote_post( $revalidate_url, array(
				'blocking'  => false,
				'timeout'   => 2,
				'sslverify' => false,
				'headers'   => array(
					'Content-Type'        => 'application/json',
					'X-Revalidate-Secret' => $revalidate_secret,
				),
				'body'      => wp_json_encode( array(
					'tags' => (array) $tags,
					'id'   => (int) $id,
					'time' => time(),
				) ),
			) );
		}
	}
}
