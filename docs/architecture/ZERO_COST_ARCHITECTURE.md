# Zero-Cost Architecture: Ghost.build + Vercel + Cloudflare

## 🎯 Alignment with AxiomID

This architecture is not generic; it is specifically designed to support the **AxiomID Sovereign Identity Protocol** under strict zero-cost and edge-execution constraints. The stack directly serves:

1. **W3C DID Identity Layer**: Fast resolution and cryptographic verification distributed across Cloudflare Edge and Vercel Serverless.
2. **Pi-Based Auth & Payments**: Handled client-side via the Pi Browser (Pi SDK) with server-side validation on Vercel to ensure state integrity.
3. **Agent Passport Dashboard (IqraMesh, TrustHistoryGraph)**: Complex relationship mapping and event log queries are offloaded to Ghost.build (PostgreSQL), keeping frontend rendering lightweight.

---

## 🚫 Environment Constraints & Justifications

Building for the Pi Network ecosystem imposes unique limitations. We chose this specific stack because it elegantly navigates these constraints while maintaining a $0 operating footprint.

| Constraint Category | Limitation / Reality | Architectural Impact |
| :--- | :--- | :--- |
| **Pi Browser Environment** | WebKit-based, **no reliable Service Worker (SW) support**, runs in an iframe, no CSS `hover` interactions. | Strict reliance on Vercel SSG/ISR and Cloudflare Edge Caching instead of SW-based PWA caching. UI designed for touch targets (min 44px) and pure CSS/JS state instead of hover states. |
| **Network & Latency** | Users often on mobile networks; Pi Testnet/Mainnet API calls can introduce high latency. | Aggressive CDN caching. API calls to Pi servers are strictly managed server-side to avoid client timeouts and masking latency via optimistic UI updates. |
| **Zero-Cost Policy** | Absolute requirement: $0/month infrastructure cost until significant revenue is generated. | Exploit platform free tiers (Vercel Hobby, Cloudflare Free, Ghost.build Free). Architecture avoids any service requiring upfront credit card billing for core features. |

---

## 🧩 Strategy: Platform Arbitrage

Each platform has different free tier strengths. We exploit each for what it does best, keeping within realistic limits:

```
┌─────────────────────────────────────────────────────────────────┐
│                    ZERO-COST ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │   VERCEL    │    │  CLOUDFLARE │    │ GHOST.BUILD │        │
│  │   (Free)    │    │   (Free)    │    │   (Free)    │        │
│  ├─────────────┤    ├─────────────┤    ├─────────────┤        │
│  │ Frontend    │    │ Backend API │    │ PostgreSQL  │        │
│  │ SSR/SSG     │    │ Workers     │    │ Database    │        │
│  │ Edge Funcs  │    │ D1 (SQLite) │    │ TimescaleDB │        │
│  │ Cron Jobs   │    │ KV Store    │    │ 666MB free  │        │
│  │ Analytics   │    │ R2 Storage  │    │             │        │
```

### **Vercel Handles:**
- **Frontend App**: Next.js 16 / React 19 UI rendering.
- **Serverless Functions**: Lightweight API routes, Auth callbacks, webhook handlers.
- **Limits to Respect**: 100GB bandwidth, 1 daily cron job on the Hobby tier.

### **Cloudflare Handles:**
- **Backend Edge Compute**: Cloudflare Workers for heavy compute or long-running tasks.
- **Edge Storage**: D1 for session data, KV for global feature flags, R2 for static assets (avatars).
- **Security**: CDN global caching, WAF (bot protection), DDoS mitigation.
- **Limits to Respect**: 100K requests/day on the free tier.

### **Ghost.build Handles:**
- **Primary Database**: PostgreSQL for users, agents, stamps, payments, and all relational data requiring ACID transactions.
- **AI Agent Integration**: Native MCP (Model Context Protocol) support for direct agent database access.
- **Limits to Respect**: 666MB storage limit.

---

## 🚀 Comparative Stack & Future Paths

While this stack is highly optimized for current constraints, it is designed with future migration in mind. If we outgrow the free tiers (e.g., exceeding 100K req/day or 666MB DB), we have clear fallback paths:

1. **Vercel + Postgres SaaS (e.g., Neon or Supabase)**:
   - *Why*: If Ghost.build changes pricing or we need advanced branching (Neon) or built-in real-time/BaaS features (Supabase).
   - *Migration*: Since we use standard PostgreSQL and Prisma ORM, moving to Neon or Supabase requires zero application logic rewrites—only connection string updates.
2. **Cloudflare-Only Stack (Pages + D1)**:
   - *Why*: If we need to escape Vercel's compute limits entirely and fully embrace Edge SQLite (D1).
   - *Migration*: Moving Next.js to Cloudflare Pages requires edge-compatible routing adjustments and migrating relational data from Postgres to D1.

*Reference: This approach aligns with modern [Zero-Cost Architecture principles](https://leerob.io/blog/backend-architecture) which emphasize modularity and vendor decoupling at the data access layer.*

---

## 🔗 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         REQUEST FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User → Vercel Edge → Cloudflare CDN → Cloudflare Worker       │
│    │                                              │             │
│    │                                              ▼             │
│    │                                    ┌─────────────────┐    │
│    │                                    │  Cloudflare D1  │    │
│    │                                    │  (Session/Cache)│    │
│    │                                    └─────────────────┘    │
│    │                                              │             │
│    │                                              ▼             │
│    │                                    ┌─────────────────┐    │
│    │                                    │   Ghost.build   │    │
│    │                                    │  (PostgreSQL)   │    │
│    │                                    └─────────────────┘    │
│    │                                              │             │
│    ▼                                              ▼             │
│  Vercel Response ←────────────────────────────────────────────  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📈 Monthly Cost Breakdown (Current State)

| Service | Cost | Constraints & Limits |
|---------|------|----------------------|
| Vercel Hobby | $0 | 100GB bandwidth |
| Cloudflare Free | $0 | 100K req/day limit |
| Ghost.build Free | $0 | 666MB PostgreSQL storage |
| **Total** | **$0** | **Viable for early adoption & MVP phase** |

> **Note (SOUL Check):** This architecture provides a fully functional application for $0/month *only* within the bounds of these free tiers. Once user adoption scales significantly, paid tiers or self-hosted alternatives will be necessary.

---

## 🤖 AI Agent Integration (MCP)

Ghost.build's native MCP support enables direct AI agent database access:

### MCP Capabilities:
- **Direct Queries**: AI agents query the database without custom API development.
- **Schema Awareness**: Agents understand table structure dynamically.
- **Secure**: Row-level security enforced at the database level.

### Fast Forking Use Cases:
```bash
# Create test database in seconds (perfect for Agent sandboxes)
ghost fork axiomid-db --name test-agents
```
