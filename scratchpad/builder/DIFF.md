# PR #33 — Builder Fixes

## src/app/api/did-document/route.ts

**Problem:** `buildDidDocument` returned `NextResponse.json(...)` in its catch block (a Response) but returned a plain object on success. Callers passed the return value directly to `NextResponse.json()`, producing nested response serialization.

**Fix:**
- Changed the catch block in `buildDidDocument` to `throw new Error(...)` instead of returning `NextResponse.json(...)`.
- Wrapped both calls to `buildDidDocument` in the `GET` handler with try/catch, returning `NextResponse.json({ error: ... }, { status: 500 })` on failure.

## src/middleware.ts

**Problem:** The subdomain rewrite (`alice.axiomid.app` → `/passport/alice`) ran for all paths including `/api/*`, breaking API requests from subdomains.

**Fix:** Added `!url.pathname.startsWith("/api/")` guard before the subdomain rewrite block at line 45.

## src/lib/env.ts

**Problem:** `validateEnv()` was exported but never called anywhere — dead code that passes the linter only due to being exported.

**Fix:** Added a doc comment above the export clarifying it is available for manual invocation and that the app is designed to boot without validating all env vars. The function stays exported for use in route handlers or scripts.
