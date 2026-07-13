import { useQuery } from "@tanstack/react-query";

interface StatusData {
  status: string;
  services: Record<string, { status: string; latency: number }>;
}

async function fetchStatus(): Promise<StatusData> {
  const [statusRes, healthRes] = await Promise.all([
    fetch("/api/status"),
    fetch("/api/health"),
  ]);
  if (!statusRes.ok || !healthRes.ok) {
    throw new Error("Failed to fetch status");
  }
  const statusData: unknown = await statusRes.json();
  const healthData: unknown = await healthRes.json();

  // Validate response shape
  if (typeof statusData !== "object" || statusData === null) {
    throw new Error("Invalid status response format");
  }
  if (typeof healthData !== "object" || healthData === null) {
    throw new Error("Invalid health response format");
  }

  return {
    ...(statusData as Record<string, unknown>),
    ...(healthData as Record<string, unknown>),
  } as unknown as StatusData;
}

export function useStatus() {
  return useQuery<StatusData>({
    queryKey: ["status"],
    queryFn: fetchStatus,
  });
}
