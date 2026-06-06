/**
 * validate.ts — Universal Zod validation middleware for Next.js API routes.
 *
 * RULE 1: كل input → Zod validation قبل أي processing
 *
 * Usage:
 *   export const POST = withValidation(MySchema, async (data, request) => {
 *     // data is fully typed and validated
 *     return apiSuccess({ ok: true });
 *   });
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";
import { apiError } from "@/lib/errors";

// ─── Types ───────────────────────────────────────────────────────────────────

type ValidatedHandler<T> = (
  data: T,
  request: NextRequest
) => Promise<NextResponse>;

// ─── Body Validation Middleware ───────────────────────────────────────────────

/**
 * withValidation — wraps a POST/PUT handler with Zod body validation.
 *
 * Returns 400 with structured error if validation fails.
 * Prevents handler from running until body is proven safe.
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: ValidatedHandler<T>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return apiError("VALIDATION_ERROR", "Invalid JSON body") as NextResponse;
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return apiError(
        "VALIDATION_ERROR",
        first?.message ?? "Validation failed",
        parsed.error.issues
      ) as NextResponse;
    }

    return handler(parsed.data, request);
  };
}

// ─── Query Params Validation ──────────────────────────────────────────────────

/**
 * withQueryValidation — wraps a GET handler with Zod query param validation.
 *
 * Extracts all search params as a plain object before validating.
 */
export function withQueryValidation<T>(
  schema: ZodSchema<T>,
  handler: ValidatedHandler<T>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { searchParams } = new URL(request.url);
    const raw: Record<string, string> = {};
    searchParams.forEach((v, k) => { raw[k] = v; });

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return apiError(
        "VALIDATION_ERROR",
        first?.message ?? "Query validation failed",
        parsed.error.issues
      ) as NextResponse;
    }

    return handler(parsed.data, request);
  };
}

// ─── Standalone validator (for use in non-route contexts) ─────────────────────

/**
 * validate — throws structured error on failure; returns typed data on success.
 */
export function validate<T>(schema: ZodSchema<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ZodError(result.error.issues);
  }
  return result.data;
}
