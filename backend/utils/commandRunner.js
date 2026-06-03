const { spawn } = require('child_process');
const path = require('path');

const WORKSPACE_ROOT = path.join(__dirname, '../../ai-workspace');

/**
 * Executes a command in the ai-workspace and pipes output to a callback.
 */
function executeCommand(command, args = [], onData, onExit) {
    console.log(`[Sandbox Exec]: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
        cwd: WORKSPACE_ROOT,
        shell: true,
        env: { ...process.env, FORCE_COLOR: true }
    });

    child.stdout.on('data', (data) => {
        onData(data.toString());
    });

    child.stderr.on('data', (data) => {
        onData(`\x1b[31m${data.toString()}\x1b[0m`); // Wrap in red for terminal logs
    });

    child.on('close', (code) => {
        onExit(code);
    });

    return child;
}

module.exports = {
    executeCommand
};