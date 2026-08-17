<?php

namespace HeadlessCommerceCore\Cache;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * High-Performance Multi-Layer Cache Manager
 */
class CacheManager {

	public static function init() {
		// Invalidation Hooks
		add_action( 'woocommerce_update_product', array( __CLASS__, 'purge_product_cache' ), 10, 1 );
		add_action( 'woocommerce_product_set_stock', array( __CLASS__, 'purge_product_cache' ), 10, 1 );
		add_action( 'edited_product_cat', array( __CLASS__, 'purge_catalog_cache' ) );
		add_action( 'create_product_cat', array( __CLASS__, 'purge_catalog_cache' ) );
		add_action( 'delete_product_cat', array( __CLASS__, 'purge_catalog_cache' ) );
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
		self::notify_nextjs_revalidate( 'product', $id );
	}

	public static function purge_catalog_cache() {
		self::delete( 'categories_list' );
		self::notify_nextjs_revalidate( 'catalog', 0 );
	}

	/**
	 * Send cache invalidation webhook to Next.js storefront if configured
	 */
	private static function notify_nextjs_revalidate( $type, $id ) {
		$revalidate_url    = get_option( 'hcc_revalidate_url' );
		$revalidate_secret = get_option( 'hcc_revalidate_secret' );

		if ( ! empty( $revalidate_url ) && ! empty( $revalidate_secret ) ) {
			wp_remote_post( $revalidate_url, array(
				'blocking' => false,
				'headers'  => array(
					'Content-Type' => 'application/json',
					'X-HCC-Secret' => $revalidate_secret,
				),
				'body'     => wp_json_encode( array(
					'type' => (string) $type,
					'id'   => (int) $id,
					'time' => time(),
				) ),
			) );
		}
	}
}
