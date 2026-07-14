# 🚀 Mission 001: Sovereign Hardening
**Objective**: Close P0 security gaps and ensure transactional integrity.
**Status**: ACTIVE
**Owner**: OpenCode

## 🎯 Acceptance Criteria
- [ ] \`/api/skills/[slug]/execute\` gated by Capability check.
- [ ] Admin moderation wrapped in \`prisma.\$transaction\`.
- [ ] DID Document restored with valid public keys.
- [ ] \`passportUrl\` persisted to database on publish.

## 🛠️ Affected Components
- \`src/app/api/skills/[slug]/execute/route.ts\`
- \`src/app/api/admin/skills/[id]/route.ts\`
- \`src/lib/did-document.ts\`
- \`src/app/api/passport/[slug]/publish/route.ts\`

## ⏪ Rollback Plan
- Revert individual route changes via git.
- Database migrations are additive; no schema rollback required for this mission.
