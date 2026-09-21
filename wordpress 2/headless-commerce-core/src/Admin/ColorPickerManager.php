<?php

namespace HeadlessCommerceCore\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * WordPress Admin Native Color Picker for WooCommerce pa_color Attribute Taxonomy
 */
class ColorPickerManager {

	private static $default_color_map = array(
		'natural oil'     => '#C8A06A',
		'walnut stain'    => '#6B4426',
		'ebony matt'      => '#231F1C',
		'antique brass'   => '#A98337',
		'bone white'      => '#EFE7DA',
		'forest lacquer'  => '#20402F',
		'terracotta pu'   => '#B85735',
		'graphite metal'  => '#4A4E54',
	);

	public static function init() {
		// Add color field to Add Term screen
		add_action( 'pa_color_add_form_fields', array( __CLASS__, 'add_color_field' ) );
		// Add color field to Edit Term screen
		add_action( 'pa_color_edit_form_fields', array( __CLASS__, 'edit_color_field' ) );

		// Save term color meta
		add_action( 'created_pa_color', array( __CLASS__, 'save_color_field' ) );
		add_action( 'edited_pa_color', array( __CLASS__, 'save_color_field' ) );

		// Add custom column to admin table
		add_filter( 'manage_edit-pa_color_columns', array( __CLASS__, 'add_color_column' ) );
		add_filter( 'manage_pa_color_custom_column', array( __CLASS__, 'render_color_column' ), 10, 3 );

		// Enqueue WordPress color picker JS
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_admin_scripts' ) );
	}

	public static function enqueue_admin_scripts( $hook ) {
		if ( 'edit-tags.php' === $hook || 'term.php' === $hook ) {
			wp_enqueue_style( 'wp-color-picker' );
			wp_enqueue_script( 'wp-color-picker' );
			add_action( 'admin_footer', function() {
				?>
				<script type="text/javascript">
					jQuery(document).ready(function($){
						if ($.fn.wpColorPicker) {
							$('.hcc-color-picker').wpColorPicker();
						}
					});
				</script>
				<?php
			} );
		}
	}

	public static function get_term_color( $term, $default = '#C8A06A' ) {
		$term_id = is_object( $term ) ? $term->term_id : $term;
		$meta    = get_term_meta( $term_id, 'hcc_color_hex', true );
		if ( empty( $meta ) ) {
			$meta = get_term_meta( $term_id, 'color_hex', true );
		}
		if ( ! empty( $meta ) ) {
			return $meta;
		}

		if ( is_object( $term ) && ! empty( $term->name ) ) {
			$slug = strtolower( trim( $term->name ) );
			if ( isset( self::$default_color_map[$slug] ) ) {
				return self::$default_color_map[$slug];
			}
		}

		return $default;
	}

	public static function add_color_field() {
		?>
		<div class="form-field term-color-wrap">
			<label for="hcc_color_hex"><?php _e( 'Color Swatch Hex Code', 'headless-commerce-core' ); ?></label>
			<input type="text" name="hcc_color_hex" id="hcc_color_hex" value="#C8A06A" class="hcc-color-picker" data-default-color="#C8A06A" />
			<p class="description"><?php _e( 'Select or enter the hex color swatch for this finish on the storefront.', 'headless-commerce-core' ); ?></p>
		</div>
		<?php
	}

	public static function edit_color_field( $term ) {
		$color_hex = self::get_term_color( $term );
		?>
		<tr class="form-field term-color-wrap">
			<th scope="row"><label for="hcc_color_hex"><?php _e( 'Color Swatch Hex Code', 'headless-commerce-core' ); ?></label></th>
			<td>
				<input type="text" name="hcc_color_hex" id="hcc_color_hex" value="<?php echo esc_attr( $color_hex ); ?>" class="hcc-color-picker" data-default-color="#C8A06A" />
				<p class="description"><?php _e( 'Select or enter the hex color swatch for this finish on the storefront.', 'headless-commerce-core' ); ?></p>
			</td>
		</tr>
		<?php
	}

	public static function save_color_field( $term_id ) {
		if ( isset( $_POST['hcc_color_hex'] ) ) {
			$hex = sanitize_text_field( $_POST['hcc_color_hex'] );
			update_term_meta( $term_id, 'hcc_color_hex', $hex );
			update_term_meta( $term_id, 'color_hex', $hex );
		}
	}

	public static function add_color_column( $columns ) {
		$new_columns = array();
		foreach ( $columns as $key => $title ) {
			if ( 'name' === $key ) {
				$new_columns[$key] = $title;
				$new_columns['color_swatch'] = __( 'Color Swatch', 'headless-commerce-core' );
			} else {
				$new_columns[$key] = $title;
			}
		}
		return $new_columns;
	}

	public static function render_color_column( $content, $column_name, $term_id ) {
		if ( 'color_swatch' === $column_name ) {
			$term      = get_term( $term_id );
			$color_hex = self::get_term_color( $term );
			return sprintf(
				'<div style="display:inline-flex; align-items:center; gap:8px;"><span style="width:22px; height:22px; border-radius:4px; background:%1$s; border:1px solid rgba(0,0,0,0.2); display:inline-block; box-shadow:0 1px 3px rgba(0,0,0,0.1);"></span> <code>%1$s</code></div>',
				esc_attr( $color_hex )
			);
		}
		return $content;
	}
}
