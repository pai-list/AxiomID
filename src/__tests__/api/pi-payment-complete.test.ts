/**
 * @jest-environment node
 */
import { POST } from "@/app/api/pi/payment/complete/route";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { NextRequest } from "next/server";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    piPayment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    xpLedger: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

jest.mock("@/lib/auth-middleware", () => ({
  requireAuth: jest.fn(),
}));

jest.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true }),
  RATE_LIMITS: { payment: {} },
}));

jest.mock("@/lib/ip", () => ({ getClientIp: jest.fn() }));
jest.mock("@/lib/logger", () => ({ logger: { error: jest.fn(), warn: jest.fn() } }));

describe("POST /api/pi/payment/complete", () => {
  const mockUser = { id: "user-1", xp: 100, tier: "Visitor", piUid: "uid-1" };
  const mockPaymentId = "pay-123";
  const mockTxid = "tx-456";

  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockResolvedValue({ error: null, user: mockUser });
    process.env.PI_API_KEY = "test-key";
  });

  it("returns 404 if payment record not found", async () => {
    (prisma.piPayment.findUnique as jest.Mock).mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/pi/payment/complete", {
      method: "POST",
      body: JSON.stringify({ paymentId: mockPaymentId, txid: mockTxid }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("returns 403 if payment belongs to another user", async () => {
    (prisma.piPayment.findUnique as jest.Mock).mockResolvedValue({ userId: "other-user" });
    const req = new NextRequest("http://localhost/api/pi/payment/complete", {
      method: "POST",
      body: JSON.stringify({ paymentId: mockPaymentId, txid: mockTxid }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("completes payment and awards XP", async () => {
    (prisma.piPayment.findUnique as jest.Mock).mockResolvedValue({
      id: "p1",
      paymentId: mockPaymentId,
      userId: mockUser.id,
      amount: 10,
      status: "ESCROWED",
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    const req = new NextRequest("http://localhost/api/pi/payment/complete", {
      method: "POST",
      body: JSON.stringify({ paymentId: mockPaymentId, txid: mockTxid }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("completed");
    expect(prisma.piPayment.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { paymentId: mockPaymentId },
      data: { status: "RELEASED", txid: mockTxid }
    }));
    expect(prisma.xpLedger.create).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: mockUser.id },
      data: expect.objectContaining({ kycStatus: "VERIFIED" })
    }));
  });

  it("returns success immediately if already RELEASED", async () => {
    (prisma.piPayment.findUnique as jest.Mock).mockResolvedValue({
      paymentId: mockPaymentId,
      userId: mockUser.id,
      status: "RELEASED",
      txid: "existing-tx",
    });

    const req = new NextRequest("http://localhost/api/pi/payment/complete", {
      method: "POST",
      body: JSON.stringify({ paymentId: mockPaymentId, txid: mockTxid }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
