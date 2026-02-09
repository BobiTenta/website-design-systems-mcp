/**
 * HTML Parser
 *
 * Cheerio-based HTML parser for extracting design-related elements
 * from web pages without requiring a browser environment.
 */

import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import { toAbsoluteUrl } from '../utils/url-utils.js';
import type { BrandIdentity } from '../types/index.js';

export interface ParsedHTML {
    /** Cheerio instance for further querying */
    $: CheerioAPI;
    /** Extracted inline styles */
    inlineStyles: string[];
    /** Content of <style> tags */
    styleTags: string[];
    /** URLs of linked stylesheets */
    stylesheetUrls: string[];
    /** Brand identity extracted from meta tags */
    brand: BrandIdentity;
}

/**
 * Parse HTML content and extract design-relevant information
 */
export function parseHTML(html: string, baseUrl: string): ParsedHTML {
    const $ = cheerio.load(html);

    // Extract inline styles from elements
    const inlineStyles: string[] = [];
    $('[style]').each((_, el) => {
        const style = $(el).attr('style');
        if (style) {
            inlineStyles.push(style);
        }
    });

    // Extract <style> tag contents
    const styleTags: string[] = [];
    $('style').each((_, el) => {
        const content = $(el).html();
        if (content) {
            styleTags.push(content);
        }
    });

    // Extract linked stylesheet URLs
    const stylesheetUrls: string[] = [];
    $('link[rel="stylesheet"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
            stylesheetUrls.push(toAbsoluteUrl(baseUrl, href));
        }
    });

    // Also check for alternate stylesheet formats
    $('link[type="text/css"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href && !stylesheetUrls.includes(toAbsoluteUrl(baseUrl, href))) {
            stylesheetUrls.push(toAbsoluteUrl(baseUrl, href));
        }
    });

    // Extract brand identity from meta tags
    const brand = extractBrandIdentity($, baseUrl);

    return {
        $,
        inlineStyles,
        styleTags,
        stylesheetUrls,
        brand,
    };
}

/**
 * Extract brand identity from HTML meta tags and other elements
 */
function extractBrandIdentity($: CheerioAPI, baseUrl: string): BrandIdentity {
    // Site name
    const siteName =
        $('meta[property="og:site_name"]').attr('content') ||
        $('meta[name="application-name"]').attr('content') ||
        $('title').first().text().split(/[|\-–—]/).pop()?.trim() ||
        $('title').first().text() ||
        '';

    // Tagline/description
    const tagline =
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') ||
        undefined;

    // Logo URL - try various selectors
    let logoUrl: string | undefined;

    // Check for explicit logo markup
    const logoSelectors = [
        'img[class*="logo"]',
        'img[id*="logo"]',
        'a[class*="logo"] img',
        'header img:first-child',
        'nav img:first-child',
        '.logo img',
        '#logo img',
        '[data-logo] img',
    ];

    for (const selector of logoSelectors) {
        const src = $(selector).first().attr('src');
        if (src) {
            logoUrl = toAbsoluteUrl(baseUrl, src);
            break;
        }
    }

    // Favicon URL
    const faviconUrl = (() => {
        const iconSelectors = [
            'link[rel="icon"]',
            'link[rel="shortcut icon"]',
            'link[rel="apple-touch-icon"]',
            'link[rel="apple-touch-icon-precomposed"]',
        ];

        for (const selector of iconSelectors) {
            const href = $(selector).first().attr('href');
            if (href) {
                return toAbsoluteUrl(baseUrl, href);
            }
        }

        // Default favicon path
        return toAbsoluteUrl(baseUrl, '/favicon.ico');
    })();

    // Open Graph image
    const ogImageUrl = (() => {
        const ogImage = $('meta[property="og:image"]').attr('content');
        if (ogImage) {
            return toAbsoluteUrl(baseUrl, ogImage);
        }
        return undefined;
    })();

    // Theme color
    const themeColor =
        $('meta[name="theme-color"]').attr('content') ||
        $('meta[name="msapplication-TileColor"]').attr('content') ||
        undefined;

    return {
        siteName: siteName.trim(),
        tagline,
        logoUrl,
        faviconUrl,
        ogImageUrl,
        themeColor,
    };
}

/**
 * Extract all text content for font analysis
 */
export function extractTextContent($: CheerioAPI): Map<string, string[]> {
    const textByElement = new Map<string, string[]>();

    // Headings
    for (let i = 1; i <= 6; i++) {
        const texts: string[] = [];
        $(`h${i}`).each((_, el) => {
            const text = $(el).text().trim();
            if (text) texts.push(text);
        });
        if (texts.length > 0) {
            textByElement.set(`h${i}`, texts);
        }
    }

    // Paragraphs
    const paragraphs: string[] = [];
    $('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text) paragraphs.push(text);
    });
    if (paragraphs.length > 0) {
        textByElement.set('p', paragraphs);
    }

    // Links
    const links: string[] = [];
    $('a').each((_, el) => {
        const text = $(el).text().trim();
        if (text) links.push(text);
    });
    if (links.length > 0) {
        textByElement.set('a', links);
    }

    // Buttons
    const buttons: string[] = [];
    $('button, [role="button"], input[type="submit"], input[type="button"]').each((_, el) => {
        const text = $(el).text().trim() || $(el).attr('value') || '';
        if (text) buttons.push(text);
    });
    if (buttons.length > 0) {
        textByElement.set('button', buttons);
    }

    return textByElement;
}

/**
 * Extract Google Fonts URL if present
 */
export function extractGoogleFontsUrl($: CheerioAPI): string | undefined {
    let googleFontsUrl: string | undefined;

    $('link[href*="fonts.googleapis.com"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
            googleFontsUrl = href;
        }
    });

    // Also check for @import in style tags
    $('style').each((_, el) => {
        const content = $(el).html() || '';
        const match = content.match(/@import\s+url\(['"]?(https:\/\/fonts\.googleapis\.com[^'")\s]+)/);
        if (match) {
            googleFontsUrl = match[1];
        }
    });

    return googleFontsUrl;
}
