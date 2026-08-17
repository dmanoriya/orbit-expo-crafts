<?php

namespace HeadlessCommerceCore\API\REST;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Base REST Controller
 */
abstract class RestController extends \WP_REST_Controller {

	protected string $namespace = HCC_REST_NAMESPACE;

	/**
	 * Prepare standard JSON response
	 */
	protected function success_response( $data, int $status = 200 ): \WP_REST_Response {
		return new \WP_REST_Response( array(
			'success' => true,
			'data'    => $data,
		), $status );
	}

	/**
	 * Prepare standard error JSON response
	 */
	protected function error_response( string $code, string $message, int $status = 400 ): \WP_Error {
		return new \WP_Error( $code, $message, array( 'status' => $status ) );
	}
}
