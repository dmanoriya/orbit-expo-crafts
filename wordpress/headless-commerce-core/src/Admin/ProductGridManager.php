<?php

namespace HeadlessCommerceCore\Admin;

use HeadlessCommerceCore\Cache\CacheManager;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Product Grid & Card Design Manager
 *
 * Provides full WordPress admin control over product card aspect ratios,
 * object-fit modes, thumbnail padding, background canvas colors, corner radius,
 * desktop/mobile grid columns, and granular element toggles.
 */
class ProductGridManager {

	const OPTION_KEY = 'hcc_product_grid_options';

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_admin_menu' ), 12 );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_admin_assets' ) );
	}

	public static function add_admin_menu() {
		add_submenu_page(
			'headless-commerce-core',
			__( 'Product Grid & Card Design', 'headless-commerce-core' ),
			__( 'Product Grid Design', 'headless-commerce-core' ),
			'manage_options',
			'hcc-product-grid-settings',
			array( __CLASS__, 'render_grid_manager_page' )
		);
	}

	public static function register_settings() {
		register_setting( 'hcc_product_grid_options_group', self::OPTION_KEY );
	}

	public static function enqueue_admin_assets( $hook ) {
		if ( false !== strpos( $hook, 'hcc-product-grid-settings' ) ) {
			wp_enqueue_style( 'wp-color-picker' );
			wp_enqueue_script( 'wp-color-picker' );
		}
	}

	/**
	 * Default Product Grid Configuration
	 */
	public static function get_default_grid_data() {
		return array(
			// Thumbnail Canvas & Media
			'aspect_ratio'       => '4:3',             // 4:3, 1:1, 4:5, 16:9, 3:2
			'image_fit'          => 'cover',           // cover, contain
			'thumb_bg'           => '#FFFFFF',         // Hex color
			'thumb_padding'      => '0',               // 0, 6, 10, 16, 24 (px)
			'thumb_radius'       => '8',               // 0, 4, 8, 12, 16 (px)
			'card_border'        => 'subtle',          // subtle, none, medium
			'card_shadow'        => 'subtle',          // subtle, none, elevated, hover_float
			'hover_zoom'         => '1.04',            // 1.04, 1.08, 1.0 (none)
			'hover_gradient'     => 'yes',             // yes, no

			// Grid Layout & Responsive Columns
			'cols_desktop'       => '3',               // 2, 3, 4
			'cols_mobile'        => '1',               // 1, 2
			'gap_desktop'        => 'standard',        // compact, standard, spacious
			'gap_mobile'         => 'standard',        // compact, standard, spacious

			// Granular Element Display Toggles
			'show_badge'         => 'yes',             // yes, no
			'show_favorite'      => 'yes',             // yes, no
			'show_category'      => 'yes',             // yes, no
			'show_made_to_order' => 'yes',             // yes, no
			'show_moq_lead'      => 'yes',             // yes, no
			'show_price_note'    => 'yes',             // yes, no
			'price_note_text'    => 'Price on request',

			// Action Buttons
			'show_actions'       => 'yes',             // yes, no
			'actions_mode'       => 'hover_overlay',   // hover_overlay, always_visible, none
			'show_details_btn'   => 'yes',             // yes, no
			'show_enquiry_btn'   => 'yes',             // yes, no
			'details_btn_text'   => 'Details',
			'enquiry_btn_text'   => '+ Enquiry',
		);
	}

	/**
	 * Retrieve saved grid options merged with defaults
	 */
	public static function get_grid_data() {
		$defaults = self::get_default_grid_data();
		$saved    = get_option( self::OPTION_KEY, array() );
		return wp_parse_args( is_array( $saved ) ? $saved : array(), $defaults );
	}

	/**
	 * Render the Admin Management UI
	 */
	public static function render_grid_manager_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$message = '';
		$notice_class = 'updated';

		// Handle Form Submission
		if ( isset( $_POST['hcc_save_grid_settings'] ) && check_admin_referer( 'hcc_grid_nonce_action', 'hcc_grid_nonce' ) ) {
			$clean = array(
				// Thumbnail
				'aspect_ratio'       => sanitize_text_field( $_POST['aspect_ratio'] ?? '4:3' ),
				'image_fit'          => in_array( $_POST['image_fit'] ?? '', array( 'cover', 'contain' ) ) ? $_POST['image_fit'] : 'cover',
				'thumb_bg'           => sanitize_hex_color( $_POST['thumb_bg'] ?? '#FFFFFF' ) ?: '#FFFFFF',
				'thumb_padding'      => sanitize_text_field( $_POST['thumb_padding'] ?? '0' ),
				'thumb_radius'       => sanitize_text_field( $_POST['thumb_radius'] ?? '8' ),
				'card_border'        => in_array( $_POST['card_border'] ?? '', array( 'subtle', 'none', 'medium' ) ) ? $_POST['card_border'] : 'subtle',
				'card_shadow'        => in_array( $_POST['card_shadow'] ?? '', array( 'subtle', 'none', 'elevated', 'hover_float' ) ) ? $_POST['card_shadow'] : 'subtle',
				'hover_zoom'         => sanitize_text_field( $_POST['hover_zoom'] ?? '1.04' ),
				'hover_gradient'     => ( isset( $_POST['hover_gradient'] ) && 'yes' === $_POST['hover_gradient'] ) ? 'yes' : 'no',

				// Grid Columns
				'cols_desktop'       => in_array( $_POST['cols_desktop'] ?? '', array( '2', '3', '4' ) ) ? $_POST['cols_desktop'] : '3',
				'cols_mobile'        => in_array( $_POST['cols_mobile'] ?? '', array( '1', '2' ) ) ? $_POST['cols_mobile'] : '1',
				'gap_desktop'        => in_array( $_POST['gap_desktop'] ?? '', array( 'compact', 'standard', 'spacious' ) ) ? $_POST['gap_desktop'] : 'standard',
				'gap_mobile'         => in_array( $_POST['gap_mobile'] ?? '', array( 'compact', 'standard', 'spacious' ) ) ? $_POST['gap_mobile'] : 'standard',

				// Toggles
				'show_badge'         => ( isset( $_POST['show_badge'] ) && 'yes' === $_POST['show_badge'] ) ? 'yes' : 'no',
				'show_favorite'      => ( isset( $_POST['show_favorite'] ) && 'yes' === $_POST['show_favorite'] ) ? 'yes' : 'no',
				'show_category'      => ( isset( $_POST['show_category'] ) && 'yes' === $_POST['show_category'] ) ? 'yes' : 'no',
				'show_made_to_order' => ( isset( $_POST['show_made_to_order'] ) && 'yes' === $_POST['show_made_to_order'] ) ? 'yes' : 'no',
				'show_moq_lead'      => ( isset( $_POST['show_moq_lead'] ) && 'yes' === $_POST['show_moq_lead'] ) ? 'yes' : 'no',
				'show_price_note'    => ( isset( $_POST['show_price_note'] ) && 'yes' === $_POST['show_price_note'] ) ? 'yes' : 'no',
				'price_note_text'    => sanitize_text_field( $_POST['price_note_text'] ?? 'Price on request' ),

				// Actions
				'show_actions'       => ( isset( $_POST['show_actions'] ) && 'yes' === $_POST['show_actions'] ) ? 'yes' : 'no',
				'actions_mode'       => in_array( $_POST['actions_mode'] ?? '', array( 'hover_overlay', 'always_visible', 'none' ) ) ? $_POST['actions_mode'] : 'hover_overlay',
				'show_details_btn'   => ( isset( $_POST['show_details_btn'] ) && 'yes' === $_POST['show_details_btn'] ) ? 'yes' : 'no',
				'show_enquiry_btn'   => ( isset( $_POST['show_enquiry_btn'] ) && 'yes' === $_POST['show_enquiry_btn'] ) ? 'yes' : 'no',
				'details_btn_text'   => sanitize_text_field( $_POST['details_btn_text'] ?? 'Details' ),
				'enquiry_btn_text'   => sanitize_text_field( $_POST['enquiry_btn_text'] ?? '+ Enquiry' ),
			);

			update_option( self::OPTION_KEY, $clean );

			// Trigger Next.js on-demand ISR revalidation
			if ( class_exists( '\\HeadlessCommerceCore\\Cache\\CacheManager' ) ) {
				CacheManager::purge_all_cache();
			}

			$frontend_url = get_option( 'hcc_frontend_url', 'http://localhost:3000' );
			$message = '<strong>Product Grid & Card Design updated successfully!</strong> Next.js storefront revalidation triggered. <a href="' . esc_url( $frontend_url . '/catalogue' ) . '" target="_blank" style="margin-left:8px; font-weight:600; text-decoration:underline; color:#0E5C63;">View Live Catalogue ↗</a>';
		}

		// Handle Reset to Defaults
		if ( isset( $_POST['hcc_reset_grid_settings'] ) && check_admin_referer( 'hcc_grid_nonce_action', 'hcc_grid_nonce' ) ) {
			delete_option( self::OPTION_KEY );
			if ( class_exists( '\\HeadlessCommerceCore\\Cache\\CacheManager' ) ) {
				CacheManager::purge_all_cache();
			}
			$message = '<strong>Grid settings reset to defaults!</strong> Cache revalidated.';
		}

		$data = self::get_grid_data();

		// Try to resolve an actual published WooCommerce product image
		$preview_img_url          = '';
		$preview_product_title    = 'Bala Low Platform Bed';
		$preview_product_category = 'BEDS & HEADBOARDS';

		if ( function_exists( 'wc_get_products' ) ) {
			$sample_products = wc_get_products( array(
				'limit'   => 1,
				'status'  => 'publish',
				'orderby' => 'date',
				'order'   => 'DESC',
			) );
			if ( ! empty( $sample_products ) && is_array( $sample_products ) ) {
				$sample_prod = reset( $sample_products );
				$img_id      = $sample_prod->get_image_id();
				if ( $img_id ) {
					$real_img = wp_get_attachment_image_url( $img_id, 'large' );
					if ( $real_img ) {
						$preview_img_url = $real_img;
					}
				}
				$preview_product_title = $sample_prod->get_name();
				$cats = wp_get_post_terms( $sample_prod->get_id(), 'product_cat' );
				if ( ! empty( $cats ) && ! is_wp_error( $cats ) ) {
					$preview_product_category = strtoupper( $cats[0]->name );
				}
			}
		}

		$bundled_bed = HCC_PLUGIN_URL . 'assets/categories/beds.jpg';
		if ( empty( $preview_img_url ) ) {
			$preview_img_url = $bundled_bed;
		}
		?>
		<div class="wrap" style="max-width: 1300px; margin-top: 15px;">
			<!-- Header -->
			<div style="background: linear-gradient(135deg, #0E5C63 0%, #153B3E 100%); color:#FFFFFF; padding: 24px 30px; border-radius: 8px; margin-bottom: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
				<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
					<div>
						<span style="background:rgba(255,255,255,0.18); font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; padding:3px 10px; border-radius:12px; display:inline-block; margin-bottom:8px;">
							Global Storefront System
						</span>
						<h1 style="color:#FFFFFF; font-size: 26px; font-weight: 700; margin: 0; line-height: 1.2;">
							Product Grid & Card Design Manager
						</h1>
						<p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 8px 0 0; max-width: 780px;">
							Control aspect ratios, image fit mode (cover / contain), canvas background, borders, responsive columns, and product card elements across your entire website (Catalogue, Collections, Homepage, Best Sellers, and Search).
						</p>
					</div>
					<div>
						<a href="<?php echo esc_url( get_option( 'hcc_frontend_url', 'http://localhost:3000' ) . '/catalogue' ); ?>" target="_blank" class="button" style="background:#FFFFFF; color:#0E5C63; font-weight:600; font-size:13px; border:none; padding:6px 16px; height:auto; border-radius:6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
							👁️ Live Catalogue ↗
						</a>
					</div>
				</div>
			</div>

			<?php if ( ! empty( $message ) ) : ?>
				<div class="<?php echo esc_attr( $notice_class ); ?>" style="padding: 12px 16px; margin-bottom: 20px; border-left: 4px solid #0E5C63; border-radius: 4px; background:#FFFFFF;">
					<p style="margin:0; font-size:14px;"><?php echo wp_kses_post( $message ); ?></p>
				</div>
			<?php endif; ?>

			<!-- Main 2-Column Grid: Left Controls, Right Sticky Live Preview -->
			<div style="display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(360px, 1fr); gap: 28px; align-items: start;">

				<!-- LEFT COLUMN: CONTROLS FORM -->
				<div>
					<form method="post" action="" id="hcc-grid-settings-form">
						<?php wp_nonce_field( 'hcc_grid_nonce_action', 'hcc_grid_nonce' ); ?>

						<!-- SECTION 1: THUMBNAIL CANVAS & IMAGE FIT -->
						<div class="postbox" style="padding: 22px; border-radius: 8px; border: 1px solid #D5CEC2; margin-bottom: 22px; background:#FFFFFF;">
							<h2 style="font-size: 17px; font-weight: 700; color: #0E5C63; margin: 0 0 4px; display:flex; align-items:center; gap:8px;">
								<span style="background:#E6F0F0; color:#0E5C63; width:26px; height:26px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:13px;">1</span>
								Thumbnail Stage & Aspect Ratio
							</h2>
							<p style="color:#666; font-size:13px; margin: 0 0 18px;">
								Configure the image frame shape, object fitting algorithm, and canvas styling.
							</p>

							<table class="form-table" style="margin: 0;">
								<!-- Aspect Ratio -->
								<tr>
									<th scope="row" style="width: 32%; padding: 12px 0;">
										<label for="aspect_ratio" style="font-weight:600;">Image Aspect Ratio</label>
									</th>
									<td style="padding: 12px 0;">
										<select name="aspect_ratio" id="aspect_ratio" class="regular-text" style="font-size: 14px; padding: 6px 10px; width: 100%; max-width: 380px;">
											<option value="4:3" <?php selected( $data['aspect_ratio'], '4:3' ); ?>>4:3 (Landscape — Furniture & Architecture Standard)</option>
											<option value="1:1" <?php selected( $data['aspect_ratio'], '1:1' ); ?>>1:1 (Square — Modern Versatile Studio Box)</option>
											<option value="4:5" <?php selected( $data['aspect_ratio'], '4:5' ); ?>>4:5 (Editorial Portrait — Tall Items & Decor)</option>
											<option value="16:9" <?php selected( $data['aspect_ratio'], '16:9' ); ?>>16:9 (Cinematic Widescreen)</option>
											<option value="3:2" <?php selected( $data['aspect_ratio'], '3:2' ); ?>>3:2 (Classic 35mm Photo Ratio)</option>
										</select>
										<p class="description" style="font-size:12px; margin-top:4px;">Defines the width-to-height ratio of every product card thumbnail on the site.</p>
									</td>
								</tr>

								<!-- Image Fit Mode -->
								<tr>
									<th scope="row" style="padding: 12px 0;">
										<label style="font-weight:600;">Image Object Fit</label>
									</th>
									<td style="padding: 12px 0;">
										<div style="display:flex; gap:16px; align-items:center;">
											<label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
												<input type="radio" name="image_fit" value="cover" <?php checked( $data['image_fit'], 'cover' ); ?> />
												<strong>Cover (Fill Frame)</strong>
											</label>
											<label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
												<input type="radio" name="image_fit" value="contain" <?php checked( $data['image_fit'], 'contain' ); ?> />
												<strong>Contain (Full Piece / No Crop)</strong>
											</label>
										</div>
										<p class="description" style="font-size:12px; margin-top:6px;">
											<strong>Cover</strong> fills the entire frame edge-to-edge. <strong>Contain</strong> scales the whole product to fit inside the canvas without cutting off any part.
										</p>
									</td>
								</tr>

								<!-- Canvas Background Color -->
								<tr>
									<th scope="row" style="padding: 12px 0;">
										<label for="thumb_bg" style="font-weight:600;">Canvas Background Color</label>
									</th>
									<td style="padding: 12px 0;">
										<div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
											<input type="text" name="thumb_bg" id="thumb_bg" value="<?php echo esc_attr( $data['thumb_bg'] ); ?>" class="hcc-color-field" data-default-color="#FFFFFF" />
											<div style="display:flex; gap:6px;">
												<button type="button" class="button button-small color-preset" data-color="#FFFFFF" style="background:#FFFFFF; border:1px solid #ccc; font-size:11px;">#FFF White</button>
												<button type="button" class="button button-small color-preset" data-color="#F8F7F5" style="background:#F8F7F5; border:1px solid #ccc; font-size:11px;">#F8F7F5 Alabaster</button>
												<button type="button" class="button button-small color-preset" data-color="#F4F0EA" style="background:#F4F0EA; border:1px solid #ccc; font-size:11px;">#F4F0EA Warm</button>
												<button type="button" class="button button-small color-preset" data-color="#EFEFEF" style="background:#EFEFEF; border:1px solid #ccc; font-size:11px;">#EFEFEF Gray</button>
											</div>
										</div>
										<p class="description" style="font-size:12px; margin-top:4px;">Stage background inside the thumbnail box, essential when using Contain mode.</p>
									</td>
								</tr>

								<!-- Thumbnail Inner Padding -->
								<tr>
									<th scope="row" style="padding: 12px 0;">
										<label for="thumb_padding" style="font-weight:600;">Image Inner Padding</label>
									</th>
									<td style="padding: 12px 0;">
										<select name="thumb_padding" id="thumb_padding" class="regular-text" style="font-size: 14px; padding: 6px 10px; width: 100%; max-width: 380px;">
											<option value="0" <?php selected( $data['thumb_padding'], '0' ); ?>>0px (Flush Edge-to-Edge — Recommended for Cover)</option>
											<option value="6" <?php selected( $data['thumb_padding'], '6' ); ?>>6px (Subtle Framing)</option>
											<option value="10" <?php selected( $data['thumb_padding'], '10' ); ?>>10px (Clean Gallery Box)</option>
											<option value="16" <?php selected( $data['thumb_padding'], '16' ); ?>>16px (Generous Studio Canvas — Great for Contain)</option>
											<option value="24" <?php selected( $data['thumb_padding'], '24' ); ?>>24px (Spacious Museum Matte)</option>
										</select>
										<p class="description" style="font-size:12px; margin-top:4px;">Adds breathing space around the product inside its canvas.</p>
									</td>
								</tr>

								<!-- Corner Radius -->
								<tr>
									<th scope="row" style="padding: 12px 0;">
										<label for="thumb_radius" style="font-weight:600;">Corner Radius</label>
									</th>
									<td style="padding: 12px 0;">
										<select name="thumb_radius" id="thumb_radius" class="regular-text" style="font-size: 14px; padding: 6px 10px; width: 100%; max-width: 380px;">
											<option value="0" <?php selected( $data['thumb_radius'], '0' ); ?>>0px (Sharp Architectural Edge)</option>
											<option value="4" <?php selected( $data['thumb_radius'], '4' ); ?>>4px (Subtle Minimal Curve)</option>
											<option value="8" <?php selected( $data['thumb_radius'], '8' ); ?>>8px (Modern Soft Curve — Default)</option>
											<option value="12" <?php selected( $data['thumb_radius'], '12' ); ?>>12px (Smooth Rounded)</option>
											<option value="16" <?php selected( $data['thumb_radius'], '16' ); ?>>16px (Pebble Soft Curve)</option>
										</select>
									</td>
								</tr>

								<!-- Border Style -->
								<tr>
									<th scope="row" style="padding: 12px 0;">
										<label for="card_border" style="font-weight:600;">Thumbnail Border</label>
									</th>
									<td style="padding: 12px 0;">
										<select name="card_border" id="card_border" class="regular-text" style="font-size: 14px; padding: 6px 10px; width: 100%; max-width: 380px;">
											<option value="subtle" <?php selected( $data['card_border'], 'subtle' ); ?>>Subtle Border (1px Solid #ECE7DE — Default)</option>
											<option value="none" <?php selected( $data['card_border'], 'none' ); ?>>No Border (Clean Borderless)</option>
											<option value="medium" <?php selected( $data['card_border'], 'medium' ); ?>>Medium Border (1px Solid #D5CEC2)</option>
										</select>
									</td>
								</tr>

								<!-- Card Shadow -->
								<tr>
									<th scope="row" style="padding: 12px 0;">
										<label for="card_shadow" style="font-weight:600;">Card Shadow / Elevation</label>
									</th>
									<td style="padding: 12px 0;">
										<select name="card_shadow" id="card_shadow" class="regular-text" style="font-size: 14px; padding: 6px 10px; width: 100%; max-width: 380px;">
											<option value="subtle" <?php selected( $data['card_shadow'], 'subtle' ); ?>>Subtle Shadow (Soft Ambient Depth — Default)</option>
											<option value="none" <?php selected( $data['card_shadow'], 'none' ); ?>>None (Pure Flat Minimal)</option>
											<option value="elevated" <?php selected( $data['card_shadow'], 'elevated' ); ?>>Elevated Card (Medium Float)</option>
											<option value="hover_float" <?php selected( $data['card_shadow'], 'hover_float' ); ?>>Hover Float (Elevates Gently on Mouseover)</option>
										</select>
									</td>
								</tr>

								<!-- Hover Zoom Effect -->
								<tr>
									<th scope="row" style="padding: 12px 0;">
										<label for="hover_zoom" style="font-weight:600;">Hover Zoom Effect</label>
									</th>
									<td style="padding: 12px 0;">
										<select name="hover_zoom" id="hover_zoom" class="regular-text" style="font-size: 14px; padding: 6px 10px; width: 100%; max-width: 380px;">
											<option value="1.04" <?php selected( $data['hover_zoom'], '1.04' ); ?>>Subtle (4% Smooth Scale — Default)</option>
											<option value="1.08" <?php selected( $data['hover_zoom'], '1.08' ); ?>>Dynamic (8% Scale)</option>
											<option value="1.0" <?php selected( $data['hover_zoom'], '1.0' ); ?>>Disabled (No Image Zoom)</option>
										</select>
									</td>
								</tr>

								<!-- Bottom Gradient on Hover -->
								<tr>
									<th scope="row" style="padding: 12px 0;">
										<label for="hover_gradient" style="font-weight:600;">Dark Gradient on Hover</label>
									</th>
									<td style="padding: 12px 0;">
										<label style="display:inline-flex; align-items:center; gap:6px; cursor:pointer;">
											<input type="checkbox" name="hover_gradient" id="hover_gradient" value="yes" <?php checked( $data['hover_gradient'], 'yes' ); ?> />
											<span>Show subtle dark gradient under action buttons on hover</span>
										</label>
									</td>
								</tr>
							</table>
						</div>

						<!-- SECTION 2: GRID COLUMNS & RESPONSIVE LAYOUT -->
						<div class="postbox" style="padding: 22px; border-radius: 8px; border: 1px solid #D5CEC2; margin-bottom: 22px; background:#FFFFFF;">
							<h2 style="font-size: 17px; font-weight: 700; color: #0E5C63; margin: 0 0 4px; display:flex; align-items:center; gap:8px;">
								<span style="background:#E6F0F0; color:#0E5C63; width:26px; height:26px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:13px;">2</span>
								Grid Columns & Responsive Spacing
							</h2>
							<p style="color:#666; font-size:13px; margin: 0 0 18px;">
								Control how many products are shown per row across screen sizes.
							</p>

							<table class="form-table" style="margin: 0;">
								<!-- Desktop Columns -->
								<tr>
									<th scope="row" style="width: 32%; padding: 12px 0;">
										<label for="cols_desktop" style="font-weight:600;">Desktop Columns</label>
									</th>
									<td style="padding: 12px 0;">
										<select name="cols_desktop" id="cols_desktop" class="regular-text" style="font-size: 14px; padding: 6px 10px; width: 100%; max-width: 380px;">
											<option value="3" <?php selected( $data['cols_desktop'], '3' ); ?>>3 Columns (Standard Balanced Layout — Default)</option>
											<option value="4" <?php selected( $data['cols_desktop'], '4' ); ?>>4 Columns (Dense High-Capacity Catalog)</option>
											<option value="2" <?php selected( $data['cols_desktop'], '2' ); ?>>2 Columns (Large High-Impact Editorial)</option>
										</select>
									</td>
								</tr>

								<!-- Mobile Columns -->
								<tr>
									<th scope="row" style="padding: 12px 0;">
										<label for="cols_mobile" style="font-weight:600;">Mobile Columns</label>
									</th>
									<td style="padding: 12px 0;">
										<select name="cols_mobile" id="cols_mobile" class="regular-text" style="font-size: 14px; padding: 6px 10px; width: 100%; max-width: 380px;">
											<option value="1" <?php selected( $data['cols_mobile'], '1' ); ?>>1 Column (Full Width Stacked Cards — Default)</option>
											<option value="2" <?php selected( $data['cols_mobile'], '2' ); ?>>2 Columns (Compact Modern E-Commerce Grid)</option>
										</select>
										<p class="description" style="font-size:12px; margin-top:4px;">Applies on phones below 768px screen width.</p>
									</td>
								</tr>

								<!-- Desktop Gap -->
								<tr>
									<th scope="row" style="padding: 12px 0;">
										<label for="gap_desktop" style="font-weight:600;">Desktop Grid Gap</label>
									</th>
									<td style="padding: 12px 0;">
										<select name="gap_desktop" id="gap_desktop" class="regular-text" style="font-size: 14px; padding: 6px 10px; width: 100%; max-width: 380px;">
											<option value="compact" <?php selected( $data['gap_desktop'], 'compact' ); ?>>Compact (28px Row / 20px Col)</option>
											<option value="standard" <?php selected( $data['gap_desktop'], 'standard' ); ?>>Standard (40px Row / 28px Col — Default)</option>
											<option value="spacious" <?php selected( $data['gap_desktop'], 'spacious' ); ?>>Spacious (48px Row / 36px Col)</option>
										</select>
									</td>
								</tr>

								<!-- Mobile Gap -->
								<tr>
									<th scope="row" style="padding: 12px 0;">
										<label for="gap_mobile" style="font-weight:600;">Mobile Grid Gap</label>
									</th>
									<td style="padding: 12px 0;">
										<select name="gap_mobile" id="gap_mobile" class="regular-text" style="font-size: 14px; padding: 6px 10px; width: 100%; max-width: 380px;">
											<option value="compact" <?php selected( $data['gap_mobile'], 'compact' ); ?>>Compact (16px Row / 12px Col)</option>
											<option value="standard" <?php selected( $data['gap_mobile'], 'standard' ); ?>>Standard (24px Row / 16px Col — Default)</option>
											<option value="spacious" <?php selected( $data['gap_mobile'], 'spacious' ); ?>>Spacious (36px Row)</option>
										</select>
									</td>
								</tr>
							</table>
						</div>

						<!-- SECTION 3: CARD ELEMENTS & VISIBILITY TOGGLES -->
						<div class="postbox" style="padding: 22px; border-radius: 8px; border: 1px solid #D5CEC2; margin-bottom: 22px; background:#FFFFFF;">
							<h2 style="font-size: 17px; font-weight: 700; color: #0E5C63; margin: 0 0 4px; display:flex; align-items:center; gap:8px;">
								<span style="background:#E6F0F0; color:#0E5C63; width:26px; height:26px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:13px;">3</span>
								Card Elements & Visibility Toggles
							</h2>
							<p style="color:#666; font-size:13px; margin: 0 0 18px;">
								Turn on or off individual badges, metadata lines, and interactive tags across all product cards.
							</p>

							<div style="display:grid; grid-template-columns: 1fr 1fr; gap: 14px 20px;">
								<label style="display:flex; align-items:center; gap:8px; cursor:pointer; background:#FBFBFA; padding:10px 14px; border-radius:6px; border:1px solid #ECE7DE;">
									<input type="checkbox" name="show_badge" id="show_badge" value="yes" <?php checked( $data['show_badge'], 'yes' ); ?> />
									<div>
										<strong style="display:block; font-size:13px;">Product Badge Tag</strong>
										<span style="color:#777; font-size:11px;">e.g., "NEW", "POPULAR", "BESTSELLER"</span>
									</div>
								</label>

								<label style="display:flex; align-items:center; gap:8px; cursor:pointer; background:#FBFBFA; padding:10px 14px; border-radius:6px; border:1px solid #ECE7DE;">
									<input type="checkbox" name="show_favorite" id="show_favorite" value="yes" <?php checked( $data['show_favorite'], 'yes' ); ?> />
									<div>
										<strong style="display:block; font-size:13px;">Favourite / Wishlist Heart</strong>
										<span style="color:#777; font-size:11px;">Floating circle icon on top-right of image</span>
									</div>
								</label>

								<label style="display:flex; align-items:center; gap:8px; cursor:pointer; background:#FBFBFA; padding:10px 14px; border-radius:6px; border:1px solid #ECE7DE;">
									<input type="checkbox" name="show_category" id="show_category" value="yes" <?php checked( $data['show_category'], 'yes' ); ?> />
									<div>
										<strong style="display:block; font-size:13px;">Category Taxonomy Tag</strong>
										<span style="color:#777; font-size:11px;">e.g., "BEDS & HEADBOARDS", "SEATING"</span>
									</div>
								</label>

								<label style="display:flex; align-items:center; gap:8px; cursor:pointer; background:#FBFBFA; padding:10px 14px; border-radius:6px; border:1px solid #ECE7DE;">
									<input type="checkbox" name="show_made_to_order" id="show_made_to_order" value="yes" <?php checked( $data['show_made_to_order'], 'yes' ); ?> />
									<div>
										<strong style="display:block; font-size:13px;">"Made-To-Order" Badge</strong>
										<span style="color:#777; font-size:11px;">Subtle minimal tag next to category</span>
									</div>
								</label>

								<label style="display:flex; align-items:center; gap:8px; cursor:pointer; background:#FBFBFA; padding:10px 14px; border-radius:6px; border:1px solid #ECE7DE;">
									<input type="checkbox" name="show_moq_lead" id="show_moq_lead" value="yes" <?php checked( $data['show_moq_lead'], 'yes' ); ?> />
									<div>
										<strong style="display:block; font-size:13px;">MOQ & Production Lead Time</strong>
										<span style="color:#777; font-size:11px;">e.g., "MOQ: 1 units | Lead: 21d"</span>
									</div>
								</label>

								<label style="display:flex; align-items:center; gap:8px; cursor:pointer; background:#FBFBFA; padding:10px 14px; border-radius:6px; border:1px solid #ECE7DE;">
									<input type="checkbox" name="show_price_note" id="show_price_note" value="yes" <?php checked( $data['show_price_note'], 'yes' ); ?> />
									<div>
										<strong style="display:block; font-size:13px;">Price Note / Label</strong>
										<span style="color:#777; font-size:11px;">Display trade quotation / pricing line</span>
									</div>
								</label>
							</div>

							<!-- Custom Price Note Text -->
							<div style="margin-top:16px; padding-top:14px; border-top:1px solid #ECE7DE;">
								<label for="price_note_text" style="font-weight:600; font-size:13px; display:block; margin-bottom:4px;">
									Default Price Note Text:
								</label>
								<input type="text" name="price_note_text" id="price_note_text" value="<?php echo esc_attr( $data['price_note_text'] ); ?>" class="regular-text" style="width:100%; max-width:380px;" placeholder="Price on request" />
							</div>
						</div>

						<!-- SECTION 4: ACTION BUTTONS (DETAILS & ENQUIRY) -->
						<div class="postbox" style="padding: 22px; border-radius: 8px; border: 1px solid #D5CEC2; margin-bottom: 22px; background:#FFFFFF;">
							<h2 style="font-size: 17px; font-weight: 700; color: #0E5C63; margin: 0 0 4px; display:flex; align-items:center; gap:8px;">
								<span style="background:#E6F0F0; color:#0E5C63; width:26px; height:26px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:13px;">4</span>
								Action Buttons (Details & + Enquiry)
							</h2>
							<p style="color:#666; font-size:13px; margin: 0 0 18px;">
								Configure quick action buttons and how they appear to users.
							</p>

							<table class="form-table" style="margin: 0;">
								<tr>
									<th scope="row" style="width: 32%; padding: 12px 0;">
										<label style="font-weight:600;">Enable Action Buttons</label>
									</th>
									<td style="padding: 12px 0;">
										<label style="display:inline-flex; align-items:center; gap:6px; cursor:pointer;">
											<input type="checkbox" name="show_actions" id="show_actions" value="yes" <?php checked( $data['show_actions'], 'yes' ); ?> />
											<strong>Show Action Buttons on Cards</strong>
										</label>
									</td>
								</tr>

								<tr>
									<th scope="row" style="padding: 12px 0;">
										<label for="actions_mode" style="font-weight:600;">Button Placement Mode</label>
									</th>
									<td style="padding: 12px 0;">
										<select name="actions_mode" id="actions_mode" class="regular-text" style="font-size: 14px; padding: 6px 10px; width: 100%; max-width: 380px;">
											<option value="hover_overlay" <?php selected( $data['actions_mode'], 'hover_overlay' ); ?>>Hover Overlay (Slides up over image on mouseover — Default)</option>
											<option value="always_visible" <?php selected( $data['actions_mode'], 'always_visible' ); ?>>Always Visible (Rendered below product details)</option>
										</select>
									</td>
								</tr>

								<tr>
									<th scope="row" style="padding: 12px 0;">
										<label style="font-weight:600;">Specific Buttons</label>
									</th>
									<td style="padding: 12px 0;">
										<div style="display:flex; flex-direction:column; gap:10px;">
											<label style="display:inline-flex; align-items:center; gap:6px; cursor:pointer;">
												<input type="checkbox" name="show_details_btn" id="show_details_btn" value="yes" <?php checked( $data['show_details_btn'], 'yes' ); ?> />
												<span>Show "Details" button</span>
											</label>
											<label style="display:inline-flex; align-items:center; gap:6px; cursor:pointer;">
												<input type="checkbox" name="show_enquiry_btn" id="show_enquiry_btn" value="yes" <?php checked( $data['show_enquiry_btn'], 'yes' ); ?> />
												<span>Show "+ Enquiry" button</span>
											</label>
										</div>
									</td>
								</tr>

								<tr>
									<th scope="row" style="padding: 12px 0;">
										<label for="details_btn_text" style="font-weight:600;">Details Button Label</label>
									</th>
									<td style="padding: 12px 0;">
										<input type="text" name="details_btn_text" id="details_btn_text" value="<?php echo esc_attr( $data['details_btn_text'] ); ?>" class="regular-text" style="max-width:380px;" placeholder="Details" />
									</td>
								</tr>

								<tr>
									<th scope="row" style="padding: 12px 0;">
										<label for="enquiry_btn_text" style="font-weight:600;">Enquiry Button Label</label>
									</th>
									<td style="padding: 12px 0;">
										<input type="text" name="enquiry_btn_text" id="enquiry_btn_text" value="<?php echo esc_attr( $data['enquiry_btn_text'] ); ?>" class="regular-text" style="max-width:380px;" placeholder="+ Enquiry" />
									</td>
								</tr>
							</table>
						</div>

						<!-- SUBMIT BUTTONS -->
						<div style="display:flex; align-items:center; gap:14px; margin-top:24px; padding-bottom:40px;">
							<button type="submit" name="hcc_save_grid_settings" value="1" class="button button-primary" style="background:#0E5C63; border-color:#0E5C63; font-size:15px; font-weight:700; padding:8px 24px; height:auto; border-radius:6px; box-shadow:0 3px 8px rgba(14,92,99,0.3);">
								💾 Save Grid Settings & Revalidate Storefront
							</button>

							<button type="submit" name="hcc_reset_grid_settings" value="1" class="button button-secondary" onclick="return confirm('Reset all product grid settings to factory defaults?');" style="font-size:13px; color:#A23B2A; border-color:#d5cec2; padding:8px 16px; height:auto; border-radius:6px;">
								↺ Reset to Defaults
							</button>
						</div>
					</form>
				</div>

				<!-- RIGHT COLUMN: STICKY LIVE INTERACTIVE PREVIEW -->
				<div style="position: sticky; top: 40px;">
					<div class="postbox" style="padding: 20px; border-radius: 8px; border: 1px solid #D5CEC2; background:#FFFFFF; box-shadow:0 4px 20px rgba(0,0,0,0.06);">
						<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #ECE7DE; padding-bottom:12px; margin-bottom:16px;">
							<div>
								<span style="font-size:10px; font-weight:700; letter-spacing:0.1em; color:#0E5C63; text-transform:uppercase; display:block;">Live Sync</span>
								<h3 style="margin:2px 0 0; font-size:16px; font-weight:700; color:#1C1917;">Interactive Card Preview</h3>
							</div>
							<div style="display:flex; gap:6px;">
								<button type="button" id="preview-mode-desktop" class="button button-small" style="font-weight:600; background:#0E5C63; color:#FFFFFF; border:none; border-radius:4px;">Desktop</button>
								<button type="button" id="preview-mode-mobile" class="button button-small" style="font-weight:600; background:#F4F0EA; color:#333; border:none; border-radius:4px;">Mobile</button>
							</div>
						</div>

						<p style="font-size:12px; color:#777; margin:0 0 10px;">
							Tweak settings on the left to see live changes instantly reflected here.
						</p>

						<!-- Sample Product Switcher -->
						<div style="display:flex; align-items:center; gap:5px; margin-bottom:14px; flex-wrap:wrap;">
							<span style="font-size:11px; color:#777; font-weight:600;">Sample Product:</span>
							<button type="button" class="button button-small prev-sample-btn active" data-img="<?php echo esc_url( $preview_img_url ); ?>" data-title="<?php echo esc_attr( $preview_product_title ); ?>" data-cat="<?php echo esc_attr( $preview_product_category ); ?>" style="font-size:11px; border-radius:4px; font-weight:600; background:#0E5C63; color:#FFFFFF;">Current</button>
							<button type="button" class="button button-small prev-sample-btn" data-img="<?php echo esc_url( HCC_PLUGIN_URL . 'assets/categories/beds.jpg' ); ?>" data-title="Bala Low Platform Bed" data-cat="BEDS & HEADBOARDS" style="font-size:11px; border-radius:4px; background:#F4F0EA; color:#333;">Bed</button>
							<button type="button" class="button button-small prev-sample-btn" data-img="<?php echo esc_url( HCC_PLUGIN_URL . 'assets/categories/chairs.jpg' ); ?>" data-title="Artisan Cane Chair" data-cat="CHAIRS & SEATING" style="font-size:11px; border-radius:4px; background:#F4F0EA; color:#333;">Chair</button>
							<button type="button" class="button button-small prev-sample-btn" data-img="<?php echo esc_url( HCC_PLUGIN_URL . 'assets/categories/tables.jpg' ); ?>" data-title="Solid Sheesham Dining Table" data-cat="TABLES & DESKS" style="font-size:11px; border-radius:4px; background:#F4F0EA; color:#333;">Table</button>
							<button type="button" class="button button-small prev-sample-btn" data-img="<?php echo esc_url( HCC_PLUGIN_URL . 'assets/categories/sofas.jpg' ); ?>" data-title="Modern Velvet Sofa" data-cat="LIVING & LOUNGE" style="font-size:11px; border-radius:4px; background:#F4F0EA; color:#333;">Sofa</button>
						</div>

						<!-- Preview Frame Container -->
						<div id="preview-viewport" style="width: 100%; transition: max-width 0.3s ease; margin: 0 auto;">
							<div id="preview-card" style="display:flex; flex-direction:column; background:none; transition:all 0.2s ease;">
								<!-- Thumbnail Stage -->
								<div id="prev-thumb" style="
									aspect-ratio: 4 / 3;
									background-color: <?php echo esc_attr( $data['thumb_bg'] ); ?>;
									border: 1px solid #ECE7DE;
									border-radius: <?php echo esc_attr( $data['thumb_radius'] ); ?>px;
									box-shadow: 0 2px 10px rgba(0,0,0,0.03);
									padding: <?php echo esc_attr( $data['thumb_padding'] ); ?>px;
									position: relative;
									overflow: hidden;
									display: flex;
									align-items: center;
									justify-content: center;
									transition: all 0.25s ease;
								">
									<!-- Badge Tag -->
									<span id="prev-badge" style="
										position: absolute;
										top: 10px;
										left: 10px;
										z-index: 10;
										background: rgba(255,255,255,0.95);
										color: #141210;
										font-family: monospace;
										font-size: 9px;
										letter-spacing: 0.12em;
										padding: 4px 10px;
										border-radius: 20px;
										font-weight: 700;
										text-transform: uppercase;
										box-shadow: 0 2px 8px rgba(0,0,0,0.12);
										display: <?php echo 'yes' === $data['show_badge'] ? 'inline-block' : 'none'; ?>;
									">NEW</span>

									<!-- Favorite Heart Button -->
									<div id="prev-fav" style="
										position: absolute;
										top: 8px;
										right: 8px;
										width: 30px;
										height: 30px;
										border-radius: 50%;
										background: rgba(255,255,255,0.92);
										border: 1px solid rgba(0,0,0,0.08);
										display: <?php echo 'yes' === $data['show_favorite'] ? 'flex' : 'none'; ?>;
										align-items: center;
										justify-content: center;
										box-shadow: 0 2px 6px rgba(0,0,0,0.1);
										z-index: 5;
									">
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B85735" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
										</svg>
									</div>

									<!-- Sample Product Image -->
									<img id="prev-img" src="<?php echo esc_url( $preview_img_url ); ?>" onerror="this.onerror=null; this.src='<?php echo esc_url( $bundled_bed ); ?>';" alt="Preview Product" style="
										width: 100%;
										height: 100%;
										object-fit: <?php echo esc_attr( $data['image_fit'] ); ?>;
										object-position: center;
										display: block;
										transition: transform 0.3s ease;
									" />

									<!-- Dark Gradient Overlay -->
									<div id="prev-gradient" style="
										position: absolute;
										inset: 0;
										background: linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 60%);
										opacity: 0;
										transition: opacity 0.25s ease;
										pointer-events: none;
									"></div>

									<!-- Hover Action Buttons -->
									<div id="prev-acts" style="
										position: absolute;
										inset: auto 10px 10px 10px;
										display: <?php echo ( 'yes' === $data['show_actions'] && 'hover_overlay' === $data['actions_mode'] ) ? 'flex' : 'none'; ?>;
										gap: 6px;
										z-index: 20;
									">
										<span id="prev-btn-details" style="
											flex: 1;
											height: 34px;
											background: rgba(255,255,255,0.95);
											color: #111;
											font-size: 12px;
											font-weight: 600;
											display: <?php echo 'yes' === $data['show_details_btn'] ? 'flex' : 'none'; ?>;
											align-items: center;
											justify-content: center;
											border-radius: 6px;
											box-shadow: 0 2px 8px rgba(0,0,0,0.15);
										"><?php echo esc_html( $data['details_btn_text'] ); ?></span>

										<span id="prev-btn-enquiry" style="
											flex: 1;
											height: 34px;
											background: #0E5C63;
											color: #FFFFFF;
											font-size: 12px;
											font-weight: 600;
											display: <?php echo 'yes' === $data['show_enquiry_btn'] ? 'flex' : 'none'; ?>;
											align-items: center;
											justify-content: center;
											border-radius: 6px;
											box-shadow: 0 2px 8px rgba(14,92,99,0.3);
										"><?php echo esc_html( $data['enquiry_btn_text'] ); ?></span>
									</div>
								</div>

								<!-- Body Content -->
								<div id="prev-body" style="padding: 12px 2px 0; display:flex; flex-direction:column; gap:4px;">
									<div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
										<span id="prev-category" style="
											font-family: monospace;
											font-size: 9.5px;
											letter-spacing: 0.12em;
											color: #777;
											text-transform: uppercase;
											display: <?php echo 'yes' === $data['show_category'] ? 'inline-block' : 'none'; ?>;
										"><?php echo esc_html( $preview_product_category ); ?></span>

										<span id="prev-made-to-order" style="
											font-family: monospace;
											font-size: 8.5px;
											font-weight: 600;
											letter-spacing: 0.08em;
											text-transform: uppercase;
											color: #6C665D;
											background-color: #F8F6F1;
											border: 1px solid #E4DFD5;
											padding: 1px 6px;
											border-radius: 3px;
											display: <?php echo 'yes' === $data['show_made_to_order'] ? 'inline-block' : 'none'; ?>;
										">Made-To-Order</span>
									</div>

									<h4 id="prev-title" style="font-family: Georgia, serif; font-size: 18px; font-weight: 500; margin: 2px 0 0; color: #111; line-height: 1.25;">
										<?php echo esc_html( $preview_product_title ); ?>
									</h4>

									<div id="prev-moq-lead" style="
										display: <?php echo 'yes' === $data['show_moq_lead'] ? 'flex' : 'none'; ?>;
										align-items: center;
										justify-content: space-between;
										margin-top: 4px;
										font-size: 11px;
										color: #777;
									">
										<span>MOQ: <strong style="color:#111;">1 units</strong></span>
										<span>Lead: <strong style="color:#111;">21d</strong></span>
									</div>

									<span id="prev-price" style="
										font-size: 13px;
										font-weight: 600;
										color: #0E5C63;
										margin-top: 2px;
										display: <?php echo 'yes' === $data['show_price_note'] ? 'inline-block' : 'none'; ?>;
									"><?php echo esc_html( $data['price_note_text'] ); ?></span>

									<!-- Inline Action Buttons (if mode is always_visible) -->
									<div id="prev-acts-inline" style="
										display: <?php echo ( 'yes' === $data['show_actions'] && 'always_visible' === $data['actions_mode'] ) ? 'flex' : 'none'; ?>;
										gap: 6px;
										margin-top: 8px;
									">
										<span style="flex:1; height:32px; background:#ECE7DE; color:#111; font-size:11px; font-weight:600; display:flex; align-items:center; justify-content:center; border-radius:4px;">
											<?php echo esc_html( $data['details_btn_text'] ); ?>
										</span>
										<span style="flex:1; height:32px; background:#0E5C63; color:#fff; font-size:11px; font-weight:600; display:flex; align-items:center; justify-content:center; border-radius:4px;">
											<?php echo esc_html( $data['enquiry_btn_text'] ); ?>
										</span>
									</div>
								</div>
							</div>
						</div>

						<!-- Quick Specs Summary Box -->
						<div style="background:#FBFBFA; border:1px solid #ECE7DE; border-radius:6px; padding:12px; margin-top:20px; font-size:11.5px; color:#666;">
							<div style="display:flex; justify-content:space-between; margin-bottom:4px;">
								<span>Ratio: <strong id="spec-ratio" style="color:#111;"><?php echo esc_html( $data['aspect_ratio'] ); ?></strong></span>
								<span>Fit: <strong id="spec-fit" style="color:#111;"><?php echo esc_html( $data['image_fit'] ); ?></strong></span>
							</div>
							<div style="display:flex; justify-content:space-between;">
								<span>Desktop Grid: <strong id="spec-cols-desktop" style="color:#111;"><?php echo esc_html( $data['cols_desktop'] ); ?> cols</strong></span>
								<span>Mobile Grid: <strong id="spec-cols-mobile" style="color:#111;"><?php echo esc_html( $data['cols_mobile'] ); ?> col</strong></span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Client Side Live Sync Script -->
		<script type="text/javascript">
		jQuery(document).ready(function($) {
			// Initialize WP Color Picker if available
			if ($.fn.wpColorPicker) {
				$('.hcc-color-field').wpColorPicker({
					change: function(event, ui) {
						updatePreview();
					},
					clear: function() {
						updatePreview();
					}
				});
			}

			// Preset color buttons
			$('.color-preset').on('click', function(e) {
				e.preventDefault();
				var col = $(this).data('color');
				var $input = $('#thumb_bg');
				$input.val(col);
				if ($.fn.wpColorPicker && $input.data('wpWpColorPicker')) {
					$input.wpColorPicker('color', col);
				}
				updatePreview();
			});

			// Preview mode toggle (Desktop vs Mobile)
			$('#preview-mode-desktop').on('click', function() {
				$(this).css({ background: '#0E5C63', color: '#FFFFFF' });
				$('#preview-mode-mobile').css({ background: '#F4F0EA', color: '#333' });
				$('#preview-viewport').css('max-width', '100%');
			});

			$('#preview-mode-mobile').on('click', function() {
				$(this).css({ background: '#0E5C63', color: '#FFFFFF' });
				$('#preview-mode-desktop').css({ background: '#F4F0EA', color: '#333' });
				$('#preview-viewport').css('max-width', '280px');
			});

			// Sample product switcher
			$('.prev-sample-btn').on('click', function(e) {
				e.preventDefault();
				$('.prev-sample-btn').removeClass('active').css({ background: '#F4F0EA', color: '#333' });
				$(this).addClass('active').css({ background: '#0E5C63', color: '#FFFFFF' });
				var img = $(this).data('img');
				var title = $(this).data('title');
				var cat = $(this).data('cat');
				if (img) $('#prev-img').attr('src', img);
				if (title) $('#prev-title').text(title);
				if (cat) $('#prev-category').text(cat);
			});

			// Listen for changes
			$('#hcc-grid-settings-form select, #hcc-grid-settings-form input').on('change input', function() {
				updatePreview();
			});

			// Hover simulation on preview thumb
			$('#prev-thumb').hover(
				function() {
					var zoom = parseFloat($('#hover_zoom').val()) || 1.04;
					$('#prev-img').css('transform', 'scale(' + zoom + ')');
					if ($('#hover_gradient').is(':checked')) {
						$('#prev-gradient').css('opacity', '1');
					}
					if ($('#show_actions').is(':checked') && $('#actions_mode').val() === 'hover_overlay') {
						$('#prev-acts').css({ opacity: '1', display: 'flex' });
					}
				},
				function() {
					$('#prev-img').css('transform', 'scale(1)');
					$('#prev-gradient').css('opacity', '0');
				}
			);

			function updatePreview() {
				// Aspect ratio
				var ratio = $('#aspect_ratio').val();
				var ratioMap = {
					'4:3': '4 / 3',
					'1:1': '1 / 1',
					'4:5': '4 / 5',
					'16:9': '16 / 9',
					'3:2': '3 / 2'
				};
				$('#prev-thumb').css('aspect-ratio', ratioMap[ratio] || '4 / 3');
				$('#spec-ratio').text(ratio);

				// Image fit
				var fit = $('input[name="image_fit"]:checked').val() || 'cover';
				$('#prev-img').css('object-fit', fit);
				$('#spec-fit').text(fit);

				// Canvas BG
				var bg = $('#thumb_bg').val() || '#FFFFFF';
				$('#prev-thumb').css('background-color', bg);

				// Padding
				var pad = $('#thumb_padding').val() || '0';
				$('#prev-thumb').css('padding', pad + 'px');

				// Radius
				var rad = $('#thumb_radius').val() || '8';
				$('#prev-thumb').css('border-radius', rad + 'px');

				// Border
				var borderMode = $('#card_border').val();
				if (borderMode === 'none') {
					$('#prev-thumb').css('border', 'none');
				} else if (borderMode === 'medium') {
					$('#prev-thumb').css('border', '1px solid #D5CEC2');
				} else {
					$('#prev-thumb').css('border', '1px solid #ECE7DE');
				}

				// Shadow
				var shadowMode = $('#card_shadow').val();
				if (shadowMode === 'none') {
					$('#prev-thumb').css('box-shadow', 'none');
				} else if (shadowMode === 'elevated') {
					$('#prev-thumb').css('box-shadow', '0 4px 16px rgba(0,0,0,0.08)');
				} else {
					$('#prev-thumb').css('box-shadow', '0 2px 10px rgba(0,0,0,0.03)');
				}

				// Toggles
				$('#prev-badge').css('display', $('#show_badge').is(':checked') ? 'inline-block' : 'none');
				$('#prev-fav').css('display', $('#show_favorite').is(':checked') ? 'flex' : 'none');
				$('#prev-category').css('display', $('#show_category').is(':checked') ? 'inline-block' : 'none');
				$('#prev-made-to-order').css('display', $('#show_made_to_order').is(':checked') ? 'inline-block' : 'none');
				$('#prev-moq-lead').css('display', $('#show_moq_lead').is(':checked') ? 'flex' : 'none');
				$('#prev-price').css('display', $('#show_price_note').is(':checked') ? 'inline-block' : 'none');
				$('#prev-price').text($('#price_note_text').val() || 'Price on request');

				// Actions
				var showActs = $('#show_actions').is(':checked');
				var actsMode = $('#actions_mode').val();
				var showDetails = $('#show_details_btn').is(':checked');
				var showEnquiry = $('#show_enquiry_btn').is(':checked');
				var detailsText = $('#details_btn_text').val() || 'Details';
				var enquiryText = $('#enquiry_btn_text').val() || '+ Enquiry';

				$('#prev-btn-details').text(detailsText).css('display', showDetails ? 'flex' : 'none');
				$('#prev-btn-enquiry').text(enquiryText).css('display', showEnquiry ? 'flex' : 'none');

				if (showActs && actsMode === 'always_visible') {
					$('#prev-acts').css('display', 'none');
					$('#prev-acts-inline').css('display', 'flex');
				} else if (showActs && actsMode === 'hover_overlay') {
					$('#prev-acts').css('display', 'flex');
					$('#prev-acts-inline').css('display', 'none');
				} else {
					$('#prev-acts').css('display', 'none');
					$('#prev-acts-inline').css('display', 'none');
				}

				// Specs
				$('#spec-cols-desktop').text($('#cols_desktop').val() + ' cols');
				$('#spec-cols-mobile').text($('#cols_mobile').val() + ' col');
			}
		});
		</script>
		<?php
	}
}
