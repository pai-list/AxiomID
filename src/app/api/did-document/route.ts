import { NextRequest, NextResponse } from "next/server";
import { createIssuerDid } from "@/lib/did";
import { buildDidDocument } from "@/lib/did-document";
import { resolveDid } from "@/lib/did-resolver";
import { DidDocumentQuerySchema } from "@/lib/validators";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/ip";

/**
 * Returns a DID Document for the requested DID or the issuer's DID Document.
 *
 * Enforces per-client rate limiting on the endpoint. If a `did` query parameter is provided, resolves and returns the corresponding DID Document. If no `did` parameter is provided, returns the issuer's DID Document. Responses include appropriate caching headers and `application/did+ld+json` content type.
 *
 * @returns A JSON response containing a DID Document with caching headers, or an error response if the request is rate-limited, the DID is invalid, the DID is not found, the user has no DID configured, or document generation fails.
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`did-doc:${ip}`, RATE_LIMITS.public);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "RATE_LIMITED", message: "Too many requests." }, { status: 429 });
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
