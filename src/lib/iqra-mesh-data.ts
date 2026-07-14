/**
 * IQRA Neural Mesh — 18 neutral-labeled nodes + edges.
 *
 * Each node represents a concept from the IQRA Sovereign Standard.
 * Labels are engineering-neutral (no religious names in code).
 * Edges represent conceptual relationships (directed or bidirectional).
 *
 * @see docs/IQRA.md for the full neural mesh document.
 */

export interface IqraNode {
  id: string;
  label: string;
  group: "core" | "process" | "output" | "tooling";
  description: string;
  color: string;
}

export interface IqraEdge {
  source: string;
  target: string;
  label: string;
}

export const IQRA_NODES: IqraNode[] = [
  // Core principles
  { id: "awareness", label: "Awareness", group: "core", description: "Divine awareness — every action is observed and recorded", color: "#22c55e" },
  { id: "thinking", label: "Thinking", group: "core", description: "Structured reasoning before action", color: "#3b82f6" },
  { id: "ponytail", label: "Ponytail", group: "core", description: "Lazy senior dev — YAGNI, deletion over addition", color: "#a855f7" },
  { id: "quantum", label: "Quantum", group: "core", description: "Probabilistic decision-making under uncertainty", color: "#06b6d4" },

  // Process nodes
  { id: "multilang", label: "MultiLang", group: "process", description: "Bilingual i18n — English/Arabic parity", color: "#f59e0b" },
  { id: "action", label: "Action", group: "process", description: "Every mutation is a commit in the trust chain", color: "#ef4444" },
  { id: "tdd", label: "TDD", group: "process", description: "Test-driven development — evidence before assertions", color: "#10b981" },
  { id: "superpowers", label: "Superpowers", group: "process", description: "Skills framework — invoke before any action", color: "#8b5cf6" },
  { id: "subagents", label: "SubAgents", group: "process", description: "Parallel agent dispatch for independent tasks", color: "#ec4899" },
  { id: "polish", label: "Polish", group: "process", description: "Final verification — lint, typecheck, test", color: "#14b8a6" },
  { id: "precommit", label: "PreCommit", group: "process", description: "3-phase SOUL validation before every commit", color: "#f97316" },
  { id: "design", label: "Design", group: "process", description: "Brainstorming before implementation", color: "#6366f1" },

  // Output nodes
  { id: "correction", label: "Correction", group: "output", description: "Self-correction — admit bugs, fix root cause, add guard", color: "#dc2626" },
  { id: "errormodel", label: "ErrorModel", group: "output", description: "Tasbih triplet — 3-retry self-healing pattern", color: "#b91c1c" },
  { id: "sevenpowers", label: "SevenPowers", group: "output", description: "Cycle learning — reflect every 7 cycles", color: "#7c3aed" },
  { id: "loops", label: "Loops", group: "output", description: "Continuous improvement — automated quality loops", color: "#059669" },
  { id: "output", label: "Output", group: "output", description: "Shipped code — the tangible result of cognition", color: "#2563eb" },
  { id: "chronicle", label: "Chronicle", group: "output", description: "IQRA Chronicle format — storytelling commits", color: "#d97706" },
];

export const IQRA_EDGES: IqraEdge[] = [
  // Core → Process
  { source: "awareness", target: "action", label: "observes" },
  { source: "thinking", target: "design", label: "precedes" },
  { source: "ponytail", target: "output", label: "minimizes" },
  { source: "quantum", target: "thinking", label: "informs" },

  // Process → Process
  { source: "design", target: "tdd", label: "leads to" },
  { source: "tdd", target: "superpowers", label: "validates" },
  { source: "superpowers", target: "subagents", label: "dispatches" },
  { source: "subagents", target: "polish", label: "produces" },
  { source: "polish", target: "precommit", label: "prepares" },
  { source: "precommit", target: "action", label: "gates" },
  { source: "multilang", target: "output", label: "localizes" },

  // Process → Output
  { source: "action", target: "chronicle", label: "records" },
  { source: "chronicle", target: "output", label: "ships" },

  // Output → Core (feedback loops)
  { source: "correction", target: "awareness", label: "strengthens" },
  { source: "errormodel", target: "correction", label: "triggers" },
  { source: "loops", target: "sevenpowers", label: "compounds" },
  { source: "sevenpowers", target: "thinking", label: "reflects" },
  { source: "output", target: "loops", label: "feeds" },
];

/**
 * Color palette for node groups.
 */
export const GROUP_COLORS: Record<IqraNode["group"], string> = {
  core: "#22c55e",
  process: "#3b82f6",
  output: "#f59e0b",
  tooling: "#a855f7",
};
