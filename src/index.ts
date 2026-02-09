#!/usr/bin/env node
/**
 * Website Design Systems MCP
 *
 * Entry point for the MCP server.
 * Extracts complete design systems from any website URL.
 */

import { startServer } from './server/mcp-server.js';

// Start the MCP server
startServer().catch((error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
});
