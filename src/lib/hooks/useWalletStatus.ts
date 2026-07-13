import { useQuery } from "@tanstack/react-query";

interface WalletStatus {
  userId: string;
  piUsername: string;
  tier: string;
  xp: number;
  kycStatus: string;
  agent: {
    id: string;
    publicId: string;
    name: string;
    status: string;
    mode: string;
  } | null;
  [key: string]: unknown;
}

async function fetchWalletStatus(): Promise<WalletStatus> {
  const headers: Record<string, string> = {};
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch("/api/user/status", { headers });
  if (!res.ok) throw new Error("Failed to fetch wallet status");
  const data: unknown = await res.json();

  // Validate response shape
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid wallet status response format");
  }

  return data as WalletStatus;
}

export function useWalletStatus() {
  return useQuery<WalletStatus>({
    queryKey: ["wallet-status"],
    queryFn: fetchWalletStatus,
  });
}
