/**
 * @jest-environment node
 *
 * Tests for src/app/api/vc/verify-onchain/route.ts
 */

jest.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: jest.fn(),
  RATE_LIMITS: {
    public: { windowMs: 60_000, maxRequests: 100 },
  },
}));

jest.mock("@/lib/ip", () => ({
  getClientIp: jest.fn(() => "127.0.0.1"),
}));

jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

jest.mock("@/lib/stellar-anchoring", () => ({
  verifyVcOnChain: jest.fn(),
}));

import { POST } from "@/app/api/vc/verify-onchain/route";
import { checkRateLimit } from "@/lib/rate-limiter";
import { verifyVcOnChain } from "@/lib/stellar-anchoring";

const mockCheckRateLimit = checkRateLimit as jest.Mock;
const mockVerifyVcOnChain = verifyVcOnChain as jest.Mock;

function mockRequest(body?: unknown) {
  return new Request("http://localhost/api/vc/verify-onchain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }) as never;
}

describe("POST /api/vc/verify-onchain", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 99,
      resetAt: Date.now() + 60000,
    });
  });

  it("returns 400 without required fields", async () => {
    const req = mockRequest({});
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("returns 429 when rate limited", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 60000,
    });

    const req = mockRequest({ signedVc: {}, stellarTxId: "tx123" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.code).toBe("RATE_LIMITED");
  });

  it("returns 400 when stellarTxId is missing", async () => {
    const req = mockRequest({ signedVc: {} });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when signedVc is missing", async () => {
    const req = mockRequest({ stellarTxId: "tx123" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("verifies VC successfully and returns result", async () => {
    const mockResult = {
      anchored: true,
      memoMatches: true,
      onChainHash: "abc123hash",
      stellarTxId: "tx123",
    };
    mockVerifyVcOnChain.mockResolvedValue(mockResult);

    const req = mockRequest({ signedVc: { proof: {} }, stellarTxId: "tx123" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.anchored).toBe(true);
    expect(data.memoMatches).toBe(true);
    expect(mockVerifyVcOnChain).toHaveBeenCalledWith({ proof: {} }, "tx123");
  });

  it("returns 500 when verifyVcOnChain throws", async () => {
    mockVerifyVcOnChain.mockRejectedValue(new Error("Stellar network error"));

    const req = mockRequest({ signedVc: {}, stellarTxId: "tx123" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.code).toBe("INTERNAL_ERROR");
  });

  it("returns result when VC is not anchored", async () => {
    const mockResult = {
      anchored: false,
      memoMatches: false,
      onChainHash: "",
      stellarTxId: "tx123",
    };
    mockVerifyVcOnChain.mockResolvedValue(mockResult);

    const req = mockRequest({ signedVc: {}, stellarTxId: "tx123" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.anchored).toBe(false);
    expect(data.memoMatches).toBe(false);
  });
});