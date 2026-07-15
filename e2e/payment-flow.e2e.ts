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

  test("unauthorized payment completion is rejected", async ({ request }) => {
    const res = await request.post("/api/pi/payment/complete", {
      data: { paymentId: "unauth-pay-456", txid: "some-tx-hash" },
      headers: { "User-Agent": PI_BROWSER_UA },
    });
    expect(res.status()).toBe(401);
  });

  test("payment approval with missing paymentId returns a validation error", async ({ request }) => {
    const authRes = await request.post("/api/auth/pi", {
      data: {
        accessToken: "valid-pi-token-validation-test",
        uid: "payment-user-002",
        username: "validationtester",
      },
      headers: { "User-Agent": PI_BROWSER_UA },
    });
    expect(authRes.ok()).toBe(true);

    const res = await request.post("/api/pi/payment/approve", {
      data: {},
      headers: {
        "User-Agent": PI_BROWSER_UA,
        "Authorization": `Bearer valid-pi-token-validation-test`,
      },
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.code).toBe("VALIDATION_ERROR");
  });

  test("payment completion with missing txid returns a validation error", async ({ request }) => {
    const authRes = await request.post("/api/auth/pi", {
      data: {
        accessToken: "valid-pi-token-validation-test-2",
        uid: "payment-user-003",
        username: "validationtester2",
      },
      headers: { "User-Agent": PI_BROWSER_UA },
    });
    expect(authRes.ok()).toBe(true);

    const res = await request.post("/api/pi/payment/complete", {
      data: { paymentId: "pi-pay-missing-txid" },
      headers: {
        "User-Agent": PI_BROWSER_UA,
        "Authorization": `Bearer valid-pi-token-validation-test-2`,
      },
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.code).toBe("VALIDATION_ERROR");
  });

  test.describe("POST /api/spend-request", () => {
    test("creating a spend request with a missing agentId returns a validation error", async ({ request }) => {
      const authRes = await request.post("/api/auth/pi", {
        data: {
          accessToken: "valid-pi-token-spend-test",
          uid: "payment-user-004",
          username: "spendtester",
        },
        headers: { "User-Agent": PI_BROWSER_UA },
      });
      expect(authRes.ok()).toBe(true);

      const res = await request.post("/api/spend-request", {
        data: {
          amount: 1.5,
          description: "Test agentic spend",
          context: "x".repeat(120),
        },
        headers: {
          "User-Agent": PI_BROWSER_UA,
          "Authorization": `Bearer valid-pi-token-spend-test`,
        },
      });
      expect(res.status()).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("VALIDATION_ERROR");
    });

    test("creating a spend request with an amount exceeding the 500 Pi cap returns a validation error", async ({ request }) => {
      const authRes = await request.post("/api/auth/pi", {
        data: {
          accessToken: "valid-pi-token-spend-cap-test",
          uid: "payment-user-005",
          username: "spendcaptester",
        },
        headers: { "User-Agent": PI_BROWSER_UA },
      });
      expect(authRes.ok()).toBe(true);

      const res = await request.post("/api/spend-request", {
        data: {
          agentId: "00000000-0000-0000-0000-000000000000",
          amount: 501,
          description: "Over-cap spend",
          context: "x".repeat(120),
        },
        headers: {
          "User-Agent": PI_BROWSER_UA,
          "Authorization": `Bearer valid-pi-token-spend-cap-test`,
        },
      });
      expect(res.status()).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("VALIDATION_ERROR");
    });

    test("creating a spend request with a context shorter than 100 characters returns a validation error", async ({ request }) => {
      const authRes = await request.post("/api/auth/pi", {
        data: {
          accessToken: "valid-pi-token-spend-context-test",
          uid: "payment-user-006",
          username: "spendcontexttester",
        },
        headers: { "User-Agent": PI_BROWSER_UA },
      });
      expect(authRes.ok()).toBe(true);

      const res = await request.post("/api/spend-request", {
        data: {
          agentId: "00000000-0000-0000-0000-000000000000",
          amount: 1.5,
          description: "Too-short context",
          context: "short context",
        },
        headers: {
          "User-Agent": PI_BROWSER_UA,
          "Authorization": `Bearer valid-pi-token-spend-context-test`,
        },
      });
      expect(res.status()).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("VALIDATION_ERROR");
    });

    test("unauthenticated spend request creation is rejected", async ({ request }) => {
      const res = await request.post("/api/spend-request", {
        data: {
          agentId: "00000000-0000-0000-0000-000000000000",
          amount: 1.5,
          description: "No auth",
          context: "x".repeat(120),
        },
        headers: { "User-Agent": PI_BROWSER_UA },
      });
      expect(res.status()).toBe(401);
    });
  });
});
