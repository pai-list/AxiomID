import { NextRequest } from "next/server";
import { createIssuerDid } from "@/lib/did";
import { deriveUserRootKey } from "@/lib/sovereign-keys";
import { buildDidDocument, pemToMultibase } from "@/lib/did-document";
import { resolveDid } from "@/lib/did-resolver";
import { DidDocumentQuerySchema } from "@/lib/validators";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { apiError, apiSuccess, rateLimitHeaders } from "@/lib/errors";
import { getClientIp } from "@/lib/ip";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`did-doc:${ip}`, RATE_LIMITS.public);
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "Too many requests. Try again later.", undefined, rateLimitHeaders(rateLimit));
  }

  const { searchParams } = new URL(request.url);
  const parsed = DidDocumentQuerySchema.safeParse({
    did: searchParams.get("did"),
  });

  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0].message, parsed.error.issues);
  }

  const { did: didParam } = parsed.data;

  try {
    if (didParam) {
      const user = await resolveDid(didParam);

      if (!user) {
        return apiError("NOT_FOUND", "DID not found");
      }

      if (!user.did) {
        return apiError("VALIDATION_ERROR", "User has no DID configured");
      }

      
      let publicKeyMultibase: string | undefined;
      try {
         const keys = deriveUserRootKey(user.piUid || user.id);
         publicKeyMultibase = pemToMultibase(keys.publicKey);
      } catch (err) {
         logger.error("[DID-DOC] Key derivation failed", err);
      }
      
      if (!publicKeyMultibase) {
        return apiError("INTERNAL_ERROR", "Could not derive public key for DID document");
      }

      const doc = buildDidDocument(user.did, publicKeyMultibase);
      return apiSuccess(doc, 200, {
        "Content-Type": "application/did+ld+json",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      });
    }

    const issuerPublicKeyPem = process.env.ISSUER_PUBLIC_KEY;
    if (!issuerPublicKeyPem) {
      return apiError("INTERNAL_ERROR", "ISSUER_PUBLIC_KEY not configured");
    }

    const issuerDid = createIssuerDid();
    const issuerPublicKeyMultibase = pemToMultibase(issuerPublicKeyPem);
    const doc = buildDidDocument(issuerDid, issuerPublicKeyMultibase);
    return apiSuccess(doc, 200, {
      "Content-Type": "application/did+ld+json",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    });
  } catch (err) {
    logger.error("[DID-DOC] Error:", err);
    return apiError("INTERNAL_ERROR", "Failed to generate DID document");
  }
}
