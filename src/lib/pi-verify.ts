import { logger } from '@/lib/logger';

export interface PiVerifyResult {
  verified: boolean;
  uid: string;
  provider: 'pi_verify';
}

export class PiVerifyError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'PiVerifyError';
    this.code = code;
  }
}

function getApiKey(): string | undefined {
  return process.env.PI_VERIFY_API_KEY;
}

function getApiBaseUrl(): string {
  return process.env.PI_VERIFY_API_BASE_URL || 'https://piverify.minepi.com/api/v1';
}

/**
 * Verify a user's KYC status through PiVerify — Pi's KYC-as-a-service
 * for external platforms.
 *
 * PiVerify acts as a secondary verification source when the primary Pi API
 * returns kycVerified: false.  It checks whether the given Pi UID has
 * completed Pi KYC, using Pi's own verification infrastructure.
 *
 * Requires PI_VERIFY_API_KEY env var to be set.  Returns an unverified
 * result when the env var is missing (graceful degradation — PiVerify is
 * additive, not required).
 */
export async function verifyWithPiVerify(piUid: string, accessToken: string): Promise<PiVerifyResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    logger.warn('[PI-VERIFY] PI_VERIFY_API_KEY not set — skipping PiVerify check');
    return { verified: false, uid: piUid, provider: 'pi_verify' };
  }

  const baseUrl = getApiBaseUrl();

  try {
    const response = await fetch(`${baseUrl}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ uid: piUid, access_token: accessToken }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => 'unable to read body');
      logger.error(`[PI-VERIFY] API returned ${response.status}: ${body}`);
      return { verified: false, uid: piUid, provider: 'pi_verify' };
    }

    const data = await response.json() as { verified: boolean };
    return { verified: data.verified === true, uid: piUid, provider: 'pi_verify' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`[PI-VERIFY] Request failed: ${msg}`);
    return { verified: false, uid: piUid, provider: 'pi_verify' };
  }
}
