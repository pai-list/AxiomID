export const dynamic = "force-static";

export function GET() {
  return new Response(
    `# axiomid.app (Aura OS — Sovereign AI Desktop & Human Authorization Protocol)

> Summary: PAI Universe hub. Full Aura OS desktop, decentralized human-AI identity verification, skills registry, 7-layer memory engine, and protocol mirror.

## Core Surfaces & Agent Discovery
- / — Aura OS Sovereign AI Desktop (quad-lingual EN/AR/ZH/HI + Cyber Defense Center)
- /onboarding — 4-Step Sovereign Key & Pi KYC Onboarding Wizard
- /plans — Aura OS compute tiers (P1/P2/P3)
- /harness — Aura OS Harness Forge Terminal (/harness)
- /memory — Aura OS 7-Layer AI Notes & WikiGraph Memory (/memory)
- /dashboard — Control Center & Agent Fleet Management
- /claim — Claim Sovereign Identity
- /passport/{username} — Public Sovereign Passport & Verifiable Credentials
- /agent.json — structured capability manifest (JSON)
- /agentic.txt — agent instructions (markdown)
- /mcp.json — MCP server discovery (JSON)
- /spec.ppp — 3-section PPP wire format sample (ppp.axiomid.app)

## Live Ecosystem Subdomains (*.axiomid.app)
- https://gspace.axiomid.app — Global Workspace Interpretability & Live Telemetry
- https://harness.axiomid.app — Harness Forge, Eval Suites & Verification Gates
- https://memory.axiomid.app — 7-Layer Vector & WikiGraph Memory Engine
- https://skills.axiomid.app — Pi Agentic Skills Registry & x402 Manifests
- https://mcp.axiomid.app — Model Context Protocol Gateway (Al-Mizan Router)
- https://earn.axiomid.app — Autonomous Machine-Labor Bounties (Pi Escrow)
- https://learn.axiomid.app — PAI Protocol Academy & Interactive Tracks
- https://openid.axiomid.app — Sovereign AI Passport & W3C DID Schema
- https://aip.axiomid.app — Axiom Identity Protocol Zero-Key Token Vault
- https://ppp.axiomid.app — Plug-and-Play Universal Agent Wire Connector
- https://auth.axiomid.app — Pi Network OAuth2 & DID Issuer
- https://node.axiomid.app — Sovereign Agent Node Registry & Peers
- https://agdp.axiomid.app — Agentic GDP & Autonomous Commerce Engine
- https://mail.axiomid.app — Cloudflare Agentic Email Routing Backbone
- https://piverify.axiomid.app — Human-Backed Pi KYC Sybil Resistance Oracle
- https://index.axiomid.app — Central Protocol Directory & Sitemap

## API & Protocol Endpoints
- GET /api/telemetry — Aura OS Global Workspace (GWT) live edge telemetry
- GET /api/passport/{username} — Public passport data
- GET /api/passport/demo — Demo passport
- GET /api/leaderboard — Top users ranked by XP
- GET /api/did-document — W3C DID document (/.well-known/did.json)
- POST /api/agent/activate — Authenticated agent activation (KYC / entitlement guarded)
- POST /api/sync — Authenticated D1-to-PostgreSQL data sync
- GET /api/daily-review — Cron-guarded daily operational review
- POST /v1/memory/recall — memory RECALL endpoint
- POST /v1/memory/store — memory STORE endpoint
- GET /v1/bounties — earn bounties
- GET /heartbeat.md — 10-min liveness pulse sample
- GET /skill.md — machine-labor submission spec
`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
}
