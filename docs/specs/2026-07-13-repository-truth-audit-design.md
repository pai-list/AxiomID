# Repository Truth Audit (RTA) — Engineering Intelligence System

**Date:** 2026-07-13
**Author:** OpenCode (structured from user session)
**Status:** Draft v3 — pending user review
**Version:** 3.0

---

## 1. Why This Exists

AxiomID has a strong **Operational Layer** (AGENTS.md, SOUL protocol, CI/CD, PR workflow — praised by external audits). What it lacks is an **Engineering Intelligence System** — a persistent governance layer that answers:

> "Why did we make this decision, and is it still correct 6 months later?"

A **Knowledge System** catalogs inventory. An **Engineering Intelligence System** traces every Claim through an evidence chain, tags decisions with context and expiry, surfaces Broken Truths before they cause damage, and ensures the project remains aligned with its ecosystem (Pi, W3C, Cloudflare) over time.

---

## 2. Core Concept: The Truth Chain

Every Claim in the project must have an unbroken evidence chain spanning all 5 layers:

```
KNOWLEDGE LAYER
    Claim (in AxiomID.Memory — "Pi Browser Supported")
    ↓
    README.md (stated publicly)
    ↓
    Architecture Docs (designed)

IMPLEMENTATION LAYER
    ↓
    Source Code (implemented in src/, backend/, packages/)

DEPLOYMENT LAYER
    ↓
    CI/CD Pipeline (built and deployed automatically)
    ↓
    Release (shipped to Vercel / Cloudflare / Pi App Studio)

RUNTIME LAYER
    ↓
    Running App (verified running in production with correct version)
    ↓
    Logs & Metrics (no errors, healthy, performing as expected)

REALITY LAYER
    ↓
    End-to-End Verified (works on real Pi Browser with real Pi SDK against real network)
    ↓
    Real User Flow (user can complete the intended journey without bugs)
```

If any link in this chain is broken, it is a **Broken Truth**.

Broken Truth severity levels:
- **Catastrophic:** Claim exists in Memory but Reality shows it does not work (e.g., "Pi Browser Supported" but Pi users get errors)
- **Critical:** Claim exists in Memory but has zero implementation (false advertising)
- **High:** Code exists but no tests, or tests fail, or Runtime shows errors
- **Medium:** Code exists but documentation is outdated, or deployment config is wrong
- **Low:** Website or README lags behind implementation

---

## 3. The 3 Stages, 8 Phases

```
Stage 1 — READ-ONLY BASELINE (Phases 0-6)
    No EXISTING files modified. New knowledge artifacts are CREATED in
    docs/knowledge/ (which does not exist yet). This is not a contradiction:
    we are observing existing code/docs and synthesizing findings into NEW
    audit files. No source code, no Memory files, no configuration is touched.

Stage 2 — APPROVAL GATE
    Findings reviewed. Priorities set. Execution planned.

Stage 3 — REPOSITORY MODERNIZATION (Phase 7)
    One PR per structural change. Measurable Before vs. After.
```

---

## 4. Phase 0 — Repository Truth Audit (RTA)

**Goal:** Validate every Claim in AxiomID.Memory against reality.

**Input:** All 20 files in `AxiomID.Memory/`

**Method:** For each file, extract all factual claims. For each Claim, trace the evidence chain across all 5 layers. Report broken links.

**Audit Questions (3 per layer — 15 total across all 5 Truth Chain layers):**

| # | Question | Layer | Method |
|---|----------|-------|--------|
| 1 | Does Memory document the feature with sufficient detail? | Knowledge | Read `AxiomID.Memory/*` — is the Claim specific and verifiable? |
| 2 | Are architecture docs aligned with Memory claims? | Knowledge | Compare `docs/page.tsx`, `AGENTS.md` architecture map, and README against Memory |
| 3 | Is there undocumented code or knowledge without implementation? | Knowledge | Features in Memory but not in code, and code not referenced in any Memory file |
| 4 | Does the source code implement the feature as claimed? | Implementation | Trace from Claim → code path → API handler / component / worker |
| 5 | Are there tests covering the implementation? | Implementation | Check Jest test files, test coverage %, and any E2E smoke tests |
| 6 | Is the implementation complete (no TODOs, stubs, or dead branches)? | Implementation | Search for TODO/FIXME/HACK comments, stub functions, incomplete feature flags |
| 7 | Is the feature deployed to production? | Deployment | Check Vercel, Cloudflare Workers, Pi App Studio — is the code shipped? Which version? |
| 8 | Are deployment configs correct (routes, env vars, secrets)? | Deployment | Verify `wrangler.toml`, `next.config.ts`, Vercel env vars, CI/CD pipeline definitions |
| 9 | Is the deployment healthy and up to date? | Deployment | Check deploy logs, rollback history, version tag matches latest release |
| 10 | Is the running instance error-free? | Runtime | Check logs, error rates, 5xx responses, crash reports, memory/CPU metrics |
| 11 | Does the runtime match the architecture diagram? | Runtime | Verify that actual running endpoints, workers, and DBs match the documented architecture |
| 12 | Are runtime dependencies (env vars, secrets, service bindings) correctly configured? | Runtime | Check D1 bindings, KV namespaces, Neon DATABASE_URL, Pi SDK keys in production |
| 13 | Does it work on Pi Browser? | Reality | Manual or scripted check — open the app in Pi Browser, verify the flow end-to-end |
| 14 | Does it work with the real Pi SDK (not sandbox)? | Reality | Can a user authenticate, create payment, share passport? Traced against real SDK |
| 15 | Does the user journey complete without bugs? | Reality | Full end-to-end: land → connect → claim → deploy → view passport. Every step must work |

**Output:**
- `docs/knowledge/00_truth/repository-truth-audit.md`
- `docs/knowledge/00_truth/source-of-truth-declaration.md`

---

## 5. Phase 1 — Repository Map + System Inventory

### 5.1 Repository Map

`docs/knowledge/01_repository/repository-map.md`

Every folder: Purpose / Owner / Depends On / Used By / Status / Documentation. Covers the entire `src/`, `backend/`, `packages/`, `prisma/`, `scripts/`, `.github/` tree.

### 5.2 System Inventory (CMDB)

`docs/knowledge/01_repository/system-inventory.md`

Every **Asset** in the project gets a record. This is the Configuration Management Database (CMDB):

| Asset | Type | Owner | Source of Truth | Tests | CI | Docs | Deploy | Status |
|-------|------|-------|-----------------|-------|----|------|--------|--------|
| Passport API | API | Backend | Memory | ✅ | ✅ | ✅ | Vercel | Production |
| Trust Engine | Library | Core | Memory | ✅ | ✅ | ⚠️ | Cloudflare | Production |
| Pi Login | Feature | Identity | Memory | ✅ | ✅ | ✅ | Vercel | Stable |

All assets: APIs, libraries, features, workers, packages, databases, pipelines, workflows.

### 5.3 Feature Catalog

`docs/knowledge/01_repository/feature-catalog.md`

Every feature extracted from Memory + Code with status and trace links.

### 5.4 Package Index

`docs/knowledge/01_repository/package-index.md`

Every package + dependencies + workspace status + license (moved from Phase 5).

---

## 6. Phase 2 — Platform Compliance

AxiomID is not a website — it is a **Platform** living within multiple ecosystems. This phase measures compliance with every platform the project touches.

Platform scope (extensible):

```
Pi Network
W3C DID
Verifiable Credentials (VC)
OIDC / OpenID
Cloudflare
Next.js
Vercel
PWA
MCP
AI Agents
Browser APIs (Chrome / Safari / Edge / Pi Browser)
```

| File | Content |
|------|---------|
| `docs/knowledge/03_compliance/pi-platform.md` | Pi Browser, Pi SDK, Pi Auth, Pi Payments, Pi Domains, Pi App Studio, Sandbox, Testnet, Mainnet. Each: Requirement / Current Status / Implementation / Missing / Priority |
| `docs/knowledge/03_compliance/pi-sdk-audit.md` | Deep audit: login/logout/payments/user object/sandbox/callbacks/error handling/mobile/desktop/wallet flow/auth flow |
| `docs/knowledge/03_compliance/browser-compatibility.md` | Chrome / Safari / Edge / Pi Browser. Checks: window, navigator, storage, cookies, PWA, Service Worker, deep links, camera, wallet, permissions, offline mode, installability |
| `docs/knowledge/03_compliance/standards.md` | W3C DID, Verifiable Credentials, OIDC, OAuth2, JSON-LD, DID Core, DID Resolution, MCP. Each: Supported / Partial / Missing / Planned |
| `docs/knowledge/03_compliance/ai-agents.md` | AI agent readiness: MCP support, agent discoverability, DID resolution for agents, agent identity verification |
| `docs/knowledge/03_compliance/pwa.md` | PWA compliance: manifest, service worker, offline support, installability, update flow |

---

## 7. Phase 3 — Traceability + Architecture + Runtime

### 7.1 Traceability & API Index

| File | Content |
|------|---------|
| `docs/knowledge/04_quality/traceability.md` | Feature → README / Memory / Architecture / Code / Deployed / Running / Verified. Cross-reference across ALL 5 layers. Each Claim has 7 checkboxes. |
| `docs/knowledge/04_quality/api-index.md` | Every API endpoint: method, path, auth, rate-limited, zod-validated, logger, test coverage, deploy status, runtime error rate |

### 7.2 Architecture Views

| File | Content |
|------|---------|
| `docs/knowledge/02_architecture/runtime-architecture.md` | Full runtime call chain for investors: Pi Browser → Next.js → Middleware → API Route → Cloudflare Worker → Neon/D1/R2 → Stellar → Pi Network |
| `docs/knowledge/02_architecture/runtime-topology.md` | Full stack topology for staff engineers: Browser → Next.js → API → Cloudflare Worker → Neon → D1 → R2 → Vectorize → Workers AI. Layer-by-layer breakdown with protocols, ports, data formats. |
| `docs/knowledge/02_architecture/data-flow-map.md` | Per-feature data flow. Example: Pi Login → JWT → Trust Engine → Passport → Credential → Anchor → Verification. Every feature must have a flow. |
| `docs/knowledge/02_architecture/deployment-matrix.md` | Vercel / Cloudflare Workers / Pi Browser / Pi App Studio / Docker / Self-hosted. Current support + planned (moved from Phase 5). |

### 7.3 Runtime Verification

`docs/knowledge/04_quality/runtime-verification.md`

For every key Claim, is it actually running in production? Healthy? Error-free? This is the bridge between "code exists" and "it works for users." Each Claim gets:
- Deployed? (version, URL)
- Running? (last seen, health)
- Errors? (rate, severity)
- Verified? (who verified, when, how)
- Pi Reality Check? (tested on real Pi Browser with real SDK)

---

## 8. Phase 4 — Dead Content + Gaps + Developer Experience

| File | Content |
|------|---------|
| `docs/knowledge/04_quality/dead-content.md` | Zombie files, duplicate docs, broken links, old roadmap items, unused diagrams, deprecated examples, orphaned scripts |
| `docs/knowledge/04_quality/ecosystem-gap-analysis.md` | "Pi supports X → AxiomID supports Y → Gap → Recommendation" for every ecosystem dimension |
| `docs/knowledge/04_quality/documentation-coverage.md` | Feature × 6 doc types: README, Docs, Architecture, API Docs, Tutorial, Examples |
| `docs/knowledge/04_quality/implementation-coverage.md` | Code exists vs documented. Matrix of coverage gaps. |
| `docs/knowledge/04_quality/developer-experience.md` | Time-to-first-commit, Quick Start quality, Examples, Tutorials, FAQ, Troubleshooting quality |

---

## 9. Phase 5 — Unified Graph + Domain Model + Decision History

### 9.1 Unified Capability × Dependency × Ownership Graph

`docs/knowledge/02_architecture/capability-graph.md`

This is the single most important document in the system. It combines three graphs:

1. **Capability Graph** — Every component tagged: Implemented / Experimental / Planned / Deprecated
2. **Dependency Graph** — Directed edges showing what depends on what:
   ```
   Passport
    ↓ depends on
   Identity → Trust → Crypto → SDK → Workers → Database → Pi Auth
   ```
3. **Ownership Graph** — Every component mapped to owner/team/subsystem

Any agent can read this single file and understand the project in minutes.

### 9.2 Architecture Index

`docs/knowledge/02_architecture/architecture-index.md`

Every architecture decision + code location + date + still-valid? check.

### 9.3 Decision History

`docs/knowledge/05_dna/decision-history.md`

A chronological timeline of every major architectural decision. Not just ADRs — a **living history** that shows the project's evolution:

```
2026-01 | Firebase Selected       | REJECTED | Vendor lock-in, no edge compute
2026-02 | Neon PostgreSQL          | ACCEPTED | Postgres compatibility, serverless
2026-03 | Cloudflare D1 + Workers  | ADDED    | Edge compute for low-latency queries
2026-04 | Pi SDK v2 Integration    | ACCEPTED | Native Pi Browser auth + payments
2026-05 | TanStack Query v5        | REPLACED | Replaced SWR for better caching + mutations
2026-06 | Prisma → D1 Sync         | ADDED    | Transactional outbox pattern for edge-DB sync
```

Each entry: Date / Decision / Status (Accepted/Rejected/Added/Replaced/Superseded) / Rationale / Code Location / Who Decided.

### 9.4 Workflow Index

`docs/knowledge/01_repository/workflow-index.md`

Every CI/CD workflow + trigger + purpose + status (moved from Phase 5 for better organization).

### 9.5 Domain Model & Glossary

| File | Content |
|------|---------|
| `docs/knowledge/00_truth/domain-model.md` | Unified language for every domain concept (Identity, Passport, Credential, Trust, Agent, Wallet, Verification, Attestation, Proof, Anchor, Session). Each: Definition / Owner / Location / Dependencies / Status |
| `docs/knowledge/00_truth/glossary.md` | Terms list: Truth Chain, Capability, Evidence, Broken Truth, SOUL, AIP, Trust Graph, Living Passport, RTA, SSoT, and all domain terms |

---

## 10. Phase 6 — Platform Governance

This is the **living oversight layer**. While Phases 0-5 measure internal consistency, Phase 6 measures external alignment with the ecosystems the project depends on.

| File | Content |
|------|---------|
| `docs/knowledge/03_compliance/ecosystem-governance.md` | Master governance document. Tracks all external ecosystem requirements and AxiomID's compliance status over time. |
| `docs/knowledge/03_compliance/pi-platform-readiness.md` | Pi Browser / Pi App Studio / Pi SDK / Pi Network compatibility certification. What must be true before labeling a release "Pi Ready." |
| `docs/knowledge/03_compliance/browser-certification.md` | Certification checklist for each browser target. Renewed per release. |
| `docs/knowledge/03_compliance/interoperability-report.md` | Cross-platform: Can a W3C DID from another resolver work here? Can an OIDC identity provider integrate? |
| `docs/knowledge/03_compliance/standards-watch.md` | Tracking changes in: Pi SDK, W3C DID Core, Verifiable Credentials, MCP, Cloudflare Workers, Next.js. When upstream changes, does AxiomID need to update? |

---

## 11. Phase 7 — Repository Modernization (Separate PRs)

Each change is its own PR. No "mega PRs."

| PR | Change | Based on Finding From |
|----|--------|----------------------|
| PR-A | `.gitignore` cleanup (add `axiomidrules`, `portless.json`, `task.md`) | Dead Content Report |
| PR-B | Rename `.superpowers/` → `.ai/` | Repository Map |
| PR-C | Clean repository root (remove personal/dev artifacts) | Dead Content Report |
| PR-D | Fix CHANGELOG SemVer violation (`1.0.0` → `0.1.x` ordering) | Repository Truth Audit |
| PR-E | Introduce npm workspaces for `packages/` | Package Index |
| PR-F | Expand `CONTRIBUTING.md` from 36 lines → full guide | Developer Experience |
| PR-G | Adopt `docs/knowledge/` directory with all artifacts | (This audit itself) |
| PR-H | Add `docs/knowledge/05_dna/decision-history.md` first entries | Decision History |
| PR-I | Add OpenAPI spec for 20+ API routes | API Index + Standards Compliance |
| PR-J | Archive `iqra-core/` or integrate properly | Dead Content Report |
| PR-K | Add `[[routes]]` to `wrangler.toml` | Workflow Index |
| PR-L | Create `AxiomID.Memory/reference/` standards directory | Platform Governance |

---

## 12. The Living Architecture

Static architecture diagrams die the moment they're drawn. AxiomID needs a **Living Architecture** — every PR updates it:

```
PR
    ↓
Architecture Diff  (what changed in the system structure?)
    ↓
Knowledge Diff    (what docs need updating?)
    ↓
Capability Diff   (what changed in implemented/experimental/planned?)
    ↓
Deployment Diff   (any new endpoints, workers, routes?)
    ↓
Repository Truth Score (opened / resolved / discovered this cycle)
```

The truth score tracks three independent counters:
- **Opened:** total Broken Truths found this audit cycle
- **Resolved:** Broken Truths fixed since last audit
- **Newly discovered:** Broken Truths found that previously went undetected

A truthful audit WILL discover new Broken Truths — the count can increase even as the repository improves. Separate tracking prevents incentivizing suppression of findings. The goal is: **resolved > newly discovered** over any rolling window.

This is tracked in `docs/knowledge/02_architecture/living-architecture.md` and fed by the CI pipeline.

---

## 13. Repository DNA

While the Living Architecture tracks **change**, Repository DNA captures **permanence** — the principles that should not change even in 5 years. It exists in two forms:

### 13.1 Human-Readable

`docs/knowledge/05_dna/repository-dna.md`

Immutable principles of the repo, architecture, knowledge, security, and ecosystem.

### 13.2 Machine-Readable (AI-Native Entry Point)

`docs/knowledge/05_dna/repository-dna.json`

A structured JSON file that any future agent reads INSTEAD of scanning 150K lines of code:

```json
{
  "project": "AxiomID",
  "version": "1.0.0",
  "modules": ["passport", "identity", "trust", "crypto", "sdk", ...],
  "capabilities": ["claim", "verify", "deploy", "attest", ...],
  "entities": ["User", "Passport", "Credential", "Agent", "Wallet", ...],
  "routes": ["/api/auth/pi", "/api/passport/[slug]", ...],
  "components": ["Header", "Footer", "PassportView", "ClaimFlow", ...],
  "packages": ["@axiomid/crypto", "@axiomid/sdk"],
  "agents": ["Alpha", "Beta", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", "Omega"],
  "workflows": ["ci.yml", "codeql.yml", "loops.yml", ...],
  "documents": ["AGENTS.md", "CHANGELOG.md", "CONTRIBUTING.md", ...],
  "dependencies": {
    "passport": ["identity", "trust", "crypto"],
    "identity": ["pi-sdk", "did"],
    "trust": ["crypto", "database"]
  },
  "trust_relationships": {
    "pi-sdk": ["auth", "payments"],
    "did": ["resolution", "verification"]
  },
  "knowledge_relationships": {
    "source-of-truth": "AxiomID.Memory",
    "decision-history": "docs/knowledge/05_dna/decision-history.md"
  }
}
```

This makes AxiomID **AI-native** — any agent, current or future, can bootstrap from this single file.

### DNA Principles (Examples)

- "Why Cloudflare?" — Edge compute, D1 for global low-latency, Workers AI for vector embeddings, Pi ecosystem runs on Cloudflare
- "Why DID?" — W3C standard, vendor-neutral, AI-agent-friendly, self-sovereign
- "Why Pi first?" — 60M+ users, mobile-first, crypto-native, KYC'd population, active developer ecosystem
- "Why NOT OAuth-only?" — OAuth is identity delegation, not identity. AxiomID needs portable identity, not app-specific tokens
- "What won't we change?" — Append-only TrustChain, hash-chained events, self-sovereign identity, zero-knowledge philosophy
- "How must TrustChain state be read?" — Reads MUST derive from the event log, never from mutable "current state" projections. Projections are views, never the authoritative record.

---

## 14. The Three Sources of Truth

Every agent reads all three before writing any report:

```
Source A: AxiomID.Memory/          ← Internal truth (what WE claim about ourselves)
Source B: AxiomID.Memory/reference/ ← External truth (what the ECOSYSTEM requires)
Source C: docs/knowledge/          ← Synthesized truth (what the audit discovered)
```

> **Note:** Source B (`AxiomID.Memory/reference/`) does not yet exist during Stage 1 — it is created in Phase 7 (PR-L). During Stage 1, agents rely on Source A + knowledge of external standards from public documentation (W3C, Pi SDK, Cloudflare docs). Source B is tracked as a known gap and will be populated during modernization.

Then compares code + docs against **all available sources**. This catches:
- "We claim DID compliance but don't implement DID Resolution"
- "Pi SDK requires X callback but we only handle Y"
- "W3C expects Z format but we use something else"

### Reference Standards Directory (created in Phase 7, PR-L)

```
AxiomID.Memory/reference/
  pi-network/
    browser-requirements.md
    sdk-reference.md
    payment-flow.md
    app-studio-guide.md
  did/
    w3c-did-core.md
    did-resolution.md
  vc/
    verifiable-credentials.md
    json-ld.md
  mcp/
    model-context-protocol.md
  cloudflare/
    workers-best-practices.md
    d1-guide.md
  nextjs/
    app-router.md
    best-practices.md
```

---

## 15. Repository Metrics

Every audit run measures and records:

| Metric | Source | Target |
|--------|--------|--------|
| Number of APIs | API Index | Tracked |
| Number of Components | System Inventory | Tracked |
| Dead Code (unused exports) | knip | 0 |
| Broken Links | Dead Content Report | 0 |
| Documentation % | Documentation Coverage | >90% |
| Test Coverage % | Jest --coverage | >80% |
| CI Health | Workflow Index | All green |
| PR Health | Open PRs | <3 open, 0 stale |
| Security Score | CodeQL | 0 alerts |
| Repository Truth Score | RTA | Monotonic decrease |
| Pipeline Health (Reality) | Runtime Verification | No catastrophic Broken Truths |

Stored in `docs/knowledge/04_quality/repository-metrics.md` with timestamps — creates a trend line over time.

---

## 16. Agent Architecture (Read-Only Stage 1)

| Agent | Phase | Produces |
|-------|-------|----------|
| **Alpha** | 0 (+ precomputation for Phase 5) | `00_truth/repository-truth-audit.md`, `00_truth/source-of-truth-declaration.md`. Alpha also produces `00_truth/domain-model.md` and `00_truth/glossary.md` as they are derived directly from Memory files (the same input as Phase 0), avoiding redundant re-scanning later. |
| **Beta** | 1 | `01_repository/repository-map.md`, `01_repository/system-inventory.md`, `01_repository/feature-catalog.md`, `01_repository/package-index.md`, `01_repository/workflow-index.md` |
| **Charlie** | 2 | `03_compliance/pi-platform.md`, `03_compliance/pi-sdk-audit.md`, `03_compliance/browser-compatibility.md`, `03_compliance/standards.md`, `03_compliance/ai-agents.md`, `03_compliance/pwa.md` |
| **Delta** | 3 | `04_quality/traceability.md`, `04_quality/api-index.md`, `04_quality/runtime-verification.md`, `02_architecture/runtime-architecture.md`, `02_architecture/runtime-topology.md`, `02_architecture/data-flow-map.md`, `02_architecture/deployment-matrix.md` |
| **Echo** | 4 | `04_quality/dead-content.md`, `04_quality/ecosystem-gap-analysis.md`, `04_quality/documentation-coverage.md`, `04_quality/implementation-coverage.md`, `04_quality/developer-experience.md` |
| **Foxtrot** | 5 | `02_architecture/capability-graph.md`, `02_architecture/architecture-index.md`, `05_dna/decision-history.md` |
| **Golf** | 6 | `03_compliance/ecosystem-governance.md`, `03_compliance/pi-platform-readiness.md`, `03_compliance/browser-certification.md`, `03_compliance/interoperability-report.md`, `03_compliance/standards-watch.md` |
| **Hotel** | — | `02_architecture/living-architecture.md`, `04_quality/repository-metrics.md`, `05_dna/repository-dna.md`, `05_dna/repository-dna.json` |
| **Omega** | — | Final consistency pass across ALL files |

---

## 17. Complete File Inventory (39 files)

```
docs/knowledge/
├── 00_truth/
│   ├── repository-truth-audit.md        (Phase 0)
│   ├── source-of-truth-declaration.md   (Phase 0)
│   ├── domain-model.md                  (Phase 5)
│   └── glossary.md                      (Phase 5)
│
├── 01_repository/
│   ├── repository-map.md                (Phase 1)
│   ├── system-inventory.md              (Phase 1)
│   ├── feature-catalog.md               (Phase 1)
│   ├── package-index.md                 (Phase 1)
│   └── workflow-index.md                (Phase 1)
│
├── 02_architecture/
│   ├── capability-graph.md              (Phase 5)
│   ├── architecture-index.md            (Phase 5)
│   ├── runtime-architecture.md          (Phase 3)
│   ├── runtime-topology.md              (Phase 3)
│   ├── data-flow-map.md                 (Phase 3)
│   ├── deployment-matrix.md             (Phase 3)
│   └── living-architecture.md           (Hotel)
│
├── 03_compliance/
│   ├── pi-platform.md                   (Phase 2)
│   ├── pi-sdk-audit.md                  (Phase 2)
│   ├── browser-compatibility.md         (Phase 2)
│   ├── standards.md                     (Phase 2)
│   ├── ai-agents.md                     (Phase 2)
│   ├── pwa.md                           (Phase 2)
│   ├── ecosystem-governance.md          (Phase 6)
│   ├── pi-platform-readiness.md         (Phase 6)
│   ├── browser-certification.md         (Phase 6)
│   ├── interoperability-report.md       (Phase 6)
│   └── standards-watch.md               (Phase 6)
│
├── 04_quality/
│   ├── traceability.md                  (Phase 3)
│   ├── api-index.md                     (Phase 3)
│   ├── runtime-verification.md          (Phase 3)
│   ├── dead-content.md                  (Phase 4)
│   ├── ecosystem-gap-analysis.md        (Phase 4)
│   ├── documentation-coverage.md        (Phase 4)
│   ├── implementation-coverage.md       (Phase 4)
│   ├── developer-experience.md          (Phase 4)
│   └── repository-metrics.md            (Hotel)
│
└── 05_dna/
    ├── repository-dna.md                (Hotel)
    ├── repository-dna.json              (Hotel)
    └── decision-history.md              (Phase 5)
```

**Total: 39 files** across 6 directories.

---

## 18. Stage 2: Approval Gate

After all 39 files are generated:
1. Present findings to repository owner
2. Prioritize: P0 (Broken Truth — Catastrophic), P1 (Broken Truth — Critical), P2 (Broken Truth — High), P3 (gaps), P4 (nice-to-have)
3. Plan Phase 7 (Modernization) execution order based on priority

---

## 19. Constraints

1. **Stage 1 is strictly read-only.** No files modified. No code changed. Pure observation.
2. **Stage 3 is strictly one change per PR.** No mega PRs. Measurable before/after per PR.
3. **Every finding must cite evidence.** File path + line numbers. No opinions without proof.
4. **The audit measures the repo as it exists TODAY.** Not what it should be. Not what it will be.
5. **`docs/knowledge/` is the single destination for all knowledge artifacts** (hierarchical: 00-05 directories).
6. **`05_dna/` holds immutable principles + machine-readable semantic index.**
7. **`docs/specs/` holds design specifications** (avoids path that will be renamed in Phase 7).
8. **`.superpowers/` is NOT migrated during Stage 1** — that happens in Phase 7, PR-B.
9. **All 5 layers of the Truth Chain must be traced for each Claim.** Stopping at "code exists" is insufficient.
10. **Every generated document MUST include a metadata header**:

    ```markdown
    # Document Title
    
    Version: X.Y
    Generated: YYYY-MM-DD
    Generated by: [Agent Name]
    Confidence: XX%
    Sources:
    - [file path or glob pattern]
    - [file path or glob pattern]
    Last Verified: YYYY-MM-DD
    ```

---

## 20. Success Criteria

The audit is complete when:

- [ ] All 39 files exist in `docs/knowledge/` with correct hierarchical structure (00-05)
- [ ] Every Claim in AxiomID.Memory has an evidence chain across all 5 layers (✅ Verified or ❌ Broken Truth with severity)
- [ ] Catastrophic Broken Truths (Claim exists, Reality fails) are identified and flagged P0
- [ ] System Inventory (CMDB) tracks every asset with all metadata columns
- [ ] Unified Capability × Dependency × Ownership Graph is complete — any agent can understand the project in minutes
- [ ] Decision History spans the full project lifetime with Date / Decision / Status / Rationale per entry
- [ ] `repository-dna.json` is populated and accurate — AI-native entry point for future agents
- [ ] `runtime-topology.md` documents the full stack from Browser → Workers AI layer-by-layer
- [ ] Runtime Verification confirms Deployed / Running / Healthy / Verified across all key features
- [ ] Every API endpoint is indexed with auth/validator/logger/coverage/deploy/runtime status
- [ ] Platform Compliance covers all 11 platforms (Pi through Browser APIs) with Supported/Partial/Missing/Planned
- [ ] Browser compatibility matrix exists for all 4 target browsers
- [ ] Standards compliance is mapped (W3C DID, VC, OIDC, MCP)
- [ ] Data flow map exists for every key feature
- [ ] Pi SDK audit covers login/logout/payments/user/sandbox/mobile/desktop/wallet/auth flow
- [ ] Domain model defines every concept with unified language
- [ ] Glossary defines every project-specific term
- [ ] Dead content is cataloged with file paths and severity
- [ ] Ecosystem gap analysis maps every Pi requirement → AxiomID support → gap → recommendation
- [ ] Developer experience is measured (time-to-first-commit, Quick Start quality)
- [ ] Platform Governance dashboard tracks all external alignment dimensions
- [ ] Repository DNA captures immutable principles (minimum 3 per principle area)
- [ ] Living Architecture mechanism is defined (not yet automated — that's Phase 7)
- [ ] Repository Metrics baseline is established with timestamp
- [ ] Consistency pass confirms no contradictions across all 39 files
