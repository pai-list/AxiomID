/**
 * @jest-environment node
 *
 * Tests for src/app/api/skills/[slug]/execute/route.ts
 *
 * PR change: added `requireAuth(request)` gating — the endpoint now requires
 * an authenticated user before recording a skill execution.
 */

jest.mock("@/lib/auth-middleware", () => ({
  requireAuth: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    skill: {
      findUnique: jest.fn(),
    },
    skillExecution: {
      create: jest.fn(),
    },
  },
}));

jest.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 99, resetAt: Date.now() + 60000 }),
  RATE_LIMITS: {
    authenticated: { windowMs: 60000, maxRequests: 100 },
  },
}));

jest.mock("@/lib/ip", () => ({
  getClientIp: jest.fn(() => "127.0.0.1"),
}));

jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

import { POST } from "@/app/api/skills/[slug]/execute/route";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/ip";
import { NextRequest } from "next/server";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRequireAuth = requireAuth as jest.Mock;
const mockCheckRateLimit = checkRateLimit as jest.Mock;
const mockGetClientIp = getClientIp as jest.Mock;

const mockUser = {
  id: "user-1",
  walletAddress: "pi:testuser",
  piUid: "pi-uid-1",
  piUsername: "testuser",
  xp: 0,
  tier: "Beginner",
};

function mockPostRequest(body: unknown) {
  return new NextRequest("http://localhost/api/skills/test-skill/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function mockParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

describe("POST /api/skills/[slug]/execute — slug validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 99, resetAt: Date.now() + 60000 });
    mockGetClientIp.mockReturnValue("127.0.0.1");
    mockRequireAuth.mockResolvedValue({ error: null, user: mockUser });
  });

  it("returns 400 when slug is empty", async () => {
    const req = mockPostRequest({ success: true });
    const res = await POST(req, mockParams(""));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("does not call requireAuth when slug validation fails", async () => {
    const req = mockPostRequest({ success: true });
    await POST(req, mockParams(""));

    expect(mockRequireAuth).not.toHaveBeenCalled();
  });
});

describe("POST /api/skills/[slug]/execute — authentication (PR change: requireAuth added)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 99, resetAt: Date.now() + 60000 });
    mockGetClientIp.mockReturnValue("127.0.0.1");
  });

  it("returns 401 when the request is not authenticated", async () => {
    const { apiError } = jest.requireActual("@/lib/errors") as { apiError: (code: string, message: string) => { status: number; json: () => Promise<unknown> } };
    mockRequireAuth.mockResolvedValue({ error: apiError("UNAUTHORIZED", "Unauthorized"), user: null });

    const req = mockPostRequest({ success: true });
    const res = await POST(req, mockParams("test-skill"));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.code).toBe("UNAUTHORIZED");
  });

  it("does not check the rate limit when authentication fails", async () => {
    const { apiError } = jest.requireActual("@/lib/errors") as { apiError: (code: string, message: string) => { status: number; json: () => Promise<unknown> } };
    mockRequireAuth.mockResolvedValue({ error: apiError("UNAUTHORIZED", "Unauthorized"), user: null });

    const req = mockPostRequest({ success: true });
    await POST(req, mockParams("test-skill"));

    expect(mockCheckRateLimit).not.toHaveBeenCalled();
  });

  it("proceeds to rate limiting and business logic when authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ error: null, user: mockUser });
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "skill-1", slug: "test-skill" } as unknown as import("@prisma/client").Skill); // ponytail: test mock — partial Prisma model
    mockPrisma.skillExecution.create.mockResolvedValue({ id: "exec-1", success: true } as unknown as import("@prisma/client").SkillExecution); // ponytail: test mock — partial Prisma model

    const req = mockPostRequest({ success: true });
    const res = await POST(req, mockParams("test-skill"));

    expect(mockCheckRateLimit).toHaveBeenCalled();
    expect(res.status).toBe(201);
  });

  it("binds agentId to whichever user requireAuth resolves (PR change)", async () => {
    const otherUser = { ...mockUser, id: "user-2" };
    mockRequireAuth.mockResolvedValue({ error: null, user: otherUser });
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "skill-1", slug: "test-skill" } as any); // ponytail: test mock — partial Prisma model
    mockPrisma.skillExecution.create.mockResolvedValue({ id: "exec-1", success: true } as any); // ponytail: test mock — partial Prisma model

    const req = mockPostRequest({ success: true });
    await POST(req, mockParams("test-skill"));

    expect(mockPrisma.skillExecution.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ agentId: "user-2" }),
    });
  });
});

describe("POST /api/skills/[slug]/execute — rate limiting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetClientIp.mockReturnValue("127.0.0.1");
    mockRequireAuth.mockResolvedValue({ error: null, user: mockUser });
  });

  it("returns 429 when rate limit exceeded", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 });

    const req = mockPostRequest({ success: true });
    const res = await POST(req, mockParams("test-skill"));
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.code).toBe("RATE_LIMITED");
  });

  it("uses RATE_LIMITS.authenticated config keyed by client IP", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 99, resetAt: Date.now() + 60000 });
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "skill-1", slug: "test-skill" } as any); // ponytail: test mock — partial Prisma model
    mockPrisma.skillExecution.create.mockResolvedValue({ id: "exec-1", success: true } as any); // ponytail: test mock — partial Prisma model

    const req = mockPostRequest({ success: true });
    await POST(req, mockParams("test-skill"));

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "skill-execute:127.0.0.1",
      RATE_LIMITS.authenticated
    );
  });
});

describe("POST /api/skills/[slug]/execute — body parsing and business logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 99, resetAt: Date.now() + 60000 });
    mockGetClientIp.mockReturnValue("127.0.0.1");
    mockRequireAuth.mockResolvedValue({ error: null, user: mockUser });
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost/api/skills/test-skill/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    }) as any; // ponytail: test mock — intentionally malformed request body

    const res = await POST(req, mockParams("test-skill"));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when the skill does not exist", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue(null);

    const req = mockPostRequest({ success: true });
    const res = await POST(req, mockParams("missing-skill"));
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.code).toBe("NOT_FOUND");
  });

  it("creates an execution record defaulting success to true when omitted", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "skill-1", slug: "test-skill" } as any); // ponytail: test mock — partial Prisma model
    mockPrisma.skillExecution.create.mockResolvedValue({ id: "exec-1", success: true } as any); // ponytail: test mock — partial Prisma model

    const req = mockPostRequest({});
    const res = await POST(req, mockParams("test-skill"));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(mockPrisma.skillExecution.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ skillId: "skill-1", success: true }),
    });
    expect(data.success).toBe(true);
  });

  it("records the authenticated user's id as agentId on the execution (PR change)", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "skill-1", slug: "test-skill" } as any); // ponytail: test mock — partial Prisma model
    mockPrisma.skillExecution.create.mockResolvedValue({ id: "exec-1", success: true } as any); // ponytail: test mock — partial Prisma model

    const req = mockPostRequest({ success: true });
    await POST(req, mockParams("test-skill"));

    expect(mockPrisma.skillExecution.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ agentId: mockUser.id }),
    });
  });

  it("uses the agentId of the authenticated user, ignoring any agentId in the request body", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "skill-1", slug: "test-skill" } as any); // ponytail: test mock — partial Prisma model
    mockPrisma.skillExecution.create.mockResolvedValue({ id: "exec-1", success: true } as any); // ponytail: test mock — partial Prisma model

    const req = mockPostRequest({ success: true, agentId: "attacker-supplied-id" });
    await POST(req, mockParams("test-skill"));

    expect(mockPrisma.skillExecution.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ agentId: mockUser.id }),
    });
  });

  it("records success:false when explicitly provided", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "skill-1", slug: "test-skill" } as any); // ponytail: test mock — partial Prisma model
    mockPrisma.skillExecution.create.mockResolvedValue({ id: "exec-2", success: false } as any); // ponytail: test mock — partial Prisma model

    const req = mockPostRequest({ success: false, errorMessage: "Timed out" });
    const res = await POST(req, mockParams("test-skill"));
    const data = await res.json();

    expect(mockPrisma.skillExecution.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ success: false, errorMessage: "Timed out" }),
    });
    expect(data.success).toBe(false);
  });

  it("passes through durationMs, input, and output when provided", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "skill-1", slug: "test-skill" } as any); // ponytail: test mock — partial Prisma model
    mockPrisma.skillExecution.create.mockResolvedValue({ id: "exec-3", success: true } as any); // ponytail: test mock — partial Prisma model

    const req = mockPostRequest({
      success: true,
      durationMs: 1234,
      input: { foo: "bar" },
      output: { result: "ok" },
    });
    await POST(req, mockParams("test-skill"));

    expect(mockPrisma.skillExecution.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        durationMs: 1234,
        input: { foo: "bar" },
        output: { result: "ok" },
      }),
    });
  });

  it("ignores a non-numeric durationMs", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "skill-1", slug: "test-skill" } as any); // ponytail: test mock — partial Prisma model
    mockPrisma.skillExecution.create.mockResolvedValue({ id: "exec-4", success: true } as any); // ponytail: test mock — partial Prisma model

    const req = mockPostRequest({ success: true, durationMs: "not-a-number" });
    await POST(req, mockParams("test-skill"));

    expect(mockPrisma.skillExecution.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ durationMs: undefined }),
    });
  });

  it("returns 500 when the database write fails", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "skill-1", slug: "test-skill" } as any); // ponytail: test mock — partial Prisma model
    mockPrisma.skillExecution.create.mockRejectedValue(new Error("DB down"));

    const req = mockPostRequest({ success: true });
    const res = await POST(req, mockParams("test-skill"));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.code).toBe("INTERNAL_ERROR");
  });

  it("treats any non-false success value as true (only literal false disables it)", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "skill-1", slug: "test-skill" } as any); // ponytail: test mock — partial Prisma model
    mockPrisma.skillExecution.create.mockResolvedValue({ id: "exec-5", success: true } as any); // ponytail: test mock — partial Prisma model

    const req = mockPostRequest({ success: null });
    await POST(req, mockParams("test-skill"));

    expect(mockPrisma.skillExecution.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ success: true }),
    });
  });

  it("treats an empty errorMessage string as undefined", async () => {
    mockPrisma.skill.findUnique.mockResolvedValue({ id: "skill-1", slug: "test-skill" } as any); // ponytail: test mock — partial Prisma model
    mockPrisma.skillExecution.create.mockResolvedValue({ id: "exec-6", success: true } as any); // ponytail: test mock — partial Prisma model

    const req = mockPostRequest({ success: true, errorMessage: "" });
    await POST(req, mockParams("test-skill"));

    expect(mockPrisma.skillExecution.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ errorMessage: undefined }),
    });
  });
});