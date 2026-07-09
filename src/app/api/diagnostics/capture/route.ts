import { NextRequest } from "next/server";
import { captureDiagnostic } from "@/lib/diagnostics/capture";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { level, source, message, details, url } = body;

    if (!message || !source) {
      return Response.json({ error: "message and source required" }, { status: 400 });
    }

    const entry = captureDiagnostic({
      level: level || "error",
      source: source || "client",
      message,
      details,
      url: url || req.headers.get("referer") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return Response.json({ ok: true, id: entry.id });
  } catch {
    return Response.json({ error: "Failed to capture diagnostic" }, { status: 500 });
  }
}
