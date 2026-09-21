<?php

namespace HeadlessCommerceCore\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Store Mode Manager
 */
class StoreMode {

	const FULL_STORE        = 'FULL_STORE';
	const CATALOG           = 'CATALOG';
	const HEADLESS_STORE    = 'HEADLESS_STORE';
	const HEADLESS_CATALOG  = 'HEADLESS_CATALOG';

	/**
	 * Get current active store mode
	 *
	 * @return string
	 */
	public static function get_current_mode() {
		$mode = get_option( 'hcc_store_mode', self::HEADLESS_STORE );
		$valid_modes = array( self::FULL_STORE, self::CATALOG, self::HEADLESS_STORE, self::HEADLESS_CATALOG );
		return in_array( $mode, $valid_modes, true ) ? $mode : self::HEADLESS_STORE;
	}

	/**
	 * Check if purchasing is enabled in current store mode
	 *
	 * @return bool
	 */
	public static function is_purchasing_enabled() {
		$mode = self::get_current_mode();
		return in_array( $mode, array( self::FULL_STORE, self::HEADLESS_STORE ), true );
	}

	/**
	 * Check if store is in headless mode
	 *
	 * @return bool
	 */
	public static function is_headless() {
		$mode = self::get_current_mode();
		return in_array( $mode, array( self::HEADLESS_STORE, self::HEADLESS_CATALOG ), true );
	}

	/**
	 * Set store mode
	 *
	 * @param string $mode
	 * @return bool
	 */
	public static function set_mode( $mode ) {
		$valid_modes = array( self::FULL_STORE, self::CATALOG, self::HEADLESS_STORE, self::HEADLESS_CATALOG );
		if ( ! in_array( $mode, $valid_modes, true ) ) {
			return false;
		}
		return update_option( 'hcc_store_mode', $mode );
	}
}
