import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { SecurityCenter } from "@/components/os/SecurityCenter";
import { BUS_EVENTS, emit } from "@/components/os/agent-bus";
import { useLanguage } from "@/app/context/language-context";
import { toast } from "sonner";
import { GET as getLlmsTxt } from "@/app/llms.txt/route";

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe("SecurityCenter — 4-Team Cyber Simulation & Desktop Notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    (useLanguage as jest.Mock).mockReturnValue({
      language: "en",
      setLanguage: jest.fn(),
      t: (k: string) => k,
      allConfigs: { en: {}, ar: {}, zh: {}, hi: {} },
    });
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/llms.txt" || url === "/agentic.txt") {
        return new Response("ok", { status: 200 });
      }
      if (url === "/agent.json") {
        return new Response(JSON.stringify({ name: "axiomid", discovery: ["/llms.txt"] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url === "/api/telemetry") {
        return new Response(
          JSON.stringify({ globalWorkspace: { attention: 98, consciousness: "ACTIVE" } }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (url === "/api/agent/activate" || url === "/api/sync" || url === "/api/daily-review") {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      }
      return new Response("Not found", { status: 404 });
    }) as unknown as typeof fetch;
  });

  it("opens the Cyber Defense Center and executes the full 4-team simulation", async () => {
    render(<SecurityCenter />);

    const toggleBtn = screen.getByRole("button", { name: "AuraOS Cyber Defense & Notifications" });
    fireEvent.click(toggleBtn);
    expect(screen.getByRole("dialog", { name: "AuraOS Cyber Defense Center" })).toBeInTheDocument();

    const runAllBtn = screen.getByTestId("run-all-teams-btn");
    await act(async () => {
      fireEvent.click(runAllBtn);
    });

    expect(screen.getByText(/Live Endpoint Matrix \(12\)/)).toBeInTheDocument();
    expect(screen.getAllByText(/PASS 200/).length).toBeGreaterThanOrEqual(8);
    expect(screen.getAllByText(/BLOCKED 401/).length).toBe(4);
    expect(screen.getByTestId("security-notification-count")).toHaveTextContent("1");
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it("flags EXPOSED endpoints when Black Hat exploit receives HTTP 200", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/sync") {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }) as unknown as typeof fetch;

    render(<SecurityCenter />);
    fireEvent.click(screen.getByRole("button", { name: "AuraOS Cyber Defense & Notifications" }));

    await act(async () => {
      fireEvent.click(screen.getByTestId("run-black-hat"));
    });

    expect(screen.getByText(/EXPOSED 200/)).toBeInTheDocument();
    expect(screen.getByText("BREACH DETECTED")).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it("detects raw key leakage in Red Hat audit and renders Arabic UI + clears notifications", async () => {
    window.localStorage.setItem("private_key_leak", "raw_secret");
    (useLanguage as jest.Mock).mockReturnValue({
      language: "ar",
      setLanguage: jest.fn(),
      t: (k: string) => k,
      allConfigs: { en: {}, ar: {}, zh: {}, hi: {} },
    });

    render(<SecurityCenter />);
    fireEvent.click(screen.getByRole("button", { name: "AuraOS Cyber Defense & Notifications" }));

    await act(async () => {
      fireEvent.click(screen.getByTestId("run-red-hat"));
    });

    expect(screen.getByText("مركز محاكاة الأمن السيبراني وإشعارات AuraOS")).toBeInTheDocument();
    expect(screen.getByText(/1 forbidden keys found/)).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledTimes(1);

    act(() => {
      emit(BUS_EVENTS.shieldAlert, "External edge shield notice");
    });
    expect(screen.getByTestId("security-notification-count")).toHaveTextContent("2");

    fireEvent.click(screen.getByTestId("clear-notifications-btn"));
    expect(screen.getByTestId("security-notification-count")).toHaveTextContent("0");
  });

  it("serves GET /llms.txt cleanly with text/plain header", async () => {
    const res = getLlmsTxt();
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/plain");
    const body = await res.text();
    expect(body).toContain("/api/telemetry");
  });
});
