#!/usr/bin/env node

const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const axios = require("axios");

const server = new McpServer({
    name: "onowl-web-search-server",
    version: "1.0.0",
});

server.registerTool("web_search", {
    title: "Web Search",
    description: "Search the web for text, images, fonts, styles, UI, UX, and layout references.",
    inputSchema: {
        query: z.string().describe("The search query"),
        type: z.enum(["text", "images", "fonts", "styles", "ui", "ux", "layout"]).optional().default("text")
    },
    outputSchema: { content: z.string() }
}, async (args) => {
    try {
        const typeAddon = args.type !== "text" ? `+${args.type}` : "";
        const response = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(args.query + typeAddon)}&format=json`);
        
        let results = [];
        if (response.data) {
            if (response.data.AbstractText) {
                results.push(`Summary: ${response.data.AbstractText}`);
            }
            if (response.data.AbstractURL) {
                results.push(`URL: ${response.data.AbstractURL}`);
            }
            if (args.type === 'images' && response.data.Image) {
                results.push(`Image URL: ${response.data.Image}`);
            }
            if (response.data.RelatedTopics && response.data.RelatedTopics.length > 0) {
                const topics = response.data.RelatedTopics.slice(0, 5).map(t => t.Text || t.Result).filter(Boolean);
                results.push(`Related Info: \n- ${topics.join('\n- ')}`);
            }
        }
        
        const text = results.length > 0 ? results.join('\n') : `No direct summary found for ${args.query}. It might require a broader index search.`;
        return {
            content: [{ type: "text", text }]
        };
    } catch (err) {
        return {
            content: [{ type: "text", text: `Search failed: ${err.message}` }]
        };
    }
});

async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Web Search MCP Server running on stdio");
}

runServer().catch(console.error);
