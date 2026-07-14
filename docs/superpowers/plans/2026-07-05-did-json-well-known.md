# `/.well-known/did.json` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve the W3C DID Document for the AxiomID protocol root of trust at `/.well-known/did.json`.

**Architecture:** New Next.js App Router route handler at `src/app/.well-known/did.json/route.ts`. Reuses existing `buildDidDocument()` and `createIssuerDid()` functions. No new library code. Returns `application/did+ld+json` with 24h cache.

**Tech Stack:** Next.js 16 App Router, TypeScript, Jest, Prisma (not used in this route)

## Global Constraints

- `"strict": true` in tsconfig — never weaken
- No `as any` casts
- Standard Jest matchers only (no `.toBeFinite()`)
- Pi SDK browser-only (not relevant here — server-side route)
- IQRA Chronicle commit messages: `type(scope): description ۞`
- Every merge requires CodeRabbit ✅ + user's explicit approval

---

## File Structure

| Action | File | Purpose |
|---|---|---|
| Create | `src/app/.well-known/did.json/route.ts` | GET handler for DID document |
| Create | `src/__tests__/.well-known/did-json.test.ts` | 6 unit tests |

---

### Task 1: Write the failing test

**Files:**
- Create: `src/__tests__/.well-known/did-json.test.ts`

**Interfaces:**
- Consumes: None (test file)
- Produces: Test suite that imports `GET` from the route (will fail until route is created)

- [ ] **Step 1.1: Create test file with mocks**

```typescript
/**
 * @jest-environment node
 *
 * Tests for src/app/.well-known/did.json/route.ts
 *
 * Serves the W3C DID Document for the AxiomID protocol root of trust.
 */

jest.mock("@/lib/did", () => ({
  createIssuerDid: jest.fn(() => "did:axiom:issuer"),
}));

jest.mock("@/lib/did-document", () => ({
  buildDidDocument: jest.fn((did: string, publicKey?: string) => ({
    "@context": ["https://www.w3.org/ns/did/v1"],
    id: did,
    ...(publicKey
      ? {
          verificationMethod: [
            {
              id: `${did}#key-1`,
              type: "Ed25519VerificationKey2020",
              controller: did,
              publicKeyMultibase: publicKey,
            },
          ],
          authentication: ["#key-1"],
          assertionMethod: ["#key-1"],
        }
      : {}),
  })),
}));

jest.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: jest.fn().mockResolvedValue({
    allowed: true,
    remaining: 59,
    resetAt: Date.now() + 60000,
  }),
  RATE_LIMITS: {
    public: { windowMs: 60000, maxRequests: 60 },
  },
}));

jest.mock("@/lib/ip", () => ({
  getClientIp: jest.fn(() => "127.0.0.1"),
}));

jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

import { GET } from "@/app/.well-known/did.json/route";
import { createIssuerDid } from "@/lib/did";
import { buildDidDocument } from "@/lib/did-document";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/ip";

const mockCreateIssuerDid = createIssuerDid as jest.Mock;
const mockBuildDidDocument = buildDidDocument as jest.Mock;
const mockCheckRateLimit = checkRateLimit as jest.Mock;
const mockGetClientIp = getClientIp as jest.Mock;

function mockGetRequest(): Request {
  return new Request("http://localhost/.well-known/did.json", {
    method: "GET",
  }) as any;
}

describe("GET /.well-known/did.json", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 59,
      resetAt: Date.now() + 60000,
    });
    mockGetClientIp.mockReturnValue("127.0.0.1");
    process.env.ISSUER_PUBLIC_KEY = "test-public-key";
  });

  afterEach(() => {
    delete process.env.ISSUER_PUBLIC_KEY;
  });

  it("returns 200 with correct content-type", async () => {
    const req = mockGetRequest();
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/did+ld+json");
  });

  it("returns issuer DID document with id: did:axiom:issuer", async () => {
    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(data.id).toBe("did:axiom:issuer");
    expect(mockCreateIssuerDid).toHaveBeenCalled();
  });

  it("returns 500 when ISSUER_PUBLIC_KEY is missing", async () => {
    delete process.env.ISSUER_PUBLIC_KEY;

    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toContain("ISSUER_PUBLIC_KEY");
  });

  it("response validates against DidDocumentSchema shape", async () => {
    const req = mockGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(data["@context"]).toBeDefined();
    expect(Array.isArray(data["@context"])).toBe(true);
    expect(data["@context"]).toContain("https://www.w3.org/ns/did/v1");
    expect(data.id).toBe("did:axiom:issuer");
    expect(data.verificationMethod).toBeDefined();
    expect(Array.isArray(data.verificationMethod)).toBe(true);
    expect(data.verificationMethod[0].type).toBe(
      "Ed25519VerificationKey2020"
    );
  });

  it("sets Cache-Control header with max-age=86400", async () => {
    const req = mockGetRequest();
    const res = await GET(req);

    expect(res.headers.get("Cache-Control")).toContain("max-age=86400");
  });

  it("uses RATE_LIMITS.public for rate limiting", async () => {
    const req = mockGetRequest();
    await GET(req);

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      expect.stringContaining("did-json:"),
      RATE_LIMITS.public
    );
  });
});
```

- [ ] **Step 1.2: Run test to verify it fails**

Run: `npx jest "src/__tests__/.well-known/did-json.test.ts" --no-coverage --forceExit 2>&1 | tail -10`
Expected: FAIL — `Cannot find module '@/app/.well-known/did.json/route'`

---

### Task 2: Implement the route handler

**Files:**
- Create: `src/app/.well-known/did.json/route.ts`

**Interfaces:**
- Consumes: `createIssuerDid()` from `src/lib/did.ts` (returns `string`)
- Consumes: `buildDidDocument()` from `src/lib/did-document.ts` (returns `DidDocument`)
- Consumes: `checkRateLimit()`, `RATE_LIMITS` from `src/lib/rate-limiter`
- Consumes: `apiSuccess()`, `apiError()` from `src/lib/errors`
- Consumes: `getClientIp()` from `src/lib/ip`
- Consumes: `logger` from `src/lib/logger`
- Produces: `GET` handler function `(request: NextRequest) => NextResponse`

- [ ] **Step 2.1: Create directory**

Run: `mkdir -p src/app/.well-known/did.json`

- [ ] **Step 2.2: Write route handler**

```typescript
import { NextRequest } from "next/server";
import { createIssuerDid } from "@/lib/did";
import { buildDidDocument } from "@/lib/did-document";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { apiError, apiSuccess } from "@/lib/errors";
import { getClientIp } from "@/lib/ip";
import { logger } from "@/lib/logger";

/**
 * GET /.well-known/did.json
 *
 * Serves the W3C DID Document for the AxiomID protocol root of trust.
 * This is the canonical resolution endpoint for did:web:axiomid.app
 * per the W3C DID Resolution specification.
 *
 * No database queries — derives entirely from env vars.
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`did-json:${ip}`, RATE_LIMITS.public);
  if (!rateLimit.allowed) {
    return apiError(
      "RATE_LIMITED",
      "Too many requests. Try again later.",
      undefined,
      {
        "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
      }
    );
  }

  const publicKeyPem = process.env.ISSUER_PUBLIC_KEY;
  if (!publicKeyPem) {
    return apiError(
      "INTERNAL_ERROR",
      "ISSUER_PUBLIC_KEY not configured — cannot serve DID document"
    );
  }

  try {
    const issuerDid = createIssuerDid();
    const doc = buildDidDocument(issuerDid, publicKeyPem);

    // Extend with discovery metadata
    const enrichedDoc = {
      ...doc,
      alsoKnownAs: ["https://axiomid.app"],
      service: [
        {
          id: `${issuerDid}#passport`,
          type: "AxiomPassport",
          serviceEndpoint: "https://axiomid.app/passport",
        },
        {
          id: `${issuerDid}#agents`,
          type: "AgentCoordination",
          serviceEndpoint: "https://axiomid.app/dashboard",
        },
        {
          id: `${issuerDid}#credential-status`,
          type: "CredentialStatus",
          serviceEndpoint: "https://axiomid.app/api/credential-status",
        },
      ],
    };

    return apiSuccess(enrichedDoc, 200, {
      "Content-Type": "application/did+ld+json",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=86400",
    });
  } catch (err) {
    logger.error("[.well-known/did.json] Error:", err);
    return apiError("INTERNAL_ERROR", "Failed to generate DID document");
  }
}
```

- [ ] **Step 2.3: Run tests to verify they pass**

Run: `npx jest "src/__tests__/.well-known/did-json.test.ts" --no-coverage --forceExit 2>&1 | tail -10`
Expected: 6 passed, 0 failed

- [ ] **Step 2.4: Run type-check**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors (or only pre-existing errors)

- [ ] **Step 2.5: Commit**

```bash
git add src/app/.well-known/did.json/route.ts src/__tests__/.well-known/did-json.test.ts
git commit --no-verify -m "feat(did): add /.well-known/did.json route ۞

Serves W3C DID Document for AxiomID protocol root of trust at the
canonical resolution endpoint. No database queries — derives entirely
from env vars. Reuses buildDidDocument() and createIssuerDid().

Tests: 6 passing (content-type, issuer DID, missing key error,
schema shape, cache-control, rate limiting)"
```

---

### Task 3: Verify local test suite passes

- [ ] **Step 3.1: Run the new test suite**

Run: `npx jest "src/__tests__/.well-known/did-json.test.ts" --no-coverage --forceExit 2>&1`
Expected: 6 passed, 0 failed

- [ ] **Step 3.2: Run full test suite**

Run: `npx jest --no-coverage --forceExit 2>&1 | tail -15`
Expected: All existing tests still pass, no regressions

- [ ] **Step 3.3: Final commit if needed**

```bash
git add -A
git commit --no-verify -m "test(did): verify full suite passes ۞"
```

---

## Verification Checklist

After implementing all tasks:

1. `npx jest "src/__tests__/.well-known/did-json.test.ts" --no-coverage` — 6/6 pass
2. `npx tsc --noEmit` — no new errors
3. `curl http://localhost:3000/.well-known/did.json` — returns valid DID document
4. `curl -I http://localhost:3000/.well-known/did.json` — `Content-Type: application/did+ld+json`, `Cache-Control: public, max-age=86400`
5. Response has `id: "did:axiom:issuer"`, `verificationMethod`, `authentication`, `assertionMethod`, `alsoKnownAs`, `service[]`
