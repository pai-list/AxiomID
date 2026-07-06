import { test, expect } from "@playwright/test";
import {
  mockPiSDK,
  setupConsoleErrorCheck,
  expectNoRawTranslationKeys,
} from "./fixtures/helpers";

test.describe("Claim Flow", () => {
  test.beforeEach(async ({ page }) => {
    await mockPiSDK(page, { isPiBrowser: false });
  });

  test("step 1 shows connect button and Pi Browser warning for non-Pi", async ({ page }) => {
    await page.goto("/claim");
    await expect(page.getByRole("heading", { name: /connect wallet/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /connect pi wallet/i })).toBeVisible();
    await expect(page.locator("text=Pi Browser Required").first()).toBeVisible();
  });

  test("step 1 in Pi Browser hides warning", async ({ page }) => {
    await mockPiSDK(page, { isPiBrowser: true });
    await page.goto("/claim");
    await expect(page.getByRole("heading", { name: /connect wallet/i })).toBeVisible();
    await expect(page.locator("text=Pi Browser Required").first()).toBeHidden();
  });

  test("progress bar has accessible progress indicator", async ({ page }) => {
    await page.goto("/claim");
    const progressText = page.locator("text=/\\d+% Complete/");
    await expect(progressText).toBeVisible();
    await expect(progressText).toContainText("33%");
  });

  test("step 1 back button exists but is disabled", async ({ page }) => {
    await page.goto("/claim");
    const backBtn = page.getByRole("button", { name: /back/i });
    await expect(backBtn).toBeVisible();
    await expect(backBtn).toBeDisabled();
  });

  test("Pi Browser modal has role=dialog and can be closed", async ({ page }) => {
    await page.goto("/claim");
    await page.getByRole("button", { name: /connect pi wallet/i }).click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("text=Pi Browser Required")).toBeVisible();

    await dialog.getByRole("button", { name: /got it/i }).click();
    await expect(dialog).toBeHidden();
  });

  test("step 2 verify button appears after connecting", async ({ page }) => {
    await mockPiSDK(page, { isPiBrowser: true });
    await page.goto("/claim");

    await page.getByRole("button", { name: /connect pi wallet/i }).click();
    await expect(page.locator("text=Connected").first()).toBeVisible({ timeout: 10000 });

    const continueBtn = page.getByRole("button", { name: /continue/i });
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    await expect(page.getByRole("heading", { name: /know your agent/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /start verification/i })).toBeVisible();
  });

  test("step 2 shows loading spinner during verification", async ({ page }) => {
    await mockPiSDK(page, { isPiBrowser: true });
    await page.route("**/api/pi/kya/verify", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ kycStatus: "VERIFIED", computedTrustScore: 42 }),
      })
    );
    await page.goto("/claim");

    await page.getByRole("button", { name: /connect pi wallet/i }).click();
    await expect(page.locator("text=Connected").first()).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByRole("heading", { name: /know your agent/i })).toBeVisible();

    await page.getByRole("button", { name: /start verification/i }).click();
    await expect(page.getByRole("button", { name: /verifying/i })).toBeVisible();
  });

  test("step 3 activate agent button renders", async ({ page }) => {
    await mockPiSDK(page, { isPiBrowser: true });
    await page.route("**/api/pi/kya/verify", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ kycStatus: "VERIFIED", computedTrustScore: 42 }),
      })
    );
    await page.goto("/claim");

    await page.getByRole("button", { name: /connect pi wallet/i }).click();
    await expect(page.locator("text=Connected").first()).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByRole("heading", { name: /know your agent/i })).toBeVisible();

    await page.getByRole("button", { name: /start verification/i }).click();
    await expect(page.locator("text=VERIFICATION COMPLETE").first()).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByRole("heading", { name: /activate your agent/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /activate agent/i })).toBeVisible();
  });

  test("no button nested inside link (invalid HTML check)", async ({ page }) => {
    await mockPiSDK(page, { isPiBrowser: true });
    await page.route("**/api/pi/kya/verify", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ kycStatus: "VERIFIED", computedTrustScore: 42 }),
      })
    );
    await page.goto("/claim");

    await page.getByRole("button", { name: /connect pi wallet/i }).click();
    await expect(page.locator("text=Connected").first()).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByRole("button", { name: /start verification/i }).click();
    await expect(page.locator("text=VERIFICATION COMPLETE").first()).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByRole("button", { name: /activate agent/i })).toBeVisible();

    const nestedButtons = await page.locator("a button, a [role='button']").count();
    expect(nestedButtons).toBe(0);
  });

  test("no console errors", async ({ page }) => {
    const { getErrors } = setupConsoleErrorCheck(page);
    await page.goto("/claim");
    await page.waitForTimeout(2000);
    expect(getErrors()).toHaveLength(0);
  });

  test("no raw translation keys", async ({ page }) => {
    await page.goto("/claim");
    await page.waitForTimeout(2000);
    await expectNoRawTranslationKeys(page);
  });
});
