/**
 * Tests for e2e/fixtures/helpers.ts
 *
 * These are Playwright test helpers used across the e2e/*.e2e.ts suites
 * (mockAuthenticatedUser, mockUnauthenticatedUser, mockPiSDK, mockAPIFailure,
 * mockAPISuccess, expectNoRawTranslationKeys, checkBasicA11y,
 * setupConsoleErrorCheck, setupNetworkErrorCheck).
 *
 * Since these helpers only touch a small surface of the Playwright `Page`
 * API (addInitScript, route, locator, textContent, on), we exercise them
 * here with a lightweight mock Page rather than spinning up a browser,
 * verifying the exact request/response wiring and aggregation logic that
 * the e2e suites depend on.
 */

import type { Page } from "@playwright/test";
import {
  mockAuthenticatedUser,
  mockUnauthenticatedUser,
  mockPiSDK,
  mockAPIFailure,
  mockAPISuccess,
  expectNoRawTranslationKeys,
  checkBasicA11y,
  setupConsoleErrorCheck,
  setupNetworkErrorCheck,
} from "../../../e2e/fixtures/helpers";

type MockRoute = { fulfill: jest.Mock };

function createMockPage(overrides: Record<string, jest.Mock> = {}) {
  const page = {
    addInitScript: jest.fn().mockResolvedValue(undefined),
    route: jest.fn().mockResolvedValue(undefined),
    locator: jest.fn(),
    textContent: jest.fn(),
    on: jest.fn(),
    ...overrides,
  };
  return page as unknown as Page;
}

function makeRoute(): MockRoute {
  return { fulfill: jest.fn() };
}

describe("mockAuthenticatedUser", () => {
  it("registers exactly one init script with the default user data", async () => {
    const page = createMockPage();
    await mockAuthenticatedUser(page);

    expect(page.addInitScript).toHaveBeenCalledTimes(1);
    const [, arg] = (page.addInitScript as jest.Mock).mock.calls[0];
    expect(arg).toMatchObject({
      piUsername: "testuser",
      walletAddress: "GABCDEF1234567890",
      tier: "Citizen",
      xp: 210,
      trustScore: 21,
      kycStatus: "VERIFIED",
    });
  });

  it("merges caller-provided overrides on top of the defaults", async () => {
    const page = createMockPage();
    await mockAuthenticatedUser(page, { piUsername: "customuser", tier: "Ambassador" });

    const [, arg] = (page.addInitScript as jest.Mock).mock.calls[0];
    expect(arg.piUsername).toBe("customuser");
    expect(arg.tier).toBe("Ambassador");
    // Untouched defaults are preserved
    expect(arg.walletAddress).toBe("GABCDEF1234567890");
  });

  it("routes **/api/auth/pi to return 200 with userId plus the merged user", async () => {
    const page = createMockPage();
    await mockAuthenticatedUser(page, { piUsername: "abc" });

    expect(page.route).toHaveBeenCalledWith("**/api/auth/pi", expect.any(Function));

    const [, handler] = (page.route as jest.Mock).mock.calls[0];
    const route = makeRoute();
    await handler(route);

    expect(route.fulfill).toHaveBeenCalledWith(
      expect.objectContaining({ status: 200, contentType: "application/json" })
    );
    const body = JSON.parse(route.fulfill.mock.calls[0][0].body);
    expect(body.userId).toBe("test-user-id");
    expect(body.piUsername).toBe("abc");
  });
});

describe("mockUnauthenticatedUser", () => {
  it("registers an init script to clear stored auth state", async () => {
    const page = createMockPage();
    await mockUnauthenticatedUser(page);

    expect(page.addInitScript).toHaveBeenCalledTimes(1);
  });

  it("routes **/api/auth/pi to return a 401 with an error message", async () => {
    const page = createMockPage();
    await mockUnauthenticatedUser(page);

    const [, handler] = (page.route as jest.Mock).mock.calls[0];
    const route = makeRoute();
    await handler(route);

    expect(route.fulfill).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
    const body = JSON.parse(route.fulfill.mock.calls[0][0].body);
    expect(body.error).toBe("Not authenticated");
  });
});

describe("mockPiSDK", () => {
  it("defaults isPiBrowser to true when no options are given", async () => {
    const page = createMockPage();
    await mockPiSDK(page);

    const [, arg] = (page.addInitScript as jest.Mock).mock.calls[0];
    expect(arg).toBe(true);
  });

  it("passes through isPiBrowser=false when explicitly requested", async () => {
    const page = createMockPage();
    await mockPiSDK(page, { isPiBrowser: false });

    const [, arg] = (page.addInitScript as jest.Mock).mock.calls[0];
    expect(arg).toBe(false);
  });
});

describe("mockAPIFailure", () => {
  it("defaults to a 500 response with a generated message", async () => {
    const page = createMockPage();
    await mockAPIFailure(page, "**/api/foo");

    const [pattern, handler] = (page.route as jest.Mock).mock.calls[0];
    expect(pattern).toBe("**/api/foo");

    const route = makeRoute();
    await handler(route);

    const [{ status, body }] = route.fulfill.mock.calls[0];
    expect(status).toBe(500);
    expect(JSON.parse(body).error).toBe("Simulated 500");
  });

  it("uses a custom status code and message when provided", async () => {
    const page = createMockPage();
    await mockAPIFailure(page, "**/api/foo", 404, "Not found here");

    const [, handler] = (page.route as jest.Mock).mock.calls[0];
    const route = makeRoute();
    await handler(route);

    const [{ status, body }] = route.fulfill.mock.calls[0];
    expect(status).toBe(404);
    expect(JSON.parse(body).error).toBe("Not found here");
  });
});

describe("mockAPISuccess", () => {
  it("defaults to status 200 and serializes the given body as JSON", async () => {
    const page = createMockPage();
    await mockAPISuccess(page, "**/api/foo", { hello: "world" });

    const [, handler] = (page.route as jest.Mock).mock.calls[0];
    const route = makeRoute();
    await handler(route);

    const [{ status, contentType, body }] = route.fulfill.mock.calls[0];
    expect(status).toBe(200);
    expect(contentType).toBe("application/json");
    expect(JSON.parse(body)).toEqual({ hello: "world" });
  });

  it("accepts a custom status code", async () => {
    const page = createMockPage();
    await mockAPISuccess(page, "**/api/foo", { created: true }, 201);

    const [, handler] = (page.route as jest.Mock).mock.calls[0];
    const route = makeRoute();
    await handler(route);

    const [{ status }] = route.fulfill.mock.calls[0];
    expect(status).toBe(201);
  });
});

describe("expectNoRawTranslationKeys", () => {
  it("resolves without throwing when the body has no raw translation keys", async () => {
    const page = createMockPage({ textContent: jest.fn().mockResolvedValue("Hello world") });
    await expect(expectNoRawTranslationKeys(page)).resolves.not.toThrow();
  });

  it("throws when the body contains a 'translated_' prefixed key", async () => {
    const page = createMockPage({ textContent: jest.fn().mockResolvedValue("translated_greeting") });
    await expect(expectNoRawTranslationKeys(page)).rejects.toThrow();
  });

  it("throws when the body contains a 'placeholder_' prefixed key", async () => {
    const page = createMockPage({ textContent: jest.fn().mockResolvedValue("placeholder_name") });
    await expect(expectNoRawTranslationKeys(page)).rejects.toThrow();
  });

  it("throws when the body contains a '_placeholder' suffixed key", async () => {
    const page = createMockPage({ textContent: jest.fn().mockResolvedValue("name_placeholder") });
    await expect(expectNoRawTranslationKeys(page)).rejects.toThrow();
  });
});

describe("checkBasicA11y", () => {
  function createA11yPage(counts: { images: number; emptyLinks: number; emptyButtons: number }, lang: string | null) {
    const locator = jest.fn((selector: string) => {
      switch (selector) {
        case "img:not([alt])":
          return { count: jest.fn().mockResolvedValue(counts.images) };
        case "a:not([aria-label]):empty":
          return { count: jest.fn().mockResolvedValue(counts.emptyLinks) };
        case "button:not([aria-label]):not([title]):empty":
          return { count: jest.fn().mockResolvedValue(counts.emptyButtons) };
        case "html":
          return { getAttribute: jest.fn().mockResolvedValue(lang) };
        default:
          throw new Error(`Unexpected selector: ${selector}`);
      }
    });
    return createMockPage({ locator });
  }

  it("returns no issues for a fully accessible page", async () => {
    const page = createA11yPage({ images: 0, emptyLinks: 0, emptyButtons: 0 }, "en");
    const issues = await checkBasicA11y(page);
    expect(issues).toEqual([]);
  });

  it("reports images missing alt text", async () => {
    const page = createA11yPage({ images: 3, emptyLinks: 0, emptyButtons: 0 }, "en");
    const issues = await checkBasicA11y(page);
    expect(issues).toContain("3 images missing alt text");
  });

  it("reports empty links without an aria-label", async () => {
    const page = createA11yPage({ images: 0, emptyLinks: 2, emptyButtons: 0 }, "en");
    const issues = await checkBasicA11y(page);
    expect(issues).toContain("2 empty links without aria-label");
  });

  it("reports buttons without an accessible name", async () => {
    const page = createA11yPage({ images: 0, emptyLinks: 0, emptyButtons: 1 }, "en");
    const issues = await checkBasicA11y(page);
    expect(issues).toContain("1 buttons without accessible names");
  });

  it("reports a missing lang attribute on <html>", async () => {
    const page = createA11yPage({ images: 0, emptyLinks: 0, emptyButtons: 0 }, null);
    const issues = await checkBasicA11y(page);
    expect(issues).toContain("Missing lang attribute on <html>");
  });

  it("accumulates all issues found simultaneously", async () => {
    const page = createA11yPage({ images: 1, emptyLinks: 1, emptyButtons: 1 }, null);
    const issues = await checkBasicA11y(page);
    expect(issues).toHaveLength(4);
  });
});

describe("setupConsoleErrorCheck", () => {
  function createPageWithHandlers() {
    const handlers: Record<string, (arg: unknown) => void> = {};
    const page = createMockPage({
      on: jest.fn((event: string, handler: (arg: unknown) => void) => {
        handlers[event] = handler;
      }),
    });
    return { page, handlers };
  }

  it("captures console.error messages", () => {
    const { page, handlers } = createPageWithHandlers();
    const { getErrors } = setupConsoleErrorCheck(page);

    handlers.console({ type: () => "error", text: () => "Something broke" });

    expect(getErrors()).toEqual(["Something broke"]);
  });

  it("ignores console messages that are not type 'error'", () => {
    const { page, handlers } = createPageWithHandlers();
    const { getErrors } = setupConsoleErrorCheck(page);

    handlers.console({ type: () => "warning", text: () => "just a warning" });

    expect(getErrors()).toEqual([]);
  });

  it("filters out console errors mentioning 'WebSocket'", () => {
    const { page, handlers } = createPageWithHandlers();
    const { getErrors } = setupConsoleErrorCheck(page);

    handlers.console({ type: () => "error", text: () => "WebSocket connection failed" });

    expect(getErrors()).toEqual([]);
  });

  it("captures uncaught page errors", () => {
    const { page, handlers } = createPageWithHandlers();
    const { getErrors } = setupConsoleErrorCheck(page);

    handlers.pageerror({ message: "Uncaught TypeError" });

    expect(getErrors()).toEqual(["Uncaught TypeError"]);
  });

  it("accumulates multiple errors across calls", () => {
    const { page, handlers } = createPageWithHandlers();
    const { getErrors } = setupConsoleErrorCheck(page);

    handlers.console({ type: () => "error", text: () => "first error" });
    handlers.pageerror({ message: "second error" });

    expect(getErrors()).toEqual(["first error", "second error"]);
  });
});

describe("setupNetworkErrorCheck", () => {
  function createPageWithHandlers() {
    const handlers: Record<string, (arg: unknown) => void> = {};
    const page = createMockPage({
      on: jest.fn((event: string, handler: (arg: unknown) => void) => {
        handlers[event] = handler;
      }),
    });
    return { page, handlers };
  }

  it("records failed requests with status 0", () => {
    const { page, handlers } = createPageWithHandlers();
    const { getFailures } = setupNetworkErrorCheck(page);

    handlers.requestfailed({ url: () => "https://example.com/api/fail" });

    expect(getFailures()).toEqual([{ url: "https://example.com/api/fail", status: 0 }]);
  });

  it("records responses with a 4xx/5xx status", () => {
    const { page, handlers } = createPageWithHandlers();
    const { getFailures } = setupNetworkErrorCheck(page);

    handlers.response({ status: () => 500, url: () => "https://example.com/api/broken" });

    expect(getFailures()).toEqual([{ url: "https://example.com/api/broken", status: 500 }]);
  });

  it("ignores successful responses (status < 400)", () => {
    const { page, handlers } = createPageWithHandlers();
    const { getFailures } = setupNetworkErrorCheck(page);

    handlers.response({ status: () => 200, url: () => "https://example.com/api/ok" });

    expect(getFailures()).toEqual([]);
  });

  it("ignores failing responses for _next asset URLs", () => {
    const { page, handlers } = createPageWithHandlers();
    const { getFailures } = setupNetworkErrorCheck(page);

    handlers.response({ status: () => 404, url: () => "https://example.com/_next/static/chunk.js" });

    expect(getFailures()).toEqual([]);
  });

  it("accumulates both failed requests and failing responses", () => {
    const { page, handlers } = createPageWithHandlers();
    const { getFailures } = setupNetworkErrorCheck(page);

    handlers.requestfailed({ url: () => "https://example.com/api/dns-fail" });
    handlers.response({ status: () => 503, url: () => "https://example.com/api/down" });

    expect(getFailures()).toEqual([
      { url: "https://example.com/api/dns-fail", status: 0 },
      { url: "https://example.com/api/down", status: 503 },
    ]);
  });
});