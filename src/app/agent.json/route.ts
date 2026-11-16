export const dynamic = "force-static";

export function GET() {
  const manifest = {
    name: "pai-universe",
    protocol: "ppp/1.0",
    discovery: ["/agentic.txt", "/llms.txt", "/agent.json"],
    source: "github.com/pai-list/protocol-stubs",
    universal_entry_point: "https://axiomid.app",
    subdomains: {
      "": "https://axiomid.app (Universal Hub — Aura OS desktop)",
      index: "https://index.axiomid.app (Central Mirror Directory)",
      aip: "https://aip.axiomid.app (Zero Raw Keys Security Gateway)",
      ppp: "https://ppp.axiomid.app (USB Universal Connector)",
      memory: "https://memory.axiomid.app (7-Layer Memory Engine)",
      earn: "https://earn.axiomid.app (Pi Machine Labor Exchange)",
      auth: "https://auth.axiomid.app (Pi OAuth2 & W3C DID)",
      skills: "https://skills.axiomid.app (Skills Registry & MCP Server)",
      mcp: "https://mcp.axiomid.app (PAI MCP Gateway)",
      mail: "https://mail.axiomid.app (Agentic Email Gateway)",
      harness: "https://harness.axiomid.app (The Forge — Evals & Sandboxes)",
      node: "https://node.axiomid.app (Agent Node Registry)",
      learn: "https://learn.axiomid.app (PAI Protocol Academy)",
      agdp: "https://agdp.axiomid.app (Agentic Gross Domestic Product Engine)",
      openid: "https://openid.axiomid.app (OpenIdentity Standard)",
      docs: "https://docs.axiomid.app (Protocol Documentation)",
      gspace: "https://gspace.axiomid.app (GWT Workspace Monitor)",
      piverify: "https://piverify.axiomid.app (Pi KYC Verification Service)",
      signaling: "https://signaling.axiomid.app (ADP WebRTC Signaling)",
    },
    endpoints: {
      memory: { recite: "POST /v1/memory/recall", store: "POST /v1/memory/store" },
      earn: { bounties: "GET /v1/bounties", heartbeat: "GET /heartbeat.md" },
      mcp: "POST /v1/mcp",
      tokens: "POST /v1/tokens/issue",
      spec: "GET /spec.ppp",
    },
    status: "scaffold",
  };
  return Response.json(manifest, { headers: { "Content-Type": "application/json" } });
}
