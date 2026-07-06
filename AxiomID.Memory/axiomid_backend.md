---
name: axiomid-backend
description: Complete AxiomID backend documentation — API routes, Prisma schema, error handling, rate limiting
tier: Tier 1 (Source of Truth)
last_updated: 2026-05-31
status: Active
---

# AxiomID Backend — Phase 1 Complete Reference

> Backend API for AxiomID identity gateway. 6 routes + middleware + 3 lib files. 52 unit tests. All passing.

---

## 1. File Inventory

### New Files Created (Phase 1)

| File | Purpose | Lines |
|---|---|---|
| `src/lib/errors.ts` | Standardized API error responses | ~50 |
| `src/lib/rate-limiter.ts` | Sliding-window rate limiter (4 tiers) | ~80 |
| `src/lib/validators.ts` | Zod input schemas (6 schemas) | ~100 |
| `src/middleware.ts` | CORS whitelist + OPTIONS + security headers | ~40 |
| `src/app/api/auth/pi/route.ts` | Pi token verification + user upsert | ~60 |
| `src/app/api/user/status/route.ts` | User profile + tier + XP + level | ~80 |
| `src/app/api/action/claim/route.ts` | Claim XP with duplicate detection | ~70 |
| `src/app/api/auth/connect/route.ts` | Wallet connect + HMAC state | ~50 |
| `src/app/api/pi/payment/approve/route.ts` | Server-side Pi payment approval | ~60 |
| `src/app/api/pi/payment/complete/route.ts` | Payment completion + XP reward | ~70 |

### Test Files

| File | Tests | Coverage |
|---|---|---|
| `src/__tests__/validators.test.ts` | 16 | All 6 Zod schemas |
| `src/__tests__/rate-limiter.test.ts` | 7 | Window reset, max requests |
| `src/__tests__/errors.test.ts` | 10 | All error codes |
| `src/__tests__/auth-pi.test.ts` | 5 | Valid/invalid/missing tokens |
| `src/__tests__/user-status.test.ts` | 4 | Found/not-found, with/without agent |
| `src/__tests__/action-claim.test.ts` | 5 | Claim/duplicate/expired/tier upgrade |

---

## 2. API Routes — Signatures

### POST /api/auth/pi
```typescript
Input: { token: string }
Output: { user: { id, piUid, username, tier, xp, level } }
Auth: None (public endpoint)
Pi API call: GET https://api.minepi.com/v2/users/me (Bearer token)
```

### GET /api/user/status
```typescript
Input: { piUid: string } (query param)
Output: { user: { id, username, tier, xp, level, agent?, recentLedger[] } }
Auth: None (public, but returns limited data)
```

### POST /api/action/claim
```typescript
Input: { piUid: string, action: string, metadata?: object }
Output: { claim: { id, xpEarned, totalXp, newTier? } }
Auth: None (public, but validates user exists)
Prisma transaction: XP insert + user update + optional tier upgrade
Duplicate detection: user_action_unique (piUid + action)
```

### POST /api/auth/connect
```typescript
Input: { address: string, chain: 'evm'|'solana', state: string, signature: string }
Output: { connected: true }
Auth: HMAC state token verification via verifyState()
```

### POST /api/pi/payment/approve
```typescript
Input: { piUid: string, amount: number, memo: string }
Output: { payment: { id, status: 'pending' } }
Auth: None
Pi API call: POST https://api.minepi.com/v2/payments
```

### POST /api/pi/payment/complete
```typescript
Input: { paymentId: string, piUid: string }
Output: { completed: true, xpEarned: number }
Auth: None
Prisma transaction: payment status update + XP insert + user update
```

---

## 3. Middleware Configuration

### CORS Whitelist
- `axiomid.app` — production domain
- `axiomid.vercel.app` — preview deployments
- `sandbox.minepi.com` — Pi Browser sandbox (dev)
- `localhost:3000` — local development

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`

### OPTIONS Handling
- Returns 200 with CORS headers for preflight requests
- Applies to all `/api/:path*` routes

---

## 4. Rate Limiter Tiers

| Tier | Window | Max Requests | Use Case |
|---|---|---|---|
| anonymous | 60s | 30 | Public endpoints |
| authenticated | 60s | 100 | User actions |
| piAuth | 60s | 5 | Pi token verification |
| payment | 60s | 10 | Payment operations |

---

## 5. Error Response Format

```typescript
{
  error: string,        // Human-readable message
  code: ErrorCode,      // Machine-readable code
  details?: unknown     // Optional validation details
}
```

### Error Codes
- `VALIDATION_ERROR` — Invalid input
- `UNAUTHORIZED` — Missing/invalid auth
- `NOT_FOUND` — Resource not found
- `CONFLICT` — Duplicate action
- `RATE_LIMITED` — Too many requests
- `PI_API_ERROR` — Pi API failure
- `PAYMENT_FAILED` — Payment processing error
- `INTERNAL_ERROR` — Server error
- `FORBIDDEN` — Insufficient permissions

---

## 6. Prisma Schema Additions (Existing)

```prisma
model User {
  id        Int      @id @default(autoincrement())
  piUid     String   @unique
  username  String?
  tier      String   @default("BRONZE")
  xp        Int      @default(0)
  level     Int      @default(1)
  agent     Agent?
  ledger    LedgerEntry[]
  actions   UserAction[]
  wallets   Wallet[]
}

model UserAction {
  id        Int      @id @default(autoincrement())
  piUid     String
  action    String
  xpEarned  Int
  metadata  Json?
  createdAt DateTime @default(now())
  
  @@unique([piUid, action])
}

model PiPayment {
  id        Int      @id @default(autoincrement())
  piPaymentId String @unique
  piUid     String
  amount    Float
  memo      String?
  status    String   @default("pending")
  createdAt DateTime @default(now())
}
```

---

## 7. Key Decisions

1. **In-memory rate limiter** — acceptable for beta, no external dependency. Upgrade to Upstash in production.
2. **CORS whitelist hardcoded** — will expand with subdomain system in Phase 4.
3. **No WebSocket in Phase 1** — added in Phase 3 (agent backend).
4. **Pi auth is server-side** — token verified against Pi API, never stored.
5. **XP rewards are immediate** — calculated and applied in same transaction.
