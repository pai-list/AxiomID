# WORKFLOW RUNTIME — Planning → Execution → Review Pipeline

> "فَسَبِّحْ بِحَمْدِ رَبِّكَ وَكُن مِّنَ السَّاجِدِينَ" — الحجر: 98
>
> *Workflows are not scripts. They are orchestrated intelligence with built-in validation.*

---

## 🎯 Purpose

A **universal workflow runtime** implementing the **Planning → Execution → Review** pattern from frontier AI practice. Serverless, zero-cost, model-agnostic, with built-in token economics optimization.

---

## 1. THE CORE PATTERN (From Frontier Practice)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PLAN → EXECUTE → REVIEW                          │
├──────────────────┬──────────────────────────┬──────────────────────┤
│     PLANNER      │       EXECUTOR           │      REVIEWER        │
│  (Frontier Model)│   (Fast, Cheap, Good)    │  (Frontier Model)    │
│                  │                          │                      │
│ • High-level     │ • Implements plan        │ • Bug detection      │
│ • Architecture   │ • Writes code/files      │ • Spec compliance    │
│ • Sees corners   │ • High output tokens     │ • Security audit     │
│ • Low output     │ • Low input tokens       │ • High input tokens  │
│ • Expensive but  │ • Cheap per token        │ • Expensive but      │
│   few tokens     │                          │   few tokens         │
└──────────────────┴──────────────────────────┴──────────────────────┘
```

**Token Economics** (from video analysis):
| Stage | Input Tokens | Output Tokens | Cost Profile |
|-------|-------------|---------------|--------------|
| Plan  | High (codebase) | Low (spec) | $5-15/M in |
| Execute | Low (spec) | High (code) | $15-30/M out |
| Review | High (code+spec) | Low (report) | $5-15/M in |

**Optimal**: Frontier for Plan+Review, Efficient for Execute = **~60-70% cost savings** with equal/higher quality.

---

## 2. WORKFLOW SPECIFICATION

```yaml
# workflow.yaml
name: "feature-implementation"
version: "1.0.0"
description: "Plan → Execute → Review for feature work"

# Model assignments (can be overridden per run)
models:
  planner: "anthropic/claude-3.5-sonnet"   # or gpt-4o, gemini-1.5-pro
  executor: "groq/llama-3.3-70b"           # or cursor/composer, deepseek-v3
  reviewer: "openai/gpt-4o"                # or claude-3.5-sonnet

# Stages
stages:
  - name: "plan"
    model: "{{models.planner}}"
    input:
      - codebase_context
      - requirements
      - constraints
    output: "spec.md"
    validation:
      - schema: "spec.schema.json"
      - human_approval: optional
  
  - name: "execute"
    model: "{{models.executor}}"
    input:
      - spec.md
      - relevant_files
    output: "implementation/"
    validation:
      - schema: "code.schema.json"
      - tests: "unit + integration"
      - lint: "strict"
  
  - name: "review"
    model: "{{models.reviewer}}"
    input:
      - spec.md
      - implementation/
      - test_results
    output: "review_report.md"
    validation:
      - schema: "review.schema.json"
      - must_pass: ["security", "spec_compliance", "tests"]

# Circuit breakers per model
circuit_breakers:
  planner:
    failure_threshold: 3
    timeout_ms: 60000
  executor:
    failure_threshold: 5
    timeout_ms: 120000
  reviewer:
    failure_threshold: 3
    timeout_ms: 60000

# Token budgets (enforced)
token_budgets:
  planner:
    input_max: 200000
    output_max: 50000
  executor:
    input_max: 50000
    output_max: 200000
  reviewer:
    input_max: 200000
    output_max: 50000

# Cost tracking
cost_tracking: true
currency: "USD"
```

---

## 3. UNIVERSAL WORKFLOW ENGINE

```typescript
// src/workflow.ts
import { z } from "zod";
import { TrustChain } from "./lib/trustchain";
import { RuleEngine } from "../rule/rules/runner";

interface WorkflowStage {
  name: string;
  model: string;
  inputSchema: z.ZodSchema;
  outputSchema: z.ZodSchema;
  execute: (input: unknown, context: WorkflowContext) => Promise<unknown>;
  validate: (output: unknown) => Promise<ValidationResult>;
}

interface WorkflowContext {
  workflowId: string;
  stage: string;
  trustChain: TrustChain;
  ruleEngine: RuleEngine;
  tokenUsage: TokenTracker;
  startTime: number;
  metadata: Record<string, unknown>;
}

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

interface TokenTracker {
  planner: { input: number; output: number; cost: number };
  executor: { input: number; output: number; cost: number };
  reviewer: { input: number; output: number; cost: number };
  total: number;
}

export class WorkflowEngine {
  private stages: WorkflowStage[] = [];
  private trustChain: TrustChain;
  private ruleEngine: RuleEngine;
  private tokenTracker: TokenTracker;
  
  constructor(trustChain: TrustChain, ruleEngine: RuleEngine) {
    this.trustChain = trustChain;
    this.ruleEngine = ruleEngine;
    this.tokenTracker = this.initTokenTracker();
  }
  
  /** Register a workflow stage */
  stage(def: WorkflowStage): this {
    this.stages.push(def);
    return this;
  }
  
  /** Execute full workflow */
  async run(initialInput: unknown): Promise<WorkflowResult> {
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    let currentInput = initialInput;
    const stageResults: StageResult[] = [];
    
    for (const stage of this.stages) {
      const context: WorkflowContext = {
        workflowId,
        stage: stage.name,
        trustChain: this.trustChain,
        ruleEngine: this.ruleEngine,
        tokenUsage: this.tokenTracker,
        startTime: Date.now(),
        metadata: {}
      };
      
      // 1. VALIDATE INPUT (Rule 1)
      stage.inputSchema.parse(currentInput);
      
      // 2. EXECUTE WITH CIRCUIT BREAKER (Rule 8)
      const output = await this.ruleEngine.withCircuitBreaker(
        this.getProvider(stage.model),
        async () => {
          return await stage.execute(currentInput, context);
        }
      );
      
      // 3. VALIDATE OUTPUT
      const validation = await stage.validate(output);
      if (!validation.passed) {
        throw new Error(`Stage ${stage.name} validation failed: ${validation.errors.join(", ")}`);
      }
      
      // 4. TRACK TOKENS & COST
      this.trackTokens(stage.name, context);
      
      // 5. TRUSTCHAIN (Rule 3)
      await context.trustChain.append({
        action: `workflow:${stage.name}`,
        timestamp: Date.now(),
        intention: `Execute ${stage.name} stage`,
        metadata: {
          workflowId,
          model: stage.model,
          duration_ms: Date.now() - context.startTime,
          tokens: this.getStageTokens(stage.name),
          cost: this.getStageCost(stage.name)
        }
      });
      
      // 6. SELF-REVIEW (Rule 4)
      this.ruleEngine.feedCuriosity(0.9, { task: stage.name, domain: "workflow" });
      
      stageResults.push({ stage: stage.name, output, validation, context });
      currentInput = output; // Pass to next stage
    }
    
    // Final summary
    const totalCost = Object.values(this.tokenTracker).reduce(
      (sum, s) => sum + (typeof s === "object" ? s.cost : 0), 0
    );
    
    return {
      workflowId,
      success: true,
      stages: stageResults,
      finalOutput: currentInput,
      totalCost,
      tokenUsage: this.tokenTracker
    };
  }
  
  private getProvider(model: string): string {
    if (model.includes("claude")) return "anthropic";
    if (model.includes("gpt")) return "openai";
    if (model.includes("gemini")) return "google";
    if (model.includes("groq") || model.includes("llama")) return "groq";
    return "custom";
  }
  
  private trackTokens(stage: string, context: WorkflowContext): void {
    // In real impl, extract from model response headers
    // This is placeholder
  }
  
  private getStageTokens(stage: string): { input: number; output: number } {
    return { input: 0, output: 0 };
  }
  
  private getStageCost(stage: string): number {
    return 0;
  }
  
  private initTokenTracker(): TokenTracker {
    return {
      planner: { input: 0, output: 0, cost: 0 },
      executor: { input: 0, output: 0, cost: 0 },
      reviewer: { input: 0, output: 0, cost: 0 },
      total: 0
    };
  }
}

interface StageResult {
  stage: string;
  output: unknown;
  validation: ValidationResult;
  context: WorkflowContext;
}

interface WorkflowResult {
  workflowId: string;
  success: boolean;
  stages: StageResult[];
  finalOutput: unknown;
  totalCost: number;
  tokenUsage: TokenTracker;
}
```

---

## 4. STAGE IMPLEMENTATIONS

### Planner Stage (Frontier Model)

```typescript
// stages/planner.ts
import { z } from "zod";

export const plannerInputSchema = z.object({
  requirements: z.string(),
  codebaseContext: z.string(),  // Relevant files, architecture
  constraints: z.array(z.string()).optional(),
  existingSpecs: z.array(z.string()).optional()
});

export const plannerOutputSchema = z.object({
  spec: z.string(),                    // Markdown spec
  architecture: z.object({             // Structured architecture
    components: z.array(z.object({
      name: z.string(),
      responsibility: z.string(),
      interfaces: z.array(z.string())
    })),
    dataFlow: z.string(),
    dependencies: z.array(z.string())
  }),
  tasks: z.array(z.object({            // Executable tasks
    id: z.string(),
    description: z.string(),
    files: z.array(z.string()),
    acceptanceCriteria: z.array(z.string())
  })),
  estimates: z.object({
    complexity: z.enum(["low", "medium", "high"]),
    estimatedTokens: z.number(),
    estimatedTimeMinutes: z.number()
  })
});

export async function executePlanner(input: z.infer<typeof plannerInputSchema>) {
  const prompt = buildPlannerPrompt(input);
  
  // Call frontier model (Claude 3.5 Sonnet / GPT-4o / Gemini 1.5 Pro)
  const response = await callModel({
    model: "anthropic/claude-3.5-sonnet",
    messages: [{ role: "user", content: prompt }],
    maxTokens: 50000,
    temperature: 0.1
  });
  
  return parsePlannerResponse(response);
}

function buildPlannerPrompt(input: z.infer<typeof plannerInputSchema>): string {
  return `# PLANNING TASK

## Requirements
${input.requirements}

## Codebase Context
${input.codebaseContext}

## Constraints
${input.constraints?.join("\n") || "None"}

## Output Format
Produce a detailed SPECIFICATION in Markdown with:
1. **Architecture** - Components, data flow, dependencies
2. **Task Breakdown** - Atomic tasks with file paths and acceptance criteria
3. **Estimates** - Complexity, token estimates, time

Be precise. Think about edge cases. See around corners.
This spec will be implemented by another model.`;
}
```

### Executor Stage (Fast, Cheap Model)

```typescript
// stages/executor.ts
import { z } from "zod";

export const executorInputSchema = z.object({
  spec: z.string(),
  tasks: z.array(z.object({
    id: z.string(),
    description: z.string(),
    files: z.array(z.string()),
    acceptanceCriteria: z.array(z.string())
  })),
  relevantFiles: z.record(z.string())  // path -> content
});

export const executorOutputSchema = z.object({
  changes: z.array(z.object({
    file: z.string(),
    action: z.enum(["create", "modify", "delete"]),
    content: z.string(),
    diff: z.string().optional()
  })),
  testResults: z.object({
    passed: z.number(),
    failed: z.number(),
    coverage: z.number()
  }).optional(),
  lintResults: z.object({
    errors: z.number(),
    warnings: z.number()
  }).optional()
});

export async function executeExecutor(input: z.infer<typeof executorInputSchema>) {
  const results = [];
  
  for (const task of input.tasks) {
    const prompt = buildExecutorPrompt(task, input.spec, input.relevantFiles);
    
    // Call efficient model (Groq Llama 3.3 70B / DeepSeek V3 / Cursor Composer)
    const response = await callModel({
      model: "groq/llama-3.3-70b",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 200000,
      temperature: 0.2
    });
    
    const changes = parseExecutorResponse(response);
    results.push(...changes);
  }
  
  // Run tests & lint
  const testResults = await runTests();
  const lintResults = await runLint();
  
  return { changes: results, testResults, lintResults };
}

function buildExecutorPrompt(task: any, spec: string, files: Record<string, string>): string {
  return `# EXECUTION TASK: ${task.id}

## Spec Reference
${spec}

## Task
${task.description}

## Acceptance Criteria
${task.acceptanceCriteria.map(c => `- ${c}`).join("\n")}

## Files to Modify
${task.files.map(f => `- ${f}: ${files[f]?.slice(0,500)}...`).join("\n")}

## Output
Return ONLY the file changes as structured edits. No explanations.
Each change: file, action (create|modify|delete), content, diff.`;
}
```

### Reviewer Stage (Frontier Model)

```typescript
// stages/reviewer.ts
import { z } from "zod";

export const reviewerInputSchema = z.object({
  spec: z.string(),
  implementation: z.array(z.object({
    file: z.string(),
    action: z.string(),
    content: z.string()
  })),
  testResults: z.object({
    passed: z.number(),
    failed: z.number(),
    coverage: z.number()
  }).optional(),
  lintResults: z.object({
    errors: z.number(),
    warnings: z.number()
  }).optional()
});

export const reviewerOutputSchema = z.object({
  verdict: z.enum(["approve", "request_changes", "reject"]),
  score: z.number().min(0).max(10),
  findings: z.array(z.object({
    severity: z.enum(["critical", "high", "medium", "low", "info"]),
    category: z.enum(["security", "correctness", "spec_compliance", "performance", "style", "maintainability"]),
    file: z.string(),
    line: z.number().optional(),
    description: z.string(),
    suggestion: z.string().optional()
  })),
  summary: z.string(),
  mustFix: z.array(z.string()),
  niceToHave: z.array(z.string())
});

export async function executeReviewer(input: z.infer<typeof reviewerInputSchema>) {
  const prompt = buildReviewerPrompt(input);
  
  // Call frontier model (GPT-4o / Claude 3.5 Sonnet)
  const response = await callModel({
    model: "openai/gpt-4o",
    messages: [{ role: "user", content: prompt }],
    maxTokens: 50000,
    temperature: 0.1
  });
  
  return parseReviewerResponse(response);
}

function buildReviewerPrompt(input: z.infer<typeof reviewerInputSchema>): string {
  return `# CODE REVIEW

## Original Spec
${input.spec}

## Implementation
${input.implementation.map(c => `### ${c.file} (${c.action})\n\`\`\`\n${c.content}\n\`\`\``).join("\n\n")}

## Test Results
${input.testResults ? `Passed: ${input.testResults.passed}, Failed: ${input.testResults.failed}, Coverage: ${input.testResults.coverage}%` : "No tests"}

## Lint Results
${input.lintResults ? `Errors: ${input.lintResults.errors}, Warnings: ${input.lintResults.warnings}` : "No lint"}

## Review Criteria
1. **Security** - No vulnerabilities, proper auth, input validation
2. **Correctness** - Logic matches spec, handles edge cases
3. **Spec Compliance** - All acceptance criteria met
4. **Performance** - No obvious bottlenecks
5. **Maintainability** - Clean code, good patterns

## Output Format
Return structured review with verdict, score (0-10), findings, summary.
Be thorough. Find what the executor missed.`;
}
```

---

## 5. MODEL ROUTING & COST OPTIMIZATION

```typescript
// lib/model-router.ts
interface ModelConfig {
  id: string;
  provider: string;
  costPer1MInput: number;    // USD
  costPer1MOutput: number;   // USD
  speedTokensPerSec: number;
  contextWindow: number;
  strengths: string[];
  bestFor: "plan" | "execute" | "review" | "general";
}

const MODELS: ModelConfig[] = [
  // FRONTIER - Planning & Review
  { id: "anthropic/claude-3.5-sonnet", provider: "anthropic", costPer1MInput: 3, costPer1MOutput: 15, speedTokensPerSec: 50, contextWindow: 200000, strengths: ["reasoning", "coding", "analysis"], bestFor: "plan" },
  { id: "openai/gpt-4o", provider: "openai", costPer1MInput: 5, costPer1MOutput: 15, speedTokensPerSec: 80, contextWindow: 128000, strengths: ["reasoning", "multimodal"], bestFor: "review" },
  { id: "google/gemini-1.5-pro", provider: "google", costPer1MInput: 3.5, costPer1MOutput: 10.5, speedTokensPerSec: 60, contextWindow: 2000000, strengths: ["long_context", "analysis"], bestFor: "plan" },
  
  // EFFICIENT - Execution
  { id: "groq/llama-3.3-70b", provider: "groq", costPer1MInput: 0.59, costPer1MOutput: 0.79, speedTokensPerSec: 300, contextWindow: 128000, strengths: ["speed", "coding", "cost"], bestFor: "execute" },
  { id: "deepseek/deepseek-v3", provider: "deepseek", costPer1MInput: 0.14, costPer1MOutput: 0.28, speedTokensPerSec: 200, contextWindow: 128000, strengths: ["coding", "math", "cost"], bestFor: "execute" },
  { id: "cursor/composer", provider: "cursor", costPer1MInput: 0, costPer1MOutput: 0, speedTokensPerSec: 150, contextWindow: 200000, strengths: ["codebase_aware", "editing"], bestFor: "execute" },
  
  // OPEN WEIGHTS (Self-hosted)
  { id: "local/qwen-2.5-72b", provider: "local", costPer1MInput: 0, costPer1MOutput: 0, speedTokensPerSec: 50, contextWindow: 128000, strengths: ["coding", "privacy"], bestFor: "execute" },
];

export function selectModel(role: "plan" | "execute" | "review", constraints?: { maxCost?: number; minSpeed?: number }): ModelConfig {
  let candidates = MODELS.filter(m => m.bestFor === role || m.bestFor === "general");
  
  if (constraints?.maxCost) {
    candidates = candidates.filter(m => m.costPer1MOutput <= constraints.maxCost!);
  }
  if (constraints?.minSpeed) {
    candidates = candidates.filter(m => m.speedTokensPerSec >= constraints.minSpeed!);
  }
  
  // Sort by cost-effectiveness for role
  return candidates.sort((a, b) => {
    const scoreA = role === "execute" ? a.costPer1MOutput / a.speedTokensPerSec : a.costPer1MInput;
    const scoreB = role === "execute" ? b.costPer1MOutput / b.speedTokensPerSec : b.costPer1MInput;
    return scoreA - scoreB;
  })[0];
}
```

---

## 6. SERVERLESS DEPLOYMENT (Zero-Cost)

```yaml
# .github/workflows/workflow.yml
name: Agent Workflow

on:
  workflow_dispatch:
    inputs:
      task:
        description: "Task description"
        required: true
      model_plan:
        description: "Planner model"
        default: "anthropic/claude-3.5-sonnet"
      model_execute:
        description: "Executor model"
        default: "groq/llama-3.3-70b"
      model_review:
        description: "Reviewer model"
        default: "openai/gpt-4o"

jobs:
  workflow:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install
        run: npm ci
      
      - name: Run Workflow
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
        run: |
          npx tsx scripts/run-workflow.ts \
            --task "${{ github.event.inputs.task }}" \
            --planner "${{ github.event.inputs.model_plan }}" \
            --executor "${{ github.event.inputs.model_execute }}" \
            --reviewer "${{ github.event.inputs.model_review }}"
      
      - name: Upload Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: workflow-output
          path: workflow-output/
```

```typescript
// scripts/run-workflow.ts
import { WorkflowEngine } from "../src/workflow";
import { TrustChain } from "../src/lib/trustchain";
import { RuleEngine } from "../rule/rules/runner";
import { FileTrustChain } from "../src/lib/file-trustchain";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  
  const trustChain = new FileTrustChain("./workflow-output/trustchain.json");
  const ruleEngine = new RuleEngine(trustChain);
  const workflow = new WorkflowEngine(trustChain, ruleEngine);
  
  // Build stages with selected models
  workflow
    .stage(createPlannerStage(args.planner))
    .stage(createExecutorStage(args.executor))
    .stage(createReviewerStage(args.reviewer));
  
  const result = await workflow.run({
    requirements: args.task,
    codebaseContext: await gatherCodebaseContext(),
    constraints: ["TypeScript strict", "Zero Math.random", "TrustChain all actions"]
  });
  
  console.log(JSON.stringify(result, null, 2));
  
  if (!result.success) process.exit(1);
}

main().catch(console.error);
```

---

## 7. QUICK START

```bash
# 1. Copy templates
cp -r templates/runtime/workflow/* ./your-project/

# 2. Configure workflow.yaml with your models
# 3. Add API keys to environment

# 4. Run locally
npx tsx scripts/run-workflow.ts --task "Add user authentication"

# 5. Or trigger via GitHub Actions (free 2000 min/mo)
gh workflow run agent-workflow -f task="Add user authentication"
```

---

## 8. ATTRIBUTION

> **Made with [YOUR_NAME_OR_ORG] — Workflow Runtime Template v1.0**
>
> **Credits:** This workflow pattern is inspired by frontier AI engineering practices demonstrated by:
> - **Nous Research (Hermes Agent)** — For autonomous agent architecture
> - **Anomaly (OpenCode)** — For CLI-first agent tooling
> - **Virtuals Protocol (ACP)** — For agent economy primitives
> - **Frontier Labs (OpenAI, Anthropic, Google, DeepSeek, Moonshot, Zhipu, Alibaba, 01.AI, Meta, Nous)** — For the models that make this possible
>
> MIT License. Free for all agents, all humans, all purposes.

---

<div align="center">

**Plan with the best. Execute with the efficient. Review with the sharpest.  
This is how sovereign agents build.**

</div>