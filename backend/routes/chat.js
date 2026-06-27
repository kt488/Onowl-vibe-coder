const express = require('express');
const Joi = require('joi');
const { chatRateLimiter } = require('../middleware/rateLimiter');
const { incrementTotal, incrementSuccess, incrementFailure } = require('../utils/statsStore');
const mcpFsClient = require('../utils/mcpFileSystemClient');
const { mcpSearch, initMcpSearchClient } = require('../utils/mcpWebSearchClient');
const { executeCommand } = require('../utils/commandRunner');
const { checkSubscription } = require('../middleware/subscription');
const { supabase } = require('../utils/supabase');

const router = express.Router();

const chatSchema = Joi.object({
    messages: Joi.array().items(
        Joi.object({
            role: Joi.string().valid('system', 'user', 'assistant').required(),
            content: Joi.any().required()
        })
    ).min(1).required(),
    temperature: Joi.number().min(0).max(2).optional().default(0.7),
    max_tokens: Joi.number().min(1).max(8192).optional().default(8192),
    image: Joi.string().allow(null, '').optional()
});

router.post('/', chatRateLimiter, async (req, res) => {
    const startTime = Date.now();
    incrementTotal();

    try {
        const { error, value } = chatSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, error: error.details[0].message });
        }

        let { messages, temperature, max_tokens, image } = value;
        const userQuery = messages[messages.length - 1].content;

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Initialize MCP clients for AI tool usage
        let mcpFs = null;
        let mcpSearchClient = null;

        try {
            const controller = new AbortController();
            const timeout = (ms) => new Promise((_, reject) => setTimeout(() => {
                controller.abort();
                reject(new Error("Init Timeout"));
            }, ms));

            const initStartTime = Date.now();
            const initPromise = Promise.all([
                mcpFsClient.initMcpClient().then(c => { mcpFs = c; return c; }),
                initMcpSearchClient().then(c => { mcpSearchClient = c; return c; })
            ]);

            const initResults = await Promise.race([
                initPromise,
                timeout(6000)
            ]).catch(err => {
                try {
                    if (mcpFs) mcpFs.close();
                    if (mcpSearchClient) mcpSearchClient.close();
                } catch (cleanupErr) {
                    console.error("[Cleanup Error]:", cleanupErr.message);
                }
                console.warn("[Init Warning]:", err.message);
                return [null, null];
            });

            const duration = Date.now() - initStartTime;
            console.log(`[Init] MCP took ${duration}ms`);
        } catch (err) {
            console.error("[Init Error]:", err.message);
        }

        // Build system message
        const systemMessage = {
            role: 'system',
            content: `You are Friday, an expert AI programming assistant operating directly inside the user's IDE.

CRITICAL INSTRUCTIONS FOR FILE OPERATIONS:

1. CREATING OR OVERWRITING FILES:
To create a new file or completely overwrite an existing one, use the exact format below. The frontend automatically parses this and creates any necessary folders.

### FILE: path/to/filename.ext
\`\`\`language
// Full file content goes here
\`\`\`

2. SURGICAL EDITS (PATCHING):
Do NOT overwrite entire files if you only need to change a small part. Use the UPDATE format. Provide the EXACT existing code to be replaced and the new code.

### UPDATE: path/to/filename.ext
<<<<
// EXACT old code to find and replace. Must match character-for-character including indentation.
====
// NEW code to insert in its place.
>>>>

3. NO TRUNCATION ALLOWED:
Write the FULL, complete code for any block you generate. NEVER use placeholders like "// ... rest of code" or "// unchanged code". If you use the FILE command, write the entire file top-to-bottom. If you use the UPDATE command, provide the exact full block to replace.

Always explain your changes briefly before outputting the code blocks.`
        };

        const apiKey = process.env.FRIDAY_API_KEY;
        const baseURL = process.env.FRIDAY_API_URL || 'https://integrate.api.nvidia.com/v1';
        const model = process.env.FRIDAY_MODEL || 'meta/llama-3.1-70b-instruct';

        if (!apiKey) {
            throw new Error('Friday API key is not configured. Set FRIDAY_API_KEY in .env');
        }

        const isVisionModel = model.includes('vision') || model.includes('v-turbo') || model.includes('4.6v');

        const processedMessages = messages.map((m, index) => {
            const isLast = index === messages.length - 1;
            if (m.role === 'user' && image && isLast && isVisionModel) {
                return {
                    role: 'user',
                    content: [
                        { type: "text", text: m.content || m.text },
                        { type: "image_url", image_url: { url: image } }
                    ]
                };
            }
            return {
                role: m.role === 'ai' ? 'assistant' : m.role,
                content: m.content || m.text
            };
        });

        console.log("[Chat] Sending to:", `${baseURL}/chat/completions`);
        console.log("[Chat] Model:", model);

        const response = await fetch(`${baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [systemMessage, ...processedMessages],
                temperature: temperature,
                max_tokens: max_tokens,
                stream: true,
            })
        });

        console.log("[Chat] Response Status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Chat] API Error Response:", errorText);
            throw new Error(`API Error: ${response.statusText} - ${errorText}`);
        }

        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let fullContent = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            res.write(chunk);

            try {
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.slice(6);
                        if (jsonStr === '[DONE]') continue;
                        const data = JSON.parse(jsonStr);
                        const content = data.choices[0]?.delta?.content || '';
                        fullContent += content;
                    }
                }
            } catch (e) {
                // Ignore parse errors on partial chunks
            }
        }
        res.end();

    } catch (err) {
        console.error("[Chat Error]:", err);
        incrementFailure();

        if (!res.headersSent) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
});

module.exports = router;
