<?php

namespace HeadlessCommerceCore\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Direct WooCommerce Product Categories Mega Menu Manager
 * Fetches directly from live WooCommerce `product_cat` hierarchy
 * Allows administrators to select/hide categories at any level with live storefront URLs
 */
class MegaMenuManager {

	const HIDDEN_TERMS_OPTION   = 'hcc_mega_menu_hidden_term_ids';
	const NAME_OVERRIDES_OPTION = 'hcc_mega_menu_name_overrides';
	const TOP_NAV_OPTION        = 'hcc_mega_menu_top_nav';
	const TRANSIENT_KEY         = 'hcc_public_mega_menu';

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_admin_menu' ), 15 );
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_admin_assets' ) );
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
	}

	public static function enqueue_admin_assets( $hook ) {
		if ( strpos( $hook, 'hcc-mega-menu' ) === false ) {
			return;
		}
	}

	/**
	 * Default top navigation bar links
	 */
	public static function get_default_top_nav() {
		return array(
			array( 'id' => 'nav_new_arrivals', 'name' => 'New Arrivals', 'slug' => 'new-arrivals', 'href' => '/collections/new-arrivals', 'hasSubmenu' => false, 'deptKey' => '', 'hidden' => false ),
			array( 'id' => 'nav_furniture', 'name' => 'Furniture', 'slug' => 'furniture', 'href' => '/furniture', 'hasSubmenu' => true, 'deptKey' => 'Furniture', 'hidden' => false ),
			array( 'id' => 'nav_home_decor', 'name' => 'Home Decor', 'slug' => 'home-decor', 'href' => '/home-decor', 'hasSubmenu' => true, 'deptKey' => 'Home Decor', 'hidden' => false ),
			array( 'id' => 'nav_wall_decor', 'name' => 'Wall Decor & Mirrors', 'slug' => 'wall-decor-and-mirrors', 'href' => '/wall-decor-and-mirrors', 'hasSubmenu' => true, 'deptKey' => 'Wall Decor & Mirrors', 'hidden' => false ),
			array( 'id' => 'nav_lighting', 'name' => 'Lighting', 'slug' => 'lighting', 'href' => '/lighting', 'hasSubmenu' => true, 'deptKey' => 'Lighting', 'hidden' => false ),
			array( 'id' => 'nav_rugs', 'name' => 'Rugs & Floor Coverings', 'slug' => 'rugs-and-floor-coverings', 'href' => '/rugs-and-floor-coverings', 'hasSubmenu' => true, 'deptKey' => 'Rugs & Floor Coverings', 'hidden' => false ),
			array( 'id' => 'nav_storage', 'name' => 'Storage & Organization', 'slug' => 'storage-and-organization', 'href' => '/storage-and-organization', 'hasSubmenu' => true, 'deptKey' => 'Storage & Organization', 'hidden' => false ),
			array( 'id' => 'nav_kitchen', 'name' => 'Kitchen & Tabletop', 'slug' => 'kitchen-and-tabletop', 'href' => '/kitchen-and-tabletop', 'hasSubmenu' => true, 'deptKey' => 'Kitchen & Tabletop', 'hidden' => false ),
			array( 'id' => 'nav_outdoor', 'name' => 'Outdoor & Garden', 'slug' => 'outdoor-and-garden', 'href' => '/outdoor-and-garden', 'hasSubmenu' => true, 'deptKey' => 'Outdoor & Garden', 'hidden' => false ),
			array( 'id' => 'nav_kids_pet', 'name' => 'Kids & Pet Home', 'slug' => 'kids-and-pet-home', 'href' => '/collections/kids-and-pet-home', 'hasSubmenu' => true, 'deptKey' => 'Kids & Pet Home', 'hidden' => false ),
		);
	}

	/**
	 * Get hidden category IDs
	 */
	public static function get_hidden_term_ids() {
		$hidden = get_option( self::HIDDEN_TERMS_OPTION, null );
		if ( ! is_array( $hidden ) ) {
			return array();
		}
		return array_map( 'intval', $hidden );
	}

	/**
	 * Get category display name overrides
	 */
	public static function get_name_overrides() {
		$overrides = get_option( self::NAME_OVERRIDES_OPTION, array() );
		return is_array( $overrides ) ? $overrides : array();
	}

	/**
	 * Get configured top navigation items
	 */
	public static function get_top_nav_config() {
		$top_nav = get_option( self::TOP_NAV_OPTION, null );
		if ( ! is_array( $top_nav ) || empty( $top_nav ) ) {
			return self::get_default_top_nav();
		}
		return $top_nav;
	}

	/**
	 * Build complete hierarchy tree directly from WooCommerce product_cat terms
	 */
	public static function get_woo_category_tree() {
		$terms = get_terms( array(
			'taxonomy'   => 'product_cat',
			'hide_empty' => false,
			'orderby'    => 'name',
			'order'      => 'ASC',
		) );

		if ( is_wp_error( $terms ) || empty( $terms ) ) {
			return array();
		}

		$by_parent = array();
		$by_id     = array();

		foreach ( $terms as $term ) {
			if ( $term->slug === 'uncategorized' ) {
				continue;
			}
			$by_id[ $term->term_id ] = $term;
			$parent_id = (int) $term->parent;
			if ( ! isset( $by_parent[ $parent_id ] ) ) {
				$by_parent[ $parent_id ] = array();
			}
			$by_parent[ $parent_id ][] = $term;
		}

		$hidden_ids = self::get_hidden_term_ids();
		$overrides  = self::get_name_overrides();

		$tree = array();
		$root_terms = $by_parent[0] ?? array();

		// Preferred order of departments matching storefront design
		$order_map = array(
			'furniture'               => 1,
			'home-decor'              => 2,
			'wall-decor-and-mirrors'  => 3,
			'lighting'                => 4,
			'rugs-and-floor-coverings'=> 5,
			'storage-and-organization'=> 6,
			'kitchen-and-tabletop'    => 7,
			'outdoor-and-garden'      => 8,
			'kids-and-baby-home'      => 9,
			'pet-home'                => 10,
		);

		usort( $root_terms, function( $a, $b ) use ( $order_map ) {
			$ord_a = $order_map[ $a->slug ] ?? 99;
			$ord_b = $order_map[ $b->slug ] ?? 99;
			if ( $ord_a !== $ord_b ) return $ord_a - $ord_b;
			return strcmp( $a->name, $b->name );
		} );

		foreach ( $root_terms as $dept_term ) {
			$dept_id = $dept_term->term_id;
			$dept_name = $dept_term->name;
			$dept_slug = $dept_term->slug;

			$dept_node = array(
				'id'           => $dept_id,
				'name'         => $dept_name,
				'slug'         => $dept_slug,
				'display_name' => $overrides[ $dept_id ] ?? $dept_name,
				'count'        => (int) $dept_term->count,
				'hidden'       => in_array( $dept_id, $hidden_ids, true ),
				'url_path'     => '/' . $dept_slug,
				'l1_items'     => array(),
			);

			$l1_terms = $by_parent[ $dept_id ] ?? array();
			foreach ( $l1_terms as $l1_term ) {
				$l1_id   = $l1_term->term_id;
				$l1_name = $l1_term->name;
				$l1_slug = $l1_term->slug;
				$l1_path = '/' . $dept_slug . '/' . $l1_slug;

				$l1_node = array(
					'id'           => $l1_id,
					'name'         => $l1_name,
					'slug'         => $l1_slug,
					'display_name' => $overrides[ $l1_id ] ?? $l1_name,
					'count'        => (int) $l1_term->count,
					'hidden'       => in_array( $l1_id, $hidden_ids, true ),
					'url_path'     => $l1_path,
					'l2_items'     => array(),
				);

				$l2_terms = $by_parent[ $l1_id ] ?? array();
				foreach ( $l2_terms as $l2_term ) {
					$l2_id   = $l2_term->term_id;
					$l2_name = $l2_term->name;
					$l2_slug = $l2_term->slug;
					$l2_path = $l1_path . '/' . $l2_slug;

					$l2_node = array(
						'id'           => $l2_id,
						'name'         => $l2_name,
						'slug'         => $l2_slug,
						'display_name' => $overrides[ $l2_id ] ?? $l2_name,
						'count'        => (int) $l2_term->count,
						'hidden'       => in_array( $l2_id, $hidden_ids, true ),
						'url_path'     => $l2_path,
						'l3_items'     => array(),
					);

					$l3_terms = $by_parent[ $l2_id ] ?? array();
					foreach ( $l3_terms as $l3_term ) {
						$l3_id   = $l3_term->term_id;
						$l3_name = $l3_term->name;
						$l3_slug = $l3_term->slug;
						$l3_path = $l2_path . '/' . $l3_slug;

						$l2_node['l3_items'][] = array(
							'id'           => $l3_id,
							'name'         => $l3_name,
							'slug'         => $l3_slug,
							'display_name' => $overrides[ $l3_id ] ?? $l3_name,
							'count'        => (int) $l3_term->count,
							'hidden'       => in_array( $l3_id, $hidden_ids, true ),
							'url_path'     => $l3_path,
						);
					}

					$l1_node['l2_items'][] = $l2_node;
				}

				$dept_node['l1_items'][] = $l1_node;
			}

			$tree[ $dept_name ] = $dept_node;
		}

		return $tree;
	}

	/**
	 * Get resolved clean public mega menu data for Next.js
	 * Fetches directly from WooCommerce product_cat terms, respecting hidden exclusions
	 */
	public static function get_public_menu_data() {
		$cached = get_transient( self::TRANSIENT_KEY );
		if ( ! empty( $cached ) && is_array( $cached ) ) {
			return $cached;
		}

		$tree       = self::get_woo_category_tree();
		$top_nav    = self::get_top_nav_config();
		$hidden_ids = self::get_hidden_term_ids();

		// 1. Resolve Active Top Nav Items
		$active_nav = array();
		foreach ( $top_nav as $item ) {
			if ( ! empty( $item['hidden'] ) ) {
				continue;
			}
			$active_nav[] = array(
				'id'         => $item['id'] ?? '',
				'name'       => $item['name'] ?? '',
				'slug'       => $item['slug'] ?? '',
				'href'       => $item['href'] ?? ( '/' . ( $item['slug'] ?? '' ) ),
				'hasSubmenu' => ! empty( $item['hasSubmenu'] ),
				'deptKey'    => $item['deptKey'] ?? '',
			);
		}

		// 2. Resolve Active Department Taxonomy
		$active_tax = array();

		foreach ( $tree as $dept_name => $dept_node ) {
			if ( ! empty( $dept_node['hidden'] ) ) {
				continue;
			}

			$dept_key = $dept_node['display_name'];
			$dept_tree = array();

			foreach ( $dept_node['l1_items'] as $l1_node ) {
				if ( ! empty( $l1_node['hidden'] ) ) {
					continue;
				}

				$l1_title = $l1_node['display_name'];
				$dept_tree[ $l1_title ] = array();

				foreach ( $l1_node['l2_items'] as $l2_node ) {
					if ( ! empty( $l2_node['hidden'] ) ) {
						continue;
					}

					$l2_title = $l2_node['display_name'];
					$l3_active_names = array();

					foreach ( $l2_node['l3_items'] as $l3_node ) {
						if ( ! empty( $l3_node['hidden'] ) ) {
							continue;
						}
						$l3_active_names[] = $l3_node['display_name'];
					}

					$dept_tree[ $l1_title ][ $l2_title ] = $l3_active_names;
				}
			}

			$active_tax[ $dept_key ] = $dept_tree;
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
	 * Render the Admin Mega Menu Builder Page
	 */
	public static function render_admin_page() {
		$live_url = BusinessPagesManager::get_frontend_url();

		// Handle Reset
		if ( isset( $_POST['hcc_reset_mega_menu'] ) && check_admin_referer( 'hcc_mega_menu_action', 'hcc_mega_menu_nonce' ) ) {
			delete_option( self::HIDDEN_TERMS_OPTION );
			delete_option( self::NAME_OVERRIDES_OPTION );
			delete_option( self::TOP_NAV_OPTION );
			self::trigger_nextjs_revalidation();
			echo '<div class="notice notice-success is-dismissible" style="margin-top:16px;"><p><strong>✅ Mega Menu reset! All WooCommerce product categories are now active. Live storefront revalidated.</strong></p></div>';
		}

		// Handle Save
		if ( isset( $_POST['hcc_save_mega_menu'] ) && check_admin_referer( 'hcc_mega_menu_action', 'hcc_mega_menu_nonce' ) ) {
			// Process hidden term IDs
			$posted_hidden = isset( $_POST['hidden_terms'] ) && is_array( $_POST['hidden_terms'] )
				? array_map( 'intval', $_POST['hidden_terms'] )
				: array();

			// Process name overrides
			$posted_overrides = isset( $_POST['name_overrides'] ) && is_array( $_POST['name_overrides'] )
				? array_map( 'sanitize_text_field', wp_unslash( $_POST['name_overrides'] ) )
				: array();

			$clean_overrides = array();
			foreach ( $posted_overrides as $tid => $name ) {
				$tid = (int) $tid;
				$name = trim( $name );
				if ( $tid > 0 && ! empty( $name ) ) {
					$clean_overrides[ $tid ] = $name;
				}
			}

			// Process top nav items
			$posted_top_nav = isset( $_POST['top_nav_json'] ) ? wp_unslash( $_POST['top_nav_json'] ) : '';
			$decoded_top_nav = json_decode( $posted_top_nav, true );

			update_option( self::HIDDEN_TERMS_OPTION, $posted_hidden );
			update_option( self::NAME_OVERRIDES_OPTION, $clean_overrides );

			if ( is_array( $decoded_top_nav ) && ! empty( $decoded_top_nav ) ) {
				update_option( self::TOP_NAV_OPTION, $decoded_top_nav );
			}

			self::trigger_nextjs_revalidation();

			echo '<div class="notice notice-success is-dismissible" style="margin-top:16px; padding:12px;"><p style="font-size:15px; margin:0;"><strong>✅ Mega Menu configuration saved!</strong> Selected WooCommerce product categories are synced live to the storefront. <a href="' . esc_url( $live_url ) . '" target="_blank" style="margin-left:12px; font-weight:700; color:#0E5C63; text-decoration:underline;">👁️ View Live Storefront ↗</a></p></div>';
		}

		$tree       = self::get_woo_category_tree();
		$top_nav    = self::get_top_nav_config();
		$hidden_ids = self::get_hidden_term_ids();
		$overrides  = self::get_name_overrides();

		$dept_keys = array_keys( $tree );
		$first_dept = ! empty( $dept_keys ) ? $dept_keys[0] : '';
		?>
		<style>
			.hcc-menu-wrap { max-width: 1300px; margin: 20px 0 40px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, sans-serif; }
			.hcc-header-banner { background: #fff; border: 1px solid #c3c4c7; border-radius: 8px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 20px; flex-wrap: wrap; gap: 16px; }
			.hcc-header-title { margin: 0; font-size: 22px; font-weight: 700; color: #1d2327; display: flex; align-items: center; gap: 8px; }
			.hcc-live-badge { display: inline-flex; align-items: center; gap: 6px; background: #e6f4ea; color: #137333; padding: 5px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; text-decoration: none; border: 1px solid #ceead6; }
			.hcc-live-badge:hover { background: #ceead6; color: #0d5223; }
			
			.hcc-toolbar-sticky { position: sticky; top: 32px; z-index: 100; background: #fff; border: 1px solid #0E5C63; border-radius: 8px; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 14px rgba(14,92,99,0.15); margin-bottom: 24px; gap: 12px; flex-wrap: wrap; }
			.hcc-search-input { min-width: 320px; flex: 1; max-width: 450px; padding: 8px 12px 8px 34px; border: 1px solid #8c8f94; border-radius: 6px; font-size: 14px; background: #fff url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%238c8f94" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>') no-repeat 10px center; }
			.hcc-search-input:focus { border-color: #0E5C63; outline: none; box-shadow: 0 0 0 2px rgba(14,92,99,0.2); }

			.hcc-tabs-bar { display: flex; flex-wrap: wrap; gap: 4px; border-bottom: 2px solid #0E5C63; margin-bottom: 20px; }
			.hcc-tab-btn { background: #f0f0f1; border: 1px solid #c3c4c7; border-bottom: none; padding: 10px 18px; font-size: 14px; font-weight: 600; color: #50575e; border-radius: 6px 6px 0 0; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s ease; }
			.hcc-tab-btn:hover { background: #e5e5e5; color: #1d2327; }
			.hcc-tab-btn.active { background: #0E5C63; color: #fff; border-color: #0E5C63; }
			.hcc-tab-count { background: rgba(0,0,0,0.08); padding: 2px 7px; border-radius: 12px; font-size: 11px; }
			.hcc-tab-btn.active .hcc-tab-count { background: rgba(255,255,255,0.25); color: #fff; }

			.hcc-tab-content { display: none; }
			.hcc-tab-content.active { display: block; }

			.hcc-dept-header-card { background: #fff; border: 1px solid #c3c4c7; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
			.hcc-dept-title-group { display: flex; align-items: center; gap: 12px; }
			.hcc-dept-title-group h2 { margin: 0; font-size: 18px; font-weight: 700; color: #1d2327; }
			.hcc-dept-actions { display: flex; align-items: center; gap: 8px; }

			.hcc-l1-card { background: #fff; border: 1px solid #c3c4c7; border-radius: 8px; margin-bottom: 16px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.03); transition: border-color 0.2s ease; }
			.hcc-l1-card:hover { border-color: #8c8f94; }
			.hcc-l1-card.is-hidden-card { opacity: 0.55; background: #fafafa; }
			.hcc-l1-header { padding: 14px 20px; background: #f9f9fa; border-bottom: 1px solid #e2e4e7; display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; }
			.hcc-l1-left { display: flex; align-items: center; gap: 12px; flex: 1; }
			.hcc-l1-title { font-size: 15px; font-weight: 700; color: #1d2327; }
			.hcc-count-badge { background: #e0e0e0; color: #3c434a; font-size: 12px; padding: 2px 8px; border-radius: 12px; font-weight: 600; }
			.hcc-link-btn { color: #0E5C63; text-decoration: none; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 4px; background: rgba(14,92,99,0.08); }
			.hcc-link-btn:hover { background: rgba(14,92,99,0.18); text-decoration: underline; color: #083c41; }
			.hcc-l1-body { padding: 18px 20px; }

			.hcc-l2-group { background: #fdfdfd; border: 1px solid #e5e5e5; border-radius: 6px; padding: 14px 16px; margin-bottom: 14px; }
			.hcc-l2-group:last-child { margin-bottom: 0; }
			.hcc-l2-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
			.hcc-l2-title { font-size: 14px; font-weight: 700; color: #2c3338; display: flex; align-items: center; gap: 8px; }

			.hcc-l3-chips { display: flex; flex-wrap: wrap; gap: 8px; }
			.hcc-chip { display: inline-flex; align-items: center; gap: 6px; background: #f0f0f1; border: 1px solid #dcdcde; border-radius: 20px; padding: 4px 10px 4px 8px; font-size: 12px; color: #2c3338; transition: all 0.15s ease; }
			.hcc-chip:hover { border-color: #8c8f94; background: #e8e8e8; }
			.hcc-chip.chip-hidden { opacity: 0.45; text-decoration: line-through; background: #fff; }
			.hcc-chip input[type="checkbox"] { margin: 0; cursor: pointer; }
			.hcc-chip-link { color: #0E5C63; text-decoration: none; font-size: 12px; margin-left: 2px; }
			.hcc-chip-link:hover { text-decoration: underline; font-weight: bold; }

			.hcc-toggle-all-btn { background: #fff; border: 1px solid #8c8f94; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; color: #2c3338; }
			.hcc-toggle-all-btn:hover { background: #f0f0f1; border-color: #50575e; }

			/* Top Nav Links Table */
			.hcc-top-nav-table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #c3c4c7; border-radius: 8px; overflow: hidden; }
			.hcc-top-nav-table th { background: #f6f7f7; text-align: left; padding: 12px 16px; border-bottom: 1px solid #c3c4c7; font-size: 13px; font-weight: 700; color: #1d2327; }
			.hcc-top-nav-table td { padding: 12px 16px; border-bottom: 1px solid #f0f0f1; font-size: 14px; vertical-align: middle; }
			.hcc-top-nav-table tr:hover { background: #fbfbfb; }
			.hcc-nav-input { width: 100%; max-width: 260px; padding: 6px 10px; border: 1px solid #8c8f94; border-radius: 4px; font-size: 13px; }
		</style>

		<div class="wrap hcc-menu-wrap">
			<!-- Header Banner -->
			<div class="hcc-header-banner">
				<div>
					<h1 class="hcc-header-title">
						<span>🧭 Storefront Mega Menu & Category Navigation</span>
					</h1>
					<p style="margin: 6px 0 0; font-size: 14px; color: #50575e;">
						Directly powered by live WooCommerce Product Categories (<code>product_cat</code>). Check or uncheck categories to retain or hide them in the storefront mega menu.
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

				<!-- Sticky Actions Toolbar -->
				<div class="hcc-toolbar-sticky">
					<div style="display: flex; align-items: center; gap: 10px; flex: 1;">
						<input
							type="text"
							id="hcc_category_search"
							class="hcc-search-input"
							placeholder="🔍 Search categories, subcategories, or items..."
							onkeyup="hccFilterCategories(this.value)"
						/>
						<span id="hcc_search_match_count" style="font-size: 13px; color: #50575e; font-weight: 600;"></span>
					</div>
					<div style="display: flex; align-items: center; gap: 8px;">
						<button
							type="submit"
							name="hcc_reset_mega_menu"
							class="button button-secondary"
							onclick="return confirm('Reset all visibility preferences and show all WooCommerce categories in the Mega Menu?');"
						>
							🔄 Reset All to Active
						</button>
						<button
							type="submit"
							name="hcc_save_mega_menu"
							class="button button-primary button-hero"
							style="background:#0E5C63; border-color:#0E5C63; padding: 8px 24px; font-weight: 700; height: auto;"
						>
							💾 Save Mega Menu Configuration
						</button>
					</div>
				</div>

				<input type="hidden" name="top_nav_json" id="hcc_top_nav_json" value="<?php echo esc_attr( wp_json_encode( $top_nav ) ); ?>">

				<!-- Department Navigation Tabs -->
				<div class="hcc-tabs-bar">
					<button
						type="button"
						class="hcc-tab-btn active"
						data-tab="top-nav"
						onclick="hccSwitchTab('top-nav', this)"
					>
						<span>⭐ Top Navigation Links</span>
						<span class="hcc-tab-count"><?php echo count( $top_nav ); ?></span>
					</button>

					<?php foreach ( $tree as $dept_name => $dept_node ) :
						$l1_count = count( $dept_node['l1_items'] );
						$dept_tab_id = sanitize_title( $dept_name );
					?>
						<button
							type="button"
							class="hcc-tab-btn"
							data-tab="<?php echo esc_attr( $dept_tab_id ); ?>"
							onclick="hccSwitchTab('<?php echo esc_attr( $dept_tab_id ); ?>', this)"
						>
							<span><?php echo esc_html( $dept_node['display_name'] ); ?></span>
							<span class="hcc-tab-count"><?php echo (int) $l1_count; ?></span>
						</button>
					<?php endforeach; ?>
				</div>

				<!-- TAB: TOP NAVIGATION BAR LINKS -->
				<div id="tab_top-nav" class="hcc-tab-content active">
					<div class="hcc-dept-header-card">
						<div>
							<h3 style="margin: 0 0 4px; font-size: 16px;">Top Navigation Bar Tier</h3>
							<p style="margin: 0; color: #50575e; font-size: 13px;">Manage the primary links displayed across the top bar of the storefront header.</p>
						</div>
					</div>

					<table class="hcc-top-nav-table" id="hcc_top_nav_table">
						<thead>
							<tr>
								<th style="width: 70px;">Visible</th>
								<th>Display Title</th>
								<th>Link / Slug</th>
								<th>Mega Dropdown</th>
								<th>Storefront URL</th>
							</tr>
						</thead>
						<tbody>
							<?php foreach ( $top_nav as $idx => $nav_item ) :
								$is_hidden = ! empty( $nav_item['hidden'] );
								$target_href = $nav_item['href'] ?? ( '/' . ( $nav_item['slug'] ?? '' ) );
							?>
								<tr data-nav-idx="<?php echo esc_attr( $idx ); ?>">
									<td style="text-align: center;">
										<input
											type="checkbox"
											class="hcc-top-nav-vis"
											data-idx="<?php echo esc_attr( $idx ); ?>"
											<?php checked( ! $is_hidden ); ?>
											onchange="hccUpdateTopNav()"
										/>
									</td>
									<td>
										<input
											type="text"
											class="hcc-nav-input hcc-top-nav-name"
											data-idx="<?php echo esc_attr( $idx ); ?>"
											value="<?php echo esc_attr( $nav_item['name'] ); ?>"
											onchange="hccUpdateTopNav()"
										/>
									</td>
									<td>
										<code><?php echo esc_html( $nav_item['slug'] ); ?></code>
									</td>
									<td>
										<?php if ( ! empty( $nav_item['hasSubmenu'] ) ) : ?>
											<span style="color: #137333; font-weight: 600; font-size: 13px;">✓ Yes (<?php echo esc_html( $nav_item['deptKey'] ?? 'Department' ); ?>)</span>
										<?php else : ?>
											<span style="color: #8c8f94; font-size: 13px;">Direct Link</span>
										<?php endif; ?>
									</td>
									<td>
										<a href="<?php echo esc_url( rtrim( $live_url, '/' ) . $target_href ); ?>" target="_blank" class="hcc-link-btn">
											<span><?php echo esc_html( $target_href ); ?></span>
											<span>↗</span>
										</a>
									</td>
								</tr>
							<?php endforeach; ?>
						</tbody>
					</table>
				</div>

				<!-- TABS: DEPARTMENTS -->
				<?php foreach ( $tree as $dept_name => $dept_node ) :
					$dept_tab_id = sanitize_title( $dept_name );
					$dept_id     = $dept_node['id'];
					$is_dept_hidden = in_array( $dept_id, $hidden_ids, true );
					$dept_live_url  = rtrim( $live_url, '/' ) . $dept_node['url_path'];
				?>
					<div id="tab_<?php echo esc_attr( $dept_tab_id ); ?>" class="hcc-tab-content">
						<!-- Department Info Card -->
						<div class="hcc-dept-header-card">
							<div class="hcc-dept-title-group">
								<label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
									<input
										type="checkbox"
										name="hidden_terms_invert[]"
										class="hcc-term-chk"
										data-term-id="<?php echo esc_attr( $dept_id ); ?>"
										data-level="0"
										<?php checked( ! $is_dept_hidden ); ?>
										onchange="hccToggleTerm(this)"
									/>
									<h2><?php echo esc_html( $dept_node['display_name'] ); ?></h2>
								</label>
								<span class="hcc-count-badge"><?php echo count( $dept_node['l1_items'] ); ?> Subcategories</span>
								<span class="hcc-count-badge" style="background:#e6f4ea; color:#137333;"><?php echo (int) $dept_node['count']; ?> Products</span>
							</div>
							<div class="hcc-dept-actions">
								<a href="<?php echo esc_url( $dept_live_url ); ?>" target="_blank" class="hcc-link-btn" title="View department on live storefront">
									<span>👁️ View Live Department ↗</span>
								</a>
								<button type="button" class="hcc-toggle-all-btn" onclick="hccBulkCheckDept('tab_<?php echo esc_attr( $dept_tab_id ); ?>', true)">[✓] Select All</button>
								<button type="button" class="hcc-toggle-all-btn" onclick="hccBulkCheckDept('tab_<?php echo esc_attr( $dept_tab_id ); ?>', false)">[✗] Deselect All</button>
							</div>
						</div>

						<!-- Subcategory Cards (Level 1) -->
						<div class="hcc-l1-list">
							<?php foreach ( $dept_node['l1_items'] as $l1_node ) :
								$l1_id        = $l1_node['id'];
								$is_l1_hidden = in_array( $l1_id, $hidden_ids, true );
								$l1_live_url  = rtrim( $live_url, '/' ) . $l1_node['url_path'];
								$l2_count     = count( $l1_node['l2_items'] );
							?>
								<div class="hcc-l1-card <?php echo $is_l1_hidden ? 'is-hidden-card' : ''; ?>" id="l1_card_<?php echo esc_attr( $l1_id ); ?>">
									<div class="hcc-l1-header">
										<div class="hcc-l1-left">
											<input
												type="checkbox"
												class="hcc-term-chk"
												data-term-id="<?php echo esc_attr( $l1_id ); ?>"
												data-level="1"
												data-parent-dept="<?php echo esc_attr( $dept_id ); ?>"
												<?php checked( ! $is_l1_hidden ); ?>
												onchange="hccToggleTerm(this)"
											/>
											<span class="hcc-l1-title"><?php echo esc_html( $l1_node['display_name'] ); ?></span>
											<span class="hcc-count-badge"><?php echo (int) $l2_count; ?> Sub-groups</span>
											<span class="hcc-count-badge" style="background:#eef; color:#336;"><?php echo (int) $l1_node['count']; ?> Products</span>
										</div>
										<div style="display: flex; align-items: center; gap: 10px;">
											<a href="<?php echo esc_url( $l1_live_url ); ?>" target="_blank" class="hcc-link-btn" onclick="event.stopPropagation();">
												<span>👁️ View on Storefront ↗</span>
											</a>
										</div>
									</div>

									<div class="hcc-l1-body">
										<?php if ( empty( $l1_node['l2_items'] ) ) : ?>
											<p style="margin:0; color:#8c8f94; font-size:13px; font-style:italic;">No sub-subcategories found under this category in WooCommerce.</p>
										<?php else : ?>
											<?php foreach ( $l1_node['l2_items'] as $l2_node ) :
												$l2_id        = $l2_node['id'];
												$is_l2_hidden = in_array( $l2_id, $hidden_ids, true );
												$l2_live_url  = rtrim( $live_url, '/' ) . $l2_node['url_path'];
												$l3_count     = count( $l2_node['l3_items'] );
											?>
												<div class="hcc-l2-group">
													<div class="hcc-l2-header">
														<div class="hcc-l2-title">
															<input
																type="checkbox"
																class="hcc-term-chk"
																data-term-id="<?php echo esc_attr( $l2_id ); ?>"
																data-level="2"
																data-parent-l1="<?php echo esc_attr( $l1_id ); ?>"
																<?php checked( ! $is_l2_hidden ); ?>
																onchange="hccToggleTerm(this)"
															/>
															<strong><?php echo esc_html( $l2_node['display_name'] ); ?></strong>
															<span class="hcc-count-badge"><?php echo (int) $l3_count; ?> Items</span>
															<span class="hcc-count-badge" style="background:#f4f4f4;"><?php echo (int) $l2_node['count']; ?> Products</span>
														</div>
														<a href="<?php echo esc_url( $l2_live_url ); ?>" target="_blank" class="hcc-link-btn">
															<span>👁️ View on Storefront ↗</span>
														</a>
													</div>

													<?php if ( ! empty( $l2_node['l3_items'] ) ) : ?>
														<div class="hcc-l3-chips">
															<?php foreach ( $l2_node['l3_items'] as $l3_node ) :
																$l3_id        = $l3_node['id'];
																$is_l3_hidden = in_array( $l3_id, $hidden_ids, true );
																$l3_live_url  = rtrim( $live_url, '/' ) . $l3_node['url_path'];
															?>
																<label class="hcc-chip <?php echo $is_l3_hidden ? 'chip-hidden' : ''; ?>" title="Category ID: <?php echo esc_attr( $l3_id ); ?>">
																	<input
																		type="checkbox"
																		class="hcc-term-chk"
																		data-term-id="<?php echo esc_attr( $l3_id ); ?>"
																		data-level="3"
																		data-parent-l2="<?php echo esc_attr( $l2_id ); ?>"
																		<?php checked( ! $is_l3_hidden ); ?>
																		onchange="hccToggleTerm(this)"
																	/>
																	<span><?php echo esc_html( $l3_node['display_name'] ); ?></span>
																	<a href="<?php echo esc_url( $l3_live_url ); ?>" target="_blank" class="hcc-chip-link" onclick="event.stopPropagation();" title="View <?php echo esc_attr( $l3_node['display_name'] ); ?> on live storefront">↗</a>
																</label>
															<?php endforeach; ?>
														</div>
													<?php endif; ?>
												</div>
											<?php endforeach; ?>
										<?php endif; ?>
									</div>
								</div>
							<?php endforeach; ?>
						</div>
					</div>
				<?php endforeach; ?>

				<!-- Hidden inputs container for unchecked/hidden terms -->
				<div id="hcc_hidden_terms_container">
					<?php foreach ( $hidden_ids as $hid ) : ?>
						<input type="hidden" name="hidden_terms[]" value="<?php echo (int) $hid; ?>" id="hidden_input_<?php echo (int) $hid; ?>">
					<?php endforeach; ?>
				</div>
			</form>
		</div>

		<script>
			function hccSwitchTab(tabId, btn) {
				document.querySelectorAll('.hcc-tab-btn').forEach(function(b) { b.classList.remove('active'); });
				document.querySelectorAll('.hcc-tab-content').forEach(function(c) { c.classList.remove('active'); });
				
				btn.classList.add('active');
				var target = document.getElementById('tab_' + tabId);
				if (target) {
					target.classList.add('active');
				}
			}

			function hccToggleTerm(chk) {
				var termId = chk.getAttribute('data-term-id');
				var isChecked = chk.checked;
				var container = document.getElementById('hcc_hidden_terms_container');
				var existing = document.getElementById('hidden_input_' + termId);

				if (!isChecked) {
					// Add to hidden
					if (!existing) {
						var inp = document.createElement('input');
						inp.type = 'hidden';
						inp.name = 'hidden_terms[]';
						inp.value = termId;
						inp.id = 'hidden_input_' + termId;
						container.appendChild(inp);
					}
					// Visual style
					var chip = chk.closest('.hcc-chip');
					if (chip) chip.classList.add('chip-hidden');
					var card = chk.closest('.hcc-l1-card');
					if (card && chk.getAttribute('data-level') === '1') card.classList.add('is-hidden-card');
				} else {
					// Remove from hidden
					if (existing) {
						existing.remove();
					}
					var chip = chk.closest('.hcc-chip');
					if (chip) chip.classList.remove('chip-hidden');
					var card = chk.closest('.hcc-l1-card');
					if (card && chk.getAttribute('data-level') === '1') card.classList.remove('is-hidden-card');
				}
			}

			function hccBulkCheckDept(tabId, check) {
				var tab = document.getElementById(tabId);
				if (!tab) return;
				var chks = tab.querySelectorAll('.hcc-term-chk');
				chks.forEach(function(c) {
					c.checked = check;
					hccToggleTerm(c);
				});
			}

			function hccUpdateTopNav() {
				var table = document.getElementById('hcc_top_nav_table');
				var rows = table.querySelectorAll('tr[data-nav-idx]');
				var topNavData = [];

				rows.forEach(function(r) {
					var idx = parseInt(r.getAttribute('data-nav-idx'), 10);
					var visChk = r.querySelector('.hcc-top-nav-vis');
					var nameInp = r.querySelector('.hcc-top-nav-name');
					var orig = window.HCC_TOP_NAV_INITIAL ? window.HCC_TOP_NAV_INITIAL[idx] : {};

					topNavData.push({
						id: orig.id || ('nav_' + idx),
						name: nameInp ? nameInp.value : orig.name,
						slug: orig.slug || '',
						href: orig.href || ('/' + orig.slug),
						hasSubmenu: orig.hasSubmenu !== false,
						deptKey: orig.deptKey || '',
						hidden: visChk ? !visChk.checked : false
					});
				});

				document.getElementById('hcc_top_nav_json').value = JSON.stringify(topNavData);
			}

			window.HCC_TOP_NAV_INITIAL = <?php echo wp_json_encode( $top_nav ); ?>;

			function hccFilterCategories(keyword) {
				keyword = (keyword || '').toLowerCase().trim();
				var cards = document.querySelectorAll('.hcc-l1-card');
				var chips = document.querySelectorAll('.hcc-chip');
				var countEl = document.getElementById('hcc_search_match_count');
				var matchCount = 0;

				if (!keyword) {
					cards.forEach(function(c) { c.style.display = ''; });
					chips.forEach(function(ch) { ch.style.display = ''; });
					if (countEl) countEl.innerText = '';
					return;
				}

				cards.forEach(function(card) {
					var text = card.innerText.toLowerCase();
					if (text.indexOf(keyword) !== -1) {
						card.style.display = '';
						matchCount++;
					} else {
						card.style.display = 'none';
					}
				});

				if (countEl) {
					countEl.innerText = matchCount + ' category groups found';
				}
			}
		</script>
		<?php
	}
}
