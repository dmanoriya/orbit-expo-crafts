<?php

namespace HeadlessCommerceCore\Core;

use HeadlessCommerceCore\Admin\MegaMenuManager;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Automates the migration of WooCommerce product_cat taxonomy
 * and product assignments to the final 3-tier taxonomy.
 */
class TaxonomyMigrator {

	public static function run_migration( $purge = true ) {
		@set_time_limit( 300 );

		if ( ! function_exists( 'wp_insert_term' ) ) {
			require_once ABSPATH . 'wp-admin/includes/taxonomy.php';
		}

		$json_file = HCC_PLUGIN_DIR . 'master_category_taxonomy.json';
		if ( ! file_exists( $json_file ) ) {
			return array( 'success' => false, 'error' => 'master_category_taxonomy.json not found' );
		}

		$raw_tax = json_decode( file_get_contents( $json_file ), true );
		if ( ! is_array( $raw_tax ) || empty( $raw_tax ) ) {
			return array( 'success' => false, 'error' => 'Invalid taxonomy json' );
		}

		$deleted_terms = 0;

		// 0. PURGE EXISTING CATEGORIES IF REQUESTED
		if ( $purge ) {
			// Ensure default uncategorized term exists and is set as default
			$uncat = get_term_by( 'slug', 'uncategorized', 'product_cat' );
			$default_cat_id = 0;
			if ( $uncat ) {
				$default_cat_id = (int) $uncat->term_id;
			} else {
				$uncat_res = wp_insert_term( 'Uncategorized', 'product_cat', array( 'slug' => 'uncategorized' ) );
				if ( ! is_wp_error( $uncat_res ) ) {
					$default_cat_id = is_array( $uncat_res ) ? (int) $uncat_res['term_id'] : (int) $uncat_res;
				}
			}

			if ( $default_cat_id ) {
				update_option( 'default_product_cat', $default_cat_id );
			}

			// Clean deletion loop (leaves to root or multi-pass)
			for ( $pass = 0; $pass < 6; $pass++ ) {
				$all_terms = get_terms( array(
					'taxonomy'   => 'product_cat',
					'hide_empty' => false,
					'fields'     => 'ids',
				) );

				if ( is_wp_error( $all_terms ) || empty( $all_terms ) ) {
					break;
				}

				$to_delete = array_filter( $all_terms, function( $id ) use ( $default_cat_id ) {
					return (int) $id !== (int) $default_cat_id;
				} );

				if ( empty( $to_delete ) ) {
					break;
				}

				foreach ( $to_delete as $tid ) {
					wp_delete_term( (int) $tid, 'product_cat' );
					$deleted_terms++;
				}
				clean_term_cache( $to_delete, 'product_cat' );
			}
		}

		$created_terms = 0;
		$term_map      = array(); // key -> term_id

		// Helper to ensure term exists
		$ensure_term = function( $name, $parent_id = 0 ) use ( &$term_map, &$created_terms ) {
			$clean_name = trim( html_entity_decode( (string) $name, ENT_QUOTES, 'UTF-8' ) );
			$slug = MegaMenuManager::make_slug( $clean_name );
			$cache_key  = $slug . '_' . $parent_id;

			if ( isset( $term_map[ $cache_key ] ) ) {
				return $term_map[ $cache_key ];
			}

			// Check if term exists with this parent
			$existing = term_exists( $clean_name, 'product_cat', $parent_id );
			if ( ! $existing ) {
				$existing = term_exists( $slug, 'product_cat', $parent_id );
			}

			if ( $existing && ! is_wp_error( $existing ) ) {
				$term_id = is_array( $existing ) ? (int) $existing['term_id'] : (int) $existing;
				$term_map[ $cache_key ] = $term_id;
				return $term_id;
			}

			// Insert term
			$res = wp_insert_term( $clean_name, 'product_cat', array(
				'parent' => $parent_id,
				'slug'   => $slug,
			) );

			if ( is_wp_error( $res ) ) {
				$err_id = $res->get_error_data();
				if ( ! empty( $err_id ) ) {
					$term_map[ $cache_key ] = (int) $err_id;
					return (int) $err_id;
				}
				// Might already exist with another parent, try to find by slug
				$t = get_term_by( 'slug', $slug, 'product_cat' );
				if ( $t ) {
					$term_map[ $cache_key ] = (int) $t->term_id;
					return (int) $t->term_id;
				}
				$t_name = get_term_by( 'name', $clean_name, 'product_cat' );
				if ( $t_name ) {
					$term_map[ $cache_key ] = (int) $t_name->term_id;
					return (int) $t_name->term_id;
				}
				return 0;
			}

			$term_id = is_array( $res ) ? (int) $res['term_id'] : (int) $res;
			$term_map[ $cache_key ] = $term_id;
			$created_terms++;
			return $term_id;
		};

		// 1. Build Taxonomy Terms in WooCommerce strictly from master_category_taxonomy.json
		foreach ( $raw_tax as $dept_name => $l1_map ) {
			$dept_id = $ensure_term( $dept_name, 0 );

			if ( is_array( $l1_map ) ) {
				foreach ( $l1_map as $l1_name => $l2_map ) {
					$l1_id = $ensure_term( $l1_name, $dept_id );

					if ( is_array( $l2_map ) ) {
						foreach ( $l2_map as $l2_name => $unused ) {
							$l2_id = $ensure_term( $l2_name, $l1_id );
						}
					}
				}
			}
		}

		// 2. Map all published products strictly to sheet categories
		$all_products = get_posts( array(
			'post_type'      => 'product',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'fields'         => 'ids',
		) );

		$updated_products = 0;
		$categorization_log = array();

		foreach ( $all_products as $pid ) {
			$pname = get_the_title( $pid );
			$cat_info = self::categorize_product_name( $pname );
			$dept_name = $cat_info[0] ?? null;
			$l1_name   = $cat_info[1] ?? null;
			$l2_name   = $cat_info[2] ?? null;

			$assign_terms = array();
			$dept_id = 0;
			$l1_id = 0;
			if ( ! empty( $dept_name ) ) {
				$dept_id = $ensure_term( $dept_name, 0 );
				if ( $dept_id ) $assign_terms[] = $dept_id;
			}
			if ( ! empty( $dept_name ) && ! empty( $l1_name ) && $dept_id ) {
				$l1_id = $ensure_term( $l1_name, $dept_id );
				if ( $l1_id ) $assign_terms[] = $l1_id;
			}
			if ( ! empty( $dept_name ) && ! empty( $l1_name ) && ! empty( $l2_name ) && $l1_id ) {
				$l2_id = $ensure_term( $l2_name, $l1_id );
				if ( $l2_id ) $assign_terms[] = $l2_id;
			}

			$assign_terms = array_values( array_filter( array_unique( $assign_terms ) ) );
			if ( ! empty( $assign_terms ) ) {
				wp_set_object_terms( $pid, $assign_terms, 'product_cat', false );
				wp_update_term_count_now( $assign_terms, 'product_cat' );
				$updated_products++;
				$categorization_log[] = array(
					'id'       => $pid,
					'name'     => $pname,
					'category' => implode( ' > ', array_filter( array( $dept_name, $l1_name, $l2_name ) ) ),
				);
			}
		}

		// 3. Reset Mega Menu Manager option to clean defaults
		$default_config = array(
			'nav_items'   => MegaMenuManager::get_default_nav_items(),
			'departments' => MegaMenuManager::get_default_departments_data(),
		);
		update_option( MegaMenuManager::OPTION_KEY, $default_config );
		update_option( 'hcc_mega_menu_version', '1.5.0' );

		// 4. Purge Transients and notify Next.js
		delete_transient( MegaMenuManager::TRANSIENT_KEY );
		delete_transient( 'hcc_products_query_*' );
		if ( function_exists( 'wc_delete_product_transients' ) ) {
			wc_delete_product_transients();
		}
		MegaMenuManager::trigger_nextjs_revalidation();

		// 5. Fetch clean list of all terms with updated counts
		$final_terms = get_terms( array(
			'taxonomy'   => 'product_cat',
			'hide_empty' => false,
		) );
		$terms_list = array();
		if ( ! is_wp_error( $final_terms ) ) {
			foreach ( $final_terms as $ft ) {
				$terms_list[] = array(
					'id'          => (int) $ft->term_id,
					'name'        => html_entity_decode( $ft->name, ENT_QUOTES, 'UTF-8' ),
					'slug'        => $ft->slug,
					'parent'      => (int) $ft->parent,
					'count'       => (int) $ft->count,
					'description' => (string) $ft->description,
				);
			}
		}

		return array(
			'success'          => true,
			'deleted_terms'    => $deleted_terms,
			'created_terms'    => $created_terms,
			'updated_products' => $updated_products,
			'total_terms_now'  => count( $terms_list ),
			'terms'            => $terms_list,
			'sample_products'  => array_slice( $categorization_log, 0, 10 ),
		);
	}

	public static function categorize_product_name( $name ) {
		$n = strtolower( (string) $name );

		// 1. OUTDOOR & GARDEN (Root level only in sheet)
		if ( strpos( $n, 'garden' ) !== false || strpos( $n, 'outdoor' ) !== false || strpos( $n, 'planter' ) !== false || strpos( $n, 'gazebo' ) !== false || strpos( $n, 'cabana' ) !== false || strpos( $n, 'sun lounger' ) !== false || strpos( $n, 'parasol' ) !== false ) {
			return array( 'Outdoor & Garden', null, null );
		}

		// 2. KIDS (Root level only in sheet)
		if ( strpos( $n, 'nursing chair' ) !== false || strpos( $n, 'kids' ) !== false ) {
			return array( 'Kids', null, null );
		}

		// 3. LIGHTING (Level 1: Wall, Table Lamps, Floor Lamps, Desk Lamps)
		if ( strpos( $n, 'wall sconce' ) !== false || strpos( $n, 'pendant' ) !== false || strpos( $n, 'chandelier' ) !== false ) {
			return array( 'Lighting', 'Wall', null );
		}
		if ( strpos( $n, 'floor lamp' ) !== false || strpos( $n, 'lamp stand' ) !== false ) {
			return array( 'Lighting', 'Floor Lamps', null );
		}
		if ( strpos( $n, 'table lamp' ) !== false || strpos( $n, 'lampshade' ) !== false ) {
			return array( 'Lighting', 'Table Lamps', null );
		}
		if ( strpos( $n, 'desk lamp' ) !== false ) {
			return array( 'Lighting', 'Desk Lamps', null );
		}

		// 4. MIRRORS (Level 1: Wall Mirrors, Floor Mirrors, Table Mirrors)
		if ( strpos( $n, 'mirror' ) !== false ) {
			if ( strpos( $n, 'floor' ) !== false ) return array( 'Mirrors', 'Floor Mirrors', null );
			if ( strpos( $n, 'table' ) !== false || strpos( $n, 'vanity' ) !== false ) return array( 'Mirrors', 'Table Mirrors', null );
			return array( 'Mirrors', 'Wall Mirrors', null );
		}

		// 5. STORAGE (Level 1: Baskets & Bins, Boxes, Wall Shelves, Hooks & Racks)
		if ( strpos( $n, 'shoe rack' ) !== false ) return array( 'Storage', 'Hooks & Racks', 'Shoe Racks' );
		if ( strpos( $n, 'luggage rack' ) !== false ) return array( 'Storage', 'Hooks & Racks', 'Garment Racks' );
		if ( strpos( $n, 'wall shelf' ) !== false || strpos( $n, 'shelves' ) !== false ) return array( 'Storage', 'Wall Shelves', null );
		if ( strpos( $n, 'basket' ) !== false ) return array( 'Storage', 'Baskets & Bins', null );
		if ( strpos( $n, 'box' ) !== false ) return array( 'Storage', 'Boxes', null );

		// 6. DÉCOR (Level 1: Accents, Candle Holders, Clocks, Frames, Pooja Mandir, Wall Art)
		if ( strpos( $n, 'tray' ) !== false ) return array( 'Décor', 'Accents', 'Decorative Trays' );
		if ( strpos( $n, 'vase' ) !== false ) return array( 'Décor', 'Accents', 'Decorative Bowls' );
		if ( strpos( $n, 'art frame' ) !== false ) return array( 'Décor', 'Frames', null );
		if ( strpos( $n, 'wall panel' ) !== false || strpos( $n, 'wall cladding' ) !== false || strpos( $n, 'woven panel' ) !== false || strpos( $n, 'tapestry' ) !== false ) {
			return array( 'Décor', 'Wall Art', null );
		}
		if ( strpos( $n, 'candle' ) !== false || strpos( $n, 'lantern' ) !== false ) return array( 'Décor', 'Candle Holders', null );
		if ( strpos( $n, 'clock' ) !== false ) return array( 'Décor', 'Clocks', null );
		if ( strpos( $n, 'mandir' ) !== false || strpos( $n, 'temple' ) !== false ) return array( 'Décor', 'Pooja Mandir', null );

		// 7. FURNITURE
		// 7a. Seating
		if ( strpos( $n, 'dining chair' ) !== false || strpos( $n, 'side chair' ) !== false ) return array( 'Furniture', 'Seating', 'Dining Chairs' );
		if ( strpos( $n, 'arm chair' ) !== false || strpos( $n, 'accent chair' ) !== false || strpos( $n, 'lounge chair' ) !== false || strpos( $n, 'chaise lounge' ) !== false || strpos( $n, 'recliner' ) !== false || strpos( $n, 'desk chair' ) !== false ) {
			return array( 'Furniture', 'Seating', 'Armchairs' );
		}
		if ( strpos( $n, 'rocking chair' ) !== false ) return array( 'Furniture', 'Seating', 'Rocking Chairs' );
		if ( strpos( $n, 'swing' ) !== false || strpos( $n, 'jhula' ) !== false ) return array( 'Furniture', 'Seating', 'Swings & Hammocks' );
		if ( strpos( $n, 'sofa cum bed' ) !== false ) return array( 'Furniture', 'Seating', 'Sofa Beds' );
		if ( strpos( $n, 'sofa' ) !== false || strpos( $n, 'couch' ) !== false || strpos( $n, 'settee' ) !== false || strpos( $n, 'modular lounge' ) !== false || strpos( $n, 'banquette' ) !== false || strpos( $n, 'single seater' ) !== false || strpos( $n, 'two seater' ) !== false || strpos( $n, 'three seater' ) !== false || strpos( $n, 'chesterfield' ) !== false ) {
			return array( 'Furniture', 'Seating', 'Sofas' );
		}

		// 7b. Stools & Benches
		if ( strpos( $n, 'bar stool' ) !== false || strpos( $n, 'bar chair' ) !== false ) return array( 'Furniture', 'Stools & Benches', 'Bar Stools' );
		if ( strpos( $n, 'stool' ) !== false ) return array( 'Furniture', 'Stools & Benches', 'Stools' );
		if ( strpos( $n, 'bench' ) !== false ) return array( 'Furniture', 'Stools & Benches', 'Benches' );
		if ( strpos( $n, 'pouf' ) !== false || strpos( $n, 'ottoman' ) !== false ) return array( 'Furniture', 'Stools & Benches', 'Ottomans & Poufs' );

		// 7c. Tables
		if ( strpos( $n, 'coffee table' ) !== false || strpos( $n, 'centre table' ) !== false ) return array( 'Furniture', 'Tables', 'Coffee Tables' );
		if ( strpos( $n, 'side table' ) !== false || strpos( $n, 'end table' ) !== false || strpos( $n, 'drink table' ) !== false || strpos( $n, 'nesting table' ) !== false ) return array( 'Furniture', 'Tables', 'Side Tables' );
		if ( strpos( $n, 'console table' ) !== false ) return array( 'Furniture', 'Tables', 'Console Tables' );
		if ( strpos( $n, 'dining table' ) !== false ) return array( 'Furniture', 'Tables', 'Dining Tables' );
		if ( strpos( $n, 'bar table' ) !== false ) return array( 'Furniture', 'Tables', 'Bar Tables' );
		if ( strpos( $n, 'desk' ) !== false || strpos( $n, 'conference table' ) !== false ) return array( 'Furniture', 'Tables', 'Desks' );
		if ( strpos( $n, 'dressing table' ) !== false || strpos( $n, 'dresser' ) !== false ) return array( 'Furniture', 'Tables', 'Dressing Tables' );

		// 7d. Beds
		if ( strpos( $n, 'bunk bed' ) !== false ) return array( 'Furniture', 'Beds', 'Bunk Beds' );
		if ( strpos( $n, 'bed' ) !== false || strpos( $n, 'headboard' ) !== false || strpos( $n, 'day bed' ) !== false ) return array( 'Furniture', 'Beds', 'Beds' );

		// 7e. Cabinets
		if ( strpos( $n, 'sideboard' ) !== false || strpos( $n, 'buffet' ) !== false ) return array( 'Furniture', 'Cabinets', 'Sideboards' );
		if ( strpos( $n, 'chest of drawers' ) !== false || strpos( $n, 'drawers' ) !== false ) return array( 'Furniture', 'Cabinets', 'Chests & Dressers' );
		if ( strpos( $n, 'bedside table' ) !== false || strpos( $n, 'nightstand' ) !== false ) return array( 'Furniture', 'Cabinets', 'Nightstands' );
		if ( strpos( $n, 'wardrobe' ) !== false || strpos( $n, 'almirah' ) !== false ) return array( 'Furniture', 'Cabinets', 'Wardrobes' );
		if ( strpos( $n, 'tv unit' ) !== false ) return array( 'Furniture', 'Cabinets', 'TV Units' );
		if ( strpos( $n, 'bookshelf' ) !== false || strpos( $n, 'bookcase' ) !== false ) return array( 'Furniture', 'Cabinets', 'Bookcases' );
		if ( strpos( $n, 'bar cabinet' ) !== false || strpos( $n, 'minibar' ) !== false ) return array( 'Furniture', 'Cabinets', 'Bar Cabinets' );
		if ( strpos( $n, 'cabinet' ) !== false || strpos( $n, 'cupboard' ) !== false ) return array( 'Furniture', 'Cabinets', 'Cabinets' );

		// 7f. Accents
		if ( strpos( $n, 'jaali screen' ) !== false || strpos( $n, 'room divider' ) !== false || strpos( $n, 'screen' ) !== false || strpos( $n, 'divider' ) !== false ) return array( 'Furniture', 'Accents', 'Screens & Dividers' );
		if ( strpos( $n, 'trolley' ) !== false || strpos( $n, 'cart' ) !== false ) return array( 'Furniture', 'Accents', 'Trolleys & Carts' );
		if ( strpos( $n, 'bar counter' ) !== false || strpos( $n, 'serving counter' ) !== false || strpos( $n, 'reception counter' ) !== false || strpos( $n, 'host station' ) !== false || strpos( $n, 'fixed joinery' ) !== false ) {
			return array( 'Furniture', 'Accents', 'Bar Trolley' );
		}

		return array( 'Furniture', 'Accents', 'Screens & Dividers' );
	}
}
