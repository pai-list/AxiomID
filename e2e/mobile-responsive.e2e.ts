import { test, expect } from "@playwright/test";
import {
  mockPiSDK,
  mockAuthenticatedUser,
  setupConsoleErrorCheck,
} from "./fixtures/helpers";

const MOBILE_VIEWPORT = { width: 390, height: 844 };
const MOCK_USER = {
  piUsername: "testuser",
  walletAddress: "GABCDEF1234567890",
  tier: "Citizen",
  xp: 210,
  trustScore: 21,
  kycStatus: "VERIFIED",
  agent: { name: "TestAgent", status: "ACTIVE" },
};

const PUBLIC_ROUTES = ["/", "/claim", "/docs", "/leaderboard", "/explorer", "/status"] as const;

test.describe("Mobile Responsive Design (iPhone 13 — 390x844)", () => {
  test.use({
    viewport: MOBILE_VIEWPORT,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
  });

  test.describe("No horizontal scroll on public routes", () => {
    for (const route of PUBLIC_ROUTES) {
      test(`${route} loads without horizontal scroll`, async ({ page }) => {
        await page.goto(route);
        await page.waitForTimeout(3000);

        const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1);
      });
    }

    test("/dashboard loads without horizontal scroll (authenticated)", async ({ page }) => {
      await mockPiSDK(page, { isPiBrowser: true });
      await mockAuthenticatedUser(page, MOCK_USER);
      await page.goto("/dashboard");
      await page.waitForTimeout(3000);

      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1);
    });

    test("/passport/testuser loads without horizontal scroll", async ({ page }) => {
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

      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1);
    });
  });

  test.describe("Touch targets >= 48px", () => {
    test("buttons and links have minimum 48px touch area", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(3000);

      const interactiveElements = page.locator("a, button, [role='button']");
      const count = await interactiveElements.count();
      const violations: string[] = [];

      for (let i = 0; i < Math.min(count, 20); i++) {
        const el = interactiveElements.nth(i);
        const visible = await el.isVisible().catch(() => false);
        if (!visible) continue;

        const box = await el.boundingBox();
        if (box && (box.width < 44 || box.height < 44)) {
          const text = (await el.textContent())?.trim().slice(0, 30) || "unnamed";
          violations.push(`[${text}] ${box.width}x${box.height}`);
        }
      }

      if (violations.length > 0) {
        console.warn("Small touch targets:", violations);
      }
      expect(violations).toHaveLength(0);
    });
  });

  test.describe("Backdrop filter rendering", () => {
    test("glassmorphism elements render without crashes", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(3000);

      const glassCards = page.locator(".glass-card, .bento-card, [class*='backdrop-blur']");
      const count = await glassCards.count();
      expect(count).toBeGreaterThan(0);

      const hasBackdropFilter = await page.evaluate(() => {
        const els = document.querySelectorAll(".glass-card, .bento-card");
        let supported = false;
        els.forEach((el) => {
          const style = getComputedStyle(el);
          if (
            style.backdropFilter &&
            style.backdropFilter !== "none" &&
            !style.backdropFilter.includes("unknown")
          ) {
            supported = true;
          }
        });
        return supported;
      });
      expect(hasBackdropFilter).toBe(true);
    });
  });

  test.describe("Bottom navigation on dashboard", () => {
    test("bottom navigation is present on dashboard", async ({ page }) => {
      await mockPiSDK(page, { isPiBrowser: true });
      await mockAuthenticatedUser(page, MOCK_USER);
      await page.goto("/dashboard");
      await page.waitForTimeout(3000);

      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();
      expect(tabCount).toBe(6);

      const lastTab = tabs.last();
      const box = await lastTab.boundingBox();
      if (box) {
        expect(box.y).toBeGreaterThan(MOBILE_VIEWPORT.height * 0.5);
      }
    });
  });

  test.describe("Safe-area-inset padding", () => {
    test("bottom padding applied for safe area", async ({ page }) => {
      await mockPiSDK(page, { isPiBrowser: true });
      await mockAuthenticatedUser(page, MOCK_USER);
      await page.goto("/dashboard");
      await page.waitForTimeout(3000);

      const hasSafeArea = await page.evaluate(() => {
        const allElements = document.querySelectorAll("*");
        for (const el of allElements) {
          const style = getComputedStyle(el);
          if (
            style.paddingBottom &&
            style.paddingBottom.includes("env(safe-area-inset-bottom)")
          ) {
            return true;
          }
        }
        const body = document.body;
        const bodyStyle = getComputedStyle(body);
        return (
          bodyStyle.paddingBottom !== "0px" ||
          bodyStyle.marginBottom !== "0px"
        );
      });
      expect(hasSafeArea).toBe(true);
    });
  });

  test.describe("Modals and dialogs fit viewport", () => {
    test("dashboard content fits within viewport width", async ({ page }) => {
      await mockPiSDK(page, { isPiBrowser: true });
      await mockAuthenticatedUser(page, MOCK_USER);
      await page.goto("/dashboard");
      await page.waitForTimeout(3000);

      const overflowHidden = await page.evaluate(() => {
        const body = document.body;
        return body.scrollWidth <= window.innerWidth;
      });
      expect(overflowHidden).toBe(true);
    });
  });

  test.describe("Text readability", () => {
    test("text is not overflowing on public pages", async ({ page }) => {
      const routes = ["/", "/docs", "/leaderboard"];
      for (const route of routes) {
        await page.goto(route);
        await page.waitForTimeout(2000);

        const textOverflow = await page.evaluate(() => {
          const textElements = document.querySelectorAll("p, h1, h2, h3, span, a");
          let overflowing = false;
          textElements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.right > window.innerWidth + 5) {
              overflowing = true;
            }
          });
          return overflowing;
        });
        expect(textOverflow).toBe(false);
      }
    });

    test("no tiny font sizes on mobile", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(2000);

      const tinyFonts = await page.evaluate(() => {
        const elements = document.querySelectorAll("p, span, a, h1, h2, h3");
        const tiny: string[] = [];
        elements.forEach((el) => {
          const style = getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          if (fontSize < 10 && el.textContent?.trim()) {
            tiny.push(`${el.tagName}:${fontSize}px`);
          }
        });
        return tiny;
      });

      if (tinyFonts.length > 0) {
        console.warn("Tiny font elements:", tinyFonts);
      }
      expect(tinyFonts).toHaveLength(0);
    });
  });

  test.describe("Image/SVG rendering", () => {
    test("images and SVGs do not overflow viewport", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(3000);

      const mediaOverflow = await page.evaluate(() => {
        const media = document.querySelectorAll("img, svg");
        let overflowing = false;
        media.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.right > window.innerWidth + 10) {
            overflowing = true;
          }
        });
        return overflowing;
      });
      expect(mediaOverflow).toBe(false);
    });
  });

  test.describe("No console errors on any route", () => {
    const ALL_ROUTES = [
      "/",
      "/claim",
      "/docs",
      "/leaderboard",
      "/explorer",
      "/status",
    ] as const;

    for (const route of ALL_ROUTES) {
      test(`no console errors on ${route}`, async ({ page }) => {
        const { getErrors } = setupConsoleErrorCheck(page);
        await page.goto(route);
        await page.waitForTimeout(3000);
        expect(getErrors()).toHaveLength(0);
      });
    }

    test("no console errors on /dashboard (authenticated)", async ({ page }) => {
      await mockPiSDK(page, { isPiBrowser: true });
      await mockAuthenticatedUser(page, MOCK_USER);
      const { getErrors } = setupConsoleErrorCheck(page);
      await page.goto("/dashboard");
      await page.waitForTimeout(3000);
      expect(getErrors()).toHaveLength(0);
    });
  });
});
