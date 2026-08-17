<?php
/**
 * Headless Commerce Core Uninstall Handler
 *
 * @package HeadlessCommerceCore
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Clean up option settings if needed
delete_option( 'hcc_store_mode' );
delete_option( 'hcc_settings' );
