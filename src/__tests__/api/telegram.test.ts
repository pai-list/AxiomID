/**
 * @jest-environment node
 */

// Mock telegraf before any imports so module-level code uses the mock
const mockHandleUpdate = jest.fn();
const mockStart = jest.fn();
const mockCommand = jest.fn();

const mockBotInstance = {
  handleUpdate: mockHandleUpdate,
  start: mockStart,
  command: mockCommand,
};

const MockTelegraf = jest.fn(() => mockBotInstance);

jest.mock("telegraf", () => ({
  Telegraf: MockTelegraf,
}));

import { POST } from "@/app/api/telegram/route";
import { NextRequest } from "next/server";

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/telegram", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/telegram", () => {
  const originalBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    mockHandleUpdate.mockResolvedValue(undefined);
  });

  afterAll(() => {
    // Restore env vars after all tests in this suite
    if (originalBotToken !== undefined) {
      process.env.TELEGRAM_BOT_TOKEN = originalBotToken;
    } else {
      delete process.env.TELEGRAM_BOT_TOKEN;
    }
    if (originalAppUrl !== undefined) {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    } else {
      delete process.env.NEXT_PUBLIC_APP_URL;
    }
  });

  describe("success path", () => {
    it("returns { ok: true } with status 200 on a valid update", async () => {
      const update = { update_id: 1, message: { text: "/start" } };
      const req = makePostRequest(update);

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual({ ok: true });
    });

    it("calls bot.handleUpdate with the parsed JSON body", async () => {
      const update = { update_id: 42, message: { text: "/passport" } };
      const req = makePostRequest(update);

      await POST(req);

      expect(mockHandleUpdate).toHaveBeenCalledTimes(1);
      expect(mockHandleUpdate).toHaveBeenCalledWith(update);
    });

    it("handles an empty object update body", async () => {
      const req = makePostRequest({});

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
    });
  });

  describe("error path", () => {
    it("returns { ok: false } with status 500 when bot.handleUpdate throws", async () => {
      mockHandleUpdate.mockRejectedValue(new Error("Telegraf internal error"));

      const req = makePostRequest({ update_id: 1 });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.ok).toBe(false);
      expect(data.error).toBe("Internal Server Error");
    });

    it("returns { ok: false } with status 500 when request body is not valid JSON", async () => {
      const req = new NextRequest("http://localhost/api/telegram", {
        method: "POST",
        body: "not-valid-json",
        headers: { "Content-Type": "application/json" },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.ok).toBe(false);
      expect(data.error).toBe("Internal Server Error");
    });

    it("logs an error to console.error when bot.handleUpdate throws", async () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockHandleUpdate.mockRejectedValue(new Error("crash"));

      const req = makePostRequest({ update_id: 2 });
      await POST(req);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error handling Telegram webhook:",
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it("does not throw when bot.handleUpdate rejects with a non-Error value", async () => {
      mockHandleUpdate.mockRejectedValue("string error");

      const req = makePostRequest({ update_id: 3 });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.ok).toBe(false);
    });
  });

  describe("bot command registration", () => {
    it("instantiates Telegraf exactly once at module load", () => {
      // MockTelegraf was called when the module was first imported
      expect(MockTelegraf).toHaveBeenCalledTimes(1);
    });

    it("registers the /start command via bot.start()", () => {
      expect(mockStart).toHaveBeenCalledTimes(1);
    });

    it("registers /passport command", () => {
      const commandNames = mockCommand.mock.calls.map((call) => call[0]);
      expect(commandNames).toContain("passport");
    });

    it("registers /claim command", () => {
      const commandNames = mockCommand.mock.calls.map((call) => call[0]);
      expect(commandNames).toContain("claim");
    });

    it("registers /rank command", () => {
      const commandNames = mockCommand.mock.calls.map((call) => call[0]);
      expect(commandNames).toContain("rank");
    });

    it("registers exactly 3 named commands (passport, claim, rank)", () => {
      expect(mockCommand).toHaveBeenCalledTimes(3);
    });
  });

  describe("bot token handling", () => {
    it("uses TELEGRAM_BOT_TOKEN env var when provided", () => {
      // The constructor was already called at module import time with whatever token was set.
      // We verify it was called with a string (either real token or fallback).
      const callArg = MockTelegraf.mock.calls[0]?.[0];
      expect(typeof callArg).toBe("string");
      expect(callArg.length).toBeGreaterThan(0);
    });
  });

  describe("command callback behaviour (via captured handlers)", () => {
    function getCapturedHandler(mockFn: jest.Mock, commandName?: string) {
      if (commandName) {
        const call = mockFn.mock.calls.find((c) => c[0] === commandName);
        return call?.[1] as ((ctx: unknown) => void) | undefined;
      }
      // For bot.start the handler is the first (and only) argument
      return mockFn.mock.calls[0]?.[0] as ((ctx: unknown) => void) | undefined;
    }

    function makeCtx(overrides: Record<string, unknown> = {}) {
      return {
        reply: jest.fn(),
        ...overrides,
      };
    }

    it("/start handler replies with an inline keyboard containing webAppUrl", () => {
      const handler = getCapturedHandler(mockStart);
      expect(handler).toBeDefined();

      const ctx = makeCtx();
      (handler as (c: typeof ctx) => void)(ctx);

      expect(ctx.reply).toHaveBeenCalledTimes(1);
      const [, options] = (ctx.reply as jest.Mock).mock.calls[0];
      const buttons =
        options?.reply_markup?.inline_keyboard?.[0];
      expect(buttons).toBeDefined();
      expect(buttons[0].web_app.url).toBeTruthy();
    });

    it("/passport handler replies with a URL ending in /passport", async () => {
      const handler = getCapturedHandler(mockCommand, "passport");
      expect(handler).toBeDefined();

      const ctx = makeCtx();
      await (handler as (c: typeof ctx) => Promise<void>)(ctx);

      const [, options] = (ctx.reply as jest.Mock).mock.calls[0];
      const buttons = options?.reply_markup?.inline_keyboard?.[0];
      expect(buttons[0].web_app.url).toMatch(/\/passport$/);
    });

    it("/claim handler replies with a URL ending in /claim", () => {
      const handler = getCapturedHandler(mockCommand, "claim");
      expect(handler).toBeDefined();

      const ctx = makeCtx();
      (handler as (c: typeof ctx) => void)(ctx);

      const [, options] = (ctx.reply as jest.Mock).mock.calls[0];
      const buttons = options?.reply_markup?.inline_keyboard?.[0];
      expect(buttons[0].web_app.url).toMatch(/\/claim$/);
    });

    it("/rank handler replies with a URL ending in /leaderboard", async () => {
      const handler = getCapturedHandler(mockCommand, "rank");
      expect(handler).toBeDefined();

      const ctx = makeCtx();
      await (handler as (c: typeof ctx) => Promise<void>)(ctx);

      const [, options] = (ctx.reply as jest.Mock).mock.calls[0];
      const buttons = options?.reply_markup?.inline_keyboard?.[0];
      expect(buttons[0].web_app.url).toMatch(/\/leaderboard$/);
    });

    it("all command URLs share the same base webAppUrl", () => {
      const startHandler = getCapturedHandler(mockStart);
      const passportHandler = getCapturedHandler(mockCommand, "passport");
      const claimHandler = getCapturedHandler(mockCommand, "claim");
      const rankHandler = getCapturedHandler(mockCommand, "rank");

      const ctxStart = makeCtx();
      const ctxPassport = makeCtx();
      const ctxClaim = makeCtx();
      const ctxRank = makeCtx();

      (startHandler as (c: typeof ctxStart) => void)(ctxStart);
      (passportHandler as (c: typeof ctxPassport) => void)(ctxPassport);
      (claimHandler as (c: typeof ctxClaim) => void)(ctxClaim);
      (rankHandler as (c: typeof ctxRank) => void)(ctxRank);

      const getUrl = (ctx: ReturnType<typeof makeCtx>) => {
        const [, options] = (ctx.reply as jest.Mock).mock.calls[0];
        return options?.reply_markup?.inline_keyboard?.[0]?.[0]?.web_app?.url as string;
      };

      const startUrl = getUrl(ctxStart);
      const passportUrl = getUrl(ctxPassport);
      const claimUrl = getUrl(ctxClaim);
      const rankUrl = getUrl(ctxRank);

      // All sub-paths should start from the same base
      const base = startUrl; // /start uses the root URL
      expect(passportUrl.startsWith(base)).toBe(true);
      expect(claimUrl.startsWith(base)).toBe(true);
      expect(rankUrl.startsWith(base)).toBe(true);
    });
  });
});