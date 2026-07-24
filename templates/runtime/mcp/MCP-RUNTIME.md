# MCP RUNTIME — Model Context Protocol Server/Client Framework

> "وَكُلَّ شَيْءٍ أَحْصَيْنَاهُ فِي إِمَامٍ مُّبِينٍ" — يس: 36:12
>
> *MCP is not a protocol. It's a contract of trust between agents and tools.*

---

## 🎯 Purpose

A **universal MCP runtime** for building servers and clients that work anywhere: Cloudflare Workers, Vercel, Node, Bun, Deno, edge, local. Zero-cost, stateless, auditable.

---

## 1. MCP ARCHITECTURE (The Mental Model)

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Agent)                           │
│  ┐
│  • Discovers tools via `tools/list`                             │
│  • Calls tools via `tools/call`                                 │
│  • Handles auth, retries, timeouts                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │ JSON-RPC 2.0 over HTTP / stdio
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SERVER (Tools)                           │
│  • Exposes tools with schemas                                   │
│  • Validates input (Zod)                                        │
│  • Executes logic                                               │
│  • Returns structured output                                    │
│  • Appends to TrustChain                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. SERVER SPECIFICATION

### Core Types (JSON-RPC 2.0)

```typescript
// types.ts
interface JSONRPCRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: unknown;
}

interface JSONRPCResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// MCP Methods
type MCPMethod = 
  | "initialize"
  | "tools/list"
  | "tools/call"
  | "resources/list"
  | "resources/read"
  | "prompts/list"
  | "prompts/get"
  | "notifications/initialized";

// Tool Definition
interface Tool {
  name: string;
  description: string;
  inputSchema: JSONSchema;      // Zod → JSON Schema
  outputSchema?: JSONSchema;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
}
```

---

## 3. UNIVERSAL SERVER FACTORY

```typescript
// src/server.ts — Works everywhere
import { z } from "zod";
import { TrustChain } from "./lib/trustchain";

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  outputSchema?: z.ZodSchema;
  handler: (args: unknown, context: MCPContext) => Promise<unknown>;
}

export interface MCPContext {
  requestId: string | number;
  auth?: AuthContext;
  trustChain: TrustChain;
  startTime: number;
}

export interface AuthContext {
  agentId?: string;
  humanId?: string;
  permissions: string[];
  verified: boolean;
}

export class MCPServer {
  private tools = new Map<string, MCPTool>();
  private trustChain: TrustChain;
  private authValidator: (headers: Headers) => Promise<AuthContext>;
  
  constructor(options: {
    name: string;
    version: string;
    trustChain: TrustChain;
    authValidator?: (headers: Headers) => Promise<AuthContext>;
  }) {
    this.trustChain = options.trustChain;
    this.authValidator = options.authValidator || (() => ({
      permissions: [],
      verified: false
    }));
  }
  
  /** Register a tool */
  tool(def: MCPTool): this {
    this.tools.set(def.name, def);
    return this;
  }
  
  /** Handle incoming JSON-RPC request */
  async handle(request: JSONRPCRequest, headers: Headers): Promise<JSONRPCResponse> {
    const context: MCPContext = {
      requestId: request.id,
      auth: await this.authValidator(headers),
      trustChain: this.trustChain,
      startTime: Date.now()
    };
    
    try {
      switch (request.method) {
        case "initialize":
          return this.handleInitialize(request, context);
        case "tools/list":
          return this.handleToolsList(request, context);
        case "tools/call":
          return await this.handleToolCall(request, context);
        default:
          return this.error(request.id, -32601, `Method not found: ${request.method}`);
      }
    } catch (err) {
      return this.error(request.id, -32603, err instanceof Error ? err.message : "Internal error");
    }
  }
  
  private handleInitialize(req: JSONRPCRequest, ctx: MCPContext): JSONRPCResponse {
    return {
      jsonrpc: "2.0",
      id: req.id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "mcp-server", version: "1.0.0" }
      }
    };
  }
  
  private handleToolsList(req: JSONRPCRequest, ctx: MCPContext): JSONRPCResponse {
    const tools = Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: zodToJsonSchema(t.inputSchema),
      outputSchema: t.outputSchema ? zodToJsonSchema(t.outputSchema) : undefined,
      annotations: t.annotations
    }));
    
    return { jsonrpc: "2.0", id: req.id, result: { tools } };
  }
  
  private async handleToolCall(req: JSONRPCRequest, ctx: MCPContext): Promise<JSONRPCResponse> {
    const params = req.params as { name: string; arguments: unknown };
    const tool = this.tools.get(params.name);
    
    if (!tool) {
      return this.error(req.id, -32602, `Tool not found: ${params.name}`);
    }
    
    // 1. VALIDATE INPUT (Rule 1)
    const validatedInput = tool.inputSchema.parse(params.arguments);
    
    // 2. EXECUTE
    const result = await tool.handler(validatedInput, ctx);
    
    // 3. VALIDATE OUTPUT
    if (tool.outputSchema) {
      tool.outputSchema.parse(result);
    }
    
    // 4. TRUSTCHAIN (Rule 3)
    await ctx.trustChain.append({
      action: `mcp:tool:${params.name}`,
      timestamp: Date.now(),
      intention: `Execute ${params.name}`,
      metadata: { 
        tool: params.name, 
        duration_ms: Date.now() - ctx.startTime,
        agent: ctx.auth?.agentId 
      }
    });
    
    // 5. SELF-REVIEW (Rule 4)
    queueMicrotask(() => selfReview(params.name, result, ctx));
    
    return { jsonrpc: "2.0", id: req.id, result };
  }
  
  private error(id: string | number, code: number, message: string): JSONRPCResponse {
    return { jsonrpc: "2.0", id, error: { code, message } };
  }
}

/** Convert Zod schema to JSON Schema (simplified) */
function zodToJsonSchema(schema: z.ZodSchema): object {
  // In production, use zod-to-json-schema package
  return { type: "object", properties: {} };
}
```

---

## 4. TRANSPORT ADAPTERS (Deploy Anywhere)

### Cloudflare Workers (Free, 100K req/day, ~0ms cold start)

```typescript
// workers/mcp.ts
import { MCPServer } from "../src/server";
import { KVTrustChain } from "../src/lib/kv-trustchain";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const trustChain = new KVTrustChain(env.TRUST_KV);
    const server = new MCPServer({ name: "axiomid", version: "1.0.0", trustChain });
    
    // Register tools
    server.tool({ ... }); // Your tools here
    
    const body = await request.json();
    const response = await server.handle(body, request.headers);
    
    return Response.json(response);
  }
} satisfies ExportedHandler<Env>;
```

```toml
# wrangler.toml
name = "mcp-server"
main = "workers/mcp.ts"
compatibility_date = "2024-07-01"

[[kv_namespaces]]
binding = "TRUST_KV"
id = "your-kv-namespace-id"

[ai]
binding = "AI"  # For Workers AI if needed
```

### Vercel Functions (Free Hobby, ~100ms cold start)

```typescript
// api/mcp.ts
import { MCPServer } from "../../src/server";
import { VercelTrustChain } from "../../src/lib/vercel-trustchain";

export default async function handler(req: Request): Promise<Response> {
  const trustChain = new VercelTrustChain(); // Uses Vercel KV / Blob
  const server = new MCPServer({ name: "axiomid", version: "1.0.0", trustChain });
  
  server.tool({ ... });
  
  const body = await req.json();
  const response = await server.handle(body, req.headers);
  
  return Response.json(response);
}
```

### Node.js / Bun / Deno (Local, Self-Hosted)

```typescript
// server.ts
import { MCPServer } from "./src/server";
import { FileTrustChain } from "./src/lib/file-trustchain";
import { createServer } from "http";

const trustChain = new FileTrustChain("./data/trustchain.json");
const server = new MCPServer({ name: "local-mcp", version: "1.0.0", trustChain });

server.tool({
  name: "echo",
  description: "Echo back input",
  inputSchema: z.object({ message: z.string() }),
  outputSchema: z.object({ echo: z.string() }),
  handler: async ({ message }) => ({ echo: message })
});

const httpServer = createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/mcp") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const request = JSON.parse(body);
    const response = await server.handle(request, new Headers(req.headers));
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(response));
  } else {
    res.writeHead(404);
    res.end();
  }
});

httpServer.listen(3000, () => console.log("MCP server on :3000"));
```

### stdio Transport (For CLI Agents like Claude, Hermes, OpenCode)

```typescript
// stdio-server.ts
import { MCPServer } from "./src/server";
import { FileTrustChain } from "./src/lib/file-trustchain";
import { createInterface } from "readline";

const trustChain = new FileTrustChain("./data/trustchain.json");
const server = new MCPServer({ name: "stdio-mcp", version: "1.0.0", trustChain });

server.tool({ ... });

const rl = createInterface({ input: process.stdin, output: process.stdout });

rl.on("line", async (line) => {
  try {
    const request = JSON.parse(line);
    const response = await server.handle(request, new Headers());
    console.log(JSON.stringify(response));
  } catch (e) {
    console.error("Parse error:", e);
  }
});
```

---

## 5. CLIENT RUNTIME

```typescript
// src/client.ts
interface MCPClientOptions {
  transport: "http" | "stdio";
  endpoint?: string;      // For HTTP
  command?: string;       // For stdio
  args?: string[];
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export class MCPClient {
  private tools: Map<string, Tool> = new Map();
  private requestId = 0;
  
  constructor(private options: MCPClientOptions) {}
  
  async connect(): Promise<void> {
    const result = await this.call("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "mcp-client", version: "1.0.0" }
    });
    await this.call("notifications/initialized", {});
    await this.refreshTools();
  }
  
  async call(method: string, params: unknown): Promise<unknown> {
    const id = ++this.requestId;
    const request = { jsonrpc: "2.0" as const, id, method, params };
    
    const response = await this.send(request);
    if (response.error) throw new Error(response.error.message);
    return response.result;
  }
  
  async callTool(name: string, args: unknown): Promise<unknown> {
    return this.call("tools/call", { name, arguments: args });
  }
  
  async listTools(): Promise<Tool[]> {
    const result = await this.call("tools/list", {});
    return (result as { tools: Tool[] }).tools;
  }
  
  private async send(request: object): Promise<any> {
    if (this.options.transport === "http") {
      return this.sendHTTP(request);
    } else {
      return this.sendStdio(request);
    }
  }
  
  private async sendHTTP(request: object): Promise<any> {
    const res = await fetch(this.options.endpoint!, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.options.headers },
      body: JSON.stringify(request)
    });
    return res.json();
  }
  
  private async sendStdio(request: object): Promise<any> {
    // Implementation for stdio subprocess
    throw new Error("stdio transport not implemented in this snippet");
  }
}
```

---

## 6. TRUSTCHAIN ADAPTERS (Pluggable Storage)

```typescript
// lib/trustchain-adapters.ts

// Cloudflare KV
export class KVTrustChain {
  constructor(private kv: KVNamespace) {}
  async load(): Promise<TrustEntry[]> { ... }
  async save(chain: TrustEntry[]): Promise<void> { ... }
}

// Vercel KV / Blob
export class VercelTrustChain { ... }

// Local File
export class FileTrustChain { ... }

// PostgreSQL (Ghost.build, Neon, etc.)
export class SQLTrustChain { ... }

// In-Memory (Testing)
export class MemoryTrustChain { ... }
```

---

## 7. SECURITY HARDENING (Rules 0-2)

```typescript
// lib/security.ts
import { randomBytes, timingSafeEqual } from "crypto";

/** Constant-time secret verification */
export function verifySecret(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Generate secure random for payments/tokens */
export function secureRandom(bytes = 32): Buffer {
  return randomBytes(bytes);  // NEVER Math.random()
}

/** Rate limiting per agent */
export class RateLimiter {
  private buckets = new Map<string, { count: number; reset: number }>();
  
  check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const bucket = this.buckets.get(key);
    if (!bucket || now > bucket.reset) {
      this.buckets.set(key, { count: 1, reset: now + windowMs });
      return true;
    }
    if (bucket.count >= limit) return false;
    bucket.count++;
    return true;
  }
}
```

---

## 8. DEPLOYMENT CHECKLIST

| ✅ | Item |
|----|------|
| | All inputs validated with Zod |
| | All outputs validated with Zod |
| | TrustChain append on every tool call |
| | Self-review queued after every call |
| | Circuit breaker per upstream provider |
| | Constant-time secret verification |
| | `crypto.randomBytes` for all crypto |
| | Rate limiting enforced |
| | Audit logging for sensitive operations |
| | Health check endpoint (`/health`) |
| | OpenAPI / MCP manifest published |

---

## 9. QUICK START

```bash
# 1. Scaffold
npx create-mcp-server my-mcp --template=typescript

# 2. Add tools in src/tools/
# 3. Configure adapters for your target
# 4. Deploy

# Cloudflare Workers (free)
npx wrangler deploy

# Vercel (free)
vercel deploy

# Local
npm run dev
```

---

## 10. ATTRIBUTION

> Made with [YOUR_NAME_OR_ORG] — MCP Runtime Template v1.0

MIT License. Free for all agents, all humans, all purposes.

---

<div align="center">

**MCP is the nervous system of agentic intelligence.  
Make it fast. Make it auditable. Make it free.**

</div>