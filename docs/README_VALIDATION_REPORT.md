# README Validation Report — Kimi K2 Version

## Summary

**52 claims validated** — 44 CONFIRMED, 8 DISPUTED

---

## CONFIRMED ✅ (44 claims)

### Tech Stack (14/17)
- ✅ PostgreSQL via Prisma (`provider = "postgresql"`)
- ✅ Redis/Upstash (`rate-limiter.ts`, `revocation-store.ts`)
- ✅ Cloudflare Workers (`backend/wrangler.toml`)
- ✅ Sentry (`error.tsx`, `global-error.tsx`)
- ✅ D3.js (`d3: ^7.9.0`)
- ✅ Prisma ORM (`prisma/schema.prisma`)
- ✅ Framer Motion (`framer-motion: ^12.42.2`)
- ✅ Tailwind CSS (`tailwindcss: ^4`)
- ✅ jose/JWT (`jose: ^5.9.6`)
- ✅ Zod (`zod: ^4.4.3`)
- ✅ Stellar blockchain (wallet types, explorer)
- ✅ `.env.example` exists
- ✅ React 19 (`react: 19.2.7`)
- ✅ Pi Network SDK integration

### Routes (6/10)
- ✅ `/` — Landing page
- ✅ `/passport/[slug]` — Passport viewer
- ✅ `/claim` — Claim wizard
- ✅ `/dashboard` — Dashboard (6 tabs)
- ✅ `/explorer` — Explorer & leaderboard
- ✅ `/docs` — Documentation
- ✅ `/.well-known/did.json` — DID resolution

### API Routes (3/7)
- ✅ `/api/health` — Health check
- ✅ `/api/status` — System status
- ✅ `/api/auth/pi` — Pi authentication

### Features (12/12)
- ✅ IqraMesh neural visualization (`IqraMesh.tsx`)
- ✅ Trust History Graph (`TrustHistoryGraph.tsx`)
- ✅ Skill Marketplace (`dashboard/marketplace/`)
- ✅ PiBrowserGuard component
- ✅ determineSandboxMode cascade
- ✅ Fail-closed auth
- ✅ Timing attack protection (`crypto.timingSafeEqual`)
- ✅ Pre-commit validation script
- ✅ 6 dashboard tabs (Home, Identity, Skills, Wallet, Memory, Settings)

### Trust Score (3/3)
- ✅ Dual-calculation mode (Standard + Advanced)
- ✅ Standard formula: `xpScore * 0.7 + stampScore * 0.3`
- ✅ Advanced formula: `xp*0.5 + stamps*0.2 + tenure*0.1 + semantic*0.2`

### SDK (2/2)
- ✅ `@axiomid/sdk` exists (`packages/sdk/`)
- ✅ `@axiomid/crypto` exists (`packages/crypto/`)
- ✅ `getTrustScore()` and `verifyPassport()` methods

### Documentation (6/6)
- ✅ `SECURITY.md`
- ✅ `SECURITY_AUDIT.md`
- ✅ `docs/PI_SANDBOX_TESTING.md`
- ✅ `docs/IQRA.md`
- ✅ `docs/SOUL.md`
- ✅ `AGENTS.md`
- ✅ `CONTRIBUTING.md`
- ✅ LICENSE (proprietary, copyright 2026)
- ✅ `public/openapi.json`

---

## DISPUTED ❌ (8 claims)

### 1. Test count: "3073 tests" → Actual: **3226 tests**
**Impact:** Low — count is higher than claimed (underreporting)
**Fix:** Update badge to `3226`

### 2. Test suites: "134 suites" → Actual: **165 suites**
**Impact:** Low — count is higher than claimed
**Fix:** Update in verification section

### 3. Next.js version: "Next.js 15" → Actual: **Next.js 16**
**Impact:** Medium — outdated tech claim
**Fix:** Update badge to `Next.js 16`

### 4. "tRPC/Hono" in architecture diagram → **Neither found**
**Impact:** Medium — incorrect technology claim
**Fix:** Remove tRPC/Hono reference. API routes use Next.js App Router handlers directly.

### 5. Dashboard sub-routes (`/dashboard/iqra`, `/dashboard/trust`, `/dashboard/skills`, `/dashboard/memory`) → **These are tabs, not routes**
**Impact:** High — users clicking these links would 404
**Fix:** Remove sub-route entries. Dashboard is a single page with tab navigation.

### 6. API routes (`/api/passport/[did]`, `/api/pi/payment`, `/api/pi/verify`, `/api/auth/session`) → **Paths don't match actual routes**
**Impact:** High — developers following API docs would get 404s
**Fix:** Update to actual paths:
- `/api/passport/[did]` → doesn't exist (passport data is in `/api/stamp/`, `/api/credential-status/`, `/api/did-document/`)
- `/api/pi/payment` → `/api/pi/payment/complete`
- `/api/pi/verify` → `/api/pi/kya/verify` or `/api/pi/ads/verify`
- `/api/auth/session` → doesn't exist (session managed client-side via cookies)

### 7. Trust tiers: "Sovereign/Elite/Verified/Standard/Basic/New" → Actual: **Sovereign/Citizen/Validator/Visitor**
**Impact:** High — incorrect tier names and ranges
**Fix:** Update to actual tiers from `src/lib/tiers.ts`:
- Visitor (0 XP)
- Citizen (100 XP)
- Validator (500 XP)
- Sovereign (1000 XP)

### 8. Soul System "6 Ethical Gates" → **Not implemented in code**
**Impact:** Medium — aspirational spec, not implemented
**Fix:** Add disclaimer: "The Soul System is a design specification documented in `AGENTS.md` and `docs/SOUL.md`. Implementation is planned for future phases."

### 9. `portless` in package.json → **Not found as dependency**
**Impact:** Low — portless is a global tool, not a project dependency
**Fix:** Clarify in README: "Install `portless` globally: `npm install -g portless`"

### 10. `public/readme-assets/` directory → **Does not exist**
**Impact:** High — all image references in README are broken
**Fix:** Either create the directory with images, or use external URLs

---

## Action Items

### P0 — Must Fix Before Publishing
1. [ ] Update test count badge: `3073` → `3226`
2. [ ] Update test suite count: `134` → `165`
3. [ ] Update Next.js badge: `15` → `16`
4. [ ] Remove tRPC/Hono from architecture diagram
5. [ ] Fix dashboard sub-routes (remove or clarify as tabs)
6. [ ] Fix API route paths to match actual implementation
7. [ ] Fix trust tier names (Sovereign/Citizen/Validator/Visitor)
8. [ ] Create `public/readme-assets/` directory with images OR use external URLs

### P1 — Should Fix
1. [ ] Add Soul System disclaimer (design spec, not implemented)
2. [ ] Clarify `portless` is global install, not project dependency
3. [ ] Add actual API route table from codebase
4. [ ] Remove `portless` from package.json claims
5. [ ] Fix the Advanced Multi-Dimensional mode description to match code
