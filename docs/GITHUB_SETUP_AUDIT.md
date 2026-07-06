# GitHub Setup Audit — 2026-07-06

## 1. Repository Settings

| Setting | Value | Status |
|---------|-------|--------|
| **Visibility** | Public | ✅ |
| **Default branch** | `main` | ✅ |
| **Issues** | Enabled | ✅ |
| **Wiki** | Enabled | ✅ |
| **Discussions** | Enabled | ✅ |
| **Homepage** | https://axiomid.app | ✅ |
| **Created** | 2026-06-06 | ✅ |
| **Last pushed** | 2026-07-06 | ✅ |

### Merge Settings
| Setting | Value | Status |
|---------|-------|--------|
| Auto-merge | Disabled | ⚠️ Consider enabling for dependabot PRs |
| Merge commit | Allowed | ✅ |
| Rebase merge | Allowed | ✅ |
| Squash merge | Allowed | ✅ |

### Branch Protection (main)
| Rule | Value | Status |
|------|-------|--------|
| Required status checks | `type-check + lint + test`, `Analyze (javascript-typescript)`, `Gemini AI Review` | ✅ |
| Strict status checks | `false` | ⚠️ Consider enabling |
| Required approving reviews | 1 | ✅ |
| Dismiss stale reviews | `false` | ⚠️ Consider enabling |
| Require code owner reviews | `false` | ⚠️ Consider enabling |
| Required signatures | `false` | ⚠️ Consider enabling (GPG signing) |
| Enforce admins | `false` | ⚠️ Consider enabling |
| Required linear history | `false` | ✅ OK for now |
| Allow force pushes | `false` | ✅ |
| Allow deletions | `false` | ✅ |
| Required conversation resolution | `true` | ✅ |
| Lock branch | `false` | ✅ |

## 2. Issues & Labels

### Open Issues (6)
| # | Title | Labels |
|---|-------|--------|
| 225 | refactor: unify DID format | needs-triage, refactor, area:backend |
| 224 | feat: add Zod validation to auth routes | needs-triage, feat, area:backend |
| 223 | chore: verify Pi Network txid regex | needs-triage, area:backend |
| 222 | test: POST /api/pi/payment/complete coverage | needs-triage, test, area:backend |
| 221 | bug: passportUrl never saved to DB | bug, needs-triage |
| 153 | Production Performance Benchmarks | enhancement, perf |

### Labels (50)
Comprehensive label set with:
- **Type**: bug, enhancement, feat, test, refactor, docs, chore, perf
- **Priority**: critical, high, medium, low
- **Size**: XS, S, M, L, XL
- **Area**: backend, frontend, auth, trust-engine, docs
- **Status**: needs-triage, needs-review, approved, work-in-progress, on-hold
- **Special**: ai-generated, needs-human-approval, breaking-change, security

### Milestones (3)
| Milestone | Status |
|-----------|--------|
| v0.1.1 – Multi-Agent Delegation Chains | Open |
| v0.1.3 – Cross-chain Credential Anchoring | Open |
| v0.1.4 – Production-ready + Federated Trust Graphs | Open |

⚠️ **Missing**: v0.2.0 milestone (current version). v0.1.2 milestone (claimed version) not found.

### Issue Templates (7)
- `agent_integration.yml`
- `bug_report.md` + `bug_report.yml`
- `feature_request.md` + `feature_request.yml`
- `security_report.yml` + `security_vulnerability.md`

### PR Template
✅ `PULL_REQUEST_TEMPLATE.md` exists

### CONTRIBUTING.md
✅ Exists with fork/clone/setup instructions

## 3. GitHub Actions Workflows (14)

| Workflow | Status | Last 3 Runs |
|----------|--------|-------------|
| **ci.yml** | ❌ **3/3 FAILURE** | Lint fails on d3 mock eslint-disable directives |
| **ai-pr-health.yml** | ❌ **2/3 FAILURE** | Failing on recent PRs |
| **label.yml** | ❌ **3/3 FAILURE** | `pull_request_target` labeling broken |
| **npm-publish.yml** | ❌ **2/2 FAILURE** | Cannot publish npm packages |
| **skill-quality.yml** | ❌ **3/3 FAILURE** | Quality gate failing on all Jules PRs |
| **hermes-weekly.yml** | ⚠️ **0 runs** | Never executed |
| **loops.yml** | ⚠️ **3/3 SKIPPED** | All scheduled runs skipped |
| **ai-issue-triage.yml** | ✅ 3/3 SUCCESS | Healthy |
| **ci-intelligence.yml** | ✅ 3/3 SUCCESS | Healthy |
| **codeql.yml** | ✅ 3/3 SUCCESS | Healthy |
| **gemini-review.yml** | ✅ 3/3 SUCCESS | Healthy |
| **soul-check.yml** | ✅ 3/3 SUCCESS | Healthy |
| **telegram-notify.yml** | ✅ 3/3 SUCCESS | Healthy |

### Critical CI Issues
1. **ci.yml**: d3 mock files have `eslint-disable` directives for rules that don't trigger → **FIXED** (commit 99484a69)
2. **label.yml**: `pull_request_target` with `workflow_call` may have permission issues
3. **npm-publish.yml**: Failing on tag push — needs investigation
4. **skill-quality.yml**: Failing on all Jules PRs — may need workflow trigger update

## 4. Security

### Dependabot Alerts (19)
| Package | Severity | Issue |
|---------|----------|-------|
| undici | Multiple | Set-Cookie, HTTP header injection, WebSocket DoS, request smuggling (12 alerts) |
| js-yaml | 4 alerts | Quadratic-complexity DoS via merge keys |
| @babel/core | 1 alert | Arbitrary file read via sourceMappingURL |
| ws | 1 alert | Memory exhaustion DoS |
| PostCSS | 1 alert | XSS via unescaped `</style>` |

### Code Scanning Alerts (10)
- Polynomial regular expression (ReDoS) × 2
- Uncontrolled command line × 1
- Incomplete URL substring sanitization × 4
- Incomplete multi-character sanitization × 3

### Secret Scanning
✅ No alerts

### Security Advisories
✅ None

## 5. Secrets (11)
| Secret | Last Updated |
|--------|-------------|
| APP_CLIENT_ID | 2026-06-27 |
| APP_ID | 2026-06-27 |
| APP_PRIVATE_KEY | 2026-06-27 |
| CF_ACCOUNT_ID | 2026-06-27 |
| CF_API_TOKEN | 2026-06-27 |
| GEMINI_API_KEY | 2026-06-27 |
| GROQ_API_KEY | 2026-06-27 |
| NPM_TOKEN | 2026-06-28 |
| TELEGRAM_BOT_TOKEN | 2026-06-27 |
| TELEGRAM_CHAT_ID | 2026-06-27 |
| WEBHOOK_SECRET | 2026-06-27 |

⚠️ **Missing secrets**: DATABASE_URL, PI_API_KEY, SOVEREIGN_KEY_SALT, AUTH_TOKEN_SECRET (likely in Vercel, not GitHub)

## 6. Releases & Tags

| Release | Date | Status |
|---------|------|--------|
| v0.2.0 — AIX Adoption | 2026-07-04 | Latest |
| v0.1.1 — Issue Infrastructure | 2026-06-27 | Published |
| v0.1.0 — Human Authorization Protocol | 2026-06-25 | Draft |

### Tags
`v0.2.0`, `v0.1.1`, `v0.1.0`

⚠️ **No CHANGELOG.md** found in repo root

## 7. Community Health

| Metric | Value |
|--------|-------|
| Health score | 100/100 |
| Stars | 2 |
| Forks | 6 |
| Watchers | 0 |

### CODEOWNERS
✅ Comprehensive coverage:
- Default: `@Moeabdelaziz007`
- Security/auth paths: explicit ownership
- CI/CD, AI workflows: explicit ownership
- Frontend components: explicit ownership

## 8. Open PRs (5)

| PR | Title | Status | Conflicts |
|----|-------|--------|-----------|
| #286 | Ponytail test refactoring | OPEN | None |
| #285 | Refactor Documentation (Jules) | DRAFT | N/A |
| #284 | Jules PR | OPEN | CONFLICTING |
| #283 | DelegationResolver tests (Jules) | OPEN | CONFLICTING |
| #282 | PWA badging tests | OPEN | CONFLICTING |

---

## Recommendations

### P0 — Fix Immediately
1. ✅ **d3 mock lint** — Fixed in commit 99484a69
2. 🔧 **label.yml** — Investigate `pull_request_target` permission issue
3. 🔧 **npm-publish.yml** — Investigate publish failure

### P1 — Improve
1. ⚙️ Enable `strict: true` in branch protection status checks
2. ⚙️ Enable `dismiss_stale_reviews: true`
3. ⚙️ Enable `require_code_owner_reviews: true`
4. 📋 Add missing milestones (v0.1.2, v0.2.1)
5. 📋 Close stale Jules PRs (#282, #283, #284) with conflicts
6. 🔒 Rotate dependabot alerts — run `npm audit fix`

### P2 — Nice to Have
1. Enable auto-merge for dependabot PRs
2. Enable GPG signing requirement
3. Add CHANGELOG.md
4. Investigate hermes-weekly.yml (0 runs)
5. Investigate loops.yml (all skipped)
