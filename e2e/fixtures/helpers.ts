import { expect, type Page } from "@playwright/test";

/** Mock wallet context for authenticated state */
export async function mockAuthenticatedUser(page: Page, user?: Partial<{
  piUsername: string;
  walletAddress: string;
  tier: string;
  xp: number;
  trustScore: number;
  kycStatus: string;
  agent: { name: string; status: string } | null;
}>) {
  const defaultUser = {
    piUsername: "testuser",
    walletAddress: "GABCDEF1234567890",
    tier: "Citizen",
    xp: 210,
    trustScore: 21,
    kycStatus: "VERIFIED",
    agent: { name: "TestAgent", status: "ACTIVE" },
    createdAt: "2026-01-01T00:00:00.000Z",
    ...user,
  };

  await page.addInitScript((userData) => {
    localStorage.setItem("axiomid_wallet", `demo:${userData.walletAddress}`);
    localStorage.setItem("pi_access_token", "test-token");
  }, defaultUser);

  await page.route("**/api/auth/pi", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        userId: "test-user-id",
        ...defaultUser,
      }),
    })
  );
}

/** Mock wallet context for unauthenticated state */
export async function mockUnauthenticatedUser(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem("axiomid_wallet");
    localStorage.removeItem("pi_access_token");
  });
  await page.route("**/api/auth/pi", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "Not authenticated" }),
    })
  );
}

/** Mock Pi SDK for browser environment */
export async function mockPiSDK(page: Page, opts?: { isPiBrowser?: boolean }) {
  const isPiBrowser = opts?.isPiBrowser ?? true;
  await page.route("**/pi-sdk.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: "console.log('Mocked Pi SDK script')",
    })
  );
  await page.addInitScript((piBrowser) => {
    type MockPi = {
      init: () => void;
      authenticate: () => Promise<{ user: { uid: string; username: string }; accessToken: string }>;
      createPayment: () => Promise<{ identifier: string }>;
      nativeFeature: {
        openShareDialog: () => Promise<Record<string, unknown>>;
        openConsentDialog: () => Promise<{ accepted: boolean }>;
      };
    };
    if (piBrowser) {
      (window as unknown as { Pi: MockPi }).Pi = {
        init: () => {},
        authenticate: () => Promise.resolve({ user: { uid: "pi-uid-123", username: "piuser" }, accessToken: "sandbox-dev-token-abc-123" }),
        createPayment: () => Promise.resolve({ identifier: "pay-123" }),
        nativeFeature: {
          openShareDialog: () => Promise.resolve({}),
          openConsentDialog: () => Promise.resolve({ accepted: true }),
        },
      };
    } else {
      delete (window as unknown as { Pi?: MockPi }).Pi;
    }
    Object.defineProperty(navigator, "userAgent", {
      value: piBrowser
        ? "Pi Browser/4.0 (iPhone; iOS 16.0; Scale/3.00)"
        : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      configurable: true,
    });
  }, isPiBrowser);
}

/** Route handler to mock API failures */
export async function mockAPIFailure(page: Page, urlPattern: string | RegExp, status: number = 500, message?: string) {
  await page.route(urlPattern, (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ error: message || `Simulated ${status}` }),
    })
  );
}

/** Route handler to mock API success */
export async function mockAPISuccess(page: Page, urlPattern: string | RegExp, body: Record<string, unknown>, status: number = 200) {
  await page.route(urlPattern, (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    })
  );
}

/** Check that no raw i18n keys are visible on the page */
export async function expectNoRawTranslationKeys(page: Page) {
  const body = await page.textContent("body");
  expect(body).not.toContain("translated_");
  expect(body).not.toContain("placeholder_");
  expect(body).not.toContain("_placeholder");
}

/** Check accessibility: no elements violate basic ARIA rules */
export async function checkBasicA11y(page: Page) {
  const issues: string[] = [];

  // Check for missing alt text on images
  const images = await page.locator("img:not([alt])").count();
  if (images > 0) issues.push(`${images} images missing alt text`);

  // Check for empty links
  const emptyLinks = await page.locator("a:not([aria-label]):empty").count();
  if (emptyLinks > 0) issues.push(`${emptyLinks} empty links without aria-label`);

  // Check for buttons without accessible names
  const emptyButtons = await page.locator("button:not([aria-label]):not([title]):empty").count();
  if (emptyButtons > 0) issues.push(`${emptyButtons} buttons without accessible names`);

  // Check for missing lang attribute
  const html = page.locator("html");
  const lang = await html.getAttribute("lang");
  if (!lang) issues.push("Missing lang attribute on <html>");

  return issues;
}

/** Check console for errors */
export function setupConsoleErrorCheck(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    const text = msg.text();
    const isVercelAnalyticsError = text.includes("_vercel/insights") || text.includes("_vercel/speed-insights") || text.includes("speed-insights/script");
    const isFailedResource = text.includes("Failed to load resource");
    if (msg.type() === "error" && !text.includes("WebSocket") && !isVercelAnalyticsError && !isFailedResource) {
      errors.push(text);
    }
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return { getErrors: () => errors };
}

/** Check for failed network requests */
export function setupNetworkErrorCheck(page: Page) {
  const failures: { url: string; status: number }[] = [];
  page.on("requestfailed", (req) => {
    failures.push({ url: req.url(), status: 0 });
  });
  page.on("response", (res) => {
    if (res.status() >= 400 && !res.url().includes("_next")) {
      failures.push({ url: res.url(), status: res.status() });
    }
  });
  return { getFailures: () => failures };
}
