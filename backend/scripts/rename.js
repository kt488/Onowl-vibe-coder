const fs = require('fs');
const path = require('path');

const [,, oldPath, newPath] = process.argv;

if (!oldPath || !newPath) {
    console.error('Usage: node rename.js <oldPath> <newPath>');
    process.exit(1);
}

try {
    fs.renameSync(path.resolve(oldPath), path.resolve(newPath));
    console.log(`Successfully renamed ${oldPath} to ${newPath}`);
} catch (err) {
    console.error(`Error renaming: ${err.message}`);
    process.exit(1);
}
