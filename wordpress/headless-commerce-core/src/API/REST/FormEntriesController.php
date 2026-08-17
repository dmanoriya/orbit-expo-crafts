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

		$saved = FormEntriesManager::save_entry( $params );

		if ( false === $saved ) {
			return $this->error_response( 'db_insert_error', 'Could not save form entry to database.', 500 );
		}

		return $this->success_response( array(
			'message'      => 'Form submission recorded successfully.',
			'entry_id'     => $saved['id'],
			'reference_id' => $saved['reference_id'],
		) );
	}

	public function get_entries( $request ) {
		global $wpdb;
		$table_name = FormEntriesManager::get_table_name();
		$entries    = $wpdb->get_results( "SELECT * FROM {$table_name} ORDER BY id DESC LIMIT 50" );

		return $this->success_response( $entries );
	}
}
