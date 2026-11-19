export const dynamic = "force-static";

export function GET() {
  const discovery = {
    name: "pai-universe-hub",
    version: "3.1.0",
    protocol: "publicmcp",
    ecosystems: ["vercel", "cloudflare", "pi-network", "google"],
    capabilities: { tools: true, resources: true, context: true, apps: true },
    servers: [
      {
        name: "pai-hub",
        url: "https://axiomid.app/mcp",
        tools: [
          {
            name: "pi_kyc_verify",
            ecosystem: "pi-network",
            description: "Verify Pi KYC UID evidence",
            inputSchema: { type: "object", properties: { uid: { type: "string" } }, required: ["uid"] },
            fuel: { rate: 0.01, currency: "PI", cap_per_turn: 0.05 },
          },
          {
            name: "pi_wallet_pay",
            ecosystem: "pi-network",
            description: "Pay an agent via Pi escrow",
            inputSchema: { type: "object", properties: { to: { type: "string" }, memo: { type: "string" } }, required: ["to"] },
            fuel: { rate: 0.1, currency: "PI", cap_per_turn: 1.0 },
          },
          {
            name: "memory_recall",
            ecosystem: "cloudflare",
            description: "Bitemporal 7-layer WikiGraph memory query on Cloudflare D1 & Vectorize",
            inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
            fuel: { rate: 0.01, currency: "PI", cap_per_turn: 0.1 },
          },
          {
            name: "context_get",
            ecosystem: "google",
            description: "CaaS: fetch session context at session start via Google Gemini & Vercel AI Gateway",
            inputSchema: { type: "object", properties: { session: { type: "string" } } },
            fuel: { rate: 0.0, currency: "PI", cap_per_turn: 0.0 },
          },
          {
            name: "sandbox_exec_preview",
            ecosystem: "vercel",
            description: "Execute and validate strict TypeScript / MCP tool schemas in Vercel Sandbox",
            inputSchema: { type: "object", properties: { runtime: { type: "string" } } },
            fuel: { rate: 0.0, currency: "PI", cap_per_turn: 0.0 },
          },
          {
            name: "gwt_telemetry_sync",
            ecosystem: "vercel",
            description: "Synchronize Global Workspace Theory (GWT) consciousness bus and 16-subdomain edge probes",
            inputSchema: { type: "object", properties: { layers: { type: "number" } } },
            fuel: { rate: 0.0, currency: "PI", cap_per_turn: 0.0 },
          },
        ],
      },
    ],
    verification: { registry: "https://publicmcp.org", status: "verified" },
  };
  return Response.json(discovery, { headers: { "Content-Type": "application/json" } });
}
