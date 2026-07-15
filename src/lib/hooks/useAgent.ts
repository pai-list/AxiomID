import { useQuery } from "@tanstack/react-query";

interface AgentData {
  username: string;
  displayName: string;
  metrics: Record<string, number>;
  [key: string]: unknown;
}

async function fetchAgent(username: string): Promise<AgentData> {
  const res = await fetch(`/api/agent/public?username=${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error("Failed to fetch agent data");
  return res.json();
}

export function useAgent(username: string) {
  return useQuery<AgentData>({
    queryKey: ["agent", username],
    queryFn: () => fetchAgent(username),
    enabled: !!username,
  });
}
