export interface DiagnosticEntry {
  id: string;
  timestamp: string;
  level: "error" | "warn" | "info";
  source: "pi-sdk" | "api" | "auth" | "payment" | "client" | "network";
  message: string;
  details?: Record<string, unknown>;
  url?: string;
  userAgent?: string;
}

const MAX_ENTRIES = 100;
const entries: DiagnosticEntry[] = [];

export function captureDiagnostic(entry: Omit<DiagnosticEntry, "id" | "timestamp">): DiagnosticEntry {
  const full: DiagnosticEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  entries.unshift(full);
  if (entries.length > MAX_ENTRIES) entries.pop();
  console.error("[DIAG] %s [%s] %s", entry.level.toUpperCase(), entry.source, entry.message, entry.details);
  return full;
}

export function getDiagnostics(limit = 50): DiagnosticEntry[] {
  return entries.slice(0, limit);
}

export function clearDiagnostics(): void {
  entries.length = 0;
}
