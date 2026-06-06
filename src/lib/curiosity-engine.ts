/**
 * curiosity-engine.ts — CuriosityEngine with Circuit Breaker
 *
 * RULE 7: CuriosityEngine يتغذّى من self_score بعد كل task
 * RULE 8: Circuit Breaker يحمي كل LLM provider منفصل
 *
 * Flow:
 *   scoreTask()       → deterministic 0‥1 score from result metadata
 *   generateInsight() → Groq first; if it fails → Gemini fallback
 *
 * The Circuit Breaker tracks failure counts per provider and opens
 * the circuit after MAX_FAILURES within RESET_WINDOW_MS.
 */

// ─── Circuit Breaker ──────────────────────────────────────────────────────────

const MAX_FAILURES = 3;
const RESET_WINDOW_MS = 60_000; // 1 minute

interface BreakerState {
  failures: number;
  openedAt: number | null; // null = closed
}

const breakers: Record<string, BreakerState> = {
  groq: { failures: 0, openedAt: null },
  gemini: { failures: 0, openedAt: null },
};

function isOpen(provider: string): boolean {
  const b = breakers[provider];
  if (!b || b.openedAt === null) return false;
  if (Date.now() - b.openedAt > RESET_WINDOW_MS) {
    // Half-open: attempt reset
    b.failures = 0;
    b.openedAt = null;
    return false;
  }
  return true;
}

function recordSuccess(provider: string) {
  const b = breakers[provider];
  if (b) { b.failures = 0; b.openedAt = null; }
}

function recordFailure(provider: string) {
  const b = breakers[provider] ?? { failures: 0, openedAt: null };
  b.failures += 1;
  if (b.failures >= MAX_FAILURES) b.openedAt = Date.now();
  breakers[provider] = b;
}

export function getBreakerState(): Record<string, BreakerState> {
  return { ...breakers };
}

// ─── Score ────────────────────────────────────────────────────────────────────

export interface TaskResult {
  success: boolean;
  durationMs: number;
  outputSize?: number;   // bytes
  errorMessage?: string;
  score?: number;        // pre-computed override
}

/**
 * scoreTask — deterministic 0‥1 quality score.
 *
 * Penalties:
 *  - failure       : -0.5
 *  - slow (>5s)    : -0.1
 *  - empty output  : -0.2
 *  - has error msg : -0.1
 */
export function scoreTask(result: TaskResult): number {
  if (result.score !== undefined) return Math.max(0, Math.min(1, result.score));

  let score = 1.0;
  if (!result.success)           score -= 0.5;
  if (result.durationMs > 5000)  score -= 0.1;
  if ((result.outputSize ?? 1) === 0) score -= 0.2;
  if (result.errorMessage)       score -= 0.1;

  return Math.max(0, Math.min(1, score));
}

// ─── LLM Calls ───────────────────────────────────────────────────────────────

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 256,
      temperature: 0.4,
    }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content.trim();
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI/GOOGLE_API_KEY not set");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 256, temperature: 0.4 },
      }),
      signal: AbortSignal.timeout(10_000),
    }
  );

  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json() as {
    candidates: { content: { parts: { text: string }[] } }[];
  };
  return data.candidates[0].content.parts[0].text.trim();
}

// ─── CuriosityEngine ──────────────────────────────────────────────────────────

export interface InsightResult {
  insight: string;
  provider: "groq" | "gemini" | "fallback";
  score: number;
  durationMs: number;
}

const INSIGHT_PROMPT = (score: number, context: string) =>
  `You are an AI self-improvement engine. A task just completed with a quality score of ${score.toFixed(2)}/1.0.\n\nContext:\n${context}\n\nIn 2-3 concise sentences, explain: (1) what likely caused this score, (2) one specific improvement for next time. Be direct and actionable.`;

/**
 * generateInsight — run CuriosityEngine with Circuit Breaker fallback.
 *
 * Groq → (if open/failed) → Gemini → (if both fail) → static insight.
 */
export async function generateInsight(
  result: TaskResult,
  context: string = ""
): Promise<InsightResult> {
  const score = scoreTask(result);
  const prompt = INSIGHT_PROMPT(score, context || JSON.stringify(result));
  const start = Date.now();

  // Try Groq first
  if (!isOpen("groq")) {
    try {
      const insight = await callGroq(prompt);
      recordSuccess("groq");
      return { insight, provider: "groq", score, durationMs: Date.now() - start };
    } catch {
      recordFailure("groq");
    }
  }

  // Fallback: Gemini
  if (!isOpen("gemini")) {
    try {
      const insight = await callGemini(prompt);
      recordSuccess("gemini");
      return { insight, provider: "gemini", score, durationMs: Date.now() - start };
    } catch {
      recordFailure("gemini");
    }
  }

  // Both circuits open — static insight
  const staticInsight =
    score >= 0.8
      ? "Task completed successfully. Maintain current approach."
      : "Task quality below threshold. Review inputs and reduce latency.";

  return { insight: staticInsight, provider: "fallback", score, durationMs: Date.now() - start };
}
