# AxiomID — Full MVP State Map & Roadmap
**Date:** 2026-07-03  
**Scope:** Pi Integration, Passport, DID, Marketplace, Payments — all E2E  
**Codebase:** 158 test files, 1943 tests, 57 API routes, 17 pages, 17 Prisma models

---

## 1. AUTH SYSTEM STATUS

### 1.1 Auth Middleware (`src/lib/auth-middleware.ts`) — ✅ WORKS
- Bearer token → Pi JWKS offline verification → Prisma user lookup → cache
- Dual sandbox bypass with NODE_ENV production guard
- Token revocation via `isTokenRevoked()` (Upstash Redis + in-memory failover)
- In-memory LRU cache (5-min TTL, 1000 max)
- Fallback: Pi API `GET /v2/me` with Pi Browser UA check

### 1.2 Auth Routes

| Route | Method | Auth? | Zod? | Logger? | Test? | Status |
|-------|--------|-------|------|---------|-------|--------|
| `/api/auth/pi` | POST | No (creates user) | No | No | ✅ | WORKS — registers user, creates DID |
| `/api/auth/state` | POST | No | No | No | ❌ No test | WORKS but UNTESTED |
| `/api/auth/connect` | POST | No | No | No | ❌ No test | WORKS but UNTESTED |
| `/api/auth/logout` | POST | Yes | No | No | ✅ | WORKS |

### 1.3 Pi SDK Auth Flow (`src/lib/pi-sdk.ts`) — ✅ WORKS
```
connectPi()
  → ensurePiInitialized() → Pi.init({version:"2.0", sandbox})
  → Pi.authenticate(["username","payments"], onIncompletePayment)
  → POST /api/auth/pi { accessToken, uid, username }
  → Server: Pi API verify → findOrCreateUser → createPiDid() → return user
  → Session: localStorage token + WalletContext
```

### 1.4 Auth Gaps
1. **No Zod validation on any auth route** — `validators.ts` has `PiAuthSchema` but routes don't use it
2. **auth/state and auth/connect untested** — low risk but no coverage
3. **No refresh token mechanism** — Pi token expires, no rotation
4. **Token revocation** — fail-closed is conservative (Redis unreachable → all tokens revoked)

---

## 2. DATABASE STATUS

### 2.1 Primary: PostgreSQL via Prisma (17 models)

| Model | Used By Routes | Status | Notes |
|-------|---------------|--------|-------|
| **User** | All auth routes | ✅ | DID, piUid, kycStatus, walletAddress |
| **UserAgent** | agent/* routes | ✅ | ACTIVE/PAUSED/INACTIVE/SLEEPING |
| **PiPayment** | payment/*, skills install | ✅ | PENDING/ESCROWED/RELEASED/REFUNDED |
| **Action** | stamp/*, social/* | ✅ | Hash-chained action log |
| **XpLedger** | stamp/*, payment/*, ads/* | ✅ | Running balance per entry |
| **Stamp** | stamp/* | ✅ | Social identity proofs |
| **Skill** | skills/* (full CRUD) | ✅ | 15 fields + 8 relations |
| **SkillInstallation** | skills/install | ✅ | skillId + agentId unique |
| **SkillExecution** | skills/execute | ✅ | Execution records |
| **SkillReview** | skills/review | ✅ | 1-5 rating |
| **SkillTag/TagRelation** | skills/tags | ✅ | Tag system |
| **SkillVersion** | skills/versions | ✅ | Auto-versioned on content change |
| **SkillModeration** | admin/skills | ✅ | PENDING/APPROVED/REJECTED |
| **SkillPipeline/Step** | (schema only) | 🟡 UNUSED | No API route consumes these |
| **DelegatedTrust** | trust chain | 🟡 UNUSED by frontend | Backend DelegationResolver exists |
| **EphemeralDid** | credential-status | 🟡 UNUSED | Model exists, zero code uses it |
| **Stake** | vault/stake | ✅ | Basic staking |
| **SlashingEvent** | (schema only) | 🔴 DEAD | Model defined, never created |
| **SelfReviewLog** | (schema only) | 🟡 UNUSED | No route touches it |
| **HarvestResult** | agents/harvest | ✅ | Edge data |
| **AgentPresence** | presence/heartbeat | ✅ | Edge data |
| **Claim** | auth/pi | ✅ | OAuth claim flow |

### 2.2 Edge: Cloudflare D1 (`axiomid-edge`)

| Table | Used By | Status | Notes |
|-------|---------|--------|-------|
| `harvest_results` | MCP harvest_query/result | ✅ | |
| `agent_presence` | MCP presence tools | ✅ | |
| `trust_delegations` | MCP trust_delegate/chain | ✅ | |
| `skill_installs` | MCP skill_list/install | ⚠️ | D1-only, NOT synced with PostgreSQL SkillInstallation |

### 2.3 Edge: Cloudflare D1 (`truth-db`)
- 114 chapters, 6236 vectors (bge-base-en-v1.5)
- Used by backend `truth-rag.ts` → Workers AI for semantic search
- Status: ✅ SEEDED, WORKS

### 2.4 DB Gaps
1. **D1 ↔ PostgreSQL split** — Skill installations exist in BOTH databases but NEVER synced. MCP shows D1 skills, marketplace shows PostgreSQL skills. **Critical for E2E.**
2. **3 dead models** — `SlashingEvent`, `SkillPipeline`/`SkillPipelineStep`, `SelfReviewLog` defined in schema but no code uses them
2. **EphemeralDid unused** — Full model, zero queries
4. **DelegatedTrust** — Backend uses D1 `trust_delegations`, Prisma model has no code reading it

---

## 3. FOCUS AREA: PI INTEGRATION — STATE MAP

### 3.1 Pi SDK (`src/lib/pi-sdk.ts`)

| Component | Status | Tests | Notes |
|-----------|--------|-------|-------|
| `loadPiSdk()` | ✅ WORKS | Indirect | Dynamic script loader |
| `determineSandboxMode()` | ✅ WORKS | ✅ | 6-tier cascade, all paths covered |
| `ensurePiInitialized()` | ✅ WORKS | ✅ | Handles stale init |
| `checkPiBrowser()` | ✅ WORKS | ✅ 7 tests | UA + iframe + hostname detection |
| `connectPi()` | ✅ WORKS | ✅ 12 tests | Full auth flow |
| `createPiPayment()` | ✅ WORKS | ⚠️ 1 test | Only tests "SDK not loaded" error |
| `showRewardedAd()` | ✅ WORKS | ❌ No test | Exists but NO UI calls it |
| `runWalletTest()` | ✅ WORKS | ❌ No test | Quick auth test |

### 3.2 Pi Authentication

| Component | Status | Tests | Notes |
|-----------|--------|-------|-------|
| `POST /api/auth/pi` | ✅ WORKS | ✅ 477 lines | Full: verify → createUser → DID |
| `POST /api/auth/logout` | ✅ WORKS | ✅ | |
| `POST /api/auth/state` | ✅ WORKS | ❌ No test | |
| `POST /api/auth/connect` | ✅ WORKS | ❌ No test | |
| `src/lib/pi-signin.ts` | ✅ WORKS | ✅ 414 lines | OAuth fallback flow |
| `src/lib/auth-middleware.ts` | ✅ WORKS | ✅ | 247 lines, JWKS + fallback + cache |
| `src/lib/oauth-state.ts` | ✅ WORKS | ✅ | Timing-safe HMAC |
| `src/lib/auth-tokens.ts` | ✅ WORKS | ✅ | JWKS verification |
| `src/lib/sandbox-token.ts` | ✅ WORKS | ✅ | Triple-gated dev bypass |
| `src/types/global.d.ts` | ✅ WORKS | — | `PiInstance`, `PiUser`, etc. |

### 3.3 Pi Sandbox

| Component | Status | Tests | Notes |
|-----------|--------|-------|-------|
| `src/lib/pi-sandbox.ts` | ✅ WORKS | ✅ | postMessage forwarding, iframe compat |
| `/api/sandbox/dev-token` | ✅ WORKS | ✅ | Triple-gated (NODE_ENV + env + loopback) |
| `determineSandboxMode()` | ✅ WORKS | ✅ | 6-tier cascade |
| `/api/sandbox/execute` | ✅ WORKS | ✅ | NDJSON streaming sandbox |

### 3.4 Pi KYC

| Component | Status | Tests | Notes |
|-----------|--------|-------|-------|
| `POST /api/pi/kya/verify` | ✅ WORKS | ✅ 517 lines | Full: Pi API verify → XP → tier → hash-chain |
| `POST /api/pi/kya/claim` | ✅ WORKS | ❌ No test | No Zod validation — accepts empty body |
| `src/lib/pi-kyc.ts` | ✅ WORKS | ✅ | `verifyKycServerSide()` |
| KYC consent native feature | ✅ WORKS | — | `requestKycConsent()` from pi-native-features |

### 3.5 Pi Ads

| Component | Status | Tests | Notes |
|-----------|--------|-------|-------|
| `POST /api/pi/ads/verify` | ✅ WORKS | ❌ **No test** | Ad verification, XP +10 |
| `showRewardedAd()` in pi-sdk | ✅ WORKS | ❌ No test | **No UI component calls this** |

### 3.6 Pi Native Features

| Component | Status | Tests | Notes |
|-----------|--------|-------|-------|
| `sharePassport()` | ✅ WORKS | Indirect | Pi native → navigator.share → clipboard |
| `requestKycConsent()` | ✅ WORKS | Indirect | Pi native consent dialog |

### 3.7 Pi Integration Gaps for MVP
1. 🔴 **`POST /api/pi/kya/claim` has no Zod validation** — accepts empty body
2. 🟡 **`POST /api/pi/payment/complete` has ZERO tests** — most critical payment route untested
3. 🟡 **`POST /api/pi/ads/verify` untested** — ad verification
4. 🟡 **No UI component calls `showRewardedAd()`** — ads API exists but no frontend
5. 🟢 **`Pi.init()` called twice** — in `ensurePiInitialized()` and `wallet-context.tsx`. Harmless but redundant.

---

## 4. FOCUS AREA: PASSPORT — STATE MAP

### 4.1 Passport Pages

| Page | Status | Tests | Notes |
|------|--------|-------|-------|
| `/passport/[slug]/page.tsx` | ✅ WORKS | ✅ 408 lines | SSR with OG metadata |
| `PassportView.tsx` | ✅ WORKS | ❌ No direct test | Client component, fetches API |
| `PassportHeader.tsx` | ✅ WORKS | — | Simple header |
| `error.tsx` | ✅ WORKS | ✅ 99 lines | With retry |
| `not-found.tsx` | ✅ WORKS | ✅ 71 lines | Localized 404 |
| `loading.tsx` | ✅ WORKS | — | Skeleton |

### 4.2 Passport API Routes

| Route | Status | Tests | Notes |
|-------|--------|-------|-------|
| `GET /api/passport/[slug]` | ✅ WORKS | ✅ 327 lines | Resolves by slug/wallet/did/Pi username |
| `POST /api/passport/[slug]/publish` | ✅ WORKS | ✅ 154 lines | VC + IPFS + Stellar (non-fatal) |
| `GET /api/passport/[slug]/verify` | ✅ WORKS | ❌ **No test** | Returns stamps + KYC status |

### 4.3 Passport Components (12 files)

| Component | Status | Tests | Notes |
|-----------|--------|-------|-------|
| `InteractivePassportCard.tsx` | ✅ WORKS | ✅ 459 lines | Dashboard card with tilt, export, share |
| `PassportKeyManager.tsx` | ✅ WORKS | ✅ 137 lines | DID copy + sign |
| `AgentPassport.tsx` | ✅ WORKS | ✅ 273 lines | Composes 8 section components |
| 9 section components | ✅ WORKS | Indirect | Avatar, Identity, Badges, Stats, Modules, etc. |
| `AgentQR.tsx` | ✅ WORKS | ❌ No test | QR code for DID |

### 4.4 Passport Export & Share

| Feature | Status | Tests | Notes |
|---------|--------|-------|-------|
| HTML-to-canvas export | ✅ WORKS | ✅ | html2canvas via InteractivePassportCard |
| OG image API | ✅ WORKS | ✅ 595 lines | `/api/og/passport` — 1200x630 ImageResponse |
| Pi native share | ✅ WORKS | Indirect | Fallback chain: Pi → navigator → clipboard |
| SBT minting button | 🟡 STUB | ✅ | Shows "Coming soon" toast, no actual minting |

### 4.5 Passport Gaps for MVP
1. 🔴 **`passportUrl` never updated by publish route** — Publish returns IPFS URL but NEVER saves to `user.passportUrl`. QuickLinksCard checks this field so "Published Passport" link never appears.
2. 🔴 **IPFS pinning is mock by default** — Without `PINATA_JWT`, CID is valid but not pinned. Passports appear "published" but content isn't accessible.
3. 🟡 **No publish button in dashboard** — InteractivePassportCard doesn't call publish route. Users can't publish their passport from UI.
4. 🟡 **No Arabic i18n for passport pages** — Not in translation coverage
5. 🟢 **`GET /api/passport/[slug]/verify` untested**

---

## 5. FOCUS AREA: DID — STATE MAP

### 5.1 DID Creation

| Function | Format | Status | Tests | Used By |
|----------|--------|--------|-------|---------|
| `createUserDid(id)` | `did:axiom:user-{uuid}` | ✅ WORKS | ✅ | stamp claim, passport (fallback), leaderboard |
| `createIssuerDid()` | `did:axiom:issuer` | ✅ WORKS | ✅ | VC signing |
| `createPiDid(uid)` | `did:axiom:axiomid.app:pi:{uid}` | ✅ WORKS | ✅ | Pi auth, KYA claim |
| `deriveDid()` | `did:axiom:user:{sha256}` | ✅ WORKS | ❌ **Untested** | Dev-only agent identity fallback |

### 5.2 DID Resolution

| Component | Status | Tests | Notes |
|-----------|--------|-------|-------|
| `src/lib/did-resolver.ts` | ✅ WORKS | ✅ | Returns `{did, kycStatus}` from Prisma |
| `src/lib/did-document.ts` | ✅ WORKS | ✅ | W3C-compliant builder |
| `GET /api/did-document` | ⚠️ BROKEN | ✅ | **User docs have NO public keys** — `buildDidDocument()` called without `publicKeyMultibase` |
| `GET /api/did-document (issuer)` | ✅ WORKS | ✅ | Has full key material |

### 5.3 Verifiable Credentials

| Credential Type | Status | Tests | Called By |
|----------------|--------|-------|-----------|
| `signSocialCredential` | ✅ WORKS | ✅ | stamp/claim route |
| `signPassportCredential` | ✅ WORKS | ✅ | passport/publish route |
| `signAgentAttestationCredential` | ✅ WORKS | ✅ | **🔴 NEVER CALLED** — dead code, no route uses it |
| Agent Manifest VC | ✅ WORKS | ✅ | agent/manifest route — **uses DIFFERENT proof type** (Ed25519Signature2018 vs 2020) |

### 5.4 Stellar Anchoring

| Function | Status | Tests | Notes |
|----------|--------|-------|-------|
| `computeVcHash()` | ✅ WORKS | ✅ | SHA-256 of canonicalized VC |
| `buildAnchorTransaction()` | ✅ WORKS | ✅ | Minimum XLM + memo |
| `submitAnchorTransaction()` | ✅ WORKS | ✅ | Horizon submission |
| `anchorVcHash()` | ✅ WORKS | ✅ | Full flow + XP reward |
| `verifyVcOnChain()` | ✅ WORKS | ✅ | Hash comparison |
| `POST /api/stellar/anchor` | ✅ WORKS | ✅ 8 tests | Authenticated, stores Stamp |

### 5.5 DID Gaps for MVP
1. 🔴 **User DID Documents have no public keys** — `GET /api/did-document?did=...` returns a document with empty `verificationMethod`. Non-functional for signature verification.
2. 🔴 **Dual DID formats** — `createUserDid` produces `did:axiom:user-{uuid}`, `createPiDid` produces `did:axiom:axiomid.app:pi:{uid}`. Stamp/passport routes use `createUserDid` as fallback — user can have two DIDs.
3. 🔴 **Agent Manifest uses different proof type** — `Ed25519Signature2018` vs `Ed25519Signature2020` in lib/vc.ts. Two parallel signing implementations.
4. 🟡 **`signAgentAttestationCredential` is dead code** — Fully implemented (6 tests) but never called from any route.
5. 🟡 **EphemeralDid model unused** — Full model in Prisma, zero code reads it.
6. 🟡 **`deriveDid()` untested**

---

## 6. FOCUS AREA: MARKETPLACE/SKILLS — STATE MAP

### 6.1 Skills API Routes (14 endpoints)

| Route | Status | Tests | Notes |
|-------|--------|-------|-------|
| `GET /api/skills` | ⚠️ **BROKEN** | ✅ | **`soulPrinciple` filter parsed but NEVER applied** to Prisma WHERE clause |
| `POST /api/skills` (create) | ✅ WORKS | ✅ | Zod + ManifestSchema + slug uniqueness |
| `GET /api/skills/[slug]` | ✅ WORKS | ✅ 493 lines | Detail with isInstalled, _count |
| `PATCH /api/skills/[slug]` | ✅ WORKS | ✅ | Auto-versioning on content change |
| `DELETE /api/skills/[slug]` | ✅ WORKS | ✅ | Cascading delete |
| `POST /api/skills/[slug]/install` | ✅ WORKS | ✅ **777 lines** | Payment gate + TOCTOU guard |
| `DELETE /api/skills/[slug]/install` | ✅ WORKS | ✅ | Uninstall |
| `POST /api/skills/[slug]/pay` | ✅ WORKS | ❌ **No test** | x402 payment verification |
| `POST /api/skills/[slug]/execute` | ⚠️ BROKEN | ❌ **No test** | **No `requireAuth()`** — anonymous execution allowed |
| `GET /api/skills/[slug]/stats` | ✅ WORKS | ❌ **No test** | Execution stats |
| `GET/POST /api/skills/[slug]/review` | ✅ WORKS | ✅ 409 lines | 1-5 rating |
| `GET /api/skills/[slug]/versions` | ✅ WORKS | ✅ 352 lines | Version history |
| `GET/PUT /api/skills/[slug]/tags` | ✅ WORKS | ✅ 429 lines | Tag management |
| `GET /api/skills/tags` | ✅ WORKS | ✅ | All tags with counts |

### 6.2 Admin Routes

| Route | Status | Tests | Notes |
|-------|--------|-------|-------|
| `GET /api/admin/skills` | ✅ WORKS | ✅ 512 lines | Pending moderations |
| `POST /api/admin/skills/[id]` | ✅ WORKS | ✅ | Approve/reject |

### 6.3 Marketplace UI

| Component | Status | Tests | Notes |
|-----------|--------|-------|-------|
| Dashboard marketplace page | ✅ WORKS | ✅ 786+247 lines | Search, filters, install, detail modal |
| SoulBadge | ✅ WORKS | — | Color-coded principle badge |
| PublishSkillForm | ✅ WORKS | — | Manifest + script + test suite editor |

### 6.4 Backend Skills (Cloudflare Worker)

| Component | Status | Tests | Notes |
|-----------|--------|-------|-------|
| MCP `skill_list` | ⚠️ **D1-only** | ❌ | Lists D1 `skill_installs`, NOT synced with PostgreSQL |
| MCP `skill_install` | ⚠️ **D1-only** | ❌ | No payment gate, no version validation |
| `SkillsMarketplace.listSkills()` | 🔴 **STUB** | ❌ | Returns empty array |
| `SkillsMarketplace.getSkill()` | 🔴 **STUB** | ❌ | Returns null |
| Seed skills (5 core) | ✅ WORKS | — | D1-only, no Prisma mirrors |

### 6.5 Marketplace Gaps for MVP
1. 🔴 **`soulPrinciple` filter ignored by API** — UI sends it, API parses it, Prisma WHERE never includes it
2. 🔴 **D1 ↔ PostgreSQL data split** — Skills installed via marketplace don't appear in MCP. Seed skills in D1 don't appear in marketplace. **No sync mechanism.**
3. 🔴 **`execute` route has no auth** — Any anonymous actor can record executions
4. 🟡 **3 untested routes** — pay, execute, stats
5. 🟡 **SkillsMarketplace.listSkills/getSkill are stubs** — Backend class returns empty/null
6. 🟢 **No "my installed skills" endpoint**

---

## 7. FOCUS AREA: PAYMENTS/VAULT — STATE MAP

### 7.1 Payment Routes

| Route | Status | Tests | Notes |
|-------|--------|-------|-------|
| `POST /api/pi/payment/approve` | ✅ WORKS | ✅ **674 lines** | IDOR prevention, idempotent, Pi API |
| `POST /api/pi/payment/complete` | ✅ WORKS | ❌ **ZERO tests** | XP + KYC upgrade + tier recalc |
| `POST /api/skills/[slug]/pay` | ✅ WORKS | ❌ No test | x402 verification |
| `POST /api/skills/[slug]/purchase` | 🟡 DEPRECATED | ✅ | Returns 410 Gone |

### 7.2 Payment Flow (E2E)
```
User clicks "Install" on paid skill → Pi Browser payment dialog
  → Pi SDK onReadyForServerApproval → POST /api/pi/payment/approve
    → Pi API GET /v2/payments/:id (IDOR check) → Pi API approve
    → DB upsert (ESCROWED)
  → User confirms in Pi Browser
  → Pi SDK onReadyForServerCompletion → POST /api/pi/payment/complete
    → Pi API complete → $transaction (RELEASED + XP*10 + KYC upgrade)
  → POST /api/skills/[slug]/install
    → Match RELEASED payment → atomic consume → SkillInstallation created
```

### 7.3 Vault Routes

| Route | Status | Tests | Notes |
|-------|--------|-------|-------|
| `GET /api/vault/stake` | ✅ WORKS | ✅ 323 lines | List user stakes |
| `POST /api/vault/stake` | ✅ WORKS | ✅ | Stake/unstake, no lock period |

### 7.4 Payment/XP Infrastructure

| Component | Status | Tests | Notes |
|-----------|--------|-------|-------|
| `PiPaymentButton` component | ✅ WORKS | ❌ **No test** | Reusable button |
| `DonateWithPiCard` component | ✅ WORKS | ❌ **No test** | Donation card |
| XP tiers (Visitor/Citizen/Validator/Sovereign) | ✅ WORKS | ✅ | 0/100/500/1000 XP |
| Trust score (70% XP + 30% stamps) | ✅ WORKS | ✅ | |
| XP ledger (stamp/claim, payment, ads, KYC) | ✅ WORKS | ✅ | Running balance per entry |

### 7.5 Payment/Vault Gaps for MVP
1. 🔴 **`POST /api/pi/payment/complete` has ZERO tests** — Handles money + XP + KYC. Single most critical untested route.
2. 🟡 **No vault dashboard page** — No `/dashboard/vault` page. Stakes only accessible via API.
3. 🟡 **No vault balance endpoint** — No `GET /api/vault/balance`
4. 🟡 **No payment history API** — No `GET /api/pi/payments`
5. 🟡 **`txid` regex may be too restrictive** — `^[a-zA-Z0-9_-]+$` could reject valid Pi Network txids
6. 🟢 **No staking rewards / lock period** — Stakes can be immediately unstaked
7. 🟢 **SlashingEvent model dead** — Defined in schema, never used

---

## 8. CROSS-CUTTING GAPS

### 8.1 Test Coverage

| Area | Status | Detail |
|------|--------|--------|
| Total tests | ✅ 1943 passing | 158 test files |
| Routes untested | 🟡 **16/57 (28%)** | See route inventory |
| Coverage threshold | ✅ 80% across all metrics | Config enforced |
| **Critical untested** | 🔴 **payment/complete** | Handles real money |
| **Critical untested** | 🟡 **ads/verify** | Ad fraud prevention |
| **Critical untested** | 🟡 **skills/pay** | Payment verification |
| **Critical untested** | 🟡 **skills/execute** | No auth at all |

### 8.2 Zod Validation

| Area | Status | Detail |
|------|--------|--------|
| `validators.ts` exists | ✅ | `PiAuthSchema`, `PaymentApproveSchema`, etc. |
| Routes USE it | 🔴 **NO** | Every route manually validates or skips. Zero routes import validators.ts |
| `apiError()` error codes | ✅ | 24 codes mapped to HTTP + diagnostics |

### 8.3 Dead Code / Unused Models

| Item | Status | Detail |
|------|--------|--------|
| `SlashingEvent` model | 🔴 DEAD | Defined in Prisma, no route creates it |
| `SkillPipeline/Step` model | 🟡 UNUSED | Schema + relations exist, no API |
| `SelfReviewLog` model | 🟡 UNUSED | Schema only |
| `EphemeralDid` model | 🟡 UNUSED | Full model, zero queries |
| `signAgentAttestationCredential()` | 🟡 UNUSED | Implemented + tested in vc.ts, never called |
| Agent Manifest VC (separate impl) | 🟡 REDUNDANT | Uses Ed25519Signature2018 vs 2020 in lib/vc.ts |
| `did_create` in MCP server.ts | 🔴 WRONG FORMAT | `did:pi:` instead of `did:axiom:` |
| `did_resolve` in MCP server.ts | 🔴 WRONG TABLE | Queries harvest_results instead of User |

---

## 9. NEW ISSUE PLAN

Based on this state map, here's the re-prioritized issue plan focused on MVP stabilization:

### P0 — Bugs Blocking MVP (fix NOW)

| # | Area | What | Why |
|---|------|------|-----|
| 1 | Skills | **Fix `soulPrinciple` filter** — add to Prisma WHERE | Marketplace filter is broken, users can't filter by principle |
| 2 | Skills | **Add `requireAuth` to execute route** | Anonymous execution recording — abuse vector |
| 3 | DID | **Fix user DID Documents** — add public key to `buildDidDocument()` | DID Document non-functional for verification |
| 4 | Passport | **Save `passportUrl` on publish** — update `user.passportUrl` after IPFS | "Published Passport" link never appears |

### P1 — Critical Gaps (fix before next release)

| # | Area | What | Why |
|---|------|------|-----|
| 5 | Payments | **Test `POST /api/pi/payment/complete`** | Handles real money + XP + KYC. Zero coverage. |
| 6 | Payments | **Verify `txid` regex accepts real Pi txids** | `^[a-zA-Z0-9_-]+$` may be too restrictive |
| 7 | Passport | **Pinata IPFS config** or document mock-only state | Passports appear published but aren't accessible |
| 8 | Auth | **Add Zod validation to auth routes** (pi, state, connect) | `validators.ts` exists but routes don't use it |
| 9 | DID | **Unify DID format** — single authoritative path | User can end up with 2 different DIDs |

### P2 — MVP Polish (complete for v0.2)

| # | Area | What | Why |
|---|------|------|-----|
| 10 | Payments | **Test ads/verify, skills/pay, skills/stats** | 3 untested routes |
| 11 | Passport | **Add passport publish button to dashboard** | Users can't publish from UI |
| 12 | Auth | **Test auth/state, auth/connect** | 2 untested auth routes |
| 13 | DID | **Wire `signAgentAttestationCredential` into agent deploy** | Dead code — implemented but never used |
| 14 | DID | **Consolidate Agent Manifest proof type** (2018 vs 2020) | Two parallel VC signing implementations |

### P3 — Future (post-MVP)

| # | Area | What | Why |
|---|------|------|-----|
| 15 | Infra | **Bridge D1 ↔ PostgreSQL sync** | MCP skills vs marketplace skills are separate worlds |
| 16 | Vault | **Build vault dashboard page** | No UI for staking |
| 17 | Vault | **Add staking rewards + lock periods** | Stakes can be immediately unstaked |
| 18 | Payments | **Build payment history API** | No `GET /api/pi/payments` |
| 19 | Passport | **Implement SBT minting** | Button exists, shows "Coming soon" |
| 20 | Infra | **Clean up dead models** (SlashingEvent, EphemeralDid, SelfReviewLog) | Schema cruft |

---

## 10. REVISED ROADMAP

### v0.2 — MVP Stabilization (NOW)
Fix what's broken. Don't build new features.

**P0 Bugs (1-2 days):**
- Fix soulPrinciple filter
- Add auth to execute route
- Fix user DID Documents (add public key)
- Save passportUrl on publish

**P1 Critical Gaps (3-5 days):**
- Write tests for payment/complete
- Verify txid regex
- Add Zod validation to auth routes
- Unify DID format

**P2 Polish (5-7 days):**
- Add tests for 3 untested routes
- Add passport publish button to dashboard
- Wire `signAgentAttestationCredential` into agent deploy

### v0.3 — Post-MVP Features
- Vault dashboard page + staking rewards
- Payment history API
- SBT minting (Stellar-based)
- D1 ↔ PostgreSQL sync bridge

### v0.4 — Production Hardening
- Performance benchmarks (#153)
- Arabic i18n for all pages
- SBT minting on Stellar
- Production load testing

---

## 11. ISSUE CLOSURE PLAN

| Issue | Current | Proposed Action |
|-------|---------|-----------------|
| #130 MCP Server | 🟡 Open, commented | **Close** — scope was over-scoped for MVP. `did_resolve` bug noted in codebase audit but not actionable as separate issue. |
| #131 VS Code Ext | 🟡 Open, commented | **Close** — out of MVP scope. Zero code. |
| #132 Agent Bootstrap | 🟡 Open, commented | **Close** — out of MVP scope. Depends on #130. |
| #133 Roadmap | 🟡 Open, commented | **Close** — stale. Replace with this document's roadmap. |
| #134 Good First Issues | 🟡 Open, commented | **Close** — stale, generic tasks. MVP not ready for community contributions. |
| #151 Delegation | 🟡 Open, commented | **Close** — backend exists, no frontend usage. Not MVP-critical. |
| #152 Stellar | ✅ **Already closed** | ✅ |
| #153 Perf Benchmarks | 🟡 Open, commented | **Keep open** — valid for v0.4. |

**New issues to create (from P0/P1 above):**
1. `bug: soulPrinciple filter ignored by GET /api/skills` (P0) — fix NOW
2. `security: POST /api/skills/[slug]/execute has no auth` (P0) — fix NOW
3. `bug: user DID Documents missing public keys` (P0) — fix NOW
4. `bug: passportUrl never saved to DB on publish` (P0) — fix NOW
5. `test: POST /api/pi/payment/complete has zero coverage` (P1) — write tests
6. `chore: verify Pi Network txid regex accepts production ids` (P1) — verify
7. `feat: add Zod validation to auth routes` (P1) — harden
8. `refactor: unify DID format to single authoritative path` (P1) — consolidate

---

## 12. E2E FIRST-EXPERIENCE FLOW — USER JOURNEY

This traces a brand-new user's first experience from landing → signup → full engagement. Every step is annotated with **what works / what's broken / what's missing**.

### Step 1: Landing Page → Connect with Pi

| Detail | Status | Notes |
|--------|--------|-------|
| Landing page loads | ✅ WORKS | Hero, StatsBar, TrustTiers, Pi Browser badge |
| "Connect with Pi" button | ✅ WORKS | Calls `connectPi()` from pi-sdk.ts |
| Pi Browser detection | ✅ WORKS | UA + iframe + hostname check, shows badge if not Pi Browser |
| Pi SDK init | ✅ WORKS | `Pi.init({version:"2.0", sandbox})` |
| Pi.authenticate() | ✅ WORKS | Requests username + payments scopes |
| OAuth fallback flow | ✅ WORKS | `pi-signin.ts` for non-Pi browsers |
| Loading state (signing in) | ✅ WORKS | Spinner during auth |
| Error state (auth failed) | ✅ WORKS | Error toast with retry |
| Edge: Pi SDK not loaded | ✅ WORKS | Fallback to OAuth flow |
| Edge: User cancels auth | ✅ WORKS | Handles Pi.UserCancelError |

**E2E Verdict: ✅ CLEAR** — Signup flow is solid.

### Step 2: User Registration (POST /api/auth/pi)

| Detail | Status | Notes |
|--------|--------|-------|
| Pi API token verification | ✅ WORKS | JWKS offline + Pi API fallback |
| findOrCreateUser | ✅ WORKS | Upsert by piUid |
| createPiDid() | ✅ WORKS | `did:axiom:axiomid.app:pi:{uid}` |
| Zod validation | 🔴 MISSING | `validators.ts` has `PiAuthSchema` but route ignores it |
| Test coverage | ✅ 477 lines | Full test suite |
| Edge: Pi API unreachable | ✅ WORKS | `NODE_ENV=development` sandbox bypass |
| Edge: Duplicate piUid | ✅ WORKS | findOrCreateUser handles upsert |

### Step 3: Session Establishment

| Detail | Status | Notes |
|--------|--------|-------|
| Token stored in localStorage | ✅ WORKS | After `/api/auth/pi` response |
| WalletContext updated | ✅ WORKS | React context with user + DID + KYC status |
| Redirect to dashboard | ✅ WORKS | After successful auth |
| Bearer token on subsequent requests | ✅ WORKS | `auth-middleware.ts` extracts from Authorization header |
| Token revocation check | ✅ WORKS | Upstash Redis + in-memory failover |
| PiToken type in global.d.ts | ✅ WORKS | Includes accessToken, uid, username |

### Step 4: KYC / Identity Verification

| Detail | Status | Notes |
|--------|--------|-------|
| KYC consent dialog | ✅ WORKS | `Pi.nativeFeature.openConsentDialog()` |
| POST /api/pi/kya/verify | ✅ WORKS | Full flow: Pi API verify → XP +20 → tier → hash-chain |
| Test coverage | ✅ 517 lines | Well tested |
| Zod validation on claim route | 🔴 MISSING | `POST /api/pi/kya/claim` accepts empty body |
| Edge: KYC already verified | ✅ WORKS | Idempotent, skips re-verification |
| Edge: KYC failed | ✅ WORKS | Returns error, no XP awarded |

**KYC Status Mapping:**
```
NONE → PENDING (consent given) → VERIFIED (Pi confirms) → 
  → XP +20 → Tier recalc → UserAgent tier updated
```

### Step 5: XP & Tier Progression

| Detail | Status | Notes |
|--------|--------|-------|
| XP from KYC (+20) | ✅ WORKS | kya/verify route |
| XP from stamps (+10 each) | ✅ WORKS | stamp/claim route |
| XP from payments (+10) | ✅ WORKS | payment/complete route |
| XP from ads (+10) | ✅ WORKS | ads/verify route |
| XP from Stellar anchoring (+5) | ✅ WORKS | stellar/anchor route |
| XP ledger | ✅ WORKS | Running balance via XpLedger |
| Tier recalc on XP change | ✅ WORKS | Visitor(0) → Citizen(100) → Validator(500) → Sovereign(1000) |
| Trust score (70% XP + 30% stamps) | ✅ WORKS | Computed on demand |
| XP display in dashboard | ✅ WORKS | StatsBar, QuickStatsRow |
| XP not earned: ads | 🟡 NO UI | API works, no user-facing button to watch ads |

**XP E2E Status: ✅ WORKS** — All XP sources are functional but ads have no UI trigger.

### Step 6: DID (Decentralized Identifier)

| Detail | Status | Notes |
|--------|--------|-------|
| DID auto-created on signup | ✅ WORKS | `createPiDid(piUid)` during `/api/auth/pi` |
| DID resolution via Prisma | ✅ WORKS | `did-resolver.ts` queries User table |
| W3C DID Document builder | ✅ WORKS | `did-document.ts` |
| GET /api/did-document?did=... | ⚠️ **BROKEN** | **User docs have NO public keys** — `buildDidDocument()` called without `publicKeyMultibase` |
| GET /api/did-document (issuer) | ✅ WORKS | Has full key material |
| DID displayed on passport | ✅ WORKS | AgentPassport → Identity section |
| DID copy button | ✅ WORKS | PassportKeyManager |
| VC signing (social creds) | ✅ WORKS | stamp/claim route |
| VC signing (passport creds) | ✅ WORKS | passport/publish route |
| Stellar anchoring of VCs | ✅ WORKS | Hash on-chain, verifiable |
| MCP did_resolve | 🔴 **WRONG TABLE** | Queries `harvest_results` instead of User |
| MCP did_create | 🔴 **WRONG FORMAT** | Uses `did:pi:` instead of `did:axiom:` |

**E2E Verdict: ⚠️ BROKEN** — DID Document endpoint returns incomplete documents for users. MCP tools reference wrong data.

### Step 7: Passport Creation & Publishing

| Detail | Status | Notes |
|--------|--------|-------|
| Passport page SSR | ✅ WORKS | Dynamic OG metadata |
| PassportView client component | ✅ WORKS | Fetches API, renders all sections |
| GET /api/passport/[slug] | ✅ WORKS | Resolves by slug/wallet/did/Pi username |
| POST /api/passport/[slug]/publish | ✅ WORKS | VC + IPFS + Stellar (non-fatal if anchor fails) |
| Save passportUrl to user | 🔴 **BROKEN** | Publish route returns URL but NEVER saves to `user.passportUrl` |
| IPFS pinning | 🔴 **MOCK** | Without PINATA_JWT, CID is valid but content isn't pinned |
| GET /api/passport/[slug]/verify | ✅ WORKS | Returns stamps + KYC status |
| Dashboard publish button | 🟡 MISSING | InteractivePassportCard doesn't call publish route |
| "Published Passport" link in dashboard | 🔴 BROKEN | QuickLinksCard checks `passportUrl` which is never saved |
| Passport export (HTML→canvas) | ✅ WORKS | InteractivePassportCard |
| Passport share (Pi native) | ✅ WORKS | Fallback chain: Pi → navigator → clipboard |
| OG image for passport share | ✅ WORKS | `/api/og/passport` — 1200x630 |
| SBT minting button | 🟡 STUB | Shows "Coming soon" toast |
| Arabic i18n | 🟡 MISSING | Passport pages not translated |

**E2E Verdict: ⚠️ BROKEN** — User can publish but `passportUrl` never persists. No publish button in dashboard. IPFS pinning is mock-only by default.

### Step 8: Marketplace — Browse & Filter Skills

| Detail | Status | Notes |
|--------|--------|-------|
| GET /api/skills (list) | ⚠️ **BROKEN** | **soulPrinciple filter parsed but NEVER applied to Prisma WHERE** |
| GET /api/skills/[slug] (detail) | ✅ WORKS | Shows isInstalled, _count |
| Skill search | ✅ WORKS | Name/description search |
| SoulBadge color-coded principles | ✅ WORKS | UI-side filtering |
| Loading state | ✅ WORKS | Skeleton while fetching |
| Error state | ✅ WORKS | ErrorBoundary wrapper |
| Empty state ("No skills found") | ✅ WORKS | Motivational copy |
| Edge: Skill not found | ✅ WORKS | 404 handling |

**E2E Verdict: ⚠️ BROKEN** — Filtering by soul principle is broken. Users see all skills regardless of filter.

### Step 9: Marketplace — Install Skill (Free)

| Detail | Status | Notes |
|--------|--------|-------|
| POST /api/skills/[slug]/install (free) | ✅ WORKS | Creates SkillInstallation |
| Test coverage | ✅ 777 lines | Payment gate + TOCTOU guard |
| Post-install state in UI | ✅ WORKS | "Installed" badge, settings modal |

### Step 10: Marketplace — Install Skill (Paid) → Pi Payment

| Detail | Status | Notes |
|--------|--------|-------|
| Pi.createPayment() called | ✅ WORKS | `createPiPayment()` from pi-sdk.ts |
| Pi SDK onReadyForServerApproval | ✅ WORKS | Triggers POST /api/pi/payment/approve |
| POST /api/pi/payment/approve | ✅ WORKS | IDOR prevention, idempotent, Pi API |
| Test coverage approve | ✅ 674 lines | Well tested |
| Pi SDK onReadyForServerCompletion | ✅ WORKS | Triggers POST /api/pi/payment/complete |
| POST /api/pi/payment/complete | 🟡 WORKS but **ZERO TESTS** | Handles real money + XP*10 + KYC upgrade. **Critical untested route.** |
| Payment → Install atomic consume | ✅ WORKS | Match RELEASED payment → SkillInstallation |
| PiPaymentButton component | ✅ WORKS | Reusable, untested |
| Edge: Payment cancelled by user | ✅ WORKS | Handles Pi.UserCancelError |
| Edge: Payment expired | ✅ WORKS | PENDING → timeout cleanup |
| Edge: Incomplete payment from prior session | ✅ WORKS | Pi SDK onIncompletePayment callback |
| x402 payment (skills/pay) | ✅ WORKS | Alternative payment route, untested |
| Stale: POST /api/skills/[slug]/purchase | 🟡 DEPRECATED | Returns 410 Gone |

**E2E Verdict: 🟡 RISKY** — Payment E2E flow exists but the `complete` endpoint (which handles money + XP + KYC) has zero test coverage.

### Step 11: Marketplace — Execute Skill

| Detail | Status | Notes |
|--------|--------|-------|
| POST /api/skills/[slug]/execute | ⚠️ **BROKEN** | **No `requireAuth()`** — anonymous execution allowed |
| Skill execution recording | ✅ WORKS | Creates SkillExecution record |
| D1 skill execution (backend) | 🟡 STUB | SkillsMarketplace class returns empty/null |

**E2E Verdict: 🔴 BROKEN** — No auth on execute route is a security issue. Any unauthenticated actor can record executions.

### Step 12: Agent Creation & Management

| Detail | Status | Notes |
|--------|--------|-------|
| Agent created during signup | ✅ WORKS | UserAgent created with default slug |
| ACTIVE/PAUSED/SLEEPING states | ✅ WORKS | Presence/heartbeat |
| Agent manifest VC | ✅ WORKS | Uses Ed25519Signature2018 (different from lib/vc.ts 2020) |
| Sign agent attestation | 🟡 **DEAD CODE** | `signAgentAttestationCredential()` implemented but never called |
| Agent QR code | ✅ WORKS | AgentQR component |
| Agent stats in dashboard | ✅ WORKS | AgentStatsCard with sparkline |

### Step 13: Vault & Staking

| Detail | Status | Notes |
|--------|--------|-------|
| POST /api/vault/stake | ✅ WORKS | Stake/unstake |
| GET /api/vault/stake | ✅ WORKS | List user stakes |
| Test coverage | ✅ 323 lines | |
| Vault dashboard page | 🔴 MISSING | `/dashboard/vault` tab link exists but default error boundary |
| GET /api/vault/balance | 🟡 MISSING | No balance endpoint |
| Staking rewards / lock period | 🟡 MISSING | Stakes are immediately unstakeable |
| SlashingEvent model | 🔴 DEAD | Defined in schema, never used |

**E2E Verdict: 🟡 PARTIAL** — Staking API works but there's no vault UI. Dashboard vault tab is dead.

### Step 14: Dashboard — Post-Auth Hub

| Detail | Status | Notes |
|--------|--------|-------|
| Dashboard loads after auth | ✅ WORKS | ErrorBoundary wrapper |
| QuickStatsRow (XP, level, agent count) | ✅ WORKS | SVG gauge + sparkline |
| AgentStatsCard | ✅ WORKS | Sparkline, tier badge |
| StatsBar (total users, agents, on-chain) | ✅ WORKS | Zero-state handled |
| Tab navigation | ✅ WORKS | Home, Marketplace, Sandbox, Settings, Vault |
| Dead tabs (Vault, Delegations, Notifications) | 🔴 BROKEN | Links exist, default error boundary renders |
| Settings page | 🟡 EMPTY | No wallet/stellar/preferences controls. Just profile display. |
| Arabic i18n | ✅ Dashboard | Partially translated |

### Step 15: Settings & Profile

| Detail | Status | Notes |
|--------|--------|-------|
| Settings page loads | ✅ WORKS | |
| Profile info displayed | ✅ WORKS | Avatar with initials |
| Export Data JSON | ✅ WORKS | |
| Danger Zone | ✅ WORKS | Placeholder section |
| Wallet controls | 🔴 MISSING | No way to view/link wallet |
| Stellar preferences | 🔴 MISSING | No anchor settings |
| Preferences form | 🔴 MISSING | Theme, notifications |
| i18n toggle | 🔴 MISSING | No language switcher |

### Step 16: Pi Wallet Connection

| Detail | Status | Notes |
|--------|--------|-------|
| Wallet address linked on signup | ✅ WORKS | `user.walletAddress` set during Pi auth |
| Wallet display in dashboard | ✅ WORKS | QuickStatsRow shows wallet address |
| Pi.createPayment() payment flow | ✅ WORKS | Full SDK integration |
| runWalletTest() helper | ✅ WORKS | Quick auth test |
| Wallet disconnect/switch | 🟡 MISSING | No UI for changing wallet |

### E2E Flow Summary

```
LANDING (✅ WORKS)
  → Connect with Pi (✅ WORKS)
    → Pi SDK init (✅ WORKS)
    → Pi.authenticate() (✅ WORKS)
    → POST /api/auth/pi (✅ WORKS, no Zod validation)
  → Session established (✅ WORKS)
  → Dashboard (✅ WORKS, 3 dead tabs)

  → KYC Verification (✅ WORKS)
    → Consent dialog (✅ WORKS)
    → POST /api/pi/kya/verify (✅ WORKS)
    → XP +20 → Tier recalc (✅ WORKS)

  → DID Creation (✅ WORKS auto, but 🔴 Document missing keys)
  → Passport (⚠️ BROKEN — passportUrl never saved, no publish button)
  → Marketplace (⚠️ BROKEN — soulPrinciple filter, execute no auth)
  → Payment (🟡 RISKY — complete endpoint untested, handles money)
  → Vault/Staking (🟡 PARTIAL — API works, no UI)
  → Agent (✅ WORKS, attestation credential is dead code)
```

### E2E Issues Blocking New User Experience

| Step | Issue | Severity | Impact |
|------|-------|----------|--------|
| Step 6 (DID) | DID Document has no public keys | 🔴 P0 | User's DID is non-functional for verification |
| Step 7 (Passport) | passportUrl never saved to DB | 🔴 P0 | "Published Passport" link never appears |
| Step 8 (Marketplace) | soulPrinciple filter ignored | 🔴 P0 | Users can't filter skills by principle |
| Step 11 (Execute) | No auth on execute route | 🔴 P0 | Anyone can record executions |
| Step 10 (Payment) | payment/complete has zero tests | 🟡 P1 | Money-handling route untested |
| Step 7 (Passport) | No publish button in dashboard | 🟡 P2 | Users can't publish from UI |
| Step 13 (Vault) | No vault dashboard page | 🟡 P2 | Staking has no UI |
| Step 9 (Marketplace) | D1 ↔ PostgreSQL never synced | 🟡 P2 | Skills installed via MCP don't appear in marketplace |
| Step 15 (Settings) | No wallet/preferences controls | 🟡 P2 | Settings page is a shell |

### P0 Blockers Before Any New User Can Complete E2E

1. **Fix DID Document** → User DID must have public keys for verification
2. **Save passportUrl** → Passport publish must persist the URL
3. **Fix soulPrinciple filter** → Marketplace filtering must work
4. **Add execute route auth** → Prevent anonymous execution abuse
