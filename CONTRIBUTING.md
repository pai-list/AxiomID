# Contributing to AxiomID

Welcome to AxiomID — thank you for your interest in contributing!

## Quick Start

```bash
# Prerequisites: Node.js 20+, npm, Git
git clone https://github.com/Moeabdelaziz007/AxiomID.git
cd AxiomID
cp .env.example .env.local
npm install
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Prerequisites

- **Node.js 20+** (check with node --version)
- **npm 10+** (check with `npm --version`)
- **Git** with signed commits (recommended)
- **Pi Browser** (for testing Pi Network features)
- **Portless** (optional, for stable HTTPS URLs: `npm install -g portless`)

## Project Structure

```text
src/              — Next.js App Router (pages, API routes, components)
  app/            — Route handlers + pages
  components/     — React components (landing, dashboard, passport)
  lib/            — Shared utilities (Pi SDK, auth, validators)
  i18n/           — Translations (en.json, ar.json)
  diagnostics/    — Diagnostics error catalog
  types/          — Global type declarations
packages/
  crypto/         — @axiomid/crypto (Ed25519 keys)
  sdk/            — @axiomid/sdk (public API client)
backend/          — Cloudflare Workers (truth RAG, MCP, skills)
prisma/           — Database schema + migrations
docs/             — Specifications, plans, knowledge base
.ai/              — Agent workflow scripts (loops, playbooks)
```

## Development Workflow

### Branch Naming

```text
feat/<description>    — New features
fix/<description>     — Bug fixes
refactor/<description> — Code restructuring
docs/<description>    — Documentation
chore/<description>   — Maintenance
```

### Commit Format (IQRA Chronicle)

```text
type(scope): short description ۞

Longer narrative explaining what changed and why.
```

Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`, `style`.

### Before Every Push

```bash
npm run lint          # No new warnings
npm run type-check    # TypeScript strict mode
npm test              # Relevant test suites
npm run build         # Must pass
```

### PR Process

1. Create branch from `main`
2. Make focused changes (one logical change per PR)
3. Run local verification (lint → type-check → test → build)
4. Push and open PR against `main`
5. CI must pass (Vercel, GitHub Actions, CodeQL, CodeRabbit)
6. Get approving review
7. Squash merge to `main`

## Testing

```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm test -- --coverage # Coverage report
```

Write tests for new features. Follow existing patterns in `src/__tests__/`.

## Internationalization (i18n)

All user-visible strings must have keys in both `src/i18n/en.json` and `src/i18n/ar.json`.

**Key-based translation (preferred):**

```typescript
const { t } = useLanguage();
t('welcome')  // Resolves from en.json or ar.json
```

**Custom bilingual helper (for edge cases):**

```typescript
import en from '@/i18n/en.json';
import ar from '@/i18n/ar.json';

const getBilingualLabel = (key: string, language: string) =>
  language === 'en' ? en[key] : ar[key];

// Example usage
getBilingualLabel('welcome', language)
```

## Pi SDK Guidelines

- Pi SDK is browser-only — never import in Server Components or API routes
- Sandbox mode is determined dynamically via `determineSandboxMode()` — never hardcode
- Test Pi features in Pi Browser with sandbox mode enabled

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md). Be respectful, constructive, and inclusive.

## Questions?

Open a [GitHub Discussion](https://github.com/Moeabdelaziz007/AxiomID/discussions) or check existing issues.
