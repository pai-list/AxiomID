---
name: security-architecture
description: Unified threat model and security architecture for AxiomID backend
tier: Tier 1 (Source of Truth)
last_updated: 2026-05-31
status: Active
---

# AxiomID Security Architecture — Unified Threat Model

> All API routes, attack surfaces, mitigations, and security invariants.

---

## 1. Security Invariants (Never Violate)

1. **No biometric data collection** — identity is software-first, reputation-driven
2. **No hardware dependency** — works on any device with Pi Browser
3. **Pi token verified server-side** — never stored, never exposed to client
4. **HMAC state tokens for wallet connect** — prevents replay attacks
5. **CORS isolation** — subdomains cannot call each other's APIs
6. **Rate limiting on all public endpoints** — prevents abuse
7. **Prisma transactions for atomic operations** — no partial writes

---

## 2. Attack Surface Analysis

### 2.1 Authentication Endpoints

| Route | Attack | Mitigation |
|---|---|---|
| POST /api/auth/pi | Token replay | Pi API verification (server-side), rate limit (5/min) |
| POST /api/auth/pi | Invalid token | Pi API returns 401, we return UNAUTHORIZED |
| POST /api/auth/pi | User enumeration | Same error for all failures |

### 2.2 User Data Endpoints

| Route | Attack | Mitigation |
|---|---|---|
| GET /api/user/status | User enumeration | Rate limit (30/min anonymous), no sensitive data exposed |
| GET /api/user/status | Data leakage | Only returns public profile, not Pi UID or wallet addresses |

### 2.3 Action Endpoints

| Route | Attack | Mitigation |
|---|---|---|
| POST /api/action/claim | Duplicate claims | `user_action_unique` compound index |
| POST /api/action/claim | XP farming | Rate limit (100/min), action validation |
| POST /api/action/claim | Tier manipulation | Tier calculated server-side from XP |

### 2.4 Payment Endpoints

| Route | Attack | Mitigation |
|---|---|---|
| POST /api/pi/payment/approve | Unauthorized payments | Pi API requires valid token |
| POST /api/pi/payment/complete | Double-spend | Prisma transaction, idempotent |
| POST /api/pi/payment/complete | XP manipulation | XP calculated server-side |

### 2.5 Wallet Endpoints

| Route | Attack | Mitigation |
|---|---|---|
| POST /api/auth/connect | Wallet spoofing | HMAC state token with timestamp |
| POST /api/auth/connect | Replay attack | State token expires after 5 min |
| POST /api/auth/connect | Cross-chain confusion | Chain type validated |

---

## 3. Rate Limiting Strategy

### Tiers
- **anonymous**: 30 req/min — public endpoints
- **authenticated**: 100 req/min — user actions
- **piAuth**: 5 req/min — Pi token verification (expensive)
- **payment**: 10 req/min — payment operations

### Implementation
- In-memory Map-based sliding window
- Per-IP tracking for anonymous
- Per-user tracking for authenticated (via piUid header)
- No external dependency (Redis/Upstash) for beta

---

## 4. CORS Architecture

### Phase 1 (Current)
```
axiomid.app → Allow
axiomid.vercel.app → Allow (preview)
sandbox.minepi.com → Allow (dev)
localhost:3000 → Allow (dev)
```

### Phase 4 (Future — Subdomain Isolation)
```
agent-a.axiomid.app → /api/agent/a/* ONLY
agent-b.axiomid.app → /api/agent/b/* ONLY
Cross-subdomain API calls → 403 FORBIDDEN
WebSocket: wss://*.axiomid.app ONLY
```

---

## 5. Data Protection

### What We Store
- `piUid` — Pi user identifier (not biometric)
- `username` — Public display name
- `tier` / `xp` / `level` — Reputation metrics
- `wallet address` — Blockchain identity (EVM/Solana)
- `agent config` — Agent settings and permissions

### What We Never Store
- Pi authentication tokens
- Biometric data
- Private keys (client-side only)
- Session tokens (stateless JWT-free design)

---

## 6. Transaction Safety

### Prisma Transactions Used For
1. **XP claim + user update + tier upgrade** — atomic
2. **Payment completion + XP reward** — atomic
3. **Agent activation + permission update** — atomic (Phase 3)

### Idempotency
- `user_action_unique` prevents duplicate XP claims
- `piPaymentId @unique` prevents duplicate payment processing
- `state` token prevents wallet connect replay

---

## 7. Future Security Enhancements (Phase 3+)

### Circuit Breaker (Phase 3)
- Drawdown limit: -20% of agent balance
- Consecutive failures: 3 → pause agent
- Heartbeat timeout: 60s → pause agent
- Daily spend limit: configurable per agent

### WebSocket Security (Phase 3)
- Context ID + sequence number for state recovery
- 30-minute expiry for inactive connections
- Max 100 messages per context
- Replay protection via sequence validation

### Subdomain Isolation (Phase 4)
- Per-subdomain CORS headers
- Cross-agent API call blocking
- CSP expansion for `*.axiomid.app`

---

## 8. Incident Response

### If Token Compromised
1. User revokes via Pi Browser
2. Server-side: token becomes invalid on next verification
3. No persistent session to invalidate

### If Payment Double-Spent
1. Prisma transaction prevents duplicate
2. `piPaymentId @unique` constraint
3. Log incident for manual review

### If Agent Goes Rogue
1. Circuit breaker trips → agent paused
2. User notified via WebSocket
3. Agent permissions revoked automatically
