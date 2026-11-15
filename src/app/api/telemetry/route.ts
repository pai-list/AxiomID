import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Attempt upstream gspace telemetry with a short 2.5s timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    const upstream = await fetch("https://gspace.axiomid.app/api/telemetry", {
      cache: "no-store",
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timer);

    if (upstream && upstream.ok) {
      const data = await upstream.json().catch(() => null);
      if (data) {
        return NextResponse.json(data, {
          headers: { "Cache-Control": "no-store, max-age=0" },
        });
      }
    }
  } catch {
    // Upstream unavailable, proceed to local fallback
  }

  // Graceful sovereign fallback
  return NextResponse.json(
    {
      globalWorkspace: {
        attention: 98,
        consciousness: "ACTIVE",
        activeAgents: 1,
        degraded: false,
      },
      fallback: true,
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
