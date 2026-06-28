import type { AxiomSDK } from "../client";
import {
  AxiomIDAutoGenGateError,
  createAxiomIDAutoGenAdapter,
  createAxiomIDAutoGenToolDefinitions,
} from "../integrations/autogen";

const didDocument = {
  "@context": "https://www.w3.org/ns/did/v1",
  id: "did:axiom:agent:alice",
  verificationMethod: [],
  authentication: [],
};

const trustScore = {
  did: "did:axiom:agent:alice",
  score: 82,
  tier: "Sovereign",
};

const lowTrustScore = {
  did: "did:axiom:agent:alice",
  score: 35,
  tier: "Observer",
};

const passport = {
  username: "alice",
  walletAddress: "GD5XABC",
  stellarAddress: "GA456DEF",
  did: "did:axiom:agent:alice",
  tier: "Sovereign",
  xp: 1000,
  trustScore: 82,
  kyaStatus: "VERIFIED",
  kycStatus: "VERIFIED",
  stamps: [],
  issuedDate: "2026-01-01T00:00:00.000Z",
  agentName: "alice-agent",
  agentStatus: "ACTIVE",
  agentPublicKey: "z6MkAlice",
};

function createMockSdk(score = trustScore): AxiomSDK {
  return {
    resolveDID: jest.fn().mockResolvedValue(didDocument),
    getTrustScore: jest.fn().mockResolvedValue(score),
    verifyPassport: jest.fn().mockResolvedValue(passport),
  } as unknown as AxiomSDK;
}

describe("createAxiomIDAutoGenAdapter", () => {
  it("bootstraps DID, trust, passport, system message, and tool context", async () => {
    const sdk = createMockSdk();
    const adapter = createAxiomIDAutoGenAdapter({
      sdk,
      agentDid: "did:axiom:agent:reviewer",
      minimumTrustScore: 70,
    });

    const context = await adapter.bootstrapAgent({
      did: "did:axiom:agent:alice",
      passportSlug: "alice",
      purpose: "Review a delegated pull request",
      metadata: { threadId: "task-123" },
    });

    expect(sdk.resolveDID).toHaveBeenCalledWith("did:axiom:agent:alice");
    expect(sdk.getTrustScore).toHaveBeenCalledWith("did:axiom:agent:alice");
    expect(sdk.verifyPassport).toHaveBeenCalledWith("alice");
    expect(context).toMatchObject({
      framework: "autogen",
      did: "did:axiom:agent:alice",
      didDocument,
      trustScore,
      passport,
      soulGate: {
        allowed: true,
        score: 82,
        minimumTrustScore: 70,
        purpose: "Review a delegated pull request",
      },
      metadata: { threadId: "task-123" },
    });
    expect(context.systemMessage).toContain("AxiomID identity context");
    expect(context.systemMessage).toContain("did:axiom:agent:alice");
    expect(context.toolContext).toMatchObject({
      framework: "autogen",
      did: "did:axiom:agent:alice",
      trust: { score: 82, tier: "Sovereign" },
      passport: {
        username: "alice",
        tier: "Sovereign",
        kyaStatus: "VERIFIED",
        kycStatus: "VERIFIED",
      },
    });
  });

  it("throws a gate error when requireSoulGate sees a low trust score", async () => {
    const sdk = createMockSdk(lowTrustScore);
    const adapter = createAxiomIDAutoGenAdapter({
      sdk,
      minimumTrustScore: 60,
    });

    await expect(
      adapter.requireSoulGate({
        did: "did:axiom:agent:alice",
        purpose: "Run sensitive AutoGen task",
      })
    ).rejects.toMatchObject({
      name: "AxiomIDAutoGenGateError",
      decision: {
        allowed: false,
        score: 35,
        minimumTrustScore: 60,
      },
    });
  });

  it("returns denied Soul Gate context without throwing from bootstrapAgent", async () => {
    const sdk = createMockSdk(lowTrustScore);
    const adapter = createAxiomIDAutoGenAdapter({ sdk });

    const context = await adapter.bootstrapAgent({
      did: "did:axiom:agent:alice",
      minimumTrustScore: 50,
    });

    expect(context.soulGate).toMatchObject({
      allowed: false,
      score: 35,
      minimumTrustScore: 50,
    });
    expect(context.systemMessage).toContain("Soul Gate: denied");
  });

  it("creates unsigned AutoGen attestation drafts with stable issuer defaults", () => {
    const sdk = createMockSdk();
    const adapter = createAxiomIDAutoGenAdapter({
      sdk,
      agentDid: "did:axiom:agent:issuer",
      defaultPurpose: "AutoGen task completion",
      now: () => new Date("2026-06-28T00:00:00.000Z"),
    });

    const draft = adapter.createAttestationDraft({
      subjectDid: "did:axiom:agent:alice",
      claim: "AutoGen agent completed a gated research task",
      evidence: { taskId: "task-123", score: 82 },
    });

    expect(draft).toEqual({
      type: "AxiomIDAttestationDraft",
      issuerDid: "did:axiom:agent:issuer",
      subjectDid: "did:axiom:agent:alice",
      claim: "AutoGen agent completed a gated research task",
      evidence: { taskId: "task-123", score: 82 },
      issuedAt: "2026-06-28T00:00:00.000Z",
      expiresAt: undefined,
      unsigned: true,
      framework: "autogen",
      purpose: "AutoGen task completion",
    });
  });

  it("exposes AutoGen function tool definitions that delegate to the adapter", async () => {
    const sdk = createMockSdk();
    const tools = createAxiomIDAutoGenToolDefinitions({
      sdk,
      agentDid: "did:axiom:agent:issuer",
    });

    expect(Object.keys(tools)).toEqual([
      "bootstrapIdentity",
      "enforceSoulGate",
      "createAttestationDraft",
    ]);
    expect(tools.bootstrapIdentity.name).toBe("axiomid_bootstrap_identity");
    expect(tools.enforceSoulGate.name).toBe("axiomid_enforce_soul_gate");
    expect(tools.createAttestationDraft.name).toBe(
      "axiomid_create_attestation_draft"
    );
    expect(tools.bootstrapIdentity.parameters).toMatchObject({
      type: "object",
      required: ["did"],
    });

    const context = await tools.bootstrapIdentity.run({
      did: "did:axiom:agent:alice",
    });
    expect(context.did).toBe("did:axiom:agent:alice");

    const draft = await tools.createAttestationDraft.run({
      subjectDid: "did:axiom:agent:alice",
      claim: "AutoGen task completed",
    });
    expect(draft.issuerDid).toBe("did:axiom:agent:issuer");
  });

  it("validates required fields before creating attestation drafts", () => {
    const sdk = createMockSdk();
    const adapter = createAxiomIDAutoGenAdapter({ sdk });

    expect(() =>
      adapter.createAttestationDraft({
        subjectDid: "did:axiom:agent:alice",
        claim: "AutoGen task completed",
      })
    ).toThrow("issuerDid is required");

    expect(() =>
      adapter.createAttestationDraft({
        issuerDid: "did:axiom:agent:issuer",
        subjectDid: "",
        claim: "AutoGen task completed",
      })
    ).toThrow("subjectDid is required");
  });

  it("propagates SDK failures from DID resolution", async () => {
    const sdk = {
      resolveDID: jest.fn().mockRejectedValue(new Error("DID not found")),
      getTrustScore: jest.fn().mockResolvedValue(trustScore),
      verifyPassport: jest.fn().mockResolvedValue(passport),
    } as unknown as AxiomSDK;
    const adapter = createAxiomIDAutoGenAdapter({ sdk });

    await expect(
      adapter.bootstrapAgent({ did: "did:axiom:missing" })
    ).rejects.toThrow("DID not found");
  });

  it("exposes the gate decision on AxiomIDAutoGenGateError", () => {
    const error = new AxiomIDAutoGenGateError({
      allowed: false,
      score: 1,
      minimumTrustScore: 90,
      reason: "Trust score 1 is below minimum 90",
      purpose: "test",
    });

    expect(error.name).toBe("AxiomIDAutoGenGateError");
    expect(error.decision.score).toBe(1);
  });
});
