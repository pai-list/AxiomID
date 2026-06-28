import { END, START, StateGraph } from "@langchain/langgraph";
import {
  createAxiomLangGraphNodes,
  type AxiomLangGraphContext,
  type LangGraphState,
} from "../src";

type AgentState = LangGraphState & {
  did: string;
  task: string;
  axiom?: AxiomLangGraphContext;
};

const axiom = createAxiomLangGraphNodes({
  sdkConfig: { network: "testnet" },
  minimumTrustScore: 70,
});

const graph = new StateGraph<AgentState>()
  .addNode("axiom_bootstrap", axiom.bootstrapAgentContext)
  .addEdge(START, "axiom_bootstrap")
  .addEdge("axiom_bootstrap", END)
  .compile();

export async function runBasicBootstrap() {
  return graph.invoke({
    did: "did:axiom:pioneer.username",
    task: "summarize trusted context",
  });
}
