# 🔒 TypeScript: Strict Sovereignty

## Non-Negotiable Rules
- **Strict Mode**: `"strict": true` must always be enabled.
- **No `as any`**: Type casts are forbidden. Fix the type at the source.
- **Unknown Boundaries**: Use `unknown` for all external API responses.
- **Strict API Errors**: Use only pre-registered error codes from `src/lib/errors.ts`.
