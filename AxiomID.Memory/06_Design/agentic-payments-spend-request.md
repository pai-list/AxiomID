---
tags: [design, payments, agents, pi, mvp]
status: seedling
tier: tier-1
last_updated: 2026-07-07
ai_summary: "Spend Request system — agentic Pi payments inspired by Stripe Link CLI. Agents request, users approve, Pi SDK executes. Zero-key exposure."
linked_notes: [PROJECT_STATUS, SOUL]
---

# Agentic Payments: Spend Request Design

**Concept:** Stripe Link CLI pattern adapted for Pi Network. Agent creates a `SpendRequest` with amount, description, context. User approves via Dashboard → Pi SDK executes payment client-side. Agent never sees credentials.

**Key design decisions:**
- One new Prisma model (`SpendRequest`) with `paymentId @unique` link to `PiPayment`
- SSE streaming (`GET /api/spend-request/stream?agentId=X`) for agent notification — polling-based, no pub/sub infra
- No Pi Consent Token — user executes payment directly (Ponytail: unnecessary complexity)
- 3 Featured Agents for MVP: `axiomid-wallet`, `axiomid-passport`, `axiomid-iqra` (no marketplace)

**Auth flow:**
1. Agent: `POST /api/spend-request` → pending
2. User: PATCH approve → `createPayment()` → approve → complete
3. SpendRequest.status → `completed` with `paymentId` link
4. SSE emits `status_change` → agent executes service

**Spec:** `docs/superpowers/specs/2026-07-07-axiomid-spend-request-design.md`
