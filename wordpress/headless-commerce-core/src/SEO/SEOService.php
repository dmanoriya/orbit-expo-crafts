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
		if ( $post->post_type === 'page' ) {
			$is_front = ( $post->ID === (int) get_option( 'page_on_front' ) || $post->post_name === 'home' );
			$canonical = $is_front ? "{$frontend_url}" : "{$frontend_url}/{$post->post_name}";
		} elseif ( $post->post_type === 'post' ) {
			$canonical = "{$frontend_url}/journal/{$post->post_name}";
		} else {
			$canonical = "{$frontend_url}/product/{$post->post_name}";
		}
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

	/**
	 * Get normalized SEO metadata by slug or path
	 */
	public static function get_seo_by_slug( $slug, $type = 'auto' ) {
		$slug = trim( (string) $slug, '/' );

		// Homepage request
		if ( empty( $slug ) || 'home' === $slug || 'frontpage' === $slug ) {
			if ( RankMathAdapter::is_active() ) {
				return RankMathAdapter::get_homepage_seo_data();
			}
			$frontend_url = rtrim( get_option( 'hcc_frontend_url', 'https://orbitexpocrafts.com' ), '/' );
			return array(
				'provider'    => 'native',
				'title'       => get_bloginfo( 'name' ) . ' | ' . get_bloginfo( 'description' ),
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

		// Term explicit
		if ( 'term' === $type || 'category' === $type || 'product_cat' === $type ) {
			$term = get_term_by( 'slug', $slug, 'product_cat' );
			if ( ! $term ) {
				$term = get_term_by( 'slug', $slug, 'category' );
			}
			if ( $term && ! is_wp_error( $term ) ) {
				return self::get_seo( $term->term_id, 'term' );
			}
		}

		// Try page, post, or product lookup
		$post = get_page_by_path( $slug, OBJECT, array( 'page', 'post', 'product' ) );
		if ( ! $post ) {
			$posts = get_posts( array(
				'name'        => $slug,
				'post_type'   => array( 'page', 'post', 'product' ),
				'post_status' => 'publish',
				'numberposts' => 1,
			) );
			if ( ! empty( $posts ) ) {
				$post = $posts[0];
			}
		}

		if ( $post ) {
			return self::get_seo( $post->ID, $post->post_type );
		}

		// Fallback check if a taxonomy term matches this slug
		$term = get_term_by( 'slug', $slug, 'product_cat' );
		if ( ! $term ) {
			$term = get_term_by( 'slug', $slug, 'category' );
		}
		if ( $term && ! is_wp_error( $term ) ) {
			return self::get_seo( $term->term_id, 'term' );
		}

		// Universal fallback
		$frontend_url = rtrim( get_option( 'hcc_frontend_url', 'https://orbitexpocrafts.com' ), '/' );
		$clean_name = ucwords( str_replace( array( '-', '_' ), ' ', $slug ) );
		$site_name  = get_bloginfo( 'name' ) ?: 'Orbit Expo Crafts';

		return array(
			'provider'    => 'fallback',
			'title'       => "{$clean_name} | {$site_name}",
			'description' => "Explore {$clean_name} at {$site_name}. Bespoke contract furniture and architectural joinery.",
			'canonical'   => "{$frontend_url}/{$slug}",
			'robots'      => 'index, follow',
			'keywords'    => '',
			'openGraph'   => array(
				'title'       => "{$clean_name} | {$site_name}",
				'description' => "Explore {$clean_name} at {$site_name}.",
				'image'       => '',
			),
			'twitter'     => array(
				'card'        => 'summary_large_image',
				'title'       => "{$clean_name} | {$site_name}",
				'description' => "Explore {$clean_name} at {$site_name}.",
				'image'       => '',
			),
		);
	}

	/**
	 * Unified router helper
	 */
	public static function get_seo_by_request( $id = 0, $slug = '', $type = 'auto' ) {
		if ( $id > 0 ) {
			return self::get_seo( $id, $type );
		}
		return self::get_seo_by_slug( $slug, $type );
	}
}
