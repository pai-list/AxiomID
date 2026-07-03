import { NextRequest } from "next/server";

// Surgical mocking to avoid interfering with other tests in --runInBand
jest.mock("@/lib/rate-limiter", () => {
  const actual = jest.requireActual("@/lib/rate-limiter");
  return {
    ...actual,
    checkRateLimit: jest.fn().mockResolvedValue({ allowed: true }),
  };
});

jest.mock("@/lib/auth-middleware", () => ({
  requireAuth: jest.fn().mockResolvedValue({ user: { id: "user-1" } }),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: jest.fn(),
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    xpLedger: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    // Include these to be safe, but they shouldn't leak
    skillModeration: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
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

import { POST } from "@/app/api/pi/ads/verify/route";
import { prisma } from "@/lib/prisma";

describe("Ads Verify Security", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PI_API_KEY = "test-key";
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("should detect duplicate claims securely using findFirst", async () => {
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

    expect(prisma.xpLedger.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        reason: "watch_ad",
        reference: {
          contains: `"adId":"${adId}"`,
        },
      }),
    }));
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
    // PI_PAYMENT_FAILED maps to 402
    expect(res.status).toBe(402);

    expect(prisma.xpLedger.findFirst).toHaveBeenCalled();
  });
});
