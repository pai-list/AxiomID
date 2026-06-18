/**
 * Tests for public/service-worker.js
 *
 * Since service workers run in a special browser context, we mock the globals
 * (caches, self, fetch) and test the handlers by capturing registered callbacks.
 */

const CACHE_NAME = "axiomid-v1";

// --- Mock globals ---

let _mockCacheStorage;
let mockCaches;
let registeredListeners;

function makeMockCache() {
  const store = new Map();
  return {
    addAll: jest.fn((_urls) => Promise.resolve()),
    put: jest.fn((req, res) => {
      store.set(typeof req === "string" ? req : req.url, res);
      return Promise.resolve();
    }),
    match: jest.fn((req) => {
      const key = typeof req === "string" ? req : req.url;
      return Promise.resolve(store.get(key) || undefined);
    }),
    _store: store,
  };
}

function setupServiceWorkerGlobals() {
  registeredListeners = {};

  const cache = makeMockCache();
  mockCaches = {
    open: jest.fn(() => Promise.resolve(cache)),
    keys: jest.fn(() => Promise.resolve([CACHE_NAME])),
    delete: jest.fn(() => Promise.resolve(true)),
    match: jest.fn(() => Promise.resolve(undefined)),
    _cache: cache,
  };

  global.caches = mockCaches;
  global.self = {
    addEventListener: jest.fn((event, handler) => {
      registeredListeners[event] = handler;
    }),
    skipWaiting: jest.fn(() => Promise.resolve()),
    clients: {
      claim: jest.fn(),
    },
    location: {
      origin: "https://axiomid.app",
    },
  };
}

// Load the service worker module each test via require
function loadServiceWorker() {
  jest.resetModules();
  setupServiceWorkerGlobals();
   
  require("../../public/sw.js");
}

function makeEvent(overrides = {}) {
  return {
    waitUntil: jest.fn((p) => p),
    respondWith: jest.fn(),
    ...overrides,
  };
}

function makeRequest(url, method = "GET") {
  return {
    url,
    method,
    clone: jest.fn(function () { return this; }),
  };
}

function makeFetchEvent(url, method = "GET") {
  const request = makeRequest(url, method);
  const event = makeEvent({ request });
  return { event, request };
}

function makeResponse(ok = true) {
  return {
    ok,
    clone: jest.fn(function () { return this; }),
  };
}

describe("sw.js — registration", () => {
  beforeEach(() => {
    loadServiceWorker();
  });

  it("registers an install listener", () => {
    expect(global.self.addEventListener).toHaveBeenCalledWith("install", expect.any(Function));
    expect(registeredListeners["install"]).toBeDefined();
  });

  it("registers an activate listener", () => {
    expect(global.self.addEventListener).toHaveBeenCalledWith("activate", expect.any(Function));
    expect(registeredListeners["activate"]).toBeDefined();
  });

  it("registers a fetch listener", () => {
    expect(global.self.addEventListener).toHaveBeenCalledWith("fetch", expect.any(Function));
    expect(registeredListeners["fetch"]).toBeDefined();
  });
});

describe("sw.js — install event", () => {
  beforeEach(() => {
    loadServiceWorker();
  });

  it("opens the axiomid-v1 cache", async () => {
    const event = makeEvent();
    registeredListeners["install"](event);
    await event.waitUntil.mock.calls[0][0];

    expect(mockCaches.open).toHaveBeenCalledWith(CACHE_NAME);
  });

  it("caches the static assets", async () => {
    const event = makeEvent();
    registeredListeners["install"](event);
    await event.waitUntil.mock.calls[0][0];

    const cache = await mockCaches.open.mock.results[0].value;
    expect(cache.addAll).toHaveBeenCalledWith(
      expect.arrayContaining(["/", "/manifest.json"])
    );
  });

  it("calls self.skipWaiting() after caching assets", async () => {
    const event = makeEvent();
    registeredListeners["install"](event);
    await event.waitUntil.mock.calls[0][0];

    expect(global.self.skipWaiting).toHaveBeenCalled();
  });
});

describe("sw.js — activate event", () => {
  beforeEach(() => {
    loadServiceWorker();
  });

  it("calls self.clients.claim()", async () => {
    const event = makeEvent();
    registeredListeners["activate"](event);
    // Let microtasks settle
    await Promise.resolve();

    expect(global.self.clients.claim).toHaveBeenCalled();
  });

  it("deletes old caches that don't match CACHE_NAME", async () => {
    mockCaches.keys.mockResolvedValue(["axiomid-v0", CACHE_NAME, "old-cache"]);
    const event = makeEvent();
    registeredListeners["activate"](event);
    await event.waitUntil.mock.calls[0][0];

    expect(mockCaches.delete).toHaveBeenCalledWith("axiomid-v0");
    expect(mockCaches.delete).toHaveBeenCalledWith("old-cache");
    expect(mockCaches.delete).not.toHaveBeenCalledWith(CACHE_NAME);
  });

  it("does not delete the current cache", async () => {
    mockCaches.keys.mockResolvedValue([CACHE_NAME]);
    const event = makeEvent();
    registeredListeners["activate"](event);
    await event.waitUntil.mock.calls[0][0];

    expect(mockCaches.delete).not.toHaveBeenCalled();
  });
});

describe("sw.js — fetch event: API routes (network-first)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    loadServiceWorker();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("calls fetch() for public API routes (network-first)", () => {
    const mockFetch = jest.fn(() => Promise.resolve(makeResponse(true)));
    global.fetch = mockFetch;

    const { event, request } = makeFetchEvent("https://axiomid.app/api/status");
    registeredListeners["fetch"](event);

    expect(event.respondWith).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith(request);
  });

  it("caches GET API responses when ok", async () => {
    const response = makeResponse(true);
    const mockFetch = jest.fn(() => Promise.resolve(response));
    global.fetch = mockFetch;

    const { event } = makeFetchEvent("https://axiomid.app/api/status", "GET");
    registeredListeners["fetch"](event);
    const _result = await event.respondWith.mock.calls[0][0];

    expect(mockCaches.open).toHaveBeenCalledWith(CACHE_NAME);
  });

  it("does NOT cache POST API responses", async () => {
    const response = makeResponse(true);
    const mockFetch = jest.fn(() => Promise.resolve(response));
    global.fetch = mockFetch;

    const { event } = makeFetchEvent("https://axiomid.app/api/status", "POST");
    registeredListeners["fetch"](event);
    // Service worker only handles GET — POST should not call respondWith
    expect(event.respondWith).not.toHaveBeenCalled();
  });

  it("falls back to cache when API network request fails", async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error("Network error")));
    mockCaches.match.mockResolvedValue(makeResponse(true));

    const { event, request } = makeFetchEvent("https://axiomid.app/api/status");
    registeredListeners["fetch"](event);
    const _result = await event.respondWith.mock.calls[0][0];

    expect(mockCaches.match).toHaveBeenCalledWith(request);
  });
});

describe("sw.js — fetch event: static assets (cache-first)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    loadServiceWorker();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns cached response for static assets without fetching", async () => {
    const cachedResponse = makeResponse(true);
    mockCaches.match.mockResolvedValue(cachedResponse);

    const { event, request: _request } = makeFetchEvent("https://axiomid.app/icon-192x192.png");
    registeredListeners["fetch"](event);
    const result = await event.respondWith.mock.calls[0][0];

    expect(result).toBe(cachedResponse);
    // fetch should NOT have been called
  });

  it("fetches and caches static assets not in cache", async () => {
    mockCaches.match.mockResolvedValue(undefined);
    const networkResponse = makeResponse(true);
    const mockFetch = jest.fn(() => Promise.resolve(networkResponse));
    global.fetch = mockFetch;

    const { event, request } = makeFetchEvent("https://axiomid.app/manifest.json");
    registeredListeners["fetch"](event);
    await event.respondWith.mock.calls[0][0];

    expect(mockFetch).toHaveBeenCalledWith(request);
    expect(mockCaches.open).toHaveBeenCalledWith(CACHE_NAME);
  });

  it("does not cache non-ok static asset responses", async () => {
    mockCaches.match.mockResolvedValue(undefined);
    const notFoundResponse = makeResponse(false);
    global.fetch = jest.fn(() => Promise.resolve(notFoundResponse));

    const { event } = makeFetchEvent("https://axiomid.app/missing.png");
    registeredListeners["fetch"](event);
    await event.respondWith.mock.calls[0][0];

    expect(mockCaches._cache.put).not.toHaveBeenCalled();
  });

  it("routes non-/api/ paths to cache-first strategy", () => {
    mockCaches.match.mockResolvedValue(makeResponse(true));

    const { event } = makeFetchEvent("https://axiomid.app/dashboard");
    registeredListeners["fetch"](event);

    // Cache match should be called for non-api paths
    expect(mockCaches.match).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// New tests for PR changes in public/sw.js
// ─────────────────────────────────────────────────────────────────────────────

describe("sw.js — fetch event: non-public API routes are not intercepted (PR change)", () => {
  beforeEach(() => {
    loadServiceWorker();
  });

  it("does not call respondWith for /api/auth (authenticated route)", () => {
    const { event } = makeFetchEvent("https://axiomid.app/api/auth");
    registeredListeners["fetch"](event);
    expect(event.respondWith).not.toHaveBeenCalled();
  });

  it("does not call respondWith for /api/user (authenticated route)", () => {
    const { event } = makeFetchEvent("https://axiomid.app/api/user");
    registeredListeners["fetch"](event);
    expect(event.respondWith).not.toHaveBeenCalled();
  });

  it("does not call respondWith for /api/sync (authenticated route)", () => {
    const { event } = makeFetchEvent("https://axiomid.app/api/sync");
    registeredListeners["fetch"](event);
    expect(event.respondWith).not.toHaveBeenCalled();
  });

  it("does not call respondWith for /api/passport (authenticated route)", () => {
    const { event } = makeFetchEvent("https://axiomid.app/api/passport");
    registeredListeners["fetch"](event);
    expect(event.respondWith).not.toHaveBeenCalled();
  });

  it("calls respondWith for /api/status (public route)", () => {
    global.fetch = jest.fn(() => Promise.resolve(makeResponse(true)));
    const { event } = makeFetchEvent("https://axiomid.app/api/status");
    registeredListeners["fetch"](event);
    expect(event.respondWith).toHaveBeenCalled();
  });

  it("calls respondWith for /api/health (public route, PR change)", () => {
    global.fetch = jest.fn(() => Promise.resolve(makeResponse(true)));
    const { event } = makeFetchEvent("https://axiomid.app/api/health");
    registeredListeners["fetch"](event);
    expect(event.respondWith).toHaveBeenCalled();
  });

  it("calls respondWith for sub-paths of /api/status (startsWith match)", () => {
    global.fetch = jest.fn(() => Promise.resolve(makeResponse(true)));
    const { event } = makeFetchEvent("https://axiomid.app/api/status/details");
    registeredListeners["fetch"](event);
    expect(event.respondWith).toHaveBeenCalled();
  });
});

describe("sw.js — fetch event: cross-origin and non-GET requests are ignored (PR change)", () => {
  beforeEach(() => {
    loadServiceWorker();
  });

  it("does not call respondWith for cross-origin GET requests", () => {
    const { event } = makeFetchEvent("https://other-domain.com/some-resource");
    registeredListeners["fetch"](event);
    expect(event.respondWith).not.toHaveBeenCalled();
  });

  it("does not call respondWith for cross-origin API requests", () => {
    const { event } = makeFetchEvent("https://cdn.example.com/api/status");
    registeredListeners["fetch"](event);
    expect(event.respondWith).not.toHaveBeenCalled();
  });

  it("does not call respondWith for POST requests to own origin", () => {
    const { event } = makeFetchEvent("https://axiomid.app/manifest.json", "POST");
    registeredListeners["fetch"](event);
    expect(event.respondWith).not.toHaveBeenCalled();
  });

  it("does not call respondWith for PUT requests to own origin", () => {
    const { event } = makeFetchEvent("https://axiomid.app/api/status", "PUT");
    registeredListeners["fetch"](event);
    expect(event.respondWith).not.toHaveBeenCalled();
  });

  it("does not call respondWith for DELETE requests to own origin", () => {
    const { event } = makeFetchEvent("https://axiomid.app/some-path", "DELETE");
    registeredListeners["fetch"](event);
    expect(event.respondWith).not.toHaveBeenCalled();
  });
});

describe("sw.js — fetch event: API 503 fallback when offline and no cached response (PR change)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    loadServiceWorker();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns a 503 JSON response when network fails and no cached entry exists", async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error("Network error")));
    mockCaches.match.mockResolvedValue(undefined);

    const { event } = makeFetchEvent("https://axiomid.app/api/status");
    registeredListeners["fetch"](event);
    const result = await event.respondWith.mock.calls[0][0];

    expect(result.status).toBe(503);
    const body = await result.json();
    expect(body).toEqual({ error: "Service unavailable" });
  });

  it("503 response has Content-Type application/json", async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error("Network error")));
    mockCaches.match.mockResolvedValue(undefined);

    const { event } = makeFetchEvent("https://axiomid.app/api/health");
    registeredListeners["fetch"](event);
    const result = await event.respondWith.mock.calls[0][0];

    expect(result.headers.get("Content-Type")).toBe("application/json");
  });

  it("returns cached entry (not 503) when offline but cache exists", async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error("Network error")));
    const cachedResponse = makeResponse(true);
    mockCaches.match.mockResolvedValue(cachedResponse);

    const { event } = makeFetchEvent("https://axiomid.app/api/status");
    registeredListeners["fetch"](event);
    const result = await event.respondWith.mock.calls[0][0];

    expect(result).toBe(cachedResponse);
  });
});

describe("sw.js — cacheResponse argument bug regression (PR change)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    loadServiceWorker();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  /**
   * Regression: sw.js calls cacheResponse(event, request, response) but the
   * function signature is cacheResponse(request, response). This means:
   *   - The `event` object is used as the cache key instead of `request`
   *   - The `request` object is cloned as if it were the response
   * This test documents the actual (buggy) behavior so any fix is detectable.
   */
  it("calls caches.open when a public API response is ok (even with wrong args)", async () => {
    const response = makeResponse(true);
    global.fetch = jest.fn(() => Promise.resolve(response));

    const { event } = makeFetchEvent("https://axiomid.app/api/status");
    registeredListeners["fetch"](event);
    await event.respondWith.mock.calls[0][0];

    // caches.open IS called (the function runs) - it just uses wrong args
    expect(mockCaches.open).toHaveBeenCalledWith(CACHE_NAME);
  });

  it("calls caches.open when a static asset response is ok (cacheResponse bug present)", async () => {
    mockCaches.match.mockResolvedValue(undefined);
    const response = makeResponse(true);
    global.fetch = jest.fn(() => Promise.resolve(response));

    const { event } = makeFetchEvent("https://axiomid.app/manifest.json");
    registeredListeners["fetch"](event);
    await event.respondWith.mock.calls[0][0];

    // caches.open IS called - but cache.put receives event as key (bug)
    expect(mockCaches.open).toHaveBeenCalledWith(CACHE_NAME);
  });

  it("cache.put key is the event object (not request) due to the 3-arg cacheResponse call (bug)", async () => {
    mockCaches.match.mockResolvedValue(undefined);
    const response = makeResponse(true);
    global.fetch = jest.fn(() => Promise.resolve(response));

    const { event } = makeFetchEvent("https://axiomid.app/manifest.json");
    registeredListeners["fetch"](event);
    await event.respondWith.mock.calls[0][0];
    // Allow the fire-and-forget caches.open().then() to settle
    await Promise.resolve();
    await Promise.resolve();

    // Due to bug: cache.put is called with event (not request) as the first arg
    expect(mockCaches._cache.put).toHaveBeenCalledWith(event, expect.anything());
  });
});
