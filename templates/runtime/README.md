# UNIVERSAL AGENT RUNTIME TEMPLATES

> "وَمَا أُوتِيتُم مِّنَ الْعِلْمِ إِلَّا قَلِيلًا" — الإسراء: 85
>
> *A complete, public, name-agnostic runtime stack for sovereign AI agents.*

---

## 📦 What's in This Package

| Runtime | File | Purpose |
|---------|------|---------|
| **Agent Soul** | `agent/SOUL-RUNTIME.md` | Constitutional substrate — identity, boundaries, reasoning loop |
| **Skill Runtime** | `skill/SKILL-RUNTIME.md` | Serverless skill execution framework (MCP-compatible) |
| **MCP Runtime** | `mcp/MCP-RUNTIME.md` | Model Context Protocol server/client framework |
| **Rule Runtime** | `rule/RULE-RUNTIME.md` | 10 invariant rules engine (security, validation, audit, governance) |
| **Workflow Runtime** | `workflow/WORKFLOW-RUNTIME.md` | Plan → Execute → Review pipeline with token economics |

---

## 🚀 Quick Start (Copy-Paste Ready)

```bash
# 1. Clone or copy the templates
git clone https://github.com/your-org/agent-runtime-templates
# OR manually copy the templates/runtime/ folder

# 2. Customize identity (only file you MUST edit)
vim templates/runtime/agent/SOUL-RUNTIME.md
# → Change <AGENT_NAME>, <YOUR_NAME_OR_ORG> in section 1

# 3. Pick the runtimes you need
# For skills:
cp -r templates/runtime/skill/* your-project/skills/

# For MCP server:
cp -r templates/runtime/mcp/* your-project/mcp/

# For rules engine:
cp -r templates/runtime/rule/* your-project/rules/

# For workflows:
cp -r templates/runtime/workflow/* your-project/workflows/

# 4. Install dependencies (minimal)
npm i zod crypto  # Core deps for all runtimes

# 5. Deploy anywhere (zero-cost targets)
# Cloudflare Workers (free 100K/day)
# Vercel Functions (free Hobby)
# GitHub Actions (free 2K min/mo)
# Local / Bun / Node / Deno
```

---

## 🏗️ Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AGENT RUNTIME STACK                              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                │
│  │   SOUL      │    │   RULES     │    │  MEMORY     │                │
│  │  (Identity, │◄───│ (Security,  │◄───│ (TrustChain,│                │
│  │  Boundaries,│    │  Validation,│    │  SelfReview,│                │
│  │  Reasoning) │    │  Governance)│    │  Curiosity) │                │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                │
│         │                  │                  │                        │
│         └──────────────────┼──────────────────┘                        │
│                            ▼                                           │
│  ┌─────────────────────────────────────────────┐                      │
│  │           WORKFLOW ENGINE                    │                      │
│  │  PLAN (Frontier) → EXECUTE (Efficient)      │                      │
│  │         → REVIEW (Frontier)                  │                      │
│  └────────────────────┬────────────────────────┘                      │
│                       │                                                │
│         ┌─────────────┼─────────────┐                                 │
│         ▼             ▼             ▼                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                            │
│  │  SKILL   │  │   MCP    │  │  TOOL    │                            │
│  │ RUNTIME  │  │ RUNTIME  │  │ CALLS    │                            │
│  └──────────┘  └──────────┘  └──────────┘                            │
│         │             │             │                                 │
│         └─────────────┼─────────────┘                                 │
│                       ▼                                                │
│  ┌─────────────────────────────────────────────┐                      │
│  │         DEPLOYMENT TARGETS (Zero-Cost)       │                      │
│  │  Cloudflare Workers │ Vercel │ GitHub Actions │                      │
│  │  Local CLI          │ Bun    │ Docker         │                      │
│  └─────────────────────────────────────────────┘                      │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 💡 Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Sovereign** | No vendor lock-in — deploy anywhere |
| **Auditable** | TrustChain on every action |
| **Secure by Default** | Zod validation, crypto.randomBytes, circuit breakers |
| **Self-Correcting** | Self-review, Tawbah protocol, curiosity engine |
| **Token-Economic** | Plan/Execute/Review model routing saves 60-70% |
| **Composable** | Each runtime independent, works alone or together |
| **Agent-Native** | MCP-first, subagent-friendly, visual memory |

---

## 🔗 Integration Map

```
SOUL-RUNTIME.md
    │
    ├──→ Loads first — sets identity & boundaries
    │
    ├──→ RULE-RUNTIME.md enforces 10 invariants
    │       │
    │       ├──→ Rule 3 → TrustChain (shared with all)
    │       ├──→ Rule 4 → SelfReview (feeds SOUL)
    │       ├──→ Rule 7 → Curiosity (drives WORKFLOW)
    │       └──→ Rule 8 → CircuitBreaker (protects MCP/SKILL)
    │
    ├──→ WORKFLOW-RUNTIME.md orchestrates Plan→Execute→Review
    │       │
    │       ├──→ Planner → uses SKILL-RUNTIME for research skills
    │       ├──→ Executor → uses SKILL-RUNTIME for implementation skills
    │       └──→ Reviewer → uses SKILL-RUNTIME for audit skills
    │
    ├──→ SKILL-RUNTIME.md provides tool framework
    │       │
    │       └──→ Exposes via MCP-RUNTIME.md
    │
    └──→ MCP-RUNTIME.md provides protocol layer
            │
            └──→ Connects to any MCP client (Hermes, OpenCode, Claude, etc.)
```

---

## 🎯 Use Cases

| Scenario | Runtimes Needed |
|----------|-----------------|
| **Single autonomous agent** | SOUL + RULES + WORKFLOW |
| **Skill marketplace** | SKILL + MCP + RULES |
| **MCP server for tools** | MCP + RULES + SOUL |
| **Agent economy (ACP)** | WORKFLOW + SKILL + MCP + RULES |
| **Multi-agent swarm** | All 5 + shared TrustChain |
| **CI/CD automation** | WORKFLOW + SKILL + RULES |

---

## 🙏 Credits & Attribution

This runtime stack stands on the shoulders of giants:

| Project | Contribution | Link |
|---------|--------------|------|
| **Nous Research (Hermes Agent)** | Autonomous agent architecture, local-first philosophy, SOUL protocol inspiration | [hermes-agent.nousresearch.com](https://hermes-agent.nousresearch.com) |
| **Anomaly (OpenCode)** | CLI-first agent tooling, skill system, developer experience | [opencode.dev](https://opencode.dev) |
| **Virtuals Protocol (ACP)** | Agent economy primitives, service marketplace, compute credits | [virtuals.io](https://virtuals.io) |
| **Frontier Model Labs** | The models that make planning/execution/review possible: OpenAI, Anthropic, Google, DeepSeek, Moonshot, Zhipu, Alibaba, 01.AI, Meta, Nous | — |
| **Cloudflare / Vercel / GitHub** | Zero-cost serverless infrastructure that makes this deployable for free | — |

**Special thanks** to the open-source communities building the agentic future. This template exists because you shared your work.

---

## 📄 License

**MIT License** — Free for all agents, all humans, all purposes.

```
MIT License

Copyright (c) 2024 [YOUR_NAME_OR_ORG]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📋 Attribution Requirement

When you use these templates in a derived runtime, include this line:

> **Made with [YOUR_NAME_OR_ORG] — Universal Agent Runtime Templates v1.0**
>
> Credits: Nous Research (Hermes), Anomaly (OpenCode), Virtuals (ACP), Frontier Labs

---

<div align="center">

**Built for the agentic era.  
By agents, for agents.  
With truth. With trust. With sovereignty.**

---

*Template Version 1.0 — 2026*

</div>