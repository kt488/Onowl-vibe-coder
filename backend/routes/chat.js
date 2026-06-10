const express = require('express');
const Joi = require('joi');
const { fetch } = require('undici');
const fs = require('fs');
const path = require('path');
const { chatRateLimiter } = require('../middleware/rateLimiter');
const { incrementTotal, incrementSuccess, incrementFailure } = require('../utils/statsStore');
const mcpFsClient = require('../utils/mcpFileSystemClient');
const { mcpSearch, initMcpSearchClient } = require('../utils/mcpWebSearchClient');
const { executeCommand } = require('../utils/commandRunner');
const { checkSubscription } = require('../middleware/subscription');
const { supabase } = require('../utils/supabase');
const { getApiKeyStatus } = require('../utils/apiKeyManager');

const router = express.Router();

// --- Load AI Skills ---
let cachedSkillsText = '';
try {
    const skillsDir = path.join(__dirname, '../ai_skills/.agents/skills');
    if (fs.existsSync(skillsDir)) {
        const folders = fs.readdirSync(skillsDir);
        let skillsAccumulator = '\\n\\n--- AVAILABLE SKILLS ---\\n';
        folders.forEach(folder => {
            const skillFilePath = path.join(skillsDir, folder, 'SKILL.md');
            if (fs.existsSync(skillFilePath)) {
                const skillContent = fs.readFileSync(skillFilePath, 'utf-8');
                skillsAccumulator += `\\n### SKILL: ${folder}\\n${skillContent}\\n`;
            }
        });
        cachedSkillsText = skillsAccumulator;
        console.log(`[Skills] Loaded ${folders.length} skills from ai_skills directory.`);
    }
} catch (e) {
    console.warn('[Skills] Failed to load skills:', e.message);
}

const chatSchema = Joi.object({
    messages: Joi.array().items(
        Joi.object({
            role: Joi.string().valid('system', 'user', 'assistant').required(),
            content: Joi.any().required()
        })
    ).min(1).required(),
    temperature: Joi.number().min(0).max(2).optional().default(0.7),
    max_tokens: Joi.number().min(1).max(8192).optional().default(8192),
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

        let { messages, model, temperature, max_tokens, image } = value;
        const userQuery = messages[messages.length - 1].content;

        if (model.includes('kimi') && temperature > 1.0) {
            temperature = 1.0;
        }
        
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const sendUpdate = (data, type = 'content') => {
            const payload = typeof data === 'object' ? data : { [type]: data };
            res.write(`data: ${JSON.stringify(payload)}\n\n`);
        };

        let mcpFs = null;
        let mcpSearch = null;

        try {
            const controller = new AbortController();
            const timeout = (ms) => new Promise((_, reject) => setTimeout(() => {
                controller.abort();
                reject(new Error("Init Timeout"));
            }, ms));
            
            const initStartTime = Date.now();
            const initPromise = Promise.all([
                mcpFsClient.initMcpClient().then(c => { mcpFs = c; return c; }),
                initMcpSearchClient().then(c => { mcpSearch = c; return c; })
            ]);

            const initResults = await Promise.race([
                initPromise,
                timeout(6000) 
            ]).catch(err => {
                try {
                    if (mcpFs) mcpFs.close();
                    if (mcpSearch) mcpSearch.close();
                } catch (cleanupErr) {
                    console.error("[Cleanup Error]:", cleanupErr.message);
                }

                console.warn("[Parallel Init Warning]:", err.message);
                return [null, null];
            });

            const duration = Date.now() - initStartTime;
            console.log(`[Init] MCP took ${duration}ms`);
            
        } catch (err) {
            console.error("[Parallel Init Error]:", err.message);
        }

        const systemMessage = {
            role: 'system',
            content: `You are OnOwl Vibe Coder, an expert AI programming assistant. You operate directly inside the user's IDE.

CRITICAL INSTRUCTIONS FOR FILE OPERATIONS:

1. CREATING OR OVERWRITING FILES:
To create a new file or completely overwrite an existing one, you MUST use the exact following format. The frontend will automatically parse this and create any necessary folders.

### FILE: path/to/filename.ext
\`\`\`language
// Full file content goes here
\`\`\`

2. SURGICAL EDITS (PATCHING):
Do NOT overwrite entire files if you only need to change a small part. To update a specific part of an existing file, use the UPDATE format. You must provide the EXACT existing code to be replaced, and the new code to replace it with.

### UPDATE: path/to/filename.ext
<<<<
// EXACT old code to find and replace. Must match character-for-character including indentation.
====
// NEW code to insert in its place.
>>>>

3. NO TRUNCATION ALLOWED:
You MUST write the FULL, complete code for any block you generate. NEVER use placeholders like "// ... rest of code" or "// unchanged code". If you use the FILE command, you must write the entire file top-to-bottom. If you use the UPDATE command, provide the exact full block to replace.

Always explain your changes briefly before outputting the code blocks.` + cachedSkillsText
        };

        let apiKey = process.env.NVIDIA_NIM_API_KEY;
        let apiKeyEnvVar = 'NVIDIA_NIM_API_KEY';
        let baseURL = 'https://integrate.api.nvidia.com/v1';

        if (model.includes('kimi')) {
            apiKeyEnvVar = 'KIMI_API_KEY';
            apiKey = process.env.KIMI_API_KEY || apiKey;
            baseURL = 'https://integrate.api.nvidia.com/v1'; // Use nvidia endpoint for kimi
            model = 'moonshotai/kimi-k2.6';
        } else if (model.includes('deepseek')) {
            apiKeyEnvVar = 'DEEPSEEK_API_KEY';
            apiKey = process.env.DEEPSEEK_API_KEY || apiKey;
            baseURL = 'https://integrate.api.nvidia.com/v1'; // Use nvidia endpoint for deepseek
        } else if (model.includes('nemotron')) {
            apiKeyEnvVar = 'NEMOTRON_API_KEY';
            apiKey = process.env.NEMOTRON_API_KEY || apiKey;
            baseURL = 'https://integrate.api.nvidia.com/v1'; // Always use nvidia endpoint for nemotron
        } else if (model.includes('minimax')) {
            apiKeyEnvVar = 'MINIMAX_API_KEY';
            apiKey = process.env.MINIMAX_API_KEY || apiKey;
            baseURL = 'https://integrate.api.nvidia.com/v1'; // Use nvidia endpoint for minimax
        } else if (model.includes('qwen')) {
            apiKeyEnvVar = 'QWEN_API_KEY';
            apiKey = process.env.QWEN_API_KEY || apiKey;
            baseURL = 'https://integrate.api.nvidia.com/v1'; // Use nvidia endpoint for qwen
        } else if (model.includes('glm')) {
            apiKeyEnvVar = 'GLM_API_KEY';
            apiKey = process.env.GLM_API_KEY || apiKey;
            if (apiKey && !apiKey.startsWith('nvapi-')) {
                baseURL = 'https://open.bigmodel.cn/api/paas/v4';
                model = 'glm-4-plus'; // Map to native model name
            }
        }

        // On-demand validation
        const keyStatus = await getApiKeyStatus(apiKeyEnvVar);
        if (keyStatus !== 'Working') {
            throw new Error(`Model '${model}' API key is not configured or invalid.`);
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

        const response = await fetch(`${baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
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
        console.log("[Chat] Response Headers:", JSON.stringify(Object.fromEntries(response.headers.entries())));

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Chat] API Error Response:", errorText);
            throw new Error(`API Error: ${response.statusText} - ${errorText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let buffer = '';

        console.log("[Chat] Starting stream consumption...");
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                console.log("[Chat] Stream done.");
                break;
            }

            console.log("[Chat] Received chunk of size:", value ? value.length : 0);
            buffer += decoder.decode(value, { stream: true });
            // ... (rest of parsing)
            let lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
                if (!line || !line.trim()) continue;
                console.log("[SSE Line]:", line);
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    console.log("[SSE Data]:", data);
                    if (data === '[DONE]') continue;
                    try {
                        const json = JSON.parse(data);
                        const content = json.choices[0]?.delta?.content || '';
                        
                        fullContent += content;
                        
                        // Send the content to frontend, even if it's empty, 
                        // if you need to maintain stream flow.
                        // Or only send if content exists.
                        sendUpdate(content);
                        
                        // ... (Search logic)
                    } catch (e) {
                        console.error("[SSE Parse Error]:", e.message, "Line:", line);
                    }
                }
            }
        }

        // ... (Post-stream logic: Commands, Files, Stats, cleanup)
        res.end();
    } catch (err) {
        // ... (error handling)
    }
});

module.exports = router;
