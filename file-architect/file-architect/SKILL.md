---
name: file-architect
description: Provides a safe, convention-enforcing file creation workflow. Use when creating new files to ensure they follow project naming standards and syntax conventions (e.g., React components must use .jsx/.tsx).
---

# File Architect

## Overview

This skill ensures that all newly created files in the project adhere to established naming and syntax conventions. It prevents the common error of writing JSX in `.js` files.

## Conventions

| File Type | Required Extension |
| :--- | :--- |
| React Component (JSX/TSX) | `.jsx` or `.tsx` |
| Standard JavaScript | `.js` |
| Standard TypeScript | `.ts` |

## File Creation Procedure

When creating a new file:

1. **Identify the file purpose**: Is it a React component?
2. **Select the correct extension**:
   - If it contains JSX tags (e.g., `<div>`), use `.jsx` (or `.tsx` if TypeScript is used).
   - Otherwise, use `.js` or `.ts`.
3. **Verify content**: Ensure the file extension matches the content syntax.
4. **Use `write_file`**: Use the standard `write_file` tool only *after* confirming the extension.

## Examples

**User Request: "Create a new sidebar component."**
- **Agent Action**:
  - `write_file(file_path: "src/components/Sidebar.jsx", content: "...")`
  - *NOT* `src/components/Sidebar.js`

**User Request: "Create a new utility function for string formatting."**
- **Agent Action**:
  - `write_file(file_path: "src/utils/format.js", content: "...")`

