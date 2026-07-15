import { useQuery } from "@tanstack/react-query";

interface ExplorerEntry {
  id: string;
  name: string;
  type: string;
  status: string;
}

async function fetchExplorer(): Promise<ExplorerEntry[]> {
  const res = await fetch("/api/explorer");
  if (!res.ok) throw new Error("Failed to fetch explorer data");
  const json = await res.json();
  return json.data ?? json;
}

export function useExplorer() {
  return useQuery<ExplorerEntry[]>({
    queryKey: ["explorer"],
    queryFn: fetchExplorer,
  });
}
