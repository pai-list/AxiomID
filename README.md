<div align="center">
  <img src="./public/axiomid-banner-v2.jpg" alt="AxiomID Banner: Human Sovereign and AI Agent" width="100%" />
</div>

<h1 align="center">AxiomID — AuraOS Sovereign AI Desktop &amp; OpenIdentity Hub</h1>

<p align="center">
  <em>Sovereign human-backed identity, AuraOS desktop shell, W3C DIDs, and Pi Network agent rails for the PAI Universe.</em>
</p>

<p align="center">
  <a href="https://www.axiomid.app"><b>Live App</b></a> ·
  <a href="https://www.axiomid.app/docs"><b>Documentation</b></a> ·
  <a href="https://www.axiomid.app/passport/demo"><b>Demo Passport</b></a> ·
  <a href="https://www.axiomid.app/leaderboard"><b>Leaderboard</b></a> ·
  <a href="https://www.axiomid.app/llms.txt"><b>llms.txt</b></a> ·
  <a href="https://github.com/pai-list/AxiomID"><b>GitHub</b></a>
</p>

<p align="center">
  <a href="https://github.com/pai-list/AxiomID/actions"><img src="https://img.shields.io/github/actions/workflow/status/pai-list/AxiomID/ci.yml?branch=main&label=CI&style=flat-square" alt="CI" /></a>
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square" alt="TypeScript Strict" />
  <img src="https://img.shields.io/badge/i18n-EN%20%7C%20AR%20%7C%20ZH%20%7C%20HI-06b6d4?style=flat-square" alt="Quad-lingual i18n" />
  <img src="https://img.shields.io/badge/SOUL%20Protocol-Muraqabah-10b981?style=flat-square" alt="SOUL Protocol" />
</p>

---

**AxiomID** (`https://www.axiomid.app`, with apex `https://axiomid.app` redirecting via `308`) is the primary web application, **AuraOS** desktop environment, and reference OpenIdentity/DID implementation for the **PAI Universe** (`pai-list`).

## Protocol & Architecture Landscape

| Layer / Spec | Purpose | Repository / Surface |
|---|---|---|
| **OpenIdentity** | Portable AI agent identity manifest & `did:axiom` spec | [`docs/openidentity/`](./docs/openidentity/) · [`pai-list/openidentity.md`](https://github.com/pai-list/openidentity.md) |
| **AuraOS Desktop (`/`)** | Quad-lingual (`en`, `ar`, `zh`, `hi`) browser shell with themes, native windows, and cyber defense center | [`src/components/os/`](./src/components/os/) |
| **W3C DID / KYA / VCs** | Ed25519 deterministic keys, Pi KYC human anchoring, verifiable credentials, TrustChain | [`src/lib/`](./src/lib/) · [`/api/did-document`](./src/app/api/did-document/route.ts) |
| **MCP & Agent Discovery** | `/.well-known/agent-card.json`, `/.well-known/openidentity`, `/llms.txt`, `/agent.json`, `/mcp.json` | [`src/app/.well-known/`](./src/app/.well-known/) · [`public/.well-known/`](./public/.well-known/) |

## AuraOS Desktop Capabilities

- **5 Procedural Canvas Themes (`src/lib/wallpapers.ts`)**: `aurora`, `deep-space`, `neon-grid`, `ocean`, and `axiom-void`, complete with reactive ambient orbs, constellation particle links, right-click/`Shift+F10` wallpaper picker, and a top `StatusBar` theme switcher button.
- **Native Interactive OS Windows (`src/components/os/DesktopWindowManager.tsx`)**:
  - **AI Agents** (`/dashboard` + endpoint health probes across `/agent.json`, `/llms.txt`, `/mcp.json`, `/api/telemetry`)
  - **PAI Gspace** (`https://gspace.axiomid.app` + live `/api/telemetry` GWT sync and 7-layer broadcast panel)
  - **AI Notes** (`/memory` + local bitemporal 7-layer notes)
  - **AI Terminal** (`/harness` + command shell: `help`, `status`, `truth-check`, `evals`, `sandbox`, `memory`, `agents`, `gspace`, `clear`)
  - **Subdomains Explorer** — searchable, categorized directory of **16 live `*.axiomid.app` portals**
  - **Cyber Defense Center (`SecurityCenter.tsx`)** — 4-team simulation and desktop notification feed
- **Planned Desktop Tiles (`Soon` badge)**: `AI Code Editor`, `AI File Manager`, `AI Automation`, `AI Autopilot`, and `AI Assistant` are UI placeholders that trigger an informational toast until implemented.

## App Router Pages & Endpoints (Verified on Disk)

The repository currently contains **35 Next.js App Router pages** (`src/app/**/page.tsx`) and **79 route handlers** (`src/app/**/route.ts`):

### Key Pages

| Route | Purpose |
|---|---|
| `/` | AuraOS Sovereign AI Desktop (`en` / `ar` / `zh` / `hi`) |
| `/harness` · `/memory` | Standalone views for AI Terminal (Harness Forge) and 7-Layer AI Notes |
| `/claim` · `/onboarding` | Identity claim and 4-step Pi KYC onboarding flows |
| `/dashboard` · `/dashboard/settings` · `/dashboard/marketplace` | Authenticated control center, VC settings, and skills marketplace |
| `/passport/[slug]` · `/agent/[username]` | Public verifiable passport and agent profiles |
| `/explorer` · `/leaderboard` | Agent identity directory and XP leaderboard |
| `/plans` · `/pricing` · `/status` · `/diagnostics` · `/docs` | Compute tiers, system telemetry diagnostics, and documentation |
| `/pai/*` · `/about` · `/privacy` · `/terms` · `/offline` | PAI micro-pages, legal pages, and PWA offline shell |

### Discovery, `.well-known`, and API Routes

| Endpoint | Source | Purpose |
|---|---|---|
| `/.well-known/openidentity` | `src/app/.well-known/openidentity/route.ts` | Dynamic OpenIdentity manifest endpoint |
| `/.well-known/agent-card.json` | `src/app/.well-known/agent-card.json/route.ts` | Google A2A AgentCard descriptor (+ static `public/.well-known/{agents,llm,pai,security}.txt`) |
| `/.well-known/did.json` · `/.well-known/jwks.json` | `src/app/.well-known/{did.json,jwks.json}/` | W3C DID document & JSON Web Key Set |
| `/.well-known/oauth-authorization-server` · `oauth-protected-resource` | `src/app/.well-known/oauth-*/` | OAuth 2.1 / MCP protected resource metadata |
| `/llms.txt` · `/agent.json` · `/agentic.txt` · `/mcp.json` · `/auth.md` | `src/app/*/route.ts` | Machine-readable AI agent & MCP discovery descriptors |
| `/api/auth/*` · `/api/pi/*` · `/api/spend-request/*` | `src/app/api/` | Pi Browser auth, KYA verification, payments, and spend requests |
| `/api/passport/*` · `/api/agent/*` · `/api/agents/*` | `src/app/api/` | Passport publishing, agent activation, signing, and fleet listing |
| `/api/skills/*` · `/api/stamp/*` · `/api/vault/stake` · `/api/stellar/anchor` | `src/app/api/` | Skills registry, social stamps, vault staking, and Stellar memo anchoring |
| `/api/telemetry` · `/api/diagnostics/*` · `/api/sandbox/*` · `/api/health` · `/api/sync` · `/api/telegram` · `/api/voice` | `src/app/api/` | Global Workspace telemetry, error diagnostics, sandbox execution, sync, and integrations |

## Tech Stack (from `package.json` & `backend/`)

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 · React 19 · Framer Motion 12 · Tailwind CSS 4 |
| **Backend & Edge** | Vercel Serverless (`axiomid-app` under team `axiom-id`) · Cloudflare Worker ([`backend/`](./backend/)) |
| **Databases & State** | PostgreSQL via Prisma 6 (`prisma/`) · Cloudflare D1 (`DB`, `TRUTH_DB`) · Upstash Redis · TanStack Query v5 |
| **Storage & AI** | Cloudflare KV (`CACHE_KV`) · Vectorize · Workers AI (`@cf/meta/llama-3.1-8b-instruct-fp8`, `@cf/baai/bge-base-en-v1.5`) · Vercel Blob |
| **Auth & Crypto** | Pi Network SDK · Ed25519 keys · `did:axiom` W3C DID · scoped AIP tokens |
| **Testing** | **200** Jest unit/component test files in `src/__tests__/` · **15** Playwright E2E files in `e2e/` |

## Workspace Packages & Companion Worker

- **`packages/`**: `alphapi`, `crypto`, `did-integrity-guard`, `identity-did`, `iqra-policy-agent`, `llm-registry`, `pai-agent-app-models`, `pai-drv`, `reputation`, `sdk`, `sim-loop`.
- **`backend/`**: Standalone Cloudflare Worker (`wrangler.toml`: `axiomid-backend`, Durable Objects `PresenceDO` & `AgentStateDO`, D1 migrations, Truth RAG route `src/routes/truth-rag.ts`, MCP server `src/mcp/`, email router `src/workers/agent-email-router.ts`).

## Quick Start

```bash
git clone https://github.com/pai-list/AxiomID.git
cd AxiomID
npm install
cp .env.example .env.local
# Populate DATABASE_URL, PI_API_KEY, SOVEREIGN_KEY_SALT, and auth secrets
npx prisma migrate deploy && npx prisma generate
npm run dev
```

### Verification Commands

```bash
npm run lint        # ESLint across repository
npm run type-check  # tsc --noEmit
npm test            # Jest unit & component test suites (src/__tests__/)
```

### Backend Worker (`backend/`)

```bash
cd backend && npm install
npx wrangler d1 execute axiomid-edge --remote --file=./migrations/0001_init.sql
npx wrangler deploy
```

## Contributing & License

- See [`CONTRIBUTING.md`](./CONTRIBUTING.md) and [`AGENTS.md`](./AGENTS.md) for SOUL Protocol rules and IQRA commit chronicle formatting.
- **Application code**: Proprietary — All Rights Reserved © 2026 Mohamed Abdelaziz. See [`LICENSE`](./LICENSE).
- **`packages/crypto` and `packages/sdk`**: MIT licensed (see [`packages/crypto/LICENSE`](./packages/crypto/LICENSE) and [`packages/sdk/LICENSE`](./packages/sdk/LICENSE)).

<div align="center">
  <b>Built by <a href="https://github.com/Moeabdelaziz007">Mohamed Abdelaziz</a> under <a href="https://github.com/pai-list">PAI Universe (pai-list)</a></b>
</div>
