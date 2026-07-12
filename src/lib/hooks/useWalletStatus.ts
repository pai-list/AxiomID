import { useQuery } from "@tanstack/react-query";

interface WalletStatus {
  piUid: string;
  username: string;
  tier: string;
  xp: number;
  kycStatus: string;
  hasAgent: boolean;
  [key: string]: unknown;
}

async function fetchWalletStatus(): Promise<WalletStatus> {
  const headers: Record<string, string> = {};
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch("/api/user/status", { headers });
  if (!res.ok) throw new Error("Failed to fetch wallet status");
  return res.json();
}

export function useWalletStatus() {
  return useQuery<WalletStatus>({
    queryKey: ["wallet-status"],
    queryFn: fetchWalletStatus,
  });
}
