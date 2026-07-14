# RTA Phase 7 — Repository Modernization Design

**Version:** 1.0
**Date:** 2026-07-14
**Status:** Draft — pending user review

---

## 1. Why This Exists

Phase 7 is the execution stage of the Repository Truth Audit (RTA). Stages 1 (read-only baseline, 39 knowledge artifacts) is complete. Stage 2 (approval gate) is deferred — findings are documented but not formally prioritized in a separate session. Stage 3 / Phase 7 now implements the structural changes identified by the audit.

Each change is its own PR. No mega PRs. Measurable before/after per PR.

---

## 2. Execution Strategy

**Sequence:** Quick wins first → Medium impact → Major work

Three batches, executed sequentially. Each PR is: branch → commit(s) → PR → merge to `main`.

### Batch 1 — Quick Wins (PRs K, D, H, C, A)

5 small, independent PRs. Each takes minutes, not hours. Builds momentum and clears distractions before bigger work.

| Order | PR | Change | Effort | Risk | Dependencies |
|-------|----|--------|--------|------|-------------|
| 1 | PR-K | Add `[[routes]]` to `backend/wrangler.toml` | XS | None | None |
| 2 | PR-D | Fix CHANGELOG SemVer violation | XS | None | None |
| 3 | PR-H | Add `decision-history.md` entries from git log | S | None | None |
| 4 | PR-C | Clean repository root (remove personal/dev artifacts) | S | Low — verify nothing is referenced | None |
| 5 | PR-A | `.gitignore` cleanup | XS | None | None |

### Batch 2 — Medium Impact (PRs B, J, F)

3 PRs that change how the project is organized. Each requires updating references in docs/config.

| Order | PR | Change | Effort | Risk | Dependencies |
|-------|----|--------|--------|------|-------------|
| 6 | PR-B | Rename `.superpowers/` → `.ai/` | S | Low — 7 path references in AGENTS.md + 3 in docs | None |
| 7 | PR-J | Archive `iqra-core/` | S | None — single 1.9KB `schema.sql` | None |
| 8 | PR-F | Expand `CONTRIBUTING.md` (36 → full guide) | M | None | None |

### Batch 3 — Major Work (PRs E, I, L)

3 PRs that require the most thought and testing.

| Order | PR | Change | Effort | Risk | Dependencies |
|-------|----|--------|--------|------|-------------|
| 9 | PR-E | Introduce npm workspaces for `packages/` | M | Medium — affects build pipeline, CI | None |
| 10 | PR-I | OpenAPI spec for 20+ API routes | L | Low — documentation only | None |
| 11 | PR-L | Create `AxiomID.Memory/reference/` standards directory | L | Low — new files only | None |

---

## 3. PR Details

### 3.1 PR-K: Add `[[routes]]` to `wrangler.toml`

**Current state:** `backend/wrangler.toml` has Durable Objects, Queues, KV, D1, Vectorize, and AI bindings but no `[[routes]]` section. The Worker is deployed but routes aren't explicitly declared.

**Change:** Add `[[routes]]` entries matching the documented paths from `docs/knowledge/01_repository/workflow-index.md`.

**File:** `backend/wrangler.toml`

**Risk:** None — routes are advisory in `wrangler.toml` (Cloudflare dashboard overrides apply).

---

### 3.2 PR-D: Fix CHANGELOG SemVer Violation

**Current state:** `CHANGELOG.md` lists `[1.0.0] - 2026-02-10` followed by `[0.1.0] - 2026-06-24`. This violates SemVer: the project went from a stable/public `1.0.0` release back to initial-development `0.1.x`. The `1.0.0` entry is from before the project adopted proper versioning and should be relabeled to `[0.0.1]` to reflect its true position in the version history.

**File:** `CHANGELOG.md`

**Change:** Rename `[1.0.0]` heading to `[0.0.1]` and update the link reference at the bottom of the file.

---

### 3.3 PR-H: Add `decision-history.md` Entries

**Current state:** `docs/knowledge/05_dna/decision-history.md` exists on `main` (created during Stage 1) but may be empty or incomplete.

**Change:** Extract every major architectural decision from `git log` and populate the file. Cover: Firebase rejection, Neon adoption, D1 addition, Pi SDK v2, TanStack Query (SWR replacement), Prisma→D1 sync, Stellar VC anchoring, marketplace features, color contrast overhaul, Pi SDK fix.

**File:** `docs/knowledge/05_dna/decision-history.md`

---

### 3.4 PR-C: Clean Repository Root

**Current state:** The repo root has accumulated personal/dev artifacts:

| File | Type | Action |
|------|------|--------|
| `ai-report.html` | AI-generated report (31KB) | Delete |
| `e2e-results.json` | Test artifact (committed) | Delete, verify `.gitignore` |
| `axiomidrules` | Unknown/machine-specific | Verify purpose, delete if not needed |
| `portless.json` | Local HTTPS config | Delete, verify `.gitignore` |
| `create_milestone.sh` | Dev utility script | Move to `scripts/` |
| `scratchpad/` | Dev scratch directory | Delete |
| `test-results/` | Test output | Delete, verify `.gitignore` |

**Verification:** Before deleting each file, confirm it's not referenced by any config, script, or doc. Use `grep` across the repo.

---

### 3.5 PR-A: `.gitignore` Cleanup

**Current state:** Most dead-content findings are already covered (`.swc/`, `*.tsbuildinfo`, `ai-report.html`, `e2e-results.json`). Three entries are missing.

**File:** `.gitignore`

**Change:** Add these entries in the appropriate section:

```
portless.json
axiomidrules
task.md
```

---

### 3.6 PR-B: Rename `.superpowers/` → `.ai/`

**Current state:** `.superpowers/` contains `loops/`, `playbooks/`, `sdd/`. It's referenced in:

- `AGENTS.md` — 7 path references (loops scripts, playbooks)
- `docs/superpowers/specs/` — 2 references
- `docs/superpowers/plans/` — 1 reference

**Change:**
1. `git mv .superpowers .ai`
2. Update all path references in `AGENTS.md`
3. Update references in `docs/superpowers/*` specs/plans
4. Update `.gitignore` entry if needed

**Note:** `docs/superpowers/` itself is NOT renamed — that's a separate path convention for spec/plan documents.

---

### 3.7 PR-J: Archive `iqra-core/`

**Current state:** `iqra-core/` contains a single file: `schema.sql` (1.9KB). It's an old SQL schema that's not referenced by any active code or config.

**Change:** Move `iqra-core/schema.sql` to `docs/archive/iqra-core-schema.sql` with a README explaining its origin. Delete the empty `iqra-core/` directory.

---

### 3.8 PR-F: Expand `CONTRIBUTING.md`

**Current state:** `CONTRIBUTING.md` is 36 lines — minimal setup instructions for Next.js + Prisma.

**Target:** A comprehensive contributing guide covering:
- Prerequisites (Node 22, npm, Git)
- Quick start (clone, install, env setup, dev server)
- Project structure overview (src/, packages/, backend/)
- Development workflow (branch naming, commit format)
- PR process (lint → type-check → test → build)
- SOUL protocol expectations
- Code review expectations
- i18n contribution guidelines
- Testing requirements

---

### 3.9 PR-E: Introduce npm Workspaces for `packages/`

**Current state:** `packages/crypto/` and `packages/sdk/` exist as separate packages but are NOT wired as npm workspaces. They're developed independently with manual linking.

**Change:**
1. Add `"workspaces": ["packages/*"]` to root `package.json`
2. Ensure each package has its own `package.json` with proper `name`, `version`, `private` fields
3. Update CI workflow to use `npm ci --workspaces` or equivalent
4. Verify `@axiomid/crypto` and `@axiomid/sdk` resolve correctly when imported from `src/`

**Risk:** Medium — npm workspaces change how `node_modules` is hoisted. Some imports may break. CI must validate.

---

### 3.10 PR-I: OpenAPI Spec for 20+ API Routes

**Current state:** AxiomID exposes 29+ API routes (per `docs/knowledge/04_quality/api-index.md`) but has no OpenAPI specification. External developers and AI agents cannot discover the API programmatically.

**Change:** Create `docs/openapi.yaml` documenting all public API routes:
- Method, path, parameters, request body (Zod schemas), response types
- Auth requirements (Pi SDK, JWT Bearer, or none)
- Error response formats
- Rate limit headers

**Routes to document (from api-index.md):**
- `/api/auth/pi` — Pi Network authentication
- `/api/passport/[slug]` — Passport CRUD
- `/api/skills` — Skills list + create
- `/api/skills/[slug]` — Skill detail + update
- `/api/skills/[slug]/execute` — Execute skill
- `/api/skills/[slug]/stats` — Skill stats
- `/api/skills/[slug]/pay` — Payment flow
- `/api/skills/[slug]/review` — Reviews
- `/api/skills/tags` — Taxonomy tags
- `/api/skills/manifest` — Manifest validation
- `/api/stellar/anchor` — VC anchoring
- `/api/diagnostics/capture` — Error capture
- `/api/diagnostics/logs` — Error logs
- `/api/sandbox/dev-token` — Sandbox auth
- `/api/sync` — D1 → Neon sync
- `/api/leaderboard` — Leaderboard
- Plus dashboard/user routes

---

### 3.11 PR-L: Create `AxiomID.Memory/reference/` Standards Directory

**Current state:** `AxiomID.Memory/reference/` is specified in the RTA design (section 14) but doesn't exist yet. External standards (Pi SDK docs, W3C DID specs, Cloudflare best practices) have no local reference.

**Change:** Create directory structure:

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
  stellar/
    stellar-anchoring.md
    horizon-api.md
  mcp/
    model-context-protocol.md
  cloudflare/
    workers-best-practices.md
    d1-guide.md
  nextjs/
    app-router.md
    best-practices.md
```

Each file is a summary of the external standard with links to authoritative sources. Not a copy — a reference with key requirements relevant to AxiomID's implementation.

---

## 4. PR Process (Same for All 11)

Each PR follows this exact process:

1. **Branch:** `feat/rta-phase7-<pr-label>` (e.g., `feat/rta-phase7-clean-root`)
2. **Commit:** Single commit or minimal atomic commits. IQRA Chronicle format.
3. Verify locally: npm run lint → npm run type-check → npm test (relevant suites) → npm run build
4. **Push + PR:** Open PR against `main`
5. **CI must pass:** Vercel deploy, GitHub Actions, CodeQL, CodeRabbit
6. **Merge:** Squash merge to `main`
7. **Verify on main:** Confirm the change is correct after merge

---

## 5. Constraints

1. **One PR at a time.** No parallel execution for Phase 7.
2. **Each PR is self-contained.** No cross-PR dependencies (except ordering for cleanup PRs before rename PRs).
3. **No scope creep.** Each PR does exactly what's listed. New findings get new issue tickets.
4. **Build must pass before merge.** If npm workspaces (PR-E) breaks CI, fix it before moving to PR-I.
5. **Documentation updated alongside code.** If a PR changes paths, update docs in the same PR.

---

## 6. Success Criteria

Phase 7 is complete when:
- [ ] All 11 PRs merged to `main`
- [ ] Repository root is clean (no personal/dev artifacts)
- [ ] `.gitignore` covers all build artifacts
- [ ] `CONTRIBUTING.md` is a usable onboarding guide
- [ ] `decision-history.md` covers full project timeline
- [ ] `AxiomID.Memory/reference/` directory exists with standards summaries
- [ ] OpenAPI spec exists at `docs/openapi.yaml`
- [ ] npm workspaces wired for `packages/*`
- [ ] `wrangler.toml` has explicit `[[routes]]`
- [ ] CHANGELOG follows proper SemVer convention
- [ ] All path references updated after `.superpowers/` rename
- [ ] No broken links or stale references across the repo
