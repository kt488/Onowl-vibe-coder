require('dotenv').config();
const { fetch } = require('undici');

async function test() {
    const apiKey = process.env.NVIDIA_NIM_API_KEY;
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'meta/llama-3.1-8b-instruct',
            messages: [{ role: 'user', content: 'Hello' }],
            stream: false,
            max_tokens: 10
        })
    });
    
    console.log("Status:", res.status);
    const body = await res.text();
    console.log("Body:", body);
}
test();