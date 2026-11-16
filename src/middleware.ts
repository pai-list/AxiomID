import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MAX_REQUEST_BODY_BYTES = 1024 * 1024; // 1MB

const ROOT_DOMAIN = "axiomid.app";

const RESERVED_SUBDOMAINS = new Set([
  "www", "api", "mail", "app", "admin", "dashboard",
  "docs", "openid", "blog", "status", "cdn", "assets", "static", "build",
  "memory", "harness", "gspace", "skills", "earn", "hub", "auth",
  "aip", "ppp", "mcp", "testnet",
  "index", "node", "learn", "agdp", "piverify", "signaling",
  "verifier", "verify", "discover", "agent", "dev-portal", "deploy",
  "jobs", "email", "pai-docs", "pai-website", "connect", "pay",
  "youtube", "facebook", "twitter", "images", "video", "truth",
  "horizon", "scope", "send"
]);

const PRODUCTION_PREVIEW_ANCHOR = "axiomid-app-axiom-id.vercel.app";
const VERCEL_PREVIEW_HOST =
  process.env.VERCEL_PREVIEW_HOST ||
  (process.env.VERCEL_URL ? process.env.VERCEL_URL.replace(/:\d+$/, "") : null);

const CORS_ALLOWED_ORIGINS = [
  "https://axiomid.app",
  "https://www.axiomid.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "https://axiomid.vercel.app",
  `https://${PRODUCTION_PREVIEW_ANCHOR}`,
  "https://app.minepi.com",
  "https://sandbox.minepi.com",
];

function isAllowedHost(host: string): boolean {
  const plain = host.replace(/:\d+$/, ""); // strip port
  if (plain === "localhost" || plain === "127.0.0.1") return true;
  if (plain === ROOT_DOMAIN || plain === `www.${ROOT_DOMAIN}`) return true;
  if (plain.endsWith(`.${ROOT_DOMAIN}`)) return true;
  // Security hardening: .vercel.app hosts are NOT allowed by default (wildcard removed).
  // Dynamic preview host from Vercel environment or configured preview anchor:
  if (VERCEL_PREVIEW_HOST && plain === VERCEL_PREVIEW_HOST) return true;
  if (plain === PRODUCTION_PREVIEW_ANCHOR) return true;
  return false;
}

function getAllowedOrigin(origin: string | null): string | null {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    const host = url.hostname;
    if (host === ROOT_DOMAIN || host.endsWith(`.${ROOT_DOMAIN}`)) return origin;
    if (CORS_ALLOWED_ORIGINS.includes(origin)) return origin;
    if (host === "localhost" || host === "127.0.0.1") return origin;
    if (VERCEL_PREVIEW_HOST && (host === VERCEL_PREVIEW_HOST || origin === `https://${VERCEL_PREVIEW_HOST}`)) return origin;
    // Security hardening: no .vercel.app wildcard — only explicit or configured preview hosts are allowed.
  } catch {
    // invalid origin
  }
  return null;
}

function applyCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get("origin");
  const allowedOrigin = getAllowedOrigin(origin);
  if (allowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Shared-Secret");
    response.headers.set("Access-Control-Max-Age", "86400");
    response.headers.set("Vary", "Origin");
  }
  return response;
}

export function middleware(request: NextRequest) {
  const withCors = (response: NextResponse) => applyCorsHeaders(response, request);

  if (request.method === "OPTIONS") {
    return withCors(new NextResponse(null, { status: 204 }));
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_REQUEST_BODY_BYTES) {
    return withCors(new NextResponse("Request body too large", { status: 413 }));
  }

  const host = request.headers.get("host") || "";

  if (!isAllowedHost(host)) {
    return withCors(new NextResponse("Invalid host", { status: 403 }));
  }

  const url = request.nextUrl;

  if (url.pathname === "/.well-known/did.json") {
    url.pathname = "/api/did-document";
    return withCors(NextResponse.rewrite(url));
  }

  if (url.pathname === "/settings") {
    return withCors(NextResponse.redirect(new URL("/dashboard/settings", request.url)));
  }

  if (url.pathname === "/login" || url.pathname === "/register") {
    return withCors(NextResponse.redirect(new URL("/claim", request.url)));
  }

  const isSubdomain =
    host.endsWith(`.${ROOT_DOMAIN}`) &&
    host !== `www.${ROOT_DOMAIN}` &&
    host !== ROOT_DOMAIN;

  if (isSubdomain) {
    if (!url.pathname.startsWith("/api/")) {
      const plainHost = host.replace(/:\d+$/, '');
      const subdomain = plainHost.replace('.' + ROOT_DOMAIN, '');
      
      if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(subdomain) || subdomain.length > 63) {
        return withCors(new NextResponse("Invalid subdomain", { status: 400 }));
      }
      
      if (RESERVED_SUBDOMAINS.has(subdomain.toLowerCase())) {
        return withCors(new NextResponse("Subdomain not available", { status: 404 }));
      }
      
      // AGENT SUBDOMAIN: Seamlessly rewrite username.axiomid.app to /agent/username
      url.pathname = `/agent/${subdomain}`;
      return withCors(NextResponse.rewrite(url));
    }
  }

  return withCors(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon-.*|validation-key.txt).*)",
  ],
};