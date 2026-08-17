<?php

namespace HeadlessCommerceCore\API\REST;

use HeadlessCommerceCore\Core\StoreMode;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * REST Checkout & Order Creation Controller
 */
class CheckoutController extends RestController {

	public function register_routes(): void {
		register_rest_route( $this->namespace, '/checkout', array(
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_checkout_data' ),
				'permission_callback' => '__return_true',
			),
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'place_order' ),
				'permission_callback' => '__return_true',
			),
		) );
	}

	public function get_checkout_data( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		if ( ! StoreMode::is_purchasing_enabled() ) {
			return $this->error_response( 'hcc_catalog_mode', 'Checkout is disabled in catalog mode.', 403 );
		}

		$gateways = WC()->payment_gateways()->get_available_payment_gateways();
		$available_gateways = array();

		foreach ( $gateways as $id => $gateway ) {
			$available_gateways[] = array(
				'id'          => $id,
				'title'       => $gateway->get_title(),
				'description' => $gateway->get_description(),
				'icon'        => $gateway->get_icon(),
			);
		}

		return $this->success_response( array(
			'paymentGateways' => $available_gateways,
			'cartSubtotal'    => (float) WC()->cart->get_subtotal(),
			'cartTotal'       => (float) WC()->cart->get_total( 'edit' ),
			'currency'        => get_woocommerce_currency(),
		) );
	}

	public function place_order( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		if ( ! StoreMode::is_purchasing_enabled() ) {
			return $this->error_response( 'hcc_catalog_mode', 'Purchasing disabled in catalog mode.', 403 );
		}

		$params = $request->get_json_params();

		$billing  = $params['billing'] ?? array();
		$shipping = $params['shipping'] ?? $billing;
		$payment_method = sanitize_text_field( $params['paymentMethod'] ?? 'cod' );
		$notes    = sanitize_text_field( $params['customerNote'] ?? '' );

		if ( empty( $billing['first_name'] ) || empty( $billing['email'] ) ) {
			return $this->error_response( 'hcc_invalid_billing', 'Billing first name and email are required.', 400 );
		}

		if ( WC()->cart->is_empty() ) {
			return $this->error_response( 'hcc_empty_cart', 'Cart is empty.', 400 );
		}

		try {
			$order = wc_create_order( array(
				'customer_id'   => get_current_user_id() ?: 0,
				'customer_note' => $notes,
			) );

			foreach ( WC()->cart->get_cart() as $cart_item ) {
				$order->add_product(
					$cart_item['data'],
					$cart_item['quantity'],
					array(
						'variation' => $cart_item['variation'] ?? array(),
						'subtotal'  => $cart_item['line_subtotal'],
						'total'     => $cart_item['line_total'],
					)
				);
			}

			$order->set_address( $billing, 'billing' );
			$order->set_address( $shipping, 'shipping' );
			$order->set_payment_method( $payment_method );

			$order->calculate_totals();
			$order->update_status( 'processing', 'Headless order created via HCC API.', true );

			WC()->cart->empty_cart();

			return $this->success_response( array(
				'orderId'     => $order->get_id(),
				'orderKey'    => $order->get_order_key(),
				'status'      => $order->get_status(),
				'total'       => (float) $order->get_total(),
				'currency'    => $order->get_currency(),
				'checkoutUrl' => $order->get_checkout_order_received_url(),
			) );

		} catch ( \Exception $e ) {
			return $this->error_response( 'hcc_checkout_error', $e->getMessage(), 500 );
		}
	}
}
