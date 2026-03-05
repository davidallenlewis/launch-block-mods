import { insert, create, applyFormat, getActiveFormat } from '@wordpress/rich-text';
import { RichTextToolbarButton, ColorPalette } from '@wordpress/block-editor';
import { Popover, Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { published } from '@wordpress/icons';
import { customIcons } from './marks';

const FORMAT_NAME = 'block-mods/mark';

const SIZES = [
	{ label: 'S', value: '1rem' },
	{ label: 'M', value: '1.5rem' },
	{ label: 'L', value: '2rem' },
];

function parseStyle( styleStr = '' ) {
	return Object.fromEntries(
		styleStr.split( ';' ).filter( Boolean ).map( ( part ) => {
			const [ k, ...rest ] = part.split( ':' );
			return [ k.trim(), rest.join( ':' ).trim() ];
		} )
	);
}

export default function Edit( { value, onChange, isActive } ) {
	const themeColors = useSelect( ( select ) => {
		return select( 'core/block-editor' ).getSettings()?.colors ?? [];
	} );

	const [ isOpen, setIsOpen ] = useState( false );
	const [ size, setSize ] = useState( '1.5rem' );
	const [ color, setColor ] = useState( 'currentColor' );
	const [ selectedIcon, setSelectedIcon ] = useState( null );

	const activeFormat = getActiveFormat( value, FORMAT_NAME );
	const activeStyle = activeFormat?.attributes?.style ?? null;

	// Pre-populate controls from existing icon when cursor moves into one
	useEffect( () => {
		if ( activeStyle ) {
			const s = parseStyle( activeStyle );
			if ( s[ 'font-size' ] ) setSize( s[ 'font-size' ] );
			if ( s.color ) setColor( s.color );
		}
		if ( activeFormat?.attributes?.[ 'data-mark' ] ) {
			const found = customIcons.find( ( i ) => i.name === activeFormat.attributes[ 'data-mark' ] );
			if ( found ) setSelectedIcon( found );
		}
	}, [ activeStyle ] );


	const buildIconStyle = ( w, c ) => {
		const parts = [ `font-size:${ w }` ];
		if ( c && c !== 'currentColor' ) parts.push( `color:${ c }` );
		return parts.join( ';' );
	};

	const applyIcon = ( iconData, w = size, c = color ) => {
		const style = buildIconStyle( w, c );
		const format = { type: FORMAT_NAME, attributes: { 'data-mark': iconData.name, style } };
		const formattedChar = applyFormat( create( { text: iconData.char } ), format, 0, 1 );

		let newValue;
		if ( isActive ) {
			// Replace the character (and its format) with the new icon
			const insertPos = value.start;
			newValue = insert( value, formattedChar );
			newValue = { ...newValue, start: insertPos, end: insertPos + 1 };
		} else {
			const insertPos = value.start ?? value.text.length;
			newValue = insert( value, formattedChar );
			newValue = { ...newValue, start: insertPos, end: insertPos + 1 };
		}

		onChange( newValue );
	};

	const handleSizeChange = ( newSize ) => {
		setSize( newSize );
		if ( selectedIcon ) applyIcon( selectedIcon, newSize, color );
	};

	const handleColorChange = ( newColor ) => {
		setColor( newColor );
		if ( selectedIcon ) applyIcon( selectedIcon, size, newColor );
	};

	const handleIconSelect = ( iconData ) => {
		setSelectedIcon( iconData );
		applyIcon( iconData, size, color );
	};

	return (
		<>
			<RichTextToolbarButton
				icon={ published }
				title={ __( 'Mark', 'block-mods' ) }
				onClick={ () => setIsOpen( ( prev ) => ! prev ) }
				isActive={ isActive }
			/>
			{ isOpen && (
				<Popover
					placement="bottom-start"
					onClose={ () => setIsOpen( false ) }
					focusOnMount="container"
				>
					<div style={ { padding: '12px', width: '240px', boxSizing: 'border-box', overflow: 'hidden' } }>
						<div style={ { display: 'flex', gap: '4px', marginBottom: '10px' } }>
							{ SIZES.map( ( s ) => (
								<button
									key={ s.value }
									onClick={ () => handleSizeChange( s.value ) }
									style={ {
										flex: 1,
										padding: '4px',
										border: `2px solid ${ size === s.value ? '#1e1e1e' : '#ddd' }`,
										borderRadius: '3px',
										background: '#fff',
										cursor: 'pointer',
										fontWeight: size === s.value ? 600 : 400,
									} }
								>
									{ s.label }
								</button>
							) ) }
						</div>

						<ColorPalette
							colors={ themeColors }
							value={ color === 'currentColor' ? undefined : color }
							onChange={ ( val ) => handleColorChange( val ?? 'currentColor' ) }
						/>

						<div style={ { display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' } }>
							{ customIcons.map( ( iconData ) => (
								<button
									key={ iconData.name }
									title={ iconData.title }
									onClick={ () => handleIconSelect( iconData ) }
									style={ {
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										width: '40px',
										height: '40px',
										padding: '4px',
										border: `1px solid ${ selectedIcon?.name === iconData.name ? '#1e1e1e' : '#ddd' }`,
										borderRadius: '4px',
										background: '#fff',
										cursor: 'pointer',
										flexShrink: 0,
										fontFamily: 'icomoon',
										fontSize: '20px',
									} }
								>
									{ iconData.char }
								</button>
							) ) }
						</div>

						<Button
							variant="primary"
							onClick={ () => setIsOpen( false ) }
							disabled={ ! selectedIcon }
							style={ { width: '100%', justifyContent: 'center' } }
						>
							{ __( 'Apply', 'block-mods' ) }
						</Button>

					</div>
				</Popover>
			) }
		</>
	);
}