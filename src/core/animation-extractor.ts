/**
 * Animation Extractor
 *
 * Extracts animation and transition information from CSS:
 * - Transition properties
 * - @keyframes definitions
 * - Animation properties
 */

import type { CSSDeclaration, CSSRule } from './css-extractor.js';

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
    /** Frequency of use */
    frequency: number;
}

export interface KeyframeStep {
    /** Percentage or from/to */
    offset: string;
    /** CSS declarations at this step */
    declarations: Record<string, string>;
}

export interface KeyframeAnimation {
    /** Animation name */
    name: string;
    /** Keyframe steps */
    steps: KeyframeStep[];
    /** Full CSS text */
    css: string;
}

export interface AnimationToken {
    /** Animation name */
    name: string;
    /** Duration */
    duration: string;
    /** Timing function */
    timingFunction: string;
    /** Delay */
    delay?: string;
    /** Iteration count */
    iterationCount?: string;
    /** Direction */
    direction?: string;
    /** Fill mode */
    fillMode?: string;
    /** Full CSS value */
    cssValue: string;
}

export interface AnimationSystem {
    /** Transition tokens */
    transitions: TransitionToken[];
    /** Keyframe animations */
    keyframes: KeyframeAnimation[];
    /** Animation usage */
    animations: AnimationToken[];
    /** Common timing functions */
    timingFunctions: string[];
    /** Common durations */
    durations: string[];
    /** CSS variables for animations */
    cssVariables: Record<string, string>;
}

/**
 * Extract animations and transitions from CSS
 */
export function extractAnimations(
    declarations: CSSDeclaration[],
    _rules: CSSRule[],
    cssContent: string,
    cssVariables: Record<string, string>
): AnimationSystem {
    const transitions = extractTransitions(declarations);
    const keyframes = extractKeyframes(cssContent);
    const animations = extractAnimationProperties(declarations);
    const timingFunctions = extractTimingFunctions(declarations);
    const durations = extractDurations(declarations);

    // Extract animation-related CSS variables
    const animCssVars: Record<string, string> = {};
    for (const [varName, value] of Object.entries(cssVariables)) {
        if (
            varName.includes('transition') ||
            varName.includes('animation') ||
            varName.includes('duration') ||
            varName.includes('timing') ||
            varName.includes('easing')
        ) {
            animCssVars[varName] = value;
        }
    }

    return {
        transitions: transitions.slice(0, 15),
        keyframes: keyframes.slice(0, 10),
        animations: animations.slice(0, 10),
        timingFunctions: [...new Set(timingFunctions)].slice(0, 10),
        durations: [...new Set(durations)].slice(0, 10),
        cssVariables: animCssVars,
    };
}

/**
 * Extract transition properties
 */
function extractTransitions(declarations: CSSDeclaration[]): TransitionToken[] {
    const transitionMap = new Map<string, TransitionToken>();

    for (const decl of declarations) {
        if (decl.property !== 'transition' && !decl.property.startsWith('transition-')) continue;

        if (decl.property === 'transition') {
            // Parse full transition shorthand
            const transitions = parseTransitionShorthand(decl.value);
            for (const t of transitions) {
                const key = normalizeTransition(t.cssValue);
                const existing = transitionMap.get(key);
                if (existing) {
                    existing.frequency++;
                } else {
                    transitionMap.set(key, t);
                }
            }
        }
    }

    return Array.from(transitionMap.values())
        .sort((a, b) => b.frequency - a.frequency);
}

/**
 * Parse transition shorthand value
 */
function parseTransitionShorthand(value: string): TransitionToken[] {
    const transitions: TransitionToken[] = [];

    // Split by comma for multiple transitions
    const parts = value.split(/,(?![^(]*\))/);

    for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed || trimmed === 'none') continue;

        const tokens = trimmed.split(/\s+/);

        let property = 'all';
        let duration = '0s';
        let timingFunction = 'ease';
        let delay: string | undefined;

        for (const token of tokens) {
            if (token.match(/^\d+(\.\d+)?(s|ms)$/)) {
                if (duration === '0s') {
                    duration = token;
                } else {
                    delay = token;
                }
            } else if (isTimingFunction(token)) {
                timingFunction = token;
            } else if (!token.match(/^\d/)) {
                property = token;
            }
        }

        transitions.push({
            property,
            duration,
            timingFunction,
            delay,
            cssValue: trimmed,
            frequency: 1,
        });
    }

    return transitions;
}

/**
 * Check if a value is a timing function
 */
function isTimingFunction(value: string): boolean {
    const timingFunctions = [
        'ease', 'ease-in', 'ease-out', 'ease-in-out',
        'linear', 'step-start', 'step-end',
    ];
    return timingFunctions.includes(value) || value.startsWith('cubic-bezier') || value.startsWith('steps');
}

/**
 * Extract @keyframes from CSS content
 */
function extractKeyframes(cssContent: string): KeyframeAnimation[] {
    const keyframes: KeyframeAnimation[] = [];

    // Match @keyframes rules
    const keyframePattern = /@keyframes\s+([a-zA-Z0-9_-]+)\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/gi;

    let match;
    while ((match = keyframePattern.exec(cssContent)) !== null) {
        const name = match[1];
        const content = match[2];

        const steps = parseKeyframeSteps(content);

        keyframes.push({
            name,
            steps,
            css: match[0],
        });
    }

    return keyframes;
}

/**
 * Parse keyframe steps from keyframe content
 */
function parseKeyframeSteps(content: string): KeyframeStep[] {
    const steps: KeyframeStep[] = [];

    // Match individual keyframe blocks
    const stepPattern = /(\d+%|from|to)\s*\{([^}]+)\}/gi;

    let match;
    while ((match = stepPattern.exec(content)) !== null) {
        const offset = match[1].toLowerCase();
        const declarations: Record<string, string> = {};

        // Parse declarations
        const declParts = match[2].split(';');
        for (const part of declParts) {
            const colonIndex = part.indexOf(':');
            if (colonIndex > 0) {
                const prop = part.substring(0, colonIndex).trim();
                const val = part.substring(colonIndex + 1).trim();
                if (prop && val) {
                    declarations[prop] = val;
                }
            }
        }

        steps.push({
            offset: offset === 'from' ? '0%' : offset === 'to' ? '100%' : offset,
            declarations,
        });
    }

    return steps.sort((a, b) => {
        const aNum = parseInt(a.offset);
        const bNum = parseInt(b.offset);
        return aNum - bNum;
    });
}

/**
 * Extract animation property usages
 */
function extractAnimationProperties(declarations: CSSDeclaration[]): AnimationToken[] {
    const animations: AnimationToken[] = [];

    for (const decl of declarations) {
        if (decl.property !== 'animation' && !decl.property.startsWith('animation-')) continue;

        if (decl.property === 'animation') {
            const parsed = parseAnimationShorthand(decl.value);
            if (parsed) {
                animations.push(parsed);
            }
        }
    }

    return animations;
}

/**
 * Parse animation shorthand value
 */
function parseAnimationShorthand(value: string): AnimationToken | null {
    if (!value || value === 'none') return null;

    const tokens = value.split(/\s+/);

    let name = '';
    let duration = '0s';
    let timingFunction = 'ease';
    let delay: string | undefined;
    let iterationCount: string | undefined;
    let direction: string | undefined;
    let fillMode: string | undefined;

    const directions = ['normal', 'reverse', 'alternate', 'alternate-reverse'];
    const fillModes = ['none', 'forwards', 'backwards', 'both'];

    for (const token of tokens) {
        if (token.match(/^\d+(\.\d+)?(s|ms)$/)) {
            if (duration === '0s') {
                duration = token;
            } else {
                delay = token;
            }
        } else if (isTimingFunction(token)) {
            timingFunction = token;
        } else if (token === 'infinite' || token.match(/^\d+$/)) {
            iterationCount = token;
        } else if (directions.includes(token)) {
            direction = token;
        } else if (fillModes.includes(token)) {
            fillMode = token;
        } else if (token !== 'running' && token !== 'paused') {
            name = token;
        }
    }

    if (!name) return null;

    return {
        name,
        duration,
        timingFunction,
        delay,
        iterationCount,
        direction,
        fillMode,
        cssValue: value,
    };
}

/**
 * Extract unique timing functions used
 */
function extractTimingFunctions(declarations: CSSDeclaration[]): string[] {
    const functions: string[] = [];

    for (const decl of declarations) {
        if (decl.property === 'transition-timing-function' || decl.property === 'animation-timing-function') {
            functions.push(decl.value);
        }

        // Also extract from shorthands
        if (decl.property === 'transition' || decl.property === 'animation') {
            const cubicMatch = decl.value.match(/cubic-bezier\([^)]+\)/g);
            if (cubicMatch) {
                functions.push(...cubicMatch);
            }
        }
    }

    return functions;
}

/**
 * Extract unique durations used
 */
function extractDurations(declarations: CSSDeclaration[]): string[] {
    const durations: string[] = [];

    for (const decl of declarations) {
        if (decl.property === 'transition-duration' || decl.property === 'animation-duration') {
            durations.push(decl.value);
        }

        // Extract from shorthands
        const durationMatch = decl.value.match(/\d+(\.\d+)?(s|ms)/g);
        if (durationMatch) {
            durations.push(...durationMatch);
        }
    }

    return durations;
}

/**
 * Normalize transition for deduplication
 */
function normalizeTransition(transition: string): string {
    return transition.toLowerCase().replace(/\s+/g, ' ').trim();
}
