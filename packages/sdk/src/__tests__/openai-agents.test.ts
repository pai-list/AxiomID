import { AxiomIDError } from "../client";
import {
  assertOpenAIAgentSoulGate,
  bootstrapOpenAIAgentContext,
  createAxiomOpenAIAgentTools,
  toOpenAIAgentTools,
} from "../openai-agents";

const didDocument = {
  "@context": "https://www.w3.org/ns/did/v1",
  id: "did:axiom:pioneer.username",
  verificationMethod: [],
  authentication: [],
};

function createMockSdk(score = 88) {
  return {
    resolveDID: jest.fn().mockResolvedValue(didDocument),
    getTrustScore: jest.fn().mockResolvedValue({
      did: "did:axiom:pioneer.username",
      score,
      tier: "Sovereign",
    }),
  };
}

describe("OpenAI Agents SDK integration helpers", () => {
  it("bootstraps DID, trust score, Soul Gate, and attestation context", async () => {
    const sdk = createMockSdk(91);

    const context = await bootstrapOpenAIAgentContext({
      did: "did:axiom:pioneer.username",
      sdk,
      minimumTrustScore: 80,
      includeAttestationDraft: true,
      attestationSubjectDid: "did:axiom:delegate",
      now: () => new Date("2026-06-28T00:00:00.000Z"),
    });

    expect(sdk.resolveDID).toHaveBeenCalledWith("did:axiom:pioneer.username");
    expect(sdk.getTrustScore).toHaveBeenCalledWith("did:axiom:pioneer.username");
    expect(context.gate).toEqual({ allowed: true, minimumTrustScore: 80 });
    expect(context.attestationDraft).toEqual({
      issuerDid: "did:axiom:pioneer.username",
      subjectDid: "did:axiom:delegate",
      type: "AxiomIDAgentContext",
      issuedAt: "2026-06-28T00:00:00.000Z",
      evidence: {
        trustScore: 91,
        tier: "Sovereign",
        gateAllowed: true,
      },
    });
  });

  it("marks Soul Gate denied and throws a typed error when asserted", async () => {
    const context = await bootstrapOpenAIAgentContext({
      did: "did:axiom:pioneer.username",
      sdk: createMockSdk(42),
      minimumTrustScore: 80,
    });

    expect(context.gate.allowed).toBe(false);
    expect(context.gate.reason).toContain("below required minimum");
    expect(() => assertOpenAIAgentSoulGate(context)).toThrow(AxiomIDError);
  });

  it("creates dependency-light tool definitions for OpenAI Agents SDK tool factories", async () => {
    const sdk = createMockSdk(76);
    const tools = createAxiomOpenAIAgentTools({ sdk, minimumTrustScore: 70 });

    expect(tools.map((tool) => tool.name)).toEqual([
      "axiom_resolve_did",
      "axiom_get_trust_score",
      "axiom_bootstrap_agent_context",
    ]);
    expect(tools[0].parameters.required).toEqual(["did"]);
    await expect(
      tools[2].execute({ did: "did:axiom:pioneer.username" })
    ).resolves.toMatchObject({
      gate: { allowed: true, minimumTrustScore: 70 },
    });
  });

  it("adapts definitions through a caller supplied OpenAI tool factory", () => {
    const wrapped = toOpenAIAgentTools(
      (definition) => ({
        wrappedName: definition.name,
        hasExecute: typeof definition.execute === "function",
      }),
      { sdk: createMockSdk() }
    );

    expect(wrapped).toEqual([
      { wrappedName: "axiom_resolve_did", hasExecute: true },
      { wrappedName: "axiom_get_trust_score", hasExecute: true },
      { wrappedName: "axiom_bootstrap_agent_context", hasExecute: true },
    ]);
  });
});
