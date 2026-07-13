import { useQuery } from "@tanstack/react-query";

interface SpendRequest {
  id: string;
  amount: string;
  status: string;
  memo: string;
  createdAt: string;
}

async function fetchSpendRequests(): Promise<SpendRequest[]> {
  const headers: Record<string, string> = {};
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch("/api/spend-request?status=pending", { headers });
  if (!res.ok) throw new Error("Failed to fetch spend requests");
  const json: unknown = await res.json();

  // Validate response shape
  let requests: unknown;
  if (typeof json === "object" && json !== null && "requests" in json) {
    requests = (json as { requests: unknown }).requests;
  } else {
    requests = json;
  }

  if (!Array.isArray(requests)) {
    throw new Error("Invalid spend requests response format");
  }

  return requests as SpendRequest[];
}

export function useSpendRequests() {
  return useQuery<SpendRequest[]>({
    queryKey: ["spend-requests"],
    queryFn: fetchSpendRequests,
    refetchInterval: 15_000,
  });
}
