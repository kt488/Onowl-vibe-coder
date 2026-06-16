require('dotenv').config();
async function test() {
    const apiKey = process.env.NVIDIA_NIM_API_KEY;
    const largeMessage = "A".repeat(11000); // Create an 11KB message
    try {
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
          },
          body: JSON.stringify({
              model: 'nvidia/nemotron-3-ultra-550b-a55b',
              messages: [{ role: 'user', content: largeMessage }],
              stream: false,
              max_tokens: 10
          })
      });
      console.log("Status:", res.status);
      const body = await res.text();
      console.log("Body:", body.substring(0, 100)); // Print just the start to avoid spam
    } catch(e) { console.error(e); }
}
test();
