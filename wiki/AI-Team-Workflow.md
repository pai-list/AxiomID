# AI Team Workflow

> Back to [Home](./Home) | See also: [Development Setup](./Development-Setup)

---

## Overview

AxiomID uses a multi-agent development workflow with specialized AI agents collaborating on different aspects of the project.

---

## Agent Roles

| Agent | Role | Tools |
|:---|:---|:---|
| **Jules** (Google) | Primary code agent — features, bugs, refactoring | Code editing, testing, git |
| **Gemini** | Strategy, architecture, code review | Analysis, planning, review |
| **CodeRabbit** | Automated PR review | PR comments, suggestions |
| **Antigravity** | Platform orchestration | Multi-agent coordination |

---

## PR Workflow

### 1. Feature Development

```
Agent picks up task
  │
  ├─► Create feature branch: feat/xxx or fix/xxx
  │
  ├─► Implement changes
  │   ├─► Follow TypeScript strict mode
  │   ├─► Follow SOUL Protocol
  │   └─► Write tests
  │
  ├─► Run verification:
  │   ├─► npm test
  │   ├─► npm run lint
  │   └─► npx tsc --noEmit
  │
  ├─► Commit with IQRA Chronicle format:
  │   └─► "feat(scope): description ۞"
  │
  └─► Push and create PR
```

### 2. Code Review

```
PR created
  │
  ├─► CodeRabbit auto-review (if credits available)
  │
  ├─► Manual review (if needed)
  │   ├─► Check against AGENTS.md rules
  │   ├─► Verify against main branch (not working tree)
  │   └─► Run full test suite
  │
  └─► Merge (rebase onto main first)
```

### 3. Merge Rules

| Rule | Requirement |
|:---|:---|
| **CI must pass** | All checks green before merge |
| **Vercel deploy must pass** | Production deploy must succeed |
| **No `as any`** | TypeScript strict mode enforced |
| **IQRA Chronicle commits** | Every commit follows format |
| **Shell quoting** | Quote paths with `[brackets]` |
| **Rebase before merge** | Always rebase onto latest `main` |
| **Fix-commit ratio** | feat > fix > refactor > docs > test |

---

## IQRA Chronicle Commit Format

```
type(scope): description ۞

Narrative body explaining what changed and why.
```

### Types

| Type | Description |
|:---|:---|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code refactoring |
| `test` | Adding tests |
| `docs` | Documentation |
| `chore` | Maintenance |
| `perf` | Performance improvement |
| `security` | Security fix |

### Examples

```
feat(passport): add Pi Browser share dialog ۞

Integrated Pi native share dialog with fallback chain:
Pi Browser → navigator.share → clipboard copy.
Shares passport URL with user's sovereign identity.
```

```
fix(trust): clamp negative zero in score calculation ۞

Mathematician utility functions can return -0 due to
subtraction. Added explicit zero clamping to prevent
test assertion failures.
```

---

## Branch Naming

| Pattern | Description |
|:---|:---|
| `feat/xxx` | New feature |
| `fix/xxx` | Bug fix |
| `refactor/xxx` | Refactoring |
| `docs/xxx` | Documentation |
| `test/xxx` | Test improvements |

---

## Continuous Improvement Loops

| Loop | Trigger | Action |
|:---|:---|:---|
| **Sub-50ms Page Load** | Every PR | Measure page load times |
| **100% Test Coverage** | Weekly | Add tests for uncovered code |
| **Logging Coverage** | Every PR | Ensure all routes have logger.error() |
| **Fresh Clone** | Monthly | Clone fresh, verify README steps |
| **Nightly Changelog** | Nightly CI | Auto-update CHANGELOG.md |

---

## Communication

| Channel | Purpose |
|:---|:---|
| **GitHub Issues** | Bug reports, feature requests |
| **GitHub PRs** | Code review, merge |
| **GitHub Discussions** | Architecture decisions |
| **Telegram** | Real-time notifications |

---

*← [Development Setup](./Development-Setup)*
