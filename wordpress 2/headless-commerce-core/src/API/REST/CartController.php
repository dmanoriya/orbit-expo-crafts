<?php

namespace HeadlessCommerceCore\API\REST;

use HeadlessCommerceCore\Core\StoreMode;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * REST Cart Controller using WC_Cart
 */
class CartController extends RestController {

	public function register_routes(): void {
		register_rest_route( $this->namespace, '/cart', array(
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_cart' ),
				'permission_callback' => '__return_true',
			),
			array(
				'methods'             => \WP_REST_Server::DELETABLE,
				'callback'            => array( $this, 'clear_cart' ),
				'permission_callback' => '__return_true',
			),
		) );

		register_rest_route( $this->namespace, '/cart/items', array(
			'methods'             => \WP_REST_Server::CREATABLE,
			'callback'            => array( $this, 'add_item' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( $this->namespace, '/cart/items/(?P<key>[a-zA-Z0-9_]+)', array(
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'update_item' ),
				'permission_callback' => '__return_true',
			),
			array(
				'methods'             => \WP_REST_Server::DELETABLE,
				'callback'            => array( $this, 'remove_item' ),
				'permission_callback' => '__return_true',
			),
		) );
	}

	private function ensure_wc_session(): void {
		if ( null === WC()->session ) {
			$session_class = apply_filters( 'woocommerce_session_handler', 'WC_Session_Handler' );
			WC()->session  = new $session_class();
			WC()->session->init();
		}

		if ( null === WC()->customer ) {
			WC()->customer = new \WC_Customer( get_current_user_id(), true );
		}

		if ( null === WC()->cart ) {
			WC()->cart = new \WC_Cart();
			WC()->cart->get_cart();
		}
	}

	public function get_cart( \WP_REST_Request $request ): \WP_REST_Response {
		$this->ensure_wc_session();
		return $this->success_response( $this->prepare_cart_payload() );
	}

	public function add_item( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		if ( ! StoreMode::is_purchasing_enabled() ) {
			return $this->error_response( 'hcc_catalog_mode', 'Purchasing is disabled in catalog mode.', 403 );
		}

		$this->ensure_wc_session();

		$product_id   = (int) $request->get_param( 'productId' );
		$quantity     = max( 1, (int) $request->get_param( 'quantity' ) ?: 1 );
		$variation_id = (int) $request->get_param( 'variationId' ) ?: 0;
		$variation    = (array) $request->get_param( 'variation' ) ?: array();

		if ( ! $product_id ) {
			return $this->error_response( 'hcc_invalid_product', 'Product ID is required.', 400 );
		}

		$cart_item_key = WC()->cart->add_to_cart( $product_id, $quantity, $variation_id, $variation );

		if ( ! $cart_item_key ) {
			return $this->error_response( 'hcc_add_to_cart_failed', 'Could not add product to cart.', 400 );
		}

		WC()->cart->calculate_totals();

		return $this->success_response( $this->prepare_cart_payload() );
	}

	public function update_item( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$this->ensure_wc_session();

		$key      = sanitize_text_field( $request->get_param( 'key' ) );
		$quantity = (int) $request->get_param( 'quantity' );

		if ( ! isset( WC()->cart->get_cart()[ $key ] ) ) {
			return $this->error_response( 'hcc_cart_item_not_found', 'Cart item not found.', 404 );
		}

		WC()->cart->set_quantity( $key, $quantity, true );
		WC()->cart->calculate_totals();

		return $this->success_response( $this->prepare_cart_payload() );
	}

	public function remove_item( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$this->ensure_wc_session();
		$key = sanitize_text_field( $request->get_param( 'key' ) );

		if ( ! isset( WC()->cart->get_cart()[ $key ] ) ) {
			return $this->error_response( 'hcc_cart_item_not_found', 'Cart item not found.', 404 );
		}

		WC()->cart->remove_cart_item( $key );
		WC()->cart->calculate_totals();

		return $this->success_response( $this->prepare_cart_payload() );
	}

	public function clear_cart( \WP_REST_Request $request ): \WP_REST_Response {
		$this->ensure_wc_session();
		WC()->cart->empty_cart();
		return $this->success_response( $this->prepare_cart_payload() );
	}

	private function prepare_cart_payload(): array {
		$items = array();

		foreach ( WC()->cart->get_cart() as $key => $item ) {
			$product = $item['data'];
			$img_id  = $product->get_image_id();
			$items[] = array(
				'key'          => $key,
				'productId'    => $item['product_id'],
				'variationId'  => $item['variation_id'],
				'name'         => $product->get_name(),
				'price'        => (float) $product->get_price(),
				'quantity'     => (int) $item['quantity'],
				'subtotal'     => (float) $item['line_subtotal'],
				'total'        => (float) $item['line_total'],
				'image'        => $img_id ? wp_get_attachment_image_url( $img_id, 'full' ) : '',
				'variation'    => $item['variation'] ?? array(),
			);
		}

		return array(
			'items'            => $items,
			'itemCount'        => WC()->cart->get_cart_contents_count(),
			'subtotal'         => (float) WC()->cart->get_subtotal(),
			'total'            => (float) WC()->cart->get_total( 'edit' ),
			'taxTotal'         => (float) WC()->cart->get_taxes_total(),
			'shippingTotal'    => (float) WC()->cart->get_shipping_total(),
			'appliedCoupons'   => WC()->cart->get_applied_coupons(),
			'currency'         => get_woocommerce_currency(),
		);
	}
}
