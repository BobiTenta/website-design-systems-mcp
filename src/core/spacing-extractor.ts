/**
 * Spacing Extractor
 *
 * Extracts spacing tokens, border radius, shadows, and layout information.
 */

import type {
    SpacingSystem,
    SpacingToken,
    BorderRadiusSystem,
    ShadowSystem,
    LayoutSystem,
    Breakpoint,
} from '../types/index.js';
import type { CSSDeclaration } from './css-extractor.js';
import { getPropertyValues } from './css-extractor.js';

/**
 * Parse a CSS length value to pixels
 */
function parseLength(value: string): number | null {
    const trimmed = value.trim().toLowerCase();

    if (trimmed === '0' || trimmed === '0px') {
        return 0;
    }

    if (trimmed.endsWith('px')) {
        return parseFloat(trimmed);
    }

    if (trimmed.endsWith('rem')) {
        return parseFloat(trimmed) * 16;
    }

    if (trimmed.endsWith('em')) {
        return parseFloat(trimmed) * 16;
    }

    // Try parsing as number (could be unitless)
    const num = parseFloat(trimmed);
    if (!isNaN(num)) {
        return num;
    }

    return null;
}

/**
 * Extract spacing values from declarations
 */
export function extractSpacing(
    declarations: CSSDeclaration[],
    cssVariables: Record<string, string>
): SpacingSystem {
    const spacingValues = new Map<number, { count: number; cssValue: string }>();

    // Properties that contain spacing values
    const spacingProperties = [
        'margin',
        'margin-top',
        'margin-right',
        'margin-bottom',
        'margin-left',
        'padding',
        'padding-top',
        'padding-right',
        'padding-bottom',
        'padding-left',
        'gap',
        'row-gap',
        'column-gap',
        'grid-gap',
    ];

    for (const decl of declarations) {
        if (spacingProperties.includes(decl.property.toLowerCase())) {
            // Handle shorthand values (e.g., "16px 24px")
            const parts = decl.value.split(/\s+/);
            for (const part of parts) {
                const pixels = parseLength(part);
                if (pixels !== null && pixels > 0) {
                    const existing = spacingValues.get(pixels);
                    if (existing) {
                        existing.count++;
                    } else {
                        spacingValues.set(pixels, { count: 1, cssValue: part });
                    }
                }
            }
        }
    }

    // Convert to array and sort
    const sortedSpacing = Array.from(spacingValues.entries())
        .sort((a, b) => a[0] - b[0])
        .filter(([px]) => px <= 200); // Filter out unreasonably large values

    // Create tokens with semantic names
    const tokens: SpacingToken[] = [];
    const tokenNames = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];
    let nameIndex = 0;

    for (const [pixels, data] of sortedSpacing) {
        if (nameIndex < tokenNames.length && data.count >= 2) {
            tokens.push({
                name: tokenNames[nameIndex],
                valuePixels: pixels,
                cssValue: data.cssValue,
                usage: ['spacing'],
            });
            nameIndex++;
        }
    }

    // Extract spacing-related CSS variables
    const spacingCssVars: Record<string, string> = {};
    for (const [varName, value] of Object.entries(cssVariables)) {
        if (
            varName.includes('space') ||
            varName.includes('gap') ||
            varName.includes('margin') ||
            varName.includes('padding')
        ) {
            spacingCssVars[varName] = value;
        }
    }

    // Detect base unit (most common factor)
    const baseUnit = detectBaseUnit(sortedSpacing.map(([px]) => px));

    return {
        tokens,
        baseUnit: baseUnit || undefined,
        cssVariables: spacingCssVars,
    };
}

/**
 * Detect the base spacing unit
 */
function detectBaseUnit(values: number[]): number | null {
    if (values.length < 2) return null;

    // Common base units
    const commonBases = [4, 8, 5, 10, 6];

    for (const base of commonBases) {
        const matches = values.filter((v) => v % base === 0);
        if (matches.length >= values.length * 0.6) {
            return base;
        }
    }

    return null;
}

/**
 * Extract border radius values
 */
export function extractBorderRadius(
    declarations: CSSDeclaration[],
    cssVariables: Record<string, string>
): BorderRadiusSystem {
    const radiusValues = new Map<string, number>();

    const radiusProperties = [
        'border-radius',
        'border-top-left-radius',
        'border-top-right-radius',
        'border-bottom-left-radius',
        'border-bottom-right-radius',
    ];

    for (const decl of declarations) {
        if (radiusProperties.includes(decl.property.toLowerCase())) {
            const parts = decl.value.split(/\s+/);
            for (const part of parts) {
                const pixels = parseLength(part);
                if (pixels !== null && !radiusValues.has(part)) {
                    radiusValues.set(part, pixels);
                }
            }
        }
    }

    // Sort and create tokens
    const sorted = Array.from(radiusValues.entries())
        .sort((a, b) => a[1] - b[1])
        .slice(0, 6);

    const tokenNames = ['none', 'sm', 'md', 'lg', 'xl', 'full'];
    const tokens = sorted.map(([value, pixels], index) => ({
        name: tokenNames[index] || `radius-${index}`,
        value,
        valuePixels: pixels,
    }));

    // Extract radius CSS variables
    const radiusCssVars: Record<string, string> = {};
    for (const [varName, value] of Object.entries(cssVariables)) {
        if (varName.includes('radius') || varName.includes('rounded')) {
            radiusCssVars[varName] = value;
        }
    }

    return {
        tokens,
        cssVariables: radiusCssVars,
    };
}

/**
 * Extract shadow values
 */
export function extractShadows(
    declarations: CSSDeclaration[],
    cssVariables: Record<string, string>
): ShadowSystem {
    const shadowValues = new Set<string>();

    for (const decl of declarations) {
        if (decl.property === 'box-shadow' || decl.property === 'text-shadow') {
            if (decl.value !== 'none' && decl.value !== 'inherit') {
                shadowValues.add(decl.value);
            }
        }
    }

    const tokens = Array.from(shadowValues)
        .slice(0, 5)
        .map((value, index) => ({
            name: ['sm', 'md', 'lg', 'xl', '2xl'][index] || `shadow-${index}`,
            value,
        }));

    // Extract shadow CSS variables
    const shadowCssVars: Record<string, string> = {};
    for (const [varName, value] of Object.entries(cssVariables)) {
        if (varName.includes('shadow')) {
            shadowCssVars[varName] = value;
        }
    }

    return {
        tokens,
        cssVariables: shadowCssVars,
    };
}

/**
 * Extract layout information from media queries
 */
export function extractLayout(
    declarations: CSSDeclaration[],
    mediaQueries: string[]
): LayoutSystem {
    // Extract container width
    let containerWidth: number | undefined;

    for (const decl of declarations) {
        if (decl.property === 'max-width') {
            const pixels = parseLength(decl.value);
            if (pixels && pixels >= 900 && pixels <= 1600) {
                containerWidth = pixels;
                break;
            }
        }
    }

    // Parse breakpoints from media queries
    const breakpoints: Breakpoint[] = [];
    const breakpointNames = ['sm', 'md', 'lg', 'xl', '2xl'];
    let nameIndex = 0;

    for (const mq of mediaQueries) {
        const minWidthMatch = mq.match(/min-width:\s*(\d+(?:\.\d+)?)(px|rem|em)?/i);
        const maxWidthMatch = mq.match(/max-width:\s*(\d+(?:\.\d+)?)(px|rem|em)?/i);

        if (minWidthMatch || maxWidthMatch) {
            const breakpoint: Breakpoint = {
                name: breakpointNames[nameIndex] || `bp-${nameIndex}`,
                cssValue: mq,
            };

            if (minWidthMatch) {
                let value = parseFloat(minWidthMatch[1]);
                const unit = minWidthMatch[2] || 'px';
                if (unit === 'rem' || unit === 'em') value *= 16;
                breakpoint.minWidth = value;
            }

            if (maxWidthMatch) {
                let value = parseFloat(maxWidthMatch[1]);
                const unit = maxWidthMatch[2] || 'px';
                if (unit === 'rem' || unit === 'em') value *= 16;
                breakpoint.maxWidth = value;
            }

            breakpoints.push(breakpoint);
            nameIndex++;
        }
    }

    // Sort breakpoints by min-width
    breakpoints.sort((a, b) => (a.minWidth || 0) - (b.minWidth || 0));

    // Detect grid
    const gridColumns = getPropertyValues(declarations, 'grid-template-columns');
    const gridGap = getPropertyValues(declarations, 'gap');

    const grid =
        gridColumns.length > 0
            ? {
                columns: gridColumns[0].split(/\s+/).length || 12,
                gap: gridGap[0] || '16px',
            }
            : undefined;

    return {
        containerWidth,
        breakpoints: breakpoints.slice(0, 5), // Limit to 5 breakpoints
        grid,
    };
}
