import { getDiagnostics, clearDiagnostics } from "@/lib/diagnostics/capture";

export async function GET() {
  const entries = getDiagnostics(50);
  return Response.json({ count: entries.length, entries });
}

export async function DELETE() {
  clearDiagnostics();
  return Response.json({ ok: true, message: "Diagnostics cleared" });
}
