import { NextRequest } from "next/server";
import { buildDidDocument } from "@/lib/did-document";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { apiError, apiSuccess } from "@/lib/errors";
import { getClientIp } from "@/lib/ip";
import { logger } from "@/lib/logger";

/**
 * GET /.well-known/did.json
 *
 * Serves the W3C DID Document for the AxiomID protocol root of trust.
 * This is the canonical resolution endpoint for did:web:axiomid.app
 * per the W3C DID Resolution specification.
 *
 * No database queries — derives entirely from env vars.
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`did-json:${ip}`, RATE_LIMITS.public);
  if (!rateLimit.allowed) {
    return apiError(
      "RATE_LIMITED",
      "Too many requests. Try again later.",
      undefined,
      {
        "Retry-After": String(
          Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
        ),
      }
    );
  }

  const publicKeyPem = process.env.ISSUER_PUBLIC_KEY;
  if (!publicKeyPem) {
    return apiError(
      "INTERNAL_ERROR",
      "ISSUER_PUBLIC_KEY not configured — cannot serve DID document"
    );
  }

  try {
    const did = "did:web:axiomid.app";
    const doc = buildDidDocument(did, publicKeyPem);

    const enrichedDoc = {
      ...doc,
      alsoKnownAs: ["https://axiomid.app"],
      service: [
        {
          id: `${did}#passport`,
          type: "AxiomPassport",
          serviceEndpoint: "https://axiomid.app/passport",
        },
        {
          id: `${did}#agents`,
          type: "AgentCoordination",
          serviceEndpoint: "https://axiomid.app/dashboard",
        },
        {
          id: `${did}#credential-status`,
          type: "CredentialStatus",
          serviceEndpoint: "https://axiomid.app/api/credential-status",
        },
      ],
    };

    return apiSuccess(enrichedDoc, 200, {
      "Content-Type": "application/did+ld+json",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=86400",
    });
  } catch (err) {
    logger.error("[.well-known/did.json] Error:", err);
    return apiError("INTERNAL_ERROR", "Failed to generate DID document");
  }
}
