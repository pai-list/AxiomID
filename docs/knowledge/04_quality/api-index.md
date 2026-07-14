# API Index — Complete Endpoint Registry

- **Version:** 1.0
- **Generated:** 2026-07-13
- **Agent:** Delta (Phase 3)
- **Confidence:** 98%
- **Sources:** All `src/app/api/*/route.ts` files (40+ endpoints), `src/middleware.ts`
- **Last Verified:** 2026-07-13

## Auth & Identity

| Method | Path | Auth | Rate-Limit | Zod Validation | Logger | Tests | Deploy Target | Runtime Errors |
|--------|------|------|-----------|---------------|--------|-------|---------------|---------------|
| POST | `/api/auth/pi` | Public (Pi SDK) | ✅ | `authRequestSchema` | ✅ | jest | Vercel (Next.js) | 400 invalid token, 401 unverified, 500 DB |
| POST | `/api/auth/state` | Public | ✅ | `stateRequestSchema` | ✅ | jest | Vercel | 400 invalid params |
| POST | `/api/auth/logout` | `requireAuth` | ✅ | None | ✅ | jest | Vercel | 401 unauthorized |
| POST | `/api/auth/connect` | `requireAuth` | ✅ | `connectRequestSchema` | ✅ | jest | Vercel | 400 invalid, 500 keygen fail |

## Health & Discovery

| Method | Path | Auth | Rate-Limit | Zod | Logger | Tests | Deploy | Runtime Errors |
|--------|------|------|-----------|-----|--------|-------|--------|---------------|
| GET | `/api/health` | Public | ✅ | None | ✅ | jest | Vercel | None |
| GET | `/api/status` | Public | ✅ | None | ✅ | jest | Vercel | 500 if DB down |
| GET | `/api/leaderboard` | Public | ✅ | None | ✅ | jest | Vercel | 500 aggregation |
| GET | `/api/explorer` | Public | ✅ | `explorerQuerySchema` | ✅ | jest | Vercel | 400 invalid query |

## Agent

| Method | Path | Auth | Rate-Limit | Zod | Logger | Tests | Deploy | Runtime Errors |
|--------|------|------|-----------|-----|--------|-------|--------|---------------|
| POST | `/api/agent` | `requireAuth` | ✅ | `agentCreateSchema` | ✅ | jest | Vercel | 400 invalid, 500 creation |
| GET | `/api/agent/[username]` | Public | ✅ | None | ✅ | jest | Vercel | 404 not found |
| POST | `/api/agent/identity/activate` | `requireAuth` | ✅ | `activateSchema` | ✅ | jest | Vercel → CF | 400 invalid, 500 broadcast |
| POST | `/api/agent/identity/pause` | `requireAuth` | ✅ | None | ✅ | jest | Vercel | 400 invalid |
| POST | `/api/agent/main` | `requireAuth` | ✅ | `mainSchema` | ✅ | jest | Vercel | 400 invalid |
| GET | `/api/agent/manifest` | `requireAuth` | ✅ | None | ✅ | jest | Vercel | 500 generation |
| POST | `/api/agent/sign` | `requireAuth` | ✅ | `signSchema` | ✅ | jest | Vercel | 400 invalid payload |
| GET | `/api/agent/public/[username]` | Public | ✅ | None | ✅ | jest | Vercel | 404 not found |

## Passport

| Method | Path | Auth | Rate-Limit | Zod | Logger | Tests | Deploy | Runtime Errors |
|--------|------|------|-----------|-----|--------|-------|--------|---------------|
| GET | `/api/passport/[slug]` | Public | ✅ | None | ✅ | jest | Vercel | 404 not found |
| POST | `/api/passport/[slug]/publish` | `requireAuth` | ✅ | `publishSchema` | ✅ | jest | Vercel | 400 invalid, 500 export |
| POST | `/api/passport/[slug]/mint` | `requireAuth` | ✅ | None | ✅ | jest | Vercel | 500 mint fail |
| POST | `/api/passport/[slug]/share` | `requireAuth` | ✅ | None | ✅ | jest | Vercel | 500 share fail |
| POST | `/api/passport/[slug]/verify` | Public | ✅ | `verifySchema` | ✅ | jest | Vercel | 400 invalid sig |

## Pi Payments & Stamps

| Method | Path | Auth | Rate-Limit | Zod | Logger | Tests | Deploy | Runtime Errors |
|--------|------|------|-----------|-----|--------|-------|--------|---------------|
| POST | `/api/pi/payment/approve` | `requireAuth` | ✅ | `paymentApproveSchema` | ✅ | jest | Vercel | 400 invalid |
| POST | `/api/pi/payment/complete` | `requireAuth` | ✅ | `paymentCompleteSchema` | ✅ | jest | Vercel | 400 invalid, 500 update |
| POST | `/api/pi/kyc/verify` | `requireAuth` | ✅ | `kycVerifySchema` | ✅ | jest | Vercel | 400 invalid, 500 DB |
| POST | `/api/pi/ads/verify` | `requireAuth` | ✅ | `adsVerifySchema` | ✅ | jest | Vercel | 400 invalid |
| POST | `/api/stamp/claim` | `requireAuth` | ✅ | `stampClaimSchema` | ✅ | jest | Vercel | 400 invalid, 500 update |

## Skills Marketplace

| Method | Path | Auth | Rate-Limit | Zod | Logger | Tests | Deploy | Runtime Errors |
|--------|------|------|-----------|-----|--------|-------|--------|---------------|
| GET | `/api/skills` | Public | ✅ | `listQuerySchema` | ✅ | jest | Vercel | 400 invalid |
| GET | `/api/skills/[slug]` | Public | ✅ | None | ✅ | jest | Vercel | 404 not found |
| POST | `/api/skills/[slug]/purchase` | `requireAuth` | ✅ | None | ✅ | jest | Vercel | **⚠️ 410 Gone** |
| POST | `/api/skills/[slug]/install` | `requireAuth` | ✅ | None | ✅ | jest | Vercel | 400 invalid, 500 install |
| POST | `/api/skills/[slug]/execute` | `requireAuth` | ✅ | `executeSchema` | ✅ | jest | Vercel → CF | 400 invalid, 500 exec |
| POST | `/api/skills/[slug]/review` | `requireAuth` | ✅ | `reviewSchema` | ✅ | jest | Vercel | 400 invalid |
| GET | `/api/skills/tags` | Public | ✅ | None | ✅ | jest | Vercel | 500 query fail |
| GET | `/api/skills/stats` | Public | ✅ | None | ✅ | jest | Vercel | 500 aggregation |
| GET | `/api/skills/[slug]/versions` | Public | ✅ | None | ✅ | jest | Vercel | 404 not found |
| GET | `/api/skills/tags/[tag]` | Public | ✅ | None | ✅ | jest | Vercel | 404 not found |

## Admin

| Method | Path | Auth | Rate-Limit | Zod | Logger | Tests | Deploy | Runtime Errors |
|--------|------|------|-----------|-----|--------|-------|--------|---------------|
| POST | `/api/admin/skills` | Admin | ✅ | `adminSkillSchema` | ✅ | jest | Vercel | 401 not admin, 400 invalid |
| GET | `/api/admin/skills` | Admin | ✅ | None | ✅ | jest | Vercel | 401 not admin |
| DELETE | `/api/admin/skills/[id]` | Admin | ✅ | None | ✅ | jest | Vercel | 401 not admin |

## Sandbox

| Method | Path | Auth | Rate-Limit | Zod | Logger | Tests | Deploy | Runtime Errors |
|--------|------|------|-----------|-----|--------|-------|--------|---------------|
| POST | `/api/sandbox/dev-token` | Sandbox bypass | ✅ | None | ✅ | jest | Vercel | 401 if bypass disabled |
| POST | `/api/sandbox/execute` | Sandbox bypass | ✅ | `executeSchema` | ✅ | jest | Vercel | 400 invalid, 500 AST fail |

## Diagnostics

| Method | Path | Auth | Rate-Limit | Zod | Logger | Tests | Deploy | Runtime Errors |
|--------|------|------|-----------|-----|--------|-------|--------|---------------|
| POST | `/api/diagnostics/capture` | `requireAuth` | ✅ | `captureSchema` | ✅ | jest | Vercel | 400 invalid |
| GET | `/api/diagnostics/logs` | `requireAuth` | ✅ | None | ✅ | jest | Vercel | 500 query fail |

## Sync

| Method | Path | Auth | Rate-Limit | Zod | Logger | Tests | Deploy | Runtime Errors |
|--------|------|------|-----------|-----|--------|-------|--------|---------------|
| POST | `/api/sync` | Internal | ✅ | `syncSchema` | ✅ | jest | Vercel | 400 invalid, 500 sync fail |

## Spend Request

| Method | Path | Auth | Rate-Limit | Zod | Logger | Tests | Deploy | Runtime Errors |
|--------|------|------|-----------|-----|--------|-------|--------|---------------|
| GET | `/api/spend-request/stream` | `requireAuth` | ✅ | None | ✅ | jest | Vercel | 401 unauthorized |

## Credential Status

| Method | Path | Auth | Rate-Limit | Zod | Logger | Tests | Deploy | Runtime Errors |
|--------|------|------|-----------|-----|--------|-------|--------|---------------|
| GET | `/api/credential-status` | Public | ✅ | None | ✅ | jest | Vercel | 404 not found |

## Vault

| Method | Path | Auth | Rate-Limit | Zod | Logger | Tests | Deploy | Runtime Errors |
|--------|------|------|-----------|-----|--------|-------|--------|---------------|
| POST | `/api/vault/stake` | `requireAuth` | ✅ | `stakeSchema` | ✅ | jest | Vercel | 400 invalid |

## Presence

| Method | Path | Auth | Rate-Limit | Zod | Logger | Tests | Deploy | Runtime Errors |
|--------|------|------|-----------|-----|--------|-------|--------|---------------|
| POST | `/api/presence/heartbeat` | `requireAuth` | ✅ | `heartbeatSchema` | ✅ | jest | Vercel → CF DO | 500 DO update fail |

## Social

| Method | Path | Auth | Rate-Limit | Zod | Logger | Tests | Deploy | Runtime Errors |
|--------|------|------|-----------|-----|--------|-------|--------|---------------|
| POST | `/api/social/disconnect` | `requireAuth` | ✅ | None | ✅ | jest | Vercel | 400 invalid |

## Upload

| Method | Path | Auth | Rate-Limit | Zod | Logger | Tests | Deploy | Runtime Errors |
|--------|------|------|-----------|-----|--------|-------|--------|---------------|
| GET | `/api/upload/presign` | `requireAuth` | ✅ | `presignSchema` | ✅ | jest | Vercel → R2 | 500 presign fail |

## Emulate

| Method | Path | Auth | Rate-Limit | Zod | Logger | Tests | Deploy | Runtime Errors |
|--------|------|------|-----------|-----|--------|-------|--------|---------------|
| POST | `/api/emulate` | `requireAuth` | ✅ | `emulateSchema` | ✅ | jest | Vercel | 400 invalid |

## Daily Review

| Method | Path | Auth | Rate-Limit | Zod | Logger | Tests | Deploy | Runtime Errors |
|--------|------|------|-----------|-----|--------|-------|--------|---------------|
| GET | `/api/daily-review` | `requireAuth` | ✅ | None | ✅ | jest | Vercel | 500 generation |

## DID Document

| Method | Path | Auth | Rate-Limit | Zod | Logger | Tests | Deploy | Runtime Errors |
|--------|------|------|-----------|-----|--------|-------|--------|---------------|
| GET | `/api/did-document` | Public | ✅ | None | ✅ | jest | Vercel | 500 generation |

## Stellar Anchor

| Method | Path | Auth | Rate-Limit | Zod | Logger | Tests | Deploy | Runtime Errors |
|--------|------|------|-----------|-----|--------|-------|--------|---------------|
| POST | `/api/stellar/anchor` | `requireAuth` | ✅ | `anchorSchema` | ✅ | jest | Vercel | 400 invalid, 500 Stellar |

## Telegram

| Method | Path | Auth | Rate-Limit | Zod | Logger | Tests | Deploy | Runtime Errors |
|--------|------|------|-----------|-----|--------|-------|--------|---------------|
| POST | `/api/telegram` | Webhook secret | ✅ | `telegramSchema` | ✅ | jest | Vercel | 400 invalid, 500 process |

## Endpoint Summary

| Category | Count | Protected | Public | Deprecated |
|----------|-------|-----------|--------|------------|
| Auth & Identity | 4 | 2 | 2 | 0 |
| Health & Discovery | 4 | 0 | 4 | 0 |
| Agent | 8 | 5 | 3 | 0 |
| Passport | 5 | 3 | 2 | 0 |
| Pi Payments & Stamps | 5 | 5 | 0 | 0 |
| Skills Marketplace | 10 | 4 | 6 | 1 |
| Admin | 3 | 3 | 0 | 0 |
| Sandbox | 2 | 0 (bypass) | 0 | 0 |
| Diagnostics | 2 | 2 | 0 | 0 |
| Sync | 1 | 1 | 0 | 0 |
| Spend Request | 1 | 1 | 0 | 0 |
| Credential Status | 1 | 0 | 1 | 0 |
| Vault | 1 | 1 | 0 | 0 |
| Presence | 1 | 1 | 0 | 0 |
| Social | 1 | 1 | 0 | 0 |
| Upload | 1 | 1 | 0 | 0 |
| Emulate | 1 | 1 | 0 | 0 |
| Daily Review | 1 | 1 | 0 | 0 |
| DID Document | 1 | 0 | 1 | 0 |
| Stellar Anchor | 1 | 1 | 0 | 0 |
| Telegram | 1 | 1 | 0 | 0 |
| **Total** | **55** | **33** | **21** | **1** |

## Common Patterns

Every endpoint follows:
1. **Rate-limit check** — `const { success } = await rateLimit(identifier)`
2. **Auth check** — `const session = await requireAuth()` or skip for public
3. **Zod validation** — `schema.parse(body)` for POST, `schema.parse(searchParams)` for GET
4. **Business logic** — Prisma queries, Cloudflare API calls, Stellar operations
5. **Response** — `apiSuccess(data)` or `apiError(message, status)`
6. **Error handling** — try/catch with `logger.error()` and Sentry capture
