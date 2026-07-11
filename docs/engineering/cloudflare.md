# 🌐 Cloudflare: Sovereign Edge Layer

## Infrastructure Mapping
- **Durable Objects**: Use for any state that requires low-latency, real-time coordination (e.g., Live Agent Sessions).
- **Workflows**: Use for any process that lasts longer than a single request (e.g., Complex Missions).
- **D1**: The primary store for the Living Passport event log.
- **AI Gateway**: All LLM calls must route through the Gateway for observability and routing.
