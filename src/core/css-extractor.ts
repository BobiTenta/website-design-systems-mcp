/**
 * CSS Extractor
 *
 * Extracts and parses CSS from various sources:
 * - Inline styles
 * - <style> tags
 * - External stylesheets
 *
 * Also extracts CSS custom properties (variables).
 */

import css from 'css';
import { fetchStylesheet } from './http-client.js';

export interface CSSDeclaration {
    property: string;
    value: string;
}

export interface CSSRule {
    selectors: string[];
    declarations: CSSDeclaration[];
}

export interface ExtractedCSS {
    /** All CSS rules */
    rules: CSSRule[];
    /** CSS custom properties (variables) */
    cssVariables: Record<string, string>;
    /** Media queries found */
    mediaQueries: string[];
    /** All unique property-value pairs */
    allDeclarations: CSSDeclaration[];
}

/**
 * Parse CSS content and extract rules
 */
function parseCSSContent(cssContent: string): {
    rules: CSSRule[];
    cssVariables: Record<string, string>;
    mediaQueries: string[];
} {
    const rules: CSSRule[] = [];
    const cssVariables: Record<string, string> = {};
    const mediaQueries: string[] = [];

    try {
        const parsed = css.parse(cssContent, { silent: true });

        if (parsed.stylesheet) {
            processRules(parsed.stylesheet.rules, rules, cssVariables, mediaQueries);
        }
    } catch {
        // Silently handle malformed CSS
    }

    return { rules, cssVariables, mediaQueries };
}

/**
 * Process CSS rules recursively (handles @media, @supports, etc.)
 */
function processRules(
    astRules: css.Rule[] | undefined,
    rules: CSSRule[],
    cssVariables: Record<string, string>,
    mediaQueries: string[]
): void {
    if (!astRules) return;

    for (const rule of astRules) {
        if (rule.type === 'rule' && 'selectors' in rule && 'declarations' in rule) {
            const declarations: CSSDeclaration[] = [];

            for (const decl of rule.declarations || []) {
                if (decl.type === 'declaration' && 'property' in decl && 'value' in decl) {
                    const property = decl.property as string;
                    const value = decl.value as string;

                    declarations.push({ property, value });

                    // Extract CSS variables from :root or html
                    if (
                        property.startsWith('--') &&
                        rule.selectors?.some((s: string) => s === ':root' || s === 'html' || s === 'body')
                    ) {
                        cssVariables[property] = value;
                    }
                }
            }

            if (declarations.length > 0) {
                rules.push({
                    selectors: rule.selectors || [],
                    declarations,
                });
            }
        } else if (rule.type === 'media' && 'media' in rule) {
            const mediaQuery = rule.media as string;
            if (mediaQuery && !mediaQueries.includes(mediaQuery)) {
                mediaQueries.push(mediaQuery);
            }
            // Process nested rules
            if ('rules' in rule) {
                processRules(rule.rules as css.Rule[], rules, cssVariables, mediaQueries);
            }
        } else if (rule.type === 'supports' || rule.type === 'document') {
            // Process nested rules in @supports or @-moz-document
            if ('rules' in rule) {
                processRules(rule.rules as css.Rule[], rules, cssVariables, mediaQueries);
            }
        }
    }
}

/**
 * Parse inline style attribute value
 */
function parseInlineStyle(styleAttr: string): CSSDeclaration[] {
    const declarations: CSSDeclaration[] = [];
    const parts = styleAttr.split(';');

    for (const part of parts) {
        const colonIndex = part.indexOf(':');
        if (colonIndex > 0) {
            const property = part.substring(0, colonIndex).trim().toLowerCase();
            const value = part.substring(colonIndex + 1).trim();
            if (property && value) {
                declarations.push({ property, value });
            }
        }
    }

    return declarations;
}

/**
 * Extract all CSS from multiple sources
 */
export async function extractAllCSS(
    inlineStyles: string[],
    styleTags: string[],
    stylesheetUrls: string[]
): Promise<ExtractedCSS> {
    const allRules: CSSRule[] = [];
    const allCssVariables: Record<string, string> = {};
    const allMediaQueries: string[] = [];
    const allDeclarations: CSSDeclaration[] = [];

    // Process inline styles
    for (const style of inlineStyles) {
        const declarations = parseInlineStyle(style);
        allDeclarations.push(...declarations);

        // Create a pseudo-rule for inline styles
        if (declarations.length > 0) {
            allRules.push({
                selectors: ['[inline-style]'],
                declarations,
            });
        }
    }

    // Process <style> tags
    for (const styleContent of styleTags) {
        const { rules, cssVariables, mediaQueries } = parseCSSContent(styleContent);
        allRules.push(...rules);
        Object.assign(allCssVariables, cssVariables);

        for (const mq of mediaQueries) {
            if (!allMediaQueries.includes(mq)) {
                allMediaQueries.push(mq);
            }
        }

        // Collect declarations
        for (const rule of rules) {
            allDeclarations.push(...rule.declarations);
        }
    }

    // Fetch and process external stylesheets (with concurrency limit)
    const stylesheetContents = await Promise.all(
        stylesheetUrls.slice(0, 10).map((url) => fetchStylesheet(url))
    );

    for (const content of stylesheetContents) {
        if (content) {
            const { rules, cssVariables, mediaQueries } = parseCSSContent(content);
            allRules.push(...rules);
            Object.assign(allCssVariables, cssVariables);

            for (const mq of mediaQueries) {
                if (!allMediaQueries.includes(mq)) {
                    allMediaQueries.push(mq);
                }
            }

            // Collect declarations
            for (const rule of rules) {
                allDeclarations.push(...rule.declarations);
            }
        }
    }

    return {
        rules: allRules,
        cssVariables: allCssVariables,
        mediaQueries: allMediaQueries,
        allDeclarations,
    };
}

/**
 * Extract values for a specific CSS property across all rules
 */
export function getPropertyValues(
    declarations: CSSDeclaration[],
    property: string
): string[] {
    const values: string[] = [];
    const normalizedProp = property.toLowerCase();

    for (const decl of declarations) {
        if (decl.property.toLowerCase() === normalizedProp) {
            if (!values.includes(decl.value)) {
                values.push(decl.value);
            }
        }
    }

    return values;
}

/**
 * Get all values for multiple related properties
 */
export function getRelatedPropertyValues(
    declarations: CSSDeclaration[],
    propertyPatterns: string[]
): Map<string, string[]> {
    const result = new Map<string, string[]>();

    for (const pattern of propertyPatterns) {
        const values: string[] = [];

        for (const decl of declarations) {
            if (decl.property.includes(pattern) || decl.property === pattern) {
                if (!values.includes(decl.value)) {
                    values.push(decl.value);
                }
            }
        }

        if (values.length > 0) {
            result.set(pattern, values);
        }
    }

    return result;
}
