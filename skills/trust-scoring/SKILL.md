---
name: Trust Scoring
slug: trust-scoring
tier: BASIC_TOOL
pricePi: 0
version: "1.0.0"
soulPrinciple: SABIYYAH
chainable: true
tags: [trust, scoring, xp, stamps, reputation]
---

# Trust Scoring

## الغرض — Purpose

Calculates composite trust scores from XP, stamps, tenure, and semantic trust signals.

**English:** Wraps the existing `calculateTrustScore()` from `src/lib/trust.ts` into a reusable skill. Provides normalization, edge-case handling, and score history tracking.

**Arabic:** يلف دالة calculateTrustScore الموجودة من src/lib/trust.ts في مهارة قابلة لإعادة الاستخدام. يوفر التطبيع، ومعالجة الحالات الحدية، وتتبع تاريخ النتائج.

## مبدأ التوافق — Principle Alignment

This skill embodies **SABIYYAH** (الحكمة السبع — Cycle Learning).

Every cycle refines the score. The trust calculation is not static — it compounds over time:

- **XP compounds** — More actions = higher XP component (50% weight)
- **Stamps accumulate** — Each verified stamp adds to the stamp component (20% weight)
- **Tenure matters** — Longer account age increases trust (10% weight)
- **Semantic signals** — AI-derived trust adds context (20% weight)

## سير التشغيل — Operational Flow

1. **Input gathering** — Collect XP, stampsClaimed, tenureDays, semanticTrust from user record
2. **Parameter validation** — Validate inputs against `TrustScoreParamsSchema` (Zod)
3. **Score computation** — Call `calculateTrustScore()` with validated params
4. **Result normalization** — Clamp result to 0-100 range
5. **Return** — Return composite score with component breakdown

## أنماط الفشل — Failure Modes

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Negative XP | Zod validation error | Return VALIDATION_ERROR |
| stampsClaimed > TOTAL_STAMPS | Clamped automatically | No error — graceful clamping |
| Missing optional params | Zod optional fields | Falls back to legacy 70/30 weighting |
| Division by zero | TOTAL_STAMPS check | Returns 0 for stamp component |
| Result outside 0-100 | Math.min/max clamp | Always returns 0-100 |
