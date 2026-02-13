# website-design-systems-mcp

<div align="center">

[![npm version](https://img.shields.io/npm/v/stitch-mcp.svg)](https://www.npmjs.com/package/stitch-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io)

**Extract complete design systems from any website and generate AI-ready skill.md files**

</div> 

---

## Overview

**website-design-systems-mcp** is a Model Context Protocol (MCP) server that extracts comprehensive design systems from any website URL. It generates detailed, AI-readable `skill.md` files that enable AI assistants to recreate the exact same design.

### Features

- 🎨 **Complete Color Palette Extraction** - Primary, secondary, and neutral colors with semantic naming
- 📝 **Typography Analysis** - Font families, type scale, weights, line heights
- 📏 **Spacing System Detection** - Tokens, base units, CSS variables
- 🔲 **Border Radius & Shadows** - All design tokens captured
- 📐 **Layout Analysis** - Container widths, breakpoints, grid systems
- 🏷️ **Brand Identity** - Logo, favicon, meta information
- 🚫 **No Browser Required** - Pure HTTP extraction, no Puppeteer/Playwright
- 🛡️ **Anti-Blocking** - User-Agent rotation, proper headers

---

## Installation

```bash
npm install website-design-systems-mcp
```

Or use directly with npx:

```bash
npx website-design-systems-mcp
```

---

## Usage with Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "website-design-systems": {
      "command": "npx",
      "args": ["-y", "website-design-systems-mcp"]
    }
  }
}
```

Or if installed locally:

```json
{
  "mcpServers": {
    "website-design-systems": {
      "command": "node",
      "args": ["/path/to/website-design-systems-mcp/dist/index.js"]
    }
  }
}
```

---

## Available Tools

### `extract_design_system`

**Main tool** - Extracts complete design system and generates a comprehensive `skill.md` file.

```
Input: { "url": "https://stripe.com" }
Output: Complete skill.md with colors, typography, spacing, and more
```

### `validate_url`

Quick check if a URL is accessible before extraction.

```
Input: { "url": "https://example.com" }
Output: { "accessible": true, "statusCode": 200, "contentType": "text/html" }
```

### `get_site_colors`

Extract only the color palette.

```
Input: { "url": "https://example.com" }
Output: JSON with primary, secondary, and neutral colors
```

### `get_site_typography`

Extract only typography information.

```
Input: { "url": "https://example.com" }
Output: JSON with fonts, type scale, and text styles
```

---

## Output Format

The generated `skill.md` includes:

- **YAML Frontmatter** - Metadata for AI consumption
- **Brand Identity** - Logo, favicon, tagline
- **Color Palette** - Organized by usage with hex, RGB, and CSS variables
- **Typography** - Font families, type scale, line heights
- **Spacing System** - Tokens from xs to 4xl
- **Border Radius** - All radius tokens
- **Shadows** - Box shadow definitions
- **Layout** - Container width, breakpoints, grid
- **CSS Variables** - All custom properties

---

## Development

```bash
# Clone the repository
git clone https://github.com/Kargatharaakash/website-design-systems-mcp.git
cd website-design-systems-mcp

# Install dependencies
npm install

# Build
npm run build

# Run in development
npm run dev
```

---

## How It Works

1. **HTTP Fetch** - Fetches the page with browser-like headers to avoid blocking
2. **HTML Parsing** - Uses Cheerio to parse HTML and extract style sources
3. **CSS Extraction** - Collects inline styles, `<style>` tags, and external stylesheets
4. **Token Analysis** - Analyzes CSS to extract colors, typography, spacing patterns
5. **Skill Generation** - Compiles everything into a structured `skill.md` file

---

## Limitations

- **JavaScript-Rendered Content** - May not capture styles from JS-only rendered sites
- **Aggressive Bot Protection** - Some sites with Cloudflare/etc. may block requests
- **Login-Required Content** - Cannot access authenticated pages

For most public websites, the extraction works excellently.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io) by Anthropic
- [Cheerio](https://cheerio.js.org/) for HTML parsing
- [css](https://github.com/reworkcss/css) for CSS parsing
