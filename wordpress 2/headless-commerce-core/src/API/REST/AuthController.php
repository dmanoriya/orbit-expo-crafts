<?php

namespace HeadlessCommerceCore\API\REST;

use HeadlessCommerceCore\Admin\FormEntriesManager;

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

		register_rest_route( $this->namespace, '/customers/profile', array(
			'methods'             => \WP_REST_Server::CREATABLE,
			'callback'            => array( $this, 'update_profile' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( $this->namespace, '/customers/favorites', array(
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_favorites' ),
				'permission_callback' => array( $this, 'check_authenticated' ),
			),
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'save_favorites' ),
				'permission_callback' => array( $this, 'check_authenticated' ),
			),
		) );

		register_rest_route( $this->namespace, '/customers/bookings', array(
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_bookings' ),
				'permission_callback' => '__return_true',
			),
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'save_booking' ),
				'permission_callback' => '__return_true',
			),
		) );

		register_rest_route( $this->namespace, '/customers/bookings/(?P<id>[a-zA-Z0-9_-]+)/messages', array(
			'methods'             => \WP_REST_Server::CREATABLE,
			'callback'            => array( $this, 'add_booking_message' ),
			'permission_callback' => '__return_true',
		) );
	}

	public function login( $request ) {
		$username = sanitize_text_field( $request->get_param( 'username' ) );
		$password = $request->get_param( 'password' );

		if ( empty( $username ) || empty( $password ) ) {
			return $this->error_response( 'hcc_missing_credentials', 'Username and password are required.', 400 );
		}

		// Support logging in via email directly
		if ( is_email( $username ) ) {
			$user_by_email = get_user_by( 'email', $username );
			if ( $user_by_email ) {
				$username = $user_by_email->user_login;
			}
		}

		$user = wp_authenticate( $username, $password );

		if ( is_wp_error( $user ) ) {
			return $this->error_response( 'hcc_invalid_login', 'Invalid username or password.', 401 );
		}

		wp_set_current_user( $user->ID );
		wp_set_auth_cookie( $user->ID, true );

		$first_name = '';
		$last_name  = '';
		$company    = '';
		$phone      = '';

		if ( class_exists( 'WC_Customer' ) ) {
			try {
				$customer   = new \WC_Customer( $user->ID );
				$first_name = $customer->get_first_name();
				$last_name  = $customer->get_last_name();
				$company    = $customer->get_billing_company();
				$phone      = $customer->get_billing_phone();
			} catch ( \Exception $e ) {}
		}

		if ( empty( $first_name ) ) {
			$first_name = get_user_meta( $user->ID, 'first_name', true );
		}
		if ( empty( $first_name ) ) {
			$first_name = get_user_meta( $user->ID, 'billing_first_name', true );
		}
		if ( empty( $last_name ) ) {
			$last_name = get_user_meta( $user->ID, 'last_name', true );
		}
		if ( empty( $last_name ) ) {
			$last_name = get_user_meta( $user->ID, 'billing_last_name', true );
		}
		if ( empty( $company ) ) {
			$company = get_user_meta( $user->ID, 'billing_company', true );
		}
		if ( empty( $phone ) ) {
			$phone = get_user_meta( $user->ID, 'billing_phone', true );
		}

		// Cross-reference form submissions table if company/phone/name are still empty
		global $wpdb;
		$entries_tbl = FormEntriesManager::get_table_name();
		if ( empty( $company ) || empty( $phone ) || empty( $first_name ) ) {
			$latest_form = $wpdb->get_row( $wpdb->prepare(
				"SELECT full_name, company, phone FROM {$entries_tbl} WHERE user_id = %d OR email = %s ORDER BY id DESC LIMIT 1",
				$user->ID,
				$user->user_email
			) );
			if ( $latest_form ) {
				if ( empty( $first_name ) && ! empty( $latest_form->full_name ) ) {
					$parts = explode( ' ', trim( $latest_form->full_name ), 2 );
					$first_name = $parts[0] ?? '';
					if ( empty( $last_name ) ) {
						$last_name = $parts[1] ?? '';
					}
				}
				if ( empty( $company ) && ! empty( $latest_form->company ) ) {
					$company = $latest_form->company;
				}
				if ( empty( $phone ) && ! empty( $latest_form->phone ) ) {
					$phone = $latest_form->phone;
				}
			}
		}

		$favs = get_user_meta( $user->ID, '_orbit_favorites', true );
		if ( ! is_array( $favs ) ) {
			$favs = array();
		}

		return $this->success_response( array(
			'id'        => $user->ID,
			'username'  => $user->user_login,
			'email'     => $user->user_email,
			'firstName' => $first_name,
			'lastName'  => $last_name,
			'company'   => $company,
			'phone'     => $phone,
			'favorites' => $favs,
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

		if ( empty( $first_name ) ) {
			$first_name = get_user_meta( $user_id, 'first_name', true );
		}
		if ( empty( $first_name ) ) {
			$first_name = get_user_meta( $user_id, 'billing_first_name', true );
		}
		if ( empty( $last_name ) ) {
			$last_name = get_user_meta( $user_id, 'last_name', true );
		}
		if ( empty( $last_name ) ) {
			$last_name = get_user_meta( $user_id, 'billing_last_name', true );
		}
		$company = get_user_meta( $user_id, 'billing_company', true );
		$phone   = get_user_meta( $user_id, 'billing_phone', true );

		// Cross-reference form submissions table if company/phone/name are still empty
		global $wpdb;
		$entries_tbl = FormEntriesManager::get_table_name();
		if ( empty( $company ) || empty( $phone ) || empty( $first_name ) ) {
			$latest_form = $wpdb->get_row( $wpdb->prepare(
				"SELECT full_name, company, phone FROM {$entries_tbl} WHERE user_id = %d OR email = %s ORDER BY id DESC LIMIT 1",
				$user_id,
				$user->user_email
			) );
			if ( $latest_form ) {
				if ( empty( $first_name ) && ! empty( $latest_form->full_name ) ) {
					$parts = explode( ' ', trim( $latest_form->full_name ), 2 );
					$first_name = $parts[0] ?? '';
					if ( empty( $last_name ) ) {
						$last_name = $parts[1] ?? '';
					}
				}
				if ( empty( $company ) && ! empty( $latest_form->company ) ) {
					$company = $latest_form->company;
				}
				if ( empty( $phone ) && ! empty( $latest_form->phone ) ) {
					$phone = $latest_form->phone;
				}
			}
		}

		$favs = get_user_meta( $user_id, '_orbit_favorites', true );
		if ( ! is_array( $favs ) ) {
			$favs = array();
		}

		return $this->success_response( array(
			'id'        => $user_id,
			'username'  => $user->user_login,
			'email'     => $user->user_email,
			'firstName' => $first_name,
			'lastName'  => $last_name,
			'company'   => $company,
			'phone'     => $phone,
			'billing'   => $billing,
			'shipping'  => $shipping,
			'orders'    => $orders,
			'favorites' => $favs,
		) );
	}

	public function update_profile( $request ) {
		$user_id = get_current_user_id();
		$email   = sanitize_email( $request->get_param( 'email' ) );

		if ( ! $user_id && ! empty( $email ) ) {
			$chk = get_user_by( 'email', $email );
			if ( $chk ) {
				$user_id = $chk->ID;
			}
		}

		if ( ! $user_id ) {
			return $this->error_response( 'hcc_unauthorized', 'User not authenticated.', 401 );
		}

		$first_name = sanitize_text_field( $request->get_param( 'firstName' ) ?? '' );
		$last_name  = sanitize_text_field( $request->get_param( 'lastName' ) ?? '' );
		$company    = sanitize_text_field( $request->get_param( 'company' ) ?? '' );
		$phone      = sanitize_text_field( $request->get_param( 'phone' ) ?? '' );

		if ( ! empty( $first_name ) ) {
			update_user_meta( $user_id, 'first_name', $first_name );
			update_user_meta( $user_id, 'billing_first_name', $first_name );
		}
		if ( ! empty( $last_name ) ) {
			update_user_meta( $user_id, 'last_name', $last_name );
			update_user_meta( $user_id, 'billing_last_name', $last_name );
		}
		if ( ! empty( $first_name ) || ! empty( $last_name ) ) {
			wp_update_user( array(
				'ID'           => $user_id,
				'display_name' => trim( $first_name . ' ' . $last_name ),
				'first_name'   => $first_name,
				'last_name'    => $last_name,
			) );
		}
		if ( ! empty( $company ) ) {
			update_user_meta( $user_id, 'billing_company', $company );
		}
		if ( ! empty( $phone ) ) {
			update_user_meta( $user_id, 'billing_phone', $phone );
		}

		if ( class_exists( 'WC_Customer' ) ) {
			try {
				$cust = new \WC_Customer( $user_id );
				if ( ! empty( $first_name ) ) {
					$cust->set_first_name( $first_name );
					$cust->set_billing_first_name( $first_name );
				}
				if ( ! empty( $last_name ) ) {
					$cust->set_last_name( $last_name );
					$cust->set_billing_last_name( $last_name );
				}
				if ( ! empty( $company ) ) {
					$cust->set_billing_company( $company );
				}
				if ( ! empty( $phone ) ) {
					$cust->set_billing_phone( $phone );
				}
				$cust->save();
			} catch ( \Exception $e ) {}
		}

		return $this->success_response( array(
			'message'   => 'Profile updated successfully.',
			'firstName' => $first_name,
			'lastName'  => $last_name,
			'company'   => $company,
			'phone'     => $phone,
		) );
	}

	public function get_favorites( $request ) {
		$user_id = get_current_user_id();
		$favs    = get_user_meta( $user_id, '_orbit_favorites', true );
		if ( ! is_array( $favs ) ) {
			$favs = array();
		}
		return $this->success_response( array( 'favorites' => $favs ) );
	}

	public function save_favorites( $request ) {
		$user_id = get_current_user_id();
		$favs    = $request->get_param( 'favorites' );
		if ( ! is_array( $favs ) ) {
			$favs = array();
		}
		update_user_meta( $user_id, '_orbit_favorites', $favs );
		return $this->success_response( array(
			'favorites' => $favs,
			'message'   => 'Favorites synced successfully.',
		) );
	}

	public function get_bookings( $request ) {
		global $wpdb;
		$user_id   = get_current_user_id();
		$email     = sanitize_email( $request->get_param( 'email' ) );
		$id_param  = sanitize_text_field( $request->get_param( 'id' ) );
		$ids_param = sanitize_text_field( $request->get_param( 'ids' ) );

		if ( ! $user_id && ! empty( $email ) ) {
			$user = get_user_by( 'email', $email );
			if ( $user ) {
				$user_id = $user->ID;
			}
		}

		$bookings = array();

		// Primary source: check wp_hcc_form_entries table directly
		$entries_tbl = FormEntriesManager::get_table_name();
		$where       = array();
		if ( $user_id ) {
			$where[] = $wpdb->prepare( 'user_id = %d', $user_id );
		}
		if ( ! empty( $email ) ) {
			$where[] = $wpdb->prepare( 'email = %s', $email );
		}
		if ( ! empty( $id_param ) ) {
			$where[] = $wpdb->prepare( 'reference_id = %s', $id_param );
		}
		if ( ! empty( $ids_param ) ) {
			$id_list = array_filter( array_map( 'trim', explode( ',', $ids_param ) ) );
			if ( ! empty( $id_list ) ) {
				$escaped_ids = array();
				foreach ( $id_list as $single_id ) {
					$escaped_ids[] = $wpdb->prepare( '%s', $single_id );
				}
				$where[] = 'reference_id IN (' . implode( ',', $escaped_ids ) . ')';
			}
		}

		$where_clause = '';
		if ( ! empty( $where ) ) {
			$where_clause = ' AND (' . implode( ' OR ', $where ) . ')';
		}

		$rows = $wpdb->get_results( "SELECT reference_id, booking_data, status, created_at FROM {$entries_tbl} WHERE booking_data IS NOT NULL AND booking_data != '' {$where_clause} ORDER BY id DESC LIMIT 50" );
		if ( ! empty( $rows ) ) {
			$seen_ids = array();
			foreach ( $rows as $row ) {
				if ( ! empty( $row->booking_data ) ) {
					$decoded = json_decode( $row->booking_data, true );
					if ( is_array( $decoded ) ) {
						if ( empty( $decoded['id'] ) ) {
							$decoded['id'] = $row->reference_id;
						}
						$b_id = ! empty( $decoded['id'] ) ? (string) $decoded['id'] : (string) $row->reference_id;
						if ( ! empty( $b_id ) ) {
							if ( isset( $seen_ids[ $b_id ] ) ) {
								continue;
							}
							$seen_ids[ $b_id ] = true;
						}
						$bookings[] = $decoded;
					}
				}
			}
		}

		// Fallback: check user meta or anon options if table query returned none
		if ( empty( $bookings ) && $user_id ) {
			$meta_bookings = get_user_meta( $user_id, '_orbit_commercial_bookings', true );
			if ( is_array( $meta_bookings ) ) {
				$bookings = $meta_bookings;
			}
		} elseif ( empty( $bookings ) && ! empty( $email ) ) {
			$anon = get_option( '_orbit_anon_bookings_' . md5( $email ), array() );
			if ( is_array( $anon ) ) {
				$bookings = $anon;
			}
		}

		if ( ! is_array( $bookings ) ) {
			$bookings = array();
		} else {
			$unique_bookings = array();
			$final_seen = array();
			foreach ( $bookings as $b ) {
				if ( is_array( $b ) && ! empty( $b['id'] ) ) {
					$bid = (string) $b['id'];
					if ( ! isset( $final_seen[ $bid ] ) ) {
						$final_seen[ $bid ] = true;
						$unique_bookings[] = $b;
					}
				} else {
					$unique_bookings[] = $b;
				}
			}
			$bookings = $unique_bookings;
		}

		return $this->success_response( array( 'bookings' => $bookings ) );
	}

	public function save_booking( $request ) {
		$params  = $request->get_json_params();
		$booking = ! empty( $params ) ? $params : $request->get_params();
		$user_id = get_current_user_id();
		$email   = ! empty( $booking['email'] ) ? sanitize_email( $booking['email'] ) : '';

		if ( ! $user_id && ! empty( $email ) ) {
			$user = get_user_by( 'email', $email );
			if ( $user ) {
				$user_id = $user->ID;
			}
		}

		// Ensure default milestones if none provided
		if ( empty( $booking['milestones'] ) && class_exists( '\HeadlessCommerceCore\Admin\FormEntriesManager' ) ) {
			$today = date( 'M j, Y' );
			$defs  = \HeadlessCommerceCore\Admin\FormEntriesManager::get_milestone_definitions();
			$booking['milestones'] = array();
			foreach ( $defs as $idx => $d ) {
				$booking['milestones'][] = array(
					'key'       => $d['key'],
					'label'     => $d['label'],
					'date'      => $idx === 1 ? $today : ( $idx === 2 ? 'In Progress (24h turnaround)' : '' ),
					'completed' => $idx === 1,
					'active'    => $idx === 2,
					'note'      => $d['default_note'],
				);
			}
		}

		if ( $user_id ) {
			$existing = get_user_meta( $user_id, '_orbit_commercial_bookings', true );
			if ( ! is_array( $existing ) ) {
				$existing = array();
			}
			$idx = -1;
			foreach ( $existing as $k => $b ) {
				if ( isset( $b['id'] ) && $b['id'] === $booking['id'] ) {
					$idx = $k;
					break;
				}
			}
			if ( $idx >= 0 ) {
				$existing[ $idx ] = $booking;
			} else {
				array_unshift( $existing, $booking );
			}
			update_user_meta( $user_id, '_orbit_commercial_bookings', $existing );
		} elseif ( ! empty( $email ) ) {
			$key      = '_orbit_anon_bookings_' . md5( $email );
			$existing = get_option( $key, array() );
			if ( ! is_array( $existing ) ) {
				$existing = array();
			}
			array_unshift( $existing, $booking );
			update_option( $key, $existing, false );
		}

		// Mirror to FormEntriesManager to ensure it appears in Form Submissions admin table
		try {
			$form_entry_payload = array(
				'reference_id'     => ! empty( $booking['id'] ) ? $booking['id'] : '',
				'form_type'        => 'commercial_booking',
				'full_name'        => $booking['clientName'] ?? ( $booking['full_name'] ?? '' ),
				'company'          => $booking['companyName'] ?? ( $booking['company'] ?? '' ),
				'email'            => $email,
				'phone'            => $booking['phone'] ?? '',
				'project_type'     => $booking['projectName'] ?? 'Commercial Order',
				'quantity'         => (string)( $booking['totalPieces'] ?? ( is_array( $booking['items'] ?? null ) ? count( $booking['items'] ) : '1' ) ),
				'tax_id'           => $booking['gstOrTaxId'] ?? '',
				'source_page'      => $booking['source_page'] ?? '/checkout',
				'source_title'     => $booking['source_title'] ?? 'Commercial Order Checkout',
				'user_id'          => $user_id ? $user_id : 0,
				'account_status'   => $user_id ? 'Registered Customer' : ( $booking['account_status'] ?? 'Guest' ),
				'shipping_address' => $booking['shippingAddress'] ?? ( $booking['shipping_address'] ?? '' ),
				'booking_data'     => $booking,
				'notes'            => $booking['specialNotes'] ?? ( $booking['notes'] ?? '' ),
				'shortlist_items'  => $booking['items'] ?? '',
			);
			FormEntriesManager::save_entry( $form_entry_payload );
		} catch ( \Throwable $th ) {
			error_log( 'Error mirroring booking to FormEntriesManager: ' . $th->getMessage() );
		}

		return $this->success_response( array(
			'message' => 'Commercial booking recorded successfully.',
			'booking' => $booking,
		) );
	}

	public function add_booking_message( $request ) {
		$booking_id = sanitize_text_field( $request->get_param( 'id' ) );
		$params     = $request->get_json_params();
		$message    = ! empty( $params ) ? $params : $request->get_params();
		$user_id    = get_current_user_id();

		if ( $user_id ) {
			$bookings = get_user_meta( $user_id, '_orbit_commercial_bookings', true );
			if ( is_array( $bookings ) ) {
				foreach ( $bookings as &$b ) {
					if ( isset( $b['id'] ) && $b['id'] === $booking_id ) {
						if ( ! isset( $b['messages'] ) || ! is_array( $b['messages'] ) ) {
							$b['messages'] = array();
						}
						$b['messages'][] = $message;
						break;
					}
				}
				update_user_meta( $user_id, '_orbit_commercial_bookings', $bookings );
			}
		}

		return $this->success_response( array(
			'message' => 'Message registered to booking conversation.',
		) );
	}

	public function check_authenticated() {
		return is_user_logged_in();
	}
}
