# AxiomID Progress Log

> Chronological record of significant project milestones.
> Updated: 2026-07-07

---

## 2026-05-28 — DID Framework + Pi Auth

- Ed25519 sovereign key derivation (`src/lib/did-document.ts`)
- Pi Browser authentication (`src/app/api/auth/pi/route.ts`)
- HMAC state tokens for wallet connect
- Initial Prisma schema (User, UserAgent, PiPayment)

---

## 2026-05-31 — Backend Phase 1

- 6 API routes: auth, user, action, wallet, payments, status
- Middleware, validators, rate limiter, error responses
- 52 unit tests, all passing

---

## 2026-06-01 — Agent Backend + Marketplace

- Agent CRUD + activate + pause
- Skill marketplace (install, execute, review)
- Admin moderation with `$transaction`
- 100+ tests added

---

## 2026-06-07 — Frontend Overhaul

- Landing page (Islands Architecture)
- Claim wizard (5-step identity flow)
- Dashboard (Identity, Marketplace, Settings tabs)
- Public passport viewer (`/passport/[slug]`)
- Explorer + leaderboard

---

## 2026-06-14 — Pi2Day Integration

- Pi SDK v2.0 integration (`src/lib/pi-sdk.ts`)
- `determineSandboxMode()` cascade (never hardcode)
- Pi Browser compliance (HTTPS, safe-area-inset, 48px targets)
- Payment flow (create → approve → complete)

---

## 2026-06-21 — Trust System + XP

- Trust score calculation (`src/lib/trust.ts`)
- XP ledger + level progression
- Delegated trust system
- Trust tiers (Visitor, Citizen, Validator, Sovereign)

---

## 2026-06-28 — IQRA + Knowledge Graph

- IQRA sovereign standard (`docs/IQRA.md`)
- Obsidian-style backlinks
- 6 Heartbeats system
- D3.js neural mesh visualization

---

## 2026-07-01 — Security Hardening

- P0 security fixes (PR #290):
  - `agentId` on SkillExecution records
  - `$transaction` for admin moderation
  - PEM→multibase DID conversion
  - `passportUrl` saved after IPFS publish
- Dependabot + Code Scanning (PR #291):
  - 14/19 vulnerabilities resolved
  - ReDoS fix in ast-scanner.ts

---

## 2026-07-05 — CI/CD + MVP Bugs

- Expert auto-labeler (PR #288): 7-stage pipeline
- CI fixes (PR #293): `--provenance` for npm, `--ignore-scripts` for skill-quality
- MVP bugs (PR #292): 7 items — CSS, i18n, polling, accessibility, rate limiting

---

## 2026-07-07 — Knowledge Base Cleanup

- Vault audit: 12 old Amrikyy Python files deleted
- PROJECT_STATUS.md rewritten as single source of truth
- README test counts corrected
- 24MB dead weight removed from AxiomID.Memory

---

---

## 2026-07-07 — Spend Request Design (Agentic Pi Payments)

- Stripe Link CLI deep research + pattern match to Pi SDK
- SpendRequest Prisma model designed (1 table, paymentId @unique link to PiPayment)
- 6-section spec written to `docs/superpowers/specs/2026-07-07-axiomid-spend-request-design.md`
- SSE streaming agent notification pattern (polling-based, no pub/sub)
- 3 Featured Agents confirmed for MVP: axiomid-wallet, axiomid-passport, axiomid-iqra
- Marketplace deferred to Phase 2 (cold-start avoidance, security)
- 2 AxiomID Memory notes updated (06_Design + this log)

---

*This log records actual completed work only. No planned or aspirational items.*
