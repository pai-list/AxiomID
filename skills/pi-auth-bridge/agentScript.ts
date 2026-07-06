import { z } from "zod";

// ─── Schema ──────────────────────────────────────────────────────────────────

const PiAccessTokenSchema = z.object({
  accessToken: z.string().min(1, "accessToken is required"),
});

const PiUserSchema = z.object({
  uid: z.string(),
  username: z.string().optional(),
  currency: z.string().optional(),
});

export type PiUser = z.infer<typeof PiUserSchema>;

// ─── DID Derivation ──────────────────────────────────────────────────────────

const DID_METHOD = "did:axiom";

/**
 * Derives a Pi-specific DID from a verified Pi UID.
 * Format: did:axiom:pi:<uid>
 */
export function derivePiDid(uid: string): string {
  return `${DID_METHOD}:pi:${encodeURIComponent(uid)}`;
}

// ─── Token Verification ──────────────────────────────────────────────────────

/**
 * Validates the shape of a Pi access token before sending to Pi API.
 */
export function validateAccessToken(token: string): { valid: boolean; error?: string } {
  const result = PiAccessTokenSchema.safeParse({ accessToken: token });
  if (!result.success) {
    return { valid: false, error: result.error.issues[0].message };
  }
  return { valid: true };
}

/**
 * Verifies a Pi access token against the Pi Network API.
 * Returns the verified user or null if invalid.
 */
export async function verifyPiAccessToken(
  token: string,
  piApiBase: string = "https://api.minepi.com"
): Promise<PiUser | null> {
  const validation = validateAccessToken(token);
  if (!validation.valid) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout for Pi Browser

    const response = await fetch(`${piApiBase}/v2/me`, {
      headers: { Authorization: `Key ${token}` },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = await response.json();
    return PiUserSchema.parse(data);
  } catch {
    return null;
  }
}

// ─── Assertion Creation ──────────────────────────────────────────────────────

export interface DidAssertion {
  did: string;
  scopes: string[];
  issuedAt: number;
  expiresAt: number;
}

/**
 * Creates a DID assertion for a verified Pi user.
 * This is a lightweight assertion — real JWT signing happens server-side.
 */
export function createDidAssertion(
  user: PiUser,
  scopes: string[] = ["api.read", "api.write"]
): DidAssertion {
  const did = derivePiDid(user.uid);
  const now = Math.floor(Date.now() / 1000);

  return {
    did,
    scopes,
    issuedAt: now,
    expiresAt: now + 3600, // 1 hour
  };
}
