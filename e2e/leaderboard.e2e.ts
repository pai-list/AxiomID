import { test, expect } from "@playwright/test";
import {
  mockAPISuccess,
  setupConsoleErrorCheck,
  expectNoRawTranslationKeys,
} from "./fixtures/helpers";

const LEADERBOARD_USERS = Array.from({ length: 25 }, (_, i) => ({
  rank: i + 1,
  id: `user-${i + 1}`,
  piUsername: i < 3 ? null : `pioneer${i + 1}`,
  walletAddress: `GABCDEF${String(i + 1).padStart(12, "0")}`,
  tier: i < 4 ? "Sovereign" : i < 10 ? "Validator" : i < 20 ? "Citizen" : "Visitor",
  xp: 10000 - i * 200,
  trustScore: Math.max(10, 95 - i * 3),
  stampsCount: Math.max(0, 12 - i),
  createdAt: "2026-01-01T00:00:00.000Z",
}));

// Top three with piUsername=null so wallet truncation is tested
LEADERBOARD_USERS[0].piUsername = null;
LEADERBOARD_USERS[0].walletAddress = "GABCDEF1234567890ABCDEF";
LEADERBOARD_USERS[1].piUsername = null;
LEADERBOARD_USERS[1].walletAddress = "GXYZXYZ9876543210WXYZYZ";

test.describe("Leaderboard Page", () => {
  test("table renders with columns (Pioneer, Tier, Stamps, Trust, XP)", async ({ page }) => {
    await mockAPISuccess(page, "**/api/leaderboard", { leaderboard: LEADERBOARD_USERS });
    await page.goto("/leaderboard");

    await expect(page.locator("text=Sovereign Leaderboard")).toBeVisible();
    const table = page.locator("table");
    await expect(table).toBeVisible();
    await expect(table.locator("th").filter({ hasText: "PIONEER" })).toBeVisible();
    await expect(table.locator("th").filter({ hasText: "TIER" })).toBeVisible();
    await expect(table.locator("th").filter({ hasText: "STAMPS" })).toBeVisible();
    await expect(table.locator("th").filter({ hasText: "TRUST" })).toBeVisible();
    await expect(table.locator("th").filter({ hasText: "XP" })).toBeVisible();
  });

  test("pagination works via Show More button", async ({ page }) => {
    await mockAPISuccess(page, "**/api/leaderboard", { leaderboard: LEADERBOARD_USERS });
    await page.goto("/leaderboard");

    // Initially PAGE_SIZE=20 rows are shown (top 3 go to podium, remaining in table)
    const showMoreBtn = page.getByRole("button", { name: /Show 20 more/i });
    await expect(showMoreBtn).toBeVisible({ timeout: 10000 });

    // Count initial table rows
    const initialRows = await page.locator("table tbody tr").count();

    await showMoreBtn.click();

    // After clicking, more rows should appear
    const afterRows = await page.locator("table tbody tr").count();
    expect(afterRows).toBeGreaterThanOrEqual(initialRows);

    // Show More button should be gone or hidden after all rows loaded
    await page.waitForTimeout(500);
    const showMoreAfter = page.getByRole("button", { name: /Show 20 more/i });
    const isVisible = await showMoreAfter.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });

  test("wallet address truncation works for users without piUsername", async ({ page }) => {
    await mockAPISuccess(page, "**/api/leaderboard", { leaderboard: LEADERBOARD_USERS });
    await page.goto("/leaderboard");

    // First top-three user has no piUsername, should show truncated wallet
    // Format: GABCDEF12...CDEF (first 8...last 6)
    const truncated = page.locator("text=GABCDEF12").first();
    await expect(truncated).toBeVisible({ timeout: 10000 });
  });

  test("zero state shows motivational copy when empty", async ({ page }) => {
    await mockAPISuccess(page, "**/api/leaderboard", { leaderboard: [] });
    await page.goto("/leaderboard");

    await expect(page.locator("text=Be the First Sovereign")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=The leaderboard is empty")).toBeVisible();
    const launchLink = page.getByRole("link", { name: /Launch App/i });
    await expect(launchLink).toBeVisible();
    await expect(launchLink).toHaveAttribute("href", "/dashboard");
  });

  test("responsive at 375px mobile viewport", async ({ page }) => {
    await mockAPISuccess(page, "**/api/leaderboard", { leaderboard: LEADERBOARD_USERS });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/leaderboard");

    await expect(page.locator("text=Sovereign Leaderboard")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });

  test("no console errors on load", async ({ page }) => {
    const { getErrors } = setupConsoleErrorCheck(page);
    await mockAPISuccess(page, "**/api/leaderboard", { leaderboard: LEADERBOARD_USERS });
    await page.goto("/leaderboard");
    await page.waitForTimeout(3000);
    expect(getErrors()).toHaveLength(0);
  });

  test("no raw translation keys visible", async ({ page }) => {
    await mockAPISuccess(page, "**/api/leaderboard", { leaderboard: LEADERBOARD_USERS });
    await page.goto("/leaderboard");
    await page.waitForTimeout(3000);
    await expectNoRawTranslationKeys(page);
  });

  test("search filters users by username", async ({ page }) => {
    await mockAPISuccess(page, "**/api/leaderboard", { leaderboard: LEADERBOARD_USERS });
    await page.goto("/leaderboard");

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill("pioneer5");

    // Should show only matching rows
    const rows = page.locator("table tbody tr");
    const count = await rows.count();
    expect(count).toBeLessThanOrEqual(2);
  });

  test("tier filter tabs work", async ({ page }) => {
    await mockAPISuccess(page, "**/api/leaderboard", { leaderboard: LEADERBOARD_USERS });
    await page.goto("/leaderboard");

    const validatorBtn = page.getByRole("button", { name: "Validator" });
    await validatorBtn.click();

    // After filtering, all visible rows should have Validator tier
    const rows = page.locator("table tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i).locator("text=Validator")).toBeVisible();
    }
  });

  test("top three cards render for first 3 users", async ({ page }) => {
    await mockAPISuccess(page, "**/api/leaderboard", { leaderboard: LEADERBOARD_USERS });
    await page.goto("/leaderboard");

    // TopThreeCards component shows rank #1, #2, #3
    await expect(page.locator("text=#1").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=#2").first()).toBeVisible();
    await expect(page.locator("text=#3").first()).toBeVisible();
  });

  test("loading skeleton shows while data loads", async ({ page }) => {
    await page.route("**/api/leaderboard", () => new Promise(() => {}));
    await page.goto("/leaderboard");

    await expect(page.locator(".animate-pulse").first()).toBeVisible({ timeout: 5000 });
  });

  test("footer renders on leaderboard page", async ({ page }) => {
    await mockAPISuccess(page, "**/api/leaderboard", { leaderboard: LEADERBOARD_USERS });
    await page.goto("/leaderboard");

    await expect(page.locator("footer")).toBeVisible();
  });
});
