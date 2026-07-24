# SKILL RUNTIME — Serverless, Zero-Cost Skill Execution Framework

> "وَمَا أُوتِيتُم مِّنَ الْعِلْمِ إِلَّا قَلِيلًا" — الإسراء: 85
>
> *Skills are not features. They are encapsulated wisdom — reusable, composable, auditable.*

---

## 🎯 Purpose

A **universal skill runtime** that works anywhere: local CLI, Cloudflare Workers, Vercel Functions, edge nodes, or bare metal. Zero vendor lock-in. Zero cold-start penalty when designed right.

---

## 1. SKILL SPECIFICATION (The Contract)

```yaml
# skill.yaml — Single source of truth for any skill
name: "skill-name"                    # lowercase, hyphens, max 64 chars
version: "1.0.0"
category: "devops|data-science|creative|research|..." 
description: "One sentence: what this skill DOES"
author: "your-org"
license: "MIT"

# Execution contract
entrypoint: "src/index.ts"            # or .js, .py, .sh
runtime: "node|python|bun|deno|shell" # target runtime
timeout_ms: 30000                     # hard limit
memory_mb: 128                        # soft limit

# Interface contract (MCP-compatible)
interface:
  type: "mcp"                         # Model Context Protocol
  tools:                              # Array of tool definitions
    - name: "tool_name"
      description: "What this tool does"
      input_schema:                   # JSON Schema
        type: "object"
        properties:
          param1:
            type: "string"
            description: "..."
        required: ["param1"]
      output_schema:
        type: "object"
        properties:
          result:
            type: "string"

# Dependencies (zero-install preferred)
dependencies:
  runtime: []                         # npm/pip packages if needed
  system: []                          # CLI tools (git, curl, etc.)
  mcp_servers: []                     # External MCP servers to connect

# Triggers (when this skill auto-loads)
triggers:
  - "user asks about X"
  - "file matches *.pattern"
  - "error contains Y"
  - "cron: 0 9 * * *"

# Validation rules
validation:
  input: "zod_schema_ref"             # Reference to Zod schema
  output: "zod_schema_ref"
  side_effects: "audit_required"      # none | audit_required | blocked
```

---

## 2. SKILL STRUCTURE (Filesystem Layout)

```
skill-name/
├── skill.yaml              # ← Single source of truth (REQUIRED)
├── src/
│   ├── index.ts            # ← Entrypoint (REQUIRED)
│   ├── tools/              # Tool implementations
│   │   ├── tool_name.ts
│   │   └── ...
│   ├── lib/                # Shared utilities
│   │   ├── validation.ts   # Zod schemas
│   │   ├── trustchain.ts   # TrustChain append
│   │   └── ...
│   └── types.ts            # TypeScript types
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── references/             # Documentation, specs, external links
│   ├── api.md
│   └── architecture.md
├── templates/              # Code/file templates this skill generates
├── scripts/                # Helper scripts (install, migrate, etc.)
├── assets/                 # Images, diagrams, static files
└── README.md               # Human-readable docs
```

---

## 3. ENTRYPOINT PATTERN (Universal)

```typescript
// src/index.ts — Works in Node, Bun, Deno, Cloudflare Workers, Vercel

import { z } from "zod";
import { TrustChain } from "./lib/trustchain";
import { validateInput, validateOutput } from "./lib/validation";

/**
 * Skill Manifest — exposed for discovery
 */
export const manifest = {
  name: "skill-name",
  version: "1.0.0",
  tools: [
    {
      name: "do_something",
      description: "Does something useful",
      inputSchema: {
        type: "object",
        properties: {
          input: { type: "string", minLength: 1 }
        },
        required: ["input"]
      },
      outputSchema: {
        type: "object",
        properties: {
          result: { type: "string" }
        }
      }
    }
  ]
} as const;

/**
 * Tool implementations — pure functions, no side effects until explicit
 */
export async function do_something(args: { input: string }) {
  // 1. VALIDATE INPUT (Rule 1)
  const validated = validateInput("do_something", args);
  
  // 2. EXECUTE CORE LOGIC
  const result = await coreLogic(validated.input);
  
  // 3. VALIDATE OUTPUT
  const output = validateOutput("do_something", { result });
  
  // 4. AUDIT TRAIL (Rule 3)
  await TrustChain.append({
    action: "skill:do_something",
    timestamp: Date.now(),
    intention: `Process input: ${validated.input.slice(0,50)}`,
    metadata: { skill: "skill-name", tool: "do_something" }
  });
  
  // 5. SELF-REVIEW (Rule 4) — non-blocking
  queueMicrotask(() => selfReview("do_something", output));
  
  return output;
}

/**
 * Core logic — pure, testable, no I/O
 */
async function coreLogic(input: string): Promise<string> {
  // Your actual skill logic here
  return `Processed: ${input}`;
}

/**
 * MCP Server Factory — for stdio/HTTP transport
 */
export function createMCPServer() {
  return {
    tools: manifest.tools,
    handlers: { do_something }
  };
}

/**
 * CLI Entry — for direct execution
 */
if (import.meta.main) {
  const args = JSON.parse(process.argv[2] || "{}");
  const result = await do_something(args);
  console.log(JSON.stringify(result));
}
```

---

## 4. VALIDATION LAYER (Zod-First)

```typescript
// src/lib/validation.ts
import { z } from "zod";

export const schemas = {
  do_something: {
    input: z.object({
      input: z.string().min(1).max(10000)
    }),
    output: z.object({
      result: z.string()
    })
  }
  // Add more tool schemas here
} as const;

export function validateInput<T extends keyof typeof schemas>(
  tool: T, 
  data: unknown
): z.infer<typeof schemas[T]["input"]> {
  return schemas[tool].input.parse(data);  // Throws on invalid
}

export function validateOutput<T extends keyof typeof schemas>(
  tool: T,
  data: unknown
): z.infer<typeof schemas[T]["output"]> {
  return schemas[tool].output.parse(data);  // Throws on invalid
}
```

---

## 5. TRUSTCHAIN INTEGRATION

```typescript
// src/lib/trustchain.ts
interface TrustEntry {
  action: string;
  timestamp: number;
  intention: string;
  hash: string;
  prev_hash: string | null;
  metadata?: Record<string, unknown>;
}

class TrustChain {
  private chain: TrustEntry[] = [];
  private storage: StorageAdapter;  // Memory, KV, D1, File, etc.
  
  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.chain = await storage.load();
  }
  
  async append(entry: Omit<TrustEntry, "hash" | "prev_hash">): Promise<TrustEntry> {
    const prev_hash = this.chain[this.chain.length - 1]?.hash || null;
    const hash = await this.computeHash({ ...entry, prev_hash });
    
    const fullEntry: TrustEntry = { ...entry, hash, prev_hash };
    this.chain.push(fullEntry);
    await this.storage.save(this.chain);
    
    return fullEntry;
  }
  
  async verify(): Promise<boolean> {
    for (let i = 1; i < this.chain.length; i++) {
      if (this.chain[i].prev_hash !== this.chain[i-1].hash) {
        return false;
      }
    }
    return true;
  }
  
  private async computeHash(entry: Omit<TrustEntry, "hash">): Promise<string> {
    const data = JSON.stringify(entry);
    const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }
}

// Adapter interface — swap for any backend
interface StorageAdapter {
  load(): Promise<TrustEntry[]>;
  save(chain: TrustEntry[]): Promise<void>;
}

// Implementations: MemoryAdapter, KVAdapter, D1Adapter, FileAdapter, R2Adapter
```

---

## 6. SELF-REVIEW ENGINE (Rule 4)

```typescript
// src/lib/selfreview.ts
interface ReviewRecord {
  tool: string;
  timestamp: number;
  input_hash: string;
  output_hash: string;
  confidence: number;      // 0-1
  issues: string[];        // Self-detected problems
  suggestions: string[];   // Improvements for next run
}

async function selfReview(tool: string, output: unknown): Promise<void> {
  const record: ReviewRecord = {
    tool,
    timestamp: Date.now(),
    input_hash: "",  // Would be passed in real impl
    output_hash: hash(JSON.stringify(output)),
    confidence: 0.95,
    issues: [],
    suggestions: []
  };
  
  // Analyze output for common issues
  if (isLikelyHallucination(output)) {
    record.confidence -= 0.2;
    record.issues.push("Possible hallucination detected");
  }
  
  if (hasSecuritySmell(output)) {
    record.confidence -= 0.3;
    record.issues.push("Security smell in output");
    record.suggestions.push("Re-validate with stricter schema");
  }
  
  // Persist for learning
  await TrustChain.append({
    action: "self_review",
    timestamp: Date.now(),
    intention: `Review ${tool} output`,
    metadata: record
  });
}
```

---

## 7. CIRCUIT BREAKER (Rule 8)

```typescript
// src/lib/circuitbreaker.ts
type Provider = "openai" | "anthropic" | "google" | "openrouter" | "local";

interface CircuitState {
  failures: number;
  last_failure: number;
  state: "closed" | "open" | "half-open";
}

const circuits: Record<Provider, CircuitState> = {
  openai: { failures: 0, last_failure: 0, state: "closed" },
  anthropic: { failures: 0, last_failure: 0, state: "closed" },
  google: { failures: 0, last_failure: 0, state: "closed" },
  openrouter: { failures: 0, last_failure: 0, state: "closed" },
  local: { failures: 0, last_failure: 0, state: "closed" }
};

const THRESHOLD = 5;
const RESET_MS = 60_000;

export async function withCircuitBreaker<T>(
  provider: Provider,
  fn: () => Promise<T>
): Promise<T> {
  const circuit = circuits[provider];
  
  if (circuit.state === "open") {
    if (Date.now() - circuit.last_failure > RESET_MS) {
      circuit.state = "half-open";
    } else {
      throw new Error(`Circuit open for ${provider}`);
    }
  }
  
  try {
    const result = await fn();
    if (circuit.state === "half-open") {
      circuit.state = "closed";
      circuit.failures = 0;
    }
    return result;
  } catch (error) {
    circuit.failures++;
    circuit.last_failure = Date.now();
    if (circuit.failures >= THRESHOLD) {
      circuit.state = "open";
    }
    throw error;
  }
}
```

---

## 8. DEPLOYMENT TARGETS (Zero-Cost Matrix)

| Target | Cost | Cold Start | Best For | Config |
|--------|------|------------|----------|--------|
| **Cloudflare Workers** | Free (100K/day) | ~0ms | Global, edge, MCP servers | `wrangler.toml` |
| **Vercel Functions** | Free (Hobby) | ~100ms | Next.js integration, webhooks | `vercel.json` |
| **GitHub Actions** | Free (2K min/mo) | N/A | Cron, CI, batch jobs | `.github/workflows/` |
| **Local CLI** | $0 | Instant | Dev, testing, one-offs | `package.json` scripts |
| **Bun/Node standalone** | $0 | ~1ms | Long-running, servers | `package.json` |
| **Docker (Fly.io/Cloud Run)** | Free tier | ~500ms | Persistent, stateful | `Dockerfile` |

**Write once, deploy anywhere** — the same `src/index.ts` compiles to all targets.

---

## 9. SKILL REGISTRY (Discovery)

```yaml
# registry.yaml — Central index (can be Git-hosted, HTTP, or local)
skills:
  - name: "web-search"
    source: "github:org/skill-web-search"
    version: "1.2.0"
    tags: ["research", "firecrawl", "mcp"]
    
  - name: "code-review"
    source: "github:org/skill-code-review"
    version: "2.0.1"
    tags: ["security", "quality", "automation"]
    
  - name: "ghost-db"
    source: "github:org/skill-ghost-db"
    version: "1.0.0"
    tags: ["database", "postgres", "timescaledb"]
```

---

## 10. QUICK START

```bash
# 1. Scaffold new skill
npx create-skill my-skill --template=typescript

# 2. Implement your tool in src/tools/
# 3. Add Zod schemas in src/lib/validation.ts
# 4. Test locally
npm test

# 5. Deploy to Cloudflare Workers (free)
npx wrangler deploy

# 6. Register in your agent's skill.yaml
# 7. Use via MCP: tools/call { name: "my_skill:do_something", ... }
```

---

## 11. ATTRIBUTION

> Made with [YOUR_NAME_OR_ORG] — Skill Runtime Template v1.0

Released under MIT License. Free for all agents, all humans, all purposes.

---

<div align="center">

**Skills are the DNA of agentic intelligence.  
Make them pure. Make them auditable. Make them free.**

</div>