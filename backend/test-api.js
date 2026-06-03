require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.NVIDIA_NIM_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
});

async function main() {
    try {
        const completion = await openai.chat.completions.create({
            model: "z-ai/glm-5.1",
            messages: [{ role: "user", content: "Hello" }],
            max_tokens: 10
        });
        console.log("Success! Response:", completion.choices[0].message.content);
    } catch (e) {
        console.error("API Error:", e.status, e.message);
    }
}
main();