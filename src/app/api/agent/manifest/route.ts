import { logger } from '@/lib/logger';
import { NextRequest } from "next/server";
import { createPrivateKey, sign } from "crypto";
import { requireAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limiter";
import { apiError, apiSuccess, rateLimitHeaders } from "@/lib/errors";
import { getClientIp } from "@/lib/ip";
import { createUserDid, createIssuerDid } from "@/lib/did";
import { getIssuerPrivateKey } from "@/lib/crypto";
import { canonicalize } from "@/lib/sanitize";

const MANIFEST_RATE_LIMIT = { windowMs: 60_000, maxRequests: 10 };

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`manifest:${ip}`, MANIFEST_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "Too many requests.", undefined, rateLimitHeaders(rateLimit));
  }

  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  const { user } = auth;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { piUid: user.piUid },
      select: { id: true, walletAddress: true, did: true, piUsername: true, tier: true, xp: true },
    });

    if (!existingUser) {
      return apiError("NOT_FOUND", "User not found");
    }

    const subjectId = existingUser.did || createUserDid(existingUser.id);
    const issuanceDate = new Date();
    const expirationDate = new Date(issuanceDate.getTime() + 24 * 60 * 60 * 1000);

    const issuerDid = createIssuerDid();

    const manifest = {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://www.w3.org/2018/credentials#issuer",
      ],
      type: ["VerifiableCredential", "AgentFacts"],
      issuer: {
        id: issuerDid,
        name: "AxiomID Protocol",
        image: "https://axiomid.app/icon-512x512.png",
      },
      issuanceDate: issuanceDate.toISOString(),
      expirationDate: expirationDate.toISOString(),
      credentialSubject: {
        id: subjectId,
        type: "AgentIdentity",
        name: existingUser.piUsername || "AxiomID Agent",
        description: "DID-based agent identity verified through AxiomID protocol",
        network: "Pi Network",
        tier: existingUser.tier,
        capabilities: ["kya-verification", "kyc-verification", "trust-scoring"],
        trustFramework: {
          name: "AxiomID Trust Framework",
          version: "1.0",
          tiers: ["Visitor", "Citizen", "Validator", "Sovereign"],
        },
      },
      credentialStatus: {
        id: `https://axiomid.app/api/credential-status?credentialId=${subjectId}`,
        type: "StatusList2021Entry",
        statusPurpose: "revocation",
        statusListIndex: "0",
        statusListCredential: "https://axiomid.app/api/credential-status",
      },
      metadata: {
        protocol: "AxiomID",
        version: "1.0.0",
        website: "https://axiomid.app",
        compliance: {
          kya: true,
          kyc: true,
          w3cDid: true,
          piCompatible: true,
        },
      },
    };

    let signature: string;
    let proofType: string;
    try {
      const dataToSign = JSON.stringify(canonicalize(manifest), null, 0);
      const { key: pemKey, alg } = getIssuerPrivateKey();
      const key = createPrivateKey({
        key: pemKey,
        format: "pem",
        type: "pkcs8",
      });

      if (alg === "EdDSA" && key.asymmetricKeyType === "ed25519") {
        signature = sign(null, Buffer.from(dataToSign), key).toString("hex");
        proofType = "Ed25519Signature2020";
      } else if (alg === "RS256" && key.asymmetricKeyType === "rsa") {
        signature = sign("sha256", Buffer.from(dataToSign), key).toString("hex");
        proofType = "RsaSignature2018";
      } else {
        logger.error(`[MANIFEST] Key type ${key.asymmetricKeyType} doesn't match expected algorithm ${alg}`);
        return apiError("INTERNAL_ERROR", "Key algorithm mismatch");
      }
    } catch (e) {
      logger.error("[MANIFEST] Failed to sign manifest:", e);
      return apiError("INTERNAL_ERROR", "Cryptographic signing failed");
    }

    const signedManifest = {
      ...manifest,
      proof: {
        type: proofType,
        created: issuanceDate.toISOString(),
        expires: expirationDate.toISOString(),
        verificationMethod: `${issuerDid}#key-1`,
        proofPurpose: "assertionMethod",
        proofValue: signature,
      },
    };

    return apiSuccess(signedManifest, 200, {
      "Content-Type": "application/ld+json",
      "Cache-Control": "private, max-age=300",
    });
  } catch (error) {
    logger.error("[MANIFEST] Error:", error);
    return apiError("INTERNAL_ERROR", "Failed to generate manifest");
  }
}
