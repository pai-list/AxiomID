# ⏭️ Next Steps: P0 Hardening

1. **Capability Security**: Implement `checkCapability()` in `/api/skills/[slug]/execute`.
2. **Transactional Integrity**: Wrap moderation logic in `prisma.$transaction`.
3. **Identity Restoration**: Fix `buildDidDocument` to include public keys.
4. **Persistence**: Fix `passportUrl` save on publish.
