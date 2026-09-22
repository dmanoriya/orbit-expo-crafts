<?php

namespace HeadlessCommerceCore\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Clean & Simple Mega Menu & Taxonomy Builder
 * Restores original curated 7-column Furniture taxonomy
 * Provides intuitive visual cards with Show/Hide toggles, inline renaming, and live storefront links
 */
class MegaMenuManager {

	const OPTION_KEY     = 'hcc_mega_menu_config';
	const TRANSIENT_KEY  = 'hcc_public_mega_menu';
	const SCHEMA_VERSION = '1.6.0';

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_admin_menu' ), 15 );
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_admin_assets' ) );

		// Auto-migrate corrupted or outdated configuration on initial boot
		add_action( 'init', array( __CLASS__, 'ensure_clean_schema' ), 20 );

		// Synchronize dynamic category slugs whenever categories are edited, created or deleted in WooCommerce
		add_action( 'edited_product_cat', array( __CLASS__, 'on_product_cat_updated' ), 10, 2 );
		add_action( 'create_product_cat', array( __CLASS__, 'on_product_cat_updated' ), 10, 2 );
		add_action( 'delete_product_cat', array( __CLASS__, 'on_product_cat_updated' ), 10, 2 );
	}

	public static function add_admin_menu() {
		add_submenu_page(
			'headless-commerce-core',
			__( 'Storefront Mega Menu & Taxonomy Builder', 'headless-commerce-core' ),
			__( 'Mega Menu Builder', 'headless-commerce-core' ),
			'manage_options',
			'hcc-mega-menu',
			array( __CLASS__, 'render_admin_page' )
		);
	}

	public static function register_rest_routes() {
		register_rest_route( 'hcc/v1', '/mega-menu', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( __CLASS__, 'get_mega_menu_endpoint' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( 'hcc/v1', '/taxonomy/migrate-final', array(
			'methods'             => array( \WP_REST_Server::READABLE, \WP_REST_Server::CREATABLE ),
			'callback'            => function() {
				if ( class_exists( '\\HeadlessCommerceCore\\Core\\TaxonomyMigrator' ) ) {
					return rest_ensure_response( \HeadlessCommerceCore\Core\TaxonomyMigrator::run_migration() );
				}
				return new \WP_Error( 'not_found', 'TaxonomyMigrator class not found', array( 'status' => 404 ) );
			},
			'permission_callback' => '__return_true',
		) );
	}

	public static function enqueue_admin_assets( $hook ) {
		if ( strpos( $hook, 'hcc-mega-menu' ) === false ) {
			return;
		}
	}

	/**
	 * Decode HTML entities and clean string
	 */
	public static function clean_text( $text ) {
		return trim( html_entity_decode( (string) $text, ENT_QUOTES, 'UTF-8' ) );
	}

	/**
	 * Default top navigation bar links
	 */
	public static function get_default_nav_items() {
		return array(
			array( 'id' => 'nav_new_arrivals', 'name' => 'New Arrivals', 'slug' => 'new-arrivals', 'href' => '/collections/new-arrivals', 'hasSubmenu' => false, 'deptKey' => '', 'hidden' => false ),
			array( 'id' => 'nav_furniture', 'name' => 'Furniture', 'slug' => 'furniture', 'href' => '/furniture', 'hasSubmenu' => true, 'deptKey' => 'Furniture', 'hidden' => false ),
			array( 'id' => 'nav_lighting', 'name' => 'Lighting', 'slug' => 'lighting', 'href' => '/lighting', 'hasSubmenu' => true, 'deptKey' => 'Lighting', 'hidden' => false ),
			array( 'id' => 'nav_decor', 'name' => 'Décor', 'slug' => 'decor', 'href' => '/decor', 'hasSubmenu' => true, 'deptKey' => 'Décor', 'hidden' => false ),
			array( 'id' => 'nav_mirrors', 'name' => 'Mirrors', 'slug' => 'mirrors', 'href' => '/mirrors', 'hasSubmenu' => true, 'deptKey' => 'Mirrors', 'hidden' => false ),
			array( 'id' => 'nav_storage', 'name' => 'Storage', 'slug' => 'storage', 'href' => '/storage', 'hasSubmenu' => true, 'deptKey' => 'Storage', 'hidden' => false ),
			array( 'id' => 'nav_outdoor', 'name' => 'Outdoor & Garden', 'slug' => 'outdoor-and-garden', 'href' => '/outdoor-and-garden', 'hasSubmenu' => false, 'deptKey' => 'Outdoor & Garden', 'hidden' => false ),
			array( 'id' => 'nav_kitchen', 'name' => 'Kitchen & Table Tops', 'slug' => 'kitchen-and-table-tops', 'href' => '/kitchen-and-table-tops', 'hasSubmenu' => false, 'deptKey' => 'Kitchen & Table Tops', 'hidden' => false ),
			array( 'id' => 'nav_kids', 'name' => 'Kids', 'slug' => 'kids-furniture', 'href' => '/kids-furniture', 'hasSubmenu' => false, 'deptKey' => 'Kids', 'hidden' => false ),
		);
	}

	/**
	 * Build structured baseline taxonomy from master blueprint
	 */
	public static function get_default_departments_data() {
		$json_file = HCC_PLUGIN_DIR . 'master_category_taxonomy.json';
		$raw_tax   = array();

		if ( file_exists( $json_file ) ) {
			$raw_tax = json_decode( file_get_contents( $json_file ), true );
		}

		if ( ! is_array( $raw_tax ) || empty( $raw_tax ) ) {
			return array();
		}

		$departments = array();

		foreach ( $raw_tax as $dept_name => $l1_map ) {
			$dept_clean = self::clean_text( $dept_name );
			$departments[ $dept_clean ] = array(
				'name'       => $dept_clean,
				'hidden'     => false,
				'categories' => array(),
			);

			if ( ! is_array( $l1_map ) ) continue;

			foreach ( $l1_map as $l1_name => $l2_map ) {
				$l1_clean = self::clean_text( $l1_name );
				$l1_data = array(
					'name'      => $l1_clean,
					'hidden'    => false,
					'subgroups' => array(),
				);

				if ( is_array( $l2_map ) ) {
					foreach ( $l2_map as $l2_name => $l3_items ) {
						$l2_clean = self::clean_text( $l2_name );
						$clean_l3 = array();
						if ( is_array( $l3_items ) ) {
							foreach ( $l3_items as $l3 ) {
								$item_name = is_array( $l3 ) ? ( $l3['name'] ?? '' ) : (string) $l3;
								$item_clean = self::clean_text( $item_name );
								if ( $item_clean ) {
									$clean_l3[] = array(
										'name'   => $item_clean,
										'hidden' => false,
									);
								}
							}
						}

						$l1_data['subgroups'][ $l2_clean ] = array(
							'name'   => $l2_clean,
							'hidden' => false,
							'items'  => $clean_l3,
						);
					}
				}

				$departments[ $dept_clean ]['categories'][ $l1_clean ] = $l1_data;
			}
		}

		return $departments;
	}

	/**
	 * Ensure database has clean, uncorrupted schema matching version 1.5.0
	 */
	public static function ensure_clean_schema() {
		$current_ver = get_option( 'hcc_mega_menu_version', '' );
		$config      = get_option( self::OPTION_KEY, null );

		$needs_reset = false;

		if ( empty( $config ) || ! is_array( $config ) || empty( $config['departments'] ) ) {
			$needs_reset = true;
		} elseif ( $current_ver !== self::SCHEMA_VERSION ) {
			$needs_reset = true;
		} elseif (
			empty( $config['departments']['Furniture']['categories']['Seating'] ) ||
			empty( $config['departments']['Furniture']['categories']['Stools & Benches'] ) ||
			empty( $config['departments']['Lighting'] ) ||
			( empty( $config['departments']['Décor'] ) && empty( $config['departments']['Decor'] ) )
		) {
			$needs_reset = true;
		}

		if ( $needs_reset ) {
			$curated_defaults = self::get_default_departments_data();

			$clean_config = array(
				'nav_items'   => self::get_default_nav_items(),
				'departments' => $curated_defaults,
			);

			update_option( self::OPTION_KEY, $clean_config );
			update_option( 'hcc_mega_menu_version', self::SCHEMA_VERSION );
			delete_transient( self::TRANSIENT_KEY );
			self::trigger_nextjs_revalidation();
		}
	}

	/**
	 * Retrieve current full configuration (admin editing mode)
	 */
	public static function get_menu_config() {
		self::ensure_clean_schema();
		$config = get_option( self::OPTION_KEY, null );

		if ( ! is_array( $config ) || empty( $config ) || empty( $config['departments'] ) ) {
			$config = array(
				'nav_items'   => self::get_default_nav_items(),
				'departments' => self::get_default_departments_data(),
			);
			update_option( self::OPTION_KEY, $config );
		}

		return $config;
	}

	/**
	 * Get resolved clean public mega menu data for Next.js
	 * Filters out all hidden categories/items and formats for frontend consumption
	 */
	public static function get_public_menu_data() {
		$cached = get_transient( self::TRANSIENT_KEY );
		if ( ! empty( $cached ) && is_array( $cached ) ) {
			return $cached;
		}

		$config     = self::get_menu_config();
		$raw_nav    = $config['nav_items'] ?? self::get_default_nav_items();
		$raw_depts  = $config['departments'] ?? self::get_default_departments_data();

		// Fetch all live WooCommerce product_cat terms to synchronize dynamic slugs and names
		$all_woo_terms = get_terms( array(
			'taxonomy'   => 'product_cat',
			'hide_empty' => false,
		) );

		$woo_terms_by_name = array();
		$woo_terms_by_slug = array();
		$woo_terms_by_id   = array();

		if ( ! is_wp_error( $all_woo_terms ) && is_array( $all_woo_terms ) ) {
			foreach ( $all_woo_terms as $wt ) {
				$clean_t_name = strtolower( self::clean_text( $wt->name ) );
				$clean_t_slug = strtolower( $wt->slug );
				$woo_terms_by_name[ $clean_t_name ] = $wt;
				$woo_terms_by_slug[ $clean_t_slug ] = $wt;
				$woo_terms_by_id[ $wt->term_id ]    = $wt;
			}
		}

		// 1. Process active Nav Items with dynamic live WooCommerce slug sync
		$active_nav = array();
		foreach ( $raw_nav as $item ) {
			if ( ! empty( $item['hidden'] ) ) {
				continue;
			}

			$item_name = self::clean_text( $item['name'] ?? '' );
			$item_slug = $item['slug'] ?? '';
			$dept_key  = self::clean_text( $item['deptKey'] ?? '' );
			$item_href = $item['href'] ?? ( '/' . $item_slug );

			// Check if this item corresponds to a WooCommerce product category
			if ( ( $item['id'] ?? '' ) !== 'nav_new_arrivals' ) {
				$matched_term = null;

				// Match by term_id if present
				if ( ! empty( $item['term_id'] ) && isset( $woo_terms_by_id[ $item['term_id'] ] ) ) {
					$matched_term = $woo_terms_by_id[ $item['term_id'] ];
				}

				// Match by current slug
				if ( ! $matched_term && ! empty( $item_slug ) && isset( $woo_terms_by_slug[ strtolower( $item_slug ) ] ) ) {
					$matched_term = $woo_terms_by_slug[ strtolower( $item_slug ) ];
				}

				// Match by name
				if ( ! $matched_term && ! empty( $item_name ) && isset( $woo_terms_by_name[ strtolower( $item_name ) ] ) ) {
					$matched_term = $woo_terms_by_name[ strtolower( $item_name ) ];
				}

				// Match by deptKey
				if ( ! $matched_term && ! empty( $dept_key ) && isset( $woo_terms_by_name[ strtolower( $dept_key ) ] ) ) {
					$matched_term = $woo_terms_by_name[ strtolower( $dept_key ) ];
				}

				// Alias and keyword matching for known departments:
				// Kids / Kids Furniture
				if ( ! $matched_term && ( strpos( strtolower( $item_name ), 'kid' ) !== false || strpos( strtolower( $item_slug ), 'kid' ) !== false || strpos( strtolower( $dept_key ), 'kid' ) !== false ) ) {
					foreach ( array( 'kids-furniture', 'kids', 'kids-and-baby-home', 'kids & baby home', 'kids furniture' ) as $cand ) {
						if ( isset( $woo_terms_by_slug[ $cand ] ) ) {
							$matched_term = $woo_terms_by_slug[ $cand ];
							break;
						}
						if ( isset( $woo_terms_by_name[ $cand ] ) ) {
							$matched_term = $woo_terms_by_name[ $cand ];
							break;
						}
					}
				}

				// Décor / Home Decor
				if ( ! $matched_term && ( strpos( strtolower( $item_name ), 'decor' ) !== false || strpos( strtolower( $item_slug ), 'decor' ) !== false ) ) {
					foreach ( array( 'home-decor', 'decor', 'décor' ) as $cand ) {
						if ( isset( $woo_terms_by_slug[ $cand ] ) ) {
							$matched_term = $woo_terms_by_slug[ $cand ];
							break;
						}
						if ( isset( $woo_terms_by_name[ $cand ] ) ) {
							$matched_term = $woo_terms_by_name[ $cand ];
							break;
						}
					}
				}

				// Mirrors / Wall Decor & Mirrors
				if ( ! $matched_term && ( strpos( strtolower( $item_name ), 'mirror' ) !== false || strpos( strtolower( $item_slug ), 'mirror' ) !== false ) ) {
					foreach ( array( 'wall-decor-and-mirrors', 'mirrors' ) as $cand ) {
						if ( isset( $woo_terms_by_slug[ $cand ] ) ) {
							$matched_term = $woo_terms_by_slug[ $cand ];
							break;
						}
						if ( isset( $woo_terms_by_name[ $cand ] ) ) {
							$matched_term = $woo_terms_by_name[ $cand ];
							break;
						}
					}
				}

				// Storage / Storage & Organization
				if ( ! $matched_term && ( strpos( strtolower( $item_name ), 'storage' ) !== false || strpos( strtolower( $item_slug ), 'storage' ) !== false ) ) {
					foreach ( array( 'storage-and-organization', 'storage' ) as $cand ) {
						if ( isset( $woo_terms_by_slug[ $cand ] ) ) {
							$matched_term = $woo_terms_by_slug[ $cand ];
							break;
						}
						if ( isset( $woo_terms_by_name[ $cand ] ) ) {
							$matched_term = $woo_terms_by_name[ $cand ];
							break;
						}
					}
				}

				// Kitchen / Kitchen & Tabletop
				if ( ! $matched_term && ( strpos( strtolower( $item_name ), 'kitchen' ) !== false || strpos( strtolower( $item_slug ), 'kitchen' ) !== false ) ) {
					foreach ( array( 'kitchen-and-table-tops', 'kitchen-and-tabletop' ) as $cand ) {
						if ( isset( $woo_terms_by_slug[ $cand ] ) ) {
							$matched_term = $woo_terms_by_slug[ $cand ];
							break;
						}
						if ( isset( $woo_terms_by_name[ $cand ] ) ) {
							$matched_term = $woo_terms_by_name[ $cand ];
							break;
						}
					}
				}

				// If dynamic live term is found in WooCommerce, adopt its exact slug, href, and name!
				if ( $matched_term ) {
					$item_slug = $matched_term->slug;
					$item_href = '/' . $matched_term->slug;
					if ( ! empty( $matched_term->name ) ) {
						$item_name = self::clean_text( $matched_term->name );
					}
				}
			}

			$active_nav[] = array(
				'id'         => $item['id'] ?? '',
				'name'       => $item_name,
				'slug'       => $item_slug,
				'href'       => $item_href,
				'hasSubmenu' => ! empty( $item['hasSubmenu'] ),
				'deptKey'    => $dept_key,
			);
		}

		// 2. Process active Department Taxonomy
		$active_tax = array();
		$slug_map   = array();

		// Populate slug_map from all live WooCommerce terms
		if ( ! empty( $all_woo_terms ) && is_array( $all_woo_terms ) ) {
			foreach ( $all_woo_terms as $wt ) {
				$clean_name = self::clean_text( $wt->name );
				$clean_slug = $wt->slug;
				$slug_map[ $clean_name ] = $clean_slug;
				$slug_map[ strtolower( $clean_name ) ] = $clean_slug;
				$slug_map[ $clean_slug ] = $clean_slug;
			}
		}

		foreach ( $raw_depts as $dept_name => $dept_info ) {
			if ( ! empty( $dept_info['hidden'] ) ) {
				continue;
			}

			$canonical_dept_name = self::clean_text( $dept_name );
			$dept_display_name   = ! empty( $dept_info['name'] ) ? self::clean_text( $dept_info['name'] ) : $canonical_dept_name;
			$dept_slug           = ! empty( $dept_info['slug'] ) ? $dept_info['slug'] : self::make_slug( $dept_name );
			$slug_map[ $dept_display_name ]   = $dept_slug;
			$slug_map[ $canonical_dept_name ] = $dept_slug;

			$dept_tree           = array();
			$cats                = $dept_info['categories'] ?? array();

			foreach ( $cats as $l1_key => $l1_data ) {
				if ( ! empty( $l1_data['hidden'] ) ) {
					continue;
				}

				$l1_display_name = ! empty( $l1_data['name'] ) ? self::clean_text( $l1_data['name'] ) : self::clean_text( $l1_key );
				$l1_slug         = ! empty( $l1_data['slug'] ) ? $l1_data['slug'] : self::make_slug( $l1_key );
				$slug_map[ $l1_display_name ] = $l1_slug;
				$slug_map[ self::clean_text( $l1_key ) ] = $l1_slug;

				$dept_tree[ $l1_display_name ] = array();

				$subgroups = $l1_data['subgroups'] ?? array();
				foreach ( $subgroups as $l2_key => $l2_data ) {
					if ( ! empty( $l2_data['hidden'] ) ) {
						continue;
					}

					$l2_display_name = ! empty( $l2_data['name'] ) ? self::clean_text( $l2_data['name'] ) : self::clean_text( $l2_key );
					$l2_slug         = ! empty( $l2_data['slug'] ) ? $l2_data['slug'] : self::make_slug( $l2_key );
					$slug_map[ $l2_display_name ] = $l2_slug;
					$slug_map[ self::clean_text( $l2_key ) ] = $l2_slug;

					$items_list      = array();

					$items = $l2_data['items'] ?? array();
					foreach ( $items as $it ) {
						if ( ! empty( $it['hidden'] ) ) {
							continue;
						}
						$it_name = is_array( $it ) ? ( $it['name'] ?? '' ) : (string) $it;
						$it_clean = self::clean_text( $it_name );
						if ( $it_clean ) {
							$items_list[] = $it_clean;
						}
					}

					$dept_tree[ $l1_display_name ][ $l2_display_name ] = $items_list;
				}
			}

			// Store by both display name and canonical name to guarantee Header.tsx lookup success
			$active_tax[ $dept_display_name ] = $dept_tree;
			if ( $canonical_dept_name !== $dept_display_name ) {
				$active_tax[ $canonical_dept_name ] = $dept_tree;
			}
		}

		// Handle composite department: "Kids & Pet Home"
		if ( isset( $active_tax['Kids & Baby Home'] ) || isset( $active_tax['Pet Home'] ) ) {
			$active_tax['Kids & Pet Home'] = array_merge(
				$active_tax['Kids & Baby Home'] ?? array(),
				$active_tax['Pet Home'] ?? array()
			);
		}

		$result = array(
			'navItems'  => $active_nav,
			'taxonomy'  => $active_tax,
			'slugMap'   => $slug_map,
			'updatedAt' => time(),
		);

		set_transient( self::TRANSIENT_KEY, $result, HOUR_IN_SECONDS * 12 );

		return $result;
	}

	/**
	 * REST API endpoint: GET /wp-json/hcc/v1/mega-menu
	 */
	public static function get_mega_menu_endpoint() {
		$data = self::get_public_menu_data();
		return new \WP_REST_Response( $data, 200 );
	}

	/**
	 * Slugify category for URL calculation
	 */
	public static function make_slug( $text ) {
		$clean = function_exists( 'remove_accents' ) ? remove_accents( (string) $text ) : (string) $text;
		$clean = str_replace( array( 'é', 'è', 'ê', 'ë', 'É', 'È', 'Ê', 'Ë' ), 'e', $clean );
		$slug  = strtolower( $clean );
		$slug  = str_replace( '&', 'and', $slug );
		$slug  = preg_replace( '/[^a-z0-9\s-]/', '', $slug );
		$slug  = preg_replace( '/[\s_]+/', '-', $slug );
		return trim( $slug, '-' );
	}

	/**
	 * Trigger Next.js on-demand ISR revalidation for mega-menu tag
	 */
	public static function trigger_nextjs_revalidation() {
		delete_transient( self::TRANSIENT_KEY );

		$secret = get_option( 'hcc_revalidate_secret', '' );
		if ( empty( $secret ) ) {
			$secret = defined( 'HCC_REVALIDATION_SECRET' ) ? HCC_REVALIDATION_SECRET : 'orbit_headless_revalidate_2026';
		}

		$frontend_url = BusinessPagesManager::get_frontend_url();

		$targets = array( $frontend_url );
		$host = isset( $_SERVER['HTTP_HOST'] ) ? sanitize_text_field( $_SERVER['HTTP_HOST'] ) : '';
		if ( strpos( $host, '.local' ) !== false || strpos( $host, 'localhost' ) !== false || strpos( $host, '127.0.0.1' ) !== false ) {
			if ( ! in_array( 'http://localhost:3000', $targets ) ) {
				$targets[] = 'http://localhost:3000';
			}
		}

		foreach ( $targets as $target ) {
			$url = add_query_arg( array(
				'secret' => $secret,
				'tag'    => 'mega-menu',
				'path'   => '/',
			), rtrim( $target, '/' ) . '/api/revalidate' );

			wp_remote_get( $url, array(
				'timeout'   => 2,
				'sslverify' => false,
			) );
		}
	}

	/**
	 * Automatically sync mega menu whenever a WooCommerce category is created, edited, or deleted
	 */
	public static function on_product_cat_updated( $term_id, $tt_id = 0 ) {
		delete_transient( self::TRANSIENT_KEY );

		$term = get_term( $term_id, 'product_cat' );
		if ( $term && ! is_wp_error( $term ) ) {
			$config = get_option( self::OPTION_KEY, array() );
			if ( ! empty( $config['nav_items'] ) && is_array( $config['nav_items'] ) ) {
				$changed = false;
				$term_name_lower = strtolower( self::clean_text( $term->name ) );
				$term_slug_lower = strtolower( $term->slug );

				foreach ( $config['nav_items'] as &$item ) {
					$clean_item_name = strtolower( self::clean_text( $item['name'] ?? '' ) );
					$clean_dept_key  = strtolower( self::clean_text( $item['deptKey'] ?? '' ) );
					$clean_item_slug = strtolower( $item['slug'] ?? '' );

					$matches = (
						$clean_item_name === $term_name_lower ||
						$clean_dept_key === $term_name_lower ||
						$clean_item_slug === $term_slug_lower ||
						( strpos( $term_name_lower, 'kid' ) !== false && ( strpos( $clean_item_name, 'kid' ) !== false || strpos( $clean_item_slug, 'kid' ) !== false ) ) ||
						( strpos( $term_name_lower, 'decor' ) !== false && ( strpos( $clean_item_name, 'decor' ) !== false || strpos( $clean_item_slug, 'decor' ) !== false ) )
					);

					if ( $matches ) {
						$item['slug'] = $term->slug;
						$item['href'] = '/' . $term->slug;
						$item['name']    = self::clean_text( $term->name );
						$item['term_id'] = (int) $term_id;
						$changed = true;
					}
				}
			}

			// 2. Also update columns and subcategories in departments if matching
			if ( ! empty( $config['departments'] ) && is_array( $config['departments'] ) ) {
				foreach ( $config['departments'] as &$dept ) {
					if ( empty( $dept['categories'] ) || ! is_array( $dept['categories'] ) ) continue;
					foreach ( $dept['categories'] as &$col ) {
						$col_name_lower = strtolower( self::clean_text( $col['name'] ?? '' ) );
						$col_slug_lower = strtolower( $col['slug'] ?? '' );
						$col_term_match = ! empty( $col['term_id'] ) && (int) $col['term_id'] === (int) $term_id;

						if ( $col_term_match || $col_name_lower === $term_name_lower || $col_slug_lower === $term_slug_lower ) {
							$col['slug']    = $term->slug;
							$col['name']    = self::clean_text( $term->name );
							$col['term_id'] = (int) $term_id;
							$changed = true;
						}

						if ( ! empty( $col['subgroups'] ) && is_array( $col['subgroups'] ) ) {
							foreach ( $col['subgroups'] as &$sub ) {
								$sub_name_lower = strtolower( self::clean_text( $sub['name'] ?? '' ) );
								$sub_slug_lower = strtolower( $sub['slug'] ?? '' );
								$sub_term_match = ! empty( $sub['term_id'] ) && (int) $sub['term_id'] === (int) $term_id;

								if ( $sub_term_match || $sub_name_lower === $term_name_lower || $sub_slug_lower === $term_slug_lower ) {
									$sub['slug']    = $term->slug;
									$sub['name']    = self::clean_text( $term->name );
									$sub['term_id'] = (int) $term_id;
									$changed = true;
								}
							}
						}
					}
				}
			}

			if ( $changed ) {
				update_option( self::OPTION_KEY, $config );
			}
		}

		self::trigger_nextjs_revalidation();
	}

	/**
	 * Render the Admin Mega Menu Builder Page
	 */
	public static function render_admin_page() {
		$live_url = BusinessPagesManager::get_frontend_url();

		// Handle Manual Dynamic Sync from WooCommerce Categories
		if ( isset( $_POST['hcc_sync_woo_slugs'] ) && check_admin_referer( 'hcc_mega_menu_action', 'hcc_mega_menu_nonce' ) ) {
			delete_transient( self::TRANSIENT_KEY );
			$config = self::get_menu_config();

			$all_woo_terms = get_terms( array(
				'taxonomy'   => 'product_cat',
				'hide_empty' => false,
			) );

			if ( ! is_wp_error( $all_woo_terms ) && is_array( $all_woo_terms ) && ! empty( $config['nav_items'] ) ) {
				foreach ( $config['nav_items'] as &$item ) {
					if ( ( $item['id'] ?? '' ) === 'nav_new_arrivals' ) continue;
					$clean_item_name = strtolower( self::clean_text( $item['name'] ?? '' ) );
					$clean_dept_key  = strtolower( self::clean_text( $item['deptKey'] ?? '' ) );
					$clean_item_slug = strtolower( $item['slug'] ?? '' );

					foreach ( $all_woo_terms as $wt ) {
						$wt_name = strtolower( self::clean_text( $wt->name ) );
						$wt_slug = strtolower( $wt->slug );
						if (
							$clean_item_name === $wt_name ||
							$clean_dept_key === $wt_name ||
							$clean_item_slug === $wt_slug ||
							( strpos( $wt_name, 'kid' ) !== false && ( strpos( $clean_item_name, 'kid' ) !== false || strpos( $clean_item_slug, 'kid' ) !== false ) )
						) {
							$item['slug'] = $wt->slug;
							$item['href'] = '/' . $wt->slug;
							$item['name'] = self::clean_text( $wt->name );
							break;
						}
					}
				}
				update_option( self::OPTION_KEY, $config );
			}

			self::trigger_nextjs_revalidation();
			echo '<div class="notice notice-success is-dismissible"><p><strong>Success:</strong> Storefront Mega Menu navigation slugs have been dynamically synchronized with your live WooCommerce categories!</p></div>';
		}

		// Handle Reset
		if ( isset( $_POST['hcc_reset_mega_menu'] ) && check_admin_referer( 'hcc_mega_menu_action', 'hcc_mega_menu_nonce' ) ) {
			$default_config = array(
				'nav_items'   => self::get_default_nav_items(),
				'departments' => self::get_default_departments_data(),
			);
			update_option( self::OPTION_KEY, $default_config );
			update_option( 'hcc_mega_menu_version', self::SCHEMA_VERSION );
			delete_transient( self::TRANSIENT_KEY );
			self::trigger_nextjs_revalidation();
			echo '<div class="notice notice-success is-dismissible" style="margin-top:16px;"><p><strong>✅ Mega Menu reset to original curated blueprint! Live storefront revalidated.</strong></p></div>';
		}

		// Handle Save
		if ( isset( $_POST['hcc_save_mega_menu'] ) && check_admin_referer( 'hcc_mega_menu_action', 'hcc_mega_menu_nonce' ) ) {
			$posted_config_raw = isset( $_POST['mega_menu_config_json'] ) ? wp_unslash( $_POST['mega_menu_config_json'] ) : '';
			$decoded = json_decode( $posted_config_raw, true );

			if ( is_array( $decoded ) && ! empty( $decoded['departments'] ) ) {
				update_option( self::OPTION_KEY, $decoded );
				update_option( 'hcc_mega_menu_version', self::SCHEMA_VERSION );
				delete_transient( self::TRANSIENT_KEY );
				self::trigger_nextjs_revalidation();
				echo '<div class="notice notice-success is-dismissible" style="margin-top:16px; padding:12px;"><p style="font-size:15px; margin:0;"><strong>✅ Mega Menu configuration saved!</strong> Changes published live to storefront. <a href="' . esc_url( $live_url ) . '" target="_blank" style="margin-left:12px; font-weight:700; color:#0E5C63; text-decoration:underline;">👁️ View Live Storefront ↗</a></p></div>';
			} else {
				echo '<div class="notice notice-error is-dismissible"><p>Failed to save: invalid menu data received.</p></div>';
			}
		}

		$config      = self::get_menu_config();
		$nav_items   = $config['nav_items'] ?? self::get_default_nav_items();
		$departments = $config['departments'] ?? self::get_default_departments_data();

		// Fetch all live WooCommerce product_cat terms for direct category selector and hierarchy sync
		$all_woo_terms = get_terms( array(
			'taxonomy'   => 'product_cat',
			'hide_empty' => false,
			'orderby'    => 'name',
			'order'      => 'ASC',
		) );

		$woo_category_list = array();
		if ( ! is_wp_error( $all_woo_terms ) && is_array( $all_woo_terms ) ) {
			foreach ( $all_woo_terms as $term ) {
				if ( $term->slug === 'uncategorized' ) {
					continue;
				}
				$woo_category_list[] = array(
					'id'     => (int) $term->term_id,
					'name'   => self::clean_text( $term->name ),
					'slug'   => $term->slug,
					'parent' => (int) $term->parent,
					'count'  => (int) $term->count,
				);
			}
		}

		// Department icon helper
		$dept_icons = array(
			'Furniture'            => '🛋️',
			'Lighting'             => '💡',
			'Décor'                => '🏺',
			'Decor'                => '🏺',
			'Mirrors'              => '🪞',
			'Storage'              => '📦',
			'Outdoor & Garden'     => '🌿',
			'Kitchen & Table Tops' => '🍽️',
			'Kids'                 => '🧸',
		);
		?>
		<style>
			.hcc-menu-wrap { max-width: 1240px; margin: 20px 0 40px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1d2327; }
			.hcc-header-banner { background: #fff; border: 1px solid #c3c4c7; border-radius: 8px; padding: 18px 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.04); margin-bottom: 20px; flex-wrap: wrap; gap: 16px; }
			.hcc-header-title { margin: 0; font-size: 22px; font-weight: 700; color: #1d2327; display: flex; align-items: center; gap: 8px; }
			.hcc-live-badge { display: inline-flex; align-items: center; gap: 6px; background: #e6f4ea; color: #137333; padding: 7px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; text-decoration: none; border: 1px solid #ceead6; transition: all 0.15s ease; }
			.hcc-live-badge:hover { background: #ceead6; color: #0d5223; }

			.hcc-toolbar-sticky { position: sticky; top: 32px; z-index: 100; background: #fff; border: 1.5px solid #0E5C63; border-radius: 8px; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 14px rgba(14,92,99,0.15); margin-bottom: 22px; gap: 12px; flex-wrap: wrap; }
			.hcc-search-input { min-width: 260px; flex: 1; max-width: 380px; padding: 8px 12px 8px 34px; border: 1px solid #8c8f94; border-radius: 6px; font-size: 14px; background: #fff url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%238c8f94" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>') no-repeat 10px center; }
			.hcc-search-input:focus { border-color: #0E5C63; outline: none; box-shadow: 0 0 0 2px rgba(14,92,99,0.2); }

			/* Clean Navigation Pills */
			.hcc-tabs-bar { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px; background: #f0f0f1; padding: 8px; border-radius: 8px; border: 1px solid #dcdcde; }
			.hcc-tab-btn { background: #fff; border: 1px solid #c3c4c7; padding: 9px 15px; font-size: 13px; font-weight: 600; color: #3c434a; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
			.hcc-tab-btn:hover { background: #f6f7f7; color: #1d2327; border-color: #8c8f94; }
			.hcc-tab-btn.active { background: #0E5C63; color: #fff; border-color: #0E5C63; box-shadow: 0 2px 4px rgba(14,92,99,0.25); }
			.hcc-tab-count { background: rgba(0,0,0,0.07); padding: 1px 7px; border-radius: 12px; font-size: 11px; font-weight: 700; }
			.hcc-tab-btn.active .hcc-tab-count { background: rgba(255,255,255,0.28); color: #fff; }

			.hcc-tab-content { display: none; }
			.hcc-tab-content.active { display: block; }

			/* Department Banner Card */
			.hcc-dept-card { background: #fff; border: 1px solid #c3c4c7; border-radius: 8px; padding: 16px 20px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
			.hcc-dept-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

			/* Category Column Cards */
			.hcc-column-card { background: #fff; border: 1.5px solid #dcdcde; border-radius: 8px; margin-bottom: 14px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.03); transition: border-color 0.15s ease, box-shadow 0.15s ease; }
			.hcc-column-card:hover { border-color: #0E5C63; box-shadow: 0 2px 8px rgba(14,92,99,0.08); }
			.hcc-column-card.is-hidden { opacity: 0.55; background: #fafafa; border-style: dashed; }
			
			.hcc-card-top-row { padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; background: #fafafa; border-bottom: 1px solid #eee; }
			.hcc-card-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 280px; flex-wrap: wrap; }
			.hcc-card-right { display: flex; align-items: center; gap: 8px; }

			.hcc-col-badge { background: #0E5C63; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }

			/* Simple Toggle Switches */
			.hcc-toggle-btn { display: inline-flex; align-items: center; cursor: pointer; user-select: none; font-size: 13px; font-weight: 600; gap: 5px; padding: 5px 12px; border-radius: 20px; border: 1px solid #c3c4c7; background: #fff; color: #50575e; transition: all 0.15s ease; }
			.hcc-toggle-btn.is-active { background: #e6f4ea; border-color: #ceead6; color: #137333; }
			.hcc-toggle-btn:hover { border-color: #8c8f94; }

			.hcc-name-input { font-size: 14px; font-weight: 600; padding: 6px 10px; border: 1px solid #c3c4c7; border-radius: 5px; width: 100%; max-width: 280px; color: #1d2327; background: #fff; }
			.hcc-name-input:focus { border-color: #0E5C63; outline: none; box-shadow: 0 0 0 1px #0E5C63; }

			.hcc-slug-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #50575e; background: #f0f0f1; border: 1px solid #dcdcde; border-radius: 4px; padding: 3px 8px; }
			.hcc-slug-badge code { font-size: 11px; color: #0E5C63; font-weight: 600; background: transparent; padding: 0; }
			.hcc-slug-inline-input { font-size: 11px; font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace; color: #0E5C63; font-weight: 600; padding: 3px 6px; border: 1px dashed #c3c4c7; border-radius: 4px; background: #fdfdfd; width: 150px; }
			.hcc-slug-inline-input:focus { border-style: solid; border-color: #0E5C63; outline: none; background: #fff; }

			.hcc-btn-del { color: #b32d2e; border: 1px solid #dcdcde; background: #fff; cursor: pointer; font-size: 12px; font-weight: 700; padding: 4px 8px; border-radius: 4px; transition: all 0.1s ease; line-height: 1; }
			.hcc-btn-del:hover { background: #b32d2e; color: #fff; border-color: #b32d2e; }

			.hcc-url-link { color: #0E5C63; text-decoration: none; font-size: 12px; font-weight: 600; padding: 5px 10px; border-radius: 4px; background: rgba(14,92,99,0.07); display: inline-flex; align-items: center; gap: 4px; transition: all 0.15s ease; }
			.hcc-url-link:hover { background: rgba(14,92,99,0.16); color: #083c41; text-decoration: underline; }

			.hcc-expand-btn { background: #fff; border: 1px solid #c3c4c7; padding: 5px 12px; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; color: #3c434a; display: inline-flex; align-items: center; gap: 4px; }
			.hcc-expand-btn:hover { background: #f0f0f1; border-color: #8c8f94; }

			/* Drawer: Subcategories (Level 2) */
			.hcc-card-drawer { display: none; padding: 16px 20px; background: #fff; border-top: 1px solid #eee; }
			.hcc-card-drawer.is-open { display: block; }

			.hcc-subgroup-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
			.hcc-subgroup-table th { text-align: left; font-size: 12px; color: #646970; text-transform: uppercase; padding: 6px 10px; border-bottom: 1px solid #e2e4e7; }
			.hcc-subgroup-table td { padding: 8px 10px; border-bottom: 1px solid #f0f0f1; vertical-align: middle; }

			/* Items Pills (Level 3) */
			.hcc-items-container { margin-top: 6px; display: flex; flex-wrap: wrap; gap: 5px; }
			.hcc-item-pill { display: inline-flex; align-items: center; gap: 5px; background: #f6f7f7; border: 1px solid #dcdcde; border-radius: 14px; padding: 2px 8px; font-size: 11px; color: #3c434a; cursor: pointer; }
			.hcc-item-pill.pill-hidden { opacity: 0.45; text-decoration: line-through; background: #fff; }
			.hcc-item-pill input[type="checkbox"] { margin: 0; cursor: pointer; }
			.hcc-item-pill-link { color: #0E5C63; text-decoration: none; font-size: 10px; margin-left: 2px; }
			.hcc-item-pill-link:hover { text-decoration: underline; }

			.hcc-add-btn { background: #fff; border: 1.5px dashed #0E5C63; color: #0E5C63; padding: 7px 15px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s ease; }
			.hcc-add-btn:hover { background: rgba(14,92,99,0.06); }

			/* Category Picker Modal */
			.hcc-modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.55); z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; }
			.hcc-modal-box { background: #fff; border-radius: 10px; width: 100%; max-width: 640px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 12px 36px rgba(0,0,0,0.25); overflow: hidden; animation: hccModalFadeIn 0.15s ease-out; }
			@keyframes hccModalFadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
			.hcc-modal-header { padding: 18px 24px; border-bottom: 1px solid #dcdcde; display: flex; align-items: center; justify-content: space-between; background: #fafafa; }
			.hcc-modal-close { background: none; border: none; font-size: 20px; line-height: 1; cursor: pointer; color: #50575e; padding: 4px 8px; border-radius: 4px; }
			.hcc-modal-close:hover { background: #e0e0e0; color: #1d2327; }
			.hcc-modal-tabs { display: flex; border-bottom: 1px solid #dcdcde; background: #f0f0f1; }
			.hcc-mtab-btn { flex: 1; padding: 12px 16px; border: none; background: none; cursor: pointer; font-size: 13px; font-weight: 600; color: #50575e; text-align: center; border-bottom: 2px solid transparent; transition: all 0.15s ease; }
			.hcc-mtab-btn:hover { background: #e4e4e6; color: #1d2327; }
			.hcc-mtab-btn.active { background: #fff; color: #0E5C63; border-bottom-color: #0E5C63; }
			.hcc-modal-body { padding: 20px 24px; overflow-y: auto; flex: 1; }
			.hcc-woo-cat-search { width: 100%; box-sizing: border-box; padding: 9px 12px; font-size: 14px; border: 1.5px solid #8c8f94; border-radius: 6px; }
			.hcc-woo-cat-search:focus { border-color: #0E5C63; outline: none; box-shadow: 0 0 0 2px rgba(14,92,99,0.15); }
			.hcc-woo-list { max-height: 280px; overflow-y: auto; border: 1px solid #dcdcde; border-radius: 6px; margin-top: 8px; background: #fff; }
			.hcc-woo-cat-item { padding: 9px 14px; border-bottom: 1px solid #f0f0f1; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: background 0.1s ease; }
			.hcc-woo-cat-item:last-child { border-bottom: none; }
			.hcc-woo-cat-item:hover { background: #f6f7f7; }
			.hcc-woo-cat-item.selected { background: #e8f4f5; border-left: 3px solid #0E5C63; }
			.hcc-cat-label { font-weight: 600; font-size: 13px; color: #1d2327; display: flex; align-items: center; gap: 6px; }
			.hcc-cat-slug { font-size: 11px; color: #646970; font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
			.hcc-count-badge { background: #e2e4e7; color: #2c3338; font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 10px; }
		</style>

		<div class="wrap hcc-menu-wrap">
			<!-- Header Banner -->
			<div class="hcc-header-banner">
				<div>
					<h1 class="hcc-header-title">
						<span>🧭 Storefront Mega Menu & Category Builder</span>
					</h1>
					<p style="margin: 6px 0 0; font-size: 14px; color: #50575e;">
						Directly choose existing WooCommerce categories with automatic slug matching, or create custom links with instant live storefront sync.
					</p>
				</div>
				<div>
					<a href="<?php echo esc_url( $live_url ); ?>" target="_blank" class="hcc-live-badge" title="Opens live Next.js storefront">
						<span>🌐 View Live Storefront</span>
						<span>↗</span>
					</a>
				</div>
			</div>

			<form method="post" action="" id="hcc_mega_menu_form">
				<?php wp_nonce_field( 'hcc_mega_menu_action', 'hcc_mega_menu_nonce' ); ?>
				<input type="hidden" name="mega_menu_config_json" id="mega_menu_config_json" value="">

				<!-- Sticky Actions Toolbar -->
				<div class="hcc-toolbar-sticky">
					<div style="display: flex; align-items: center; gap: 10px; flex: 1;">
						<input
							type="text"
							class="hcc-search-input"
							placeholder="🔍 Search categories or subcategories..."
							onkeyup="hccFilterMenu(this.value)"
						/>
					</div>
					<div style="display: flex; align-items: center; gap: 8px;">
						<button
							type="submit"
							name="hcc_sync_woo_slugs"
							class="button button-secondary"
							title="Dynamically pull latest category names and slugs from WooCommerce Products -> Categories"
						>
							⚡ Sync Slugs from WooCommerce
						</button>
						<button
							type="submit"
							name="hcc_reset_mega_menu"
							class="button button-secondary"
							onclick="return confirm('Reset the entire mega menu to the original curated blueprint? This will restore all 7 Furniture columns.');"
						>
							🔄 Reset to Curated Blueprint
						</button>
						<button
							type="button"
							class="button button-primary button-hero"
							style="background:#0E5C63; border-color:#0E5C63; padding: 8px 24px; font-weight: 700; height: auto;"
							onclick="hccSaveForm()"
						>
							💾 Save Mega Menu Configuration
						</button>
						<input type="submit" name="hcc_save_mega_menu" id="hcc_real_submit_btn" style="display:none;">
					</div>
				</div>

				<!-- Navigation Tabs (Pills) -->
				<div class="hcc-tabs-bar">
					<?php foreach ( $departments as $dept_key => $dept_info ) :
						$cols = $dept_info['categories'] ?? array();
						$dept_tab_id = sanitize_title( $dept_key );
						$icon = $dept_icons[ $dept_key ] ?? '📁';
						$is_first = ( $dept_key === 'Furniture' );
					?>
						<button
							type="button"
							class="hcc-tab-btn <?php echo $is_first ? 'active' : ''; ?>"
							data-tab="<?php echo esc_attr( $dept_tab_id ); ?>"
							onclick="hccSwitchTab('<?php echo esc_attr( $dept_tab_id ); ?>', this)"
						>
							<span><?php echo esc_html( $icon . ' ' . ( $dept_info['name'] ?? $dept_key ) ); ?></span>
							<span class="hcc-tab-count"><?php echo count( $cols ); ?></span>
						</button>
					<?php endforeach; ?>

					<button
						type="button"
						class="hcc-tab-btn"
						data-tab="top-nav"
						onclick="hccSwitchTab('top-nav', this)"
					>
						<span>🔗 Top Navigation Links</span>
						<span class="hcc-tab-count"><?php echo count( $nav_items ); ?></span>
					</button>
				</div>

				<!-- TABS: DEPARTMENTS -->
				<?php foreach ( $departments as $dept_key => $dept_info ) :
					$dept_tab_id    = sanitize_title( $dept_key );
					$dept_slug      = ! empty( $dept_info['slug'] ) ? $dept_info['slug'] : self::make_slug( $dept_key );
					$is_dept_hidden = ! empty( $dept_info['hidden'] );
					$cols           = $dept_info['categories'] ?? array();
					$dept_live_url  = rtrim( $live_url, '/' ) . '/' . $dept_slug;
					$is_first_tab   = ( $dept_key === 'Furniture' );
					$col_counter    = 1;
				?>
					<div id="tab_<?php echo esc_attr( $dept_tab_id ); ?>" class="hcc-tab-content <?php echo $is_first_tab ? 'active' : ''; ?>">
						<!-- Department Top Control Card -->
						<div class="hcc-dept-card">
							<div class="hcc-dept-left">
								<button
									type="button"
									class="hcc-toggle-btn <?php echo ! $is_dept_hidden ? 'is-active' : ''; ?>"
									onclick="hccToggleDeptVis('<?php echo esc_js( $dept_key ); ?>', this)"
								>
									<?php echo ! $is_dept_hidden ? '👁️ Department Visible' : '🚫 Department Hidden'; ?>
								</button>
								<label style="font-weight:600; font-size:14px;">Name:</label>
								<input
									type="text"
									class="hcc-name-input"
									style="font-size:15px; font-weight:700; width:220px;"
									value="<?php echo esc_attr( $dept_info['name'] ?? $dept_key ); ?>"
									onchange="hccChangeDeptName('<?php echo esc_js( $dept_key ); ?>', this.value)"
								/>
								<span style="color:#50575e; font-size:13px; font-weight:600;">(<?php echo count( $cols ); ?> Columns)</span>
							</div>
							<div>
								<a href="<?php echo esc_url( $dept_live_url ); ?>" target="_blank" class="hcc-url-link">
									<span>👁️ View Live Department (<?php echo esc_html( '/' . $dept_slug ); ?>) ↗</span>
								</a>
							</div>
						</div>

						<!-- Subcategory Columns List (Level 1) -->
						<div class="hcc-columns-container" data-dept="<?php echo esc_attr( $dept_key ); ?>">
							<?php foreach ( $cols as $l1_key => $l1_data ) :
								$is_l1_hidden = ! empty( $l1_data['hidden'] );
								$l1_slug      = ! empty( $l1_data['slug'] ) ? $l1_data['slug'] : self::make_slug( $l1_key );
								$l1_live_url  = rtrim( $live_url, '/' ) . '/' . $dept_slug . '/' . $l1_slug;
								$subgroups    = $l1_data['subgroups'] ?? array();
							?>
								<div class="hcc-column-card <?php echo $is_l1_hidden ? 'is-hidden' : ''; ?>" data-dept="<?php echo esc_attr( $dept_key ); ?>" data-l1="<?php echo esc_attr( $l1_key ); ?>">
									<div class="hcc-card-top-row">
										<div class="hcc-card-left">
											<span class="hcc-col-badge">Col <?php echo $col_counter++; ?></span>
											<button
												type="button"
												class="hcc-toggle-btn <?php echo ! $is_l1_hidden ? 'is-active' : ''; ?>"
												onclick="hccToggleL1Vis('<?php echo esc_js( $dept_key ); ?>', '<?php echo esc_js( $l1_key ); ?>', this)"
											>
												<?php echo ! $is_l1_hidden ? '👁️ Visible' : '🚫 Hidden'; ?>
											</button>
											<input
												type="text"
												class="hcc-name-input"
												value="<?php echo esc_attr( $l1_data['name'] ?? $l1_key ); ?>"
												placeholder="Column Name"
												onchange="hccChangeL1Name('<?php echo esc_js( $dept_key ); ?>', '<?php echo esc_js( $l1_key ); ?>', this.value)"
											/>
											<span class="hcc-slug-badge" title="WooCommerce Category Slug">
												slug: <code><?php echo esc_html( $l1_slug ); ?></code>
											</span>
										</div>
										<div class="hcc-card-right">
											<a href="<?php echo esc_url( $l1_live_url ); ?>" target="_blank" class="hcc-url-link">
												<span>View Live ↗</span>
											</a>
											<button
												type="button"
												class="hcc-expand-btn"
												onclick="hccToggleDrawer(this)"
											>
												<span>▼ Subcategories (<?php echo count( $subgroups ); ?>)</span>
											</button>
											<button
												type="button"
												class="hcc-btn-del"
												title="Remove Column"
												onclick="hccDeleteColumn('<?php echo esc_js( $dept_key ); ?>', '<?php echo esc_js( $l1_key ); ?>')"
											>
												✕
											</button>
										</div>
									</div>

									<!-- Drawer: Subcategories (Level 2) and Leaf items (Level 3) -->
									<div class="hcc-card-drawer">
										<?php if ( empty( $subgroups ) ) : ?>
											<p style="margin:0 0 10px; color:#8c8f94; font-size:13px; font-style:italic;">No subcategories yet. Choose an existing WooCommerce category below to add.</p>
										<?php else : ?>
											<table class="hcc-subgroup-table">
												<thead>
													<tr>
														<th style="width: 85px;">Status</th>
														<th style="width: 330px;">Subcategory & WooCommerce Slug</th>
														<th>Items / Storefront Link</th>
														<th style="width: 50px; text-align: center;">Delete</th>
													</tr>
												</thead>
												<tbody>
													<?php foreach ( $subgroups as $l2_key => $l2_data ) :
														$is_l2_hidden = ! empty( $l2_data['hidden'] );
														$l2_slug      = ! empty( $l2_data['slug'] ) ? $l2_data['slug'] : self::make_slug( $l2_key );
														$l2_live_url  = rtrim( $live_url, '/' ) . '/' . $dept_slug . '/' . $l1_slug . '/' . $l2_slug;
														$items        = $l2_data['items'] ?? array();
													?>
														<tr>
															<td>
																<button
																	type="button"
																	class="hcc-toggle-btn <?php echo ! $is_l2_hidden ? 'is-active' : ''; ?>"
																	style="padding:3px 9px; font-size:12px;"
																	onclick="hccToggleL2Vis('<?php echo esc_js( $dept_key ); ?>', '<?php echo esc_js( $l1_key ); ?>', '<?php echo esc_js( $l2_key ); ?>', this)"
																>
																	<?php echo ! $is_l2_hidden ? '✓ Show' : '✗ Hide'; ?>
																</button>
															</td>
															<td>
																<input
																	type="text"
																	class="hcc-name-input"
																	style="font-size:13px; width: 100%; max-width: 250px;"
																	value="<?php echo esc_attr( $l2_data['name'] ?? $l2_key ); ?>"
																	onchange="hccChangeL2Name('<?php echo esc_js( $dept_key ); ?>', '<?php echo esc_js( $l1_key ); ?>', '<?php echo esc_js( $l2_key ); ?>', this.value)"
																/>
																<div style="font-size:11px; color:#646970; margin-top:4px; display:flex; align-items:center; gap:5px;">
																	<span>slug:</span>
																	<input
																		type="text"
																		class="hcc-slug-inline-input"
																		value="<?php echo esc_attr( $l2_slug ); ?>"
																		title="Exact WooCommerce slug for storefront routing"
																		onchange="hccChangeL2Slug('<?php echo esc_js( $dept_key ); ?>', '<?php echo esc_js( $l1_key ); ?>', '<?php echo esc_js( $l2_key ); ?>', this.value)"
																	/>
																</div>
															</td>
															<td>
																<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 4px;">
																	<span style="font-size:12px; color:#50575e; font-weight:600;"><?php echo count( $items ); ?> Leaf Items</span>
																	<a href="<?php echo esc_url( $l2_live_url ); ?>" target="_blank" class="hcc-url-link" style="font-size:11px; padding:2px 7px;">
																		<span>View Live ↗</span>
																	</a>
																</div>
																<?php if ( ! empty( $items ) ) : ?>
																	<div class="hcc-items-container">
																		<?php foreach ( $items as $it_idx => $it ) :
																			$it_name   = is_array( $it ) ? ( $it['name'] ?? '' ) : (string) $it;
																			$is_it_hid = is_array( $it ) && ! empty( $it['hidden'] );
																			$it_slug   = self::make_slug( $it_name );
																			$it_url    = rtrim( $live_url, '/' ) . '/' . $dept_slug . '/' . $l1_slug . '/' . $l2_slug . '/' . $it_slug;
																		?>
																			<label class="hcc-item-pill <?php echo $is_it_hid ? 'pill-hidden' : ''; ?>" title="<?php echo esc_attr( $it_name ); ?>">
																				<input
																					type="checkbox"
																					<?php checked( ! $is_it_hid ); ?>
																					onchange="hccToggleL3Vis('<?php echo esc_js( $dept_key ); ?>', '<?php echo esc_js( $l1_key ); ?>', '<?php echo esc_js( $l2_key ); ?>', <?php echo (int) $it_idx; ?>, this)"
																				/>
																				<span><?php echo esc_html( $it_name ); ?></span>
																				<a href="<?php echo esc_url( $it_url ); ?>" target="_blank" class="hcc-item-pill-link" onclick="event.stopPropagation();" title="View live">↗</a>
																			</label>
																		<?php endforeach; ?>
																	</div>
																<?php endif; ?>
															</td>
															<td style="text-align: center;">
																<button
																	type="button"
																	class="hcc-btn-del"
																	title="Delete Subcategory"
																	onclick="hccDeleteSubcategory('<?php echo esc_js( $dept_key ); ?>', '<?php echo esc_js( $l1_key ); ?>', '<?php echo esc_js( $l2_key ); ?>')"
																>
																	✕
																</button>
															</td>
														</tr>
													<?php endforeach; ?>
												</tbody>
											</table>
										<?php endif; ?>

										<div style="display:flex; align-items:center; gap:10px; margin-top:12px; flex-wrap:wrap;">
											<button
												type="button"
												class="hcc-add-btn"
												style="margin-top:0;"
												onclick="hccOpenCategoryPicker('l2', '<?php echo esc_js( $dept_key ); ?>', '<?php echo esc_js( $l1_key ); ?>')"
											>
												📦 + Add Subcategory from WooCommerce
											</button>
											<button
												type="button"
												class="button button-secondary"
												style="font-size:12px; height:32px; line-height:30px;"
												onclick="hccAutoImportChildCategories('<?php echo esc_js( $dept_key ); ?>', '<?php echo esc_js( $l1_key ); ?>')"
												title="Auto-fetch and populate all WooCommerce child categories that belong to this column"
											>
												⚡ Auto-Import WooCommerce Subcategories
											</button>
										</div>
									</div>
								</div>
							<?php endforeach; ?>

							<div style="margin-top:16px;">
								<button
									type="button"
									class="hcc-add-btn"
									style="font-size:14px; padding:10px 20px; border-width:2px; margin-top:0;"
									onclick="hccOpenCategoryPicker('l1', '<?php echo esc_js( $dept_key ); ?>')"
								>
									📦 + Add Category Column from WooCommerce to <?php echo esc_html( $dept_info['name'] ?? $dept_key ); ?>
								</button>
							</div>
						</div>
					</div>
				<?php endforeach; ?>

				<!-- TAB: TOP NAVIGATION BAR LINKS -->
				<div id="tab_top-nav" class="hcc-tab-content">
					<div class="hcc-header-banner" style="margin-bottom:16px;">
						<div>
							<h3 style="margin:0 0 4px; font-size:16px;">Top Navigation Bar Links</h3>
							<p style="margin:0; color:#50575e; font-size:13px;">Manage links displayed along the top bar of the storefront header.</p>
						</div>
					</div>

					<div style="background:#fff; border:1px solid #c3c4c7; border-radius:8px; overflow:hidden;">
						<table style="width:100%; border-collapse:collapse;" id="hcc_nav_table">
							<thead>
								<tr style="background:#f6f7f7; text-align:left; font-size:13px; color:#1d2327; border-bottom:1px solid #c3c4c7;">
									<th style="padding:12px 16px; width:90px;">Visibility</th>
									<th style="padding:12px 16px;">Display Name</th>
									<th style="padding:12px 16px;">Slug / Link</th>
									<th style="padding:12px 16px;">Mega Dropdown</th>
									<th style="padding:12px 16px;">Storefront URL</th>
								</tr>
							</thead>
							<tbody>
								<?php foreach ( $nav_items as $idx => $item ) :
									$is_hidden = ! empty( $item['hidden'] );
									$href = $item['href'] ?? ( '/' . ( $item['slug'] ?? '' ) );
								?>
									<tr data-nav-idx="<?php echo esc_attr( $idx ); ?>" style="border-bottom:1px solid #f0f0f1;">
										<td style="padding:12px 16px; text-align:center;">
											<button
												type="button"
												class="hcc-toggle-btn <?php echo ! $is_hidden ? 'is-active' : ''; ?>"
												onclick="hccToggleNavVis(<?php echo esc_attr( $idx ); ?>, this)"
											>
												<?php echo ! $is_hidden ? '👁️ Visible' : '🚫 Hidden'; ?>
											</button>
										</td>
										<td style="padding:12px 16px;">
											<input
												type="text"
												class="hcc-name-input"
												value="<?php echo esc_attr( $item['name'] ); ?>"
												onchange="hccChangeNavName(<?php echo esc_attr( $idx ); ?>, this.value)"
											/>
										</td>
										<td style="padding:12px 16px;">
											<code><?php echo esc_html( $item['slug'] ); ?></code>
										</td>
										<td style="padding:12px 16px;">
											<?php if ( ! empty( $item['hasSubmenu'] ) ) : ?>
												<span style="color:#137333; font-weight:600; font-size:13px;">✓ Dropdown Active</span>
											<?php else : ?>
												<span style="color:#8c8f94; font-size:13px;">Direct Link</span>
											<?php endif; ?>
										</td>
										<td style="padding:12px 16px;">
											<a href="<?php echo esc_url( rtrim( $live_url, '/' ) . $href ); ?>" target="_blank" class="hcc-url-link">
												<span><?php echo esc_html( $href ); ?></span>
												<span>↗</span>
											</a>
										</td>
									</tr>
								<?php endforeach; ?>
							</tbody>
						</table>
					</div>
				</div>
			</form>
		</div>

		<!-- WooCommerce Category Picker Modal Dialog -->
		<div id="hcc_cat_picker_modal" class="hcc-modal-backdrop" style="display:none;" onclick="if(event.target===this) hccCloseCategoryPicker();">
			<div class="hcc-modal-box">
				<div class="hcc-modal-header">
					<div>
						<h3 id="hcc_picker_title" style="margin:0 0 4px; font-size:17px; color:#1d2327;">Choose WooCommerce Category</h3>
						<p id="hcc_picker_subtitle" style="margin:0; font-size:13px; color:#50575e;">Select from existing categories in WooCommerce Products &rarr; Categories.</p>
					</div>
					<button type="button" class="hcc-modal-close" onclick="hccCloseCategoryPicker()">✕</button>
				</div>

				<div class="hcc-modal-tabs">
					<button type="button" class="hcc-mtab-btn active" id="hcc_mtab_woo" onclick="hccSwitchPickerTab('woo')">
						📦 Choose Existing WooCommerce Category
					</button>
					<button type="button" class="hcc-mtab-btn" id="hcc_mtab_custom" onclick="hccSwitchPickerTab('custom')">
						✏️ Custom / Curated Item
					</button>
				</div>

				<div class="hcc-modal-body">
					<!-- TAB 1: Live WooCommerce Categories -->
					<div id="hcc_pane_woo">
						<div style="margin-bottom:12px;">
							<input
								type="text"
								id="hcc_woo_search"
								class="hcc-woo-cat-search"
								placeholder="🔍 Type category name or slug to filter..."
								onkeyup="hccFilterWooPicker(this.value)"
							/>
						</div>

						<div class="hcc-woo-list" id="hcc_woo_list">
							<!-- Populated dynamically by hccRenderWooCategories() -->
						</div>

						<div id="hcc_picker_selection_preview" style="display:none; margin-top:14px; padding:12px 14px; background:#f0f6fc; border:1px solid #c8e1ff; border-radius:6px;">
							<div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
								<div>
									<span style="font-size:11px; font-weight:700; color:#0E5C63; text-transform:uppercase; letter-spacing:0.5px;">Selected Category:</span>
									<div style="font-size:14px; font-weight:700; color:#1d2327;" id="hcc_sel_cat_name">Category Name</div>
									<div style="font-size:12px; color:#50575e; margin-top:2px;">
										slug: <code id="hcc_sel_cat_slug" style="color:#0E5C63; font-weight:600;">category-slug</code> · ID: <span id="hcc_sel_cat_id">123</span> · Products: <span id="hcc_sel_cat_count">0</span>
									</div>
								</div>
								<button type="button" class="button button-primary" style="background:#0E5C63; border-color:#0E5C63; font-weight:700; height:34px;" onclick="hccConfirmWooCategorySelection()">
									✓ Add to Menu
								</button>
							</div>
						</div>
					</div>

					<!-- TAB 2: Custom / Curated Item -->
					<div id="hcc_pane_custom" style="display:none;">
						<p style="margin:0 0 14px; font-size:13px; color:#50575e;">
							Use this if you want to create a promotional banner, curated group, or custom heading that does not correspond to a WooCommerce category.
						</p>
						<div style="margin-bottom:12px;">
							<label style="display:block; font-weight:600; font-size:13px; margin-bottom:4px;">Display Name:</label>
							<input type="text" id="hcc_custom_name" class="hcc-name-input" style="width:100%; max-width:100%;" placeholder="e.g. Designer Favourites, New Trends" onkeyup="hccAutoSlugCustom(this.value)" />
						</div>
						<div style="margin-bottom:18px;">
							<label style="display:block; font-weight:600; font-size:13px; margin-bottom:4px;">Slug (URL path):</label>
							<input type="text" id="hcc_custom_slug" class="hcc-name-input" style="width:100%; max-width:100%; font-family:monospace;" placeholder="e.g. designer-favourites" />
						</div>
						<div style="text-align:right;">
							<button type="button" class="button button-primary" style="background:#0E5C63; border-color:#0E5C63; font-weight:700; height:34px;" onclick="hccConfirmCustomSelection()">
								+ Add Custom Item
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<script>
			window.HCC_CONFIG = <?php echo wp_json_encode( $config ); ?>;
			window.HCC_WOO_CATEGORIES = <?php echo wp_json_encode( $woo_category_list ); ?>;
			window.HCC_PICKER_CONTEXT = { level: '', deptKey: '', l1Key: '', selectedCat: null };

			function hccSwitchTab(tabId, btn) {
				document.querySelectorAll('.hcc-tab-btn').forEach(function(b) { b.classList.remove('active'); });
				document.querySelectorAll('.hcc-tab-content').forEach(function(c) { c.classList.remove('active'); });
				btn.classList.add('active');
				var target = document.getElementById('tab_' + tabId);
				if (target) target.classList.add('active');
			}

			function hccToggleDrawer(btn) {
				var card = btn.closest('.hcc-column-card');
				if (!card) return;
				var drawer = card.querySelector('.hcc-card-drawer');
				if (drawer) {
					var isOpen = drawer.classList.contains('is-open');
					if (isOpen) {
						drawer.classList.remove('is-open');
						btn.querySelector('span').innerText = btn.querySelector('span').innerText.replace('▲', '▼');
					} else {
						drawer.classList.add('is-open');
						btn.querySelector('span').innerText = btn.querySelector('span').innerText.replace('▼', '▲');
					}
				}
			}

			/* Top Nav Updates */
			function hccToggleNavVis(idx, btn) {
				if (!window.HCC_CONFIG.nav_items[idx]) return;
				var isHidden = !window.HCC_CONFIG.nav_items[idx].hidden;
				window.HCC_CONFIG.nav_items[idx].hidden = isHidden;
				btn.classList.toggle('is-active', !isHidden);
				btn.innerText = !isHidden ? '👁️ Visible' : '🚫 Hidden';
			}

			function hccChangeNavName(idx, val) {
				if (window.HCC_CONFIG.nav_items[idx]) {
					window.HCC_CONFIG.nav_items[idx].name = val;
				}
			}

			/* Department Updates */
			function hccToggleDeptVis(deptKey, btn) {
				if (!window.HCC_CONFIG.departments[deptKey]) return;
				var isHidden = !window.HCC_CONFIG.departments[deptKey].hidden;
				window.HCC_CONFIG.departments[deptKey].hidden = isHidden;
				btn.classList.toggle('is-active', !isHidden);
				btn.innerText = !isHidden ? '👁️ Department Visible' : '🚫 Department Hidden';
			}

			function hccChangeDeptName(deptKey, val) {
				if (window.HCC_CONFIG.departments[deptKey]) {
					window.HCC_CONFIG.departments[deptKey].name = val;
				}
			}

			/* Level 1 Subcategory Column Updates */
			function hccToggleL1Vis(deptKey, l1Key, btn) {
				var dept = window.HCC_CONFIG.departments[deptKey];
				if (!dept || !dept.categories || !dept.categories[l1Key]) return;
				var isHidden = !dept.categories[l1Key].hidden;
				dept.categories[l1Key].hidden = isHidden;
				btn.classList.toggle('is-active', !isHidden);
				btn.innerText = !isHidden ? '👁️ Visible' : '🚫 Hidden';
				var card = btn.closest('.hcc-column-card');
				if (card) card.classList.toggle('is-hidden', isHidden);
			}

			function hccChangeL1Name(deptKey, l1Key, val) {
				var dept = window.HCC_CONFIG.departments[deptKey];
				if (dept && dept.categories && dept.categories[l1Key]) {
					dept.categories[l1Key].name = val;
				}
			}

			function hccChangeL1Slug(deptKey, l1Key, val) {
				var dept = window.HCC_CONFIG.departments[deptKey];
				if (dept && dept.categories && dept.categories[l1Key]) {
					dept.categories[l1Key].slug = (val || '').trim().toLowerCase();
				}
			}

			function hccDeleteColumn(deptKey, l1Key) {
				if (!confirm('Are you sure you want to remove the column "' + l1Key + '" from ' + deptKey + '?')) {
					return;
				}
				var dept = window.HCC_CONFIG.departments[deptKey];
				if (dept && dept.categories && dept.categories[l1Key]) {
					delete dept.categories[l1Key];
					hccSaveForm();
				}
			}

			/* Level 2 Sub-group Updates */
			function hccToggleL2Vis(deptKey, l1Key, l2Key, btn) {
				var dept = window.HCC_CONFIG.departments[deptKey];
				if (!dept || !dept.categories || !dept.categories[l1Key]) return;
				var l1 = dept.categories[l1Key];
				if (!l1.subgroups || !l1.subgroups[l2Key]) return;
				var isHidden = !l1.subgroups[l2Key].hidden;
				l1.subgroups[l2Key].hidden = isHidden;
				btn.classList.toggle('is-active', !isHidden);
				btn.innerText = !isHidden ? '✓ Show' : '✗ Hide';
			}

			function hccChangeL2Name(deptKey, l1Key, l2Key, val) {
				var dept = window.HCC_CONFIG.departments[deptKey];
				if (dept && dept.categories && dept.categories[l1Key]) {
					var l1 = dept.categories[l1Key];
					if (l1.subgroups && l1.subgroups[l2Key]) {
						l1.subgroups[l2Key].name = val;
					}
				}
			}

			function hccChangeL2Slug(deptKey, l1Key, l2Key, val) {
				var dept = window.HCC_CONFIG.departments[deptKey];
				if (dept && dept.categories && dept.categories[l1Key]) {
					var l1 = dept.categories[l1Key];
					if (l1.subgroups && l1.subgroups[l2Key]) {
						l1.subgroups[l2Key].slug = (val || '').trim().toLowerCase();
					}
				}
			}

			function hccDeleteSubcategory(deptKey, l1Key, l2Key) {
				if (!confirm('Are you sure you want to remove the subcategory "' + l2Key + '"?')) {
					return;
				}
				var dept = window.HCC_CONFIG.departments[deptKey];
				if (dept && dept.categories && dept.categories[l1Key] && dept.categories[l1Key].subgroups) {
					delete dept.categories[l1Key].subgroups[l2Key];
					hccSaveForm();
				}
			}

			/* Level 3 Leaf Item Updates */
			function hccToggleL3Vis(deptKey, l1Key, l2Key, itIdx, chk) {
				var dept = window.HCC_CONFIG.departments[deptKey];
				if (!dept || !dept.categories || !dept.categories[l1Key]) return;
				var l1 = dept.categories[l1Key];
				if (!l1.subgroups || !l1.subgroups[l2Key] || !l1.subgroups[l2Key].items) return;
				var items = l1.subgroups[l2Key].items;
				if (items[itIdx] !== undefined) {
					var itemObj = items[itIdx];
					if (typeof itemObj === 'string') {
						itemObj = { name: itemObj, hidden: false };
						items[itIdx] = itemObj;
					}
					itemObj.hidden = !chk.checked;
					var pill = chk.closest('.hcc-item-pill');
					if (pill) pill.classList.toggle('pill-hidden', !chk.checked);
				}
			}

			/* WooCommerce Category Picker Functions */
			function hccOpenCategoryPicker(level, deptKey, l1Key) {
				window.HCC_PICKER_CONTEXT = {
					level: level,
					deptKey: deptKey,
					l1Key: l1Key || '',
					selectedCat: null
				};

				var titleEl = document.getElementById('hcc_picker_title');
				var subEl   = document.getElementById('hcc_picker_subtitle');
				if (level === 'l1') {
					titleEl.innerText = 'Add Category Column to ' + deptKey;
					subEl.innerText   = 'Choose an existing WooCommerce category to add as a new column under ' + deptKey + '.';
				} else {
					titleEl.innerText = 'Add Subcategory under ' + l1Key;
					subEl.innerText   = 'Choose an existing WooCommerce category with verified slug to link under ' + l1Key + '.';
				}

				hccSwitchPickerTab('woo');
				document.getElementById('hcc_woo_search').value = '';
				document.getElementById('hcc_custom_name').value = '';
				document.getElementById('hcc_custom_slug').value = '';
				document.getElementById('hcc_picker_selection_preview').style.display = 'none';

				hccRenderWooCategories('');
				document.getElementById('hcc_cat_picker_modal').style.display = 'flex';
				setTimeout(function() {
					document.getElementById('hcc_woo_search').focus();
				}, 100);
			}

			function hccCloseCategoryPicker() {
				document.getElementById('hcc_cat_picker_modal').style.display = 'none';
				window.HCC_PICKER_CONTEXT.selectedCat = null;
			}

			function hccSwitchPickerTab(tab) {
				var btnWoo = document.getElementById('hcc_mtab_woo');
				var btnCustom = document.getElementById('hcc_mtab_custom');
				var paneWoo = document.getElementById('hcc_pane_woo');
				var paneCustom = document.getElementById('hcc_pane_custom');

				if (tab === 'woo') {
					btnWoo.classList.add('active');
					btnCustom.classList.remove('active');
					paneWoo.style.display = 'block';
					paneCustom.style.display = 'none';
				} else {
					btnCustom.classList.add('active');
					btnWoo.classList.remove('active');
					paneCustom.style.display = 'block';
					paneWoo.style.display = 'none';
				}
			}

			function hccRenderWooCategories(query) {
				var listEl = document.getElementById('hcc_woo_list');
				listEl.innerHTML = '';
				query = (query || '').toLowerCase().trim();

				var cats = window.HCC_WOO_CATEGORIES || [];
				var filtered = cats.filter(function(cat) {
					if (!query) return true;
					return cat.name.toLowerCase().indexOf(query) !== -1 || cat.slug.toLowerCase().indexOf(query) !== -1;
				});

				if (filtered.length === 0) {
					listEl.innerHTML = '<div style="padding:20px; text-align:center; color:#8c8f94; font-size:13px;">No WooCommerce categories found matching "' + query + '".</div>';
					return;
				}

				// Build lookup map for parent names
				var catMap = {};
				cats.forEach(function(c) { catMap[c.id] = c; });

				filtered.forEach(function(cat) {
					var itemEl = document.createElement('div');
					itemEl.className = 'hcc-woo-cat-item';
					itemEl.setAttribute('data-id', cat.id);

					var parentLabel = '';
					if (cat.parent && catMap[cat.parent]) {
						parentLabel = '<span style="color:#8c8f94; font-size:11px; font-weight:normal;">' + catMap[cat.parent].name + ' &rsaquo; </span>';
					}

					itemEl.innerHTML = `
						<div>
							<div class="hcc-cat-label">${parentLabel}${cat.name}</div>
							<div class="hcc-cat-slug">slug: <code>${cat.slug}</code> &middot; ID: ${cat.id}</div>
						</div>
						<div>
							<span class="hcc-count-badge">${cat.count} products</span>
						</div>
					`;

					itemEl.onclick = function() { hccSelectWooCategory(cat.id); };
					itemEl.ondblclick = function() {
						hccSelectWooCategory(cat.id);
						hccConfirmWooCategorySelection();
					};

					listEl.appendChild(itemEl);
				});
			}

			function hccFilterWooPicker(val) {
				hccRenderWooCategories(val);
			}

			function hccSelectWooCategory(catId) {
				var cats = window.HCC_WOO_CATEGORIES || [];
				var cat = cats.find(function(c) { return c.id === catId; });
				if (!cat) return;

				window.HCC_PICKER_CONTEXT.selectedCat = cat;

				// Highlight selected row
				document.querySelectorAll('.hcc-woo-cat-item').forEach(function(el) {
					el.classList.toggle('selected', parseInt(el.getAttribute('data-id'), 10) === catId);
				});

				// Update preview card
				document.getElementById('hcc_sel_cat_name').innerText = cat.name;
				document.getElementById('hcc_sel_cat_slug').innerText = cat.slug;
				document.getElementById('hcc_sel_cat_id').innerText   = cat.id;
				document.getElementById('hcc_sel_cat_count').innerText= cat.count;
				document.getElementById('hcc_picker_selection_preview').style.display = 'block';
			}

			function hccConfirmWooCategorySelection() {
				var cat = window.HCC_PICKER_CONTEXT.selectedCat;
				if (!cat) {
					alert('Please click to select a WooCommerce category first.');
					return;
				}

				var level   = window.HCC_PICKER_CONTEXT.level;
				var deptKey = window.HCC_PICKER_CONTEXT.deptKey;
				var l1Key   = window.HCC_PICKER_CONTEXT.l1Key;

				if (level === 'l1') {
					if (!window.HCC_CONFIG.departments[deptKey].categories) {
						window.HCC_CONFIG.departments[deptKey].categories = {};
					}
					window.HCC_CONFIG.departments[deptKey].categories[cat.name] = {
						name: cat.name,
						slug: cat.slug,
						term_id: cat.id,
						hidden: false,
						subgroups: {}
					};
				} else if (level === 'l2') {
					var l1 = window.HCC_CONFIG.departments[deptKey].categories[l1Key];
					if (!l1.subgroups) l1.subgroups = {};
					l1.subgroups[cat.name] = {
						name: cat.name,
						slug: cat.slug,
						term_id: cat.id,
						hidden: false,
						items: []
					};
				}

				hccCloseCategoryPicker();
				hccSaveForm();
			}

			function hccAutoSlugCustom(val) {
				var clean = (val || '')
					.toLowerCase()
					.replace(/&/g, 'and')
					.replace(/[^a-z0-9\s-]/g, '')
					.trim()
					.replace(/[\s_]+/g, '-')
					.replace(/-+/g, '-');
				document.getElementById('hcc_custom_slug').value = clean;
			}

			function hccConfirmCustomSelection() {
				var name = document.getElementById('hcc_custom_name').value.trim();
				var slug = document.getElementById('hcc_custom_slug').value.trim();

				if (!name) {
					alert('Please enter a display name for the custom item.');
					return;
				}
				if (!slug) {
					slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
				}

				var level   = window.HCC_PICKER_CONTEXT.level;
				var deptKey = window.HCC_PICKER_CONTEXT.deptKey;
				var l1Key   = window.HCC_PICKER_CONTEXT.l1Key;

				if (level === 'l1') {
					if (!window.HCC_CONFIG.departments[deptKey].categories) {
						window.HCC_CONFIG.departments[deptKey].categories = {};
					}
					window.HCC_CONFIG.departments[deptKey].categories[name] = {
						name: name,
						slug: slug,
						hidden: false,
						subgroups: {}
					};
				} else if (level === 'l2') {
					var l1 = window.HCC_CONFIG.departments[deptKey].categories[l1Key];
					if (!l1.subgroups) l1.subgroups = {};
					l1.subgroups[name] = {
						name: name,
						slug: slug,
						hidden: false,
						items: []
					};
				}

				hccCloseCategoryPicker();
				hccSaveForm();
			}

			/* 1-Click Auto-Import of Child Categories from WooCommerce */
			function hccAutoImportChildCategories(deptKey, l1Key) {
				var l1 = window.HCC_CONFIG.departments[deptKey]?.categories?.[l1Key];
				if (!l1) return;

				var matchedCat = null;
				if (l1.term_id) {
					matchedCat = window.HCC_WOO_CATEGORIES.find(function(c) { return c.id === l1.term_id; });
				}
				if (!matchedCat && l1.slug) {
					matchedCat = window.HCC_WOO_CATEGORIES.find(function(c) { return c.slug.toLowerCase() === l1.slug.toLowerCase(); });
				}
				if (!matchedCat) {
					var cleanName = (l1.name || l1Key).toLowerCase().trim();
					matchedCat = window.HCC_WOO_CATEGORIES.find(function(c) { return c.name.toLowerCase().trim() === cleanName; });
				}

				if (!matchedCat) {
					alert('Could not auto-match "' + (l1.name || l1Key) + '" to a parent WooCommerce category.\n\nPlease click "+ Add Subcategory from WooCommerce" to select child categories directly.');
					return;
				}

				var childCats = window.HCC_WOO_CATEGORIES.filter(function(c) {
					return c.parent === matchedCat.id;
				});

				if (!childCats || childCats.length === 0) {
					alert('No WooCommerce child categories found under "' + matchedCat.name + '" (slug: ' + matchedCat.slug + ').\n\nYou can add subcategories individually with "+ Add Subcategory from WooCommerce", or define child categories in WordPress under Products -> Categories.');
					return;
				}

				if (!l1.subgroups) l1.subgroups = {};
				var addedCount = 0;

				childCats.forEach(function(child) {
					var alreadyExists = Object.keys(l1.subgroups).some(function(k) {
						var sub = l1.subgroups[k];
						return (sub.term_id && sub.term_id === child.id) ||
						       (sub.slug && sub.slug.toLowerCase() === child.slug.toLowerCase()) ||
						       (sub.name && sub.name.toLowerCase() === child.name.toLowerCase()) ||
						       k.toLowerCase() === child.name.toLowerCase();
					});

					if (!alreadyExists) {
						l1.subgroups[child.name] = {
							name: child.name,
							slug: child.slug,
							term_id: child.id,
							hidden: false,
							items: []
						};
						addedCount++;
					}
				});

				if (addedCount > 0) {
					alert('Successfully imported ' + addedCount + ' child categories from WooCommerce under "' + matchedCat.name + '"!');
					hccSaveForm();
				} else {
					alert('All ' + childCats.length + ' child categories from WooCommerce are already present under "' + matchedCat.name + '".');
				}
			}

			function hccSaveForm() {
				document.getElementById('mega_menu_config_json').value = JSON.stringify(window.HCC_CONFIG);
				document.getElementById('hcc_real_submit_btn').click();
			}

			function hccFilterMenu(keyword) {
				keyword = (keyword || '').toLowerCase().trim();
				var cards = document.querySelectorAll('.hcc-column-card');
				if (!keyword) {
					cards.forEach(function(c) { c.style.display = ''; });
					return;
				}
				cards.forEach(function(card) {
					var text = card.innerText.toLowerCase();
					if (text.indexOf(keyword) !== -1) {
						card.style.display = '';
					} else {
						card.style.display = 'none';
					}
				});
			}
		</script>
		<?php
	}
}
