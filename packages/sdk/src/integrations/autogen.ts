import type { AxiomSDK } from "../client";
import type { DIDDocument, Passport, TrustScore } from "../types";

type AxiomIdentitySDK = Pick<
  AxiomSDK,
  "resolveDID" | "getTrustScore" | "verifyPassport"
>;

const DEFAULT_MINIMUM_TRUST_SCORE = 60;

export interface AxiomIDAutoGenAdapterOptions {
  sdk: AxiomIdentitySDK;
  agentDid?: string;
  minimumTrustScore?: number;
  defaultPurpose?: string;
  now?: () => Date;
}

export interface AxiomIDAutoGenBootstrapInput {
  did: string;
  passportSlug?: string;
  minimumTrustScore?: number;
  purpose?: string;
  metadata?: Record<string, unknown>;
}

export interface AxiomIDAutoGenGateInput {
  did: string;
  minimumTrustScore?: number;
  purpose?: string;
  metadata?: Record<string, unknown>;
}

export interface AxiomIDAutoGenAttestationDraftInput {
  issuerDid?: string;
  subjectDid: string;
  claim: string;
  evidence?: Record<string, unknown>;
  expiresAt?: string;
  purpose?: string;
}

export interface AxiomIDAutoGenGateDecision {
  allowed: boolean;
  score: number;
  minimumTrustScore: number;
  reason: string;
  purpose: string;
}

export interface AxiomIDAutoGenContext {
  framework: "autogen";
  did: string;
  didDocument: DIDDocument;
  trustScore: TrustScore;
  passport?: Passport;
  soulGate: AxiomIDAutoGenGateDecision;
  systemMessage: string;
  toolContext: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface AxiomIDAutoGenAttestationDraft {
  type: "AxiomIDAttestationDraft";
  issuerDid: string;
  subjectDid: string;
  claim: string;
  evidence: Record<string, unknown>;
  issuedAt: string;
  expiresAt?: string;
  unsigned: true;
  framework: "autogen";
  purpose: string;
}

export interface AutoGenFunctionToolDefinition<TInput, TOutput> {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  run(input: TInput): Promise<TOutput>;
}

export interface AxiomIDAutoGenToolDefinitions {
  bootstrapIdentity: AutoGenFunctionToolDefinition<
    AxiomIDAutoGenBootstrapInput,
    AxiomIDAutoGenContext
  >;
  enforceSoulGate: AutoGenFunctionToolDefinition<
    AxiomIDAutoGenGateInput,
    AxiomIDAutoGenContext
  >;
  createAttestationDraft: AutoGenFunctionToolDefinition<
    AxiomIDAutoGenAttestationDraftInput,
    AxiomIDAutoGenAttestationDraft
  >;
}

export interface AxiomIDAutoGenAdapter {
  bootstrapAgent(input: AxiomIDAutoGenBootstrapInput): Promise<AxiomIDAutoGenContext>;
  requireSoulGate(input: AxiomIDAutoGenGateInput): Promise<AxiomIDAutoGenContext>;
  createAttestationDraft(
    input: AxiomIDAutoGenAttestationDraftInput
  ): AxiomIDAutoGenAttestationDraft;
  buildSystemMessage(context: AxiomIDAutoGenContext): string;
  toToolDefinitions(): AxiomIDAutoGenToolDefinitions;
}

export class AxiomIDAutoGenGateError extends Error {
  readonly decision: AxiomIDAutoGenGateDecision;

  constructor(decision: AxiomIDAutoGenGateDecision) {
    super(decision.reason);
    this.name = "AxiomIDAutoGenGateError";
    this.decision = decision;
  }
}

function requireNonEmpty(value: string | undefined, field: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`${field} is required`);
  }
  return trimmed;
}

function minimumTrustScore(
  inputValue: number | undefined,
  configuredValue: number | undefined
): number {
  const value = inputValue ?? configuredValue ?? DEFAULT_MINIMUM_TRUST_SCORE;
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error("minimumTrustScore must be between 0 and 100");
  }
  return value;
}

function purposeFor(inputPurpose: string | undefined, defaultPurpose: string | undefined): string {
  return inputPurpose?.trim() || defaultPurpose || "Authorize AutoGen agent work";
}

function evaluateSoulGate(
  trustScore: TrustScore,
  requiredScore: number,
  purpose: string
): AxiomIDAutoGenGateDecision {
  const allowed = trustScore.score >= requiredScore;
  return {
    allowed,
    score: trustScore.score,
    minimumTrustScore: requiredScore,
    purpose,
    reason: allowed
      ? `Trust score ${trustScore.score} meets minimum ${requiredScore}`
      : `Trust score ${trustScore.score} is below minimum ${requiredScore}`,
  };
}

type AxiomIDAutoGenContextSeed = Omit<
  AxiomIDAutoGenContext,
  "systemMessage" | "toolContext"
>;

function createToolContext(context: AxiomIDAutoGenContextSeed) {
  return {
    framework: "autogen",
    did: context.did,
    trust: {
      score: context.trustScore.score,
      tier: context.trustScore.tier,
      breakdown: context.trustScore.breakdown,
    },
    soulGate: context.soulGate,
    passport: context.passport
      ? {
          username: context.passport.username,
          walletAddress: context.passport.walletAddress,
          tier: context.passport.tier,
          kyaStatus: context.passport.kyaStatus,
          kycStatus: context.passport.kycStatus,
          agentName: context.passport.agentName,
          agentStatus: context.passport.agentStatus,
        }
      : undefined,
    didDocumentId: context.didDocument.id,
    metadata: context.metadata,
  };
}

function buildSystemMessage(context: AxiomIDAutoGenContextSeed): string {
  return [
    "AxiomID identity context is attached for this AutoGen run.",
    `DID: ${context.did}`,
    `Trust: ${context.trustScore.score} (${context.trustScore.tier})`,
    `Soul Gate: ${context.soulGate.allowed ? "allowed" : "denied"} - ${context.soulGate.reason}`,
    `Purpose: ${context.soulGate.purpose}`,
    "Use this context before delegation, tool execution, or attestation drafting.",
  ].join("\n");
}

const bootstrapParameters = {
  type: "object",
  required: ["did"],
  properties: {
    did: { type: "string", description: "AxiomID DID to resolve" },
    passportSlug: {
      type: "string",
      description: "Optional passport slug to hydrate public passport context",
    },
    minimumTrustScore: {
      type: "number",
      minimum: 0,
      maximum: 100,
      description: "Optional per-task Soul Gate threshold",
    },
    purpose: { type: "string", description: "AutoGen task purpose" },
    metadata: {
      type: "object",
      additionalProperties: true,
      description: "Host application metadata to carry into the tool context",
    },
  },
};

const gateParameters = {
  type: "object",
  required: ["did"],
  properties: {
    did: { type: "string", description: "AxiomID DID to authorize" },
    minimumTrustScore: {
      type: "number",
      minimum: 0,
      maximum: 100,
      description: "Optional per-task Soul Gate threshold",
    },
    purpose: { type: "string", description: "AutoGen task purpose" },
    metadata: {
      type: "object",
      additionalProperties: true,
      description: "Host application metadata to carry into the context",
    },
  },
};

const attestationParameters = {
  type: "object",
  required: ["subjectDid", "claim"],
  properties: {
    issuerDid: {
      type: "string",
      description: "Issuer DID. Defaults to the configured agentDid.",
    },
    subjectDid: { type: "string", description: "DID receiving the attestation" },
    claim: { type: "string", description: "Human-readable claim text" },
    evidence: {
      type: "object",
      additionalProperties: true,
      description: "Structured evidence from the AutoGen task",
    },
    expiresAt: {
      type: "string",
      description: "Optional ISO-8601 expiration timestamp",
    },
    purpose: { type: "string", description: "Why this draft was created" },
  },
};

export function createAxiomIDAutoGenAdapter(
  options: AxiomIDAutoGenAdapterOptions
): AxiomIDAutoGenAdapter {
  const now = options.now ?? (() => new Date());

  async function bootstrapAgent(
    input: AxiomIDAutoGenBootstrapInput
  ): Promise<AxiomIDAutoGenContext> {
    const did = requireNonEmpty(input.did, "did");
    const purpose = purposeFor(input.purpose, options.defaultPurpose);
    const requiredScore = minimumTrustScore(
      input.minimumTrustScore,
      options.minimumTrustScore
    );

    const [didDocument, trustScore] = await Promise.all([
      options.sdk.resolveDID(did),
      options.sdk.getTrustScore(did),
    ]);
    const passport = input.passportSlug
      ? await options.sdk.verifyPassport(input.passportSlug)
      : undefined;
    const soulGate = evaluateSoulGate(trustScore, requiredScore, purpose);
    const baseContext = {
      framework: "autogen" as const,
      did,
      didDocument,
      trustScore,
      passport,
      soulGate,
      metadata: input.metadata,
    };
    const contextWithoutToolContext = {
      ...baseContext,
      systemMessage: buildSystemMessage(baseContext),
    };

    return {
      ...contextWithoutToolContext,
      toolContext: createToolContext(baseContext),
    };
  }

  async function requireSoulGate(
    input: AxiomIDAutoGenGateInput
  ): Promise<AxiomIDAutoGenContext> {
    const context = await bootstrapAgent(input);
    if (!context.soulGate.allowed) {
      throw new AxiomIDAutoGenGateError(context.soulGate);
    }
    return context;
  }

  function createAttestationDraft(
    input: AxiomIDAutoGenAttestationDraftInput
  ): AxiomIDAutoGenAttestationDraft {
    const issuerDid = requireNonEmpty(input.issuerDid ?? options.agentDid, "issuerDid");
    const subjectDid = requireNonEmpty(input.subjectDid, "subjectDid");
    const claim = requireNonEmpty(input.claim, "claim");
    return {
      type: "AxiomIDAttestationDraft",
      issuerDid,
      subjectDid,
      claim,
      evidence: input.evidence ?? {},
      issuedAt: now().toISOString(),
      expiresAt: input.expiresAt,
      unsigned: true,
      framework: "autogen",
      purpose: purposeFor(input.purpose, options.defaultPurpose),
    };
  }

  function toToolDefinitions(): AxiomIDAutoGenToolDefinitions {
    return {
      bootstrapIdentity: {
        name: "axiomid_bootstrap_identity",
        description:
          "Resolve AxiomID DID, trust score, optional passport context, and Soul Gate state before AutoGen work.",
        parameters: bootstrapParameters,
        run: bootstrapAgent,
      },
      enforceSoulGate: {
        name: "axiomid_enforce_soul_gate",
        description:
          "Authorize an AutoGen task by requiring the DID to meet the configured AxiomID trust threshold.",
        parameters: gateParameters,
        run: requireSoulGate,
      },
      createAttestationDraft: {
        name: "axiomid_create_attestation_draft",
        description:
          "Create an unsigned AxiomID attestation draft from AutoGen task output.",
        parameters: attestationParameters,
        run: async (input) => createAttestationDraft(input),
      },
    };
  }

  return {
    bootstrapAgent,
    requireSoulGate,
    createAttestationDraft,
    buildSystemMessage,
    toToolDefinitions,
  };
}

export function createAxiomIDAutoGenToolDefinitions(
  options: AxiomIDAutoGenAdapterOptions
): AxiomIDAutoGenToolDefinitions {
  return createAxiomIDAutoGenAdapter(options).toToolDefinitions();
}
