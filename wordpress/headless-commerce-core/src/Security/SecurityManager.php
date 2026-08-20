<?php

namespace HeadlessCommerceCore\Security;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Security, CORS & Rate Limiting Manager
 */
class SecurityManager {

	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'handle_cors' ) );
		add_filter( 'rest_pre_dispatch', array( __CLASS__, 'check_rate_limit' ), 10, 3 );
	}

	/**
	 * Handle CORS headers for Next.js frontend communication (REST/GraphQL API calls only)
	 */
	public static function handle_cors() {
		$origin = isset( $_SERVER['HTTP_ORIGIN'] ) ? $_SERVER['HTTP_ORIGIN'] : '';
		$frontend_url = get_option( 'hcc_frontend_url', '' );
		$allowed_origin = '*';

		if ( ! empty( $origin ) ) {
			$allowed_origin = $origin;
		} elseif ( ! empty( $frontend_url ) ) {
			$allowed_origin = rtrim( $frontend_url, '/' );
		}

		header( "Access-Control-Allow-Origin: {$allowed_origin}" );
		header( 'Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS' );
		header( 'Access-Control-Allow-Credentials: true' );
		header( 'Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce, X-HCC-Session' );

		if ( isset( $_SERVER['REQUEST_METHOD'] ) && 'OPTIONS' === $_SERVER['REQUEST_METHOD'] ) {
			status_header( 200 );
			exit;
		}
	}

	/**
	 * Rate limiting for REST API endpoints (e.g. max 120 requests per minute per IP)
	 */
	public static function check_rate_limit( $result, $server, $request ) {
		if ( ! is_object( $request ) || ! method_exists( $request, 'get_route' ) ) {
			return $result;
		}

		$route = $request->get_route();
		if ( strpos( $route, '/hcc/v1' ) === false ) {
			return $result;
		}

		$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? $_SERVER['REMOTE_ADDR'] : '127.0.0.1';
		$transient_key = 'hcc_rate_' . md5( $ip );
		$current_hits  = (int) get_transient( $transient_key );

		// Rate limit POST/PUT/DELETE actions; allow GET queries up to 1200/min
		$method = isset( $_SERVER['REQUEST_METHOD'] ) ? $_SERVER['REQUEST_METHOD'] : 'GET';
		$limit  = ( 'GET' === $method ) ? 1200 : 300;

		if ( $current_hits >= $limit ) {
			return new \WP_Error(
				'hcc_rate_limit_exceeded',
				__( 'Rate limit exceeded. Please try again later.', 'headless-commerce-core' ),
				array( 'status' => 429 )
			);
		}

		set_transient( $transient_key, $current_hits + 1, MINUTE_IN_SECONDS );
		return $result;
	}

	/**
	 * Sanitize input data
	 */
	public static function sanitize_input( $data ) {
		if ( is_array( $data ) ) {
			return array_map( array( __CLASS__, 'sanitize_input' ), $data );
		}
		return sanitize_text_field( $data );
	}
}
