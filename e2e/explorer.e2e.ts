import { test, expect } from "@playwright/test";
import {
  mockAPISuccess,
  setupConsoleErrorCheck,
  expectNoRawTranslationKeys,
} from "./fixtures/helpers";

const EXPLORER_DATA = {
  stats: {
    registeredUsers: 42,
    totalAgents: 38,
    activeAgents: 35,
    totalPayments: 1200,
    totalXpEarned: 85000,
  },
  recentPayments: [
    {
      id: "pay-1",
      amount: 5.5,
      status: "completed",
      memo: "Test payment",
      createdAt: "2026-07-01T12:00:00.000Z",
      user: { piUsername: "alice", walletAddress: "GABCDEF1234567890" },
    },
    {
      id: "pay-2",
      amount: 1.2,
      status: "completed",
      memo: null,
      createdAt: "2026-07-01T11:00:00.000Z",
      user: { piUsername: null, walletAddress: "GXYZXYZ7890123456" },
    },
  ],
  activeNodes: [
    {
      id: "node-1",
      piUsername: "alice",
      walletAddress: "GABCDEF1234567890",
      did: "did:axiom:pi:alice",
      tier: "Validator",
      xp: 320,
      agent: { name: "AliceBot", status: "ACTIVE" },
    },
    {
      id: "node-2",
      piUsername: "bob",
      walletAddress: "GXYZXYZ7890123456",
      did: "did:axiom:pi:bob",
      tier: "Citizen",
      xp: 150,
      agent: null,
    },
  ],
  tierDistribution: {
    Visitor: 10,
    Citizen: 20,
    Validator: 8,
    Sovereign: 4,
  },
};

const EMPTY_EXPLORER_DATA = {
  stats: {
    registeredUsers: 0,
    totalAgents: 0,
    activeAgents: 0,
    totalPayments: 0,
    totalXpEarned: 0,
  },
  recentPayments: [],
  activeNodes: [],
  tierDistribution: { Visitor: 0, Citizen: 0, Validator: 0, Sovereign: 0 },
};

test.describe("Explorer Page", () => {
  test("page renders with hero banner", async ({ page }) => {
    await mockAPISuccess(page, "**/api/explorer", EXPLORER_DATA);
    await page.goto("/explorer");

    await expect(page.locator("text=PROTOCOL EXPLORER")).toBeVisible();
    await expect(page.locator("text=Live Identity Ledger")).toBeVisible();
    await expect(page.locator("text=NETWORK STATUS")).toBeVisible();
    await expect(page.locator("text=ONLINE")).toBeVisible();
  });

  test("SVG node graph renders when data is loaded", async ({ page }) => {
    await mockAPISuccess(page, "**/api/explorer", EXPLORER_DATA);
    await page.goto("/explorer");

    // NetworkGraph renders an SVG element
    const svg = page.locator("svg").first();
    await expect(svg).toBeVisible({ timeout: 10000 });
  });

  test("ledger table renders with recent payments", async ({ page }) => {
    await mockAPISuccess(page, "**/api/explorer", EXPLORER_DATA);
    await page.goto("/explorer");

    await expect(page.locator("text=Recent Payments Ledger")).toBeVisible();
    await expect(page.locator("text=@alice")).toBeVisible();
    await expect(page.locator("text=+5.5 PI")).toBeVisible();
    await expect(page.locator("text=Test payment")).toBeVisible();
  });

  test("tier distribution section renders", async ({ page }) => {
    await mockAPISuccess(page, "**/api/explorer", EXPLORER_DATA);
    await page.goto("/explorer");

    await expect(page.locator("text=Identity Tier Distribution")).toBeVisible();
    await expect(page.locator("span").filter({ hasText: /^SOVEREIGN$/ })).toBeVisible();
    await expect(page.locator("span").filter({ hasText: /^VALIDATOR$/ })).toBeVisible();
    await expect(page.locator("span").filter({ hasText: /^CITIZEN$/ })).toBeVisible();
    await expect(page.locator("span").filter({ hasText: /^VISITOR$/ })).toBeVisible();
  });

  test("loading skeleton shows while data loads", async ({ page }) => {
    // Block the API call so loading state persists
    await page.route("**/api/explorer", () => new Promise(() => {}));
    await page.goto("/explorer");

    await expect(page.locator(".animate-pulse").first()).toBeVisible({ timeout: 5000 });
  });

  test("empty state when no data (zero users)", async ({ page }) => {
    await mockAPISuccess(page, "**/api/explorer", EMPTY_EXPLORER_DATA);
    await page.goto("/explorer");

    await expect(page.locator("text=No Agents Registered Yet")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=The protocol is live")).toBeVisible();
    const launchLink = page.getByRole("link", { name: /Launch App/i });
    await expect(launchLink).toBeVisible();
    await expect(launchLink).toHaveAttribute("href", "/dashboard");
  });

  test("responsive at 375px mobile viewport", async ({ page }) => {
    await mockAPISuccess(page, "**/api/explorer", EXPLORER_DATA);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/explorer");

    await expect(page.locator("text=Live Identity Ledger")).toBeVisible();
    await expect(page.locator("text=Identity Tier Distribution")).toBeVisible();
  });

  test("no console errors on load", async ({ page }) => {
    const { getErrors } = setupConsoleErrorCheck(page);
    await mockAPISuccess(page, "**/api/explorer", EXPLORER_DATA);
    await page.goto("/explorer");
    await page.waitForTimeout(3000);
    expect(getErrors()).toHaveLength(0);
  });

  test("no raw translation keys visible", async ({ page }) => {
    await mockAPISuccess(page, "**/api/explorer", EXPLORER_DATA);
    await page.goto("/explorer");
    await page.waitForTimeout(3000);
    await expectNoRawTranslationKeys(page);
  });

  test("stats row displays all four stat cards", async ({ page }) => {
    await mockAPISuccess(page, "**/api/explorer", EXPLORER_DATA);
    await page.goto("/explorer");

    // The stats row should render 4 stat-card-glow divs
    const statCards = page.locator(".stat-card-glow");
    await expect(statCards).toHaveCount(4);
  });

  test("error state shows retry button", async ({ page }) => {
    await page.route("**/api/explorer", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Internal error" }) })
    );
    await page.goto("/explorer");

    await expect(page.locator("text=Unable to Fetch Explorer Data")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=RETRY")).toBeVisible();
  });
});
