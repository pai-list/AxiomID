/**
 * Resolves the sandbox dev token on the server.
 *
 */
export function getSandboxDevToken(): string | undefined {
  if (process.env.NODE_ENV === 'production') {
    // SECURITY: Never return sandbox tokens in production.
    // Even if SANDBOX_DEV_TOKEN is set, this function returns undefined.
    // The auth-middleware.ts also has an explicit production guard as a second layer.
    return undefined;
  }
}
