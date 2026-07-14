import { useMutation, useQueryClient } from "@tanstack/react-query";

interface PublishSkillPayload {
  name: string;
  category: string;
  description?: string;
}

async function publishSkill(payload: PublishSkillPayload): Promise<void> {
  const res = await fetch("/api/skills/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to publish skill");
}

export function usePublishSkill() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, PublishSkillPayload>({
    mutationFn: publishSkill,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });
}
