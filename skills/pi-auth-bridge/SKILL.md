---
name: Pi Auth Bridge
slug: pi-auth-bridge
tier: BASIC_TOOL
pricePi: 0
version: "1.0.0"
soulPrinciple: MURAQABAH
chainable: false
tags: [pi-network, authentication, identity, kyc]
---

# Pi Auth Bridge

## الغرض — Purpose

Authenticates Pi Network users and exchanges Pi access tokens for DID assertions.

**English:** Bridges Pi Network's OAuth flow to AxiomID's DID-based identity system. Verifies Pi access tokens, derives Pi-specific DIDs, and issues W3C-compliant verifiable credentials.

**Arabic:** يربط تدفق OAuth الخاص بـ Pi Network مع نظام الهوية القائم على DID في AxiomID. يتحقق من رموز الوصول المشفرة، ويستuD DID المحددة بـ Pi، ويصدر اعتمادات متوافقة مع W3C.

## مبدأ التوافق — Principle Alignment

This skill embodies **MURAQABAH** (المراقبة — Divine Awareness).

Every authentication event is logged with full context. The bridge maintains an honest audit trail:

- **Every action recorded** — Not just for audit, but because the code you write at 3 AM is the same code you'd show on Judgment Day.
- **Private = Public** — No hidden backdoors. No "temporary" hacks that stay forever.
- **Intention matters** — Why you authenticated is as important as how.

## سير التشغيل — Operational Flow

1. **Token reception** — Receive Pi access token from client-side `Pi.authenticate()` callback
2. **Token verification** — POST to `https://api.minepi.com/v2/me` with `Authorization: Key <token>` to verify the token and get user info
3. **DID derivation** — Compute `did:axiom:pi:<uid>` from the verified Pi UID
4. **Assertion creation** — Sign a JWT assertion with the derived DID and requested scopes
5. **Response** — Return the DID, assertion, and user metadata to the client

## أنماط الفشل — Failure Modes

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Invalid Pi token | API returns 401/403 | Return `AUTH_INVALID_TOKEN` error |
| Pi API unavailable | Connection timeout | Return `AUTH_SERVICE_UNAVAILABLE` |
| Token expired | API returns 401 | Prompt user to re-authenticate via Pi Browser |
| Rate limited | API returns 429 | Queue request, retry after Retry-After header |
| User not found in DB | Prisma returns null | Auto-provision new user record with derived DID |
