const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const path = require('path');

// Resolve the absolute path for shared storage in Termux
const SHARED_ROOT = path.join(__dirname, '../../ai-workspace');

let client = null;
let transport = null;

/**
 * Initializes the MCP Filesystem Client by spawning the server.
 */
async function initMcpClient() {
    if (client) return client;

    try {
        transport = new StdioClientTransport({
            command: "/data/data/com.termux/files/usr/bin/mcp-server-filesystem",
            args: [SHARED_ROOT]
        });

        client = new Client(
            {
                name: "onowl-mcp-client",
                version: "1.0.0"
            },
            {
                capabilities: {}
            }
        );

        await client.connect(transport);
        console.log("✅ [MCP] Filesystem Server connected successfully at:", SHARED_ROOT);
        return client;
    } catch (err) {
        console.error("❌ [MCP] Failed to connect to Filesystem Server:", err.message);
        return null;
    }
}

/**
 * Wrapper to call an MCP tool.
 */
async function callTool(name, args) {
    const mcp = await initMcpClient();
    if (!mcp) throw new Error("MCP Client not initialized");
    
    try {
        return await mcp.callTool({
            name,
            arguments: args
        });
    } catch (err) {
        console.error(`[MCP Tool Error] ${name}:`, err.message);
        throw err;
    }
}

/**
 * High-level helpers for the AI to use.
 */
const mcpFs = {
    createFolder: async (folderPath) => {
        const absolutePath = path.isAbsolute(folderPath) ? folderPath : path.join(SHARED_ROOT, folderPath);
        return await callTool("create_directory", { path: absolutePath });
    },
    createFile: async (filePath, content) => {
        const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(SHARED_ROOT, filePath);
        const dir = path.dirname(absolutePath);
        
        try {
            await callTool("create_directory", { path: dir });
        } catch (err) {
            // Ignore if directory already exists
        }

        return await callTool("write_file", { path: absolutePath, content });
    },
    updateFile: async (filePath, content) => {
        return await mcpFs.createFile(filePath, content);
    }
};

module.exports = {
    initMcpClient,
    mcpFs,
    SHARED_ROOT
};
