require('dotenv').config();
const OpenAI = require('openai');

const models = [
    { name: 'Kimi', modelId: 'moonshotai/kimi-k2.6', apiKey: process.env.KIMI_API_KEY },
    { name: 'DeepSeek', modelId: 'deepseek-ai/deepseek-v4-pro', apiKey: process.env.DEEPSEEK_API_KEY },
    { name: 'GLM', modelId: 'z-ai/glm-5.1', apiKey: process.env.NVIDIA_NIM_API_KEY }
];

async function testKeys() {
    console.log('Testing API Keys...\n');
    let allSuccess = true;

    for (const m of models) {
        if (!m.apiKey) {
            console.log(`❌ [${m.name}] FAILED: API Key is missing in .env`);
            allSuccess = false;
            continue;
        }

        const client = new OpenAI({
            apiKey: m.apiKey,
            baseURL: 'https://integrate.api.nvidia.com/v1',
            maxRetries: 1, 
            timeout: 30000
        });

        try {
            const completion = await client.chat.completions.create({
                model: m.modelId,
                messages: [{ role: "user", content: "Reply with the word 'Hello'" }],
                max_tokens: 10
            });
            console.log(`✅ [${m.name}] SUCCESS: ${completion.choices[0].message.content.trim()}`);
        } catch (e) {
            console.log(`❌ [${m.name}] FAILED: ${e.message}`);
            allSuccess = false;
        }
    }
    console.log('\nDone!');
    if (!allSuccess) {
        process.exit(1);
    }
}

testKeys();