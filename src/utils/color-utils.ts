/**
 * Color Utility Functions
 *
 * Provides color parsing, normalization, and conversion utilities.
 * Supports: hex, rgb, rgba, hsl, hsla, and named colors.
 */

import type { ColorValue, ColorUsage } from '../types/index.js';

/**
 * Named CSS colors mapping to hex values
 */
const NAMED_COLORS: Record<string, string> = {
    black: '#000000',
    white: '#ffffff',
    red: '#ff0000',
    green: '#008000',
    blue: '#0000ff',
    yellow: '#ffff00',
    cyan: '#00ffff',
    magenta: '#ff00ff',
    gray: '#808080',
    grey: '#808080',
    silver: '#c0c0c0',
    maroon: '#800000',
    olive: '#808000',
    lime: '#00ff00',
    aqua: '#00ffff',
    teal: '#008080',
    navy: '#000080',
    fuchsia: '#ff00ff',
    purple: '#800080',
    orange: '#ffa500',
    pink: '#ffc0cb',
    brown: '#a52a2a',
    coral: '#ff7f50',
    crimson: '#dc143c',
    gold: '#ffd700',
    indigo: '#4b0082',
    ivory: '#fffff0',
    khaki: '#f0e68c',
    lavender: '#e6e6fa',
    lightblue: '#add8e6',
    lightgray: '#d3d3d3',
    lightgreen: '#90ee90',
    lightyellow: '#ffffe0',
    beige: '#f5f5dc',
    transparent: 'transparent',
    currentcolor: 'currentColor',
    inherit: 'inherit',
};

/**
 * Regex patterns for color extraction
 */
const COLOR_PATTERNS = {
    hex6: /^#([0-9a-fA-F]{6})$/,
    hex3: /^#([0-9a-fA-F]{3})$/,
    hex8: /^#([0-9a-fA-F]{8})$/,
    hex4: /^#([0-9a-fA-F]{4})$/,
    rgb: /^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i,
    rgba: /^rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d.]+)\s*\)$/i,
    rgbModern:
        /^rgb\s*\(\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s*(?:\/\s*([\d.]+%?))?\s*\)$/i,
    hsl: /^hsl\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i,
    hsla: /^hsla\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*([\d.]+)\s*\)$/i,
};

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number; a?: number } | null {
    // Remove # prefix
    hex = hex.replace(/^#/, '');

    let r: number, g: number, b: number, a: number | undefined;

    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 4) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
        a = parseInt(hex[3] + hex[3], 16) / 255;
    } else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    } else if (hex.length === 8) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
        a = parseInt(hex.substring(6, 8), 16) / 255;
    } else {
        return null;
    }

    return a !== undefined ? { r, g, b, a } : { r, g, b };
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number, a?: number): string {
    const toHex = (n: number) =>
        Math.max(0, Math.min(255, Math.round(n)))
            .toString(16)
            .padStart(2, '0');

    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

    if (a !== undefined && a < 1) {
        return hex + toHex(Math.round(a * 255));
    }

    return hex;
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(
    h: number,
    s: number,
    l: number
): { r: number; g: number; b: number } {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0,
        g = 0,
        b = 0;

    if (h >= 0 && h < 60) {
        r = c;
        g = x;
        b = 0;
    } else if (h >= 60 && h < 120) {
        r = x;
        g = c;
        b = 0;
    } else if (h >= 120 && h < 180) {
        r = 0;
        g = c;
        b = x;
    } else if (h >= 180 && h < 240) {
        r = 0;
        g = x;
        b = c;
    } else if (h >= 240 && h < 300) {
        r = x;
        g = 0;
        b = c;
    } else if (h >= 300 && h < 360) {
        r = c;
        g = 0;
        b = x;
    }

    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255),
    };
}

/**
 * Parse any color format and normalize to hex + rgb
 */
export function parseColor(
    colorStr: string
): { hex: string; rgb: { r: number; g: number; b: number; a?: number } } | null {
    const trimmed = colorStr.trim().toLowerCase();

    // Check for named colors
    if (NAMED_COLORS[trimmed]) {
        if (trimmed === 'transparent' || trimmed === 'currentcolor' || trimmed === 'inherit') {
            return null; // Skip non-color values
        }
        const rgb = hexToRgb(NAMED_COLORS[trimmed]);
        return rgb ? { hex: NAMED_COLORS[trimmed], rgb } : null;
    }

    // Try hex formats
    for (const pattern of [
        COLOR_PATTERNS.hex6,
        COLOR_PATTERNS.hex3,
        COLOR_PATTERNS.hex8,
        COLOR_PATTERNS.hex4,
    ]) {
        if (pattern.test(trimmed)) {
            const rgb = hexToRgb(trimmed);
            if (rgb) {
                return { hex: rgbToHex(rgb.r, rgb.g, rgb.b, rgb.a), rgb };
            }
        }
    }

    // Try rgb/rgba formats
    let match = trimmed.match(COLOR_PATTERNS.rgb);
    if (match) {
        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);
        return { hex: rgbToHex(r, g, b), rgb: { r, g, b } };
    }

    match = trimmed.match(COLOR_PATTERNS.rgba);
    if (match) {
        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);
        const a = parseFloat(match[4]);
        return { hex: rgbToHex(r, g, b, a), rgb: { r, g, b, a } };
    }

    // Try modern rgb format (space-separated)
    match = trimmed.match(COLOR_PATTERNS.rgbModern);
    if (match) {
        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);
        const a = match[4] ? parseFloat(match[4].replace('%', '')) / (match[4].includes('%') ? 100 : 1) : undefined;
        return { hex: rgbToHex(r, g, b, a), rgb: a !== undefined ? { r, g, b, a } : { r, g, b } };
    }

    // Try hsl/hsla formats
    match = trimmed.match(COLOR_PATTERNS.hsl);
    if (match) {
        const h = parseInt(match[1], 10);
        const s = parseInt(match[2], 10);
        const l = parseInt(match[3], 10);
        const rgb = hslToRgb(h, s, l);
        return { hex: rgbToHex(rgb.r, rgb.g, rgb.b), rgb };
    }

    match = trimmed.match(COLOR_PATTERNS.hsla);
    if (match) {
        const h = parseInt(match[1], 10);
        const s = parseInt(match[2], 10);
        const l = parseInt(match[3], 10);
        const a = parseFloat(match[4]);
        const rgb = hslToRgb(h, s, l);
        return { hex: rgbToHex(rgb.r, rgb.g, rgb.b, a), rgb: { ...rgb, a } };
    }

    return null;
}

/**
 * Check if a color is a neutral (gray/white/black)
 */
export function isNeutralColor(rgb: { r: number; g: number; b: number }): boolean {
    const { r, g, b } = rgb;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;

    return saturation < 0.15; // Low saturation = neutral
}

/**
 * Calculate relative luminance for contrast calculations
 */
export function getLuminance(rgb: { r: number; g: number; b: number }): number {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(
    rgb1: { r: number; g: number; b: number },
    rgb2: { r: number; g: number; b: number }
): number {
    const l1 = getLuminance(rgb1);
    const l2 = getLuminance(rgb2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Create a ColorValue object from a parsed color
 */
export function createColorValue(
    original: string,
    usage: ColorUsage = 'unknown'
): ColorValue | null {
    const parsed = parseColor(original);
    if (!parsed) return null;

    return {
        original,
        hex: parsed.hex.toUpperCase(),
        rgb: parsed.rgb,
        usage: [usage],
        frequency: 1,
    };
}

/**
 * Extract colors from a CSS property value
 * Handles gradients, multiple backgrounds, etc.
 */
export function extractColorsFromValue(value: string): string[] {
    const colors: string[] = [];

    // Match hex colors
    const hexMatches = value.match(/#([0-9a-fA-F]{3,8})\b/g);
    if (hexMatches) colors.push(...hexMatches);

    // Match rgb/rgba
    const rgbMatches = value.match(/rgba?\s*\([^)]+\)/gi);
    if (rgbMatches) colors.push(...rgbMatches);

    // Match hsl/hsla
    const hslMatches = value.match(/hsla?\s*\([^)]+\)/gi);
    if (hslMatches) colors.push(...hslMatches);

    // Match named colors (simple ones)
    const words = value.split(/[\s,()]+/);
    for (const word of words) {
        const lower = word.toLowerCase();
        if (NAMED_COLORS[lower] && lower !== 'transparent' && lower !== 'inherit') {
            colors.push(word);
        }
    }

    return colors;
}
