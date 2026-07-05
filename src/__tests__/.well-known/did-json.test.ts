/**
 * @jest-environment node
 *
 * Tests for src/app/.well-known/did.json/route.ts
 *
 * Serves the W3C DID Document for the AxiomID protocol root of trust.
 */

jest.mock("@/lib/did", () => ({
  createIssuerDid: jest.fn(() => "did:axiom:issuer"),
}));

jest.mock("@/lib/did-document", () => ({
  buildDidDocument: jest.fn((did: string, publicKey?: string) => ({
    "@context": ["https://www.w3.org/ns/did/v1"],
    id: did,
    ...(publicKey
      ? {
          verificationMethod: [
            {
              id: `${did}#key-1`,
              type: "Ed25519VerificationKey2020",
              controller: did,
              publicKeyMultibase: publicKey,
            },
          ],
          authentication: ["#key-1"],
          assertionMethod: ["#key-1"],
        }
      : {}),
  })),
}));

jest.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: jest.fn().mockResolvedValue({
    allowed: true,
    remaining: 59,
    resetAt: Date.now() + 60000,
  }),
  RATE_LIMITS: {
    public: { windowMs: 60000, maxRequests: 60 },
  },
}));

jest.mock("@/lib/ip", () => ({
  getClientIp: jest.fn(() => "127.0.0.1"),
}));

jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

import { GET } from "@/app/.well-known/did.json/route";
import { createIssuerDid } from "@/lib/did";
import { buildDidDocument } from "@/lib/did-document";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/ip";

const mockCreateIssuerDid = createIssuerDid as jest.Mock;
const mockBuildDidDocument = buildDidDocument as jest.Mock;
const mockCheckRateLimit = checkRateLimit as jest.Mock;
const mockGetClientIp = getClientIp as jest.Mock;

function mockGetRequest(): Request {
  return new Request("http://localhost/.well-known/did.json", {
    method: "GET",
  }) as any;
}

describe("GET /.well-known/did.json", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 59,
      resetAt: Date.now() + 60000,
    });
    mockGetClientIp.mockReturnValue("127.0.0.1");
    process.env.ISSUER_PUBLIC_KEY = "test-public-key";
  });

  afterEach(() => {
    delete process.env.ISSUER_PUBLIC_KEY;
  });

  it("returns 200 with correct content-type", async () => {
    const req = mockGetRequest();
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/did+ld+json");
  });

  it("returns issuer DID document with id: did:axiom:issuer", async () => {
    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(data.id).toBe("did:axiom:issuer");
    expect(mockCreateIssuerDid).toHaveBeenCalled();
  });

  it("returns 500 when ISSUER_PUBLIC_KEY is missing", async () => {
    delete process.env.ISSUER_PUBLIC_KEY;

    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toContain("ISSUER_PUBLIC_KEY");
  });

  it("response validates against DidDocumentSchema shape", async () => {
    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(data["@context"]).toBeDefined();
    expect(Array.isArray(data["@context"])).toBe(true);
    expect(data["@context"]).toContain("https://www.w3.org/ns/did/v1");
    expect(data.id).toBe("did:axiom:issuer");
    expect(data.verificationMethod).toBeDefined();
    expect(Array.isArray(data.verificationMethod)).toBe(true);
    expect(data.verificationMethod[0].type).toBe(
      "Ed25519VerificationKey2020"
    );
  });

  it("sets Cache-Control header with max-age=86400", async () => {
    const req = mockGetRequest();
    const res = await GET(req);

    expect(res.headers.get("Cache-Control")).toContain("max-age=86400");
  });

  it("uses RATE_LIMITS.public for rate limiting", async () => {
    const req = mockGetRequest();
    await GET(req);

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      expect.stringContaining("did-json:"),
      RATE_LIMITS.public
    );
  });
});
