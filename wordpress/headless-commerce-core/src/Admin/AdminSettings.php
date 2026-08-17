<?php

namespace HeadlessCommerceCore\Admin;

use HeadlessCommerceCore\Core\StoreMode;
use HeadlessCommerceCore\SEO\RankMath\RankMathAdapter;
use HeadlessCommerceCore\SEO\Yoast\YoastAdapter;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * WordPress Admin Settings UI & WooCommerce Custom Meta Boxes
 */
class AdminSettings {

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_admin_menu' ), 5 );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
		add_action( 'add_meta_boxes', array( __CLASS__, 'add_product_attributes_metabox' ) );
		add_action( 'save_post_product', array( __CLASS__, 'save_product_attributes_metabox' ) );
		ColorPickerManager::init();
	}

	public static function add_admin_menu() {
		add_menu_page(
			__( 'Headless Commerce', 'headless-commerce-core' ),
			__( 'Headless Commerce', 'headless-commerce-core' ),
			'manage_options',
			'headless-commerce-core',
			array( __CLASS__, 'render_admin_page' ),
			'dashicons-cart',
			58
		);

		add_submenu_page(
			'headless-commerce-core',
			__( 'General Settings', 'headless-commerce-core' ),
			__( 'General Settings', 'headless-commerce-core' ),
			'manage_options',
			'headless-commerce-core',
			array( __CLASS__, 'render_admin_page' )
		);
	}

	public static function register_settings() {
		register_setting( 'hcc_options_group', 'hcc_store_mode' );
		register_setting( 'hcc_options_group', 'hcc_frontend_url' );
		register_setting( 'hcc_options_group', 'hcc_revalidate_url' );
		register_setting( 'hcc_options_group', 'hcc_revalidate_secret' );
		register_setting( 'hcc_options_group', 'hcc_fallback_image' );
	}

	public static function add_product_attributes_metabox() {
		add_meta_box(
			'hcc_product_attributes_box',
			__( 'Storefront Specifications & Attributes', 'headless-commerce-core' ),
			array( __CLASS__, 'render_product_attributes_metabox' ),
			'product',
			'side',
			'default'
		);
	}

	public static function render_product_attributes_metabox( $post ) {
		$badge     = get_post_meta( $post->ID, '_badge', true ) ?: 'none';
		$color     = get_post_meta( $post->ID, '_color', true ) ?: 'Natural Oil';
		$material  = get_post_meta( $post->ID, '_material', true ) ?: 'Solid Teak';
		$segment   = get_post_meta( $post->ID, '_segment', true ) ?: 'Hotel Guestroom';
		$moq       = get_post_meta( $post->ID, '_moq', true ) ?: '1';
		$lead_time = get_post_meta( $post->ID, '_lead_time', true ) ?: '21';
		$dims      = get_post_meta( $post->ID, '_dimensions_text', true ) ?: 'Customisable';

		$colors = array(
			'Natural Oil', 'Walnut Stain', 'Ebony Matt', 'Antique Brass',
			'Bone White', 'Forest Lacquer', 'Terracotta PU', 'Graphite Metal',
		);

		$material2      = get_post_meta( $post->ID, '_material2', true ) ?: 'Brass Detailing';
		$packing        = get_post_meta( $post->ID, '_packing_text', true ) ?: 'Export-grade carton, knock-down where possible';
		$lead_time_text = get_post_meta( $post->ID, '_lead_time_text', true ) ?: '30 working days after sample approval';
		$price_note     = get_post_meta( $post->ID, '_price_note', true ) ?: 'Quoted to your spec & quantity';

		$materials = array(
			'Solid Sheesham', 'Solid Teak', 'Solid Mango', 'Solid Acacia', 'Engineered Panel', 'MS / Powder Coated Metal',
			'Brass & Bronze', 'Stainless Steel', 'Bone Inlay', 'Marble & Stone', 'Terrazzo', 'Cane & Rattan', 'Rope Weave', 'Resin',
			'Tile Inlay', 'Hand Carving', 'Upholstery Fabric', 'Genuine Leather', 'Vegan Leather', 'Glass', 'Reclaimed Wood',
		);

		$segments = array(
			'Hotel Guestroom', 'Hotel Lobby', 'Restaurant', 'Café', 'Bar & Nightclub', 'Banquet & Events',
			'Resort & Villa', 'Corporate Office', 'Co-working', 'Retail Store', 'Healthcare', 'Education', 'Residential',
			'Outdoor & Poolside', 'Airport & Transit', 'Export / Wholesale',
		);

		?>
		<div style="display:flex; flex-direction:column; gap:12px; margin-top:4px;">
			<div>
				<label style="font-weight:600; font-size:12px; display:block; margin-bottom:4px;">Product Badge:</label>
				<select name="hcc_product_badge" style="width:100%;">
					<option value="none" <?php selected( $badge, 'none' ); ?>>None (No Badge)</option>
					<option value="Export Ready" <?php selected( $badge, 'Export Ready' ); ?>>Export Ready</option>
					<option value="Best Seller" <?php selected( $badge, 'Best Seller' ); ?>>Best Seller</option>
					<option value="New" <?php selected( $badge, 'New' ); ?>>New</option>
					<option value="Featured" <?php selected( $badge, 'Featured' ); ?>>Featured</option>
				</select>
			</div>

			<div>
				<label style="font-weight:600; font-size:12px; display:block; margin-bottom:4px;">Primary Material / Craft:</label>
				<select name="hcc_product_material" style="width:100%;">
					<?php foreach ( $materials as $m ) : ?>
						<option value="<?php echo esc_attr( $m ); ?>" <?php selected( $material, $m ); ?>><?php echo esc_html( $m ); ?></option>
					<?php endforeach; ?>
				</select>
			</div>

			<div>
				<label style="font-weight:600; font-size:12px; display:block; margin-bottom:4px;">Secondary / Detail Material:</label>
				<input type="text" name="hcc_product_material2" value="<?php echo esc_attr( $material2 ); ?>" style="width:100%;" placeholder="e.g. Brass Detailing, Vegan Leather, Cane" />
			</div>

			<div>
				<label style="font-weight:600; font-size:12px; display:block; margin-bottom:4px;">Target Space / Segment:</label>
				<select name="hcc_product_segment" style="width:100%;">
					<?php foreach ( $segments as $s ) : ?>
						<option value="<?php echo esc_attr( $s ); ?>" <?php selected( $segment, $s ); ?>><?php echo esc_html( $s ); ?></option>
					<?php endforeach; ?>
				</select>
			</div>

			<div>
				<label style="font-weight:600; font-size:12px; display:block; margin-bottom:4px;">Minimum Order (MOQ):</label>
				<input type="number" name="hcc_product_moq" value="<?php echo esc_attr( $moq ); ?>" style="width:100%;" min="1" />
			</div>

			<div>
				<label style="font-weight:600; font-size:12px; display:block; margin-bottom:4px;">Lead Time (Days):</label>
				<input type="number" name="hcc_product_lead_time" value="<?php echo esc_attr( $lead_time ); ?>" style="width:100%;" min="1" />
			</div>

			<div>
				<label style="font-weight:600; font-size:12px; display:block; margin-bottom:4px;">Lead Time Note Text:</label>
				<input type="text" name="hcc_product_lead_time_text" value="<?php echo esc_attr( $lead_time_text ); ?>" style="width:100%;" placeholder="e.g. 30 working days after sample approval" />
			</div>

			<div>
				<label style="font-weight:600; font-size:12px; display:block; margin-bottom:4px;">Dimensions Text (W × D × H):</label>
				<input type="text" name="hcc_product_dims" value="<?php echo esc_attr( $dims ); ?>" style="width:100%;" placeholder="e.g. 58 × 62 × 78 cm — customisable" />
			</div>

			<div>
				<label style="font-weight:600; font-size:12px; display:block; margin-bottom:4px;">Packing Specification:</label>
				<input type="text" name="hcc_product_packing" value="<?php echo esc_attr( $packing ); ?>" style="width:100%;" placeholder="e.g. Export-grade carton, knock-down where possible" />
			</div>

			<div>
				<label style="font-weight:600; font-size:12px; display:block; margin-bottom:4px;">Price Note Text:</label>
				<input type="text" name="hcc_product_price_note" value="<?php echo esc_attr( $price_note ); ?>" style="width:100%;" placeholder="e.g. Quoted to your spec & quantity" />
			</div>
		</div>
		<?php
	}

	public static function save_product_attributes_metabox( $post_id ) {
		if ( isset( $_POST['hcc_product_badge'] ) ) {
			update_post_meta( $post_id, '_badge', sanitize_text_field( $_POST['hcc_product_badge'] ) );
		}
		if ( isset( $_POST['hcc_product_material'] ) ) {
			$material = sanitize_text_field( $_POST['hcc_product_material'] );
			update_post_meta( $post_id, '_material', $material );
			if ( taxonomy_exists( 'pa_material' ) ) {
				wp_set_object_terms( $post_id, $material, 'pa_material' );
			}
		}
		if ( isset( $_POST['hcc_product_material2'] ) ) {
			update_post_meta( $post_id, '_material2', sanitize_text_field( $_POST['hcc_product_material2'] ) );
		}
		if ( isset( $_POST['hcc_product_segment'] ) ) {
			$segment = sanitize_text_field( $_POST['hcc_product_segment'] );
			update_post_meta( $post_id, '_segment', $segment );
			if ( taxonomy_exists( 'pa_segment' ) ) {
				wp_set_object_terms( $post_id, $segment, 'pa_segment' );
			}
		}
		if ( isset( $_POST['hcc_product_moq'] ) ) {
			update_post_meta( $post_id, '_moq', (int) $_POST['hcc_product_moq'] );
		}
		if ( isset( $_POST['hcc_product_lead_time'] ) ) {
			update_post_meta( $post_id, '_lead_time', (int) $_POST['hcc_product_lead_time'] );
		}
		if ( isset( $_POST['hcc_product_lead_time_text'] ) ) {
			update_post_meta( $post_id, '_lead_time_text', sanitize_text_field( $_POST['hcc_product_lead_time_text'] ) );
		}
		if ( isset( $_POST['hcc_product_dims'] ) ) {
			update_post_meta( $post_id, '_dimensions_text', sanitize_text_field( $_POST['hcc_product_dims'] ) );
		}
		if ( isset( $_POST['hcc_product_packing'] ) ) {
			update_post_meta( $post_id, '_packing_text', sanitize_text_field( $_POST['hcc_product_packing'] ) );
		}
		if ( isset( $_POST['hcc_product_price_note'] ) ) {
			update_post_meta( $post_id, '_price_note', sanitize_text_field( $_POST['hcc_product_price_note'] ) );
		}
	}

	public static function get_default_fallback_image_url() {
		$custom = get_option( 'hcc_fallback_image', '' );
		if ( ! empty( $custom ) ) {
			return $custom;
		}
		if ( defined( 'HCC_PLUGIN_URL' ) ) {
			return HCC_PLUGIN_URL . 'assets/fallback-product.svg';
		}
		return plugins_url( 'assets/fallback-product.svg', dirname( __DIR__ ) );
	}

	public static function render_admin_page() {
		if ( isset( $_POST['hcc_submit_admin'] ) && check_admin_referer( 'hcc_save_settings', 'hcc_nonce' ) ) {
			if ( isset( $_POST['hcc_store_mode'] ) ) {
				StoreMode::set_mode( sanitize_text_field( $_POST['hcc_store_mode'] ) );
			}
			if ( isset( $_POST['hcc_frontend_url'] ) ) {
				update_option( 'hcc_frontend_url', esc_url_raw( $_POST['hcc_frontend_url'] ) );
			}
			if ( isset( $_POST['hcc_revalidate_url'] ) ) {
				update_option( 'hcc_revalidate_url', esc_url_raw( $_POST['hcc_revalidate_url'] ) );
			}
			if ( isset( $_POST['hcc_revalidate_secret'] ) ) {
				update_option( 'hcc_revalidate_secret', sanitize_text_field( $_POST['hcc_revalidate_secret'] ) );
			}
			if ( isset( $_POST['hcc_fallback_image'] ) ) {
				update_option( 'hcc_fallback_image', esc_url_raw( $_POST['hcc_fallback_image'] ) );
			}
			echo '<div class="notice notice-success is-dismissible"><p>Settings updated successfully!</p></div>';
		}

		$current_mode  = StoreMode::get_current_mode();
		$frontend_url  = get_option( 'hcc_frontend_url', 'http://localhost:3000' );
		$reval_url     = get_option( 'hcc_revalidate_url', '' );
		$reval_secret  = get_option( 'hcc_revalidate_secret', '' );
		$fallback_img  = get_option( 'hcc_fallback_image', '' );
		$effective_img = self::get_default_fallback_image_url();

		$seo_provider = 'Native WordPress/WooCommerce';
		if ( RankMathAdapter::is_active() ) {
			$seo_provider = 'Rank Math SEO';
		} elseif ( YoastAdapter::is_active() ) {
			$seo_provider = 'Yoast SEO';
		}

		?>
		<div class="wrap">
			<h1>Headless Commerce Core Configuration</h1>
			<hr />
			<div style="display: flex; gap: 20px; margin-top: 20px;">
				<div style="flex: 2; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ccd0d4;">
					<h2>Store & API Settings</h2>
					<form method="post" action="">
						<?php wp_nonce_field( 'hcc_save_settings', 'hcc_nonce' ); ?>
						<table class="form-table">
							<tr>
								<th scope="row"><label for="hcc_store_mode">Store Mode</label></th>
								<td>
									<select name="hcc_store_mode" id="hcc_store_mode" class="regular-text" style="font-weight:600;">
										<option value="HEADLESS_CATALOG" <?php selected( $current_mode, 'HEADLESS_CATALOG' ); ?>>HEADLESS_CATALOG (B2B Quoting Catalog — No Prices, No Checkout, Enquiry Flow)</option>
										<option value="CATALOG" <?php selected( $current_mode, 'CATALOG' ); ?>>CATALOG (Native WP/Woo B2B Catalog — No Prices, No Checkout)</option>
										<option value="HEADLESS_STORE" <?php selected( $current_mode, 'HEADLESS_STORE' ); ?>>HEADLESS_STORE (Next.js Storefront + Direct Checkout & Pricing)</option>
										<option value="FULL_STORE" <?php selected( $current_mode, 'FULL_STORE' ); ?>>FULL_STORE (Native WordPress + WooCommerce Store with Checkout)</option>
									</select>
									<p class="description">Select how your WooCommerce store operates. In Catalog modes, prices, checkout pages, and payment gateways are completely disabled in favor of B2B line-item quote requests.</p>
								</td>
							</tr>
							<tr>
								<th scope="row"><label for="hcc_frontend_url">Next.js Frontend URL</label></th>
								<td>
									<input type="url" name="hcc_frontend_url" id="hcc_frontend_url" value="<?php echo esc_attr( $frontend_url ); ?>" class="regular-text" />
									<p class="description">URL of your Next.js storefront for CORS allowance.</p>
								</td>
							</tr>
							<tr>
								<th scope="row"><label for="hcc_fallback_image">Default / Fallback Product Image</label></th>
								<td>
									<input type="url" name="hcc_fallback_image" id="hcc_fallback_image" value="<?php echo esc_attr( $fallback_img ); ?>" class="regular-text" placeholder="<?php echo esc_attr( $effective_img ); ?>" />
									<p class="description">Image URL used when a product has no featured image attached. Leave blank to use the built-in Orbit Logo centered badge image.</p>
									<div style="margin-top: 10px;">
										<strong>Current Fallback Preview:</strong><br />
										<img src="<?php echo esc_url( $effective_img ); ?>" alt="Fallback Preview" style="max-width: 120px; height: auto; border: 1px solid #ddd; border-radius: 4px; margin-top: 6px;" />
									</div>
								</td>
							</tr>
							<tr>
								<th scope="row"><label for="hcc_revalidate_url">Revalidation Webhook URL</label></th>
								<td>
									<input type="url" name="hcc_revalidate_url" id="hcc_revalidate_url" value="<?php echo esc_attr( $reval_url ); ?>" class="regular-text" placeholder="https://storefront.com/api/revalidate" />
									<p class="description">Next.js webhook endpoint to purge ISR cache when products change.</p>
								</td>
							</tr>
							<tr>
								<th scope="row"><label for="hcc_revalidate_secret">Revalidation Secret</label></th>
								<td>
									<input type="text" name="hcc_revalidate_secret" id="hcc_revalidate_secret" value="<?php echo esc_attr( $reval_secret ); ?>" class="regular-text" />
								</td>
							</tr>
						</table>
						<p class="submit">
							<input type="submit" name="hcc_submit_admin" class="button button-primary" value="Save Changes" />
						</p>
					</form>
				</div>
				<div style="flex: 1; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ccd0d4;">
					<h2>System Status</h2>
					<ul>
						<li><strong>Plugin Version:</strong> <?php echo esc_html( HCC_VERSION ); ?></li>
						<li><strong>Active Store Mode:</strong> <code><?php echo esc_html( $current_mode ); ?></code></li>
						<li><strong>REST Namespace:</strong> <code>/wp-json/hcc/v1/</code></li>
						<li><strong>GraphQL Endpoint:</strong> <code>/wp-json/hcc/v1/graphql</code></li>
						<li><strong>Active SEO Engine:</strong> <?php echo esc_html( $seo_provider ); ?></li>
						<li><strong>WooCommerce Active:</strong> <?php echo class_exists( 'WooCommerce' ) ? ' Yes' : ' No'; ?></li>
					</ul>
				</div>
			</div>
		</div>
		<?php
	}
}
