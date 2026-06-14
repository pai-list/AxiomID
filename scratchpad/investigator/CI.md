# CI/Workflow Audit

## Workflow Files Found
2 files in `.github/workflows/`:

### 1. `ci.yml`
- **Triggers**: `push` and `pull_request` to `main`
- **Concurrency**: Grouped by workflow+ref, cancels in-progress
- **Job**: `verify` on `ubuntu-latest`
  - `actions/checkout@v6` ✅
  - `actions/setup-node@v6` with Node 22 + npm cache ✅
  - `npm ci` ✅
  - `npx prisma generate` (graceful skip if no DATABASE_URL) ⚠️ silent failure
  - `npm run type-check` (tsc --noEmit) ✅
  - `npm run lint` (eslint) ✅
  - `npm test -- --ci --runInBand` (jest) ✅

### 2. `codeql.yml`
- **Triggers**: `push`/`pull_request` to `main` + weekly `cron: "0 6 * * 1"`
- **Job**: `analyze` with matrix for `javascript-typescript`, `build-mode: none`
  - `actions/checkout@v6` ✅
  - `github/codeql-action/init@v4` ✅
  - `github/codeql-action/analyze@v4` ✅

## Issues Found

### ⚠️ No Deploy Workflow
vercel.json has `github.enabled: true` — deployment is handled by Vercel's auto-GitHub-integration, **not** by a GitHub Actions workflow. This means:
- No deploy gate between CI passing and production deploy
- No way to see deploy status/history from GitHub
- No rollback or approval workflow
- The deploy is completely opaque from the CI perspective

### ⚠️ No Cache Dependency Caching in CI
The CI uses `setup-node`'s built-in npm cache (`cache: npm`), which is good. But there's no caching for:
- Next.js build cache (`.next/cache`)
- Prisma client generation cache

### ⚠️ Prisma Generate Silence
If `prisma generate` fails, it's swallowed by `|| true`. This could mask schema drift in PRs.

### ✅ No Deprecated Actions
- `actions/checkout@v6` — latest
- `actions/setup-node@v6` — latest
- `github/codeql-action/init@v4`, `analyze@v4` — latest

### ✅ No Exposed Secrets
No secrets are passed in workflow files (Vercel token, DATABASE_URL, etc.)

### ✅ No Wrong Triggers
Push/PR to `main` is appropriate for a production app.

## Vercel Auto-Deploy Config (from vercel.json)
- `framework: "nextjs"`
- `buildCommand`: `(test -n "$DATABASE_URL" && prisma migrate deploy) || true; npm run build`
- `installCommand`: `npm install`
- `region`: `iad1`
- `cleanUrls`: `true`

## Recommendations
1. Add a GitHub Actions deploy workflow that waits for CI, then calls Vercel Deploy Hooks — gives visibility and gating
2. Add Next.js build cache to CI (`actions/cache` for `.next/cache`)
3. Consider adding branch protection requiring CI to pass before merge
