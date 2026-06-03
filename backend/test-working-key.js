require('dotenv').config();
const OpenAI = require('openai');

const models = [
    { name: 'Kimi', modelId: 'moonshotai/kimi-k2.6' },
    { name: 'DeepSeek', modelId: 'deepseek-ai/deepseek-v4-pro' },
    { name: 'MiniMax', modelId: 'minimaxai/minimax-m2.7' },
    { name: 'GLM', modelId: 'z-ai/glm-5.1' }
];

async function testWorkingKey() {
    console.log('Testing all models using the working NVIDIA NIM API Key...\n');
    const workingKey = process.env.NVIDIA_NIM_API_KEY;

    if (!workingKey) {
        console.log('❌ FAILED: Original NVIDIA_NIM_API_KEY is missing.');
        return;
    }

    const client = new OpenAI({
        apiKey: workingKey,
        baseURL: 'https://integrate.api.nvidia.com/v1',
        maxRetries: 1, 
        timeout: 10000 // 10s timeout
    });

    for (const m of models) {
        try {
            const completion = await client.chat.completions.create({
                model: m.modelId,
                messages: [{ role: "user", content: "Reply with the word 'Hello'" }],
                max_tokens: 10
            });
            console.log(`✅ [${m.name}] SUCCESS: ${completion.choices[0].message.content.trim()}`);
        } catch (e) {
            console.log(`❌ [${m.name}] FAILED: ${e.message}`);
        }
    }
    console.log('\nDone!');
}

testWorkingKey();