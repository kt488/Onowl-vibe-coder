require('dotenv').config();
async function test() {
    const apiKey = process.env.KIMI_API_KEY;
    try {
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
          },
          body: JSON.stringify({
              model: 'moonshotai/kimi-k2.6',
              messages: [{ role: 'user', content: 'Hello' }],
              stream: false,
              max_tokens: 10
          })
      });
      console.log("Status:", res.status);
      const body = await res.text();
      console.log("Body:", body);
    } catch(e) { console.error(e); }
}
test();