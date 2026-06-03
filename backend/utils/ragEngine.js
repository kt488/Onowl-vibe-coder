const { ChromaClient } = require('chromadb');
const OpenAI = require('openai');

const EMBEDDING_MODEL = "nvidia/nv-embedqa-e5-v5";

const client = new ChromaClient({
    path: "http://localhost:8000" // Default ChromaDB port
});

/**
 * Generates an embedding for a given text using NVIDIA NIM.
 */
async function getEmbedding(text) {
    const openai = new OpenAI({
        apiKey: process.env.NVIDIA_NIM_API_KEY || 'fallback',
        baseURL: 'https://integrate.api.nvidia.com/v1',
    });
    try {
        const response = await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: text,
            encoding_format: "float",
            extra_body: {
                input_type: "query",
                truncate: "NONE"
            }
        });
        return response.data[0].embedding;
    } catch (err) {
        console.error("[Embedding Error]:", err.message);
        return null;
    }
}

/**
 * Ensures the collection exists and returns it.
 */
async function getOrCreateCollection() {
    try {
        return await client.getOrCreateCollection({
            name: "onowl-codebase",
            metadata: { "hnsw:space": "cosine" }
        });
    } catch (err) {
        console.error("[ChromaDB Error]:", err.message);
        return null;
    }
}

/**
 * Adds chunks to ChromaDB.
 */
async function addChunks(chunks) {
    const collection = await getOrCreateCollection();
    if (!collection) return;

    const ids = chunks.map((_, i) => `id-${Date.now()}-${i}`);
    const documents = chunks.map(c => c.text);
    const metadatas = chunks.map(c => ({ path: c.path }));
    
    // In a real RAG, we would pre-generate embeddings in batches to save time
    const embeddings = [];
    for (const doc of documents) {
        const emb = await getEmbedding(doc);
        embeddings.push(emb);
    }

    await collection.add({
        ids: ids,
        embeddings: embeddings.filter(Boolean),
        metadatas: metadatas,
        documents: documents
    });
}

/**
 * Searches ChromaDB for relevant code context.
 */
async function searchCode(query, nResults = 5) {
    const collection = await getOrCreateCollection();
    if (!collection) return "";

    const queryEmbedding = await getEmbedding(query);
    if (!queryEmbedding) return "";

    const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: nResults
    });

    if (!results || !results.documents || results.documents[0].length === 0) {
        return "No relevant project context found.";
    }

    return results.documents[0].map((doc, i) => {
        const meta = results.metadatas[0][i];
        return `FILE: ${meta.path}\nCODE:\n${doc}\n---\n`;
    }).join('\n');
}

module.exports = {
    addChunks,
    searchCode,
    getEmbedding
};