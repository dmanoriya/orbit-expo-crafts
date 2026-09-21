<?php

namespace HeadlessCommerceCore\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class MegaMenuManager {

	const OPTION_KEY    = 'hcc_mega_menu_config';
	const TRANSIENT_KEY = 'hcc_mega_menu_cached_data';

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
	 * Default top navigation categories
	 */
	public static function get_default_nav_items() {
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
	 * Build default structured taxonomy from master JSON
	 */
	public static function get_default_departments_data() {
		$json_file = HCC_PLUGIN_DIR . 'master_category_taxonomy.json';
		$raw_tax = array();

		if ( file_exists( $json_file ) ) {
			$raw_tax = json_decode( file_get_contents( $json_file ), true );
		}

		if ( ! is_array( $raw_tax ) || empty( $raw_tax ) ) {
			return array();
		}

		$departments = array();

		foreach ( $raw_tax as $dept_name => $l1_map ) {
			$departments[ $dept_name ] = array(
				'hidden'     => false,
				'categories' => array(),
			);

			if ( ! is_array( $l1_map ) ) continue;

			foreach ( $l1_map as $l1_name => $l2_map ) {
				$l1_data = array(
					'name'      => $l1_name,
					'hidden'    => false,
					'subgroups' => array(),
				);

				if ( is_array( $l2_map ) ) {
					foreach ( $l2_map as $l2_name => $l3_items ) {
						$clean_l3 = array();
						if ( is_array( $l3_items ) ) {
							foreach ( $l3_items as $l3 ) {
								$item_name = is_array( $l3 ) ? ( $l3['name'] ?? '' ) : (string) $l3;
								if ( $item_name ) {
									$clean_l3[] = array(
										'name'       => $item_name,
										'hidden'     => false,
										'custom_url' => '',
									);
								}
							}
						}

						$l1_data['subgroups'][ $l2_name ] = array(
							'name'   => $l2_name,
							'hidden' => false,
							'items'  => $clean_l3,
						);
					}
				}

				$departments[ $dept_name ]['categories'][ $l1_name ] = $l1_data;
			}
		}

		return $departments;
	}

	/**
	 * Retrieve current full configuration (admin editing mode)
	 */
	public static function get_menu_config() {
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

		$config = self::get_menu_config();
		$raw_nav = $config['nav_items'] ?? self::get_default_nav_items();
		$raw_depts = $config['departments'] ?? self::get_default_departments_data();

		// 1. Process active Nav Items
		$active_nav = array();
		foreach ( $raw_nav as $item ) {
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

		// 2. Process active Department Taxonomy
		$active_tax = array();

		foreach ( $raw_depts as $dept_name => $dept_info ) {
			if ( ! empty( $dept_info['hidden'] ) ) {
				continue;
			}

			$dept_tree = array();
			$cats = $dept_info['categories'] ?? array();

			foreach ( $cats as $l1_key => $l1_data ) {
				if ( ! empty( $l1_data['hidden'] ) ) {
					continue;
				}

				$l1_display_name = ! empty( $l1_data['name'] ) ? $l1_data['name'] : $l1_key;
				$dept_tree[ $l1_display_name ] = array();

				$subgroups = $l1_data['subgroups'] ?? array();
				foreach ( $subgroups as $l2_key => $l2_data ) {
					if ( ! empty( $l2_data['hidden'] ) ) {
						continue;
					}

					$l2_display_name = ! empty( $l2_data['name'] ) ? $l2_data['name'] : $l2_key;
					$items_list = array();

					$items = $l2_data['items'] ?? array();
					foreach ( $items as $it ) {
						if ( ! empty( $it['hidden'] ) ) {
							continue;
						}
						$it_name = is_array( $it ) ? ( $it['name'] ?? '' ) : (string) $it;
						if ( $it_name ) {
							$items_list[] = $it_name;
						}
					}

					$dept_tree[ $l1_display_name ][ $l2_display_name ] = $items_list;
				}
			}

			$active_tax[ $dept_name ] = $dept_tree;
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

		$url = add_query_arg( array(
			'secret' => $secret,
			'tag'    => 'mega-menu',
			'path'   => '/',
		), $frontend_url . '/api/revalidate' );

		wp_remote_get( $url, array(
			'timeout'   => 3,
			'sslverify' => false,
		) );
	}

	/**
	 * Render the Admin Mega Menu Builder Page
	 */
	public static function render_admin_page() {
		$live_url = BusinessPagesManager::get_frontend_url();

		// Handle Reset
		if ( isset( $_POST['hcc_reset_mega_menu'] ) && check_admin_referer( 'hcc_mega_menu_action', 'hcc_mega_menu_nonce' ) ) {
			$default_config = array(
				'nav_items'   => self::get_default_nav_items(),
				'departments' => self::get_default_departments_data(),
			);
			update_option( self::OPTION_KEY, $default_config );
			self::trigger_nextjs_revalidation();
			echo '<div class="notice notice-success is-dismissible"><p><strong>Mega Menu reset to master defaults successfully! Next.js cache revalidated.</strong></p></div>';
		}

		// Handle Save
		if ( isset( $_POST['hcc_save_mega_menu'] ) && check_admin_referer( 'hcc_mega_menu_action', 'hcc_mega_menu_nonce' ) ) {
			$posted_config_raw = isset( $_POST['mega_menu_config_json'] ) ? wp_unslash( $_POST['mega_menu_config_json'] ) : '';
			$decoded = json_decode( $posted_config_raw, true );

			if ( is_array( $decoded ) && ! empty( $decoded['departments'] ) ) {
				update_option( self::OPTION_KEY, $decoded );
				self::trigger_nextjs_revalidation();
				echo '<div class="notice notice-success is-dismissible"><p><strong>Mega Menu configuration saved and published successfully! Live storefront cache purged.</strong> <a href="' . esc_url( $live_url ) . '" target="_blank" style="margin-left:8px; font-weight:600; color:#0E5C63;">👁️ View Live Storefront ↗</a></p></div>';
			} else {
				echo '<div class="notice notice-error is-dismissible"><p>Failed to save: invalid menu data received.</p></div>';
			}
		}

		$config = self::get_menu_config();
		$nav_items = $config['nav_items'] ?? self::get_default_nav_items();
		$departments = $config['departments'] ?? self::get_default_departments_data();

		$dept_keys = array_keys( $departments );
		$active_dept = isset( $_GET['dept'] ) ? sanitize_text_field( $_GET['dept'] ) : ( $dept_keys[0] ?? 'Furniture' );

		if ( ! in_array( $active_dept, $dept_keys, true ) && $active_dept !== '_top_nav' ) {
			$active_dept = $dept_keys[0] ?? '_top_nav';
		}

		?>
		<div class="wrap" style="max-width:1380px;">
			<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; margin-top:10px;">
				<div>
					<h1 style="font-size:24px; font-weight:700; color:#1d2327; margin:0 0 4px 0;">
						🧭 Mega Menu &amp; Storefront Taxonomy Builder
					</h1>
					<p style="color:#50575e; font-size:13px; margin:0;">
						Full control over your storefront mega menu: rename categories, toggle hide/show visibility, and reorder navigation items with instant zero-delay Next.js sync.
					</p>
				</div>
				<div style="display:flex; gap:10px;">
					<a href="<?php echo esc_url( $live_url ); ?>" target="_blank" class="button" style="display:flex; align-items:center; gap:4px; font-weight:600;">
						👁️ View Live Storefront ↗
					</a>
				</div>
			</div>

			<!-- TOP TABS: TOP BAR NAV & DEPARTMENTS -->
			<div style="margin-bottom:20px; border-bottom:2px solid #0E5C63; display:flex; flex-wrap:wrap; gap:4px; background:#fff; padding:6px 10px 0 10px; border-radius:6px 6px 0 0; border:1px solid #ccd0d4; border-bottom:2px solid #0E5C63;">
				<a href="?page=hcc-mega-menu&dept=_top_nav" class="nav-tab <?php echo ( $active_dept === '_top_nav' ) ? 'nav-tab-active' : ''; ?>" style="font-weight:700; font-size:13px; display:flex; align-items:center; gap:6px;">
					🏷️ Header Top Bar Links
				</a>
				<?php foreach ( $dept_keys as $dk ) : 
					$is_dept_hidden = ! empty( $departments[ $dk ]['hidden'] );
				?>
					<a href="?page=hcc-mega-menu&dept=<?php echo esc_attr( urlencode( $dk ) ); ?>" class="nav-tab <?php echo ( $active_dept === $dk ) ? 'nav-tab-active' : ''; ?>" style="font-size:13px; font-weight:600; display:flex; align-items:center; gap:6px; <?php echo $is_dept_hidden ? 'opacity:0.6;' : ''; ?>">
						<?php echo esc_html( $dk ); ?>
						<?php if ( $is_dept_hidden ) : ?>
							<span style="font-size:10px; background:#e0e0e0; color:#666; padding:1px 5px; border-radius:10px;">Hidden</span>
						<?php endif; ?>
					</a>
				<?php endforeach; ?>
			</div>

			<form method="post" action="" id="hcc_mega_menu_form">
				<?php wp_nonce_field( 'hcc_mega_menu_action', 'hcc_mega_menu_nonce' ); ?>
				<input type="hidden" name="mega_menu_config_json" id="mega_menu_config_json" value="" />

				<!-- TAB 1: HEADER TOP BAR NAV ITEMS -->
				<?php if ( $active_dept === '_top_nav' ) : ?>
					<div class="postbox" style="background:#fff; border:1px solid #ccd0d4; border-radius:8px; padding:20px 24px; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
						<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
							<div>
								<h2 style="font-size:17px; font-weight:700; color:#0E5C63; margin:0;">
									🏷️ Top Navigation Bar Items (Header Menu)
								</h2>
								<p class="description" style="margin:4px 0 0 0;">
									These are the items visible across the desktop header bar. You can rename labels, toggle visibility, and configure custom destination links.
								</p>
							</div>
							<button type="button" class="button button-secondary" id="btn_add_top_nav" style="font-weight:600;">
								➕ Add Top Nav Item
							</button>
						</div>

						<table class="widefat striped" style="border:1px solid #e2e4e7; border-radius:4px;">
							<thead>
								<tr>
									<th style="width:30px; text-align:center;">#</th>
									<th style="width:220px;">Display Label (Storefront)</th>
									<th style="width:160px;">URL Slug / Path</th>
									<th style="width:180px;">Dropdown Target (Department)</th>
									<th style="width:120px; text-align:center;">Submenu Panel</th>
									<th style="width:110px; text-align:center;">Visibility</th>
									<th style="width:80px; text-align:center;">Actions</th>
								</tr>
							</thead>
							<tbody id="top_nav_table_body">
								<!-- Rendered dynamically by JS -->
							</tbody>
						</table>
					</div>

				<!-- TAB 2: SPECIFIC DEPARTMENT TAXONOMY BUILDER -->
				<?php else : 
					$dept_data = $departments[ $active_dept ] ?? array( 'hidden' => false, 'categories' => array() );
				?>
					<div class="postbox" style="background:#fff; border:1px solid #ccd0d4; border-radius:8px; padding:20px 24px; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
						<!-- Department Header Bar -->
						<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:16px; margin-bottom:20px;">
							<div style="display:flex; align-items:center; gap:14px;">
								<h2 style="font-size:18px; font-weight:700; color:#0E5C63; margin:0;">
									🏛️ <?php echo esc_html( $active_dept ); ?> Mega Menu Columns &amp; Items
								</h2>
								<label style="display:flex; align-items:center; gap:6px; background:#f9f9f9; padding:5px 12px; border-radius:20px; border:1px solid #ddd; font-size:13px; font-weight:600; cursor:pointer;">
									<input type="checkbox" id="dept_hidden_checkbox" <?php checked( ! empty( $dept_data['hidden'] ) ); ?> />
									<span>Hide Entire "<?php echo esc_html( $active_dept ); ?>" from Mega Menu</span>
								</label>
							</div>
							<div style="display:flex; gap:10px;">
								<input type="text" id="taxonomy_search_input" placeholder="🔍 Search category or item..." style="width:240px; border-radius:4px; font-size:13px;" />
								<button type="button" class="button button-primary" id="btn_add_l1" style="background:#0E5C63; border-color:#0E5C63; font-weight:600;">
									➕ Add New Column (L1 Category)
								</button>
							</div>
						</div>

						<!-- Dynamic Accordion Grid of Columns (L1 -> L2 -> L3) -->
						<div id="dept_columns_container" style="display:flex; flex-direction:column; gap:20px;">
							<!-- Rendered dynamically by JS -->
						</div>
					</div>
				<?php endif; ?>

				<!-- STICKY ACTION BAR -->
				<div style="position:sticky; bottom:20px; z-index:100; background:#fff; padding:16px 24px; border:1px solid #c3c4c7; border-radius:8px; box-shadow:0 4px 16px rgba(0,0,0,0.12); display:flex; justify-content:space-between; align-items:center; margin-top:24px;">
					<div style="font-size:13px; color:#50575e; display:flex; align-items:center; gap:8px;">
						<span>Active Section: <strong><?php echo ( $active_dept === '_top_nav' ) ? 'Top Bar Header Links' : esc_html( $active_dept ); ?></strong></span>
						<span style="color:#aaa;">•</span>
						<span style="color:#666;">Changes apply immediately to Next.js upon saving.</span>
					</div>
					<div style="display:flex; align-items:center; gap:10px;">
						<button type="submit" name="hcc_reset_mega_menu" class="button button-link-delete" onclick="return confirm('Reset all mega menu customizations back to original master taxonomy defaults? This cannot be undone.');" style="font-size:12px; margin-right:6px;">
							↺ Reset to Master Defaults
						</button>
						<a href="<?php echo esc_url( $live_url ); ?>" target="_blank" class="button" style="font-weight:600;">
							👁️ View Live Storefront ↗
						</a>
						<button type="submit" name="hcc_save_mega_menu" id="btn_submit_mega_menu" class="button button-primary button-large" style="background:#0E5C63; border-color:#0E5C63; font-weight:700; padding:4px 22px; font-size:14px;">
							💾 Save &amp; Publish Mega Menu
						</button>
					</div>
				</div>
			</form>
		</div>

		<script>
		document.addEventListener('DOMContentLoaded', function() {
			var fullConfig = <?php echo wp_json_encode( $config ); ?>;
			var activeDept = <?php echo wp_json_encode( $active_dept ); ?>;
			var hiddenInput = document.getElementById('mega_menu_config_json');

			function syncHiddenField() {
				hiddenInput.value = JSON.stringify(fullConfig);
			}

			// ==========================================
			// TAB 1: TOP BAR NAV ITEMS RENDERER
			// ==========================================
			if (activeDept === '_top_nav') {
				var tbody = document.getElementById('top_nav_table_body');
				var deptKeys = <?php echo wp_json_encode( $dept_keys ); ?>;

				function renderTopNavTable() {
					tbody.innerHTML = '';
					var navItems = fullConfig.nav_items || [];

					navItems.forEach(function(item, idx) {
						var tr = document.createElement('tr');

						var deptOptions = '<option value="">-- None (Direct Link) --</option>';
						deptKeys.forEach(function(dk) {
							var sel = (item.deptKey === dk) ? 'selected' : '';
							deptOptions += '<option value="' + dk + '" ' + sel + '>' + dk + '</option>';
						});

						tr.innerHTML = 
							'<td style="text-align:center; vertical-align:middle; color:#888; font-weight:600;">' + (idx + 1) + '</td>' +
							'<td><input type="text" class="regular-text nav-name-input" data-idx="' + idx + '" value="' + (item.name || '') + '" style="width:100%; font-weight:600;" required /></td>' +
							'<td><input type="text" class="regular-text nav-slug-input" data-idx="' + idx + '" value="' + (item.slug || '') + '" style="width:100%;" required /></td>' +
							'<td><select class="nav-dept-select" data-idx="' + idx + '" style="width:100%;">' + deptOptions + '</select></td>' +
							'<td style="text-align:center; vertical-align:middle;">' +
								'<input type="checkbox" class="nav-submenu-toggle" data-idx="' + idx + '" ' + (item.hasSubmenu ? 'checked' : '') + ' />' +
							'</td>' +
							'<td style="text-align:center; vertical-align:middle;">' +
								'<label style="display:inline-flex; align-items:center; gap:4px; font-size:12px; cursor:pointer;">' +
									'<input type="checkbox" class="nav-hidden-toggle" data-idx="' + idx + '" ' + (item.hidden ? 'checked' : '') + ' />' +
									'<span style="' + (item.hidden ? 'color:#d63638; font-weight:600;' : 'color:#00a32a;') + '">' + (item.hidden ? 'Hidden' : 'Visible') + '</span>' +
								'</label>' +
							'</td>' +
							'<td style="text-align:center; vertical-align:middle;">' +
								'<button type="button" class="button-link-delete btn-del-nav" data-idx="' + idx + '" title="Remove item" style="color:#d63638; cursor:pointer;">✕</button>' +
							'</td>';

						tbody.appendChild(tr);
					});

					attachTopNavEvents();
					syncHiddenField();
				}

				function attachTopNavEvents() {
					tbody.querySelectorAll('.nav-name-input').forEach(function(input) {
						input.addEventListener('input', function() {
							var idx = parseInt(this.getAttribute('data-idx'), 10);
							fullConfig.nav_items[idx].name = this.value;
							syncHiddenField();
						});
					});

					tbody.querySelectorAll('.nav-slug-input').forEach(function(input) {
						input.addEventListener('input', function() {
							var idx = parseInt(this.getAttribute('data-idx'), 10);
							fullConfig.nav_items[idx].slug = this.value;
							fullConfig.nav_items[idx].href = '/' + this.value.replace(/^\/+/, '');
							syncHiddenField();
						});
					});

					tbody.querySelectorAll('.nav-dept-select').forEach(function(sel) {
						sel.addEventListener('change', function() {
							var idx = parseInt(this.getAttribute('data-idx'), 10);
							fullConfig.nav_items[idx].deptKey = this.value;
							fullConfig.nav_items[idx].hasSubmenu = Boolean(this.value);
							renderTopNavTable();
						});
					});

					tbody.querySelectorAll('.nav-submenu-toggle').forEach(function(chk) {
						chk.addEventListener('change', function() {
							var idx = parseInt(this.getAttribute('data-idx'), 10);
							fullConfig.nav_items[idx].hasSubmenu = this.checked;
							syncHiddenField();
						});
					});

					tbody.querySelectorAll('.nav-hidden-toggle').forEach(function(chk) {
						chk.addEventListener('change', function() {
							var idx = parseInt(this.getAttribute('data-idx'), 10);
							fullConfig.nav_items[idx].hidden = this.checked;
							renderTopNavTable();
						});
					});

					tbody.querySelectorAll('.btn-del-nav').forEach(function(btn) {
						btn.addEventListener('click', function() {
							var idx = parseInt(this.getAttribute('data-idx'), 10);
							if (confirm('Delete top nav item "' + fullConfig.nav_items[idx].name + '"?')) {
								fullConfig.nav_items.splice(idx, 1);
								renderTopNavTable();
							}
						});
					});
				}

				document.getElementById('btn_add_top_nav').addEventListener('click', function() {
					var title = prompt('Enter new navigation item title:');
					if (!title) return;
					var slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
					fullConfig.nav_items.push({
						id: 'nav_' + Date.now(),
						name: title,
						slug: slug,
						href: '/' + slug,
						hasSubmenu: false,
						deptKey: '',
						hidden: false
					});
					renderTopNavTable();
				});

				renderTopNavTable();
			}

			// ==========================================
			// TAB 2: DEPARTMENT TREE BUILDER
			// ==========================================
			if (activeDept !== '_top_nav' && fullConfig.departments[activeDept]) {
				var container = document.getElementById('dept_columns_container');
				var deptObj = fullConfig.departments[activeDept];
				var deptCheckbox = document.getElementById('dept_hidden_checkbox');

				deptCheckbox.addEventListener('change', function() {
					deptObj.hidden = this.checked;
					syncHiddenField();
				});

				function renderDepartmentColumns(filterText) {
					container.innerHTML = '';
					var filter = (filterText || '').toLowerCase().trim();
					var cats = deptObj.categories || {};
					var l1Keys = Object.keys(cats);

					if (l1Keys.length === 0) {
						container.innerHTML = '<div style="padding:30px; text-align:center; background:#f9f9f9; border:2px dashed #ddd; border-radius:6px; color:#888;">No columns created for ' + activeDept + '. Click <strong>➕ Add New Column</strong> above to start.</div>';
						syncHiddenField();
						return;
					}

					l1Keys.forEach(function(l1Key) {
						var l1Data = cats[l1Key];
						var l1Hidden = Boolean(l1Data.hidden);
						var l1Title = l1Data.name || l1Key;

						var subgroups = l1Data.subgroups || {};
						var l2Keys = Object.keys(subgroups);

						// Filter matching
						if (filter) {
							var matchesL1 = l1Title.toLowerCase().indexOf(filter) !== -1;
							var matchesSub = false;
							l2Keys.forEach(function(k) {
								if (k.toLowerCase().indexOf(filter) !== -1) matchesSub = true;
								var items = subgroups[k].items || [];
								items.forEach(function(it) {
									var itName = (typeof it === 'string' ? it : (it.name || '')).toLowerCase();
									if (itName.indexOf(filter) !== -1) matchesSub = true;
								});
							});
							if (!matchesL1 && !matchesSub) return;
						}

						var colCard = document.createElement('div');
						colCard.className = 'postbox';
						colCard.style.cssText = 'border:1px solid #c3c4c7; border-radius:6px; margin:0; padding:16px 20px; background:' + (l1Hidden ? '#fafafa' : '#fff') + ';';

						// L1 Header
						var headerHtml = 
							'<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #0E5C63; padding-bottom:12px; margin-bottom:16px;">' +
								'<div style="display:flex; align-items:center; gap:12px; flex:1;">' +
									'<span style="background:#0E5C63; color:#fff; font-size:11px; font-weight:700; padding:3px 8px; border-radius:4px; text-transform:uppercase; letter-spacing:0.05em;">Column (L1)</span>' +
									'<input type="text" class="l1-name-input" data-l1="' + escAttr(l1Key) + '" value="' + escAttr(l1Title) + '" style="font-size:16px; font-weight:700; color:#1d2327; width:280px; padding:4px 8px; border-radius:4px;" />' +
								'</div>' +
								'<div style="display:flex; align-items:center; gap:14px;">' +
									'<label style="display:flex; align-items:center; gap:5px; font-size:13px; font-weight:600; cursor:pointer;">' +
										'<input type="checkbox" class="l1-hidden-toggle" data-l1="' + escAttr(l1Key) + '" ' + (l1Hidden ? 'checked' : '') + ' />' +
										'<span style="' + (l1Hidden ? 'color:#d63638;' : 'color:#00a32a;') + '">' + (l1Hidden ? 'Hidden from menu' : 'Visible') + '</span>' +
									'</label>' +
									'<button type="button" class="button btn-add-l2" data-l1="' + escAttr(l1Key) + '" style="font-weight:600;">' +
										'➕ Add Sub-group' +
									'</button>' +
									'<button type="button" class="button-link-delete btn-del-l1" data-l1="' + escAttr(l1Key) + '" title="Delete this whole column" style="color:#d63638; cursor:pointer;">' +
										'🗑️ Delete Column' +
									'</button>' +
								'</div>' +
							'</div>';

						// Subgroups Grid (L2 -> L3)
						var subgroupsHtml = '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:16px;">';

						l2Keys.forEach(function(l2Key) {
							var l2Data = subgroups[l2Key];
							var l2Hidden = Boolean(l2Data.hidden);
							var l2Title = l2Data.name || l2Key;
							var items = l2Data.items || [];

							subgroupsHtml += 
								'<div style="background:#f9f9f9; border:1px solid #e2e4e7; border-radius:6px; padding:12px 14px; display:flex; flex-direction:column; gap:10px;' + (l2Hidden ? 'opacity:0.6;' : '') + '">' +
									'<div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">' +
										'<div style="display:flex; align-items:center; gap:6px; flex:1;">' +
											'<span style="font-size:10px; font-weight:700; color:#7A756E; text-transform:uppercase;">Sub-group</span>' +
											'<input type="text" class="l2-name-input" data-l1="' + escAttr(l1Key) + '" data-l2="' + escAttr(l2Key) + '" value="' + escAttr(l2Title) + '" style="font-weight:700; font-size:13px; width:160px; padding:2px 6px;" />' +
										'</div>' +
										'<div style="display:flex; align-items:center; gap:8px;">' +
											'<label style="display:flex; align-items:center; gap:3px; font-size:11px; cursor:pointer;" title="Toggle visibility">' +
												'<input type="checkbox" class="l2-hidden-toggle" data-l1="' + escAttr(l1Key) + '" data-l2="' + escAttr(l2Key) + '" ' + (l2Hidden ? 'checked' : '') + ' />' +
												'<span>' + (l2Hidden ? '🚫' : '👁️') + '</span>' +
											'</label>' +
											'<button type="button" class="button-link-delete btn-del-l2" data-l1="' + escAttr(l1Key) + '" data-l2="' + escAttr(l2Key) + '" title="Delete Sub-group" style="color:#d63638; font-size:12px; cursor:pointer;">✕</button>' +
										'</div>' +
									'</div>' +
									'<div style="display:flex; flex-wrap:wrap; gap:5px; max-height:220px; overflow-y:auto; padding:6px; background:#fff; border:1px solid #eee; border-radius:4px;">';

							if (items.length === 0) {
								subgroupsHtml += '<span style="color:#aaa; font-size:11px; font-style:italic;">No items yet. Click ➕ below.</span>';
							} else {
								items.forEach(function(it, itIdx) {
									var itName = isArrayOrObj(it) ? (it.name || '') : String(it);
									var itHidden = isArrayOrObj(it) ? Boolean(it.hidden) : false;

									subgroupsHtml += 
										'<span class="l3-pill" style="display:inline-flex; align-items:center; gap:4px; background:' + (itHidden ? '#f0f0f0' : '#E8F3F4') + '; border:1px solid ' + (itHidden ? '#ddd' : '#C1E0E3') + '; padding:2px 8px; border-radius:14px; font-size:11px; font-weight:500; ' + (itHidden ? 'text-decoration:line-through; opacity:0.6;' : '') + '">' +
											'<span class="l3-name-editable" data-l1="' + escAttr(l1Key) + '" data-l2="' + escAttr(l2Key) + '" data-idx="' + itIdx + '" title="Click to rename" style="cursor:pointer;">' + escHtml(itName) + '</span>' +
											'<span class="btn-toggle-l3" data-l1="' + escAttr(l1Key) + '" data-l2="' + escAttr(l2Key) + '" data-idx="' + itIdx + '" title="' + (itHidden ? 'Click to show' : 'Click to hide') + '" style="cursor:pointer; font-size:10px; margin-left:2px;">' + (itHidden ? '🚫' : '👁️') + '</span>' +
											'<span class="btn-del-l3" data-l1="' + escAttr(l1Key) + '" data-l2="' + escAttr(l2Key) + '" data-idx="' + itIdx + '" title="Remove item" style="cursor:pointer; color:#d63638; font-weight:700; font-size:10px; margin-left:2px;">✕</span>' +
										'</span>';
								});
							}

							subgroupsHtml += 
									'</div>' +
									'<div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">' +
										'<button type="button" class="button button-small btn-add-l3" data-l1="' + escAttr(l1Key) + '" data-l2="' + escAttr(l2Key) + '" style="font-size:11px; font-weight:600;">' +
											'➕ Add Item' +
										'</button>' +
										'<span style="font-size:11px; color:#888;">' + items.length + ' items</span>' +
									'</div>' +
								'</div>';
						});

						subgroupsHtml += '</div>';

						colCard.innerHTML = headerHtml + subgroupsHtml;
						container.appendChild(colCard);
					});

					attachDeptTreeEvents();
					syncHiddenField();
				}

				function attachDeptTreeEvents() {
					// L1 Rename
					container.querySelectorAll('.l1-name-input').forEach(function(input) {
						input.addEventListener('change', function() {
							var l1 = this.getAttribute('data-l1');
							deptObj.categories[l1].name = this.value;
							syncHiddenField();
						});
					});

					// L1 Hidden toggle
					container.querySelectorAll('.l1-hidden-toggle').forEach(function(chk) {
						chk.addEventListener('change', function() {
							var l1 = this.getAttribute('data-l1');
							deptObj.categories[l1].hidden = this.checked;
							renderDepartmentColumns(document.getElementById('taxonomy_search_input').value);
						});
					});

					// L1 Delete
					container.querySelectorAll('.btn-del-l1').forEach(function(btn) {
						btn.addEventListener('click', function() {
							var l1 = this.getAttribute('data-l1');
							if (confirm('Delete column "' + l1 + '" and all its sub-groups?')) {
								delete deptObj.categories[l1];
								renderDepartmentColumns(document.getElementById('taxonomy_search_input').value);
							}
						});
					});

					// Add L2
					container.querySelectorAll('.btn-add-l2').forEach(function(btn) {
						btn.addEventListener('click', function() {
							var l1 = this.getAttribute('data-l1');
							var subName = prompt('Enter sub-group name:');
							if (!subName) return;
							if (!deptObj.categories[l1].subgroups) deptObj.categories[l1].subgroups = {};
							deptObj.categories[l1].subgroups[subName] = {
								name: subName,
								hidden: false,
								items: []
							};
							renderDepartmentColumns(document.getElementById('taxonomy_search_input').value);
						});
					});

					// L2 Rename
					container.querySelectorAll('.l2-name-input').forEach(function(input) {
						input.addEventListener('change', function() {
							var l1 = this.getAttribute('data-l1');
							var l2 = this.getAttribute('data-l2');
							deptObj.categories[l1].subgroups[l2].name = this.value;
							syncHiddenField();
						});
					});

					// L2 Hidden toggle
					container.querySelectorAll('.l2-hidden-toggle').forEach(function(chk) {
						chk.addEventListener('change', function() {
							var l1 = this.getAttribute('data-l1');
							var l2 = this.getAttribute('data-l2');
							deptObj.categories[l1].subgroups[l2].hidden = this.checked;
							renderDepartmentColumns(document.getElementById('taxonomy_search_input').value);
						});
					});

					// L2 Delete
					container.querySelectorAll('.btn-del-l2').forEach(function(btn) {
						btn.addEventListener('click', function() {
							var l1 = this.getAttribute('data-l1');
							var l2 = this.getAttribute('data-l2');
							if (confirm('Delete sub-group "' + l2 + '"?')) {
								delete deptObj.categories[l1].subgroups[l2];
								renderDepartmentColumns(document.getElementById('taxonomy_search_input').value);
							}
						});
					});

					// Add L3
					container.querySelectorAll('.btn-add-l3').forEach(function(btn) {
						btn.addEventListener('click', function() {
							var l1 = this.getAttribute('data-l1');
							var l2 = this.getAttribute('data-l2');
							var itemName = prompt('Enter item name to add under "' + l2 + '":');
							if (!itemName) return;
							if (!deptObj.categories[l1].subgroups[l2].items) deptObj.categories[l1].subgroups[l2].items = [];
							deptObj.categories[l1].subgroups[l2].items.push({
								name: itemName,
								hidden: false,
								custom_url: ''
							});
							renderDepartmentColumns(document.getElementById('taxonomy_search_input').value);
						});
					});

					// L3 Rename on click
					container.querySelectorAll('.l3-name-editable').forEach(function(el) {
						el.addEventListener('click', function() {
							var l1 = this.getAttribute('data-l1');
							var l2 = this.getAttribute('data-l2');
							var itIdx = parseInt(this.getAttribute('data-idx'), 10);
							var currentItem = deptObj.categories[l1].subgroups[l2].items[itIdx];
							var currentName = typeof currentItem === 'string' ? currentItem : currentItem.name;

							var newName = prompt('Rename item:', currentName);
							if (newName && newName !== currentName) {
								if (typeof currentItem === 'string') {
									deptObj.categories[l1].subgroups[l2].items[itIdx] = {
										name: newName,
										hidden: false,
										custom_url: ''
									};
								} else {
									currentItem.name = newName;
								}
								renderDepartmentColumns(document.getElementById('taxonomy_search_input').value);
							}
						});
					});

					// L3 Toggle visibility
					container.querySelectorAll('.btn-toggle-l3').forEach(function(el) {
						el.addEventListener('click', function() {
							var l1 = this.getAttribute('data-l1');
							var l2 = this.getAttribute('data-l2');
							var itIdx = parseInt(this.getAttribute('data-idx'), 10);
							var currentItem = deptObj.categories[l1].subgroups[l2].items[itIdx];

							if (typeof currentItem === 'string') {
								deptObj.categories[l1].subgroups[l2].items[itIdx] = {
									name: currentItem,
									hidden: true,
									custom_url: ''
								};
							} else {
								currentItem.hidden = !currentItem.hidden;
							}
							renderDepartmentColumns(document.getElementById('taxonomy_search_input').value);
						});
					});

					// L3 Delete
					container.querySelectorAll('.btn-del-l3').forEach(function(el) {
						el.addEventListener('click', function() {
							var l1 = this.getAttribute('data-l1');
							var l2 = this.getAttribute('data-l2');
							var itIdx = parseInt(this.getAttribute('data-idx'), 10);
							var currentItem = deptObj.categories[l1].subgroups[l2].items[itIdx];
							var itName = typeof currentItem === 'string' ? currentItem : currentItem.name;

							if (confirm('Remove "' + itName + '" from this menu?')) {
								deptObj.categories[l1].subgroups[l2].items.splice(itIdx, 1);
								renderDepartmentColumns(document.getElementById('taxonomy_search_input').value);
							}
						});
					});
				}

				// Add New L1 Column
				document.getElementById('btn_add_l1').addEventListener('click', function() {
					var colName = prompt('Enter new column (L1 Category) name:');
					if (!colName) return;
					if (!deptObj.categories) deptObj.categories = {};
					deptObj.categories[colName] = {
						name: colName,
						hidden: false,
						subgroups: {}
					};
					renderDepartmentColumns(document.getElementById('taxonomy_search_input').value);
				});

				// Instant Search Filter
				document.getElementById('taxonomy_search_input').addEventListener('input', function() {
					renderDepartmentColumns(this.value);
				});

				renderDepartmentColumns('');
			}

			// Helper utilities
			function escHtml(str) {
				return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
			}
			function escAttr(str) {
				return String(str || '').replace(/"/g, '&quot;');
			}
			function isArrayOrObj(val) {
				return typeof val === 'object' && val !== null;
			}

			// Before submit, ensure hidden input is fresh
			document.getElementById('hcc_mega_menu_form').addEventListener('submit', function() {
				syncHiddenField();
			});
		});
		</script>
		<?php
	}
}
