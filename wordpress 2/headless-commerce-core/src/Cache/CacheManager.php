<?php

namespace HeadlessCommerceCore\Cache;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * High-Performance Multi-Layer Cache Manager
 */
class CacheManager {

	public static function init(): void {
		// Invalidation Hooks
		add_action( 'woocommerce_update_product', array( __CLASS__, 'purge_product_cache' ), 10, 1 );
		add_action( 'woocommerce_product_set_stock', array( __CLASS__, 'purge_product_cache' ), 10, 1 );
		add_action( 'edited_product_cat', array( __CLASS__, 'purge_catalog_cache' ) );
		add_action( 'create_product_cat', array( __CLASS__, 'purge_catalog_cache' ) );
		add_action( 'delete_product_cat', array( __CLASS__, 'purge_catalog_cache' ) );
	}

	public static function get( string $key ) {
		$group = 'hcc_cache';
		return wp_cache_get( $key, $group );
	}

	public static function set( string $key, $data, int $ttl = 3600 ): bool {
		$group = 'hcc_cache';
		return wp_cache_set( $key, $data, $group, $ttl );
	}

	public static function delete( string $key ): bool {
		$group = 'hcc_cache';
		return wp_cache_delete( $key, $group );
	}

	public static function purge_product_cache( $product_id ): void {
		self::delete( 'product_' . $product_id );
		self::delete( 'products_list_all' );
		self::notify_nextjs_revalidate( 'product', $product_id );
	}

	public static function purge_catalog_cache(): void {
		self::delete( 'categories_list' );
		self::notify_nextjs_revalidate( 'catalog', 0 );
	}

	/**
	 * Send cache invalidation webhook to Next.js storefront if configured
	 */
	private static function notify_nextjs_revalidate( string $type, int $id ): void {
		$revalidate_url = get_option( 'hcc_revalidate_url' );
		$revalidate_secret = get_option( 'hcc_revalidate_secret' );

		if ( ! empty( $revalidate_url ) && ! empty( $revalidate_secret ) ) {
			wp_remote_post( $revalidate_url, array(
				'blocking' => false,
				'headers'  => array(
					'Content-Type' => 'application/json',
					'X-HCC-Secret' => $revalidate_secret,
				),
				'body'     => wp_json_encode( array(
					'type' => $type,
					'id'   => $id,
					'time' => time(),
				) ),
			) );
		}
	}
}
