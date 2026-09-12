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
		} elseif ( $form_type === 'interior_designer' ) {
			$prefix = 'DES-';
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
			'product_image'     => esc_url_raw( $data['product_image'] ?? '' ),
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

		// Handle Status Update
		if ( isset( $_POST['hcc_update_status'] ) && isset( $_POST['entry_id'] ) && check_admin_referer( 'hcc_status_nonce' ) ) {
			$entry_id = intval( $_POST['entry_id'] );
			$new_status = sanitize_text_field( $_POST['status'] );
			$wpdb->update( $table_name, array( 'status' => $new_status ), array( 'id' => $entry_id ) );
			wp_safe_redirect( admin_url( 'admin.php?page=hcc-form-submissions&updated=1' ) );
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
						<option value="admin.php?page=hcc-form-submissions&status=new" <?php selected( $status_filter, 'new' ); ?>>New</option>
						<option value="admin.php?page=hcc-form-submissions&status=in_review" <?php selected( $status_filter, 'in_review' ); ?>>In Review</option>
						<option value="admin.php?page=hcc-form-submissions&status=quoted" <?php selected( $status_filter, 'quoted' ); ?>>Quoted</option>
						<option value="admin.php?page=hcc-form-submissions&status=dispatched" <?php selected( $status_filter, 'dispatched' ); ?>>Dispatched</option>
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
										<?php if ( ! empty( $entry->product_image ) ) : ?>
											<img src="<?php echo esc_url( $entry->product_image ); ?>" style="width:40px; height:40px; object-fit:cover; border-radius:4px; border:1px solid #ccc; flex-shrink:0;" />
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
											<option value="new" <?php selected( $entry->status, 'new' ); ?>>New</option>
											<option value="in_review" <?php selected( $entry->status, 'in_review' ); ?>>In Review</option>
											<option value="quoted" <?php selected( $entry->status, 'quoted' ); ?>>Quoted</option>
											<option value="dispatched" <?php selected( $entry->status, 'dispatched' ); ?>>Dispatched</option>
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
		<div id="hcc-detail-modal-overlay" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:99999; align-items:center; justify-content:center; padding:20px;">
			<div style="background:#fff; border-radius:8px; width:min(720px, 95vw); max-height:90vh; overflow-y:auto; padding:24px; box-shadow:0 10px 30px rgba(0,0,0,0.3); position:relative;">
				<button type="button" onclick="hccCloseDetails()" style="position:absolute; top:16px; right:16px; background:none; border:none; font-size:22px; cursor:pointer; color:#666;">✕</button>
				<h2 id="hcc-modal-title" style="margin-top:0; font-size:20px; color:#0E5C63;">Submission Details</h2>
				<hr>
				<div id="hcc-modal-content"></div>
			</div>
		</div>

		<script>
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
						if (bData.invoice) {
							html += '<tr><td style="font-weight:600;">Proforma Invoice:</td><td><strong>#' + (bData.invoice.invoiceNumber || '-') + '</strong> &bull; Total Valuation: <strong>$' + (bData.invoice.totalAmount ? Number(bData.invoice.totalAmount).toLocaleString() : '0') + ' USD</strong></td></tr>';
							html += '<tr><td style="font-weight:600;">Payment Terms:</td><td style="font-size:12px;">' + (bData.invoice.paymentTerms || 'Commercial SWIFT/Wire') + '</td></tr>';
						}
						html += '</table>';

						if (Array.isArray(bData.items) && bData.items.length > 0) {
							html += '<h4 style="margin:12px 0 6px;">Ordered Items (' + bData.items.length + ')</h4>';
							html += '<table class="widefat striped" style="margin-bottom:16px;"><thead><tr><th>Item</th><th style="width:90px;">Specs</th><th style="width:70px;">Qty</th><th style="width:90px;">Valuation</th></tr></thead><tbody>';
							bData.items.forEach(function(item) {
								html += '<tr><td><strong>' + (item.name || item.id) + '</strong></td>';
								html += '<td style="font-size:11.5px;">' + (item.material || 'Solid Wood') + '<br>' + (item.finish || '') + '</td>';
								html += '<td><strong>' + (item.quantity || 1) + '</strong></td>';
								html += '<td>$' + (item.totalPrice ? Number(item.totalPrice).toLocaleString() : '-') + '</td></tr>';
							});
							html += '</tbody></table>';
						}
					}
				} catch(e) {}
			}

			// Single Target Product
			if (entry.product_name && !entry.booking_data) {
				html += '<h3 style="margin-top:16px; margin-bottom:8px; font-size:15px; border-bottom:1px solid #ccc; padding-bottom:4px;">Target Product &amp; Specifications</h3>';
				html += '<table class="widefat striped" style="margin-bottom:16px;">';
				html += '<tr><td style="width:160px; font-weight:600;">Product Name:</td><td><strong>' + entry.product_name + '</strong></td></tr>';
				if (entry.product_sku) html += '<tr><td style="font-weight:600;">Product SKU:</td><td><code>' + entry.product_sku + '</code></td></tr>';
				if (entry.finish_preference) html += '<tr><td style="font-weight:600;">Finish Preference:</td><td>' + entry.finish_preference + '</td></tr>';
				if (entry.quantity) html += '<tr><td style="font-weight:600;">Quantity:</td><td><strong>' + entry.quantity + ' units</strong></td></tr>';
				if (entry.project_type) html += '<tr><td style="font-weight:600;">Project Domain:</td><td>' + entry.project_type + '</td></tr>';
				html += '</table>';
			}

			if (entry.notes) {
				html += '<h3 style="margin-top:16px; margin-bottom:8px; font-size:15px; border-bottom:1px solid #ccc; padding-bottom:4px;">Client Project Notes / Brief</h3>';
				html += '<div style="background:#f9f9f9; border:1px solid #ddd; padding:12px; border-radius:4px; font-style:italic; line-height:1.5;">' + entry.notes.replace(/\n/g, '<br>') + '</div>';
			}

			if (entry.shortlist_items && !entry.booking_data) {
				try {
					var items = typeof entry.shortlist_items === 'string' ? JSON.parse(entry.shortlist_items) : entry.shortlist_items;
					if (Array.isArray(items) && items.length > 0) {
						html += '<h3 style="margin-top:16px; margin-bottom:8px; font-size:15px; border-bottom:1px solid #ccc; padding-bottom:4px;">Shortlisted Products (' + items.length + ')</h3>';
						html += '<table class="widefat striped"><thead><tr><th>Product Name &amp; Direct Link</th><th style="width:80px;">Qty</th></tr></thead><tbody>';
						items.forEach(function(item) {
							var itemUrl = item.url || (item.id ? ('https://orbitexpocrafts.com/product/' + item.id) : '');
							html += '<tr><td><strong>' + (item.name || item.id) + '</strong>';
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
