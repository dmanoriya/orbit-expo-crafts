<?php

namespace HeadlessCommerceCore\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use ZipArchive;

/**
 * Enterprise Bulk Product Importer & Visual Field Mapping Engine for Orbit Expo Crafts
 *
 * Features:
 * - 4-Step Interactive Wizard: Upload -> Visual Field Mapping -> Dry-Run Preview -> AJAX Batch Import
 * - Multi-Format Support: Excel (.xlsx) and CSV (.csv) with auto-delimiter detection & UTF-8 BOM cleaning
 * - Intelligent Fuzzy Auto-Matching: Automatically pre-selects spreadsheet columns to destination fields
 * - Mapping Presets: Save & load reusable field mapping templates for repeated supplier formats
 * - Smart Media Library Resolver: Searches WordPress Media Library by filename (e.g. .webp, .jpg)
 * - Auto-Draft Guardrail: Automatically drafts products if primary image is missing/not found
 * - Zero-Duplicate Engine: Deduplicates by SKU, Slug, or Title with choice to update or skip
 * - Dual Attribute Sync: Saves specs as native WooCommerce Product Attributes AND Headless Custom Meta
 * - AJAX Batch Execution: Eliminates server timeouts with real-time visual progress
 */
class ProductImporterManager {

	/**
	 * Canonical Orbit & WooCommerce destination fields definition
	 */
	public static function get_destination_fields() {
		return array(
			// Group: Core Product Info
			'core' => array(
				'title'  => '🏷️ Core Product Information',
				'fields' => array(
					'name' => array(
						'label'       => 'Product Title / Name',
						'required'    => true,
						'description' => 'The public title of the product (e.g. Bala Bed).',
						'synonyms'    => array( 'name', 'title', 'product name', 'product title', 'item name', 'item title', 'product' ),
					),
					'sku' => array(
						'label'       => 'SKU / Product Code',
						'required'    => true,
						'description' => 'Unique product identifier (e.g. BALA-6016). Used for deduplication.',
						'synonyms'    => array( 'sku', 'code', 'item code', 'item no', 'art no', 'model', 'product code', 'part number' ),
					),
					'slug' => array(
						'label'       => 'URL Slug',
						'required'    => false,
						'description' => 'URL-friendly permalink slug. Auto-generated from title if blank.',
						'synonyms'    => array( 'slug', 'url slug', 'permalink', 'url' ),
					),
					'status' => array(
						'label'       => 'Publish Status',
						'required'    => false,
						'description' => 'publish, draft, or private. Default is publish.',
						'synonyms'    => array( 'status', 'publish status', 'post status', 'state' ),
					),
					'description' => array(
						'label'       => 'Full Description',
						'required'    => false,
						'description' => 'Comprehensive product details, craftsmanship, and story.',
						'synonyms'    => array( 'description', 'full description', 'product description', 'details', 'long description' ),
					),
					'short_description' => array(
						'label'       => 'Short Description / Summary',
						'required'    => false,
						'description' => 'Brief 1-2 sentence overview for catalog cards and quote drawer.',
						'synonyms'    => array( 'short description', 'short_description', 'summary', 'brief', 'excerpt' ),
					),
				),
			),

			// Group: Category Hierarchy
			'categories' => array(
				'title'  => '📁 Taxonomy & Category Hierarchy',
				'fields' => array(
					'department' => array(
						'label'       => 'Department (Top Level)',
						'required'    => false,
						'description' => 'Primary department (e.g. Furniture, Décor, Mirrors, Storage).',
						'synonyms'    => array( 'department', 'main category', 'dept', 'parent category', 'level 0' ),
					),
					'category_l1' => array(
						'label'       => 'Level 1 Category',
						'required'    => false,
						'description' => 'Subcategory under department (e.g. Beds, Cabinets, Tables).',
						'synonyms'    => array( 'category_l1', 'category', 'sub category', 'l1', 'level 1', 'sub-category' ),
					),
					'category_l2' => array(
						'label'       => 'Level 2 Subcategory',
						'required'    => false,
						'description' => 'Granular category under Level 1 (e.g. Bar Cabinets, Bookcases).',
						'synonyms'    => array( 'category_l2', 'sub-category 2', 'sub category 2', 'collection', 'l2', 'level 2' ),
					),
				),
			),

			// Group: Hardware Specs & Materials (Native Attributes + Headless Meta)
			'specs' => array(
				'title'  => '🪵 Materials, Finishes & Specifications',
				'fields' => array(
					'materials' => array(
						'label'       => 'Materials / Wood & Metal Type',
						'required'    => false,
						'description' => 'Materials used (e.g. Acacia, Mango, Solid Wood, Brass).',
						'synonyms'    => array( 'materials', 'material', 'wood type', 'metal', 'fabric', 'composition' ),
					),
					'finishes' => array(
						'label'       => 'Finishes / Color Swatch',
						'required'    => false,
						'description' => 'Color/Finish (e.g. Desert, Lime finish, Colonial, Natural Oil).',
						'synonyms'    => array( 'finishes', 'finish', 'color', 'colour', 'coating', 'shade' ),
					),
					'dimensions' => array(
						'label'       => 'Dimensions (W x D x H)',
						'required'    => false,
						'description' => 'e.g. 220cm W x 168cm D x 104cm H.',
						'synonyms'    => array( 'dimensions', 'dimension', 'size', 'measurements', 'wxdxh', 'sizes' ),
					),
					'lead_time' => array(
						'label'       => 'Production Lead Time',
						'required'    => false,
						'description' => 'Estimated manufacture and dispatch turnaround (e.g. 4-6 weeks).',
						'synonyms'    => array( 'lead time', 'lead_time', 'dispatch time', 'delivery time', 'turnaround' ),
					),
					'minimum_order_qty' => array(
						'label'       => 'Minimum Order Quantity (MOQ)',
						'required'    => false,
						'description' => 'B2B order threshold (e.g. 1, 5, 10).',
						'synonyms'    => array( 'minimum order qty', 'minimum_order_qty', 'moq', 'min order', 'minimum order' ),
					),
					'cad_drawing_url' => array(
						'label'       => 'CAD / Spec Sheet URL',
						'required'    => false,
						'description' => 'Link to architectural CAD drawing or technical PDF.',
						'synonyms'    => array( 'cad drawing url', 'cad_drawing_url', 'cad url', 'cad', 'drawing url', 'spec sheet' ),
					),
					'catalog_only_mode' => array(
						'label'       => 'Catalog / Quote Mode Flag',
						'required'    => false,
						'description' => '1 = B2B Quote Request mode (default); 0 = Standard e-commerce.',
						'synonyms'    => array( 'catalog only mode', 'catalog_only_mode', 'b2b catalog mode', 'inquiry mode' ),
					),
				),
			),

			// Group: Media & Gallery
			'media' => array(
				'title'  => '🖼️ Images & Media Gallery',
				'fields' => array(
					'image_urls' => array(
						'label'       => 'Product Images / Gallery',
						'required'    => false,
						'description' => 'Comma-separated filenames (e.g. bala-bed_1.webp, bala-bed_2.webp) or full URLs. First image = Featured, remainder = Gallery.',
						'synonyms'    => array( 'image urls', 'image_urls', 'images', 'photos', 'gallery', 'image', 'picture', 'photo filenames' ),
					),
				),
			),

			// Group: Pricing (Optional for B2B)
			'pricing' => array(
				'title'  => '💰 Pricing (Optional for B2B Wholesale)',
				'fields' => array(
					'regular_price' => array(
						'label'       => 'Regular Price',
						'required'    => false,
						'description' => 'Standard wholesale price (leave blank for Catalog Only Mode).',
						'synonyms'    => array( 'regular price', 'regular_price', 'price', 'wholesale price', 'mrp', 'cost' ),
					),
					'sale_price' => array(
						'label'       => 'Sale Price',
						'required'    => false,
						'description' => 'Promotional discounted price.',
						'synonyms'    => array( 'sale price', 'sale_price', 'discounted price', 'special price' ),
					),
				),
			),
		);
	}

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_admin_menu' ), 25 );
		add_action( 'admin_init', array( __CLASS__, 'handle_wizard_actions' ) );
		add_action( 'wp_ajax_hcc_import_batch', array( __CLASS__, 'ajax_import_batch' ) );
		add_action( 'wp_ajax_hcc_save_mapping_preset', array( __CLASS__, 'ajax_save_mapping_preset' ) );
	}

	public static function add_admin_menu() {
		add_submenu_page(
			'headless-commerce-core',
			__( 'Bulk Product Importer & Mapping', 'headless-commerce-core' ),
			__( 'Product CSV/XLSX Importer', 'headless-commerce-core' ),
			'manage_options',
			'hcc-product-importer',
			array( __CLASS__, 'render_admin_page' )
		);
	}

	/**
	 * Handle Wizard POST actions (Step 1 Upload, Step 2 Save Mapping, Reset)
	 */
	public static function handle_wizard_actions() {
		if ( ! isset( $_GET['page'] ) || $_GET['page'] !== 'hcc-product-importer' ) {
			return;
		}

		// Download template action
		if ( isset( $_GET['download_template'] ) ) {
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

		// Reset wizard session
		if ( isset( $_GET['hcc_reset'] ) && check_admin_referer( 'hcc_reset_importer' ) ) {
			$session_id = sanitize_text_field( $_GET['session_id'] ?? '' );
			if ( $session_id ) {
				delete_transient( 'hcc_import_session_' . $session_id );
			}
			wp_redirect( admin_url( 'admin.php?page=hcc-product-importer' ) );
			exit;
		}

		// Handle Step 1 File Upload
		if ( isset( $_POST['hcc_step1_upload'] ) ) {
			check_admin_referer( 'hcc_step1_upload_nonce' );

			if ( empty( $_FILES['import_file']['tmp_name'] ) ) {
				set_transient( 'hcc_import_flash', array( 'type' => 'error', 'msg' => 'Please select a valid .xlsx or .csv spreadsheet file.' ), 60 );
				return;
			}

			$file = $_FILES['import_file'];
			$ext  = strtolower( pathinfo( $file['name'], PATHINFO_EXTENSION ) );

			if ( ! in_array( $ext, array( 'csv', 'xlsx', 'txt' ), true ) ) {
				set_transient( 'hcc_import_flash', array( 'type' => 'error', 'msg' => 'Unsupported file format. Please upload an Excel (.xlsx) or CSV (.csv) file.' ), 60 );
				return;
			}

			// Move file to uploads/hcc-imports/
			$upload_dir = wp_upload_dir();
			$target_dir = $upload_dir['basedir'] . '/hcc-imports/';
			if ( ! file_exists( $target_dir ) ) {
				wp_mkdir_p( $target_dir );
				file_put_contents( $target_dir . '.htaccess', 'deny from all' );
			}

			$session_id  = 'hcc_' . wp_generate_password( 12, false );
			$target_file = $target_dir . $session_id . '.' . $ext;

			if ( ! move_uploaded_file( $file['tmp_name'], $target_file ) ) {
				set_transient( 'hcc_import_flash', array( 'type' => 'error', 'msg' => 'Failed to save uploaded file to server.' ), 60 );
				return;
			}

			// Parse headers and top 5 sample rows
			$parsed = self::parse_file_preview( $target_file, $ext );
			if ( is_wp_error( $parsed ) ) {
				@unlink( $target_file );
				set_transient( 'hcc_import_flash', array( 'type' => 'error', 'msg' => $parsed->get_error_message() ), 60 );
				return;
			}

			// Store in transient for 6 hours
			set_transient( 'hcc_import_session_' . $session_id, array(
				'file_path'   => $target_file,
				'file_name'   => sanitize_text_field( $file['name'] ),
				'file_ext'    => $ext,
				'headers'     => $parsed['headers'],
				'sample_rows' => $parsed['sample_rows'],
				'total_rows'  => $parsed['total_rows'],
			), 6 * HOUR_IN_SECONDS );

			wp_redirect( admin_url( 'admin.php?page=hcc-product-importer&step=2&session_id=' . $session_id ) );
			exit;
		}

		// Handle Step 2 Save Mapping & Proceed to Preview
		if ( isset( $_POST['hcc_step2_save_mapping'] ) ) {
			check_admin_referer( 'hcc_step2_nonce' );

			$session_id = sanitize_text_field( $_POST['session_id'] ?? '' );
			$session    = get_transient( 'hcc_import_session_' . $session_id );

			if ( ! $session ) {
				set_transient( 'hcc_import_flash', array( 'type' => 'error', 'msg' => 'Your import session has expired. Please upload your spreadsheet again.' ), 60 );
				wp_redirect( admin_url( 'admin.php?page=hcc-product-importer' ) );
				exit;
			}

			$raw_mapping = $_POST['mapping'] ?? array();
			$mapping     = array();
			foreach ( $raw_mapping as $target_field => $source_col ) {
				if ( $source_col !== '' ) {
					$mapping[ sanitize_key( $target_field ) ] = (int) $source_col;
				}
			}

			if ( empty( $mapping['name'] ) && empty( $mapping['sku'] ) ) {
				set_transient( 'hcc_import_flash', array( 'type' => 'error', 'msg' => 'Please map at least Product Title or SKU before proceeding.' ), 60 );
				wp_redirect( admin_url( 'admin.php?page=hcc-product-importer&step=2&session_id=' . $session_id ) );
				exit;
			}

			$session['mapping'] = $mapping;
			$session['options'] = array(
				'dedupe_mode'              => sanitize_text_field( $_POST['dedupe_mode'] ?? 'update' ),
				'secondary_title_match'    => ! empty( $_POST['secondary_title_match'] ),
				'auto_draft_missing_image' => ! empty( $_POST['auto_draft_missing_image'] ),
				'auto_create_categories'   => ! empty( $_POST['auto_create_categories'] ),
				'save_native_attributes'   => ! empty( $_POST['save_native_attributes'] ),
				'default_catalog_mode'     => ! empty( $_POST['default_catalog_mode'] ),
			);

			set_transient( 'hcc_import_session_' . $session_id, $session, 6 * HOUR_IN_SECONDS );

			wp_redirect( admin_url( 'admin.php?page=hcc-product-importer&step=3&session_id=' . $session_id ) );
			exit;
		}
	}

	/**
	 * Parse spreadsheet headers and first 5 sample rows
	 */
	public static function parse_file_preview( $file_path, $ext ) {
		if ( $ext === 'xlsx' ) {
			return self::parse_xlsx_preview( $file_path );
		}
		return self::parse_csv_preview( $file_path );
	}

	/**
	 * Parse CSV preview
	 */
	public static function parse_csv_preview( $file_path ) {
		$handle = fopen( $file_path, 'r' );
		if ( ! $handle ) {
			return new \WP_Error( 'file_read_error', 'Unable to open CSV file for reading.' );
		}

		$first_line = fgets( $handle );
		rewind( $handle );

		// Detect delimiter
		$delimiter = ( strpos( $first_line, ';' ) !== false ) ? ';' : ( ( strpos( $first_line, "\t" ) !== false ) ? "\t" : ',' );

		// Strip UTF-8 BOM if present
		$bom = fread( $handle, 3 );
		if ( $bom !== "\xEF\xBB\xBF" ) {
			rewind( $handle );
		}

		$headers = fgetcsv( $handle, 0, $delimiter );
		if ( ! $headers || ! is_array( $headers ) ) {
			fclose( $handle );
			return new \WP_Error( 'invalid_headers', 'The CSV header row is empty or unreadable.' );
		}

		$clean_headers = array_map( 'trim', $headers );

		$sample_rows = array();
		$total_rows  = 0;

		while ( ( $row = fgetcsv( $handle, 0, $delimiter ) ) !== false ) {
			if ( empty( $row ) || ( count( $row ) === 1 && empty( $row[0] ) ) ) {
				continue;
			}
			$total_rows++;
			if ( count( $sample_rows ) < 5 ) {
				$sample_rows[] = array_map( 'trim', $row );
			}
		}

		fclose( $handle );

		return array(
			'headers'     => $clean_headers,
			'sample_rows' => $sample_rows,
			'total_rows'  => $total_rows,
		);
	}

	/**
	 * Parse XLSX preview using native ZipArchive
	 */
	public static function parse_xlsx_preview( $file_path ) {
		if ( ! class_exists( 'ZipArchive' ) ) {
			return new \WP_Error( 'ziparchive_missing', 'PHP ZipArchive extension is required to parse .xlsx files. Please upload a .csv file instead.' );
		}

		$zip = new ZipArchive();
		if ( $zip->open( $file_path ) !== true ) {
			return new \WP_Error( 'xlsx_open_error', 'Could not open .xlsx archive. The file may be corrupt or encrypted.' );
		}

		// Read shared strings
		$shared_strings = array();
		$ss_xml = $zip->getFromName( 'xl/sharedStrings.xml' );
		if ( $ss_xml ) {
			$xml = @simplexml_load_string( $ss_xml );
			if ( $xml && isset( $xml->si ) ) {
				foreach ( $xml->si as $si ) {
					if ( isset( $si->t ) ) {
						$shared_strings[] = (string) $si->t;
					} elseif ( isset( $si->r ) ) {
						$parts = array();
						foreach ( $si->r as $r ) {
							$parts[] = (string) $r->t;
						}
						$shared_strings[] = implode( '', $parts );
					} else {
						$shared_strings[] = '';
					}
				}
			}
		}

		// Read sheet1.xml
		$sheet_xml = $zip->getFromName( 'xl/worksheets/sheet1.xml' );
		if ( ! $sheet_xml ) {
			$zip->close();
			return new \WP_Error( 'sheet_missing', 'Could not find worksheet inside .xlsx file.' );
		}

		$xml = @simplexml_load_string( $sheet_xml );
		$zip->close();

		if ( ! $xml || ! isset( $xml->sheetData->row ) ) {
			return new \WP_Error( 'sheet_empty', 'Excel worksheet contains no row data.' );
		}

		$all_rows = array();
		foreach ( $xml->sheetData->row as $row ) {
			$r_data = array();
			foreach ( $row->c as $c ) {
				$attr = $c->attributes();
				$type = isset( $attr['t'] ) ? (string) $attr['t'] : 'n';
				$val = '';
				if ( $type === 's' ) {
					$idx = (int) $c->v;
					$val = $shared_strings[ $idx ] ?? '';
				} elseif ( $type === 'inlineStr' ) {
					$val = (string) $c->is->t;
				} else {
					$val = isset( $c->v ) ? (string) $c->v : '';
				}

				$cell_ref    = (string) $attr['r'];
				$col_letters = preg_replace( '/[0-9]/', '', $cell_ref );
				$col_index   = CategoryTaxonomyManager::column_letter_to_index( $col_letters );
				$r_data[ $col_index ] = trim( html_entity_decode( $val, ENT_QUOTES, 'UTF-8' ) );
			}

			if ( count( array_filter( $r_data ) ) > 0 ) {
				$max_col = max( array_keys( $r_data ) );
				$row_indexed = array();
				for ( $i = 0; $i <= $max_col; $i++ ) {
					$row_indexed[ $i ] = $r_data[ $i ] ?? '';
				}
				$all_rows[] = $row_indexed;
			}
		}

		if ( empty( $all_rows ) ) {
			return new \WP_Error( 'no_data', 'No product rows found in Excel sheet.' );
		}

		$headers     = $all_rows[0];
		$sample_rows = array_slice( $all_rows, 1, 5 );
		$total_rows  = max( 0, count( $all_rows ) - 1 );

		return array(
			'headers'     => $headers,
			'sample_rows' => $sample_rows,
			'total_rows'  => $total_rows,
		);
	}

	/**
	 * Intelligent Fuzzy Auto-Matcher
	 * Finds best match index for a given destination field from uploaded headers
	 */
	public static function guess_column_match( $field_key, $field_def, $headers ) {
		// 0. Exact field_key match (highest priority, e.g. 'category_l2' === 'category_l2')
		foreach ( $headers as $idx => $header ) {
			$h_clean = strtolower( trim( preg_replace( '/[^a-z0-9_]/', '', $header ) ) );
			if ( $h_clean === strtolower( $field_key ) ) {
				return $idx;
			}
		}

		$synonyms = array_map( 'strtolower', $field_def['synonyms'] ?? array( $field_key ) );
		$synonyms[] = strtolower( $field_key );
		$synonyms[] = strtolower( $field_def['label'] );

		// 1. Exact match across all headers
		foreach ( $headers as $idx => $header ) {
			$h_raw   = strtolower( trim( $header ) );
			$h_clean = strtolower( trim( preg_replace( '/[^a-z0-9]/', '', $header ) ) );

			foreach ( $synonyms as $syn ) {
				$syn_clean = strtolower( trim( preg_replace( '/[^a-z0-9]/', '', $syn ) ) );
				if ( $h_raw === $syn || $h_clean === $syn_clean ) {
					return $idx;
				}
			}
		}

		// 2. Token / Word boundary match
		foreach ( $headers as $idx => $header ) {
			$h_clean = strtolower( trim( preg_replace( '/[^a-z0-9]/', ' ', $header ) ) );
			foreach ( $synonyms as $syn ) {
				$syn_clean = strtolower( trim( preg_replace( '/[^a-z0-9]/', ' ', $syn ) ) );
				if ( preg_match( '/\b' . preg_quote( $syn_clean, '/' ) . '\b/', $h_clean ) ) {
					return $idx;
				}
			}
		}

		return -1;
	}

	/**
	 * Render Admin Controller Interface
	 */
	public static function render_admin_page() {
		$step       = isset( $_GET['step'] ) ? (int) $_GET['step'] : 1;
		$session_id = sanitize_text_field( $_GET['session_id'] ?? '' );
		$session    = $session_id ? get_transient( 'hcc_import_session_' . $session_id ) : null;

		$flash = get_transient( 'hcc_import_flash' );
		delete_transient( 'hcc_import_flash' );
		?>
		<div class="wrap hcc-importer-wrap" style="max-width:1150px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
			<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #e2e8f0; padding-bottom:16px;">
				<div>
					<h1 style="font-family: Georgia, serif; font-size:24px; color:#0f172a; margin:0 0 6px 0;">📦 Smart Product Importer & Field Mapping Engine</h1>
					<p style="margin:0; font-size:13px; color:#64748b;">Enterprise bulk import with visual field mapping, automatic Media Library lookup, deduplication & zero-timeout AJAX processing.</p>
				</div>
				<div>
					<a href="<?php echo esc_url( admin_url( 'admin.php?page=hcc-product-importer&download_template=1' ) ); ?>" class="button button-secondary" style="font-size:12.5px; font-weight:600; padding:4px 14px;">
						📥 Download Sample Template (.csv)
					</a>
				</div>
			</div>

			<?php if ( ! empty( $flash ) ) : ?>
				<div class="notice notice-<?php echo esc_attr( $flash['type'] ); ?> is-dismissible" style="padding:12px 16px; border-left-width:4px;">
					<p style="margin:0; font-size:14px; font-weight:600;"><?php echo esc_html( $flash['msg'] ); ?></p>
				</div>
			<?php endif; ?>

			<!-- Step Progress Indicator -->
			<div style="display:flex; gap:12px; margin-bottom:25px;">
				<?php
				$steps = array(
					1 => '1. Upload Sheet',
					2 => '2. Visual Field Mapping',
					3 => '3. Dry-Run & Rules',
					4 => '4. Live Import & Sync',
				);
				foreach ( $steps as $num => $title ) {
					$active = ( $num === $step );
					$done   = ( $num < $step );
					$bg     = $active ? '#0E5C63' : ( $done ? '#10b981' : '#f1f5f9' );
					$color  = ( $active || $done ) ? '#ffffff' : '#64748b';
					$border = ( $active || $done ) ? $bg : '#cbd5e1';
					echo '<div style="flex:1; background:' . esc_attr( $bg ) . '; color:' . esc_attr( $color ) . '; border:1px solid ' . esc_attr( $border ) . '; padding:10px 14px; border-radius:6px; font-weight:600; font-size:13px; text-align:center; display:flex; align-items:center; justify-content:center; gap:8px;">';
					if ( $done ) {
						echo '<span>✓</span> ';
					}
					echo esc_html( $title );
					echo '</div>';
				}
				?>
			</div>

			<?php
			if ( $step === 1 || ! $session ) {
				self::render_step_1();
			} elseif ( $step === 2 ) {
				self::render_step_2( $session_id, $session );
			} elseif ( $step === 3 ) {
				self::render_step_3( $session_id, $session );
			} elseif ( $step === 4 ) {
				self::render_step_4( $session_id, $session );
			}
			?>
		</div>
		<?php
	}

	/**
	 * STEP 1: Upload File Screen
	 */
	public static function render_step_1() {
		?>
		<div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:28px; box-shadow:0 4px 15px rgba(0,0,0,0.03);">
			<h2 style="margin-top:0; font-size:18px; color:#1e293b;">Step 1: Select Your Product Spreadsheet</h2>
			<p style="color:#64748b; font-size:13.5px; line-height:1.6; margin-bottom:24px;">
				Upload your product spreadsheet in either <strong>Excel (.xlsx)</strong> or <strong>CSV (.csv)</strong> format. 
				You do <strong>not</strong> need to rename your columns to match our template — in the next step, our visual mapping system will let you connect any column directly to WooCommerce product fields.
			</p>

			<form method="post" enctype="multipart/form-data">
				<?php wp_nonce_field( 'hcc_step1_upload_nonce' ); ?>
				
				<div style="border:2px dashed #cbd5e1; background:#f8fafc; border-radius:8px; padding:36px; text-align:center; margin-bottom:24px; cursor:pointer;" onclick="document.getElementById('import_file_input').click();">
					<div style="font-size:36px; margin-bottom:12px;">📄</div>
					<div style="font-weight:700; font-size:15px; color:#0f172a; margin-bottom:6px;">Choose a spreadsheet file to upload</div>
					<div style="font-size:12.5px; color:#64748b; margin-bottom:16px;">Supports .XLSX (Microsoft Excel) or .CSV (Comma/Tab separated)</div>
					
					<input type="file" id="import_file_input" name="import_file" accept=".csv, .xlsx, .txt" required style="display:inline-block; font-size:13px;" onclick="event.stopPropagation();" />
				</div>

				<div style="display:flex; justify-content:flex-end;">
					<button type="submit" name="hcc_step1_upload" class="button button-primary button-hero" style="background:#0E5C63; border-color:#0b494f; font-weight:700; font-size:14px; padding:8px 24px;">
						Next: Map Fields &amp; Columns &rarr;
					</button>
				</div>
			</form>
		</div>
		<?php
	}

	/**
	 * STEP 2: Visual Field Mapping Screen
	 */
	public static function render_step_2( $session_id, $session ) {
		$groups  = self::get_destination_fields();
		$headers = $session['headers'] ?? array();
		$samples = $session['sample_rows'][0] ?? array();
		$presets = get_option( 'hcc_import_presets', array() );
		?>
		<form method="post" id="hcc_mapping_form">
			<?php wp_nonce_field( 'hcc_step2_nonce' ); ?>
			<input type="hidden" name="session_id" value="<?php echo esc_attr( $session_id ); ?>" />

			<!-- File Info Card -->
			<div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:16px 20px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
				<div>
					<span style="font-size:14px; font-weight:700; color:#0f172a;">📄 Uploaded File: <?php echo esc_html( $session['file_name'] ); ?></span>
					<span style="margin-left:12px; font-size:12.5px; color:#64748b;">(<?php echo (int) $session['total_rows']; ?> data rows detected)</span>
				</div>
				<div>
					<a href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin.php?page=hcc-product-importer&hcc_reset=1&session_id=' . $session_id ), 'hcc_reset_importer' ) ); ?>" class="button button-link-delete" style="font-size:12px;">
						Cancel &amp; Upload Different File
					</a>
				</div>
			</div>

			<!-- Mapping Preset Bar -->
			<div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:16px 20px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center;">
				<div style="display:flex; align-items:center; gap:10px;">
					<span style="font-weight:700; font-size:13px; color:#1e293b;">⚡ Mapping Preset:</span>
					<select id="hcc_preset_selector" style="font-size:12.5px; min-width:200px;">
						<option value="">-- Choose Saved Preset (Optional) --</option>
						<?php foreach ( $presets as $preset_name => $preset_data ) : ?>
							<option value="<?php echo esc_attr( $preset_name ); ?>"><?php echo esc_html( $preset_name ); ?></option>
						<?php endforeach; ?>
					</select>
					<button type="button" id="hcc_load_preset_btn" class="button button-secondary" style="font-size:12px;">Apply Preset</button>
				</div>
				<div style="display:flex; align-items:center; gap:8px;">
					<input type="text" id="hcc_new_preset_name" placeholder="Preset name (e.g. Orbit Standard)" style="font-size:12px; width:180px;" />
					<button type="button" id="hcc_save_preset_btn" class="button button-secondary" style="font-size:12px;">Save Current as Preset</button>
				</div>
			</div>

			<!-- Visual Field Mapping Accordions -->
			<div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:24px; margin-bottom:24px; box-shadow:0 4px 15px rgba(0,0,0,0.03);">
				<h2 style="margin-top:0; font-size:18px; color:#1e293b; margin-bottom:6px;">Step 2: Map Spreadsheet Columns to WooCommerce Fields</h2>
				<p style="color:#64748b; font-size:13px; margin-bottom:24px;">Our smart engine has automatically pre-selected matches below. Review the selections and adjust any dropdowns as needed.</p>

				<?php foreach ( $groups as $group_key => $group ) : ?>
					<div style="margin-bottom:24px; border:1px solid #e2e8f0; border-radius:6px; overflow:hidden;">
						<div style="background:#f1f5f9; padding:12px 16px; font-weight:700; font-size:14px; color:#0f172a; border-bottom:1px solid #e2e8f0;">
							<?php echo esc_html( $group['title'] ); ?>
						</div>
						<table class="widefat" style="border:none; border-collapse:collapse;">
							<thead>
								<tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0;">
									<th style="width:30%; padding:10px 16px; font-weight:600; font-size:12.5px; color:#475569;">WooCommerce Destination Field</th>
									<th style="width:40%; padding:10px 16px; font-weight:600; font-size:12.5px; color:#475569;">Your Spreadsheet Column</th>
									<th style="width:30%; padding:10px 16px; font-weight:600; font-size:12.5px; color:#475569;">Sample Value (Row 1)</th>
								</tr>
							</thead>
							<tbody>
								<?php foreach ( $group['fields'] as $field_key => $field_def ) : 
									$guessed_idx = self::guess_column_match( $field_key, $field_def, $headers );
									$sample_val  = ( $guessed_idx !== -1 && isset( $samples[ $guessed_idx ] ) ) ? $samples[ $guessed_idx ] : '';
								?>
									<tr style="border-bottom:1px solid #f1f5f9;">
										<td style="padding:12px 16px; vertical-align:middle;">
											<strong style="color:#0f172a; font-size:13px;"><?php echo esc_html( $field_def['label'] ); ?></strong>
											<?php if ( ! empty( $field_def['required'] ) ) : ?>
												<span style="color:#ef4444; font-weight:700;">*</span>
											<?php endif; ?>
											<div style="font-size:11.5px; color:#64748b; margin-top:2px;"><?php echo esc_html( $field_def['description'] ); ?></div>
										</td>
										<td style="padding:12px 16px; vertical-align:middle;">
											<select name="mapping[<?php echo esc_attr( $field_key ); ?>]" class="hcc-mapping-select" data-field="<?php echo esc_attr( $field_key ); ?>" style="width:100%; max-width:350px; font-size:13px; font-weight:500;">
												<option value="">-- Do Not Import / Skip --</option>
												<?php foreach ( $headers as $col_idx => $header_name ) : 
													$is_selected = ( $guessed_idx === $col_idx );
												?>
													<option value="<?php echo esc_attr( $col_idx ); ?>" <?php selected( $is_selected ); ?> data-sample="<?php echo esc_attr( $samples[ $col_idx ] ?? '' ); ?>">
														<?php echo esc_html( $header_name ); ?> (Col <?php echo esc_html( $col_idx + 1 ); ?>)
													</option>
												<?php endforeach; ?>
											</select>
										</td>
										<td style="padding:12px 16px; vertical-align:middle;">
											<div class="hcc-sample-preview" id="sample_<?php echo esc_attr( $field_key ); ?>" style="font-size:12px; color:#334155; background:#f8fafc; padding:6px 10px; border-radius:4px; border:1px solid #e2e8f0; font-family:monospace; max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
												<?php echo esc_html( $sample_val ? $sample_val : '— (No column selected) —' ); ?>
											</div>
										</td>
									</tr>
								<?php endforeach; ?>
							</tbody>
						</table>
					</div>
				<?php endforeach; ?>

				<!-- Import Rules & Guardrails Section -->
				<div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:20px; margin-top:24px;">
					<h3 style="margin-top:0; font-size:15px; color:#0f172a; margin-bottom:12px;">🛡️ Deduplication &amp; Image Safety Guardrails</h3>
					
					<div style="margin-bottom:12px;">
						<label style="display:block; font-weight:600; font-size:13px; color:#1e293b; margin-bottom:4px;">Duplicate Handling:</label>
						<label style="margin-right:20px; font-size:13px;">
							<input type="radio" name="dedupe_mode" value="update" checked />
							<strong>Update existing products</strong> (Match by SKU; updates specs &amp; prices without changing product ID)
						</label>
						<label style="font-size:13px;">
							<input type="radio" name="dedupe_mode" value="skip" />
							<strong>Skip duplicates</strong> (Leave existing products completely untouched)
						</label>
					</div>

					<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:14px;">
						<label style="font-size:13px; color:#1e293b; display:flex; align-items:center; gap:8px;">
							<input type="checkbox" name="secondary_title_match" value="1" checked />
							<span><strong>Secondary Match:</strong> Match by Title / Slug if SKU is missing in sheet</span>
						</label>

						<label style="font-size:13px; color:#1e293b; display:flex; align-items:center; gap:8px;">
							<input type="checkbox" name="auto_draft_missing_image" value="1" checked />
							<span><strong style="color:#b45309;">Auto-Draft:</strong> Automatically set to <code>draft</code> if image is missing from Media Library</span>
						</label>

						<label style="font-size:13px; color:#1e293b; display:flex; align-items:center; gap:8px;">
							<input type="checkbox" name="auto_create_categories" value="1" checked />
							<span><strong>Auto-Categorize:</strong> Build Department &rarr; L1 &rarr; L2 taxonomy hierarchy</span>
						</label>

						<label style="font-size:13px; color:#1e293b; display:flex; align-items:center; gap:8px;">
							<input type="checkbox" name="save_native_attributes" value="1" checked />
							<span><strong>Dual Spec Sync:</strong> Save as native WooCommerce Attributes AND Headless Meta</span>
						</label>
					</div>
				</div>

				<div style="display:flex; justify-content:space-between; align-items:center; margin-top:24px;">
					<a href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin.php?page=hcc-product-importer&hcc_reset=1&session_id=' . $session_id ), 'hcc_reset_importer' ) ); ?>" class="button button-secondary" style="padding:6px 16px;">
						&larr; Back to Upload
					</a>
					<button type="submit" name="hcc_step2_save_mapping" class="button button-primary button-hero" style="background:#0E5C63; border-color:#0b494f; font-weight:700; font-size:14px; padding:8px 24px;">
						Review Mapping &amp; Dry-Run Preview &rarr;
					</button>
				</div>
			</div>
		</form>

		<script>
		document.addEventListener('DOMContentLoaded', function() {
			// Update live sample value on dropdown change
			document.querySelectorAll('.hcc-mapping-select').forEach(function(select) {
				select.addEventListener('change', function() {
					var field = this.getAttribute('data-field');
					var sampleDiv = document.getElementById('sample_' + field);
					var selectedOption = this.options[this.selectedIndex];
					var sample = selectedOption.getAttribute('data-sample') || '';
					if (sampleDiv) {
						sampleDiv.textContent = sample ? sample : '— (No column selected) —';
					}
				});
			});

			// Save Preset AJAX
			var saveBtn = document.getElementById('hcc_save_preset_btn');
			if (saveBtn) {
				saveBtn.addEventListener('click', function() {
					var nameInput = document.getElementById('hcc_new_preset_name');
					var presetName = nameInput ? nameInput.value.trim() : '';
					if (!presetName) {
						alert('Please enter a name for your preset (e.g. Standard Format).');
						return;
					}

					var mapping = {};
					document.querySelectorAll('.hcc-mapping-select').forEach(function(sel) {
						var field = sel.getAttribute('data-field');
						mapping[field] = sel.value;
					});

					saveBtn.disabled = true;
					saveBtn.textContent = 'Saving...';

					jQuery.post(ajaxurl, {
						action: 'hcc_save_mapping_preset',
						preset_name: presetName,
						mapping: mapping,
						nonce: '<?php echo esc_attr( wp_create_nonce( 'hcc_preset_nonce' ) ); ?>'
					}, function(res) {
						saveBtn.disabled = false;
						saveBtn.textContent = 'Save Current as Preset';
						if (res.success) {
							alert('✅ Preset "' + presetName + '" saved successfully!');
							var sel = document.getElementById('hcc_preset_selector');
							var opt = document.createElement('option');
							opt.value = presetName;
							opt.textContent = presetName;
							opt.selected = true;
							sel.appendChild(opt);
							nameInput.value = '';
						} else {
							alert('Error saving preset: ' + (res.data || 'Unknown error'));
						}
					});
				});
			}
		});
		</script>
		<?php
	}

	/**
	 * STEP 3: Dry-Run Preview & Rule Verification
	 */
	public static function render_step_3( $session_id, $session ) {
		$file_path = $session['file_path'];
		$ext       = $session['file_ext'];
		$mapping   = $session['mapping'] ?? array();
		$options   = $session['options'] ?? array();

		// Parse preview rows
		$preview_data = self::parse_file_preview( $file_path, $ext );
		$headers      = $preview_data['headers'];
		$samples      = $preview_data['sample_rows'];
		?>
		<div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:28px; margin-bottom:24px; box-shadow:0 4px 15px rgba(0,0,0,0.03);">
			<h2 style="margin-top:0; font-size:18px; color:#1e293b;">Step 3: Dry-Run Preview &amp; Verification</h2>
			<p style="color:#64748b; font-size:13px; margin-bottom:20px;">
				Review how your spreadsheet rows will be processed before anything is written to the database.
			</p>

			<!-- Summary Cards -->
			<div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:16px; margin-bottom:24px;">
				<div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:16px; text-align:center;">
					<div style="font-size:24px; font-weight:800; color:#0f172a;"><?php echo (int) $session['total_rows']; ?></div>
					<div style="font-size:12px; color:#64748b; font-weight:600; text-transform:uppercase;">Total Products in Sheet</div>
				</div>
				<div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:6px; padding:16px; text-align:center;">
					<div style="font-size:24px; font-weight:800; color:#065f46;"><?php echo ( $options['dedupe_mode'] === 'update' ) ? 'Sync &amp; Update' : 'Create New'; ?></div>
					<div style="font-size:12px; color:#047857; font-weight:600; text-transform:uppercase;">Deduplication Mode</div>
				</div>
				<div style="background:#fffbeb; border:1px solid #fde68a; border-radius:6px; padding:16px; text-align:center;">
					<div style="font-size:24px; font-weight:800; color:#92400e;"><?php echo ! empty( $options['auto_draft_missing_image'] ) ? 'Enabled' : 'Disabled'; ?></div>
					<div style="font-size:12px; color:#b45309; font-weight:600; text-transform:uppercase;">Auto-Draft Missing Images</div>
				</div>
				<div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:6px; padding:16px; text-align:center;">
					<div style="font-size:24px; font-weight:800; color:#1e40af;">AJAX Batch</div>
					<div style="font-size:12px; color:#2563eb; font-weight:600; text-transform:uppercase;">Zero-Timeout Processing</div>
				</div>
			</div>

			<!-- Dry-Run Preview Table -->
			<h3 style="font-size:15px; color:#0f172a; margin-bottom:12px;">Sample Product Preview (First <?php echo count( $samples ); ?> Rows):</h3>
			<div style="border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; margin-bottom:24px;">
				<table class="widefat" style="border:none;">
					<thead>
						<tr style="background:#f1f5f9;">
							<th style="padding:10px 14px; font-size:12px;">Action</th>
							<th style="padding:10px 14px; font-size:12px;">SKU</th>
							<th style="padding:10px 14px; font-size:12px;">Product Title</th>
							<th style="padding:10px 14px; font-size:12px;">Hierarchy (Dept &gt; L1 &gt; L2)</th>
							<th style="padding:10px 14px; font-size:12px;">Image Verification</th>
							<th style="padding:10px 14px; font-size:12px;">Final Status</th>
						</tr>
					</thead>
					<tbody>
						<?php foreach ( $samples as $idx => $row ) :
							$sku_col   = $mapping['sku'] ?? -1;
							$name_col  = $mapping['name'] ?? -1;
							$dept_col  = $mapping['department'] ?? -1;
							$l1_col    = $mapping['category_l1'] ?? -1;
							$l2_col    = $mapping['category_l2'] ?? -1;
							$img_col   = $mapping['image_urls'] ?? -1;

							$sku   = ( $sku_col !== -1 && isset( $row[ $sku_col ] ) ) ? trim( $row[ $sku_col ] ) : '';
							$name  = ( $name_col !== -1 && isset( $row[ $name_col ] ) ) ? trim( $row[ $name_col ] ) : '';
							$dept  = ( $dept_col !== -1 && isset( $row[ $dept_col ] ) ) ? trim( $row[ $dept_col ] ) : '';
							$l1    = ( $l1_col !== -1 && isset( $row[ $l1_col ] ) ) ? trim( $row[ $l1_col ] ) : '';
							$l2    = ( $l2_col !== -1 && isset( $row[ $l2_col ] ) ) ? trim( $row[ $l2_col ] ) : '';
							$imgs  = ( $img_col !== -1 && isset( $row[ $img_col ] ) ) ? trim( $row[ $img_col ] ) : '';

							$existing_id = $sku ? wc_get_product_id_by_sku( $sku ) : 0;
							$action_tag  = $existing_id ? '<span style="background:#e0f2fe; color:#0369a1; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700;">UPDATE (#' . $existing_id . ')</span>' : '<span style="background:#ecfdf5; color:#047857; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700;">CREATE NEW</span>';

							// Check primary image
							$first_img = '';
							if ( $imgs ) {
								$parts = preg_split( '/[,;]+/', $imgs );
								$first_img = trim( $parts[0] );
							}

							$img_found = false;
							if ( $first_img ) {
								$img_found = self::lookup_media_library_attachment( $first_img );
							}

							$final_status = 'publish';
							if ( ! $first_img || ! $img_found ) {
								if ( ! empty( $options['auto_draft_missing_image'] ) ) {
									$final_status = 'draft';
								}
							}
						?>
							<tr style="border-bottom:1px solid #f1f5f9;">
								<td style="padding:10px 14px;"><?php echo $action_tag; ?></td>
								<td style="padding:10px 14px; font-family:monospace; font-weight:600;"><?php echo esc_html( $sku ? $sku : '—' ); ?></td>
								<td style="padding:10px 14px; font-weight:600;"><?php echo esc_html( $name ); ?></td>
								<td style="padding:10px 14px; font-size:12px; color:#475569;">
									<?php echo esc_html( implode( ' &rarr; ', array_filter( array( $dept, $l1, $l2 ) ) ) ); ?>
								</td>
								<td style="padding:10px 14px; font-size:12px;">
									<?php if ( $img_found ) : ?>
										<span style="color:#059669; font-weight:600;">✅ Found in Media Library</span>
										<div style="font-size:11px; color:#64748b;"><?php echo esc_html( $first_img ); ?></div>
									<?php elseif ( $first_img ) : ?>
										<span style="color:#d97706; font-weight:600;">⚠️ Not in Media</span>
										<div style="font-size:11px; color:#b45309;"><?php echo esc_html( $first_img ); ?></div>
									<?php else : ?>
										<span style="color:#64748b; font-style:italic;">No image specified</span>
									<?php endif; ?>
								</td>
								<td style="padding:10px 14px;">
									<?php if ( $final_status === 'publish' ) : ?>
										<span style="background:#dcfce7; color:#15803d; padding:2px 8px; border-radius:4px; font-size:11.5px; font-weight:700;">Publish</span>
									<?php else : ?>
										<span style="background:#fef3c7; color:#b45309; padding:2px 8px; border-radius:4px; font-size:11.5px; font-weight:700;">Draft (Missing Image)</span>
									<?php endif; ?>
								</td>
							</tr>
						<?php endforeach; ?>
					</tbody>
				</table>
			</div>

			<div style="display:flex; justify-content:space-between; align-items:center;">
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=hcc-product-importer&step=2&session_id=' . $session_id ) ); ?>" class="button button-secondary" style="padding:6px 16px;">
					&larr; Back to Mapping
				</a>
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=hcc-product-importer&step=4&session_id=' . $session_id ) ); ?>" class="button button-primary button-hero" style="background:#0E5C63; border-color:#0b494f; font-weight:700; font-size:14px; padding:8px 24px;">
					🚀 Run High-Speed AJAX Import Now &rarr;
				</a>
			</div>
		</div>
		<?php
	}

	/**
	 * STEP 4: Live AJAX Import Execution Screen
	 */
	public static function render_step_4( $session_id, $session ) {
		$total_rows = (int) ( $session['total_rows'] ?? 0 );
		?>
		<div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:32px; box-shadow:0 4px 15px rgba(0,0,0,0.03);">
			<h2 style="margin-top:0; font-size:20px; color:#1e293b; margin-bottom:8px;">Importing Products in Progress...</h2>
			<p style="color:#64748b; font-size:13.5px; margin-bottom:24px;">
				Please keep this page open while products are being synchronized with WooCommerce. Products are processed in background batches to prevent timeouts.
			</p>

			<!-- Progress Bar -->
			<div style="background:#e2e8f0; border-radius:8px; height:24px; width:100%; overflow:hidden; margin-bottom:12px; position:relative;">
				<div id="hcc_progress_fill" style="background:linear-gradient(90deg, #0E5C63 0%, #14b8a6 100%); height:100%; width:0%; transition:width 0.3s ease;"></div>
				<div id="hcc_progress_percent" style="position:absolute; top:0; left:0; width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:#0f172a;">
					0%
				</div>
			</div>

			<div style="display:flex; justify-content:space-between; font-size:13px; color:#475569; margin-bottom:24px;">
				<span id="hcc_progress_text">Starting import engine...</span>
				<span id="hcc_counts_text">0 / <?php echo $total_rows; ?> products</span>
			</div>

			<!-- Live Log Console -->
			<div id="hcc_console" style="background:#0f172a; color:#f8fafc; font-family:monospace; font-size:12px; border-radius:6px; padding:16px; height:220px; overflow-y:auto; line-height:1.6; margin-bottom:24px;">
				<div>[<?php echo esc_html( date( 'H:i:s' ) ); ?>] Initializing batch session: <?php echo esc_html( $session_id ); ?>...</div>
			</div>

			<div id="hcc_complete_actions" style="display:none; text-align:center; padding-top:16px; border-top:1px solid #e2e8f0;">
				<h3 style="color:#059669; font-size:18px; margin-top:0;">🎉 Bulk Product Import Completed Successfully!</h3>
				<div style="display:flex; justify-content:center; gap:12px; margin-top:16px;">
					<a href="<?php echo esc_url( admin_url( 'edit.php?post_type=product' ) ); ?>" class="button button-primary button-hero" style="background:#0E5C63; border-color:#0b494f; font-weight:700;">
						View All Products in WooCommerce
					</a>
					<a href="<?php echo esc_url( admin_url( 'admin.php?page=hcc-product-importer' ) ); ?>" class="button button-secondary button-hero">
						Import Another Spreadsheet
					</a>
				</div>
			</div>
		</div>

		<script>
		document.addEventListener('DOMContentLoaded', function() {
			var sessionId = '<?php echo esc_js( $session_id ); ?>';
			var totalRows = <?php echo (int) $total_rows; ?>;
			var batchSize = 15;
			var currentOffset = 0;
			var totalCreated = 0;
			var totalUpdated = 0;
			var totalDrafted = 0;

			var fill = document.getElementById('hcc_progress_fill');
			var pctText = document.getElementById('hcc_progress_percent');
			var statusText = document.getElementById('hcc_progress_text');
			var countText = document.getElementById('hcc_counts_text');
			var consoleBox = document.getElementById('hcc_console');
			var actionsBox = document.getElementById('hcc_complete_actions');

			function logMsg(msg, color) {
				var div = document.createElement('div');
				if (color) div.style.color = color;
				div.textContent = '[' + new Date().toTimeString().split(' ')[0] + '] ' + msg;
				consoleBox.appendChild(div);
				consoleBox.scrollTop = consoleBox.scrollHeight;
			}

			function runBatch() {
				jQuery.post(ajaxurl, {
					action: 'hcc_import_batch',
					session_id: sessionId,
					offset: currentOffset,
					batch_size: batchSize,
					nonce: '<?php echo esc_attr( wp_create_nonce( 'hcc_batch_import_nonce' ) ); ?>'
				}, function(res) {
					if (!res.success) {
						logMsg('❌ Fatal Error: ' + (res.data || 'Unknown server error'), '#f87171');
						statusText.textContent = 'Import paused due to error.';
						return;
					}

					var data = res.data;
					currentOffset = data.next_offset;
					totalCreated += data.created;
					totalUpdated += data.updated;
					totalDrafted += data.drafted;

					if (data.messages && data.messages.length) {
						data.messages.forEach(function(m) { logMsg(m, '#94a3b8'); });
					}

					var pct = Math.min(100, Math.round((currentOffset / totalRows) * 100));
					fill.style.width = pct + '%';
					pctText.textContent = pct + '%';
					countText.textContent = Math.min(currentOffset, totalRows) + ' / ' + totalRows + ' products';
					statusText.textContent = 'Importing... Created: ' + totalCreated + ' | Updated: ' + totalUpdated + ' | Drafted: ' + totalDrafted;

					if (!data.is_complete && currentOffset < totalRows) {
						runBatch();
					} else {
						fill.style.width = '100%';
						pctText.textContent = '100%';
						logMsg('✅ All ' + totalRows + ' products processed! Created: ' + totalCreated + ', Updated: ' + totalUpdated + ', Drafted: ' + totalDrafted, '#4ade80');
						statusText.textContent = 'Completed!';
						actionsBox.style.display = 'block';
					}
				}).fail(function(xhr, status, err) {
					logMsg('❌ AJAX Network Error: ' + err, '#f87171');
					statusText.textContent = 'Network error occurred. Retrying in 3 seconds...';
					setTimeout(runBatch, 3000);
				});
			}

			// Start first batch
			runBatch();
		});
		</script>
		<?php
	}

	/**
	 * AJAX Handler: Save Mapping Preset
	 */
	public static function ajax_save_mapping_preset() {
		check_ajax_referer( 'hcc_preset_nonce', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( 'Unauthorized' );
		}

		$preset_name = sanitize_text_field( $_POST['preset_name'] ?? '' );
		$mapping     = $_POST['mapping'] ?? array();

		if ( ! $preset_name || empty( $mapping ) ) {
			wp_send_json_error( 'Invalid preset data' );
		}

		$presets = get_option( 'hcc_import_presets', array() );
		$presets[ $preset_name ] = $mapping;
		update_option( 'hcc_import_presets', $presets, false );

		wp_send_json_success();
	}

	/**
	 * AJAX Handler: Batch Import Execution
	 */
	public static function ajax_import_batch() {
		check_ajax_referer( 'hcc_batch_import_nonce', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( 'Unauthorized' );
		}

		$session_id = sanitize_text_field( $_POST['session_id'] ?? '' );
		$offset     = (int) ( $_POST['offset'] ?? 0 );
		$batch_size = (int) ( $_POST['batch_size'] ?? 15 );

		$session = get_transient( 'hcc_import_session_' . $session_id );
		if ( ! $session ) {
			wp_send_json_error( 'Import session expired. Please refresh and restart.' );
		}

		$file_path = $session['file_path'];
		$ext       = $session['file_ext'];
		$mapping   = $session['mapping'] ?? array();
		$options   = $session['options'] ?? array();

		// Fetch slice of rows
		$rows_data = self::read_file_slice( $file_path, $ext, $offset, $batch_size );
		if ( is_wp_error( $rows_data ) ) {
			wp_send_json_error( $rows_data->get_error_message() );
		}

		$rows        = $rows_data['rows'];
		$is_complete = $rows_data['is_complete'];

		$created  = 0;
		$updated  = 0;
		$drafted  = 0;
		$messages = array();

		foreach ( $rows as $row ) {
			$res = self::import_single_product_row( $row, $mapping, $options );
			if ( $res['status'] === 'created' ) {
				$created++;
				if ( ! empty( $res['is_draft'] ) ) $drafted++;
				$messages[] = "Created [{$res['sku']}]: {$res['title']} (ID: {$res['id']})" . ( ! empty( $res['is_draft'] ) ? ' [DRAFT: Missing Image]' : '' );
			} elseif ( $res['status'] === 'updated' ) {
				$updated++;
				if ( ! empty( $res['is_draft'] ) ) $drafted++;
				$messages[] = "Updated [{$res['sku']}]: {$res['title']} (ID: {$res['id']})";
			} elseif ( $res['status'] === 'skipped' ) {
				$messages[] = "Skipped duplicate: [{$res['sku']}] {$res['title']}";
			}
		}

		// Recount terms periodically
		wp_defer_term_counting( false );

		wp_send_json_success( array(
			'created'     => $created,
			'updated'     => $updated,
			'drafted'     => $drafted,
			'next_offset' => $offset + count( $rows ),
			'is_complete' => $is_complete,
			'messages'    => $messages,
		) );
	}

	/**
	 * Read slice of data rows from CSV or XLSX
	 */
	public static function read_file_slice( $file_path, $ext, $offset, $limit ) {
		if ( $ext === 'xlsx' ) {
			$preview = self::parse_xlsx_preview( $file_path );
			if ( is_wp_error( $preview ) ) {
				return $preview;
			}
			// In parse_xlsx_preview, all_rows has header at index 0
			// So data rows start at index 1
			$total_data = $preview['total_rows'];
			// Re-parse or slice if available
			$slice = array_slice( $preview['sample_rows'] ?? array(), 0, $limit ); // for quick fallback
			// Let's do full read for xlsx
			return self::read_xlsx_slice( $file_path, $offset, $limit );
		}

		// CSV slice
		$handle = fopen( $file_path, 'r' );
		if ( ! $handle ) {
			return new \WP_Error( 'file_error', 'Cannot open CSV file.' );
		}

		$first_line = fgets( $handle );
		rewind( $handle );
		$delimiter = ( strpos( $first_line, ';' ) !== false ) ? ';' : ( ( strpos( $first_line, "\t" ) !== false ) ? "\t" : ',' );

		// Skip BOM
		$bom = fread( $handle, 3 );
		if ( $bom !== "\xEF\xBB\xBF" ) {
			rewind( $handle );
		}

		// Skip header
		fgetcsv( $handle, 0, $delimiter );

		// Skip offset lines
		$current_line = 0;
		while ( $current_line < $offset && ( fgetcsv( $handle, 0, $delimiter ) ) !== false ) {
			$current_line++;
		}

		$rows = array();
		while ( count( $rows ) < $limit && ( $row = fgetcsv( $handle, 0, $delimiter ) ) !== false ) {
			if ( ! empty( $row ) && ( count( $row ) > 1 || ! empty( $row[0] ) ) ) {
				$rows[] = array_map( 'trim', $row );
			}
		}

		$is_complete = feof( $handle ) || count( $rows ) < $limit;
		fclose( $handle );

		return array(
			'rows'        => $rows,
			'is_complete' => $is_complete,
		);
	}

	/**
	 * Slice rows for XLSX
	 */
	public static function read_xlsx_slice( $file_path, $offset, $limit ) {
		$zip = new ZipArchive();
		if ( $zip->open( $file_path ) !== true ) {
			return new \WP_Error( 'xlsx_error', 'Failed to open XLSX file.' );
		}

		$shared_strings = array();
		$ss_xml = $zip->getFromName( 'xl/sharedStrings.xml' );
		if ( $ss_xml ) {
			$xml = @simplexml_load_string( $ss_xml );
			if ( $xml && isset( $xml->si ) ) {
				foreach ( $xml->si as $si ) {
					if ( isset( $si->t ) ) {
						$shared_strings[] = (string) $si->t;
					} elseif ( isset( $si->r ) ) {
						$p = array();
						foreach ( $si->r as $r ) $p[] = (string) $r->t;
						$shared_strings[] = implode( '', $p );
					} else {
						$shared_strings[] = '';
					}
				}
			}
		}

		$sheet_xml = $zip->getFromName( 'xl/worksheets/sheet1.xml' );
		$xml = @simplexml_load_string( $sheet_xml );
		$zip->close();

		if ( ! $xml || ! isset( $xml->sheetData->row ) ) {
			return array( 'rows' => array(), 'is_complete' => true );
		}

		$row_idx = 0;
		$data_idx = 0;
		$rows = array();

		foreach ( $xml->sheetData->row as $row ) {
			$row_idx++;
			if ( $row_idx === 1 ) {
				continue; // Skip header
			}

			$data_idx++;
			if ( $data_idx <= $offset ) {
				continue;
			}

			$r_data = array();
			foreach ( $row->c as $c ) {
				$attr = $c->attributes();
				$type = isset( $attr['t'] ) ? (string) $attr['t'] : 'n';
				$val = '';
				if ( $type === 's' ) {
					$idx = (int) $c->v;
					$val = $shared_strings[ $idx ] ?? '';
				} elseif ( $type === 'inlineStr' ) {
					$val = (string) $c->is->t;
				} else {
					$val = isset( $c->v ) ? (string) $c->v : '';
				}

				$cell_ref    = (string) $attr['r'];
				$col_letters = preg_replace( '/[0-9]/', '', $cell_ref );
				$col_index   = CategoryTaxonomyManager::column_letter_to_index( $col_letters );
				$r_data[ $col_index ] = trim( html_entity_decode( $val, ENT_QUOTES, 'UTF-8' ) );
			}

			if ( count( array_filter( $r_data ) ) > 0 ) {
				$max_col = max( array_keys( $r_data ) );
				$row_indexed = array();
				for ( $i = 0; $i <= $max_col; $i++ ) {
					$row_indexed[ $i ] = $r_data[ $i ] ?? '';
				}
				$rows[] = $row_indexed;
			}

			if ( count( $rows ) >= $limit ) {
				break;
			}
		}

		$is_complete = ( count( $rows ) < $limit );

		return array(
			'rows'        => $rows,
			'is_complete' => $is_complete,
		);
	}

	/**
	 * Import single product row using user mapping & business rules
	 */
	public static function import_single_product_row( $row, $mapping, $options ) {
		global $wpdb;

		// Extract mapped fields
		$get_val = function( $field ) use ( $row, $mapping ) {
			if ( isset( $mapping[ $field ] ) && $mapping[ $field ] !== -1 ) {
				$idx = (int) $mapping[ $field ];
				return isset( $row[ $idx ] ) ? trim( (string) $row[ $idx ] ) : '';
			}
			return '';
		};

		$name        = $get_val( 'name' );
		$sku         = $get_val( 'sku' );
		$slug        = $get_val( 'slug' );
		$status      = $get_val( 'status' );
		$desc        = $get_val( 'description' );
		$short_desc  = $get_val( 'short_description' );
		$dept        = $get_val( 'department' );
		$l1          = $get_val( 'category_l1' );
		$l2          = $get_val( 'category_l2' );
		$materials   = $get_val( 'materials' );
		$finishes    = $get_val( 'finishes' );
		$dimensions  = $get_val( 'dimensions' );
		$lead_time   = $get_val( 'lead_time' );
		$moq         = $get_val( 'minimum_order_qty' );
		$cad_url     = $get_val( 'cad_drawing_url' );
		$image_urls  = $get_val( 'image_urls' );
		$cat_mode    = $get_val( 'catalog_only_mode' );
		$reg_price   = $get_val( 'regular_price' );
		$sale_price  = $get_val( 'sale_price' );

		if ( empty( $name ) && empty( $sku ) ) {
			return array( 'status' => 'skipped', 'sku' => 'EMPTY', 'title' => 'Empty Row' );
		}

		// Deterministic SKU fallback
		if ( empty( $sku ) ) {
			$prefix = ! empty( $dept ) ? substr( strtoupper( preg_replace( '/[^A-Z]/', '', $dept ) ), 0, 3 ) : 'OEC';
			$sku    = $prefix . '-' . strtoupper( substr( md5( $name ), 0, 6 ) );
		}

		// 1. Deduplication Check (Primary: SKU)
		$product_id = wc_get_product_id_by_sku( $sku );

		// Secondary match: Slug or Title
		if ( ! $product_id && ! empty( $options['secondary_title_match'] ) ) {
			if ( ! empty( $slug ) ) {
				$post_by_slug = get_page_by_path( sanitize_title( $slug ), OBJECT, 'product' );
				if ( $post_by_slug ) {
					$product_id = $post_by_slug->ID;
				}
			}
			if ( ! $product_id && ! empty( $name ) ) {
				$id_by_title = $wpdb->get_var( $wpdb->prepare( "SELECT ID FROM {$wpdb->posts} WHERE post_title = %s AND post_type = 'product' LIMIT 1", $name ) );
				if ( $id_by_title ) {
					$product_id = (int) $id_by_title;
				}
			}
		}

		$is_new = false;
		if ( $product_id ) {
			if ( $options['dedupe_mode'] === 'skip' ) {
				return array( 'status' => 'skipped', 'sku' => $sku, 'title' => $name, 'id' => $product_id );
			}
			$product = wc_get_product( $product_id );
			if ( ! $product ) {
				$product = new \WC_Product_Simple();
				$is_new  = true;
			}
		} else {
			$product = new \WC_Product_Simple();
			$is_new  = true;
		}

		// Populate Native WooCommerce Fields
		if ( ! empty( $name ) ) {
			$product->set_name( $name );
		}
		$product->set_sku( $sku );

		if ( ! empty( $slug ) ) {
			$product->set_slug( sanitize_title( $slug ) );
		}

		if ( $reg_price !== '' ) {
			$product->set_regular_price( $reg_price );
		}
		if ( $sale_price !== '' ) {
			$product->set_sale_price( $sale_price );
		}

		if ( isset( $mapping['description'] ) && $mapping['description'] !== -1 ) {
			$product->set_description( wp_kses_post( $desc ) );
		} elseif ( ! empty( $desc ) ) {
			$product->set_description( wp_kses_post( $desc ) );
		}

		if ( isset( $mapping['short_description'] ) && $mapping['short_description'] !== -1 ) {
			$product->set_short_description( wp_kses_post( $short_desc ) );
		} elseif ( ! empty( $short_desc ) ) {
			$product->set_short_description( wp_kses_post( $short_desc ) );
		}

		// Image Resolver & Auto-Draft Rule
		$image_ids = array();
		$primary_img_found = false;

		if ( ! empty( $image_urls ) ) {
			$img_items = preg_split( '/[,;]+/', $image_urls );
			foreach ( $img_items as $img_item ) {
				$img_clean = trim( $img_item );
				if ( ! $img_clean ) continue;

				$att_id = self::lookup_media_library_attachment( $img_clean );
				if ( $att_id ) {
					$image_ids[] = $att_id;
				}
			}
			if ( ! empty( $image_ids ) ) {
				$primary_img_found = true;
			}
		}

		// Determine status (Auto-draft guardrail)
		$target_status = ! empty( $status ) ? $status : 'publish';
		$is_draft = false;

		if ( ! empty( $options['auto_draft_missing_image'] ) && ! $primary_img_found ) {
			$target_status = 'draft';
			$is_draft = true;
		}

		$product->set_status( $target_status );

		// Attach images if found
		if ( ! empty( $image_ids ) ) {
			$product->set_image_id( $image_ids[0] );
			if ( count( $image_ids ) > 1 ) {
				$product->set_gallery_image_ids( array_slice( $image_ids, 1 ) );
			} else {
				$product->set_gallery_image_ids( array() );
			}
		}

		// Dual Attribute Sync (Native WooCommerce Product Attributes)
		if ( ! empty( $options['save_native_attributes'] ) ) {
			$attrs = array();
			if ( ! empty( $materials ) ) {
				$attr = new \WC_Product_Attribute();
				$attr->set_name( 'Material' );
				$attr->set_options( array_map( 'trim', explode( ',', $materials ) ) );
				$attr->set_visible( true );
				$attr->set_variation( false );
				$attrs['material'] = $attr;
			}
			if ( ! empty( $finishes ) ) {
				$attr = new \WC_Product_Attribute();
				$attr->set_name( 'Finish' );
				$attr->set_options( array_map( 'trim', explode( ',', $finishes ) ) );
				$attr->set_visible( true );
				$attr->set_variation( false );
				$attrs['finish'] = $attr;
			}
			if ( ! empty( $dimensions ) ) {
				$attr = new \WC_Product_Attribute();
				$attr->set_name( 'Dimensions' );
				$attr->set_options( array( $dimensions ) );
				$attr->set_visible( true );
				$attr->set_variation( false );
				$attrs['dimensions'] = $attr;
			}
			$product->set_attributes( $attrs );
		}

		// Save Product
		$product_id = $product->save();

		// Category Hierarchy Association (Department -> L1 -> L2)
		$cat_ids = array();
		$auto_cat = ! empty( $options['auto_create_categories'] );

		if ( ! empty( $dept ) ) {
			$dept_id = self::find_or_create_category( $dept, 0, $auto_cat );
			if ( $dept_id ) {
				$cat_ids[] = $dept_id;
				if ( ! empty( $l1 ) ) {
					$l1_id = self::find_or_create_category( $l1, $dept_id, $auto_cat );
					if ( $l1_id ) {
						$cat_ids[] = $l1_id;
						if ( ! empty( $l2 ) ) {
							$l2_id = self::find_or_create_category( $l2, $l1_id, $auto_cat );
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

		// Headless Custom Meta Fields
		update_post_meta( $product_id, '_hcc_department', $dept );
		update_post_meta( $product_id, '_hcc_level1', $l1 );
		update_post_meta( $product_id, '_hcc_level2', $l2 );
		update_post_meta( $product_id, '_hcc_material', $materials );
		update_post_meta( $product_id, '_hcc_finish', $finishes );
		update_post_meta( $product_id, '_hcc_dimensions', $dimensions );
		update_post_meta( $product_id, '_hcc_lead_time', $lead_time );
		update_post_meta( $product_id, '_hcc_minimum_order_qty', $moq ? $moq : '1' );
		update_post_meta( $product_id, '_hcc_cad_url', $cad_url );
		update_post_meta( $product_id, '_hcc_catalog_mode', ( $cat_mode !== '' ) ? $cat_mode : '1' );

		// Standard meta keys for WooCommerce & Headless REST API
		update_post_meta( $product_id, '_dimensions_text', $dimensions );
		update_post_meta( $product_id, '_material', $materials );
		update_post_meta( $product_id, '_color', $finishes );

		// Sync available colors JSON array or clean up if no explicit finish
		if ( ! empty( $finishes ) ) {
			$fin_arr = array_map( 'trim', explode( ',', $finishes ) );
			update_post_meta( $product_id, '_available_colors', wp_json_encode( $fin_arr ) );
		} else {
			delete_post_meta( $product_id, '_available_colors' );
		}

		// Ensure old dummy secondary material ('Brass Detailing') is removed
		delete_post_meta( $product_id, '_material2' );
		delete_post_meta( $product_id, '_hcc_material2' );
		if ( $moq ) {
			update_post_meta( $product_id, '_moq', $moq );
		}
		if ( $lead_time ) {
			update_post_meta( $product_id, '_lead_time', $lead_time );
		}

		if ( $is_draft ) {
			update_post_meta( $product_id, '_hcc_draft_reason', 'Missing image from Media Library: ' . ( $first_img ?? 'None' ) );
		} else {
			delete_post_meta( $product_id, '_hcc_draft_reason' );
		}

		return array(
			'status'   => $is_new ? 'created' : 'updated',
			'id'       => $product_id,
			'sku'      => $sku,
			'title'    => $name,
			'is_draft' => $is_draft,
		);
	}

	/**
	 * Smart Media Library Attachment Lookup
	 * Searches WordPress Media Library by filename, guid, or URL
	 */
	public static function lookup_media_library_attachment( $filename_or_url ) {
		global $wpdb;

		$filename_or_url = trim( $filename_or_url );
		if ( empty( $filename_or_url ) ) {
			return 0;
		}

		// If full HTTP URL
		if ( filter_var( $filename_or_url, FILTER_VALIDATE_URL ) ) {
			// Check if already in media library by URL
			$att_id = $wpdb->get_var( $wpdb->prepare( "SELECT ID FROM {$wpdb->posts} WHERE post_type = 'attachment' AND guid = %s LIMIT 1", $filename_or_url ) );
			if ( $att_id ) {
				return (int) $att_id;
			}
			// Sideload remote image
			if ( ! function_exists( 'media_sideload_image' ) ) {
				require_once ABSPATH . 'wp-admin/includes/media.php';
				require_once ABSPATH . 'wp-admin/includes/file.php';
				require_once ABSPATH . 'wp-admin/includes/image.php';
			}
			$sideload = media_sideload_image( $filename_or_url, 0, null, 'id' );
			if ( ! is_wp_error( $sideload ) ) {
				return (int) $sideload;
			}
			return 0;
		}

		// Clean filename lookup (e.g. bala-bed_1.webp)
		$base_name = basename( $filename_or_url );
		$no_ext    = pathinfo( $base_name, PATHINFO_FILENAME );

		// 1. Check _wp_attached_file postmeta (exact or ends with filename)
		$att_id = $wpdb->get_var( $wpdb->prepare(
			"SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_wp_attached_file' AND (meta_value = %s OR meta_value LIKE %s) LIMIT 1",
			$base_name,
			'%' . $wpdb->esc_like( $base_name )
		) );

		if ( $att_id ) {
			return (int) $att_id;
		}

		// 2. Check guid in wp_posts
		$att_id = $wpdb->get_var( $wpdb->prepare(
			"SELECT ID FROM {$wpdb->posts} WHERE post_type = 'attachment' AND (guid LIKE %s OR post_name = %s) LIMIT 1",
			'%' . $wpdb->esc_like( $base_name ),
			sanitize_title( $no_ext )
		) );

		if ( $att_id ) {
			return (int) $att_id;
		}

		// 3. Fallback: Check alternative extensions (.webp, .jpg, .png)
		foreach ( array( '.webp', '.jpg', '.png', '.jpeg' ) as $alt_ext ) {
			$alt_name = $no_ext . $alt_ext;
			$alt_id   = $wpdb->get_var( $wpdb->prepare(
				"SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_wp_attached_file' AND meta_value LIKE %s LIMIT 1",
				'%' . $wpdb->esc_like( $alt_name )
			) );
			if ( $alt_id ) {
				return (int) $alt_id;
			}
		}

		return 0;
	}

	/**
	 * Category Taxonomy Finder or Auto-Creator (Department -> L1 -> L2)
	 */
	public static function find_or_create_category( $raw_name, $parent_id = 0, $auto_create = true ) {
		$raw_name = trim( (string) $raw_name );
		if ( empty( $raw_name ) ) {
			return 0;
		}

		$slug = sanitize_title( $raw_name );

		// 1. Check under parent
		$terms = get_terms( array(
			'taxonomy'   => 'product_cat',
			'slug'       => $slug,
			'parent'     => $parent_id,
			'hide_empty' => false,
		) );

		if ( ! is_wp_error( $terms ) && ! empty( $terms ) ) {
			return $terms[0]->term_id;
		}

		// 2. Check globally by slug
		$term = get_term_by( 'slug', $slug, 'product_cat' );
		if ( $term ) {
			return $term->term_id;
		}

		// 3. Exact name match
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

		// 4. Create Title Case Term
		if ( $auto_create ) {
			if ( ! function_exists( 'wp_insert_term' ) ) {
				require_once ABSPATH . 'wp-admin/includes/taxonomy.php';
			}

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
