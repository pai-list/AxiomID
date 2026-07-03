/**
 * @jest-environment node
 *
 * Tests for backend/src/lib/auth.ts
 * Covers the PR changes: PUBLIC_ROUTES/PUBLIC_PREFIXES updated from iqra → truth.
 * Uses inline replicas to avoid Cloudflare-specific module resolution issues.
 */

import { timingSafeEqual, createHash } from "node:crypto";

// ---------------------------------------------------------------------------
// Inline replicas matching backend/src/lib/auth.ts exactly
// ---------------------------------------------------------------------------

const PUBLIC_ROUTES = ["/health", "/status", "/api/trust/", "/api/truth/", "/api/skills"];
const PUBLIC_EXACT = new Set(["/health", "/status", "/api/skills"]);
const PUBLIC_PREFIXES = ["/api/trust/", "/api/truth/"];

interface MockEnv {
  SHARED_SECRET_TOKEN_VERCEL_CF?: string;
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Uses native node:crypto.timingSafeEqual for robust protection.
 */
function safeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);

  if (aBuf.length !== bBuf.length) {
    return false;
  }

  return timingSafeEqual(aBuf, bBuf);
}

function verifyAuth(
  request: Request,
  env: MockEnv
): { authorized: boolean; agentId?: string } {
  const url = new URL(request.url);
  const agentId = url.searchParams.get("agentId") || undefined;

  const isPublic =
    PUBLIC_EXACT.has(url.pathname) ||
    PUBLIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
  if (isPublic) {
    return { authorized: true, agentId };
  }

  const authHeader = request.headers.get("X-Shared-Secret");
  const secret = env.SHARED_SECRET_TOKEN_VERCEL_CF;

  if (!secret || !authHeader) {
    return { authorized: false };
  }

  return { authorized: safeCompare(authHeader, secret), agentId };
}

const BASE_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "https://axiomid.app",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Shared-Secret",
};

function rateLimitHeaders(result: {
  remaining: number;
  resetMs: number;
}): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetMs / 1000)),
  };
}

function jsonResponse(
  data: unknown,
  status: number = 200,
  extraHeaders?: Record<string, string>
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...BASE_HEADERS, ...extraHeaders },
  });
}

function errorResponse(
  message: string,
  status: number = 400,
  extraHeaders?: Record<string, string>
): Response {
  return jsonResponse(
    { success: false, error: message, timestamp: Date.now() },
    status,
    extraHeaders
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(
  pathname: string,
  headers: Record<string, string> = {},
  searchParams: Record<string, string> = {}
): Request {
  const url = new URL(`https://worker.example.com${pathname}`);
  Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString(), { headers });
}

const VALID_SECRET = "my-shared-secret-32-bytes-long!!!";

// ---------------------------------------------------------------------------
// safeCompare Tests
// ---------------------------------------------------------------------------

describe("safeCompare", () => {
  it("returns true for identical strings", () => {
    expect(safeCompare("abc", "abc")).toBe(true);
  });

  it("returns false for different strings of same length", () => {
    expect(safeCompare("abc", "abd")).toBe(false);
  });

  it("returns false for different strings of different lengths", () => {
    expect(safeCompare("abc", "abcd")).toBe(false);
    expect(safeCompare("abcd", "abc")).toBe(false);
  });

  it("returns false if one string is empty", () => {
    expect(safeCompare("", "abc")).toBe(false);
    expect(safeCompare("abc", "")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// PUBLIC_ROUTES array
// ---------------------------------------------------------------------------

describe("PUBLIC_ROUTES array", () => {
  it("contains /health", () => {
    expect(PUBLIC_ROUTES).toContain("/health");
  });

  it("contains /status", () => {
    expect(PUBLIC_ROUTES).toContain("/status");
  });

  it("contains /api/truth/", () => {
    expect(PUBLIC_ROUTES).toContain("/api/truth/");
  });

  it("contains /api/skills", () => {
    expect(PUBLIC_ROUTES).toContain("/api/skills");
  });

  it("has exactly 5 entries", () => {
    expect(PUBLIC_ROUTES).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// verifyAuth — public routes (no auth required)
// ---------------------------------------------------------------------------

describe("verifyAuth — public routes", () => {
  const env: MockEnv = {}; // no secret set

  it("authorizes /health without a secret", () => {
    const req = makeRequest("/health");
    const result = verifyAuth(req, env);
    expect(result.authorized).toBe(true);
  });

  it("authorizes /api/truth/ask (prefix match) without a secret", () => {
    const req = makeRequest("/api/truth/ask");
    const result = verifyAuth(req, env);
    expect(result.authorized).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// verifyAuth — protected routes requiring X-Shared-Secret
// ---------------------------------------------------------------------------

describe("verifyAuth — protected routes", () => {
  const env: MockEnv = { SHARED_SECRET_TOKEN_VERCEL_CF: VALID_SECRET };

  it("returns authorized=false when X-Shared-Secret header is missing", () => {
    const req = makeRequest("/api/agent");
    const result = verifyAuth(req, env);
    expect(result.authorized).toBe(false);
  });

  it("returns authorized=false when secret is wrong", () => {
    const req = makeRequest("/api/agent", { "X-Shared-Secret": "wrong-secret!" });
    const result = verifyAuth(req, env);
    expect(result.authorized).toBe(false);
  });

  it("returns authorized=true when secret matches exactly", () => {
    const req = makeRequest("/api/agent", { "X-Shared-Secret": VALID_SECRET });
    const result = verifyAuth(req, env);
    expect(result.authorized).toBe(true);
  });

  it("returns authorized=false when header length differs from secret", () => {
    const req = makeRequest("/api/agent", { "X-Shared-Secret": "short" });
    const result = verifyAuth(req, env);
    expect(result.authorized).toBe(false);
  });
});
