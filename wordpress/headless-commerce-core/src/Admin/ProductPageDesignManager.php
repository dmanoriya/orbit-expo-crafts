<?php

namespace HeadlessCommerceCore\Admin;

use HeadlessCommerceCore\Cache\CacheManager;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Single Product Page Design Manager
 *
 * Provides full WordPress admin control over single product page (PDP)
 * featured image canvas, borders, shadows, corner radiuses, thumbnail strip,
 * interactive zoom/fit toggles, specifications table, and action buttons.
 */
class ProductPageDesignManager {

	const OPTION_KEY = 'hcc_product_page_options';

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_admin_menu' ), 13 );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_admin_assets' ) );
	}

	public static function add_admin_menu() {
		add_submenu_page(
			'headless-commerce-core',
			__( 'Single Product Detailed Page Design', 'headless-commerce-core' ),
			__( 'Product Page Design', 'headless-commerce-core' ),
			'manage_options',
			'hcc-product-page-settings',
			array( __CLASS__, 'render_page_manager_page' )
		);
	}

	public static function register_settings() {
		register_setting( 'hcc_product_page_options_group', self::OPTION_KEY );
	}

	public static function enqueue_admin_assets( $hook ) {
		if ( false !== strpos( $hook, 'hcc-product-page-settings' ) ) {
			wp_enqueue_style( 'wp-color-picker' );
			wp_enqueue_script( 'wp-color-picker' );
		}
	}

	/**
	 * Default Single Product Page Configuration
	 */
	public static function get_default_page_data() {
		return array(
			// Featured Image Canvas
			'canvas_border'         => 'none',          // none, subtle, solid
			'canvas_shadow'         => 'none',          // none, subtle, elevated
			'canvas_radius'         => '8',             // 0, 4, 8, 12, 16
			'canvas_bg'             => '#FFFFFF',       // Hex color
			'canvas_padding'        => 'standard',      // flush, compact, standard, spacious
			'default_fit_mode'      => 'contain',       // contain, cover
			'enable_hover_zoom'     => 'yes',           // yes, no
			'show_fit_toggle'       => 'yes',           // yes, no
			'show_expand_hint'      => 'yes',           // yes, no
			'show_counter_badge'    => 'yes',           // yes, no

			// Thumbnails Strip
			'thumb_border'          => 'none',          // none, subtle, accent
			'thumb_shadow'          => 'none',          // none, subtle
			'thumb_radius'          => '6',             // 0, 4, 6, 8, 12
			'thumb_size'            => 'standard',      // compact (64px), standard (76px), large (88px)
			'thumb_opacity'         => '0.65',          // 0.50, 0.65, 0.80, 1.0

			// PDP Content & Action Toggles
			'show_made_to_order'    => 'yes',           // yes, no
			'show_sku'              => 'yes',           // yes, no
			'show_category_meta'    => 'yes',           // yes, no
			'show_moq'              => 'yes',           // yes, no
			'show_lead_time'        => 'yes',           // yes, no
			'show_enquiry_btn'      => 'yes',           // yes, no
			'enquiry_btn_text'      => '+ Add to Project Quote',
			'show_favorite_btn'     => 'yes',           // yes, no
			'show_specs_table'      => 'yes',           // yes, no
			'show_trust_badges'     => 'yes',           // yes, no
			'show_related_products' => 'yes',           // yes, no
			'show_recently_viewed'  => 'yes',           // yes, no
		);
	}

	/**
	 * Retrieve saved product page options merged with defaults
	 */
	public static function get_page_data() {
		$defaults = self::get_default_page_data();
		$saved    = get_option( self::OPTION_KEY, array() );
		return wp_parse_args( is_array( $saved ) ? $saved : array(), $defaults );
	}

	/**
	 * Render the Admin Management UI
	 */
	public static function render_page_manager_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$message = '';
		$notice_class = 'updated';

		// Handle Form Submission
		if ( isset( $_POST['hcc_save_pdp_settings'] ) && check_admin_referer( 'hcc_pdp_nonce_action', 'hcc_pdp_nonce' ) ) {
			$clean = array(
				// Featured Image Canvas
				'canvas_border'         => in_array( $_POST['canvas_border'] ?? '', array( 'none', 'subtle', 'solid' ) ) ? $_POST['canvas_border'] : 'none',
				'canvas_shadow'         => in_array( $_POST['canvas_shadow'] ?? '', array( 'none', 'subtle', 'elevated' ) ) ? $_POST['canvas_shadow'] : 'none',
				'canvas_radius'         => sanitize_text_field( $_POST['canvas_radius'] ?? '8' ),
				'canvas_bg'             => sanitize_hex_color( $_POST['canvas_bg'] ?? '#FFFFFF' ) ?: '#FFFFFF',
				'canvas_padding'        => in_array( $_POST['canvas_padding'] ?? '', array( 'flush', 'compact', 'standard', 'spacious' ) ) ? $_POST['canvas_padding'] : 'standard',
				'default_fit_mode'      => in_array( $_POST['default_fit_mode'] ?? '', array( 'contain', 'cover' ) ) ? $_POST['default_fit_mode'] : 'contain',
				'enable_hover_zoom'     => ( isset( $_POST['enable_hover_zoom'] ) && 'yes' === $_POST['enable_hover_zoom'] ) ? 'yes' : 'no',
				'show_fit_toggle'       => ( isset( $_POST['show_fit_toggle'] ) && 'yes' === $_POST['show_fit_toggle'] ) ? 'yes' : 'no',
				'show_expand_hint'      => ( isset( $_POST['show_expand_hint'] ) && 'yes' === $_POST['show_expand_hint'] ) ? 'yes' : 'no',
				'show_counter_badge'    => ( isset( $_POST['show_counter_badge'] ) && 'yes' === $_POST['show_counter_badge'] ) ? 'yes' : 'no',

				// Thumbnails Strip
				'thumb_border'          => in_array( $_POST['thumb_border'] ?? '', array( 'none', 'subtle', 'accent' ) ) ? $_POST['thumb_border'] : 'none',
				'thumb_shadow'          => in_array( $_POST['thumb_shadow'] ?? '', array( 'none', 'subtle' ) ) ? $_POST['thumb_shadow'] : 'none',
				'thumb_radius'          => sanitize_text_field( $_POST['thumb_radius'] ?? '6' ),
				'thumb_size'            => in_array( $_POST['thumb_size'] ?? '', array( 'compact', 'standard', 'large' ) ) ? $_POST['thumb_size'] : 'standard',
				'thumb_opacity'         => in_array( $_POST['thumb_opacity'] ?? '', array( '0.50', '0.65', '0.80', '1.0' ) ) ? $_POST['thumb_opacity'] : '0.65',

				// Content Toggles
				'show_made_to_order'    => ( isset( $_POST['show_made_to_order'] ) && 'yes' === $_POST['show_made_to_order'] ) ? 'yes' : 'no',
				'show_sku'              => ( isset( $_POST['show_sku'] ) && 'yes' === $_POST['show_sku'] ) ? 'yes' : 'no',
				'show_category_meta'    => ( isset( $_POST['show_category_meta'] ) && 'yes' === $_POST['show_category_meta'] ) ? 'yes' : 'no',
				'show_moq'              => ( isset( $_POST['show_moq'] ) && 'yes' === $_POST['show_moq'] ) ? 'yes' : 'no',
				'show_lead_time'        => ( isset( $_POST['show_lead_time'] ) && 'yes' === $_POST['show_lead_time'] ) ? 'yes' : 'no',
				'show_enquiry_btn'      => ( isset( $_POST['show_enquiry_btn'] ) && 'yes' === $_POST['show_enquiry_btn'] ) ? 'yes' : 'no',
				'enquiry_btn_text'      => sanitize_text_field( $_POST['enquiry_btn_text'] ?? '+ Add to Project Quote' ),
				'show_favorite_btn'     => ( isset( $_POST['show_favorite_btn'] ) && 'yes' === $_POST['show_favorite_btn'] ) ? 'yes' : 'no',
				'show_specs_table'      => ( isset( $_POST['show_specs_table'] ) && 'yes' === $_POST['show_specs_table'] ) ? 'yes' : 'no',
				'show_trust_badges'     => ( isset( $_POST['show_trust_badges'] ) && 'yes' === $_POST['show_trust_badges'] ) ? 'yes' : 'no',
				'show_related_products' => ( isset( $_POST['show_related_products'] ) && 'yes' === $_POST['show_related_products'] ) ? 'yes' : 'no',
				'show_recently_viewed'  => ( isset( $_POST['show_recently_viewed'] ) && 'yes' === $_POST['show_recently_viewed'] ) ? 'yes' : 'no',
			);

			update_option( self::OPTION_KEY, $clean );

			// Trigger Next.js on-demand ISR revalidation
			if ( class_exists( '\\HeadlessCommerceCore\\Cache\\CacheManager' ) ) {
				CacheManager::purge_all_cache();
			}

			$frontend_url = get_option( 'hcc_frontend_url', 'http://localhost:3000' );
			$message = '<strong>Single Product Page Design updated successfully!</strong> Live storefront revalidation triggered. <a href="' . esc_url( $frontend_url . '/product/thar-mirror' ) . '" target="_blank" style="margin-left:8px; font-weight:600; text-decoration:underline; color:#0E5C63;">View Live Product Page ↗</a>';
		}

		// Handle Reset to Defaults
		if ( isset( $_POST['hcc_reset_pdp_settings'] ) && check_admin_referer( 'hcc_pdp_nonce_action', 'hcc_pdp_nonce' ) ) {
			delete_option( self::OPTION_KEY );
			if ( class_exists( '\\HeadlessCommerceCore\\Cache\\CacheManager' ) ) {
				CacheManager::purge_all_cache();
			}
			$message = '<strong>Product Page settings reset to defaults!</strong> Cache revalidated.';
		}

		$data = self::get_page_data();

		// Sample Product for Visual Preview
		$preview_img_url   = '';
		$preview_title     = 'Thar Solid Acacia Tall Mirror';
		$preview_cat       = 'MIRRORS';
		$preview_sku       = 'THAR-6073';
		$preview_thumbs    = array();

		if ( function_exists( 'wc_get_products' ) ) {
			$sample_products = wc_get_products( array(
				'limit'   => 1,
				'status'  => 'publish',
				'orderby' => 'date',
				'order'   => 'DESC',
			) );

			if ( ! empty( $sample_products ) ) {
				$sample = $sample_products[0];
				$preview_title = $sample->get_name();
				$preview_sku   = $sample->get_sku() ?: 'ORB-' . $sample->get_id();
				$cats = wc_get_product_category_list( $sample->get_id() );
				if ( ! empty( $cats ) ) {
					$preview_cat = wp_strip_all_tags( $cats );
				}
				$img_id = $sample->get_image_id();
				if ( $img_id ) {
					$preview_img_url = wp_get_attachment_image_url( $img_id, 'medium_large' );
				}
				$gallery_ids = $sample->get_gallery_image_ids();
				if ( ! empty( $gallery_ids ) ) {
					foreach ( array_slice( $gallery_ids, 0, 3 ) as $gid ) {
						$gurl = wp_get_attachment_image_url( $gid, 'thumbnail' );
						if ( $gurl ) {
							$preview_thumbs[] = $gurl;
						}
					}
				}
			}
		}

		if ( empty( $preview_img_url ) ) {
			$preview_img_url = HCC_PLUGIN_URL . 'assets/fallback-product.svg';
		}
		if ( empty( $preview_thumbs ) ) {
			$preview_thumbs = array(
				$preview_img_url,
				HCC_PLUGIN_URL . 'assets/fallback-product.svg',
			);
		}

		$frontend_url = get_option( 'hcc_frontend_url', 'http://localhost:3000' );
		?>
		<div class="wrap hcc-pdp-manager-wrap">
			<h1 class="wp-heading-inline">
				<span class="dashicons dashicons-art" style="font-size:28px; width:28px; height:28px; vertical-align:middle; margin-right:8px; color:#0E5C63;"></span>
				<?php _e( 'Single Product Detailed Page (PDP) Design Manager', 'headless-commerce-core' ); ?>
			</h1>
			<p class="description" style="font-size:14px; margin-top:6px; color:#555;">
				<?php _e( 'Control the visual styling, borders, elevation shadows, corner radiuses, and interactive feature toggles of your single product pages. All adjustments instantly sync with your Next.js storefront.', 'headless-commerce-core' ); ?>
			</p>
			<hr class="wp-header-end">

			<?php if ( ! empty( $message ) ) : ?>
				<div id="message" class="notice <?php echo esc_attr( $notice_class ); ?> is-dismissible" style="margin-top:15px; border-left-color:#0E5C63;">
					<p><?php echo $message; ?></p>
				</div>
			<?php endif; ?>

			<div class="hcc-layout-container" style="display:grid; grid-template-columns:1fr 420px; gap:24px; margin-top:20px; align-items:start;">

				<!-- LEFT COLUMN: CONTROLS FORM -->
				<div class="hcc-controls-column">
					<form method="post" action="" id="hcc-pdp-form">
						<?php wp_nonce_field( 'hcc_pdp_nonce_action', 'hcc_pdp_nonce' ); ?>

						<!-- TAB NAVIGATION -->
						<nav class="nav-tab-wrapper hcc-tabs" style="margin-bottom:20px;">
							<a href="#tab-canvas" class="nav-tab nav-tab-active" data-tab="tab-canvas">
								<span class="dashicons dashicons-format-image" style="vertical-align:middle; margin-right:4px;"></span>
								<?php _e( 'Featured Image & Canvas', 'headless-commerce-core' ); ?>
							</a>
							<a href="#tab-thumbs" class="nav-tab" data-tab="tab-thumbs">
								<span class="dashicons dashicons-images-alt2" style="vertical-align:middle; margin-right:4px;"></span>
								<?php _e( 'Thumbnails Strip', 'headless-commerce-core' ); ?>
							</a>
							<a href="#tab-content" class="nav-tab" data-tab="tab-content">
								<span class="dashicons dashicons-visibility" style="vertical-align:middle; margin-right:4px;"></span>
								<?php _e( 'Content & Toggles', 'headless-commerce-core' ); ?>
							</a>
							<a href="#tab-actions" class="nav-tab" data-tab="tab-actions">
								<span class="dashicons dashicons-cart" style="vertical-align:middle; margin-right:4px;"></span>
								<?php _e( 'Enquiry & Actions', 'headless-commerce-core' ); ?>
							</a>
						</nav>

						<!-- TAB 1: FEATURED IMAGE CANVAS -->
						<div id="tab-canvas" class="hcc-tab-content active-tab">
							<div class="postbox" style="box-shadow:0 1px 3px rgba(0,0,0,0.06); border-radius:6px; overflow:hidden;">
								<div class="postbox-header" style="background:#FAF8F5; border-bottom:1px solid #ECE7DE; padding:12px 18px;">
									<h2 class="hndle" style="margin:0; font-size:15px; font-weight:600; color:#1C1917;">
										<?php _e( 'Featured Hero Image & Canvas Frame', 'headless-commerce-core' ); ?>
									</h2>
								</div>
								<div class="inside" style="padding:18px;">

									<!-- Canvas Border -->
									<div class="hcc-field-row" style="margin-bottom:18px;">
										<label style="font-weight:600; display:block; margin-bottom:6px; color:#1C1917;">
											<?php _e( 'Featured Image Border', 'headless-commerce-core' ); ?>
										</label>
										<div class="hcc-radio-cards" style="display:flex; gap:12px;">
											<label style="flex:1; border:1px solid #DDD; padding:10px; border-radius:6px; cursor:pointer; background:#FFF;">
												<input type="radio" name="canvas_border" value="none" <?php checked( $data['canvas_border'], 'none' ); ?>>
												<strong><?php _e( 'None (Flush)', 'headless-commerce-core' ); ?></strong>
												<div style="font-size:12px; color:#666;"><?php _e( 'No bounding border line', 'headless-commerce-core' ); ?></div>
											</label>
											<label style="flex:1; border:1px solid #DDD; padding:10px; border-radius:6px; cursor:pointer; background:#FFF;">
												<input type="radio" name="canvas_border" value="subtle" <?php checked( $data['canvas_border'], 'subtle' ); ?>>
												<strong><?php _e( 'Subtle Line', 'headless-commerce-core' ); ?></strong>
												<div style="font-size:12px; color:#666;"><?php _e( '1px refined light border', 'headless-commerce-core' ); ?></div>
											</label>
											<label style="flex:1; border:1px solid #DDD; padding:10px; border-radius:6px; cursor:pointer; background:#FFF;">
												<input type="radio" name="canvas_border" value="solid" <?php checked( $data['canvas_border'], 'solid' ); ?>>
												<strong><?php _e( 'Solid Frame', 'headless-commerce-core' ); ?></strong>
												<div style="font-size:12px; color:#666;"><?php _e( '1.5px defined framing line', 'headless-commerce-core' ); ?></div>
											</label>
										</div>
									</div>

									<!-- Canvas Shadow -->
									<div class="hcc-field-row" style="margin-bottom:18px;">
										<label style="font-weight:600; display:block; margin-bottom:6px; color:#1C1917;">
											<?php _e( 'Featured Image Elevation Shadow', 'headless-commerce-core' ); ?>
										</label>
										<div class="hcc-radio-cards" style="display:flex; gap:12px;">
											<label style="flex:1; border:1px solid #DDD; padding:10px; border-radius:6px; cursor:pointer; background:#FFF;">
												<input type="radio" name="canvas_shadow" value="none" <?php checked( $data['canvas_shadow'], 'none' ); ?>>
												<strong><?php _e( 'None (Flat)', 'headless-commerce-core' ); ?></strong>
												<div style="font-size:12px; color:#666;"><?php _e( 'Zero drop shadow', 'headless-commerce-core' ); ?></div>
											</label>
											<label style="flex:1; border:1px solid #DDD; padding:10px; border-radius:6px; cursor:pointer; background:#FFF;">
												<input type="radio" name="canvas_shadow" value="subtle" <?php checked( $data['canvas_shadow'], 'subtle' ); ?>>
												<strong><?php _e( 'Soft Ambient', 'headless-commerce-core' ); ?></strong>
												<div style="font-size:12px; color:#666;"><?php _e( 'Gentle micro-shadow', 'headless-commerce-core' ); ?></div>
											</label>
											<label style="flex:1; border:1px solid #DDD; padding:10px; border-radius:6px; cursor:pointer; background:#FFF;">
												<input type="radio" name="canvas_shadow" value="elevated" <?php checked( $data['canvas_shadow'], 'elevated' ); ?>>
												<strong><?php _e( 'Elevated Card', 'headless-commerce-core' ); ?></strong>
												<div style="font-size:12px; color:#666;"><?php _e( 'Floating studio depth', 'headless-commerce-core' ); ?></div>
											</label>
										</div>
									</div>

									<!-- Corner Radius & Background Color -->
									<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:18px;">
										<div>
											<label style="font-weight:600; display:block; margin-bottom:6px; color:#1C1917;">
												<?php _e( 'Corner Radius (px)', 'headless-commerce-core' ); ?>
											</label>
											<select name="canvas_radius" style="width:100%; height:38px;">
												<option value="0" <?php selected( $data['canvas_radius'], '0' ); ?>><?php _e( '0px - Sharp Architectural', 'headless-commerce-core' ); ?></option>
												<option value="4" <?php selected( $data['canvas_radius'], '4' ); ?>><?php _e( '4px - Subtle Curve', 'headless-commerce-core' ); ?></option>
												<option value="8" <?php selected( $data['canvas_radius'], '8' ); ?>><?php _e( '8px - Modern Rounded (Standard)', 'headless-commerce-core' ); ?></option>
												<option value="12" <?php selected( $data['canvas_radius'], '12' ); ?>><?php _e( '12px - Smooth Soft Curve', 'headless-commerce-core' ); ?></option>
												<option value="16" <?php selected( $data['canvas_radius'], '16' ); ?>><?php _e( '16px - High Pill Edge', 'headless-commerce-core' ); ?></option>
											</select>
										</div>
										<div>
											<label style="font-weight:600; display:block; margin-bottom:6px; color:#1C1917;">
												<?php _e( 'Canvas Background Color', 'headless-commerce-core' ); ?>
											</label>
											<input type="text" name="canvas_bg" id="hcc_canvas_bg" class="hcc-color-field" value="<?php echo esc_attr( $data['canvas_bg'] ); ?>" data-default-color="#FFFFFF">
										</div>
									</div>

									<!-- Canvas Internal Padding & Default Fit Mode -->
									<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:18px;">
										<div>
											<label style="font-weight:600; display:block; margin-bottom:6px; color:#1C1917;">
												<?php _e( 'Internal Canvas Padding', 'headless-commerce-core' ); ?>
											</label>
											<select name="canvas_padding" style="width:100%; height:38px;">
												<option value="flush" <?php selected( $data['canvas_padding'], 'flush' ); ?>><?php _e( 'Flush (0px - Full Bleed)', 'headless-commerce-core' ); ?></option>
												<option value="compact" <?php selected( $data['canvas_padding'], 'compact' ); ?>><?php _e( 'Compact (10px)', 'headless-commerce-core' ); ?></option>
												<option value="standard" <?php selected( $data['canvas_padding'], 'standard' ); ?>><?php _e( 'Standard (20px - Recommended)', 'headless-commerce-core' ); ?></option>
												<option value="spacious" <?php selected( $data['canvas_padding'], 'spacious' ); ?>><?php _e( 'Spacious (28px - Museum Matting)', 'headless-commerce-core' ); ?></option>
											</select>
										</div>
										<div>
											<label style="font-weight:600; display:block; margin-bottom:6px; color:#1C1917;">
												<?php _e( 'Default Object Fit Mode', 'headless-commerce-core' ); ?>
											</label>
											<select name="default_fit_mode" style="width:100%; height:38px;">
												<option value="contain" <?php selected( $data['default_fit_mode'], 'contain' ); ?>><?php _e( 'Contain (Show Full Piece)', 'headless-commerce-core' ); ?></option>
												<option value="cover" <?php selected( $data['default_fit_mode'], 'cover' ); ?>><?php _e( 'Cover (Fill Entire Frame)', 'headless-commerce-core' ); ?></option>
											</select>
										</div>
									</div>

									<!-- Interactive Controls Toggles -->
									<div style="background:#FAF8F5; border:1px solid #ECE7DE; border-radius:6px; padding:14px; margin-top:14px;">
										<h4 style="margin:0 0 10px; font-size:13px; text-transform:uppercase; letter-spacing:0.06em; color:#78716C;">
											<?php _e( 'Interactive Canvas Overlays & Controls', 'headless-commerce-core' ); ?>
										</h4>
										<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
											<label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
												<input type="checkbox" name="enable_hover_zoom" value="yes" <?php checked( $data['enable_hover_zoom'], 'yes' ); ?>>
												<span><?php _e( 'Enable Cursor Hover Zoom', 'headless-commerce-core' ); ?></span>
											</label>
											<label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
												<input type="checkbox" name="show_fit_toggle" value="yes" <?php checked( $data['show_fit_toggle'], 'yes' ); ?>>
												<span><?php _e( 'Show "Fill / Full" Mode Toggle Pill', 'headless-commerce-core' ); ?></span>
											</label>
											<label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
												<input type="checkbox" name="show_expand_hint" value="yes" <?php checked( $data['show_expand_hint'], 'yes' ); ?>>
												<span><?php _e( 'Show "Expand View" Lightbox Pill', 'headless-commerce-core' ); ?></span>
											</label>
											<label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
												<input type="checkbox" name="show_counter_badge" value="yes" <?php checked( $data['show_counter_badge'], 'yes' ); ?>>
												<span><?php _e( 'Show Image Counter (e.g. 1 / 4)', 'headless-commerce-core' ); ?></span>
											</label>
										</div>
									</div>

								</div>
							</div>
						</div>

						<!-- TAB 2: THUMBNAILS STRIP -->
						<div id="tab-thumbs" class="hcc-tab-content">
							<div class="postbox" style="box-shadow:0 1px 3px rgba(0,0,0,0.06); border-radius:6px; overflow:hidden;">
								<div class="postbox-header" style="background:#FAF8F5; border-bottom:1px solid #ECE7DE; padding:12px 18px;">
									<h2 class="hndle" style="margin:0; font-size:15px; font-weight:600; color:#1C1917;">
										<?php _e( 'Thumbnail Strip & Gallery Navigation', 'headless-commerce-core' ); ?>
									</h2>
								</div>
								<div class="inside" style="padding:18px;">

									<!-- Thumbnail Border -->
									<div class="hcc-field-row" style="margin-bottom:18px;">
										<label style="font-weight:600; display:block; margin-bottom:6px; color:#1C1917;">
											<?php _e( 'Thumbnail Border', 'headless-commerce-core' ); ?>
										</label>
										<div class="hcc-radio-cards" style="display:flex; gap:12px;">
											<label style="flex:1; border:1px solid #DDD; padding:10px; border-radius:6px; cursor:pointer; background:#FFF;">
												<input type="radio" name="thumb_border" value="none" <?php checked( $data['thumb_border'], 'none' ); ?>>
												<strong><?php _e( 'None (Border-Free)', 'headless-commerce-core' ); ?></strong>
												<div style="font-size:12px; color:#666;"><?php _e( 'Clean borderless thumbnails', 'headless-commerce-core' ); ?></div>
											</label>
											<label style="flex:1; border:1px solid #DDD; padding:10px; border-radius:6px; cursor:pointer; background:#FFF;">
												<input type="radio" name="thumb_border" value="subtle" <?php checked( $data['thumb_border'], 'subtle' ); ?>>
												<strong><?php _e( 'Subtle 1px Line', 'headless-commerce-core' ); ?></strong>
												<div style="font-size:12px; color:#666;"><?php _e( 'Refined light gray outline', 'headless-commerce-core' ); ?></div>
											</label>
											<label style="flex:1; border:1px solid #DDD; padding:10px; border-radius:6px; cursor:pointer; background:#FFF;">
												<input type="radio" name="thumb_border" value="accent" <?php checked( $data['thumb_border'], 'accent' ); ?>>
												<strong><?php _e( 'Accent Active Line', 'headless-commerce-core' ); ?></strong>
												<div style="font-size:12px; color:#666;"><?php _e( 'Active brand outline on selection', 'headless-commerce-core' ); ?></div>
											</label>
										</div>
									</div>

									<!-- Thumbnail Shadow -->
									<div class="hcc-field-row" style="margin-bottom:18px;">
										<label style="font-weight:600; display:block; margin-bottom:6px; color:#1C1917;">
											<?php _e( 'Thumbnail Elevation Shadow', 'headless-commerce-core' ); ?>
										</label>
										<div class="hcc-radio-cards" style="display:flex; gap:12px;">
											<label style="flex:1; border:1px solid #DDD; padding:10px; border-radius:6px; cursor:pointer; background:#FFF;">
												<input type="radio" name="thumb_shadow" value="none" <?php checked( $data['thumb_shadow'], 'none' ); ?>>
												<strong><?php _e( 'None (Flat)', 'headless-commerce-core' ); ?></strong>
												<div style="font-size:12px; color:#666;"><?php _e( 'No shadow on unselected or hover', 'headless-commerce-core' ); ?></div>
											</label>
											<label style="flex:1; border:1px solid #DDD; padding:10px; border-radius:6px; cursor:pointer; background:#FFF;">
												<input type="radio" name="thumb_shadow" value="subtle" <?php checked( $data['thumb_shadow'], 'subtle' ); ?>>
												<strong><?php _e( 'Soft Hover Lift', 'headless-commerce-core' ); ?></strong>
												<div style="font-size:12px; color:#666;"><?php _e( 'Subtle soft shadow on active/hover', 'headless-commerce-core' ); ?></div>
											</label>
										</div>
									</div>

									<!-- Thumbnail Size, Corner Radius, and Inactive Opacity -->
									<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px;">
										<div>
											<label style="font-weight:600; display:block; margin-bottom:6px; color:#1C1917;">
												<?php _e( 'Thumbnail Size', 'headless-commerce-core' ); ?>
											</label>
											<select name="thumb_size" style="width:100%; height:38px;">
												<option value="compact" <?php selected( $data['thumb_size'], 'compact' ); ?>><?php _e( 'Compact (64px × 64px)', 'headless-commerce-core' ); ?></option>
												<option value="standard" <?php selected( $data['thumb_size'], 'standard' ); ?>><?php _e( 'Standard (76px × 76px)', 'headless-commerce-core' ); ?></option>
												<option value="large" <?php selected( $data['thumb_size'], 'large' ); ?>><?php _e( 'Large (88px × 88px)', 'headless-commerce-core' ); ?></option>
											</select>
										</div>
										<div>
											<label style="font-weight:600; display:block; margin-bottom:6px; color:#1C1917;">
												<?php _e( 'Corner Radius', 'headless-commerce-core' ); ?>
											</label>
											<select name="thumb_radius" style="width:100%; height:38px;">
												<option value="0" <?php selected( $data['thumb_radius'], '0' ); ?>><?php _e( '0px - Sharp', 'headless-commerce-core' ); ?></option>
												<option value="4" <?php selected( $data['thumb_radius'], '4' ); ?>><?php _e( '4px - Subtle Curve', 'headless-commerce-core' ); ?></option>
												<option value="6" <?php selected( $data['thumb_radius'], '6' ); ?>><?php _e( '6px - Standard', 'headless-commerce-core' ); ?></option>
												<option value="8" <?php selected( $data['thumb_radius'], '8' ); ?>><?php _e( '8px - Rounded', 'headless-commerce-core' ); ?></option>
											</select>
										</div>
										<div>
											<label style="font-weight:600; display:block; margin-bottom:6px; color:#1C1917;">
												<?php _e( 'Inactive Opacity', 'headless-commerce-core' ); ?>
											</label>
											<select name="thumb_opacity" style="width:100%; height:38px;">
												<option value="0.50" <?php selected( $data['thumb_opacity'], '0.50' ); ?>>50% Dimmed</option>
												<option value="0.65" <?php selected( $data['thumb_opacity'], '0.65' ); ?>>65% Subtle (Standard)</option>
												<option value="0.80" <?php selected( $data['thumb_opacity'], '0.80' ); ?>>80% Clear</option>
												<option value="1.0" <?php selected( $data['thumb_opacity'], '1.0' ); ?>>100% Solid Full</option>
											</select>
										</div>
									</div>

								</div>
							</div>
						</div>

						<!-- TAB 3: CONTENT & BADGES -->
						<div id="tab-content" class="hcc-tab-content">
							<div class="postbox" style="box-shadow:0 1px 3px rgba(0,0,0,0.06); border-radius:6px; overflow:hidden;">
								<div class="postbox-header" style="background:#FAF8F5; border-bottom:1px solid #ECE7DE; padding:12px 18px;">
									<h2 class="hndle" style="margin:0; font-size:15px; font-weight:600; color:#1C1917;">
										<?php _e( 'Product Details, Badges & Technical Specs', 'headless-commerce-core' ); ?>
									</h2>
								</div>
								<div class="inside" style="padding:18px;">

									<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
										<label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
											<input type="checkbox" name="show_made_to_order" value="yes" <?php checked( $data['show_made_to_order'], 'yes' ); ?>>
											<span><?php _e( 'Show "Made-To-Order" Badge', 'headless-commerce-core' ); ?></span>
										</label>
										<label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
											<input type="checkbox" name="show_sku" value="yes" <?php checked( $data['show_sku'], 'yes' ); ?>>
											<span><?php _e( 'Show SKU / Product Code Pill', 'headless-commerce-core' ); ?></span>
										</label>
										<label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
											<input type="checkbox" name="show_category_meta" value="yes" <?php checked( $data['show_category_meta'], 'yes' ); ?>>
											<span><?php _e( 'Show Category Breadcrumb Line', 'headless-commerce-core' ); ?></span>
										</label>
										<label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
											<input type="checkbox" name="show_moq" value="yes" <?php checked( $data['show_moq'], 'yes' ); ?>>
											<span><?php _e( 'Show Minimum Order Qty (MOQ)', 'headless-commerce-core' ); ?></span>
										</label>
										<label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
											<input type="checkbox" name="show_lead_time" value="yes" <?php checked( $data['show_lead_time'], 'yes' ); ?>>
											<span><?php _e( 'Show Production Lead Time Pill', 'headless-commerce-core' ); ?></span>
										</label>
										<label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
											<input type="checkbox" name="show_specs_table" value="yes" <?php checked( $data['show_specs_table'], 'yes' ); ?>>
											<span><?php _e( 'Show Specifications Table (Dimensions, Packing)', 'headless-commerce-core' ); ?></span>
										</label>
										<label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
											<input type="checkbox" name="show_trust_badges" value="yes" <?php checked( $data['show_trust_badges'], 'yes' ); ?>>
											<span><?php _e( 'Show Direct Factory Trust Badges', 'headless-commerce-core' ); ?></span>
										</label>
										<label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
											<input type="checkbox" name="show_related_products" value="yes" <?php checked( $data['show_related_products'], 'yes' ); ?>>
											<span><?php _e( 'Show Related Products Carousel', 'headless-commerce-core' ); ?></span>
										</label>
										<label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
											<input type="checkbox" name="show_recently_viewed" value="yes" <?php checked( $data['show_recently_viewed'], 'yes' ); ?>>
											<span><?php _e( 'Show Recently Viewed Carousel', 'headless-commerce-core' ); ?></span>
										</label>
									</div>

								</div>
							</div>
						</div>

						<!-- TAB 4: ACTIONS & BUTTONS -->
						<div id="tab-actions" class="hcc-tab-content">
							<div class="postbox" style="box-shadow:0 1px 3px rgba(0,0,0,0.06); border-radius:6px; overflow:hidden;">
								<div class="postbox-header" style="background:#FAF8F5; border-bottom:1px solid #ECE7DE; padding:12px 18px;">
									<h2 class="hndle" style="margin:0; font-size:15px; font-weight:600; color:#1C1917;">
										<?php _e( 'B2B Quoting Actions & Favourites Button', 'headless-commerce-core' ); ?>
									</h2>
								</div>
								<div class="inside" style="padding:18px;">

									<div class="hcc-field-row" style="margin-bottom:18px;">
										<label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:600; margin-bottom:8px;">
											<input type="checkbox" name="show_enquiry_btn" value="yes" <?php checked( $data['show_enquiry_btn'], 'yes' ); ?>>
											<span><?php _e( 'Enable Primary Project Quote Button', 'headless-commerce-core' ); ?></span>
										</label>
										<div style="margin-left:24px;">
											<label style="display:block; font-size:12px; color:#666; margin-bottom:4px;"><?php _e( 'Button Text:', 'headless-commerce-core' ); ?></label>
											<input type="text" name="enquiry_btn_text" value="<?php echo esc_attr( $data['enquiry_btn_text'] ); ?>" style="width:320px; height:36px;">
										</div>
									</div>

									<div class="hcc-field-row" style="margin-bottom:18px;">
										<label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:600;">
											<input type="checkbox" name="show_favorite_btn" value="yes" <?php checked( $data['show_favorite_btn'], 'yes' ); ?>>
											<span><?php _e( 'Show "Save to Favourites" Wishlist Button', 'headless-commerce-core' ); ?></span>
										</label>
									</div>

								</div>
							</div>
						</div>

						<!-- SUBMIT ACTIONS -->
						<div class="hcc-actions-bar" style="margin-top:20px; display:flex; gap:12px; align-items:center;">
							<button type="submit" name="hcc_save_pdp_settings" class="button button-primary button-hero" style="background:#0E5C63; border-color:#0E5C63; font-weight:600; padding:4px 24px;">
								<span class="dashicons dashicons-saved" style="vertical-align:middle; margin-right:4px;"></span>
								<?php _e( 'Save & Apply to Storefront', 'headless-commerce-core' ); ?>
							</button>

							<button type="submit" name="hcc_reset_pdp_settings" class="button button-secondary" onclick="return confirm('Reset all Single Product Page design options to system defaults?');">
								<?php _e( 'Reset to Defaults', 'headless-commerce-core' ); ?>
							</button>

							<a href="<?php echo esc_url( $frontend_url . '/product/thar-mirror' ); ?>" target="_blank" class="button button-link" style="color:#0E5C63; text-decoration:none;">
								<?php _e( 'Preview in New Tab ↗', 'headless-commerce-core' ); ?>
							</a>
						</div>
					</form>
				</div>

				<!-- RIGHT COLUMN: INTERACTIVE LIVE PREVIEW -->
				<div class="hcc-preview-column" style="position:sticky; top:40px;">
					<div class="postbox" style="box-shadow:0 2px 8px rgba(0,0,0,0.08); border-radius:8px; overflow:hidden; border:1px solid #ECE7DE;">
						<div class="postbox-header" style="background:#FAF8F5; border-bottom:1px solid #ECE7DE; padding:12px 18px; display:flex; align-items:center; justify-content:space-between;">
							<h3 style="margin:0; font-size:14px; font-weight:600; color:#1C1917;">
								<span class="dashicons dashicons-visibility" style="vertical-align:middle; margin-right:4px; color:#0E5C63;"></span>
								<?php _e( 'Live PDP Visual Preview', 'headless-commerce-core' ); ?>
							</h3>
							<span style="font-size:11px; background:#ECE7DE; color:#444; padding:2px 8px; border-radius:999px; font-weight:600;">Live Interactive</span>
						</div>

						<div class="inside" style="padding:18px; background:#F8F6F0;">
							<!-- PREVIEW CANVAS -->
							<div id="pdp-preview-canvas" style="
								position:relative;
								width:100%;
								aspect-ratio:1 / 1;
								background:<?php echo esc_attr( $data['canvas_bg'] ); ?>;
								border-radius:<?php echo esc_attr( $data['canvas_radius'] ); ?>px;
								overflow:hidden;
								display:flex;
								align-items:center;
								justify-content:center;
								transition:all 0.25s ease;
								<?php
								if ( 'solid' === $data['canvas_border'] ) {
									echo 'border: 1.5px solid #D5CEC2;';
								} elseif ( 'subtle' === $data['canvas_border'] ) {
									echo 'border: 1px solid #E2DDD5;';
								} else {
									echo 'border: none;';
								}
								if ( 'elevated' === $data['canvas_shadow'] ) {
									echo 'box-shadow: 0 6px 24px rgba(0,0,0,0.08);';
								} elseif ( 'subtle' === $data['canvas_shadow'] ) {
									echo 'box-shadow: 0 2px 14px rgba(0,0,0,0.04);';
								} else {
									echo 'box-shadow: none;';
								}
								?>
							">
								<!-- Counter Badge -->
								<div id="pdp-preview-counter" style="position:absolute; top:10px; right:10px; background:rgba(255,255,255,0.9); font-size:10px; font-family:monospace; padding:3px 8px; border-radius:999px; border:1px solid rgba(0,0,0,0.08); display:<?php echo 'yes' === $data['show_counter_badge'] ? 'block' : 'none'; ?>;">
									1 / <?php echo count( $preview_thumbs ); ?>
								</div>

								<!-- Image -->
								<img id="pdp-preview-img" src="<?php echo esc_url( $preview_img_url ); ?>" alt="Preview" style="
									max-width:100%;
									max-height:100%;
									object-fit:<?php echo esc_attr( $data['default_fit_mode'] ); ?>;
									display:block;
								">

								<!-- Fit Toggle Pill -->
								<div id="pdp-preview-fit-pill" style="position:absolute; bottom:10px; left:10px; background:rgba(255,255,255,0.92); font-size:10px; font-family:monospace; padding:4px 8px; border-radius:999px; border:1px solid rgba(0,0,0,0.08); display:<?php echo 'yes' === $data['show_fit_toggle'] ? 'block' : 'none'; ?>;">
									Full Piece
								</div>

								<!-- Expand Hint Pill -->
								<div id="pdp-preview-expand-pill" style="position:absolute; bottom:10px; right:10px; background:rgba(255,255,255,0.92); font-size:10px; font-family:monospace; padding:4px 8px; border-radius:999px; border:1px solid rgba(0,0,0,0.08); display:<?php echo 'yes' === $data['show_expand_hint'] ? 'block' : 'none'; ?>;">
									Expand
								</div>
							</div>

							<!-- THUMBNAILS STRIP PREVIEW -->
							<div id="pdp-preview-thumbs" style="display:flex; gap:8px; margin-top:12px; overflow-x:auto;">
								<?php foreach ( $preview_thumbs as $tidx => $turl ) : ?>
									<div class="pdp-preview-thumb-item <?php echo 0 === $tidx ? 'active' : ''; ?>" style="
										width:<?php echo 'compact' === $data['thumb_size'] ? '52px' : ( 'large' === $data['thumb_size'] ? '68px' : '58px' ); ?>;
										height:<?php echo 'compact' === $data['thumb_size'] ? '52px' : ( 'large' === $data['thumb_size'] ? '68px' : '58px' ); ?>;
										border-radius:<?php echo esc_attr( $data['thumb_radius'] ); ?>px;
										background:#FFFFFF;
										overflow:hidden;
										display:flex;
										align-items:center;
										justify-content:center;
										padding:3px;
										opacity:<?php echo 0 === $tidx ? '1' : esc_attr( $data['thumb_opacity'] ); ?>;
										transition:all 0.2s ease;
										<?php
										if ( 0 === $tidx && 'accent' === $data['thumb_border'] ) {
											echo 'border: 1.5px solid #0E5C63;';
										} elseif ( 'subtle' === $data['thumb_border'] ) {
											echo 'border: 1px solid #E2DDD5;';
										} else {
											echo 'border: none;';
										}
										?>
									">
										<img src="<?php echo esc_url( $turl ); ?>" style="width:100%; height:100%; object-fit:contain;">
									</div>
								<?php endforeach; ?>
							</div>

							<!-- PRODUCT INFO PREVIEW -->
							<div style="margin-top:14px; padding-top:12px; border-top:1px solid #E5E0D8;">
								<div id="pdp-preview-meta" style="font-size:11px; color:#888; font-family:monospace; margin-bottom:4px; display:<?php echo 'yes' === $data['show_category_meta'] ? 'block' : 'none'; ?>;">
									<?php echo esc_html( $preview_cat ); ?> · <?php echo esc_html( $preview_sku ); ?>
								</div>
								<h4 style="margin:0 0 6px; font-size:15px; color:#1C1917; font-family:Georgia,serif; font-weight:400;">
									<?php echo esc_html( $preview_title ); ?>
								</h4>
								<div id="pdp-preview-mto" style="display:<?php echo 'yes' === $data['show_made_to_order'] ? 'inline-block' : 'none'; ?>; font-size:10px; font-weight:600; text-transform:uppercase; background:#ECE7DE; color:#555; padding:2px 8px; border-radius:4px; margin-bottom:10px;">
									Made-To-Order
								</div>
								<div id="pdp-preview-enquiry-btn" style="display:<?php echo 'yes' === $data['show_enquiry_btn'] ? 'block' : 'none'; ?>; margin-top:8px;">
									<div style="background:#0E5C63; color:#FFF; text-align:center; padding:9px 12px; border-radius:6px; font-size:12px; font-weight:600;">
										<?php echo esc_html( $data['enquiry_btn_text'] ); ?>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

			</div>
		</div>

		<style>
		.hcc-tabs .nav-tab {
			border-radius: 6px 6px 0 0;
			font-weight: 500;
			padding: 8px 16px;
			color: #444;
		}
		.hcc-tabs .nav-tab-active {
			background: #FFFFFF;
			color: #0E5C63;
			border-bottom-color: #FFFFFF;
			font-weight: 600;
		}
		.hcc-tab-content {
			display: none;
		}
		.hcc-tab-content.active-tab {
			display: block;
		}
		.hcc-radio-cards label:hover {
			border-color: #0E5C63 !important;
		}
		.hcc-radio-cards input[type="radio"]:checked + strong {
			color: #0E5C63;
		}
		</style>

		<script>
		jQuery(document).ready(function($) {
			// Tab Navigation
			$('.hcc-tabs .nav-tab').on('click', function(e) {
				e.preventDefault();
				$('.hcc-tabs .nav-tab').removeClass('nav-tab-active');
				$(this).addClass('nav-tab-active');
				$('.hcc-tab-content').removeClass('active-tab');
				var target = $(this).attr('data-tab');
				$('#' + target).addClass('active-tab');
			});

			// Initialize Color Pickers
			$('.hcc-color-field').wpColorPicker({
				change: function(event, ui) {
					$('#pdp-preview-canvas').css('background', ui.color.toString());
				}
			});

			// Realtime Preview Sync
			function updatePreview() {
				// Canvas Border
				var cBorder = $('input[name="canvas_border"]:checked').val();
				if (cBorder === 'solid') {
					$('#pdp-preview-canvas').css('border', '1.5px solid #D5CEC2');
				} else if (cBorder === 'subtle') {
					$('#pdp-preview-canvas').css('border', '1px solid #E2DDD5');
				} else {
					$('#pdp-preview-canvas').css('border', 'none');
				}

				// Canvas Shadow
				var cShadow = $('input[name="canvas_shadow"]:checked').val();
				if (cShadow === 'elevated') {
					$('#pdp-preview-canvas').css('box-shadow', '0 6px 24px rgba(0,0,0,0.08)');
				} else if (cShadow === 'subtle') {
					$('#pdp-preview-canvas').css('box-shadow', '0 2px 14px rgba(0,0,0,0.04)');
				} else {
					$('#pdp-preview-canvas').css('box-shadow', 'none');
				}

				// Canvas Radius
				var cRadius = $('select[name="canvas_radius"]').val();
				$('#pdp-preview-canvas').css('border-radius', cRadius + 'px');

				// Fit Mode
				var fitMode = $('select[name="default_fit_mode"]').val();
				$('#pdp-preview-img').css('object-fit', fitMode);

				// Canvas Controls
				$('#pdp-preview-counter').toggle($('input[name="show_counter_badge"]').is(':checked'));
				$('#pdp-preview-fit-pill').toggle($('input[name="show_fit_toggle"]').is(':checked'));
				$('#pdp-preview-expand-pill').toggle($('input[name="show_expand_hint"]').is(':checked'));

				// Thumbnails Border
				var tBorder = $('input[name="thumb_border"]:checked').val();
				$('.pdp-preview-thumb-item').each(function(i) {
					if (i === 0 && tBorder === 'accent') {
						$(this).css('border', '1.5px solid #0E5C63');
					} else if (tBorder === 'subtle') {
						$(this).css('border', '1px solid #E2DDD5');
					} else {
						$(this).css('border', 'none');
					}
				});

				// Thumbnail Radius
				var tRadius = $('select[name="thumb_radius"]').val();
				$('.pdp-preview-thumb-item').css('border-radius', tRadius + 'px');

				// Thumbnail Opacity
				var tOpacity = $('select[name="thumb_opacity"]').val();
				$('.pdp-preview-thumb-item:not(.active)').css('opacity', tOpacity);

				// Content Toggles
				$('#pdp-preview-mto').toggle($('input[name="show_made_to_order"]').is(':checked'));
				$('#pdp-preview-meta').toggle($('input[name="show_category_meta"]').is(':checked'));
				$('#pdp-preview-enquiry-btn').toggle($('input[name="show_enquiry_btn"]').is(':checked'));
				$('#pdp-preview-enquiry-btn div').text($('input[name="enquiry_btn_text"]').val() || '+ Add to Project Quote');
			}

			$('input, select').on('change input', updatePreview);
		});
		</script>
		<?php
	}
}
