import { test, expect } from "@playwright/test";
import {
  mockAuthenticatedUser,
  mockPiSDK,
  setupConsoleErrorCheck,
  expectNoRawTranslationKeys,
} from "./fixtures/helpers";

const MOCK_USER = {
  piUsername: "testuser",
  walletAddress: "GABCDEF1234567890",
  tier: "Citizen",
  xp: 210,
  trustScore: 21,
  kycStatus: "VERIFIED",
  agent: { name: "TestAgent", status: "ACTIVE" },
  createdAt: "2026-01-01T00:00:00.000Z",
};

test.describe("Dashboard Settings", () => {
  test.beforeEach(async ({ page }) => {
    await mockPiSDK(page, { isPiBrowser: true });
    await mockAuthenticatedUser(page, MOCK_USER);
  });

  test("page renders with settings sidebar tabs", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page.locator("text=Profile").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Accounts").first()).toBeVisible();
    await expect(page.locator("text=Ledger").first()).toBeVisible();
    await expect(page.locator("text=Settings").first()).toBeVisible();
  });

  test("profile tab shows user info by default", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page.locator("text=testuser").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=GABCDEF").first()).toBeVisible();
  });

  test("settings sidebar tab shows export data section", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.locator("button").filter({ hasText: "Settings" }).first().click();
    await expect(page.locator("text=Export Data").first()).toBeVisible({ timeout: 10000 });
  });

  test("export data button is present and clickable", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.locator("button").filter({ hasText: "Settings" }).first().click();
    const exportBtn = page.locator("button").filter({ hasText: /export/i }).first();
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toBeEnabled();
  });

  test("danger zone section is present", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.locator("button").filter({ hasText: "Settings" }).first().click();
    await expect(page.locator("text=Danger Zone").first()).toBeVisible({ timeout: 10000 });
  });

  test("back navigation link to /dashboard", async ({ page }) => {
    await page.goto("/dashboard/settings");
    const backLink = page.locator('a[href="/dashboard"]').first();
    await expect(backLink).toBeVisible();
    await expect(backLink).toBeEnabled();
  });

  test("back link navigates to /dashboard", async ({ page }) => {
    await page.goto("/dashboard/settings");
    const backLink = page.locator('a[href="/dashboard"]').first();
    await backLink.click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10000 });
  });

  test("sidebar tab switching: accounts tab shows linked accounts", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.locator("button").filter({ hasText: "Accounts" }).first().click();
    await expect(page.locator("text=Wallet Connection").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Security Circle").first()).toBeVisible();
    await expect(page.locator("text=KYC Verification").first()).toBeVisible();
  });

  test("sidebar tab switching: ledger tab shows XP ledger", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.locator("button").filter({ hasText: "Ledger" }).first().click();
    await expect(page.locator("text=XP Ledger").first()).toBeVisible({ timeout: 10000 });
  });

  test("XP progression section visible on profile tab", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page.locator("text=210").first()).toBeVisible({ timeout: 10000 });
  });

  test("identity status badge renders for verified user", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page.locator("text=Verified Human").first()).toBeVisible({ timeout: 10000 });
  });

  test("responsive at mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard/settings");
    await expect(page.locator("text=testuser").first()).toBeVisible({ timeout: 10000 });
  });

  test("no console errors", async ({ page }) => {
    const { getErrors } = setupConsoleErrorCheck(page);
    await page.goto("/dashboard/settings");
    await page.waitForTimeout(3000);
    expect(getErrors()).toHaveLength(0);
  });

  test("no raw translation keys", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForTimeout(3000);
    await expectNoRawTranslationKeys(page);
  });
});
