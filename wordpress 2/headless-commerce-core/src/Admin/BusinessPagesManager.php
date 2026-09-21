<?php

namespace HeadlessCommerceCore\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class BusinessPagesManager {

	const OPTION_KEY = 'hcc_business_pages_config';

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_admin_menu' ), 12 );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_admin_assets' ) );
	}

	public static function add_admin_menu() {
		// Submenu under Headless Commerce
		add_submenu_page(
			'headless-commerce-core',
			__( 'Business Forms & Pages Builder', 'headless-commerce-core' ),
			__( 'Business Pages & Forms', 'headless-commerce-core' ),
			'manage_options',
			'hcc-business-pages',
			array( __CLASS__, 'render_admin_page' )
		);

		// Dedicated Top-Level Admin Menu for Maximum Discoverability
		add_menu_page(
			__( 'Business Forms & Pages Builder', 'headless-commerce-core' ),
			__( 'Business Pages', 'headless-commerce-core' ),
			'manage_options',
			'hcc-business-pages-main',
			array( __CLASS__, 'render_admin_page' ),
			'dashicons-feedback',
			59
		);
	}

	public static function register_settings() {
		register_setting( 'hcc_business_pages_group', self::OPTION_KEY );
	}

	public static function enqueue_admin_assets( $hook ) {
		if ( strpos( $hook, 'hcc-business-pages' ) === false ) {
			return;
		}
		wp_enqueue_media();
	}

	/**
	 * Default configurations for all 4 business pages
	 */
	public static function get_default_configs() {
		return array(
			'suppliers_vendors' => array(
				'slug'            => 'suppliers-vendors',
				'tab_number'      => '01',
				'tab_label'       => 'Suppliers & Vendors',
				'page_eyebrow'    => 'BUSINESS',
				'page_title'      => 'Become part of our maker network.',
				'page_subtitle'   => 'Share your materials, manufacturing capabilities or specialist services with our sourcing team.',
				'enquiry_number'  => '01',
				'visual'          => array(
					'image_url' => '/business/business-card-bg.jpg',
					'tag'       => 'MADE IN JODHPUR · MADE FOR THE WORLD',
					'headline'  => 'Responsible sourcing. Considered craft. Partnerships built for the long term.',
				),
				'form'            => array(
					'eyebrow'            => 'SUPPLIER & VENDOR ENQUIRY',
					'title'              => 'Introduce your capabilities.',
					'notice'             => 'Fields marked * are required.',
					'review_note'        => 'We usually review business enquiries within 2–3 working days.',
					'submit_button_text' => 'Submit enquiry →',
					'success_title'      => 'Enquiry Received',
					'success_message'    => 'Thank you for your submission. Our procurement & materials team will review your supply profile and reach out within 2–3 working days.',
					'fields'             => array(
						array(
							'id'          => 'f1',
							'name'        => 'company_name',
							'label'       => 'Company / Supplier name',
							'type'        => 'text',
							'placeholder' => 'Trading or manufacturing company name',
							'width'       => 'half',
							'required'    => true,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f2',
							'name'        => 'contact_person',
							'label'       => 'Contact person',
							'type'        => 'text',
							'placeholder' => 'Full name',
							'width'       => 'half',
							'required'    => true,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f3',
							'name'        => 'email',
							'label'       => 'Work email',
							'type'        => 'email',
							'placeholder' => 'name@company.com',
							'width'       => 'half',
							'required'    => true,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f4',
							'name'        => 'phone',
							'label'       => 'Phone / WhatsApp',
							'type'        => 'tel',
							'placeholder' => '',
							'width'       => 'half',
							'required'    => true,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f5',
							'name'        => 'supply_category',
							'label'       => 'Supply Category',
							'type'        => 'select',
							'placeholder' => 'Select an option',
							'width'       => 'half',
							'required'    => true,
							'options'     => "Solid Timber & Hardwoods\nMetalwork, Castings & Brass Hardware\nNatural Stone, Marble & Granite\nUpholstery, Leathers & Performance Textiles\nNatural Cane, Rattan & Weaving\nPaints, Polishes, Stains & Coatings\nPackaging & Export Wood Crating\nLogistics & Global Freight Services\nFactory Consumables & Machinery Tools\nOther Specialized Materials",
							'help_text'   => '',
						),
						array(
							'id'          => 'f6',
							'name'        => 'business_location',
							'label'       => 'Business location',
							'type'        => 'text',
							'placeholder' => 'City & country (e.g. Jodhpur, India)',
							'width'       => 'half',
							'required'    => true,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f7',
							'name'        => 'core_capabilities',
							'label'       => 'Core capabilities & materials supplied',
							'type'        => 'checkbox_group',
							'placeholder' => '',
							'width'       => 'full',
							'required'    => true,
							'options'     => "Kiln-dried timber logs & seasoned planks (Teak, Sheesham, Oak, Acacia)\nPrecision CNC router parts & turnings\nCast brass, forged iron & architectural hardware\nHigh-resilience foam & upholstery batting\nContract fabrics, linen & full-grain leathers\nNatural cane webbing & woven cords\nFinishing stains, sealers & eco-PU lacquers\nExport-compliant ISPM-15 wooden crates & corrugated packaging",
							'help_text'   => '',
						),
						array(
							'id'          => 'f8',
							'name'        => 'production_capacity',
							'label'       => 'Production / Supply capacity',
							'type'        => 'select',
							'placeholder' => 'Select an option',
							'width'       => 'half',
							'required'    => false,
							'options'     => "Artisanal / Small batch supply\nMedium volume (1–5 truckloads / containers per month)\nHigh volume industrial (5+ containers per month)\nCustom on-demand per project batch",
							'help_text'   => '',
						),
						array(
							'id'          => 'f9',
							'name'        => 'years_in_business',
							'label'       => 'Years in business',
							'type'        => 'select',
							'placeholder' => 'Select an option',
							'width'       => 'half',
							'required'    => false,
							'options'     => "Under 2 years\n2–5 years\n5–10 years\n10+ years established",
							'help_text'   => '',
						),
						array(
							'id'          => 'f10',
							'name'        => 'website_catalog',
							'label'       => 'Company website or catalog link',
							'type'        => 'url',
							'placeholder' => 'https://',
							'width'       => 'full',
							'required'    => false,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f11',
							'name'        => 'company_profile',
							'label'       => 'Attach company profile, price list or certifications',
							'type'        => 'file',
							'placeholder' => '',
							'width'       => 'full',
							'required'    => false,
							'options'     => '',
							'help_text'   => 'PDF, DWG preview, JPG or PNG - up to 10 MB',
						),
						array(
							'id'          => 'f12',
							'name'        => 'capabilities_overview',
							'label'       => 'Products & supply capabilities brief',
							'type'        => 'textarea',
							'placeholder' => 'Detail your product specifications, quality certifications, minimum order quantities, and current supply capacity...',
							'width'       => 'full',
							'required'    => true,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f13',
							'name'        => 'consent',
							'label'       => 'Consent',
							'type'        => 'checkbox_group',
							'placeholder' => '',
							'width'       => 'full',
							'required'    => true,
							'options'     => 'I agree that Orbit Expo Crafts may contact me regarding this enquiry.',
							'help_text'   => '',
						),
					),
				),
				'seo'             => array(
					'title'         => 'Suppliers & Vendors | Orbit Expo Crafts',
					'description'   => 'Partner with Orbit Expo Crafts as a verified supplier of premium timber, brass hardware, stone, fabrics, and craft materials for export furniture manufacturing.',
					'focus_keyword' => 'furniture suppliers, timber vendors, woodcraft manufacturing materials, orbit expo crafts suppliers',
					'og_image'      => '',
					'canonical_url' => '/suppliers-vendors',
					'robots'        => 'index, follow',
				),
			),

			'interior_designers' => array(
				'slug'            => 'interior-designers',
				'tab_number'      => '02',
				'tab_label'       => 'Architects & Interior Designers',
				'page_eyebrow'    => 'BUSINESS',
				'page_title'      => 'Bring your project vision into form.',
				'page_subtitle'   => 'Collaborate on custom furniture, coordinated room packages and made-to-specification manufacturing.',
				'enquiry_number'  => '02',
				'visual'          => array(
					'image_url' => '/business/business-card-bg.jpg',
					'tag'       => 'MADE IN JODHPUR · MADE FOR THE WORLD',
					'headline'  => 'From drawings to finished pieces, we help translate spatial concepts into enduring furniture.',
				),
				'form'            => array(
					'eyebrow'            => 'ARCHITECT & INTERIOR DESIGNER ENQUIRY',
					'title'              => 'Tell us about your project.',
					'notice'             => 'Fields marked * are required.',
					'review_note'        => 'We usually review business enquiries within 2–3 working days.',
					'submit_button_text' => 'Submit enquiry →',
					'success_title'      => 'Enquiry Received',
					'success_message'    => 'Thank you for your project enquiry. Our design trade desk will review your specifications and contact you within 2–3 working days.',
					'fields'             => array(
						array(
							'id'          => 'f1',
							'name'        => 'company_name',
							'label'       => 'Studio / firm name',
							'type'        => 'text',
							'placeholder' => 'Practice name',
							'width'       => 'half',
							'required'    => true,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f2',
							'name'        => 'contact_person',
							'label'       => 'Contact person',
							'type'        => 'text',
							'placeholder' => 'Full name',
							'width'       => 'half',
							'required'    => true,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f3',
							'name'        => 'email',
							'label'       => 'Work email',
							'type'        => 'email',
							'placeholder' => 'name@studio.com',
							'width'       => 'half',
							'required'    => true,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f4',
							'name'        => 'phone',
							'label'       => 'Phone / WhatsApp',
							'type'        => 'tel',
							'placeholder' => '',
							'width'       => 'half',
							'required'    => true,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f5',
							'name'        => 'project_type',
							'label'       => 'Project type',
							'type'        => 'select',
							'placeholder' => 'Select an option',
							'width'       => 'half',
							'required'    => true,
							'options'     => "Luxury Residential\nBoutique Hotel & Resort\nRestaurant / Bar / Café\nCommercial / Corporate Office\nRetail Concept Store\nPrivate Villa Estate",
							'help_text'   => '',
						),
						array(
							'id'          => 'f6',
							'name'        => 'project_location',
							'label'       => 'Project location',
							'type'        => 'text',
							'placeholder' => 'City & country',
							'width'       => 'half',
							'required'    => true,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f7',
							'name'        => 'required_support',
							'label'       => 'Required support',
							'type'        => 'checkbox_group',
							'placeholder' => '',
							'width'       => 'full',
							'required'    => true,
							'options'     => "Loose furniture\nCustom furniture\nComplete room packages\nPrototyping\nDécor & accessories\nMaterial consultation",
							'help_text'   => '',
						),
						array(
							'id'          => 'f8',
							'name'        => 'estimated_budget',
							'label'       => 'Estimated furniture budget',
							'type'        => 'select',
							'placeholder' => 'Select an option',
							'width'       => 'half',
							'required'    => false,
							'options'     => "Under ₹10,00,000 / $12,000\n₹10,00,000 – ₹25,00,000 / $12,000–$30,000\n₹25,00,000 – ₹50,00,000 / $30,000–$60,000\n₹50,00,000+ / $60,000+",
							'help_text'   => '',
						),
						array(
							'id'          => 'f9',
							'name'        => 'target_installation_date',
							'label'       => 'Target installation date',
							'type'        => 'text',
							'placeholder' => 'Month / year',
							'width'       => 'half',
							'required'    => false,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f10',
							'name'        => 'studio_link',
							'label'       => 'Studio or project link',
							'type'        => 'url',
							'placeholder' => 'https://',
							'width'       => 'full',
							'required'    => false,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f11',
							'name'        => 'drawings_attachment',
							'label'       => 'Attach drawings or moodboard',
							'type'        => 'file',
							'placeholder' => '',
							'width'       => 'full',
							'required'    => false,
							'options'     => '',
							'help_text'   => 'PDF, DWG preview, JPG or PNG - up to 10 MB',
						),
						array(
							'id'          => 'f12',
							'name'        => 'project_brief',
							'label'       => 'Project brief',
							'type'        => 'textarea',
							'placeholder' => 'Scope, quantities, materials, finishes and key expectations',
							'width'       => 'full',
							'required'    => true,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f13',
							'name'        => 'consent',
							'label'       => 'Consent',
							'type'        => 'checkbox_group',
							'placeholder' => '',
							'width'       => 'full',
							'required'    => true,
							'options'     => 'I agree that Orbit Expo Crafts may contact me regarding this enquiry.',
							'help_text'   => '',
						),
					),
				),
				'seo'             => array(
					'title'         => 'Architects & Interior Designers Trade Program | Orbit Expo Crafts',
					'description'   => 'Bespoke contract furniture manufacturing for architects, interior designers, and hospitality specifiers worldwide.',
					'focus_keyword' => 'interior design trade program, bespoke contract furniture, architectural furniture manufacturing',
					'og_image'      => '',
					'canonical_url' => '/interior-designers',
					'robots'        => 'index, follow',
				),
			),

			'influencers_marketing' => array(
				'slug'            => 'influencers-marketing',
				'tab_number'      => '03',
				'tab_label'       => 'Influencers & Marketing',
				'page_eyebrow'    => 'BUSINESS',
				'page_title'      => 'Create stories around considered living.',
				'page_subtitle'   => 'For editorial features, content partnerships, creator collaborations and considered brand opportunities.',
				'enquiry_number'  => '03',
				'visual'          => array(
					'image_url' => '/business/business-card-bg.jpg',
					'tag'       => 'MADE IN JODHPUR · MADE FOR THE WORLD',
					'headline'  => 'We value credible voices, original ideas and content that celebrates material, craft and thoughtful homes.',
				),
				'form'            => array(
					'eyebrow'            => 'INFLUENCER & MARKETING ENQUIRY',
					'title'              => 'Propose a meaningful collaboration.',
					'notice'             => 'Fields marked * are required.',
					'review_note'        => 'We usually review business enquiries within 2–3 working days.',
					'submit_button_text' => 'Submit enquiry →',
					'success_title'      => 'Enquiry Received',
					'success_message'    => 'Thank you for your collaboration pitch! Our brand marketing team will review your channels and get back to you shortly.',
					'fields'             => array(
						array(
							'id'          => 'f1',
							'name'        => 'creator_name',
							'label'       => 'Creator / Agency name',
							'type'        => 'text',
							'placeholder' => 'Full name or brand name',
							'width'       => 'half',
							'required'    => true,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f2',
							'name'        => 'contact_person',
							'label'       => 'Contact person',
							'type'        => 'text',
							'placeholder' => 'Contact name / Representative',
							'width'       => 'half',
							'required'    => true,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f3',
							'name'        => 'email',
							'label'       => 'Work email',
							'type'        => 'email',
							'placeholder' => 'collab@yourbrand.com',
							'width'       => 'half',
							'required'    => true,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f4',
							'name'        => 'phone',
							'label'       => 'Phone / WhatsApp',
							'type'        => 'tel',
							'placeholder' => '',
							'width'       => 'half',
							'required'    => true,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f5',
							'name'        => 'primary_platform',
							'label'       => 'Primary Platform',
							'type'        => 'select',
							'placeholder' => 'Select an option',
							'width'       => 'half',
							'required'    => true,
							'options'     => "Instagram\nYouTube\nPinterest\nArchitectural / Design Editorial Blog\nTikTok\nPodcast / Media Publication",
							'help_text'   => '',
						),
						array(
							'id'          => 'f6',
							'name'        => 'social_handle',
							'label'       => 'Social handle or channel URL',
							'type'        => 'text',
							'placeholder' => '@yourhandle or https://instagram.com/...',
							'width'       => 'half',
							'required'    => true,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f7',
							'name'        => 'collaboration_format',
							'label'       => 'Collaboration format interested in',
							'type'        => 'checkbox_group',
							'placeholder' => '',
							'width'       => 'full',
							'required'    => true,
							'options'     => "Home Styling & Product Placement\nFactory Craftsmanship & Heritage Tour Video\nDesign Editorial & Long-form Story\nAffiliate & Brand Ambassador Partnership\nCo-created Capsule Furniture Collection",
							'help_text'   => '',
						),
						array(
							'id'          => 'f8',
							'name'        => 'media_kit',
							'label'       => 'Attach media kit or portfolio',
							'type'        => 'file',
							'placeholder' => '',
							'width'       => 'full',
							'required'    => false,
							'options'     => '',
							'help_text'   => 'PDF or image up to 10 MB',
						),
						array(
							'id'          => 'f9',
							'name'        => 'proposal_pitch',
							'label'       => 'Collaboration vision & audience summary',
							'type'        => 'textarea',
							'placeholder' => 'Tell us about your audience demographics, past brand partnerships, and your creative vision...',
							'width'       => 'full',
							'required'    => true,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f10',
							'name'        => 'consent',
							'label'       => 'Consent',
							'type'        => 'checkbox_group',
							'placeholder' => '',
							'width'       => 'full',
							'required'    => true,
							'options'     => 'I agree that Orbit Expo Crafts may contact me regarding this enquiry.',
							'help_text'   => '',
						),
					),
				),
				'seo'             => array(
					'title'         => 'Influencers & Brand Marketing Collaborations | Orbit Expo Crafts',
					'description'   => 'Collaborate with Orbit Expo Crafts on design-led content, editorial styling, and artisanal craft storytelling.',
					'focus_keyword' => 'furniture influencer collaboration, interior design brand partnership, craft marketing',
					'og_image'      => '',
					'canonical_url' => '/influencers-marketing',
					'robots'        => 'index, follow',
				),
			),

			'furniture_decor_designers' => array(
				'slug'            => 'furniture-decor-designers',
				'tab_number'      => '04',
				'tab_label'       => 'Furniture & Décor Designers',
				'page_eyebrow'    => 'BUSINESS',
				'page_title'      => 'Design with material, craft and scale.',
				'page_subtitle'   => 'Work with our development team on licensed collections, custom products or manufacturing partnerships.',
				'enquiry_number'  => '04',
				'visual'          => array(
					'image_url' => '/business/business-card-bg.jpg',
					'tag'       => 'MADE IN JODHPUR · MADE FOR THE WORLD',
					'headline'  => 'Distinct ideas deserve disciplined development—from first sketch and material study to repeatable production.',
				),
				'form'            => array(
					'eyebrow'            => 'FURNITURE & DÉCOR DESIGNER ENQUIRY',
					'title'              => 'Share your design proposition.',
					'notice'             => 'Fields marked * are required.',
					'review_note'        => 'We usually review business enquiries within 2–3 working days.',
					'submit_button_text' => 'Submit enquiry →',
					'success_title'      => 'Enquiry Received',
					'success_message'    => 'Thank you for sharing your design brief. Our engineering and master carpentry team will review your designs and get in touch within 2–3 working days.',
					'fields'             => array(
						array(
							'id'          => 'f1',
							'name'        => 'designer_studio',
							'label'       => 'Designer / Studio name',
							'type'        => 'text',
							'placeholder' => 'Studio or individual designer name',
							'width'       => 'half',
							'required'    => true,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f2',
							'name'        => 'contact_person',
							'label'       => 'Contact person',
							'type'        => 'text',
							'placeholder' => 'Full name',
							'width'       => 'half',
							'required'    => true,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f3',
							'name'        => 'email',
							'label'       => 'Work email',
							'type'        => 'email',
							'placeholder' => 'designer@studio.com',
							'width'       => 'half',
							'required'    => true,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f4',
							'name'        => 'phone',
							'label'       => 'Phone / WhatsApp',
							'type'        => 'tel',
							'placeholder' => '',
							'width'       => 'half',
							'required'    => true,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f5',
							'name'        => 'collection_category',
							'label'       => 'Category of design',
							'type'        => 'select',
							'placeholder' => 'Select an option',
							'width'       => 'half',
							'required'    => true,
							'options'     => "Seating (Chairs, Benches, Lounge)\nTables & Desks\nStorage, Credenzas & Cabinets\nBeds & Bedroom Furniture\nLighting & Architectural Objects\nHome Décor & Accents\nFull Collection Across Categories",
							'help_text'   => '',
						),
						array(
							'id'          => 'f6',
							'name'        => 'manufacturing_intent',
							'label'       => 'Manufacturing intent',
							'type'        => 'select',
							'placeholder' => 'Select an option',
							'width'       => 'half',
							'required'    => true,
							'options'     => "Prototyping & Sample Sign-off\nLimited Edition Production Runs\nWhite-label / Private Label Brand Line\nContract Hospitality Project Batch\nRoyalty Licensing Collaboration",
							'help_text'   => '',
						),
						array(
							'id'          => 'f7',
							'name'        => 'preferred_materials',
							'label'       => 'Preferred primary materials',
							'type'        => 'checkbox_group',
							'placeholder' => '',
							'width'       => 'full',
							'required'    => true,
							'options'     => "Solid Teak & Sheesham\nEuropean White Oak & Walnut\nArchitectural Cast Brass & Iron\nNatural Marble & Indian Sandstone\nWoven Cane & Cord\nFull-grain Leather & Upholstery",
							'help_text'   => '',
						),
						array(
							'id'          => 'f8',
							'name'        => 'portfolio_url',
							'label'       => 'Portfolio / Website URL',
							'type'        => 'url',
							'placeholder' => 'https://',
							'width'       => 'full',
							'required'    => false,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f9',
							'name'        => 'cad_sketches_upload',
							'label'       => 'Attach concept sketches or CAD drawings',
							'type'        => 'file',
							'placeholder' => '',
							'width'       => 'full',
							'required'    => false,
							'options'     => '',
							'help_text'   => 'PDF, DWG preview, JPG, PNG or STEP/ZIP - up to 10 MB',
						),
						array(
							'id'          => 'f10',
							'name'        => 'design_brief',
							'label'       => 'Design concept & production requirements',
							'type'        => 'textarea',
							'placeholder' => 'Describe your designs, expected batch quantities, target price point, and timeline...',
							'width'       => 'full',
							'required'    => true,
							'options'     => '',
							'help_text'   => '',
						),
						array(
							'id'          => 'f11',
							'name'        => 'consent',
							'label'       => 'Consent',
							'type'        => 'checkbox_group',
							'placeholder' => '',
							'width'       => 'full',
							'required'    => true,
							'options'     => 'I agree that Orbit Expo Crafts may contact me regarding this enquiry.',
							'help_text'   => '',
						),
					),
				),
				'seo'             => array(
					'title'         => 'Furniture & Décor Designers Manufacturing Partner | Orbit Expo Crafts',
					'description'   => 'Turn your furniture designs into market-ready handcrafted collections with Orbit Expo Crafts factory manufacturing.',
					'focus_keyword' => 'furniture designer manufacturing partner, white label furniture production, custom woodcraft manufacturing',
					'og_image'      => '',
					'canonical_url' => '/furniture-decor-designers',
					'robots'        => 'index, follow',
				),
			),
		);
	}

	public static function get_all_pages_data() {
		$defaults = self::get_default_configs();
		$saved    = get_option( self::OPTION_KEY, array() );

		if ( ! is_array( $saved ) ) {
			$saved = array();
		}

		$merged = array();
		foreach ( $defaults as $key => $default_page ) {
			if ( isset( $saved[ $key ] ) && is_array( $saved[ $key ] ) ) {
				$merged[ $key ] = array_replace_recursive( $default_page, $saved[ $key ] );
				// If custom fields were explicitly saved, keep the saved fields array as is
				if ( ! empty( $saved[ $key ]['form']['fields'] ) && is_array( $saved[ $key ]['form']['fields'] ) ) {
					$merged[ $key ]['form']['fields'] = $saved[ $key ]['form']['fields'];
				}
			} else {
				$merged[ $key ] = $default_page;
			}
		}

		return $merged;
	}

	public static function get_page_data_by_slug( $slug ) {
		$all_data = self::get_all_pages_data();
		foreach ( $all_data as $key => $page ) {
			if ( $page['slug'] === $slug || $key === $slug ) {
				return $page;
			}
		}
		return null;
	}

	public static function render_admin_page() {
		$active_tab = isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'suppliers_vendors';
		$valid_tabs = array( 'suppliers_vendors', 'interior_designers', 'influencers_marketing', 'furniture_decor_designers' );
		if ( ! in_array( $active_tab, $valid_tabs, true ) ) {
			$active_tab = 'suppliers_vendors';
		}

		// Handle saving settings
		if ( isset( $_POST['hcc_save_business_page'] ) && check_admin_referer( 'hcc_business_page_nonce', 'hcc_business_page_nonce_field' ) ) {
			$all_pages = self::get_all_pages_data();

			$submitted_fields_raw = isset( $_POST['form_fields_json'] ) ? wp_unslash( $_POST['form_fields_json'] ) : '[]';
			$decoded_fields       = json_decode( $submitted_fields_raw, true );
			if ( ! is_array( $decoded_fields ) ) {
				$decoded_fields = array();
			}

			// Clean fields
			$clean_fields = array();
			foreach ( $decoded_fields as $f ) {
				$clean_fields[] = array(
					'id'          => sanitize_text_field( $f['id'] ?? uniqid( 'f_' ) ),
					'name'        => sanitize_key( $f['name'] ?? '' ),
					'label'       => sanitize_text_field( $f['label'] ?? '' ),
					'type'        => sanitize_text_field( $f['type'] ?? 'text' ),
					'placeholder' => sanitize_text_field( $f['placeholder'] ?? '' ),
					'width'       => ( isset( $f['width'] ) && $f['width'] === 'half' ) ? 'half' : 'full',
					'required'    => ! empty( $f['required'] ),
					'options'     => sanitize_textarea_field( $f['options'] ?? '' ),
					'help_text'   => sanitize_text_field( $f['help_text'] ?? '' ),
				);
			}

			$all_pages[ $active_tab ] = array(
				'slug'            => sanitize_title( $_POST['slug'] ?? '' ),
				'tab_number'      => sanitize_text_field( $_POST['tab_number'] ?? '01' ),
				'tab_label'       => sanitize_text_field( $_POST['tab_label'] ?? '' ),
				'page_eyebrow'    => sanitize_text_field( $_POST['page_eyebrow'] ?? 'BUSINESS' ),
				'page_title'      => sanitize_text_field( $_POST['page_title'] ?? '' ),
				'page_subtitle'   => sanitize_textarea_field( $_POST['page_subtitle'] ?? '' ),
				'enquiry_number'  => sanitize_text_field( $_POST['enquiry_number'] ?? '01' ),
				'visual'          => array(
					'image_url' => esc_url_raw( $_POST['visual_image_url'] ?? '' ),
					'tag'       => sanitize_text_field( $_POST['visual_tag'] ?? '' ),
					'headline'  => sanitize_textarea_field( $_POST['visual_headline'] ?? '' ),
				),
				'form'            => array(
					'eyebrow'            => sanitize_text_field( $_POST['form_eyebrow'] ?? '' ),
					'title'              => sanitize_text_field( $_POST['form_title'] ?? '' ),
					'notice'             => sanitize_text_field( $_POST['form_notice'] ?? 'Fields marked * are required.' ),
					'review_note'        => sanitize_text_field( $_POST['form_review_note'] ?? '' ),
					'submit_button_text' => sanitize_text_field( $_POST['form_submit_button_text'] ?? 'Submit enquiry →' ),
					'success_title'      => sanitize_text_field( $_POST['form_success_title'] ?? 'Enquiry Received' ),
					'success_message'    => sanitize_textarea_field( $_POST['form_success_message'] ?? '' ),
					'fields'             => $clean_fields,
				),
				'seo'             => array(
					'title'         => sanitize_text_field( $_POST['seo_title'] ?? '' ),
					'description'   => sanitize_textarea_field( $_POST['seo_description'] ?? '' ),
					'focus_keyword' => sanitize_text_field( $_POST['seo_focus_keyword'] ?? '' ),
					'og_image'      => esc_url_raw( $_POST['seo_og_image'] ?? '' ),
					'canonical_url' => sanitize_text_field( $_POST['seo_canonical_url'] ?? '' ),
					'robots'        => sanitize_text_field( $_POST['seo_robots'] ?? 'index, follow' ),
				),
			);

			update_option( self::OPTION_KEY, $all_pages );

			// Trigger on-demand revalidation on Next.js if configured
			$slug = $all_pages[ $active_tab ]['slug'];
			self::trigger_nextjs_revalidation( $slug );
			$saved_live_url = self::get_frontend_url() . '/' . ltrim( $slug, '/' );

			echo '<div class="notice notice-success is-dismissible"><p><strong>Settings & Form for ' . esc_html( $all_pages[ $active_tab ]['tab_label'] ) . ' updated successfully! Next.js cache revalidated.</strong> <a href="' . esc_url( $saved_live_url ) . '" target="_blank" style="margin-left:10px; font-weight:600; color:#0E5C63; text-decoration:underline;">👁️ View Live Page ↗</a></p></div>';
		}

		$all_pages   = self::get_all_pages_data();
		$current_page = $all_pages[ $active_tab ];
		$live_url     = self::get_frontend_url() . '/' . ltrim( $current_page['slug'], '/' );

		$tab_titles = array(
			'suppliers_vendors'         => '01 Suppliers & Vendors',
			'interior_designers'        => '02 Architects & Interior Designers',
			'influencers_marketing'     => '03 Influencers & Marketing',
			'furniture_decor_designers' => '04 Furniture & Décor Designers',
		);

		$current_admin_page = isset( $_GET['page'] ) ? sanitize_key( $_GET['page'] ) : 'hcc-business-pages';

		?>
		<div class="wrap" style="max-width:1200px;">
			<h1 style="font-size:24px; font-weight:700; color:#1d2327; margin-bottom:6px;">
				🏛️ Business Pages & Dynamic Form Builder
			</h1>
			<p style="color:#50575e; font-size:14px; margin-bottom:20px;">
				Customize every text element, left visual image, overlay card, dynamic form fields, and RankMath SEO metadata for each of the 4 Business section pages. Changes sync in real-time with the Next.js storefront.
			</p>

			<!-- TABS NAVIGATION -->
			<h2 class="nav-tab-wrapper" style="margin-bottom:24px;">
				<?php foreach ( $tab_titles as $t_key => $t_label ) : ?>
					<a href="?page=<?php echo esc_attr( $current_admin_page ); ?>&tab=<?php echo esc_attr( $t_key ); ?>" class="nav-tab <?php echo ( $active_tab === $t_key ) ? 'nav-tab-active' : ''; ?>" style="font-size:14px; font-weight:600;">
						<?php echo esc_html( $t_label ); ?>
					</a>
				<?php endforeach; ?>
			</h2>

			<form method="post" action="" id="hcc_business_page_form">
				<?php wp_nonce_field( 'hcc_business_page_nonce', 'hcc_business_page_nonce_field' ); ?>
				<input type="hidden" name="form_fields_json" id="form_fields_json" value="<?php echo esc_attr( wp_json_encode( $current_page['form']['fields'] ) ); ?>" />

				<!-- SECTION 1: PAGE HEADER & HERO -->
				<div class="postbox" style="background:#fff; border:1px solid #c3c4c7; border-radius:8px; padding:20px 24px; margin-bottom:20px;">
					<h3 style="font-size:17px; font-weight:700; color:#0E5C63; margin-top:0; border-bottom:1px solid #f0f0f1; padding-bottom:10px;">
						1. Top Header & Tab Identification
					</h3>
					<div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
						<div>
							<label style="font-weight:600; font-size:13px; display:block; margin-bottom:4px;">Page Slug (URL Path):</label>
							<div style="display:flex; align-items:center;">
								<span style="background:#f0f0f1; padding:6px 10px; border:1px solid #8c8f94; border-right:none; border-radius:4px 0 0 4px; font-family:monospace; font-size:13px;">/</span>
								<input type="text" name="slug" value="<?php echo esc_attr( $current_page['slug'] ); ?>" style="flex:1; border-radius:0 4px 4px 0;" required />
							</div>
							<p class="description" style="font-size:11px; margin-top:4px;">Live storefront URL: <a href="<?php echo esc_url( $live_url ); ?>" target="_blank" style="color:#0E5C63; font-weight:600; text-decoration:none;"><code><?php echo esc_html( $live_url ); ?> ↗</code></a></p>
						</div>

						<div>
							<label style="font-weight:600; font-size:13px; display:block; margin-bottom:4px;">Tab Label in 2x2 Grid:</label>
							<input type="text" name="tab_label" value="<?php echo esc_attr( $current_page['tab_label'] ); ?>" class="regular-text" style="width:100%;" required />
						</div>

						<div>
							<label style="font-weight:600; font-size:13px; display:block; margin-bottom:4px;">Tab Number (e.g. 01):</label>
							<input type="text" name="tab_number" value="<?php echo esc_attr( $current_page['tab_number'] ); ?>" style="width:100%;" />
						</div>

						<div>
							<label style="font-weight:600; font-size:13px; display:block; margin-bottom:4px;">Enquiry Indicator (e.g. 01, ENQUIRY FORM 01):</label>
							<input type="text" name="enquiry_number" value="<?php echo esc_attr( $current_page['enquiry_number'] ); ?>" style="width:100%;" />
						</div>

						<div style="grid-column: span 2;">
							<label style="font-weight:600; font-size:13px; display:block; margin-bottom:4px;">Top Eyebrow Text:</label>
							<input type="text" name="page_eyebrow" value="<?php echo esc_attr( $current_page['page_eyebrow'] ); ?>" style="width:100%;" />
						</div>

						<div style="grid-column: span 2;">
							<label style="font-weight:600; font-size:13px; display:block; margin-bottom:4px;">Main Serif Heading (EB Garamond):</label>
							<input type="text" name="page_title" value="<?php echo esc_attr( $current_page['page_title'] ); ?>" style="width:100%; font-size:15px;" required />
						</div>

						<div style="grid-column: span 2;">
							<label style="font-weight:600; font-size:13px; display:block; margin-bottom:4px;">Header Subtitle Description:</label>
							<textarea name="page_subtitle" rows="2" style="width:100%;"><?php echo esc_textarea( $current_page['page_subtitle'] ); ?></textarea>
						</div>
					</div>
				</div>

				<!-- SECTION 2: LEFT VISUAL SHOWCASE & OVERLAY TEXT -->
				<div class="postbox" style="background:#fff; border:1px solid #c3c4c7; border-radius:8px; padding:20px 24px; margin-bottom:20px;">
					<h3 style="font-size:17px; font-weight:700; color:#0E5C63; margin-top:0; border-bottom:1px solid #f0f0f1; padding-bottom:10px;">
						2. Left Visual Card & Bottom Floating Overlay
					</h3>
					<div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
						<div style="grid-column: span 2;">
							<label style="font-weight:600; font-size:13px; display:block; margin-bottom:4px;">Visual Image URL:</label>
							<div style="display:flex; gap:10px; align-items:center;">
								<input type="text" name="visual_image_url" id="visual_image_url" value="<?php echo esc_attr( $current_page['visual']['image_url'] ); ?>" style="flex:1;" />
								<button type="button" class="button" id="btn_select_visual_image">📷 Choose / Upload Image</button>
							</div>
							<div id="visual_image_preview" style="margin-top:10px;">
								<?php if ( ! empty( $current_page['visual']['image_url'] ) ) : ?>
									<img src="<?php echo esc_url( $current_page['visual']['image_url'] ); ?>" style="max-height:140px; border-radius:6px; border:1px solid #ddd;" />
								<?php endif; ?>
							</div>
						</div>

						<div>
							<label style="font-weight:600; font-size:13px; display:block; margin-bottom:4px;">Overlay Badge Tag (Small Tracked Pill):</label>
							<input type="text" name="visual_tag" value="<?php echo esc_attr( $current_page['visual']['tag'] ); ?>" style="width:100%;" placeholder="MADE IN JODHPUR · MADE FOR THE WORLD" />
						</div>

						<div>
							<label style="font-weight:600; font-size:13px; display:block; margin-bottom:4px;">Overlay Headline (Serif Quote):</label>
							<textarea name="visual_headline" rows="2" style="width:100%;"><?php echo esc_textarea( $current_page['visual']['headline'] ); ?></textarea>
						</div>
					</div>
				</div>

				<!-- SECTION 3: FORM HEADINGS & TEXTS -->
				<div class="postbox" style="background:#fff; border:1px solid #c3c4c7; border-radius:8px; padding:20px 24px; margin-bottom:20px;">
					<h3 style="font-size:17px; font-weight:700; color:#0E5C63; margin-top:0; border-bottom:1px solid #f0f0f1; padding-bottom:10px;">
						3. Form Titles, Notices & Submit Configuration
					</h3>
					<div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
						<div>
							<label style="font-weight:600; font-size:13px; display:block; margin-bottom:4px;">Form Eyebrow:</label>
							<input type="text" name="form_eyebrow" value="<?php echo esc_attr( $current_page['form']['eyebrow'] ); ?>" style="width:100%;" />
						</div>

						<div>
							<label style="font-weight:600; font-size:13px; display:block; margin-bottom:4px;">Form Title / Heading:</label>
							<input type="text" name="form_title" value="<?php echo esc_attr( $current_page['form']['title'] ); ?>" style="width:100%; font-size:14px;" required />
						</div>

						<div>
							<label style="font-weight:600; font-size:13px; display:block; margin-bottom:4px;">Required Fields Notice:</label>
							<input type="text" name="form_notice" value="<?php echo esc_attr( $current_page['form']['notice'] ); ?>" style="width:100%;" placeholder="Fields marked * are required." />
						</div>

						<div>
							<label style="font-weight:600; font-size:13px; display:block; margin-bottom:4px;">Review Timeline Note:</label>
							<input type="text" name="form_review_note" value="<?php echo esc_attr( $current_page['form']['review_note'] ); ?>" style="width:100%;" placeholder="We usually review business enquiries within 2–3 working days." />
						</div>

						<div>
							<label style="font-weight:600; font-size:13px; display:block; margin-bottom:4px;">Submit Button Text:</label>
							<input type="text" name="form_submit_button_text" value="<?php echo esc_attr( $current_page['form']['submit_button_text'] ); ?>" style="width:100%;" placeholder="Submit enquiry →" />
						</div>

						<div>
							<label style="font-weight:600; font-size:13px; display:block; margin-bottom:4px;">Submission Success Modal Title:</label>
							<input type="text" name="form_success_title" value="<?php echo esc_attr( $current_page['form']['success_title'] ); ?>" style="width:100%;" />
						</div>

						<div style="grid-column: span 2;">
							<label style="font-weight:600; font-size:13px; display:block; margin-bottom:4px;">Submission Success Message:</label>
							<textarea name="form_success_message" rows="2" style="width:100%;"><?php echo esc_textarea( $current_page['form']['success_message'] ); ?></textarea>
						</div>
					</div>
				</div>

				<!-- SECTION 4: INTERACTIVE DYNAMIC FORM BUILDER -->
				<div class="postbox" style="background:#fff; border:1px solid #c3c4c7; border-radius:8px; padding:20px 24px; margin-bottom:20px;">
					<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f0f0f1; padding-bottom:12px; margin-bottom:16px;">
						<div>
							<h3 style="font-size:17px; font-weight:700; color:#0E5C63; margin:0;">
								4. Interactive Form Builder (Drag, Add, Edit & Remove Fields)
							</h3>
							<p style="margin:4px 0 0; color:#666; font-size:13px;">
								Client can add custom fields, adjust widths (half or full), edit options, and set required validation.
							</p>
						</div>
						<button type="button" class="button button-primary" id="btn_add_form_field" style="background:#0E5C63; border-color:#0E5C63; font-weight:600;">
							➕ Add New Field
						</button>
					</div>

					<div id="form_builder_container" style="display:flex; flex-direction:column; gap:12px;">
						<!-- Dynamic rows rendered via JavaScript below -->
					</div>
				</div>

				<!-- SECTION 5: RANKMATH & SEO METADATA -->
				<div class="postbox" style="background:#fff; border:1px solid #c3c4c7; border-radius:8px; padding:20px 24px; margin-bottom:24px;">
					<h3 style="font-size:17px; font-weight:700; color:#0E5C63; margin-top:0; border-bottom:1px solid #f0f0f1; padding-bottom:10px;">
						5. RankMath SEO & Social Sharing Metadata
					</h3>
					<div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
						<div style="grid-column: span 2;">
							<label style="font-weight:600; font-size:13px; display:block; margin-bottom:4px;">SEO Title Tag:</label>
							<input type="text" name="seo_title" value="<?php echo esc_attr( $current_page['seo']['title'] ); ?>" style="width:100%;" />
							<p class="description" style="font-size:11px; margin-top:4px;">Appears in Google search results and browser title.</p>
						</div>

						<div style="grid-column: span 2;">
							<label style="font-weight:600; font-size:13px; display:block; margin-bottom:4px;">Meta Description:</label>
							<textarea name="seo_description" rows="2" style="width:100%;"><?php echo esc_textarea( $current_page['seo']['description'] ); ?></textarea>
							<p class="description" style="font-size:11px; margin-top:4px;">Concise 150–160 character snippet for search engines.</p>
						</div>

						<div>
							<label style="font-weight:600; font-size:13px; display:block; margin-bottom:4px;">Focus Keywords:</label>
							<input type="text" name="seo_focus_keyword" value="<?php echo esc_attr( $current_page['seo']['focus_keyword'] ); ?>" style="width:100%;" />
						</div>

						<div>
							<label style="font-weight:600; font-size:13px; display:block; margin-bottom:4px;">Robots Indexing:</label>
							<select name="seo_robots" style="width:100%;">
								<option value="index, follow" <?php selected( $current_page['seo']['robots'], 'index, follow' ); ?>>index, follow (Standard Recommended)</option>
								<option value="noindex, follow" <?php selected( $current_page['seo']['robots'], 'noindex, follow' ); ?>>noindex, follow</option>
								<option value="noindex, nofollow" <?php selected( $current_page['seo']['robots'], 'noindex, nofollow' ); ?>>noindex, nofollow</option>
							</select>
						</div>

						<div>
							<label style="font-weight:600; font-size:13px; display:block; margin-bottom:4px;">Canonical URL:</label>
							<input type="text" name="seo_canonical_url" value="<?php echo esc_attr( $current_page['seo']['canonical_url'] ); ?>" style="width:100%;" />
						</div>

						<div>
							<label style="font-weight:600; font-size:13px; display:block; margin-bottom:4px;">Social Share Image (OG Image):</label>
							<div style="display:flex; gap:10px;">
								<input type="text" name="seo_og_image" id="seo_og_image" value="<?php echo esc_attr( $current_page['seo']['og_image'] ); ?>" style="flex:1;" />
								<button type="button" class="button" id="btn_select_og_image">Choose</button>
							</div>
						</div>
					</div>
				</div>

				<!-- SAVE BUTTON -->
				<div style="position:sticky; bottom:20px; z-index:10; background:#fff; padding:16px 24px; border:1px solid #c3c4c7; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.08); display:flex; justify-content:space-between; align-items:center;">
					<div style="font-size:13px; color:#50575e;">
						Editing: <strong><?php echo esc_html( $current_page['tab_label'] ); ?></strong> (<a href="<?php echo esc_url( $live_url ); ?>" target="_blank" style="color:#0E5C63; text-decoration:none;"><code><?php echo esc_html( $live_url ); ?> ↗</code></a>)
					</div>
					<div>
						<a href="<?php echo esc_url( $live_url ); ?>" target="_blank" class="button" style="margin-right:10px; font-weight:600;">
							👁️ View Live on Storefront ↗
						</a>
						<button type="submit" name="hcc_save_business_page" class="button button-primary button-large" style="background:#0E5C63; border-color:#0E5C63; font-weight:700; padding:4px 20px;">
							💾 Save &amp; Publish Page
						</button>
					</div>
				</div>
			</form>
		</div>

		<script>
		document.addEventListener('DOMContentLoaded', function() {
			var fieldsJsonInput = document.getElementById('form_fields_json');
			var container = document.getElementById('form_builder_container');
			var fields = [];

			try {
				fields = JSON.parse(fieldsJsonInput.value) || [];
			} catch (e) {
				fields = [];
			}

			function updateHiddenInput() {
				fieldsJsonInput.value = JSON.stringify(fields);
			}

			function renderFields() {
				container.innerHTML = '';
				if (fields.length === 0) {
					container.innerHTML = '<div style="padding:24px; background:#f9f9f9; text-align:center; border:2px dashed #ddd; border-radius:6px; color:#888;">No form fields created yet. Click <strong>➕ Add New Field</strong> above to start.</div>';
					return;
				}

				fields.forEach(function(field, idx) {
					var item = document.createElement('div');
					item.className = 'hcc-field-card';
					item.style.cssText = 'background:#fcfcfc; border:1px solid #ccd0d4; border-radius:6px; padding:14px 16px; position:relative;';

					var fieldTypes = [
						{ value: 'text', label: 'Single-line Text' },
						{ value: 'email', label: 'Email Address' },
						{ value: 'tel', label: 'Phone / WhatsApp (+Country Code)' },
						{ value: 'select', label: 'Dropdown Select' },
						{ value: 'checkbox_group', label: 'Checkbox Options' },
						{ value: 'textarea', label: 'Multi-line Paragraph' },
						{ value: 'file', label: 'File Upload (PDF / DWG / JPG / PNG)' },
						{ value: 'url', label: 'Website / Portfolio URL' },
						{ value: 'number', label: 'Number' }
					];

					var typeOptionsHtml = fieldTypes.map(function(t) {
						return '<option value="' + t.value + '"' + (field.type === t.value ? ' selected' : '') + '>' + t.label + '</option>';
					}).join('');

					var showOptions = (field.type === 'select' || field.type === 'checkbox_group');

					item.innerHTML = `
						<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #eee; padding-bottom:8px;">
							<div style="display:flex; align-items:center; gap:8px;">
								<span style="background:#0E5C63; color:#fff; font-size:11px; font-weight:700; padding:2px 7px; border-radius:4px;">#${idx + 1}</span>
								<strong style="font-size:13px; color:#2c3338;">${escapeHtml(field.label || 'Untitled Field')}</strong>
								<span style="font-size:11px; color:#888; font-family:monospace;">[key: ${escapeHtml(field.name || 'field_' + idx)}]</span>
							</div>
							<div style="display:flex; gap:6px;">
								<button type="button" class="button button-small btn-move-up" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''}>▲ Up</button>
								<button type="button" class="button button-small btn-move-down" data-idx="${idx}" ${idx === fields.length - 1 ? 'disabled' : ''}>▼ Down</button>
								<button type="button" class="button button-small button-link-delete btn-delete-field" data-idx="${idx}" style="color:#b32d2e;">✕ Delete</button>
							</div>
						</div>

						<div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:12px;">
							<div>
								<label style="font-size:11px; font-weight:600; display:block; color:#50575e; margin-bottom:2px;">Field Label *</label>
								<input type="text" class="field-label" data-idx="${idx}" value="${escapeHtml(field.label || '')}" style="width:100%;" required />
							</div>

							<div>
								<label style="font-size:11px; font-weight:600; display:block; color:#50575e; margin-bottom:2px;">Field Key (Unique Name) *</label>
								<input type="text" class="field-name" data-idx="${idx}" value="${escapeHtml(field.name || '')}" style="width:100%;" required />
							</div>

							<div>
								<label style="font-size:11px; font-weight:600; display:block; color:#50575e; margin-bottom:2px;">Input Type</label>
								<select class="field-type" data-idx="${idx}" style="width:100%;">
									${typeOptionsHtml}
								</select>
							</div>

							<div>
								<label style="font-size:11px; font-weight:600; display:block; color:#50575e; margin-bottom:2px;">Grid Layout Width</label>
								<select class="field-width" data-idx="${idx}" style="width:100%;">
									<option value="half" ${field.width === 'half' ? 'selected' : ''}>Half Width (2-Col Grid)</option>
									<option value="full" ${field.width === 'full' ? 'selected' : ''}>Full Width (1-Col)</option>
								</select>
							</div>

							<div style="grid-column: span 2;">
								<label style="font-size:11px; font-weight:600; display:block; color:#50575e; margin-bottom:2px;">Placeholder / Subtext</label>
								<input type="text" class="field-placeholder" data-idx="${idx}" value="${escapeHtml(field.placeholder || '')}" style="width:100%;" />
							</div>

							<div>
								<label style="font-size:11px; font-weight:600; display:block; color:#50575e; margin-bottom:2px;">Required Validation</label>
								<label style="display:flex; align-items:center; margin-top:6px; font-size:12px; cursor:pointer;">
									<input type="checkbox" class="field-required" data-idx="${idx}" ${field.required ? 'checked' : ''} style="margin-right:6px;" />
									Mandatory field (*)
								</label>
							</div>

							<div>
								<label style="font-size:11px; font-weight:600; display:block; color:#50575e; margin-bottom:2px;">Help Text (Below input)</label>
								<input type="text" class="field-help" data-idx="${idx}" value="${escapeHtml(field.help_text || '')}" style="width:100%;" />
							</div>

							<div class="options-container" style="grid-column: span 4; display: ${showOptions ? 'block' : 'none'}; background:#f0f0f1; padding:10px 12px; border-radius:4px; margin-top:4px;">
								<label style="font-size:12px; font-weight:600; display:block; color:#2c3338; margin-bottom:4px;">Dropdown / Checkbox Choices (One option per line):</label>
								<textarea class="field-options" data-idx="${idx}" rows="4" style="width:100%; font-family:monospace; font-size:12px;" placeholder="Option 1&#10;Option 2&#10;Option 3">${escapeHtml(field.options || '')}</textarea>
							</div>
						</div>
					`;

					container.appendChild(item);
				});

				bindEvents();
			}

			function bindEvents() {
				container.querySelectorAll('.field-label').forEach(function(el) {
					el.addEventListener('input', function() {
						var idx = parseInt(el.getAttribute('data-idx'), 10);
						fields[idx].label = el.value;
						// auto slugify key if blank
						if (!fields[idx].name || fields[idx].name.startsWith('field_')) {
							fields[idx].name = el.value.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
							var nameInput = container.querySelector('.field-name[data-idx="' + idx + '"]');
							if (nameInput) nameInput.value = fields[idx].name;
						}
						updateHiddenInput();
					});
				});

				container.querySelectorAll('.field-name').forEach(function(el) {
					el.addEventListener('input', function() {
						var idx = parseInt(el.getAttribute('data-idx'), 10);
						fields[idx].name = el.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
						updateHiddenInput();
					});
				});

				container.querySelectorAll('.field-type').forEach(function(el) {
					el.addEventListener('change', function() {
						var idx = parseInt(el.getAttribute('data-idx'), 10);
						fields[idx].type = el.value;
						var optBox = el.closest('.hcc-field-card').querySelector('.options-container');
						if (optBox) {
							optBox.style.display = (el.value === 'select' || el.value === 'checkbox_group') ? 'block' : 'none';
						}
						updateHiddenInput();
					});
				});

				container.querySelectorAll('.field-width').forEach(function(el) {
					el.addEventListener('change', function() {
						var idx = parseInt(el.getAttribute('data-idx'), 10);
						fields[idx].width = el.value;
						updateHiddenInput();
					});
				});

				container.querySelectorAll('.field-placeholder').forEach(function(el) {
					el.addEventListener('input', function() {
						var idx = parseInt(el.getAttribute('data-idx'), 10);
						fields[idx].placeholder = el.value;
						updateHiddenInput();
					});
				});

				container.querySelectorAll('.field-required').forEach(function(el) {
					el.addEventListener('change', function() {
						var idx = parseInt(el.getAttribute('data-idx'), 10);
						fields[idx].required = el.checked;
						updateHiddenInput();
					});
				});

				container.querySelectorAll('.field-help').forEach(function(el) {
					el.addEventListener('input', function() {
						var idx = parseInt(el.getAttribute('data-idx'), 10);
						fields[idx].help_text = el.value;
						updateHiddenInput();
					});
				});

				container.querySelectorAll('.field-options').forEach(function(el) {
					el.addEventListener('input', function() {
						var idx = parseInt(el.getAttribute('data-idx'), 10);
						fields[idx].options = el.value;
						updateHiddenInput();
					});
				});

				container.querySelectorAll('.btn-move-up').forEach(function(el) {
					el.addEventListener('click', function() {
						var idx = parseInt(el.getAttribute('data-idx'), 10);
						if (idx > 0) {
							var temp = fields[idx - 1];
							fields[idx - 1] = fields[idx];
							fields[idx] = temp;
							updateHiddenInput();
							renderFields();
						}
					});
				});

				container.querySelectorAll('.btn-move-down').forEach(function(el) {
					el.addEventListener('click', function() {
						var idx = parseInt(el.getAttribute('data-idx'), 10);
						if (idx < fields.length - 1) {
							var temp = fields[idx + 1];
							fields[idx + 1] = fields[idx];
							fields[idx] = temp;
							updateHiddenInput();
							renderFields();
						}
					});
				});

				container.querySelectorAll('.btn-delete-field').forEach(function(el) {
					el.addEventListener('click', function() {
						var idx = parseInt(el.getAttribute('data-idx'), 10);
						if (confirm('Delete field "' + (fields[idx].label || 'Untitled') + '"?')) {
							fields.splice(idx, 1);
							updateHiddenInput();
							renderFields();
						}
					});
				});
			}

			document.getElementById('btn_add_form_field').addEventListener('click', function() {
				fields.push({
					id: 'f_' + Date.now(),
					name: 'custom_field_' + (fields.length + 1),
					label: 'New Form Field',
					type: 'text',
					placeholder: '',
					width: 'half',
					required: false,
					options: '',
					help_text: ''
				});
				updateHiddenInput();
				renderFields();
			});

			function escapeHtml(text) {
				if (!text) return '';
				return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
			}

			// Media uploader for Left Visual
			var visualUploader;
			document.getElementById('btn_select_visual_image').addEventListener('click', function(e) {
				e.preventDefault();
				if (visualUploader) {
					visualUploader.open();
					return;
				}
				visualUploader = wp.media({
					title: 'Choose Left Visual Image',
					button: { text: 'Use this Image' },
					multiple: false
				});
				visualUploader.on('select', function() {
					var attachment = visualUploader.state().get('selection').first().toJSON();
					document.getElementById('visual_image_url').value = attachment.url;
					document.getElementById('visual_image_preview').innerHTML = '<img src="' + attachment.url + '" style="max-height:140px; border-radius:6px; border:1px solid #ddd;" />';
				});
				visualUploader.open();
			});

			// Media uploader for OG Image
			var ogUploader;
			document.getElementById('btn_select_og_image').addEventListener('click', function(e) {
				e.preventDefault();
				if (ogUploader) {
					ogUploader.open();
					return;
				}
				ogUploader = wp.media({
					title: 'Choose Social Share (OG) Image',
					button: { text: 'Use as OG Image' },
					multiple: false
				});
				ogUploader.on('select', function() {
					var attachment = ogUploader.state().get('selection').first().toJSON();
					document.getElementById('seo_og_image').value = attachment.url;
				});
				ogUploader.open();
			});

			renderFields();
		});
		</script>
		<?php
	}

	/**
	 * Get the frontend storefront URL
	 */
	public static function get_frontend_url() {
		$frontend_url = get_option( 'hcc_frontend_url', '' );
		if ( empty( $frontend_url ) && defined( 'HCC_FRONTEND_URL' ) ) {
			$frontend_url = HCC_FRONTEND_URL;
		}

		$host = isset( $_SERVER['HTTP_HOST'] ) ? sanitize_text_field( $_SERVER['HTTP_HOST'] ) : '';
		$is_production_wp = ( strpos( $host, 'orbitexpocrafts.com' ) !== false );
		$is_local_wp = ( strpos( $host, '.local' ) !== false || strpos( $host, 'localhost' ) !== false || strpos( $host, '127.0.0.1' ) !== false );

		if ( empty( $frontend_url ) ) {
			if ( $is_local_wp ) {
				$frontend_url = 'http://localhost:3000';
			} else {
				$frontend_url = 'https://orbitexpocrafts.com';
			}
		} elseif ( $is_production_wp && strpos( $frontend_url, 'localhost' ) !== false ) {
			$frontend_url = 'https://orbitexpocrafts.com';
		}

		return rtrim( $frontend_url, '/' );
	}

	/**
	 * Trigger Next.js on-demand revalidation
	 */
	public static function trigger_nextjs_revalidation( $slug ) {
		$secret = get_option( 'hcc_revalidate_secret', '' );
		if ( empty( $secret ) ) {
			$secret = defined( 'HCC_REVALIDATION_SECRET' ) ? HCC_REVALIDATION_SECRET : 'orbit_headless_revalidate_2026';
		}

		$frontend_url = self::get_frontend_url();
		
		$url = add_query_arg( array(
			'secret' => $secret,
			'path'   => '/' . ltrim( $slug, '/' ),
			'tag'    => 'business-pages',
		), $frontend_url . '/api/revalidate' );

		wp_remote_get( $url, array(
			'timeout'   => 2,
			'sslverify' => false,
		) );
	}
}
