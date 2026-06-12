require('dotenv').config();
const { fetch } = require('undici');

async function test() {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
            model: 'deepseek-ai/deepseek-v4 pro', // let's try a valid deepseek model, wait deepseek-v4-pro might be wrong?
            messages: [{ role: 'user', content: 'Hello' }],
            stream: true,
            max_tokens: 10
        })
    });
    
    console.log("Status:", res.status);
    const body = await res.text();
    console.log("Body:", body);
}
test();