# ⚠️ Known Issues

## Security (P0)
- `/api/skills/[slug]/execute` is currently unauthenticated.
- Admin moderation is not atomic (no `prisma.$transaction`).
- Sovereign DIDs are missing public keys in the document.
- `passportUrl` is not persisted to the database.

## MVP Bugs (P1)
- Missing `animate-slide-up` CSS keyframe (breaks framer-motion animations).
- KYC boolean coercion bug in IdentityTab (`status === "verified"` vs truthy check).
- PassportView renders raw i18n key `settings.tabs.memory` instead of translated text.
- PassportView polls `/api/passport/[slug]` infinitely (no `enabled` flag on query).
- `<Link>` wraps `<button>` in several places (invalid HTML nesting).
- Dashboard tab panels missing `role="tabpanel"` (accessibility).
- No rate limiting on `/api/agent/public` endpoint.

## Test Artifacts
- Playwright tests written but not executing (dev server compilation timeout).
- `test-results/` and `playwright-report/` committed — should be gitignored.

## Open PRs (from Jules, have merge conflicts)
- #282: PWA badging tests — CONFLICTING
- #283: DelegationResolver tests — CONFLICTING
- #284: Jules PR — CONFLICTING
- #285: Refactor Documentation — DRAFT
