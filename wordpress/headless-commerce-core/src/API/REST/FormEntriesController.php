<?php

namespace HeadlessCommerceCore\API\REST;

use HeadlessCommerceCore\Admin\FormEntriesManager;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * REST Form Submissions Controller
 */
class FormEntriesController extends RestController {

	public function register_routes() {
		register_rest_route( $this->namespace, '/forms/submit', array(
			'methods'             => \WP_REST_Server::CREATABLE,
			'callback'            => array( $this, 'submit_form' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( $this->namespace, '/forms/entries', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_entries' ),
			'permission_callback' => '__return_true',
		) );
	}

	public function submit_form( $request ) {
		$params = $request->get_json_params();
		if ( empty( $params ) ) {
			$params = $request->get_body_params();
		}

		$form_type = ! empty( $params['form_type'] ) ? sanitize_text_field( $params['form_type'] ) : 'quote_enquiry';
		$full_name = ! empty( $params['full_name'] ) ? sanitize_text_field( $params['full_name'] ) : '';
		$email     = ! empty( $params['email'] ) ? sanitize_email( $params['email'] ) : '';
		$phone     = ! empty( $params['phone'] ) ? sanitize_text_field( $params['phone'] ) : '';

		if ( empty( $full_name ) || empty( $email ) || empty( $phone ) ) {
			return $this->error_response( 'missing_required_fields', 'Full name, email and phone number are required.', 400 );
		}

		// Determine customer account association
		$user_id = get_current_user_id();

		if ( ! $user_id && ! empty( $params['user_id'] ) ) {
			$chk_user = get_user_by( 'id', intval( $params['user_id'] ) );
			if ( $chk_user ) {
				$user_id = $chk_user->ID;
			}
		}

		if ( ! $user_id && ! empty( $email ) ) {
			$existing_user = get_user_by( 'email', $email );
			if ( $existing_user ) {
				$user_id = $existing_user->ID;
			}
		}

		$account_created = false;

		// Create customer account if requested and not yet existing
		if ( ! $user_id && ! empty( $email ) && ( ! empty( $params['create_account'] ) || ! empty( $params['password'] ) ) ) {
			$password = ! empty( $params['password'] ) ? $params['password'] : wp_generate_password( 12, false );
			$username = sanitize_user( current( explode( '@', $email ) ) );
			if ( username_exists( $username ) ) {
				$username .= '_' . rand( 100, 999 );
			}

			$name_parts = explode( ' ', trim( $full_name ), 2 );
			$first_name = $name_parts[0] ?? '';
			$last_name  = $name_parts[1] ?? '';

			if ( function_exists( 'wc_create_new_customer' ) ) {
				$new_uid = wc_create_new_customer( $email, $username, $password, array(
					'first_name' => $first_name,
					'last_name'  => $last_name,
				) );
				if ( ! is_wp_error( $new_uid ) ) {
					$user_id         = $new_uid;
					$account_created = true;
				}
			} else {
				$new_uid = wp_create_user( $username, $password, $email );
				if ( ! is_wp_error( $new_uid ) ) {
					$user_id         = $new_uid;
					$account_created = true;
					wp_update_user( array(
						'ID'         => $user_id,
						'first_name' => $first_name,
						'last_name'  => $last_name,
						'role'       => 'customer',
					) );
				}
			}

			if ( $user_id && ! empty( $params['company'] ) ) {
				update_user_meta( $user_id, 'billing_company', sanitize_text_field( $params['company'] ) );
			}
			if ( $user_id && ! empty( $phone ) ) {
				update_user_meta( $user_id, 'billing_phone', sanitize_text_field( $phone ) );
			}
		}

		$params['user_id'] = $user_id ? $user_id : 0;
		if ( $account_created ) {
			$params['account_status'] = 'New Account Created';
		} elseif ( $user_id > 0 ) {
			$params['account_status'] = 'Registered Customer';
		} else {
			$params['account_status'] = 'Guest';
		}

		// Also attach booking into user account meta if commercial booking
		if ( $user_id && ( $form_type === 'commercial_booking' || ! empty( $params['booking_data'] ) ) ) {
			$b_data = ! empty( $params['booking_data'] ) ? $params['booking_data'] : null;
			if ( is_string( $b_data ) ) {
				$b_data = json_decode( $b_data, true );
			}
			if ( is_array( $b_data ) ) {
				$existing_bookings = get_user_meta( $user_id, '_orbit_commercial_bookings', true );
				if ( ! is_array( $existing_bookings ) ) {
					$existing_bookings = array();
				}
				array_unshift( $existing_bookings, $b_data );
				update_user_meta( $user_id, '_orbit_commercial_bookings', $existing_bookings );
			}
		}

		$saved = FormEntriesManager::save_entry( $params );

		if ( false === $saved ) {
			return $this->error_response( 'db_insert_error', 'Could not save form entry to database.', 500 );
		}

		return $this->success_response( array(
			'message'        => 'Form submission recorded successfully.',
			'entry_id'       => $saved['id'],
			'reference_id'   => $saved['reference_id'],
			'user_id'        => $params['user_id'],
			'account_status' => $params['account_status'],
		) );
	}

	public function get_entries( $request ) {
		global $wpdb;
		$table_name = FormEntriesManager::get_table_name();
		$entries    = $wpdb->get_results( "SELECT * FROM {$table_name} ORDER BY id DESC LIMIT 50" );

		return $this->success_response( $entries );
	}
}
