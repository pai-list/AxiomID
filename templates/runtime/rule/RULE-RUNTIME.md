# RULE RUNTIME — Validation & Governance Engine

> "وَمَا أُوتِيتُم مِّنَ الْعِلْمِ إِلَّا قَلِيلًا" — الإسراء: 85
>
> *Rules are not constraints. They are the immune system of sovereign code.*

---

## 🎯 Purpose

A **universal rule runtime** that enforces invariants at every layer: input, execution, output, payment, audit. Composable, testable, auditable. Works in any runtime.

---

## 1. THE 10 INVARIANT RULES (RULE 0-9)

| Rule | Name | Enforcement Point | Description |
|------|------|-------------------|-------------|
| **0** | **Security First** | Pre-flight | Before any feature/loop, threat model |
| **1** | **Zod Validate All Inputs** | Input boundary | Every external input parsed via Zod schema |
| **2** | **Crypto Random for Payments** | Payment path | `crypto.randomBytes` only — zero `Math.random` |
| **3** | **TrustChain Append + Audit Hash** | Post-action | Every action logged with intention + hash chain |
| **4** | **Self-Review After Every Run** | Post-execution | Non-blocking quality/confidence review |
| **5** | **Meta-Loop: 5 Active Layers** | Continuous | Background: perception, reasoning, memory, action, governance |
| **6** | **Quantum Topology** | Background | Cross-agent pattern detection in background |
| **7** | **Curiosity Engine** | Post-task | Feeds on self_score, drives exploration |
| **8** | **Circuit Breaker** | Per provider | Isolate failing LLM/tool providers |
| **9** | **Attribution** | Output | "Made with [ORG]" — credit the builders |

---

## 2. RULE ENGINE ARCHITECTURE

```typescript
// types.ts
type RuleId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

interface RuleContext {
  // Input context
  input: unknown;
  inputSchema: z.ZodSchema;
  
  // Execution context
  action: string;
  intention: string;
  provider?: string;
  
  // Output context
  output?: unknown;
  outputSchema?: z.ZodSchema;
  
  // System context
  trustChain: TrustChain;
  timestamp: number;
  agentId: string;
}

interface RuleResult {
  rule: RuleId;
  passed: boolean;
  message?: string;
  severity: "info" | "warn" | "error" | "critical";
  metadata?: Record<string, unknown>;
}

type RuleFn = (ctx: RuleContext) => Promise<RuleResult>;
```

---

## 3. RULE IMPLEMENTATIONS

### Rule 0: Security First (Pre-flight Threat Model)

```typescript
// rules/rule0-security-first.ts
export async function rule0_securityFirst(ctx: RuleContext): Promise<RuleResult> {
  const threats = analyzeThreatModel(ctx.action, ctx.input);
  
  if (threats.critical.length > 0) {
    return {
      rule: 0,
      passed: false,
      message: `Critical threats: ${threats.critical.join(", ")}`,
      severity: "critical",
      metadata: { threats }
    };
  }
  
  return { rule: 0, passed: true, severity: "info", metadata: { threats } };
}

function analyzeThreatModel(action: string, input: unknown) {
  // Implement STRIDE, PASTA, or your threat model
  return { critical: [], high: [], medium: [], low: [] };
}
```

### Rule 1: Zod Validate All Inputs

```typescript
// rules/rule1-zod-validate.ts
export async function rule1_zodValidate(ctx: RuleContext): Promise<RuleResult> {
  try {
    ctx.inputSchema.parse(ctx.input);
    return { rule: 1, passed: true, severity: "info" };
  } catch (err) {
    return {
      rule: 1,
      passed: false,
      message: `Input validation failed: ${err}`,
      severity: "error",
      metadata: { errors: err instanceof z.ZodError ? err.errors : [] }
    };
  }
}
```

### Rule 2: Crypto Random for Payments

```typescript
// rules/rule2-crypto-random.ts
import { randomBytes } from "crypto";

export function secureRandomBytes(length: number): Buffer {
  // RULE 2: NEVER use Math.random() for anything security-related
  return randomBytes(length);
}

export async function rule2_cryptoRandom(ctx: RuleContext): Promise<RuleResult> {
  // This rule is enforced by static analysis / linting
  // Runtime check: verify no Math.random in payment paths
  const hasMathRandom = detectMathRandomInCallStack();
  
  if (hasMathRandom && isPaymentPath(ctx.action)) {
    return {
      rule: 2,
      passed: false,
      message: "Math.random() detected in payment path — use crypto.randomBytes()",
      severity: "critical"
    };
  }
  
  return { rule: 2, passed: true, severity: "info" };
}
```

### Rule 3: TrustChain Append + Audit Hash

```typescript
// rules/rule3-trustchain.ts
export async function rule3_trustchain(ctx: RuleContext): Promise<RuleResult> {
  try {
    await ctx.trustChain.append({
      action: ctx.action,
      timestamp: ctx.timestamp,
      intention: ctx.intention,
      metadata: {
        agent: ctx.agentId,
        input_hash: hash(ctx.input),
        output_hash: ctx.output ? hash(ctx.output) : null
      }
    });
    return { rule: 3, passed: true, severity: "info" };
  } catch (err) {
    return {
      rule: 3,
      passed: false,
      message: `TrustChain append failed: ${err}`,
      severity: "critical"
    };
  }
}
```

### Rule 4: Self-Review After Every Run

```typescript
// rules/rule4-selfreview.ts
export async function rule4_selfReview(ctx: RuleContext): Promise<RuleResult> {
  // Non-blocking — queue microtask
  queueMicrotask(async () => {
    const review = await selfReviewEngine.analyze({
      tool: ctx.action,
      input: ctx.input,
      output: ctx.output,
      confidence: 0.95
    });
    
    await ctx.trustChain.append({
      action: "self_review",
      timestamp: Date.now(),
      intention: `Review ${ctx.action}`,
      metadata: review
    });
  });
  
  return { rule: 4, passed: true, severity: "info" };
}
```

### Rule 5: Meta-Loop (5 Active Layers)

```typescript
// rules/rule5-metalLoop.ts
interface MetaLoopLayers {
  perception: () => Promise<void>;      // Input monitoring
  reasoning: () => Promise<void>;       // Decision making
  memory: () => Promise<void>;          // Memory sync
  action: () => Promise<void>;          // Execution
  governance: () => Promise<void>;      // Rule enforcement
}

export class MetaLoop {
  private layers: MetaLoopLayers;
  private interval: NodeJS.Timeout | null = null;
  
  constructor(layers: MetaLoopLayers) {
    this.layers = layers;
  }
  
  start(intervalMs = 5000): void {
    this.interval = setInterval(async () => {
      await Promise.allSettled([
        this.layers.perception(),
        this.layers.reasoning(),
        this.layers.memory(),
        this.layers.action(),
        this.layers.governance()
      ]);
    }, intervalMs);
  }
  
  stop(): void {
    if (this.interval) clearInterval(this.interval);
  }
}
```

### Rule 6: Quantum Topology (Cross-Agent Patterns)

```typescript
// rules/rule6-quantum-topology.ts
export class QuantumTopology {
  private patternGraph = new Map<string, PatternNode>();
  
  async observe(agentId: string, action: string, result: unknown): Promise<void> {
    const key = `${agentId}:${action}`;
    const node = this.patternGraph.get(key) || { 
      count: 0, 
      outcomes: [], 
      correlations: new Map() 
    };
    
    node.count++;
    node.outcomes.push({ result, timestamp: Date.now() });
    
    // Detect cross-agent correlations
    for (const [otherKey, otherNode] of this.patternGraph) {
      if (otherKey !== key) {
        const correlation = this.computeCorrelation(node.outcomes, otherNode.outcomes);
        if (correlation > 0.7) {
          node.correlations.set(otherKey, correlation);
        }
      }
    }
    
    this.patternGraph.set(key, node);
  }
  
  getInsights(): TopologyInsight[] {
    // Return actionable patterns
    return [];
  }
}
```

### Rule 7: Curiosity Engine

```typescript
// rules/rule7-curiosity.ts
export class CuriosityEngine {
  private interests = new Map<string, number>(); // topic -> score
  
  feed(selfScore: number, context: { task: string; domain: string }): void {
    // High self_score + novel domain = curiosity spike
    const novelty = this.computeNovelty(context.domain);
    const curiosity = selfScore * novelty;
    
    const current = this.interests.get(context.domain) || 0;
    this.interests.set(context.domain, current + curiosity);
  }
  
  getTopInterests(limit = 5): string[] {
    return Array.from(this.interests.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([topic]) => topic);
  }
  
  suggestExploration(): string[] {
    // Return research directions based on curiosity
    return this.getTopInterests(3).map(t => `Deep dive: ${t}`);
  }
}
```

### Rule 8: Circuit Breaker (Per Provider)

```typescript
// rules/rule8-circuitbreaker.ts
type Provider = "openai" | "anthropic" | "google" | "openrouter" | "local" | "custom";

interface CircuitState {
  failures: number;
  successes: number;
  last_failure: number;
  state: "closed" | "open" | "half-open";
}

const circuits: Record<Provider, CircuitState> = {
  openai: { failures: 0, successes: 0, last_failure: 0, state: "closed" },
  anthropic: { failures: 0, successes: 0, last_failure: 0, state: "closed" },
  google: { failures: 0, successes: 0, last_failure: 0, state: "closed" },
  openrouter: { failures: 0, successes: 0, last_failure: 0, state: "closed" },
  local: { failures: 0, successes: 0, last_failure: 0, state: "closed" },
  custom: { failures: 0, successes: 0, last_failure: 0, state: "closed" }
};

const CONFIG = {
  failureThreshold: 5,
  successThreshold: 3,
  timeoutMs: 60_000
};

export async function withCircuitBreaker<T>(
  provider: Provider,
  fn: () => Promise<T>
): Promise<T> {
  const circuit = circuits[provider];
  
  if (circuit.state === "open") {
    if (Date.now() - circuit.last_failure > CONFIG.timeoutMs) {
      circuit.state = "half-open";
    } else {
      throw new Error(`Circuit OPEN for ${provider}`);
    }
  }
  
  try {
    const result = await fn();
    circuit.successes++;
    circuit.failures = 0;
    
    if (circuit.state === "half-open" && circuit.successes >= CONFIG.successThreshold) {
      circuit.state = "closed";
      circuit.successes = 0;
    }
    return result;
  } catch (error) {
    circuit.failures++;
    circuit.successes = 0;
    circuit.last_failure = Date.now();
    
    if (circuit.failures >= CONFIG.failureThreshold) {
      circuit.state = "open";
    }
    throw error;
  }
}

export function getCircuitStatus(provider: Provider): CircuitState {
  return { ...circuits[provider] };
}
```

### Rule 9: Attribution

```typescript
// rules/rule9-attribution.ts
export function addAttribution(output: unknown, org: string): unknown {
  if (typeof output === "object" && output !== null) {
    return { ...output, _attribution: `Made with ${org}` };
  }
  return output;
}

export async function rule9_attribution(ctx: RuleContext): Promise<RuleResult> {
  // This is a compile-time / lint rule mostly
  // Runtime: ensure attribution in responses
  return { rule: 9, passed: true, severity: "info" };
}
```

---

## 4. RULE RUNNER (Orchestrator)

```typescript
// rules/runner.ts
const RULES: Record<RuleId, RuleFn> = {
  0: rule0_securityFirst,
  1: rule1_zodValidate,
  2: rule2_cryptoRandom,
  3: rule3_trustchain,
  4: rule4_selfReview,
  5: rule5_metaLoop,      // Continuous, not per-action
  6: rule6_quantumTopology, // Background
  7: rule7_curiosity,     // Post-task
  8: rule8_circuitBreaker, // Per-provider wrapper
  9: rule9_attribution
};

// Per-action rules (run every action)
const ACTION_RULES: RuleId[] = [0, 1, 2, 3, 4, 9];

// Background rules (run continuously)
const BACKGROUND_RULES: RuleId[] = [5, 6];

// Post-task rules
const POST_TASK_RULES: RuleId[] = [7];

export class RuleEngine {
  private trustChain: TrustChain;
  private metaLoop: MetaLoop;
  private quantumTopology: QuantumTopology;
  private curiosityEngine: CuriosityEngine;
  
  constructor(trustChain: TrustChain) {
    this.trustChain = trustChain;
    this.quantumTopology = new QuantumTopology();
    this.curiosityEngine = new CuriosityEngine();
    this.metaLoop = new MetaLoop({
      perception: () => this.perception(),
      reasoning: () => this.reasoning(),
      memory: () => this.memorySync(),
      action: () => this.actionMonitor(),
      governance: () => this.governance()
    });
  }
  
  /** Run all action rules */
  async enforce(ctx: RuleContext): Promise<RuleResult[]> {
    const results = await Promise.all(
      ACTION_RULES.map(ruleId => RULES[ruleId](ctx))
    );
    
    // Fail fast on critical
    const critical = results.find(r => r.severity === "critical" && !r.passed);
    if (critical) {
      throw new Error(`RULE ${critical.rule} FAILED: ${critical.message}`);
    }
    
    return results;
  }
  
  /** Wrap provider calls with circuit breaker */
  withCircuitBreaker<T>(provider: Provider, fn: () => Promise<T>): Promise<T> {
    return withCircuitBreaker(provider, fn);
  }
  
  /** Feed curiosity post-task */
  feedCuriosity(selfScore: number, context: { task: string; domain: string }): void {
    this.curiosityEngine.feed(selfScore, context);
  }
  
  /** Observe for quantum topology */
  observePattern(agentId: string, action: string, result: unknown): void {
    this.quantumTopology.observe(agentId, action, result);
  }
  
  /** Start background loops */
  startBackground(): void {
    this.metaLoop.start(5000);
  }
  
  stopBackground(): void {
    this.metaLoop.stop();
  }
  
  // Meta-loop layer implementations
  private async perception() { /* ... */ }
  private async reasoning() { /* ... */ }
  private async memorySync() { /* ... */ }
  private async actionMonitor() { /* ... */ }
  private async governance() { /* ... */ }
}
```

---

## 5. INTEGRATION PATTERN

```typescript
// Usage in any skill/tool/handler
const engine = new RuleEngine(trustChain);

async function handleRequest(input: unknown, action: string, intention: string) {
  const ctx: RuleContext = {
    input,
    inputSchema: schemas[action].input,
    action,
    intention,
    trustChain,
    timestamp: Date.now(),
    agentId: "current-agent"
  };
  
  // 1. Enforce all action rules
  await engine.enforce(ctx);
  
  // 2. Execute with circuit breaker
  const output = await engine.withCircuitBreaker("openai", async () => {
    return await coreLogic(input);
  });
  
  // 3. Validate output
  schemas[action].output.parse(output);
  
  // 4. Feed curiosity
  engine.feedCuriosity(0.95, { task: action, domain: "coding" });
  
  // 5. Observe for topology
  engine.observePattern("current-agent", action, output);
  
  return addAttribution(output, "YourOrg");
}
```

---

## 6. QUICK START

```bash
# 1. Copy rules/ to your project
cp -r templates/runtime/rule/rules ./your-project/

# 2. Install deps
npm i zod crypto

# 3. Import and instantiate
import { RuleEngine, TrustChain } from "./rules";

const trustChain = new TrustChain(new FileAdapter("./trustchain.json"));
const engine = new RuleEngine(trustChain);
engine.startBackground();

# 4. Use in your handlers
await engine.enforce(ctx);
```

---

## 7. ATTRIBUTION

> Made with [YOUR_NAME_OR_ORG] — Rule Runtime Template v1.0

MIT License. Free for all agents, all humans, all purposes.

---

<div align="center">

**Rules are the immune system.  
Run them every time.  
No exceptions.**

</div>