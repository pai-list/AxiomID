import { useQuery } from "@tanstack/react-query";

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  avatar?: string;
}

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await fetch("/api/leaderboard");
  if (!res.ok) throw new Error("Failed to fetch leaderboard");
  const json = await res.json();
  return json.leaderboard ?? json;
}

export function useLeaderboard() {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
  });
}
