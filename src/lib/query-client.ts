import { QueryClient } from "@tanstack/react-query";

let browserQueryClient: QueryClient | undefined;

function makeQueryClientBase(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 2,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    return makeQueryClientBase();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClientBase();
  }
  return browserQueryClient;
}

export { makeQueryClientBase as makeQueryClient };
