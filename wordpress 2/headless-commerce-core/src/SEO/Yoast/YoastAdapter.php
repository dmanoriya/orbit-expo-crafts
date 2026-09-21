<?php

namespace HeadlessCommerceCore\SEO\Yoast;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Yoast SEO Adapter
 */
class YoastAdapter {

	public static function is_active() {
		return defined( 'WPSEO_VERSION' );
	}

	public static function get_seo_data( $post_id ) {
		$post_id = (int) $post_id;
		if ( $post_id <= 0 || ! get_post( $post_id ) ) {
			return array(
				'provider'    => 'yoast',
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

		$title       = get_post_meta( $post_id, '_yoast_wpseo_title', true );
		$description = get_post_meta( $post_id, '_yoast_wpseo_metadesc', true );
		$canonical   = get_post_meta( $post_id, '_yoast_wpseo_canonical', true );
		$og_title    = get_post_meta( $post_id, '_yoast_wpseo_opengraph-title', true );
		$og_desc     = get_post_meta( $post_id, '_yoast_wpseo_opengraph-description', true );
		$og_image    = get_post_meta( $post_id, '_yoast_wpseo_opengraph-image', true );

		if ( empty( $title ) ) {
			$title = get_the_title( $post_id );
		}
		if ( empty( $canonical ) ) {
			$canonical = get_permalink( $post_id );
		}

		return array(
			'provider'    => 'yoast',
			'title'       => wp_strip_all_tags( (string) $title ),
			'description' => wp_strip_all_tags( (string) $description ),
			'canonical'   => esc_url( (string) $canonical ),
			'robots'      => 'index, follow',
			'openGraph'   => array(
				'title'       => wp_strip_all_tags( (string) ( ! empty( $og_title ) ? $og_title : $title ) ),
				'description' => wp_strip_all_tags( (string) ( ! empty( $og_desc ) ? $og_desc : $description ) ),
				'image'       => esc_url( (string) $og_image ),
			),
		);
	}
}
