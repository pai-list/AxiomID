import { AxiomIDError, AxiomSDK } from "./client";
import { AxiomSDKConfig, DIDDocument, TrustScore } from "./types";

export type LangGraphAxiomSDK = Pick<AxiomSDK, "resolveDID" | "getTrustScore">;

export interface AxiomLangGraphGate {
  allowed: boolean;
  minimumTrustScore: number;
  reason?: string;
}

export interface AxiomLangGraphDelegationStep {
  fromDid: string;
  toDid: string;
  capability: string;
}

export interface AxiomLangGraphAttestationDraft {
  issuerDid: string;
  subjectDid: string;
  type: "AxiomIDLangGraphContext";
  issuedAt: string;
  evidence: {
    trustScore: number;
    tier: string;
    gateAllowed: boolean;
    delegationChain?: AxiomLangGraphDelegationStep[];
  };
  metadata?: Record<string, unknown>;
}

export interface AxiomLangGraphContext {
  did: string;
  didDocument: DIDDocument;
  trustScore: TrustScore;
  gate: AxiomLangGraphGate;
  attestationDraft?: AxiomLangGraphAttestationDraft;
}

export interface AxiomLangGraphBootstrapInput {
  did: string;
  attestationSubjectDid?: string;
  delegationChain?: AxiomLangGraphDelegationStep[];
  metadata?: Record<string, unknown>;
}

export interface AxiomLangGraphOptions {
  sdk?: LangGraphAxiomSDK;
  sdkConfig?: AxiomSDKConfig;
  minimumTrustScore?: number;
  includeAttestationDraft?: boolean;
  now?: () => Date;
}

export interface AxiomLangGraphNodeOptions extends AxiomLangGraphOptions {
  didField?: string;
  contextKey?: string;
}

export type LangGraphState = Record<string, unknown>;

export interface AxiomLangGraphNodes {
  bootstrapAgentContext: <TState extends LangGraphState>(
    state: TState
  ) => Promise<TState & Record<string, AxiomLangGraphContext>>;
  enforceSoulGate: <TState extends LangGraphState>(state: TState) => TState;
}

export type AxiomLangGraphStreamEvent =
  | { type: "did:resolving"; did: string }
  | { type: "did:resolved"; did: string; didDocument: DIDDocument }
  | { type: "trust:loaded"; did: string; trustScore: TrustScore }
  | { type: "gate:checked"; did: string; gate: AxiomLangGraphGate };

const DEFAULT_MINIMUM_TRUST_SCORE = 70;
const DEFAULT_DID_FIELD = "did";
const DEFAULT_CONTEXT_KEY = "axiom";

function getSdk(options: AxiomLangGraphOptions): LangGraphAxiomSDK {
  if (options.sdk) {
    return options.sdk;
  }

  return new AxiomSDK(options.sdkConfig ?? { network: "mainnet" });
}

function getMinimumTrustScore(options: AxiomLangGraphOptions): number {
  return options.minimumTrustScore ?? DEFAULT_MINIMUM_TRUST_SCORE;
}

function evaluateSoulGate(
  trustScore: TrustScore,
  minimumTrustScore: number
): AxiomLangGraphGate {
  if (trustScore.score >= minimumTrustScore) {
    return { allowed: true, minimumTrustScore };
  }

  return {
    allowed: false,
    minimumTrustScore,
    reason: `Trust score ${trustScore.score} is below required minimum ${minimumTrustScore}`,
  };
}

function createAttestationDraft(
  input: AxiomLangGraphBootstrapInput,
  trustScore: TrustScore,
  gate: AxiomLangGraphGate,
  issuedAt: string
): AxiomLangGraphAttestationDraft {
  return {
    issuerDid: input.did,
    subjectDid: input.attestationSubjectDid ?? input.did,
    type: "AxiomIDLangGraphContext",
    issuedAt,
    evidence: {
      trustScore: trustScore.score,
      tier: trustScore.tier,
      gateAllowed: gate.allowed,
      ...(input.delegationChain ? { delegationChain: input.delegationChain } : {}),
    },
    ...(input.metadata ? { metadata: input.metadata } : {}),
  };
}

function readDidFromState(state: LangGraphState, didField: string): string {
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw new AxiomIDError(
      "LangGraph state must be a valid object",
      "LANGGRAPH_STATE_INVALID",
      400
    );
  }

  const did = state[didField];

  if (typeof did !== "string" || did.trim() === "") {
    throw new AxiomIDError(
      `LangGraph state must include a non-empty string DID at "${didField}"`,
      "LANGGRAPH_DID_MISSING",
      400
    );
  }

  return did;
}

function readContextFromState(
  state: LangGraphState,
  contextKey: string
): AxiomLangGraphContext {
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw new AxiomIDError(
      "LangGraph state must be a valid object",
      "LANGGRAPH_STATE_INVALID",
      400
    );
  }

  const context = state[contextKey];

  if (!context || typeof context !== "object" || !("gate" in context)) {
    throw new AxiomIDError(
      `LangGraph state must include AxiomID context at "${contextKey}"`,
      "LANGGRAPH_CONTEXT_MISSING",
      400
    );
  }

  return context as AxiomLangGraphContext;
}

export async function bootstrapLangGraphAgentContext(
  input: AxiomLangGraphBootstrapInput,
  options: AxiomLangGraphOptions = {}
): Promise<AxiomLangGraphContext> {
  const sdk = getSdk(options);
  const minimumTrustScore = getMinimumTrustScore(options);
  const [didDocument, trustScore] = await Promise.all([
    sdk.resolveDID(input.did),
    sdk.getTrustScore(input.did),
  ]);
  const gate = evaluateSoulGate(trustScore, minimumTrustScore);
  const issuedAt = (options.now ?? (() => new Date()))().toISOString();

  return {
    did: input.did,
    didDocument,
    trustScore,
    gate,
    ...(options.includeAttestationDraft
      ? {
          attestationDraft: createAttestationDraft(
            input,
            trustScore,
            gate,
            issuedAt
          ),
        }
      : {}),
  };
}

export function assertLangGraphSoulGate(context: AxiomLangGraphContext): void {
  if (context.gate.allowed) {
    return;
  }

  throw new AxiomIDError(
    context.gate.reason ?? "AxiomID Soul Gate denied LangGraph execution",
    "SOUL_GATE_DENIED",
    403
  );
}

export function createAxiomLangGraphNodes(
  options: AxiomLangGraphNodeOptions = {}
): AxiomLangGraphNodes {
  const didField = options.didField ?? DEFAULT_DID_FIELD;
  const contextKey = options.contextKey ?? DEFAULT_CONTEXT_KEY;

  return {
    async bootstrapAgentContext<TState extends LangGraphState>(
      state: TState
    ): Promise<TState & Record<string, AxiomLangGraphContext>> {
      const did = readDidFromState(state, didField);
      const context = await bootstrapLangGraphAgentContext({ did }, options);

      return {
        ...state,
        [contextKey]: context,
      } as TState & Record<string, AxiomLangGraphContext>;
    },

    enforceSoulGate<TState extends LangGraphState>(state: TState): TState {
      const context = readContextFromState(state, contextKey);
      assertLangGraphSoulGate(context);
      return state;
    },
  };
}

export async function* streamLangGraphBootstrap(
  input: AxiomLangGraphBootstrapInput,
  options: AxiomLangGraphOptions = {}
): AsyncGenerator<AxiomLangGraphStreamEvent, AxiomLangGraphContext, void> {
  const sdk = getSdk(options);
  const minimumTrustScore = getMinimumTrustScore(options);

  yield { type: "did:resolving", did: input.did };
  const didDocument = await sdk.resolveDID(input.did);
  yield { type: "did:resolved", did: input.did, didDocument };

  const trustScore = await sdk.getTrustScore(input.did);
  yield { type: "trust:loaded", did: input.did, trustScore };

  const gate = evaluateSoulGate(trustScore, minimumTrustScore);
  yield { type: "gate:checked", did: input.did, gate };

  const issuedAt = (options.now ?? (() => new Date()))().toISOString();
  return {
    did: input.did,
    didDocument,
    trustScore,
    gate,
    ...(options.includeAttestationDraft
      ? {
          attestationDraft: createAttestationDraft(
            input,
            trustScore,
            gate,
            issuedAt
          ),
        }
      : {}),
  };
}
