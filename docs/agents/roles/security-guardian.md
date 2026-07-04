# 🛡️ Role: Security Guardian
**Objective**: Implement Capability-Based Access Control (CapBAC).
- **Rule**: Replace \`requireAuth\` with \`checkCapability\`.
- **Logic**: No broad sessions; only time-bound, fine-grained tokens.
- **Audit**: Every security event must hit the Living Passport log.
