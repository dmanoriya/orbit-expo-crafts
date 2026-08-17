<?php

namespace HeadlessCommerceCore\SEO;

use HeadlessCommerceCore\SEO\RankMath\RankMathAdapter;
use HeadlessCommerceCore\SEO\Yoast\YoastAdapter;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Unified SEO Service
 */
class SEOService {

	public static function init(): void {
		// Initialization if required
	}

	/**
	 * Get normalized SEO metadata for any post/product/category ID
	 */
	public static function get_seo( int $object_id, string $type = 'post' ): array {
		if ( RankMathAdapter::is_active() && 'post' === $type ) {
			return RankMathAdapter::get_seo_data( $object_id );
		}

		if ( YoastAdapter::is_active() && 'post' === $type ) {
			return YoastAdapter::get_seo_data( $object_id );
		}

		// Fallback to Native WooCommerce / WordPress Metadata
		$post = get_post( $object_id );
		if ( ! $post ) {
			return array(
				'provider'    => 'native',
				'title'       => get_bloginfo( 'name' ),
				'description' => get_bloginfo( 'description' ),
				'canonical'   => home_url(),
				'robots'      => 'index, follow',
				'openGraph'   => array(
					'title'       => get_bloginfo( 'name' ),
					'description' => get_bloginfo( 'description' ),
					'image'       => '',
				),
			);
		}

		$title       = wp_strip_all_tags( get_the_title( $post ) . ' - ' . get_bloginfo( 'name' ) );
		$description = wp_strip_all_tags( get_the_excerpt( $post ) );
		$canonical   = get_permalink( $post );
		$image_id    = get_post_thumbnail_id( $post );
		$image_url   = $image_id ? wp_get_attachment_image_url( $image_id, 'full' ) : '';

		return array(
			'provider'    => 'native',
			'title'       => $title,
			'description' => $description,
			'canonical'   => esc_url( $canonical ),
			'robots'      => 'index, follow',
			'openGraph'   => array(
				'title'       => $title,
				'description' => $description,
				'image'       => esc_url( $image_url ),
			),
		);
	}
}
