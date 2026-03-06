import './table-colours.scss';
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import {
	SelectControl,
	ColorPalette,
	Button,
	Dropdown,
	Tooltip,
	PanelBody,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
} from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

if ( ! document.getElementById( 'color-dropdown-styles' ) ) {
	const s = document.createElement( 'style' );
	s.id = 'color-dropdown-styles';
	s.textContent = '.color-dropdown-wrap .color-dropdown-clear{opacity:0;pointer-events:none;transition:opacity 0.1s ease}.color-dropdown-wrap:hover .color-dropdown-clear{opacity:1;pointer-events:auto}';
	document.head.appendChild( s );
}

const MinusIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
		<path d="M7 11.5h10V13H7z" />
	</svg>
);

function ColorDropdown( { label, value, renderContent, onClear = null, position = null } ) {
	const showClear = onClear && !! value;
	const borderRadius =
		position === 'first' ? '2px 2px 0 0' :
		position === 'last'  ? '0 0 2px 2px' :
		position === 'middle' ? '0' : '2px';
	const borderBottom = ( position === 'first' || position === 'middle' ) ? 'none' : '1px solid #ddd';

	return (
		<div
			className="color-dropdown-wrap"
			style={ { position: 'relative', display: 'block' } }
		>
			<Dropdown
				style={ { display: 'block' } }
				popoverProps={ { placement: 'left-start', offset: 36, shift: true } }
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button
						onClick={ onToggle }
						aria-expanded={ isOpen }
						style={ {
							width: '100%',
							height: 'auto',
							padding: '10px 12px',
							paddingRight: showClear ? '36px' : '12px',
							border: '1px solid #ddd',
							borderBottom,
							borderRadius,
							boxSizing: 'border-box',
							textAlign: 'left',
						} }
					>
						<div style={ { display: 'flex', alignItems: 'center', gap: '8px' } }>
							<div
								style={ {
									width: '20px',
									height: '20px',
									borderRadius: '50%',
									background: value || '#fff linear-gradient(-45deg, transparent 48%, #ddd 0, #ddd 52%, transparent 0)',
									border: '1px solid rgba(0,0,0,0.1)',
									flexShrink: 0,
								} }
							/>
							<span>{ label }</span>
						</div>
					</Button>
				) }
				renderContent={ () => (
					<DropdownContentWrapper paddingSize="medium">
						{ renderContent() }
					</DropdownContentWrapper>
				) }
			/>
			{ showClear && (
				<Tooltip text={ __( 'Reset', 'block-mods' ) }>
					<Button
						icon={ MinusIcon }
						aria-label={ __( 'Reset', 'block-mods' ) }
						onClick={ ( e ) => { e.stopPropagation(); onClear(); } }
						className="color-dropdown-clear"
						style={ {
							position: 'absolute',
							right: '2px',
							top: '50%',
							transform: 'translateY(-50%)',
							minWidth: 0,
							padding: '2px',
						} }
						size="small"
					/>
				</Tooltip>
			) }
		</div>
	);
}

/**
 * Add highlightedColumn attribute to Table block
 *
 * @param  {Object} settings Original block settings
 * @param  {string} name     Block name
 * @return {Object}          Filtered block settings
 */
function addAttributes( settings, name ) {
	if ( name === 'core/table' ) {
		return {
			...settings,
			attributes: {
				...settings.attributes,
				highlightedColumn: { type: 'string', default: '' },
				highlightedColumnColor: { type: 'string', default: '#eef8ea' },
				headerBackgroundColor: { type: 'string', default: '#5cba47' },
				firstColumnBackgroundColor: { type: 'string', default: '#f6f6f6' },
			},
		};
	}
	return settings;
}
addFilter(
	'blocks.registerBlockType',
	'block-mods/table-block/add-custom-attributes',
	addAttributes,
);

/**
 * Set CSS custom properties and data attributes on the block wrapper
 */
const addBlockProps = createHigherOrderComponent( ( BlockListBlock ) => {
	return ( props ) => {
		const { name, attributes } = props;
		if ( name !== 'core/table' ) {
			return <BlockListBlock { ...props } />;
		}

		const { highlightedColumn, highlightedColumnColor, headerBackgroundColor, firstColumnBackgroundColor } = attributes;

		const contrast = ( bg ) => `oklch(from ${ bg } calc((0.7 - l) * infinity) 0 0)`;
		const wrapperProps = {
			...props.wrapperProps,
			'data-table-colors': '',
			style: {
				...props.wrapperProps?.style,
				'--table-header-bg': headerBackgroundColor,
				'--table-header-color': contrast( headerBackgroundColor ),
				'--table-first-col-bg': firstColumnBackgroundColor,
				'--table-first-col-color': contrast( firstColumnBackgroundColor ),
				...( highlightedColumn ? {
					'--table-highlight-col-bg': highlightedColumnColor || '#eef8ea',
					'--table-highlight-col-color': contrast( highlightedColumnColor || '#eef8ea' ),
				} : {} ),
			},
			...( highlightedColumn ? { 'data-highlight-col': highlightedColumn } : {} ),
		};

		return <BlockListBlock { ...props } wrapperProps={ wrapperProps } />;
	};
}, 'withTableBlockProps' );
addFilter(
	'editor.BlockListBlock',
	'block-mods/table-block/add-block-props',
	addBlockProps,
);

/**
 * Add column highlight inspector control to Table block
 */
const addInspectorControl = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const {
			attributes: { highlightedColumn, highlightedColumnColor, headerBackgroundColor, firstColumnBackgroundColor, head, body },
			setAttributes,
			name,
		} = props;

		const themeColors = useSelect( ( select ) => {
			return select( 'core/block-editor' ).getSettings()?.colors ?? [];
		}, [] );

		if ( name !== 'core/table' ) {
			return <BlockEdit { ...props } />;
		}

		// Determine column count from head or body
		const firstRow =
			( head && head[ 0 ]?.cells ) ||
			( body && body[ 0 ]?.cells ) ||
			[];
		const columnCount = firstRow.length;

		const options = [
			{ label: __( 'None', 'block-mods' ), value: '' },
			...Array.from( { length: columnCount }, ( _, i ) => ( {
				label: `${ __( 'Column', 'block-mods' ) } ${ i + 1 }`,
				value: String( i + 1 ),
			} ) ),
		];

			return (
				<>
					<BlockEdit { ...props } />
					<InspectorControls group="styles">
						<PanelBody title={ __( 'Table Colors', 'block-mods' ) }>
						<SelectControl
							label={ __( 'Highlight Column', 'block-mods' ) }
							help={ __( 'Choose a column to highlight.', 'block-mods' ) }
							value={ highlightedColumn }
							options={ options }
							onChange={ ( value ) => setAttributes( { highlightedColumn: value } ) }
						/>
						<ColorDropdown
							position="first"
							label={ __( 'Header Row', 'block-mods' ) }
							value={ headerBackgroundColor }
							onClear={ () => setAttributes( { headerBackgroundColor: '#5cba47' } ) }
							renderContent={ () => (
								<ColorPalette
									colors={ themeColors }
									value={ headerBackgroundColor }
									onChange={ ( value ) => setAttributes( { headerBackgroundColor: value ?? '#5cba47' } ) }
								/>
							) }
						/>
						<ColorDropdown
							position={ highlightedColumn ? 'middle' : 'last' }
							label={ __( 'First Column', 'block-mods' ) }
							value={ firstColumnBackgroundColor }
							onClear={ () => setAttributes( { firstColumnBackgroundColor: '#f6f6f6' } ) }
							renderContent={ () => (
								<ColorPalette
									colors={ themeColors }
									value={ firstColumnBackgroundColor }
									onChange={ ( value ) => setAttributes( { firstColumnBackgroundColor: value ?? '#f6f6f6' } ) }
								/>
							) }
						/>
						{ highlightedColumn && (
							<ColorDropdown
								position="last"
								label={ __( 'Highlight Column', 'block-mods' ) }
								value={ highlightedColumnColor }
								onClear={ () => setAttributes( { highlightedColumnColor: '#eef8ea' } ) }
								renderContent={ () => (
									<ColorPalette
										colors={ themeColors }
										value={ highlightedColumnColor }
										onChange={ ( value ) => setAttributes( { highlightedColumnColor: value ?? '#eef8ea' } ) }
									/>
								) }
							/>
						) }
						</PanelBody>
					</InspectorControls>
				</>
			);
	};
}, 'withInspectorControl' );
addFilter(
	'editor.BlockEdit',
	'block-mods/table-block/add-custom-controls',
	addInspectorControl,
);