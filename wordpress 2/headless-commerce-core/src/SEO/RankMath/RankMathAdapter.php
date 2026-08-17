<?php

namespace HeadlessCommerceCore\SEO\RankMath;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Rank Math SEO Adapter
 */
class RankMathAdapter {

	public static function is_active(): bool {
		return class_exists( 'RankMath' );
	}

	public static function get_seo_data( int $post_id ): array {
		if ( $post_id <= 0 || ! get_post( $post_id ) ) {
			return array(
				'provider'    => 'rankmath',
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

		$title       = get_post_meta( $post_id, 'rank_math_title', true );
		$description = get_post_meta( $post_id, 'rank_math_description', true );
		$canonical   = get_post_meta( $post_id, 'rank_math_canonical_url', true );
		$robots      = get_post_meta( $post_id, 'rank_math_robots', true );
		$og_title    = get_post_meta( $post_id, 'rank_math_facebook_title', true );
		$og_desc     = get_post_meta( $post_id, 'rank_math_facebook_description', true );
		$og_image    = get_post_meta( $post_id, 'rank_math_facebook_image', true );

		if ( empty( $title ) ) {
			$title = get_the_title( $post_id );
		}
		if ( empty( $canonical ) ) {
			$canonical = get_permalink( $post_id );
		}

		return array(
			'provider'    => 'rankmath',
			'title'       => wp_strip_all_tags( $title ),
			'description' => wp_strip_all_tags( $description ),
			'canonical'   => esc_url( $canonical ),
			'robots'      => is_array( $robots ) ? implode( ', ', $robots ) : (string) $robots,
			'openGraph'   => array(
				'title'       => wp_strip_all_tags( ! empty( $og_title ) ? $og_title : $title ),
				'description' => wp_strip_all_tags( ! empty( $og_desc ) ? $og_desc : $description ),
				'image'       => esc_url( $og_image ),
			),
		);
	}
}
