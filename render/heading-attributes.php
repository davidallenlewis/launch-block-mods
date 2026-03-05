<?php 

/**
 * Add classes to post-title block
 *
 * @NOTE Post Title Block doens't have a REACT save function so we do this instead
 * to modify the HTML output on the public side. This will not cause a block render
 * issue in admin (i.e. Recover Block) since the block doesn't save any HTML in the editor
 */
function add_post_title_class( $block_content = '', $block = [] ) {
	if ( isset( $block['blockName'] ) && 'core/post-title' === $block['blockName'] ) {
		$defaults = [
			'level' => 2,
			'hasRule' => true,
			'hasTopMargin' => false
		];
		$args = wp_parse_args( $block['attrs'], $defaults );
		$has_green_underline = $args && array_key_exists('hasRule', $args) && $args['hasRule'] === true ? ' has-green-underline ' : ' ' ;
		$has_top_margin = $args && array_key_exists('hasTopMargin', $args) && $args['hasTopMargin'] === true ? ' has-top-margin ' : ' ' ;
		$html = str_replace(
			'wp-block-post-title',
			'wp-block-post-title' . $has_green_underline . $has_top_margin,
			$block_content
		);
		return $html;
	}
	return $block_content;
}
add_filter( 'render_block', __NAMESPACE__ . '\add_post_title_class', 10, 2 );