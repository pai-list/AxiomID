# ☁️ Vercel: DX & Application Layer

## Best Practices
- **Statelessness**: Functions are ephemeral. Use `waitUntil` for async work.
- **Regionality**: Set function regions near the data source.
- **Caching**: Use Runtime Cache for regional data; avoid global KV for high-frequency state.
- **Blob Storage**: Use Vercel Blob for immutable assets.
