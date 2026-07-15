import { test, expect } from "@playwright/test";

test.describe("Pi Payment Flow", () => {
  const PI_BROWSER_UA = "Pi Browser/4.0 (iPhone; iOS 16.0; Scale/3.00)";

  test("full payment lifecycle (create -> approve -> complete)", async ({ request }) => {
    // 1. Authenticate to get a valid session
    const authRes = await request.post("/api/auth/pi", {
      data: {
        accessToken: "valid-pi-token-payment-test",
        uid: "payment-user-001",
        username: "paytester",
      },
      headers: { "User-Agent": PI_BROWSER_UA },
    });
    expect(authRes.ok()).toBe(true);
    const authData = await authRes.json();
    expect(authData.data).toHaveProperty("userId");

    // 2. Create a spend request (simulating agent)
    const createRes = await request.post("/api/spend/request", {
      data: {
        amount: 1.5,
        description: "Test agentic spend",
        context: "Testing E2E flow",
      },
      headers: { 
        "User-Agent": PI_BROWSER_UA,
        "Authorization": `Bearer valid-pi-token-payment-test`
      },
    });
    expect(createRes.ok()).toBe(true);
    const spendData = await createRes.json();
    expect(spendData.data).toHaveProperty("id");

    // 3. Approve payment (Client-side would call this after Pi SDK success)
    const paymentId = `pi-pay-${Date.now()}`;
    const approveRes = await request.post("/api/pi/payment/approve", {
      data: { paymentId },
      headers: { 
        "User-Agent": PI_BROWSER_UA,
        "Authorization": `Bearer valid-pi-token-payment-test`
      },
    });
    // We expect 200 OK for a successful approval initiation
    expect(approveRes.status()).toBe(200);

    // 4. Complete payment
    const completeRes = await request.post("/api/pi/payment/complete", {
      data: { paymentId, txid: "stellar-tx-hash-123" },
      headers: { 
        "User-Agent": PI_BROWSER_UA,
        "Authorization": `Bearer valid-pi-token-payment-test`
      },
    });
    // We expect 200 OK for a successful completion
    expect(completeRes.status()).toBe(200);
  });

  test("unauthorized payment approval is rejected", async ({ request }) => {
    const res = await request.post("/api/pi/payment/approve", {
      data: { paymentId: "unauth-pay-123" },
      headers: { "User-Agent": PI_BROWSER_UA },
    });
    expect(res.status()).toBe(401);
  });
});
