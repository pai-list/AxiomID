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
import { logger } from "@/lib/logger";

const mockCreateIssuerDid = createIssuerDid as jest.Mock;
const mockBuildDidDocument = buildDidDocument as jest.Mock;
const mockCheckRateLimit = checkRateLimit as jest.Mock;
const mockGetClientIp = getClientIp as jest.Mock;
const mockLoggerError = logger.error as jest.Mock;

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

  it("includes the client IP in the rate limit key", async () => {
    mockGetClientIp.mockReturnValue("203.0.113.7");

    const req = mockGetRequest();
    await GET(req);

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "did-json:203.0.113.7",
      RATE_LIMITS.public
    );
  });
});

describe("GET /.well-known/did.json — rate limiting enforcement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetClientIp.mockReturnValue("127.0.0.1");
    process.env.ISSUER_PUBLIC_KEY = "test-public-key";
  });

  afterEach(() => {
    delete process.env.ISSUER_PUBLIC_KEY;
  });

  it("returns 429 with RATE_LIMITED error when rate limit exceeded", async () => {
    const resetAt = Date.now() + 30000;
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt });

    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.error).toBe("Too many requests. Try again later.");
    expect(data.code).toBe("RATE_LIMITED");
  });

  it("sets a Retry-After header derived from resetAt when rate limited", async () => {
    const resetAt = Date.now() + 30000;
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt });

    const req = mockGetRequest();
    const res = await GET(req);

    const retryAfter = Number(res.headers.get("Retry-After"));
    expect(Number.isNaN(retryAfter)).toBe(false);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(30);
  });

  it("does not build a DID document when the request is rate limited", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 30000,
    });

    const req = mockGetRequest();
    await GET(req);

    expect(mockCreateIssuerDid).not.toHaveBeenCalled();
    expect(mockBuildDidDocument).not.toHaveBeenCalled();
  });
});

describe("GET /.well-known/did.json — service and alsoKnownAs enrichment", () => {
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

  it("adds alsoKnownAs pointing to the AxiomID web origin", async () => {
    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(data.alsoKnownAs).toEqual(["https://axiomid.app"]);
  });

  it("adds a service array with passport, agent coordination, and credential status entries", async () => {
    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(Array.isArray(data.service)).toBe(true);
    expect(data.service).toHaveLength(3);

    const byType = Object.fromEntries(
      data.service.map((s: { type: string; id: string; serviceEndpoint: string }) => [s.type, s])
    );

    expect(byType.AxiomPassport).toMatchObject({
      id: "did:axiom:issuer#passport",
      serviceEndpoint: "https://axiomid.app/passport",
    });
    expect(byType.AgentCoordination).toMatchObject({
      id: "did:axiom:issuer#agents",
      serviceEndpoint: "https://axiomid.app/dashboard",
    });
    expect(byType.CredentialStatus).toMatchObject({
      id: "did:axiom:issuer#credential-status",
      serviceEndpoint: "https://axiomid.app/api/credential-status",
    });
  });
});

describe("GET /.well-known/did.json — buildDidDocument invocation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 59,
      resetAt: Date.now() + 60000,
    });
    mockGetClientIp.mockReturnValue("127.0.0.1");
  });

  afterEach(() => {
    delete process.env.ISSUER_PUBLIC_KEY;
  });

  it("passes the issuer DID and the ISSUER_PUBLIC_KEY env value to buildDidDocument", async () => {
    process.env.ISSUER_PUBLIC_KEY = "pem-issuer-pub";

    const req = mockGetRequest();
    await GET(req);

    expect(mockBuildDidDocument).toHaveBeenCalledWith("did:axiom:issuer", "pem-issuer-pub");
  });

  it("does not call buildDidDocument when ISSUER_PUBLIC_KEY is missing", async () => {
    delete process.env.ISSUER_PUBLIC_KEY;

    const req = mockGetRequest();
    await GET(req);

    expect(mockBuildDidDocument).not.toHaveBeenCalled();
  });
});

describe("GET /.well-known/did.json — error handling", () => {
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

  it("returns 500 and logs the error when buildDidDocument throws", async () => {
    mockBuildDidDocument.mockImplementation(() => {
      throw new Error("boom");
    });

    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.code).toBe("INTERNAL_ERROR");
    expect(data.error).toBe("Failed to generate DID document");
    expect(mockLoggerError).toHaveBeenCalledWith(
      "[.well-known/did.json] Error:",
      expect.any(Error)
    );
  });

  it("returns 500 and logs the error when createIssuerDid throws", async () => {
    mockCreateIssuerDid.mockImplementation(() => {
      throw new Error("issuer key unavailable");
    });

    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.code).toBe("INTERNAL_ERROR");
    expect(mockLoggerError).toHaveBeenCalled();
  });
});
