import { test, expect } from "@playwright/test";
import {
  mockAPISuccess,
  mockAPIFailure,
  setupConsoleErrorCheck,
  expectNoRawTranslationKeys,
} from "./fixtures/helpers";

const PASSPORT_SLUG = "test-user-123";

const PASSPORT_DATA = {
  username: "testuser",
  walletAddress: "GABCDEF1234567890",
  did: "did:axiom:test-user-123",
  tier: "Citizen",
  xp: 210,
  trustScore: 21,
  kyaStatus: "verified",
  kycStatus: "verified",
  issuedDate: "2026-01-15T00:00:00.000Z",
  agentName: "TestAgent",
  agentStatus: "ACTIVE",
};

test.describe("Passport Viewer", () => {
  test("valid passport renders identity info", async ({ page }) => {
    await mockAPISuccess(page, `**/api/passport/${PASSPORT_SLUG}`, PASSPORT_DATA);
    await page.goto(`/passport/${PASSPORT_SLUG}`);

    await expect(page.locator("text=Citizen").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=TestAgent").first()).toBeVisible();
  });

  test("loading state shows loading identity message", async ({ page }) => {
    await page.route(`**/api/passport/${PASSPORT_SLUG}`, () =>
      new Promise(() => {})
    );
    await page.goto(`/passport/${PASSPORT_SLUG}`);

    await expect(page.locator("text=Loading Identity...").first()).toBeVisible({ timeout: 5000 });
  });

  test("building state shows progress with status messages", async ({ page }) => {
    await mockAPISuccess(page, `**/api/passport/${PASSPORT_SLUG}`, {
      ...PASSPORT_DATA,
      jobStatus: "PROVISIONING",
    });
    await page.goto(`/passport/${PASSPORT_SLUG}`);

    await expect(page.locator("text=Preparing your AI...").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Reserving Domain").first()).toBeVisible();
    await expect(page.locator("text=Provisioning Identity Engine").first()).toBeVisible();
  });

  test("error state for non-existent passport", async ({ page }) => {
    await mockAPIFailure(page, `**/api/passport/${PASSPORT_SLUG}`, 404, "Passport not found");
    await page.goto(`/passport/${PASSPORT_SLUG}`);

    await expect(page.locator("text=passport_not_found").first()).toBeVisible({ timeout: 10000 });
  });

  test("no raw translation keys", async ({ page }) => {
    await mockAPISuccess(page, `**/api/passport/${PASSPORT_SLUG}`, PASSPORT_DATA);
    await page.goto(`/passport/${PASSPORT_SLUG}`);
    await page.waitForTimeout(3000);
    await expectNoRawTranslationKeys(page);
  });

  test("share button exists", async ({ page }) => {
    await mockAPISuccess(page, `**/api/passport/${PASSPORT_SLUG}`, PASSPORT_DATA);
    await page.goto(`/passport/${PASSPORT_SLUG}`);

    await expect(page.locator("text=share_passport").first()).toBeVisible({ timeout: 10000 });
  });

  test("OG meta tags present", async ({ page }) => {
    await mockAPISuccess(page, `**/api/passport/${PASSPORT_SLUG}`, PASSPORT_DATA);
    await page.goto(`/passport/${PASSPORT_SLUG}`);

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    expect(ogTitle).toContain("Passport");

    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute("content");
    expect(ogDescription).toBeTruthy();

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(ogImage).toContain("/api/og/passport");
  });

  test("responsive at mobile viewport", async ({ page }) => {
    await mockAPISuccess(page, `**/api/passport/${PASSPORT_SLUG}`, PASSPORT_DATA);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/passport/${PASSPORT_SLUG}`);

    await expect(page.locator("text=Citizen").first()).toBeVisible({ timeout: 10000 });
  });

  test("no console errors", async ({ page }) => {
    const { getErrors } = setupConsoleErrorCheck(page);
    await mockAPISuccess(page, `**/api/passport/${PASSPORT_SLUG}`, PASSPORT_DATA);
    await page.goto(`/passport/${PASSPORT_SLUG}`);
    await page.waitForTimeout(2000);
    expect(getErrors()).toHaveLength(0);
  });
});
