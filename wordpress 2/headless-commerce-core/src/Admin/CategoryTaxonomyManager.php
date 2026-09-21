<?php

namespace HeadlessCommerceCore\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Category Taxonomy Manager & Importer for Master Excel Taxonomy
 */
class CategoryTaxonomyManager {

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_admin_menu' ), 20 );
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );
		add_filter( 'term_link', array( __CLASS__, 'filter_product_cat_link' ), 10, 3 );
		add_action( 'admin_init', function() {
			if ( taxonomy_exists( 'product_cat' ) ) {
				$cat_count = wp_count_terms( array( 'taxonomy' => 'product_cat', 'hide_empty' => false ) );
				if ( ! is_wp_error( $cat_count ) && intval( $cat_count ) <= 1 ) {
					self::import_master_taxonomy();
				}
			}
		} );
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
			'wall-decor-and-mirrors',
			'lighting',
			'rugs-and-floor-coverings',
			'storage-and-organization',
			'kitchen-and-tabletop',
			'outdoor-and-garden',
			'kids-and-baby-home',
			'pet-home',
			'kids-and-pet-home',
		);

		if ( in_array( $chain[0], $known_depts, true ) ) {
			return '/' . implode( '/', $chain );
		}

		return '/collections/' . implode( '/', $chain );
	}

	public static function add_admin_menu() {
		add_submenu_page(
			'headless-commerce-core',
			__( 'Master Taxonomy Importer', 'headless-commerce-core' ),
			__( 'Taxonomy Importer', 'headless-commerce-core' ),
			'manage_options',
			'hcc-taxonomy-importer',
			array( __CLASS__, 'render_admin_page' )
		);
	}

	public static function register_rest_routes() {
		register_rest_route( 'hcc/v1', '/taxonomy/import-master', array(
			'methods'             => \WP_REST_Server::CREATABLE,
			'callback'            => array( __CLASS__, 'handle_rest_import' ),
			'permission_callback' => '__return_true',
		) );
	}

	public static function handle_rest_import( $request ) {
		$result = self::import_master_taxonomy();
		return new \WP_REST_Response( array(
			'success' => true,
			'data'    => $result,
		), 200 );
	}

	public static function render_admin_page() {
		$imported = false;
		$msg      = '';
		$stats    = null;

		if ( isset( $_POST['hcc_action'] ) && $_POST['hcc_action'] === 'import_taxonomy' && check_admin_referer( 'hcc_import_taxonomy_nonce' ) ) {
			$stats    = self::import_master_taxonomy();
			$imported = true;
			$msg      = 'Master Category Taxonomy imported successfully!';
		}

		$existing_terms = get_terms( array(
			'taxonomy'   => 'product_cat',
			'hide_empty' => false,
		) );
		$count = is_wp_error( $existing_terms ) ? 0 : count( $existing_terms );
		?>
		<div class="wrap">
			<h1 style="font-size:24px; font-weight:600; margin-bottom:16px;">⚡ Master Product Category Taxonomy Importer</h1>
			<p style="font-size:15px; color:#555; max-width:700px;">
				Import the official <strong>Furniture, Home Decor, Textiles & Lifestyle Category Master Taxonomy</strong> directly into WooCommerce product categories (<code>product_cat</code>).
			</p>

			<?php if ( $imported && $stats ) : ?>
				<div class="notice notice-success is-dismissible" style="padding:12px; margin-top:16px;">
					<p style="font-size:16px; font-weight:600; margin:0 0 8px; color:#155724;">✅ <?php echo esc_html( $msg ); ?></p>
					<ul style="margin:0; padding-left:20px; font-size:14px; line-height:1.6;">
						<li><strong>Departments (Level 0):</strong> <?php echo (int) $stats['dept_count']; ?></li>
						<li><strong>Level 1 Subcategories:</strong> <?php echo (int) $stats['l1_count']; ?></li>
						<li><strong>Level 2 Subcategories:</strong> <?php echo (int) $stats['l2_count']; ?></li>
						<li><strong>Level 3 Subcategories:</strong> <?php echo (int) $stats['l3_count']; ?></li>
						<li><strong>Total Product Categories Created:</strong> <?php echo (int) $stats['total_created']; ?></li>
					</ul>
				</div>
			<?php endif; ?>

			<div style="background:#fff; border:1px solid #ccd0d4; padding:24px; border-radius:6px; max-width:700px; margin-top:20px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
				<h3 style="margin-top:0; border-bottom:1px solid #eee; padding-bottom:10px;">Taxonomy Status</h3>
				<p style="font-size:16px;">Current Total WooCommerce Categories in Database: <strong><?php echo (int) $count; ?></strong></p>

				<form method="post" action="" style="margin-top:24px;">
					<?php wp_nonce_field( 'hcc_import_taxonomy_nonce' ); ?>
					<input type="hidden" name="hcc_action" value="import_taxonomy">
					<p style="color:#d9534f; font-size:13px; font-weight:600;">
						⚠️ WARNING: Clicking this button will delete all old product categories and replace them with the 10 Master Departments & multi-level subcategories!
					</p>
					<button type="submit" class="button button-primary button-hero" onclick="return confirm('Are you sure you want to delete existing product categories and import the new Master Taxonomy?');">
						⚡ Reset & Import Master Categories Now
					</button>
				</form>
			</div>
		</div>
		<?php
	}

	public static function import_master_taxonomy() {
		if ( ! function_exists( 'wp_insert_term' ) ) {
			require_once ABSPATH . 'wp-admin/includes/taxonomy.php';
		}

		// 1. Delete all existing product_cat terms
		$existing = get_terms( array(
			'taxonomy'   => 'product_cat',
			'hide_empty' => false,
		) );

		if ( ! is_wp_error( $existing ) && is_array( $existing ) ) {
			foreach ( $existing as $t ) {
				wp_delete_term( $t->term_id, 'product_cat' );
			}
		}

		// 2. Load JSON data
		$json_file = HCC_PLUGIN_DIR . 'master_category_taxonomy.json';
		if ( ! file_exists( $json_file ) ) {
			return array( 'error' => 'master_category_taxonomy.json not found' );
		}

		$data = json_decode( file_get_contents( $json_file ), true );
		if ( ! is_array( $data ) ) {
			return array( 'error' => 'Invalid JSON taxonomy data' );
		}

		$dept_count    = 0;
		$l1_count      = 0;
		$l2_count      = 0;
		$l3_count      = 0;
		$total_created = 0;

		$make_slug = function( $name ) {
			$slug = strtolower( (string) $name );
			$slug = str_replace( array( '&', '/', ' ', '  ' ), array( 'and', '-', '-', '-' ), $slug );
			$slug = preg_replace( '/[^a-z0-9\-]/', '', $slug );
			return trim( preg_replace( '/-+/', '-', $slug ), '-' );
		};

		// 3. Process Departments -> L1 -> L2 -> L3
		foreach ( $data as $dept_name => $l1_map ) {
			$dept_slug = $make_slug( $dept_name );
			$dept_term = wp_insert_term( $dept_name, 'product_cat', array(
				'slug'   => $dept_slug,
				'parent' => 0,
			) );

			if ( is_wp_error( $dept_term ) ) {
				$dept_id = isset( $dept_term->error_data['term_exists'] ) ? $dept_term->error_data['term_exists'] : 0;
			} else {
				$dept_id = $dept_term['term_id'];
				$dept_count++;
				$total_created++;
			}

			if ( ! $dept_id ) continue;
			update_term_meta( $dept_id, '_hcc_level', 0 );

			if ( is_array( $l1_map ) ) {
				foreach ( $l1_map as $l1_name => $l2_map ) {
					$l1_slug = $make_slug( $l1_name );
					$l1_term = wp_insert_term( $l1_name, 'product_cat', array(
						'slug'   => $l1_slug,
						'parent' => $dept_id,
					) );

					if ( is_wp_error( $l1_term ) ) {
						$l1_id = isset( $l1_term->error_data['term_exists'] ) ? $l1_term->error_data['term_exists'] : 0;
					} else {
						$l1_id = $l1_term['term_id'];
						$l1_count++;
						$total_created++;
					}

					if ( ! $l1_id ) continue;
					update_term_meta( $l1_id, '_hcc_level', 1 );

					if ( is_array( $l2_map ) ) {
						foreach ( $l2_map as $l2_name => $l3_list ) {
							$l2_slug = $make_slug( $l2_name );
							$l2_term = wp_insert_term( $l2_name, 'product_cat', array(
								'slug'   => $l2_slug,
								'parent' => $l1_id,
							) );

							if ( is_wp_error( $l2_term ) ) {
								$l2_id = isset( $l2_term->error_data['term_exists'] ) ? $l2_term->error_data['term_exists'] : 0;
							} else {
								$l2_id = $l2_term['term_id'];
								$l2_count++;
								$total_created++;
							}

							if ( ! $l2_id ) continue;
							update_term_meta( $l2_id, '_hcc_level', 2 );

							if ( is_array( $l3_list ) ) {
								foreach ( $l3_list as $l3_item ) {
									$l3_name = is_array( $l3_item ) ? $l3_item['name'] : $l3_item;
									$l3_slug = $make_slug( $l3_name );
									$l3_term = wp_insert_term( $l3_name, 'product_cat', array(
										'slug'   => $l3_slug,
										'parent' => $l2_id,
									) );

									if ( is_wp_error( $l3_term ) ) {
										$l3_id = isset( $l3_term->error_data['term_exists'] ) ? $l3_term->error_data['term_exists'] : 0;
									} else {
										$l3_id = $l3_term['term_id'];
										$l3_count++;
										$total_created++;
									}

									if ( $l3_id && is_array( $l3_item ) ) {
										update_term_meta( $l3_id, '_hcc_level', 3 );
										if ( ! empty( $l3_item['facets'] ) ) update_term_meta( $l3_id, '_hcc_facets', $l3_item['facets'] );
										if ( ! empty( $l3_item['styles'] ) ) update_term_meta( $l3_id, '_hcc_styles', $l3_item['styles'] );
										if ( ! empty( $l3_item['room'] ) ) update_term_meta( $l3_id, '_hcc_room', $l3_item['room'] );
									}
								}
							}
						}
					}
				}
			}
		}

		delete_option( 'product_cat_children' );
		delete_transient( 'hcc_categories_cache' );

		return array(
			'dept_count'    => $dept_count,
			'l1_count'      => $l1_count,
			'l2_count'      => $l2_count,
			'l3_count'      => $l3_count,
			'total_created' => $total_created,
		);
	}
}
