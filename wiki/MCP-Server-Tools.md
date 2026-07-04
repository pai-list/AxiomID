# MCP Server Tools

> Back to [Home](./Home) | See also: [API Reference](./API-Reference)

---

## Overview

AxiomID exposes capabilities via **Model Context Protocol (MCP)** — a standard for AI agent tool integration. The MCP server runs on the **Cloudflare Worker** backend.

**Source:** [`backend/src/mcp/`](https://github.com/Moeabdelaziz007/AxiomID/tree/main/backend/src/mcp)

---

## MCP Server Architecture

```
┌─────────────────────────────────────────┐
│           Cloudflare Worker             │
│                                         │
│  ┌─────────────┐    ┌────────────────┐  │
│  │ MCP Server  │◄──►│ MCP Handler    │  │
│  │ (stdio/SSE) │    │ (tool router)  │  │
│  └─────────────┘    └───────┬────────┘  │
│                             │           │
│  ┌──────────────────────────▼────────┐  │
│  │         Backend Routes            │  │
│  │  truth-rag.ts  skills.ts  search  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌──────────────┐  ┌────────────────┐  │
│  │ D1 Database  │  │ Vectorize      │  │
│  │ (truth-db)   │  │ (axiomid-truth)│  │
│  └──────────────┘  └────────────────┘  │
└─────────────────────────────────────────┘
```

---

## Available Tools

### `axiom_resolve_passport`

Resolve a user's passport by slug.

```json
{
  "name": "axiom_resolve_passport",
  "description": "Get a user's AxiomID passport with trust score, stamps, and agent status",
  "inputSchema": {
    "type": "object",
    "properties": {
      "slug": { "type": "string", "description": "Passport slug (username)" }
    },
    "required": ["slug"]
  }
}
```

### `axiom_search_skills`

Search the skills marketplace.

```json
{
  "name": "axiom_search_skills",
  "description": "Search AxiomID skills marketplace by query or tags",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Search query" },
      "tags": { "type": "array", "items": { "type": "string" } }
    }
  }
}
```

### `axiom_execute_skill`

Execute a skill in the sandbox.

```json
{
  "name": "axiom_execute_skill",
  "description": "Execute an installed skill in a sandboxed environment",
  "inputSchema": {
    "type": "object",
    "properties": {
      "slug": { "type": "string", "description": "Skill slug" },
      "input": { "type": "object", "description": "Skill input parameters" }
    },
    "required": ["slug"]
  }
}
```

### `axiom_truth_qa`

Query the Truth RAG pipeline (Quran verses).

```json
{
  "name": "axiom_truth_qa",
  "description": "Ask a question about Quran verses using the Truth RAG pipeline",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Question to ask" },
      "language": { "type": "string", "enum": ["en", "ar"], "default": "en" }
    },
    "required": ["query"]
  }
}
```

---

## Integration

### VS Code / Cursor

MCP servers can be connected to VS Code and Cursor via the MCP extension:

1. Install the MCP extension
2. Add AxiomID MCP server config:
   ```json
   {
     "mcpServers": {
       "axomid": {
         "url": "https://axiomid-backend.amrikyy.workers.dev/mcp"
       }
     }
   }
   ```
3. Tools become available in the AI assistant

### Custom Agents

Any MCP-compatible agent can connect:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client";

const client = new Client({ name: "my-agent" });
await client.connect({ url: "https://axiomid-backend.amrikyy.workers.dev/mcp" });

const tools = await client.listTools();
const result = await client.callTool({
  name: "axiom_resolve_passport",
  arguments: { slug: "AxiomID Agent" }
});
```

---

## Backend Dependencies

| Package | Version | Purpose |
|:---|:---|:---|
| `@modelcontextprotocol/sdk` | ^1.12.1 | MCP protocol implementation |

---

*← [API Reference](./API-Reference) | → [Development Setup](./Development-Setup)*
