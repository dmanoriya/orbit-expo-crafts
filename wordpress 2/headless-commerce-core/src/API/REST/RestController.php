<?php

namespace HeadlessCommerceCore\API\REST;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Base REST Controller
 */
abstract class RestController extends \WP_REST_Controller {

	protected $namespace = HCC_REST_NAMESPACE;

	/**
	 * Prepare standard JSON response
	 */
	protected function success_response( $data, $status = 200 ) {
		return new \WP_REST_Response( array(
			'success' => true,
			'data'    => $data,
		), $status );
	}

	/**
	 * Prepare standard error JSON response
	 */
	protected function error_response( $code, $message, $status = 400 ) {
		return new \WP_Error( $code, $message, array( 'status' => $status ) );
	}
}
