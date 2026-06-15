/**
 * Harvest processor — runs inside Cloudflare Queue consumer.
 * Processes harvest jobs: query Perplexity → store in D1 → cache in KV.
 */

import type { Env } from "../lib/types";
import { PerplexityClient } from "../lib/perplexity-client";
import { KVHelper } from "../db/kv";
import { D1Helper } from "../db/d1";

export async function processHarvestJob(
  message: { body: { jobId: string; query: string; userDid?: string; callbackUrl?: string } },
  env: Env
): Promise<void> {
  const { jobId, query, userDid, callbackUrl } = message.body;

  if (!jobId || !query) {
    console.error("[Harvest] Invalid message: missing jobId or query");
    return;
  }

  console.log(`[Harvest] Processing job ${jobId}: "${query.slice(0, 80)}..."`);

  const kv = new KVHelper(env.CACHE_KV);
  const d1 = new D1Helper(env.DB);

  // Dedup check
  const cacheKey = `cache:harvest:${jobId}`;
  const existing = await kv.get(cacheKey);
  if (existing) {
    console.log(`[Harvest] Job ${jobId} already processed, skipping`);
    return;
  }

  try {
    // Query Perplexity
    const client = new PerplexityClient(env.PERPLEXITY_API_KEY || "");
    const result = await client.query({ query, userDid });

    // Store in D1
    await d1.saveHarvestResult({
      id: jobId,
      query,
      result: result.answer,
      citations: result.citations,
      userDid,
    });

    // Cache in KV (dedup for 5 minutes)
    await kv.set(cacheKey, { processed: true, tokens: result.tokens }, 300);

    console.log(`[Harvest] Job ${jobId} complete (${result.tokens} tokens, ${result.citations.length} citations)`);

    // Optional webhook callback
    if (callbackUrl) {
      try {
        await fetch(callbackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId,
            status: "completed",
            result: result.answer,
            citations: result.citations,
          }),
        });
      } catch (err) {
        console.error(`[Harvest] Callback failed for ${jobId}:`, err);
      }
    }
  } catch (err) {
    console.error(`[Harvest] Job ${jobId} failed:`, err);

    // Store error in D1
    await d1.saveHarvestResult({
      id: jobId,
      query,
      result: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
      citations: [],
      userDid,
    });
  }
}
