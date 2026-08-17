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

		$sql = "CREATE TABLE IF NOT EXISTS {$table_name} (
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
			notes TEXT DEFAULT '',
			shortlist_items LONGTEXT DEFAULT '',
			status VARCHAR(50) NOT NULL DEFAULT 'new',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			KEY reference_id (reference_id),
			KEY form_type (form_type),
			KEY status (status)
		) {$charset_collate};";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );
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

		$prefix = ( $data['form_type'] === 'quote_enquiry' ) ? 'QT-' : 'REQ-';
		$ref_id = ! empty( $data['reference_id'] ) ? $data['reference_id'] : $prefix . rand( 100000, 999999 );

		$insert_data = array(
			'reference_id'      => sanitize_text_field( $ref_id ),
			'form_type'         => sanitize_text_field( $data['form_type'] ?? 'quote_enquiry' ),
			'full_name'         => sanitize_text_field( $data['full_name'] ?? '' ),
			'company'           => sanitize_text_field( $data['company'] ?? '' ),
			'email'             => sanitize_email( $data['email'] ?? '' ),
			'phone'             => sanitize_text_field( $data['phone'] ?? '' ),
			'project_type'      => sanitize_text_field( $data['project_type'] ?? '' ),
			'quantity'          => sanitize_text_field( (string)( $data['quantity'] ?? '' ) ),
			'finish_preference' => sanitize_text_field( $data['finish_preference'] ?? '' ),
			'product_name'      => sanitize_text_field( $data['product_name'] ?? '' ),
			'notes'             => sanitize_textarea_field( $data['notes'] ?? '' ),
			'shortlist_items'   => is_array( $data['shortlist_items'] ?? null ) ? wp_json_encode( $data['shortlist_items'] ) : sanitize_textarea_field( $data['shortlist_items'] ?? '' ),
			'status'            => 'new',
			'created_at'        => current_time( 'mysql' ),
		);

		$result = $wpdb->insert( $table_name, $insert_data );

		if ( false === $result ) {
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
		fputcsv( $output, array( 'ID', 'Reference ID', 'Form Type', 'Full Name', 'Company', 'Email', 'Phone', 'Project/Product', 'Quantity', 'Finish', 'Notes', 'Status', 'Date' ) );

		foreach ( $entries as $row ) {
			fputcsv( $output, array(
				$row['id'],
				$row['reference_id'],
				$row['form_type'],
				$row['full_name'],
				$row['company'],
				$row['email'],
				$row['phone'],
				! empty( $row['product_name'] ) ? $row['product_name'] : $row['project_type'],
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
			$where_clauses[] = $wpdb->prepare( '(reference_id LIKE %s OR full_name LIKE %s OR company LIKE %s OR email LIKE %s OR phone LIKE %s OR product_name LIKE %s)', $like, $like, $like, $like, $like, $like );
		}

		$where_sql = implode( ' AND ', $where_clauses );
		$entries   = $wpdb->get_results( "SELECT * FROM {$table_name} WHERE {$where_sql} ORDER BY id DESC" );

		// Counts
		$total_count  = $wpdb->get_var( "SELECT COUNT(*) FROM {$table_name}" );
		$quote_count  = $wpdb->get_var( "SELECT COUNT(*) FROM {$table_name} WHERE form_type = 'quote_enquiry'" );
		$sample_count = $wpdb->get_var( "SELECT COUNT(*) FROM {$table_name} WHERE form_type = 'finish_sample'" );
		$cad_count    = $wpdb->get_var( "SELECT COUNT(*) FROM {$table_name} WHERE form_type = 'cad_request'" );

		?>
		<div class="wrap">
			<h1 class="wp-heading-inline">Form Submissions & Enquiries</h1>
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
				<li class="quote"><a href="admin.php?page=hcc-form-submissions&type=quote_enquiry" class="<?php echo $form_type_filter === 'quote_enquiry' ? 'current' : ''; ?>">Quote Enquiries <span class="count">(<?php echo intval( $quote_count ); ?>)</span></a> |</li>
				<li class="sample"><a href="admin.php?page=hcc-form-submissions&type=finish_sample" class="<?php echo $form_type_filter === 'finish_sample' ? 'current' : ''; ?>">Finish Samples <span class="count">(<?php echo intval( $sample_count ); ?>)</span></a> |</li>
				<li class="cad"><a href="admin.php?page=hcc-form-submissions&type=cad_request" class="<?php echo $form_type_filter === 'cad_request' ? 'current' : ''; ?>">CAD 3D Requests <span class="count">(<?php echo intval( $cad_count ); ?>)</span></a></li>
			</ul>

			<!-- SEARCH FORM -->
			<form method="get" action="" style="margin-bottom: 15px; float: right;">
				<input type="hidden" name="page" value="hcc-form-submissions" />
				<?php if ( $form_type_filter !== 'all' ) : ?>
					<input type="hidden" name="type" value="<?php echo esc_attr( $form_type_filter ); ?>" />
				<?php endif; ?>
				<input type="search" name="s" value="<?php echo esc_attr( $search_query ); ?>" placeholder="Search submissions..." />
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
						<th scope="col" style="width: 110px;">Ref ID</th>
						<th scope="col" style="width: 120px;">Form Type</th>
						<th scope="col">Client Details</th>
						<th scope="col">Project / Product</th>
						<th scope="col" style="width: 80px;">Qty</th>
						<th scope="col" style="width: 130px;">Status</th>
						<th scope="col" style="width: 140px;">Date</th>
						<th scope="col" style="width: 90px;">Actions</th>
					</tr>
				</thead>
				<tbody>
					<?php if ( empty( $entries ) ) : ?>
						<tr>
							<td colspan="8">No form submissions found.</td>
						</tr>
					<?php else : ?>
						<?php foreach ( $entries as $entry ) : ?>
							<?php
							$badge_color = '#0E5C63';
							$type_label  = 'Quote Request';
							if ( $entry->form_type === 'finish_sample' ) {
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
							?>
							<tr>
								<td><strong><code><?php echo esc_html( $entry->reference_id ); ?></code></strong></td>
								<td>
									<span style="background:<?php echo $badge_color; ?>; color:#fff; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:600; display:inline-block;">
										<?php echo esc_html( $type_label ); ?>
									</span>
								</td>
								<td>
									<strong><?php echo esc_html( $entry->full_name ); ?></strong>
									<?php if ( ! empty( $entry->company ) ) : ?>
										<br><span style="color:#666; font-size:12px;">🏢 <?php echo esc_html( $entry->company ); ?></span>
									<?php endif; ?>
									<br><span style="font-size:12px;">✉️ <a href="mailto:<?php echo esc_attr( $entry->email ); ?>"><?php echo esc_html( $entry->email ); ?></a></span>
									<br><span style="font-size:12px;">📞 <?php echo esc_html( $entry->phone ); ?></span>
								</td>
								<td>
									<?php if ( ! empty( $entry->product_name ) ) : ?>
										<strong><?php echo esc_html( $entry->product_name ); ?></strong>
										<?php if ( ! empty( $entry->finish_preference ) ) : ?>
											<br><span style="color:#666; font-size:12px;">Finish: <?php echo esc_html( $entry->finish_preference ); ?></span>
										<?php endif; ?>
									<?php else : ?>
										<strong><?php echo esc_html( $entry->project_type ); ?></strong>
									<?php endif; ?>

									<?php if ( ! empty( $entry->notes ) ) : ?>
										<p style="margin:4px 0 0; font-size:12px; color:#555; font-style:italic;">
											"<?php echo esc_html( wp_trim_words( $entry->notes, 12 ) ); ?>"
										</p>
									<?php endif; ?>
								</td>
								<td><strong><?php echo esc_html( $entry->quantity ); ?></strong></td>
								<td>
									<form method="post" action="">
										<?php wp_nonce_field( 'hcc_status_nonce' ); ?>
										<input type="hidden" name="entry_id" value="<?php echo intval( $entry->id ); ?>" />
										<select name="status" onchange="this.form.submit()" style="font-size:12px; padding:2px 6px; background:<?php echo $status_bg; ?>; color:<?php echo $status_fg; ?>; border-color:<?php echo $status_fg; ?>; font-weight:600; border-radius:4px;">
											<option value="new" <?php selected( $entry->status, 'new' ); ?>>New</option>
											<option value="in_review" <?php selected( $entry->status, 'in_review' ); ?>>In Review</option>
											<option value="quoted" <?php selected( $entry->status, 'quoted' ); ?>>Quoted</option>
											<option value="dispatched" <?php selected( $entry->status, 'dispatched' ); ?>>Dispatched</option>
											<option value="closed" <?php selected( $entry->status, 'closed' ); ?>>Closed</option>
										</select>
										<input type="hidden" name="hcc_update_status" value="1" />
									</form>
								</td>
								<td><?php echo esc_html( date( 'M j, Y g:i a', strtotime( $entry->created_at ) ) ); ?></td>
								<td>
									<?php
									$delete_url = wp_nonce_url( admin_url( 'admin.php?page=hcc-form-submissions&action=delete&id=' . $entry->id ), 'hcc_delete_entry_' . $entry->id );
									?>
									<a href="<?php echo esc_url( $delete_url ); ?>" onclick="return confirm('Are you sure you want to delete this submission?')" style="color:#d9534f; text-decoration:none; font-weight:600;">Delete</a>
								</td>
							</tr>
						<?php endforeach; ?>
					<?php endif; ?>
				</tbody>
			</table>
		</div>
		<?php
	}
}
