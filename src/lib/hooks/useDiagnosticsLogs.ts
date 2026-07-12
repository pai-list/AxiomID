import { useQuery } from "@tanstack/react-query";

interface LogEntry {
  id: string;
  level: string;
  message: string;
  timestamp: string;
}

async function fetchDiagnosticsLogs(): Promise<LogEntry[]> {
  const res = await fetch("/api/diagnostics/logs");
  if (!res.ok) throw new Error("Failed to fetch diagnostics logs");
  return res.json();
}

export function useDiagnosticsLogs() {
  return useQuery<LogEntry[]>({
    queryKey: ["diagnostics-logs"],
    queryFn: fetchDiagnosticsLogs,
    refetchInterval: 10_000,
  });
}
