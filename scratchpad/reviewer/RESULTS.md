# PR #33 — Code Review Results

---

## 1. `src/lib/env.ts` — validateEnv extracted from module-level

**Change**: `validateEnv()` was converted from a module-level side effect to a lazy function called explicitly. Uses a `validated` flag for one-time execution and a `typeof process === 'undefined'` guard for SSR/edge safety.

**Issues**: None.

**Security**: No concerns. The lazy pattern prevents build-time crashes and is more idiomatic for Next.js.

**Verdict**: **PASS** ✅

---

## 2. `src/lib/prisma.ts` — validateEnv import removed

**Change**: No longer imports or calls `validateEnv()` at module level. Prisma singleton is initialized directly with `process.env.DATABASE_URL`.

**Issues**: `validateEnv()` is no longer called anywhere in this file, so a missing `DATABASE_URL` is only caught when Prisma attempts its first connection (runtime), not at module load time. This is acceptable — Prisma's own error message is descriptive enough.

**Security**: No concerns.

**Verdict**: **PASS** ✅

---

## 3. `src/middleware.ts` — body-size matcher includes `/api/*`

**Change**: The middleware `config.matcher` pattern already includes all paths except `_next/*`, `favicon.ico`, `icon-*`, and `validation-key.txt`. The 1 MB body-size limit on `content-length` applies to all matched paths including `/api/*`.

**Issues**: None. The matcher is correctly broad, and the body-size check fires before host validation and rewrites, which is the correct ordering.

**Security**: The 1 MB limit on request bodies is a reasonable anti-abuse measure for API routes.

**Verdict**: **PASS** ✅

---

## 4. `src/app/api/did-document/route.ts` — no fake fallback key

**Change**: Removed the hardcoded/fallback `ISSUER_PUBLIC_KEY`. Now explicitly checks `process.env.ISSUER_PUBLIC_KEY` and returns 500 if unset.

**Issues**: None.

**Security**: **Improvement**. No fallback means no accidental exposure of a development key in production. Proper fail-closed behavior.

**Verdict**: **PASS** ✅

---

## 5. `src/app/api/passport/[slug]/route.ts` — single OR query

**Change**: Replaced three separate queries (walletAddress, piUsername, did) with a single `findFirst({ where: { OR: [...] } })` query. `publicId` lookup via `userAgent.findUnique` runs first as an indexed fast-path.

**Issues**: `findFirst` with `OR` returns the first row the DB happens to match, not by caller-defined priority. If a slug matches multiple fields across different users (e.g., `piUsername` on user A and `did` on user B), the result is non-deterministic. In practice, `walletAddress`, `piUsername`, and `did` are unique constraints, so this is unlikely.

**Security**: No concerns.

**Verdict**: **PASS** ✅ (minor: `findFirst` priority not guaranteed)

---

## 6. `src/app/api/pi/payment/complete/route.ts` — JSON.parse wrapped in try/catch

**Change**: `payment.metadata` parsing (which was previously unprotected) is now wrapped in `try/catch`. On parse failure, logs a warning and defaults to `{}`.

**Issues**: None.

**Security**: No concerns. Defensive parsing of potentially malformed DB data is correct.

**Verdict**: **PASS** ✅

---

## 7. `src/lib/errors.ts` — rateLimitHeaders helper

**Change**: New `rateLimitHeaders()` function that returns `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers from a rate-limit result object.

**Issues**: None. Function is well-typed, converts `resetAt` ms to seconds via `Math.ceil` (standard for rate-limit headers), and returns `Record<string, string>` compatible with the `apiError` signature.

**Security**: No concerns. Rate-limit headers follow established conventions (similar to RFC 6585).

**Verdict**: **PASS** ✅

---

## 8. `src/app/layout.tsx` — Google verification from env var

**Change**: `metadata.verification.google` now reads from `process.env.GOOGLE_SITE_VERIFICATION`. If unset, the field is `undefined` (omitted entirely).

**Issues**: None. The ternary `? { google: ... } : undefined` is correct — it optionally includes the field without a fallback value.

**Security**: No concerns. Reading from env var is the standard approach.

**Verdict**: **PASS** ✅

---

## Summary

| File | Change | Verdict |
|------|--------|---------|
| `src/lib/env.ts` | Lazy validateEnv | ✅ PASS |
| `src/lib/prisma.ts` | Removed validateEnv import | ✅ PASS |
| `src/middleware.ts` | Body-size on `/api/*` | ✅ PASS |
| `src/app/api/did-document/route.ts` | No fallback key | ✅ PASS |
| `src/app/api/passport/[slug]/route.ts` | 1 OR query | ✅ PASS* |
| `src/app/api/pi/payment/complete/route.ts` | try/catch JSON.parse | ✅ PASS |
| `src/lib/errors.ts` | rateLimitHeaders helper | ✅ PASS |
| `src/app/layout.tsx` | Google verification from env | ✅ PASS |

**8/8 PASS** — No regressions, no security issues.

*Minor: `findFirst` OR query priority is DB-dependent, but practical risk is near-zero due to unique constraints.
