async function testApi() {
    console.log("Calling API...");
    try {
        const res = await fetch('http://127.0.0.1:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'Reply "Hello"' }],
                model: 'deepseek-ai/deepseek-v4-pro',
                temperature: 0.7,
                max_tokens: 100
            })
        });
        
        console.log("Status:", res.status);
        if (!res.ok) {
            const error = await res.text();
            console.error("API Error:", error);
            return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            console.log(decoder.decode(value));
        }
        
    } catch (e) {
        console.error("Failed:", e);
    }
}
testApi();