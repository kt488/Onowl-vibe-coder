# Project Instructions

## Coding Conventions

- **React Components**: ALL React components (files containing JSX tags like `<div />` or `<Component />`) MUST use the `.jsx` or `.tsx` file extension.
- **Strict File Naming**: BEFORE writing any code, the `coder` agent MUST determine if the file contains JSX/HTML-like syntax. If YES, the agent MUST use `.jsx` or `.tsx` extensions, even if the user asks for a `.js` file.
- **Forbidden Syntax**: JSX syntax is strictly forbidden in `.js` or `.ts` files. 
- **File Creation**: When delegating to the `coder` agent, explicitly include: "Ensure all React components use .jsx/.tsx extensions. Do not write JSX in .js files."
- **File Architect Skill**: Use the `file-architect` skill for creating new source files to ensure correct file type and syntax enforcement.
