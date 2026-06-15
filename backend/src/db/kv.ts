/**
 * KV helper with TTL and cache-aside patterns.
 * Wraps Cloudflare's KVNamespace.
 */

export class KVHelper {
  constructor(private ns: KVNamespace) {}

  async get<T>(key: string): Promise<T | null> {
    return this.ns.get<T>(key, "json");
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const options: { expirationTtl?: number } = {};
    if (ttlSeconds) {
      options.expirationTtl = ttlSeconds;
    }
    await this.ns.put(key, JSON.stringify(value), options);
  }

  async delete(key: string): Promise<void> {
    await this.ns.delete(key);
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  async invalidatePattern(prefix: string): Promise<void> {
    let cursor: string | undefined;
    do {
      const result = await this.ns.list({ prefix, cursor, limit: 100 });
      for (const key of result.keys) {
        await this.ns.delete(key.name);
      }
      cursor = result.list_complete ? undefined : result.cursor;
    } while (cursor);
  }
}
