# AxiomID — Project Status & Knowledge Base

> **The single source of truth for the AxiomID project.**
> Updated: 2026-07-15 | Version: 0.1.2

---

## 1. What Is AxiomID?

AxiomID is the **Human Authorization Protocol** for AI agents and humans. Pi Browser auth, sovereign passports, verifiable identity, and agent governance — one experience.

**Core loop:** Pi Wallet → Claim Identity → Deploy Agent → Earn XP → Build Trust → Sovereign Status

---

## 2. Current State

| Metric | Value |
|--------|-------|
| **Version** | 0.1.2 |
| **Test Files** | 180 |
| **Test Cases** | 3,541 (passing, +1 from `it()`+`test()` blocks) |
| **Test Lines** | ~39,500+ |
| **E2E Files** | 15 (Playwright) |
| **E2E Lines** | ~2,500 |
| **API Route Dirs** | 27 |
| **Prisma Models** | 25 |
| **Tech Stack** | Next.js 16, React 19, Prisma 6, Tailwind 4, Framer Motion 12 |
| **Database** | PostgreSQL (Prisma) + D1 (edge) + Vectorize (semantic) |
| **Auth** | Pi Network SDK + Ed25519 sovereign keys |
| **CI/CD** | GitHub Actions → Vercel |
| **Open PRs** | 14 (see section 4) |
| **Open Issues** | 5 (#153, #222-#225) — #221 closed |

---

## 3. What's Done


### PR #288: Expert Auto-Labeler ✅
- 7-stage PR labeling pipeline (path, size, security, AI, test, docs, dependency)
- Merged to main

### PR #290: P0 Security Fixes ✅
- `agentId` populated on SkillExecution records
- Admin moderation wrapped in `$transaction`
- PEM→multibase DID conversion, mandatory key derivation
- `passportUrl` saved to DB after IPFS publish

### PR #291: Dependabot + Code Scanning ✅
- 14 of 19 vulnerabilities resolved via `npm audit fix`
- ReDoS fix in ast-scanner.ts
- Code scanning false positives triaged (8 documented)

### PR #292: MVP Bugs (7 items) 🔄 OPEN
- Bug 1: `.animate-slide-up` CSS class added
- Bug 2: KYC boolean check fixed (`=== "VERIFIED"`)
- Bug 3: PassportView i18n (7 hardcoded strings → `t()`)
- Bug 4: Polling cancelled flag (memory leak fix)
- Bug 5: DeployStep valid HTML (Link styled as button)
- Bug 6: Rate limiting on public agent API
- Bug 7: `role="tabpanel"` for accessibility

### PR #293: CI Fixes 🔄 OPEN
- npm-publish `--provenance` flag (OIDC, no OTP required)
- skill-quality `npm ci --ignore-scripts` (keeps integrity, skips native builds)

### PR #296: Knowledge Base + README 🔄 OPEN
- Amrikyy.Memory moved → AxiomID.Memory
- 24MB of dead weight deleted (old Python code, generated data, runtime state)
- AXIOMID_KNOWLEDGE_BASE.md deleted (968 lines — old Python agent OS)
- CODEBASE_WIKI.md deleted (112 lines — old Python agent OS)
- PROJECT_STATUS.md created as single source of truth
- README test count updated (3073 → actual)

### Vault Audit ✅
- 12 entirely old Amrikyy Python files deleted
- 7 partially correct files updated
- 4 mostly fine files verified

### RTA Phase 7 — Complete ✅ (Jul 14)
11 PRs merged in a single session:
- #314: CHANGELOG SemVer fix, #317: decision-history, #318: root cleanup
- #319: .gitignore, #320: .superpowers → .ai, #321: archive iqra-core
- #322: CONTRIBUTING.md, #323: npm workspaces, #324: OpenAPI spec
- #325: reference standards, PR-H: PR hygiene fix
- Plus: #326 (security), #328 (sanitize tests), #330 (N+1 perf), #331 (health typing)

### PR #341: README Badges ✅ (Jul 15)
- Project status badges (tests, TypeScript strict, SOUL compliance)
- API route listing in README matrix

### PR #343, #345: Test Coverage ✅ (Jul 15)
- Full Tiers utility test suite (119 lines, negative XP cases)
- Comprehensive Catalog schema test suite (196 lines, all card/link schemas)

### PR #344 Closed ❌ (Jul 15)
- Superseded by three new focused PRs (#346, #347, #348)

### PR #342 Closed ❌ (Jul 15)
- 0 files changed — empty commit, tree identical to parent

### PR #346: Dead Code Cleanup 🔄 OPEN (Jul 15)
- 24 files deleted (HeroDemo, 8 skeletons, 15 unused hooks)
- CI green (was failing — fixed HeroDemo mock refs in home-page + passport-hero tests)

### PR #347: Pi Verification Fallback 🔄 OPEN (Jul 15)
- KYC fallback: check RELEASED payments if Pi API returns false
- wallet_address scope added to authenticate()
- Full E2E payment lifecycle test

### PR #348: AGENTS.md Rebrand 🔄 OPEN (Jul 15)
- amrikyy → AxiomID rebranding in SOUL Protocol section
- New Agentic API First Protocol section added

### Security PRs (Jules) 🔄 OPEN
- #337: Hardcoded secrets in e2e + auth-middleware tests
- #339: Auth bypass + sandbox vulnerabilities
- #338: Trust delegation IDOR ✅ rebased (Jul 15)
- #340: Mass credential IDOR ✅ rebased (Jul 15, approved by human)

### Coverage PRs (Jules) 🔄 OPEN
- #332: Sanitize library ✅ rebased (Jul 15)
- #333: Trust.ts fallbacks
- #334: Auth-middleware 100%
- #335: vc.ts RSA branches
- #336: Tiers library ✅ rebased (Jul 15, .idea/workspace.xml stripped)

### Refactor PRs (Jules) 🔄 OPEN
- #327: console.log → console.info
- #329: Diagnostics error logging (needs human approval)

---

## 4. What's In Progress

| Task | Status | Branch |
|------|--------|--------|
| Dead Code Cleanup (#346) | Agent Review | `feat/dead-code-cleanup` |
| Pi Verification Fallback (#347) | Agent Review | `feat/pi-verification-fallback` |
| AGENTS.md Rebrand (#348) | Agent Review | `feat/agents-md-rebrand` |
| Security PRs (#337→#339→#338→#340) | Merge after CI (all rebased) | Various Jules branches |
| Coverage PRs (#336→#335→#334→#333→#332) | Merge after CI (332, 336 rebased) | Various Jules branches |

---

## 5. What's Planned

### Near-term
- **Security Group Merge:** #337 → #339 → #338 (rebase) → #340 (rebase)
- **Refactor Group Merge:** #327, #329
- **Coverage Group Merge:** #336 (rebase) → #335 → #334 → #333 → #332 (rebase)

### Medium-term
- **Zod Validation:** Add to `/api/agent/public` (CodeRabbit request)
- **Retry-After Header:** Add to 429 responses (CodeRabbit request)
- **Observability:** Metrics, tracing, logging
- **Performance:** Benchmark write throughput, query latency

### Long-term
- **IQRA:** Deploy Cloudflare D1 + Vectorize (already seeded)
- **P8 DNS:** Add `*.axiomid.app` CNAME in Cloudflare
- **Pi Browser Testing:** Deploy to Vercel, domain verification

---

## 6. Architecture

### Route Inventory (27 API dirs)

**Public:**
- `/` Landing
- `/claim` Identity claim wizard
- `/passport/[slug]` Public passport viewer
- `/explorer` Discover agents
- `/leaderboard` Ranked trust view
- `/docs` Documentation
- `/status` Service health
- `/dashboard` Main dashboard (Identity, Marketplace, Settings tabs)

**API Routes (27 dirs):**
- `/api/admin` Admin operations
- `/api/agent` Agent CRUD
- `/api/agents` Agent listing
- `/api/auth` Pi authentication + wallet connect
- `/api/credential-status` Credential status
- `/api/daily-review` Daily review
- `/api/did-document` DID resolution
- `/api/emulate` Local emulators
- `/api/explorer` Explorer data
- `/api/health` Health check
- `/api/leaderboard` Leaderboard data
- `/api/og` OG image generation
- `/api/passport` Passport data
- `/api/pi` Pi payment + KYC
- `/api/presence` Agent presence
- `/api/sandbox` Secure sandbox execution (NDJSON streaming)
- `/api/skills` Skill marketplace
- `/api/social` Social features
- `/api/stamp` Stamp operations
- `/api/status` Service status
- `/api/stellar` Stellar anchoring
- `/api/sync` Data sync
- `/api/telegram` Telegram webhook
- `/api/upload` File upload
- `/api/user` User profile
- `/api/vault` Vault operations

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
| `src/lib/math-physics.ts` | Math/physics engine (2,068 lines) |
| `prisma/schema.prisma` | Database schema |

### Database Models (25)

| Model | Purpose |
|-------|---------|
| `User` | User accounts (piUid, tier, xp, level, passportUrl) |
| `UserAgent` | AI agents (status, mode, publicKey, permissions) |
| `PiPayment` | Payment records |
| `Action` | User actions |
| `XpLedger` | XP ledger |
| `AgentLog` | Agent activity logs |
| `Stamp` | Identity stamps |
| `Skill` | Marketplace skills |
| `SkillInstallation` | Skill installs |
| `SkillExecution` | Skill run history |
| `SkillPipeline` | Skill pipelines |
| `SkillPipelineStep` | Pipeline steps |
| `SkillReview` | Skill reviews |
| `SkillTag` | Skill tags |
| `SkillTagRelation` | Tag-skill relations |
| `SkillVersion` | Skill versions |
| `SkillModeration` | Admin moderation |
| `DelegatedTrust` | Trust delegation |
| `EphemeralDid` | Ephemeral DIDs |
| `SelfReviewLog` | Self-review audit |
| `HarvestResult` | Harvest results |
| `AgentPresence` | Agent presence status |
| `Claim` | Identity claims |
| `Stake` | Staking records |
| `SlashingEvent` | Slashing events |

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
- **E2E tests:** `e2e/` — Playwright (14 files, 156+ tests)

### Running Tests
```bash
npm test              # Full Jest suite
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
|:---|:-------|:-------|:--------|
| #225 | Unify DID format to single path | Open | Medium |
| #224 | Zod validation for auth routes | Open | Medium |
| #223 | Verify Pi Network txid regex | Open | Low |
| #222 | POST /api/pi/payment/complete coverage | Open | Low |
| #153 | Production performance benchmarks | Open | Low |

---

## 12. File Navigation

| File | Content |
|------|---------|
| `PROJECT_STATUS.md` | This file — canonical project state |
| `SOUL.md` | Identity & ethical code (bilingual) |
| `security_architecture.md` | Threat model & attack surface |
| `repo_dna.md` | Codebase patterns & conventions |
| `framework_design.md` | DID & passport framework |
| `HOME.md` | Navigation hub |
| `_SCHEMA.md` | Vault conventions |
| `vercel_labs_inspiration.md` | Vercel Labs patterns |
| `turboquant.md` | Research: KV cache quantization |
| `rust_go_brainstorming.md` | Research: Rust/Go migration |
| `simulation_and_selfplay.md` | Research: self-play simulation |

---

*This document is the canonical source of truth for AxiomID project status. Update it after every significant change.*
