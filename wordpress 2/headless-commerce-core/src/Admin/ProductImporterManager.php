<?php

namespace HeadlessCommerceCore\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Bulk Product CSV/Excel Importer & Upsert Manager for Orbit Expo Crafts
 */
class ProductImporterManager {

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_admin_menu' ), 25 );
		add_action( 'admin_init', array( __CLASS__, 'handle_file_download' ) );
		add_action( 'admin_init', array( __CLASS__, 'handle_csv_upload_post' ) );
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );
	}

	public static function add_admin_menu() {
		add_submenu_page(
			'headless-commerce-core',
			__( 'Bulk Product Importer', 'headless-commerce-core' ),
			__( 'Product CSV Importer', 'headless-commerce-core' ),
			'manage_options',
			'hcc-product-importer',
			array( __CLASS__, 'render_admin_page' )
		);
	}

	public static function handle_file_download() {
		if ( isset( $_GET['page'] ) && $_GET['page'] === 'hcc-product-importer' && isset( $_GET['download_template'] ) ) {
			if ( ! current_user_can( 'manage_options' ) ) {
				wp_die( 'Unauthorized' );
			}

			$csv_file = HCC_PLUGIN_DIR . 'sample_product_import_template.csv';
			if ( file_exists( $csv_file ) ) {
				header( 'Content-Type: text/csv; charset=utf-8' );
				header( 'Content-Disposition: attachment; filename="sample_product_import_template.csv"' );
				header( 'Pragma: no-cache' );
				header( 'Expires: 0' );
				readfile( $csv_file );
				exit;
			}
		}
	}

	public static function register_rest_routes() {
		register_rest_route( 'hcc/v1', '/products/import-csv', array(
			'methods'             => \WP_REST_Server::CREATABLE,
			'callback'            => array( __CLASS__, 'handle_rest_import' ),
			'permission_callback' => function() {
				return current_user_can( 'manage_options' );
			},
		) );
	}

	public static function render_admin_page() {
		$notice = get_transient( 'hcc_import_notice' );
		delete_transient( 'hcc_import_notice' );
		?>
		<div class="wrap">
			<h1 style="font-family: Georgia, serif; margin-bottom: 20px;">📦 Bulk Product CSV Importer & Sync Engine</h1>

			<?php if ( ! empty( $notice ) ) : ?>
				<div class="notice notice-<?php echo esc_attr( $notice['type'] ); ?> is-dismissible" style="padding:15px; border-left-width:5px;">
					<p style="font-size:15px;"><strong><?php echo esc_html( $notice['message'] ); ?></strong></p>
					<?php if ( ! empty( $notice['details'] ) && is_array( $notice['details'] ) ) : ?>
						<ul style="list-style:disc; margin-left:20px;">
							<?php foreach ( $notice['details'] as $detail ) : ?>
								<li><?php echo esc_html( $detail ); ?></li>
							<?php endforeach; ?>
						</ul>
					<?php endif; ?>
				</div>
			<?php endif; ?>

			<div style="background:#fff; border:1px solid #ccd0d4; padding:24px; border-radius:8px; max-width:900px; margin-bottom:24px; box-shadow:0 2px 10px rgba(0,0,0,0.04);">
				<h2 style="margin-top:0;">1. Download Official Sample CSV Template</h2>
				<p style="color:#555; line-height:1.6;">
					Download our pre-structured CSV template formatted specifically for <strong>Orbit Expo Crafts</strong>.
					It includes pre-configured columns for <strong>SKU, Department, Subcategories, Materials, Finishes, Dimensions, CAD Drawing URLs, and Multi-Image galleries</strong>.
				</p>
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=hcc-product-importer&download_template=1' ) ); ?>" class="button button-secondary" style="font-weight:600; padding:4px 16px;">
					📥 Download Sample CSV Template (.csv)
				</a>
			</div>

			<div style="background:#fff; border:1px solid #ccd0d4; padding:24px; border-radius:8px; max-width:900px; box-shadow:0 2px 10px rgba(0,0,0,0.04);">
				<h2 style="margin-top:0;">2. Upload & Sync Product Spreadsheet</h2>
				<form method="post" enctype="multipart/form-data" action="<?php echo esc_url( admin_url( 'admin.php?page=hcc-product-importer' ) ); ?>">
					<?php wp_nonce_field( 'hcc_upload_csv', 'hcc_csv_nonce' ); ?>
					
					<div style="margin-bottom:20px;">
						<label style="display:block; font-weight:600; margin-bottom:8px;">Select CSV File (.csv):</label>
						<input type="file" name="product_csv" accept=".csv, .txt" required style="padding:10px; border:1px solid #ccc; width:100%; max-width:500px; background:#f9f9f9; border-radius:4px;" />
					</div>

					<div style="background:#f0f6fc; border:1px solid #c8d7e6; padding:16px; border-radius:6px; margin-bottom:20px;">
						<h3 style="margin-top:0; font-size:14px;">⚡ Import Options:</h3>
						<label style="display:block; margin-bottom:8px;">
							<input type="checkbox" name="update_existing" value="1" checked />
							<strong>Update existing products if SKU matches</strong> (Overwrites prices, specs & custom meta without deleting product ID)
						</label>
						<label style="display:block; margin-bottom:8px;">
							<input type="checkbox" name="auto_create_categories" value="1" checked />
							<strong>Auto-create missing departments & subcategories</strong>
						</label>
						<label style="display:block;">
							<input type="checkbox" name="import_images" value="1" checked />
							<strong>Auto-attach image URLs to product media gallery</strong>
						</label>
					</div>

					<button type="submit" name="hcc_submit_csv" class="button button-primary button-hero" onclick="return confirm('Start importing product spreadsheet? Existing products with matching SKUs will be updated.');">
						🚀 Run Powerful Bulk Product Import & Sync
					</button>
				</form>
			</div>
		</div>
		<?php
	}

	public static function handle_csv_upload_post() {
		if ( ! isset( $_POST['hcc_submit_csv'] ) ) {
			return;
		}

		if ( ! current_user_can( 'manage_options' ) || ! check_admin_referer( 'hcc_upload_csv', 'hcc_csv_nonce' ) ) {
			wp_die( 'Permission denied.' );
		}

		if ( empty( $_FILES['product_csv']['tmp_name'] ) ) {
			set_transient( 'hcc_import_notice', array(
				'type'    => 'error',
				'message' => 'Please select a valid CSV file to upload.',
			), 60 );
			return;
		}

		$file_path = $_FILES['product_csv']['tmp_name'];
		$options = array(
			'update_existing'        => ! empty( $_POST['update_existing'] ),
			'auto_create_categories' => ! empty( $_POST['auto_create_categories'] ),
			'import_images'          => ! empty( $_POST['import_images'] ),
		);

		$result = self::process_csv_file( $file_path, $options );

		set_transient( 'hcc_import_notice', array(
			'type'    => 'success',
			'message' => sprintf( '✅ Bulk Import Complete! Created: %d, Updated: %d, Errors: %d', $result['created'], $result['updated'], count( $result['errors'] ) ),
			'details' => array_merge( $result['messages'], $result['errors'] ),
		), 120 );

		wp_redirect( admin_url( 'admin.php?page=hcc-product-importer' ) );
		exit;
	}

	public static function handle_rest_import( $request ) {
		$files = $request->get_file_params();
		if ( empty( $files['file']['tmp_name'] ) ) {
			return new \WP_REST_Response( array( 'error' => 'No CSV file uploaded' ), 400 );
		}

		$options = array(
			'update_existing'        => true,
			'auto_create_categories' => true,
			'import_images'          => true,
		);

		$result = self::process_csv_file( $files['file']['tmp_name'], $options );
		return new \WP_REST_Response( $result, 200 );
	}

	public static function process_csv_file( $file_path, $options = array() ) {
		if ( ! function_exists( 'wp_insert_term' ) ) {
			require_once ABSPATH . 'wp-admin/includes/taxonomy.php';
		}
		if ( ! function_exists( 'media_sideload_image' ) ) {
			require_once ABSPATH . 'wp-admin/includes/media.php';
			require_once ABSPATH . 'wp-admin/includes/file.php';
			require_once ABSPATH . 'wp-admin/includes/image.php';
		}

		$handle = fopen( $file_path, 'r' );
		if ( ! $handle ) {
			return array( 'created' => 0, 'updated' => 0, 'errors' => array( 'Failed to open CSV file.' ), 'messages' => array() );
		}

		// Detect delimiter
		$first_line = fgets( $handle );
		rewind( $handle );
		$delimiter = ( strpos( $first_line, ';' ) !== false ) ? ';' : ( ( strpos( $first_line, "\t" ) !== false ) ? "\t" : ',' );

		$headers = fgetcsv( $handle, 0, $delimiter );
		if ( ! $headers || ! is_array( $headers ) ) {
			fclose( $handle );
			return array( 'created' => 0, 'updated' => 0, 'errors' => array( 'Invalid CSV header row.' ), 'messages' => array() );
		}

		// Normalize headers
		$clean_headers = array();
		foreach ( $headers as $i => $h ) {
			$clean_headers[$i] = strtolower( trim( preg_replace( '/[^a-zA-Z0-9_]/', '', $h ) ) );
		}

		$created = 0;
		$updated = 0;
		$errors   = array();
		$messages = array();
		$row_num  = 1;

		while ( ( $row = fgetcsv( $handle, 0, $delimiter ) ) !== false ) {
			$row_num++;
			if ( empty( $row ) || ( count( $row ) === 1 && empty( $row[0] ) ) ) {
				continue;
			}

			$data = array();
			foreach ( $clean_headers as $i => $key ) {
				$data[$key] = isset( $row[$i] ) ? trim( $row[$i] ) : '';
			}

			$name = ! empty( $data['name'] ) ? $data['name'] : '';
			$sku  = ! empty( $data['sku'] ) ? $data['sku'] : '';

			if ( empty( $name ) && empty( $sku ) ) {
				continue;
			}

			if ( empty( $sku ) ) {
				$sku = 'OEC-' . strtoupper( substr( md5( $name ), 0, 6 ) );
			}

			$product_id = wc_get_product_id_by_sku( $sku );

			if ( $product_id ) {
				if ( empty( $options['update_existing'] ) ) {
					$messages[] = "Row {$row_num}: SKU {$sku} exists. Skipped.";
					continue;
				}
				$product = wc_get_product( $product_id );
				$is_new  = false;
			} else {
				$product = new \WC_Product_Simple();
				$is_new  = true;
			}

			// Core Fields
			$product->set_name( $name );
			$product->set_sku( $sku );
			$product->set_status( ! empty( $data['status'] ) ? $data['status'] : 'publish' );

			if ( ! empty( $data['slug'] ) ) {
				$product->set_slug( sanitize_title( $data['slug'] ) );
			}

			if ( isset( $data['regular_price'] ) && $data['regular_price'] !== '' ) {
				$product->set_regular_price( $data['regular_price'] );
			}
			if ( isset( $data['sale_price'] ) && $data['sale_price'] !== '' ) {
				$product->set_sale_price( $data['sale_price'] );
			}

			if ( ! empty( $data['description'] ) ) {
				$product->set_description( wp_kses_post( $data['description'] ) );
			}
			if ( ! empty( $data['short_description'] ) ) {
				$product->set_short_description( wp_kses_post( $data['short_description'] ) );
			}

			// Save to generate ID for terms & meta
			$product_id = $product->save();

			// Hierarchical Taxonomy Categories (Department -> Level 1 -> Level 2)
			$cat_ids = array();
			$dept = ! empty( $data['department'] ) ? $data['department'] : '';
			$l1   = ! empty( $data['category_l1'] ) ? $data['category_l1'] : '';
			$l2   = ! empty( $data['category_l2'] ) ? $data['category_l2'] : '';

			$auto_create = ! empty( $options['auto_create_categories'] );

			if ( ! empty( $dept ) ) {
				$dept_id = self::find_or_create_category( $dept, 0, $auto_create );
				if ( $dept_id ) {
					$cat_ids[] = $dept_id;
					if ( ! empty( $l1 ) ) {
						$l1_id = self::find_or_create_category( $l1, $dept_id, $auto_create );
						if ( $l1_id ) {
							$cat_ids[] = $l1_id;
							if ( ! empty( $l2 ) ) {
								$l2_id = self::find_or_create_category( $l2, $l1_id, $auto_create );
								if ( $l2_id ) {
									$cat_ids[] = $l2_id;
								}
							}
						}
					}
				}
			}

			if ( ! empty( $cat_ids ) ) {
				wp_set_object_terms( $product_id, array_map( 'intval', $cat_ids ), 'product_cat' );
			}

			// Save Custom Headless Meta Fields
			update_post_meta( $product_id, '_hcc_department', $dept );
			update_post_meta( $product_id, '_hcc_level1', $l1 );
			update_post_meta( $product_id, '_hcc_level2', $l2 );

			if ( isset( $data['materials'] ) ) update_post_meta( $product_id, '_hcc_material', $data['materials'] );
			if ( isset( $data['finishes'] ) ) update_post_meta( $product_id, '_hcc_finish', $data['finishes'] );
			if ( isset( $data['dimensions'] ) ) update_post_meta( $product_id, '_hcc_dimensions', $data['dimensions'] );
			if ( isset( $data['lead_time'] ) ) update_post_meta( $product_id, '_hcc_lead_time', $data['lead_time'] );
			if ( isset( $data['minimum_order_qty'] ) ) update_post_meta( $product_id, '_hcc_minimum_order_qty', $data['minimum_order_qty'] );
			if ( isset( $data['cad_drawing_url'] ) ) update_post_meta( $product_id, '_hcc_cad_url', $data['cad_drawing_url'] );
			if ( isset( $data['catalog_only_mode'] ) ) update_post_meta( $product_id, '_hcc_catalog_mode', $data['catalog_only_mode'] );

			// Process Image URLs
			if ( ! empty( $options['import_images'] ) && ! empty( $data['image_urls'] ) ) {
				$urls = array_map( 'trim', preg_split( '/[,;]+/', $data['image_urls'] ) );
				$image_ids = array();

				foreach ( $urls as $idx => $url ) {
					if ( filter_var( $url, FILTER_VALIDATE_URL ) ) {
						// Download remote image to Media Library
						$att_id = media_sideload_image( $url, $product_id, $name, 'id' );
						if ( ! is_wp_error( $att_id ) ) {
							$image_ids[] = $att_id;
						}
					}
				}

				if ( ! empty( $image_ids ) ) {
					$product->set_image_id( $image_ids[0] );
					if ( count( $image_ids ) > 1 ) {
						$product->set_gallery_image_ids( array_slice( $image_ids, 1 ) );
					}
					$product->save();
				}
			}

			if ( $is_new ) {
				$created++;
			} else {
				$updated++;
			}
		}

		fclose( $handle );

		return array(
			'created'  => $created,
			'updated'  => $updated,
			'errors'   => $errors,
			'messages' => $messages,
		);
	}

	public static function find_or_create_category( $raw_name, $parent_id = 0, $auto_create = true ) {
		$raw_name = trim( (string) $raw_name );
		if ( empty( $raw_name ) ) {
			return 0;
		}

		$slug = sanitize_title( $raw_name );

		// 1. Check by slug under specific parent
		$terms = get_terms( array(
			'taxonomy'   => 'product_cat',
			'slug'       => $slug,
			'parent'     => $parent_id,
			'hide_empty' => false,
		) );

		if ( ! is_wp_error( $terms ) && ! empty( $terms ) ) {
			return $terms[0]->term_id;
		}

		// 2. Check by slug globally in product_cat
		$term = get_term_by( 'slug', $slug, 'product_cat' );
		if ( $term ) {
			return $term->term_id;
		}

		// 3. Case-insensitive exact name match
		$all_terms = get_terms( array(
			'taxonomy'   => 'product_cat',
			'hide_empty' => false,
		) );

		if ( ! is_wp_error( $all_terms ) && is_array( $all_terms ) ) {
			foreach ( $all_terms as $t ) {
				if ( strtolower( trim( $t->name ) ) === strtolower( $raw_name ) ) {
					return $t->term_id;
				}
			}
		}

		// 4. Create formatted Title Case term if auto-create enabled
		if ( $auto_create ) {
			$pretty_name = ucwords( strtolower( $raw_name ) );
			$pretty_name = str_replace( array( ' And ', ' & ' ), array( ' & ', ' & ' ), $pretty_name );

			$new_term = wp_insert_term( $pretty_name, 'product_cat', array(
				'slug'   => $slug,
				'parent' => $parent_id,
			) );

			if ( ! is_wp_error( $new_term ) && isset( $new_term['term_id'] ) ) {
				return $new_term['term_id'];
			}
		}

		return 0;
	}
}
