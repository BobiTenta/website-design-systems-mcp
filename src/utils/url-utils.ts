/**
 * URL Utility Functions
 *
 * Provides URL validation, parsing, and normalization utilities.
 */

/**
 * Validate if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Normalize a URL (remove trailing slashes, lowercase protocol/host)
 */
export function normalizeUrl(url: string): string {
    try {
        const parsed = new URL(url);
        // Remove trailing slash from pathname (except for root)
        let pathname = parsed.pathname;
        if (pathname.length > 1 && pathname.endsWith('/')) {
            pathname = pathname.slice(0, -1);
        }
        return `${parsed.protocol}//${parsed.host}${pathname}${parsed.search}`;
    } catch {
        return url;
    }
}

/**
 * Extract the domain from a URL
 */
export function getDomain(url: string): string {
    try {
        return new URL(url).hostname;
    } catch {
        return '';
    }
}

/**
 * Get the base URL (protocol + host)
 */
export function getBaseUrl(url: string): string {
    try {
        const parsed = new URL(url);
        return `${parsed.protocol}//${parsed.host}`;
    } catch {
        return '';
    }
}

/**
 * Check if a URL is absolute
 */
export function isAbsoluteUrl(url: string): boolean {
    return /^https?:\/\//i.test(url);
}

/**
 * Convert a relative URL to absolute
 */
export function toAbsoluteUrl(baseUrl: string, relativeUrl: string): string {
    if (isAbsoluteUrl(relativeUrl)) {
        return relativeUrl;
    }

    try {
        return new URL(relativeUrl, baseUrl).href;
    } catch {
        return relativeUrl;
    }
}
