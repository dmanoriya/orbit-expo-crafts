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
		$full_name = ! empty( $params['full_name'] ) ? sanitize_text_field( $params['full_name'] ) : ( ! empty( $params['name'] ) ? sanitize_text_field( $params['name'] ) : ( ! empty( $params['clientName'] ) ? sanitize_text_field( $params['clientName'] ) : 'Trade Client' ) );
		$email     = ! empty( $params['email'] ) ? sanitize_email( $params['email'] ) : ( ! empty( $params['user_email'] ) ? sanitize_email( $params['user_email'] ) : '' );
		$phone     = ! empty( $params['phone'] ) ? sanitize_text_field( $params['phone'] ) : ( ! empty( $params['tel'] ) ? sanitize_text_field( $params['tel'] ) : ( ! empty( $params['mobile'] ) ? sanitize_text_field( $params['mobile'] ) : '' ) );

		if ( empty( $email ) ) {
			return $this->error_response( 'missing_required_fields', 'A valid email address is required for all form enquiries.', 400 );
		}

		$params['full_name'] = $full_name;
		$params['email']     = $email;
		$params['phone']     = $phone;

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
		}

		$name_parts = explode( ' ', trim( $full_name ), 2 );
		$f_name     = $name_parts[0] ?? '';
		$l_name     = $name_parts[1] ?? '';

		// Ensure customer metadata (name, company, phone) is synchronized whenever user is linked
		if ( $user_id ) {
			if ( ! empty( $f_name ) && 'Trade' !== $f_name ) {
				update_user_meta( $user_id, 'first_name', $f_name );
				update_user_meta( $user_id, 'billing_first_name', $f_name );
				if ( ! empty( $l_name ) ) {
					update_user_meta( $user_id, 'last_name', $l_name );
					update_user_meta( $user_id, 'billing_last_name', $l_name );
				}
				wp_update_user( array(
					'ID'           => $user_id,
					'display_name' => trim( $full_name ),
					'first_name'   => $f_name,
					'last_name'    => $l_name,
				) );
			}

			if ( ! empty( $params['company'] ) ) {
				update_user_meta( $user_id, 'billing_company', sanitize_text_field( $params['company'] ) );
			}
			if ( ! empty( $phone ) ) {
				update_user_meta( $user_id, 'billing_phone', sanitize_text_field( $phone ) );
			}

			if ( class_exists( 'WC_Customer' ) ) {
				try {
					$wc_cust = new \WC_Customer( $user_id );
					if ( ! empty( $f_name ) && 'Trade' !== $f_name ) {
						$wc_cust->set_first_name( $f_name );
						$wc_cust->set_billing_first_name( $f_name );
						if ( ! empty( $l_name ) ) {
							$wc_cust->set_last_name( $l_name );
							$wc_cust->set_billing_last_name( $l_name );
						}
					}
					if ( ! empty( $params['company'] ) ) {
						$wc_cust->set_billing_company( sanitize_text_field( $params['company'] ) );
					}
					if ( ! empty( $phone ) ) {
						$wc_cust->set_billing_phone( sanitize_text_field( $phone ) );
					}
					$wc_cust->save();
				} catch ( \Exception $e ) {}
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

		// Also create native WooCommerce Order so it appears in WooCommerce -> Orders
		if ( function_exists( 'wc_create_order' ) && ( $form_type === 'commercial_booking' || ! empty( $params['booking_data'] ) ) ) {
			try {
				$b_data = ! empty( $params['booking_data'] ) ? $params['booking_data'] : null;
				if ( is_string( $b_data ) ) {
					$b_data = json_decode( $b_data, true );
				}

				$wc_order = wc_create_order( array(
					'customer_id'   => $user_id ? $user_id : 0,
					'customer_note' => sanitize_text_field( $params['notes'] ?? '' ),
				) );

				if ( $wc_order && ! is_wp_error( $wc_order ) ) {
					// Add Line Items
					$shortlist = ! empty( $params['shortlist_items'] ) ? $params['shortlist_items'] : ( ! empty( $b_data['items'] ) ? $b_data['items'] : array() );
					if ( is_string( $shortlist ) ) {
						$shortlist = json_decode( $shortlist, true );
					}
					if ( is_array( $shortlist ) && ! empty( $shortlist ) ) {
						foreach ( $shortlist as $s_item ) {
							$p_id = ! empty( $s_item['id'] ) ? intval( $s_item['id'] ) : 0;
							$qty  = ! empty( $s_item['quantity'] ) ? intval( $s_item['quantity'] ) : ( ! empty( $s_item['q'] ) ? intval( $s_item['q'] ) : 1 );
							$prod = $p_id ? wc_get_product( $p_id ) : null;
							if ( $prod ) {
								$item_id = $wc_order->add_product( $prod, $qty );
								if ( $item_id && ! empty( $s_item['finish'] ) ) {
									wc_add_order_item_meta( $item_id, 'Finish', sanitize_text_field( $s_item['finish'] ) );
								}
								if ( $item_id && ! empty( $s_item['material'] ) ) {
									wc_add_order_item_meta( $item_id, 'Material', sanitize_text_field( $s_item['material'] ) );
								}
							} else {
								$item_name = ! empty( $s_item['name'] ) ? sanitize_text_field( $s_item['name'] ) : 'Bespoke Architectural Item';
								$item_fee  = new \WC_Order_Item_Fee();
								$item_fee->set_name( $item_name . ( $qty > 1 ? ' (Qty: ' . $qty . ')' : '' ) );
								$u_price   = isset( $s_item['unitPrice'] ) ? (float) $s_item['unitPrice'] : 0.0;
								$tot_price = isset( $s_item['totalPrice'] ) ? (float) $s_item['totalPrice'] : ( $u_price * $qty );
								$item_fee->set_amount( $tot_price );
								$item_fee->set_total( $tot_price );
								$wc_order->add_item( $item_fee );
							}
						}
					}

					// Set Customer Billing & Shipping Address
					$addr = ! empty( $params['shipping_address'] ) ? $params['shipping_address'] : array();
					if ( is_string( $addr ) ) {
						$addr = json_decode( $addr, true );
					}
					$address_data = array(
						'first_name' => $f_name,
						'last_name'  => $l_name,
						'company'    => sanitize_text_field( $params['company'] ?? '' ),
						'address_1'  => sanitize_text_field( $addr['street'] ?? '' ),
						'city'       => sanitize_text_field( $addr['city'] ?? '' ),
						'state'      => sanitize_text_field( $addr['state'] ?? '' ),
						'postcode'   => sanitize_text_field( $addr['postalCode'] ?? '' ),
						'country'    => sanitize_text_field( $addr['country'] ?? '' ),
						'email'      => $email,
						'phone'      => $phone,
					);
					$wc_order->set_address( $address_data, 'billing' );
					$wc_order->set_address( $address_data, 'shipping' );

					// Currency & Totals
					if ( ! empty( $b_data['invoice']['currency'] ) ) {
						$wc_order->set_currency( sanitize_text_field( $b_data['invoice']['currency'] ) );
					}
					$wc_order->calculate_totals();

					// Metadata references
					$ref_id = ! empty( $params['reference_id'] ) ? sanitize_text_field( $params['reference_id'] ) : ( $b_data['id'] ?? '' );
					$wc_order->update_meta_data( '_orbit_booking_ref', $ref_id );
					$wc_order->update_meta_data( '_orbit_market_type', sanitize_text_field( $b_data['marketType'] ?? 'domestic' ) );
					$wc_order->update_meta_data( '_orbit_project_name', sanitize_text_field( $params['project_type'] ?? '' ) );
					if ( ! empty( $params['tax_id'] ) ) {
						$wc_order->update_meta_data( '_orbit_gst_tax_id', sanitize_text_field( $params['tax_id'] ) );
					}

					$wc_order->update_status( 'processing', sprintf( 'Commercial order (%s) received via Headless Storefront.', $ref_id ), true );
					$wc_order->save();

					// Attach wc_order_id back into booking data
					$params['wc_order_id'] = $wc_order->get_id();
					if ( is_array( $b_data ) ) {
						$b_data['wcOrderId'] = $wc_order->get_id();
						$params['booking_data'] = $b_data;
					}
				}
			} catch ( \Exception $e ) {
				error_log( 'HCC: Could not create native WooCommerce order: ' . $e->getMessage() );
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
			'user'           => $user_id ? array(
				'id'        => $user_id,
				'email'     => $email,
				'firstName' => $f_name ?? '',
				'lastName'  => $l_name ?? '',
				'company'   => $params['company'] ?? '',
				'phone'     => $phone,
			) : null,
		) );
	}

	public function get_entries( $request ) {
		global $wpdb;
		$table_name = FormEntriesManager::get_table_name();
		$entries    = $wpdb->get_results( "SELECT * FROM {$table_name} ORDER BY id DESC LIMIT 50" );

		return $this->success_response( $entries );
	}
}
