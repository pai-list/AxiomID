# Architecture

## The Sovereign Stack

AxiomID is a multi-layer protocol:

1. **L1 — Sovereign Anchor (Pi Network)**: Proof of ownership, VC signing, economic settlement.
2. **L2 — Sovereign Edge (Cloudflare)**: Durable Objects for agent session state, Workflows for long-running missions, D1 for the edge event log.
3. **L3 — DX Layer (Vercel)**: Next.js 16 / React 19 for identity visualization and developer experience.

## Core Axioms

- **Persistence = Append-Only Log**: No mutations, everything is versioned.
- **Reads are Queries**: State is derived from the event log, never stored as "current state."
- **Capability-Based Access**: Access is granted via time-bound capability tokens, not broad sessions.

---

## Data Architecture

### Data Flow Overview

```
Pi SDK (Browser)          External APIs (Pi, Stellar, IPFS)
      │                            │
      ▼                            ▼
┌─────────────────────────────────────────┐
│          Next.js API Routes             │
│  (Vercel Functions, stateless)          │
└─────┬───────────────┬───────────────────┘
      │               │
      ▼               ▼
┌──────────┐   ┌──────────────┐
│  Prisma   │   │  Cloudflare  │
│  + Neon   │   │  Backend     │
│ (Primary) │   │  (Worker)    │
└────┬─────┘   └──────┬───────┘
     │                │
     ▼                ▼
┌──────────┐   ┌──────────────┐
│PostgreSQL│   │  D1 (Edge)   │
│  (Neon)  │   │  + Vectorize │
└──────────┘   └──────────────┘
     │                │
     └────────────────┘
           │ (sync job)
           ▼
    Upstash Redis (rate limiting, cache)
    Vercel Blob / R2 (media, passport exports)
    IPFS / Pinata (passport publishing)
    Stellar (VC anchoring, hashes in tx memos)
```

### Database: Prisma + Neon PostgreSQL

**Provider**: `postgresql` (Prisma 6)
**Host**: Neon Serverless PostgreSQL (pooled connection)
**Local Dev**: Uses `DATABASE_URL` pointing to Neon or local Postgres

#### Model Map (25 models)

| Domain | Models | Key Fields |
|--------|--------|------------|
| **Identity & KYC** | `User`, `KYCStatus` (enum) | piUid, did, walletAddress, stellarAddress, kycStatus, tier, xp |
| **Agents** | `UserAgent` | userId, nickname, avatar, status, mode, memory |
| **Payments** | `PiPayment`, `SpendRequest` | identifier, userId, amount, status, txid |
| **Actions & XP** | `Action`, `XpLedger` | userId, type, xp, hash, parentHash (hash chain) |
| **Stamps / VCs** | `Stamp` | userId, type, provider, xpAwarded (unique on user+type) |
| **Marketplace** | `Skill`, `SkillInstallation`, `SkillExecution`, `SkillPipeline`, `SkillReview`, `SkillTag`, `SkillVersion`, `SkillModeration` | slug, author, tier, status, price |
| **Trust & DIDs** | `DelegatedTrust`, `EphemeralDid` | delegator, delegate, did, status, expiresAt |
| **Edge** | `AgentPresence`, `HarvestResult`, `Claim` | agentId, status, data |
| **System** | `SelfReviewLog` | agentId, review, score |

### Cache Architecture

| Layer | Technology | Purpose | TTL |
|-------|-----------|---------|-----|
| **Edge Cache** | Vercel Runtime Cache | Regional API response caching | Per-route (tag-invalidatable) |
| **Client Cache** | TanStack Query | API response + mutation cache | `staleTime: 30s`, `gcTime: 5min` |
| **Rate Limiting** | Upstash Redis | Request rate limiting | Per-window (60s default) |
| **Session State** | Upstash Redis | Auth token validation | Token lifetime |

**Invalidation**: TanStack Query uses tag-based invalidation (`queryClient.invalidateQueries`). Vercel Runtime Cache uses `cache-tag` headers. No write-through cache — mutations always hit the origin.

### Edge Sync: D1 ↔ PostgreSQL

The Cloudflare Worker maintains a D1 database for edge-local data (harvest results, agent presence). A Vercel Cron job (`/api/sync`) runs periodically to merge D1 data into PostgreSQL using Prisma `upsert`.

```
D1 ──▶ /api/sync (Vercel Cron) ──▶ Prisma upsert ──▶ PostgreSQL
```

Sync is idempotent — `upsert` on unique constraints prevents duplicates. The job uses `Promise.allSettled` with chunking for throughput.

### Vectorize Semantic Search

Embedding pipeline uses `@cf/baai/bge-base-en-v1.5` (768 dims) via Cloudflare Workers AI:

```
Text ──▶ Workers AI embed ──▶ Vectorize index ──▶ D1 fetch ──▶ AI generation
```

The `axiomid-truth` index contains 6236 vectors from the Truth RAG pipeline (114 chapters of Arabic + English verses). Queries hit the Cloudflare Worker which embeds, searches, fetches from D1, and generates responses via Workers AI.

### Async Pipelines

| Pipeline | Trigger | Description |
|----------|---------|-------------|
| **Harvest** | Vercel Cron (`/api/harvest`) | Periodically collects agent data, stores in D1, syncs to PostgreSQL |
| **Perplexity** | API call (`/api/perplexity`) | On-demand web research, results stored in HarvestResult |
| **Embedding** | On data ingestion | Text → Vectorize index for semantic search |
| **Passport Publishing** | User action | Passport data → IPFS/Pinata → Stellar anchoring |

### Storage

| Type | Service | Usage |
|------|---------|-------|
| **Media** | Vercel Blob | Agent avatars, user uploads |
| **Images** | Cloudflare R2 | Passport images, scaled variants |
| **Passports** | IPFS (Pinata) | Public passport JSON, CID-based retrieval |
| **VC Anchors** | Stellar | SHA-256 hashes in transaction memos |

### Data Retention

No formal retention policy yet. Key principles:
- Event log (Action, XpLedger) is append-only — never deleted
- User data retained until account deletion
- Session/token data TTL-bound in Redis
- Edge (D1) data is ephemeral, synced to PostgreSQL for persistence
