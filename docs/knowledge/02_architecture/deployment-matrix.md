# Deployment Matrix — Target Environments

- **Version:** 1.0
- **Generated:** 2026-07-13
- **Agent:** Delta (Phase 3)
- **Confidence:** 97%
- **Sources:** `backend/wrangler.toml`, `next.config.ts`, `package.json`, `.env.local`, `AxiomID.Memory/PROJECT_STATUS.md`
- **Last Verified:** 2026-07-13

## Deployment Targets

| Target | Status | Type | Domain/URL | Region | Last Deploy | CI/CD |
|--------|--------|------|------------|--------|-------------|-------|
| **Vercel** | ✅ **Active** | Serverless (Edge + Functions) | `axiomid.app` | Global (Vercel Edge Network) | Continuous (main branch) | Vercel Git Integration |
| **Cloudflare Workers** | ✅ **Active** | Edge Compute (V8 Isolates) | `axiomid-backend.amrikyy.workers.dev` | Global (CF Network) | Manual via `wrangler deploy` | None configured |
| **Pi App Studio** | ⏳ **Planned** | Embedded Browser | TBD | N/A | Never | None |
| **Neon PostgreSQL** | ✅ **Active** | Serverless Postgres | `ep-misty-sea-atniw241-pooler` | US East (Virginia) | N/A (managed) | N/A |
| **Cloudflare D1** | ✅ **Active** | Edge SQL | Bound to Worker | Global | With Worker deploy | Manual |
| **Cloudflare R2** | ✅ **Active** | Object Storage | Bound to Worker | Global | N/A (managed) | N/A |
| **Upstash Redis** | ✅ **Active** | Serverless Redis | Upstash REST API | US East | N/A (managed) | N/A |

## Vercel Configuration

| Property | Value |
|----------|-------|
| Project Name | `axiomid-app` |
| Framework | Next.js 16 |
| Build Command | `next build` |
| Output Directory | `.next` |
| Install Command | `npm ci` |
| Node.js Version | 22.x |
| Environment Variables | 15+ (see `.env.local` template) |
| Domains | `axiomid.app`, `*.axiomid.app` (subdomains) |
| Deploy Hooks | Push to `main` → auto-deploy |
| Preview Deployments | Per PR via `vercel` GitHub app |
| Analytics | Vercel Analytics enabled |
| Sentry | Source maps uploaded, error tracking |

### Environment Variables in Vercel

| Variable | Status | Scope |
|----------|--------|-------|
| `DATABASE_URL` | ✅ Set | All |
| `PI_API_KEY` | ✅ Set | All |
| `PI_TOKEN_ENCRYPTION_KEY` | ✅ Set | All |
| `OAUTH_STATE_SECRET` | ✅ Set | All |
| `AUTH_TOKEN_SECRET` | ✅ Set | All |
| `AUTH_SECRET` | ✅ Set | All |
| `CRON_SECRET` | ✅ Set | All |
| `ISSUER_PRIVATE_KEY` | ✅ Set | Production |
| `ISSUER_PUBLIC_KEY` | ✅ Set | Production |
| `UPSTASH_REDIS_REST_URL` | ✅ Set | All |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ Set | All |
| `NEXT_PUBLIC_SITE_URL` | ✅ Set | All |
| `SANDBOX_AUTH_BYPASS` | ❌ Not in Prod | Production (should be absent) |
| `SENTRY_DSN` | Presumed set | All |
| `CVA_API_KEY` | Presumed set | All |

## Cloudflare Workers Configuration

| Property | Value |
|----------|-------|
| Worker Name | `axiomid-backend` (inferred) |
| Entry Point | `backend/src/index.ts` |
| Router | `backend/src/router.ts` |
| Compatibility Date | `2024-10-01` |
| Bindings | 7 (see topology doc) |
| Deploy Command | `wrangler deploy` (from `backend/` dir) |
| Triggers | HTTP (fetch), Queue consumer |
| Durable Object Classes | `PresenceDO` |
| Queue Producers | `harvest-queue` |

### Resources Provisioned

| Resource | Name | Status |
|----------|------|--------|
| Durable Object | `PresenceDO` | ✅ Active |
| Queue | `harvest-queue` | ✅ Active |
| KV Namespace | `agent-kv` | ✅ Active |
| D1 Database | `truth-db` | ✅ Seeded (114 chapters) |
| Vectorize Index | `axiomid-truth` | ✅ Seeded (6236 vectors, 768d) |
| R2 Bucket | AxiomID assets | ✅ Active |
| Workers AI | `@cf/baai/bge-base-en-v1.5` | ✅ Enabled |

## Neon PostgreSQL Configuration

| Property | Value |
|----------|-------|
| Project | `neon-coquelicof-field` (pooled) |
| Connection String | `postgresql://neondb_owner:***@ep-misty-sea-atniw241-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| Prisma Schema | `prisma/schema.prisma` |
| Models | 25 |
| Push Command | `npx prisma db push` |
| Migration Tool | Prisma Migrate |
| Compute | 0.25 vCPU (free tier) |
| Storage | 0.5 GB (free tier) |

## Pi App Studio (Planned)

| Property | Value |
|----------|-------|
| Platform | Pi App Studio |
| Status | ⏳ Planned — no artifacts |
| Requirements | Pi SDK v2.0 compatible, Pi Browser testing |
| Domain | TBD |
| Auth | Pi.authenticate() native |
| Blockers | Needs Vercel domain verification, Pi Browser E2E testing |

## Deployment Commands

```bash
# Vercel (auto-deploy on git push, manual trigger)
vercel --prod

# Cloudflare Worker (manual)
cd backend && npx wrangler deploy

# Prisma schema sync (after schema changes)
npx prisma db push
npx prisma generate

# Environment sync
vercel env pull .env.local
```

## Health Check Endpoints

| Target | URL | Expected Response |
|--------|-----|-------------------|
| Vercel (Next.js) | `GET https://axiomid.app/api/health` | `{ status: "ok", timestamp }` |
| Vercel (Status) | `GET https://axiomid.app/api/status` | DB connection status |
| Cloudflare Worker | `GET https://axiomid-backend.amrikyy.workers.dev/health` | `{ status: "ok" }` (presumed) |
| Neon DB | Via Prisma | Connection successful |

## Rollback Strategy

| Target | Method | RTO | RPO |
|--------|--------|-----|-----|
| Vercel | Vercel Dashboard → Rollback to previous deployment | < 2 min | N/A (stateless) |
| Cloudflare Worker | `wrangler rollback` | < 1 min | N/A (stateless) |
| Neon DB | Point-in-time recovery (7-day retention) | < 30 min | < 5 min |
| D1 | Manual backup/restore | < 15 min | Depends on backup freq |

## Monitoring & Alerting

| Service | Tool | Metric |
|---------|------|--------|
| Application Errors | Sentry | Error count, crash rate |
| Vercel Analytics | Vercel Dashboard | Request volume, response time |
| Worker Logs | `wrangler tail` | Real-time request/error log |
| Database | Neon Console | Connection count, query performance |
| Rate Limiting | Upstash Console | Rate limit hit count |

## Known Deployment Gaps

1. **No automatic Cloudflare Worker deployment** — Worker must be deployed manually. CI/CD pipeline should be added.
2. **No staging environment** — Vercel preview deployments test Next.js, but Cloudflare Worker has no staging target.
3. **Pi App Studio readiness** — No deployment artifacts, no domain verification, no Pi Browser E2E tests passing.
4. **Backup strategy undocumented** — D1 backups and Neon PITR are available but no automated backup schedule exists.
5. **No load testing results** — No benchmarks for concurrent user load against Neon or Cloudflare Worker.
