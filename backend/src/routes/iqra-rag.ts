/**
 * iqra-rag.ts — Quran RAG (Retrieval-Augmented Generation) endpoint
 *
 * Full cycle: embed(query) → Vectorize.search → D1 fetch → AI generate → JSON
 * KV cache with 1-hour TTL per query.
 *
 * Response: { answer_ar, answer_en, ayat, confidence, source }
 */

import type { Env } from "../lib/types";
import { jsonResponse, errorResponse } from "../lib/auth";

const EMBEDDING_MODEL = "@cf/baai/bge-small-en-v1.5";
const GENERATION_MODEL = "@cf/meta/llama-3.1-8b-instruct";
const TOP_K = 5;
const CACHE_TTL_SECONDS = 3600;

interface RagResponse {
  answer_ar: string;
  answer_en: string;
  ayat: Array<{
    surah: number;
    verse: number;
    text_ar: string;
    text_en: string;
    score: number;
  }>;
  confidence: number;
  source: string;
}

interface VectorMatch {
  id: string;
  score: number;
  metadata?: {
    verse_key?: string;
    verse_id?: number;
  };
}

/**
 * Normalize query for cache key.
 */
function normalizeQuery(q: string): string {
  return q.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Simple hash for cache key.
 */
function hashQuery(q: string): string {
  let hash = 0;
  for (let i = 0; i < q.length; i++) {
    const char = q.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `rag:${Math.abs(hash).toString(36)}`;
}

/**
 * Generate embedding for query using Workers AI.
 */
async function embedQuery(env: Env, query: string): Promise<number[]> {
  const res = await env.AI.run(EMBEDDING_MODEL, { text: [query] });
  return res.data[0];
}

/**
 * Search Vectorize for similar verses.
 */
async function searchVerses(
  env: Env,
  embedding: number[]
): Promise<VectorMatch[]> {
  const results = await env.SEARCH_VECTORS.query(embedding, {
    topK: TOP_K,
    namespace: "quran",
  });
  return results.matches;
}

/**
 * Fetch verse details from D1.
 */
async function fetchVerseDetails(
  env: Env,
  matches: VectorMatch[]
): Promise<RagResponse["ayat"]> {
  if (matches.length === 0) return [];

  const verseIds = matches
    .map((m) => m.metadata?.verse_id)
    .filter((id): id is number => id != null);

  if (verseIds.length === 0) return [];

  const placeholders = verseIds.map(() => "?").join(",");
  const stmt = env.IQRA_DB.prepare(
    `SELECT id, surah_id, verse_number, text_ar, text_en
     FROM quran_verses
     WHERE id IN (${placeholders})`
  ).bind(...verseIds);

  const { results } = await stmt.all<{
    id: number;
    surah_id: number;
    verse_number: number;
    text_ar: string;
    text_en: string;
  }>();

  // Preserve order from Vectorize results
  const verseMap = new Map(results.map((r) => [r.id, r]));

  return matches
    .filter((m) => m.metadata?.verse_id != null)
    .map((m) => {
      const verse = verseMap.get(m.metadata!.verse_id!);
      return {
        surah: verse?.surah_id || 0,
        verse: verse?.verse_number || 0,
        text_ar: verse?.text_ar || "",
        text_en: verse?.text_en || "",
        score: m.score,
      };
    });
}

/**
 * Generate AI answer from retrieved verses.
 */
async function generateAnswer(
  env: Env,
  query: string,
  ayat: RagResponse["ayat"]
): Promise<{ answer_ar: string; answer_en: string; confidence: number }> {
  const context = ayat
    .map(
      (a, i) =>
        `[${i + 1}] Surah ${a.surah}, Verse ${a.verse}:\nArabic: ${a.text_ar}\nEnglish: ${a.text_en}`
    )
    .join("\n\n");

  const prompt = `You are a Quranic knowledge assistant. Answer the user's question based ONLY on the provided verses. If the verses don't contain enough information, say so.

User question: ${query}

Retrieved verses:
${context}

Provide your answer in both Arabic and English. Format:
ARABIC: [answer in Arabic]
ENGLISH: [answer in English]`;

  const res = await env.AI.run(GENERATION_MODEL, {
    messages: [
      {
        role: "system",
        content: "You are a knowledgeable Quranic scholar. Answer based on the provided verses.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 512,
  });

  const response = (res as { response?: string }).response || "";

  // Parse ARABIC: and ENGLISH: from response
  const arMatch = response.match(/ARABIC:\s*(.+?)(?=\nENGLISH:|$)/s);
  const enMatch = response.match(/ENGLISH:\s*(.+?)$/s);

  // Confidence based on vector similarity scores
  const avgScore =
    ayat.reduce((sum, a) => sum + a.score, 0) / (ayat.length || 1);
  const confidence = Math.min(1, Math.max(0, avgScore));

  return {
    answer_ar: arMatch?.[1]?.trim() || response.slice(0, 200),
    answer_en: enMatch?.[1]?.trim() || response.slice(0, 200),
    confidence,
  };
}

/**
 * Handle GET /api/iqra/ask?q={query}
 */
export async function handleIqraAsk(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return errorResponse("Missing query parameter 'q'", 400);
  }

  const normalized = normalizeQuery(query);
  const cacheKey = hashQuery(normalized);

  // Check KV cache
  const cached = await env.CACHE_KV.get(cacheKey, "json");
  if (cached) {
    return jsonResponse({ ...cached, source: "cache" }, 200, { "X-Cache": "HIT" });
  }

  try {
    // 1. Embed query
    const embedding = await embedQuery(env, query);

    // 2. Vectorize search
    const matches = await searchVerses(env, embedding);

    // 3. Fetch verse details from D1
    const ayat = await fetchVerseDetails(env, matches);

    // 4. Generate AI answer
    const { answer_ar, answer_en, confidence } = await generateAnswer(
      env,
      query,
      ayat
    );

    const response: RagResponse = {
      answer_ar,
      answer_en,
      ayat,
      confidence,
      source: "rag",
    };

    // 5. Cache in KV (1 hour TTL)
    await env.CACHE_KV.put(cacheKey, JSON.stringify(response), {
      expirationTtl: CACHE_TTL_SECONDS,
    });

    return jsonResponse(response, 200, { "X-Cache": "MISS" });
  } catch (err) {
    console.error("[IQRA-RAG] Error:", err);
    return errorResponse(
      err instanceof Error ? err.message : "RAG pipeline failed",
      500
    );
  }
}

/**
 * Handle GET /api/iqra/daily-ayah
 * Returns a featured ayah for today.
 */
export async function handleDailyAyah(
  request: Request,
  env: Env
): Promise<Response> {
  const today = new Date().toISOString().slice(0, 10);

  try {
    // Check if today's ayah exists
    const existing = await env.IQRA_DB.prepare(
      `SELECT da.id, da.verse_id, v.surah_id, v.verse_number, v.text_ar, v.text_en
       FROM daily_ayah da
       JOIN quran_verses v ON da.verse_id = v.id
       WHERE da.date = ?`
    )
      .bind(today)
      .first<{
        verse_id: number;
        surah_id: number;
        verse_number: number;
        text_ar: string;
        text_en: string;
      }>();

    if (existing) {
      return jsonResponse({
        surah: existing.surah_id,
        verse: existing.verse_number,
        text_ar: existing.text_ar,
        text_en: existing.text_en,
        date: today,
      });
    }

    // Pick a random verse for today (seeded by date for consistency)
    const dateHash = today.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const randomVerse = await env.IQRA_DB.prepare(
      `SELECT id, surah_id, verse_number, text_ar, text_en
       FROM quran_verses
       WHERE id = (ABS(?) % 6236) + 1`
    )
      .bind(dateHash)
      .first<{
        id: number;
        surah_id: number;
        verse_number: number;
        text_ar: string;
        text_en: string;
      }>();

    if (!randomVerse) {
      return errorResponse("No verses found", 404);
    }

    // Store for today
    await env.IQRA_DB.prepare(
      `INSERT OR IGNORE INTO daily_ayah (verse_id, date) VALUES (?, ?)`
    )
      .bind(randomVerse.id, today)
      .run();

    return jsonResponse({
      surah: randomVerse.surah_id,
      verse: randomVerse.verse_number,
      text_ar: randomVerse.text_ar,
      text_en: randomVerse.text_en,
      date: today,
    });
  } catch (err) {
    console.error("[IQRA] Daily ayah error:", err);
    return errorResponse("Failed to fetch daily ayah", 500);
  }
}
