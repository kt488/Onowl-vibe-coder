---
name: onowl-master-guidelines
description: Comprehensive project guidelines for coding, security, and library usage.
---

# OnOwl Master Guidelines

## Coding Conventions
- **React Components**: ALL React components (files containing JSX/HTML-like syntax) MUST use the `.jsx` or `.tsx` file extension.
- **Strict File Naming**: JSX syntax is strictly forbidden in `.js` or `.ts` files. 
- **Colocation**: Colocate tests and related utilities next to source files whenever possible.

## Library Usage
- **Supabase**: ALWAYS use the pre-configured Supabase client from `src/utils/supabase.js` (or `.jsx`) for data operations. Do not re-initialize the client.
- **Tailwind**: Adhere to the project's established design system. Use semantic spacing, typography, and color tokens. Avoid arbitrary pixel values in CSS.

## Security Practices
- **Secrets**: NEVER commit `.env` files, API keys, or any sensitive credentials to git.
- **Boundary Validation**: Validate all external input (API request bodies, form submissions) at system boundaries using validation utilities before processing.
- **Logging**: NEVER log API keys, authentication tokens, passwords, or PII (Personally Identifiable Information).
- **Database**: Ensure all database interactions are authorized via Supabase RLS (Row Level Security) policies rather than relying solely on client-side checks.
