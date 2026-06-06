/**
 * @jest-environment node
 */
// validate.test.ts — Zod middleware wrapper tests (RULE 1)

import { NextRequest } from "next/server";
import { z } from "zod";
import { withValidation, withQueryValidation, validate } from "@/lib/validate";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeGetRequest(params: Record<string, string>): NextRequest {
  const qs = new URLSearchParams(params).toString();
  return new NextRequest(`http://localhost/api/test?${qs}`, { method: "GET" });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

const UserSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().min(0),
});

describe("withValidation", () => {
  it("calls handler with typed data on valid body", async () => {
    const handler = withValidation(UserSchema, async (data) => {
      return Response.json({ received: data.name }) as any;
    });

    const req = makePostRequest({ name: "Moe", age: 25 });
    const res = await handler(req as NextRequest);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.received).toBe("Moe");
  });

  it("returns 400 on schema violation", async () => {
    const handler = withValidation(UserSchema, async () => Response.json({}) as any);
    const req = makePostRequest({ name: "", age: -1 });
    const res = await handler(req as NextRequest);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 on invalid JSON", async () => {
    const handler = withValidation(UserSchema, async () => Response.json({}) as any);
    const req = new NextRequest("http://localhost/api/test", {
      method: "POST",
      body: "not-json",
    });
    const res = await handler(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
  });
});

const QuerySchema = z.object({
  userId: z.string().uuid(),
});

describe("withQueryValidation", () => {
  it("calls handler with typed query on valid params", async () => {
    const handler = withQueryValidation(QuerySchema, async (data) => {
      return Response.json({ id: data.userId }) as any;
    });

    const req = makeGetRequest({ userId: "550e8400-e29b-41d4-a716-446655440000" });
    const res = await handler(req);
    expect(res.status).toBe(200);
  });

  it("returns 400 on invalid UUID", async () => {
    const handler = withQueryValidation(QuerySchema, async () => Response.json({}) as any);
    const req = makeGetRequest({ userId: "not-a-uuid" });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });
});

describe("validate (standalone)", () => {
  it("returns typed data on success", () => {
    const data = validate(UserSchema, { name: "Moe", age: 25 });
    expect(data.name).toBe("Moe");
  });

  it("throws ZodError on failure", () => {
    expect(() => validate(UserSchema, { name: "", age: -1 })).toThrow();
  });
});
