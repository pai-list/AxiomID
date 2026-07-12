import { useMutation, useQueryClient } from "@tanstack/react-query";

interface SocialDisconnectPayload {
  provider: string;
}

async function socialDisconnect(payload: SocialDisconnectPayload): Promise<void> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch("/api/social/disconnect", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to disconnect social account");
}

export function useSocialDisconnect() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, SocialDisconnectPayload>({
    mutationFn: socialDisconnect,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet-status"] });
    },
  });
}
