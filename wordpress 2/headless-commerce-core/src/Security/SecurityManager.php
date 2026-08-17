<?php

namespace HeadlessCommerceCore\Security;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Security, CORS & Rate Limiting Manager
 */
class SecurityManager {

	public static function init(): void {
		add_action( 'rest_api_init', array( __CLASS__, 'handle_cors' ) );
		add_filter( 'rest_pre_dispatch', array( __CLASS__, 'check_rate_limit' ), 10, 3 );
	}

	/**
	 * Handle CORS headers for Next.js frontend communication
	 */
	public static function handle_cors(): void {
		$frontend_url = get_option( 'hcc_frontend_url', '*' );

		if ( isset( $_SERVER['HTTP_ORIGIN'] ) ) {
			$origin = esc_url_raw( $_SERVER['HTTP_ORIGIN'] );
			if ( '*' === $frontend_url || $origin === $frontend_url ) {
				header( 'Access-Control-Allow-Origin: ' . $origin );
			}
		} else if ( '*' === $frontend_url ) {
			header( 'Access-Control-Allow-Origin: *' );
		}

		header( 'Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS' );
		header( 'Access-Control-Allow-Credentials: true' );
		header( 'Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce, X-HCC-Session' );

		if ( 'OPTIONS' === $_SERVER['REQUEST_METHOD'] ) {
			status_header( 200 );
			exit;
		}
	}

	/**
	 * Rate limiting for REST API endpoints (e.g. max 120 requests per minute per IP)
	 */
	public static function check_rate_limit( $result, $server, $request ) {
		$route = $request->get_route();
		if ( strpos( $route, '/hcc/v1' ) === false ) {
			return $result;
		}

		$ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
		$transient_key = 'hcc_rate_' . md5( $ip );
		$current_hits = (int) get_transient( $transient_key );

		if ( $current_hits >= 120 ) {
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
