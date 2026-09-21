<?php

namespace HeadlessCommerceCore\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class FormEntriesManager {

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_admin_menu' ), 10 );
		self::create_table();
		add_action( 'admin_init', array( __CLASS__, 'handle_actions' ) );
	}

	public static function get_table_name() {
		global $wpdb;
		return $wpdb->prefix . 'hcc_form_entries';
	}

	public static function create_table() {
		global $wpdb;
		$table_name = self::get_table_name();
		$charset_collate = $wpdb->get_charset_collate();

		$sql = "CREATE TABLE {$table_name} (
			id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			reference_id VARCHAR(50) NOT NULL,
			form_type VARCHAR(50) NOT NULL DEFAULT 'quote_enquiry',
			full_name VARCHAR(191) NOT NULL,
			company VARCHAR(191) DEFAULT '',
			email VARCHAR(191) NOT NULL,
			phone VARCHAR(50) NOT NULL,
			project_type VARCHAR(191) DEFAULT '',
			quantity VARCHAR(100) DEFAULT '',
			finish_preference VARCHAR(191) DEFAULT '',
			product_name VARCHAR(191) DEFAULT '',
			product_sku VARCHAR(100) DEFAULT '',
			product_url VARCHAR(255) DEFAULT '',
			product_image VARCHAR(255) DEFAULT '',
			source_page VARCHAR(255) DEFAULT '',
			source_title VARCHAR(191) DEFAULT '',
			user_id BIGINT(20) UNSIGNED DEFAULT 0,
			account_status VARCHAR(50) DEFAULT 'Guest',
			tax_id VARCHAR(100) DEFAULT '',
			shipping_address TEXT DEFAULT '',
			booking_data LONGTEXT DEFAULT '',
			notes TEXT DEFAULT '',
			shortlist_items LONGTEXT DEFAULT '',
			status VARCHAR(50) NOT NULL DEFAULT 'new',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY  (id),
			KEY reference_id (reference_id),
			KEY form_type (form_type),
			KEY status (status),
			KEY user_id (user_id)
		) {$charset_collate};";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );

		// Explicit column migrations to ensure existing tables get new columns immediately
		$existing_columns = $wpdb->get_col( "DESCRIBE {$table_name}", 0 );
		if ( is_array( $existing_columns ) && ! empty( $existing_columns ) ) {
			if ( ! in_array( 'product_sku', $existing_columns, true ) ) {
				$wpdb->query( "ALTER TABLE {$table_name} ADD COLUMN product_sku VARCHAR(100) DEFAULT '' AFTER product_name;" );
			}
			if ( ! in_array( 'product_url', $existing_columns, true ) ) {
				$wpdb->query( "ALTER TABLE {$table_name} ADD COLUMN product_url VARCHAR(255) DEFAULT '' AFTER product_sku;" );
			}
			if ( ! in_array( 'product_image', $existing_columns, true ) ) {
				$wpdb->query( "ALTER TABLE {$table_name} ADD COLUMN product_image VARCHAR(255) DEFAULT '' AFTER product_url;" );
			}
			if ( ! in_array( 'source_page', $existing_columns, true ) ) {
				$wpdb->query( "ALTER TABLE {$table_name} ADD COLUMN source_page VARCHAR(255) DEFAULT '' AFTER product_image;" );
			}
			if ( ! in_array( 'source_title', $existing_columns, true ) ) {
				$wpdb->query( "ALTER TABLE {$table_name} ADD COLUMN source_title VARCHAR(191) DEFAULT '' AFTER source_page;" );
			}
			if ( ! in_array( 'user_id', $existing_columns, true ) ) {
				$wpdb->query( "ALTER TABLE {$table_name} ADD COLUMN user_id BIGINT(20) UNSIGNED DEFAULT 0 AFTER source_title;" );
			}
			if ( ! in_array( 'account_status', $existing_columns, true ) ) {
				$wpdb->query( "ALTER TABLE {$table_name} ADD COLUMN account_status VARCHAR(50) DEFAULT 'Guest' AFTER user_id;" );
			}
			if ( ! in_array( 'tax_id', $existing_columns, true ) ) {
				$wpdb->query( "ALTER TABLE {$table_name} ADD COLUMN tax_id VARCHAR(100) DEFAULT '' AFTER account_status;" );
			}
			if ( ! in_array( 'shipping_address', $existing_columns, true ) ) {
				$wpdb->query( "ALTER TABLE {$table_name} ADD COLUMN shipping_address TEXT DEFAULT '' AFTER tax_id;" );
			}
			if ( ! in_array( 'booking_data', $existing_columns, true ) ) {
				$wpdb->query( "ALTER TABLE {$table_name} ADD COLUMN booking_data LONGTEXT DEFAULT '' AFTER shipping_address;" );
			}
		}
	}

	public static function add_admin_menu() {
		add_submenu_page(
			'headless-commerce-core',
			'Form Submissions & Enquiries',
			'Form Submissions',
			'manage_options',
			'hcc-form-submissions',
			array( __CLASS__, 'render_form_submissions_page' )
		);
	}

	public static function save_entry( $data ) {
		global $wpdb;
		$table_name = self::get_table_name();

		// Ensure table exists & columns exist
		self::create_table();

		$form_type = sanitize_text_field( $data['form_type'] ?? 'quote_enquiry' );
		$prefix = 'REQ-';
		if ( $form_type === 'commercial_booking' ) {
			$prefix = 'OEC-';
		} elseif ( $form_type === 'quote_enquiry' ) {
			$prefix = 'QT-';
		} elseif ( $form_type === 'discuss_projects' ) {
			$prefix = 'PRJ-';
		} elseif ( $form_type === 'interior_designer' || $form_type === 'interior_designers' ) {
			$prefix = 'DES-';
		} elseif ( $form_type === 'suppliers_vendors' || $form_type === 'supplier_vendor' ) {
			$prefix = 'VND-';
		} elseif ( $form_type === 'influencers_marketing' || $form_type === 'influencer_marketing' ) {
			$prefix = 'INF-';
		} elseif ( $form_type === 'furniture_decor_designers' || $form_type === 'furniture_decor_designer' ) {
			$prefix = 'FURN-';
		} elseif ( $form_type === 'finish_sample' ) {
			$prefix = 'SMP-';
		} elseif ( $form_type === 'cad_request' ) {
			$prefix = 'CAD-';
		}

		$ref_id = ! empty( $data['reference_id'] ) ? sanitize_text_field( $data['reference_id'] ) : $prefix . rand( 100000, 999999 );

		// Shipping address handling
		$shipping_address = '';
		if ( ! empty( $data['shipping_address'] ) ) {
			$shipping_address = is_array( $data['shipping_address'] ) ? wp_json_encode( $data['shipping_address'] ) : sanitize_textarea_field( $data['shipping_address'] );
		}

		// Booking data handling
		$booking_data = '';
		if ( ! empty( $data['booking_data'] ) ) {
			$booking_data = is_array( $data['booking_data'] ) ? wp_json_encode( $data['booking_data'] ) : ( is_string( $data['booking_data'] ) ? $data['booking_data'] : '' );
		}

		// Fallback product_image from shortlist or booking items if not explicitly provided
		$product_image = $data['product_image'] ?? '';
		if ( empty( $product_image ) && ! empty( $data['shortlist_items'] ) ) {
			$items_test = is_array( $data['shortlist_items'] ) ? $data['shortlist_items'] : json_decode( (string) $data['shortlist_items'], true );
			if ( is_array( $items_test ) && ! empty( $items_test[0]['image'] ) ) {
				$product_image = $items_test[0]['image'];
			}
		}

		$insert_data = array(
			'reference_id'      => $ref_id,
			'form_type'         => $form_type,
			'full_name'         => sanitize_text_field( $data['full_name'] ?? '' ),
			'company'           => sanitize_text_field( $data['company'] ?? '' ),
			'email'             => sanitize_email( $data['email'] ?? '' ),
			'phone'             => sanitize_text_field( $data['phone'] ?? '' ),
			'project_type'      => sanitize_text_field( $data['project_type'] ?? '' ),
			'quantity'          => sanitize_text_field( (string)( $data['quantity'] ?? '' ) ),
			'finish_preference' => sanitize_text_field( $data['finish_preference'] ?? '' ),
			'product_name'      => sanitize_text_field( $data['product_name'] ?? '' ),
			'product_sku'       => sanitize_text_field( $data['product_sku'] ?? '' ),
			'product_url'       => esc_url_raw( $data['product_url'] ?? '' ),
			'product_image'     => esc_url_raw( $product_image ),
			'source_page'       => sanitize_text_field( $data['source_page'] ?? '' ),
			'source_title'      => sanitize_text_field( $data['source_title'] ?? '' ),
			'user_id'           => intval( $data['user_id'] ?? 0 ),
			'account_status'    => sanitize_text_field( $data['account_status'] ?? 'Guest' ),
			'tax_id'            => sanitize_text_field( $data['tax_id'] ?? '' ),
			'shipping_address'  => $shipping_address,
			'booking_data'      => $booking_data,
			'notes'             => sanitize_textarea_field( $data['notes'] ?? '' ),
			'shortlist_items'   => is_array( $data['shortlist_items'] ?? null ) ? wp_json_encode( $data['shortlist_items'] ) : sanitize_textarea_field( $data['shortlist_items'] ?? '' ),
			'status'            => 'new',
			'created_at'        => current_time( 'mysql' ),
		);

		// Filter insert_data against actual table columns in case of column mismatch
		$columns = $wpdb->get_col( "DESCRIBE {$table_name}", 0 );
		if ( is_array( $columns ) && ! empty( $columns ) ) {
			$filtered_data = array();
			foreach ( $insert_data as $key => $val ) {
				if ( in_array( $key, $columns, true ) ) {
					$filtered_data[ $key ] = $val;
				}
			}
			$insert_data = $filtered_data;
		}

		// Check for existing submission with the same reference_id to update instead of duplicating
		$existing_id = $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$table_name} WHERE reference_id = %s LIMIT 1", $ref_id ) );
		if ( $existing_id ) {
			unset( $insert_data['created_at'] );
			unset( $insert_data['status'] ); // Preserve existing admin status
			$wpdb->update( $table_name, $insert_data, array( 'id' => $existing_id ) );
			return array(
				'id'           => $existing_id,
				'reference_id' => $ref_id,
			);
		}

		$result = $wpdb->insert( $table_name, $insert_data );

		if ( false === $result ) {
			error_log( 'HCC Form Save DB Error: ' . $wpdb->last_error );
			return false;
		}

		return array(
			'id'           => $wpdb->insert_id,
			'reference_id' => $ref_id,
		);
	}

	/**
	 * Milestone definitions and status mapping
	 */
	public static function get_milestone_definitions() {
		return array(
			1 => array(
				'key'          => 'received',
				'label'        => 'Commercial Booking Received',
				'default_note' => 'Bill of quantities registered in Rajasthan factory queue.',
				'status'       => 'Booking Received',
				'db_status'    => 'new',
			),
			2 => array(
				'key'          => 'cad_review',
				'label'        => 'CAD Engineering & Material Verification',
				'default_note' => 'Technical specifier reviewing wood species, joinery, and moisture level.',
				'status'       => 'Engineering & CAD Review',
				'db_status'    => 'in_review',
			),
			3 => array(
				'key'          => 'proforma_issued',
				'label'        => 'Commercial Proposal & Proforma Invoice Issued',
				'default_note' => 'Official invoice generated with RTGS / SWIFT wire instructions.',
				'status'       => 'Proforma Issued',
				'db_status'    => 'quoted',
			),
			4 => array(
				'key'          => 'production',
				'label'        => 'Timber Seasoning & Joinery Crafting',
				'default_note' => 'Kiln-drying to 8-10% EMC followed by master carving and inlay assembly.',
				'status'       => 'In Production',
				'db_status'    => 'in_production',
			),
			5 => array(
				'key'          => 'qc_packing',
				'label'        => 'Final QC Inspection & Export Crating',
				'default_note' => 'Fumigated wooden box crating (ISPM-15 compliant) with moisture barrier.',
				'status'       => 'Quality Control & Packing',
				'db_status'    => 'qc_packing',
			),
			6 => array(
				'key'          => 'dispatch',
				'label'        => 'Container Loaded & Dispatched (Mundra Port)',
				'default_note' => 'Bill of Lading and vessel consignment tracking activated.',
				'status'       => 'Dispatched',
				'db_status'    => 'dispatched',
			),
		);
	}

	/**
	 * Update milestone progression, logistics, and sync to user meta
	 */
	public static function update_booking_milestone_and_sync( $entry_id, $stage_index, $milestone_note = '', $logistics = array(), $db_status_override = '', $pricing = array() ) {
		global $wpdb;
		$table_name = self::get_table_name();

		$row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table_name} WHERE id = %d", $entry_id ) );
		if ( ! $row ) {
			return false;
		}

		$b_data = ! empty( $row->booking_data ) ? json_decode( $row->booking_data, true ) : array();
		if ( ! is_array( $b_data ) ) {
			$b_data = array();
		}

		$stage_index = intval( $stage_index );
		if ( $stage_index < 1 ) $stage_index = 1;
		if ( $stage_index > 6 ) $stage_index = 6;

		$milestone_defs = self::get_milestone_definitions();
		$active_def     = $milestone_defs[ $stage_index ];
		$now_str        = date( 'M j, Y, g:i a' );

		// Preserve existing milestone timestamps if already completed
		$existing_milestones = isset( $b_data['milestones'] ) && is_array( $b_data['milestones'] ) ? $b_data['milestones'] : array();
		$existing_by_key    = array();
		foreach ( $existing_milestones as $em ) {
			if ( ! empty( $em['key'] ) ) {
				$existing_by_key[ $em['key'] ] = $em;
			}
		}

		$updated_milestones = array();
		foreach ( $milestone_defs as $idx => $def ) {
			$is_completed = ( $idx < $stage_index ) || ( $idx === 6 && $stage_index === 6 );
			$is_active    = ( $idx === $stage_index && $stage_index < 6 );

			$date_str = '';
			if ( $is_completed ) {
				if ( isset( $existing_by_key[ $def['key'] ]['date'] ) && ! empty( $existing_by_key[ $def['key'] ]['date'] ) && false === strpos( $existing_by_key[ $def['key'] ]['date'], 'In Progress' ) ) {
					$date_str = $existing_by_key[ $def['key'] ]['date'];
				} else {
					$date_str = $now_str;
				}
			} elseif ( $is_active ) {
				$date_str = 'In Progress (Active)';
			}

			$note_str = $def['default_note'];
			if ( $idx === $stage_index && ! empty( $milestone_note ) ) {
				$note_str = $milestone_note;
			} elseif ( isset( $existing_by_key[ $def['key'] ]['note'] ) && ! empty( $existing_by_key[ $def['key'] ]['note'] ) ) {
				$note_str = $existing_by_key[ $def['key'] ]['note'];
			}

			$updated_milestones[] = array(
				'key'       => $def['key'],
				'label'     => $def['label'],
				'date'      => $date_str,
				'completed' => $is_completed,
				'active'    => $is_active,
				'note'      => $note_str,
			);
		}

		$b_data['milestones'] = $updated_milestones;
		$b_data['status']     = $active_def['status'];

		if ( ! isset( $b_data['logistics'] ) || ! is_array( $b_data['logistics'] ) ) {
			$b_data['logistics'] = array();
		}

		$b_data['logistics']['currentMilestoneNote'] = ! empty( $milestone_note ) ? $milestone_note : ( $b_data['logistics']['currentMilestoneNote'] ?? $active_def['default_note'] );

		if ( ! empty( $logistics['trackingNumber'] ) ) {
			$b_data['logistics']['trackingNumber'] = sanitize_text_field( $logistics['trackingNumber'] );
		}
		if ( ! empty( $logistics['carrier'] ) ) {
			$b_data['logistics']['carrier'] = sanitize_text_field( $logistics['carrier'] );
		}
		if ( ! empty( $logistics['vesselName'] ) ) {
			$b_data['logistics']['vesselName'] = sanitize_text_field( $logistics['vesselName'] );
		}
		if ( ! empty( $logistics['originPort'] ) ) {
			$b_data['logistics']['originPort'] = sanitize_text_field( $logistics['originPort'] );
		}
		if ( ! empty( $logistics['destinationPort'] ) ) {
			$b_data['logistics']['destinationPort'] = sanitize_text_field( $logistics['destinationPort'] );
		}
		if ( ! empty( $logistics['estimatedDelivery'] ) ) {
			$b_data['logistics']['estimatedDelivery'] = sanitize_text_field( $logistics['estimatedDelivery'] );
		}

		// Commercial Invoice & Pricing Updates
		if ( ! empty( $pricing ) && is_array( $pricing ) ) {
			if ( ! isset( $b_data['invoice'] ) || ! is_array( $b_data['invoice'] ) ) {
				$b_data['invoice'] = array();
			}
			if ( ! empty( $pricing['currency'] ) ) {
				$b_data['invoice']['currency'] = sanitize_text_field( $pricing['currency'] );
			}
			if ( isset( $pricing['subtotal'] ) ) {
				$b_data['invoice']['subtotal'] = floatval( $pricing['subtotal'] );
			}
			if ( isset( $pricing['packingAndCrating'] ) ) {
				$b_data['invoice']['packingAndCrating'] = floatval( $pricing['packingAndCrating'] );
			}
			if ( isset( $pricing['estimatedFreight'] ) ) {
				$b_data['invoice']['estimatedFreight'] = floatval( $pricing['estimatedFreight'] );
			}
			if ( isset( $pricing['totalAmount'] ) ) {
				$b_data['invoice']['totalAmount'] = floatval( $pricing['totalAmount'] );
			}
			if ( ! empty( $pricing['invoiceNumber'] ) ) {
				$b_data['invoice']['invoiceNumber'] = sanitize_text_field( $pricing['invoiceNumber'] );
			}
			if ( ! empty( $pricing['paymentTerms'] ) ) {
				$b_data['invoice']['paymentTerms'] = sanitize_textarea_field( $pricing['paymentTerms'] );
			}

			// Update individual item unit prices and recalculate line totals
			if ( ! empty( $pricing['item_prices'] ) && is_array( $pricing['item_prices'] ) && isset( $b_data['items'] ) && is_array( $b_data['items'] ) ) {
				foreach ( $b_data['items'] as $ik => $it ) {
					$it_id = ! empty( $it['id'] ) ? $it['id'] : (string) $ik;
					if ( isset( $pricing['item_prices'][ $it_id ] ) ) {
						$new_u_price = floatval( $pricing['item_prices'][ $it_id ] );
						$it_qty      = isset( $it['quantity'] ) ? intval( $it['quantity'] ) : 1;
						$b_data['items'][ $ik ]['unitPrice']  = $new_u_price;
						$b_data['items'][ $ik ]['totalPrice'] = $new_u_price * $it_qty;
					}
				}
			}
		}

		$final_db_status = ! empty( $db_status_override ) ? $db_status_override : $active_def['db_status'];

		// Update database row
		$wpdb->update(
			$table_name,
			array(
				'booking_data' => wp_json_encode( $b_data ),
				'status'       => $final_db_status,
			),
			array( 'id' => $entry_id )
		);

		// Synchronize to WordPress User Meta or Guest Option
		$b_id    = $b_data['id'] ?? ( $row->reference_id ?? '' );
		$u_id    = intval( $row->user_id );
		$u_email = sanitize_email( $row->email );

		if ( ! $u_id && ! empty( $u_email ) ) {
			$u = get_user_by( 'email', $u_email );
			if ( $u ) {
				$u_id = $u->ID;
			}
		}

		if ( $u_id ) {
			$meta_bookings = get_user_meta( $u_id, '_orbit_commercial_bookings', true );
			if ( ! is_array( $meta_bookings ) ) {
				$meta_bookings = array();
			}
			$found = false;
			foreach ( $meta_bookings as $mk => $mb ) {
				if ( ( isset( $mb['id'] ) && $mb['id'] === $b_id ) || ( isset( $mb['reference_id'] ) && $mb['reference_id'] === $b_id ) ) {
					$meta_bookings[ $mk ] = $b_data;
					$found = true;
					break;
				}
			}
			if ( ! $found ) {
				array_unshift( $meta_bookings, $b_data );
			}
			update_user_meta( $u_id, '_orbit_commercial_bookings', $meta_bookings );
		} elseif ( ! empty( $u_email ) ) {
			$anon_key      = '_orbit_anon_bookings_' . md5( $u_email );
			$anon_bookings = get_option( $anon_key, array() );
			if ( ! is_array( $anon_bookings ) ) {
				$anon_bookings = array();
			}
			$found = false;
			foreach ( $anon_bookings as $ak => $ab ) {
				if ( ( isset( $ab['id'] ) && $ab['id'] === $b_id ) || ( isset( $ab['reference_id'] ) && $ab['reference_id'] === $b_id ) ) {
					$anon_bookings[ $ak ] = $b_data;
					$found = true;
					break;
				}
			}
			if ( ! $found ) {
				array_unshift( $anon_bookings, $b_data );
			}
			update_option( $anon_key, $anon_bookings, false );
		}

		return true;
	}

	public static function handle_actions() {
		if ( ! is_admin() || ! isset( $_GET['page'] ) || $_GET['page'] !== 'hcc-form-submissions' ) {
			return;
		}

		global $wpdb;
		$table_name = self::get_table_name();

		// Handle Delete
		if ( isset( $_GET['action'] ) && $_GET['action'] === 'delete' && isset( $_GET['id'] ) && check_admin_referer( 'hcc_delete_entry_' . $_GET['id'] ) ) {
			$id = intval( $_GET['id'] );
			$wpdb->delete( $table_name, array( 'id' => $id ) );
			wp_safe_redirect( admin_url( 'admin.php?page=hcc-form-submissions&deleted=1' ) );
			exit;
		}

		// Handle Status Update from table row dropdown
		if ( isset( $_POST['hcc_update_status'] ) && isset( $_POST['entry_id'] ) && check_admin_referer( 'hcc_status_nonce' ) ) {
			$entry_id   = intval( $_POST['entry_id'] );
			$new_status = sanitize_text_field( $_POST['status'] );

			// Check if this is a commercial booking with milestones to synchronize
			$status_to_stage = array(
				'new'           => 1,
				'in_review'     => 2,
				'quoted'        => 3,
				'in_production' => 4,
				'qc_packing'    => 5,
				'dispatched'    => 6,
			);

			if ( isset( $status_to_stage[ $new_status ] ) ) {
				self::update_booking_milestone_and_sync( $entry_id, $status_to_stage[ $new_status ], '', array(), $new_status );
			} else {
				$wpdb->update( $table_name, array( 'status' => $new_status ), array( 'id' => $entry_id ) );
			}

			wp_safe_redirect( admin_url( 'admin.php?page=hcc-form-submissions&updated=1' ) );
			exit;
		}

		// Handle Dedicated Milestone Progression & Commercial Pricing Update Form from Details Modal
		if ( isset( $_POST['hcc_update_milestones'] ) && isset( $_POST['entry_id'] ) && check_admin_referer( 'hcc_milestone_nonce' ) ) {
			$entry_id    = intval( $_POST['entry_id'] );
			$stage_index = isset( $_POST['milestone_stage'] ) ? intval( $_POST['milestone_stage'] ) : 1;
			$stage_note  = sanitize_textarea_field( $_POST['milestone_note'] ?? '' );
			$logistics   = array(
				'trackingNumber'    => sanitize_text_field( $_POST['tracking_number'] ?? '' ),
				'carrier'           => sanitize_text_field( $_POST['carrier'] ?? '' ),
				'vesselName'        => sanitize_text_field( $_POST['vessel_name'] ?? '' ),
				'originPort'        => sanitize_text_field( $_POST['origin_port'] ?? '' ),
				'destinationPort'   => sanitize_text_field( $_POST['destination_port'] ?? '' ),
				'estimatedDelivery' => sanitize_text_field( $_POST['estimated_delivery'] ?? '' ),
			);

			$pricing = array();
			if ( isset( $_POST['invoice_total'] ) || isset( $_POST['invoice_currency'] ) ) {
				$pricing = array(
					'currency'          => sanitize_text_field( $_POST['invoice_currency'] ?? 'USD' ),
					'subtotal'          => floatval( $_POST['invoice_subtotal'] ?? 0 ),
					'packingAndCrating' => floatval( $_POST['invoice_packing'] ?? 0 ),
					'estimatedFreight'  => floatval( $_POST['invoice_freight'] ?? 0 ),
					'totalAmount'       => floatval( $_POST['invoice_total'] ?? 0 ),
					'invoiceNumber'     => sanitize_text_field( $_POST['invoice_number'] ?? '' ),
					'paymentTerms'      => sanitize_textarea_field( $_POST['invoice_terms'] ?? '' ),
					'item_prices'       => isset( $_POST['item_unit_prices'] ) && is_array( $_POST['item_unit_prices'] ) ? $_POST['item_unit_prices'] : array(),
				);
			}

			self::update_booking_milestone_and_sync( $entry_id, $stage_index, $stage_note, $logistics, '', $pricing );

			wp_safe_redirect( admin_url( 'admin.php?page=hcc-form-submissions&milestone_updated=1' ) );
			exit;
		}

		// Handle CSV Export
		if ( isset( $_GET['action'] ) && $_GET['action'] === 'export_csv' ) {
			self::export_csv();
			exit;
		}
	}

	public static function export_csv() {
		global $wpdb;
		$table_name = self::get_table_name();
		$entries = $wpdb->get_results( "SELECT * FROM {$table_name} ORDER BY id DESC", ARRAY_A );

		header( 'Content-Type: text/csv; charset=utf-8' );
		header( 'Content-Disposition: attachment; filename=form_submissions_' . date( 'Y-m-d' ) . '.csv' );

		$output = fopen( 'php://output', 'w' );
		fputcsv( $output, array( 'ID', 'Reference ID', 'Form Type', 'Origin / Source Title', 'Origin URL', 'Customer Account', 'User ID', 'Tax ID / GST', 'Full Name', 'Company', 'Email', 'Phone', 'Product Name', 'SKU', 'Project Type', 'Quantity', 'Finish', 'Notes', 'Status', 'Date' ) );

		foreach ( $entries as $row ) {
			fputcsv( $output, array(
				$row['id'],
				$row['reference_id'],
				$row['form_type'],
				$row['source_title'] ?? '',
				$row['source_page'] ?? '',
				$row['account_status'] ?? 'Guest',
				$row['user_id'] ?? '0',
				$row['tax_id'] ?? '',
				$row['full_name'],
				$row['company'],
				$row['email'],
				$row['phone'],
				$row['product_name'],
				$row['product_sku'] ?? '',
				$row['project_type'],
				$row['quantity'],
				$row['finish_preference'],
				$row['notes'],
				$row['status'],
				$row['created_at'],
			) );
		}

		fclose( $output );
	}

	/**
	 * Helper: Resolve product image URL to a valid, displayable absolute URL.
	 * Handles relative paths (/categories/..., /wp-content/...), storefront URLs, and local fallback.
	 *
	 * @param string $image_path Raw image path or URL.
	 * @return string Displayable absolute image URL.
	 */
	public static function resolve_product_image_url( $image_path ) {
		if ( empty( $image_path ) ) {
			return plugins_url( 'assets/fallback-product.svg', dirname( __DIR__, 2 ) . '/headless-commerce-core.php' );
		}

		$image_path = trim( (string) $image_path );

		// If it points to fallback-product.svg (relative or absolute)
		if ( false !== strpos( $image_path, 'fallback-product.svg' ) ) {
			return plugins_url( 'assets/fallback-product.svg', dirname( __DIR__, 2 ) . '/headless-commerce-core.php' );
		}

		// If it contains /categories/... anywhere (in storefront URL or relative path)
		if ( preg_match( '#/categories/(.+\.(?:jpe?g|png|webp|svg))#i', $image_path, $matches ) ) {
			$category_file = 'assets/categories/' . $matches[1];
			$file_fs       = dirname( __DIR__, 2 ) . '/' . $category_file;
			if ( file_exists( $file_fs ) ) {
				return plugins_url( $category_file, dirname( __DIR__, 2 ) . '/headless-commerce-core.php' );
			}
		}

		// If it starts with /categories/ or categories/
		if ( 0 === strpos( $image_path, '/categories/' ) || 0 === strpos( $image_path, 'categories/' ) ) {
			$rel = ltrim( $image_path, '/' );
			return plugins_url( 'assets/' . $rel, dirname( __DIR__, 2 ) . '/headless-commerce-core.php' );
		}

		// If it's an absolute URL
		if ( preg_match( '#^https?://#i', $image_path ) ) {
			return $image_path;
		}

		// If it's a WordPress relative path
		if ( 0 === strpos( $image_path, '/wp-content/' ) || 0 === strpos( $image_path, '/wp-includes/' ) ) {
			return site_url( $image_path );
		}

		// Check if it exists in plugin assets
		if ( 0 === strpos( $image_path, '/' ) ) {
			$plugin_asset_rel = 'assets' . $image_path;
			$plugin_asset_fs  = dirname( __DIR__, 2 ) . '/' . $plugin_asset_rel;
			if ( file_exists( $plugin_asset_fs ) ) {
				return plugins_url( $plugin_asset_rel, dirname( __DIR__, 2 ) . '/headless-commerce-core.php' );
			}
			return site_url( $image_path );
		}

		return plugins_url( 'assets/fallback-product.svg', dirname( __DIR__, 2 ) . '/headless-commerce-core.php' );
	}

	public static function render_form_submissions_page() {
		global $wpdb;
		$table_name = self::get_table_name();

		$form_type_filter = isset( $_GET['type'] ) ? sanitize_text_field( $_GET['type'] ) : 'all';
		$status_filter    = isset( $_GET['status'] ) ? sanitize_text_field( $_GET['status'] ) : 'all';
		$search_query     = isset( $_GET['s'] ) ? sanitize_text_field( $_GET['s'] ) : '';

		$where_clauses = array( '1=1' );
		if ( $form_type_filter !== 'all' ) {
			$where_clauses[] = $wpdb->prepare( 'form_type = %s', $form_type_filter );
		}
		if ( $status_filter !== 'all' ) {
			$where_clauses[] = $wpdb->prepare( 'status = %s', $status_filter );
		}
		if ( ! empty( $search_query ) ) {
			$like = '%' . $wpdb->esc_like( $search_query ) . '%';
			$where_clauses[] = $wpdb->prepare( '(reference_id LIKE %s OR full_name LIKE %s OR company LIKE %s OR email LIKE %s OR phone LIKE %s OR product_name LIKE %s OR source_title LIKE %s OR source_page LIKE %s OR notes LIKE %s)', $like, $like, $like, $like, $like, $like, $like, $like, $like );
		}

		$where_sql = implode( ' AND ', $where_clauses );
		$entries   = $wpdb->get_results( "SELECT * FROM {$table_name} WHERE {$where_sql} ORDER BY id DESC" );

		// Counts
		$total_count    = $wpdb->get_var( "SELECT COUNT(*) FROM {$table_name}" );
		$booking_count  = $wpdb->get_var( "SELECT COUNT(*) FROM {$table_name} WHERE form_type = 'commercial_booking'" );
		$quote_count    = $wpdb->get_var( "SELECT COUNT(*) FROM {$table_name} WHERE form_type = 'quote_enquiry'" );
		$project_count  = $wpdb->get_var( "SELECT COUNT(*) FROM {$table_name} WHERE form_type = 'discuss_projects'" );
		$designer_count = $wpdb->get_var( "SELECT COUNT(*) FROM {$table_name} WHERE form_type = 'interior_designer'" );
		$sample_count   = $wpdb->get_var( "SELECT COUNT(*) FROM {$table_name} WHERE form_type = 'finish_sample'" );
		$cad_count      = $wpdb->get_var( "SELECT COUNT(*) FROM {$table_name} WHERE form_type = 'cad_request'" );

		?>
		<div class="wrap">
			<h1 class="wp-heading-inline">Form Submissions &amp; Enquiries</h1>
			<a href="<?php echo admin_url( 'admin.php?page=hcc-form-submissions&action=export_csv' ); ?>" class="page-title-action">Export to CSV</a>
			<hr class="wp-header-end">

			<?php if ( isset( $_GET['deleted'] ) ) : ?>
				<div class="updated"><p>Submission deleted successfully.</p></div>
			<?php endif; ?>
			<?php if ( isset( $_GET['updated'] ) ) : ?>
				<div class="updated"><p>Status updated successfully.</p></div>
			<?php endif; ?>
			<?php if ( isset( $_GET['milestone_updated'] ) ) : ?>
				<div class="updated"><p><strong>Success:</strong> Production milestone progression, factory notes, and freight tracking updated and synchronized to customer portal.</p></div>
			<?php endif; ?>

			<!-- FILTER TABS -->
			<ul class="subsubsub">
				<li class="all"><a href="admin.php?page=hcc-form-submissions" class="<?php echo $form_type_filter === 'all' ? 'current' : ''; ?>">All Forms <span class="count">(<?php echo intval( $total_count ); ?>)</span></a> |</li>
				<li class="booking"><a href="admin.php?page=hcc-form-submissions&type=commercial_booking" class="<?php echo $form_type_filter === 'commercial_booking' ? 'current' : ''; ?>">Commercial Orders <span class="count">(<?php echo intval( $booking_count ); ?>)</span></a> |</li>
				<li class="quote"><a href="admin.php?page=hcc-form-submissions&type=quote_enquiry" class="<?php echo $form_type_filter === 'quote_enquiry' ? 'current' : ''; ?>">Quote Enquiries <span class="count">(<?php echo intval( $quote_count ); ?>)</span></a> |</li>
				<li class="project"><a href="admin.php?page=hcc-form-submissions&type=discuss_projects" class="<?php echo $form_type_filter === 'discuss_projects' ? 'current' : ''; ?>">Project Consultations <span class="count">(<?php echo intval( $project_count ); ?>)</span></a> |</li>
				<li class="designer"><a href="admin.php?page=hcc-form-submissions&type=interior_designer" class="<?php echo $form_type_filter === 'interior_designer' ? 'current' : ''; ?>">Interior Designers <span class="count">(<?php echo intval( $designer_count ); ?>)</span></a> |</li>
				<li class="sample"><a href="admin.php?page=hcc-form-submissions&type=finish_sample" class="<?php echo $form_type_filter === 'finish_sample' ? 'current' : ''; ?>">Finish Samples <span class="count">(<?php echo intval( $sample_count ); ?>)</span></a> |</li>
				<li class="cad"><a href="admin.php?page=hcc-form-submissions&type=cad_request" class="<?php echo $form_type_filter === 'cad_request' ? 'current' : ''; ?>">CAD 3D Requests <span class="count">(<?php echo intval( $cad_count ); ?>)</span></a></li>
			</ul>

			<!-- SEARCH FORM -->
			<form method="get" action="" style="margin-bottom: 15px; float: right;">
				<input type="hidden" name="page" value="hcc-form-submissions" />
				<?php if ( $form_type_filter !== 'all' ) : ?>
					<input type="hidden" name="type" value="<?php echo esc_attr( $form_type_filter ); ?>" />
				<?php endif; ?>
				<input type="search" name="s" value="<?php echo esc_attr( $search_query ); ?>" placeholder="Search submissions, origins, names..." />
				<input type="submit" class="button" value="Search" />
			</form>

			<div class="tablenav top" style="clear: both;">
				<div class="alignleft actions">
					<select onchange="location = this.value;">
						<option value="admin.php?page=hcc-form-submissions">All Statuses</option>
						<option value="admin.php?page=hcc-form-submissions&status=new" <?php selected( $status_filter, 'new' ); ?>>New (Booking Received)</option>
						<option value="admin.php?page=hcc-form-submissions&status=in_review" <?php selected( $status_filter, 'in_review' ); ?>>In Review (CAD Verification)</option>
						<option value="admin.php?page=hcc-form-submissions&status=quoted" <?php selected( $status_filter, 'quoted' ); ?>>Quoted (Proforma Issued)</option>
						<option value="admin.php?page=hcc-form-submissions&status=in_production" <?php selected( $status_filter, 'in_production' ); ?>>In Production (Timber Seasoning)</option>
						<option value="admin.php?page=hcc-form-submissions&status=qc_packing" <?php selected( $status_filter, 'qc_packing' ); ?>>QC &amp; Packing (ISPM-15)</option>
						<option value="admin.php?page=hcc-form-submissions&status=dispatched" <?php selected( $status_filter, 'dispatched' ); ?>>Dispatched (Ocean Transit)</option>
						<option value="admin.php?page=hcc-form-submissions&status=closed" <?php selected( $status_filter, 'closed' ); ?>>Closed</option>
					</select>
				</div>
			</div>

			<!-- SUBMISSIONS TABLE -->
			<table class="wp-list-table widefat fixed striped">
				<thead>
					<tr>
						<th scope="col" style="width: 105px;">Ref ID</th>
						<th scope="col" style="width: 120px;">Form Type</th>
						<th scope="col" style="width: 155px;">Origin / Source</th>
						<th scope="col" style="width: 195px;">Client &amp; Account</th>
						<th scope="col">Order &amp; Project Specs</th>
						<th scope="col" style="width: 60px;">Qty</th>
						<th scope="col" style="width: 125px;">Status</th>
						<th scope="col" style="width: 120px;">Date</th>
						<th scope="col" style="width: 100px;">Actions</th>
					</tr>
				</thead>
				<tbody>
					<?php if ( empty( $entries ) ) : ?>
						<tr>
							<td colspan="9">No form submissions found.</td>
						</tr>
					<?php else : ?>
						<?php foreach ( $entries as $entry ) : ?>
							<?php
							$badge_color = '#0E5C63';
							$type_label  = 'Quote Enquiry';

							if ( $entry->form_type === 'commercial_booking' ) {
								$badge_color = '#1E3A8A';
								$type_label  = 'Commercial Order';
							} elseif ( $entry->form_type === 'discuss_projects' ) {
								$badge_color = '#0D9488';
								$type_label  = 'Project Consultation';
							} elseif ( $entry->form_type === 'interior_designer' ) {
								$badge_color = '#7C3AED';
								$type_label  = 'Interior Designer';
							} elseif ( $entry->form_type === 'finish_sample' ) {
								$badge_color = '#C8A06A';
								$type_label  = 'Finish Sample';
							} elseif ( $entry->form_type === 'cad_request' ) {
								$badge_color = '#6B4426';
								$type_label  = 'CAD 3D Block';
							}

							$status_bg = '#e6f4ea';
							$status_fg = '#137333';
							if ( $entry->status === 'new' ) {
								$status_bg = '#e8f0fe';
								$status_fg = '#1a73e8';
							} elseif ( $entry->status === 'in_review' ) {
								$status_bg = '#fef7e0';
								$status_fg = '#b06000';
							} elseif ( $entry->status === 'quoted' ) {
								$status_bg = '#f3e8ff';
								$status_fg = '#7e22ce';
							} elseif ( $entry->status === 'in_production' ) {
								$status_bg = '#fef3c7';
								$status_fg = '#92400e';
							} elseif ( $entry->status === 'qc_packing' ) {
								$status_bg = '#ede9fe';
								$status_fg = '#5b21b6';
							} elseif ( $entry->status === 'dispatched' ) {
								$status_bg = '#e0f2fe';
								$status_fg = '#0369a1';
							} elseif ( $entry->status === 'closed' ) {
								$status_bg = '#f1f3f4';
								$status_fg = '#5f6368';
							}

							// Parse Shortlist Items
							$shortlist = array();
							if ( ! empty( $entry->shortlist_items ) ) {
								$decoded = json_decode( $entry->shortlist_items, true );
								if ( is_array( $decoded ) ) {
									$shortlist = $decoded;
								}
							}

							// Account Status Badge
							$acc_badge_bg = '#f3f4f6';
							$acc_badge_fg = '#4b5563';
							$acc_badge_label = '⚪ Guest';
							if ( ! empty( $entry->user_id ) && intval( $entry->user_id ) > 0 ) {
								$acc_badge_bg = '#dbeafe';
								$acc_badge_fg = '#1e40af';
								$acc_badge_label = '👤 Customer #' . intval( $entry->user_id );
							} elseif ( ( $entry->account_status ?? '' ) === 'New Account Created' ) {
								$acc_badge_bg = '#dcfce7';
								$acc_badge_fg = '#166534';
								$acc_badge_label = '🆕 New Account';
							}

							// Source origin display
							$origin_title = ! empty( $entry->source_title ) ? $entry->source_title : '';
							if ( empty( $origin_title ) ) {
								if ( $entry->form_type === 'commercial_booking' ) {
									$origin_title = 'Order Checkout';
								} elseif ( $entry->form_type === 'discuss_projects' ) {
									$origin_title = 'Discuss Projects';
								} elseif ( $entry->form_type === 'interior_designer' ) {
									$origin_title = 'Interior Designers';
								} elseif ( $entry->form_type === 'finish_sample' ) {
									$origin_title = 'PDP Sample Request';
								} elseif ( $entry->form_type === 'cad_request' ) {
									$origin_title = 'PDP CAD Request';
								} else {
									$origin_title = 'Contact Page';
								}
							}

							$origin_url = ! empty( $entry->source_page ) ? $entry->source_page : ( $entry->product_url ?? '' );
							?>
							<tr>
								<td><strong><code><?php echo esc_html( $entry->reference_id ); ?></code></strong></td>
								<td>
									<span style="background:<?php echo $badge_color; ?>; color:#fff; padding:3px 7px; border-radius:4px; font-size:11px; font-weight:600; display:inline-block; line-height:1.2;">
										<?php echo esc_html( $type_label ); ?>
									</span>
								</td>
								<td>
									<span style="font-size:11.5px; font-weight:600; color:#1f2937; display:block;">
										📍 <?php echo esc_html( $origin_title ); ?>
									</span>
									<?php if ( ! empty( $origin_url ) ) : ?>
										<a href="<?php echo esc_url( $origin_url ); ?>" target="_blank" style="font-size:11px; color:#0E5C63; word-break:break-all; display:inline-block; margin-top:2px;">
											🔗 <?php echo esc_html( wp_trim_words( $origin_url, 4, '…' ) ); ?> ↗
										</a>
									<?php endif; ?>
								</td>
								<td>
									<strong><?php echo esc_html( $entry->full_name ); ?></strong>
									<br>
									<span style="background:<?php echo $acc_badge_bg; ?>; color:<?php echo $acc_badge_fg; ?>; padding:2px 6px; border-radius:3px; font-size:10.5px; font-weight:600; display:inline-block; margin-top:2px;">
										<?php echo esc_html( $acc_badge_label ); ?>
									</span>
									<?php if ( ! empty( $entry->company ) ) : ?>
										<br><span style="color:#666; font-size:11.5px;">🏢 <?php echo esc_html( $entry->company ); ?></span>
									<?php endif; ?>
									<br><span style="font-size:11.5px;">✉️ <a href="mailto:<?php echo esc_attr( $entry->email ); ?>"><?php echo esc_html( $entry->email ); ?></a></span>
									<br><span style="font-size:11.5px;">📞 <?php echo esc_html( $entry->phone ); ?></span>
									<?php if ( ! empty( $entry->tax_id ) ) : ?>
										<br><span style="font-size:11px; color:#888;">Tax/GST: <code><?php echo esc_html( $entry->tax_id ); ?></code></span>
									<?php endif; ?>
								</td>
								<td>
									<div style="display:flex; gap:10px; align-items:flex-start;">
										<?php
										$resolved_thumb = '';
										if ( ! empty( $entry->product_image ) ) {
											$resolved_thumb = self::resolve_product_image_url( $entry->product_image );
										} elseif ( ! empty( $shortlist ) && is_array( $shortlist ) ) {
											foreach ( $shortlist as $s_item ) {
												if ( is_array( $s_item ) && ! empty( $s_item['image'] ) ) {
													$resolved_thumb = self::resolve_product_image_url( $s_item['image'] );
													break;
												}
											}
										}
										if ( empty( $resolved_thumb ) && ( ! empty( $entry->product_name ) || ! empty( $shortlist ) ) ) {
											$resolved_thumb = self::resolve_product_image_url( '' );
										}
										$entry->resolved_product_image = $resolved_thumb;
										?>
										<?php if ( ! empty( $resolved_thumb ) ) : ?>
											<img src="<?php echo esc_url( $resolved_thumb ); ?>" 
											     alt="<?php echo esc_attr( $entry->product_name ?? 'Product Preview' ); ?>"
											     onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%3E%3Crect%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f4f4f4%22%20rx%3D%224%22%2F%3E%3Cpath%20d%3D%22M12%2028l5-6%204%205%205-7%206%208H12z%22%20fill%3D%22%230e5c63%22%20opacity%3D%220.35%22%2F%3E%3Ccircle%20cx%3D%2216%22%20cy%3D%2216%22%20r%3D%223%22%20fill%3D%22%230e5c63%22%20opacity%3D%220.35%22%2F%3E%3C%2Fsvg%3E';"
											     style="width:40px; height:40px; object-fit:cover; border-radius:4px; border:1px solid #ccc; flex-shrink:0; background:#f4f4f4;" />
										<?php endif; ?>
										<div>
											<?php if ( $entry->form_type === 'commercial_booking' ) : ?>
												<strong>📋 Commercial Order (<?php echo esc_html( $entry->quantity ); ?> units)</strong>
												<?php if ( ! empty( $entry->project_type ) ) : ?>
													<br><span style="font-size:12px; color:#111;">Project: <strong><?php echo esc_html( $entry->project_type ); ?></strong></span>
												<?php endif; ?>
												<?php if ( ! empty( $shortlist ) ) : ?>
													<br><span style="font-size:11px; color:#666;">
														<?php
														$item_names = array_map( function( $item ) {
															return is_array( $item ) ? ($item['name'] ?? '') : '';
														}, $shortlist );
														echo esc_html( implode( ', ', array_slice( array_filter( $item_names ), 0, 3 ) ) . ( count( $item_names ) > 3 ? '…' : '' ) );
														?>
													</span>
												<?php endif; ?>
											<?php elseif ( ! empty( $entry->product_name ) ) : ?>
												<strong><?php echo esc_html( $entry->product_name ); ?></strong>
												<?php if ( ! empty( $entry->product_sku ) ) : ?>
													<span style="font-size:11px; color:#888;"> (SKU: <?php echo esc_html( $entry->product_sku ); ?>)</span>
												<?php endif; ?>
												<?php if ( ! empty( $entry->finish_preference ) ) : ?>
													<br><span style="color:#666; font-size:12px;">Finish: <strong><?php echo esc_html( $entry->finish_preference ); ?></strong></span>
												<?php endif; ?>
											<?php elseif ( ! empty( $shortlist ) ) : ?>
												<strong>📦 Shortlisted Items (<?php echo count( $shortlist ); ?> Products)</strong>
												<br><span style="font-size:11px; color:#666;">
													<?php
													$item_names = array_map( function( $item ) {
														return is_array( $item ) ? ($item['name'] ?? '') : '';
													}, $shortlist );
													echo esc_html( implode( ', ', array_slice( array_filter( $item_names ), 0, 3 ) ) . ( count( $item_names ) > 3 ? '…' : '' ) );
													?>
												</span>
											<?php else : ?>
												<strong><?php echo esc_html( ! empty( $entry->project_type ) ? $entry->project_type : 'General Specification' ); ?></strong>
											<?php endif; ?>

											<?php if ( ! empty( $entry->notes ) ) : ?>
												<p style="margin:4px 0 0; font-size:11.5px; color:#555; font-style:italic;">
													"<?php echo esc_html( wp_trim_words( $entry->notes, 8 ) ); ?>"
												</p>
											<?php endif; ?>
										</div>
									</div>
								</td>
								<td><strong><?php echo esc_html( $entry->quantity ); ?></strong></td>
								<td>
									<form method="post" action="">
										<?php wp_nonce_field( 'hcc_status_nonce' ); ?>
										<input type="hidden" name="entry_id" value="<?php echo intval( $entry->id ); ?>" />
										<select name="status" onchange="this.form.submit()" style="font-size:11.5px; padding:2px 4px; background:<?php echo $status_bg; ?>; color:<?php echo $status_fg; ?>; border-color:<?php echo $status_fg; ?>; font-weight:600; border-radius:4px;">
											<option value="new" <?php selected( $entry->status, 'new' ); ?>>New (Booking Received)</option>
											<option value="in_review" <?php selected( $entry->status, 'in_review' ); ?>>In Review (CAD Review)</option>
											<option value="quoted" <?php selected( $entry->status, 'quoted' ); ?>>Quoted (Proforma)</option>
											<option value="in_production" <?php selected( $entry->status, 'in_production' ); ?>>In Production (Seasoning)</option>
											<option value="qc_packing" <?php selected( $entry->status, 'qc_packing' ); ?>>QC &amp; Packing (ISPM-15)</option>
											<option value="dispatched" <?php selected( $entry->status, 'dispatched' ); ?>>Dispatched (Ocean Transit)</option>
											<option value="closed" <?php selected( $entry->status, 'closed' ); ?>>Closed</option>
										</select>
										<input type="hidden" name="hcc_update_status" value="1" />
									</form>
								</td>
								<td><span style="font-size:12px;"><?php echo esc_html( date( 'M j, Y g:i a', strtotime( $entry->created_at ) ) ); ?></span></td>
								<td>
									<button type="button" class="button button-secondary button-small" onclick="hccShowDetails(<?php echo htmlspecialchars( wp_json_encode( $entry ), ENT_QUOTES, 'UTF-8' ); ?>)" style="margin-bottom:4px; font-size:11px;">
										🔍 Details
									</button>
									<br>
									<?php
									$delete_url = wp_nonce_url( admin_url( 'admin.php?page=hcc-form-submissions&action=delete&id=' . $entry->id ), 'hcc_delete_entry_' . $entry->id );
									?>
									<a href="<?php echo esc_url( $delete_url ); ?>" onclick="return confirm('Are you sure you want to delete this submission?')" style="color:#d9534f; text-decoration:none; font-size:11px; font-weight:600;">Delete</a>
								</td>
							</tr>
						<?php endforeach; ?>
					<?php endif; ?>
				</tbody>
			</table>
		</div>

		<!-- RICH ADMIN SUBMISSION DETAIL MODAL -->
		<div style="display:none;">
			<?php wp_nonce_field( 'hcc_milestone_nonce', 'hcc_milestone_nonce_field' ); ?>
		</div>
		<div id="hcc-detail-modal-overlay" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:99999; align-items:center; justify-content:center; padding:20px;">
			<div style="background:#fff; border-radius:8px; width:min(720px, 95vw); max-height:90vh; overflow-y:auto; padding:24px; box-shadow:0 10px 30px rgba(0,0,0,0.3); position:relative;">
				<button type="button" onclick="hccCloseDetails()" style="position:absolute; top:16px; right:16px; background:none; border:none; font-size:22px; cursor:pointer; color:#666;">✕</button>
				<h2 id="hcc-modal-title" style="margin-top:0; font-size:20px; color:#0E5C63;">Submission Details</h2>
				<hr>
				<div id="hcc-modal-content"></div>
			</div>
		</div>

		<script>
		var fallbackSvgData = 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%3E%3Crect%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23f4f4f4%22%20rx%3D%224%22%2F%3E%3Cpath%20d%3D%22M12%2028l5-6%204%205%205-7%206%208H12z%22%20fill%3D%22%230e5c63%22%20opacity%3D%220.35%22%2F%3E%3Ccircle%20cx%3D%2216%22%20cy%3D%2216%22%20r%3D%223%22%20fill%3D%22%230e5c63%22%20opacity%3D%220.35%22%2F%3E%3C%2Fsvg%3E';
		var pluginCategoriesUrl = '<?php echo esc_js( plugins_url( "assets/categories/", dirname( __DIR__, 2 ) . "/headless-commerce-core.php" ) ); ?>';
		var pluginFallbackUrl = '<?php echo esc_js( plugins_url( "assets/fallback-product.svg", dirname( __DIR__, 2 ) . "/headless-commerce-core.php" ) ); ?>';

		function hccResolveImg(url) {
			if (!url) return pluginFallbackUrl;
			if (url.indexOf('/categories/') !== -1) {
				return pluginCategoriesUrl + url.substring(url.indexOf('/categories/') + 12);
			}
			if (url.indexOf('fallback-product.svg') !== -1) {
				return pluginFallbackUrl;
			}
			return url;
		}

		var defaultStoreCurrency = '<?php echo esc_js( function_exists( "get_woocommerce_currency" ) ? get_woocommerce_currency() : "INR" ); ?>';

		function hccGetCurSym(cur) {
			cur = (cur || defaultStoreCurrency).toUpperCase();
			if (cur === 'INR') return '₹';
			if (cur === 'EUR') return '€';
			if (cur === 'GBP') return '£';
			if (cur === 'AED') return 'AED ';
			return '$';
		}

		window.hccRecalcPricing = function() {
			var curSelect = document.getElementById('hcc_invoice_currency');
			var cur = (curSelect ? curSelect.value : defaultStoreCurrency).toUpperCase();
			var sym = hccGetCurSym(cur);
			var symEls = document.querySelectorAll('.hcc-cur-sym');
			for (var i = 0; i < symEls.length; i++) {
				symEls[i].textContent = sym;
			}

			var subtotal = 0;
			var unitInputs = document.querySelectorAll('.hcc-unit-price-input');
			for (var j = 0; j < unitInputs.length; j++) {
				var inp = unitInputs[j];
				var qty = parseFloat(inp.getAttribute('data-qty')) || 1;
				var uPrice = parseFloat(inp.value) || 0;
				var lineTotal = qty * uPrice;
				subtotal += lineTotal;
				var lineEl = document.getElementById('hcc_line_total_' + inp.getAttribute('data-item-id'));
				if (lineEl) {
					lineEl.textContent = sym + lineTotal.toLocaleString();
				}
			}

			var subtotalInp = document.getElementById('hcc_invoice_subtotal');
			if (subtotalInp && !subtotalInp.dataset.manual) {
				subtotalInp.value = Math.round(subtotal);
			}
			var curSub = parseFloat(subtotalInp ? subtotalInp.value : subtotal) || 0;

			var packingInp = document.getElementById('hcc_invoice_packing');
			if (packingInp && !packingInp.dataset.manual) {
				packingInp.value = Math.round(curSub * 0.05);
			}
			var curPack = parseFloat(packingInp ? packingInp.value : 0) || 0;

			var freightInp = document.getElementById('hcc_invoice_freight');
			if (freightInp && !freightInp.dataset.manual) {
				freightInp.value = Math.round(curSub * 0.08);
			}
			var curFreight = parseFloat(freightInp ? freightInp.value : 0) || 0;

			var totalInp = document.getElementById('hcc_invoice_total');
			if (totalInp) {
				totalInp.value = Math.round(curSub + curPack + curFreight);
			}
		};

		function hccShowDetails(entry) {
			var modal = document.getElementById('hcc-detail-modal-overlay');
			var title = document.getElementById('hcc-modal-title');
			var content = document.getElementById('hcc-modal-content');

			title.innerText = 'Submission Details [' + entry.reference_id + ']';

			var originTitle = entry.source_title || 'Direct Form';
			var originUrl = entry.source_page || entry.product_url || '';

			var html = '<table class="widefat striped" style="margin-bottom:16px;">';
			html += '<tr><td style="width:160px; font-weight:600;">Form Type:</td><td><strong>' + (entry.form_type || 'Quote Enquiry') + '</strong></td></tr>';
			html += '<tr><td style="font-weight:600;">Origin / Query Source:</td><td><strong>' + originTitle + '</strong>';
			if (originUrl) {
				html += '<br><a href="' + originUrl + '" target="_blank" style="color:#0E5C63; font-weight:600; font-size:12px;">🔗 ' + originUrl + ' ↗</a>';
			}
			html += '</td></tr>';
			html += '<tr><td style="font-weight:600;">Client Name:</td><td>' + (entry.full_name || '-') + '</td></tr>';
			if (entry.company) html += '<tr><td style="font-weight:600;">Company / Firm:</td><td>' + entry.company + '</td></tr>';
			html += '<tr><td style="font-weight:600;">Email:</td><td><a href="mailto:' + entry.email + '">' + entry.email + '</a></td></tr>';
			html += '<tr><td style="font-weight:600;">Phone / WhatsApp:</td><td><a href="tel:' + entry.phone + '">' + entry.phone + '</a></td></tr>';

			var accText = entry.account_status || 'Guest';
			if (entry.user_id && parseInt(entry.user_id) > 0) {
				accText = 'Customer Account #' + entry.user_id + ' (Registered)';
			}
			html += '<tr><td style="font-weight:600;">Customer Account:</td><td><span style="background:#e8f0fe; color:#1a73e8; padding:2px 8px; border-radius:3px; font-weight:600;">' + accText + '</span></td></tr>';
			if (entry.tax_id) html += '<tr><td style="font-weight:600;">GST / Tax ID:</td><td><code>' + entry.tax_id + '</code></td></tr>';
			html += '<tr><td style="font-weight:600;">Submission Date:</td><td>' + entry.created_at + '</td></tr>';
			html += '</table>';

			// Shipping / Site Address
			if (entry.shipping_address) {
				try {
					var addr = typeof entry.shipping_address === 'string' ? JSON.parse(entry.shipping_address) : entry.shipping_address;
					if (typeof addr === 'object' && addr !== null) {
						html += '<h3 style="margin-top:16px; margin-bottom:8px; font-size:15px; border-bottom:1px solid #ccc; padding-bottom:4px;">🚚 Consignee Project Site & Freight Destination</h3>';
						html += '<table class="widefat striped" style="margin-bottom:16px;">';
						if (addr.street) html += '<tr><td style="width:160px; font-weight:600;">Street Address:</td><td>' + addr.street + '</td></tr>';
						var loc = [addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean).join(', ');
						if (loc) html += '<tr><td style="font-weight:600;">City / State / Postal:</td><td>' + loc + '</td></tr>';
						if (addr.siteAccessNotes) html += '<tr><td style="font-weight:600;">Site Access Conditions:</td><td>' + addr.siteAccessNotes + '</td></tr>';
						html += '</table>';
					} else if (typeof entry.shipping_address === 'string') {
						html += '<h3 style="margin-top:16px; margin-bottom:8px; font-size:15px; border-bottom:1px solid #ccc; padding-bottom:4px;">🚚 Delivery Location</h3>';
						html += '<div style="background:#f9f9f9; border:1px solid #ddd; padding:10px; border-radius:4px;">' + entry.shipping_address + '</div>';
					}
				} catch(e) {}
			}

			// Booking Data (Commercial Order)
			if (entry.booking_data) {
				try {
					var bData = typeof entry.booking_data === 'string' ? JSON.parse(entry.booking_data) : entry.booking_data;
					if (bData && typeof bData === 'object') {
						html += '<h3 style="margin-top:16px; margin-bottom:8px; font-size:15px; border-bottom:1px solid #ccc; padding-bottom:4px;">📋 Commercial Order Booking Specifications</h3>';
						html += '<table class="widefat striped" style="margin-bottom:16px;">';
						if (bData.projectName) html += '<tr><td style="width:160px; font-weight:600;">Project Name:</td><td><strong>' + bData.projectName + '</strong></td></tr>';
						if (bData.totalPieces) html += '<tr><td style="font-weight:600;">Total Pieces:</td><td>' + bData.totalPieces + ' units (~' + (bData.estimatedCbm || '0.00') + ' CBM)</td></tr>';
						if (bData.targetDeliveryDate) html += '<tr><td style="font-weight:600;">Target Handover:</td><td>' + bData.targetDeliveryDate + '</td></tr>';
						html += '</table>';

						var curCurrency = (bData.invoice && bData.invoice.currency) ? bData.invoice.currency.toUpperCase() : defaultStoreCurrency;
						var curSym = hccGetCurSym(curCurrency);
						var curInvoiceNum = (bData.invoice && bData.invoice.invoiceNumber) ? bData.invoice.invoiceNumber : 'PI-2026-' + (entry.reference_id ? entry.reference_id.replace(/\D/g, '').slice(-4) : '8675');
						var initialSubtotal = 0;
						if (Array.isArray(bData.items) && bData.items.length > 0) {
							bData.items.forEach(function(it) {
								initialSubtotal += (it.quantity || 1) * ((typeof it.unitPrice === 'number') ? it.unitPrice : 0);
							});
						}
						var curSubtotal = (bData.invoice && typeof bData.invoice.subtotal === 'number') ? bData.invoice.subtotal : initialSubtotal;
						var curPacking = (bData.invoice && typeof bData.invoice.packingAndCrating === 'number') ? bData.invoice.packingAndCrating : Math.round(curSubtotal * 0.05);
						var curFreight = (bData.invoice && typeof bData.invoice.estimatedFreight === 'number') ? bData.invoice.estimatedFreight : Math.round(curSubtotal * 0.08);
						var curTotal = (bData.invoice && typeof bData.invoice.totalAmount === 'number') ? bData.invoice.totalAmount : (curSubtotal + curPacking + curFreight);
						var curTerms = (bData.invoice && bData.invoice.paymentTerms) ? bData.invoice.paymentTerms : '50% Advance via Bank Wire / SWIFT upon CAD sign-off, 50% balance against Bill of Lading copy.';

						// MILESTONE & LOGISTICS MANAGEMENT CARD FOR WEBSITE OWNER / ADMIN
						var activeStage = 1;
						if (Array.isArray(bData.milestones)) {
							var activeIdx = bData.milestones.findIndex(function(m) { return m.active; });
							if (activeIdx >= 0) {
								activeStage = activeIdx + 1;
							} else {
								var allDone = bData.milestones.every(function(m) { return m.completed; });
								if (allDone) activeStage = 6;
							}
						}

						var curNote = (bData.logistics && bData.logistics.currentMilestoneNote) ? bData.logistics.currentMilestoneNote : '';
						var curTracking = (bData.logistics && bData.logistics.trackingNumber) ? bData.logistics.trackingNumber : '';
						var curCarrier = (bData.logistics && bData.logistics.carrier) ? bData.logistics.carrier : 'Maersk Global Logistics';
						var curVessel = (bData.logistics && bData.logistics.vesselName) ? bData.logistics.vesselName : '';
						var curOriginPort = (bData.logistics && bData.logistics.originPort) ? bData.logistics.originPort : 'Mundra Port, Gujarat (INMUN1)';
						var curDestPort = (bData.logistics && bData.logistics.destinationPort) ? bData.logistics.destinationPort : '';
						var curEta = (bData.logistics && bData.logistics.estimatedDelivery) ? bData.logistics.estimatedDelivery : (bData.targetDeliveryDate || 'Within 60 working days');
						var nonceEl = document.getElementById('hcc_milestone_nonce_field');
						var nonceVal = nonceEl ? nonceEl.value : '';

						html += '<form method="post" action="admin.php?page=hcc-form-submissions">';
						html += '<input type="hidden" name="_wpnonce" value="' + nonceVal + '" />';
						html += '<input type="hidden" name="hcc_update_milestones" value="1" />';
						html += '<input type="hidden" name="entry_id" value="' + entry.id + '" />';

						// 1. COMMERCIAL VALUATION & QUOTATION CARD
						html += '<div style="margin-top:20px; background:#FFFFFF; border:1.5px solid #0284C7; border-radius:8px; padding:18px; box-shadow:0 2px 6px rgba(2,132,199,0.08); margin-bottom:20px;">';
						html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">';
						html += '<h3 style="margin:0; font-size:16px; color:#0369A1; display:flex; align-items:center; gap:8px;"><span>💰</span> Commercial Valuation &amp; Proforma Invoice Quote</h3>';
						html += '<span style="background:#0284C7; color:#fff; font-size:11px; padding:3px 8px; border-radius:4px; font-weight:600;">Website Owner Pricing Control</span>';
						html += '</div>';
						html += '<p style="margin:0 0 14px; font-size:12.5px; color:#475569;">Specify individual item unit prices, commercial currency, crating, freight, and terms. Changes synchronize to the client\'s Order Tracking and Proforma Invoice portal.</p>';

						// Invoice # and Currency Row
						html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px; background:#F0F9FF; padding:12px; border-radius:6px; border:1px solid #BAE6FD;">';
						html += '<div>';
						html += '<label style="display:block; font-size:12px; font-weight:700; color:#0369A1; margin-bottom:4px;">Commercial Currency</label>';
						html += '<select name="invoice_currency" id="hcc_invoice_currency" onchange="hccRecalcPricing()" style="width:100%; font-size:13px; font-weight:700; padding:5px 8px; border-radius:4px; border:1px solid #7DD3FC;">';
						var currencies = [
							{ code: 'USD', label: 'USD ($ - US Dollar)' },
							{ code: 'INR', label: 'INR (₹ - Indian Rupee)' },
							{ code: 'EUR', label: 'EUR (€ - Euro)' },
							{ code: 'GBP', label: 'GBP (£ - British Pound)' },
							{ code: 'AED', label: 'AED (AED - UAE Dirham)' }
						];
						currencies.forEach(function(c) {
							html += '<option value="' + c.code + '"' + (curCurrency === c.code ? ' selected' : '') + '>' + c.label + '</option>';
						});
						html += '</select>';
						html += '</div>';

						html += '<div>';
						html += '<label style="display:block; font-size:12px; font-weight:700; color:#0369A1; margin-bottom:4px;">Proforma Invoice Number</label>';
						html += '<input type="text" name="invoice_number" value="' + curInvoiceNum + '" style="width:100%; font-family:monospace; font-weight:700; font-size:13px;" />';
						html += '</div>';
						html += '</div>';

						// Ordered Items Table with Editable Unit Prices
						if (Array.isArray(bData.items) && bData.items.length > 0) {
							html += '<label style="display:block; font-size:13px; font-weight:700; color:#0F172A; margin-bottom:6px;">Line Item Quotation &amp; Piece Pricing (' + bData.items.length + ' Items):</label>';
							html += '<table class="widefat striped" style="margin-bottom:14px;"><thead><tr><th style="width:40px;">Img</th><th>Item Specification</th><th style="width:60px; text-align:center;">Qty</th><th style="width:120px;">Unit Price (<span class="hcc-cur-sym">' + curSym + '</span>)</th><th style="width:120px; text-align:right;">Line Total</th></tr></thead><tbody>';
							bData.items.forEach(function(item, idx) {
								var itemImg = hccResolveImg(item.image);
								var itemId = item.id ? String(item.id) : String(idx);
								var itemQty = item.quantity || 1;
								var itemUnitPrice = (typeof item.unitPrice === 'number') ? item.unitPrice : 0;
								var itemLineTotal = (typeof item.totalPrice === 'number') ? item.totalPrice : (itemQty * itemUnitPrice);
								html += '<tr>';
								html += '<td><img src="' + itemImg + '" onerror="this.onerror=null; this.src=\'' + fallbackSvgData + '\';" style="width:32px; height:32px; object-fit:cover; border-radius:4px; border:1px solid #ccc; display:block; background:#f4f4f4;" /></td>';
								html += '<td><strong>' + (item.name || item.id) + '</strong><br><span style="font-size:11px; color:#64748B;">' + (item.material || 'Solid Wood') + (item.finish ? ' &bull; ' + item.finish : '') + '</span></td>';
								html += '<td style="text-align:center; font-weight:700;">' + itemQty + '</td>';
								html += '<td><input type="number" step="any" class="hcc-unit-price-input" name="item_unit_prices[' + itemId + ']" data-qty="' + itemQty + '" data-item-id="' + itemId + '" value="' + itemUnitPrice + '" oninput="hccRecalcPricing()" style="width:100%; font-size:12.5px; font-weight:700; padding:4px 6px;" /></td>';
								html += '<td style="text-align:right; font-weight:700;" id="hcc_line_total_' + itemId + '">' + curSym + itemLineTotal.toLocaleString() + '</td>';
								html += '</tr>';
							});
							html += '</tbody></table>';
						}

						// Financial Breakdown Inputs
						html += '<div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:10px; margin-bottom:14px; background:#F8FAFC; padding:12px; border-radius:6px; border:1px solid #E2E8F0;">';
						html += '<div>';
						html += '<label style="display:block; font-size:11.5px; font-weight:600; color:#475569; margin-bottom:3px;">Subtotal (<span class="hcc-cur-sym">' + curSym + '</span>)</label>';
						html += '<input type="number" step="any" name="invoice_subtotal" id="hcc_invoice_subtotal" value="' + curSubtotal + '" oninput="this.dataset.manual=\'1\'; hccRecalcPricing();" style="width:100%; font-size:13px; font-weight:600;" />';
						html += '</div>';

						html += '<div>';
						html += '<label style="display:block; font-size:11.5px; font-weight:600; color:#475569; margin-bottom:3px;">Crating 5% (<span class="hcc-cur-sym">' + curSym + '</span>)</label>';
						html += '<input type="number" step="any" name="invoice_packing" id="hcc_invoice_packing" value="' + curPacking + '" oninput="this.dataset.manual=\'1\'; hccRecalcPricing();" style="width:100%; font-size:13px;" />';
						html += '</div>';

						html += '<div>';
						html += '<label style="display:block; font-size:11.5px; font-weight:600; color:#475569; margin-bottom:3px;">Freight 8% (<span class="hcc-cur-sym">' + curSym + '</span>)</label>';
						html += '<input type="number" step="any" name="invoice_freight" id="hcc_invoice_freight" value="' + curFreight + '" oninput="this.dataset.manual=\'1\'; hccRecalcPricing();" style="width:100%; font-size:13px;" />';
						html += '</div>';

						html += '<div>';
						html += '<label style="display:block; font-size:11.5px; font-weight:700; color:#0369A1; margin-bottom:3px;">Total Valuation (<span class="hcc-cur-sym">' + curSym + '</span>)</label>';
						html += '<input type="number" step="any" name="invoice_total" id="hcc_invoice_total" value="' + curTotal + '" style="width:100%; font-size:14px; font-weight:800; color:#0369A1;" />';
						html += '</div>';
						html += '</div>';

						// Commercial Payment Terms
						html += '<div style="margin-bottom:8px;">';
						html += '<label style="display:block; font-size:12px; font-weight:600; color:#334155; margin-bottom:3px;">Commercial Payment Terms:</label>';
						html += '<textarea name="invoice_terms" rows="2" style="width:100%; font-size:12.5px; padding:6px 8px; border-radius:4px; border:1px solid #CBD5E1;">' + curTerms + '</textarea>';
						html += '</div>';
						html += '</div>';

						// 2. PRODUCTION & EXPORT MILESTONE CONTROL CARD
						html += '<div style="margin-top:20px; background:#F8FAFC; border:1.5px solid #0E5C63; border-radius:8px; padding:18px; box-shadow:0 2px 6px rgba(14,92,99,0.08);">';
						html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">';
						html += '<h3 style="margin:0; font-size:16px; color:#0E5C63; display:flex; align-items:center; gap:8px;"><span>🏭</span> Production &amp; Export Milestone Control</h3>';
						html += '<span style="background:#0E5C63; color:#fff; font-size:11px; padding:3px 8px; border-radius:4px; font-weight:600;">Live Customer Portal Sync</span>';
						html += '</div>';
						html += '<p style="margin:0 0 16px; font-size:12.5px; color:#475569;">Update manufacturing stage, factory floor notes, and ocean logistics. Changes immediately synchronize to the customer\'s order tracking portal.</p>';

						// STAGE SELECTOR
						html += '<div style="margin-bottom:14px;">';
						html += '<label style="display:block; font-weight:600; font-size:13px; margin-bottom:4px; color:#0F172A;">Active Production Stage:</label>';
						html += '<select name="milestone_stage" style="width:100%; max-width:480px; font-size:13px; font-weight:600; padding:6px 10px; border-radius:5px; border:1px solid #94A3B8;">';
						var stages = [
							{ val: 1, label: 'Stage 1: Commercial Booking Received (Factory Queue)' },
							{ val: 2, label: 'Stage 2: CAD Engineering & Material Verification' },
							{ val: 3, label: 'Stage 3: Commercial Proposal & Proforma Invoice Issued' },
							{ val: 4, label: 'Stage 4: Timber Seasoning & Joinery Crafting' },
							{ val: 5, label: 'Stage 5: Final QC Inspection & Export Crating' },
							{ val: 6, label: 'Stage 6: Container Loaded & Dispatched (Mundra Port)' }
						];
						stages.forEach(function(s) {
							html += '<option value="' + s.val + '"' + (activeStage === s.val ? ' selected' : '') + '>' + s.label + '</option>';
						});
						html += '</select>';
						html += '</div>';

						// LIVE FACTORY NOTE
						html += '<div style="margin-bottom:14px;">';
						html += '<label style="display:block; font-weight:600; font-size:13px; margin-bottom:4px; color:#0F172A;">Current Live Note / Factory Update (Visible to Client):</label>';
						html += '<textarea name="milestone_note" rows="2" style="width:100%; font-size:13px; padding:8px 10px; border-radius:5px; border:1px solid #94A3B8;" placeholder="e.g. Kiln-drying completed to 8.5% EMC. Master carving and joinery active on shop floor.">' + curNote + '</textarea>';
						html += '</div>';

						// LOGISTICS GRID
						html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">';
						html += '<div>';
						html += '<label style="display:block; font-size:12px; font-weight:600; color:#334155; margin-bottom:3px;">Container / Tracking #</label>';
						html += '<input type="text" name="tracking_number" value="' + curTracking + '" style="width:100%; font-family:monospace; font-size:13px; font-weight:600;" placeholder="e.g. MSKU-820491-9" />';
						html += '</div>';
						html += '<div>';
						html += '<label style="display:block; font-size:12px; font-weight:600; color:#334155; margin-bottom:3px;">Carrier / Ocean Line</label>';
						html += '<input type="text" name="carrier" value="' + curCarrier + '" style="width:100%; font-size:13px;" placeholder="e.g. Maersk Global Logistics" />';
						html += '</div>';
						html += '<div>';
						html += '<label style="display:block; font-size:12px; font-weight:600; color:#334155; margin-bottom:3px;">Vessel Name &amp; Voyage</label>';
						html += '<input type="text" name="vessel_name" value="' + curVessel + '" style="width:100%; font-size:13px;" placeholder="e.g. MV Rajasthan Express (Voyage 2608)" />';
						html += '</div>';
						html += '<div>';
						html += '<label style="display:block; font-size:12px; font-weight:600; color:#334155; margin-bottom:3px;">Estimated Handover / ETD</label>';
						html += '<input type="text" name="estimated_delivery" value="' + curEta + '" style="width:100%; font-size:13px;" placeholder="e.g. Within 60 working days" />';
						html += '</div>';
						html += '<div>';
						html += '<label style="display:block; font-size:12px; font-weight:600; color:#334155; margin-bottom:3px;">Port of Loading (POL)</label>';
						html += '<input type="text" name="origin_port" value="' + curOriginPort + '" style="width:100%; font-size:13px;" placeholder="e.g. Mundra Port, Gujarat (INMUN1)" />';
						html += '</div>';
						html += '<div>';
						html += '<label style="display:block; font-size:12px; font-weight:600; color:#334155; margin-bottom:3px;">Port of Discharge (POD)</label>';
						html += '<input type="text" name="destination_port" value="' + curDestPort + '" style="width:100%; font-size:13px;" placeholder="e.g. Destination Port" />';
						html += '</div>';
						html += '</div>';

						html += '<button type="submit" class="button button-primary" style="background:#0E5C63; border-color:#0E5C63; font-weight:700; padding:8px 22px; font-size:13.5px; height:auto; display:flex; align-items:center; gap:8px;">';
						html += '💾 Save Commercial Valuation, Milestones &amp; Sync to Customer Portal';
						html += '</button>';
						html += '</div>';
						html += '</form>';
					}
				} catch(e) {}
			}

			// Single Target Product
			if (entry.product_name && !entry.booking_data) {
				html += '<h3 style="margin-top:16px; margin-bottom:8px; font-size:15px; border-bottom:1px solid #ccc; padding-bottom:4px;">Target Product &amp; Specifications</h3>';
				var modalImg = entry.resolved_product_image ? entry.resolved_product_image : hccResolveImg(entry.product_image);
				if (modalImg) {
					html += '<div style="display:flex; gap:16px; align-items:center; margin-bottom:16px; background:#f9f9f9; padding:12px; border-radius:6px; border:1px solid #e2e8f0;">';
					html += '<img src="' + modalImg + '" onerror="this.onerror=null; this.src=\'' + fallbackSvgData + '\';" style="width:64px; height:64px; object-fit:cover; border-radius:4px; border:1px solid #cbd5e1; flex-shrink:0; background:#fff;" />';
					html += '<div>';
					html += '<strong style="font-size:15px; color:#0f172a;">' + entry.product_name + '</strong>';
					if (entry.product_sku) html += '<span style="font-size:12px; color:#64748b; margin-left:8px;">SKU: <code>' + entry.product_sku + '</code></span>';
					if (entry.product_url) html += '<br><a href="' + entry.product_url + '" target="_blank" style="font-size:12px; color:#0E5C63; font-weight:600;">🔗 View Product Page ↗</a>';
					html += '</div></div>';
				}
				html += '<table class="widefat striped" style="margin-bottom:16px;">';
				if (!modalImg) html += '<tr><td style="width:160px; font-weight:600;">Product Name:</td><td><strong>' + entry.product_name + '</strong></td></tr>';
				if (entry.finish_preference) html += '<tr><td style="width:160px; font-weight:600;">Finish Preference:</td><td>' + entry.finish_preference + '</td></tr>';
				if (entry.quantity) html += '<tr><td style="width:160px; font-weight:600;">Quantity:</td><td><strong>' + entry.quantity + ' units</strong></td></tr>';
				if (entry.project_type) html += '<tr><td style="width:160px; font-weight:600;">Project Domain:</td><td>' + entry.project_type + '</td></tr>';
				html += '</table>';
			}

			if (entry.notes) {
				html += '<h3 style="margin-top:16px; margin-bottom:8px; font-size:15px; border-bottom:1px solid #ccc; padding-bottom:4px;">Client Project Notes / Brief</h3>';
				html += '<div style="background:#f9f9f9; border:1px solid #ddd; padding:12px; border-radius:4px; font-style:italic; line-height:1.5;">' + entry.notes.replace(/\n/g, '<br>') + '</div>';
			}

			if (entry.booking_data) {
				try {
					var bDataRaw = typeof entry.booking_data === 'string' ? JSON.parse(entry.booking_data) : entry.booking_data;
					if (bDataRaw && bDataRaw.custom_fields && typeof bDataRaw.custom_fields === 'object') {
						html += '<h3 style="margin-top:16px; margin-bottom:8px; font-size:15px; border-bottom:1px solid #ccc; padding-bottom:4px;">📋 Submitted Specifications &amp; Responses</h3>';
						html += '<table class="widefat striped" style="margin-bottom:16px;">';
						for (var k in bDataRaw.custom_fields) {
							if (bDataRaw.custom_fields.hasOwnProperty(k)) {
								var val = bDataRaw.custom_fields[k];
								var displayVal = Array.isArray(val) ? val.join(', ') : (typeof val === 'object' ? JSON.stringify(val) : String(val));
								var labelFormatted = k.replace(/_/g, ' ').replace(/\b\w/g, function(l){ return l.toUpperCase(); });
								html += '<tr><td style="width:220px; font-weight:600;">' + labelFormatted + ':</td><td>' + displayVal + '</td></tr>';
							}
						}
						html += '</table>';
					}
					if (bDataRaw && Array.isArray(bDataRaw.uploaded_files) && bDataRaw.uploaded_files.length > 0) {
						html += '<h3 style="margin-top:16px; margin-bottom:8px; font-size:15px; border-bottom:1px solid #ccc; padding-bottom:4px;">📎 Attached Documents &amp; Files</h3>';
						html += '<ul style="list-style:disc; margin-left:20px;">';
						bDataRaw.uploaded_files.forEach(function(fileUrl) {
							html += '<li><a href="' + fileUrl + '" target="_blank" style="color:#0E5C63; font-weight:600;">' + fileUrl.split('/').pop() + ' ↗</a></li>';
						});
						html += '</ul>';
					}
				} catch(e) {}
			}

			if (entry.shortlist_items && !entry.booking_data) {
				try {
					var items = typeof entry.shortlist_items === 'string' ? JSON.parse(entry.shortlist_items) : entry.shortlist_items;
					if (Array.isArray(items) && items.length > 0) {
						html += '<h3 style="margin-top:16px; margin-bottom:8px; font-size:15px; border-bottom:1px solid #ccc; padding-bottom:4px;">Shortlisted Products (' + items.length + ')</h3>';
						html += '<table class="widefat striped"><thead><tr><th style="width:50px;">Preview</th><th>Product Name &amp; Direct Link</th><th style="width:80px;">Qty</th></tr></thead><tbody>';
						items.forEach(function(item) {
							var itemUrl = item.url || (item.id ? ('https://orbitexpocrafts.com/product/' + item.id) : '');
							var itemImg = hccResolveImg(item.image);
							html += '<tr>';
							html += '<td><img src="' + itemImg + '" onerror="this.onerror=null; this.src=\'' + fallbackSvgData + '\';" style="width:36px; height:36px; object-fit:cover; border-radius:4px; border:1px solid #ccc; display:block; background:#f4f4f4;" /></td>';
							html += '<td><strong>' + (item.name || item.id) + '</strong>';
							if (itemUrl) {
								html += '<br><a href="' + itemUrl + '" target="_blank" style="font-size:11.5px; color:#0E5C63; font-weight:600;">🔗 View Product Page ↗</a>';
							}
							html += '</td><td><strong>' + (item.quantity || item.q || 1) + '</strong></td></tr>';
						});
						html += '</tbody></table>';
					}
				} catch(e) {}
			}

			content.innerHTML = html;
			modal.style.display = 'flex';
		}

		function hccCloseDetails() {
			document.getElementById('hcc-detail-modal-overlay').style.display = 'none';
		}
		</script>
		<?php
	}
}
