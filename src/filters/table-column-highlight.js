import {
	SelectControl,
	ColorPalette,
	Button,
	Dropdown,
	Tooltip,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

const { assign, merge } = lodash;
const { __ } = wp.i18n;
const { addFilter } = wp.hooks;
const { createHigherOrderComponent } = wp.compose;
const { Fragment } = wp.element;
const { InspectorControls } = wp.blockEditor;
const { PanelBody } = wp.components;

const MinusIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
		<path d="M7 11.5h10V13H7z" />
	</svg>
);

function ColorDropdown( { label, value, renderContent, onClear = null, position = null } ) {
	const [ hovered, setHovered ] = useState( false );
	const showClear = onClear && !! value;

	const borderRadius =
		position === 'first' ? '2px 2px 0 0' :
		position === 'last'  ? '0 0 2px 2px' :
		position === 'middle' ? '0' : '2px';
	const borderBottom = ( position === 'first' || position === 'middle' ) ? 'none' : '1px solid #ddd';

	return (
		<div
			style={ { position: 'relative', display: 'block' } }
			onMouseEnter={ () => setHovered( true ) }
			onMouseLeave={ () => setHovered( false ) }
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
						style={ {
							position: 'absolute',
							right: '2px',
							top: '50%',
							transform: 'translateY(-50%)',
							minWidth: 0,
							padding: '2px',
							opacity: hovered ? 1 : 0,
							transition: 'opacity 0.1s ease',
							pointerEvents: hovered ? 'auto' : 'none',
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
		return assign( {}, settings, {
			attributes: merge( settings.attributes, {
				highlightedColumn: {
					type: 'string',
					default: '',
				},
				highlightedColumnColor: {
					type: 'string',
					default: '#eef8ea',
				},
				headerBackgroundColor: {
					type: 'string',
					default: '#5cba47',
				},
				firstColumnBackgroundColor: {
					type: 'string',
					default: '#f6f6f6',
				},
			} ),
		} );
	}
	return settings;
}
addFilter(
	'blocks.registerBlockType',
	'block-mods/table-block/add-custom-attributes',
	addAttributes,
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
			clientId,
		} = props;

		if ( name !== 'core/table' ) {
			return <BlockEdit { ...props } />;
		}

		const themeColors = useSelect( ( select ) => {
			return select( 'core/block-editor' ).getSettings()?.colors ?? [];
		}, [] );

		// Inject a scoped <style> tag so the editor matches the front end
		useEffect( () => {
			const styleId = `table-column-highlight-${ clientId }`;
			let style = document.getElementById( styleId );
			if ( ! style ) {
				style = document.createElement( 'style' );
				style.id = styleId;
				document.head.appendChild( style );
			}
			const rules = [];
			if ( headerBackgroundColor ) {
				rules.push( `[data-block="${ clientId }"] table thead th { background-color: ${ headerBackgroundColor }; }` );
			}
			if ( firstColumnBackgroundColor ) {
				rules.push( `[data-block="${ clientId }"] table td:first-child { background-color: ${ firstColumnBackgroundColor }; }` );
			}
			if ( highlightedColumn ) {
				const color = highlightedColumnColor || '#eef8ea';
				rules.push( `[data-block="${ clientId }"] table td:nth-child(${ highlightedColumn }) { background-color: ${ color }; }` );
			}
			style.textContent = rules.join( '\n' );
			return () => style.remove();
		}, [ highlightedColumn, highlightedColumnColor, headerBackgroundColor, firstColumnBackgroundColor, clientId ] );

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
			<Fragment>
				<BlockEdit { ...props } />
				<InspectorControls group="styles">
					<PanelBody title={ __( 'Advanced Table Styles', 'block-mods' ) } initialOpen={ true }>
						<SelectControl
							label={ __( 'Highlight Column', 'block-mods' ) }
							help={ __( 'Choose a column to highlight.', 'block-mods' ) }
							value={ highlightedColumn }
							options={ options }
							onChange={ ( value ) => setAttributes( { highlightedColumn: value } ) }
						/>
						<ColorDropdown 
							position="first"
							label={ __( 'Header Background', 'block-mods' ) }
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
							label={ __( 'First Column Background', 'block-mods' ) }
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
								label={ __( 'Highlight Background', 'block-mods' ) }
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
			</Fragment>
		);
	};
}, 'withInspectorControl' );
addFilter(
	'editor.BlockEdit',
	'block-mods/table-block/add-custom-controls',
	addInspectorControl,
);




