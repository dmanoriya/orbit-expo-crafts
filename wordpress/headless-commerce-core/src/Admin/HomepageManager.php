<?php

namespace HeadlessCommerceCore\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class HomepageManager {

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_admin_menu' ), 10 );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
	}

	public static function add_admin_menu() {
		add_submenu_page(
			'headless-commerce-core',
			'Homepage Content Builder',
			'Homepage Builder',
			'manage_options',
			'hcc-homepage-builder',
			array( __CLASS__, 'render_homepage_builder_page' )
		);
	}

	public static function register_settings() {
		register_setting( 'hcc_homepage_options_group', 'hcc_homepage_options' );
	}

	public static function get_homepage_data() {
		$defaults = array(
			// Hero
			'hero_eyebrow'      => 'DIRECT FACTORY · UDAIPUR & JODHPUR · EST. 2011',
			'hero_title'        => 'Furniture that arrives project-ready.',
			'hero_accent'       => 'project-ready.',
			'hero_lede'         => 'We engineer and build loose furniture, casegoods, lighting and fixed joinery to project drawings for luxury hotels, resorts, fine dining and international export projects.',
			'hero_bg_mode'          => 'image',
			'hero_bg_image'         => 'http://woo-catalog-nextjs.local/wp-content/uploads/2026/08/category-sofas.jpg',
			'hero_bg_color'         => '#181512',
			'hero_overlay_opacity'  => '85',
			
			// Stats
			'stat1_number'      => '3,20,000',
			'stat1_label'       => 'SQ. FT. WORKS',
			'stat2_number'      => '1,400+',
			'stat2_label'       => 'CRAFTSMEN & STAFF',
			'stat3_number'      => '24',
			'stat3_label'       => 'EXPORT MARKETS',
			'stat4_number'      => '98%',
			'stat4_label'       => 'ON-TIME DELIVERY',

			// Feature Track Cards
			'track1_title'      => 'Direct contract projects',
			'track1_desc'       => 'Full-scope loose furniture & fixed joinery built to architect specifications.',
			'track1_points'     => "Kiln-dried & anti-borer treated timber\nCustom stain matching & fabric approvals\nCAD/3D shop drawing review\nDoor-to-door freight & logistics",

			'track2_title'      => 'Turnkey plug-in packages',
			'track2_desc'       => 'Pre-engineered room packages for rapid hotel guestroom & restaurant fit-outs.',
			'track2_points'     => "FSC certified wood options\nNo minimum order quantity\n45-day turnaround guarantee\nSite installation support team",

			// Categories
			'cat_eyebrow'       => 'PRODUCT CATEGORIES · DIRECT FACTORY CATALOGUE',
			'cat_title'         => 'Ten categories. Every piece a room needs.',
			'cat_desc'          => 'From solid wood seating to complex bone inlay casegoods — every piece is built to order in our Udaipur and Jodhpur manufacturing facilities.',

			// Project Spaces / Domains
			'seg_eyebrow'       => 'PROJECT DOMAINS',
			'seg_title'         => 'Shop the way a project actually gets specified.',
			'seg_desc'          => 'Furniture engineered for commercial spaces with heavy contract use standards.',

			// Featured Designs
			'feat_eyebrow'      => 'EXPORT READY',
			'feat_title'        => 'A few we are proud of this season.',
			'feat_desc'         => 'Popular baseline designs ready for customization to your project’s material, fabric, and dimensional specifications.',

			// 5 Steps
			'step_eyebrow'      => 'FACTORY PROCESS',
			'step_title'        => 'Five steps from your drawing to your floor.',
			'step1_title'       => 'Enquiry',
			'step1_desc'        => 'Send drawings, BOQ, or shortlist catalog items for quotation.',
			'step2_title'       => 'Specs',
			'step2_desc'        => 'CAD shop drawings, timber samples, and fabric approvals.',
			'step3_title'       => 'Prototype',
			'step3_desc'        => 'First-piece inspection before bulk production begins.',
			'step4_title'       => 'Manufacture',
			'step4_desc'        => 'Solid wood joinery, finishing, upholstery, and QC.',
			'step5_title'       => 'Delivery',
			'step5_desc'        => 'Export-grade packaging, shipping, and site installation.',

			// Materials
			'mat_eyebrow'       => 'HERITAGE CRAFTS',
			'mat_title'         => 'Twenty-one material vocabularies under one roof.',
			'mat_desc'          => 'Combining traditional Rajasthan woodworking, bone inlay, and metalwork with modern European hardware.',

			// Bottom CTA Band
			'band_title'        => 'Tell us what you\'re building.',
			'band_desc'         => 'Send your BOQ or architectural drawings. Our project desk replies with formal pricing, lead time, and freight within 24 working hours.',
			'band_cta1_text'    => 'Start an enquiry →',
			'band_cta1_url'     => '/contact',
			'band_cta2_text'    => 'Explore 2026 catalogue',
			'band_cta2_url'     => '/catalogue',
		);

		$saved = get_option( 'hcc_homepage_options', array() );
		return wp_parse_args( $saved, $defaults );
	}

	public static function render_homepage_builder_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$data = self::get_homepage_data();
		?>
		<div class="wrap" style="max-width:1100px; margin-top:20px;">
			<h1 style="font-size:24px; font-weight:700; margin-bottom:6px;">Homepage Content Builder & Section Manager</h1>
			<p style="color:#666; font-size:14px; margin-bottom:24px;">
				Edit any text, heading, paragraph, stat, point, or button link on your Next.js storefront homepage. All changes sync instantly over REST API.
			</p>

			<form method="post" action="options.php">
				<?php settings_fields( 'hcc_homepage_options_group' ); ?>

				<!-- SECTION: HERO & STATS -->
				<div class="postbox" style="padding:20px; margin-bottom:24px; background:#fff; border:1px solid #c3c4c7; border-radius:6px;">
					<h2 style="font-size:18px; font-weight:700; border-bottom:1px solid #eee; padding-bottom:10px; margin-top:0; color:#0E5C63;">
						1. Hero Section & Statistics
					</h2>
					<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:16px;">
						<div>
							<label style="font-weight:600; display:block; margin-bottom:4px;">Hero Eyebrow Badge:</label>
							<input type="text" name="hcc_homepage_options[hero_eyebrow]" value="<?php echo esc_attr( $data['hero_eyebrow'] ); ?>" style="width:100%;" />
						</div>
						<div>
							<label style="font-weight:600; display:block; margin-bottom:4px;">Hero Accent Word (Highlighted in Teal):</label>
							<input type="text" name="hcc_homepage_options[hero_accent]" value="<?php echo esc_attr( $data['hero_accent'] ); ?>" style="width:100%;" />
						</div>
					</div>

					<div style="margin-top:16px;">
						<label style="font-weight:600; display:block; margin-bottom:4px;">Hero Main Headline:</label>
						<input type="text" name="hcc_homepage_options[hero_title]" value="<?php echo esc_attr( $data['hero_title'] ); ?>" style="width:100%; font-size:16px;" />
					</div>

					<div style="margin-top:16px;">
						<label style="font-weight:600; display:block; margin-bottom:4px;">Hero Paragraph Description:</label>
						<textarea name="hcc_homepage_options[hero_lede]" rows="3" style="width:100%;"><?php echo esc_textarea( $data['hero_lede'] ); ?></textarea>
					</div>

					<div style="margin-top:16px; background:#f9f9f9; padding:14px; border-radius:6px; border:1px solid #e5e5e5;">
						<h3 style="margin-top:0; font-size:14px; color:#0E5C63;">Hero Background Style & Color Settings</h3>
						<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:10px;">
							<div>
								<label style="font-weight:600; display:block; margin-bottom:4px;">Background Style Mode:</label>
								<select name="hcc_homepage_options[hero_bg_mode]" style="width:100%; font-size:13px;">
									<option value="image" <?php selected( $data['hero_bg_mode'], 'image' ); ?>>Background Image (Media Library)</option>
									<option value="color" <?php selected( $data['hero_bg_mode'], 'color' ); ?>>Solid Background Color Only</option>
								</select>
							</div>
							<div>
								<label style="font-weight:600; display:block; margin-bottom:4px;">Solid Background Color (Hex):</label>
								<input type="text" name="hcc_homepage_options[hero_bg_color]" value="<?php echo esc_attr( $data['hero_bg_color'] ); ?>" style="width:100%;" placeholder="#181512" />
							</div>
						</div>

						<div style="display:grid; grid-template-columns:2fr 1fr; gap:16px; margin-top:12px;">
							<div>
								<label style="font-weight:600; display:block; margin-bottom:4px;">Background Image URL (WordPress Media Library):</label>
								<input type="text" name="hcc_homepage_options[hero_bg_image]" value="<?php echo esc_attr( $data['hero_bg_image'] ); ?>" style="width:100%;" placeholder="http://woo-catalog-nextjs.local/wp-content/uploads/2026/08/category-sofas.jpg" />
							</div>
							<div>
								<label style="font-weight:600; display:block; margin-bottom:4px;">Dark Scrim Opacity (%):</label>
								<input type="number" min="0" max="100" name="hcc_homepage_options[hero_overlay_opacity]" value="<?php echo esc_attr( $data['hero_overlay_opacity'] ); ?>" style="width:100%;" placeholder="85" />
							</div>
						</div>
					</div>

					<h3 style="font-size:14px; font-weight:700; margin-top:20px; color:#333;">Hero Stat Counters (4 Columns):</h3>
					<div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; margin-top:10px;">
						<div>
							<label style="font-size:12px; font-weight:600;">Stat 1 Number:</label>
							<input type="text" name="hcc_homepage_options[stat1_number]" value="<?php echo esc_attr( $data['stat1_number'] ); ?>" style="width:100%;" />
							<label style="font-size:11px; color:#666; display:block; margin-top:4px;">Label:</label>
							<input type="text" name="hcc_homepage_options[stat1_label]" value="<?php echo esc_attr( $data['stat1_label'] ); ?>" style="width:100%;" />
						</div>
						<div>
							<label style="font-size:12px; font-weight:600;">Stat 2 Number:</label>
							<input type="text" name="hcc_homepage_options[stat2_number]" value="<?php echo esc_attr( $data['stat2_number'] ); ?>" style="width:100%;" />
							<label style="font-size:11px; color:#666; display:block; margin-top:4px;">Label:</label>
							<input type="text" name="hcc_homepage_options[stat2_label]" value="<?php echo esc_attr( $data['stat2_label'] ); ?>" style="width:100%;" />
						</div>
						<div>
							<label style="font-size:12px; font-weight:600;">Stat 3 Number:</label>
							<input type="text" name="hcc_homepage_options[stat3_number]" value="<?php echo esc_attr( $data['stat3_number'] ); ?>" style="width:100%;" />
							<label style="font-size:11px; color:#666; display:block; margin-top:4px;">Label:</label>
							<input type="text" name="hcc_homepage_options[stat3_label]" value="<?php echo esc_attr( $data['stat3_label'] ); ?>" style="width:100%;" />
						</div>
						<div>
							<label style="font-size:12px; font-weight:600;">Stat 4 Number:</label>
							<input type="text" name="hcc_homepage_options[stat4_number]" value="<?php echo esc_attr( $data['stat4_number'] ); ?>" style="width:100%;" />
							<label style="font-size:11px; color:#666; display:block; margin-top:4px;">Label:</label>
							<input type="text" name="hcc_homepage_options[stat4_label]" value="<?php echo esc_attr( $data['stat4_label'] ); ?>" style="width:100%;" />
						</div>
					</div>
				</div>

				<!-- SECTION: 2 FEATURE TRACK CARDS -->
				<div class="postbox" style="padding:20px; margin-bottom:24px; background:#fff; border:1px solid #c3c4c7; border-radius:6px;">
					<h2 style="font-size:18px; font-weight:700; border-bottom:1px solid #eee; padding-bottom:10px; margin-top:0; color:#0E5C63;">
						2. Feature Track Cards (Two Audience Split Cards)
					</h2>
					<div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:16px;">
						<div style="background:#f9f9f9; padding:14px; border-radius:6px; border:1px solid #e5e5e5;">
							<h3 style="margin-top:0; font-size:14px; color:#0E5C63;">Card 1: Direct Contract Projects</h3>
							<div style="margin-bottom:10px;">
								<label style="font-size:12px; font-weight:600; display:block;">Card 1 Title:</label>
								<input type="text" name="hcc_homepage_options[track1_title]" value="<?php echo esc_attr( $data['track1_title'] ); ?>" style="width:100%;" />
							</div>
							<div style="margin-bottom:10px;">
								<label style="font-size:12px; font-weight:600; display:block;">Card 1 Description:</label>
								<textarea name="hcc_homepage_options[track1_desc]" rows="2" style="width:100%;"><?php echo esc_textarea( $data['track1_desc'] ); ?></textarea>
							</div>
							<div>
								<label style="font-size:12px; font-weight:600; display:block;">Bullet Points (1 per line):</label>
								<textarea name="hcc_homepage_options[track1_points]" rows="4" style="width:100%; font-size:12px;"><?php echo esc_textarea( $data['track1_points'] ); ?></textarea>
							</div>
						</div>

						<div style="background:#f9f9f9; padding:14px; border-radius:6px; border:1px solid #e5e5e5;">
							<h3 style="margin-top:0; font-size:14px; color:#B07A1E;">Card 2: Turnkey Plug-in Packages</h3>
							<div style="margin-bottom:10px;">
								<label style="font-size:12px; font-weight:600; display:block;">Card 2 Title:</label>
								<input type="text" name="hcc_homepage_options[track2_title]" value="<?php echo esc_attr( $data['track2_title'] ); ?>" style="width:100%;" />
							</div>
							<div style="margin-bottom:10px;">
								<label style="font-size:12px; font-weight:600; display:block;">Card 2 Description:</label>
								<textarea name="hcc_homepage_options[track2_desc]" rows="2" style="width:100%;"><?php echo esc_textarea( $data['track2_desc'] ); ?></textarea>
							</div>
							<div>
								<label style="font-size:12px; font-weight:600; display:block;">Bullet Points (1 per line):</label>
								<textarea name="hcc_homepage_options[track2_points]" rows="4" style="width:100%; font-size:12px;"><?php echo esc_textarea( $data['track2_points'] ); ?></textarea>
							</div>
						</div>
					</div>
				</div>

				<!-- SECTION: HEADINGS FOR CATEGORIES, SPACES, DESIGNS -->
				<div class="postbox" style="padding:20px; margin-bottom:24px; background:#fff; border:1px solid #c3c4c7; border-radius:6px;">
					<h2 style="font-size:18px; font-weight:700; border-bottom:1px solid #eee; padding-bottom:10px; margin-top:0; color:#0E5C63;">
						3. Section Headings & Descriptions
					</h2>
					<div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:16px;">
						<div>
							<h3 style="font-size:14px; margin-top:0;">Categories Section Header:</h3>
							<label style="font-size:11px; color:#666;">Eyebrow:</label>
							<input type="text" name="hcc_homepage_options[cat_eyebrow]" value="<?php echo esc_attr( $data['cat_eyebrow'] ); ?>" style="width:100%; margin-bottom:8px;" />
							<label style="font-size:11px; color:#666;">Heading:</label>
							<input type="text" name="hcc_homepage_options[cat_title]" value="<?php echo esc_attr( $data['cat_title'] ); ?>" style="width:100%; margin-bottom:8px;" />
							<label style="font-size:11px; color:#666;">Description:</label>
							<textarea name="hcc_homepage_options[cat_desc]" rows="2" style="width:100%;"><?php echo esc_textarea( $data['cat_desc'] ); ?></textarea>
						</div>

						<div>
							<h3 style="font-size:14px; margin-top:0;">Project Domains / Spaces Header:</h3>
							<label style="font-size:11px; color:#666;">Eyebrow:</label>
							<input type="text" name="hcc_homepage_options[seg_eyebrow]" value="<?php echo esc_attr( $data['seg_eyebrow'] ); ?>" style="width:100%; margin-bottom:8px;" />
							<label style="font-size:11px; color:#666;">Heading:</label>
							<input type="text" name="hcc_homepage_options[seg_title]" value="<?php echo esc_attr( $data['seg_title'] ); ?>" style="width:100%; margin-bottom:8px;" />
							<label style="font-size:11px; color:#666;">Description:</label>
							<textarea name="hcc_homepage_options[seg_desc]" rows="2" style="width:100%;"><?php echo esc_textarea( $data['seg_desc'] ); ?></textarea>
						</div>
					</div>

					<div style="margin-top:20px; border-top:1px solid #eee; padding-top:16px;">
						<h3 style="font-size:14px; margin-top:0;">Featured Designs Header:</h3>
						<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
							<div>
								<label style="font-size:11px; color:#666;">Eyebrow:</label>
								<input type="text" name="hcc_homepage_options[feat_eyebrow]" value="<?php echo esc_attr( $data['feat_eyebrow'] ); ?>" style="width:100%; margin-bottom:8px;" />
								<label style="font-size:11px; color:#666;">Heading:</label>
								<input type="text" name="hcc_homepage_options[feat_title]" value="<?php echo esc_attr( $data['feat_title'] ); ?>" style="width:100%;" />
							</div>
							<div>
								<label style="font-size:11px; color:#666;">Description:</label>
								<textarea name="hcc_homepage_options[feat_desc]" rows="3" style="width:100%;"><?php echo esc_textarea( $data['feat_desc'] ); ?></textarea>
							</div>
						</div>
					</div>
				</div>

				<!-- SECTION: 5 STEPS & BOTTOM CTA -->
				<div class="postbox" style="padding:20px; margin-bottom:24px; background:#fff; border:1px solid #c3c4c7; border-radius:6px;">
					<h2 style="font-size:18px; font-weight:700; border-bottom:1px solid #eee; padding-bottom:10px; margin-top:0; color:#0E5C63;">
						4. Factory 5-Step Process & Bottom Banner Callout
					</h2>
					<div style="margin-top:14px;">
						<label style="font-weight:600; font-size:12px;">5-Step Process Heading:</label>
						<input type="text" name="hcc_homepage_options[step_title]" value="<?php echo esc_attr( $data['step_title'] ); ?>" style="width:100%; margin-bottom:12px;" />

						<div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:10px;">
							<?php for ( $i = 1; $i <= 5; $i ++ ) : ?>
								<div style="background:#f9f9f9; padding:10px; border-radius:4px; border:1px solid #eee;">
									<strong style="font-size:12px; display:block; color:#0E5C63;">Step <?php echo $i; ?></strong>
									<input type="text" name="hcc_homepage_options[step<?php echo $i; ?>_title]" value="<?php echo esc_attr( $data[ "step{$i}_title" ] ); ?>" style="width:100%; margin:4px 0;" placeholder="Title" />
									<textarea name="hcc_homepage_options[step<?php echo $i; ?>_desc]" rows="3" style="width:100%; font-size:11px;" placeholder="Description"><?php echo esc_textarea( $data[ "step{$i}_desc" ] ); ?></textarea>
								</div>
							<?php endfor; ?>
						</div>
					</div>

					<div style="margin-top:20px; border-top:1px solid #eee; padding-top:16px;">
						<h3 style="font-size:14px; margin-top:0; color:#0E5C63;">Bottom Banner Callout:</h3>
						<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
							<div>
								<label style="font-size:11px; color:#666;">Banner Title:</label>
								<input type="text" name="hcc_homepage_options[band_title]" value="<?php echo esc_attr( $data['band_title'] ); ?>" style="width:100%; margin-bottom:8px;" />
								<label style="font-size:11px; color:#666;">Banner Description:</label>
								<textarea name="hcc_homepage_options[band_desc]" rows="2" style="width:100%;"><?php echo esc_textarea( $data['band_desc'] ); ?></textarea>
							</div>
							<div>
								<label style="font-size:11px; color:#666;">Primary CTA Text & URL:</label>
								<div style="display:flex; gap:6px; margin-bottom:8px;">
									<input type="text" name="hcc_homepage_options[band_cta1_text]" value="<?php echo esc_attr( $data['band_cta1_text'] ); ?>" placeholder="Text" style="flex:1;" />
									<input type="text" name="hcc_homepage_options[band_cta1_url]" value="<?php echo esc_attr( $data['band_cta1_url'] ); ?>" placeholder="URL" style="flex:1;" />
								</div>
								<label style="font-size:11px; color:#666;">Secondary CTA Text & URL:</label>
								<div style="display:flex; gap:6px;">
									<input type="text" name="hcc_homepage_options[band_cta2_text]" value="<?php echo esc_attr( $data['band_cta2_text'] ); ?>" placeholder="Text" style="flex:1;" />
									<input type="text" name="hcc_homepage_options[band_cta2_url]" value="<?php echo esc_attr( $data['band_cta2_url'] ); ?>" placeholder="URL" style="flex:1;" />
								</div>
							</div>
						</div>
					</div>
				</div>

				<?php submit_button( 'Save Homepage Content' ); ?>
			</form>
		</div>
		<?php
	}
}
