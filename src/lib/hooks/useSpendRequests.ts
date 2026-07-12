import { useQuery } from "@tanstack/react-query";

interface SpendRequest {
  id: string;
  amount: string;
  status: string;
  memo: string;
  createdAt: string;
}

async function fetchSpendRequests(): Promise<SpendRequest[]> {
  const res = await fetch("/api/spend-request?status=pending");
  if (!res.ok) throw new Error("Failed to fetch spend requests");
  const json = await res.json();
  return json.requests ?? json;
}

export function useSpendRequests() {
  return useQuery<SpendRequest[]>({
    queryKey: ["spend-requests"],
    queryFn: fetchSpendRequests,
    refetchInterval: 15_000,
  });
}
