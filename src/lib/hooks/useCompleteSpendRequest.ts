import { useMutation, useQueryClient } from "@tanstack/react-query";

interface SpendRequest {
  id: string;
  amount: string;
  status: string;
  memo: string;
  createdAt: string;
}

async function completeSpendRequest(id: string): Promise<void> {
  const res = await fetch("/api/spend-request/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Failed to complete spend request");
}

export function useCompleteSpendRequest() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { previous: SpendRequest[] | undefined }>({
    mutationFn: completeSpendRequest,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["spend-requests"] });
      const previous = queryClient.getQueryData<SpendRequest[]>(["spend-requests"]);
      queryClient.setQueryData<SpendRequest[]>(["spend-requests"], (old) => {
        if (!Array.isArray(old)) return [];
        return old.filter((req) => req.id !== id);
      });
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["spend-requests"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["spend-requests"] });
    },
  });
}
