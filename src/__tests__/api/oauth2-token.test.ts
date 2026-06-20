/**
 * @jest-environment node
 */

jest.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 99, resetAt: Date.now() + 60000 }),
  RATE_LIMITS: { authenticated: { windowMs: 60000, maxRequests: 100 } },
}));
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));
jest.mock("@/lib/auth-tokens", () => ({
  verifyIdentityAssertion: jest.fn(),
  createAccessToken: jest.fn(),
}));
jest.mock("@/lib/claim-ceremony", () => ({
  verifyClaimToken: jest.fn(),
}));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/oauth2/token/route";
import { verifyIdentityAssertion, createAccessToken } from "@/lib/auth-tokens";
import { verifyClaimToken } from "@/lib/claim-ceremony";

const mockVerifyAssertion = verifyIdentityAssertion as jest.Mock;
const mockCreateToken = createAccessToken as jest.Mock;
const mockVerifyClaim = verifyClaimToken as jest.Mock;

function mockPostRequest(body: unknown) {
  return new NextRequest("http://localhost/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/oauth2/token", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateToken.mockResolvedValue("access-token-xyz");
  });

  it("exchanges jwt-bearer for access token", async () => {
    mockVerifyAssertion.mockResolvedValue({ sub: "did:axiom:axiomid.app:pi:abc", scopes: ["api.read"] });

    const req = mockPostRequest({ grant_type: "jwt-bearer", assertion: "valid-jwt" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.access_token).toBe("access-token-xyz");
    expect(data.token_type).toBe("Bearer");
    expect(data.expires_in).toBe(3600);
  });

  it("returns access token on confirmed claim", async () => {
    mockVerifyClaim.mockReturnValue({ status: "confirmed", userId: "user-1" });

    const req = mockPostRequest({ grant_type: "claim", claim_token: "claim-abc" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.access_token).toBeDefined();
  });

  it("returns pending status for unconfirmed claim", async () => {
    mockVerifyClaim.mockReturnValue({ status: "pending" });

    const req = mockPostRequest({ grant_type: "claim", claim_token: "claim-abc" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("pending");
  });

  it("returns 400 for unsupported grant type", async () => {
    const req = mockPostRequest({ grant_type: "unsupported" });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});
