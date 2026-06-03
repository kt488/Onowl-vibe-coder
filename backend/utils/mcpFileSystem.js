const fs = require('fs').promises;
const path = require('path');

// Target directory for all AI file operations (a sandbox inside the project)
const WORKSPACE_ROOT = path.join(__dirname, '../../ai-workspace');

/**
 * Ensures the workspace root exists.
 */
async function initWorkspace() {
    try {
        await fs.mkdir(WORKSPACE_ROOT, { recursive: true });
    } catch (err) {
        console.error('[Workspace Init Error]:', err.message);
    }
}

/**
 * Resolves a safe path within the workspace root.
 */
function resolveSafePath(filePath) {
    const fullPath = path.resolve(WORKSPACE_ROOT, filePath);
    if (!fullPath.startsWith(WORKSPACE_ROOT)) {
        throw new Error('Access denied: Path is outside the workspace.');
    }
    return fullPath;
}

/**
 * Creates a folder in the workspace.
 */
async function createFolder(folderPath) {
    const target = resolveSafePath(folderPath);
    await fs.mkdir(target, { recursive: true });
    return `Folder created: ${folderPath}`;
}

/**
 * Creates a file with initial content.
 */
async function createFile(filePath, content = '') {
    const target = resolveSafePath(filePath);
    const dir = path.dirname(target);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(target, content, 'utf8');
    return `File created: ${filePath}`;
}

/**
 * Updates/Edits an existing file.
 */
async function updateFile(filePath, content) {
    const target = resolveSafePath(filePath);
    // Check if exists
    try {
        await fs.access(target);
    } catch (err) {
        return await createFile(filePath, content); // Create if doesn't exist
    }
    await fs.writeFile(target, content, 'utf8');
    return `File updated: ${filePath}`;
}

module.exports = {
    initWorkspace,
    createFolder,
    createFile,
    updateFile,
    WORKSPACE_ROOT
};