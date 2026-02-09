/**
 * Typography Extractor
 *
 * Extracts typography information including:
 * - Font families
 * - Type scale (sizes, weights, line-heights)
 * - CSS variables for typography
 */

import type { TypographySystem, FontFamily, TypeScaleEntry } from '../types/index.js';
import type { CSSDeclaration, CSSRule } from './css-extractor.js';
import { getPropertyValues } from './css-extractor.js';

/**
 * Common system font stacks
 */
const SYSTEM_FONTS = [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
    'serif',
    'monospace',
    'cursive',
    'fantasy',
    'ui-sans-serif',
    'ui-serif',
    'ui-monospace',
];

/**
 * Parse a font-family CSS value into structured data
 */
function parseFontFamily(fontFamilyValue: string): FontFamily {
    const fonts = fontFamilyValue
        .split(',')
        .map((f) => f.trim().replace(/^['"]|['"]$/g, ''));

    const primaryFont = fonts[0] || 'sans-serif';
    const fallbacks = fonts.slice(1);

    // Determine font type
    const type = determineFontType(primaryFont, fallbacks);

    // Determine source
    const source = determineFontSource(primaryFont);

    return {
        name: primaryFont,
        fallbacks,
        cssValue: fontFamilyValue,
        type,
        source,
    };
}

/**
 * Determine font type from font name
 */
function determineFontType(
    fontName: string,
    fallbacks: string[]
): FontFamily['type'] {
    const lower = fontName.toLowerCase();
    const allFonts = [lower, ...fallbacks.map((f) => f.toLowerCase())];

    // Check explicit generic families
    if (allFonts.includes('monospace') || lower.includes('mono') || lower.includes('code')) {
        return 'monospace';
    }
    if (allFonts.includes('serif') && !allFonts.includes('sans-serif')) {
        return 'serif';
    }
    if (allFonts.includes('cursive') || lower.includes('script') || lower.includes('handwriting')) {
        return 'handwriting';
    }

    // Check for display fonts (often have "display" in name)
    if (lower.includes('display')) {
        return 'display';
    }

    // Default to sans-serif
    return 'sans-serif';
}

/**
 * Determine font source (Google Fonts, system, custom)
 */
function determineFontSource(fontName: string): FontFamily['source'] {
    const lower = fontName.toLowerCase();

    // Check if it's a system font
    if (SYSTEM_FONTS.some((sf) => sf.toLowerCase() === lower)) {
        return 'system';
    }

    // Most non-system fonts these days come from Google Fonts
    // This is a heuristic; could be enhanced with Google Fonts API lookup
    const commonGoogleFonts = [
        'roboto',
        'open sans',
        'lato',
        'montserrat',
        'poppins',
        'inter',
        'nunito',
        'playfair display',
        'raleway',
        'ubuntu',
        'merriweather',
        'pt sans',
        'source sans',
        'oswald',
        'noto sans',
        'rubik',
        'work sans',
        'mulish',
        'dm sans',
        'outfit',
        'space grotesk',
        'plus jakarta sans',
        'geist',
        'cal sans',
    ];

    if (commonGoogleFonts.some((gf) => lower.includes(gf))) {
        return 'google-fonts';
    }

    return 'custom';
}

/**
 * Parse font size value to pixels
 */
function parseFontSize(value: string): number {
    const trimmed = value.trim().toLowerCase();

    // Direct pixel value
    if (trimmed.endsWith('px')) {
        return parseFloat(trimmed);
    }

    // REM (assume 16px base)
    if (trimmed.endsWith('rem')) {
        return parseFloat(trimmed) * 16;
    }

    // EM (assume 16px base)
    if (trimmed.endsWith('em')) {
        return parseFloat(trimmed) * 16;
    }

    // Named sizes
    const namedSizes: Record<string, number> = {
        'xx-small': 9,
        'x-small': 10,
        small: 13,
        medium: 16,
        large: 18,
        'x-large': 24,
        'xx-large': 32,
        'xxx-large': 48,
    };

    if (namedSizes[trimmed]) {
        return namedSizes[trimmed];
    }

    return 16; // Default
}

/**
 * Extract typography from CSS rules
 */
export function extractTypography(
    declarations: CSSDeclaration[],
    rules: CSSRule[],
    cssVariables: Record<string, string>,
    googleFontsUrl?: string
): TypographySystem {
    // Extract font families
    const fontFamilyValues = getPropertyValues(declarations, 'font-family');
    const fontFamiliesMap = new Map<string, FontFamily>();

    for (const value of fontFamilyValues) {
        const parsed = parseFontFamily(value);
        if (!fontFamiliesMap.has(parsed.name)) {
            // Add Google Fonts URL if detected
            if (googleFontsUrl && parsed.source === 'google-fonts') {
                parsed.googleFontsUrl = googleFontsUrl;
            }
            fontFamiliesMap.set(parsed.name, parsed);
        }
    }

    const fonts = Array.from(fontFamiliesMap.values());

    // Extract type scale from rules targeting headings and body
    const scale: TypeScaleEntry[] = [];
    const processedElements = new Set<string>();

    for (const rule of rules) {
        for (const selector of rule.selectors) {
            const lower = selector.toLowerCase().trim();

            // Check for heading selectors
            const headingMatch = lower.match(/^h([1-6])$/);
            if (headingMatch && !processedElements.has(lower)) {
                const entry = extractTypeScaleEntry(lower, rule.declarations);
                if (entry) {
                    scale.push(entry);
                    processedElements.add(lower);
                }
            }

            // Check for body/paragraph
            if ((lower === 'body' || lower === 'p' || lower === 'html') && !processedElements.has(lower)) {
                const entry = extractTypeScaleEntry(lower, rule.declarations);
                if (entry) {
                    scale.push(entry);
                    processedElements.add(lower);
                }
            }

            // Check for small text
            if ((lower === 'small' || lower.includes('.text-sm') || lower.includes('.text-xs')) && !processedElements.has('small')) {
                const entry = extractTypeScaleEntry('small', rule.declarations);
                if (entry) {
                    scale.push(entry);
                    processedElements.add('small');
                }
            }
        }
    }

    // Sort scale by font size (descending)
    scale.sort((a, b) => b.fontSize - a.fontSize);

    // Extract base font size
    const baseFontSize = (() => {
        for (const rule of rules) {
            if (rule.selectors.some((s) => s.toLowerCase() === 'html' || s.toLowerCase() === ':root')) {
                for (const decl of rule.declarations) {
                    if (decl.property === 'font-size') {
                        return parseFontSize(decl.value);
                    }
                }
            }
        }
        return 16; // Default
    })();

    // Extract typography-related CSS variables
    const typographyCssVars: Record<string, string> = {};
    for (const [varName, value] of Object.entries(cssVariables)) {
        if (
            varName.includes('font') ||
            varName.includes('text') ||
            varName.includes('heading') ||
            varName.includes('line-height') ||
            varName.includes('letter-spacing')
        ) {
            typographyCssVars[varName] = value;
        }
    }

    return {
        fonts,
        scale,
        baseFontSize,
        cssVariables: typographyCssVars,
    };
}

/**
 * Extract type scale entry from declarations
 */
function extractTypeScaleEntry(
    element: string,
    declarations: CSSDeclaration[]
): TypeScaleEntry | null {
    let fontSize: number | null = null;
    let fontWeight: number | string = 400;
    let lineHeight: number | string = 1.5;
    let letterSpacing: string | undefined;
    let textTransform: string | undefined;

    for (const decl of declarations) {
        switch (decl.property.toLowerCase()) {
            case 'font-size':
                fontSize = parseFontSize(decl.value);
                break;
            case 'font-weight':
                fontWeight = isNaN(parseInt(decl.value)) ? decl.value : parseInt(decl.value);
                break;
            case 'line-height':
                lineHeight = decl.value;
                break;
            case 'letter-spacing':
                letterSpacing = decl.value;
                break;
            case 'text-transform':
                textTransform = decl.value;
                break;
        }
    }

    if (fontSize === null) {
        // Use default sizes for common elements
        const defaults: Record<string, number> = {
            h1: 48,
            h2: 36,
            h3: 30,
            h4: 24,
            h5: 20,
            h6: 16,
            body: 16,
            p: 16,
            small: 14,
        };
        fontSize = defaults[element] || 16;
    }

    return {
        element,
        fontSize,
        fontSizeCSS: `${fontSize}px`,
        fontWeight,
        lineHeight,
        letterSpacing,
        textTransform,
    };
}
