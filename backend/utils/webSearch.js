const axios = require('axios');

/**
 * Performs a web search using a public/free API (DuckDuckGo or similar).
 */
async function performWebSearch(query) {
    try {
        // Using a public DuckDuckGo search endpoint (results in JSON format)
        // Note: In a production app, use a proper Search API like Serper, Google Custom Search, etc.
        const response = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
        
        if (response.data) {
            const results = [];
            if (response.data.AbstractText) {
                results.push(`Summary: ${response.data.AbstractText}`);
            }
            if (response.data.RelatedTopics && response.data.RelatedTopics.length > 0) {
                const topics = response.data.RelatedTopics.slice(0, 3).map(t => t.Text).filter(Boolean);
                results.push(`Related Info: ${topics.join('; ')}`);
            }
            
            return results.length > 0 ? results.join('\n') : "No detailed summary found. Searching broader index...";
        }
        return "Search completed, but no direct summary available.";
    } catch (err) {
        console.error('[Search Error]:', err.message);
        return `Web search failed: ${err.message}`;
    }
}

module.exports = {
    performWebSearch
};