/**
 * Edge-compatible Perplexity client for Cloudflare Workers.
 * Uses fetch() instead of OpenAI SDK.
 */

export interface PerplexityResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  citations: string[];
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface HarvestQuery {
  query: string;
  userDid?: string;
  maxTokens?: number;
}

export class PerplexityClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = "llama-3.1-sonar-small-128k-online") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async query(harvest: HarvestQuery): Promise<{
    answer: string;
    citations: string[];
    tokens: number;
  }> {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are a research assistant. Provide accurate, well-sourced answers. Include citations.",
          },
          {
            role: "user",
            content: harvest.query,
          },
        ],
        max_tokens: harvest.maxTokens || 1024,
        temperature: 0.2,
        top_p: 0.9,
        return_related_questions: false,
        search_domain_filter: [],
        search_recency_filter: "month",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error ${response.status}: ${errorText}`);
    }

    const data: PerplexityResponse = await response.json();

    return {
      answer: data.choices[0]?.message?.content || "No answer generated",
      citations: data.citations || [],
      tokens: data.usage?.total_tokens || 0,
    };
  }
}
