# Spend Request: Agentic Pi Payments for AxiomID

> **Date:** 2026-07-07 | **Status:** Approved | **Inspired by:** Stripe Link CLI, Pi SDK | **Principle:** Zero-key exposure — agents request, users approve, Pi SDK executes.

## S1 — Prisma Schema

One new model:

```prisma
model SpendRequest {
  id              String   @id @default(uuid())
  agentId         String
  agent           UserAgent @relation(fields: [agentId], references: [id], onDelete: Cascade)
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  amount          Decimal   @db.Decimal(20, 8)
  currency        String    @default("PI")
  description     String    @db.VarChar(500)
  context         String    @db.Text                        // ≥100 chars, SOUL audit
  items           Json?                                     // [{ name, unit_amount, quantity }]
  status          String    @default("pending")             // pending | approved | rejected | expired | completed
  rejectionReason String?   @db.VarChar(500)                // SOUL learning
  paymentId       String?   @unique                         // links to PiPayment.paymentId
  txid            String?
  createdAt       DateTime  @default(now())
  expiresAt       DateTime                                   // 12h from creation
}
```

`paymentId @unique` is the critical link — after Pi payment completes server-side, SpendRequest points to the PiPayment record. Refs: `prisma/schema.prisma::PiPayment`, `UserAgent`.

## S2 — API Endpoints

- **`POST /api/spend-request`** — Agent creates. Auth required. Validates: context ≥ 100 chars, amount ≤ 500 Pi, agent belongs to user. Returns `{ id, status: "pending", expiresAt }`.
- **`GET /api/spend-request?userId=X&status=pending`** — User lists. Filtered by auth. Sorted by createdAt DESC.
- **`PATCH /api/spend-request/[id]`** — User approves (`{ status: "approved" }`) or rejects (`{ status: "rejected", rejectionReason }`). Rejection triggers TrustScore –0.05 decay.
- **`GET /api/spend-request/stream?agentId=X`** — SSE endpoint for agent polling (Section 6).

Refs: `src/app/api/pi/payment/approve/route.ts:54-76`, `src/app/api/agent/main/route.ts`.

## S3 — Dashboard UI

New component `src/components/dashboard/SpendRequestsPanel.tsx`. Polls `GET /api/spend-request?userId=X&status=pending` every 10s. Displays per request: agent name+avatar, amount, description+context (expandable), line items, countdown timer, [Approve] [Reject] buttons. Approve triggers Pi.createPayment() flow (S4). Reject shows text input for reason.

Refs: `src/app/claim/page.tsx` (polling+Pi SDK), `src/components/dashboard/ErrorBoundary.tsx`.

## S4 — Pi SDK Integration Flow

```
1. User clicks Approve → PATCH /api/spend-request/[id] { status: "approved" }
2. Client: Pi.createPayment({ amount, memo: "AxiomID SR <id>", metadata: { spendRequestId } })
3. Client: POST /api/pi/payment/approve { paymentId }
   → Server IDOR check (paymentData.user_uid === auth.user.piUid)
   → Pi API approve → PiPayment { status: ESCROWED }
4. Client: POST /api/pi/payment/complete { paymentId, txid }
   → Pi API complete → PiPayment { status: RELEASED }, XP+tier updated
5. Client: PATCH /api/spend-request/[id] { status: "completed", paymentId, txid }
6. Agent receives SSE event → executes service
```

Key rules: Pi SDK is browser-only (`typeof window !== 'undefined'` gate), Pi Browser User-Agent required for auth. Refs: `src/lib/pi-sdk.ts:31-70`, `src/app/api/pi/payment/approve/route.ts:78-97`, `src/app/api/pi/payment/complete/route.ts:42-65`.

## S5 — TrustChain Events

| Event | Action Type | Severity | Trust Effect |
|-------|-------------|----------|-------------|
| Request created | `spend_request.created` | info | None |
| Request approved | `spend_request.approved` | info | +0.02 agent TrustScore |
| Request rejected | `spend_request.rejected` | warning | –0.05 agent TrustScore |
| Payment completed | `spend_request.paid` | success | +0.10 agent TrustScore |
| Request expired | `spend_request.expired` | warning | –0.01 agent TrustScore |
| ≥3 consecutive rejected | `spend_request.slashing` | critical | –0.50, agent flagged |

All events write to `Action` table. Refs: `src/lib/trust-chain.ts`, `src/lib/trust-score.ts`, `src/lib/actions.ts`.

## S6 — Agent SSE Stream

`GET /api/spend-request/stream?agentId=X` returns `ReadableStream` with `text/event-stream`. Polls DB every 5s for status changes. Emits `event: status_change\ndata: { id, status, txid? }`. On `abort` signal, clears interval + closes stream. Ponytail: polling-based SSE (no pub/sub infra), works on Vercel Edge, single-direction.

```ts
const stream = new ReadableStream({
  start(controller) {
    let lastStatus = 'pending';
    const interval = setInterval(async () => {
      const sr = await prisma.spendRequest.findFirst({
        where: { agentId, status: { not: 'pending' } },
        orderBy: { createdAt: 'desc' }
      });
      if (sr && sr.status !== lastStatus) {
        lastStatus = sr.status;
        controller.enqueue(encoder.encode(`event: status_change\ndata: ${JSON.stringify({ id: sr.id, status: sr.status })}\n\n`));
      }
      controller.enqueue(encoder.encode(`event: heartbeat\ndata: {"ts":${Date.now()}}\n\n`));
    }, 5000);
    request.signal.addEventListener('abort', () => { clearInterval(interval); controller.close(); });
  }
});
```

## Implementation Order

| Sprint | Scope | Time |
|--------|-------|------|
| 1 | Schema + migrate | 30min |
| 2 | API endpoints | 2hr |
| 3 | Dashboard UI tab | 2hr |
| 4 | Pi SDK wiring | 1hr |
| 5 | TrustChain events | 1hr |
| 6 | SSE stream | 1hr |

**Total: ~7.5hr. Out of scope:** Consent tokens, wallet CLI, auto-approve, marketplace, credit bureau, multi-network.
