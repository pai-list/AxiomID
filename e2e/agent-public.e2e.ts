import { test, expect } from "@playwright/test";
import {
  mockAPISuccess,
  mockAPIFailure,
  setupConsoleErrorCheck,
  expectNoRawTranslationKeys,
} from "./fixtures/helpers";

const USERNAME = "testagent";
const AGENT_DATA = {
  username: USERNAME,
  walletAddress: "GABCDEF1234567890",
  tier: "Citizen",
  xp: 210,
  verified: true,
  did: "did:axiom:test-user-123",
  agent: {
    name: "TestAgent",
    status: "ACTIVE",
    lastActive: "2026-07-01T00:00:00.000Z",
  },
  memberSince: "2026-01-15T00:00:00.000Z",
};

test.describe("Public Agent Profile", () => {
  test("valid username shows agent info", async ({ page }) => {
    await mockAPISuccess(page, `**/api/agent/public*`, AGENT_DATA);
    await page.goto(`/agent/${USERNAME}`);

    await expect(page.locator(`text=@${USERNAME}`).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Citizen").first()).toBeVisible();
    await expect(page.locator("text=210 XP").first()).toBeVisible();
  });

  test("valid username shows verified badge", async ({ page }) => {
    await mockAPISuccess(page, `**/api/agent/public*`, AGENT_DATA);
    await page.goto(`/agent/${USERNAME}`);

    await expect(page.locator("text=Verified").first()).toBeVisible({ timeout: 10000 });
  });

  test("valid username shows agent status", async ({ page }) => {
    await mockAPISuccess(page, `**/api/agent/public*`, AGENT_DATA);
    await page.goto(`/agent/${USERNAME}`);

    await expect(page.locator("text=ACTIVE").first()).toBeVisible({ timeout: 10000 });
  });

  test("valid username shows DID document link", async ({ page }) => {
    await mockAPISuccess(page, `**/api/agent/public*`, AGENT_DATA);
    await page.goto(`/agent/${USERNAME}`);

    await expect(page.locator("text=DID Document").first()).toBeVisible({ timeout: 10000 });
  });

  test("valid username shows passport link", async ({ page }) => {
    await mockAPISuccess(page, `**/api/agent/public*`, AGENT_DATA);
    await page.goto(`/agent/${USERNAME}`);

    const passportLink = page.locator("text=Full Passport").first();
    await expect(passportLink).toBeVisible({ timeout: 10000 });
    await expect(passportLink).toHaveAttribute("href", `/passport/${USERNAME}`);
  });

  test("invalid username shows not-found state", async ({ page }) => {
    await mockAPIFailure(page, `**/api/agent/public*`, 404, "Agent not found");
    await page.goto("/agent/nonexistent-user-xyz");

    await expect(page.locator("text=Agent Not Found").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=@nonexistent-user-xyz").first()).toBeVisible();
  });

  test("not-found state has back link to home", async ({ page }) => {
    await mockAPIFailure(page, `**/api/agent/public*`, 404, "Agent not found");
    await page.goto("/agent/nonexistent-user-xyz");

    const backLink = page.locator('a[href="/"]').first();
    await expect(backLink).toBeVisible({ timeout: 10000 });
  });

  test("loading state shows skeleton pulse", async ({ page }) => {
    await page.route("**/api/agent/public*", () => new Promise(() => {}));
    await page.goto(`/agent/${USERNAME}`);

    await expect(page.locator(".animate-pulse").first()).toBeVisible({ timeout: 5000 });
  });

  test("no sensitive data leakage: no auth tokens in page", async ({ page }) => {
    await mockAPISuccess(page, `**/api/agent/public*`, AGENT_DATA);
    await page.goto(`/agent/${USERNAME}`);
    await page.waitForTimeout(2000);

    const body = await page.textContent("body");
    expect(body).not.toContain("pi_access_token");
    expect(body).not.toContain("test-token");
    expect(body).not.toContain("Bearer");
  });

  test("no sensitive data leakage: no internal IDs exposed", async ({ page }) => {
    await mockAPISuccess(page, `**/api/agent/public*`, AGENT_DATA);
    await page.goto(`/agent/${USERNAME}`);
    await page.waitForTimeout(2000);

    const body = await page.textContent("body");
    expect(body).not.toContain("test-user-id");
  });

  test("responsive at mobile viewport", async ({ page }) => {
    await mockAPISuccess(page, `**/api/agent/public*`, AGENT_DATA);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/agent/${USERNAME}`);

    await expect(page.locator(`text=@${USERNAME}`).first()).toBeVisible({ timeout: 10000 });
  });

  test("member since date renders", async ({ page }) => {
    await mockAPISuccess(page, `**/api/agent/public*`, AGENT_DATA);
    await page.goto(`/agent/${USERNAME}`);

    await expect(page.locator("text=days on AxiomID").first()).toBeVisible({ timeout: 10000 });
  });

  test("no console errors", async ({ page }) => {
    const { getErrors } = setupConsoleErrorCheck(page);
    await mockAPISuccess(page, `**/api/agent/public*`, AGENT_DATA);
    await page.goto(`/agent/${USERNAME}`);
    await page.waitForTimeout(3000);
    expect(getErrors()).toHaveLength(0);
  });

  test("no raw translation keys", async ({ page }) => {
    await mockAPISuccess(page, `**/api/agent/public*`, AGENT_DATA);
    await page.goto(`/agent/${USERNAME}`);
    await page.waitForTimeout(3000);
    await expectNoRawTranslationKeys(page);
  });
});
