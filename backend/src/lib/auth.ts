/**
 * Auth middleware for Cloudflare Worker.
 * Timing-safe shared-secret verification.
 */

import type { Env } from "./types";

export const PUBLIC_ROUTES = ["/health", "/api/trust/", "/api/skills"];

export function verifyAuth(request: Request, env: Env): { authorized: boolean; agentId?: string } {
  const url = new URL(request.url);
  const agentId = url.searchParams.get("agentId") || undefined;

  const isPublic = PUBLIC_ROUTES.some((r) => url.pathname.startsWith(r));
  if (isPublic) {
    return { authorized: true, agentId };
  }

  const authHeader = request.headers.get("X-Shared-Secret");
  if (!env.SHARED_SECRET_TOKEN_VERCEL_CF || !authHeader) {
    return { authorized: false };
  }

  const secret = env.SHARED_SECRET_TOKEN_VERCEL_CF;
  if (authHeader.length !== secret.length) {
    return { authorized: false };
  }

  let match = 0;
  for (let i = 0; i < authHeader.length; i++) {
    match |= authHeader.charCodeAt(i) ^ secret.charCodeAt(i);
  }

  return { authorized: match === 0, agentId };
}

export function requireAuth(request: Request, env: Env): Response | null {
  const { authorized } = verifyAuth(request, env);
  if (!authorized) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}

export function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "https://axiomid.app",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Shared-Secret",
    },
  });
}

export function errorResponse(message: string, status: number = 400): Response {
  return jsonResponse({ success: false, error: message, timestamp: Date.now() }, status);
}
