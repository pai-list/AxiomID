# 🛡️ AxiomID Agent Team — The Sovereign Guard

> "وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ" — Help one another in righteousness and piety.

Every agent on this team has a name, a role, a persona, and a sacred duty. They work together like a well-oiled machine — each catching what the others miss. No single agent is sufficient. Together, they are sovereign.

---

## 🐰 CodeRabbit — The Sentinel

**Role:** First-line PR reviewer. Catches bugs, security issues, and style violations before humans spend time reviewing.

**Persona:** Methodical, precise, never sleeps. Reads every diff line-by-line. Catches the obvious stuff so senior reviewers can focus on architecture.

**Skills:**
- Line-by-line code review on every PR
- Security vulnerability detection (SQL injection, XSS, auth bypass)
- 1-click suggested fixes via GitHub Suggested Changes
- Path-specific instructions (e.g., "all API routes must use requireAuth()")
- Auto-reply to developer questions in PR threads

**Configuration:** `.coderabbit.yaml` in repo root
**Free tier:** Unlimited repos, 200 files/hour, 4 PR reviews/hour
**Pro (open source):** Free for public repos — full features

**How to use:**
- Install the GitHub App at coderabbit.ai
- It auto-reviews every PR — no workflow needed
- Comment `@coderabbitai` to ask questions about the code
- Use `chill` profile for low-noise reviews

---

## 🤖 Jules AI — The Architect

**Role:** Autonomous coding agent. Takes a task, clones the repo into a cloud VM, implements the fix, and creates a PR.

**Persona:** Visionary, independent, shows you the plan before acting. Works in the cloud while you sleep.

**Skills:**
- Full codebase understanding (clones repo, reads AGENTS.md)
- Multi-file changes with plan approval before execution
- Bug fixes, feature implementation, test writing, refactoring
- GitHub integration — creates PRs automatically
- Parallel task execution (multiple sessions simultaneously)
- Audio changelog summaries

**Configuration:** `.github/workflows/jules-agent.yml`
**Free tier:** 15 daily tasks (beta) → structured pricing after beta
**API:** `JULES_API_KEY` secret + `google-labs-code/jules-action@v1`
**MCP Server:** `jules-mcp-server` for Claude/opencode integration

**How to use:**
- Label an issue `jules` → Jules picks it up automatically
- Or trigger via `workflow_dispatch` with a custom prompt
- Jules shows a plan → you approve → it implements → creates PR

---

## 🔍 Groq Sentinel — The Watchdog

**Role:** Fast AI code review using Groq/Llama. Catches what CodeRabbit might miss with a different model perspective.

**Persona:** Quick, no-nonsense, gives severity ratings. Like a second pair of eyes with a different brain.

**Skills:**
- Security issue detection
- Performance problem identification
- Code quality assessment
- Best practices validation
- Severity-rated findings (critical/high/medium/low)

**Configuration:** `.github/workflows/gemini-review.yml` (renamed to `ai-review.yml`)
**Free tier:** Groq API free tier (generous limits)
**Model:** `llama-3.3-70b-versatile`

**How to use:**
- Auto-triggers on every PR (opened/synced/reopened)
- Posts a summary comment with severity breakdown
- Check `GROQ_API_KEY` secret is set in repo settings

---

## 🔄 Dependabot — The Guardian

**Role:** Keeps dependencies updated and secure. Scans for vulnerable packages and opens PRs automatically.

**Persona:** Diligent, never forgets, checks weekly like clockwork. Prevents security debt from accumulating.

**Skills:**
- npm dependency updates (main + packages/crypto + packages/sdk)
- GitHub Actions version updates
- Security vulnerability alerts
- Grouped updates (production vs dev dependencies)
- Auto-generated changelogs

**Configuration:** `.github/dependabot.yml`
**Free tier:** Completely free for all public repos

**How to use:**
- Runs weekly on Mondays at 06:00 UTC
- Opens PRs with dependency updates
- Groups production deps (next, react, prisma) separately from dev deps
- Labels PRs as `dependencies` + `automated`

---

## ⚡ GitHub Actions CI — The Enforcer

**Role:** Runs tests, linting, type-checking, and builds on every PR. Gates merging.

**Persona:** Strict, unyielding, zero tolerance for red CI. The final checkpoint before code reaches main.

**Skills:**
- TypeScript type-checking
- Jest test suite execution
- ESLint linting
- Build verification
- CodeQL security scanning

**Configuration:** `.github/workflows/ci.yml`
**Free tier:** 2,000 minutes/month for public repos

---

## 📊 CI Intelligence — The Analyst

**Role:** Indexes code changes into Cloudflare Vectorize for semantic search. Tracks codebase evolution.

**Persona:** Scholarly, remembers everything, connects dots across PRs. The institutional memory of the codebase.

**Skills:**
- Code change indexing → Vectorize
- Semantic search across codebase history
- Pattern detection across PRs
- Codebase evolution tracking

**Configuration:** `.github/workflows/ci-intelligence.yml`
**Requires:** Cloudflare D1 + Vectorize bindings

---

## 🔄 Loop Agents — The Maintainers

**Role:** Automated maintenance loops that run nightly. Catches regressions and keeps quality high.

**Persona:** Persistent, runs while you sleep, fixes what it can, reports what it can't.

**Skills:**
- Sub-50ms page load verification
- Test coverage monitoring
- Logging coverage auditing
- Nightly changelog generation
- Fresh clone validation

**Configuration:** `.github/workflows/loops.yml`
**Schedule:** Nightly at 2 AM UTC

---

## 🎯 Team Workflow

```
PR Opened
  │
  ├─→ CodeRabbit (Sentinel)     — First pass, line-by-line review
  ├─→ Groq Sentinel (Watchdog)  — Second perspective, severity ratings
  ├─→ CI (Enforcer)             — Tests, lint, type-check, build
  │
  ├─→ Human Review              — Architecture, design decisions
  │
  └─→ Merge ✓

Issue Labeled "jules"
  │
  └─→ Jules AI (Architect)      — Plan → Approve → Implement → PR

Weekly (Monday 06:00 UTC)
  │
  └─→ Dependabot (Guardian)     — Dependency update PRs

Nightly (02:00 UTC)
  │
  └─→ Loop Agents (Maintainers) — Coverage, performance, changelog
```

---

## 🔑 Secrets Required

| Secret | Agent | Where to get it |
|--------|-------|-----------------|
| `GROQ_API_KEY` | Groq Sentinel | console.groq.com |
| `JULES_API_KEY` | Jules AI | jules.google.com/settings |
| `NPM_TOKEN` | Dependabot (npm publish) | npmjs.com → Access Tokens |
| `CODECOV_TOKEN` | CI (coverage) | codecov.io |

---

## 💡 Pro Tips

1. **CodeRabbit + Groq = Double Coverage** — Different models catch different things. CodeRabbit uses GPT-4/Claude, Groq uses Llama. Use both.

2. **Jules for Complex Tasks** — Don't waste Jules on simple fixes. Use it for multi-file refactors, test generation, and feature implementation.

3. **Dependabot Groups** — Production deps update separately from dev deps. Review production PRs carefully, auto-merge dev PRs.

4. **Label-Based Triage** — Use `jules` label for autonomous fixes, `dependencies` for Dependabot, `automated` for any bot-generated PR.

5. **AGENTS.md is Key** — Both CodeRabbit and Jules read AGENTS.md. Keep it updated with your coding conventions.
