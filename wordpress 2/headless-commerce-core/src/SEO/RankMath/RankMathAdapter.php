<?php

namespace HeadlessCommerceCore\SEO\RankMath;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Advanced Rank Math SEO Adapter for Headless WooCommerce
 */
class RankMathAdapter {

	public static function is_active() {
		return class_exists( 'RankMath' );
	}

	/**
	 * Get normalized SEO metadata for a single product/post
	 */
	public static function get_seo_data( $post_id ) {
		$post_id = (int) $post_id;
		$post    = get_post( $post_id );

		if ( $post_id <= 0 || ! $post ) {
			return self::get_fallback_data();
		}

		$frontend_url = rtrim( get_option( 'hcc_frontend_url', 'https://orbitexpocrafts.com' ), '/' );
		$wp_home      = rtrim( home_url(), '/' );

		$product_name = '';
		if ( function_exists( 'wc_get_product' ) ) {
			$wc_prod = wc_get_product( $post_id );
			if ( $wc_prod ) {
				$product_name = $wc_prod->get_name();
			}
		}
		if ( empty( $product_name ) && $post ) {
			$product_name = $post->post_title;
		}
		if ( empty( $product_name ) ) {
			$product_name = get_the_title( $post_id );
		}

		// 1. Title Resolution with Variable Replacement
		$title = get_post_meta( $post_id, 'rank_math_title', true );
		if ( empty( $title ) && class_exists( '\RankMath\Helper' ) ) {
			$title = \RankMath\Helper::get_settings( "titles.pt_{$post->post_type}_title" );
		}
		if ( empty( $title ) ) {
			$title = '%title% | %sitename%';
		}
		if ( class_exists( '\RankMath\Helper' ) && method_exists( '\RankMath\Helper', 'replace_vars' ) ) {
			$title = \RankMath\Helper::replace_vars( $title, $post );
		}

		$site_name = get_bloginfo( 'name' ) ?: 'Orbit Expo Crafts';
		$title     = trim( (string) $title );
		if ( empty( $title ) || false !== strpos( $title, '%title%' ) || $title === '| ' . $site_name || $title === '-' . $site_name || $title === '|' ) {
			$title = $product_name . ' | ' . $site_name;
		}

		// 2. Description Resolution with Variable Replacement
		$description = get_post_meta( $post_id, 'rank_math_description', true );
		if ( empty( $description ) && class_exists( '\RankMath\Helper' ) ) {
			$description = \RankMath\Helper::get_settings( "titles.pt_{$post->post_type}_description" );
		}
		if ( ! empty( $description ) && class_exists( '\RankMath\Helper' ) && method_exists( '\RankMath\Helper', 'replace_vars' ) ) {
			$description = \RankMath\Helper::replace_vars( $description, $post );
		}
		if ( empty( $description ) ) {
			$description = wp_strip_all_tags( get_the_excerpt( $post ) ?: $post->post_content );
			if ( empty( $description ) ) {
				$description = sprintf( 'Custom contract furniture %s engineered for luxury hospitality and commercial projects by Orbit Expo Crafts.', get_the_title( $post_id ) );
			}
		}

		// 3. Canonical URL
		$canonical = get_post_meta( $post_id, 'rank_math_canonical_url', true );
		if ( empty( $canonical ) ) {
			$prefix = ( $post->post_type === 'post' ) ? 'journal' : 'product';
			$canonical = "{$frontend_url}/{$prefix}/{$post->post_name}";
		} else {
			if ( 0 === strpos( $canonical, $wp_home ) ) {
				$canonical = str_replace( $wp_home, $frontend_url, $canonical );
			}
		}

		// 4. Robots Meta
		$robots = get_post_meta( $post_id, 'rank_math_robots', true );
		if ( empty( $robots ) ) {
			$robots = array( 'index', 'follow', 'max-snippet:-1', 'max-video-preview:-1', 'max-image-preview:large' );
		} elseif ( is_string( $robots ) ) {
			$robots = array_map( 'trim', explode( ',', $robots ) );
		}

		// 5. Focus Keyword
		$focus_keyword = (string) get_post_meta( $post_id, 'rank_math_focus_keyword', true );

		// 6. OpenGraph Facebook
		$og_title = get_post_meta( $post_id, 'rank_math_facebook_title', true );
		if ( ! empty( $og_title ) && class_exists( '\RankMath\Helper' ) && method_exists( '\RankMath\Helper', 'replace_vars' ) ) {
			$og_title = \RankMath\Helper::replace_vars( $og_title, $post );
		}
		$og_title = trim( (string) $og_title );
		if ( empty( $og_title ) || $og_title === '| ' . $site_name || $og_title === '-' . $site_name || $og_title === '|' ) {
			$og_title = $title;
		}

		$og_desc = get_post_meta( $post_id, 'rank_math_facebook_description', true );
		if ( ! empty( $og_desc ) && class_exists( '\RankMath\Helper' ) && method_exists( '\RankMath\Helper', 'replace_vars' ) ) {
			$og_desc = \RankMath\Helper::replace_vars( $og_desc, $post );
		}
		if ( empty( $og_desc ) ) {
			$og_desc = $description;
		}

		$thumb_id = get_post_thumbnail_id( $post_id );
		$og_image = get_post_meta( $post_id, 'rank_math_facebook_image', true );
		if ( empty( $og_image ) && $thumb_id ) {
			$og_image = wp_get_attachment_image_url( $thumb_id, 'full' );
		}

		// 7. Twitter Cards
		$twitter_title = get_post_meta( $post_id, 'rank_math_twitter_title', true );
		if ( ! empty( $twitter_title ) && class_exists( '\RankMath\Helper' ) && method_exists( '\RankMath\Helper', 'replace_vars' ) ) {
			$twitter_title = \RankMath\Helper::replace_vars( $twitter_title, $post );
		}
		$twitter_title = trim( (string) $twitter_title );
		if ( empty( $twitter_title ) || $twitter_title === '| ' . $site_name || $twitter_title === '-' . $site_name || $twitter_title === '|' ) {
			$twitter_title = $og_title;
		}

		$twitter_desc = get_post_meta( $post_id, 'rank_math_twitter_description', true );
		if ( ! empty( $twitter_desc ) && class_exists( '\RankMath\Helper' ) && method_exists( '\RankMath\Helper', 'replace_vars' ) ) {
			$twitter_desc = \RankMath\Helper::replace_vars( $twitter_desc, $post );
		}
		if ( empty( $twitter_desc ) ) {
			$twitter_desc = $og_desc;
		}

		$twitter_image = get_post_meta( $post_id, 'rank_math_twitter_image', true );
		if ( empty( $twitter_image ) ) {
			$twitter_image = $og_image;
		}
		$twitter_card = get_post_meta( $post_id, 'rank_math_twitter_card_type', true ) ?: 'summary_large_image';

		// 8. Schema.org Payload
		if ( $post->post_type === 'post' ) {
			$schema = array(
				'@context'    => 'https://schema.org',
				'@type'       => 'BlogPosting',
				'headline'    => wp_strip_all_tags( (string) $title ),
				'description' => wp_strip_all_tags( (string) $description ),
				'image'       => $og_image ? array( esc_url( (string) $og_image ) ) : array(),
				'datePublished' => get_the_date( 'c', $post_id ),
				'dateModified'  => get_the_modified_date( 'c', $post_id ),
				'author'      => array(
					'@type' => 'Organization',
					'name'  => 'Orbit Expo Crafts',
				),
				'publisher'   => array(
					'@type' => 'Organization',
					'name'  => 'Orbit Expo Crafts',
				),
				'mainEntityOfPage' => array(
					'@type' => 'WebPage',
					'@id'   => esc_url( (string) $canonical ),
				),
			);
		} else {
			$sku   = get_post_meta( $post_id, '_sku', true ) ?: (string) $post_id;
			$price = get_post_meta( $post_id, '_price', true ) ?: '0';

			$schema = array(
				'@context'    => 'https://schema.org',
				'@type'       => 'Product',
				'name'        => wp_strip_all_tags( (string) $title ),
				'description' => wp_strip_all_tags( (string) $description ),
				'image'       => $og_image ? array( esc_url( (string) $og_image ) ) : array(),
				'sku'         => $sku,
				'url'         => esc_url( (string) $canonical ),
				'brand'       => array(
					'@type' => 'Brand',
					'name'  => 'Orbit Expo Crafts',
				),
				'offers'      => array(
					'@type'         => 'Offer',
					'price'         => (float) $price,
					'priceCurrency' => 'INR',
					'availability'  => 'https://schema.org/InStock',
					'url'           => esc_url( (string) $canonical ),
				),
			);
		}

		return array(
			'provider'    => 'rankmath',
			'title'       => wp_strip_all_tags( (string) $title ),
			'description' => wp_strip_all_tags( (string) $description ),
			'canonical'   => esc_url( (string) $canonical ),
			'robots'      => is_array( $robots ) ? implode( ', ', $robots ) : (string) $robots,
			'keywords'    => $focus_keyword,
			'openGraph'   => array(
				'title'       => wp_strip_all_tags( (string) $og_title ),
				'description' => wp_strip_all_tags( (string) $og_desc ),
				'image'       => esc_url( (string) $og_image ),
			),
			'twitter'     => array(
				'card'        => $twitter_card,
				'title'       => wp_strip_all_tags( (string) $twitter_title ),
				'description' => wp_strip_all_tags( (string) $twitter_desc ),
				'image'       => esc_url( (string) $twitter_image ),
			),
			'schema'      => $schema,
		);
	}

	/**
	 * Get normalized SEO metadata for a Category / Taxonomy Term
	 */
	public static function get_term_seo_data( $term_id, $taxonomy = 'product_cat' ) {
		$term_id = (int) $term_id;
		$term    = get_term( $term_id, $taxonomy );

		if ( ! $term || is_wp_error( $term ) ) {
			return self::get_fallback_data();
		}

		$frontend_url = rtrim( get_option( 'hcc_frontend_url', 'https://orbitexpocrafts.com' ), '/' );
		$wp_home      = rtrim( home_url(), '/' );

		// 1. Title Resolution with Variable Replacement
		$title = get_term_meta( $term->term_id, 'rank_math_title', true );
		if ( empty( $title ) && class_exists( '\RankMath\Helper' ) ) {
			$title = \RankMath\Helper::get_settings( "titles.tax_{$taxonomy}_title" );
		}
		if ( empty( $title ) ) {
			$title = '%term% Collections | %sitename%';
		}
		if ( class_exists( '\RankMath\Helper' ) && method_exists( '\RankMath\Helper', 'replace_vars' ) ) {
			$title = \RankMath\Helper::replace_vars( $title, $term );
		}
		$site_name = get_bloginfo( 'name' ) ?: 'Orbit Expo Crafts';
		$title     = trim( (string) $title );
		if ( empty( $title ) || false !== strpos( $title, '%term%' ) || $title === '| ' . $site_name || $title === '-' . $site_name || $title === '|' ) {
			$title = $term->name . ' Collections | ' . $site_name;
		}

		// 2. Description Resolution with Variable Replacement
		$description = get_term_meta( $term->term_id, 'rank_math_description', true );
		if ( empty( $description ) && class_exists( '\RankMath\Helper' ) ) {
			$description = \RankMath\Helper::get_settings( "titles.tax_{$taxonomy}_description" );
		}
		if ( ! empty( $description ) && class_exists( '\RankMath\Helper' ) && method_exists( '\RankMath\Helper', 'replace_vars' ) ) {
			$description = \RankMath\Helper::replace_vars( $description, $term );
		}
		if ( empty( $description ) ) {
			$description = wp_strip_all_tags( $term->description );
			if ( empty( $description ) ) {
				$description = sprintf( 'Explore custom manufactured %s designed for luxury hotels, resorts, and commercial interior projects by Orbit Expo Crafts.', $term->name );
			}
		}

		// 3. Canonical URL
		$canonical = get_term_meta( $term->term_id, 'rank_math_canonical_url', true );
		if ( empty( $canonical ) ) {
			$canonical = "{$frontend_url}/collections/{$term->slug}";
		} else {
			if ( 0 === strpos( $canonical, $wp_home ) ) {
				$canonical = str_replace( $wp_home, $frontend_url, $canonical );
			}
		}

		// 4. Robots Meta
		$robots = get_term_meta( $term->term_id, 'rank_math_robots', true );
		if ( empty( $robots ) ) {
			$robots = array( 'index', 'follow' );
		} elseif ( is_string( $robots ) ) {
			$robots = array_map( 'trim', explode( ',', $robots ) );
		}

		// 5. Focus Keyword
		$focus_keyword = (string) get_term_meta( $term->term_id, 'rank_math_focus_keyword', true );

		// 6. OpenGraph Facebook
		$og_title = get_term_meta( $term->term_id, 'rank_math_facebook_title', true );
		if ( ! empty( $og_title ) && class_exists( '\RankMath\Helper' ) && method_exists( '\RankMath\Helper', 'replace_vars' ) ) {
			$og_title = \RankMath\Helper::replace_vars( $og_title, $term );
		}
		$og_title = trim( (string) $og_title );
		if ( empty( $og_title ) || $og_title === '| ' . $site_name || $og_title === '-' . $site_name || $og_title === '|' ) {
			$og_title = $title;
		}

		$og_desc = get_term_meta( $term->term_id, 'rank_math_facebook_description', true );
		if ( ! empty( $og_desc ) && class_exists( '\RankMath\Helper' ) && method_exists( '\RankMath\Helper', 'replace_vars' ) ) {
			$og_desc = \RankMath\Helper::replace_vars( $og_desc, $term );
		}
		if ( empty( $og_desc ) ) {
			$og_desc = $description;
		}

		$thumb_id = get_term_meta( $term->term_id, 'thumbnail_id', true );
		$og_image = get_term_meta( $term->term_id, 'rank_math_facebook_image', true );
		if ( empty( $og_image ) && $thumb_id ) {
			$og_image = wp_get_attachment_image_url( $thumb_id, 'full' );
		}

		return array(
			'provider'    => 'rankmath',
			'title'       => wp_strip_all_tags( (string) $title ),
			'description' => wp_strip_all_tags( (string) $description ),
			'canonical'   => esc_url( (string) $canonical ),
			'robots'      => is_array( $robots ) ? implode( ', ', $robots ) : (string) $robots,
			'keywords'    => $focus_keyword,
			'openGraph'   => array(
				'title'       => wp_strip_all_tags( (string) $og_title ),
				'description' => wp_strip_all_tags( (string) $og_desc ),
				'image'       => esc_url( (string) $og_image ),
			),
			'twitter'     => array(
				'card'        => 'summary_large_image',
				'title'       => wp_strip_all_tags( (string) $og_title ),
				'description' => wp_strip_all_tags( (string) $og_desc ),
				'image'       => esc_url( (string) $og_image ),
			),
		);
	}

	private static function get_fallback_data() {
		$frontend_url = rtrim( get_option( 'hcc_frontend_url', 'https://orbitexpocrafts.com' ), '/' );
		return array(
			'provider'    => 'rankmath',
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
}
