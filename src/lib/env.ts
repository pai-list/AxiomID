const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'PI_API_KEY',
  'PI_TOKEN_ENCRYPTION_KEY',
  'OAUTH_STATE_SECRET',
  'ISSUER_PRIVATE_KEY',
  'ISSUER_PUBLIC_KEY',
] as const;

export function validateEnv(): void {
  if (typeof process === 'undefined' || !process.env) return;

  const missing: string[] = [];
  for (const name of REQUIRED_ENV_VARS) {
    if (!process.env[name]) {
      missing.push(name);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join('\n  ')}\n\n` +
      `Set them in your Vercel dashboard or .env file before deploying.`
    );
  }
}
