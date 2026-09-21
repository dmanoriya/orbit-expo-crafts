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

	public static function init() {
		// Initialization if required
	}

	/**
	 * Get normalized SEO metadata for any post/product/category ID
	 */
	public static function get_seo( $object_id, $type = 'post' ) {
		$object_id = (int) $object_id;

		if ( RankMathAdapter::is_active() ) {
			if ( 'term' === $type || 'category' === $type ) {
				return RankMathAdapter::get_term_seo_data( $object_id, 'product_cat' );
			}
			return RankMathAdapter::get_seo_data( $object_id );
		}

		if ( YoastAdapter::is_active() && 'post' === $type ) {
			return YoastAdapter::get_seo_data( $object_id );
		}

		$frontend_url = rtrim( get_option( 'hcc_frontend_url', 'https://orbitexpocrafts.com' ), '/' );

		// Fallback for Terms / Categories
		if ( 'term' === $type || 'category' === $type ) {
			$term = get_term( $object_id, 'product_cat' );
			if ( $term && ! is_wp_error( $term ) ) {
				$title       = wp_strip_all_tags( $term->name . ' Collections | ' . get_bloginfo( 'name' ) );
				$description = wp_strip_all_tags( $term->description ?: "Explore our curated collection of handcrafted {$term->name}." );
				$canonical   = "{$frontend_url}/collections/{$term->slug}";
				$thumb_id    = get_term_meta( $term->term_id, 'thumbnail_id', true );
				$image_url   = $thumb_id ? wp_get_attachment_image_url( $thumb_id, 'full' ) : '';

				return array(
					'provider'    => 'native',
					'title'       => $title,
					'description' => $description,
					'canonical'   => esc_url( (string) $canonical ),
					'robots'      => 'index, follow',
					'keywords'    => '',
					'openGraph'   => array(
						'title'       => $title,
						'description' => $description,
						'image'       => esc_url( (string) $image_url ),
					),
					'twitter'     => array(
						'card'        => 'summary_large_image',
						'title'       => $title,
						'description' => $description,
						'image'       => esc_url( (string) $image_url ),
					),
				);
			}
		}

		// Fallback for Posts / Products
		$post = get_post( $object_id );
		if ( ! $post ) {
			return array(
				'provider'    => 'native',
				'title'       => get_bloginfo( 'name' ),
				'description' => get_bloginfo( 'description' ),
				'canonical'   => $frontend_url,
				'robots'      => 'index, follow',
				'keywords'    => '',
				'openGraph'   => array(
					'title'       => get_bloginfo( 'name' ),
					'description' => get_bloginfo( 'description' ),
					'image'       => '',
				),
				'twitter'     => array(
					'card'        => 'summary_large_image',
					'title'       => get_bloginfo( 'name' ),
					'description' => get_bloginfo( 'description' ),
					'image'       => '',
				),
			);
		}

		$title       = wp_strip_all_tags( get_the_title( $post ) . ' | ' . get_bloginfo( 'name' ) );
		$description = wp_strip_all_tags( get_the_excerpt( $post ) ?: $post->post_content );
		$canonical   = "{$frontend_url}/product/{$post->post_name}";
		$image_id    = get_post_thumbnail_id( $post );
		$image_url   = $image_id ? wp_get_attachment_image_url( $image_id, 'full' ) : '';

		return array(
			'provider'    => 'native',
			'title'       => $title,
			'description' => $description,
			'canonical'   => esc_url( (string) $canonical ),
			'robots'      => 'index, follow',
			'keywords'    => '',
			'openGraph'   => array(
				'title'       => $title,
				'description' => $description,
				'image'       => esc_url( (string) $image_url ),
			),
			'twitter'     => array(
				'card'        => 'summary_large_image',
				'title'       => $title,
				'description' => $description,
				'image'       => esc_url( (string) $image_url ),
			),
		);
	}
}
