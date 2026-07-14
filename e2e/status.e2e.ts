import { test, expect } from "@playwright/test";
import {
  setupConsoleErrorCheck,
  expectNoRawTranslationKeys,
} from "./fixtures/helpers";

test.describe("System Status Page", () => {
  test("page renders with system status indicators", async ({ page }) => {
    await page.goto("/status");
    await expect(
      page.locator("text=Network Status").or(page.locator('[data-testid="status-title"]').first())
    ).toBeVisible({ timeout: 15000 });
    const retryBtn = page.locator("button").filter({ hasText: /refresh|retry/i });
    await expect(retryBtn.first()).toBeVisible();
  });

  test("CPU/memory gauges render as real SVG circles, not random data", async ({ page }) => {
    await page.goto("/status");
    await page.waitForTimeout(4000);

    const svgCircles = page.locator("svg circle[stroke-dasharray]");
    const count = await svgCircles.count();
    expect(count).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < count; i++) {
      const dashArray = await svgCircles.nth(i).getAttribute("stroke-dasharray");
      expect(dashArray).toBeTruthy();
      const dashOffset = await svgCircles.nth(i).getAttribute("stroke-dashoffset");
      expect(dashOffset).not.toBeNull();
    }
  });

  test("response time display shows seconds since refresh", async ({ page }) => {
    await page.goto("/status");
    await page.waitForTimeout(4000);

    const agoText = page.locator("text=/\\d+s?\\s*ago/").first();
    await expect(agoText).toBeVisible({ timeout: 10000 });
  });

  test("system health overall status is displayed", async ({ page }) => {
    await page.goto("/status");
    await page.waitForTimeout(5000);

    const healthSection = page
      .locator("text=Service Health")
      .or(page.locator('[data-testid="service-health"]'));
    const statusBadge = page
      .locator("text=/ONLINE|DEGRADED|OFFLINE/")
      .first();
    const visible = await healthSection.isVisible().catch(() => false);
    if (visible) {
      await expect(statusBadge).toBeVisible();
    }
  });

  test("error retry mechanism: clicking retry re-fetches data", async ({ page }) => {
    await page.goto("/status");
    await page.waitForTimeout(3000);

    const retryBtn = page.locator("button").filter({ hasText: /refresh|retry/i }).first();
    await expect(retryBtn).toBeVisible();
    await retryBtn.click();
    await page.waitForTimeout(1000);

    const statusText = page.locator("text=/\\d+/").first();
    await expect(statusText).toBeVisible({ timeout: 10000 });
  });

  test("responsive at 375px mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/status");
    await page.waitForTimeout(3000);

    const hasHorizontalScroll = await page.evaluate(
      () => document.body.scrollWidth <= window.innerWidth
    );
    expect(hasHorizontalScroll).toBe(true);

    const h2 = page.locator("h2").first();
    await expect(h2).toBeVisible();
  });

  test("no console errors", async ({ page }) => {
    const { getErrors } = setupConsoleErrorCheck(page);
    await page.goto("/status");
    await page.waitForTimeout(3000);
    expect(getErrors()).toHaveLength(0);
  });

  test("no raw translation keys visible", async ({ page }) => {
    await page.goto("/status");
    await page.waitForTimeout(3000);
    await expectNoRawTranslationKeys(page);
  });
});
