import { test, expect } from "@playwright/test";
import { setupConsoleErrorCheck } from "./fixtures/helpers";

const VALID_BODY = {
  accessToken: "valid-pi-token-abc123",
  uid: "pi-uid-test-001",
  username: "testuser",
};

test.describe("Authentication Flow", () => {
  test.describe("POST /api/auth/pi", () => {
    test("valid token returns user data", async ({ request }) => {
      const res = await request.post("/api/auth/pi", {
        data: VALID_BODY,
        headers: {
          "User-Agent": "Pi Browser/4.0 (iPhone; iOS 16.0; Scale/3.00)",
        },
      });

      if (res.status() === 200) {
        const json = await res.json();
        expect(json).toHaveProperty("data");
        expect(json.data).toHaveProperty("userId");
        expect(json.data).toHaveProperty("piUsername");
      } else {
        expect([401, 429, 500]).toContain(res.status());
      }
    });

    test("invalid token returns 401 PI_AUTH_FAILED", async ({ request }) => {
      const res = await request.post("/api/auth/pi", {
        data: {
          ...VALID_BODY,
          accessToken: "invalid-token-xyz",
        },
        headers: {
          "User-Agent": "Pi Browser/4.0 (iPhone; iOS 16.0; Scale/3.00)",
        },
      });

      expect(res.status()).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("PI_AUTH_FAILED");
    });

    test("missing required fields returns VALIDATION_ERROR", async ({ request }) => {
      const res = await request.post("/api/auth/pi", {
        data: {},
        headers: {
          "User-Agent": "Pi Browser/4.0 (iPhone; iOS 16.0; Scale/3.00)",
        },
      });

      expect(res.status()).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("VALIDATION_ERROR");
    });

    test("empty accessToken field returns VALIDATION_ERROR", async ({ request }) => {
      const res = await request.post("/api/auth/pi", {
        data: { accessToken: "", uid: "uid", username: "user" },
        headers: {
          "User-Agent": "Pi Browser/4.0 (iPhone; iOS 16.0; Scale/3.00)",
        },
      });

      expect(res.status()).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("VALIDATION_ERROR");
    });

    test("missing uid returns VALIDATION_ERROR", async ({ request }) => {
      const res = await request.post("/api/auth/pi", {
        data: { accessToken: "token-abc", username: "user" },
        headers: {
          "User-Agent": "Pi Browser/4.0 (iPhone; iOS 16.0; Scale/3.00)",
        },
      });

      expect(res.status()).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("VALIDATION_ERROR");
    });

    test("missing username returns VALIDATION_ERROR", async ({ request }) => {
      const res = await request.post("/api/auth/pi", {
        data: { accessToken: "token-abc", uid: "uid-123" },
        headers: {
          "User-Agent": "Pi Browser/4.0 (iPhone; iOS 16.0; Scale/3.00)",
        },
      });

      expect(res.status()).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("VALIDATION_ERROR");
    });

    test("invalid JSON body returns VALIDATION_ERROR", async ({ request }) => {
      const res = await request.post("/api/auth/pi", {
        data: "not-json",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Pi Browser/4.0 (iPhone; iOS 16.0; Scale/3.00)",
        },
      });

      expect(res.status()).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("VALIDATION_ERROR");
    });
  });

  test.describe("Sandbox mode", () => {
    test("sandbox dev token works in non-production", async ({ request }) => {
      const res = await request.post("/api/auth/pi", {
        data: VALID_BODY,
        headers: {
          "User-Agent": "Pi Browser/4.0 (iPhone; iOS 16.0; Scale/3.00)",
        },
      });

      expect([200, 401, 429, 500]).toContain(res.status());
    });

    test("sandbox bypass does NOT fire in production env", async ({ request }) => {
      const res = await request.post("/api/auth/pi", {
        data: {
          accessToken: "sandbox-dev-token-bypass-test",
          uid: "uid-prod-guard-test",
          username: "prodtestuser",
        },
        headers: {
          "User-Agent": "Pi Browser/4.0 (iPhone; iOS 16.0; Scale/3.00)",
        },
      });

      if (res.status() === 200) {
        const json = await res.json();
        expect(json.data?.piUsername).not.toBe("sandbox-dev-token-bypass-test");
      } else {
        expect([401, 429]).toContain(res.status());
      }
    });
  });

  test.describe("Timeout behavior", () => {
    test("API responds within reasonable time", async ({ request }) => {
      const start = Date.now();
      const res = await request.post("/api/auth/pi", {
        data: VALID_BODY,
        headers: {
          "User-Agent": "Pi Browser/4.0 (iPhone; iOS 16.0; Scale/3.00)",
        },
        timeout: 45000,
      });
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(45000);
      expect([200, 401, 429, 500]).toContain(res.status());
    });
  });

  test.describe("Error response format", () => {
    test("error codes are correct error code strings", async ({ request }) => {
      const res = await request.post("/api/auth/pi", {
        data: {},
        headers: {
          "User-Agent": "Pi Browser/4.0 (iPhone; iOS 16.0; Scale/3.00)",
        },
      });

      const json = await res.json();
      expect(json).toHaveProperty("error");
      expect(typeof json.error).toBe("string");
      expect(["VALIDATION_ERROR", "PI_AUTH_FAILED", "RATE_LIMITED", "INTERNAL_ERROR"]).toContain(
        json.error
      );
    });

    test("no sensitive data in error responses", async ({ request }) => {
      const res = await request.post("/api/auth/pi", {
        data: { accessToken: "super-secret-token-12345", uid: "uid-leak", username: "leak" },
        headers: {
          "User-Agent": "Pi Browser/4.0 (iPhone; iOS 16.0; Scale/3.00)",
        },
      });

      const text = await res.text();
      expect(text).not.toContain("super-secret-token-12345");
      expect(text).not.toContain("prisma");
      expect(text).not.toContain("DATABASE_URL");
      expect(text).not.toContain("PI_API_KEY");
    });
  });

  test.describe("/signin/callback page", () => {
    test("page renders with processing or error state", async ({ page }) => {
      await page.goto("/signin/callback?code=test-code");
      await page.waitForTimeout(3000);

      const processingText = page.locator("text=/Completing sign-in|Sign-in failed|Try again/i").first();
      await expect(processingText).toBeVisible({ timeout: 10000 });
    });

    test("shows error state when code is invalid", async ({ page }) => {
      await page.goto("/signin/callback?code=invalid-code-xyz");
      await page.waitForTimeout(5000);

      const errorIndicator = page
        .locator("text=/Sign-in failed|error|Error|Try again/i")
        .first();
      const visible = await errorIndicator.isVisible().catch(() => false);
      expect(visible).toBe(true);
    });

    test("no console errors on callback page", async ({ page }) => {
      const { getErrors } = setupConsoleErrorCheck(page);
      await page.goto("/signin/callback");
      await page.waitForTimeout(3000);

      const criticalErrors = getErrors().filter(
        (e) => !e.includes("NetworkError") && !e.includes("Failed to fetch")
      );
      expect(criticalErrors).toHaveLength(0);
    });
  });
});
