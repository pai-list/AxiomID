import { getDiagnostics, clearDiagnostics } from "@/lib/diagnostics/capture";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const entries = getDiagnostics(50);
    return Response.json({ count: entries.length, entries });
  } catch (err) {
    logger.error("[DIAGNOSTICS] Failed to get diagnostics logs", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    clearDiagnostics();
    return Response.json({ ok: true, message: "Diagnostics cleared" });
  } catch (err) {
    logger.error("[DIAGNOSTICS] Failed to clear diagnostics logs", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
