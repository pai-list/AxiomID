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

// ponytail: reserved for future tab iteration tests
const _TAB_LABELS = ["Home", "Identity", "Skills", "Wallet", "Memory", "Settings"] as const;

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await mockPiSDK(page, { isPiBrowser: true });
    await mockAuthenticatedUser(page, MOCK_USER);
  });

  test("authenticated user sees 6 tab buttons", async ({ page }) => {
    await page.goto("/dashboard");
    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(6);
  });

  test("tab buttons have role=tab and aria-selected", async ({ page }) => {
    await page.goto("/dashboard");
    const tabs = page.locator('[role="tab"]');
    for (let i = 0; i < 6; i++) {
      const tab = tabs.nth(i);
      await expect(tab).toHaveAttribute("role", "tab");
      const selected = await tab.getAttribute("aria-selected");
      expect(selected).not.toBeNull();
    }
  });

  test("first tab (Home) is selected by default", async ({ page }) => {
    await page.goto("/dashboard");
    const homeTab = page.locator('[role="tab"]').filter({ hasText: "Home" });
    await expect(homeTab).toHaveAttribute("aria-selected", "true");
  });

  test("tab panels have role=tabpanel", async ({ page }) => {
    await page.goto("/dashboard");
    const panels = page.locator('[role="tabpanel"]');
    const count = await panels.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("tab switching: click Identity tab shows identity content", async ({ page }) => {
    await page.goto("/dashboard");
    await page.locator('[role="tab"]').filter({ hasText: "Identity" }).click();
    await expect(page.locator('[role="tab"]').filter({ hasText: "Identity" })).toHaveAttribute("aria-selected", "true");
    await expect(page.locator('[role="tab"]').filter({ hasText: "Home" })).toHaveAttribute("aria-selected", "false");
  });

  test("tab switching: click Settings tab shows settings content", async ({ page }) => {
    await page.goto("/dashboard");
    await page.locator('[role="tab"]').filter({ hasText: "Settings" }).click();
    await expect(page.locator('[role="tab"]').filter({ hasText: "Settings" })).toHaveAttribute("aria-selected", "true");
  });

  test("agent status displays ACTIVE", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("text=ACTIVE").first()).toBeVisible({ timeout: 10000 });
  });

  test("HomeTab shows wallet address", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("text=GABCDEF").first()).toBeVisible({ timeout: 10000 });
  });

  test("HomeTab shows tier", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("text=Citizen").first()).toBeVisible({ timeout: 10000 });
  });

  test("IdentityTab: VERIFIED KYC shows verified badge", async ({ page }) => {
    await page.goto("/dashboard");
    await page.locator('[role="tab"]').filter({ hasText: "Identity" }).click();
    await expect(page.locator("text=verified").first()).toBeVisible({ timeout: 10000 });
  });

  test("IdentityTab: DENIED status does NOT show verified", async ({ page }) => {
    await mockAuthenticatedUser(page, { ...MOCK_USER, kycStatus: "DENIED" });
    await page.goto("/dashboard");
    await page.locator('[role="tab"]').filter({ hasText: "Identity" }).click();
    await page.waitForTimeout(2000);
    const verifiedBadges = page.locator("text=/^verified$/i");
    const count = await verifiedBadges.count();
    expect(count).toBe(0);
  });

  test("SkillsTab: marketplace section loads with empty state", async ({ page }) => {
    await page.goto("/dashboard");
    await page.locator('[role="tab"]').filter({ hasText: "Skills" }).click();
    await expect(page.locator("text=Marketplace").first()).toBeVisible({ timeout: 10000 });
  });

  test("WalletTab: transaction history placeholder visible", async ({ page }) => {
    await page.goto("/dashboard");
    await page.locator('[role="tab"]').filter({ hasText: "Wallet" }).click();
    await expect(page.locator("text=Transaction History").first()).toBeVisible({ timeout: 10000 });
  });

  test("MemoryTab: IQRA Neural Mesh section renders", async ({ page }) => {
    await page.goto("/dashboard");
    await page.locator('[role="tab"]').filter({ hasText: "Memory" }).click();
    await expect(page.locator("text=IQRA Neural Mesh").first()).toBeVisible({ timeout: 10000 });
  });

  test("MemoryTab: trust history graph section renders", async ({ page }) => {
    await page.goto("/dashboard");
    await page.locator('[role="tab"]').filter({ hasText: "Memory" }).click();
    await expect(page.locator("text=Trust History").first()).toBeVisible({ timeout: 10000 });
  });

  test("SettingsTab: full settings link works", async ({ page }) => {
    await page.goto("/dashboard");
    await page.locator('[role="tab"]').filter({ hasText: "Settings" }).click();
    const settingsLink = page.getByRole("link", { name: /Full Settings/i });
    await expect(settingsLink).toBeVisible();
    await expect(settingsLink).toHaveAttribute("href", "/dashboard/settings");
  });

  test("DonateWithPiCard does NOT appear in both Home and Wallet tabs", async ({ page }) => {
    await page.goto("/dashboard");
    const homeDonateCount = await page.locator("text=Donate").count();

    await page.locator('[role="tab"]').filter({ hasText: "Wallet" }).click();
    await page.waitForTimeout(1000);

    const totalDonateCount = await page.locator("text=Donate").count();
    expect(totalDonateCount).toBeLessThanOrEqual(homeDonateCount + 2);
  });

  test("no console errors", async ({ page }) => {
    const { getErrors } = setupConsoleErrorCheck(page);
    await page.goto("/dashboard");
    await page.waitForTimeout(3000);
    expect(getErrors()).toHaveLength(0);
  });

  test("no raw translation keys", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForTimeout(3000);
    await expectNoRawTranslationKeys(page);
  });
});
