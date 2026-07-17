/**
 * @jest-environment node
 *
 * Tests for src/app/.well-known/agent-card/route.ts
 *
 * Serves the A2A AgentCard directory for agent discovery.
 */

import { GET } from "@/app/.well-known/agent-card.json/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// ── Mocks ──────────────────────────────────────────────────────

jest.mock("@/lib/prisma", () => ({
  prisma: {
    userAgent: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true }),
  RATE_LIMITS: { public: { limit: 60, windowMs: 60000 } },
}));

jest.mock("@/lib/ip", () => ({
  getClientIp: jest.fn().mockReturnValue("127.0.0.1"),
}));

jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn() },
}));

const mockFindMany = prisma.userAgent.findMany as jest.Mock;

function createRequest(url = "https://axiomid.app/.well-known/agent-card.json") {
  return new NextRequest(new Request(url));
}

// ── Fixtures ───────────────────────────────────────────────────

function createMockAgent(overrides: Record<string, unknown> = {}) {
  return {
    id: "agent-1",
    publicId: "ag_mock1",
    name: "Test Agent",
    description: "A test agent",
    avatarUrl: "https://axiomid.app/avatars/agent-1.png",
    did: "did:key:z6Mk...",
    subdomain: "test-agent",
    status: "ACTIVE",
    discoverable: true,
    lastActive: new Date("2026-07-16T12:00:00.000Z"),
    installedSkills: [
      {
        skill: {
          slug: "web-search",
          name: "Web Search",
          description: "Search the web",
        },
        status: "active",
      },
      {
        skill: {
          slug: "summarize",
          name: "Summarize",
          description: "Summarize content",
        },
        status: "active",
      },
    ],
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────

describe("GET /.well-known/agent-card.json", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return agent directory with discoverable agents in A2A v1.0 format", async () => {
    mockFindMany.mockResolvedValue([createMockAgent()]);

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    // Directory envelope
    expect(body.kind).toBe("agent-directory");
    expect(body.provider.organization).toBe("AxiomID");
    expect(body.total).toBe(1);
    expect(body.agents).toHaveLength(1);

    // A2A v1.0 required fields
    const agent = body.agents[0];
    expect(agent.name).toBe("Test Agent");
    expect(agent.url).toBe("https://test-agent.axiomid.app");
    expect(agent.version).toBe("1.0.0");
    expect(agent.iconUrl).toBe("https://axiomid.app/avatars/agent-1.png");
    expect(agent.capabilities.streaming).toBe(false);
    expect(agent.capabilities.pushNotifications).toBe(false);

    // securitySchemes uses httpAuthSecurityScheme (protobuf oneof)
    expect(agent.securitySchemes.didKey.httpAuthSecurityScheme.scheme).toBe("bearer");
    expect(agent.securitySchemes.didKey.httpAuthSecurityScheme.bearerFormat).toBe("did:key");
    expect(agent.security).toEqual([{ didKey: [] }]);

    // MIME types per A2A v1.0
    expect(agent.defaultInputModes).toEqual(["text/plain"]);
    expect(agent.defaultOutputModes).toEqual(["text/plain"]);

    // Skills with full AgentSkill schema
    expect(agent.skills).toHaveLength(2);
    expect(agent.skills[0].id).toBe("web-search");
    expect(agent.skills[0].tags).toEqual([]);
    expect(agent.skills[0].inputModes).toEqual(["text/plain"]);

    // AxiomID extension fields (namespaced)
    expect(agent["x-axiomid-did"]).toBe("did:key:z6Mk...");
    expect(agent["x-axiomid-lastActive"]).toBeDefined();
  });

  it("should build correct url when subdomain is missing", async () => {
    mockFindMany.mockResolvedValue([
      createMockAgent({ subdomain: null }),
    ]);

    const response = await GET(createRequest());
    const body = await response.json();

    expect(body.agents[0].url).toBe("https://axiomid.app/agent/ag_mock1");
  });

  it("should filter out non-discoverable agents", async () => {
    mockFindMany.mockResolvedValue([]);

    const response = await GET(createRequest());
    const body = await response.json();

    expect(body.total).toBe(0);
    expect(body.agents).toHaveLength(0);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "ACTIVE",
          discoverable: true,
        }),
      })
    );
  });

  it("should include only active skills in the DB query", async () => {
    mockFindMany.mockResolvedValue([
      createMockAgent({
        installedSkills: [
          {
            skill: { slug: "active-skill", name: "Active", description: null },
            status: "active",
          },
          {
            skill: { slug: "disabled-skill", name: "Disabled", description: null },
            status: "disabled",
          },
        ],
      }),
    ]);

    const response = await GET(createRequest());
    const body = await response.json();

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          installedSkills: expect.objectContaining({
            where: { status: "active" },
          }),
        }),
      })
    );
  });

  it("should handle rate limiting", async () => {
    const { checkRateLimit } = require("@/lib/rate-limiter");
    (checkRateLimit as jest.Mock).mockResolvedValueOnce({
      allowed: false,
      resetAt: Date.now() + 60000,
    });

    const response = await GET(createRequest());

    expect(response.status).toBe(429);
  });

  it("should handle database errors gracefully", async () => {
    mockFindMany.mockRejectedValueOnce(new Error("DB connection failed"));

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBeDefined();
  });
});
