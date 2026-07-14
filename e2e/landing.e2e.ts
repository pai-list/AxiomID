import { test, expect } from "@playwright/test";
import {
  setupConsoleErrorCheck,
  expectNoRawTranslationKeys,
} from "./fixtures/helpers";

test.describe("Landing Page", () => {
  test("hero renders with title and CTA buttons", async ({ page }) => {
    const { getErrors } = setupConsoleErrorCheck(page);
    await page.goto("/");

    await expect(page.locator("h1")).toContainText("Create your");
    await expect(page.locator("h1")).toContainText("AI Identity");

    const claimBtn = page.getByRole("link", { name: /create my ai agent/i });
    await expect(claimBtn).toBeVisible();
    await expect(claimBtn).toHaveAttribute("href", "/claim");

    const docsBtn = page.getByRole("link", { name: /explore the protocol/i });
    await expect(docsBtn).toBeVisible();
    await expect(docsBtn).toHaveAttribute("href", "/docs");

    expect(getErrors()).toHaveLength(0);
  });

  test("animate-slide-up elements exist in DOM", async ({ page }) => {
    await page.goto("/");
    const slideUps = page.locator(".animate-slide-up");
    const count = await slideUps.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test("stats bar renders", async ({ page }) => {
    await page.goto("/");
    const statsBar = page.locator(".grid.grid-cols-3").first();
    await expect(statsBar).toBeVisible();
  });

  test("trust tiers render and expand/collapse on click", async ({ page }) => {
    await page.goto("/");
    const tierList = page.locator('[role="list"]').filter({ hasText: /Visitor/i }).first();
    await expect(tierList).toBeVisible();

    const tierItems = tierList.locator('[role="listitem"]');
    await expect(tierItems).toHaveCount(4);

    const firstTierBtn = tierItems.first().locator("button").first();
    await firstTierBtn.click();
    const expandedPerks = tierItems.first().locator('[role="region"]');
    await expect(expandedPerks).toBeVisible();

    await firstTierBtn.click();
    await expect(expandedPerks).toBeHidden();
  });

  test("footer renders with navigation links", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer.getByRole("link", { name: /privacy/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /terms/i })).toBeVisible();
  });

  test("skip-link is present in DOM", async ({ page }) => {
    await page.goto("/");
    const skipLink = page.locator("a.skip-link");
    await expect(skipLink).toHaveCount(1);
    await expect(skipLink).toHaveAttribute("href", "#main-content");
  });

  test("responsive at 375px mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("responsive at 1440px desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("no console errors on load", async ({ page }) => {
    const { getErrors } = setupConsoleErrorCheck(page);
    await page.goto("/");
    await page.waitForTimeout(2000);
    expect(getErrors()).toHaveLength(0);
  });

  test("no raw translation keys visible", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);
    await expectNoRawTranslationKeys(page);
  });

  test("feature pills render", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("W3C DID", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Zero Permissions", { exact: false }).first()).toBeVisible();
  });

  test("CTA links navigate to /claim and /docs", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /create my ai agent/i }).click();
    await expect(page).toHaveURL(/\/claim/);

    await page.goto("/");
    await page.getByRole("link", { name: /explore the protocol/i }).click();
    await expect(page).toHaveURL(/\/docs/);
  });
});
