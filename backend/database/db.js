const fs = require('fs/promises');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'db.json');

// Initialize database with default structure if it doesn't exist
async function initDB() {
    try {
        await fs.access(dbPath);
    } catch {
        const defaultData = {
            users: [],
            projects: [],
            files: [],
            chats: [],
            images: [],
            sandboxes: []
        };
        await fs.writeFile(dbPath, JSON.stringify(defaultData, null, 2));
    }
}

// Helper to read DB
async function readDB() {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
}

// Helper to write DB
async function writeDB(data) {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Database Operations ---

const DB = {
    async createProject(name, description = '') {
        const db = await readDB();
        const project = { id: generateId(), name, description, createdAt: new Date().toISOString() };
        db.projects.push(project);
        await writeDB(db);
        return project;
    },

    async saveFile(projectId, name, language, content) {
        const db = await readDB();
        const fileIndex = db.files.findIndex(f => f.projectId === projectId && f.name === name);
        const file = { projectId, name, language, content, updatedAt: new Date().toISOString() };
        
        if (fileIndex > -1) {
            db.files[fileIndex] = { ...db.files[fileIndex], ...file };
        } else {
            file.id = generateId();
            file.createdAt = new Date().toISOString();
            db.files.push(file);
        }
        await writeDB(db);
        return file;
    },

    async saveChatMessage(projectId, role, content) {
        const db = await readDB();
        const message = { id: generateId(), projectId, role, content, timestamp: new Date().toISOString() };
        db.chats.push(message);
        await writeDB(db);
        return message;
    },

    async saveImage(projectId, filename, url) {
        const db = await readDB();
        const image = { id: generateId(), projectId, filename, url, uploadedAt: new Date().toISOString() };
        db.images.push(image);
        await writeDB(db);
        return image;
    },

    async saveSandboxConfig(projectId, config) {
        const db = await readDB();
        const existingIndex = db.sandboxes.findIndex(s => s.projectId === projectId);
        
        const sandbox = { projectId, config, updatedAt: new Date().toISOString() };
        if (existingIndex > -1) {
            db.sandboxes[existingIndex] = { ...db.sandboxes[existingIndex], ...sandbox };
        } else {
            sandbox.id = generateId();
            sandbox.createdAt = new Date().toISOString();
            db.sandboxes.push(sandbox);
        }
        await writeDB(db);
        return sandbox;
    },

    // Getters
    async getProjectDetails(projectId) {
        const db = await readDB();
        const project = db.projects.find(p => p.id === projectId);
        if (!project) return null;

        return {
            ...project,
            files: db.files.filter(f => f.projectId === projectId),
            chats: db.chats.filter(c => f.projectId === projectId),
            images: db.images.filter(i => i.projectId === projectId),
            sandbox: db.sandboxes.find(s => s.projectId === projectId)
        };
    }
};

// Initialize on load
initDB();

module.exports = DB;