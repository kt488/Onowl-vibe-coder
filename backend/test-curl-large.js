require('dotenv').config();
const { execSync } = require('child_process');

function test() {
    const apiKey = process.env.NVIDIA_NIM_API_KEY;
    const largeMessage = "A".repeat(11000); 
    
    const payload = JSON.stringify({
        model: 'nvidia/nemotron-3-ultra-550b-a55b',
        messages: [{ role: 'user', content: largeMessage }],
        stream: false,
        max_tokens: 10
    });
    
    const fs = require('fs');
    fs.writeFileSync('payload.json', payload);
    
    try {
        const output = execSync(`curl -i -s -X POST https://integrate.api.nvidia.com/v1/chat/completions -H "Authorization: Bearer ${apiKey}" -H "Content-Type: application/json" -d @payload.json`);
        console.log("CURL Output:");
        console.log(output.toString().substring(0, 500));
    } catch (e) {
        console.error("CURL Error:", e.message);
        if (e.stdout) console.error("STDOUT:", e.stdout.toString());
        if (e.stderr) console.error("STDERR:", e.stderr.toString());
    }
}
test();
