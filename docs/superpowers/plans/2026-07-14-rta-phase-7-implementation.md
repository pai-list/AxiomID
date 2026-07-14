# RTA Phase 7 — Repository Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Tasks use checkbox (`- [ ]`) syntax. Sequential execution — one PR at a time.

**Goal:** Execute 11 sequential PRs to modernize the AxiomID repository based on RTA findings.

**Architecture:** Quick wins first (5 small PRs) → Medium impact (3 PRs) → Major work (3 PRs). Each PR is self-contained on its own branch, merged to `main` before the next begins.

**Tech Stack:** Markdown, YAML, git operations, npm workspaces, OpenAPI.

## Global Constraints

- One PR at a time, no parallel execution
- Every PR: `npm run lint` → `npm test` (relevant suites) → `npm run type-check` → `npm run build` before push
- Branch convention: `feat/rta-phase7-<label>`
- Commit format: IQRA Chronicle `type(scope): description ۞`
- Squash merge to `main` after CI passes
- Documentation updated alongside code changes

---

### Task 1: PR-K — Add `[[routes]]` to `backend/wrangler.toml`

(Blocked — needs Cloudflare zone_id)

---

### Task 2: PR-D — Fix CHANGELOG SemVer Violation

(Done — PR #314)

---

### Task 3: PR-H — Populate `decision-history.md`

**Files:**
- Modify: `docs/knowledge/05_dna/decision-history.md`

- [ ] Step 1: Read existing file
- [ ] Step 2: Extract decisions from git log
- [ ] Step 3: Write entries with chronological table
- [ ] Step 4: Verify formatting (npm run lint)
- [ ] Step 5: Commit
- [ ] Step 6: Push and create PR

---

### Task 4: PR-C — Clean Repository Root

(Delete ai-report.html, e2e-results.json, axiomidrules, portless.json; move create_milestone.sh to scripts/; delete scratchpad/ and test-results/)

---

### Task 5: PR-A — `.gitignore` Cleanup

(Add portless.json, axiomidrules, task.md)

---

### Task 6: PR-B — Rename `.superpowers/` → `.ai/`

(Update AGENTS.md, gitignore, docs references)

---

### Task 7: PR-J — Archive `iqra-core/`

(Move schema.sql to docs/archive/)

---

### Task 8: PR-F — Expand `CONTRIBUTING.md`

(Rewrite to full contributing guide)

---

### Task 9: PR-E — Introduce npm Workspaces

(Add workspaces to root package.json)

---

### Task 10: PR-I — Create OpenAPI Spec

(Create docs/openapi.yaml)

---

### Task 11: PR-L — Create Reference Standards Directory

(Create AxiomID.Memory/reference/ with subdirectories)

---

## Execution Order Verification

After all 11 PRs are merged, verify all items complete.
