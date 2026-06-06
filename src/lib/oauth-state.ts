import crypto from 'crypto';

const STATE_SECRET = process.env.GITHUB_CLIENT_SECRET;

if (!STATE_SECRET) {
  throw new Error('FATAL: GITHUB_CLIENT_SECRET environment variable is not defined.');
}

/**
 * Signs the wallet address into a secure state token that expires in 10 minutes.
 * Prevents spoofing and CSRF attacks in the OAuth callback.
 */
export function signState(walletAddress: string): string {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes lifetime
  const payload = JSON.stringify({ walletAddress, expiresAt });
  const signature = crypto
    .createHmac('sha256', STATE_SECRET!)
    .update(payload)
    .digest('hex');

  const envelope = { payload, signature };
  return Buffer.from(JSON.stringify(envelope)).toString('base64url');
}

/**
 * Verifies a secure state token and returns the verified wallet address,
 * or null if verification fails or the token has expired.
 */
export function verifyState(stateToken: string): string | null {
  try {
    const jsonStr = Buffer.from(stateToken, 'base64url').toString('utf8');
    const envelope = JSON.parse(jsonStr);
    const { payload, signature } = envelope;

    const expectedSignature = crypto
      .createHmac('sha256', STATE_SECRET!)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('[verifyState] Signature mismatch');
      return null;
    }

    const { walletAddress, expiresAt } = JSON.parse(payload);
    if (Date.now() > expiresAt) {
      console.error('[verifyState] Token expired');
      return null;
    }

    return walletAddress;
  } catch (error) {
    console.error('[verifyState] Parse error:', error);
    return null;
  }
}

/**
 * Sign a value (like a wallet address) securely for a cookie.
 */
export function signValue(value: string): string {
  const signature = crypto
    .createHmac('sha256', STATE_SECRET!)
    .update(value)
    .digest('hex');
  return `${value}.${signature}`;
}

/**
 * Verify a signed value from a cookie.
 */
export function verifyValue(signedValue: string): string | null {
  try {
    const parts = signedValue.split('.');
    if (parts.length !== 2) return null;
    const [value, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', STATE_SECRET!)
      .update(value)
      .digest('hex');
    if (signature !== expectedSignature) return null;
    return value;
  } catch {
    return null;
  }
}
