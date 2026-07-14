# Data Flow Map — Per-Feature Data Flows

- **Version:** 1.0
- **Generated:** 2026-07-13
- **Agent:** Delta (Phase 3)
- **Confidence:** 95%
- **Sources:** `src/app/api/*/route.ts`, `src/middleware.ts`, `backend/src/router.ts`, `backend/src/index.ts`, `prisma/schema.prisma`
- **Last Verified:** 2026-07-13

## 1. User Authentication Flow

```mermaid
sequenceDiagram
    participant U as User (Pi Browser)
    participant FE as Frontend (Next.js)
    participant M as Middleware
    participant A as POST /api/auth/pi
    participant DB as Neon (Prisma)
    participant PI as Pi SDK

    U->>FE: Click "Sign in with Pi"
    FE->>PI: Pi.authenticate()
    PI-->>FE: { accessToken, user }
    FE->>A: POST /api/auth/pi { accessToken }
    A->>PI: Verify token with Pi API
    PI-->>A: { uid, username, verified }
    A->>DB: Find or create User
    DB-->>A: User record
    A->>A: Set __session cookie (JWT, 7-day expiry)
    A-->>FE: { user, tier, hasAgent }
    FE->>M: Subsequent requests include cookie
    M->>M: Verify JWT, set user headers
```

**Data stored:** User (uid, username, walletAddress, stellarAddress, piUid, piUsername, tier, xp, did, kycStatus, hasAgent)
**Entry point:** `src/app/api/auth/pi/route.ts:30-80`
**Middleware:** `src/middleware.ts:108-135`

## 2. Agent Creation & Identity Flow

```mermaid
sequenceDiagram
    participant U as User
    participant A as POST /api/agent
    participant DB as Neon
    participant C as POST /api/auth/connect
    participant ID as POST /api/agent/identity/activate
    participant CF as Cloudflare Worker

    U->>A: POST /api/agent { name, config }
    A->>DB: Insert UserAgent (waiting_activation)
    DB-->>A: agent record
    A-->>U: { agent, status: "created" }

    U->>C: POST /api/auth/connect { walletAddress }
    C->>C: Derive Ed25519 keypair (@axiomid/crypto)
    C->>DB: Update User with sovereignKey + walletAddress
    DB-->>C: updated user
    C-->>U: { walletAddress, did }

    U->>ID: POST /api/agent/identity/activate { agentId }
    ID->>DB: Update UserAgent → active
    ID->>CF: POST /identity/activate (broadcast)
    CF-->>ID: confirmation
    ID-->>U: { agent, status: "active" }
```

**Entry points:**
- Agent creation: `src/app/api/agent/route.ts:25-90`
- Wallet connect: `src/app/api/auth/connect/route.ts:45-70`
- Identity activation: `src/app/api/agent/identity/activate/route.ts:20-50`

## 3. Passport Mint & Share Flow

```mermaid
sequenceDiagram
    participant U as User
    participant P as POST /api/passport/[slug]/publish
    participant M as POST /api/passport/[slug]/mint
    participant SH as POST /api/passport/[slug]/share
    participant V as POST /api/passport/[slug]/verify
    participant DB as Neon
    participant R2 as Cloudflare R2
    participant ST as Stellar Network
    participant PI as Pi Native Share

    U->>P: POST /api/passport/testuser/publish
    P->>P: Generate passport image
    P->>R2: Upload passport image + metadata
    R2-->>P: { url, cid }
    P->>DB: Upsert Passport (published=true)
    P-->>U: { url, cid }

    U->>M: POST /api/passport/testuser/mint
    M->>M: Create Ed25519 credential proof
    M->>ST: Anchor credential hash (anchorVcHash)
    ST-->>M: Stellar tx hash
    M->>DB: Update Passport (minted=true, txHash)
    M-->>U: { txHash, stellarUrl }

    alt Share
        U->>SH: POST /api/passport/testuser/share
        SH->>PI: Pi.nativeFeature.openShareDialog()
        PI-->>SH: shared/cancelled
        SH-->>U: { shared: true }
    end

    alt Verify
        U->>V: POST /api/passport/testuser/verify
        V->>V: Verify Ed25519 signature
        V->>ST: Verify Stellar anchor
        V-->>U: { verified: true, issuer }
    end
```

**Entry points:**
- Publish: `src/app/api/passport/[slug]/publish/route.ts:40-70`
- Mint: `src/app/api/passport/[slug]/mint/route.ts:25-50`
- Share: `src/app/api/passport/[slug]/share/route.ts:15-35`
- Verify: `src/app/api/passport/[slug]/verify/route.ts:20-60`

## 4. Pi Payment Flow

```mermaid
sequenceDiagram
    participant U as User
    participant AP as POST /api/pi/payment/approve
    participant CP as POST /api/pi/payment/complete
    participant DB as Neon
    participant PI as Pi SDK

    U->>AP: POST /api/pi/payment/approve { amount, metadata }
    AP->>PI: Pi.createPayment({ amount, metadata })
    PI-->>AP: { identifier, tx_hash }
    AP->>DB: Create PiPayment (status=pending)
    AP-->>U: { identifier, tx_hash, status: "pending" }

    Note over U,CP: User confirms in Pi Browser

    U->>CP: POST /api/pi/payment/complete { identifier }
    CP->>PI: Verify payment via Pi API
    PI-->>CP: { verified: true, amount }
    CP->>DB: Update PiPayment (status=completed)
    CP->>DB: Calculate XP (base + multiplier)
    CP->>DB: Update User XP + tier
    CP-->>U: { status: "completed", xp, tier }
```

**Entry points:**
- Approve: `src/app/api/pi/payment/approve/route.ts:20-55`
- Complete: `src/app/api/pi/payment/complete/route.ts:25-70`

## 5. Skill Execution Flow

```mermaid
sequenceDiagram
    participant U as User
    participant E as POST /api/skills/[slug]/execute
    participant DB as Neon
    participant CF as Cloudflare Worker
    participant Q as harvest-queue
    participant KV as agent-kv

    U->>E: POST /api/skills/nlp/execute { input }
    E->>DB: Verify skill ownership
    DB-->>E: { owned: true }
    E->>CF: POST /execute { skill, input, agent }
    CF->>CF: Route to handler (router.ts)
    CF->>KV: Check/cache agent config
    KV-->>CF: agent config
    CF->>Q: Enqueue execution task
    Q-->>CF: taskId
    CF-->>E: { executionId, status: "queued" }
    E-->>U: { executionId, pollUrl }

    Note over U: User polls for result

    Q->>CF: Consume task
    CF->>CF: Execute skill logic
    CF->>DB: Store result (Action model)
    CF-->>E: (via callback or poll)
```

**Entry points:**
- Execute: `src/app/api/skills/[slug]/execute/route.ts:15-60`
- Backend router: `backend/src/router.ts:skills`

## 6. Truth RAG Pipeline

```mermaid
sequenceDiagram
    participant U as User
    participant Q as GET /api/query
    participant CF as Cloudflare Worker (truth)
    participant AI as Workers AI
    participant V as Vectorize
    participant D1 as D1 Database

    U->>Q: GET /api/query?q="what is axiomid?"
    Q->>CF: Forward to truth endpoint
    CF->>AI: Generate embedding (bge-base-en-v1.5)
    AI-->>CF: [768-dim vector]
    CF->>V: Vectorize.search(vector, topK=5)
    V-->>CF: [{ id, score, metadata }]
    CF->>D1: Fetch full verses by id
    D1-->>CF: [{ chapter, verse, text }]
    CF->>AI: Generate answer from context
    AI-->>CF: { response: "..." }
    CF-->>Q: { answer, sources: [...] }
    Q-->>U: { answer, citations }
```

**Backend router:** `backend/src/router.ts:truth`

## 7. Presence Heartbeat Flow

```mermaid
sequenceDiagram
    participant U as User
    participant H as POST /api/presence/heartbeat
    participant DB as Neon
    participant CF as Cloudflare Worker
    participant DO as PresenceDO

    U->>H: POST /api/presence/heartbeat
    H->>DB: Update User.lastSeen
    H->>CF: POST /presence/heartbeat { userId }
    CF->>DO: DO alarm + state update
    DO->>DO: Set 30s inactivity timeout
    DO-->>CF: { online: true, since }
    CF-->>H: { status: "acknowledged" }
    H-->>U: { online: true }

    Note over DO: If no heartbeat for 30s
    DO->>DO: Alarm fires, set offline
    DO->>KV: Update presence cache
```

**Entry point:** `src/app/api/presence/heartbeat/route.ts`
**Durable Object:** `backend/src/index.ts:5-50`

## 8. Sync Flow (Neon → D1)

```mermaid
sequenceDiagram
    participant T as Trigger (Internal)
    participant S as POST /api/sync
    participant PG as Neon
    participant CF as Cloudflare Worker
    participant D1 as D1 Database

    T->>S: POST /api/sync { table, operation, data }
    S->>S: Validate sync payload (Zod)
    S->>PG: Verify source data
    PG-->>S: confirmed
    S->>CF: POST /sync { table, operation, data }
    CF->>D1: Apply to edge database
    D1-->>CF: { changes: N }
    CF-->>S: { synced: true, timestamp }
    S-->>T: { status: "synced" }
```

**Entry point:** `src/app/api/sync/route.ts`

## Data Flow Summary

| Feature | Read From | Write To | External Calls | Async? |
|---------|-----------|----------|----------------|--------|
| Auth | Neon (User) | Neon (User) | Pi SDK verify | No |
| Agent | Neon (UserAgent) | Neon, CF Worker | CF identity broadcast | No |
| Passport | Neon, R2 | Neon, R2, Stellar | Stellar anchor, Pi share | No |
| Payment | Neon (PiPayment) | Neon, Pi SDK | Pi.createPayment() | No |
| Skill Execution | Neon, KV | Neon, CF, Queue | CF Worker, Queue | Yes (Queue) |
| Truth RAG | D1, Vectorize | — | Workers AI (embed + generate) | No |
| Presence | Neon, DO | Neon, DO, KV | CF Durable Object | No (alarm) |
| Sync | Neon | CF Worker → D1 | CF Worker | No |
