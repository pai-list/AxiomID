import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const url = request.nextUrl;

  // Check if this is a subdomain request (e.g., alice.axiomid.app)
  const rootDomain = "axiomid.app";
  const isSubdomain =
    host.endsWith(`.${rootDomain}`) &&
    host !== `www.${rootDomain}` &&
    host !== rootDomain;

  if (isSubdomain) {
    const subdomain = host.replace(`.${rootDomain}`, "");
    // Rewrite to passport page with the subdomain as slug
    url.pathname = `/passport/${subdomain}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|icon-.*|validation-key.txt|api/).*)",
  ],
};
