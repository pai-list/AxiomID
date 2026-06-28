import { END, START, StateGraph } from "@langchain/langgraph";
import {
  createAxiomLangGraphNodes,
  type AxiomLangGraphContext,
  type LangGraphState,
} from "../src";

type AgentState = LangGraphState & {
  did: string;
  request: string;
  axiom?: AxiomLangGraphContext;
  decision?: string;
};

const axiom = createAxiomLangGraphNodes({
  sdkConfig: { network: "testnet" },
  minimumTrustScore: 85,
});

function runPrivilegedTask(state: AgentState): AgentState {
  return {
    ...state,
    decision: `Approved gated request for ${state.did}: ${state.request}`,
  };
}

const graph = new StateGraph<AgentState>()
  .addNode("axiom_bootstrap", axiom.bootstrapAgentContext)
  .addNode("axiom_gate", axiom.enforceSoulGate)
  .addNode("privileged_task", runPrivilegedTask)
  .addEdge(START, "axiom_bootstrap")
  .addEdge("axiom_bootstrap", "axiom_gate")
  .addEdge("axiom_gate", "privileged_task")
  .addEdge("privileged_task", END)
  .compile();

export async function runGatedExecution() {
  return graph.invoke({
    did: "did:axiom:pioneer.username",
    request: "issue restricted report",
  });
}
