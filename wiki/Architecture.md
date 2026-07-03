# Architecture

> Back to [Home](./Home) | See also: [API Reference](./API-Reference)

---

## System Overview

AxiomID is a **Next.js 16 full-stack application** with a **Cloudflare Worker** backend, deployed on **Vercel** (frontend) + **Cloudflare** (edge backend).

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│                                                             │
│  Pi Browser ◄──── Pi SDK v2.0 ────► Next.js 16 (React 19)  │
│  Modern Browser ◄──────────────────► Framer Motion 12       │
│                                     Tailwind 4              │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    API LAYER (Vercel)                        │
│                                                             │
│  /api/auth/*      Authentication (Pi OAuth)                 │
│  /api/agent/*     Agent lifecycle                           │
│  /api/passport/*  Passport CRUD + publishing                │
│  /api/skills/*    Marketplace CRUD + payments               │
│  /api/stamp/*     Verifiable Credentials                    │
│  /api/pi/*        Pi Network integration                    │
│  /api/stellar/*   Stellar VC anchoring                      │
│                                                             │
│  Prisma 6 ──── PostgreSQL (Ghost.build/Supabase)           │
│  Zod ────────── Input validation                            │
│  Upstash Redis ── Rate limiting (production)                │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│               EDGE BACKEND (Cloudflare Worker)              │
│                                                             │
│  itty-router ── Request routing                             │
│  D1 ──────────── axiomid-edge (edge-relational data)        │
│  D1 ──────────── truth-db (6236 Quran verses)              │
│  Vectorize ───── axiomid-truth (768-dim embeddings)        │
│  Workers AI ──── Llama 3.1 8B (Truth Q&A generation)       │
│  KV ──────────── CACHE_KV (edge caching)                   │
│  Durable Objects ─ PresenceDO (real-time presence)          │
│  Queues ──────── harvest-queue (background jobs)            │
│  MCP ─────────── Model Context Protocol (agent SDK)         │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  EXTERNAL SERVICES                          │
│                                                             │
│  Pi Network ──── Authentication, KYC, Payments, Ads         │
│  Stellar ─────── VC anchoring (testnet/mainnet)             │
│  Upstash ─────── Redis (rate limiting)                      │
│  Vercel Blob ─── File uploads                               │
│  Cloudflare R2 ── Image storage                             │
│  Sentry ──────── Error monitoring                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Authentication Flow

```
User (Pi Browser)
  │
  ├─► Pi SDK.authenticate() ──► Pi Network API ──► { user, token }
  │
  └─► POST /api/auth/pi ──► validate token ──► upsert User in PostgreSQL
                                                │
                                                └─► set session cookie
```

### Passport Claim Flow

```
User
  │
  ├─► Step 1: Connect Pi Wallet ──► POST /api/auth/connect
  │
  ├─► Step 2: Complete KYC/KYA ──► POST /api/pi/kya/verify
  │                                  └─► server-side Pi API check
  │
  └─► Step 3: Deploy Agent ──► POST /api/agent/activate
                                ├─► derive sovereign keypair
                                ├─► create DID
                                ├─► compute trust score
                                └─► return passport
```

### Trust Score Computation

```
User XP + Stamps + Tenure + Semantic Trust
  │
  └─► calculateTrustScore() in src/lib/trust.ts
        │
        ├─► Standard: XP × 0.7 + Stamps × 0.3
        └─► Advanced: XP × 0.5 + Stamps × 0.2 + Tenure × 0.1 + Semantic × 0.2
              │
              └─► clamp(0, 100)
```

### Skills Marketplace Flow

```
User
  │
  ├─► Browse skills ──► GET /api/skills
  │
  ├─► Install skill ──► POST /api/skills/[slug]/install
  │
  ├─► Pay for skill ──► POST /api/skills/[slug]/pay ──► Pi.createPayment()
  │
  └─► Execute skill ──► POST /api/skills/[slug]/execute
                         └─► sandboxed execution (AST scanning)
```

---

## Database Schema (Prisma)

| Model | Purpose |
|:---|:---|
| `User` | User accounts (wallet, XP, tier, DID) |
| `Stamp` | Verifiable Credentials |
| `XpLedger` | XP transaction history |
| `UserAgent` | Agent lifecycle management |
| `Skill` | Marketplace skills |
| `SkillVersion` | Skill version history |
| `SkillReview` | Skill reviews |
| `SkillInstallation` | Installed skills per user |
| `Delegation` | Agent delegation chains |

---

## Key Design Decisions

| Decision | Rationale |
|:---|:---|
| **Pi SDK browser-only** | Pi Network SDK requires browser environment, never import in server code |
| **Server-side trust computation** | Prevents client-side gaming/manipulation |
| **Ed25519 sovereign keys** | Ed25519 for performance + cryptographic security |
| **Stellar VC anchoring** | Tamper-proof on-chain verification via transaction memos |
| **Cloudflare Worker backend** | Edge execution for low-latency global access |
| **Prisma 6 + PostgreSQL** | Relational integrity for identity data |
| **D1 + Vectorize** | Edge-relational + semantic search for Truth RAG |
| **Upstash Redis** | Serverless rate limiting without cold start |

---

*→ [API Reference](./API-Reference)*
