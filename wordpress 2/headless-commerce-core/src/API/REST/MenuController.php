<?php

namespace HeadlessCommerceCore\API\REST;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class MenuController extends RestController {

	public function register_routes() {
		register_rest_route( $this->namespace, '/menu', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_menu' ),
			'permission_callback' => '__return_true',
		) );
	}

	public function get_menu( $request ) {
		$menu_name = 'Next Menu';
		$menu_obj  = wp_get_nav_menu_object( $menu_name );

		if ( ! $menu_obj ) {
			$locations = get_nav_menu_locations();
			if ( isset( $locations['next_menu'] ) && $locations['next_menu'] ) {
				$menu_obj = wp_get_nav_menu_object( $locations['next_menu'] );
			}
		}

		if ( ! $menu_obj ) {
			$menu_id = wp_create_nav_menu( $menu_name );
			if ( ! is_wp_error( $menu_id ) ) {
				$locations              = get_nav_menu_locations();
				$locations['next_menu'] = $menu_id;
				set_theme_mod( 'nav_menu_locations', $locations );

				wp_update_nav_menu_item( $menu_id, 0, array(
					'menu-item-title'  => 'Home',
					'menu-item-url'    => '/',
					'menu-item-status' => 'publish',
				) );

				$cat_item_id = wp_update_nav_menu_item( $menu_id, 0, array(
					'menu-item-title'  => 'Catalogue',
					'menu-item-url'    => '/catalogue',
					'menu-item-status' => 'publish',
				) );

				$sub_cats = array(
					'Seating & Chairs'    => '/catalogue/seating',
					'Tables & Dining'     => '/catalogue/tables',
					'Sofas & Lounges'     => '/catalogue/sofas',
					'Beds & Nightstands'  => '/catalogue/beds',
					'Credenzas & Storage' => '/catalogue/storage',
					'Outdoor & Patio'     => '/catalogue/outdoor',
					'Lighting'            => '/catalogue/lighting',
					'Decor & Objects'     => '/catalogue/decor',
				);

				foreach ( $sub_cats as $sc_title => $sc_url ) {
					wp_update_nav_menu_item( $menu_id, 0, array(
						'menu-item-title'     => $sc_title,
						'menu-item-url'       => $sc_url,
						'menu-item-parent-id' => $cat_item_id,
						'menu-item-status'    => 'publish',
					) );
				}

				wp_update_nav_menu_item( $menu_id, 0, array(
					'menu-item-title'  => 'Turnkey Projects',
					'menu-item-url'    => '/turnkey',
					'menu-item-status' => 'publish',
				) );

				wp_update_nav_menu_item( $menu_id, 0, array(
					'menu-item-title'  => 'Craft & Materials',
					'menu-item-url'    => '/craft',
					'menu-item-status' => 'publish',
				) );

				wp_update_nav_menu_item( $menu_id, 0, array(
					'menu-item-title'  => 'About',
					'menu-item-url'    => '/about',
					'menu-item-status' => 'publish',
				) );

				$menu_obj = wp_get_nav_menu_object( $menu_id );
			}
		}

		if ( ! $menu_obj ) {
			return $this->success_response( array( 'menuName' => 'Next Menu', 'items' => array() ) );
		}

		$items = wp_get_nav_menu_items( $menu_obj->term_id );
		if ( empty( $items ) || ! is_array( $items ) ) {
			return $this->success_response( array( 'menuName' => $menu_obj->name, 'items' => array() ) );
		}

		$menu_tree = array();
		$id_map    = array();

		foreach ( $items as $item ) {
			$classes_str = is_array( $item->classes ) ? implode( ' ', array_filter( $item->classes ) ) : (string) $item->classes;
			$id_map[ $item->ID ] = array(
				'id'       => (int) $item->ID,
				'title'    => html_entity_decode( wp_specialchars_decode( $item->title, ENT_QUOTES ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
				'url'      => $item->url,
				'target'   => $item->target,
				'classes'  => $classes_str,
				'parentId' => (int) $item->menu_item_parent,
				'children' => array(),
			);
		}

		foreach ( $id_map as $id => &$node ) {
			if ( $node['parentId'] && isset( $id_map[ $node['parentId'] ] ) ) {
				$id_map[ $node['parentId'] ]['children'][] = &$node;
			} else {
				$menu_tree[] = &$node;
			}
		}

		return $this->success_response( array(
			'menuName' => $menu_obj->name,
			'items'    => array_values( $menu_tree ),
		) );
	}
}
