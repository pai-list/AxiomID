# Pi Schemas & Manifests — Design Spec

**Date:** 2026-07-05
**Author:** AI Codebase Audit
**Status:** Approved for implementation

---

## 1. Scope

Four independent deliverables to fill critical schema/manifest gaps identified in the codebase audit:

| PR | Deliverable | Branch | Priority |
|---|---|---|---|
| #1 | `/.well-known/did.json` route | `feat/did-json-well-known` | High |
| #2 | Skill Manifest template + seed skills | `feat/skill-manifest-seeds` | High |
| #3 | OpenAPI spec completion (55+ endpoints) | `feat/openapi-complete` | Medium |
| #4 | PWA manifest enhancement | `feat/pwa-manifest-pi` | Medium |

---

## 2. PR #1: `/.well-known/did.json` Route

### 2.1 Why

W3C DID spec requires `did:web:axiomid.app` to resolve at `/.well-known/did.json`.
Without it, external DID resolvers and Pi Network integrators cannot verify AxiomID credentials.

### 2.2 Files

| Action | File | Purpose |
|---|---|---|
| Create | `src/app/.well-known/did.json/route.ts` | GET handler |
| Create | `src/__tests__/.well-known/did-json.test.ts` | 6 tests |

### 2.3 Behavior

```
GET /.well-known/did.json
├── Rate limit check (RATE_LIMITS.public)
├── Read ISSUER_PUBLIC_KEY from env
│   └── Missing → 500 + apiError("ISSUER_PUBLIC_KEY not configured")
├── createIssuerDid() → "did:axiom:issuer"
├── buildDidDocument(issuerDid, publicKeyPem) → DidDocument
├── Add alsoKnownAs: ["https://axiomid.app"]
├── Add service[] array (passport resolver, agent coordination, credential status)
└── Return apiSuccess(doc, 200, headers)
```

### 2.4 Reused Code (zero new lib functions)

| Function | Source |
|---|---|
| `createIssuerDid()` | `src/lib/did.ts:14` |
| `buildDidDocument()` | `src/lib/did-document.ts:28` |
| `checkRateLimit()` | `src/lib/rate-limiter` |
| `apiSuccess()` / `apiError()` | `src/lib/errors` |
| `getClientIp()` | `src/lib/ip` |
| `logger` | `src/lib/logger` |

### 2.5 Tests

1. Returns 200 with `application/did+ld+json` Content-Type
2. Returns issuer DID document with `id: "did:axiom:issuer"`
3. Returns 500 when `ISSUER_PUBLIC_KEY` env var is missing
4. Response validates against `DidDocumentSchema`
5. Cache-Control header contains `max-age=86400`
6. Uses `RATE_LIMITS.public` for rate limiting

---

## 3. PR #2: Skill Manifest Template + Seed Skills

### 3.1 Why

The skill validator exists (`validateManifest` in `src/lib/validators.ts`),
CI enforcement exists (`skill-quality.yml`), but **zero skills** have been authored.

### 3.2 Files

| Action | File | Purpose |
|---|---|---|
| Create | `skills/skill-template.md` | Template guide + validation rules |
| Create | `skills/agent-memory/SKILL.md` | Seed skill: agent memory management |
| Create | `skills/agent-memory/agentScript.ts` | TypeScript implementation |
| Create | `skills/agent-memory/testSuite.ts` | Jest tests |
| Create | `skills/pi-auth-bridge/SKILL.md` | Seed skill: Pi Browser auth bridge |
| Create | `skills/pi-auth-bridge/agentScript.ts` | TypeScript implementation |
| Create | `skills/pi-auth-bridge/testSuite.ts` | Jest tests |
| Create | `skills/trust-scoring/SKILL.md` | Seed skill: trust score calculation |
| Create | `skills/trust-scoring/agentScript.ts` | TypeScript implementation |
| Create | `skills/trust-scoring/testSuite.ts` | Jest tests |

### 3.3 Template Format (skill-template.md)

```
# AxiomID Skill Manifest Template

## Required Sections (validated by validateManifest())

### ## Purpose
EN + AR bilingual description. What does this skill do?

### ## Principle Alignment
Which SOUL principle: MURAQABAH | TAWBAH | TRUSTCHAIN | TASBIH | SABIYYAH | BARAKAH

### ## Operational Flow
1. Input validation
2. Core operation
3. Output formatting
4. Side effects (DB writes, API calls)

### ## Failure Modes
- Network errors → retry with backoff
- Invalid input → error code
- DB unavailable → graceful degradation
- Rate limiting → queue and delay

## Validation
npx tsx scripts/validate-skill-manifest.ts --changed
```

### 3.4 Seed Skill: agent-memory

**Manifest sections:** Purpose (manage agent working memory with append-only log semantics),
Principle Alignment (TRUSTCHAIN), Operational Flow (validate → hash-chain → append → emit telemetry),
Failure Modes (store unavailable, hash collision, memory limit exceeded).

**AgentScript exports:** `validateEntry(entry)` → Zod-validated memory entry,
`hashChain(entry, previousHash)` → SHA-256 chain,
`appendToMemory(entry, store)` → append-only with eviction.

**TestSuite:** ~12 tests covering validation, hashing, append/evict.

### 3.5 Seed Skill: pi-auth-bridge

**Manifest sections:** Purpose (authenticate Pi Network users and exchange auth tokens for DID assertions),
Principle Alignment (MURAQABAH — honest audit trail),
Operational Flow (receive access token → verify with Pi API → derive DID → create assertion → return JWT),
Failure Modes (invalid token, Pi API unavailable, expired assertion).

**AgentScript exports:** `verifyPiAccessToken(token)` → PiUser | null,
`createDidAssertion(piUser)` → signed JWT,
`exchangeAssertion(assertion)` → DID + credentials.

**TestSuite:** ~10 tests covering token verification, DID derivation, JWT signing.

### 3.6 Seed Skill: trust-scoring

**Manifest sections:** Purpose (calculate composite trust score from XP, stamps, tenure, and semantic trust),
Principle Alignment (SABIYYAH — every cycle refine the score),
Operational Flow (gather inputs → normalize → apply weights → compute composite → return),
Failure Modes (missing inputs → minimum defaults, division by zero → clamp).

**AgentScript exports:** `computeTrustScore(params: TrustScoreParams)` → TrustScoreResult,
`normalizeStamps(count, total)` → 0..1 weight,
`calculateTenureDays(createdAt)` → days since registration.

**TestSuite:** ~12 tests covering score calculation, edge cases (zero XP, new user, max stamps).

---

## 4. PR #3: OpenAPI Spec Completion

### 4.1 Why

Current `public/openapi.json` documents only 7 of 55+ endpoints.
Complete OpenAPI spec enables SDK generation, automated contract testing, and developer self-service.

### 4.2 File to Modify

`public/openapi.json` (replace entirely: ~218 lines → ~2000+ lines)

### 4.3 Current State (7 paths)

| Path | Method | Status |
|---|---|---|
| `/api/passport/{slug}` | GET | Documented |
| `/api/did-document` | GET | Documented |
| `/api/status` | GET | Documented |
| `/api/health` | GET | Documented |
| `/api/explorer` | GET | Documented |
| `/api/leaderboard` | GET | Documented |
| `/api/credential-status` | GET | Documented |

### 4.4 Missing Paths to Add (48+)

| Category | Endpoints |
|---|---|
| **Skills Marketplace** (12) | `/api/skills` (GET/POST), `/api/skills/{slug}` (GET/PATCH/DELETE), `/api/skills/{slug}/install`, `/api/skills/{slug}/execute`, `/api/skills/{slug}/tags`, `/api/skills/{slug}/stats`, `/api/skills/{slug}/pay`, `/api/skills/{slug}/purchase`, `/api/skills/{slug}/versions`, `/api/skills/{slug}/review`, `/api/skills/tags` (GET) |
| **Agent Management** (8) | `/api/agent` (GET/POST), `/api/agent/identity`, `/api/agent/identity/claim`, `/api/agent/manifest`, `/api/agent/main`, `/api/agent/pause`, `/api/agent/activate`, `/api/agent/sign` |
| **Pi Integration** (6) | `/api/auth/pi`, `/api/pi/payment/approve`, `/api/pi/payment/complete`, `/api/pi/kya/verify`, `/api/pi/kya/claim`, `/api/pi/ads/verify` |
| **Passport** (3) | `/api/passport/{slug}` (GET - already listed in current), `/api/passport/{slug}/publish`, `/api/passport/{slug}/verify` |
| **Auth** (5) | `/api/auth/state`, `/api/auth/connect`, `/api/auth/logout`, `/api/user/status` |
| **Staking & Payments** (3) | `/api/vault/stake` (GET/POST), `/api/stamp/claim`, `/api/stamp` (GET) |
| **Infrastructure** (9) | `/api/sync`, `/api/sandbox/dev-token`, `/api/sandbox/execute`, `/api/agents/harvest`, `/api/upload/presign`, `/api/presence/heartbeat`, `/api/daily-review`, `/api/telegram`, `/api/social/disconnect` |
| **Discovery** (4) | `/.well-known/did.json`, `/.well-known/jwks.json`, `/.well-known/oauth-authorization-server`, `/.well-known/oauth-protected-resource` |
| **Admin** (2) | `/api/admin/skills` (GET), `/api/admin/skills/{id}` (PATCH/DELETE) |

### 4.5 Component Schemas to Add

| Schema | Fields |
|---|---|
| `Skill` | id, slug, name, description, manifestMd, tier, pricePi, version, authorId, status, isPublished, soulPrinciple, chainable, installCount, avgRating, ratingCount, createdAt, updatedAt |
| `SkillInstallation` | id, skillId, agentId, installedAt, status |
| `Agent` | id, publicId, name, description, avatarUrl, did, subdomain, status, mode, lastActive, memoryLimit, createdAt |
| `AgentLog` | id, userId, agentId, level, source, message, metadata, createdAt |
| `Stake` | id, userId, amount, status, createdAt |
| `SlashingEvent` | id, userId, amount, reason, createdAt |
| `VerifiableCredential` | @context, type, issuer, issuanceDate, credentialSubject, proof |
| `Error` | error, code, details (standardized) |
| `PiPayment` | id, userId, paymentId, txid, amount, memo, metadata, status, network, createdAt |
| `XpLedger` | id, userId, amount, reason, reference, balance, createdAt |
| `Stamp` | id, userId, type, provider, xpAwarded, metadata, createdAt |
| `Claim` | id, token, userCode, verificationUri, expiresAt, status |
| `ModerationAction` | action, reason, notes |
| `SkillReview` | id, skillId, userId, rating, review, createdAt |
| `SkillTag` | id, name, slug, description, color |
| `OAuthTokenResponse` | access_token, token_type, expires_in, scope, did |
| `AgentIdentityResponse` | success, data: { did, assertion, expiresAt } |
| `SandboxExecuteRequest` | code, language, timeout |
| `SandboxExecuteResponse` | output, error, durationMs |
| `DidDocument` | @context, id, alsoKnownAs, verificationMethod, authentication, assertionMethod, service |
| `PassportResponse` | success, data: { did, walletAddress, tier, trustScore, xp, stamps[], piUsername?, agent? } |
| `PiAuthRequest` | accessToken, uid, username |
| `PiAuthResponse` | success, data: { user, did, token? } |
| `KycVerifyRequest` | provider, uidHash, assurance, |
| `PresenceHeartbeatRequest` | agentId |
| `ClaimCheckRequest` | user_code |
| `ApiSuccessResponse` | success, data |
| `ApiErrorResponse` | error, code, details? |

### 4.6 Security

```json
"securitySchemes": {
  "BearerAuth": {
    "type": "http",
    "scheme": "bearer",
    "bearerFormat": "JWT"
  },
  "PiAuth": {
    "type": "apiKey",
    "in": "header",
    "name": "Authorization",
    "description": "Pi Network access token: Bearer <token>"
  }
}
```

All authenticated endpoints tagged with `"security": [{ "BearerAuth": [] }]`.

### 4.7 Standard Error Responses

Every endpoint must document:
- `400` — Validation error (`Error` schema)
- `401` — Unauthorized
- `404` — Not found
- `429` — Rate limited
- `500` — Internal server error

---

## 5. PR #4: PWA Manifest Enhancement

### 5.1 Why

Current PWA manifest is basic. Pi Browser needs capability declarations to discover features
(payments, KYC, social connections).

### 5.2 File to Modify

`src/app/manifest.ts`

### 5.3 Changes

- `categories`: add `"payments"`, `"verification"` to existing `["identity", "utilities", "finance"]`
- `screenshots`: array of screenshot objects for Pi Browser install prompt
- `prefer_related_applications`: set to `false` (prevent Pi Browser from suggesting native app)
- `theme_color` and `background_color`: verify OLED Black `#10131a` (already correct)

No new files needed for this PR (screenshots are out of scope).

---

## 6. Execution Order

```
Branch: feat/did-json-well-known → Merge PR #1 (no deps)
Branch: feat/skill-manifest-seeds → Merge PR #2 (no deps)
Branch: feat/openapi-complete   → Merge PR #3 (references endpoints from PRs #1-2)
Branch: feat/pwa-manifest-pi    → Merge PR #4 (no deps)
```

All 4 branches are independent and can be developed in parallel.

---

## 7. CI/CD Requirements

| Check | PR #1 | PR #2 | PR #3 | PR #4 |
|---|---|---|---|---|
| `npm run type-check` | ✅ | ✅ | ✅ | ✅ |
| `npm run lint` | ✅ | ✅ | ✅ | ✅ |
| `npm test -- --changedSince=origin/main` | ✅ | ✅ | ✅ | ✅ |
| Vercel deploy | ✅ | ✅ | ✅ | ✅ |
| CodeRabbit review | ✅ | ✅ | ✅ | ✅ |
| `skill-quality.yml` | N/A | ✅ | N/A | N/A |

---

## 8. Open Items (Out of Scope)

- Screenshot PNGs for PWA manifest (need design tool)
- Skill marketplace UI for browsing/installing seed skills (separate feature)
- Automated OpenAPI generation from route handlers (future tooling)
- `did:web` resolver in external DID registries (deployment ops)
