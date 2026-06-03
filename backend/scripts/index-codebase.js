require('dotenv').config({ path: '../.env' });
const fs = require('fs').promises;
const path = require('path');
const { addChunks } = require('../utils/ragEngine');

const PROJECT_ROOT = path.join(__dirname, '../../'); // Adjust to project root
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', 'out'];
const ALLOWED_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.py', '.json'];

const CHUNK_SIZE = 1500; // Average chunk size in characters

/**
 * Recursively walks the directory and finds files.
 */
async function getFiles(dir) {
    let results = [];
    const list = await fs.readdir(dir, { withFileTypes: true });

    for (const item of list) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            if (!IGNORE_DIRS.includes(item.name)) {
                results = results.concat(await getFiles(fullPath));
            }
        } else {
            const ext = path.extname(item.name);
            if (ALLOWED_EXTENSIONS.includes(ext)) {
                results.push(fullPath);
            }
        }
    }
    return results;
}

/**
 * Splits text into chunks.
 */
function chunkText(text, filePath) {
    const chunks = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
        chunks.push({
            text: text.substring(i, i + CHUNK_SIZE),
            path: path.relative(PROJECT_ROOT, filePath)
        });
    }
    return chunks;
}

async function indexCodebase() {
    console.log('🚀 Starting project indexing...');
    console.log('Project Root:', PROJECT_ROOT);

    try {
        const files = await getFiles(PROJECT_ROOT);
        console.log(`Found ${files.length} relevant files.`);

        let allChunks = [];
        for (const file of files) {
            const content = await fs.readFile(file, 'utf8');
            const chunks = chunkText(content, file);
            allChunks = allChunks.concat(chunks);
        }

        console.log(`Total chunks created: ${allChunks.length}. Adding to ChromaDB (this may take time)...`);
        
        // Add in smaller batches to avoid overloading the embedding API or memory
        const BATCH_SIZE = 20;
        for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
            const batch = allChunks.slice(i, i + BATCH_SIZE);
            console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}...`);
            await addChunks(batch);
        }

        console.log('✅ Indexing complete! Your codebase is now searchable.');
    } catch (err) {
        console.error('❌ Indexing failed:', err.message);
    }
}

indexCodebase();