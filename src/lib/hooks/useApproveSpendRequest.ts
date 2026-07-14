import { useMutation, useQueryClient } from "@tanstack/react-query";

interface SpendRequest {
  id: string;
  amount: string;
  status: string;
  memo: string;
  createdAt: string;
}

async function approveSpendRequest(id: string): Promise<void> {
  const res = await fetch("/api/spend-request/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Failed to approve spend request");
}

export function useApproveSpendRequest() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { previous: SpendRequest[] | undefined }>({
    mutationFn: approveSpendRequest,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["spend-requests"] });
      const previous = queryClient.getQueryData<SpendRequest[]>(["spend-requests"]);
      queryClient.setQueryData<SpendRequest[]>(["spend-requests"], (old) => {
        if (!Array.isArray(old)) return [];
        return old.map((req) =>
          req.id === id ? { ...req, status: "approved" } : req,
        );
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
