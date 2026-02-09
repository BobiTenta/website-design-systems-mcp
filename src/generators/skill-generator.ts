/**
 * Skill.md Generator
 *
 * Generates a comprehensive skill.md file from extracted design system data.
 * The output is formatted for AI consumption and human readability.
 */

import type { DesignSystem, ColorValue, TypeScaleEntry, GradientValue, ComponentPattern } from '../types/index.js';

/**
 * Generate the complete skill.md content
 */
export function generateSkillMd(designSystem: DesignSystem): string {
    const lines: string[] = [];

    // YAML frontmatter
    lines.push('---');
    lines.push(`name: "${designSystem.brand.siteName || 'Website'} Design System"`);
    lines.push('version: 1.0.0');
    lines.push(`source_url: ${designSystem.sourceUrl}`);
    lines.push(`extracted_at: ${designSystem.extractedAt}`);
    lines.push('---');
    lines.push('');

    // Header
    lines.push(`# ${designSystem.brand.siteName || 'Website'} Design System`);
    lines.push('');
    lines.push(`> Extracted from [${designSystem.sourceUrl}](${designSystem.sourceUrl})`);
    lines.push('');

    // Brand Identity
    lines.push('## Brand Identity');
    lines.push('');
    if (designSystem.brand.siteName) {
        lines.push(`- **Brand Name**: ${designSystem.brand.siteName}`);
    }
    if (designSystem.brand.tagline) {
        lines.push(`- **Tagline**: "${designSystem.brand.tagline}"`);
    }
    if (designSystem.brand.logoUrl) {
        lines.push(`- **Logo**: [Download](${designSystem.brand.logoUrl})`);
    }
    if (designSystem.brand.faviconUrl) {
        lines.push(`- **Favicon**: [Download](${designSystem.brand.faviconUrl})`);
    }
    if (designSystem.brand.ogImageUrl) {
        lines.push(`- **OG Image**: [Download](${designSystem.brand.ogImageUrl})`);
    }
    if (designSystem.brand.themeColor) {
        lines.push(`- **Theme Color**: ${designSystem.brand.themeColor}`);
    }
    lines.push('');

    // Color Palette
    lines.push('## Color Palette');
    lines.push('');

    if (designSystem.colors.primary.length > 0) {
        lines.push('### Primary Colors');
        lines.push('');
        lines.push('| Name | Hex | RGB | Usage |');
        lines.push('|------|-----|-----|-------|');
        for (const color of designSystem.colors.primary) {
            lines.push(formatColorRow(color));
        }
        lines.push('');
    }

    if (designSystem.colors.secondary.length > 0) {
        lines.push('### Secondary Colors');
        lines.push('');
        lines.push('| Name | Hex | RGB | Usage |');
        lines.push('|------|-----|-----|-------|');
        for (const color of designSystem.colors.secondary) {
            lines.push(formatColorRow(color));
        }
        lines.push('');
    }

    if (designSystem.colors.neutral.length > 0) {
        lines.push('### Neutral Colors');
        lines.push('');
        lines.push('| Hex | RGB |');
        lines.push('|-----|-----|');
        for (const color of designSystem.colors.neutral) {
            const rgbStr = `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`;
            lines.push(`| ${color.hex} | ${rgbStr} |`);
        }
        lines.push('');
    }

    // CSS Variables for Colors
    if (Object.keys(designSystem.colors.cssVariables).length > 0) {
        lines.push('### CSS Color Variables');
        lines.push('');
        lines.push('```css');
        lines.push(':root {');
        for (const [name, value] of Object.entries(designSystem.colors.cssVariables)) {
            lines.push(`  ${name}: ${value};`);
        }
        lines.push('}');
        lines.push('```');
        lines.push('');
    }

    // Gradients
    if (designSystem.gradients.gradients.length > 0) {
        lines.push('## Gradients');
        lines.push('');
        lines.push(`Found **${designSystem.gradients.totalGradients}** unique gradients.`);
        lines.push('');

        for (const gradient of designSystem.gradients.gradients.slice(0, 10)) {
            lines.push(formatGradient(gradient));
            lines.push('');
        }
    }

    // Typography
    lines.push('## Typography');
    lines.push('');

    if (designSystem.typography.fonts.length > 0) {
        lines.push('### Font Families');
        lines.push('');
        lines.push('| Type | Font | Fallbacks | Source |');
        lines.push('|------|------|-----------|--------|');
        for (const font of designSystem.typography.fonts) {
            const fallbacks = font.fallbacks.slice(0, 3).join(', ') || '-';
            lines.push(`| ${font.type} | ${font.name} | ${fallbacks} | ${font.source} |`);
        }
        lines.push('');

        // Google Fonts URL if available
        const googleFont = designSystem.typography.fonts.find((f) => f.googleFontsUrl);
        if (googleFont?.googleFontsUrl) {
            lines.push('**Google Fonts Import:**');
            lines.push('```html');
            lines.push(`<link href="${googleFont.googleFontsUrl}" rel="stylesheet">`);
            lines.push('```');
            lines.push('');
        }
    }

    if (designSystem.typography.scale.length > 0) {
        lines.push('### Type Scale');
        lines.push('');
        lines.push('| Element | Size | Weight | Line Height |');
        lines.push('|---------|------|--------|-------------|');
        for (const entry of designSystem.typography.scale) {
            lines.push(formatTypeScaleRow(entry));
        }
        lines.push('');
    }

    lines.push(`**Base Font Size**: ${designSystem.typography.baseFontSize}px`);
    lines.push('');

    // Spacing
    lines.push('## Spacing System');
    lines.push('');

    if (designSystem.spacing.tokens.length > 0) {
        lines.push('| Token | Value | Pixels |');
        lines.push('|-------|-------|--------|');
        for (const token of designSystem.spacing.tokens) {
            lines.push(`| ${token.name} | ${token.cssValue} | ${token.valuePixels}px |`);
        }
        lines.push('');
    }

    if (designSystem.spacing.baseUnit) {
        lines.push(`**Base Unit**: ${designSystem.spacing.baseUnit}px`);
        lines.push('');
    }

    // Border Radius
    if (designSystem.borderRadius.tokens.length > 0) {
        lines.push('## Border Radius');
        lines.push('');
        lines.push('| Token | Value |');
        lines.push('|-------|-------|');
        for (const token of designSystem.borderRadius.tokens) {
            lines.push(`| ${token.name} | ${token.value} |`);
        }
        lines.push('');
    }

    // Shadows
    if (designSystem.shadows.tokens.length > 0) {
        lines.push('## Shadows');
        lines.push('');
        lines.push('```css');
        for (const token of designSystem.shadows.tokens) {
            lines.push(`--shadow-${token.name}: ${token.value};`);
        }
        lines.push('```');
        lines.push('');
    }

    // Animations & Transitions
    if (designSystem.animations.transitions.length > 0 || designSystem.animations.keyframes.length > 0) {
        lines.push('## Animations & Transitions');
        lines.push('');

        // Transitions
        if (designSystem.animations.transitions.length > 0) {
            lines.push('### Transitions');
            lines.push('');
            lines.push('| Property | Duration | Timing Function |');
            lines.push('|----------|----------|-----------------|');
            for (const t of designSystem.animations.transitions.slice(0, 10)) {
                lines.push(`| ${t.property} | ${t.duration} | ${t.timingFunction} |`);
            }
            lines.push('');
        }

        // Keyframes
        if (designSystem.animations.keyframes.length > 0) {
            lines.push('### Keyframe Animations');
            lines.push('');
            for (const keyframe of designSystem.animations.keyframes.slice(0, 5)) {
                lines.push(`#### @keyframes ${keyframe.name}`);
                lines.push('');
                lines.push('```css');
                lines.push(keyframe.css);
                lines.push('```');
                lines.push('');
            }
        }

        // Common timing functions
        if (designSystem.animations.timingFunctions.length > 0) {
            lines.push('### Common Timing Functions');
            lines.push('');
            lines.push('```css');
            for (const tf of designSystem.animations.timingFunctions.slice(0, 5)) {
                lines.push(tf);
            }
            lines.push('```');
            lines.push('');
        }
    }

    // Component Patterns
    if (designSystem.components.length > 0) {
        lines.push('## Component Patterns');
        lines.push('');
        lines.push(`Detected **${designSystem.components.length}** component patterns.`);
        lines.push('');

        for (const component of designSystem.components.slice(0, 10)) {
            lines.push(formatComponent(component));
            lines.push('');
        }
    }

    // Layout
    lines.push('## Layout');
    lines.push('');

    if (designSystem.layout.containerWidth) {
        lines.push(`- **Container Width**: ${designSystem.layout.containerWidth}px`);
    }

    if (designSystem.layout.breakpoints.length > 0) {
        lines.push('');
        lines.push('### Breakpoints');
        lines.push('');
        lines.push('| Name | Min Width | Max Width |');
        lines.push('|------|-----------|-----------|');
        for (const bp of designSystem.layout.breakpoints) {
            const min = bp.minWidth ? `${bp.minWidth}px` : '-';
            const max = bp.maxWidth ? `${bp.maxWidth}px` : '-';
            lines.push(`| ${bp.name} | ${min} | ${max} |`);
        }
        lines.push('');
    }

    if (designSystem.layout.grid) {
        lines.push(`- **Grid**: ${designSystem.layout.grid.columns} columns, ${designSystem.layout.grid.gap} gap`);
        lines.push('');
    }

    // All CSS Variables
    if (Object.keys(designSystem.allCssVariables).length > 0) {
        lines.push('## All CSS Variables');
        lines.push('');
        lines.push('```css');
        lines.push(':root {');
        const vars = Object.entries(designSystem.allCssVariables).slice(0, 50);
        for (const [name, value] of vars) {
            lines.push(`  ${name}: ${value};`);
        }
        if (Object.keys(designSystem.allCssVariables).length > 50) {
            lines.push(`  /* ... and ${Object.keys(designSystem.allCssVariables).length - 50} more */`);
        }
        lines.push('}');
        lines.push('```');
        lines.push('');
    }

    // Metadata
    lines.push('---');
    lines.push('');
    lines.push('## Extraction Metadata');
    lines.push('');
    lines.push(`- **HTTP Status**: ${designSystem.metadata.statusCode}`);
    lines.push(`- **Stylesheets Processed**: ${designSystem.metadata.stylesheetsProcessed}`);
    lines.push(`- **CSS Rules Analyzed**: ${designSystem.metadata.cssRulesAnalyzed}`);
    lines.push(`- **Extraction Time**: ${designSystem.metadata.extractionTimeMs}ms`);
    lines.push(`- **Total Colors Found**: ${designSystem.colors.totalColors}`);
    lines.push(`- **Total Gradients Found**: ${designSystem.gradients.totalGradients}`);
    lines.push(`- **Components Detected**: ${designSystem.components.length}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('*Generated by website-design-systems-mcp*');

    return lines.join('\n');
}

/**
 * Format a color value as a table row
 */
function formatColorRow(color: ColorValue): string {
    const name = color.semanticName || capitalize(color.usage[0]) || 'Color';
    const rgbStr = color.rgb.a !== undefined
        ? `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a.toFixed(2)})`
        : `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`;
    const usage = color.usage.join(', ');
    return `| ${name} | ${color.hex} | ${rgbStr} | ${usage} |`;
}

/**
 * Format a type scale entry as a table row
 */
function formatTypeScaleRow(entry: TypeScaleEntry): string {
    const element = entry.element.toUpperCase();
    const size = entry.fontSizeCSS;
    const weight = entry.fontWeight;
    const lineHeight = entry.lineHeight;
    return `| ${element} | ${size} | ${weight} | ${lineHeight} |`;
}

/**
 * Format a gradient for display
 */
function formatGradient(gradient: GradientValue): string {
    const lines: string[] = [];
    const typeLabel = gradient.type.charAt(0).toUpperCase() + gradient.type.slice(1);
    lines.push(`### ${typeLabel} Gradient`);
    lines.push('');
    lines.push('```css');
    lines.push(`background: ${gradient.original};`);
    lines.push('```');

    if (gradient.colorStops.length > 0) {
        lines.push('');
        lines.push('**Color Stops:**');
        for (const stop of gradient.colorStops) {
            const pos = stop.position ? ` at ${stop.position}` : '';
            lines.push(`- \`${stop.color}\`${pos}`);
        }
    }

    return lines.join('\n');
}

/**
 * Format a component pattern for display
 */
function formatComponent(component: ComponentPattern): string {
    const lines: string[] = [];
    lines.push(`### ${component.name}`);
    lines.push('');
    if (component.description) {
        lines.push(`*${component.description}*`);
        lines.push('');
    }
    lines.push('```css');
    lines.push(component.css);
    lines.push('```');
    return lines.join('\n');
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}
