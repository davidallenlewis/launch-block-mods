<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Add is-highlighted-column class to each td in the chosen column of a party table
 */
function add_party_table_highlight( $block_content = '', $block = [] ) {
	if (
		! isset( $block['blockName'] ) ||
		'core/table' !== $block['blockName']
	) {
		return $block_content;
	}

	$col             = (int) ( $block['attrs']['highlightedColumn'] ?? 0 );
	$col_color       = sanitize_hex_color( $block['attrs']['highlightedColumnColor'] ?? '#eef8ea' );
	$header_color    = sanitize_hex_color( $block['attrs']['headerBackgroundColor'] ?? '#5cba47' );
	$first_col_color = sanitize_hex_color( $block['attrs']['firstColumnBackgroundColor'] ?? '#f6f6f6' );

	if ( empty( $block['attrs'] ) && ! $col ) {
		return $block_content;
	}

	$uid = wp_unique_id( 'table-column-highlight-' );

	// Add is-highlighted-column class to every td in the target column
	if ( $col ) {
		$processor   = new \WP_HTML_Tag_Processor( $block_content );
		$current_col = 0;
		while ( $processor->next_tag( [ 'tag_closers' => 'visit' ] ) ) {
			$tag = $processor->get_tag();
			if ( 'TR' === $tag && ! $processor->is_tag_closer() ) {
				$current_col = 0;
			} elseif ( ( 'TD' === $tag || 'TH' === $tag ) && ! $processor->is_tag_closer() ) {
				$current_col++;
				if ( $current_col === $col ) {
					$processor->add_class( 'is-highlighted-column' );
				}
			}
		}
		$block_content = $processor->get_updated_html();
	}

	// Build CSS rules (header + first col first so highlighted col wins on overlap)
	$rules = [];
	if ( $header_color ) {
		$rules[] = '#' . esc_attr( $uid ) . ' thead th { background-color: ' . $header_color . '; }';
	}
	if ( $first_col_color ) {
		$rules[] = '#' . esc_attr( $uid ) . ' td:first-child { background-color: ' . $first_col_color . '; }';
	}
	if ( $col && $col_color ) {
		$rules[] = '#' . esc_attr( $uid ) . ' td.is-highlighted-column { background-color: ' . $col_color . '; }';
	}

	// Stamp a unique id on the figure and prepend the style block
	$block_content = preg_replace( '/<figure/', '<figure id="' . esc_attr( $uid ) . '"', $block_content, 1 );

	return '<style>' . implode( "\n", $rules ) . '</style>' . $block_content;
}
add_filter( 'render_block', __NAMESPACE__ . '\add_party_table_highlight', 10, 2 );