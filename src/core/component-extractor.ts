/**
 * Component Pattern Extractor
 *
 * Detects and extracts CSS for common UI component patterns:
 * - Buttons
 * - Cards
 * - Navigation
 * - Inputs/Forms
 * - Hero sections
 */

import type { CSSRule, CSSDeclaration } from './css-extractor.js';
import type { ComponentPattern } from '../types/index.js';

/**
 * Component detection patterns
 */
interface ComponentDetector {
    type: ComponentPattern['type'];
    patterns: RegExp[];
    description: string;
}

const COMPONENT_DETECTORS: ComponentDetector[] = [
    {
        type: 'button',
        patterns: [
            /^\.btn(?:--|-|_)?/i,
            /^\.button(?:--|-|_)?/i,
            /^button$/i,
            /\[type=['"](submit|button)['"]\]/i,
            /\.cta(?:--|-|_)?/i,
            /\.action(?:--|-|_)?/i,
        ],
        description: 'Button component for user actions',
    },
    {
        type: 'card',
        patterns: [
            /^\.card(?:--|-|_)?/i,
            /\.card-/i,
            /\.tile(?:--|-|_)?/i,
            /\.panel(?:--|-|_)?/i,
            /\.box(?:--|-|_)?/i,
        ],
        description: 'Card component for grouped content',
    },
    {
        type: 'nav',
        patterns: [
            /^nav$/i,
            /^\.nav(?:--|-|_)?/i,
            /^\.navbar/i,
            /^header$/i,
            /^\.header(?:--|-|_)?/i,
            /\.navigation/i,
            /\.menu(?:--|-|_)?/i,
            /\.topbar/i,
        ],
        description: 'Navigation component',
    },
    {
        type: 'input',
        patterns: [
            /^input$/i,
            /^textarea$/i,
            /^select$/i,
            /^\.input(?:--|-|_)?/i,
            /^\.form-(?:control|input|field)/i,
            /\.text-field/i,
            /\.search(?:--|-|_)?/i,
        ],
        description: 'Form input component',
    },
    {
        type: 'hero',
        patterns: [
            /^\.hero(?:--|-|_)?/i,
            /\.banner(?:--|-|_)?/i,
            /\.jumbotron/i,
            /\.masthead/i,
            /\.splash/i,
        ],
        description: 'Hero/banner section',
    },
    {
        type: 'footer',
        patterns: [
            /^footer$/i,
            /^\.footer(?:--|-|_)?/i,
            /\.site-footer/i,
        ],
        description: 'Footer component',
    },
];

/**
 * Important CSS properties for component styling
 */
const IMPORTANT_PROPERTIES = [
    'display',
    'position',
    'background',
    'background-color',
    'color',
    'border',
    'border-radius',
    'padding',
    'margin',
    'font-family',
    'font-size',
    'font-weight',
    'line-height',
    'text-decoration',
    'text-transform',
    'box-shadow',
    'transition',
    'cursor',
    'opacity',
    'gap',
    'flex',
    'flex-direction',
    'align-items',
    'justify-content',
    'width',
    'height',
    'min-width',
    'min-height',
    'max-width',
];

/**
 * State pseudo-classes to look for
 */
const STATE_PSEUDOS = [':hover', ':focus', ':active', ':disabled', ':visited', ':focus-visible'];

export interface ExtractedComponent {
    name: string;
    type: ComponentPattern['type'];
    selectors: string[];
    baseCSS: string;
    states: Record<string, string>;
    description: string;
    frequency: number;
}

/**
 * Extract component patterns from CSS rules
 */
export function extractComponents(rules: CSSRule[]): ComponentPattern[] {
    const componentMap = new Map<string, ExtractedComponent>();

    for (const rule of rules) {
        for (const selector of rule.selectors) {
            const detected = detectComponentType(selector);
            if (!detected) continue;

            const { type, baseSelector, state } = detected;
            const key = `${type}:${baseSelector}`;

            let component = componentMap.get(key);
            if (!component) {
                component = {
                    name: generateComponentName(baseSelector, type),
                    type,
                    selectors: [baseSelector],
                    baseCSS: '',
                    states: {},
                    description: getComponentDescription(type),
                    frequency: 0,
                };
                componentMap.set(key, component);
            }

            // Add selector if not already present
            if (!component.selectors.includes(selector) && !state) {
                component.selectors.push(selector);
            }

            // Build CSS string from declarations
            const cssString = buildCSSString(rule.declarations);

            if (state) {
                // This is a state variant
                component.states[state] = cssString;
            } else {
                // This is base style
                if (!component.baseCSS) {
                    component.baseCSS = cssString;
                }
            }

            component.frequency++;
        }
    }

    // Convert to ComponentPattern format and sort by frequency
    const patterns: ComponentPattern[] = Array.from(componentMap.values())
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 20) // Limit to top 20 components
        .map(comp => ({
            name: comp.name,
            type: comp.type,
            css: formatComponentCSS(comp),
            description: comp.description,
        }));

    return patterns;
}

/**
 * Detect if a selector matches a component pattern
 */
function detectComponentType(selector: string): {
    type: ComponentPattern['type'];
    baseSelector: string;
    state: string | null;
} | null {
    // Check for state pseudo-classes
    let state: string | null = null;
    let baseSelector = selector;

    for (const pseudo of STATE_PSEUDOS) {
        if (selector.includes(pseudo)) {
            state = pseudo.replace(':', '');
            baseSelector = selector.replace(pseudo, '').trim();
            break;
        }
    }

    // Match against component patterns
    for (const detector of COMPONENT_DETECTORS) {
        for (const pattern of detector.patterns) {
            if (pattern.test(baseSelector)) {
                return {
                    type: detector.type,
                    baseSelector,
                    state,
                };
            }
        }
    }

    return null;
}

/**
 * Generate a human-readable component name
 */
function generateComponentName(selector: string, type: string): string {
    // Extract class name without dots
    let name = selector.replace(/^\./, '').replace(/[_-]+/g, ' ');

    // Capitalize words
    name = name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    // If name is just the type, add "Primary" prefix
    if (name.toLowerCase() === type.toLowerCase()) {
        name = `Primary ${name}`;
    }

    return name;
}

/**
 * Get description for component type
 */
function getComponentDescription(type: ComponentPattern['type']): string {
    const descriptions: Record<string, string> = {
        button: 'Interactive button for user actions',
        card: 'Container for grouped content',
        nav: 'Navigation and menu component',
        input: 'Form input field',
        hero: 'Large banner or hero section',
        footer: 'Site footer component',
        custom: 'Custom component',
    };
    return descriptions[type] || 'UI component';
}

/**
 * Build CSS string from declarations
 */
function buildCSSString(declarations: CSSDeclaration[]): string {
    const importantDecls = declarations.filter(decl =>
        IMPORTANT_PROPERTIES.includes(decl.property.toLowerCase())
    );

    return importantDecls
        .map(decl => `${decl.property}: ${decl.value}`)
        .join('; ');
}

/**
 * Format component into complete CSS block
 */
function formatComponentCSS(component: ExtractedComponent): string {
    const lines: string[] = [];

    // Base styles
    lines.push(`/* ${component.name} */`);
    lines.push(`${component.selectors[0]} {`);
    lines.push(`  ${component.baseCSS.replace(/; /g, ';\n  ')};`);
    lines.push(`}`);

    // State styles
    for (const [state, css] of Object.entries(component.states)) {
        if (css) {
            lines.push(`${component.selectors[0]}:${state} {`);
            lines.push(`  ${css.replace(/; /g, ';\n  ')};`);
            lines.push(`}`);
        }
    }

    return lines.join('\n');
}
