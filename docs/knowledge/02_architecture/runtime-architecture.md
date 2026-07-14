# Runtime Architecture — System Context & Component Interaction

- **Version:** 1.0
- **Generated:** 2026-07-13
- **Agent:** Delta (Phase 3)
- **Confidence:** 97%
- **Sources:** `src/middleware.ts`, `src/app/api/*/route.ts`, `backend/src/router.ts`, `backend/src/index.ts`, `backend/wrangler.toml`, `prisma/schema.prisma`, `next.config.ts`, `package.json`
- **Last Verified:** 2026-07-13

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Tier"
        PB[Pi Browser]
        WB[Web Browser]
        TG[Telegram]
    end

    subgraph "Edge Tier (Vercel)"
        CDN[Vercel CDN]
        MID[Next.js Middleware<br/>src/middleware.ts]
        API[API Routes<br/>src/app/api/*/route.ts]
        NEXT[Next.js SSR/SSG]
    end

    subgraph "Data Tier (Neon)"
        PG[(Neon PostgreSQL<br/>25 models)]
    end

    subgraph "Edge Compute (Cloudflare Workers)"
        CFW[Backend Worker<br/>backend/src/index.ts]
        DO[PresenceDO<br/>Durable Object]
        Q[harvest-queue<br/>Queue]
        KV[agent-kv<br/>KV Store]
        TRUTH[Truth Pipeline<br/>backend/src/router.ts]
    end

    subgraph "Cloudflare Storage"
        D1[(truth-db<br/>D1)]
        R2[(R2 Bucket)]
        VEC[(Vectorize<br/>axiomid-truth<br/>6236 vectors)]
    end

    subgraph "External Services"
        PI[Pi Network SDK]
        STELLAR[Stellar Network]
        SENTRY[Sentry Error Tracking]
        UPSTASH[Upstash Redis<br/>Rate Limiting]
        AI[Workers AI<br/>bge-base-en-v1.5]
    end

    PB --> CDN
    WB --> CDN
    TG --> API
    CDN --> MID
    MID --> API
    MID --> NEXT
    API --> PG
    API --> CFW
    API --> PI
    API --> STELLAR
    API --> UPSTASH
    API --> SENTRY
    CFW --> DO
    CFW --> Q
    CFW --> KV
    CFW --> TRUTH
    CFW --> R2
    TRUTH --> D1
    TRUTH --> VEC
    TRUTH --> AI
    DO --> KV
    Q --> CFW
```

## Request Flow (Typical Authenticated Request)

```mermaid
sequenceDiagram
    participant C as Client (Pi Browser)
    participant M as Middleware (src/middleware.ts)
    participant R as API Route (src/app/api/*/route.ts)
    participant P as Prisma (Neon)
    participant CF as Cloudflare Worker
    participant S as Stellar/Pi SDK

    C->>M: HTTP Request + Cookie
    M->>M: Host validation (subdomain check)
    M->>M: CORS check (4 origins)
    M->>M: JWT session verify
    M->>M: Set user context headers
    M->>R: Forward with user context

    R->>R: Rate limit check (Upstash Redis)
    R->>R: Auth check (requireAuth)
    R->>R: Zod input validation
    R->>P: Prisma query/mutation

    alt Needs Cloudflare Backend
        R->>CF: HTTP call to worker
        CF->>CF: Route to handler (router.ts)
        CF->>CF: DO/KV/D1 access
        CF-->>R: Response
    end

    alt Needs External Service
        R->>S: Pi SDK / Stellar call
        S-->>R: Response
    end

    R->>R: Logger.info structured log
    R-->>C: apiSuccess(data) or apiError(message)
```

## Component Responsibilities

### Vercel Tier (Next.js)
| Component | File | Responsibility |
|-----------|------|---------------|
| Edge Middleware | `src/middleware.ts` | CORS, host validation, JWT auth, cookie management |
| API Routes | `src/app/api/*/route.ts` | Request handling, validation, orchestration |
| Next.js SSR | `src/app/**/page.tsx` | Server-side rendering of pages |
| Sentry | `next.config.ts` | Error tracking in Edge/Server/Client |

### Cloudflare Workers Tier
| Component | File | Responsibility |
|-----------|------|---------------|
| Entry Point | `backend/src/index.ts` | Fetch handler, Durable Object export, Queue consumer |
| Router | `backend/src/router.ts` | Request routing (trust, skills, agent, MCP, search, truth) |
| PresenceDO | `backend/src/index.ts:5-50` | User presence tracking via Durable Object |
| Truth Pipeline | `backend/src/router.ts:truth` | RAG pipeline: embed → Vectorize search → D1 fetch → AI generate |

### Data Tier
| Store | Type | Role |
|-------|------|------|
| Neon PostgreSQL | Primary DB | All writes, 25 models, Prisma ORM |
| Cloudflare D1 | Edge DB | Synced subset for low-latency reads |
| Cloudflare R2 | Object Store | Asset storage (passport images, uploads) |
| Cloudflare KV | Cache | Agent dispatch caching |
| Upstash Redis | Rate Limiter | Distributed rate limit counters |

### External Integrations
| Service | Protocol | Purpose |
|---------|----------|---------|
| Pi Network SDK | HTTP + JS SDK | Authentication, payments, ads, KYC, sharing |
| Stellar Network | Horizon REST API | Credential hash anchoring (anchorVcHash) |
| Workers AI | CF Binding | Embedding generation (bge-base-en-v1.5) |
| Vectorize | CF Binding | Semantic vector search |
| Sentry | HTTP | Error tracking and performance monitoring |
