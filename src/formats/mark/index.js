import { registerFormatType } from '@wordpress/rich-text';
import { __ } from '@wordpress/i18n';
import Edit from './edit';
import './marks.scss';

registerFormatType( 'block-mods/mark', {
	title: __( 'Mark', 'block-mods' ),
	tagName: 'span',
	className: 'block-mods-mark',
	attributes: {
		'data-mark': 'data-mark',
		style: 'style',
	},
	edit: Edit,
} );
