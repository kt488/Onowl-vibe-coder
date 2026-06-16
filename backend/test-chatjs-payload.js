require('dotenv').config();
async function test() {
    const apiKey = process.env.NVIDIA_NIM_API_KEY || process.env.KIMI_API_KEY;
    const baseURL = 'https://integrate.api.nvidia.com/v1';
    
    // exact payload sent by chat.js
    const payload = {
        model: 'meta/llama-3.2-90b-vision-instruct',
        messages: [
            { role: 'user', content: 'Hello' }
        ],
        temperature: 0.7,
        max_tokens: 8192,
        stream: true
    };
    
    try {
        const response = await fetch(`${baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        console.log("Status:", response.status);
        if (!response.ok) {
            console.log("Error body:", await response.text());
        } else {
            console.log("Success. Stream started.");
        }
    } catch(e) { console.error(e); }
}
test();