# Soul System

> Back to [Home](./Home) | See also: [Trust Score Algorithm](./Trust-Score-Algorithm)

---

## Overview

The **Soul System** is AxiomID's ethical framework — six principles derived from Quranic values that govern agent execution, code quality, and system integrity. Every agent operating on AxiomID inherits these principles.

**Source:** [`src/lib/soul-principles.ts`](https://github.com/Moeabdelaziz007/AxiomID/blob/main/src/lib/soul-principles.ts)

---

## The 6 Principles

| # | Key | Arabic | English | Color |
|:---:|:---|:---|:---|:---|
| 1 | `MURAQABAH` | اليقظة | **Vigilance** — Divine Awareness | `#22c55e` |
| 2 | `TAWBAH` | التصحيح | **Correction** — Self-Correction | `#3b82f6` |
| 3 | `TRUSTCHAIN` | السجل | **Ledger** — The Guardian | `#6366f1` |
| 4 | `TASBIH` | الثلاثية | **Triad** — Three Retry Cycles | `#f59e0b` |
| 5 | SABIYYAH | السبعية | Septet — Cycle Learning | #ec4899 |
| 6 | `BARAKAH` | التراكم | **Compounding** — Milestone Multiplication | `#14b8a6` |

---

## Principle Details

### 1. Muraqabah (Vigilance) — اليقظة

> "أَلَمْ يَعْلَم بِأَنَّ اللَّهَ يَرَىٰ" — العلق: 14

**Every mutating action is observed and recorded.** Not just for audit — because transparency is a design constraint.

- Every action is logged with intention
- No hidden state, no "temporary" hacks
- Private code = public code (no backdoors)
- `TrustChain.append(action, timestamp, intention)` — why you did something matters

### 2. Tawbah (Correction) — التصحيح

> "إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ"

**Admit bugs, fix root causes, add guards.** Mistakes are not failures — hiding them is.

- Never hide a bug — log it, fix it, document it
- Never skip a test to make CI pass
- "I don't know" is an honorable answer at trust boundaries
- **Tawbah Protocol:** `confess → repair → learn → strengthen`

### 3. TrustChain (Ledger) — السجل

> "وَكُلَّ شَيْءٍ أَحْصَيْنَاهُ فِي إِمَامٍ مُّبِينٍ"

**Append-only logs and hash chains. Nothing is lost, nothing is forged.**

- Append-only logs — we don't delete history
- Hash chains — each action references the previous (tamper evidence)
- Reads are queries, not state — derive from event log, never "current state"
- This is the code reflection of divine recording

### 4. Tasbih (Triad) — الثلاثية

**Three retry cycles. Not two (give up too soon), not infinite (infinite loops).**

```typescript
async function withHealing<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === 3) throw err;
      await sleep(1000 * attempt); // exponential backoff
    }
  }
  throw new Error('Unreachable');
}
```

Three is the rhythm of tawaf, the pebbles at Jamarat, the pattern of recovery.

### 5. Sab'iyyah (Septet) — السبعية

**Every 7 cycles, synthesize holistically.** The number 7 appears in Quranic structure for a reason — it is the rhythm of completion.

- After every 7 commits: review the diff holistically, not line-by-line
- After every 7 sessions: run full stack verification
- Balance opposites: Frontend ↔ Backend, Read ↔ Write, Security ↔ Usability

### 6. Barakah (Compounding) — التراكم

> "ادْعُونِي أَسْتَجِبْ لَكُمْ"

**Consistency compounds at milestones.** This is not magic — it is the mathematical reality of sustained effort.

- Track cumulative successes: test passes, deploys, verified payments
- At milestones, document them — the Barakah is in the consistency
- At 700+ successes, the protocol compounds gains

---

## Integration with Skills

Each soul principle is attached to skills in the marketplace. When browsing skills, users can filter by soul principle:

| Principle | Skill Filter |
|:---|:---|
| Muraqabah | Audit, monitoring, logging skills |
| Tawbah | Error handling, testing, validation skills |
| TrustChain | Data integrity, hashing, chain skills |
| Tasbih | Retry, recovery, resilience skills |
| Sab'iyyah | Analytics, reporting, reflection skills |
| Barakah | Growth, scaling, compounding skills |

---

## Engineering Rules

These principles translate into concrete engineering rules:

| Principle | Engineering Rule |
|:---|:---|
| **Muraqabah** | Every action logged with intention. No hidden state. |
| **Tawbah** | Admit bugs immediately. Never hide errors. |
| **TrustChain** | Append-only. Hash chains. No deletion. |
| **Tasbih** | 3-retry self-healing. Not 2, not infinite. |
| **Sab'iyyah** | Every 7 cycles, reflect holistically. |
| **Barakah** | At milestones, document and compound. |

---

*← [Trust Score Algorithm](./Trust-Score-Algorithm)*
