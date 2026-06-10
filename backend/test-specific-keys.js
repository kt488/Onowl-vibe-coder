require('dotenv').config();
const OpenAI = require('openai');

async function testModels() {
    console.log('Testing specific model keys...\n');

    const tests = [
        { name: 'Kimi', modelId: 'moonshotai/kimi-k2.6', key: process.env.KIMI_API_KEY },
        { name: 'DeepSeek', modelId: 'deepseek-ai/deepseek-v4-pro', key: process.env.DEEPSEEK_API_KEY },
        { name: 'GLM', modelId: 'z-ai/glm-5.1', key: process.env.NVIDIA_NIM_API_KEY } // Fallback for GLM
    ];

    for (const t of tests) {
        console.log(`Testing ${t.name}...`);
        if (!t.key) {
            console.log(`❌ [${t.name}] FAILED: API Key missing.\n`);
            continue;
        }

        const client = new OpenAI({
            apiKey: t.key,
            baseURL: 'https://integrate.api.nvidia.com/v1',
            maxRetries: 0,
            timeout: 10000
        });

        try {
            const completion = await client.chat.completions.create({
                model: t.modelId,
                messages: [{ role: "user", content: "Reply 'OK'" }],
                max_tokens: 5
            });
            console.log(`✅ [${t.name}] SUCCESS: ${completion.choices[0].message.content.trim()}\n`);
        } catch (e) {
            console.log(`❌ [${t.name}] FAILED: ${e.message}\n`);
            if (e.response) {
                console.log(`   Status: ${e.status}`);
                console.log(`   Body: ${JSON.stringify(e.response.data)}`);
            }
        }
    }
}

testModels();