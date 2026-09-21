<?php

namespace HeadlessCommerceCore\API\REST;

use WP_REST_Controller;
use WP_REST_Response;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * REST API Controller for Product Attributes (Segments, Materials, Colors)
 */
class AttributesController extends WP_REST_Controller {

	protected $namespace = 'hcc/v1';

	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/attributes',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_attributes' ),
					'permission_callback' => '__return_true',
				),
			)
		);
	}

	private function decode_str( $str ) {
		return html_entity_decode( (string) $str, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
	}

	public function get_attributes( $request ) {
		$segments = array(
			'Hotel Guestroom', 'Hotel Lobby', 'Restaurant', 'Café', 'Bar & Nightclub', 'Banquet & Events',
			'Resort & Villa', 'Corporate Office', 'Co-working', 'Retail Store', 'Healthcare', 'Education', 'Residential',
			'Outdoor & Poolside', 'Airport & Transit', 'Export / Wholesale',
		);

		$materials = array(
			'Solid Sheesham', 'Solid Teak', 'Solid Mango', 'Solid Acacia', 'Engineered Panel', 'MS / Powder Coated Metal',
			'Brass & Bronze', 'Stainless Steel', 'Bone Inlay', 'Marble & Stone', 'Terrazzo', 'Cane & Rattan', 'Rope Weave', 'Resin',
			'Tile Inlay', 'Hand Carving', 'Upholstery Fabric', 'Genuine Leather', 'Vegan Leather', 'Glass', 'Reclaimed Wood',
		);

		$colors = array(
			array( 'name' => 'Natural Oil', 'code' => '#C8A06A' ),
			array( 'name' => 'Walnut Stain', 'code' => '#6B4426' ),
			array( 'name' => 'Ebony Matt', 'code' => '#231F1C' ),
			array( 'name' => 'Antique Brass', 'code' => '#A98337' ),
			array( 'name' => 'Bone White', 'code' => '#EFE7DA' ),
			array( 'name' => 'Forest Lacquer', 'code' => '#20402F' ),
			array( 'name' => 'Terracotta PU', 'code' => '#B85735' ),
			array( 'name' => 'Graphite Metal', 'code' => '#4A4E54' ),
		);

		// If WooCommerce product attribute taxonomies exist, merge taxonomy terms dynamically
		if ( taxonomy_exists( 'pa_segment' ) ) {
			$terms = get_terms( array( 'taxonomy' => 'pa_segment', 'hide_empty' => false ) );
			if ( ! is_wp_error( $terms ) && ! empty( $terms ) ) {
				$segments = array_map( array( $this, 'decode_str' ), wp_list_pluck( $terms, 'name' ) );
			}
		}

		if ( taxonomy_exists( 'pa_material' ) ) {
			$terms = get_terms( array( 'taxonomy' => 'pa_material', 'hide_empty' => false ) );
			if ( ! is_wp_error( $terms ) && ! empty( $terms ) ) {
				$materials = array_map( array( $this, 'decode_str' ), wp_list_pluck( $terms, 'name' ) );
			}
		}

		if ( taxonomy_exists( 'pa_color' ) ) {
			$terms = get_terms( array( 'taxonomy' => 'pa_color', 'hide_empty' => false ) );
			if ( ! is_wp_error( $terms ) && ! empty( $terms ) ) {
				$dynamic_colors = array();
				foreach ( $terms as $t ) {
					$hex = \HeadlessCommerceCore\Admin\ColorPickerManager::get_term_color( $t );
					$dynamic_colors[] = array( 'name' => $this->decode_str( $t->name ), 'code' => $hex );
				}
				if ( ! empty( $dynamic_colors ) ) {
					$colors = $dynamic_colors;
				}
			}
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'data'    => array(
					'segments'  => array_values( array_unique( array_map( array( $this, 'decode_str' ), $segments ) ) ),
					'materials' => array_values( array_unique( array_map( array( $this, 'decode_str' ), $materials ) ) ),
					'colors'    => $colors,
				),
			),
			200
		);
	}
}
