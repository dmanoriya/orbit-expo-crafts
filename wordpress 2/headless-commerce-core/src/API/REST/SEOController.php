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

	public function register_routes(): void {
		register_rest_route( $this->namespace, '/seo', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_seo' ),
			'permission_callback' => '__return_true',
		) );
	}

	public function get_seo( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id   = (int) $request->get_param( 'id' );
		$type = sanitize_text_field( $request->get_param( 'type' ) ?? 'post' );

		if ( ! $id ) {
			return $this->error_response( 'hcc_missing_id', 'Object ID is required.', 400 );
		}

		$seo = SEOService::get_seo( $id, $type );
		return $this->success_response( $seo );
	}
}
