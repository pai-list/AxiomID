import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MAX_REQUEST_BODY_BYTES = 1024 * 1024; // 1MB

const ROOT_DOMAIN = "axiomid.app";

const CORS_ALLOWED_ORIGINS = [
  "https://axiomid.app",
  "https://www.axiomid.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "https://axiomid.vercel.app",
];

function isAllowedHost(host: string): boolean {
  const plain = host.replace(/:\d+$/, ""); // strip port
  if (plain === "localhost" || plain === "127.0.0.1") return true;
  if (plain === ROOT_DOMAIN || plain === `www.${ROOT_DOMAIN}`) return true;
  if (plain.endsWith(`.${ROOT_DOMAIN}`)) return true;
  if (plain.endsWith(".vercel.app") && plain.includes("axiomid")) return true;
  return false;
}

function getAllowedOrigin(origin: string | null): string | null {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    const host = url.hostname;
    // Same-origin: always allow
    if (host === ROOT_DOMAIN || host.endsWith(`.${ROOT_DOMAIN}`)) return origin;
    // Explicit allowlist
    if (CORS_ALLOWED_ORIGINS.includes(origin)) return origin;
    // Localhost in dev
    if (host === "localhost" || host === "127.0.0.1") return origin;
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
  }
  return response;
}

export function middleware(request: NextRequest) {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    return applyCorsHeaders(response, request);
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_REQUEST_BODY_BYTES) {
    return new NextResponse("Request body too large", { status: 413 });
  }

  const host = request.headers.get("host") || "";

  // Validate host against allowlist
  if (!isAllowedHost(host)) {
    return new NextResponse("Invalid host", { status: 403 });
  }

  const url = request.nextUrl;

  // Rewrite /.well-known/did.json to the DID document API route
  if (url.pathname === "/.well-known/did.json") {
    url.pathname = "/api/did-document";
    return NextResponse.rewrite(url);
  }

  // Check if this is a subdomain request (e.g., alice.axiomid.app)
  const rootDomain = ROOT_DOMAIN;
  const isSubdomain =
    host.endsWith(`.${rootDomain}`) &&
    host !== `www.${rootDomain}` &&
    host !== rootDomain;

  if (isSubdomain && !url.pathname.startsWith("/api/")) {
    const subdomain = host.replace(`.${rootDomain}`, "");
    // Sanitize subdomain: alphanumeric + hyphens only (reject leading/trailing hyphens)
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(subdomain) || subdomain.length > 63) {
      return new NextResponse("Invalid subdomain", { status: 400 });
    }
    // Rewrite to passport page with the subdomain as slug
    url.pathname = `/passport/${subdomain}`;
    return NextResponse.rewrite(url);
  }

  const response = NextResponse.next();
  return applyCorsHeaders(response, request);
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|icon-.*|validation-key.txt).*)",
  ],
};
