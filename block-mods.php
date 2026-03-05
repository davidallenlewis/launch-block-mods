<?php
/**
 * Plugin Name: Block Modifications
 * Description: A plugin that modifies and extends native Gutenberg Block functionality
 * Author:      Media Mechanics
 * Author URI:  https://mediamechanics.com
 * Version:     1.0
 *
 * @package     BlockMods
 */

namespace BlockMods;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
};

function editor_assets() {
	$asset = include plugin_dir_path( __FILE__ ) . 'build/index.asset.php';
	wp_enqueue_script(
		'block-mods-editor-script',
		plugin_dir_url( __FILE__ ) . 'build/index.js',
		array_merge( $asset['dependencies'], [ 'wp-blocks', 'wp-hooks', 'wp-compose', 'wp-block-editor', 'lodash' ] ),
		$asset['version']
	);
	wp_enqueue_style(
		'block-mods-editor-style',
		plugin_dir_url( __FILE__ ) . 'build/index.css',
		[],
		$asset['version']
	);
}
add_action( 'enqueue_block_editor_assets', __NAMESPACE__ . '\editor_assets' );

function frontend_assets() {
	$asset = include plugin_dir_path( __FILE__ ) . 'build/index.asset.php';
	wp_enqueue_style(
		'block-mods-style',
		plugin_dir_url( __FILE__ ) . 'build/index.css',
		[],
		$asset['version']
	);
}
add_action( 'wp_enqueue_scripts', __NAMESPACE__ . '\frontend_assets' );

/**
 * Block render filters
 */
require_once plugin_dir_path( __FILE__ ) . 'render/heading-attributes.php';
require_once plugin_dir_path( __FILE__ ) . 'render/table-colours.php';