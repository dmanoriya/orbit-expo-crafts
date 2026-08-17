<?php

namespace HeadlessCommerceCore\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class TypographyManager {

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_admin_menu' ), 10 );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
	}

	public static function add_admin_menu() {
		add_submenu_page(
			'headless-commerce-core',
			'Typography & Google Fonts',
			'Typography Settings',
			'manage_options',
			'hcc-typography-settings',
			array( __CLASS__, 'render_typography_page' )
		);
	}

	public static function register_settings() {
		register_setting( 'hcc_typography_options_group', 'hcc_typography_options' );
	}

	public static function get_typography_data() {
		$defaults = array(
			'font_heading' => 'Fraunces',
			'font_body'    => 'Archivo',
			'font_menu'    => 'Archivo',
			'font_button'  => 'Archivo',
			'font_mono'    => 'JetBrains Mono',
		);

		$saved = get_option( 'hcc_typography_options', array() );
		return wp_parse_args( $saved, $defaults );
	}

	public static function render_typography_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$data = self::get_typography_data();

		$font_choices_heading = array(
			'Fraunces'           => 'Fraunces (Luxury Display Serif - Prototype Default)',
			'Newsreader'         => 'Newsreader (Elegant Editorial Serif)',
			'Playfair Display'   => 'Playfair Display (Classic High-Contrast Serif)',
			'Cormorant Garamond' => 'Cormorant Garamond (Refined Display Serif)',
			'Cinzel'             => 'Cinzel (Architectural Serif)',
			'Instrument Serif'   => 'Instrument Serif (Modern Editorial Serif)',
			'Archivo'            => 'Archivo (Bold Industrial Sans)',
			'Plus Jakarta Sans'  => 'Plus Jakarta Sans (Modern Geometric Sans)',
			'Inter'              => 'Inter (Clean Modern UI Sans)',
		);

		$font_choices_body = array(
			'Archivo'           => 'Archivo (Clean Industrial Sans - Prototype Default)',
			'Plus Jakarta Sans' => 'Plus Jakarta Sans (Modern Geometric Sans)',
			'Inter'             => 'Inter (Ultra Crisp UI Sans)',
			'Outfit'            => 'Outfit (Friendly Geometric)',
			'Roboto'            => 'Roboto (Standard Clean Sans)',
			'Open Sans'         => 'Open Sans (Neutral Reading Sans)',
		);

		$font_choices_menu = array(
			'Archivo'           => 'Archivo (Semi-bold UI Sans - Prototype Default)',
			'Plus Jakarta Sans' => 'Plus Jakarta Sans (Modern Geometric Sans)',
			'DM Sans'           => 'DM Sans (Clean Geometric)',
			'Space Grotesk'     => 'Space Grotesk (Architectural Grok)',
			'Inter'             => 'Inter (Neutral UI)',
		);

		$font_choices_button = array(
			'Archivo'           => 'Archivo (Heavy Action Sans - Prototype Default)',
			'Plus Jakarta Sans' => 'Plus Jakarta Sans (Modern Button Sans)',
			'Cabinet Grotesk'   => 'Cabinet Grotesk (Bold Display Button)',
			'Inter'             => 'Inter (Clean Action Sans)',
		);

		$font_choices_mono = array(
			'JetBrains Mono' => 'JetBrains Mono (Technical Mono - Prototype Default)',
			'Space Mono'     => 'Space Mono (Architectural Mono)',
			'Fira Code'      => 'Fira Code (Crisp Technical Mono)',
			'IBM Plex Mono'  => 'IBM Plex Mono (Refined Industrial Mono)',
		);

		?>
		<div class="wrap" style="max-width:900px; margin-top:20px;">
			<h1 style="font-size:24px; font-weight:700; margin-bottom:6px;">Typography & Google Fonts Selector</h1>
			<p style="color:#666; font-size:14px; margin-bottom:24px;">
				Customize the font family for each zone of your Next.js storefront. Only the selected fonts will be dynamically loaded from Google Fonts for maximum speed and zero performance overhead!
			</p>

			<form method="post" action="options.php">
				<?php settings_fields( 'hcc_typography_options_group' ); ?>

				<div class="postbox" style="padding:24px; background:#fff; border:1px solid #c3c4c7; border-radius:6px;">
					<!-- HEADING FONT -->
					<div style="margin-bottom:20px;">
						<label style="font-weight:700; font-size:14px; display:block; margin-bottom:6px; color:#0E5C63;">
							1. Headings & Display Titles Font (H1 - H6):
						</label>
						<select name="hcc_typography_options[font_heading]" style="width:100%; font-size:14px; padding:6px;">
							<?php foreach ( $font_choices_heading as $val => $label ) : ?>
								<option value="<?php echo esc_attr( $val ); ?>" <?php selected( $data['font_heading'], $val ); ?>><?php echo esc_html( $label ); ?></option>
							<?php endforeach; ?>
						</select>
					</div>

					<!-- BODY FONT -->
					<div style="margin-bottom:20px; border-top:1px solid #eee; padding-top:16px;">
						<label style="font-weight:700; font-size:14px; display:block; margin-bottom:6px; color:#0E5C63;">
							2. Body & Paragraph Text Font:
						</label>
						<select name="hcc_typography_options[font_body]" style="width:100%; font-size:14px; padding:6px;">
							<?php foreach ( $font_choices_body as $val => $label ) : ?>
								<option value="<?php echo esc_attr( $val ); ?>" <?php selected( $data['font_body'], $val ); ?>><?php echo esc_html( $label ); ?></option>
							<?php endforeach; ?>
						</select>
					</div>

					<!-- MENU FONT -->
					<div style="margin-bottom:20px; border-top:1px solid #eee; padding-top:16px;">
						<label style="font-weight:700; font-size:14px; display:block; margin-bottom:6px; color:#0E5C63;">
							3. Header & Footer Navigation Menu Font:
						</label>
						<select name="hcc_typography_options[font_menu]" style="width:100%; font-size:14px; padding:6px;">
							<?php foreach ( $font_choices_menu as $val => $label ) : ?>
								<option value="<?php echo esc_attr( $val ); ?>" <?php selected( $data['font_menu'], $val ); ?>><?php echo esc_html( $label ); ?></option>
							<?php endforeach; ?>
						</select>
					</div>

					<!-- BUTTON FONT -->
					<div style="margin-bottom:20px; border-top:1px solid #eee; padding-top:16px;">
						<label style="font-weight:700; font-size:14px; display:block; margin-bottom:6px; color:#0E5C63;">
							4. Buttons & Action Controls Font:
						</label>
						<select name="hcc_typography_options[font_button]" style="width:100%; font-size:14px; padding:6px;">
							<?php foreach ( $font_choices_button as $val => $label ) : ?>
								<option value="<?php echo esc_attr( $val ); ?>" <?php selected( $data['font_button'], $val ); ?>><?php echo esc_html( $label ); ?></option>
							<?php endforeach; ?>
						</select>
					</div>

					<!-- PILL / MONO FONT -->
					<div style="margin-bottom:10px; border-top:1px solid #eee; padding-top:16px;">
						<label style="font-weight:700; font-size:14px; display:block; margin-bottom:6px; color:#0E5C63;">
							5. Pill Badges & Mono Tags Font (Capitalized Code & Badges):
						</label>
						<select name="hcc_typography_options[font_mono]" style="width:100%; font-size:14px; padding:6px;">
							<?php foreach ( $font_choices_mono as $val => $label ) : ?>
								<option value="<?php echo esc_attr( $val ); ?>" <?php selected( $data['font_mono'], $val ); ?>><?php echo esc_html( $label ); ?></option>
							<?php endforeach; ?>
						</select>
					</div>
				</div>

				<?php submit_button( 'Save Typography Settings' ); ?>
			</form>
		</div>
		<?php
	}
}
