import { useQuery } from "@tanstack/react-query";

interface MemoryEntry {
  id: string;
  content: string;
  timestamp: string;
  type: string;
}

async function fetchMemory(): Promise<MemoryEntry[]> {
  const res = await fetch("/api/memory?limit=10");
  if (!res.ok) throw new Error("Failed to fetch memory");
  const json = await res.json();
  return json.memories ?? json;
}

export function useMemory() {
  return useQuery<MemoryEntry[]>({
    queryKey: ["memory"],
    queryFn: fetchMemory,
  });
}
