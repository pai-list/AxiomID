jest.mock("@/lib/herenow", () => ({
  createHereNowClient: jest.fn(),
  HereNowError: class extends Error {
    code: string;
    constructor(msg: string, code: string) {
      super(msg);
      this.name = "HereNowError";
      this.code = code;
    }
  },
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { update: jest.fn() },
  },
}));

jest.mock("@/lib/logger", () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

import { generatePassportHtml, publishPassport } from "@/lib/passport-publisher";
import { createHereNowClient } from "@/lib/herenow";
import { prisma } from "@/lib/prisma";

const mockClient = {
  createPage: jest.fn(),
  uploadContent: jest.fn(),
  finalizePage: jest.fn(),
  publishPage: jest.fn(),
};

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

function makePassportData(overrides: Partial<Parameters<typeof generatePassportHtml>[0]> = {}) {
  return {
    userId: "user-1",
    username: "testuser",
    did: "did:axiom:axiomid.app:pi:abc123",
    tier: "Citizen",
    xp: 1500,
    trustScore: 85,
    walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    kyaStatus: "verified" as const,
    kycStatus: "pending" as const,
    stamps: [
      { type: "identity", provider: "pi_network" },
      { type: "reputation", provider: "github" },
    ],
    agentName: "AxiomBot",
    issuedDate: "2026-06-21",
    ...overrides,
  };
}

describe("generatePassportHtml", () => {
  it("generates valid HTML with all fields", () => {
    const html = generatePassportHtml(makePassportData());

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("testuser");
    expect(html).toContain("Citizen");
    expect(html).toContain("did:axiom:axiomid.app:pi:abc123");
    expect(html).toContain("1,500 XP");
    expect(html).toContain("AxiomBot");
    expect(html).toContain("pi_network");
    expect(html).toContain("github");
  });

  it("escapes HTML in user input", () => {
    const html = generatePassportHtml(
      makePassportData({ username: '<script>alert("xss")</script>' })
    );

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("handles missing optional fields", () => {
    const html = generatePassportHtml(
      makePassportData({
        walletAddress: undefined,
        stellarAddress: undefined,
        agentName: undefined,
        stamps: [],
      })
    );

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).not.toContain("Stamps");
  });

  it("uses stellarAddress over walletAddress", () => {
    const html = generatePassportHtml(
      makePassportData({
        stellarAddress: "GABC1234567890DEFGHIJK",
        walletAddress: "0xabcdef",
      })
    );

    expect(html).toContain("GABC123456...DEFGHIJK");
  });
});

describe("tierBadgeColor via generatePassportHtml (PR change: new tier mapping)", () => {
  // The tierBadgeColor function is private, but its output is embedded as CSS
  // in the generated HTML. We verify the correct hex values appear in the HTML.

  it("Visitor tier uses #64748b (PR change: was #6b7280)", () => {
    const html = generatePassportHtml(makePassportData({ tier: "Visitor" }));
    expect(html).toContain("#64748b");
  });

  it("Citizen tier uses #00ff41 (PR change: was #3b82f6)", () => {
    const html = generatePassportHtml(makePassportData({ tier: "Citizen" }));
    expect(html).toContain("#00ff41");
  });

  it("Validator tier uses #00d4ff (PR change: new tier, replaces Sentinel/Guardian/Architect)", () => {
    const html = generatePassportHtml(makePassportData({ tier: "Validator" }));
    expect(html).toContain("#00d4ff");
  });

  it("Sovereign tier uses #a855f7 (PR change: was #ef4444)", () => {
    const html = generatePassportHtml(makePassportData({ tier: "Sovereign" }));
    expect(html).toContain("#a855f7");
  });

  it("unknown tier falls back to #64748b (PR change: fallback was #6b7280)", () => {
    const html = generatePassportHtml(makePassportData({ tier: "UnknownTier" }));
    expect(html).toContain("#64748b");
    // Must not contain old fallback
    expect(html).not.toContain("#6b7280");
  });

  it("removed Sentinel tier now falls back to default color #64748b (PR change)", () => {
    const html = generatePassportHtml(makePassportData({ tier: "Sentinel" }));
    expect(html).toContain("#64748b");
    // Old Sentinel color must not appear
    expect(html).not.toContain("#8b5cf6");
  });

  it("removed Guardian tier now falls back to default color #64748b (PR change)", () => {
    const html = generatePassportHtml(makePassportData({ tier: "Guardian" }));
    expect(html).toContain("#64748b");
    // Old Guardian color must not appear
    expect(html).not.toContain("#f59e0b");
  });

  it("removed Architect tier now falls back to default color #64748b (PR change)", () => {
    const html = generatePassportHtml(makePassportData({ tier: "Architect" }));
    expect(html).toContain("#64748b");
    // Old Architect color must not appear
    expect(html).not.toContain("#10b981");
  });

  it("Citizen tier does not contain the old blue color #3b82f6", () => {
    const html = generatePassportHtml(makePassportData({ tier: "Citizen" }));
    expect(html).not.toContain("#3b82f6");
  });

  it("Sovereign tier does not contain the old red color #ef4444", () => {
    const html = generatePassportHtml(makePassportData({ tier: "Sovereign" }));
    expect(html).not.toContain("#ef4444");
  });

  it("tier color appears in both avatar background and tier badge styles", () => {
    const html = generatePassportHtml(makePassportData({ tier: "Citizen" }));
    // #00ff41 should appear at least twice (once in .avatar, once in .tier inline)
    const occurrences = (html.match(/#00ff41/g) || []).length;
    expect(occurrences).toBeGreaterThanOrEqual(2);
  });
});

describe("publishPassport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createHereNowClient as jest.Mock).mockReturnValue(mockClient);
    mockClient.publishPage.mockResolvedValue({
      url: "https://here.now/p/testuser",
    });
    mockPrisma.user.update.mockResolvedValue({} as never);
  });

  it("publishes to here.now and updates database", async () => {
    const data = makePassportData();
    const result = await publishPassport(data);

    expect(result).toEqual({
      url: "https://here.now/p/testuser",
      publishedAt: expect.any(String),
    });

    expect(mockClient.publishPage).toHaveBeenCalledWith({
      title: "testuser — AxiomID Passport",
      slug: "testuser",
      html: expect.stringContaining("testuser"),
    });

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { passportUrl: "https://here.now/p/testuser" },
    });
  });

  it("propagates HereNowError on failure", async () => {
    mockClient.publishPage.mockRejectedValue(
      new Error("API error")
    );

    await expect(
      publishPassport(makePassportData())
    ).rejects.toThrow("API error");

    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });
});
