var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
var ObserveLoop = class {
  static {
    __name(this, "ObserveLoop");
  }
  metrics = [];
  maxHistory = 1e4;
  record(metrics) {
    this.metrics.push(metrics);
    if (this.metrics.length > this.maxHistory) {
      this.metrics.shift();
    }
  }
  getRecent(windowMs = 36e5) {
    const cutoff = Date.now() - windowMs;
    return this.metrics.filter((m) => m.timestamp > cutoff);
  }
  getAll() {
    return [...this.metrics];
  }
};
var EvaluateLoop = class {
  static {
    __name(this, "EvaluateLoop");
  }
  evaluate(metrics) {
    const scores = /* @__PURE__ */ new Map();
    const grouped = this.groupByProvider(metrics);
    for (const [providerId, calls] of grouped) {
      const successes = calls.filter((c) => c.success);
      const successRate = successes.length / calls.length;
      const avgLatency = calls.reduce((s, c) => s + c.latencyMs, 0) / calls.length;
      const avgCost = calls.reduce((s, c) => s + c.costPer1M, 0) / calls.length;
      const ratings = calls.filter((c) => c.userRating !== void 0).map((c) => c.userRating);
      const userSatisfaction = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 3;
      scores.set(providerId, {
        providerId,
        totalCalls: calls.length,
        successRate,
        avgLatency,
        avgCost,
        userSatisfaction,
        weight: this.calculateWeight(successRate, avgLatency, avgCost, userSatisfaction)
      });
    }
    return scores;
  }
  groupByProvider(metrics) {
    const grouped = /* @__PURE__ */ new Map();
    for (const m of metrics) {
      const key = `${m.provider}:${m.model}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(m);
    }
    return grouped;
  }
  calculateWeight(successRate, latency, cost, satisfaction) {
    const successScore = successRate;
    const latencyScore = Math.max(0, 1 - latency / 2e3);
    const costScore = Math.max(0, 1 - cost / 10);
    const satisfactionScore = satisfaction / 5;
    return successScore * 0.4 + latencyScore * 0.2 + costScore * 0.2 + satisfactionScore * 0.2;
  }
};
var AdjustLoop = class {
  static {
    __name(this, "AdjustLoop");
  }
  adjustWeights(currentWeights, scores, learningRate = 0.1) {
    const newWeights = new Map(currentWeights);
    for (const [providerId, score] of scores) {
      const current = currentWeights.get(providerId) ?? 0.5;
      const target = score.weight;
      const updated = current + learningRate * (target - current);
      newWeights.set(providerId, Math.max(0.1, Math.min(1, updated)));
    }
    return newWeights;
  }
};
var TestLoop = class {
  static {
    __name(this, "TestLoop");
  }
  testBucketSize = 0.1;
  shouldUseNewWeights() {
    return Math.random() < this.testBucketSize;
  }
  compareResults(controlMetrics, testMetrics) {
    if (controlMetrics.length === 0 || testMetrics.length === 0) {
      return { winner: "tie", confidence: 0 };
    }
    const controlSuccess = controlMetrics.filter((m) => m.success).length / controlMetrics.length;
    const testSuccess = testMetrics.filter((m) => m.success).length / testMetrics.length;
    const controlLatency = controlMetrics.reduce((s, m) => s + m.latencyMs, 0) / controlMetrics.length;
    const testLatency = testMetrics.reduce((s, m) => s + m.latencyMs, 0) / testMetrics.length;
    const controlScore = controlSuccess * 1e3 - controlLatency;
    const testScore = testSuccess * 1e3 - testLatency;
    const diff = Math.abs(controlScore - testScore);
    const confidence = Math.min(1, diff / 100);
    if (diff < 10) return { winner: "tie", confidence };
    return { winner: testScore > controlScore ? "test" : "control", confidence };
  }
};
var DeployLoop = class {
  static {
    __name(this, "DeployLoop");
  }
  async deployWeights(weights, kv) {
    try {
      await kv.put("provider_weights", JSON.stringify(Array.from(weights.entries())));
      return true;
    } catch (e) {
      console.error("[DeployLoop] KV write failed:", e);
      return false;
    }
  }
  async loadWeights(kv) {
    const raw = await kv.get("provider_weights");
    if (!raw) return /* @__PURE__ */ new Map();
    try {
      return new Map(JSON.parse(raw));
    } catch {
      return /* @__PURE__ */ new Map();
    }
  }
};
var MeasureLoop = class {
  static {
    __name(this, "MeasureLoop");
  }
  measureImpact(beforeMetrics, afterMetrics) {
    if (beforeMetrics.length === 0 || afterMetrics.length === 0) {
      return { latencyImprovement: 0, costImprovement: 0, successRateImprovement: 0 };
    }
    const beforeSuccess = this.successRate(beforeMetrics);
    const afterSuccess = this.successRate(afterMetrics);
    const beforeLatency = this.avg(beforeMetrics, (m) => m.latencyMs);
    const afterLatency = this.avg(afterMetrics, (m) => m.latencyMs);
    const beforeCost = this.avg(beforeMetrics, (m) => m.costPer1M);
    const afterCost = this.avg(afterMetrics, (m) => m.costPer1M);
    return {
      latencyImprovement: beforeLatency > 0 ? (beforeLatency - afterLatency) / beforeLatency : 0,
      costImprovement: beforeCost > 0 ? (beforeCost - afterCost) / beforeCost : 0,
      successRateImprovement: afterSuccess - beforeSuccess
    };
  }
  successRate(m) {
    return m.filter((x) => x.success).length / m.length;
  }
  avg(m, fn) {
    return m.reduce((s, x) => s + fn(x), 0) / m.length;
  }
};
var LearnLoop = class {
  static {
    __name(this, "LearnLoop");
  }
  epsilon = 0.1;
  // 10 % explore, 90 % exploit
  selectProvider(providers, weights) {
    if (providers.length === 0) throw new Error("No providers available");
    if (Math.random() < this.epsilon) {
      return providers[Math.floor(Math.random() * providers.length)];
    }
    let best = providers[0];
    let bestW = weights.get(best) ?? 0;
    for (const p of providers) {
      const w = weights.get(p) ?? 0;
      if (w > bestW) {
        bestW = w;
        best = p;
      }
    }
    return best;
  }
  /** Call after each full loop to tighten exploitation over time */
  decayEpsilon(factor = 0.99) {
    this.epsilon = Math.max(0.01, this.epsilon * factor);
  }
  getEpsilon() {
    return this.epsilon;
  }
};
var SevenLoopRouter = class {
  static {
    __name(this, "SevenLoopRouter");
  }
  observe = new ObserveLoop();
  evaluate = new EvaluateLoop();
  adjust = new AdjustLoop();
  test = new TestLoop();
  deploy = new DeployLoop();
  measure = new MeasureLoop();
  learn = new LearnLoop();
  weights = /* @__PURE__ */ new Map();
  snapshotBefore = [];
  PROVIDERS = ["deepseek", "openrouter", "together", "cloudflare"];
  MODEL_MAP = {
    deepseek: "deepseek-chat",
    openrouter: "openai/gpt-4o",
    together: "meta-llama/Llama-3.1-70B-Instruct-Turbo",
    cloudflare: "@cf/meta/llama-3.1-8b-instruct"
  };
  LATENCY_MAP = {
    deepseek: 450,
    // 450ms real DeepSeek API P50 latency (200-900ms range)
    openrouter: 820,
    // 820ms OpenAI/OpenRouter P50
    together: 610,
    // 610ms Together AI Llama 70B
    cloudflare: 180
    // 180ms Workers AI Llama 8B
  };
  COST_MAP = {
    deepseek: 0.14,
    // $0.14/1M tokens
    openrouter: 2.5,
    // $2.50/1M tokens
    together: 0.88,
    // $0.88/1M tokens
    cloudflare: 0
    // $0.00/1M (free tier)
  };
  async init(env) {
    this.weights = await this.deploy.loadWeights(env.ROUTER_WEIGHTS);
    for (const p of this.PROVIDERS) {
      if (!this.weights.has(p)) this.weights.set(p, 0.5);
    }
  }
  route(prompt) {
    let language = "en";
    if (prompt) {
      if (/[\u0600-\u06FF]/.test(prompt)) language = "ar";
      else if (/[\u4E00-\u9FFF]/.test(prompt)) language = "zh";
    }
    const explorationEpsilon = this.learn.getEpsilon();
    const isExploration = Math.random() < explorationEpsilon;
    let selected;
    if (language === "zh" && !isExploration) {
      selected = "deepseek";
    } else {
      selected = this.learn.selectProvider([...this.PROVIDERS], this.weights);
    }
    return {
      provider: selected,
      model: this.MODEL_MAP[selected] ?? "unknown",
      isExploration,
      estimatedLatencyMs: this.LATENCY_MAP[selected] ?? 500,
      estimatedCostPer1M: this.COST_MAP[selected] ?? 0.5,
      language
    };
  }
  async recordFeedback(metrics, env) {
    this.observe.record(metrics);
    const recent = this.observe.getRecent(36e5);
    const scores = this.evaluate.evaluate(recent);
    this.weights = this.adjust.adjustWeights(this.weights, scores);
    if (env.ROUTER_WEIGHTS) {
      await this.deploy.deployWeights(this.weights, env.ROUTER_WEIGHTS);
    }
  }
  async runFullCycle(env) {
    const recent = this.observe.getRecent(36e5);
    const scores = this.evaluate.evaluate(recent);
    const newWeights = this.adjust.adjustWeights(this.weights, scores);
    const useNew = this.test.shouldUseNewWeights();
    const ok = await this.deploy.deployWeights(useNew ? newWeights : this.weights, env.ROUTER_WEIGHTS);
    if (ok && useNew) {
      const impact = this.measure.measureImpact(this.snapshotBefore, recent);
      console.log("[MeasureLoop] impact:", impact);
      this.snapshotBefore = [...recent];
      this.weights = newWeights;
    }
    this.learn.decayEpsilon();
    console.log("[LearnLoop] epsilon:", this.learn.getEpsilon().toFixed(4));
  }
};
var router = new SevenLoopRouter();
var initialized = false;
var src_default = {
  async fetch(request, env) {
    if (!initialized) {
      await router.init(env);
      initialized = true;
    }
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/route") {
      const body = await request.json();
      if (!body?.prompt) {
        return Response.json({ error: "Missing prompt" }, { status: 400 });
      }
      const selection = router.route(body.prompt);
      return Response.json({
        ok: true,
        provider: selection.provider,
        model: selection.model,
        isExploration: selection.isExploration,
        estimatedLatencyMs: selection.estimatedLatencyMs,
        estimatedCostPer1M: selection.estimatedCostPer1M,
        language: selection.language,
        epsilon: router["learn"].getEpsilon()
      });
    }
    if (request.method === "POST" && url.pathname === "/feedback") {
      const metrics = await request.json();
      const required = ["timestamp", "provider", "model", "latencyMs", "costPer1M", "success"];
      for (const field of required) {
        if (!(field in metrics)) {
          return Response.json({ error: `Missing field: ${field}` }, { status: 400 });
        }
      }
      await router.recordFeedback(metrics, env);
      return Response.json({ ok: true, recorded: true });
    }
    if (request.method === "GET" && url.pathname === "/weights") {
      return Response.json({
        weights: Object.fromEntries(router["weights"]),
        epsilon: router["learn"].getEpsilon(),
        totalObservations: router["observe"].getAll().length
      });
    }
    return Response.json({ error: "Not found" }, { status: 404 });
  }
};

// ../../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-3Qz9a6/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-3Qz9a6/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  AdjustLoop,
  DeployLoop,
  EvaluateLoop,
  LearnLoop,
  MeasureLoop,
  ObserveLoop,
  SevenLoopRouter,
  TestLoop,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
