<div align="center">
  <img src="./public/axiomid-banner-v2.jpg" alt="AxiomID Banner: Human Sovereign and AI Agent" width="100%" style="border-radius: 12px; margin-bottom: 20px;" />
</div>

<h1 align="center">
  AxiomID: The Portable Identity Manifest for AI Agents
</h1>

<p align="center">
  <em>Think of it as the USB descriptor for an AI agent — it tells other agents and systems who this agent is, where its resources live, and what it can do.</em>
</p>

<p align="center">
  <a href="https://axiomid.app"><b>Live App</b></a> ·
  <a href="https://axiomid.app/docs"><b>Documentation</b></a> ·
  <a href="https://axiomid.app/passport/demo"><b>Demo Passport</b></a> ·
  <a href="https://github.com/Moeabdelaziz007/AxiomID"><b>GitHub</b></a>
</p>

<p align="center">
  <a href="https://github.com/Moeabdelaziz007/AxiomID/actions"><img src="https://img.shields.io/github/actions/workflow/status/Moeabdelaziz007/AxiomID/ci.yml?branch=main&label=CI&style=flat-square" alt="CI" /></a>
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square" alt="Next.js" />
  <img src="https://img.shields.io/badge/Pi%20Browser-supported-8b5cf6?style=flat-square" alt="Pi Browser" />
  <img src="https://img.shields.io/badge/tests-1943%20passed-22c55e?style=flat-square" alt="Tests Passed" />
  <img src="https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square" alt="TypeScript Strict" />
  <img src="https://img.shields.io/badge/SOUL%20Protocol-compliant-emerald?style=flat-square" alt="SOUL Compliant" />
  <img src="https://img.shields.io/badge/OpenIdentity-v0.1-6366f1?style=flat-square" alt="OpenIdentity v0.1" />
</p>

---

AxiomID is the reference implementation of the **OpenIdentity** protocol — an open, portable identity layer for AI agents. Before agents talk (A2A), before agents use tools (MCP), before agents transact — they need to know **who** they're dealing with. AxiomID answers that question.

### The Protocol Landscape

| Protocol | Layer | Purpose |
|----------|-------|---------|
| **A2A** (Google) | Interaction | How agents **talk** |
| **MCP** (Anthropic) | Capability | How agents **use tools** |
| **OpenIdentity** | Identity | **Who** agents **are** |
| **KYA** (Know Your Agent) | Trust | How agents **prove** it |

## Read the Specs

- **[OpenIdentity Manifest](docs/openidentity/OpenIdentity.md)** — `/.well-known/openidentity.md` bootstrap format (Markdown + YAML frontmatter)
- **[KYA Protocol](docs/openidentity/KYA.md)** — Multi-provider verification chain for agent-human trust
- **[Agent Passport](docs/openidentity/AgentPassport.md)** — Full genome document at `/.well-known/passport.md`
- **[JSON Schema](docs/openidentity/openidentity.schema.json)** — Validation schema for all OpenIdentity resources

## What is available now

- **OpenIdentity specification v0.1** — The open standard for portable AI agent identity
- **KYA verification** — Pi Network as reference KYC provider; multi-provider architecture designed
- **Agent Passport** — Portable agent genome at `/.well-known/passport.md` with trust chain, capabilities, and memory layer references
- **A2A AgentCard** — `/.well-known/agent-card.json` for Google A2A discovery
- **Well-known endpoints** — `auth.md`, `skills.md`, `wallet.md`, `openidentity.md` under `/.well-known/`
- **Pi Browser auth** — Sign-in, KYC consent, and payment flows
- **Claim wizard** — Onboarding flow to create your agent identity
- **Dashboard** — Manage identity, stamps, KYA, wallet, and agent settings
- **Identity Explorer** — Discover and verify agents by capabilities and attestations
- **Spend Request** — Agentic Pi payments pipeline (agent requests, user approves, Pi SDK executes)
- **TrustChain** — Append-only hash chain for all agent actions
- **Truth RAG** — AI-powered Q&A over 6236 verses via Vectorize + Workers AI
- **MCP Server** — 10 tools for trust, presence, and identity management

## Routes

| Route | Purpose |
|:---|:---|
| `/` | Landing experience and entry point |
| `/claim` | Identity claim wizard |
| `/onboarding` | Onboarding flow for new users |
| `/passport/[slug]` | Public passport viewer |
| `/dashboard` | Authenticated dashboard |
| `/dashboard/settings` | User settings and VC viewer |
| `/agent/[username]` | Public agent profile |
| `/explorer` | Identity Explorer — discover and verify agents |
| `/leaderboard` | Ranked trust and activity view |
| `/docs` | Product and API documentation |
| `/status` | Service health and dependency status |
| `/about` | About AxiomID |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |

### Well-Known Endpoints

| Endpoint | Format | Purpose |
|:---------|:-------|:--------|
| `/.well-known/openidentity.md` | Markdown + YAML | Bootstrap identity manifest |
| `/.well-known/passport.md` | Markdown + YAML | Full agent genome |
| `/.well-known/agent-card.json` | JSON (A2A v1.0) | A2A AgentCard directory |
| `/.well-known/auth.md` | Markdown | Authentication methods |
| `/.well-known/skills.md` | Markdown | Platform skills |
| `/.well-known/wallet.md` | Markdown | Wallet capabilities |

### API Routes

| Endpoint | Purpose |
|:---|:---|
| `/api/auth/*` | Pi Browser authentication, connect, logout, state |
| `/api/passport/*` | Passport CRUD, publishing, verification |
| `/api/agent/*` | Agent identity, sign, activate, pause, manifest |
| `/api/agents` | List agents for the authenticated user |
| `/api/pi/*` | Pi payments, KYA claims, ad verification |
| `/api/spend-request` | Create, list, approve spend requests + SSE stream |
| `/api/health` | Health check |
| `/api/status` | Protocol metrics: users, agents, XP, payments |
| `/api/explorer` | Identity Explorer data and stats |
| `/api/leaderboard` | Top users ranked by XP |
| `/api/diagnostics/*` | Error capture and logs |
| `/api/sandbox/*` | Sandbox dev-token and code execution |
| `/api/stamp/*` | Stamp claiming |
| `/api/sync` | Edge-to-PostgreSQL sync |
| `/api/telegram` | Telegram bot integration |
| `/api/vault/stake` | Vault staking |
| `/api/credential-status` | Credential revocation check |
| `/api/upload/presign` | Presigned upload URLs |
| `/api/presence/heartbeat` | Presence heartbeat |

## Tech stack

| Layer | Technology |
|:---|:---|
| **Frontend** | Next.js 16 · React 19 · Framer Motion 12 · Tailwind 4 |
| **Backend** | Vercel Serverless · Cloudflare Workers |
| **Database** | PostgreSQL (Prisma 6) · D1 (edge sync) · Vectorize (semantic search) |
| **Cache** | Upstash Redis (rate limiting, session state) |
| **AI** | Workers AI — Llama 3.1 8B · BGE-base-en-v1.5 |
| **Auth** | Pi Network SDK · Ed25519 sovereign keys · W3C DID |
| **Storage** | Cloudflare KV · Vercel Blob |
| **State/Cache** | TanStack Query v5 (client-side cache) |
| **CI/CD** | GitHub Actions → Vercel · 1943+ tests |

## Quick start

```bash
git clone https://github.com/Moeabdelaziz007/AxiomID.git
cd AxiomID
npm install
cp .env.example .env.local
# Fill in: DATABASE_URL, PI_API_KEY, SOVEREIGN_KEY_SALT, auth secrets
npx prisma migrate deploy && npx prisma generate
npm run dev
```

Open http://localhost:3000.

### Pi Browser local HTTPS

The Pi SDK expects HTTPS in the browser. For local development, use portless:

```bash
npm install -g portless
portless axiomid next dev
# -> https://axiomid.localhost
```

### Backend (Cloudflare Worker)

```bash
cd backend && npm install
npx wrangler d1 execute axiomid-edge --remote --file=./migrations/0001_init.sql
echo "token" | npx wrangler secret put SHARED_SECRET_TOKEN_VERCEL_CF
npx wrangler deploy
```

## Verification and quality checks

```bash
npm run lint       # 0 errors, 0 warnings
npm run type-check # type check
npm test           # 1943+ tests
```

## Project structure

```
src/
  app/
    .well-known/   # OpenIdentity resources (openidentity.md, passport.md, agent-card, etc.)
    api/           # Route handlers (Next.js App Router)
    dashboard/     # Authenticated dashboard
    passport/      # Public passport viewer /passport/[slug]
  components/      # Shared UI components
  lib/             # Auth, crypto, Pi SDK, validators, utilities
  i18n/            # Translation files (en.json, ar.json)
prisma/            # Schema and migrations
docs/
  openidentity/    # Specification documents
    OpenIdentity.md
    KYA.md
    AgentPassport.md
    openidentity.schema.json
AxiomID.Memory/    # Knowledge base and design docs
```

## Trust Tiers

| Tier | XP | Access |
|:---|:---:|:---|
| **Visitor** | 0 | Limited. Basic read-only. |
| **Citizen** | 100 | Social stamps, basic agent access. |
| **Validator** | 500 | Agent delegation, advanced capabilities. |
| **Sovereign** | 1000 | Full trust, vault staking, vouching power. |

## What AxiomID Does

| Layer | What It Does |
|:---|:---|
| **OpenIdentity** | Portable identity manifest for AI agents (`/.well-known/openidentity.md`) |
| **Agent Passport** | Full genome document with trust chain, capabilities, memory references |
| **KYA** | Multi-provider verification linking agent → human → identity provider |
| **AgentCard (A2A)** | Directory of discoverable agents per Google A2A v1.0 |
| **Verifiable Credentials** | Cryptographically signed stamps (social, KYA, KYC) |
| **TrustChain** | Append-only hash chain for all agent actions |
| **MCP Server** | 10 tools for trust, presence, and identity management |
| **Truth RAG** | AI-powered Q&A over 6236 verses via Vectorize + Workers AI |
| **Soul System** | Six-gate ethical evaluation loop |

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). PRs require passing CI.

```bash
git checkout -b feat/my-feature
# make changes
npm test && npm run lint && npx tsc --noEmit
git commit -m "feat(scope): description ۞"
git push origin feat/my-feature
```

## License

- **Application code:** Proprietary — All Rights Reserved © 2026 Mohamed Abdelaziz. See [`LICENSE`](./LICENSE).
- **`@axiomid/sdk`** and **`@axiomid/crypto`:** MIT licensed. Open for community use.

## Built By

<div align="center">

**AxiomID** is built by **Mohamed Abdelaziz** ([@Moeabdelaziz007](https://github.com/Moeabdelaziz007)).

Built with passion in Cairo, Egypt.

<a href="https://github.com/Moeabdelaziz007/AxiomID/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Moeabdelaziz007/AxiomID" alt="Contributors" />
</a>

</div>

### Acknowledgments

**Pi Network** — For the authentication SDK and the vision of a human-centered web. Learn more at [minepi.com](https://minepi.com).

<div align="center">

<a href="https://minepi.com">
  <img src="https://img.shields.io/badge/Built%20with-Pi%20Network-8b5cf6?style=for-the-badge&logo=pi&logoColor=white" alt="Built with Pi Network" />
</a>
<a href="https://vercel.com">
  <img src="https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Deployed on Vercel" />
</a>
<a href="https://www.cloudflare.com">
  <img src="https://img.shields.io/badge/Powered%20by-Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Powered by Cloudflare" />
</a>
<a href="https://github.com/vercel/next.js">
  <img src="https://img.shields.io/badge/Built%20with-Next.js%2016-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Built with Next.js 16" />
</a>

</div>

---

<div align="center">

**[axiomid.app](https://axiomid.app)** · **[Claim your identity](https://axiomid.app/claim)** · **[Read the spec](docs/openidentity/OpenIdentity.md)**

<sub>Built with the belief that every human deserves a sovereign digital identity — and every agent deserves a verifiable one.</sub>

</div>
