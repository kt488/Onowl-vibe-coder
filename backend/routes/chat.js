const express = require('express');
const Joi = require('joi');
const OpenAI = require('openai');
const { chatRateLimiter } = require('../middleware/rateLimiter');
const { incrementTotal, incrementSuccess, incrementFailure } = require('../utils/statsStore');
const mcpFsClient = require('../utils/mcpFileSystemClient');
const { performWebSearch } = require('../utils/webSearch');
const { searchCode } = require('../utils/ragEngine');
const { executeCommand } = require('../utils/commandRunner');

const router = express.Router();

const chatSchema = Joi.object({
    messages: Joi.array().items(
        Joi.object({
            role: Joi.string().valid('system', 'user', 'assistant').required(),
            content: Joi.any().required()
        })
    ).min(1).required(),
    temperature: Joi.number().min(0).max(2).optional().default(0.7),
    max_tokens: Joi.number().min(1).max(8192).optional().default(2048),
    model: Joi.string().optional().default('deepseek-ai/deepseek-v4-pro'),
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

        const { messages, model, temperature, max_tokens, image } = value;
        const userQuery = messages[messages.length - 1].content;
        
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const sendUpdate = (text) => {
            res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        };

        sendUpdate(`🚀 **Onowl AI Core: Starting RAG retrieval (${model})...**\n\n`);
        
        // 1. RAG Step: Retrieve context from codebase
        let projectContext = "";
        try {
            projectContext = await searchCode(userQuery, 3);
            if (projectContext) {
                sendUpdate(`✅ **RAG Engine**: Retrieved relevant code context for your request.\n\n`);
            }
        } catch (ragErr) {
            console.error("[RAG Error]:", ragErr.message);
            sendUpdate(`⚠️ **RAG Engine**: Codebase search currently unavailable. Proceeding with general knowledge.\n\n`);
        }

        await mcpFsClient.initMcpClient();

        const systemMessage = {
            role: 'system',
            content: `You are an AI Coding Agent integrated into a web-based IDE.
CORE MANDATES:
1. **NO CODE IN CHAT**: Never output code blocks in your conversational response. Only explain what you are building.
2. **USE FILE TAGS**: Any code you generate MUST be wrapped in the exact format:
   ### FILE: path/to/file.extension
   \`\`\`language
   // code content
   \`\`\`
3. **TERMINAL COMMANDS**: You can execute commands in the project terminal. Use:
   ### COMMAND: your command string
   (e.g., ### COMMAND: npm install && npm run dev)

4. **AUTOMATIC FOLDERS**: The system automatically handles folder creation.
5. **LIVE STREAM**: Your code will stream LIVE into the user's editor. Start your FILE blocks as soon as possible.

Current Project Context (Retrieved via RAG):
${projectContext || "No specific local code context provided."}

Act as an expert Senior Engineer. Perform actions autonomously based on the user's requests.`
        };

        // Prepare messages for multimodal if image exists
        const processedMessages = messages.map(m => {
            if (m.role === 'user' && image) {
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

        let apiKey = process.env.NVIDIA_NIM_API_KEY;
        if (model.includes('kimi')) apiKey = process.env.KIMI_API_KEY || apiKey;
        if (model.includes('deepseek')) apiKey = process.env.DEEPSEEK_API_KEY || apiKey;

        const aiClient = new OpenAI({
            apiKey: apiKey,
            baseURL: 'https://integrate.api.nvidia.com/v1',
            timeout: 30000,
        });

        let stream = await aiClient.chat.completions.create({
            model: model,
            messages: [systemMessage, ...processedMessages],
            temperature: temperature,
            max_tokens: max_tokens,
            stream: true,
        });

        let fullContent = '';
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                fullContent += content;
                sendUpdate(content);

                // Live Search Interception
                if (fullContent.includes('### SEARCH:')) {
                    const searchLine = fullContent.split('### SEARCH:')[1].split('\n')[0].trim();
                    if (searchLine && !fullContent.includes('🔍 Searching...')) {
                        sendUpdate(`\n\n🔍 **Searching web for:** *${searchLine}*...\n`);
                        const searchResult = await performWebSearch(searchLine);
                        sendUpdate(`\n🌐 **Search Result:** ${searchResult}\n\n`);
                    }
                }
            }
        }

        // Post-stream: Parse for Commands
        const cmdRegex = /### COMMAND:\s*(.+)/g;
        let cmdMatch;
        while ((cmdMatch = cmdRegex.exec(fullContent)) !== null) {
            const command = cmdMatch[1].trim();
            console.log(`[Sandbox] Executing: ${command}`);
            executeCommand(command, [], (data) => {
                console.log(`[TERMINAL]: ${data}`);
            }, (code) => {
                console.log(`[TERMINAL]: Process exited with code ${code}`);
            });
            sendUpdate(`\n\n➜  **TERMINAL**: Executed \`${command}\`. Check the server console for logs.`);
        }

        // Post-stream: Parse for File System Commands
        const fileRegex = /### FILE:\s*(.+?)\s*\n\s*```[a-zA-Z]*\n([\s\S]*?)```/g;
        let match;
        let filesWritten = 0;
        while ((match = fileRegex.exec(fullContent)) !== null) {
            const filePath = match[1].trim();
            const code = match[2];
            console.log(`[MCP] Writing file: ${filePath}`);
            await mcpFsClient.mcpFs.createFile(filePath, code);
            filesWritten++;
        }

        if (filesWritten > 0) {
            console.log(`[MCP] Total files written: ${filesWritten}`);
            sendUpdate(`\n\n✅ **MCP File System**: Successfully updated ${filesWritten} file(s) in shared storage.`);
        }

        res.write('data: [DONE]\n\n');
        incrementSuccess(model, Date.now() - startTime, 2048);
        res.end();

    } catch (err) {
        incrementFailure(err.message);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: 'AI processing error.' });
        } else {
            res.write(`data: ${JSON.stringify({ error: '\n\n[Error] Pipeline stalled.' })}\n\n`);
            res.end();
        }
    }
});

module.exports = router;