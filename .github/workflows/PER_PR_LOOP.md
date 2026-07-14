# Per-PR Loop — Execution Protocol

> **For execution agents (OpenCode/Jules/Gemini CLI):** Follow this exactly for every task.

---

## Flow

```
1. Read written plan → pick next task
2. Implement → push → trigger parallel gates:
   ├── CodeRabbit (correctness)
   ├── CodeQL (security)
   ├── SOUL Check (AGENTS.md alignment)
   └── AI PR Health (hygiene check)
3. All four must be green/clean
4. Request Mohamed's explicit approval
5. Merge → ci-intelligence.yml indexes to Vectorize
```

## Gate Requirements

| Gate | What it checks | Must be |
|------|---------------|---------|
| **CodeRabbit** | Correctness, logic, edge cases | ✅ Approved |
| **CodeQL** | Security vulnerabilities | ✅ Clean |
| **SOUL Check** | Religious names, auth+test pairing, t() misuse | ✅ Clean |
| **AI PR Health** | Cross-boundary security touches, size, auth hygiene | ✅ Clean |
| **CI (type-check + lint + build + test)** | Everything passes | ✅ Green |
| **Vercel deploy** | Production build succeeds | ✅ Ready |

## Before Merge

- [ ] All 4 AI gates green (CodeRabbit, CodeQL, SOUL Check, AI PR Health)
- [ ] CI green (no red X)
- [ ] Vercel deploy passing
- [ ] Mohamed reviewed CodeRabbit summary
- [ ] Mohamed gave explicit approval ("approved", "LGTM", "merge it")

## Commit Format

```
type(scope): description ۞

Narrative body explaining what changed and why.
```

## Branch Naming

- `feat/<name>` — new feature
- `fix/<name>` — bug fix
- `docs/<name>` — documentation
- `chore/<name>` — maintenance
