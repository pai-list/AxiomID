# Hermes Weekly Loop — Goals & Instructions

> **For Hermes:** Run this every Sunday. No code changes — pure synthesis.
> Produces: what shipped / what's stale / what's blocked / what's next.

---

## Data Sources (read-only)

| Source | What to extract |
|--------|----------------|
| `git log --since="7 days ago"` | Commits shipped this week |
| `gh pr list --state open` | Open PRs with check status |
| `gh pr list --state merged --search "merged:>=<date>"` | PRs merged this week |
| `gh issue list --state open` | Open issues with labels |
| `git branch -r --no-merged main` | Stale branches |
| `gh run list --workflow=ci.yml --limit=1` | Latest CI status |
| Vectorize index (if configured) | Historical code change context |

## Output Format

```markdown
# Hermes Weekly Report — <YYYY-MM-DD>

## What Shipped
- PR #N: title [author] — merged <date>
- PR #N: title [author] — merged <date>
- N commits this week

## What's Stale (Open PRs)
- PR #N: title [author] — checks: pending/failure/success
- PR #N: title [author] — checks: pending/failure/success

## What's Blocked
- PR #N: title — CI failing, needs rebase
- PR #N: title — conflict with main
- Issue #N: title — waiting on external dependency

## What's Next (Priority Order)
1. Fix failing PRs (unblock merge)
2. Rebase stale PRs (>7 days old)
3. Address high-priority issues
4. Ship planned features

## Repo Health
| Metric | Value | Trend |
|--------|-------|-------|
| Open PRs | N | ↑↓→ |
| Merged this week | N | ↑↓→ |
| Open issues | N | ↑↓→ |
| Stale branches | N | ↑↓→ |
| Latest CI | pass/fail | — |
| Test count | N passing | ↑↓→ |

## Recommendations
- _Hermes adds 1-3 actionable recommendations here_
- Focus on what Mohamed should prioritize this week
- Flag any patterns (e.g., "3 PRs stuck on same conflict")
```

## Rules

1. **Read-only** — Hermes does NOT push code, create PRs, or modify anything
2. **No code changes** — Pure synthesis and reporting
3. **Actionable** — Every section ends with clear next steps
4. **Brief** — Report should fit in one GitHub Step Summary (no walls of text)
5. **Honest** — If nothing shipped, say so. Don't pad.
6. **Flag patterns** — If same issue appears 3+ times, escalate it

## Trigger

- **Automatic:** Every Sunday at 10 AM UTC via `hermes-weekly.yml`
- **Manual:** `gh workflow run hermes-weekly.yml`
- **Dry run:** `gh workflow run hermes-weekly.yml -f dry_run=true`

## Integration with Other Loops

| Loop | Relationship |
|------|-------------|
| **Per-PR loop** | Hermes summarizes merged PRs from this |
| **witr-loop** | Hermes flags PRs stuck on CI (feed witr) |
| **Loops (nightly)** | Hermes reads coverage/perf metrics |
| **Planning session** | Hermes report is input for next planning |
