<?php

namespace HeadlessCommerceCore\API\REST;

use HeadlessCommerceCore\Core\StoreMode;
use HeadlessCommerceCore\Admin\HomepageManager;
use HeadlessCommerceCore\Admin\TypographyManager;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * REST Store Config & Homepage Controller
 */
class ConfigController extends RestController {

	public function register_routes() {
		register_rest_route( $this->namespace, '/config', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_config' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( $this->namespace, '/homepage', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_homepage' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( $this->namespace, '/footer', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_footer' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( $this->namespace, '/business-pages', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_business_pages' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( $this->namespace, '/business-pages/(?P<slug>[a-zA-Z0-9_-]+)', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_single_business_page' ),
			'permission_callback' => '__return_true',
		) );
	}

	public function get_config( $request ) {
		$typo = TypographyManager::get_typography_data();

		return $this->success_response( array(
			'name'              => get_bloginfo( 'name' ),
			'description'       => get_bloginfo( 'description' ),
			'storeMode'         => StoreMode::get_current_mode(),
			'purchasingEnabled' => StoreMode::is_purchasing_enabled(),
			'isHeadless'        => StoreMode::is_headless(),
			'currency'          => function_exists( 'get_woocommerce_currency' ) ? get_woocommerce_currency() : 'INR',
			'currencySymbol'    => function_exists( 'get_woocommerce_currency_symbol' ) ? html_entity_decode( get_woocommerce_currency_symbol(), ENT_QUOTES, 'UTF-8' ) : '₹',
			'version'           => HCC_VERSION,
			'fonts'             => array(
				'fontHeading' => $typo['font_heading'],
				'fontBody'    => $typo['font_body'],
				'fontMenu'    => $typo['font_menu'],
				'fontButton'  => $typo['font_button'],
				'fontMono'    => $typo['font_mono'],
			),
			'footer'            => \HeadlessCommerceCore\Admin\FooterManager::get_footer_data(),
		) );
	}

	public function get_homepage( $request ) {
		$hp = HomepageManager::get_homepage_data();
		return $this->success_response( $hp );
	}

	public function get_footer( $request ) {
		$ft = \HeadlessCommerceCore\Admin\FooterManager::get_footer_data();
		return $this->success_response( $ft );
	}

	public function get_business_pages( $request ) {
		$pages = \HeadlessCommerceCore\Admin\BusinessPagesManager::get_all_pages_data();
		return $this->success_response( $pages );
	}

	public function get_single_business_page( $request ) {
		$slug = sanitize_title( $request->get_param( 'slug' ) );
		$page = \HeadlessCommerceCore\Admin\BusinessPagesManager::get_page_data_by_slug( $slug );

		if ( ! $page ) {
			return $this->error_response( 'page_not_found', 'Business page not found.', 404 );
		}

		// If a WordPress page with this slug exists, merge any existing RankMath meta
		$wp_page = get_page_by_path( $slug );
		if ( $wp_page && class_exists( '\\HeadlessCommerceCore\\SEO\\SEOService' ) ) {
			$rank_math_seo = \HeadlessCommerceCore\SEO\SEOService::get_seo( $wp_page->ID, 'post' );
			if ( ! empty( $rank_math_seo ) && is_array( $rank_math_seo ) ) {
				if ( ! empty( $rank_math_seo['title'] ) && empty( $page['seo']['title'] ) ) {
					$page['seo']['title'] = $rank_math_seo['title'];
				}
				if ( ! empty( $rank_math_seo['description'] ) && empty( $page['seo']['description'] ) ) {
					$page['seo']['description'] = $rank_math_seo['description'];
				}
				if ( ! empty( $rank_math_seo['canonical'] ) ) {
					$page['seo']['canonical_url'] = $rank_math_seo['canonical'];
				}
				if ( ! empty( $rank_math_seo['openGraph']['image'] ) && empty( $page['seo']['og_image'] ) ) {
					$page['seo']['og_image'] = $rank_math_seo['openGraph']['image'];
				}
			}
		}

		return $this->success_response( $page );
	}
}
