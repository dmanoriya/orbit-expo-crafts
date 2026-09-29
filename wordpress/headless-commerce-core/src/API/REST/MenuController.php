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
					'menu-item-title'  => 'Collections',
					'menu-item-url'    => '/collections',
					'menu-item-status' => 'publish',
				) );

				$sub_cats = array(
					'Seating & Chairs'    => '/collections/seating',
					'Tables & Dining'     => '/collections/tables',
					'Sofas & Lounges'     => '/collections/sofas',
					'Beds & Nightstands'  => '/collections/beds',
					'Credenzas & Storage' => '/collections/storage',
					'Outdoor & Patio'     => '/collections/outdoor',
					'Lighting'            => '/collections/lighting',
					'Decor & Objects'     => '/collections/decor',
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
			$url         = (string) $item->url;
			$url         = preg_replace( '#^/catalogue(\b|/|$)#', '/collections$1', $url );
			$url         = preg_replace( '#(https?://[^/]+)/catalogue(\b|/|$)#', '$1/collections$2', $url );

			$title = html_entity_decode( wp_specialchars_decode( $item->title, ENT_QUOTES ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
			if ( 'Catalogue' === $title ) {
				$title = 'Collections';
			}

			$id_map[ $item->ID ] = array(
				'id'       => (int) $item->ID,
				'title'    => $title,
				'url'      => $url,
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
