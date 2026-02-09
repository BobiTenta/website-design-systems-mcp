/**
 * HTTP Client with Anti-Blocking Features
 *
 * This module provides a robust HTTP client designed to fetch web pages
 * while avoiding common bot detection mechanisms. Features include:
 * - User-Agent rotation
 * - Browser-like headers
 * - Retry logic with exponential backoff
 * - Redirect following
 */

import type { FetchResult, UrlValidationResult } from '../types/index.js';

/**
 * Pool of modern browser User-Agent strings
 * Updated for 2024/2025 browser versions
 */
const USER_AGENTS = [
    // Chrome on macOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    // Chrome on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    // Firefox on macOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
    // Firefox on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    // Safari on macOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    // Edge on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    // Chrome on Linux
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    // Firefox on Linux
    'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
    // Chrome on Android (mobile)
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    // Safari on iOS
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
];

/**
 * Get a random User-Agent from the pool
 */
function getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Build browser-like headers for HTTP requests
 */
function buildHeaders(url: string, userAgent: string): Record<string, string> {
    const urlObj = new URL(url);

    return {
        'User-Agent': userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        Referer: `${urlObj.protocol}//${urlObj.host}/`,
    };
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate if a URL is accessible
 */
export async function validateUrl(url: string): Promise<UrlValidationResult> {
    try {
        const response = await fetch(url, {
            method: 'HEAD',
            headers: buildHeaders(url, getRandomUserAgent()),
            redirect: 'follow',
        });

        return {
            accessible: response.ok,
            statusCode: response.status,
            contentType: response.headers.get('content-type') || undefined,
        };
    } catch (error) {
        return {
            accessible: false,
            statusCode: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Fetch a web page with anti-blocking features
 *
 * @param url - The URL to fetch
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns FetchResult with HTML content and metadata
 */
export async function fetchPage(url: string, maxRetries = 3): Promise<FetchResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const userAgent = getRandomUserAgent();
            const headers = buildHeaders(url, userAgent);

            const response = await fetch(url, {
                method: 'GET',
                headers,
                redirect: 'follow',
            });

            const html = await response.text();

            // Convert headers to plain object
            const responseHeaders: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });

            return {
                statusCode: response.status,
                headers: responseHeaders,
                html,
                finalUrl: response.url,
            };
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');

            // Exponential backoff
            if (attempt < maxRetries - 1) {
                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                await sleep(delay);
            }
        }
    }

    throw lastError || new Error('Failed to fetch page');
}

/**
 * Fetch CSS content from a stylesheet URL
 */
export async function fetchStylesheet(url: string): Promise<string> {
    try {
        const userAgent = getRandomUserAgent();
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': userAgent,
                Accept: 'text/css,*/*;q=0.1',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            redirect: 'follow',
        });

        if (!response.ok) {
            return '';
        }

        return await response.text();
    } catch {
        // Silently fail for individual stylesheets
        return '';
    }
}

/**
 * Resolve a potentially relative URL against a base URL
 */
export function resolveUrl(base: string, relative: string): string {
    try {
        return new URL(relative, base).href;
    } catch {
        return relative;
    }
}
