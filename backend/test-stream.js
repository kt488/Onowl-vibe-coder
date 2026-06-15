require('dotenv').config();
const { fetch } = require('undici');

async function test() {
    const apiKey = process.env.NEMOTRON_API_KEY;
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
            model: 'nvidia/nemotron-3-ultra-550b-a55b',
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