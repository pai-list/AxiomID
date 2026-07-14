import { useQuery } from "@tanstack/react-query";

interface PassportData {
  username: string;
  displayName: string;
  bio: string;
  avatar?: string;
  badges: string[];
  trustScore: number;
  [key: string]: unknown;
}

async function fetchPassport(slug: string): Promise<PassportData> {
  const res = await fetch(`/api/passport/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error("Failed to fetch passport");
  return res.json();
}

export function usePassport(slug: string) {
  return useQuery<PassportData>({
    queryKey: ["passport", slug],
    queryFn: () => fetchPassport(slug),
    enabled: !!slug,
  });
}
