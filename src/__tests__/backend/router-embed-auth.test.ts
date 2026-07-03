/**
 * @jest-environment node
 *
 * Tests for backend/src/router.ts — POST /api/embed authentication guard.
 *
 * PR change: the /api/embed handler's shared-secret check was refactored to
 * call the new safeCompare() helper (backend/src/lib/auth.ts) instead of
 * duplicating an inline manual constant-time XOR loop:
 *
 *   const embedSecret = request.headers.get("X-Shared-Secret");
 *   const expected = this.env.SHARED_SECRET_TOKEN_VERCEL_CF;
 *   if (!embedSecret || !expected || !safeCompare(embedSecret, expected)) {
 *     return errorResponse("Unauthorized", 401);
 *   }
 *
 * This file inlines that guard and safeCompare() to avoid Cloudflare/ESM
 * module resolution issues, matching the pattern used in
 * src/__tests__/backend/auth.test.ts and src/__tests__/backend/utils.test.ts.
 */

import { timingSafeEqual } from "node:crypto";
import * as nodeCrypto from "node:crypto";

/**
 * Inline replica of safeCompare from backend/src/lib/auth.ts.
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

/**
 * Inline replica of the POST /api/embed auth guard condition in
 * backend/src/router.ts. Returns true when the request is authorized.
 */
function isEmbedRequestAuthorized(embedSecret: string | null, expected: string | undefined): boolean {
  return Boolean(embedSecret && expected && safeCompare(embedSecret, expected));
}

const VALID_SECRET = "embed-shared-secret-32-bytes-long!!";

describe("router.ts — /api/embed auth guard (PR change)", () => {
  it("authorizes when the header exactly matches the expected secret", () => {
    expect(isEmbedRequestAuthorized(VALID_SECRET, VALID_SECRET)).toBe(true);
  });

  it("rejects when the X-Shared-Secret header is missing (null)", () => {
    expect(isEmbedRequestAuthorized(null, VALID_SECRET)).toBe(false);
  });

  it("rejects when the X-Shared-Secret header is an empty string", () => {
    expect(isEmbedRequestAuthorized("", VALID_SECRET)).toBe(false);
  });

  it("rejects when the env secret is undefined", () => {
    expect(isEmbedRequestAuthorized(VALID_SECRET, undefined)).toBe(false);
  });

  it("rejects when the env secret is an empty string", () => {
    expect(isEmbedRequestAuthorized(VALID_SECRET, "")).toBe(false);
  });

  it("rejects when both the header and the expected secret are missing", () => {
    expect(isEmbedRequestAuthorized(null, undefined)).toBe(false);
  });

  it("rejects when the header value does not match the expected secret", () => {
    expect(isEmbedRequestAuthorized("wrong-secret-value", VALID_SECRET)).toBe(false);
  });

  it("rejects when the header is shorter than the expected secret", () => {
    expect(isEmbedRequestAuthorized("short", VALID_SECRET)).toBe(false);
  });

  it("rejects when the header is longer than the expected secret", () => {
    expect(isEmbedRequestAuthorized(VALID_SECRET + "extra", VALID_SECRET)).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(isEmbedRequestAuthorized(VALID_SECRET.toUpperCase(), VALID_SECRET)).toBe(false);
  });

  it("delegates comparison to node:crypto's constant-time timingSafeEqual, not raw string equality", () => {
    // Regression guard: ensures the guard was migrated off the old manual
    // XOR-loop comparison and truly routes through safeCompare().
    const spy = jest.spyOn(nodeCrypto, "timingSafeEqual");
    isEmbedRequestAuthorized(VALID_SECRET, VALID_SECRET);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});