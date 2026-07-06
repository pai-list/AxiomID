# D1 → Prisma Migration Plan

## Architecture Overview

AxiomID uses a **dual-database architecture**:

| Database | Purpose | Location |
|----------|---------|----------|
| **PostgreSQL (Prisma)** | Main database — Users, Agents, Payments, Skills, Trust | Vercel (db.prisma.io) |
| **D1 (Cloudflare)** | Edge database — Harvest, Presence, Delegations, Skill Installs | Cloudflare Workers |

## Why Dual Database?

1. **Performance**: Edge operations (harvest, presence) need low-latency access
2. **Compliance**: Cloudflare Workers can't use Prisma directly (requires Node.js APIs)
3. **Reliability**: D1 provides local data access at the edge

## D1 Tables → Prisma Migration

### Already Migrated to Prisma

| D1 Table | Prisma Model | Status |
|----------|--------------|--------|
| `trust_delegations` | `DelegatedTrust` | ✅ In Prisma |
| `skill_installs` | `SkillInstallation` | ✅ In Prisma |

### New Prisma Models (Added)

| D1 Table | Prisma Model | Status |
|----------|--------------|--------|
| `harvest_results` | `HarvestResult` | ✅ Added to schema |
| `agent_presence` | `AgentPresence` | ✅ Added to schema |

## Migration Steps

### Phase 1: Schema Consolidation (Current)
- [x] Add `HarvestResult` model to Prisma schema
- [x] Add `AgentPresence` model to Prisma schema
- [x] Create migration SQL file
- [ ] Apply migration to PostgreSQL

### Phase 2: Data Sync (Next)
- [ ] Create sync job between D1 and PostgreSQL
- [ ] Run initial data migration
- [ ] Verify data consistency

### Phase 3: Cloudflare Worker Update (Future)
- [ ] Update Worker to use PostgreSQL via REST API
- [ ] Or use Neon Serverless Driver for Workers
- [ ] Remove D1 dependency

### Phase 4: Cleanup (Final)
- [ ] Delete D1 database
- [ ] Remove D1 migrations
- [ ] Update wrangler.toml

## Current State

### D1 (Cloudflare)
- **Database ID**: `64c6f62f-0df0-455f-ba4f-c63a572e6663`
- **Binding**: `DB`
- **Tables**: harvest_results, agent_presence, trust_delegations, skill_installs

### Prisma (PostgreSQL)
- **Database**: `db.prisma.io:5432`
- **Tables**: 20+ models (User, Agent, Payment, Skill, etc.)
- **New**: HarvestResult, AgentPresence

## Migration SQL

```sql
-- Migration: Add HarvestResult and AgentPresence models
-- These replace the D1 edge tables with Prisma-managed PostgreSQL tables

-- Harvest results from Perplexity queries
CREATE TABLE IF NOT EXISTS "HarvestResult" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "citations" TEXT,
    "userDid" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HarvestResult_pkey" PRIMARY KEY ("id")
);

-- Indexes for HarvestResult
CREATE INDEX IF NOT EXISTS "HarvestResult_userDid_idx" ON "HarvestResult"("userDid");
CREATE INDEX IF NOT EXISTS "HarvestResult_createdAt_idx" ON "HarvestResult"("createdAt");

-- Agent presence tracking
CREATE TABLE IF NOT EXISTS "AgentPresence" (
    "agentId" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'offline',
    "lastHeartbeat" BIGINT,
    "metadata" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentPresence_pkey" PRIMARY KEY ("agentId")
);
```

## Notes

- D1 is required for Cloudflare Workers (edge operations)
- Prisma is required for Vercel (main application)
- Data sync ensures consistency between both databases
- Future: Use Neon Serverless Driver to connect Workers to PostgreSQL directly
