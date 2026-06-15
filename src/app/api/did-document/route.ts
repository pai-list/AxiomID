import { NextRequest, NextResponse } from "next/server";
import { createIssuerDid } from "@/lib/did";
import { buildDidDocument } from "@/lib/did-document";
import { resolveDid } from "@/lib/did-resolver";
import { DidDocumentQuerySchema } from "@/lib/validators";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { apiError, rateLimitHeaders } from "@/lib/errors";
import { getClientIp } from "@/lib/ip";

/**
 * Serves a DID document for a specified DID or the issuer's DID.
 *
 * @returns A NextResponse containing the DID document in `application/did+ld+json` format with cache headers, or an HTTP error response (429, 400, 404, or 500) if rate limiting, validation, resolution, or generation fails.
 */
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
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { did: didParam } = parsed.data;

  // If a specific DID is requested, resolve it from DB
  if (didParam) {
    const user = await resolveDid(didParam);

    if (!user) {
      return NextResponse.json({ error: "DID not found" }, { status: 404 });
    }

    if (!user.did) {
      return NextResponse.json({ error: "User has no DID configured" }, { status: 400 });
    }

    try {
      const doc = buildDidDocument(user.did);
      return NextResponse.json(doc, {
        headers: {
          "Content-Type": "application/did+ld+json",
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
        },
      });
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 500 }
      );
    }
  }

  // No DID param → return issuer DID Document
  const publicKeyPem = process.env.ISSUER_PUBLIC_KEY;
  if (!publicKeyPem) {
    return NextResponse.json({ error: "ISSUER_PUBLIC_KEY not configured" }, { status: 500 });
  }

  const issuerDid = createIssuerDid();

  try {
    const doc = buildDidDocument(issuerDid, publicKeyPem);
    return NextResponse.json(doc, {
      headers: {
        "Content-Type": "application/did+ld+json",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
