import { useMutation, useQueryClient } from "@tanstack/react-query";

interface AuthPayload {
  authToken: string;
  userUid: string;
}

interface AuthResponse {
  userId: string;
  walletAddress: string;
  stellarAddress: string;
  piUid: string;
  piUsername: string;
  tier: string;
  xp: number;
  did: string;
  kycStatus: string;
  hasAgent: boolean;
}

async function authenticate(payload: AuthPayload): Promise<AuthResponse> {
  const res = await fetch("/api/auth/pi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Authentication failed");
  return res.json();
}

export function useAuth() {
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, Error, AuthPayload>({
    mutationFn: authenticate,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet-status"] });
    },
  });
}
