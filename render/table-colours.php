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

	// Only process blocks that have at least one of our custom attributes saved.
	$our_attrs = [ 'highlightedColumn', 'highlightedColumnColor', 'headerBackgroundColor', 'firstColumnBackgroundColor' ];
	if ( empty( array_intersect( $our_attrs, array_keys( $block['attrs'] ?? [] ) ) ) ) {
		return $block_content;
	}

	$col             = (int) ( $block['attrs']['highlightedColumn'] ?? 0 );
	$col_color       = sanitize_hex_color( $block['attrs']['highlightedColumnColor'] ?? '' );
	$header_color    = sanitize_hex_color( $block['attrs']['headerBackgroundColor'] ?? '' );
	$first_col_color = sanitize_hex_color( $block['attrs']['firstColumnBackgroundColor'] ?? '' );

	$contrast = fn( $bg ) => 'oklch(from ' . $bg . ' calc((0.7 - l) * infinity) 0 0)';
	$css_vars = '';
	if ( $header_color ) {
		$css_vars .= '--table-header-bg:' . $header_color . ';--table-header-color:' . $contrast( $header_color ) . ';';
	}
	if ( $first_col_color ) {
		$css_vars .= '--table-first-col-bg:' . $first_col_color . ';--table-first-col-color:' . $contrast( $first_col_color ) . ';';
	}
	if ( $col && $col_color ) {
		$css_vars .= '--table-highlight-col-bg:' . $col_color . ';--table-highlight-col-color:' . $contrast( $col_color ) . ';';
	}

	$processor   = new \WP_HTML_Tag_Processor( $block_content );
	$current_col = 0;
	$in_thead    = false;

	while ( $processor->next_tag( [ 'tag_closers' => 'visit' ] ) ) {
		$tag = $processor->get_tag();

		if ( 'FIGURE' === $tag && ! $processor->is_tag_closer() ) {
			if ( $css_vars ) {
				$existing_style = $processor->get_attribute( 'style' ) ?? '';
				$processor->set_attribute( 'style', $existing_style ? rtrim( $existing_style, ';' ) . ';' . $css_vars : $css_vars );
			}
			$processor->set_attribute( 'data-table-colors', '' );
			if ( $col ) {
				$processor->set_attribute( 'data-highlight-col', (string) $col );
			}
		} elseif ( 'THEAD' === $tag ) {
			$in_thead = ! $processor->is_tag_closer();
		} elseif ( 'TR' === $tag && ! $processor->is_tag_closer() ) {
			$current_col = 0;
		} elseif ( ( 'TD' === $tag || 'TH' === $tag ) && ! $processor->is_tag_closer() ) {
			$current_col++;
			if ( $col && $current_col === $col ) {
				$processor->add_class( 'is-highlighted-column' );
				if ( $in_thead ) {
					$processor->add_class( 'is-highlighted-col-header' );
				}
			}
		}
	}

	$html = $processor->get_updated_html();

	return $html;
}
add_filter( 'render_block', __NAMESPACE__ . '\add_party_table_highlight', 10, 2 );