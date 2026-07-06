# ⏭️ Next Steps

## P0 — Security (from handoff)
1. **Capability Security**: Implement `checkCapability()` in `/api/skills/[slug]/execute`.
2. **Transactional Integrity**: Wrap moderation logic in `prisma.$transaction`.
3. **Identity Restoration**: Fix `buildDidDocument` to include public keys.
4. **Persistence**: Fix `passportUrl` save on publish.

## P1 — MVP Bug Fixes (from audit)
1. Add missing `animate-slide-up` CSS keyframe
2. Fix KYC boolean coercion in IdentityTab
3. Fix PassportView raw i18n key (`settings.tabs.memory`)
4. Fix PassportView infinite polling (add `enabled` flag)
5. Fix `<Link>` wrapping `<button>` (use `<button>` + `router.push`)
6. Add `role="tabpanel"` to dashboard tab panels
7. Add rate limiting to `/api/agent/public`

## P2 — E2E Execution
1. Fix Playwright timeout (run `npm run build` first, or increase timeout)
2. Collect actual pass/fail results per route per viewport

## P3 — GitHub Setup Audit
1. Issues, labels, milestones, projects
2. Wiki, discussions, templates
3. Branch protection rules
4. Security alerts (postcss, babel, js-yaml)
5. Releases/changelog

## P4 — Internal Folders Hygiene
1. Move `handoffs/` to `docs/`
2. Archive `docs/superpowers/plans/`
3. Delete `.devin/`
4. Consolidate `src/__mocks__/d3*` into jest config
