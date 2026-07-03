import { POST } from "@/app/api/pi/ads/verify/route";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    xpLedger: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    skillModeration: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    skill: {
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock("@/lib/auth-middleware", () => ({
  requireAuth: jest.fn().mockResolvedValue({ user: { id: "user-1" } }),
}));

jest.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true }),
  RATE_LIMITS: { payment: {} },
}));

jest.mock("@/lib/ip", () => ({
  getClientIp: jest.fn().mockReturnValue("127.0.0.1"),
}));

describe("Ads Verify Security", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PI_API_KEY = "test-key";
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("should detect duplicate claims using findFirst", async () => {
    const adId = "some-ad-id";
    (prisma.xpLedger.findFirst as jest.Mock).mockResolvedValue({ id: "ledger-1" });

    const req = new NextRequest("http://localhost/api/pi/ads/verify", {
      method: "POST",
      body: JSON.stringify({ adId }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.code).toBe("CONFLICT");

    expect(prisma.xpLedger.findFirst).toHaveBeenCalledWith({
      where: {
        reason: "watch_ad",
        reference: {
          contains: `"adId":"${adId}"`,
        },
      },
      select: { id: true },
    });
  });

  it("should proceed when no duplicate is found and fail on Pi API error", async () => {
    const adId = "new-ad-id";
    (prisma.xpLedger.findFirst as jest.Mock).mockResolvedValue(null);

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }) as jest.Mock;

    const req = new NextRequest("http://localhost/api/pi/ads/verify", {
      method: "POST",
      body: JSON.stringify({ adId }),
    });

    const res = await POST(req);
    // PI_PAYMENT_FAILED maps to 402 in src/lib/errors.ts
    expect(res.status).toBe(402);

    expect(prisma.xpLedger.findFirst).toHaveBeenCalled();
  });
});
