# AxiomID — Project Status & Knowledge Base

> **The single source of truth for the AxiomID project.**
> Updated: 2026-07-06 | Version: 0.2.0

---

## 1. What Is AxiomID?

AxiomID is the **Human Authorization Protocol** for AI agents and humans. Pi Browser auth, sovereign passports, verifiable identity, and agent governance — one experience.

**Core loop:** Pi Wallet → Claim Identity → Deploy Agent → Earn XP → Build Trust → Sovereign Status

---

## 2. Current State

| Metric | Value |
|--------|-------|
| **Version** | 0.2.0 |
| **Test Suites** | 168 passing |
| **Tests** | 3,272 passing |
| **API Routes** | 24+ |
| **Frontend Pages** | 13 public, 3 dashboard |
| **Tech Stack** | Next.js 16, React 19, Prisma 6, Tailwind 4, Framer Motion 12 |
| **Database** | PostgreSQL (Prisma) + D1 (edge) + Vectorize (semantic) |
| **Auth** | Pi Network SDK + Ed25519 sovereign keys |
| **CI/CD** | GitHub Actions → Vercel |
| **Open PRs** | 2 (#292 MVP bugs, #293 CI fixes) |
| **Open Issues** | 6 (#153, #221-#225) |

---

## 3. What's Done

### Phase 0: Cognitive Stabilization ✅
- Fixed 6 critical bugs before building UMI
- Enum unification (3 conflicting enums → single `vocab.py`)
- Parser unification (4 independent parsers → single `SharedMDParser`)

### Phase 1: UMI Core ✅
- Single Cognitive Contract for Memory Access
- File adapter for Amrikyy.Memory files
- Router, write, query, resolve services
- 7 tests, all passing

### Phase 2: CUK Core ✅
- Memory Pipeline (event-sourced)
- Append-only ledger, truth graph, conflict resolver

### Phase 3: CIFA ✅
- Cognitive Integrity Firewall Agent
- Truth invariants on all memory operations

### Phase 4A-C: Hard Gate + Dumb Executor + Truth Lens ✅
- Write operations through UMI router
- Simple append for writes, complex logic in query path
- CIFA enforces truth invariants

### PR #288: Expert Auto-Labeler ✅
- 7-stage PR labeling pipeline
- Path-based, size-based, security-aware labeling

### PR #290: P0 Security Fixes ✅
- `agentId` populated on SkillExecution records
- Admin moderation wrapped in `$transaction`
- PEM→multibase DID conversion, mandatory key derivation
- `passportUrl` saved to DB after IPFS publish

### PR #291: Dependabot + Code Scanning ✅
- 14 of 19 vulnerabilities resolved
- ReDoS fix in ast-scanner.ts
- Code scanning false positives triaged

### PR #292: MVP Bugs (7 items) 🔄
- Bug 1: `.animate-slide-up` CSS class added
- Bug 2: KYC boolean check fixed
- Bug 3: PassportView i18n (7 hardcoded strings → `t()`)
- Bug 4: Polling cancelled flag (memory leak fix)
- Bug 5: DeployStep valid HTML (Link/button)
- Bug 6: Rate limiting on public agent API
- Bug 7: `role="tabpanel"` for accessibility

### PR #293: CI Fixes ✅
- Version reconcile (0.1.2 → 0.2.0)
- npm-publish `--provenance` flag (OIDC, no OTP)
- skill-quality `npm ci --ignore-scripts`

---

## 4. What's In Progress

| Task | Status | Branch |
|------|--------|--------|
| Phase 6: README Fix (8 discrepancies) | In Progress | `fix/readme-phase6` |
| Phase 7: E2E Execution | Pending | — |
| Phase 9: Issue Backlog | Pending | — |

---

## 5. What's Planned

### Near-term
- **Phase 7:** E2E test execution (build-first approach)
- **Phase 9:** Issue backlog triage (#221-#225, #153)
- **README:** Fix test counts, versions, routes, trust tiers

### Medium-term
- **Observability:** Metrics, tracing, logging
- **Performance:** Benchmark write throughput, query latency
- **Integration:** Connect to AxiomID for real-world usage
- **Documentation:** API docs, architecture diagrams

### Long-term
- **IQRA:** Deploy Cloudflare D1 + Vectorize (already seeded)
- **P8 DNS:** Add `*.axiomid.app` CNAME in Cloudflare
- **Pi Browser Testing:** Deploy to Vercel, domain verification

---

## 6. Architecture

### Route Inventory (24+)

**Public (13):**
- `/` Landing
- `/claim` Identity claim wizard
- `/passport/[slug]` Public passport viewer
- `/explorer` Discover agents
- `/leaderboard` Ranked trust view
- `/docs` Documentation
- `/status` Service health
- `/api/agent/public` Public agent info
- `/api/did-document` DID resolution
- `/api/health` Health check
- `/api/openapi.json` API spec
- `/api/passport/[slug]` Passport data
- `/api/status` Service status

**Authenticated (2):**
- `/api/auth/pi` Pi token verification
- `/api/auth/connect` Wallet connect

**Dashboard (3 tabs, not routes):**
- `/dashboard` Main dashboard
  - Identity tab
  - Marketplace tab
  - Settings tab

**API Routes (16+):**
- `/api/skills/[slug]/execute` Skill execution
- `/api/admin/skills/[id]` Admin moderation
- `/api/pi/payment/approve` Payment approval
- `/api/pi/payment/complete` Payment completion
- `/api/sync` Data sync
- `/api/sync/export` D1 export
- `/api/user/status` User profile
- `/api/action/claim` XP claims
- `/api/monitor` System monitoring
- `/api/leaderboard` Leaderboard data
- `/api/explorer` Explorer data
- `/api/truth` Truth RAG queries
- `/api/skills` Skills listing
- `/api/skills/tags` Skill tags

### Key Files

| File | Purpose |
|------|---------|
| `src/app/api/auth/pi/route.ts` | Pi authentication |
| `src/lib/auth-middleware.ts` | Auth middleware + hashToken |
| `src/lib/did-document.ts` | DID resolution + key derivation |
| `src/lib/trust.ts` | Trust score calculation |
| `src/lib/rate-limiter.ts` | Rate limiting (4 tiers) |
| `src/lib/errors.ts` | API error responses |
| `src/lib/validators.ts` | Zod input schemas |
| `src/lib/pi-sdk.ts` | Pi SDK loader + sandbox detection |
| `schema.prisma` | Database schema |
| `prisma/seed.ts` | Database seeding |

### Database Models

| Model | Purpose |
|-------|---------|
| `User` | User accounts (piUid, tier, xp, level, passportUrl) |
| `Agent` / `UserAgent` | AI agents (status, mode, publicKey, permissions) |
| `Skill` | Marketplace skills |
| `SkillExecution` | Skill run history (agentId, input, output) |
| `PiPayment` | Payment records |
| `UserAction` | XP claims (compound unique) |
| `Wallet` | Connected wallets |
| `LedgerEntry` | XP ledger |

---

## 7. Key Decisions

| Decision | Rationale |
|----------|-----------|
| `useSyncExternalStore` for localStorage | SSR safety, no hydration mismatch |
| `determineSandboxMode()` cascade | Never hardcode sandbox, production safety |
| In-memory rate limiter | Beta simplicity, no Redis dependency |
| Pi token server-side verification | Never store tokens, never expose to client |
| Prisma `$transaction` for payments | Atomic operations, no partial writes |
| `$transaction` callback for admin moderation | Better control as logic grows |
| `agentId` instead of `userId` | SkillExecution schema has agentId, no FK |
| `pemToMultibase` minimal impl | No new deps, Node crypto + base58 |
| Mandatory key derivation in DID | Previously silent failure, now explicit 500 |
| `--provenance` for npm publish | OIDC-based, no OTP required |

---

## 8. Security Model

### Invariants (Never Violate)
1. No biometric data collection
2. No hardware dependency
3. Pi token verified server-side, never stored
4. HMAC state tokens for wallet connect
5. CORS isolation between subdomains
6. Rate limiting on all public endpoints
7. Prisma transactions for atomic operations
8. No `as any` in new code (strict TypeScript)

### Attack Surface
- Auth endpoints: Pi API verification + rate limit (5/min)
- Payment endpoints: Prisma transaction + idempotency
- Wallet endpoints: HMAC state + 5-min expiry
- Public endpoints: Rate limit (30/min anonymous)

---

## 9. Testing Strategy

### Test Types
- **Unit tests:** `src/__tests__/` — validators, auth, rate limiter, etc.
- **Integration tests:** `src/__tests__/api/` — route handlers
- **Component tests:** `src/__tests__/components/` — React components
- **E2E tests:** `e2e/` — Playwright (13 files, 156+ tests, 0 executed yet)

### Running Tests
```bash
npm test              # Full suite (3,272 tests)
npm run lint          # ESLint
npm run type-check    # TypeScript
npx playwright test   # E2E (requires build first)
```

### Test Conventions
- Standard Jest matchers only (no `.toBeFinite()`)
- Mock `useLanguage` for i18n tests
- Mock `useParams` for route tests
- Pi Browser `User-Agent` header for auth mocks
- Valid v4 UUIDs for Zod schema tests

---

## 10. Coding Conventions

### TypeScript
- `"strict": true` — never weaken
- No `as any` — use `unknown` for external data
- `path_aliases` (`@/` prefix)
- Zod validation at trust boundaries
- `apiError()` / `apiSuccess()` for responses

### React
- Server Components by default
- `"use client"` only for browser APIs/hooks
- Framer Motion with `[0.16, 1, 0.3, 1]` easing
- `useId()` for unique IDs (not `Math.random()`)

### API Routes
- `ctx: { params: Promise<{ slug: string }> }` (async params)
- Rate limit check at start
- `try/catch` with `logger.error()` in catch
- `waitUntil` for post-response work

### Git
- IQRA Chronicle format: `type(scope): description ۞`
- Build must pass before push
- No merge with failing CI
- Squash fix commits into cohesive units

---

## 11. Open Issues

| # | Title | Status | Priority |
|---|-------|--------|----------|
| #225 | Unify DID format to single path | Open | Medium |
| #224 | Zod validation for auth routes | Open | Medium |
| #223 | Verify Pi Network txid regex | Open | Low |
| #222 | POST /api/pi/payment/complete coverage | Open | Low |
| #221 | passportUrl never saved to DB | **Fixed in PR #290** | — |
| #153 | Production performance benchmarks | Open | Low |

---

## 12. File Navigation

| File | Content |
|------|---------|
| `PROJECT_STATUS.md` | This file — canonical project state |
| `SOUL.md` | Identity & ethical code (bilingual) |
| `axiomid_supreme_rules.md` | Sovereign rules & governance |
| `security_architecture.md` | Threat model & attack surface |
| `axiomid_backend.md` | Backend API reference |
| `repo_dna.md` | Codebase patterns & conventions |
| `codebase_map.md` | Architecture diagrams |
| `framework_design.md` | DID & passport framework |
| `topology.md` | Semantic memory topology |
| `HOME.md` | Navigation hub |
| `_SCHEMA.md` | Vault conventions |

---

*This document is the canonical source of truth for AxiomID project status. Update it after every significant change.*
