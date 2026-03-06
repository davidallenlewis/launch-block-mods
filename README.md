# Launch Block Mods
A WordPress plugin that modifies and extends native Gutenberg block functionality.

## Features

### Block Filters
- **Block Backgrounds** — Adds background colour and gradient support to image, video, embed, and media-text blocks
- **Block Spacing** — Adds inner/outer spacing and rainbow separator bar options to group, cover, columns, and media-text blocks
- **Button Size** — Adds a size selector (regular/small) to the button block
- **Buttons Spacing** — Adds space-above and space-below toggle controls to the buttons block
- **Column Spacing** — Adds an inner spacing toggle to the column block
- **Columns Padding** — Adds flush-left and flush-right padding controls to the columns block
- **Heading Attributes** — Adds green underline and top margin toggle controls to heading and post-title blocks
- **Table Colours** — Adds header row, first column, and highlighted column background colour controls to the table block, with automatic contrast text colour

### Formats
- **Mark** — Inline format for injecting icon marks (checkmarks, crosses, etc.) using an icomoon icon font

## Installation
- Pull the plugin repo to the `wp-content/plugins` folder of your WordPress site
- Navigate to the plugin folder in the command line and run `npm install && npm run build`

## Usage Notes
- The plugin only adds classes (as needed). Any necessary styling is left up to the theme.
- Table colour rules are output as scoped inline CSS custom properties on the block wrapper, styled via the plugin's own stylesheet.
