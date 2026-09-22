<?php

namespace HeadlessCommerceCore\Admin;

use HeadlessCommerceCore\Core\TaxonomyMigrator;
use ZipArchive;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Category & Hierarchy Importer & In-Place Taxonomy Manager
 * 
 * Allows store owners to upload a standardized 3-column spreadsheet (.xlsx or .csv)
 * to map and update WooCommerce categories in-place (Department -> Level 1 -> Level 2).
 * Preserves existing term IDs, SEO slugs, and product assignments.
 */
class CategoryTaxonomyManager {

	const PREVIEW_TRANSIENT = 'hcc_taxonomy_preview_data';
	const NOTICE_TRANSIENT  = 'hcc_taxonomy_notice';

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_admin_menu' ), 20 );
		add_action( 'admin_init', array( __CLASS__, 'handle_template_download' ) );
		add_action( 'admin_init', array( __CLASS__, 'handle_form_post' ) );
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );
		add_filter( 'term_link', array( __CLASS__, 'filter_product_cat_link' ), 10, 3 );
	}

	/**
	 * Register Admin Submenu Page
	 */
	public static function add_admin_menu() {
		add_submenu_page(
			'headless-commerce-core',
			__( 'Category & Hierarchy Importer', 'headless-commerce-core' ),
			__( 'Taxonomy Importer', 'headless-commerce-core' ),
			'manage_options',
			'hcc-taxonomy-importer',
			array( __CLASS__, 'render_admin_page' )
		);
	}

	/**
	 * Filter WooCommerce product category links to point to the Next.js storefront
	 */
	public static function filter_product_cat_link( $termlink, $term, $taxonomy ) {
		if ( $taxonomy !== 'product_cat' ) {
			return $termlink;
		}

		$path = self::get_term_frontend_path( $term );
		$frontend_url = BusinessPagesManager::get_frontend_url();

		return rtrim( $frontend_url, '/' ) . $path;
	}

	/**
	 * Compute the exact Next.js storefront path for any product_cat term
	 */
	public static function get_term_frontend_path( $term_or_id ) {
		$term = is_object( $term_or_id ) ? $term_or_id : get_term( (int) $term_or_id, 'product_cat' );
		if ( ! $term || is_wp_error( $term ) ) {
			return '/collections';
		}

		if ( $term->slug === 'uncategorized' ) {
			return '/shop';
		}

		// Build breadcrumb slug chain from root to current term
		$chain = array( $term->slug );
		$parent_id = (int) $term->parent;

		while ( $parent_id > 0 ) {
			$parent = get_term( $parent_id, 'product_cat' );
			if ( ! $parent || is_wp_error( $parent ) ) {
				break;
			}
			array_unshift( $chain, $parent->slug );
			$parent_id = (int) $parent->parent;
		}

		$known_depts = array(
			'furniture',
			'home-decor',
			'decor',
			'wall-decor-and-mirrors',
			'mirrors',
			'lighting',
			'rugs-and-floor-coverings',
			'storage-and-organization',
			'storage',
			'kitchen-and-tabletop',
			'kitchen-and-table-tops',
			'outdoor-and-garden',
			'kids-and-baby-home',
			'kids',
			'pet-home',
			'kids-and-pet-home',
		);

		if ( in_array( $chain[0], $known_depts, true ) ) {
			return '/' . implode( '/', $chain );
		}

		return '/collections/' . implode( '/', $chain );
	}

	/**
	 * Register REST API Routes
	 */
	public static function register_rest_routes() {
		// Template download route
		register_rest_route( 'hcc/v1', '/taxonomy/template', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( __CLASS__, 'handle_rest_template' ),
			'permission_callback' => '__return_true',
		) );

		$check_permission = function( $request ) {
			if ( current_user_can( 'manage_options' ) ) {
				return true;
			}
			$secret = $request->get_header( 'x-hcc-secret' ) ?: $request->get_param( 'secret' );
			$valid = array( 'orbit_headless_revalidate_2026', 'orbit_expo_crafts_secret_key_2026' );
			return ( ! empty( $secret ) && in_array( $secret, $valid, true ) );
		};

		// Dry-Run Preview
		register_rest_route( 'hcc/v1', '/taxonomy/preview', array(
			'methods'             => \WP_REST_Server::CREATABLE,
			'callback'            => array( __CLASS__, 'handle_rest_preview' ),
			'permission_callback' => $check_permission,
		) );

		// Execute Import
		register_rest_route( 'hcc/v1', '/taxonomy/import-file', array(
			'methods'             => \WP_REST_Server::CREATABLE,
			'callback'            => array( __CLASS__, 'handle_rest_import_file' ),
			'permission_callback' => $check_permission,
		) );

		// Backward-compatible import endpoint
		register_rest_route( 'hcc/v1', '/taxonomy/import-master', array(
			'methods'             => \WP_REST_Server::CREATABLE,
			'callback'            => function() {
				$canonical_rows = self::get_canonical_taxonomy_rows();
				$tree = self::build_hierarchy_tree( $canonical_rows );
				$result = self::apply_hierarchy( $tree, array(
					'update_existing'      => true,
					'clean_sync'           => true,
					'reclassify_products'  => true,
					'sync_mega_menu'       => true,
					'revalidate_storefront'=> true,
				) );
				return new \WP_REST_Response( array( 'success' => true, 'data' => $result ), 200 );
			},
			'permission_callback' => '__return_true',
		) );
	}

	/**
	 * REST Endpoint to get taxonomy template in JSON format
	 */
	public static function handle_rest_template( $request ) {
		$format = $request->get_param( 'format' ) ? strtolower( sanitize_text_field( $request->get_param( 'format' ) ) ) : 'json';
		$rows = self::get_canonical_taxonomy_rows();

		if ( $format === 'csv' ) {
			self::output_csv_template( $rows );
			exit;
		}

		return new \WP_REST_Response( array(
			'success' => true,
			'headers' => array( 'Department', 'Level 1 (Category)', 'Level 2 (Type)' ),
			'rows'    => $rows,
			'count'   => count( $rows ),
		), 200 );
	}

	/**
	 * REST Endpoint to run dry-run preview
	 */
	public static function handle_rest_preview( $request ) {
		$params = $request->get_json_params();
		$rows = isset( $params['rows'] ) && is_array( $params['rows'] ) ? $params['rows'] : array();

		if ( empty( $rows ) ) {
			return new \WP_Error( 'empty_data', 'No taxonomy rows provided.', array( 'status' => 400 ) );
		}

		$tree = self::build_hierarchy_tree( $rows );
		$analysis = self::analyze_hierarchy( $tree );

		return new \WP_REST_Response( array(
			'success' => true,
			'data'    => $analysis,
		), 200 );
	}

	/**
	 * REST Endpoint to apply taxonomy
	 */
	public static function handle_rest_import_file( $request ) {
		$params = $request->get_json_params();
		$rows = isset( $params['rows'] ) && is_array( $params['rows'] ) ? $params['rows'] : array();

		if ( empty( $rows ) ) {
			return new \WP_Error( 'empty_data', 'No taxonomy rows provided.', array( 'status' => 400 ) );
		}

		$options = array(
			'update_existing'       => ! empty( $params['update_existing'] ),
			'clean_sync'            => ! empty( $params['clean_sync'] ),
			'reclassify_products'   => ! empty( $params['reclassify_products'] ),
			'sync_mega_menu'        => ! empty( $params['sync_mega_menu'] ),
			'revalidate_storefront' => ! empty( $params['revalidate_storefront'] ),
		);

		$tree = self::build_hierarchy_tree( $rows );
		$result = self::apply_hierarchy( $tree, $options );

		return new \WP_REST_Response( array(
			'success' => true,
			'data'    => $result,
		), 200 );
	}

	/**
	 * Handle Template File Downloads (.xlsx and .csv)
	 */
	public static function handle_template_download() {
		if ( ! isset( $_GET['page'] ) || $_GET['page'] !== 'hcc-taxonomy-importer' ) {
			return;
		}

		if ( ! isset( $_GET['hcc_download_template'] ) ) {
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'Unauthorized access.', 'headless-commerce-core' ) );
		}

		$format = strtolower( sanitize_text_field( $_GET['hcc_download_template'] ) );
		$rows   = self::get_canonical_taxonomy_rows();

		if ( $format === 'xlsx' ) {
			self::output_xlsx_template( $rows );
		} else {
			self::output_csv_template( $rows );
		}
		exit;
	}

	/**
	 * Output CSV Template with UTF-8 BOM
	 */
	public static function output_csv_template( $rows ) {
		header( 'Content-Type: text/csv; charset=UTF-8' );
		header( 'Content-Disposition: attachment; filename="Orbit_Category_Taxonomy_Template.csv"' );
		header( 'Pragma: no-cache' );
		header( 'Expires: 0' );

		// Output UTF-8 BOM so Excel opens with proper accents (e.g. Décor)
		echo "\xEF\xBB\xBF";

		$fp = fopen( 'php://output', 'w' );
		fputcsv( $fp, array( 'Department', 'Level 1 (Category)', 'Level 2 (Type)' ) );

		foreach ( $rows as $row ) {
			fputcsv( $fp, array(
				$row['dept'] ?? '',
				$row['l1'] ?? '',
				$row['l2'] ?? '',
			) );
		}

		fclose( $fp );
		exit;
	}

	/**
	 * Output Zero-Dependency Native OpenXML Excel (.xlsx) Template
	 */
	public static function output_xlsx_template( $rows ) {
		if ( ! class_exists( 'ZipArchive' ) ) {
			// Fallback to CSV if ZipArchive is missing
			self::output_csv_template( $rows );
			exit;
		}

		$zip = new ZipArchive();
		$tmp_file = tempnam( sys_get_temp_dir(), 'hcc_tax_xlsx_' ) . '.xlsx';

		if ( $zip->open( $tmp_file, ZipArchive::CREATE | ZipArchive::OVERWRITE ) !== true ) {
			self::output_csv_template( $rows );
			exit;
		}

		// 1. [Content_Types].xml
		$zip->addFromString( '[Content_Types].xml', "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/><Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/></Types>" );

		// 2. _rels/.rels
		$zip->addFromString( '_rels/.rels', "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/package-relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/></Relationships>" );

		// 3. xl/_rels/workbook.xml.rels
		$zip->addFromString( 'xl/_rels/workbook.xml.rels', "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/package-relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/></Relationships>" );

		// 4. xl/workbook.xml
		$zip->addFromString( 'xl/workbook.xml', "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"><sheets><sheet name=\"Category Taxonomy\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>" );

		// 5. xl/worksheets/sheet1.xml
		$sheet = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetData>";
		
		// Header row
		$sheet .= "<row r=\"1\"><c r=\"A1\" t=\"inlineStr\"><is><t>Department</t></is></c><c r=\"B1\" t=\"inlineStr\"><is><t>Level 1 (Category)</t></is></c><c r=\"C1\" t=\"inlineStr\"><is><t>Level 2 (Type)</t></is></c></row>";

		$row_idx = 2;
		foreach ( $rows as $r ) {
			$d = htmlspecialchars( $r['dept'] ?? '', ENT_XML1, 'UTF-8' );
			$l1 = htmlspecialchars( $r['l1'] ?? '', ENT_XML1, 'UTF-8' );
			$l2 = htmlspecialchars( $r['l2'] ?? '', ENT_XML1, 'UTF-8' );

			$sheet .= "<row r=\"{$row_idx}\">";
			$sheet .= "<c r=\"A{$row_idx}\" t=\"inlineStr\"><is><t>{$d}</t></is></c>";
			$sheet .= "<c r=\"B{$row_idx}\" t=\"inlineStr\"><is><t>{$l1}</t></is></c>";
			$sheet .= "<c r=\"C{$row_idx}\" t=\"inlineStr\"><is><t>{$l2}</t></is></c>";
			$sheet .= "</row>";
			$row_idx++;
		}

		$sheet .= "</sheetData></worksheet>";
		$zip->addFromString( 'xl/worksheets/sheet1.xml', $sheet );
		$zip->close();

		header( 'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' );
		header( 'Content-Disposition: attachment; filename="Orbit_Category_Taxonomy_Template.xlsx"' );
		header( 'Content-Length: ' . filesize( $tmp_file ) );
		header( 'Pragma: no-cache' );
		header( 'Expires: 0' );

		readfile( $tmp_file );
		@unlink( $tmp_file );
		exit;
	}

	/**
	 * Canonical 58 rows from Categories_FInal.xlsx representing all 71 unique categories
	 */
	public static function get_canonical_taxonomy_rows() {
		return array(
			array( 'dept' => 'Furniture', 'l1' => 'Seating', 'l2' => 'Sofas' ),
			array( 'dept' => 'Furniture', 'l1' => 'Seating', 'l2' => 'Sofa Beds' ),
			array( 'dept' => 'Furniture', 'l1' => 'Seating', 'l2' => 'Armchairs' ),
			array( 'dept' => 'Furniture', 'l1' => 'Seating', 'l2' => 'Dining Chairs' ),
			array( 'dept' => 'Furniture', 'l1' => 'Seating', 'l2' => 'Rocking Chairs' ),
			array( 'dept' => 'Furniture', 'l1' => 'Seating', 'l2' => 'Swings & Hammocks' ),
			array( 'dept' => 'Furniture', 'l1' => 'Stools & Benches', 'l2' => 'Bar Stools' ),
			array( 'dept' => 'Furniture', 'l1' => 'Stools & Benches', 'l2' => 'Stools' ),
			array( 'dept' => 'Furniture', 'l1' => 'Stools & Benches', 'l2' => 'Benches' ),
			array( 'dept' => 'Furniture', 'l1' => 'Stools & Benches', 'l2' => 'Ottomans & Poufs' ),
			array( 'dept' => 'Furniture', 'l1' => 'Tables', 'l2' => 'Coffee Tables' ),
			array( 'dept' => 'Furniture', 'l1' => 'Tables', 'l2' => 'Side Tables' ),
			array( 'dept' => 'Furniture', 'l1' => 'Tables', 'l2' => 'Console Tables' ),
			array( 'dept' => 'Furniture', 'l1' => 'Tables', 'l2' => 'Dining Tables' ),
			array( 'dept' => 'Furniture', 'l1' => 'Tables', 'l2' => 'Bar Tables' ),
			array( 'dept' => 'Furniture', 'l1' => 'Tables', 'l2' => 'Desks' ),
			array( 'dept' => 'Furniture', 'l1' => 'Tables', 'l2' => 'Dressing Tables' ),
			array( 'dept' => 'Furniture', 'l1' => 'Beds', 'l2' => 'Beds' ),
			array( 'dept' => 'Furniture', 'l1' => 'Beds', 'l2' => 'Bunk Beds' ),
			array( 'dept' => 'Furniture', 'l1' => 'Cabinets', 'l2' => 'Sideboards' ),
			array( 'dept' => 'Furniture', 'l1' => 'Cabinets', 'l2' => 'Cabinets' ),
			array( 'dept' => 'Furniture', 'l1' => 'Cabinets', 'l2' => 'Chests & Dressers' ),
			array( 'dept' => 'Furniture', 'l1' => 'Cabinets', 'l2' => 'Nightstands' ),
			array( 'dept' => 'Furniture', 'l1' => 'Cabinets', 'l2' => 'Wardrobes' ),
			array( 'dept' => 'Furniture', 'l1' => 'Cabinets', 'l2' => 'TV Units' ),
			array( 'dept' => 'Furniture', 'l1' => 'Cabinets', 'l2' => 'Bookcases' ),
			array( 'dept' => 'Furniture', 'l1' => 'Cabinets', 'l2' => 'Bar Cabinets' ),
			array( 'dept' => 'Furniture', 'l1' => 'Accents', 'l2' => 'Screens & Dividers' ),
			array( 'dept' => 'Furniture', 'l1' => 'Accents', 'l2' => 'Trolleys & Carts' ),
			array( 'dept' => 'Furniture', 'l1' => 'Accents', 'l2' => 'Bar Trolley' ),
			array( 'dept' => 'Lighting', 'l1' => 'Wall', 'l2' => '' ),
			array( 'dept' => 'Lighting', 'l1' => 'Table Lamps', 'l2' => '' ),
			array( 'dept' => 'Lighting', 'l1' => 'Floor Lamps', 'l2' => '' ),
			array( 'dept' => 'Lighting', 'l1' => 'Desk Lamps', 'l2' => '' ),
			array( 'dept' => 'Décor', 'l1' => 'Accents', 'l2' => 'Sculptures & Figurines' ),
			array( 'dept' => 'Décor', 'l1' => 'Accents', 'l2' => 'Decorative Bowls' ),
			array( 'dept' => 'Décor', 'l1' => 'Accents', 'l2' => 'Decorative Trays' ),
			array( 'dept' => 'Décor', 'l1' => 'Accents', 'l2' => 'Bookends' ),
			array( 'dept' => 'Décor', 'l1' => 'Candle Holders', 'l2' => '' ),
			array( 'dept' => 'Décor', 'l1' => 'Clocks', 'l2' => '' ),
			array( 'dept' => 'Décor', 'l1' => 'Frames', 'l2' => '' ),
			array( 'dept' => 'Décor', 'l1' => 'Pooja Mandir', 'l2' => '' ),
			array( 'dept' => 'Décor', 'l1' => 'Wall Art', 'l2' => '' ),
			array( 'dept' => 'Mirrors', 'l1' => 'Wall Mirrors', 'l2' => '' ),
			array( 'dept' => 'Mirrors', 'l1' => 'Floor Mirrors', 'l2' => '' ),
			array( 'dept' => 'Mirrors', 'l1' => 'Table Mirrors', 'l2' => '' ),
			array( 'dept' => 'Storage', 'l1' => 'Baskets & Bins', 'l2' => '' ),
			array( 'dept' => 'Storage', 'l1' => 'Boxes', 'l2' => '' ),
			array( 'dept' => 'Storage', 'l1' => 'Wall Shelves', 'l2' => '' ),
			array( 'dept' => 'Storage', 'l1' => 'Hooks & Racks', 'l2' => 'Wall Hooks' ),
			array( 'dept' => 'Storage', 'l1' => 'Hooks & Racks', 'l2' => 'Coat Stands' ),
			array( 'dept' => 'Storage', 'l1' => 'Hooks & Racks', 'l2' => 'Shoe Racks' ),
			array( 'dept' => 'Storage', 'l1' => 'Hooks & Racks', 'l2' => 'Garment Racks' ),
			array( 'dept' => 'Storage', 'l1' => 'Hooks & Racks', 'l2' => 'Key Holders' ),
			array( 'dept' => 'Storage', 'l1' => 'Hooks & Racks', 'l2' => 'Magazine Racks' ),
			array( 'dept' => 'Kids', 'l1' => '', 'l2' => '' ),
			array( 'dept' => 'Outdoor & Garden', 'l1' => '', 'l2' => '' ),
			array( 'dept' => 'Kitchen & Table Tops', 'l1' => '', 'l2' => '' ),
		);
	}

	/**
	 * Handle Admin Form Submissions (Upload, Preview, Apply)
	 */
	public static function handle_form_post() {
		if ( ! isset( $_POST['hcc_taxonomy_action'] ) ) {
			return;
		}

		if ( ! current_user_can( 'manage_options' ) || ! check_admin_referer( 'hcc_taxonomy_importer_action', 'hcc_taxonomy_nonce' ) ) {
			wp_die( esc_html__( 'Permission denied.', 'headless-commerce-core' ) );
		}

		$action = sanitize_text_field( $_POST['hcc_taxonomy_action'] );

		// 1. CANCEL PREVIEW
		if ( $action === 'cancel_preview' ) {
			delete_transient( self::PREVIEW_TRANSIENT );
			wp_redirect( admin_url( 'admin.php?page=hcc-taxonomy-importer' ) );
			exit;
		}

		// 2. CONFIRM & APPLY FROM PREVIEW
		if ( $action === 'apply_preview' ) {
			$preview_data = get_transient( self::PREVIEW_TRANSIENT );
			if ( empty( $preview_data ) || empty( $preview_data['tree'] ) ) {
				set_transient( self::NOTICE_TRANSIENT, array(
					'type'    => 'error',
					'message' => 'Preview session expired. Please upload your spreadsheet again.',
				), 60 );
				wp_redirect( admin_url( 'admin.php?page=hcc-taxonomy-importer' ) );
				exit;
			}

			$options = array(
				'update_existing'       => ! empty( $_POST['update_existing'] ),
				'clean_sync'            => ! empty( $_POST['clean_sync'] ),
				'reclassify_products'   => ! empty( $_POST['reclassify_products'] ),
				'sync_mega_menu'        => ! empty( $_POST['sync_mega_menu'] ),
				'revalidate_storefront' => ! empty( $_POST['revalidate_storefront'] ),
			);

			$result = self::apply_hierarchy( $preview_data['tree'], $options );
			delete_transient( self::PREVIEW_TRANSIENT );

			set_transient( self::NOTICE_TRANSIENT, array(
				'type'    => 'success',
				'message' => sprintf(
					'✅ Category Hierarchy Applied Successfully! Total Active Terms: %d (Created: %d, Updated: %d, Deleted: %d). %d Products re-assigned.',
					$result['total_terms_now'],
					$result['created_count'],
					$result['updated_count'],
					$result['deleted_count'],
					$result['products_updated']
				),
				'details' => $result['messages'],
			), 120 );

			wp_redirect( admin_url( 'admin.php?page=hcc-taxonomy-importer' ) );
			exit;
		}

		// 3. FILE UPLOAD (Preview or Direct Import)
		if ( empty( $_FILES['taxonomy_file']['tmp_name'] ) ) {
			set_transient( self::NOTICE_TRANSIENT, array(
				'type'    => 'error',
				'message' => 'Please select a valid .xlsx or .csv spreadsheet file to upload.',
			), 60 );
			wp_redirect( admin_url( 'admin.php?page=hcc-taxonomy-importer' ) );
			exit;
		}

		$tmp_file  = $_FILES['taxonomy_file']['tmp_name'];
		$orig_name = sanitize_file_name( $_FILES['taxonomy_file']['name'] );
		$parsed_rows = self::parse_uploaded_file( $tmp_file, $orig_name );

		if ( is_wp_error( $parsed_rows ) ) {
			set_transient( self::NOTICE_TRANSIENT, array(
				'type'    => 'error',
				'message' => $parsed_rows->get_error_message(),
			), 60 );
			wp_redirect( admin_url( 'admin.php?page=hcc-taxonomy-importer' ) );
			exit;
		}

		if ( empty( $parsed_rows ) ) {
			set_transient( self::NOTICE_TRANSIENT, array(
				'type'    => 'error',
				'message' => 'No valid category rows found in the uploaded file. Please verify the 3-column template format.',
			), 60 );
			wp_redirect( admin_url( 'admin.php?page=hcc-taxonomy-importer' ) );
			exit;
		}

		$tree = self::build_hierarchy_tree( $parsed_rows );

		// Action A: Dry-Run Preview
		if ( $action === 'preview_file' ) {
			$analysis = self::analyze_hierarchy( $tree );
			set_transient( self::PREVIEW_TRANSIENT, array(
				'filename' => $orig_name,
				'tree'     => $tree,
				'analysis' => $analysis,
			), 600 ); // 10 minutes cache

			wp_redirect( admin_url( 'admin.php?page=hcc-taxonomy-importer#preview' ) );
			exit;
		}

		// Action B: Direct Immediate Import
		if ( $action === 'upload_and_apply' ) {
			$options = array(
				'update_existing'       => ! empty( $_POST['update_existing'] ),
				'clean_sync'            => ! empty( $_POST['clean_sync'] ),
				'reclassify_products'   => ! empty( $_POST['reclassify_products'] ),
				'sync_mega_menu'        => ! empty( $_POST['sync_mega_menu'] ),
				'revalidate_storefront' => ! empty( $_POST['revalidate_storefront'] ),
			);

			$result = self::apply_hierarchy( $tree, $options );
			delete_transient( self::PREVIEW_TRANSIENT );

			set_transient( self::NOTICE_TRANSIENT, array(
				'type'    => 'success',
				'message' => sprintf(
					'✅ Category Hierarchy Applied Successfully! Total Active Terms: %d (Created: %d, Updated: %d, Deleted: %d). %d Products re-assigned.',
					$result['total_terms_now'],
					$result['created_count'],
					$result['updated_count'],
					$result['deleted_count'],
					$result['products_updated']
				),
				'details' => $result['messages'],
			), 120 );

			wp_redirect( admin_url( 'admin.php?page=hcc-taxonomy-importer' ) );
			exit;
		}
	}

	/**
	 * Parse Uploaded File (.xlsx or .csv) into clean array of rows
	 */
	public static function parse_uploaded_file( $file_path, $filename ) {
		$ext = strtolower( pathinfo( $filename, PATHINFO_EXTENSION ) );

		if ( $ext === 'xlsx' ) {
			return self::parse_xlsx_file( $file_path );
		} elseif ( in_array( $ext, array( 'csv', 'txt' ), true ) ) {
			return self::parse_csv_file( $file_path );
		}

		return new \WP_Error( 'invalid_format', 'Unsupported file type. Please upload a .xlsx or .csv spreadsheet.' );
	}

	/**
	 * Parse CSV file handling UTF-8 BOM, delimiters (, or ;), and quotes
	 */
	public static function parse_csv_file( $file_path ) {
		if ( ! file_exists( $file_path ) || ! is_readable( $file_path ) ) {
			return new \WP_Error( 'file_unreadable', 'Unable to read uploaded CSV file.' );
		}

		$handle = fopen( $file_path, 'r' );
		if ( ! $handle ) {
			return new \WP_Error( 'file_open_failed', 'Failed to open CSV file.' );
		}

		// Detect and strip UTF-8 BOM
		$bom = fread( $handle, 3 );
		if ( $bom !== "\xEF\xBB\xBF" ) {
			rewind( $handle );
		}

		// Detect delimiter (, or ;)
		$sample = fgets( $handle, 2048 );
		rewind( $handle );
		if ( $bom === "\xEF\xBB\xBF" ) {
			fread( $handle, 3 );
		}

		$comma_count     = substr_count( (string) $sample, ',' );
		$semicolon_count = substr_count( (string) $sample, ';' );
		$tab_count       = substr_count( (string) $sample, "\t" );

		$delimiter = ',';
		if ( $semicolon_count > $comma_count && $semicolon_count > $tab_count ) {
			$delimiter = ';';
		} elseif ( $tab_count > $comma_count && $tab_count > $semicolon_count ) {
			$delimiter = "\t";
		}

		$raw_rows = array();
		while ( ( $row = fgetcsv( $handle, 0, $delimiter, '"', '\\' ) ) !== false ) {
			$clean_row = array_map( function( $v ) {
				return trim( html_entity_decode( (string) $v, ENT_QUOTES, 'UTF-8' ) );
			}, $row );

			// Filter out completely empty rows
			if ( count( array_filter( $clean_row ) ) > 0 ) {
				$raw_rows[] = $clean_row;
			}
		}
		fclose( $handle );

		return self::extract_columns_from_raw_rows( $raw_rows );
	}

	/**
	 * Parse XLSX file using native ZipArchive with zero external dependencies
	 */
	public static function parse_xlsx_file( $file_path ) {
		if ( ! class_exists( 'ZipArchive' ) ) {
			return new \WP_Error( 'ziparchive_missing', 'PHP ZipArchive extension is required to parse .xlsx files. Please upload a .csv file instead.' );
		}

		$zip = new ZipArchive();
		if ( $zip->open( $file_path ) !== true ) {
			return new \WP_Error( 'xlsx_open_failed', 'Could not open .xlsx archive. The file may be corrupt or encrypted.' );
		}

		// 1. Read shared strings
		$shared_strings = array();
		$ss_xml = $zip->getFromName( 'xl/sharedStrings.xml' );
		if ( $ss_xml ) {
			$xml = @simplexml_load_string( $ss_xml );
			if ( $xml && isset( $xml->si ) ) {
				foreach ( $xml->si as $si ) {
					if ( isset( $si->t ) ) {
						$shared_strings[] = (string) $si->t;
					} elseif ( isset( $si->r ) ) {
						$t_parts = array();
						foreach ( $si->r as $r ) {
							$t_parts[] = (string) $r->t;
						}
						$shared_strings[] = implode( '', $t_parts );
					} else {
						$shared_strings[] = '';
					}
				}
			}
		}

		// 2. Read sheet1.xml
		$sheet_xml = $zip->getFromName( 'xl/worksheets/sheet1.xml' );
		if ( ! $sheet_xml ) {
			$zip->close();
			return new \WP_Error( 'sheet_missing', 'Could not find worksheet (sheet1.xml) inside .xlsx file.' );
		}

		$xml = @simplexml_load_string( $sheet_xml );
		$zip->close();

		if ( ! $xml || ! isset( $xml->sheetData->row ) ) {
			return new \WP_Error( 'sheet_empty', 'Worksheet contains no row data.' );
		}

		$raw_rows = array();
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

				$cell_ref = (string) $attr['r'];
				$col_letters = preg_replace( '/[0-9]/', '', $cell_ref );
				$col_index = self::column_letter_to_index( $col_letters );
				$r_data[ $col_index ] = trim( html_entity_decode( $val, ENT_QUOTES, 'UTF-8' ) );
			}

			if ( count( array_filter( $r_data ) ) > 0 ) {
				// Fill missing column indexes with empty strings
				$max_col = max( array_keys( $r_data ) );
				$row_indexed = array();
				for ( $i = 0; $i <= max( 2, $max_col ); $i++ ) {
					$row_indexed[ $i ] = $r_data[ $i ] ?? '';
				}
				$raw_rows[] = $row_indexed;
			}
		}

		return self::extract_columns_from_raw_rows( $raw_rows );
	}

	/**
	 * Convert Excel Column Letter to 0-based Index (A=0, B=1, C=2...)
	 */
	public static function column_letter_to_index( $letters ) {
		$letters = strtoupper( $letters );
		$len = strlen( $letters );
		$idx = 0;
		for ( $i = 0; $i < $len; $i++ ) {
			$idx = $idx * 26 + ( ord( $letters[ $i ] ) - 64 );
		}
		return $idx - 1;
	}

	/**
	 * Identify header mapping and format into clean array of rows
	 */
	public static function extract_columns_from_raw_rows( $raw_rows ) {
		if ( empty( $raw_rows ) ) {
			return array();
		}

		$col_dept = 0;
		$col_l1   = 1;
		$col_l2   = 2;

		// Check first row for header keywords
		$header = $raw_rows[0];
		$has_header = false;

		foreach ( $header as $idx => $cell ) {
			$c = strtolower( trim( (string) $cell ) );
			if ( preg_match( '/dept|department|main/i', $c ) ) {
				$col_dept = $idx;
				$has_header = true;
			} elseif ( preg_match( '/level\s*1|sub[\s_-]?cat|category/i', $c ) ) {
				$col_l1 = $idx;
				$has_header = true;
			} elseif ( preg_match( '/level\s*2|type|sub[\s_-]?sub/i', $c ) ) {
				$col_l2 = $idx;
				$has_header = true;
			}
		}

		$data_rows = $has_header ? array_slice( $raw_rows, 1 ) : $raw_rows;
		$clean_rows = array();

		foreach ( $data_rows as $r ) {
			$dept = trim( (string) ( $r[ $col_dept ] ?? '' ) );
			$l1   = trim( (string) ( $r[ $col_l1 ] ?? '' ) );
			$l2   = trim( (string) ( $r[ $col_l2 ] ?? '' ) );

			if ( empty( $dept ) && empty( $l1 ) && empty( $l2 ) ) {
				continue;
			}

			$clean_rows[] = array(
				'dept' => $dept,
				'l1'   => $l1,
				'l2'   => $l2,
			);
		}

		return $clean_rows;
	}

	/**
	 * Build hierarchical tree from flat rows: $tree[dept][l1][l2]
	 */
	public static function build_hierarchy_tree( $rows ) {
		$tree = array();

		foreach ( $rows as $r ) {
			$dept = trim( $r['dept'] ?? '' );
			$l1   = trim( $r['l1'] ?? '' );
			$l2   = trim( $r['l2'] ?? '' );

			if ( empty( $dept ) ) {
				continue;
			}

			if ( ! isset( $tree[ $dept ] ) ) {
				$tree[ $dept ] = array();
			}

			if ( ! empty( $l1 ) ) {
				if ( ! isset( $tree[ $dept ][ $l1 ] ) ) {
					$tree[ $dept ][ $l1 ] = array();
				}
				if ( ! empty( $l2 ) ) {
					$tree[ $dept ][ $l1 ][ $l2 ] = true;
				}
			}
		}

		return $tree;
	}

	/**
	 * Find a category term strictly under a specific parent ID
	 */
	public static function find_term_under_parent( $name, $parent_id = 0 ) {
		$clean_name = trim( html_entity_decode( (string) $name, ENT_QUOTES, 'UTF-8' ) );
		$slug       = MegaMenuManager::make_slug( $clean_name );

		// 1. Direct name match under parent
		$terms = get_terms( array(
			'taxonomy'   => 'product_cat',
			'name'       => $clean_name,
			'parent'     => (int) $parent_id,
			'hide_empty' => false,
		) );
		if ( ! empty( $terms ) && ! is_wp_error( $terms ) ) {
			return (int) $terms[0]->term_id;
		}

		// 2. Direct slug match under parent
		$terms_slug = get_terms( array(
			'taxonomy'   => 'product_cat',
			'slug'       => $slug,
			'parent'     => (int) $parent_id,
			'hide_empty' => false,
		) );
		if ( ! empty( $terms_slug ) && ! is_wp_error( $terms_slug ) ) {
			return (int) $terms_slug[0]->term_id;
		}

		// 3. Fallback: inspect all children of this parent (case-insensitive / accent-insensitive)
		$children = get_terms( array(
			'taxonomy'   => 'product_cat',
			'parent'     => (int) $parent_id,
			'hide_empty' => false,
		) );
		if ( ! empty( $children ) && ! is_wp_error( $children ) ) {
			foreach ( $children as $child ) {
				if ( strcasecmp( $child->name, $clean_name ) === 0 || $child->slug === $slug ) {
					return (int) $child->term_id;
				}
			}
		}

		return 0;
	}

	/**
	 * Insert new term or update existing term in-place preserving its term ID
	 */
	public static function insert_or_update_term( $name, $parent_id = 0, $level = 0 ) {
		$clean_name = trim( html_entity_decode( (string) $name, ENT_QUOTES, 'UTF-8' ) );
		$slug       = MegaMenuManager::make_slug( $clean_name );
		$existing_id = self::find_term_under_parent( $clean_name, $parent_id );

		if ( $existing_id > 0 ) {
			// Update term name / meta in-place
			$term = get_term( $existing_id, 'product_cat' );
			if ( $term && $term->name !== $clean_name ) {
				wp_update_term( $existing_id, 'product_cat', array(
					'name' => $clean_name,
				) );
			}
			update_term_meta( $existing_id, '_hcc_level', (int) $level );
			return array(
				'id'     => $existing_id,
				'action' => 'updated',
				'name'   => $clean_name,
			);
		}

		// Insert brand new term
		$res = wp_insert_term( $clean_name, 'product_cat', array(
			'parent' => (int) $parent_id,
			'slug'   => $slug,
		) );

		if ( is_wp_error( $res ) ) {
			// Slug collision with another branch; append parent slug
			$parent_term = $parent_id > 0 ? get_term( $parent_id, 'product_cat' ) : null;
			$fallback_slug = $parent_term ? ( $slug . '-' . $parent_term->slug ) : ( $slug . '-' . time() );

			$res = wp_insert_term( $clean_name, 'product_cat', array(
				'parent' => (int) $parent_id,
				'slug'   => $fallback_slug,
			) );
		}

		if ( ! is_wp_error( $res ) ) {
			$term_id = is_array( $res ) ? (int) $res['term_id'] : (int) $res;
			update_term_meta( $term_id, '_hcc_level', (int) $level );
			return array(
				'id'     => $term_id,
				'action' => 'created',
				'name'   => $clean_name,
			);
		}

		return array(
			'id'     => 0,
			'action' => 'failed',
			'name'   => $clean_name,
			'error'  => is_wp_error( $res ) ? $res->get_error_message() : 'Unknown error',
		);
	}

	/**
	 * Analyze uploaded hierarchy vs current WooCommerce database (Dry-Run Preview)
	 */
	public static function analyze_hierarchy( $tree ) {
		$dept_count   = count( $tree );
		$l1_count     = 0;
		$l2_count     = 0;
		$total_unique = 0;

		$to_create = array();
		$to_update = array();
		$sheet_term_keys = array();
		$sample_preview  = array();

		foreach ( $tree as $dept_name => $l1_map ) {
			$total_unique++;
			$dept_id = self::find_term_under_parent( $dept_name, 0 );
			$sheet_term_keys[ '0_' . MegaMenuManager::make_slug( $dept_name ) ] = true;

			if ( $dept_id > 0 ) {
				$to_update[] = array( 'level' => 0, 'name' => $dept_name, 'parent' => 'Root', 'id' => $dept_id );
			} else {
				$to_create[] = array( 'level' => 0, 'name' => $dept_name, 'parent' => 'Root' );
			}

			if ( empty( $l1_map ) ) {
				$sample_preview[] = array(
					'dept'   => $dept_name,
					'l1'     => '—',
					'l2'     => '—',
					'status' => $dept_id > 0 ? 'Update' : 'New',
				);
			}

			foreach ( $l1_map as $l1_name => $l2_map ) {
				$l1_count++;
				$total_unique++;
				$l1_id = $dept_id > 0 ? self::find_term_under_parent( $l1_name, $dept_id ) : 0;
				$sheet_term_keys[ $dept_name . '_' . MegaMenuManager::make_slug( $l1_name ) ] = true;

				if ( $l1_id > 0 ) {
					$to_update[] = array( 'level' => 1, 'name' => $l1_name, 'parent' => $dept_name, 'id' => $l1_id );
				} else {
					$to_create[] = array( 'level' => 1, 'name' => $l1_name, 'parent' => $dept_name );
				}

				if ( empty( $l2_map ) ) {
					$sample_preview[] = array(
						'dept'   => $dept_name,
						'l1'     => $l1_name,
						'l2'     => '—',
						'status' => $l1_id > 0 ? 'Update' : 'New',
					);
				}

				foreach ( $l2_map as $l2_name => $unused ) {
					$l2_count++;
					$total_unique++;
					$l2_id = $l1_id > 0 ? self::find_term_under_parent( $l2_name, $l1_id ) : 0;
					$sheet_term_keys[ $l1_name . '_' . MegaMenuManager::make_slug( $l2_name ) ] = true;

					if ( $l2_id > 0 ) {
						$to_update[] = array( 'level' => 2, 'name' => $l2_name, 'parent' => $l1_name, 'id' => $l2_id );
					} else {
						$to_create[] = array( 'level' => 2, 'name' => $l2_name, 'parent' => $l1_name );
					}

					if ( count( $sample_preview ) < 25 ) {
						$sample_preview[] = array(
							'dept'   => $dept_name,
							'l1'     => $l1_name,
							'l2'     => $l2_name,
							'status' => $l2_id > 0 ? 'Update' : 'New',
						);
					}
				}
			}
		}

		// Find existing terms that are unlisted in the sheet
		$all_existing_terms = get_terms( array(
			'taxonomy'   => 'product_cat',
			'hide_empty' => false,
		) );

		$unlisted_terms = array();
		if ( ! is_wp_error( $all_existing_terms ) ) {
			foreach ( $all_existing_terms as $t ) {
				if ( $t->slug === 'uncategorized' ) {
					continue;
				}
				$p_term = $t->parent > 0 ? get_term( $t->parent, 'product_cat' ) : null;
				$p_key  = $p_term ? $p_term->name : '0';
				$term_key = $p_key . '_' . $t->slug;

				if ( ! isset( $sheet_term_keys[ $term_key ] ) ) {
					$unlisted_terms[] = array(
						'id'     => $t->term_id,
						'name'   => $t->name,
						'slug'   => $t->slug,
						'count'  => $t->count,
						'parent' => $p_term ? $p_term->name : 'Root',
					);
				}
			}
		}

		return array(
			'dept_count'       => $dept_count,
			'l1_count'         => $l1_count,
			'l2_count'         => $l2_count,
			'total_categories' => $total_unique,
			'to_create_count'  => count( $to_create ),
			'to_update_count'  => count( $to_update ),
			'unlisted_count'   => count( $unlisted_terms ),
			'to_create'        => $to_create,
			'to_update'        => $to_update,
			'unlisted_terms'   => $unlisted_terms,
			'sample_preview'   => $sample_preview,
		);
	}

	/**
	 * Apply Hierarchy Tree to WooCommerce in-place
	 */
	public static function apply_hierarchy( $tree, $options = array() ) {
		@set_time_limit( 300 );

		$update_existing       = ! empty( $options['update_existing'] );
		$clean_sync            = ! empty( $options['clean_sync'] );
		$reclassify_products   = ! empty( $options['reclassify_products'] );
		$sync_mega_menu        = ! empty( $options['sync_mega_menu'] );
		$revalidate_storefront = ! empty( $options['revalidate_storefront'] );

		$created_count = 0;
		$updated_count = 0;
		$deleted_count = 0;
		$messages      = array();
		$active_term_ids = array();

		// 1. Process Departments -> Level 1 -> Level 2
		foreach ( $tree as $dept_name => $l1_map ) {
			$dept_res = self::insert_or_update_term( $dept_name, 0, 0 );
			$dept_id  = $dept_res['id'];

			if ( $dept_res['action'] === 'created' ) $created_count++;
			elseif ( $dept_res['action'] === 'updated' ) $updated_count++;
			if ( $dept_id ) $active_term_ids[] = $dept_id;

			if ( ! $dept_id ) {
				$messages[] = sprintf( '⚠️ Failed to sync department: %s', $dept_name );
				continue;
			}

			if ( is_array( $l1_map ) ) {
				foreach ( $l1_map as $l1_name => $l2_map ) {
					$l1_res = self::insert_or_update_term( $l1_name, $dept_id, 1 );
					$l1_id  = $l1_res['id'];

					if ( $l1_res['action'] === 'created' ) $created_count++;
					elseif ( $l1_res['action'] === 'updated' ) $updated_count++;
					if ( $l1_id ) $active_term_ids[] = $l1_id;

					if ( ! $l1_id ) {
						$messages[] = sprintf( '⚠️ Failed to sync Level 1 category: %s (under %s)', $l1_name, $dept_name );
						continue;
					}

					if ( is_array( $l2_map ) ) {
						foreach ( $l2_map as $l2_name => $unused ) {
							$l2_res = self::insert_or_update_term( $l2_name, $l1_id, 2 );
							$l2_id  = $l2_res['id'];

							if ( $l2_res['action'] === 'created' ) $created_count++;
							elseif ( $l2_res['action'] === 'updated' ) $updated_count++;
							if ( $l2_id ) $active_term_ids[] = $l2_id;
						}
					}
				}
			}
		}

		$messages[] = sprintf( 'Processed hierarchy: %d categories created, %d updated in-place.', $created_count, $updated_count );

		// 2. Clean Sync: delete unlisted terms if option enabled
		if ( $clean_sync ) {
			$uncat = get_term_by( 'slug', 'uncategorized', 'product_cat' );
			$default_id = $uncat ? (int) $uncat->term_id : 0;

			$all_terms = get_terms( array(
				'taxonomy'   => 'product_cat',
				'hide_empty' => false,
				'fields'     => 'ids',
			) );

			if ( ! is_wp_error( $all_terms ) ) {
				$to_remove = array_diff( $all_terms, $active_term_ids );
				foreach ( $to_remove as $rem_id ) {
					if ( (int) $rem_id === $default_id ) {
						continue;
					}

					// Safely reassign any products to parent or uncategorized
					$term_obj = get_term( $rem_id, 'product_cat' );
					$fallback_parent = ( $term_obj && $term_obj->parent > 0 && in_array( (int) $term_obj->parent, $active_term_ids, true ) )
						? (int) $term_obj->parent
						: $default_id;

					$prods = get_objects_in_term( $rem_id, 'product_cat' );
					if ( ! empty( $prods ) && ! is_wp_error( $prods ) && $fallback_parent > 0 ) {
						foreach ( $prods as $pid ) {
							wp_set_object_terms( $pid, array( $fallback_parent ), 'product_cat', true );
						}
					}

					wp_delete_term( $rem_id, 'product_cat' );
					$deleted_count++;
				}
			}
			$messages[] = sprintf( 'Clean sync removed %d unlisted terms.', $deleted_count );
		}

		// 3. Auto-Reclassify Catalog Products
		$products_updated = 0;
		if ( $reclassify_products && class_exists( '\\HeadlessCommerceCore\\Core\\TaxonomyMigrator' ) ) {
			$all_products = get_posts( array(
				'post_type'      => 'product',
				'post_status'    => 'publish',
				'posts_per_page' => -1,
				'fields'         => 'ids',
			) );

			foreach ( $all_products as $pid ) {
				$pname = get_the_title( $pid );
				$cat_info = TaxonomyMigrator::categorize_product_name( $pname );
				$dept_name = $cat_info[0] ?? null;
				$l1_name   = $cat_info[1] ?? null;
				$l2_name   = $cat_info[2] ?? null;

				$assign_terms = array();
				$dept_id = 0;
				$l1_id   = 0;

				if ( ! empty( $dept_name ) ) {
					$dept_id = self::find_term_under_parent( $dept_name, 0 );
					if ( $dept_id ) $assign_terms[] = $dept_id;
				}
				if ( ! empty( $dept_name ) && ! empty( $l1_name ) && $dept_id ) {
					$l1_id = self::find_term_under_parent( $l1_name, $dept_id );
					if ( $l1_id ) $assign_terms[] = $l1_id;
				}
				if ( ! empty( $dept_name ) && ! empty( $l1_name ) && ! empty( $l2_name ) && $l1_id ) {
					$l2_id = self::find_term_under_parent( $l2_name, $l1_id );
					if ( $l2_id ) $assign_terms[] = $l2_id;
				}

				$assign_terms = array_values( array_filter( array_unique( $assign_terms ) ) );
				if ( ! empty( $assign_terms ) ) {
					wp_set_object_terms( $pid, $assign_terms, 'product_cat', false );
					wp_update_term_count_now( $assign_terms, 'product_cat' );
					$products_updated++;
				}
			}
			$messages[] = sprintf( 'Re-assigned %d catalog products to matching hierarchy categories.', $products_updated );
		}

		// 4. Update Mega Menu configuration and purge transients
		if ( $sync_mega_menu ) {
			$departments_data = array();
			foreach ( $tree as $dept_name => $l1_map ) {
				$dept_clean = MegaMenuManager::clean_text( $dept_name );
				$departments_data[ $dept_clean ] = array(
					'name'       => $dept_clean,
					'hidden'     => false,
					'categories' => array(),
				);

				if ( is_array( $l1_map ) ) {
					foreach ( $l1_map as $l1_name => $l2_map ) {
						$l1_clean = MegaMenuManager::clean_text( $l1_name );
						$l1_data = array(
							'name'      => $l1_clean,
							'hidden'    => false,
							'subgroups' => array(),
						);

						if ( is_array( $l2_map ) ) {
							foreach ( $l2_map as $l2_name => $unused ) {
								$l2_clean = MegaMenuManager::clean_text( $l2_name );
								$l1_data['subgroups'][ $l2_clean ] = array(
									'name'   => $l2_clean,
									'hidden' => false,
									'items'  => array(),
								);
							}
						}
						$departments_data[ $dept_clean ]['categories'][ $l1_clean ] = $l1_data;
					}
				}
			}

			$mega_config = array(
				'nav_items'   => MegaMenuManager::get_default_nav_items(),
				'departments' => $departments_data,
			);

			update_option( MegaMenuManager::OPTION_KEY, $mega_config );
			update_option( 'hcc_mega_menu_version', MegaMenuManager::SCHEMA_VERSION );
			delete_transient( MegaMenuManager::TRANSIENT_KEY );
			$messages[] = 'Mega Menu configuration synchronized with new taxonomy.';
		}

		// 5. Purge WooCommerce and query transients
		delete_transient( 'hcc_categories_cache' );
		delete_transient( 'hcc_products_query_*' );
		delete_option( 'product_cat_children' );
		if ( function_exists( 'wc_delete_product_transients' ) ) {
			wc_delete_product_transients();
		}

		// 6. Trigger Next.js on-demand ISR revalidation
		if ( $revalidate_storefront ) {
			MegaMenuManager::trigger_nextjs_revalidation();
			$messages[] = 'Triggered Next.js ISR on-demand revalidation (/api/revalidate).';
		}

		// 7. Get final term counts
		$final_terms = get_terms( array(
			'taxonomy'   => 'product_cat',
			'hide_empty' => false,
		) );
		$total_terms_now = is_wp_error( $final_terms ) ? 0 : count( $final_terms );

		// 8. Live Sync to Storefront JSON Snapshots if file paths exist
		self::sync_snapshots_if_possible( $final_terms, $tree );

		return array(
			'success'          => true,
			'created_count'    => $created_count,
			'updated_count'    => $updated_count,
			'deleted_count'    => $deleted_count,
			'products_updated' => $products_updated,
			'total_terms_now'  => $total_terms_now,
			'messages'         => $messages,
		);
	}

	/**
	 * Synchronize snapshot JSON files in storefront workspace if writable
	 */
	public static function sync_snapshots_if_possible( $terms, $tree ) {
		$workspace_dir = dirname( dirname( dirname( dirname( __DIR__ ) ) ) );
		$cats_snapshot_file = $workspace_dir . '/apps/storefront/src/data/categories-snapshot.json';
		$mega_tax_file      = $workspace_dir . '/apps/storefront/src/data/mega_menu_taxonomy.json';

		if ( ! is_wp_error( $terms ) && file_exists( dirname( $cats_snapshot_file ) ) ) {
			$cats_list = array();
			foreach ( $terms as $t ) {
				if ( $t->slug === 'uncategorized' ) continue;
				$level = (int) get_term_meta( $t->term_id, '_hcc_level', true );
				$cats_list[] = array(
					'id'          => (int) $t->term_id,
					'name'        => html_entity_decode( $t->name, ENT_QUOTES, 'UTF-8' ),
					'slug'        => $t->slug,
					'description' => (string) $t->description,
					'count'       => (int) $t->count,
					'parent'      => (int) $t->parent,
					'level'       => $level,
					'image'       => '',
					'wpId'        => (int) $t->term_id,
				);
			}

			usort( $cats_list, function( $a, $b ) {
				if ( $a['level'] === $b['level'] ) return strcmp( $a['name'], $b['name'] );
				return $a['level'] <=> $b['level'];
			} );

			@file_put_contents( $cats_snapshot_file, json_encode( $cats_list, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) );
		}

		if ( ! empty( $tree ) && file_exists( dirname( $mega_tax_file ) ) ) {
			$clean_mega = array();
			foreach ( $tree as $d => $l1s ) {
				$clean_mega[ $d ] = array();
				if ( is_array( $l1s ) ) {
					foreach ( $l1s as $l1 => $l2s ) {
						$clean_mega[ $d ][ $l1 ] = array();
						if ( is_array( $l2s ) ) {
							foreach ( $l2s as $l2 => $u ) {
								$clean_mega[ $d ][ $l1 ][ $l2 ] = array();
							}
						}
					}
				}
			}
			@file_put_contents( $mega_tax_file, json_encode( $clean_mega, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) );
		}
	}

	/**
	 * Render the Admin Importer Page
	 */
	public static function render_admin_page() {
		$notice = get_transient( self::NOTICE_TRANSIENT );
		delete_transient( self::NOTICE_TRANSIENT );

		$preview_data = get_transient( self::PREVIEW_TRANSIENT );

		$existing_terms = get_terms( array(
			'taxonomy'   => 'product_cat',
			'hide_empty' => false,
		) );
		$term_count = is_wp_error( $existing_terms ) ? 0 : count( $existing_terms );

		$all_products = wp_count_posts( 'product' );
		$product_count = isset( $all_products->publish ) ? (int) $all_products->publish : 0;
		?>
		<div class="wrap" style="max-width:1100px;">
			<div style="display:flex; justify-content:space-between; align-items:center; margin:20px 0 16px;">
				<h1 style="font-size:24px; font-weight:700; margin:0; display:flex; align-items:center; gap:10px;">
					<span>📁</span> Category & Hierarchy Importer
				</h1>
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=hcc-mega-menu' ) ); ?>" class="button button-secondary" style="display:flex; align-items:center; gap:6px;">
					<span>🎛️</span> Open Mega Menu Builder
				</a>
			</div>

			<p style="font-size:15px; color:#555; line-height:1.6; margin-bottom:20px;">
				Manage the official 3-tier product taxonomy (<strong>Department $\rightarrow$ Level 1 (Category) $\rightarrow$ Level 2 (Type)</strong>).
				Upload your spreadsheet in <code>.xlsx</code> or <code>.csv</code> to update categories in-place without losing product assignments or breaking SEO URLs.
			</p>

			<?php if ( ! empty( $notice ) ) : ?>
				<div class="notice notice-<?php echo esc_attr( $notice['type'] ); ?> is-dismissible" style="padding:14px 18px; border-left-width:5px; margin-bottom:20px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
					<p style="font-size:15px; font-weight:600; margin:0;"><?php echo esc_html( $notice['message'] ); ?></p>
					<?php if ( ! empty( $notice['details'] ) && is_array( $notice['details'] ) ) : ?>
						<ul style="margin:10px 0 0 20px; list-style:disc; font-size:13px; color:#444;">
							<?php foreach ( $notice['details'] as $detail ) : ?>
								<li><?php echo esc_html( $detail ); ?></li>
							<?php endforeach; ?>
						</ul>
					<?php endif; ?>
				</div>
			<?php endif; ?>

			<!-- Status Metrics Grid -->
			<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:16px; margin-bottom:24px;">
				<div style="background:#fff; border:1px solid #ccd0d4; border-radius:8px; padding:18px 20px; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
					<span style="font-size:12px; font-weight:700; text-transform:uppercase; color:#777; letter-spacing:0.5px;">Current Categories</span>
					<div style="font-size:28px; font-weight:800; color:#0E5C63; margin-top:6px;"><?php echo (int) $term_count; ?></div>
					<span style="font-size:12px; color:#888;">in WooCommerce database</span>
				</div>
				<div style="background:#fff; border:1px solid #ccd0d4; border-radius:8px; padding:18px 20px; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
					<span style="font-size:12px; font-weight:700; text-transform:uppercase; color:#777; letter-spacing:0.5px;">Catalog Products</span>
					<div style="font-size:28px; font-weight:800; color:#1e293b; margin-top:6px;"><?php echo (int) $product_count; ?></div>
					<span style="font-size:12px; color:#888;">published active items</span>
				</div>
				<div style="background:#fff; border:1px solid #ccd0d4; border-radius:8px; padding:18px 20px; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
					<span style="font-size:12px; font-weight:700; text-transform:uppercase; color:#777; letter-spacing:0.5px;">Storefront Sync</span>
					<div style="font-size:28px; font-weight:800; color:#15803d; margin-top:6px;">Active</div>
					<span style="font-size:12px; color:#888;">Next.js ISR On-Demand</span>
				</div>
			</div>

			<!-- Step 1: Download Templates -->
			<div style="background:#fff; border:1px solid #ccd0d4; border-radius:8px; padding:24px; margin-bottom:24px; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
				<h2 style="font-size:18px; font-weight:700; margin:0 0 10px; display:flex; align-items:center; gap:8px;">
					<span>1.</span> Download Standard 3-Column Template
				</h2>
				<p style="color:#555; line-height:1.6; margin-bottom:18px;">
					Download the pre-formatted taxonomy spreadsheet containing the official 3 levels:
					<strong>Department</strong> $\rightarrow$ <strong>Level 1 (Category)</strong> $\rightarrow$ <strong>Level 2 (Type)</strong>.
					Pre-populated with all canonical categories.
				</p>
				<div style="display:flex; flex-wrap:wrap; gap:12px;">
					<a href="<?php echo esc_url( admin_url( 'admin.php?page=hcc-taxonomy-importer&hcc_download_template=xlsx' ) ); ?>" class="button button-secondary" style="font-weight:600; padding:6px 16px; height:auto; display:flex; align-items:center; gap:6px;">
						<span>📊</span> Download Excel Template (.xlsx)
					</a>
					<a href="<?php echo esc_url( admin_url( 'admin.php?page=hcc-taxonomy-importer&hcc_download_template=csv' ) ); ?>" class="button button-secondary" style="font-weight:600; padding:6px 16px; height:auto; display:flex; align-items:center; gap:6px;">
						<span>📄</span> Download CSV Template (.csv)
					</a>
				</div>
			</div>

			<!-- Dry-Run Preview Table (If active) -->
			<?php if ( ! empty( $preview_data ) && ! empty( $preview_data['analysis'] ) ) : 
				$an = $preview_data['analysis'];
			?>
				<div id="preview" style="background:#f8fafc; border:2px solid #0284c7; border-radius:8px; padding:24px; margin-bottom:24px; box-shadow:0 4px 12px rgba(2,132,199,0.08);">
					<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:14px; margin-bottom:18px;">
						<div>
							<h2 style="font-size:18px; font-weight:700; color:#0369a1; margin:0;">
								🔍 Dry-Run Inspection & Validation Preview
							</h2>
							<span style="font-size:13px; color:#64748b;">
								File: <strong><?php echo esc_html( $preview_data['filename'] ); ?></strong>
							</span>
						</div>
						<form method="post" action="<?php echo esc_url( admin_url( 'admin.php?page=hcc-taxonomy-importer' ) ); ?>">
							<?php wp_nonce_field( 'hcc_taxonomy_importer_action', 'hcc_taxonomy_nonce' ); ?>
							<input type="hidden" name="hcc_taxonomy_action" value="cancel_preview">
							<button type="submit" class="button" style="color:#ef4444; border-color:#fca5a5;">Dismiss Preview</button>
						</form>
					</div>

					<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-bottom:20px;">
						<div style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; padding:12px 14px;">
							<div style="font-size:11px; text-transform:uppercase; color:#64748b; font-weight:700;">Departments</div>
							<div style="font-size:22px; font-weight:800; color:#0f172a; margin-top:2px;"><?php echo (int) $an['dept_count']; ?></div>
						</div>
						<div style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; padding:12px 14px;">
							<div style="font-size:11px; text-transform:uppercase; color:#64748b; font-weight:700;">Level 1 Categories</div>
							<div style="font-size:22px; font-weight:800; color:#0f172a; margin-top:2px;"><?php echo (int) $an['l1_count']; ?></div>
						</div>
						<div style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; padding:12px 14px;">
							<div style="font-size:11px; text-transform:uppercase; color:#64748b; font-weight:700;">Level 2 Types</div>
							<div style="font-size:22px; font-weight:800; color:#0f172a; margin-top:2px;"><?php echo (int) $an['l2_count']; ?></div>
						</div>
						<div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:6px; padding:12px 14px;">
							<div style="font-size:11px; text-transform:uppercase; color:#047857; font-weight:700;">To Create (New)</div>
							<div style="font-size:22px; font-weight:800; color:#065f46; margin-top:2px;"><?php echo (int) $an['to_create_count']; ?></div>
						</div>
						<div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:6px; padding:12px 14px;">
							<div style="font-size:11px; text-transform:uppercase; color:#1d4ed8; font-weight:700;">To Update (In-Place)</div>
							<div style="font-size:22px; font-weight:800; color:#1e40af; margin-top:2px;"><?php echo (int) $an['to_update_count']; ?></div>
						</div>
					</div>

					<!-- Sample Rows Table -->
					<h3 style="font-size:14px; font-weight:700; margin:16px 0 8px; color:#334155;">Hierarchy Sample Rows Preview:</h3>
					<div style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; overflow:hidden; margin-bottom:20px; max-height:300px; overflow-y:auto;">
						<table class="widefat striped" style="margin:0; border:none;">
							<thead>
								<tr>
									<th style="font-weight:700;">Department (Level 0)</th>
									<th style="font-weight:700;">Category (Level 1)</th>
									<th style="font-weight:700;">Type (Level 2)</th>
									<th style="font-weight:700; width:120px;">Sync Action</th>
								</tr>
							</thead>
							<tbody>
								<?php foreach ( $an['sample_preview'] as $row ) : ?>
									<tr>
										<td><strong><?php echo esc_html( $row['dept'] ); ?></strong></td>
										<td><?php echo esc_html( $row['l1'] ); ?></td>
										<td><?php echo esc_html( $row['l2'] ); ?></td>
										<td>
											<?php if ( $row['status'] === 'New' ) : ?>
												<span style="display:inline-block; background:#dcfce7; color:#15803d; font-weight:600; font-size:11px; padding:2px 8px; border-radius:10px;">🟢 Create New</span>
											<?php else : ?>
												<span style="display:inline-block; background:#dbeafe; color:#1d4ed8; font-weight:600; font-size:11px; padding:2px 8px; border-radius:10px;">🔵 In-Place Update</span>
											<?php endif; ?>
										</td>
									</tr>
								<?php endforeach; ?>
							</tbody>
						</table>
					</div>

					<!-- Apply Form -->
					<form method="post" action="<?php echo esc_url( admin_url( 'admin.php?page=hcc-taxonomy-importer' ) ); ?>">
						<?php wp_nonce_field( 'hcc_taxonomy_importer_action', 'hcc_taxonomy_nonce' ); ?>
						<input type="hidden" name="hcc_taxonomy_action" value="apply_preview">

						<div style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; padding:16px; margin-bottom:18px;">
							<h4 style="margin:0 0 10px; font-size:13px; text-transform:uppercase; color:#475569;">Sync Options for this Import:</h4>
							<label style="display:block; margin-bottom:8px;">
								<input type="checkbox" name="update_existing" value="1" checked />
								<strong>Smart In-Place Update:</strong> Preserves existing category IDs, product links, and SEO URLs.
							</label>
							<label style="display:block; margin-bottom:8px;">
								<input type="checkbox" name="reclassify_products" value="1" checked />
								<strong>Reclassify Catalog Products:</strong> Automatically maps all 198 catalog products into these categories.
							</label>
							<label style="display:block; margin-bottom:8px;">
								<input type="checkbox" name="sync_mega_menu" value="1" checked />
								<strong>Update Mega Menu Config:</strong> Automatically refreshes the Mega Menu Builder options.
							</label>
							<label style="display:block; margin-bottom:8px;">
								<input type="checkbox" name="revalidate_storefront" value="1" checked />
								<strong>Trigger Next.js Storefront Revalidation:</strong> Instantly invalidates ISR cache.
							</label>
							<label style="display:block; color:#dc2626;">
								<input type="checkbox" name="clean_sync" value="1" />
								<strong>Clean Sync:</strong> Remove unlisted categories from database (affected products will roll up to parent).
							</label>
						</div>

						<div style="display:flex; gap:12px; align-items:center;">
							<button type="submit" class="button button-primary button-hero" style="font-weight:700;">
								🚀 Confirm & Apply Category Hierarchy Now
							</button>
						</div>
					</form>
				</div>
			<?php endif; ?>

			<!-- Step 2: Upload Spreadsheet -->
			<div style="background:#fff; border:1px solid #ccd0d4; border-radius:8px; padding:24px; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
				<h2 style="font-size:18px; font-weight:700; margin:0 0 10px; display:flex; align-items:center; gap:8px;">
					<span>2.</span> Upload Category Spreadsheet
				</h2>
				<p style="color:#555; line-height:1.6; margin-bottom:20px;">
					Select your completed <code>.xlsx</code> or <code>.csv</code> file. You can run a <strong>Dry-Run Preview</strong> to verify before making any changes, or <strong>Apply Directly</strong>.
				</p>

				<form method="post" enctype="multipart/form-data" action="<?php echo esc_url( admin_url( 'admin.php?page=hcc-taxonomy-importer' ) ); ?>">
					<?php wp_nonce_field( 'hcc_taxonomy_importer_action', 'hcc_taxonomy_nonce' ); ?>

					<div style="margin-bottom:20px;">
						<label style="display:block; font-weight:600; margin-bottom:8px;">Choose File (.xlsx or .csv):</label>
						<input type="file" name="taxonomy_file" accept=".xlsx, .csv, .txt" required style="padding:12px; border:1px dashed #0E5C63; width:100%; max-width:550px; background:#f0fdf4; border-radius:6px; cursor:pointer;" />
					</div>

					<div style="background:#f8fafc; border:1px solid #e2e8f0; padding:16px; border-radius:6px; margin-bottom:22px; max-width:650px;">
						<h3 style="margin:0 0 10px; font-size:13px; text-transform:uppercase; color:#475569;">⚙️ Import Options:</h3>
						<label style="display:block; margin-bottom:8px;">
							<input type="checkbox" name="update_existing" value="1" checked />
							<strong>Smart In-Place Update:</strong> Preserves existing term IDs and product associations.
						</label>
						<label style="display:block; margin-bottom:8px;">
							<input type="checkbox" name="reclassify_products" value="1" checked />
							<strong>Reclassify Catalog Products:</strong> Automatically maps products to new categories.
						</label>
						<label style="display:block; margin-bottom:8px;">
							<input type="checkbox" name="sync_mega_menu" value="1" checked />
							<strong>Sync Mega Menu Builder:</strong> Keeps WordPress menu builder in sync.
						</label>
						<label style="display:block; margin-bottom:8px;">
							<input type="checkbox" name="revalidate_storefront" value="1" checked />
							<strong>Instant Storefront Revalidation:</strong> Purges Next.js ISR caches.
						</label>
						<label style="display:block; color:#dc2626;">
							<input type="checkbox" name="clean_sync" value="1" />
							<strong>Clean Sync:</strong> Remove unlisted categories from database.
						</label>
					</div>

					<div style="display:flex; flex-wrap:wrap; gap:12px; align-items:center;">
						<button type="submit" name="hcc_taxonomy_action" value="preview_file" class="button button-secondary" style="font-weight:600; padding:8px 20px; height:auto; display:flex; align-items:center; gap:6px;">
							<span>🔍</span> Run Dry-Run Preview First
						</button>
						<button type="submit" name="hcc_taxonomy_action" value="upload_and_apply" class="button button-primary" style="font-weight:700; padding:8px 24px; height:auto; background:#0E5C63; border-color:#0b494f; display:flex; align-items:center; gap:6px;" onclick="return confirm('Apply category hierarchy directly to WooCommerce?');">
							<span>⚡</span> Upload & Apply Directly
						</button>
					</div>
				</form>
			</div>
		</div>
		<?php
	}
}
