import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Attempt upstream gspace telemetry with a short 2.5s timeout. The timer
  // stays active through JSON body consumption so a stalled response body
  // is aborted and we fall back promptly.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);

  try {
    const upstream = await fetch("https://gspace.axiomid.app/api/telemetry", {
      cache: "no-store",
      signal: controller.signal,
    }).catch(() => null);

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
  } finally {
    clearTimeout(timer);
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
