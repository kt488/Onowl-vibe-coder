const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const path = require('path');

let client = null;
let transport = null;

async function initMcpSearchClient() {
    if (client) return client;

    try {
        transport = new StdioClientTransport({
            command: "node",
            args: [path.join(__dirname, "mcpWebSearchServer.js")]
        });

        client = new Client(
            {
                name: "onowl-search-client",
                version: "1.0.0"
            },
            {
                capabilities: {}
            }
        );

        await client.connect(transport);
        console.log("✅ [MCP] Web Search Server connected successfully.");
        return client;
    } catch (err) {
        console.error("❌ [MCP] Failed to connect to Web Search Server:", err.message);
        return null;
    }
}

async function callSearchTool(args) {
    const mcp = await initMcpSearchClient();
    if (!mcp) throw new Error("MCP Search Client not initialized");
    
    try {
        return await mcp.callTool({
            name: "web_search",
            arguments: args
        });
    } catch (err) {
        console.error(`[MCP Search Tool Error]:`, err.message);
        throw err;
    }
}

const mcpSearch = {
    search: async (query, type = "text") => {
        const result = await callSearchTool({ query, type });
        if (result && result.content && result.content.length > 0) {
            return result.content[0].text;
        }
        return "No result content returned.";
    }
};

module.exports = {
    initMcpSearchClient,
    mcpSearch
};
