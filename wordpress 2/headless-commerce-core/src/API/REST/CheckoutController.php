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

	public function register_routes() {
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

	public function get_checkout_data( $request ) {
		if ( ! StoreMode::is_purchasing_enabled() ) {
			return $this->error_response( 'hcc_catalog_mode', 'Checkout is disabled in catalog mode.', 403 );
		}

		$available_gateways = array();
		if ( function_exists( 'WC' ) && WC() && WC()->payment_gateways() ) {
			$gateways = WC()->payment_gateways()->get_available_payment_gateways();
			if ( is_array( $gateways ) ) {
				foreach ( $gateways as $id => $gateway ) {
					$available_gateways[] = array(
						'id'          => $id,
						'title'       => method_exists( $gateway, 'get_title' ) ? $gateway->get_title() : $id,
						'description' => method_exists( $gateway, 'get_description' ) ? $gateway->get_description() : '',
						'icon'        => method_exists( $gateway, 'get_icon' ) ? $gateway->get_icon() : '',
					);
				}
			}
		}

		$subtotal = ( function_exists( 'WC' ) && WC() && WC()->cart ) ? (float) WC()->cart->get_subtotal() : 0.0;
		$total    = ( function_exists( 'WC' ) && WC() && WC()->cart ) ? (float) WC()->cart->get_total( 'edit' ) : 0.0;

		return $this->success_response( array(
			'paymentGateways' => $available_gateways,
			'cartSubtotal'    => $subtotal,
			'cartTotal'       => $total,
			'currency'        => function_exists( 'get_woocommerce_currency' ) ? get_woocommerce_currency() : 'USD',
		) );
	}

	public function place_order( $request ) {
		if ( ! StoreMode::is_purchasing_enabled() ) {
			return $this->error_response( 'hcc_catalog_mode', 'Purchasing disabled in catalog mode.', 403 );
		}

		if ( ! function_exists( 'wc_create_order' ) || ! function_exists( 'WC' ) || ! WC() || ! WC()->cart ) {
			return $this->error_response( 'hcc_wc_unavailable', 'WooCommerce engine unavailable.', 500 );
		}

		$params = $request->get_json_params();

		$billing  = isset( $params['billing'] ) && is_array( $params['billing'] ) ? $params['billing'] : array();
		$shipping = isset( $params['shipping'] ) && is_array( $params['shipping'] ) ? $params['shipping'] : $billing;
		$payment_method = sanitize_text_field( isset( $params['paymentMethod'] ) ? $params['paymentMethod'] : 'cod' );
		$notes    = sanitize_text_field( isset( $params['customerNote'] ) ? $params['customerNote'] : '' );

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
						'variation' => isset( $cart_item['variation'] ) ? $cart_item['variation'] : array(),
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
