/**
 * Website Design Systems MCP - Type Definitions
 *
 * Comprehensive TypeScript interfaces for design system extraction.
 * These types represent the structured output of extracting design tokens
 * from any website, enabling AI systems to perfectly recreate the design.
 */

/**
 * Color value with multiple format representations
 */
export interface ColorValue {
    /** Original color string as found in CSS */
    original: string;
    /** Normalized HEX format (#RRGGBB or #RRGGBBAA) */
    hex: string;
    /** RGB format */
    rgb: { r: number; g: number; b: number; a?: number };
    /** Context where this color is used */
    usage: ColorUsage[];
    /** Semantic name if detected (e.g., "primary", "danger") */
    semanticName?: string;
    /** Number of times this color appears */
    frequency: number;
}

export type ColorUsage =
    | 'background'
    | 'text'
    | 'border'
    | 'accent'
    | 'shadow'
    | 'gradient'
    | 'link'
    | 'button'
    | 'unknown';

/**
 * Complete color palette extracted from a website
 */
export interface ColorPalette {
    /** Primary brand colors (most frequently used) */
    primary: ColorValue[];
    /** Secondary/accent colors */
    secondary: ColorValue[];
    /** Neutral colors (grays, whites, blacks) */
    neutral: ColorValue[];
    /** All CSS custom properties for colors */
    cssVariables: Record<string, string>;
    /** Total unique colors found */
    totalColors: number;
}

/**
 * Font family definition
 */
export interface FontFamily {
    /** Primary font name */
    name: string;
    /** Fallback fonts */
    fallbacks: string[];
    /** Full font-family CSS value */
    cssValue: string;
    /** Type of font */
    type: 'sans-serif' | 'serif' | 'monospace' | 'display' | 'handwriting' | 'unknown';
    /** Source (Google Fonts, system, custom) */
    source: 'google-fonts' | 'adobe-fonts' | 'system' | 'custom';
    /** Google Fonts URL if applicable */
    googleFontsUrl?: string;
}

/**
 * Typography scale entry
 */
export interface TypeScaleEntry {
    /** Element or class name */
    element: string;
    /** Font size in pixels */
    fontSize: number;
    /** Font size as CSS value */
    fontSizeCSS: string;
    /** Font weight */
    fontWeight: number | string;
    /** Line height */
    lineHeight: number | string;
    /** Letter spacing */
    letterSpacing?: string;
    /** Text transform */
    textTransform?: string;
}

/**
 * Complete typography system
 */
export interface TypographySystem {
    /** Font families used */
    fonts: FontFamily[];
    /** Type scale (heading, body, etc.) */
    scale: TypeScaleEntry[];
    /** Base font size */
    baseFontSize: number;
    /** CSS variables for typography */
    cssVariables: Record<string, string>;
}

/**
 * Spacing token
 */
export interface SpacingToken {
    /** Token name (xs, sm, md, lg, xl, etc.) */
    name: string;
    /** Value in pixels */
    valuePixels: number;
    /** Original CSS value */
    cssValue: string;
    /** Common usage context */
    usage: string[];
}

/**
 * Complete spacing system
 */
export interface SpacingSystem {
    /** Spacing tokens in order */
    tokens: SpacingToken[];
    /** Base unit (if detected) */
    baseUnit?: number;
    /** CSS variables for spacing */
    cssVariables: Record<string, string>;
}

/**
 * Border radius tokens
 */
export interface BorderRadiusSystem {
    tokens: {
        name: string;
        value: string;
        valuePixels: number;
    }[];
    cssVariables: Record<string, string>;
}

/**
 * Shadow tokens
 */
export interface ShadowSystem {
    tokens: {
        name: string;
        value: string;
    }[];
    cssVariables: Record<string, string>;
}

/**
 * Responsive breakpoint
 */
export interface Breakpoint {
    name: string;
    minWidth?: number;
    maxWidth?: number;
    cssValue: string;
}

/**
 * Layout system
 */
export interface LayoutSystem {
    /** Container max-width */
    containerWidth?: number;
    /** Responsive breakpoints */
    breakpoints: Breakpoint[];
    /** Grid system (if detected) */
    grid?: {
        columns: number;
        gap: string;
    };
}

/**
 * Brand identity information
 */
export interface BrandIdentity {
    /** Site title */
    siteName: string;
    /** Meta description or tagline */
    tagline?: string;
    /** Logo URL */
    logoUrl?: string;
    /** Favicon URL */
    faviconUrl?: string;
    /** Open Graph image */
    ogImageUrl?: string;
    /** Theme color from meta tag */
    themeColor?: string;
}

/**
 * Gradient color stop
 */
export interface GradientColorStop {
    color: string;
    position?: string;
}

/**
 * Gradient value
 */
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

/**
 * Gradient system
 */
export interface GradientSystem {
    /** All unique gradients found */
    gradients: GradientValue[];
    /** CSS variables containing gradients */
    cssVariables: Record<string, string>;
    /** Total gradients found */
    totalGradients: number;
}

/**
 * Transition token
 */
export interface TransitionToken {
    /** Properties being transitioned */
    property: string;
    /** Duration */
    duration: string;
    /** Timing function */
    timingFunction: string;
    /** Delay if any */
    delay?: string;
    /** Full CSS value */
    cssValue: string;
}

/**
 * Keyframe animation step
 */
export interface KeyframeStep {
    /** Percentage or from/to */
    offset: string;
    /** CSS declarations at this step */
    declarations: Record<string, string>;
}

/**
 * Keyframe animation definition
 */
export interface KeyframeAnimation {
    /** Animation name */
    name: string;
    /** Keyframe steps */
    steps: KeyframeStep[];
    /** Full CSS text */
    css: string;
}

/**
 * Animation system
 */
export interface AnimationSystem {
    /** Transition tokens */
    transitions: TransitionToken[];
    /** Keyframe animations */
    keyframes: KeyframeAnimation[];
    /** Common timing functions */
    timingFunctions: string[];
    /** Common durations */
    durations: string[];
    /** CSS variables for animations */
    cssVariables: Record<string, string>;
}

/**
 * Detected component pattern
 */
export interface ComponentPattern {
    /** Component name */
    name: string;
    /** Component type */
    type: 'button' | 'card' | 'input' | 'nav' | 'footer' | 'hero' | 'custom';
    /** CSS rules for this component */
    css: string;
    /** Description */
    description?: string;
}

/**
 * Complete design system extracted from a website
 */
export interface DesignSystem {
    /** Source URL */
    sourceUrl: string;
    /** Extraction timestamp */
    extractedAt: string;
    /** Brand identity */
    brand: BrandIdentity;
    /** Color palette */
    colors: ColorPalette;
    /** Typography system */
    typography: TypographySystem;
    /** Spacing system */
    spacing: SpacingSystem;
    /** Border radius tokens */
    borderRadius: BorderRadiusSystem;
    /** Shadow tokens */
    shadows: ShadowSystem;
    /** Gradient system */
    gradients: GradientSystem;
    /** Animation system */
    animations: AnimationSystem;
    /** Layout system */
    layout: LayoutSystem;
    /** Component patterns */
    components: ComponentPattern[];
    /** Raw CSS variables found */
    allCssVariables: Record<string, string>;
    /** Extraction metadata */
    metadata: {
        /** HTTP status code */
        statusCode: number;
        /** Total stylesheets processed */
        stylesheetsProcessed: number;
        /** Total CSS rules analyzed */
        cssRulesAnalyzed: number;
        /** Extraction duration in ms */
        extractionTimeMs: number;
    };
}

/**
 * URL validation result
 */
export interface UrlValidationResult {
    /** Whether URL is accessible */
    accessible: boolean;
    /** HTTP status code */
    statusCode: number;
    /** Content type */
    contentType?: string;
    /** Error message if not accessible */
    error?: string;
}

/**
 * HTTP response from fetching a page
 */
export interface FetchResult {
    /** HTTP status code */
    statusCode: number;
    /** Response headers */
    headers: Record<string, string>;
    /** HTML body content */
    html: string;
    /** Final URL after redirects */
    finalUrl: string;
}
