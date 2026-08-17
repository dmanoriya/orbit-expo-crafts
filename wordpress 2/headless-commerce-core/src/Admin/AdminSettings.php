<?php

namespace HeadlessCommerceCore\Admin;

use HeadlessCommerceCore\Core\StoreMode;
use HeadlessCommerceCore\SEO\RankMath\RankMathAdapter;
use HeadlessCommerceCore\SEO\Yoast\YoastAdapter;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * WordPress Admin Settings UI
 */
class AdminSettings {

	public static function init(): void {
		add_action( 'admin_menu', array( __CLASS__, 'add_admin_menu' ) );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
	}

	public static function add_admin_menu(): void {
		add_menu_page(
			__( 'Headless Commerce', 'headless-commerce-core' ),
			__( 'Headless Commerce', 'headless-commerce-core' ),
			'manage_options',
			'headless-commerce-core',
			array( __CLASS__, 'render_admin_page' ),
			'dashicons-cart',
			58
		);
	}

	public static function register_settings(): void {
		register_setting( 'hcc_options_group', 'hcc_store_mode' );
		register_setting( 'hcc_options_group', 'hcc_frontend_url' );
		register_setting( 'hcc_options_group', 'hcc_revalidate_url' );
		register_setting( 'hcc_options_group', 'hcc_revalidate_secret' );
	}

	public static function render_admin_page(): void {
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
			echo '<div class="notice notice-success is-dismissible"><p>Settings updated successfully!</p></div>';
		}

		$current_mode = StoreMode::get_current_mode();
		$frontend_url = get_option( 'hcc_frontend_url', 'http://localhost:3000' );
		$reval_url    = get_option( 'hcc_revalidate_url', '' );
		$reval_secret = get_option( 'hcc_revalidate_secret', '' );

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
									<select name="hcc_store_mode" id="hcc_store_mode" class="regular-text">
										<option value="FULL_STORE" <?php selected( $current_mode, 'FULL_STORE' ); ?>>FULL_STORE (Native WordPress + WooCommerce)</option>
										<option value="CATALOG" <?php selected( $current_mode, 'CATALOG' ); ?>>CATALOG (Native WP/Woo Catalog - No Purchasing)</option>
										<option value="HEADLESS_STORE" <?php selected( $current_mode, 'HEADLESS_STORE' ); ?>>HEADLESS_STORE (Next.js Storefront + Cart + Checkout)</option>
										<option value="HEADLESS_CATALOG" <?php selected( $current_mode, 'HEADLESS_CATALOG' ); ?>>HEADLESS_CATALOG (Next.js Catalog - No Purchasing)</option>
									</select>
									<p class="description">Select how your WooCommerce store operates.</p>
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
