<div align="center">
  <img src="./public/axiomid-banner-v2.jpg" alt="AxiomID Banner: Human Sovereign and AI Agent" width="100%" style="border-radius: 12px; margin-bottom: 20px;" />
</div>

<h1 align="center">
  AxiomID: The Human Authorization Protocol for AI Agents and Humans
</h1>

<p align="center">
  <em>Sovereign credentials, autonomous wallets, and dual-identity governance for the agentic web.</em>
</p>

<p align="center">
  <a href="https://axiomid.app"><b>Live App</b></a> ·
  <a href="https://axiomid.app/passport/demo"><b>Demo Passport</b></a> ·
  <a href="https://axiomid.app/leaderboard"><b>Leaderboard</b></a> ·
  <a href="https://github.com/Moeabdelaziz007/AxiomID"><b>GitHub</b></a> ·
  <a href="https://www.facebook.com/profile.php?id=61583477974464"><b>Facebook</b></a>
</p>

<p align="center">
  <a href="https://github.com/Moeabdelaziz007/AxiomID/actions"><img src="https://img.shields.io/github/actions/workflow/status/Moeabdelaziz007/AxiomID/ci.yml?branch=main&label=CI&style=flat-square" alt="CI" /></a>
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square" alt="Next.js" />
  <img src="https://img.shields.io/badge/Pi%20Browser-supported-8b5cf6?style=flat-square" alt="Pi Browser" />
  <img src="https://img.shields.io/badge/tests-3786%20passed-22c55e?style=flat-square" alt="Tests Passed" />
  <img src="https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square" alt="TypeScript Strict" />
  <img src="https://img.shields.io/badge/SOUL%20Protocol-compliant-emerald?style=flat-square" alt="SOUL Compliant" />
  <img src="https://img.shields.io/badge/status-closed%20beta-orange?style=flat-square" alt="Closed Beta" />
</p>

---

AxiomID is a Next.js application that combines Pi Network authentication, passport-style identity claims, and a lightweight governance layer for human-AI collaboration.

## What is available now

- Pi Browser sign-in and callback handling
- Demo and real identity claim flows
- Public passport pages with trust and badge metadata
- Authenticated dashboard with marketplace, settings, and sandbox playground
- Explorer, leaderboard, docs, and service status views
- API routes for auth, passport publishing, Pi payments, and health checks
- **Spend Request** — agentic Pi payments pipeline (agent requests, user approves, Pi SDK executes)
- **TrustChain** — append-only hash chain for all agent actions
- **Truth RAG** — AI-powered Q&A over 6236 verses via Vectorize + Workers AI
- **Dual-Identity Governance** — explicit separation and cooperation of Human Sovereign and AI Agent nodes, verified via the protocol

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
| `/explorer` | Discover agents and identities |
| `/leaderboard` | Ranked trust and activity view |
| `/docs` | Product and API documentation |
| `/status` | Service health and dependency status |
| `/diagnostics` | Debug and diagnostic tools |
| `/about` | About AxiomID |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/offline` | Offline fallback page |
| `/signin/callback` | Pi sign-in callback handler |

### API Routes

| Endpoint | Purpose |
|:---|:---|
| `/api/auth/*` | Pi Browser authentication, connect, logout, state |
| `/api/passport/*` | Passport CRUD, publishing, verification |
| `/api/agent/*` | Agent identity, sign, activate, pause, manifest |
| `/api/agents` | List agents for the authenticated user |
| `/api/agents/harvest` | Query Perplexity for real-time agent harvesting |
| `/api/pi/*` | Pi payments (approve, complete), KYA claims, ad verification |
| `/api/skills/*` | Skills marketplace (CRUD, search, install, execute, pay, review) |
| `/api/spend-request` | Create, list, approve spend requests + SSE stream |
| `/api/health` | Health check |
| `/api/status` | Protocol metrics: users, agents, XP, payments |
| `/api/explorer` | Live explorer data and stats |
| `/api/leaderboard` | Top users ranked by XP |
| `/api/diagnostics/*` | Error capture and logs |
| `/api/sandbox/*` | Sandbox dev-token and code execution |
| `/api/admin/*` | Admin skills moderation |
| `/api/stamp/*` | Stamp claiming |
| `/api/social/disconnect` | Social account disconnection |
| `/api/sync` | Edge-to-PostgreSQL sync |
| `/api/telegram` | Telegram bot integration |
| `/api/stellar/anchor` | Stellar trust anchoring |
| `/api/vault/stake` | Vault staking |
| `/api/did-document` | DID document resolution |
| `/api/credential-status` | Credential revocation check |
| `/api/upload/presign` | Presigned upload URLs |
| `/api/presence/heartbeat` | Presence heartbeat |
| `/api/daily-review` | Daily review trigger |
| `/api/user/status` | User status |
| `/api/emulate/*` | Service emulation (dev) |

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
| **CI/CD** | GitHub Actions → Vercel · 3786 tests |

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
npm test           # 3786 tests (some page tests need QueryClientProvider wrapper)
```

## Developer Tooling

| Tool | Purpose | Usage |
|------|---------|-------|
| **portless** | Stable HTTPS `.localhost` URLs for Pi Browser testing | `portless axiomid next dev` → `https://axiomid.localhost` |
| **emulate** | Local API emulators for deterministic CI tests | `npx emulate --service github` → `http://localhost:4001` |
| **kernel** | Headless browser smoke tests on critical flows | `kernel run qa:smoke --url https://axiomid-app.vercel.app` |
| **nostics** | Structured error codes with actionable fixes | Codes in `src/diagnostics/catalog.ts` |

> See `AGENTS.md` → "Dev Tools" section for full documentation.

## Project structure

```
src/
  app/
    api/           # Route handlers (Next.js App Router)
    dashboard/     # Authenticated dashboard
    passport/      # Public passport viewer
  components/      # Shared UI components
  lib/             # Auth, crypto, Pi SDK, validators, utilities
  i18n/            # Translation files (en.json, ar.json)
prisma/            # Schema and migrations
docs/              # Specs and architecture docs
AxiomID.Memory/    # Knowledge base and design docs
```

## Trust Tiers

| Tier | XP | Access |
|:---|:---:|:---|
| **Visitor** | 0 | Limited. Basic read-only. |
| **Citizen** | 100 | Social stamps, basic agent access. |
| **Validator** | 500 | Agent delegation, marketplace install. |
| **Sovereign** | 1000 | Full trust, vault staking, vouching power. |

## Trust Score

Every identity on AxiomID has a **Trust Score** built from verified stamps and experience points (XP):

**Basic** (when tenure/semantic data is unavailable):
$$\text{Trust Score} = \text{XP Score} \times 0.7 + \text{Stamp Score} \times 0.3$$

**Full** (with tenure and semantic trust data):
$$\text{Trust Score} = \text{XP Score} \times 0.5 + \text{Stamp Score} \times 0.2 + \text{Tenure Score} \times 0.1 + \text{Semantic Trust} \times 0.2$$

Trust decays over time (inactivity penalty) and is boosted by Stellar anchoring (+15%).

## What AxiomID Does

| Layer | What It Does |
|:---|:---|
| **DID** | `did:axiom` — W3C-compliant, self-sovereign identity per user |
| **Verifiable Credentials** | Cryptographically signed stamps (social, KYA, KYC) |
| **Trust Engine** | Physics-inspired algorithm with decay and anchoring |
| **Agent Passports** | Public identity cards with verification badges and trust scores |
| **Spend Request** | Agentic Pi payments — agent requests, user approves, Pi SDK executes |
| **TrustChain** | Append-only hash chain for all agent actions |
| **Skills Marketplace** | Install capabilities for agents |
| **Truth RAG** | AI-powered Q&A over 6236 verses via Vectorize + Workers AI |
| **Soul System** | Six-gate ethical evaluation loop |

## OpenIdentity Protocol

### What is OpenIdentity

**OpenIdentity** is a portable identity manifest specification for AI agents — think of it as a **USB descriptor for an AI agent**. It combines identity, human verification, roles, skills, MCP tools, A2A metadata, memory discovery links, wallet references, and authorization pointers into one secure, shareable file. Any compatible platform can read an OpenIdentity manifest and immediately understand what an agent is, who controls it, what it can do, and where its approved memory and tools live.

OpenIdentity was created by the same founder as AxiomID — [Mohamed Abdelaziz](https://github.com/Moeabdelaziz007) — and lives at [github.com/Moeabdelaziz007/openidentity.md](https://github.com/Moeabdelaziz007/openidentity.md).

> **Short version:** OpenIdentity is the discovery layer for AI agent identity.
>
> **USB metaphor:** Like a USB descriptor for an AI agent, OpenIdentity lets any compatible platform understand what the agent is, who controls it, what it can do, and where its approved memory and tools live.

### How AxiomID Uses OpenIdentity

AxiomID is the **reference implementation** of the OpenIdentity specification:

- Every agent on AxiomID gets an OpenIdentity manifest describing its identity, controller, capabilities, and approved resources.
- Manifests are served at the `/.well-known/openidentity` endpoint for machine and platform discovery.
- Other platforms can fetch a manifest to understand an agent *before* granting access or trusting its claims.
- The manifest format is portable — it works across GitHub, AxiomID profiles, websites, and agent runtimes.
- Structured fields are validated against the [OpenIdentity JSON Schema](https://github.com/Moeabdelaziz007/openidentity.md/blob/main/schema/openidentity.schema.json); the human-readable Markdown body is a first-class part of the format.

### did:axiom DID Method

AxiomID uses `did:axiom` as its **native DID method** — a W3C-compliant decentralized identifier method anchored to Pi Network with Ed25519 cryptographic keys.

| DID Form | Example | Use |
|:---|:---|:---|
| `did:axiom:pi:<username>` | `did:axiom:pi:moeabdelaziz007` | Human-readable human identity |
| `did:axiom:pi:<hash>` | `did:axiom:pi:a1b2c3d4e5f6a7b8` | Privacy-preserving (hashed) identity |
| `did:axiom:agent:<id>` | `did:axiom:agent:agt_33d7p` | AI agent identity |
| `did:axiom:issuer` | `did:axiom:issuer` | AxiomID credential issuer (signs VCs) |

Key properties:

- **W3C DID Core compliant** — conforms to the [W3C DID Core specification](https://www.w3.org/TR/did-core/).
- **Pi Network anchored** — Pi Network is the primary identity anchor for human DIDs; Pi wallet addresses can appear in service endpoints.
- **Ed25519 keys** — deterministic keypairs derived via `HMAC-SHA256(SOVEREIGN_KEY_SALT, piUid + agentId)`.
- **Optional Stellar anchoring** — VC hashes can be anchored to Stellar as transaction memos for additional tamper evidence (not required for resolution).
- **Resolvable** via the reference resolver: `https://axiomid.app/api/did-document?did={did}`.
- **Privacy-preserving** — the hashed DID form avoids exposing the username; DID documents contain no PII beyond the public key and service endpoints.

📖 Full spec: [did:axiom DID Method Specification v0.1](https://github.com/Moeabdelaziz007/openidentity.md/blob/main/spec/did-axiom-method-v0.1.md)

### Architecture: AxiomID ↔ OpenIdentity

```mermaid
graph LR
  OI[OpenIdentity Spec] --> |defines manifest format| AX[AxiomID App]
  AX --> |generates manifests for| AG[AI Agents]
  AX --> |resolves| DID[did:axiom DIDs]
  DID --> |anchored to| PI[Pi Network]
  AG --> |discovered via| OI
```

**How to read the diagram:** The OpenIdentity spec defines the manifest format. AxiomID (the reference implementation) generates OpenIdentity manifests for each AI agent it hosts and resolves `did:axiom` DIDs, which are anchored to Pi Network. Agents are then discovered by other platforms via their OpenIdentity manifest — closing the loop.

### OpenIdentity Manifest Example

A manifest for an AxiomID agent looks like this:

```yaml
openidentity: "0.1"
agent:
  id: "did:axiom:agent:agt_33d7p"
  name: "Axiom Assistant"
  type: "ai-agent"
controller:
  human:
    name: "Mohamed Abdelaziz"
    verification: "https://axiomid.app/passport/moeabdelaziz007"
capabilities:
  roles: ["research", "workflow-automation"]
  skills: ["identity-discovery", "memory-routing", "spend-request"]
verification:
  - type: "signed-claim"
    url: "https://axiomid.app/.well-known/openidentity/axiom-assistant.json"
mcp_tools:
  - type: "mcp"
    name: "axiom-tools"
    url: "https://mcp.axiomid.app"
discovery:
  memory:
    - label: "approved-public-memory"
      uri: "https://axiomid.app/memory/index.json"
      access: "public-read"
wallets:
  - type: "pi-wallet"
    url: "https://axiomid.app/wallet/moeabdelaziz007"
authorization:
  authorization_url: "https://axiomid.app/api/auth/authorize"
  scopes:
    - "read:public-profile"
    - "request:tool-access"
links:
  homepage: "https://axiomid.app"
  axiomid_profile: "https://axiomid.app/agent/axiom-assistant"
```

> **Security note:** A manifest MUST NOT contain private keys, passwords, bearer tokens, API keys, wallet seed phrases, or other secrets. Sensitive resources are *referenced*, never embedded. Consumers MUST verify signatures, domains, and issuer trust before relying on claims — an unsigned manifest is a discovery hint, not proof of authority.

See [`examples/`](https://github.com/Moeabdelaziz007/openidentity.md/tree/main/examples) for minimal, standard, and full manifest examples.

### OpenIdentity Links

- 📦 **Spec repository:** [github.com/Moeabdelaziz007/openidentity.md](https://github.com/Moeabdelaziz007/openidentity.md)
- 📖 **OpenIdentity v0.1 Specification:** [spec/openidentity-v0.1.md](https://github.com/Moeabdelaziz007/openidentity.md/blob/main/spec/openidentity-v0.1.md)
- 🔑 **did:axiom DID Method Spec:** [spec/did-axiom-method-v0.1.md](https://github.com/Moeabdelaziz007/openidentity.md/blob/main/spec/did-axiom-method-v0.1.md)
- 🧪 **Manifest examples:** [examples/](https://github.com/Moeabdelaziz007/openidentity.md/tree/main/examples)
- 🌐 **Frontend prototype:** [openidentity.md/frontend](https://github.com/Moeabdelaziz007/openidentity.md/tree/main/frontend)
- 🛠 **AxiomID app (reference implementation):** [axiomid.app](https://axiomid.app)

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

**[axiomid.app](https://axiomid.app)** · **[Claim your identity](https://axiomid.app/claim)**

<sub>Built with the belief that every human deserves a sovereign digital identity.</sub>

</div>
