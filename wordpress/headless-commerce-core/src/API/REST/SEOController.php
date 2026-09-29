<?php

namespace HeadlessCommerceCore\API\REST;

use HeadlessCommerceCore\SEO\SEOService;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * REST SEO Controller
 */
class SEOController extends RestController {

	public function register_routes() {
		register_rest_route( $this->namespace, '/seo', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_seo' ),
			'permission_callback' => '__return_true',
		) );
	}

	public function get_seo( $request ) {
		$id   = (int) $request->get_param( 'id' );
		$slug = sanitize_text_field( $request->get_param( 'slug' ) ?? $request->get_param( 'path' ) ?? '' );
		$type = sanitize_text_field( $request->get_param( 'type' ) ?? 'auto' );

		if ( $id > 0 ) {
			$seo = SEOService::get_seo( $id, $type );
			return $this->success_response( $seo );
		}

		if ( ! empty( $slug ) || $request->has_param( 'slug' ) || $request->has_param( 'path' ) ) {
			$seo = SEOService::get_seo_by_slug( $slug, $type );
			return $this->success_response( $seo );
		}

		// If no param passed, default to homepage SEO
		$seo = SEOService::get_seo_by_slug( 'home', 'page' );
		return $this->success_response( $seo );
	}
}
