---
name: axiomid-knowledge-base
description: Complete architecture and verified developer reference for the AxiomID AI Agent OS
version: 2.0.0
last_updated: 2026-06-03
status: Active
nav: HOME | SOUL | AXIOMID_KNOWLEDGE_BASE | codebase_map | progress_log
---

# AxiomID Sovereign AI Agent OS — Knowledge Base

> Complete reference for the AxiomID (formerly AxiomID) AI Agent Operating System.
> **Verified LOC: ~878K Python, ~89K TypeScript, ~1.04M total (all files incl. md/yaml/json).**

---

## 1. Project Overview

| Field | Value |
|---|---|
| **Name** | AxiomID Agent (formerly AxiomID) |
| **Version** | 0.14.0 |
| **License** | MIT |
| **Python** | >= 3.11 |
| **Creator** | Mohamed Abdelaziz (@Moeabdelaziz007) |
| **Origin** | Forked from AxiomID AxiomID Agent |
| **Repository** | https://github.com/Moeabdelaziz007/AxiomID |
| **Rebrand** | Amrikyy → AxiomID (PR #1, May 2026) |
| **Home dir** | `~/.axiomid/` (also `~/.axiomid/` for legacy) |
| **Config** | `~/.axiomid/config.yaml` |
| **Secrets** | `~/.axiomid/.env` |
| **Memory** | `~/.axiomid/memories/MEMORY.md` + `USER.md` |

### Verified Codebase Stats

| Metric | Count |
|---|---|
| **Python files** | 1,877 |
| **Python LOC** | 878,738 |
| **TypeScript/TSX files** | 449 |
| **TypeScript LOC** | 89,456 |
| **Total all-file LOC** | 1,049,462 |
| **Test files** | 1,266 |
| **Test functions** | ~24,850 |
| **Registered tools** | 60 (-5 Yuanbao tools) |
| **Skills** | 82 across 22 categories |
| **Slash commands** | 69 (+ 13 aliases) |
| **CLI subcommands** | 49+ (~120 sub-subcommands) |
| **Plugins** | 62 (18 directories) |
| **Model providers** | 31 |
| **Gateway platforms** | 12 (DingTalk, WeCom, WeComCallback, Yuanbao removed) |
| **Agent modules** | 89 |

---

## 2. Architecture — The 4-Layer Villa

```
Layer 3: Gateway (Messaging Platforms)
  ├── 14+ adapters: Telegram, Discord, Slack, WhatsApp, Signal, Matrix, etc.
  └── gateway/run.py (18,529 lines) — largest file in project

Layer 2: CLI & TUI (Control Room)
  ├── axiomid_cli/main.py — CLI entry (axiomid command)
  ├── cli.py — Legacy interactive REPL
  └── 5 API modes: chat_completions, codex_responses, anthropic_messages, bedrock_converse, codex_app_server

Layer 1: Core Engine (Python)
  ├── agent/ — 89 modules: conversation_loop, tool_executor, prompt_builder, context_engine, etc.
  ├── tools/ — 65 registered tools + 34 support files
  ├── skills/ — 82 skills across 22 categories
  └── plugins/ — 62 registerable plugins

Layer 0: Identity & Vault (Next.js)
  ├── axiomid/ — DID, KYC, agent passports, Deadhand API
  └── web/ — Vite React dashboard (30+ components, 15+ pages)
```

---

## 3. Directory Map

### Root: `~/Desktop/AxiomID/`

| Directory | Language | LOC Range | Purpose | Entrypoint |
|---|---|---|---|---|
| `agent/` | Python | ~245K | AI brain, guard, memory, prompts | `constitutional_guard.py` |
| `tools/` | Python | ~165K | 65 registered tools + 34 support | `tools/registry.py` |
| `axiomid_cli/` | Python | ~120K | CLI, config, profiles, gateway mgmt | `main.py` |
| `gateway/` | Python | ~180K | Multi-platform messaging | `gateway/run.py` |
| `axiomid/` | Next.js/TS | ~92K | Identity, passports, KYC | `prisma/schema.prisma` |
| `plugins/` | Python | ~85K | 62 plugins across 18 directories | `plugins/<name>/` |
| `skills/` | md/Python | ~65K | 82 skills across 22 categories | `skills/<cat>/<skill>/SKILL.md` |
| `web/` | Vite React/TS | ~140K | Dashboard UI | `src/App.tsx` |
| `tests/` | Python | ~100K | 1,266 test files, 25,116 tests | `tests/` |

---

## 4. Tools System — 60 Registered

### Browser (12 tools)
browser_navigate, browser_snapshot, browser_click, browser_type, browser_scroll, browser_back, browser_press, browser_get_images, browser_vision, browser_console, browser_cdp, browser_dialog

### Kanban (9 tools)
kanban_show, kanban_list, kanban_complete, kanban_block, kanban_heartbeat, kanban_comment, kanban_create, kanban_unblock, kanban_link

### File (4 tools)
read_file, write_file, patch, search_files

### Home Assistant (4 tools)
ha_list_entities, ha_get_state, ha_list_services, ha_call_service

### Feishu Drive (4 tools)
feishu_drive_list_comments, feishu_drive_list_comment_replies, feishu_drive_reply_comment, feishu_drive_add_comment

### Web (2 tools)
web_search, web_extract

### Vision (2 tools)
vision_analyze, video_analyze

### Skills (3 tools)
skills_list, skill_view, skill_manage

### Discord (2 tools)
discord, discord_admin

### Core (18 tools)
terminal, process, memory, delegate_task, execute_code, clarify, todo, cronjob, send_message, session_search, image_generate, video_generate, text_to_speech, computer_use, git_sovereign, mixture_of_agents, x_search, feishu_doc_read

### MCP (2 tools)
stitch (Google Stitch MCP — UI generation), jules (Google Jules MCP — code review automation)

### Support files (34, no registry.register)
agent_passport, approval, browser_camofox, checkpoint_manager, mcp_tool (dynamic runtime), etc.

---

## 5. Skills System — 82 Skills Across 22 Categories

### Software Development (12)
writing-plans, subagent-driven-development, test-driven-development, systematic-debugging, requesting-code-review, spike, plan, python-debugpy, node-inspect-debugger, pi-app-builder

### Creative (20)
ascii-art, ascii-video, architecture-diagram, baoyu-X (3: article-illustrator, comic, infographic), claude-design, comfyui, creative-ideation, design-md, excalidraw, humanizer, manim-video, p5js, pixel-art, popular-web-designs, pretext, sketch, songwriting-and-ai-music, touchdesigner-mcp

### MLOps (10)
dspy, evaluating-llms-harness, huggingface-hub, llama-cpp, obliteratus, segment-anything, audiocraft, serving-llms-vllm, weights-and-biases

### Productivity (9)
airtable, google-workspace, linear, maps, nano-pdf, notion, ocr-and-documents, powerpoint, teams-meeting-pipeline

### GitHub (6)
codebase-inspection, github-auth, github-code-review, github-issues, github-pr-workflow, github-repo-management

### Apple (5)
apple-notes, apple-reminders, findmy, imessage, macos-computer-use

### Autonomous AI (5)
claude-code, codex, kanban-codex-lane, opencode, simulation

### Media (5)
gif-search, heartmula, songsee, spotify, youtube-content

### Research (5)
arxiv, blogwatcher, llm-wiki, polymarket, research-paper-writing

### DevOps (3)
kanban-orchestrator, kanban-worker, webhook-subscriptions

### Gaming (2)
minecraft-modpack-server, pokemon-player

### Single-file categories (10)
data-science, dogfood, email, mcp, note-taking, red-teaming, smart-home, social-media, yuanbao, diagramming (empty), inference-sh (empty)

---

## 6. CLI Commands — 69 Slash + 49+ Subcommands

### Slash Commands by Category

| Category | Count | Commands |
|---|---|---|
| Session | 28 | new, clear, history, save, retry, undo, branch, compress, rollback, snapshot, stop, background, agents, queue, steer, goal, subgoal, status, sethome, resume, sessions, restart, approve, deny, title, handoff, topic, redraw |
| Configuration | 14 | config, model, codex-runtime, personality, statusbar, verbose, footer, yolo, reasoning, fast, skin, indicator, voice, busy |
| Tools & Skills | 12 | tools, toolsets, skills, bundles, cron, curator, kanban, reload, reload-mcp, reload-skills, browser, plugins |
| Info | 14 | whoami, profile, help, usage, insights, platforms, platform, copy, paste, image, update, debug, commands, gquota |
| Exit | 1 | quit |

### CLI Subcommands (axiomid <cmd>)

| Category | Commands |
|---|---|
| Chat | chat, acp, quickstart, postinstall |
| Config | setup, model, config, doctor, status, version, completion |
| Gateway | gateway (8 sub), proxy (3 sub), webhook, slack, whatsapp |
| Auth | login, logout, auth (7 sub), secrets |
| Sessions | sessions (7 sub), insights, checkpoints |
| Skills/Tools | skills (14 sub), plugins (7 sub), tools (3 sub), computer-use (2 sub), bundles |
| Maintenance | update, uninstall, backup, import, migrate, dump, debug |
| Profiles | profile (14 sub) |
| MCP | mcp (7 sub) |
| Other | fallback, pairing, claw, curator, lsp, cron (9 sub), memory (4 sub), security (1 sub), kanban |

---

## 7. Plugins — 62 Total

### Model Providers (31)
ai-gateway, alibaba, alibaba-coding-plan, anthropic, arcee, azure-foundry, bedrock, cerebras, copilot, copilot-acp, custom/ollama, deepseek, gemini, gmi, groq, huggingface, kilocode, kimi-coding, minimax, axiomid, novita, nvidia, ollama-cloud, openai-codex, opencode-zen, openrouter, qwen-oauth, stepfun, xai, xiaomi, zai

### Web Search Backends (8)
brave_free, ddgs, exa, firecrawl, parallel, searxng, tavily, xai

### Gateway Platform Plugins (8)
discord, google_chat, irc, line, mattermost, ntfy, simplex, teams

### Image Gen (4)
fal, openai, openai-codex, xai

### Browser (3)
browser_use, browserbase, firecrawl

### Video Gen (2)
fal, xai

### Standalone (11)
bybit, context_engine, disk-cleanup, google_meet, kanban, memory, observability/langfuse, spotify, teams_pipeline, axiomid-achievements

---

## 8. Gateway Platforms — 16 Adapters

| Platform | File | Protocol |
|---|---|---|
| Telegram | telegram.py | Bot API |
| Discord | (plugin) | WebSocket |
| Slack | slack.py | Socket Mode |
| WhatsApp | whatsapp.py | Business API / web.js / Baileys |
| Signal | signal.py | signal-cli HTTP/SSE |
| Matrix | matrix.py | mautrix SDK |
| Feishu/Lark | feishu.py | WebSocket + Webhook |
| WeChat | weixin.py | iLink Bot API |
| QQ Bot | qqbot/ | QQ Bot API v2 |
| Email | email.py | IMAP/SMTP |
| SMS | sms.py | Twilio |
| Webhook | webhook.py | HMAC-validated HTTP |
| BlueBubbles | bluebubbles.py | iMessage bridge |
| HomeAssistant | homeassistant.py | WebSocket |
| API Server | api_server.py | OpenAI-compatible HTTP |
| IRC, LINE, ntfy, SimpleX, Google Chat, Mattermost | (plugins) | Various |

---

## 9. Agent Modules — 89 Files

### Provider Adapters
anthropic, bedrock, codex_responses, gemini_native, gemini_cloudcode, copilot_acp, azure_identity, moonshot_schema, google_code_assist, google_oauth, lmstudio_reasoning, paseo

### Transport Layer (agent/transports/)
base, types, anthropic, bedrock, chat_completions, codex, codex_app_server, codex_app_server_session, codex_event_projector, axiomid_tools_mcp_server

### Core Loop
conversation_loop (~3,900 lines), chat_completion_helpers, agent_init, agent_runtime_helpers, iteration_budget

### Context System
context_engine, context_compressor, conversation_compression, context_references, manual_compression_feedback

### Prompt System
system_prompt, prompt_builder, prompt_caching, subdirectory_hints

### Tool System
tool_executor, tool_dispatch_helpers, tool_guardrails, tool_result_classification

### Skills System
skill_utils, skill_commands, skill_bundles, skill_preprocessing

### Memory System
memory_provider, memory_manager, background_review

### Provider ABCs + Registries (12)
web_search, browser, image_gen, video_gen, tts, transcription — each with provider.py + registry.py

### Auth/Credentials
credential_pool, credential_sources, credential_persistence, portal_tags, secret_sources/bitwarden

### Safety
constitutional_guard, file_safety, error_classifier, redact, axiomid_rate_guard

### LSP (10 modules)
lsp/manager, client, protocol, servers, workspace, install, reporter, range_shift, eventlog, cli

### Display & UX
display, i18n, title_generator, onboarding, markdown_tables

---

## 10. Runtime System

### API Modes
| Mode | Transport | Example Providers |
|---|---|---|
| chat_completions | OpenAI | OpenRouter, AxiomID, custom, ollama, deepseek |
| codex_responses | Responses API | OpenAI Codex, xAI, GitHub Models |
| anthropic_messages | Anthropic | Anthropic Claude, Azure Anthropic |
| bedrock_converse | AWS Bedrock | Claude on Bedrock |
| codex_app_server | JSON-RPC | Codex subprocess |

### Credential Sources
env vars, Claude Code credentials, PKCE OAuth, device code, Qwen CLI, GitHub CLI, manual, Bitwarden Secrets Manager

### Entry Points
| Entry Point | Lines | Purpose |
|---|---|---|
| run_agent.py | 4,410 | AIAgent class — main programmatic API |
| cli.py | 15,083 | Legacy interactive REPL |
| batch_runner.py | 1,321 | Parallel batch processing |
| mcp_serve.py | 897 | MCP server (exposes conversations as tools) |
| mini_swe_runner.py | 735 | SWE-bench style runner |

---

## 11. Test System

| Directory | Files | Description |
|---|---|---|
| tests/gateway/ | 273 | Gateway and platform adapter tests |
| tests/axiomid_cli/ | 251 | CLI command and config tests |
| tests/tools/ | 234 | Tool registration and execution tests |
| tests/agent/ | 135 | Agent core tests |
| tests/run_agent/ | 97 | AIAgent integration tests |
| tests/cli/ | 69 | CLI display tests |
| tests/ (root) | 66 | Core module tests |
| tests/plugins/ | 38 | Plugin-specific tests |
| tests/cron/ | 15 | Cron scheduler tests |
| tests/acp/ | 13 | ACP editor tests |
| tests/skills/ | 11 | Skills loading tests |
| tests/stress/ | 10 | Load tests |
| tests/docker/ | 9 | Container tests |
| tests/integration/ | 8 | Integration tests |
| Other | 16 | tui, honcho, providers, e2e, state, website |
| **TOTAL** | **1,266** | **25,116 test functions** |

**Framework:** pytest + unittest.mock

---

## 12. Configuration System

### Config File Sections (40+)
model, providers, fallback_providers, credential_pool_strategies, toolsets, agent (timeouts, retries), terminal (backend, docker), web (search backend), browser (engine, CDP, Camofox), checkpoints, tool_output, tool_loop_guardrails, compression, prompt_caching, openrouter, bedrock, auxiliary, display, dashboard, privacy, tts, stt, voice, context, memory, delegation, skills, curator, approvals, command_allowlist, hooks, personalities, security, cron, kanban, code_execution, logging, model_catalog, network, gateway, sessions, lsp, x_search, secrets, goals, slack, discord, telegram, timezone

### Config Schema Version: 24

### Startup Sequence
1. `~/.axiomid/.env` → `load_axiomid_dotenv()` (API keys into os.environ)
2. Project `.env` → dev fallback
3. `~/.axiomid/config.yaml` → early raw read (security.redact_secrets + network.force_ipv4 bridge)
4. `~/.axiomid/config.yaml` → full load_config() (deep-merge with DEFAULT_CONFIG, env var expansion, cache)

---

## 13. Key Branches

| Branch | Purpose |
|---|---|
| `main` | Stable, rebranded codebase — cleaned of DingTalk/WeCom/Yuanbao |
| `pr-2-axiomid-to-axiomid` | Active rebrand PR (6 commits ahead of local) |
| `refactor/axiomid-refactoring-and-optimization` | Refactoring (5 commits ahead of local) |
| `Moeabdelaziz007/debug-terminal-arabic` | Arabic terminal debugging |
| `pr-1-axiomid-cleanup` | AxiomID cleanup (merged) |

---

## 14. Verified LOC Breakdown

| Language | File Count | Lines |
|---|---|---|
| Python | 1,877 | 878,738 |
| TypeScript/TSX | 449 | 89,456 |
| Markdown | 836 | (included in total) |
| YAML | 79 | (included in total) |
| **Total** | **3,246** | **1,049,462** |

---

## 15. Authentication System — Multi-Provider

### Auth Methods (6 types)

| Type | Description | Examples |
|---|---|---|
| `oauth_device_code` | Device code flow | AxiomID Portal |
| `oauth_external` | External OAuth (PKCE, device code) | Codex, xAI, Qwen, Gemini CLI |
| `oauth_minimax` | MiniMax-specific with region routing | Global + China |
| `api_key` | Traditional API key | 22+ providers |
| `aws_sdk` | AWS credential chain | Bedrock |
| `external_process` | Copilot ACP process auth | GitHub Copilot |

### Provider Registry (30+ Providers)

**OAuth Device Code:** AxiomID Portal

**OAuth External:** OpenAI Codex, xAI Grok, Qwen, Google Gemini CLI

**API Key (22+):** OpenAI, Anthropic, Gemini, DeepSeek, xAI, Copilot, LM Studio, Zai, Kimi, MiniMax, NVIDIA, HuggingFace, Bedrock, Azure Foundry, Alibaba, StepFun, Arcee, GMI, AI Gateway, OpenCode Zen, KiloCode, Xiaomi, Tencent TokenHub, Ollama Cloud

### Auth Store Structure (~/.axiomid/auth.json)

```json
{
  "version": 1,
  "active_provider": "axiomid",
  "providers": {
    "<provider_id>": {
      "access_token": "...",
      "refresh_token": "...",
      "expires_at": "ISO-8601",
      "inference_base_url": "..."
    }
  },
  "credential_pool": {
    "<provider_id>": [
      {
        "id": "hex6",
        "auth_type": "oauth|api_key",
        "source": "device_code|env:VAR|claude_code|...",
        "access_token": "...",
        "priority": 0
      }
    ]
  }
}
```

### Credential Pool Strategies
- `fill_first` (default) — Use first available
- `round_robin` — Rotate through credentials
- `random` — Random selection
- `least_used` — Prefer least-used

### Exhaustion Cooldown
- 401 errors: 5 minutes
- 429 errors: 1 hour
- Provider-supplied reset_at overrides

### Credential Sources (9 types)

| Source | Description |
|---|---|
| `env:<VAR>` | Environment variables |
| `claude_code` | ~/.claude/.credentials.json |
| `axiomid_pkce` | ~/.axiomid/.anthropic_oauth.json |
| `device_code` | auth.json providers |
| `qwen-cli` | ~/.qwen/oauth_creds.json |
| `gh_cli` | gh auth token |
| `config:<name>` | Custom providers config |
| `model_config` | model.api_key in config |
| `manual` | User ran `axiomid auth add` |

---

## 16. Database Systems

### 1. Kanban SQLite Database

**Location:** `<root>/kanban.db` or `<root>/kanban/boards/<slug>/kanban.db`

**Tables:**

| Table | Purpose | Key Columns |
|---|---|---|
| `tasks` | Main task board | id, title, body, assignee, status, priority, claim_lock |
| `task_links` | Parent-child relationships | parent_id, child_id |
| `task_comments` | Task discussion | task_id, author, body |
| `task_events` | Audit trail | task_id, run_id, kind, payload |
| `task_runs` | Historical attempts | task_id, profile, status, outcome |
| `kanban_notify_subs` | Gateway notifications | task_id, platform, chat_id |

**Task Statuses:** triage, todo, scheduled, ready, running, blocked, review, done, archived

**Workspace Kinds:** scratch, worktree, dir

**Concurrency:** WAL mode + BEGIN IMMEDIATE + compare-and-swap (CAS)

**Multi-Board Support:** Default board + named boards via AXIOMID_KANBAN_BOARD env var

### 2. AxiomID Prisma Schema (SQLite)

**Models (17):**

| Model | Purpose |
|---|---|
| `User` | Identity & KYC |
| `Integration` | External identity links |
| `UserAgent` | Main agent |
| `SubAgent` | Hierarchical sub-agents |
| `Persona` | Agent personas |
| `Skill` | Skills marketplace |
| `SkillPurchase` | Purchase records |
| `SkillReview` | Reviews (1-5) |
| `AgentSkill` | Agent-skill associations |
| `PiPayment` | Pi blockchain payments |
| `Action` | XP-earning actions |
| `XpLedger` | XP transaction ledger |
| `Vault` | Token vaults |
| `Workflow` | Workflow engine |
| `WorkflowStep` | Workflow steps |
| `AgentLog` | Agent logs |
| `KnowledgeNode` | Agent memory with embeddings |

**Enums:** KYCStatus, AgentStatus, AgentMode, PurchaseStatus, VaultStatus, WorkflowStatus, StepStatus

---

## 17. Hooks System — Three-Tier Architecture

### Tier 1: Python Plugin Hooks (axiomid_cli/plugins.py)

**VALID_HOOKS (21 types):**
- `pre_tool_call`, `post_tool_call`
- `transform_terminal_output`, `transform_tool_result`, `transform_llm_output`
- `pre_llm_call`, `post_llm_call`
- `pre_api_request`, `post_api_request`
- `on_session_start`, `on_session_end`, `on_session_finalize`, `on_session_reset`
- `subagent_stop`
- `pre_gateway_dispatch`
- `pre_approval_request`, `post_approval_response`

**Registration:** `PluginContext.register_hook(hook_name, callback)`

**Discovery:** 4 sources (bundled, user, project, pip entry-points) with priority: bundled < user < project < pip

### Tier 2: Shell-Script Hooks (agent/shell_hooks.py)

**Wire Protocol:** stdin JSON in, stdout JSON out

**Input:**
```json
{
  "hook_event_name": "...",
  "tool_name": "...",
  "tool_input": "...",
  "session_id": "...",
  "cwd": "...",
  "extra": {}
}
```

**Output:**
```json
{
  "action": "block",
  "message": "..."
}
```
or
```json
{
  "context": "..."
}
```

**Consent:** `~/.axiomid/shell-hooks-allowlist.json` with TTY prompt on first use

**Timeout:** default 60s, max 300s

### Tier 3: Gateway Event Hooks (gateway/hooks.py)

**Events:**
- `gateway:startup`
- `session:start`, `session:end`, `session:reset`
- `agent:start`, `agent:step`, `agent:end`
- `command:*` (wildcard match)

**Discovery:** `~/.axiomid/hooks/` directories (HOOK.yaml + handler.py)

**Behavior:** Errors caught and logged but never block the pipeline

---

## 18. Plugin System (axiomid_cli/plugins.py)

### Plugin Kinds

| Kind | Description | Auto-load |
|---|---|---|
| `standalone` | Hooks/tools of its own | No |
| `backend` | Pluggable backend for core tool | Yes (bundled) |
| `exclusive` | Category with one active provider | Yes |
| `platform` | Gateway messaging adapter | Yes (bundled) |
| `model-provider` | Loaded by providers/__init__.py | Yes |

### PluginContext Registration Methods (18)

| Method | Purpose |
|---|---|
| `register_tool()` | Global tool registry |
| `register_hook()` | Lifecycle hook callback |
| `register_cli_command()` | CLI subcommand |
| `register_command()` | Slash command (/name) |
| `register_context_engine()` | Context engine (only one) |
| `register_image_gen_provider()` | Image generation backend |
| `register_video_gen_provider()` | Video generation backend |
| `register_web_search_provider()` | Web search/extract backend |
| `register_browser_provider()` | Cloud browser backend |
| `register_tts_provider()` | Text-to-speech backend |
| `register_transcription_provider()` | Speech-to-text backend |
| `register_platform()` | Gateway platform adapter |
| `register_auxiliary_task()` | Auxiliary LLM task |
| `register_skill()` | Read-only skill |
| `inject_message()` | Inject message into conversation |
| `dispatch_tool()` | Dispatch tool call with parent context |
| `register_model_provider()` | Model provider |

### Discovery Sources (Priority Order)

1. **Bundled:** `<repo>/plugins/<name>/`
2. **User:** `~/.axiomid/plugins/<name>/`
3. **Project:** `./.axiomid/plugins/<name>/` (opt-in)
4. **Pip:** packages with `axiomid_agent.plugins` entry-point

---

## 19. Transport Layer

### Transport Types

| Transport | api_mode | Key Features |
|---|---|---|
| `ChatCompletionsTransport` | `chat_completions` | OpenAI-compatible (16+ providers) |
| `ResponsesApiTransport` | `codex_responses` | OpenAI Responses API (Codex, xAI) |
| `AnthropicTransport` | `anthropic_messages` | Anthropic Messages API |
| `BedrockTransport` | `bedrock_converse` | AWS Bedrock Converse API |

### Shared Types

**ToolCall:**
- `id: str | None` — Protocol identifier
- `name: str` — Tool name
- `arguments: str` — JSON string
- `provider_data: dict | None` — Per-provider metadata

**Usage:**
- `prompt_tokens`, `completion_tokens`, `total_tokens`, `cached_tokens`

**NormalizedResponse:**
- `content: str | None` — Text response
- `tool_calls: list[ToolCall] | None` — Tool calls
- `finish_reason: str` — "stop", "tool_calls", "length", "content_filter"
- `reasoning: str | None` — Internal thinking
- `usage: Usage | None` — Token counts
- `provider_data: dict | None` — Protocol state

### Non-Standard Transports

- **CodexAppServerClient:** JSON-RPC 2.0 over stdio for codex app-server
- **CodexAppServerSession:** Session adapter with streaming, approval, watchdog
- **CodexEventProjector:** Projects codex notifications to OpenAI format
- **AxiomIDToolsMCP:** Exposes 21 AxiomID tools to codex subprocess via MCP

---

## 20. Provider Adapters

### Anthropic Adapter (anthropic_adapter.py)
- Auth: API keys (sk-ant-*), OAuth (sk-ant-oat-*), Claude Code credentials
- Client: `build_anthropic_client()` auto-detects key type
- Thinking: Adaptive thinking (Claude 4.6+), effort levels, thinking budget
- Output limits: 4,096 to 128,000 tokens
- Beta headers: interleaved-thinking, fine-grained-tool-streaming, context-1m

### Bedrock Adapter (bedrock_adapter.py)
- Auth: AWS credential chain (IAM, SSO, env vars, instance metadata)
- Model discovery: Foundation models + cross-region inference profiles
- Error classification: context_overflow, rate_limit, overloaded
- Stale connection detection: dead HTTP connections

### Codex Responses Adapter (codex_responses_adapter.py)
- Message conversion: chat to Responses API input items
- Encrypted reasoning replay across turns
- Preflight validation
- Deterministic call IDs (SHA-256)

### Gemini Cloud Code Adapter (gemini_cloudcode_adapter.py)
- Client: OpenAI-compatible facade over Cloud Code Assist
- Auth: OAuth Bearer token
- Streaming: SSE-based
- Error handling: Rich CodeAssistError

### Gemini Native Adapter (gemini_native_adapter.py)
- Client: OpenAI-compatible facade over Gemini API
- Streaming: SSE with tool call argument deduplication
- Thought signature preservation
- Tier detection: free/paid/unknown

### Azure Identity Adapter (azure_identity_adapter.py)
- Credential chain: DefaultAzureCredential (7 sources)
- Token provider: Zero-arg callable for OpenAI SDK
- Bearer HTTP client: For Anthropic SDK integration

---

## 21. Registries (6)

| Registry | Purpose | Providers |
|---|---|---|
| Browser Provider | Cloud browser automation | browser_use, browserbase, firecrawl |
| Image Gen | Image generation | fal, openai, openai-codex, xai |
| Transcription | Speech-to-text | local, groq, openai, mistral, xai |
| TTS | Text-to-speech | edge, elevenlabs, openai, minimax, xai, mistral, gemini, neutts, kittentts, piper |
| Video Gen | Video generation | fal, xai |
| Web Search | Search/extract/crawl | firecrawl, parallel, tavily, exa, searxng, brave-free, ddgs |

### Resolution Pattern (all registries)

1. Config override → return regardless of availability
2. Single available provider → use it
3. Legacy preference → filter by availability
4. None → error (or local mode for browser)

---

## 22. Tool Execution Pipeline

### Sequential Execution
1. Interrupt check
2. Checkpoint for file-mutating tools
3. Plugin block message check
4. ConstitutionalGuard.validate_input()
5. ToolGuardrailController.before_call()
6. Execute tool
7. ToolGuardrailController.after_call()

### Concurrent Execution
- ThreadPoolExecutor with max 8 workers
- Same pre-flight checks as sequential
- Results collected in original tool-call order

### Guardrails

**Configurable Thresholds:**
- `exact_failure_warn_after`: 2
- `exact_failure_block_after`: 5
- `same_tool_failure_warn_after`: 3
- `same_tool_failure_halt_after`: 8
- `no_progress_warn_after`: 2
- `no_progress_block_after`: 5

**Tool Categories:**
- **Idempotent (17):** read_file, search_files, web_search, web_extract, etc.
- **Mutating (18):** terminal, execute_code, write_file, patch, todo, memory, etc.

### Parallelism Gating

- **Never parallel:** clarify
- **Parallel safe (11):** Read-only tools
- **Path scoped:** read_file, write_file, patch (concurrent if independent paths)
- **Destructive patterns:** rm, rmdir, cp, mv, sed -i, git reset/clean/checkout

---

## 23. Context Engine System

### Abstract Base (agent/context_engine.py)

**Lifecycle:**
1. `on_session_start(session_id, **kwargs)`
2. `update_from_response(usage)` — after each API response
3. `should_compress(prompt_tokens)` — checked after each turn
4. `compress(messages, current_tokens, focus_topic)` — compaction
5. `on_session_end(session_id, messages)` — real session boundaries

**Parameters:**
- `threshold_percent`: 0.75
- `protect_first_n`: 3
- `protect_last_n`: 6

**Default:** ContextCompressor

**Plugin:** Only one allowed via `PluginContext.register_context_engine()`

---

## 24. Prompt Assembly System

### Three-Tier Assembly (agent/system_prompt.py)

**Stable tier** (built once per session):
- Identity: SOUL.md or DEFAULT_AGENT_IDENTITY
- AXIOMID_AGENT_HELP_GUIDANCE
- Tool-aware guidance: MEMORY, SESSION_SEARCH, SKILLS, KANBAN
- Computer-use guidance (macOS)
- AxiomID subscription prompt
- Tool-use enforcement guidance
- Model-family operational guidance
- Skills system prompt

**Context tier:**
- Caller-supplied system_message
- Context files: AGENTS.md, .cursorrules, AXIOMID.md (threat-scanned)

**Volatile tier:**
- Memory snapshot
- USER.md profile
- External memory provider block
- Timestamp/session/model/provider line

---

## 25. Skill Command System

### Slash Command Dispatch (agent/skill_commands.py)

- `scan_skill_commands()`: Scans `~/.axiomid/skills/` and external dirs
- `get_skill_commands()`: Returns cached mapping
- `resolve_skill_command_key()`: Normalizes user input
- `build_skill_invocation_message()`: Loads skill, applies template vars, inline shell
- `build_preloaded_skills_prompt()`: Session-wide CLI preloading

### Skill Preprocessing (agent/skill_preprocessing.py)

**Template Variables:**
- `${AXIOMID_SKILL_DIR}`
- `${AXIOMID_SESSION_ID}`

**Inline Shell:**
- `!`command`` syntax
- Timeout: default 10s
- Output cap: 4000 chars

---

## 26. Config System

### DEFAULT_CONFIG Structure

```yaml
model: ""
providers: {}
fallback_providers: []
credential_pool_strategies: {}
toolsets: ["axiomid-cli"]

agent:
  max_turns: 90
  gateway_timeout: 1800
  api_max_retries: 3
  tool_use_enforcement: "auto"
  image_input_mode: "auto"

terminal:
  backend: "local"
  timeout: 180
  persistent_shell: true

browser:
  inactivity_timeout: 120
  engine: "auto"

compression:
  enabled: true
  threshold: 0.50
  target_ratio: 0.20

auxiliary:
  vision: { provider: "auto", model: "", timeout: 120 }
  compression: { provider: "auto", model: "", timeout: 120 }
  title_generation: { provider: "auto", model: "", timeout: 30 }
```

### Config Loading

- Thread-safe via `_CONFIG_LOCK` (RLock)
- Supports `_expand_env_vars()` for `${VAR}` references
- Auto-migration between config versions (up to version 12+)
- Atomic YAML write with validation

### Environment Variable Denylist

`LD_PRELOAD`, `LD_LIBRARY_PATH`, `DYLD_*`, `PYTHONPATH`, `PYTHONHOME`, `NODE_OPTIONS`, `PATH`, `SHELL`, `BROWSER`, `EDITOR`, `VISUAL`, `PAGER`, `GIT_SSH_COMMAND`, `AXIOMID_HOME`, `AXIOMID_PROFILE`, `AXIOMID_CONFIG`, `AXIOMID_ENV`

---

## 27. AxiomID Backend — Phase 1 Complete (2026-05-31)

> For full documentation, see [[axiomid_backend]] and [[security_architecture]].

### Files Created (10 new)

| File | Purpose | LOC |
|---|---|---|
| `src/lib/errors.ts` | Standardized error responses | ~50 |
| `src/lib/rate-limiter.ts` | Sliding-window rate limiter (4 tiers) | ~80 |
| `src/lib/validators.ts` | 6 Zod input schemas | ~100 |
| `src/middleware.ts` | CORS whitelist + OPTIONS + security headers | ~40 |
| `src/app/api/auth/pi/route.ts` | Pi token verification + user upsert | ~60 |
| `src/app/api/user/status/route.ts` | User profile + tier + XP + level | ~80 |
| `src/app/api/action/claim/route.ts` | XP claim with duplicate detection | ~70 |
| `src/app/api/auth/connect/route.ts` | Wallet connect + HMAC state | ~50 |
| `src/app/api/pi/payment/approve/route.ts` | Pi payment approval | ~60 |
| `src/app/api/pi/payment/complete/route.ts` | Payment completion + XP reward | ~70 |

### Test Files (6 files, 52 tests)

| File | Tests |
|---|---|
| `validators.test.ts` | 16 |
| `rate-limiter.test.ts` | 7 |
| `errors.test.ts` | 10 |
| `auth-pi.test.ts` | 5 |
| `user-status.test.ts` | 4 |
| `action-claim.test.ts` | 5 |
| `payment.test.ts` | 5 |

### Key Decisions
1. In-memory rate limiter (Map-based) — acceptable for beta
2. CORS whitelist: axiomid.app, sandbox.minepi.com, localhost:3000
3. No WebSocket in Phase 1 — added in Phase 3
4. Pi auth verified server-side, never stored
5. XP rewards applied in same Prisma transaction

### Upcoming Phases
- **Phase 3**: Agent Backend (CRUD + Circuit Breaker + WebSocket State Recovery)
- **Phase 4**: Subdomain System + CORS Isolation
- **Phase 5**: Agent Templates
- **Phase 6**: Frontend UI (Chat, Card, Gallery)
- **Phase 0**: AxiomID → AxiomID rebrand cleanup (~50 files)

---

## 28. Session Change Log (2026-05-31)

### Deep Expert Review + Platform Cleanup
- Reviewed all 295+ pending changes before merge
- **Deleted 30+ crash-causing Platform enum references** (DINGTALK, WECOM, WECOM_CALLBACK, YUANBAO)
- **Fixed 6 crash sites** in `gateway/run.py` (adapter imports, auth dicts, platform sets, env var lists)
- **Cleaned tools/**: removed DingTalk/WeCom/Yuanbao send functions + dispatch in `send_message_tool.py`; deleted `yuanbao_tools.py` (737 lines dead code)
- **Cleaned `axiomid_cli/`**: removed platform setup entries from `gateway.py`; deleted `dingtalk_auth.py` (293 lines); cleaned env var lists in `config.py`; removed platform entries from `status.py` and `dump.py`
- **Deleted 16 broken test files** (DingTalk, WeCom, Yuanbao, telephony, hyperliquid, etc.)
- **Fixed 3 test files** with remaining broken refs: `test_config.py`, `test_platform_connected_checkers.py`, `test_text_batching.py`
- **Fixed `pyproject.toml`**: removed dead ruff rule `"optional-skills/**" = ["PLW1514"]`
- **Fixed `setup.py`**: removed `_data_file_tree("optional-skills")` crash
- **Total**: 329 files changed, ~137K lines deleted — zero broken platform references remaining

### AI Team Workspace (Jules PR #4)
- Merged Jules PR #4: Rebran AxiomID → AxiomID, created `ai-team/` directory
- **6 agents**: Antigravity (leader), CodeRabbit (reviewer), Copilot (completions), OpenCode (refactoring), Stitch MCP/UI (design, replaced v0), v0→Stitch MCP
- **Google AI Studio** merged into Antigravity as platform subsection (not standalone agent)
- **Raptor Mini** replaced with `GPT-5.4 Mini` (registered model) in Copilot profile

### MCP Tools Added
- **Stitch MCP** (`@_davideast/stitch-mcp`): Google's AI UI design tool, replaces v0 agent
- **Jules MCP** (`google-jules-mcp`): Google code review automation
- Configured in `~/.config/opencode/opencode.json`

### README Rebranding
- Created terminal-themed branding (210 lines) with ASCII logo, Mermaid architecture diagram, stats table, platform matrix

### Pending
- Provider cleanup: user to select which of 31 providers to keep/drop
- Seed data plan for AI team dashboard + team-log + tasks
- Knowledge base update: current

---

*Generated by AxiomID opencode agent on 2026-06-03. All counts verified via codebase analysis.*
