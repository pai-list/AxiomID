# 🛡️ Security: Capability-Based Access Control

## The Sovereign Gate
AxiomID moves away from simple `requireAuth()` towards a Capability Engine:
`Request` $\rightarrow$ `Identity Verification` $\rightarrow$ `Capability Check` $\rightarrow$ `Policy Engine` $\rightarrow$ `Risk Engine` $\rightarrow$ `Execution`.

## Rules
- **Fine-Grained Tokens**: Issue time-bound capability tokens for specific actions.
- **No Broad Sessions**: Avoid "isLoggedIn" checks for critical operations. Ask "does this entity have the capability for this action?"
- **Risk-Based Execution**: High-risk actions (e.g., large payments, identity changes) must trigger a Risk Engine evaluation.
