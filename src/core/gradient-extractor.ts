/**
 * Gradient Extractor
 *
 * Extracts gradient values from CSS declarations including:
 * - linear-gradient
 * - radial-gradient
 * - conic-gradient
 */

import type { CSSDeclaration } from './css-extractor.js';

export interface GradientColorStop {
    color: string;
    position?: string;
}

export interface GradientValue {
    /** Original CSS gradient string */
    original: string;
    /** Type of gradient */
    type: 'linear' | 'radial' | 'conic';
    /** Direction/angle for linear gradients */
    direction?: string;
    /** Color stops */
    colorStops: GradientColorStop[];
    /** Usage context */
    usage: 'background' | 'overlay' | 'text' | 'border' | 'unknown';
    /** Frequency of use */
    frequency: number;
}

export interface GradientSystem {
    /** All unique gradients found */
    gradients: GradientValue[];
    /** CSS variables containing gradients */
    cssVariables: Record<string, string>;
    /** Total gradients found */
    totalGradients: number;
}

/**
 * Regex patterns for gradient detection
 */
const GRADIENT_PATTERNS = {
    linear: /linear-gradient\s*\([^)]+\)/gi,
    radial: /radial-gradient\s*\([^)]+\)/gi,
    conic: /conic-gradient\s*\([^)]+\)/gi,
};

/**
 * Properties that may contain gradients
 */
const GRADIENT_PROPERTIES = [
    'background',
    'background-image',
    'border-image',
    'border-image-source',
    'mask-image',
    '-webkit-mask-image',
];

/**
 * Extract gradients from CSS declarations
 */
export function extractGradients(
    declarations: CSSDeclaration[],
    cssVariables: Record<string, string>
): GradientSystem {
    const gradientMap = new Map<string, GradientValue>();

    // Extract from declarations
    for (const decl of declarations) {
        if (!GRADIENT_PROPERTIES.includes(decl.property.toLowerCase())) continue;

        const gradients = extractGradientsFromValue(decl.value);
        for (const gradient of gradients) {
            gradient.usage = inferGradientUsage(decl.property);

            const key = normalizeGradient(gradient.original);
            const existing = gradientMap.get(key);

            if (existing) {
                existing.frequency++;
            } else {
                gradientMap.set(key, gradient);
            }
        }
    }

    // Extract from CSS variables
    const gradientCssVars: Record<string, string> = {};
    for (const [varName, value] of Object.entries(cssVariables)) {
        if (containsGradient(value)) {
            gradientCssVars[varName] = value;

            const gradients = extractGradientsFromValue(value);
            for (const gradient of gradients) {
                const key = normalizeGradient(gradient.original);
                if (!gradientMap.has(key)) {
                    gradientMap.set(key, gradient);
                }
            }
        }
    }

    const allGradients = Array.from(gradientMap.values())
        .sort((a, b) => b.frequency - a.frequency);

    return {
        gradients: allGradients.slice(0, 20), // Limit to top 20
        cssVariables: gradientCssVars,
        totalGradients: allGradients.length,
    };
}

/**
 * Extract all gradients from a CSS value string
 */
function extractGradientsFromValue(value: string): GradientValue[] {
    const gradients: GradientValue[] = [];

    for (const [type, pattern] of Object.entries(GRADIENT_PATTERNS)) {
        const matches = value.match(pattern);
        if (matches) {
            for (const match of matches) {
                const parsed = parseGradient(match, type as 'linear' | 'radial' | 'conic');
                if (parsed) {
                    gradients.push(parsed);
                }
            }
        }
    }

    return gradients;
}

/**
 * Parse a gradient string into structured data
 */
function parseGradient(
    gradientStr: string,
    type: 'linear' | 'radial' | 'conic'
): GradientValue | null {
    try {
        // Extract content inside parentheses
        const match = gradientStr.match(/\((.+)\)/s);
        if (!match) return null;

        const content = match[1];
        const parts = splitGradientParts(content);

        let direction: string | undefined;
        const colorStops: GradientColorStop[] = [];

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i].trim();

            // Check if this is a direction/angle (for linear gradients)
            if (i === 0 && type === 'linear') {
                if (part.match(/^(to\s+|[-]?\d+(?:deg|rad|turn|grad))/i)) {
                    direction = part;
                    continue;
                }
            }

            // Parse as color stop
            const colorStop = parseColorStop(part);
            if (colorStop) {
                colorStops.push(colorStop);
            }
        }

        if (colorStops.length < 2) return null;

        return {
            original: gradientStr,
            type,
            direction,
            colorStops,
            usage: 'unknown',
            frequency: 1,
        };
    } catch {
        return null;
    }
}

/**
 * Split gradient content by commas, respecting nested parentheses
 */
function splitGradientParts(content: string): string[] {
    const parts: string[] = [];
    let current = '';
    let depth = 0;

    for (const char of content) {
        if (char === '(') depth++;
        if (char === ')') depth--;

        if (char === ',' && depth === 0) {
            parts.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    if (current.trim()) {
        parts.push(current.trim());
    }

    return parts;
}

/**
 * Parse a color stop (e.g., "#ff0000 50%" or "rgba(0,0,0,0.5)")
 */
function parseColorStop(value: string): GradientColorStop | null {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Match color with optional position
    // Color can be: hex, rgb(), rgba(), hsl(), hsla(), named color, var()
    const colorPattern = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|var\([^)]+\)|[a-zA-Z]+)/;
    const positionPattern = /(\d+(?:\.\d+)?%?)/;

    const colorMatch = trimmed.match(colorPattern);
    if (!colorMatch) return null;

    const color = colorMatch[1];

    // Find position after color
    const remaining = trimmed.slice(colorMatch.index! + colorMatch[0].length).trim();
    const posMatch = remaining.match(positionPattern);

    return {
        color,
        position: posMatch ? posMatch[1] : undefined,
    };
}

/**
 * Check if a value contains any gradient
 */
function containsGradient(value: string): boolean {
    return /gradient\s*\(/i.test(value);
}

/**
 * Normalize gradient for deduplication
 */
function normalizeGradient(gradient: string): string {
    return gradient.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Infer usage context from property name
 */
function inferGradientUsage(property: string): GradientValue['usage'] {
    const lower = property.toLowerCase();
    if (lower.includes('background')) return 'background';
    if (lower.includes('border')) return 'border';
    if (lower.includes('mask')) return 'overlay';
    return 'unknown';
}
