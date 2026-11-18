export const dynamic = "force-static";

export function GET() {
  return new Response(
    `# axiomid.app (Aura OS — Sovereign AI Desktop & Human Authorization Protocol)

> Summary: PAI Universe hub. Full Aura OS desktop, decentralized human-AI identity verification, skills registry, 7-layer memory engine, and protocol mirror.

## Core Surfaces & Agent Discovery
- / — Aura OS Sovereign AI Desktop (quad-lingual EN/AR/ZH/HI + Cyber Defense Center)
- /onboarding — 4-Step Sovereign Key & Pi KYC Onboarding Wizard
- /plans — Aura OS compute tiers (P1/P2/P3)
- /dashboard — Control Center & Agent Fleet Management
- /claim — Claim Sovereign Identity
- /passport/{username} — Public Sovereign Passport & Verifiable Credentials
- /agent.json — structured capability manifest (JSON)
- /agentic.txt — agent instructions (markdown)
- /mcp.json — MCP server discovery (JSON)
- /spec.ppp — 3-section PPP wire format sample (ppp.axiomid.app)

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
