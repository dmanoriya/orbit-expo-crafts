<?php

namespace HeadlessCommerceCore\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class FooterManager {

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_admin_menu' ), 10 );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
	}

	public static function add_admin_menu() {
		add_submenu_page(
			'headless-commerce-core',
			'Footer & Policies Manager',
			'Footer & Policies',
			'manage_options',
			'hcc-footer-manager',
			array( __CLASS__, 'render_footer_manager_page' )
		);
	}

	public static function register_settings() {
		register_setting( 'hcc_footer_options_group', 'hcc_footer_options' );
	}

	public static function get_footer_data() {
		$defaults = array(
			// Company Info
			'footer_tagline'   => 'Bespoke contract & trade furniture handcrafted in Udaipur & Jodhpur for luxury resorts, boutique hotels and specifiers worldwide.',
			'footer_address'   => 'E-243, RIICO Industrial Area, Phase II, Udaipur, Rajasthan 313001, India',
			'footer_phone'     => '+91 98290 00000',
			'footer_email'     => 'trade@orbitexpocrafts.com',

			// Social Links
			'social_instagram' => 'https://instagram.com/orbitexpocrafts',
			'social_linkedin'  => 'https://linkedin.com/company/orbitexpocrafts',
			'social_pinterest' => 'https://pinterest.com/orbitexpocrafts',
			'social_facebook'  => 'https://facebook.com/orbitexpocrafts',
			'social_whatsapp'  => 'https://wa.me/919829000000',

			// Legal Policy Contents
			'policy_privacy'   => '<h3>1. Information Collection & Usage</h3><p>Orbit Expo Crafts respects the privacy of our architectural, design, and trade partners. We collect contact details strictly to process trade enquiries, finish sample dispatches, and CAD/3D block requests.</p><h3>2. Data Security</h3><p>Your trade details and custom project drawings are never sold, rented, or shared with third parties.</p>',
			'policy_terms'     => '<h3>1. Trade & Contract Terms</h3><p>All orders placed with Orbit Expo Crafts are manufactured to contract specifications. Production commences upon sample and CAD drawing sign-off.</p><h3>2. Minimum Order & Customization</h3><p>MOQ varies by product design. Custom dimensions, wood species, and finishes are supported across all catalog items.</p>',
			'policy_shipping'  => '<h3>1. Export & Freight Shipping</h3><p>We provide door-to-door sea container freight, air express for finish samples, and export-grade ISPM-15 fumigated wooden crate packing.</p><h3>2. Lead Times</h3><p>Standard production lead time is 30–45 working days following sample approval.</p>',
			'policy_warranty'  => '<h3>1. Structural Warranty</h3><p>All solid wood frames carry a 5-year structural warranty against manufacturing defects.</p><h3>2. Timber Seasoning</h3><p>Wood is kiln-dried to 8-12% moisture content and treated against wood-borers and termites.</p>',
		);

		$saved = get_option( 'hcc_footer_options', array() );
		return wp_parse_args( is_array( $saved ) ? $saved : array(), $defaults );
	}

	public static function render_footer_manager_page() {
		if ( isset( $_POST['hcc_footer_submit'] ) && check_admin_referer( 'hcc_footer_nonce_action', 'hcc_footer_nonce' ) ) {
			$options = array(
				'footer_tagline'   => sanitize_textarea_field( $_POST['footer_tagline'] ?? '' ),
				'footer_address'   => sanitize_textarea_field( $_POST['footer_address'] ?? '' ),
				'footer_phone'     => sanitize_text_field( $_POST['footer_phone'] ?? '' ),
				'footer_email'     => sanitize_email( $_POST['footer_email'] ?? '' ),
				'social_instagram' => esc_url_raw( $_POST['social_instagram'] ?? '' ),
				'social_linkedin'  => esc_url_raw( $_POST['social_linkedin'] ?? '' ),
				'social_pinterest' => esc_url_raw( $_POST['social_pinterest'] ?? '' ),
				'social_facebook'  => esc_url_raw( $_POST['social_facebook'] ?? '' ),
				'social_whatsapp'  => esc_url_raw( $_POST['social_whatsapp'] ?? '' ),
				'policy_privacy'   => wp_kses_post( $_POST['policy_privacy'] ?? '' ),
				'policy_terms'     => wp_kses_post( $_POST['policy_terms'] ?? '' ),
				'policy_shipping'  => wp_kses_post( $_POST['policy_shipping'] ?? '' ),
				'policy_warranty'  => wp_kses_post( $_POST['policy_warranty'] ?? '' ),
			);

			update_option( 'hcc_footer_options', $options );
			echo '<div class="updated"><p><strong>Footer & Legal Policy settings updated successfully!</strong></p></div>';
		}

		$data = self::get_footer_data();
		?>
		<div class="wrap">
			<h1>Footer & Policy Manager</h1>
			<p>Customize company contact details, social media links, and legal policy pages content displayed on your Next.js storefront footer.</p>

			<form method="post" action="">
				<?php wp_nonce_field( 'hcc_footer_nonce_action', 'hcc_footer_nonce' ); ?>

				<h2>Company Contact & Info</h2>
				<table class="form-table">
					<tr>
						<th scope="row"><label for="footer_tagline">Company Tagline</label></th>
						<td>
							<textarea name="footer_tagline" id="footer_tagline" rows="2" class="large-text"><?php echo esc_textarea( $data['footer_tagline'] ); ?></textarea>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="footer_address">Factory & Office Address</label></th>
						<td>
							<textarea name="footer_address" id="footer_address" rows="2" class="large-text"><?php echo esc_textarea( $data['footer_address'] ); ?></textarea>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="footer_phone">Phone / WhatsApp</label></th>
						<td>
							<input type="text" name="footer_phone" id="footer_phone" value="<?php echo esc_attr( $data['footer_phone'] ); ?>" class="regular-text" />
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="footer_email">Trade Email</label></th>
						<td>
							<input type="email" name="footer_email" id="footer_email" value="<?php echo esc_attr( $data['footer_email'] ); ?>" class="regular-text" />
						</td>
					</tr>
				</table>

				<h2>Social Media Handles</h2>
				<table class="form-table">
					<tr>
						<th scope="row"><label for="social_instagram">Instagram URL</label></th>
						<td><input type="url" name="social_instagram" id="social_instagram" value="<?php echo esc_attr( $data['social_instagram'] ); ?>" class="regular-text" /></td>
					</tr>
					<tr>
						<th scope="row"><label for="social_linkedin">LinkedIn URL</label></th>
						<td><input type="url" name="social_linkedin" id="social_linkedin" value="<?php echo esc_attr( $data['social_linkedin'] ); ?>" class="regular-text" /></td>
					</tr>
					<tr>
						<th scope="row"><label for="social_pinterest">Pinterest URL</label></th>
						<td><input type="url" name="social_pinterest" id="social_pinterest" value="<?php echo esc_attr( $data['social_pinterest'] ); ?>" class="regular-text" /></td>
					</tr>
					<tr>
						<th scope="row"><label for="social_facebook">Facebook URL</label></th>
						<td><input type="url" name="social_facebook" id="social_facebook" value="<?php echo esc_attr( $data['social_facebook'] ); ?>" class="regular-text" /></td>
					</tr>
					<tr>
						<th scope="row"><label for="social_whatsapp">WhatsApp Link</label></th>
						<td><input type="url" name="social_whatsapp" id="social_whatsapp" value="<?php echo esc_attr( $data['social_whatsapp'] ); ?>" class="regular-text" /></td>
					</tr>
				</table>

				<h2>Legal Policy Pages Content</h2>
				<table class="form-table">
					<tr>
						<th scope="row"><label for="policy_privacy">Privacy Policy</label></th>
						<td><textarea name="policy_privacy" id="policy_privacy" rows="6" class="large-text"><?php echo esc_textarea( $data['policy_privacy'] ); ?></textarea></td>
					</tr>
					<tr>
						<th scope="row"><label for="policy_terms">Terms & Trade Conditions</label></th>
						<td><textarea name="policy_terms" id="policy_terms" rows="6" class="large-text"><?php echo esc_textarea( $data['policy_terms'] ); ?></textarea></td>
					</tr>
					<tr>
						<th scope="row"><label for="policy_shipping">Export & Freight Policy</label></th>
						<td><textarea name="policy_shipping" id="policy_shipping" rows="6" class="large-text"><?php echo esc_textarea( $data['policy_shipping'] ); ?></textarea></td>
					</tr>
					<tr>
						<th scope="row"><label for="policy_warranty">Quality & Warranty Policy</label></th>
						<td><textarea name="policy_warranty" id="policy_warranty" rows="6" class="large-text"><?php echo esc_textarea( $data['policy_warranty'] ); ?></textarea></td>
					</tr>
				</table>

				<p class="submit">
					<input type="submit" name="hcc_footer_submit" class="button button-primary" value="Save Footer Settings" />
				</p>
			</form>
		</div>
		<?php
	}
}
