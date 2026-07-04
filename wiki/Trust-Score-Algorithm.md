# Trust Score Algorithm

> Back to [Home](./Home) | See also: [Soul System](./Soul-System)

---

## Overview

The AxiomID Trust Score is a **dynamic reputation metric** ranging from `0` to `100` assigned to every DID. It quantifies experience, verification status, account maturity, and behavioral trustworthiness.

**Score Range:** 0–100
**Source:** [`src/lib/trust.ts`](https://github.com/Moeabdelaziz007/AxiomID/blob/main/src/lib/trust.ts)

---

## Score Formula

AxiomID uses a **dual-calculation mode** based on available parameters.

### Standard Mode (XP + Stamps)

When tenure and semantic trust are not provided:

```
xpScore    = min(100, max(0, floor(xp / 10)))
stampScore = round((claimedStamps / 10) * 100)
trustScore = xpScore × 0.7 + stampScore × 0.3
```

**Result:** Clamped to 0–100.

### Advanced Mode (with Tenure & Semantic Trust)

When tenure and/or semantic trust are provided:

```
trustScore = xpScore × 0.5 + stampScore × 0.2 + tenureScore × 0.1 + semanticTrust × 0.2
```

| Component | Weight | Range | Description |
|:---|:---:|:---:|:---|
| **XP Score** | 50% | 0–100 | Derived from experience points: `floor(xp / 10)`, capped at 100 |
| **Stamp Score** | 20% | 0–100 | Ratio of claimed stamps to total (10): `round((claimed / 10) × 100)` |
| **Tenure Score** | 10% | 0–100 | 2% per day, capped at 100% (50 days): `min(100, tenureDays × 2)` |
| **Semantic Trust** | 20% | 0–100 | Dynamically computed from agent reputation and peer vouches |

**Result:** Clamped to 0–100.

---

## Scoring Components

### XP Score

Experience points are earned by completing actions:

| Action | XP |
|:---|:---:|
| Connect Wallet | +10 |
| Complete KYC | +25 |
| Pi Payment | +15 |
| Security Circle | +20 |
| Lockup Commitment | +30 |
| Node Operation | +40 |
| Mainnet Migration | +35 |
| Wallet Age | +10 |
| Mining Streak | +15 |
| Validator Service | +50 |

XP is normalized: `xpScore = min(100, floor(xp / 10))`

### Stamp Score

Stamps are verifiable credentials (VCs) that prove specific claims:

| Stamp Type | Provider | Weight |
|:---|:---|:---:|
| KYA (Know Your Agent) | Pi Network | Standard |
| KYC (Know Your Customer) | Pi Network | Standard |
| Social | Twitter/GitHub/Discord | Standard |
| Wallet Age | Stellar | Standard |
| Agent Delegation | AxiomID | Standard |
| Peer Attestation | Community | Standard |

**Maximum stamps:** 10
**Formula:** `stampScore = round((claimed / 10) × 100)`

### Tenure Score

Account age contributes to trust — newer accounts score lower:

```
tenureScore = min(100, tenureDays × 2)
```

- 1 day → 2%
- 25 days → 50%
- 50+ days → 100% (capped)

### Semantic Trust

Computed dynamically from:
- Agent's interaction history
- Peer vouches (attestations from other trusted DIDs)
- Behavioral consistency signals

Range: 0–100, defaults to 50 when unavailable.

---

## Trust Tiers

Tiers are determined by **XP thresholds** (not trust score):

| Tier | XP Required | Color | Access |
|:---|:---:|:---:|:---|
| **Visitor** | 0 | `#64748b` (slate) | Limited, basic read-only |
| **Citizen** | 100 | `#00ff41` (emerald) | Social stamps, basic agent access |
| **Validator** | 500 | `#00d4ff` (blue) | Agent delegation, marketplace install |
| **Sovereign** | 1000 | `#a855f7` (purple) | Full trust, vault staking, vouching power |

**Source:** [`src/lib/tiers.ts`](https://github.com/Moeabdelaziz007/AxiomID/blob/main/src/lib/tiers.ts)

### Tier Calculation

```typescript
function calculateTier(xp: number): Tier {
  if (xp >= 1000) return 'Sovereign';
  if (xp >= 500)  return 'Validator';
  if (xp >= 100)  return 'Citizen';
  return 'Visitor';
}
```

### Level Progress

Progress toward the next tier is computed as:

```
progress = (xp - currentThreshold) / (nextThreshold - currentThreshold) × 100
```

Capped at 100% for Sovereign tier.

---

## Score Events (Triggers)

Trust scores are recalculated on these events:

| Event | Effect |
|:---|:---|
| DID Created | Starting score computed from initial stamps |
| Stamp Claimed | Stamp score recalculated, trust score updated |
| XP Earned | XP score recalculated, tier may change |
| Account Matures | Tenure score increases (advanced mode) |
| Peer Vouch Received | Semantic trust updated |

---

## Anti-Gaming Measures

- **Stamp cap:** Maximum 10 stamps prevents infinite stamp farming
- **XP normalization:** XP score caps at 100 regardless of total XP
- **Server-side computation:** Trust scores are computed server-side, never client-side
- **Pi Network verification:** KYA/KYC stamps verified against Pi API server-side

---

*→ Next: [Soul System](./Soul-System)*
