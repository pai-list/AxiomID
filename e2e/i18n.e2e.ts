import { test, expect } from "@playwright/test";
import {
  setupConsoleErrorCheck,
  expectNoRawTranslationKeys,
} from "./fixtures/helpers";

// ponytail: reserved for locale iteration tests
const _LOCALES = ["en", "ar"] as const;

test.describe("Internationalization (i18n)", () => {
  test.describe("Landing page default locale", () => {
    test("English renders by default", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(2000);
      const h1 = page.locator("h1");
      await expect(h1).toContainText("Create your");
      await expect(h1).toContainText("AI Identity");
    });

    test("Arabic locale renders Arabic text", async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => {
        localStorage.setItem("aix_language", "ar");
      });
      await page.reload();
      await page.waitForTimeout(2000);

      const bodyText = await page.textContent("body");
      const hasArabic = /[\u0600-\u06FF]/.test(bodyText || "");
      expect(hasArabic).toBe(true);
    });
  });

  test.describe("No raw translation keys", () => {
    const PUBLIC_ROUTES = [
      "/",
      "/claim",
      "/docs",
      "/leaderboard",
      "/explorer",
      "/status",
    ];

    for (const route of PUBLIC_ROUTES) {
      test(`no raw keys on ${route}`, async ({ page }) => {
        await page.goto(route);
        await page.waitForTimeout(3000);
        await expectNoRawTranslationKeys(page);
      });
    }

    test("no raw keys on dashboard (authenticated)", async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem("axiomid_wallet", "demo:GTEST1234567890");
        localStorage.setItem("pi_access_token", "test-token");
      });
      await page.route("**/api/auth/pi", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            userId: "test-user-id",
            piUsername: "testuser",
            walletAddress: "GTEST1234567890",
            tier: "Citizen",
            xp: 210,
            trustScore: 21,
            kycStatus: "VERIFIED",
            agent: { name: "TestAgent", status: "ACTIVE" },
          }),
        })
      );

      await page.goto("/dashboard");
      await page.waitForTimeout(3000);
      await expectNoRawTranslationKeys(page);
    });
  });

  test.describe("RTL layout", () => {
    test("dir=rtl applied when Arabic is selected", async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => {
        localStorage.setItem("aix_language", "ar");
      });
      await page.reload();
      await page.waitForTimeout(2000);

      const dir = await page.evaluate(() => document.documentElement.dir);
      expect(dir).toBe("rtl");
    });

    test("dir=ltr for English", async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => {
        localStorage.setItem("aix_language", "en");
      });
      await page.reload();
      await page.waitForTimeout(2000);

      const dir = await page.evaluate(() => document.documentElement.dir);
      expect(dir).toBe("ltr");
    });
  });

  test.describe("Language toggle", () => {
    test("language toggle switches between en and ar", async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => {
        localStorage.setItem("aix_language", "en");
      });
      await page.reload();
      await page.waitForTimeout(1000);

      const langBtn = page
        .locator("button")
        .filter({ hasText: /عربي|AR|العربية/i })
        .first();
      const hasLangBtn = await langBtn.isVisible().catch(() => false);

      if (hasLangBtn) {
        await langBtn.click();
        await page.waitForTimeout(1500);

        const dir = await page.evaluate(() => document.documentElement.dir);
        expect(dir).toBe("rtl");

        const stored = await page.evaluate(() => localStorage.getItem("aix_language"));
        expect(stored).toBe("ar");
      }
    });
  });

  test.describe("Hardcoded English strings in components", () => {
    test("PassportView: hardcoded strings render", async ({ page }) => {
      await page.route("**/api/passport/testuser*", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            username: "testuser",
            walletAddress: "GTEST1234567890",
            did: "did:axiom:testuser",
            tier: "Citizen",
            xp: 210,
            trustScore: 21,
            kycStatus: "verified",
            kyaStatus: "verified",
            issuedDate: "2026-01-01",
            agentName: null,
            agentStatus: null,
          }),
        })
      );

      await page.goto("/passport/testuser");
      await page.waitForTimeout(3000);

      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    });

    test("WalletTab: hardcoded Wallet/Connected/Not connected render", async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem("axiomid_wallet", "demo:GTEST1234567890");
        localStorage.setItem("pi_access_token", "test-token");
      });
      await page.route("**/api/auth/pi", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            userId: "test-user-id",
            piUsername: "testuser",
            walletAddress: "GTEST1234567890",
            tier: "Citizen",
            xp: 210,
            trustScore: 21,
            kycStatus: "VERIFIED",
            agent: { name: "TestAgent", status: "ACTIVE" },
          }),
        })
      );

      await page.goto("/dashboard");
      await page.locator('[role="tab"]').filter({ hasText: "Wallet" }).click();
      await page.waitForTimeout(1000);

      const body = await page.textContent("body");
      expect(body).toContain("Wallet");
      expect(body).toContain("Connected:");
    });

    test("SettingsTab: hardcoded Account/Settings render", async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem("axiomid_wallet", "demo:GTEST1234567890");
        localStorage.setItem("pi_access_token", "test-token");
      });
      await page.route("**/api/auth/pi", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            userId: "test-user-id",
            piUsername: "testuser",
            walletAddress: "GTEST1234567890",
            tier: "Citizen",
            xp: 210,
            trustScore: 21,
            kycStatus: "VERIFIED",
            agent: { name: "TestAgent", status: "ACTIVE" },
          }),
        })
      );

      await page.goto("/dashboard");
      await page.locator('[role="tab"]').filter({ hasText: "Settings" }).click();
      await page.waitForTimeout(1000);

      const body = await page.textContent("body");
      expect(body).toContain("Account");
      expect(body).toContain("Settings");
    });

    test("SkillsTab: hardcoded Marketplace/No skills available render", async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem("axiomid_wallet", "demo:GTEST1234567890");
        localStorage.setItem("pi_access_token", "test-token");
      });
      await page.route("**/api/auth/pi", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            userId: "test-user-id",
            piUsername: "testuser",
            walletAddress: "GTEST1234567890",
            tier: "Citizen",
            xp: 210,
            trustScore: 21,
            kycStatus: "VERIFIED",
            agent: { name: "TestAgent", status: "ACTIVE" },
          }),
        })
      );
      await page.route("**/api/skills*", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ skills: [] }),
        })
      );

      await page.goto("/dashboard");
      await page.locator('[role="tab"]').filter({ hasText: "Skills" }).click();
      await page.waitForTimeout(1500);

      const body = await page.textContent("body");
      expect(body).toContain("Marketplace");
      expect(body).toContain("No skills available yet");
    });

    test("MemoryTab: hardcoded IQRA Neural Mesh/Skill Nodes render", async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem("axiomid_wallet", "demo:GTEST1234567890");
        localStorage.setItem("pi_access_token", "test-token");
      });
      await page.route("**/api/auth/pi", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            userId: "test-user-id",
            piUsername: "testuser",
            walletAddress: "GTEST1234567890",
            tier: "Citizen",
            xp: 210,
            trustScore: 21,
            kycStatus: "VERIFIED",
            agent: { name: "TestAgent", status: "ACTIVE" },
          }),
        })
      );
      await page.route("**/api/skills*", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ skills: [] }),
        })
      );

      await page.goto("/dashboard");
      await page.locator('[role="tab"]').filter({ hasText: "Memory" }).click();
      await page.waitForTimeout(1500);

      const body = await page.textContent("body");
      expect(body).toContain("IQRA Neural Mesh");
      expect(body).toContain("Skill Nodes");
    });
  });

  test.describe("Console errors during locale switch", () => {
    test("no console errors on locale switch", async ({ page }) => {
      const { getErrors } = setupConsoleErrorCheck(page);
      await page.goto("/");
      await page.waitForTimeout(1000);

      await page.evaluate(() => {
        localStorage.setItem("aix_language", "ar");
      });
      await page.reload();
      await page.waitForTimeout(2000);

      await page.evaluate(() => {
        localStorage.setItem("aix_language", "en");
      });
      await page.reload();
      await page.waitForTimeout(2000);

      expect(getErrors()).toHaveLength(0);
    });
  });
});
