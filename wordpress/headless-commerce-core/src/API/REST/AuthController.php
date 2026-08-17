<?php

namespace HeadlessCommerceCore\API\REST;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * REST Customer Authentication Controller
 */
class AuthController extends RestController {

	public function register_routes() {
		register_rest_route( $this->namespace, '/customers/login', array(
			'methods'             => \WP_REST_Server::CREATABLE,
			'callback'            => array( $this, 'login' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( $this->namespace, '/customers/register', array(
			'methods'             => \WP_REST_Server::CREATABLE,
			'callback'            => array( $this, 'register' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( $this->namespace, '/customers/logout', array(
			'methods'             => \WP_REST_Server::CREATABLE,
			'callback'            => array( $this, 'logout' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( $this->namespace, '/customers/me', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_current_customer' ),
			'permission_callback' => array( $this, 'check_authenticated' ),
		) );
	}

	public function login( $request ) {
		$username = sanitize_text_field( $request->get_param( 'username' ) );
		$password = $request->get_param( 'password' );

		if ( empty( $username ) || empty( $password ) ) {
			return $this->error_response( 'hcc_missing_credentials', 'Username and password are required.', 400 );
		}

		$user = wp_authenticate( $username, $password );

		if ( is_wp_error( $user ) ) {
			return $this->error_response( 'hcc_invalid_login', 'Invalid username or password.', 401 );
		}

		wp_set_current_user( $user->ID );
		wp_set_auth_cookie( $user->ID, true );

		$first_name = '';
		$last_name  = '';

		if ( class_exists( 'WC_Customer' ) ) {
			$customer   = new \WC_Customer( $user->ID );
			$first_name = $customer->get_first_name();
			$last_name  = $customer->get_last_name();
		}

		return $this->success_response( array(
			'id'        => $user->ID,
			'username'  => $user->user_login,
			'email'     => $user->user_email,
			'firstName' => $first_name,
			'lastName'  => $last_name,
		) );
	}

	public function register( $request ) {
		if ( ! function_exists( 'wc_create_new_customer' ) ) {
			return $this->error_response( 'hcc_wc_unavailable', 'WooCommerce is not active.', 500 );
		}

		$email      = sanitize_email( $request->get_param( 'email' ) );
		$password   = $request->get_param( 'password' );
		$first_name = sanitize_text_field( $request->get_param( 'firstName' ) ?? '' );
		$last_name  = sanitize_text_field( $request->get_param( 'lastName' ) ?? '' );

		if ( empty( $email ) || empty( $password ) ) {
			return $this->error_response( 'hcc_missing_data', 'Email and password are required.', 400 );
		}

		if ( email_exists( $email ) ) {
			return $this->error_response( 'hcc_email_exists', 'An account with this email already exists.', 400 );
		}

		$customer_id = wc_create_new_customer( $email, $email, $password );

		if ( is_wp_error( $customer_id ) ) {
			return $this->error_response( 'hcc_registration_failed', $customer_id->get_error_message(), 400 );
		}

		if ( class_exists( 'WC_Customer' ) ) {
			$customer = new \WC_Customer( $customer_id );
			if ( ! empty( $first_name ) ) {
				$customer->set_first_name( $first_name );
			}
			if ( ! empty( $last_name ) ) {
				$customer->set_last_name( $last_name );
			}
			$customer->save();
		}

		wp_set_current_user( $customer_id );
		wp_set_auth_cookie( $customer_id, true );

		return $this->success_response( array(
			'id'        => $customer_id,
			'email'     => $email,
			'firstName' => $first_name,
			'lastName'  => $last_name,
		), 201 );
	}

	public function logout( $request ) {
		wp_clear_auth_cookie();
		return $this->success_response( array( 'message' => 'Successfully logged out.' ) );
	}

	public function get_current_customer( $request ) {
		$user_id = get_current_user_id();
		$user    = get_userdata( $user_id );

		if ( ! $user ) {
			return $this->error_response( 'hcc_not_found', 'User not found.', 404 );
		}

		$first_name = '';
		$last_name  = '';
		$billing    = array();
		$shipping   = array();
		$orders     = array();

		if ( class_exists( 'WC_Customer' ) ) {
			$customer   = new \WC_Customer( $user_id );
			$first_name = $customer->get_first_name();
			$last_name  = $customer->get_last_name();
			$billing    = $customer->get_billing();
			$shipping   = $customer->get_shipping();
		}

		if ( function_exists( 'wc_get_orders' ) ) {
			$orders_query = wc_get_orders( array(
				'customer_id' => $user_id,
				'limit'       => 10,
			) );

			if ( is_array( $orders_query ) ) {
				foreach ( $orders_query as $ord ) {
					$orders[] = array(
						'id'       => $ord->get_id(),
						'status'   => $ord->get_status(),
						'total'    => (float) $ord->get_total(),
						'currency' => $ord->get_currency(),
						'date'     => $ord->get_date_created() ? $ord->get_date_created()->date( 'Y-m-d H:i:s' ) : '',
					);
				}
			}
		}

		return $this->success_response( array(
			'id'        => $user_id,
			'username'  => $user->user_login,
			'email'     => $user->user_email,
			'firstName' => $first_name,
			'lastName'  => $last_name,
			'billing'   => $billing,
			'shipping'  => $shipping,
			'orders'    => $orders,
		) );
	}

	public function check_authenticated() {
		return is_user_logged_in();
	}
}
