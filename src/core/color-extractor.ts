/**
 * Color Extractor
 *
 * Extracts color palette from CSS declarations and organizes
 * them into primary, secondary, and neutral categories.
 */

import type { ColorPalette, ColorValue, ColorUsage } from '../types/index.js';
import type { CSSDeclaration } from './css-extractor.js';
import {
    isNeutralColor,
    extractColorsFromValue,
    createColorValue,
} from '../utils/color-utils.js';

/**
 * CSS properties that contain color values
 */
const COLOR_PROPERTIES: Record<string, ColorUsage> = {
    color: 'text',
    'background-color': 'background',
    'background': 'background',
    'border-color': 'border',
    'border-top-color': 'border',
    'border-right-color': 'border',
    'border-bottom-color': 'border',
    'border-left-color': 'border',
    border: 'border',
    'outline-color': 'border',
    'box-shadow': 'shadow',
    'text-shadow': 'shadow',
    fill: 'accent',
    stroke: 'border',
    'text-decoration-color': 'accent',
    'caret-color': 'accent',
    'accent-color': 'accent',
    'column-rule-color': 'border',
};

/**
 * Extract all colors from CSS declarations
 */
export function extractColors(
    declarations: CSSDeclaration[],
    cssVariables: Record<string, string>
): ColorPalette {
    const colorMap = new Map<string, ColorValue>();

    // Extract colors from declarations
    for (const decl of declarations) {
        const usage = COLOR_PROPERTIES[decl.property.toLowerCase()];
        if (!usage) continue;

        // Extract all colors from the value (handles gradients, multiple values)
        const colorStrings = extractColorsFromValue(decl.value);

        for (const colorStr of colorStrings) {
            const colorValue = createColorValue(colorStr, usage);
            if (!colorValue) continue;

            const key = colorValue.hex;
            const existing = colorMap.get(key);

            if (existing) {
                existing.frequency++;
                if (!existing.usage.includes(usage)) {
                    existing.usage.push(usage);
                }
            } else {
                colorMap.set(key, colorValue);
            }
        }
    }

    // Extract colors from CSS variables
    for (const [varName, value] of Object.entries(cssVariables)) {
        // Check if variable name suggests a color
        const isColorVar =
            varName.includes('color') ||
            varName.includes('bg') ||
            varName.includes('background') ||
            varName.includes('border') ||
            varName.includes('text') ||
            varName.includes('primary') ||
            varName.includes('secondary') ||
            varName.includes('accent') ||
            varName.includes('surface') ||
            varName.includes('fill');

        if (isColorVar) {
            const colorValue = createColorValue(value, 'unknown');
            if (colorValue) {
                // Try to infer semantic name from variable name
                colorValue.semanticName = inferSemanticName(varName);

                const key = colorValue.hex;
                const existing = colorMap.get(key);

                if (existing) {
                    existing.frequency++;
                    if (colorValue.semanticName && !existing.semanticName) {
                        existing.semanticName = colorValue.semanticName;
                    }
                } else {
                    colorMap.set(key, colorValue);
                }
            }
        }
    }

    // Convert to array and sort by frequency
    const allColors = Array.from(colorMap.values()).sort((a, b) => b.frequency - a.frequency);

    // Categorize colors
    const primary: ColorValue[] = [];
    const secondary: ColorValue[] = [];
    const neutral: ColorValue[] = [];

    for (const color of allColors) {
        if (isNeutralColor(color.rgb)) {
            neutral.push(color);
        } else if (color.semanticName?.includes('primary') || color.frequency >= 3) {
            primary.push(color);
        } else {
            secondary.push(color);
        }
    }

    // Limit each category
    const limitedPrimary = primary.slice(0, 5);
    const limitedSecondary = secondary.slice(0, 10);
    const limitedNeutral = neutral.slice(0, 10);

    // Build CSS variables for colors
    const colorCssVariables: Record<string, string> = {};
    for (const [varName, value] of Object.entries(cssVariables)) {
        if (
            varName.includes('color') ||
            varName.includes('bg') ||
            varName.includes('background') ||
            varName.includes('primary') ||
            varName.includes('secondary')
        ) {
            colorCssVariables[varName] = value;
        }
    }

    return {
        primary: limitedPrimary,
        secondary: limitedSecondary,
        neutral: limitedNeutral,
        cssVariables: colorCssVariables,
        totalColors: allColors.length,
    };
}

/**
 * Infer semantic name from CSS variable name
 */
function inferSemanticName(varName: string): string | undefined {
    const lower = varName.toLowerCase();

    if (lower.includes('primary')) return 'primary';
    if (lower.includes('secondary')) return 'secondary';
    if (lower.includes('accent')) return 'accent';
    if (lower.includes('success')) return 'success';
    if (lower.includes('warning')) return 'warning';
    if (lower.includes('error') || lower.includes('danger')) return 'danger';
    if (lower.includes('info')) return 'info';
    if (lower.includes('text')) return 'text';
    if (lower.includes('background') || lower.includes('bg')) return 'background';
    if (lower.includes('border')) return 'border';
    if (lower.includes('link')) return 'link';
    if (lower.includes('muted')) return 'muted';
    if (lower.includes('surface')) return 'surface';

    return undefined;
}

/**
 * Format color palette as a simple string representation
 */
export function formatColorPalette(palette: ColorPalette): string {
    const lines: string[] = [];

    lines.push('### Primary Colors');
    for (const color of palette.primary) {
        lines.push(
            `- ${color.hex} (${color.semanticName || color.usage.join(', ')})`
        );
    }

    lines.push('\n### Secondary Colors');
    for (const color of palette.secondary) {
        lines.push(
            `- ${color.hex} (${color.semanticName || color.usage.join(', ')})`
        );
    }

    lines.push('\n### Neutral Colors');
    for (const color of palette.neutral) {
        lines.push(`- ${color.hex}`);
    }

    return lines.join('\n');
}
