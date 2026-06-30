# Marketplace AIX Adoption — Phases 1-4 ۞

**Status:** Draft  
**Author:** Jules (AI Agent)  
**Branch:** `feat/marketplace-aix-adoption`  
**Target:** Phase 1 (Skill Template) + Phase 2 (Quality Gate)

---

## Overview

Adopt architecture patterns from AIX-Format/aix-agent-skills into AxiomID's Agentic Marketplace. This is a **recode, not a copy** — patterns are adapted to AxiomID's Prisma/Next.js/Pi SDK stack.

### Why This Matters

Before this change, `manifestMd` (the skill's Genomic Payload) is a free-form `<textarea>` with no structure validation. A skill can be published with `manifestMd: "TODO: fill this in"` and the marketplace accepts it. This poisons discovery, wastes buyer trust, and makes the catalog unreliable.

### Scope (Phases 1-4)

| Phase | What | Effort |
|-------|------|--------|
| 1 | Skill template standard — canonical bilingual template, Zod validation | Small |
| 2 | CI quality gate — GitHub Action validates manifest completeness on PR | Small |
| 3 | SOUL Protocol alignment — every skill declares which principle it serves | Small |
| 4 | Performance tracking — `SkillExecution` model, success rate analytics | Medium |

This document covers phases 1+2 implementation. Phases 3+4 are scoped for follow-up PRs.

---

## Phase 1: Skill Template Standard

### Template Structure

Every skill manifest MUST follow this structure:

```
## الغرض — Purpose
What does this skill do? (1-2 sentences)

## التوافق الروحي — SOUL Alignment
How this skill serves: Muraqabah / Tawbah / TrustChain / Tasbih / Sab'iyyah / Barakah

## سير التشغيل — Operational Flow
1. Step one
2. Step two
3. Step three

## أنماط الفشل — Failure Modes
| Mode | Detection | Recovery |
|------|-----------|----------|

## الوسوم — Tags (optional)
tag1, tag2, tag3
```

### Validation Rules (`ManifestSchema`)

1. Must contain all 4 required sections (Purpose, SOUL Alignment, Operational Flow, Failure Modes)
2. Section bodies must be non-empty
3. Rejects stub patterns: `TODO:`, `TBD`, `...`, `<fill in>`
4. Rejects single-paragraph placeholders followed by next heading
5. Accepts bilingual headers (English or Arabic + English)
6. Tags section is optional

### Files Changed

| File | Change |
|------|--------|
| `templates/skill-template.md` | **NEW** — canonical bilingual template |
| `src/lib/validators.ts` | **MODIFY** — add `ManifestSchema` Zod validator |
| `src/lib/errors.ts` | **MODIFY** — add `INCOMPLETE_MANIFEST` error code |
| `src/app/api/skills/route.ts` | **MODIFY** — validate `manifestMd` against `ManifestSchema` on POST |
| `src/app/api/skills/[slug]/route.ts` | **MODIFY** — validate `manifestMd` against `ManifestSchema` on PATCH |
| `src/components/dashboard/PublishSkillForm.tsx` | **MODIFY** — sectioned editor with validation hints |
| `src/diagnostics/catalog.ts` | **MODIFY** — add `AXIOMID_E050` diagnostic for incomplete manifests |

### API Contract

**POST /api/skills** — if `manifestMd` fails `ManifestSchema`:

```json
{
  "error": "Manifest is incomplete — missing required section: ## سير التشغيل — Operational Flow",
  "code": "INCOMPLETE_MANIFEST",
  "details": [
    {
      "section": "Operational Flow",
      "issue": "missing"
    }
  ]
}
```

**PATCH /api/skills/[slug]** — same validation applies when `manifestMd` is included in the update body.

---

## Phase 2: Skill Quality Gate

### CI Workflow

```yaml
name: Skill Quality Gate
on: [pull_request]
jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx tsx scripts/validate-skill-manifest.ts --changed
```

### Validation Script

`scripts/validate-skill-manifest.ts` — runs in two modes:

| Mode | Scope | Exit Code |
|------|-------|-----------|
| `--changed` (CI default) | Only PR-changed skills | 1 if any fail |
| `--strict` (manual) | All skills in DB | 1 if any fail |

The script:
1. Reads `manifestMd` from each skill
2. Parses markdown sections
3. Validates against the same rules as `ManifestSchema`
4. Outputs a table of results
5. Returns non-zero exit on failure

### Files Changed

| File | Change |
|------|--------|
| `.github/workflows/skill-quality.yml` | **NEW** — CI workflow |
| `scripts/validate-skill-manifest.ts` | **NEW** — CLI validation script |

---

## Phase 3: SOUL Protocol Alignment (Scoped)

Planned for follow-up PR:

| Addition | Detail |
|----------|--------|
| `soulPrinciple` field on Prisma `Skill` model | Optional enum: MURAQABAH, TAWBAH, TRUSTCHAIN, TASBIH, SAB'IYYAH, BARAKAH |
| `SoulBadge` component | Color-coded badge on skill cards |
| Template section | Every manifest declares SOUL alignment |

---

## Phase 4: Performance Tracking (Scoped)

Planned for follow-up PR:

| Addition | Detail |
|----------|--------|
| `SkillExecution` Prisma model | skillId, agentId, success, duration, error, timestamp |
| `POST /api/skills/[slug]/execute` | Record execution |
| `GET /api/skills/[slug]/stats` | Success rate, avg duration, totals |
| Frontend analytics | Success rate gauge on skill detail |

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Zod over custom parser** | Already used throughout codebase; consistent tooling |
| **Bilingual headers** | Matches AxiomID's Arabic/English mandate |
| **`INCOMPLETE_MANIFEST` error code** | Follows existing `ErrorCode` pattern; allows CI + API to share validation |
| **Server-side first, client-side second** | API validation is authoritative; form hints are UX enhancement |
| **`--changed` mode default in CI** | Grandfathers existing skills; prevents flag-day rewrites (same as AIX approach) |
| **Single branch per milestone** | Phases 1+2 in one branch for atomic review; 3+4 in follow-up branches |

## Migration Strategy

Existing skills in the DB are **not automatically re-validated**. The `--changed` CI mode only checks PR-diffed skills. This means:

1. Pre-existing skills continue to work
2. Only new/updated skills need to follow the template
3. A future `--strict` run can identify legacy skills that need updating
4. Seed data (`src/data/skills.json`) will be updated to follow the template
