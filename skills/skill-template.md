# AxiomID Skill Manifest Template

This file is a reference template for authoring new skills. Copy this structure into `skills/<your-skill-name>/SKILL.md`.

## Validation Rules

The `skill-quality.yml` CI workflow validates every skill manifest against these rules:

1. **Required sections** — All 4 sections below must be present
2. **No stubs** — Sections cannot contain TODO, TBD, `<fill in>`, `...`, or HTML comments only
3. **Non-empty body** — Each section must have substantive content

Run validation locally:
```bash
npx tsx scripts/validate-skill-manifest.ts --changed
```

## Manifest Structure

Every `SKILL.md` file MUST have these 4 sections. The header can be in English, Arabic, or bilingual format:

```markdown
---
name: Your Skill Name
slug: your-skill-slug
tier: BASIC_TOOL | ADVANCED_TOOL | ADVANCED_INFRASTRUCTURE | PRO | SOVEREIGN
pricePi: 0
version: "1.0.0"
soulPrinciple: MURAQABAH | TAWBAH | TRUSTCHAIN | TASBIH | SABIYYAH | BARAKAH
chainable: false
tags: [tag1, tag2]
---

# Your Skill Name

## الغرض — Purpose

What this skill does. Include:
- Clear 1-2 sentence description of the skill's function
- Target audience (agent, human, or both)
- EN + AR bilingual text

**English:** Manages agent working memory with append-only log semantics.

**Arabic:** يدير ذاكرة العمل للمضيف مع دلالة السجل المُلحق فقط.

## مبدأ التوافق — Principle Alignment

Which SOUL principle this skill serves and why:

- **MURAQABAH** (المراقبة — Divine Awareness) — logging, monitoring, audit trails
- **TAWBAH** (التوبة — Self-Correction) — error recovery, self-healing
- **TRUSTCHAIN** (الحارس — The Guardian) — append-only logs, hash chains, tamper evidence
- **TASBIH** (التكبير — Self-Healing) — retry patterns, resilience, backoff
- **SABIYYAH** (الحكمة السبع — Cycle Learning) — pattern discovery, periodic synthesis
- **BARAKAH** (البركة — Milestone Multiplication) — compounding rewards, milestone tracking

Example:
> This skill embodies **TRUSTCHAIN** — every memory mutation is an append-only event with hash-chain integrity.

## سير التشغيل — Operational Flow

Step-by-step execution flow. Be specific about what happens at each stage:

1. **Input validation** — Validate entry schema using Zod
2. **Hash computation** — SHA-256 hash-chain with previous entry
3. **Store operation** — Append to working memory store (Redis or in-memory)
4. **Telemetry** — Emit event for observability pipeline

## أنماط الفشل — Failure Modes

What can go wrong and how to recover:

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Store unavailable | Connection timeout | Queue locally, retry on next heartbeat |
| Hash collision | Duplicate hash detected | Reject entry, log incident |
| Memory limit exceeded | Store size > maxEntries | Evict oldest non-pinned entries |
| Invalid input | Zod validation error | Return VALIDATION_ERROR, skip entry |

## Agent Script

The `agentScript` field in `SKILL.md` should export TypeScript functions that implement the skill's core logic. See `skills/agent-memory/agentScript.ts` for an example.

## Test Suite

The `testSuite` field should contain Jest tests that verify the skill's core functions. See `skills/agent-memory/testSuite.ts` for an example.
