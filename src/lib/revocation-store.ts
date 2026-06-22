// TTL-based revocation store — tokens evict after 24 hours.
// ponytail: no setInterval — Vercel Functions are stateless. Lazy eviction in
// isTokenRevoked handles cleanup on access; stale entries are harmless.
const REVOKED_TOKENS_TTL_MS = 24 * 60 * 60 * 1000;
const revokedTokens = new Map<string, number>();

export function revokeToken(token: string): void {
  revokedTokens.set(token, Date.now() + REVOKED_TOKENS_TTL_MS);
}

export function isTokenRevoked(token: string): boolean {
  const expiresAt = revokedTokens.get(token);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    revokedTokens.delete(token);
    return false;
  }
  return true;
}
