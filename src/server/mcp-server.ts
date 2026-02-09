/**
 * MCP Server Implementation
 *
 * Model Context Protocol server that exposes design system extraction
 * as tools for AI assistants.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
    extractDesignSystem,
    validateUrl,
    extractColorsOnly,
    extractTypographyOnly,
} from '../core/design-system-extractor.js';
import { generateSkillMd } from '../generators/skill-generator.js';

/**
 * Create and configure the MCP server
 */
export function createMcpServer(): McpServer {
    const server = new McpServer({
        name: 'website-design-systems-mcp',
        version: '1.0.0',
    });

    // Tool: extract_design_system
    // Main tool that extracts complete design system and returns skill.md
    server.tool(
        'extract_design_system',
        'Extract complete design system from a website URL and generate a comprehensive skill.md file that any AI can use to recreate the exact same design',
        {
            url: z.string().url().describe('The website URL to extract design system from'),
        },
        async ({ url }) => {
            try {
                const designSystem = await extractDesignSystem(url);
                const skillMd = generateSkillMd(designSystem);

                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: skillMd,
                        },
                    ],
                };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Error extracting design system: ${message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // Tool: validate_url
    // Quick check if URL is accessible
    server.tool(
        'validate_url',
        'Check if a website URL is accessible before attempting to extract design system',
        {
            url: z.string().url().describe('The website URL to validate'),
        },
        async ({ url }) => {
            try {
                const result = await validateUrl(url);

                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: JSON.stringify({
                                accessible: false,
                                statusCode: 0,
                                error: message,
                            }),
                        },
                    ],
                };
            }
        }
    );

    // Tool: get_site_colors
    // Extract only color palette
    server.tool(
        'get_site_colors',
        'Extract only the color palette from a website URL',
        {
            url: z.string().url().describe('The website URL to extract colors from'),
        },
        async ({ url }) => {
            try {
                const colors = await extractColorsOnly(url);

                // Format as readable output
                const output = {
                    primary: colors.primary.map((c) => ({
                        hex: c.hex,
                        rgb: c.rgb,
                        usage: c.usage,
                        name: c.semanticName,
                    })),
                    secondary: colors.secondary.map((c) => ({
                        hex: c.hex,
                        rgb: c.rgb,
                        usage: c.usage,
                    })),
                    neutral: colors.neutral.map((c) => ({
                        hex: c.hex,
                        rgb: c.rgb,
                    })),
                    cssVariables: colors.cssVariables,
                    totalColors: colors.totalColors,
                };

                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: JSON.stringify(output, null, 2),
                        },
                    ],
                };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Error extracting colors: ${message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // Tool: get_site_typography
    // Extract only typography
    server.tool(
        'get_site_typography',
        'Extract only the typography system (fonts, sizes, weights) from a website URL',
        {
            url: z.string().url().describe('The website URL to extract typography from'),
        },
        async ({ url }) => {
            try {
                const typography = await extractTypographyOnly(url);

                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: JSON.stringify(typography, null, 2),
                        },
                    ],
                };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Error extracting typography: ${message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    return server;
}

/**
 * Start the MCP server with stdio transport
 */
export async function startServer(): Promise<void> {
    const server = createMcpServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
