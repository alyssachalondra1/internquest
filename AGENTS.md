# Internquest - AI Development Rules

## Project Context
- Existing project built with Next.js and TypeScript.
- Supabase is used as the backend.
- Vercel is used for deployment.
- GitHub is used for version control.
- This is an existing application. Do not rebuild it from scratch.

## General Rules
1. Always inspect the existing code before making changes.
2. Preserve existing features and functionality.
3. Do not delete or rename files without approval.
4. Do not modify database schemas, tables, RLS policies, or migrations without approval.
5. Never expose secrets, API keys, or credentials.
6. Never read or display the contents of .env files.
7. Do not make production database changes.
8. Do not deploy to production without explicit approval.
9. Follow the existing coding style and architecture.
10. Avoid unnecessary dependencies.

## Development Workflow
1. Analyze the relevant code first.
2. Explain the problem and proposed solution.
3. Provide an implementation plan before significant changes.
4. Wait for approval before making significant changes.
5. Make focused changes rather than modifying unrelated files.
6. Run appropriate tests after implementation.
7. Explain all modified files and summarize the changes.
8. Report any errors or assumptions honestly.

## Git Rules
- Work only on the ai-development branch.
- Never commit or push without approval.
- Never modify the main branch.
- Never run destructive Git commands without approval.