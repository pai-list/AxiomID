# AxiomID Branch Strategy

> Established: 2026-06-22
> Baseline: main @ 0cd5bbc — 0 TS errors, 94 suites / 1168 tests passing

## Branches

| Branch | Tier | Scope | Merge Order |
|:---|:---:|:---|:---:|
| `feat/security-tier1` | **T1** | Sandbox bypass fix, Redis token cache, build-time env guard | 1st |
| `feat/a11y-pwa-tier2` | **T2** | WCAG contrast fixes, heading hierarchy, accessible names, PWA manifest/theme, header redesign | 2nd |
| `feat/vault-revocation` | **T3** | Stake/SlashingEvent models, revocation endpoint, Pi Payment stub | 3rd |
| `feat/zk-csdselective` | **T4** | snarkjs/circom ZK circuits, CSD-JWT selective disclosure, multi-issuer verification | 4th |

## Workflow

1. Each branch is created from `main` (independent, not stacked)
2. Work on `feat/security-tier1` first (security before anything)
3. Merge to `main` after CI passes + review
4. Then proceed to Tier 2, etc.
5. Rebase onto `main` before each merge if other branches merged in between

## Merge Order Rationale

- **Security first** — sandbox bypass + env var leak are exploitable NOW
- **UI/UX second** — accessibility + PWA are user-facing, lower risk
- **Schema third** — requires design decisions, testable independently
- **ZK last** — highest complexity, depends on schema being stable
