import { render, screen } from "@testing-library/react";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/query-client";

function TestComponent() {
  const queryClient = useQueryClient();
  const defaults = queryClient.getDefaultOptions();
  return (
    <div data-testid="client-ready">
      {defaults.queries?.staleTime ? "configured" : "no-config"}
    </div>
  );
}

describe("makeQueryClient", () => {
  it("creates a query client with default options", () => {
    const queryClient = makeQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );
    expect(screen.getByTestId("client-ready")).toHaveTextContent("configured");
  });

  it("creates a client with 30s stale time", () => {
    const client = makeQueryClient();
    const options = client.getDefaultOptions();
    expect(options.queries?.staleTime).toBe(30_000);
  });

  it("creates a client with 5min gc time", () => {
    const client = makeQueryClient();
    const options = client.getDefaultOptions();
    expect(options.queries?.gcTime).toBe(5 * 60_000);
  });

  it("creates a client with retry 2", () => {
    const client = makeQueryClient();
    const options = client.getDefaultOptions();
    expect(options.queries?.retry).toBe(2);
  });
});
