/**
 * Design System Extractor
 *
 * Main orchestrator that coordinates all extraction modules
 * to produce a complete DesignSystem object.
 */

import { fetchPage, validateUrl as httpValidateUrl } from './http-client.js';
import { parseHTML, extractGoogleFontsUrl } from './html-parser.js';
import { extractAllCSS } from './css-extractor.js';
import { extractColors } from './color-extractor.js';
import { extractTypography } from './typography-extractor.js';
import { extractGradients } from './gradient-extractor.js';
import { extractAnimations } from './animation-extractor.js';
import { extractComponents } from './component-extractor.js';
import {
    extractSpacing,
    extractBorderRadius,
    extractShadows,
    extractLayout,
} from './spacing-extractor.js';
import type { DesignSystem, UrlValidationResult, ColorPalette, TypographySystem } from '../types/index.js';
import { isValidUrl } from '../utils/url-utils.js';

/**
 * Extract complete design system from a URL
 */
export async function extractDesignSystem(url: string): Promise<DesignSystem> {
    const startTime = Date.now();

    // Validate URL format
    if (!isValidUrl(url)) {
        throw new Error(`Invalid URL format: ${url}`);
    }

    // Fetch the page
    const fetchResult = await fetchPage(url);

    if (fetchResult.statusCode >= 400) {
        throw new Error(`Failed to fetch URL: HTTP ${fetchResult.statusCode}`);
    }

    // Parse HTML
    const parsed = parseHTML(fetchResult.html, fetchResult.finalUrl);
    const googleFontsUrl = extractGoogleFontsUrl(parsed.$);

    // Extract all CSS
    const css = await extractAllCSS(
        parsed.inlineStyles,
        parsed.styleTags,
        parsed.stylesheetUrls
    );

    // Combine all CSS content for keyframe extraction
    const allCSSContent = [...parsed.styleTags].join('\n');

    // Extract colors
    const colors = extractColors(css.allDeclarations, css.cssVariables);

    // Extract typography
    const typography = extractTypography(
        css.allDeclarations,
        css.rules,
        css.cssVariables,
        googleFontsUrl
    );

    // Extract spacing
    const spacing = extractSpacing(css.allDeclarations, css.cssVariables);

    // Extract border radius
    const borderRadius = extractBorderRadius(css.allDeclarations, css.cssVariables);

    // Extract shadows
    const shadows = extractShadows(css.allDeclarations, css.cssVariables);

    // Extract gradients
    const gradients = extractGradients(css.allDeclarations, css.cssVariables);

    // Extract animations
    const animations = extractAnimations(
        css.allDeclarations,
        css.rules,
        allCSSContent,
        css.cssVariables
    );

    // Extract layout
    const layout = extractLayout(css.allDeclarations, css.mediaQueries);

    // Extract component patterns
    const components = extractComponents(css.rules);

    const extractionTime = Date.now() - startTime;

    return {
        sourceUrl: url,
        extractedAt: new Date().toISOString(),
        brand: parsed.brand,
        colors,
        typography,
        spacing,
        borderRadius,
        shadows,
        gradients,
        animations,
        layout,
        components,
        allCssVariables: css.cssVariables,
        metadata: {
            statusCode: fetchResult.statusCode,
            stylesheetsProcessed: parsed.stylesheetUrls.length,
            cssRulesAnalyzed: css.rules.length,
            extractionTimeMs: extractionTime,
        },
    };
}

/**
 * Validate if a URL is accessible
 */
export async function validateUrl(url: string): Promise<UrlValidationResult> {
    if (!isValidUrl(url)) {
        return {
            accessible: false,
            statusCode: 0,
            error: 'Invalid URL format',
        };
    }

    return httpValidateUrl(url);
}

/**
 * Extract only colors from a URL
 */
export async function extractColorsOnly(url: string): Promise<ColorPalette> {
    const fetchResult = await fetchPage(url);
    const parsed = parseHTML(fetchResult.html, fetchResult.finalUrl);
    const css = await extractAllCSS(
        parsed.inlineStyles,
        parsed.styleTags,
        parsed.stylesheetUrls
    );
    return extractColors(css.allDeclarations, css.cssVariables);
}

/**
 * Extract only typography from a URL
 */
export async function extractTypographyOnly(url: string): Promise<TypographySystem> {
    const fetchResult = await fetchPage(url);
    const parsed = parseHTML(fetchResult.html, fetchResult.finalUrl);
    const googleFontsUrl = extractGoogleFontsUrl(parsed.$);
    const css = await extractAllCSS(
        parsed.inlineStyles,
        parsed.styleTags,
        parsed.stylesheetUrls
    );
    return extractTypography(
        css.allDeclarations,
        css.rules,
        css.cssVariables,
        googleFontsUrl
    );
}
