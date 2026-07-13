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
  const json: unknown = await res.json();

  // Validate response is an array or has a leaderboard property
  let leaderboard: unknown;
  if (typeof json === "object" && json !== null && "leaderboard" in json) {
    leaderboard = (json as { leaderboard: unknown }).leaderboard;
  } else {
    leaderboard = json;
  }

  if (!Array.isArray(leaderboard)) {
    throw new Error("Invalid leaderboard response format");
  }

  return leaderboard as LeaderboardEntry[];
}

export function useLeaderboard() {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
  });
}
