const CACHE = "axiomid-v4";
const STATIC_ASSET_PATTERN = /\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|otf|eot|map)$/;
const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/offline",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/axiomid-logo.jpg",
  "/axiomid-banner.jpg",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  if (typeof caches === "undefined") {
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch((err) => {
        console.error("[SW] Precaching failed", err);
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  if (typeof caches === "undefined") {
    self.clients.claim();
    return;
  }
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

// Static immutable assets that are safe to serve Stale-While-Revalidate.

self.addEventListener("fetch", (event) => {
  if (typeof caches === "undefined") {
    return;
  }
  const url = new URL(event.request.url);

  // Bypass caching for non-GET requests, APIs, and external origins.
  // Use an exact origin comparison so lookalike hosts are never matched.
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // Network-First strategy for HTML document requests and homepage
  // event.waitUntil() MUST be called before event.respondWith() to avoid
  // DOMException when the event is deactivated before .then() runs.
  if (
    event.request.mode === "navigate" ||
    url.pathname === "/" ||
    !url.pathname.includes(".")
  ) {
    let cacheWritePromise;
    const fetchPromise = fetch(event.request).then((response) => {
      if (response.status === 200) {
        const clone = response.clone();
        cacheWritePromise = caches
          .open(CACHE)
          .then((cache) => cache.put(event.request, clone));
      }
      return response;
    });
    event.waitUntil(
      fetchPromise.then(() => cacheWritePromise).catch(() => {})
    );
    event.respondWith(
      fetchPromise.catch(async () => {
        const cached = await caches.match(event.request);
        return cached || caches.match("/offline");
      })
    );
    return;
  }

  // Stale-While-Revalidate strategy, restricted to static immutable assets
  // and the Next.js static chunk directory. Everything else bypasses the cache.
  if (
    !STATIC_ASSET_PATTERN.test(url.pathname) &&
    !url.pathname.startsWith("/_next/static/")
  ) {
    return;
  }

  // Stale-While-Revalidate: serve cached, update in background.
  // event.waitUntil() is called BEFORE event.respondWith() to keep the SW alive.
  // A single network request is shared between the cache update and the
  // response fallback so uncached assets are never fetched twice.
  let cacheWritePromise;
  const fetchPromise = fetch(event.request).then((response) => {
    if (response.status === 200) {
      const clone = response.clone();
      cacheWritePromise = caches
        .open(CACHE)
        .then((cache) => cache.put(event.request, clone));
    }
    return response;
  });

  event.waitUntil(
    fetchPromise.then(() => cacheWritePromise).catch(() => {})
  );
  event.respondWith(
    caches
      .match(event.request)
      .then((cached) => cached || fetchPromise)
  );
});
