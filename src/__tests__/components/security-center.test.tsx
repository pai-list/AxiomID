import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { SecurityCenter } from "@/components/os/SecurityCenter";
import { DesktopIcons } from "@/components/os/DesktopIcons";
import { DesktopTaskbar } from "@/components/os/DesktopTaskbar";
import { DesktopWindowManager } from "@/components/os/DesktopWindowManager";
import { StatusBar } from "@/components/os/StatusBar";
import { WallpaperMenu } from "@/components/os/WallpaperMenu";
import { WALLPAPER_STORAGE_KEY } from "@/lib/wallpapers";
import { DESKTOP_APP_IDS, MCP_APPS_CATALOG } from "@/components/os/mcp-apps-catalog";
import { SUBDOMAINS_CATALOG } from "@/components/os/subdomains-catalog";
import { BUS_EVENTS, emit } from "@/components/os/agent-bus";
import { useLanguage } from "@/app/context/language-context";
import { getTranslation } from "@/i18n";
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
      if (url === "/mcp.json") {
        return new Response(
          JSON.stringify({
            name: "pai-universe-hub",
            protocol: "publicmcp",
            ecosystems: ["vercel", "cloudflare", "pi-network", "google"],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
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

  it("opens AI Terminal, AI Notes, and AI Agents AuraOS desktop windows when clicked", async () => {
    render(
      <>
        <DesktopIcons
          labels={{
            agents: "AI Agents",
            notes: "AI Notes",
            terminal: "AI Terminal",
            settings: "Settings",
            soon: "Soon",
          }}
        />
        <DesktopWindowManager />
      </>,
    );

    fireEvent.click(screen.getByRole("link", { name: "AI Terminal" }));
    expect(screen.getByTestId("desktop-window-terminal")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "truth-check" }));
    });
    expect(screen.getByText(/PASS \/api\/telemetry -> HTTP 200/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "AI Notes" }));
    expect(screen.getByTestId("desktop-window-notes")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Note title/i), {
      target: { value: "Quantum Note" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write knowledge/i), {
      target: { value: "Stored locally in AuraOS" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Note" }));
    expect(screen.getByText("Quantum Note")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "AI Agents" }));
    expect(screen.getByTestId("desktop-window-agents")).toBeInTheDocument();
  });

  it("triggers quad-lingual EN/AR/ZH/HI switches in StatusBar and renders Arabic & Hindi desktop labels", () => {
    const setLanguage = jest.fn();
    (useLanguage as jest.Mock).mockImplementation(() => ({
      language: "ar",
      setLanguage,
      t: (k: string) => getTranslation("ar", k),
      allConfigs: { en: {}, ar: {}, zh: {}, hi: {} },
    }));

    const { rerender } = render(
      <>
        <StatusBar />
        <DesktopIcons labels={{ agents: "Agents", soon: "Soon" }} />
      </>,
    );

    expect(screen.getByRole("link", { name: "الطرفية الذكية" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ملاحظات الذكاء الاصطناعي" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "وكلاء الذكاء الاصطناعي" })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("lang-btn-zh"));
    fireEvent.click(screen.getByTestId("lang-btn-hi"));
    fireEvent.click(screen.getByTestId("lang-btn-en"));
    expect(setLanguage).toHaveBeenCalledWith("zh");
    expect(setLanguage).toHaveBeenCalledWith("hi");
    expect(setLanguage).toHaveBeenCalledWith("en");

    (useLanguage as jest.Mock).mockImplementation(() => ({
      language: "hi",
      setLanguage,
      t: (k: string) => getTranslation("hi", k),
      allConfigs: { en: {}, ar: {}, zh: {}, hi: {} },
    }));

    rerender(
      <>
        <StatusBar />
        <DesktopIcons labels={{ agents: "Agents", soon: "Soon" }} />
      </>,
    );
    expect(screen.getByRole("link", { name: "AI टर्मिनल" })).toBeInTheDocument();
  });

  it("renders flagship live subdomain desktop icons and interactive Subdomains Explorer in 4 languages", () => {
    expect(SUBDOMAINS_CATALOG).toHaveLength(16);
    for (const entry of SUBDOMAINS_CATALOG) {
      for (const locale of ["en", "ar", "zh", "hi"] as const) {
        expect(entry.locales[locale].name.trim().length).toBeGreaterThan(0);
        expect(entry.locales[locale].tagline.trim().length).toBeGreaterThan(0);
      }
    }

    (useLanguage as jest.Mock).mockImplementation(() => ({
      language: "en",
      setLanguage: jest.fn(),
      t: (k: string) => getTranslation("en", k),
      allConfigs: { en: {}, ar: {}, zh: {}, hi: {} },
    }));

    render(
      <>
        <DesktopIcons labels={{ agents: "AI Agents", soon: "Soon" }} />
        <DesktopWindowManager />
        <DesktopTaskbar />
      </>,
    );

    expect(screen.getByRole("link", { name: "PAI Gspace" })).toHaveAttribute(
      "href",
      "https://gspace.axiomid.app",
    );
    expect(screen.getByRole("link", { name: "PAI Skills" })).toHaveAttribute(
      "href",
      "https://skills.axiomid.app",
    );
    expect(screen.getByRole("link", { name: "MCP Gateway" })).toHaveAttribute(
      "href",
      "https://mcp.axiomid.app",
    );
    expect(screen.getByRole("link", { name: "PAI Earn" })).toHaveAttribute(
      "href",
      "https://earn.axiomid.app",
    );
    expect(screen.getByRole("link", { name: "PAI Learn" })).toHaveAttribute(
      "href",
      "https://learn.axiomid.app",
    );

    fireEvent.click(screen.getByRole("link", { name: "Subdomains" }));
    expect(screen.getByTestId("desktop-window-subdomains")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("subdomains-search-input"), {
      target: { value: "gspace.axiomid.app" },
    });
    expect(screen.getAllByText("gspace.axiomid.app").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("mail.axiomid.app")).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId("subdomains-search-input"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByTestId("subdomain-cat-protocol"));
    expect(screen.getAllByText("ppp.axiomid.app").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("auth.axiomid.app")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("subdomain-cat-all"));
    fireEvent.change(screen.getByTestId("subdomains-search-input"), {
      target: { value: "harness.axiomid.app" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Open Window" }));
    expect(screen.getByTestId("desktop-window-terminal")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "AI Terminal" })).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("desktop-window-terminal")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "AI Terminal" })).toHaveAttribute("aria-selected", "false");

    fireEvent.click(screen.getByRole("tab", { name: "AI Terminal" }));
    expect(screen.getByTestId("desktop-window-terminal")).toBeInTheDocument();
  });

  it("opens PAI Gspace natively from desktop icon and switches themes via StatusBar button", async () => {
    const dispatched: string[] = [];
    const onTheme = (e: Event) => dispatched.push((e as CustomEvent<string>).detail);
    window.addEventListener("aura:wallpaper", onTheme);

    (useLanguage as jest.Mock).mockImplementation(() => ({
      language: "en",
      setLanguage: jest.fn(),
      t: (k: string) => getTranslation("en", k),
      allConfigs: { en: {}, ar: {}, zh: {}, hi: {} },
    }));

    render(
      <>
        <StatusBar />
        <DesktopIcons labels={{ agents: "AI Agents", soon: "Soon" }} />
        <DesktopWindowManager />
        <DesktopTaskbar />
        <WallpaperMenu />
      </>,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole("link", { name: "PAI Gspace" }));
    expect(screen.getByTestId("desktop-window-gspace")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "PAI Gspace" })).toHaveAttribute("aria-selected", "true");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Sync Telemetry" }));
      await Promise.resolve();
      await Promise.resolve();
    });

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("desktop-window-gspace")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "PAI Gspace" })).toHaveAttribute("aria-selected", "false");

    fireEvent.click(screen.getByRole("tab", { name: "PAI Gspace" }));
    expect(screen.getByTestId("desktop-window-gspace")).toBeInTheDocument();

    const themeBtn = screen.getByTestId("theme-switcher-btn");
    expect(themeBtn).toHaveTextContent("Aurora");
    fireEvent.click(themeBtn);
    const wallpaperMenu = screen.getByRole("menu", { name: "Wallpaper" });
    expect(wallpaperMenu).toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitemradio", { name: "Deep Space" }));
    expect(localStorage.getItem(WALLPAPER_STORAGE_KEY)).toBe("deep-space");
    expect(dispatched).toEqual(["deep-space"]);
    expect(themeBtn).toHaveTextContent("Deep Space");

    window.removeEventListener("aura:wallpaper", onTheme);
  });

  it("opens all 15 desktop icons as MCP App Windows with Vercel, Cloudflare, Pi Network, and Google tools", async () => {
    expect(DESKTOP_APP_IDS).toHaveLength(15);
    for (const appId of DESKTOP_APP_IDS) {
      const spec = MCP_APPS_CATALOG[appId];
      expect(spec.mcpServer).toMatch(/^mcp:\/\//);
      expect(["vercel", "cloudflare", "pi-network", "google"]).toContain(spec.primaryEcosystem);
      for (const locale of ["en", "ar", "zh", "hi"] as const) {
        expect(spec.locales[locale].windowTitle.length).toBeGreaterThan(0);
        expect(spec.locales[locale].mcpSummary.length).toBeGreaterThan(0);
      }
    }

    (useLanguage as jest.Mock).mockImplementation(() => ({
      language: "en",
      setLanguage: jest.fn(),
      t: (k: string) => getTranslation("en", k),
      allConfigs: { en: {}, ar: {}, zh: {}, hi: {} },
    }));

    render(
      <>
        <DesktopIcons
          labels={{
            agents: "AI Agents",
            code: "AI Code",
            files: "Cloud Files",
            automation: "Automation",
            autopilot: "Autopilot",
            assistant: "AI Assistant",
            soon: "Soon",
          }}
        />
        <DesktopWindowManager />
        <DesktopTaskbar />
      </>,
    );

    // Click PAI Skills icon -> opens MCP App Studio Window for Skills
    fireEvent.click(screen.getByRole("link", { name: "PAI Skills" }));
    expect(screen.getByTestId("desktop-window-skills")).toBeInTheDocument();
    expect(screen.getByTestId("mcp-app-toolbar")).toHaveTextContent("mcp://pai-skills/registry");
    expect(screen.getByTestId("mcp-studio-skills")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId("run-mcp-tool-btn"));
    });
    expect(screen.getByTestId("mcp-jsonrpc-output")).toHaveTextContent("JSON-RPC 2.0 OK (200)");
    expect(screen.getByTestId("mcp-jsonrpc-output")).toHaveTextContent("pi_kyc_verify");

    // Click AI Code Editor icon -> opens Vercel Sandbox & MCP Tool Studio
    fireEvent.click(screen.getByRole("link", { name: "AI Code Editor" }));
    expect(screen.getByTestId("desktop-window-code")).toBeInTheDocument();
    expect(screen.getByTestId("mcp-code-preview")).toBeInTheDocument();

    // Click AI Assistant icon -> opens Google Gemini & Vercel AI Gateway Copilot
    fireEvent.click(screen.getByRole("link", { name: "AI Assistant" }));
    expect(screen.getByTestId("desktop-window-assistant")).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("mcp-assistant-input"), {
      target: { value: "Check Cloudflare & Pi Network MCP readiness" },
    });
    await act(async () => {
      fireEvent.submit(screen.getByTestId("mcp-assistant-form"));
    });
    expect(screen.getByTestId("mcp-jsonrpc-output")).toHaveTextContent("context_get");
  });
});
