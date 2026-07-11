# 🥧 Pi Network: Sovereign Anchor

## Integration Constraints
- **Browser Only**: Pi SDK must never be imported in server-side code.
- **Sandbox Detection**: Always use `determineSandboxMode()`.
- **Auth Timeout**: Use $\geq 45$s for mobile authentication.
- **Sovereign Salt**: Use `SOVEREIGN_KEY_SALT` for all key derivations.
