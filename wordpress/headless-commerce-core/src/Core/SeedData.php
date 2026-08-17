<?php

namespace HeadlessCommerceCore\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * WooCommerce Seeder for Categories, Attributes (pa_segment, pa_material, pa_color) and Product Assignments
 */
class SeedData {

	public static function run() {
		if ( ! class_exists( 'WooCommerce' ) ) {
			return false;
		}

		self::seed_attributes();
		self::seed_categories();
		self::seed_products();

		return true;
	}

	public static function seed_attributes() {
		$attributes = array(
			array(
				'slug'         => 'segment',
				'name'         => 'Space / Segment',
				'type'         => 'select',
				'order_by'     => 'menu_order',
				'has_archives' => true,
				'terms'        => array(
					'Hotel Guestroom', 'Hotel Lobby', 'Restaurant', 'Café', 'Bar & Nightclub', 'Banquet & Events',
					'Resort & Villa', 'Corporate Office', 'Co-working', 'Retail Store', 'Healthcare', 'Education', 'Residential',
					'Outdoor & Poolside', 'Airport & Transit', 'Export / Wholesale',
				),
			),
			array(
				'slug'         => 'material',
				'name'         => 'Material / Craft',
				'type'         => 'select',
				'order_by'     => 'menu_order',
				'has_archives' => true,
				'terms'        => array(
					'Solid Sheesham', 'Solid Teak', 'Solid Mango', 'Solid Acacia', 'Engineered Panel', 'MS / Powder Coated Metal',
					'Brass & Bronze', 'Stainless Steel', 'Bone Inlay', 'Marble & Stone', 'Terrazzo', 'Cane & Rattan', 'Rope Weave', 'Resin',
					'Tile Inlay', 'Hand Carving', 'Upholstery Fabric', 'Genuine Leather', 'Vegan Leather', 'Glass', 'Reclaimed Wood',
				),
			),
			array(
				'slug'         => 'color',
				'name'         => 'Color / Finish',
				'type'         => 'select',
				'order_by'     => 'menu_order',
				'has_archives' => true,
				'terms'        => array(
					'Natural Oil', 'Walnut Stain', 'Ebony Matt', 'Antique Brass',
					'Bone White', 'Forest Lacquer', 'Terracotta PU', 'Graphite Metal',
				),
			),
		);

		foreach ( $attributes as $attr ) {
			$taxonomy_name = wc_attribute_taxonomy_name( $attr['slug'] );
			$attr_id       = wc_attribute_taxonomy_id_by_name( $attr['slug'] );

			if ( ! $attr_id ) {
				$attr_id = wc_create_attribute( array(
					'name'         => $attr['name'],
					'slug'         => $attr['slug'],
					'type'         => $attr['type'],
					'order_by'     => $attr['order_by'],
					'has_archives' => $attr['has_archives'],
				) );
			}

			// Register taxonomy dynamically for current execution
			if ( ! taxonomy_exists( $taxonomy_name ) ) {
				register_taxonomy(
					$taxonomy_name,
					array( 'product' ),
					array(
						'labels'       => array( 'name' => $attr['name'] ),
						'hierarchical' => false,
						'show_ui'      => false,
						'query_var'    => true,
						'rewrite'      => false,
					)
				);
			}

			$color_hex_map = array(
				'Natural Oil'    => '#C8A06A',
				'Walnut Stain'   => '#6B4426',
				'Ebony Matt'     => '#231F1C',
				'Antique Brass'  => '#A98337',
				'Bone White'     => '#EFE7DA',
				'Forest Lacquer' => '#20402F',
				'Terracotta PU'  => '#B85735',
				'Graphite Metal' => '#4A4E54',
			);

			foreach ( $attr['terms'] as $term_name ) {
				$term = term_exists( $term_name, $taxonomy_name );
				if ( ! $term ) {
					$term = wp_insert_term( $term_name, $taxonomy_name );
				}
				if ( 'pa_color' === $taxonomy_name && ! is_wp_error( $term ) && ! empty( $term['term_id'] ) ) {
					$hex = isset( $color_hex_map[$term_name] ) ? $color_hex_map[$term_name] : '#C8A06A';
					update_term_meta( $term['term_id'], 'hcc_color_hex', $hex );
					update_term_meta( $term['term_id'], 'color_hex', $hex );
				}
			}
		}

		delete_transient( 'wc_attribute_taxonomies' );
	}

	public static function seed_categories() {
		$categories = array(
			array( 'name' => 'Seating', 'slug' => 'seating', 'desc' => 'Dining chairs, accent armchairs, lounge chairs, bar stools & ottomans.' ),
			array( 'name' => 'Tables & Desks', 'slug' => 'tables', 'desc' => 'Dining tables, console tables, coffee tables & study desks.' ),
			array( 'name' => 'Sofas & Lounge', 'slug' => 'sofas', 'desc' => 'Chesterfield sofas, sectionals, chaise lounges & banquettes.' ),
			array( 'name' => 'Beds & Bedroom', 'slug' => 'beds', 'desc' => 'King canopy beds, upholstered headboards, nightstands & luggage racks.' ),
			array( 'name' => 'Storage & Casegoods', 'slug' => 'storage', 'desc' => 'Hand-carved sideboards, wardrobes, minibar cabinets & TV units.' ),
			array( 'name' => 'Benches & Ottomans', 'slug' => 'benches', 'desc' => 'Upholstered benches, wooden garden benches & footstools.' ),
			array( 'name' => 'Outdoor & Poolside', 'slug' => 'outdoor', 'desc' => 'Rope weave lounges, teak outdoor sets & poolside sunbeds.' ),
			array( 'name' => 'Lighting', 'slug' => 'lighting', 'desc' => 'Brass pendants, floor lamps, wall sconces & chandeliers.' ),
			array( 'name' => 'Decor & Mirrors', 'slug' => 'decor', 'desc' => 'Carved arch mirrors, wall panels & decorative artefacts.' ),
			array( 'name' => 'Fit-out & Counters', 'slug' => 'fitout', 'desc' => 'Reception desks, bar counters, buffet stations & fixed joinery.' ),
		);

		foreach ( $categories as $c ) {
			if ( ! term_exists( $c['slug'], 'product_cat' ) ) {
				wp_insert_term( $c['name'], 'product_cat', array(
					'slug'        => $c['slug'],
					'description' => $c['desc'],
				) );
			}
		}
	}

	public static function seed_products() {
		// 1. Remove all existing products to ensure a clean sync with orbit-prototype.html
		$existing_products = get_posts( array(
			'post_type'   => 'product',
			'numberposts' => -1,
			'post_status' => 'any',
			'fields'      => 'ids',
		) );

		foreach ( $existing_products as $pid ) {
			wp_delete_post( $pid, true );
		}

		// 2. Programmatically generate 206 products matching orbit-prototype.html exactly
		$categories_data = array(
			array('id'=>'seating', 'name'=>'Seating', 'types'=>array('Dining Chair','Arm Chair','Accent Chair','Lounge Chair','Bar Chair','Bar Stool','Side Chair','Recliner','Rocking Chair','Outdoor Chair','Stool','Pouf','Nursing Chair','Desk Chair')),
			array('id'=>'tables',  'name'=>'Tables & Desks', 'types'=>array('Dining Table','Coffee Table','Centre Table','Side Table','End Table','Console Table','Bar Table','Conference Table','Study Desk','Reception Desk','Drink Table','Nesting Table','Outdoor Dining Table')),
			array('id'=>'sofas',   'name'=>'Sofas & Lounge', 'types'=>array('Single Seater','Two Seater','Three Seater','Sectional Sofa','Chesterfield','Sofa cum Bed','Chaise Lounge','Settee','Modular Lounge','Banquette','Outdoor Sofa')),
			array('id'=>'beds',    'name'=>'Beds & Bedroom', 'types'=>array('King Bed','Queen Bed','Upholstered Bed','Storage Bed','Day Bed','Headboard','Bunk Bed','Bedside Table','Dresser','Luggage Rack')),
			array('id'=>'storage', 'name'=>'Storage & Casegoods', 'types'=>array('Wardrobe','Almirah','Chest of Drawers','Sideboard','Buffet','Display Cabinet','Bar Cabinet','TV Unit','Bookshelf','Shoe Rack','Room Divider','Minibar Unit')),
			array('id'=>'benches', 'name'=>'Benches & Ottomans', 'types'=>array('Upholstered Bench','Wooden Bench','Storage Bench','Dining Bench','Garden Bench','Ottoman','Foot Stool')),
			array('id'=>'outdoor', 'name'=>'Outdoor & Poolside', 'types'=>array('Outdoor Dining Set','Outdoor Sofa','Sun Lounger','Garden Bench','Swing / Jhula','Planter','Gazebo Seating','Cabana','Parasol Base')),
			array('id'=>'lighting','name'=>'Lighting', 'types'=>array('Pendant','Floor Lamp','Table Lamp','Wall Sconce','Chandelier','Lampshade','Lamp Stand')),
			array('id'=>'decor',   'name'=>'Decor & Mirrors', 'types'=>array('Mirror','Wall Panel','Wall Cladding','Jaali Screen','Art Frame','Tray','Vase Stand','Handwoven Panel')),
			array('id'=>'fitout',  'name'=>'Fit-out & Counters', 'types'=>array('Serving Counter','Bar Counter','Reception Counter','Buffet Counter','Host Station','Trolley / Cart','Fixed Joinery','Wall Wardrobe')),
		);

		$adjectives = array('Marwar','Bishangarh','Chittor','Amrai','Ranakpur','Kumbhal','Sadri','Jaisalmer','Sardar','Bagore',
			'Udai','Mandore','Osian','Nagaur','Barmer','Pichola','Aravalli','Toorji','Rao','Deogarh','Salawas','Pushkar');

		$segments = array('Hotel Guestroom','Hotel Lobby','Restaurant','Café','Bar & Nightclub','Banquet & Events',
			'Resort & Villa','Corporate Office','Co-working','Retail Store','Healthcare','Education','Residential',
			'Outdoor & Poolside','Airport & Transit','Export / Wholesale');

		$materials = array('Solid Sheesham','Solid Teak','Solid Mango','Solid Acacia','Engineered Panel','MS / Powder Coated Metal',
			'Brass & Bronze','Stainless Steel','Bone Inlay','Marble & Stone','Terrazzo','Cane & Rattan','Rope Weave','Resin',
			'Tile Inlay','Hand Carving','Upholstery Fabric','Genuine Leather','Vegan Leather','Glass','Reclaimed Wood');

		$finishes = array('Natural Oil','Walnut Stain','Ebony Matt','Antique Brass','Bone White','Forest Lacquer','Terracotta PU','Graphite Metal');

		$moq_options  = array(1, 5, 10, 20, 25, 50);
		$lead_options = array(15, 21, 30, 45, 60);

		$dims_map = array(
			'seating'  => array('45 × 52 × 86 cm','58 × 62 × 78 cm','52 × 55 × 92 cm','70 × 74 × 72 cm','42 × 46 × 105 cm','48 × 50 × 45 cm'),
			'tables'   => array('180 × 90 × 76 cm','120 × 60 × 45 cm','90 × 90 × 75 cm','240 × 110 × 76 cm','45 × 45 × 55 cm','60 × 60 × 72 cm'),
			'sofas'    => array('210 × 88 × 80 cm','160 × 86 × 78 cm','260 × 95 × 82 cm','190 × 180 × 72 cm','85 × 90 × 84 cm','300 × 100 × 70 cm'),
			'beds'     => array('198 × 203 × 120 cm','168 × 203 × 110 cm','210 × 215 × 135 cm','190 × 90 × 45 cm','200 × 20 × 140 cm','45 × 40 × 55 cm'),
			'storage'  => array('120 × 45 × 180 cm','90 × 50 × 200 cm','180 × 45 × 80 cm','100 × 40 × 160 cm','60 × 45 × 120 cm','220 × 50 × 90 cm'),
			'benches'  => array('140 × 40 × 45 cm','180 × 45 × 48 cm','120 × 42 × 50 cm','60 × 60 × 42 cm','45 × 45 × 40 cm','200 × 45 × 46 cm'),
			'outdoor'  => array('200 × 100 × 74 cm','220 × 90 × 70 cm','195 × 68 × 38 cm','160 × 60 × 85 cm','50 × 50 × 60 cm','300 × 300 × 240 cm'),
			'lighting' => array('35 × 35 × 45 cm','40 × 40 × 160 cm','28 × 28 × 55 cm','15 × 20 × 35 cm','80 × 80 × 90 cm','45 × 45 × 30 cm'),
			'decor'    => array('90 × 4 × 180 cm','120 × 3 × 90 cm','60 × 3 × 120 cm','240 × 5 × 270 cm','50 × 4 × 70 cm','100 × 2 × 200 cm'),
			'fitout'   => array('240 × 70 × 110 cm','180 × 60 × 105 cm','300 × 80 × 115 cm','120 × 60 × 95 cm','90 × 55 × 100 cm','400 × 65 × 110 cm'),
		);

		$pid = 0;

		foreach ( $categories_data as $cat_info ) {
			$cat_slug = $cat_info['id'];
			$cat_term = get_term_by( 'slug', $cat_slug, 'product_cat' );

			foreach ( $cat_info['types'] as $type_name ) {
				for ( $k = 0; $k < 2; $k++ ) {
					$pid++;
					$seed          = ( $pid * 37 ) % count( $adjectives );
					$sku           = 'ORB-' . ( 1000 + $pid );
					$title         = $adjectives[$seed] . ' ' . $type_name;
					$slug          = sanitize_title( $title . '-' . $sku );
					$segment       = $segments[( $pid * 5 ) % count( $segments )];
					$material      = $materials[( $pid * 8 ) % count( $materials )];
					$color         = $finishes[( $pid * 3 ) % count( $finishes )];
					$moq           = $moq_options[( $pid * 5 ) % count( $moq_options )];
					$lead          = $lead_options[( $pid * 2 ) % count( $lead_options )];
					$dims          = $dims_map[$cat_slug][$pid % count( $dims_map[$cat_slug] )];

					$badge = 'none';
					if ( 0 === $pid % 9 ) {
						$badge = 'New';
					} elseif ( 0 === $pid % 7 ) {
						$badge = 'Best Seller';
					} elseif ( 0 === $pid % 5 ) {
						$badge = 'Export Ready';
					}

					$short_desc = sprintf(
						'Handcrafted %1$s designed for %2$s projects. Premium %3$s build with %4$s finish.',
						esc_html( $type_name ),
						esc_html( $segment ),
						esc_html( $material ),
						esc_html( $color )
					);

					$full_desc = sprintf(
						'The %1$s is engineered at our 3,20,000 sq. ft. manufacturing works in Jodhpur, Rajasthan. Designed specifically for %2$s environments, it combines robust %3$s construction with bespoke %4$s finish detailing. Dimensions: %5$s. Minimum order quantity: %6$d units. Production lead time: %7$d days.',
						esc_html( $title ),
						esc_html( $segment ),
						esc_html( $material ),
						esc_html( $color ),
						esc_html( $dims ),
						(int) $moq,
						(int) $lead
					);

					$product = new \WC_Product_Simple();
					$product->set_name( $title );
					$product->set_slug( $slug );
					$product->set_sku( $sku );
					$product->set_regular_price( 0 );
					$product->set_short_description( $short_desc );
					$product->set_description( $full_desc );
					$product->set_status( 'publish' );
					$product_id = $product->save();

					if ( ! $product_id ) {
						continue;
					}

					// Assign Category
					if ( $cat_term ) {
						wp_set_object_terms( $product_id, array( (int) $cat_term->term_id ), 'product_cat' );
					}

					// Assign attributes as terms
					if ( taxonomy_exists( 'pa_segment' ) ) {
						wp_set_object_terms( $product_id, $segment, 'pa_segment' );
					}
					if ( taxonomy_exists( 'pa_material' ) ) {
						wp_set_object_terms( $product_id, $material, 'pa_material' );
					}
					if ( taxonomy_exists( 'pa_color' ) ) {
						wp_set_object_terms( $product_id, $color, 'pa_color' );
					}

					// Meta fields
					update_post_meta( $product_id, '_segment', $segment );
					update_post_meta( $product_id, '_material', $material );
					update_post_meta( $product_id, '_color', $color );
					update_post_meta( $product_id, '_moq', $moq );
					update_post_meta( $product_id, '_lead_time', $lead );
					update_post_meta( $product_id, '_dimensions_text', $dims );
					update_post_meta( $product_id, '_badge', $badge );
				}
			}
		}
	}
}
