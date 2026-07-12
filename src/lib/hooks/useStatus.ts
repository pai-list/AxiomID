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
  const statusData = await statusRes.json();
  const healthData = await healthRes.json();
  return { ...statusData, ...healthData };
}

export function useStatus() {
  return useQuery<StatusData>({
    queryKey: ["status"],
    queryFn: fetchStatus,
  });
}
