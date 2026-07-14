import { useQuery } from "@tanstack/react-query";

interface SkillEntry {
  id: string;
  name: string;
  category: string;
  confidence: number;
}

async function fetchSkills(): Promise<SkillEntry[]> {
  const res = await fetch("/api/skills?limit=20");
  if (!res.ok) throw new Error("Failed to fetch skills");
  const json = await res.json();
  return json.skills ?? json;
}

export function useSkills() {
  return useQuery<SkillEntry[]>({
    queryKey: ["skills"],
    queryFn: fetchSkills,
  });
}
