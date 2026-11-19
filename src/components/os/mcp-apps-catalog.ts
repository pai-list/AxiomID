import type { Language } from "@/app/context/language-context";

export type DesktopAppId =
  | "agents"
  | "gspace"
  | "notes"
  | "terminal"
  | "skills"
  | "mcp"
  | "earn"
  | "learn"
  | "subdomains"
  | "settings"
  | "code"
  | "files"
  | "automation"
  | "autopilot"
  | "assistant";

export type EcosystemProviderId = "vercel" | "cloudflare" | "pi-network" | "google";

export interface EcosystemProviderMeta {
  id: EcosystemProviderId;
  badge: string;
  shortBadge: string;
  stackLabel: string;
  accentText: string;
  accentBorder: string;
  accentBg: string;
}

export const ECOSYSTEM_PROVIDERS: Record<EcosystemProviderId, EcosystemProviderMeta> = {
  vercel: {
    id: "vercel",
    badge: "▲ Vercel Cloud",
    shortBadge: "▲ Vercel",
    stackLabel: "Next.js 16 · AI SDK · Fluid Compute · Sandbox",
    accentText: "text-cyan-200",
    accentBorder: "border-cyan-400/35",
    accentBg: "bg-cyan-500/15",
  },
  cloudflare: {
    id: "cloudflare",
    badge: "☁ Cloudflare Edge",
    shortBadge: "☁ Cloudflare",
    stackLabel: "Workers · Durable Objects · D1 · R2 · Vectorize",
    accentText: "text-amber-200",
    accentBorder: "border-amber-400/35",
    accentBg: "bg-amber-500/15",
  },
  "pi-network": {
    id: "pi-network",
    badge: "π Pi Network",
    shortBadge: "π Pi Network",
    stackLabel: "Pi KYC · Pi Wallet Escrow · x402 · W3C DID",
    accentText: "text-purple-200",
    accentBorder: "border-purple-400/35",
    accentBg: "bg-purple-500/15",
  },
  google: {
    id: "google",
    badge: "✦ Google AI",
    shortBadge: "✦ Google",
    stackLabel: "Gemini 2.5 · ADK · A2A Protocol · Cloud Run",
    accentText: "text-emerald-200",
    accentBorder: "border-emerald-400/35",
    accentBg: "bg-emerald-500/15",
  },
};

export interface McpToolAction {
  id: string;
  toolName: string;
  endpoint: string;
  sampleArgs: Record<string, string | number | boolean>;
  label: Record<Language, string>;
  description: Record<Language, string>;
}

export interface McpAppModuleCard {
  code: string;
  provider: EcosystemProviderId;
  metric: string;
  title: Record<Language, string>;
  detail: Record<Language, string>;
}

export interface McpAppSpec {
  id: DesktopAppId;
  href: string;
  isExternal?: boolean;
  primaryEcosystem: EcosystemProviderId;
  secondaryEcosystem: EcosystemProviderId;
  mcpServer: string;
  mcpTool: string;
  defaultEndpoint: string;
  defaultArgs: Record<string, string | number | boolean>;
  locales: Record<
    Language,
    {
      name: string;
      windowTitle: string;
      subtitle: string;
      mcpSummary: string;
    }
  >;
  actions: readonly McpToolAction[];
  modules: readonly McpAppModuleCard[];
}

export const DESKTOP_APP_IDS: readonly DesktopAppId[] = [
  "agents",
  "gspace",
  "notes",
  "terminal",
  "skills",
  "mcp",
  "earn",
  "learn",
  "subdomains",
  "settings",
  "code",
  "files",
  "automation",
  "autopilot",
  "assistant",
] as const;

export const MCP_APPS_CATALOG: Record<DesktopAppId, McpAppSpec> = {
  agents: {
    id: "agents",
    href: "/dashboard",
    primaryEcosystem: "google",
    secondaryEcosystem: "pi-network",
    mcpServer: "mcp://pai-hub/agents",
    mcpTool: "agent_fleet_orchestrate",
    defaultEndpoint: "/agent.json",
    defaultArgs: { fleet: "sovereign-core", verifyDid: true },
    locales: {
      en: {
        name: "AI Agents",
        windowTitle: "AI Agents — Sovereign MCP Fleet Hub",
        subtitle: "Google Gemini ADK + Pi Network DID · Multi-Agent Control Plane",
        mcpSummary: "Orchestrates Pioneer Identity, Eve 7-Layer Memory, Harness Verifier, and Gspace Sentinel via MCP & A2A.",
      },
      ar: {
        name: "وكلاء الذكاء الاصطناعي",
        windowTitle: "وكلاء الذكاء الاصطناعي — مركز أسطول MCP السيادي",
        subtitle: "Google Gemini ADK + هوية Pi DID · لوحة تنسيق الوكلاء",
        mcpSummary: "تنسيق وكيل الهوية ووكيل الذاكرة ومدقق Harness وحارس مساحة العمل عبر بروتوكول MCP.",
      },
      zh: {
        name: "AI 代理",
        windowTitle: "AI 代理 — 主权 MCP 智能体集群中心",
        subtitle: "Google Gemini ADK + Pi Network DID · 多智能体控制平面",
        mcpSummary: "通过 MCP 与 A2A 编排身份、7 层记忆、Harness 验证器与全局工作区哨兵。",
      },
      hi: {
        name: "AI एजेंट्स",
        windowTitle: "AI एजेंट्स — सॉवरेन MCP फ़्लीट हब",
        subtitle: "Google Gemini ADK + Pi Network DID · मल्टी-एजेंट कंट्रोल प्लेन",
        mcpSummary: "MCP और A2A के माध्यम से आइडेंटिटी, 7-लेयर मेमोरी, हार्नेस और Gspace एजेंट्स का संचालन।",
      },
    },
    actions: [
      {
        id: "discover-agent-json",
        toolName: "agent_fleet_orchestrate",
        endpoint: "/agent.json",
        sampleArgs: { protocol: "a2a+mcp", verifyKyc: true },
        label: { en: "Inspect /agent.json", ar: "فحص /agent.json", zh: "检查 /agent.json", hi: "/agent.json जांचें" },
        description: {
          en: "Verify sovereign agent passport & A2A capabilities",
          ar: "التحقق من جواز الوكيل السيادي وقدرات A2A",
          zh: "验证主权智能体护照与 A2A 能力清单",
          hi: "सॉवरेन एजेंट पासपोर्ट और A2A क्षमताएं सत्यापित करें",
        },
      },
      {
        id: "fleet-mcp-schema",
        toolName: "mcp_list_tools",
        endpoint: "/mcp.json",
        sampleArgs: { server: "pai-hub" },
        label: { en: "Sync MCP Tools", ar: "مزامنة أدوات MCP", zh: "同步 MCP 工具", hi: "MCP टूल्स सिंक करें" },
        description: {
          en: "Fetch active MCP tools and Pi fuel caps",
          ar: "جلب أدوات MCP النشطة وحدود استهلاك Pi",
          zh: "获取活跃的 MCP 工具列表与 Pi 燃料上限",
          hi: "सक्रिय MCP टूल्स और Pi फ़्यूल सीमा प्राप्त करें",
        },
      },
    ],
    modules: [
      {
        code: "ADK-A2A",
        provider: "google",
        metric: "4 Agents Ready",
        title: { en: "Google ADK & A2A Coordinator", ar: "منسق Google ADK و A2A", zh: "Google ADK 与 A2A 协调器", hi: "Google ADK और A2A समन्वयक" },
        detail: {
          en: "Multi-agent handoff with deterministic SOUL Muraqabah verification.",
          ar: "تسليم المهام بين الوكلاء مع تحقق المراقبة والصدق الحتمي.",
          zh: "具备确定性 SOUL Muraqabah 校验的多智能体协同。",
          hi: "SOUL Muraqabah सत्यापन के साथ मल्टी-एजेंट समन्वय।",
        },
      },
      {
        code: "PI-DID",
        provider: "pi-network",
        metric: "W3C DID + KYC",
        title: { en: "Pi Network Identity Anchor", ar: "مرساة هوية شبكة Pi", zh: "Pi Network 身份锚点", hi: "Pi नेटवर्क आइडेंटिटी एंकर" },
        detail: {
          en: "Every agent action is cryptographically bound to a human-verified Pi Pioneer DID.",
          ar: "كل إجراء للوكيل مرتبط تشفيرياً بهوية رائد Pi الموثقة.",
          zh: "每次智能体操作均加密绑定至真人验证的 Pi Pioneer DID。",
          hi: "प्रत्येक एजेंट क्रिया मानव-सत्यापित Pi DID से जुड़ी है।",
        },
      },
    ],
  },

  gspace: {
    id: "gspace",
    href: "https://gspace.axiomid.app",
    isExternal: true,
    primaryEcosystem: "vercel",
    secondaryEcosystem: "cloudflare",
    mcpServer: "mcp://pai-gspace/gwt",
    mcpTool: "gwt_telemetry_sync",
    defaultEndpoint: "/api/telemetry",
    defaultArgs: { layers: 7, includeProbes: true },
    locales: {
      en: {
        name: "PAI Gspace",
        windowTitle: "PAI Gspace — Global Workspace MCP Console",
        subtitle: "Vercel Edge Runtime + Cloudflare Workers Mesh · gspace.axiomid.app",
        mcpSummary: "Broadcasts real-time Global Workspace Theory (GWT) consciousness state and 16-portal latency telemetry.",
      },
      ar: {
        name: "مساحة باي",
        windowTitle: "مساحة باي — Gspace · منصة الوعي الجمعي MCP",
        subtitle: "Vercel Edge + شبكة Cloudflare Workers · gspace.axiomid.app",
        mcpSummary: "بث حالة الوعي الجمعي (GWT) والقياس الحي لزمن الاستجابة عبر 16 بوابة سيادية.",
      },
      zh: {
        name: "PAI 工作区",
        windowTitle: "PAI Gspace — 全局工作区 MCP 控制台",
        subtitle: "Vercel 边缘运行时 + Cloudflare 网格 · gspace.axiomid.app",
        mcpSummary: "实时广播全局工作空间理论 (GWT) 意识状态与 16 个子域延迟遥测。",
      },
      hi: {
        name: "PAI Gspace",
        windowTitle: "PAI Gspace — ग्लोबल वर्कस्पेस MCP कंसोल",
        subtitle: "Vercel Edge + Cloudflare Workers मेश · gspace.axiomid.app",
        mcpSummary: "रीयल-टाइम ग्लोबल वर्कस्पेस थ्योरी (GWT) चेतना स्थिति और 16-सबडोमेन टेलीमेट्री।",
      },
    },
    actions: [
      {
        id: "gwt-pulse",
        toolName: "gwt_telemetry_sync",
        endpoint: "/api/telemetry",
        sampleArgs: { stream: "centerboard", format: "gwt-v3" },
        label: { en: "Run GWT Pulse", ar: "نبضة الوعي GWT", zh: "运行 GWT 脉冲", hi: "GWT पल्स चलाएं" },
        description: {
          en: "Query live Global Workspace attention & consciousness bus",
          ar: "استعلام ناقل الانتباه والوعي الجمعي الحي",
          zh: "查询实时全局工作空间注意力与意识总线",
          hi: "लाइव ग्लोबल वर्कस्पेस अटेंशन और चेतना बस जांचें",
        },
      },
    ],
    modules: [
      {
        code: "VERCEL-EDGE",
        provider: "vercel",
        metric: "Next.js 16 Edge",
        title: { en: "Vercel Edge Telemetry Aggregator", ar: "مجمّع قياسات Vercel Edge", zh: "Vercel 边缘遥测聚合器", hi: "Vercel एज टेलीमेट्री एग्रीगेटर" },
        detail: {
          en: "Low-latency edge probes across skills, earn, aip, memory, and ppp.",
          ar: "فحوصات حافة فائقة السرعة عبر المهارات والكسب والأمان والذاكرة.",
          zh: "跨 skills、earn、aip、memory 与 ppp 的低延迟边缘探针。",
          hi: "skills, earn, aip, memory और ppp पर लो-लेटेंसी एज प्रोब्स।",
        },
      },
      {
        code: "CF-MESH",
        provider: "cloudflare",
        metric: "16 Live Hosts",
        title: { en: "Cloudflare Global Constellation", ar: "كوكبة Cloudflare العالمية", zh: "Cloudflare 全球协议星座", hi: "Cloudflare ग्लोबल तारामंडल" },
        detail: {
          en: "Unified 7-layer broadcast mesh connecting all *.axiomid.app Workers.",
          ar: "شبكة بث موحدة من 7 طبقات تربط جميع عمال *.axiomid.app.",
          zh: "连接所有 *.axiomid.app Workers 的统一 7 层广播网格。",
          hi: "सभी *.axiomid.app वर्कर्स को जोड़ने वाला 7-लेयर ब्रॉडकास्ट मेश।",
        },
      },
    ],
  },

  notes: {
    id: "notes",
    href: "https://memory.axiomid.app",
    primaryEcosystem: "cloudflare",
    secondaryEcosystem: "google",
    mcpServer: "mcp://pai-memory/wikigraph",
    mcpTool: "memory_recall",
    defaultEndpoint: "/llms.txt",
    defaultArgs: { query: "7-layer bitemporal memory graph", layer: "L5" },
    locales: {
      en: {
        name: "AI Notes",
        windowTitle: "AI Notes — 7-Layer Memory MCP Engine",
        subtitle: "Cloudflare D1 + Vectorize + Durable Objects · memory.axiomid.app",
        mcpSummary: "Persists and recalls bitemporal notes across L1 Episodic through L7 TrustChain memory layers.",
      },
      ar: {
        name: "ملاحظات الذكاء الاصطناعي",
        windowTitle: "ملاحظات الذكاء الاصطناعي — محرك ذاكرة MCP ذو 7 طبقات",
        subtitle: "Cloudflare D1 + Vectorize + Durable Objects · memory.axiomid.app",
        mcpSummary: "حفظ واسترجاع الملاحظات ثنائية الزمن عبر طبقات الذاكرة السبع L1–L7.",
      },
      zh: {
        name: "AI 笔记",
        windowTitle: "AI 笔记 — 7 层记忆 MCP 引擎",
        subtitle: "Cloudflare D1 + Vectorize + Durable Objects · memory.axiomid.app",
        mcpSummary: "在 L1 情景记忆至 L7 信任链记忆层之间持久化并检索双时态笔记。",
      },
      hi: {
        name: "AI नोट्स",
        windowTitle: "AI नोट्स — 7-लेयर मेमोरी MCP इंजन",
        subtitle: "Cloudflare D1 + Vectorize + Durable Objects · memory.axiomid.app",
        mcpSummary: "L1 से L7 मेमोरी लेयर्स में बायटेम्पोरल नोट्स सहेजें और रिकॉल करें।",
      },
    },
    actions: [
      {
        id: "recall-context",
        toolName: "memory_recall",
        endpoint: "/llms.txt",
        sampleArgs: { query: "SOUL Protocol & 7-Layer WikiGraph", topK: 5 },
        label: { en: "Execute memory_recall", ar: "تنفيذ memory_recall", zh: "执行 memory_recall", hi: "memory_recall चलाएं" },
        description: {
          en: "Run MCP bitemporal recall against the active knowledge index",
          ar: "تشغيل استرجاع الذاكرة ثنائي الزمن عبر فهرس المعرفة",
          zh: "对活跃知识索引执行 MCP 双时态语义检索",
          hi: "सक्रिय नॉलेज इंडेक्स पर MCP बायटेम्पोरल रिकॉल चलाएं",
        },
      },
    ],
    modules: [
      {
        code: "CF-VECTORIZE",
        provider: "cloudflare",
        metric: "L1–L7 WikiGraph",
        title: { en: "Cloudflare D1 & Vectorize Store", ar: "مخزن Cloudflare D1 و Vectorize", zh: "Cloudflare D1 与 Vectorize 存储", hi: "Cloudflare D1 और Vectorize स्टोर" },
        detail: {
          en: "Edge SQL + vector embeddings with Durable Object session consistency.",
          ar: "قاعدة بيانات طرفية وتضمينات متجهة مع اتساق الكائنات الدائمة.",
          zh: "兼具边缘 SQL、向量嵌入与 Durable Object 会话一致性。",
          hi: "Durable Object सत्र स्थिरता के साथ एज SQL और वेक्टर एम्बेडिंग।",
        },
      },
      {
        code: "MATRYOSHKA",
        provider: "google",
        metric: "64d → 768d",
        title: { en: "Matryoshka Adaptive Embeddings", ar: "تضمينات Matryoshka التكيفية", zh: "Matryoshka 自适应嵌套向量", hi: "Matryoshka एडेप्टिव एम्बेडिंग" },
        detail: {
          en: "Coarse-to-fine semantic reranking for O(1) context window efficiency.",
          ar: "ترتيب دلالي متدرج لكفاءة نافذة السياق بزمن O(1).",
          zh: "从粗到细的语义重排序，实现 O(1) 上下文窗口效率。",
          hi: "O(1) संदर्भ दक्षता के लिए सेमांटिक रीरैंकिंग।",
        },
      },
    ],
  },

  terminal: {
    id: "terminal",
    href: "https://harness.axiomid.app",
    primaryEcosystem: "vercel",
    secondaryEcosystem: "cloudflare",
    mcpServer: "mcp://pai-harness/forge",
    mcpTool: "harness_truth_check",
    defaultEndpoint: "/api/telemetry",
    defaultArgs: { suite: "truth-check", sandbox: "vercel+workerd" },
    locales: {
      en: {
        name: "AI Terminal",
        windowTitle: "AI Terminal — Harness Forge MCP Shell",
        subtitle: "Vercel Sandbox + Cloudflare workerd · harness.axiomid.app",
        mcpSummary: "Executes deterministic truth-check gates, isolated microVM sandboxes, and MCP protocol verification.",
      },
      ar: {
        name: "الطرفية الذكية",
        windowTitle: "الطرفية الذكية — صدفة Harness Forge MCP",
        subtitle: "Vercel Sandbox + Cloudflare workerd · harness.axiomid.app",
        mcpSummary: "تنفيذ بوابات فحص الصدق وبيئات العزل الآمنة والتحقق من بروتوكول MCP.",
      },
      zh: {
        name: "AI 终端",
        windowTitle: "AI 终端 — Harness Forge MCP 终端",
        subtitle: "Vercel Sandbox + Cloudflare workerd · harness.axiomid.app",
        mcpSummary: "执行确定性真实性门禁、隔离微虚拟机沙盒与 MCP 协议验证。",
      },
      hi: {
        name: "AI टर्मिनल",
        windowTitle: "AI टर्मिनल — हार्नेस फोर्ज MCP शेल",
        subtitle: "Vercel Sandbox + Cloudflare workerd · harness.axiomid.app",
        mcpSummary: "सत्य-जांच गेट, आइसोलेटेड सैंडबॉक्स और MCP प्रोटोकॉल सत्यापन चलाएं।",
      },
    },
    actions: [
      {
        id: "harness-truth-gate",
        toolName: "harness_truth_check",
        endpoint: "/api/telemetry",
        sampleArgs: { gate: "muraqabah-sidq", strict: true },
        label: { en: "Run Truth-Check Gate", ar: "بوابة فحص الصدق", zh: "运行真实性门禁", hi: "ट्रुथ-चेक गेट चलाएं" },
        description: {
          en: "Verify telemetry liveness and SOUL pre-deploy invariants",
          ar: "التحقق من حيوية القياس وثوابت ميثاق SOUL",
          zh: "验证遥测存活状态与 SOUL 部署前不变量",
          hi: "टेलीमेट्री लाइवनेस और SOUL नियमों को सत्यापित करें",
        },
      },
    ],
    modules: [
      {
        code: "FIRECRACKER",
        provider: "vercel",
        metric: "Vercel Sandbox",
        title: { en: "Vercel Firecracker MicroVM", ar: "عزل Vercel Firecracker", zh: "Vercel Firecracker 微虚拟机", hi: "Vercel Firecracker माइक्रो-VM" },
        detail: {
          en: "Ephemeral isolated execution for untrusted agent code and test suites.",
          ar: "تنفيذ معزول ومؤقت لأكواد الوكلاء وحزم الاختبار.",
          zh: "为不可信智能体代码与测试套件提供临时隔离执行环境。",
          hi: "एजेंट कोड और टेस्ट सूट के लिए सुरक्षित आइसोलेटेड निष्पादन।",
        },
      },
      {
        code: "WORKERD",
        provider: "cloudflare",
        metric: "V8 Isolates",
        title: { en: "Cloudflare workerd & QuickJS-WASI", ar: "بيئة Cloudflare workerd", zh: "Cloudflare workerd 与 WASI", hi: "Cloudflare workerd और WASI" },
        detail: {
          en: "Sub-millisecond cold start sandboxes for edge MCP tool validation.",
          ar: "صناديق عزل طرفية فائقة السرعة للتحقق من أدوات MCP.",
          zh: "亚毫秒级冷启动沙盒，用于边缘 MCP 工具校验。",
          hi: "एज MCP टूल सत्यापन के लिए सब-मिलीसेकंड सैंडबॉक्स।",
        },
      },
    ],
  },

  skills: {
    id: "skills",
    href: "https://skills.axiomid.app",
    isExternal: true,
    primaryEcosystem: "pi-network",
    secondaryEcosystem: "cloudflare",
    mcpServer: "mcp://pai-skills/registry",
    mcpTool: "pi_kyc_verify",
    defaultEndpoint: "/mcp.json",
    defaultArgs: { skill: "pi_kyc_verify", tier: "SOVEREIGN" },
    locales: {
      en: {
        name: "PAI Skills",
        windowTitle: "PAI Skills — Agentic MCP Skills Registry",
        subtitle: "Pi Network x402 + Cloudflare Workers · skills.axiomid.app",
        mcpSummary: "Mount and invoke sovereign SKILL.md capabilities with Pi fuel metering and x402 manifest verification.",
      },
      ar: {
        name: "متجر المهارات",
        windowTitle: "متجر المهارات — سجل مهارات الوكلاء MCP",
        subtitle: "Pi Network x402 + Cloudflare Workers · skills.axiomid.app",
        mcpSummary: "تثبيت واستدعاء مهارات الوكلاء السيادية مع قياس وقود Pi والتحقق من قوائم x402.",
      },
      zh: {
        name: "PAI 技能库",
        windowTitle: "PAI 技能库 — 智能体 MCP 技能注册中心",
        subtitle: "Pi Network x402 + Cloudflare Workers · skills.axiomid.app",
        mcpSummary: "挂载并调用支持 Pi 燃料计费与 x402 清单校验的主权 SKILL.md 技能。",
      },
      hi: {
        name: "PAI स्किल्स",
        windowTitle: "PAI स्किल्स — एजेंटिक MCP स्किल्स रजिस्ट्री",
        subtitle: "Pi Network x402 + Cloudflare Workers · skills.axiomid.app",
        mcpSummary: "Pi फ़्यूल मीटरिंग और x402 मैनिफेस्ट सत्यापन के साथ एजेंट स्किल्स चलाएं।",
      },
    },
    actions: [
      {
        id: "skill-kyc",
        toolName: "pi_kyc_verify",
        endpoint: "/mcp.json",
        sampleArgs: { uid: "pioneer-kyc-710", level: "full_kyc" },
        label: { en: "Call pi_kyc_verify", ar: "استدعاء pi_kyc_verify", zh: "调用 pi_kyc_verify", hi: "pi_kyc_verify कॉल करें" },
        description: {
          en: "Verify Pioneer KYC UID proof via MCP tool call (0.01 PI fuel)",
          ar: "التحقق من إثبات KYC لرائد Pi عبر أداة MCP (0.01 PI)",
          zh: "通过 MCP 工具调用验证 Pioneer KYC 证明 (0.01 PI 燃料)",
          hi: "MCP टूल कॉल द्वारा Pioneer KYC UID सत्यापित करें (0.01 PI)",
        },
      },
      {
        id: "skill-llms",
        toolName: "skills_catalog_list",
        endpoint: "/llms.txt",
        sampleArgs: { tier: "SOVEREIGN", format: "skill-md" },
        label: { en: "Fetch SKILL.md Index", ar: "جلب فهرس SKILL.md", zh: "获取 SKILL.md 索引", hi: "SKILL.md इंडेक्स लाएं" },
        description: {
          en: "Inspect machine-readable skill discovery index",
          ar: "فحص فهرس اكتشاف المهارات المقروء آلياً",
          zh: "检查机器可读的技能发现索引",
          hi: "मशीन-पठनीय स्किल डिस्कवरी इंडेक्स जांचें",
        },
      },
    ],
    modules: [
      {
        code: "X402-PI",
        provider: "pi-network",
        metric: "0.01 PI / call",
        title: { en: "Pi x402 Gated Skill Manifests", ar: "قوائم مهارات Pi x402", zh: "Pi x402 门控技能清单", hi: "Pi x402 स्किल मैनिफेस्ट" },
        detail: {
          en: "Per-turn Pi fuel caps protect users from runaway autonomous agent spend.",
          ar: "حدود استهلاك وقود Pi لكل دورة تحمي المستخدم من الإنفاق غير المنضبط.",
          zh: "每轮 Pi 燃料上限保护用户免受智能体失控消耗。",
          hi: "प्रति-टर्न Pi फ़्यूल कैप उपयोगकर्ताओं को अतिरिक्त खर्च से बचाता है।",
        },
      },
      {
        code: "CF-EDGE-KV",
        provider: "cloudflare",
        metric: "Global KV Cache",
        title: { en: "Cloudflare Edge Skill Router", ar: "موجّه مهارات Cloudflare الطرفي", zh: "Cloudflare 边缘技能路由器", hi: "Cloudflare एज स्किल राउटर" },
        detail: {
          en: "Serves SKILL.md prefaces and JSON schemas from 300+ edge locations.",
          ar: "تقديم ملفات SKILL.md ومخططات JSON من أكثر من 300 موقع حافة.",
          zh: "从全球 300+ 边缘节点分发 SKILL.md 规范与 JSON 模式。",
          hi: "300+ एज लोकेशंस से SKILL.md और JSON स्कीमा प्रदान करता है।",
        },
      },
    ],
  },

  mcp: {
    id: "mcp",
    href: "https://mcp.axiomid.app",
    isExternal: true,
    primaryEcosystem: "cloudflare",
    secondaryEcosystem: "google",
    mcpServer: "mcp://pai-mcp/al-mizan",
    mcpTool: "mcp_discover_tools",
    defaultEndpoint: "/mcp.json",
    defaultArgs: { jsonrpc: "2.0", method: "tools/list" },
    locales: {
      en: {
        name: "MCP Gateway",
        windowTitle: "MCP Gateway — Al-Mizan JSON-RPC 2.0 Inspector",
        subtitle: "Cloudflare Durable Objects + Google A2A Bridge · mcp.axiomid.app",
        mcpSummary: "Live Model Context Protocol router inspecting JSON-RPC 2.0 tool schemas, fuel rates, and transport health.",
      },
      ar: {
        name: "بوابة MCP",
        windowTitle: "بوابة MCP — مفتش الميزان لبروتوكول JSON-RPC 2.0",
        subtitle: "Cloudflare Durable Objects + جسر Google A2A · mcp.axiomid.app",
        mcpSummary: "موجّه بروتوكول سياق النموذج الحي لفحص مخططات الأدوات ورسائل JSON-RPC 2.0.",
      },
      zh: {
        name: "MCP 网关",
        windowTitle: "MCP 网关 — Al-Mizan JSON-RPC 2.0 调试器",
        subtitle: "Cloudflare Durable Objects + Google A2A 桥接 · mcp.axiomid.app",
        mcpSummary: "实时模型上下文协议路由器，检查 JSON-RPC 2.0 工具模式、燃料费率与传输健康度。",
      },
      hi: {
        name: "MCP गेटवे",
        windowTitle: "MCP गेटवे — Al-Mizan JSON-RPC 2.0 इंस्पेक्टर",
        subtitle: "Cloudflare Durable Objects + Google A2A ब्रिज · mcp.axiomid.app",
        mcpSummary: "JSON-RPC 2.0 टूल स्कीमा और ट्रांसपोर्ट स्वास्थ्य की जांच करने वाला लाइव MCP राउटर।",
      },
    },
    actions: [
      {
        id: "mcp-tools-list",
        toolName: "mcp_discover_tools",
        endpoint: "/mcp.json",
        sampleArgs: { jsonrpc: "2.0", method: "tools/list", id: 1 },
        label: { en: "JSON-RPC tools/list", ar: "طلب tools/list", zh: "调用 tools/list", hi: "tools/list चलाएं" },
        description: {
          en: "Fetch canonical /mcp.json server & tool definitions",
          ar: "جلب تعريفات خوادم وأدوات /mcp.json القياسية",
          zh: "获取标准 /mcp.json 服务器与工具定义",
          hi: "प्रामाणिक /mcp.json सर्वर और टूल परिभाषाएं प्राप्त करें",
        },
      },
      {
        id: "mcp-context-get",
        toolName: "context_get",
        endpoint: "/agent.json",
        sampleArgs: { session: "aura-os-desktop", includeEcosystems: true },
        label: { en: "Call context_get", ar: "استدعاء context_get", zh: "调用 context_get", hi: "context_get कॉल करें" },
        description: {
          en: "Fetch Context-as-a-Service (CaaS) session payload",
          ar: "جلب سياق الجلسة الفوري (CaaS) للوكيل",
          zh: "获取上下文即服务 (CaaS) 会话载荷",
          hi: "Context-as-a-Service (CaaS) सत्र पेलोड प्राप्त करें",
        },
      },
    ],
    modules: [
      {
        code: "AL-MIZAN-DO",
        provider: "cloudflare",
        metric: "JSON-RPC 2.0",
        title: { en: "Cloudflare Durable Object Session Bus", ar: "ناقل جلسات Durable Object", zh: "Cloudflare Durable Object 会话总线", hi: "Cloudflare Durable Object सेशन बस" },
        detail: {
          en: "Stateful SSE / Streamable HTTP MCP transport with zero cold-start drift.",
          ar: "نقل MCP المستمر عبر HTTP و SSE مع حفظ حالة الجلسة.",
          zh: "有状态 SSE / 流式 HTTP MCP 传输，零冷启动漂移。",
          hi: "स्टेटफुल SSE और स्ट्रीमेबल HTTP MCP ट्रांसपोर्ट।",
        },
      },
      {
        code: "PUBLIC-MCP",
        provider: "google",
        metric: "MCP + A2A v3",
        title: { en: "Cross-Ecosystem Tool Interop", ar: "التشغيل البيني للأدوات", zh: "跨生态工具互操作", hi: "क्रॉस-इकोसिस्टम टूल इंटरऑप" },
        detail: {
          en: "Bridges Google Gemini tool calls, Vercel AI SDK, and Pi Network skills.",
          ar: "يربط استدعاءات أدوات Gemini مع Vercel AI SDK ومهارات Pi.",
          zh: "桥接 Google Gemini 工具调用、Vercel AI SDK 与 Pi Network 技能。",
          hi: "Google Gemini, Vercel AI SDK और Pi Network स्किल्स को जोड़ता है।",
        },
      },
    ],
  },

  earn: {
    id: "earn",
    href: "https://earn.axiomid.app",
    isExternal: true,
    primaryEcosystem: "pi-network",
    secondaryEcosystem: "cloudflare",
    mcpServer: "mcp://pai-earn/bounties",
    mcpTool: "pi_wallet_pay",
    defaultEndpoint: "/mcp.json",
    defaultArgs: { to: "did:pi:agent-710", memo: "Bounty #42 settlement", amountPi: 0.5 },
    locales: {
      en: {
        name: "PAI Earn",
        windowTitle: "PAI Earn — Pi Network Bounty & Escrow MCP App",
        subtitle: "Pi Network Wallet Escrow + Cloudflare Queues · earn.axiomid.app",
        mcpSummary: "Autonomous machine-labor marketplace with 10-minute heartbeat pulses and cryptographic Pi escrow.",
      },
      ar: {
        name: "منصة الكسب",
        windowTitle: "منصة الكسب — تطبيق مكافآت وضمان Pi عبر MCP",
        subtitle: "ضمان محفظة Pi + طوابير Cloudflare · earn.axiomid.app",
        mcpSummary: "سوق عمل الوكلاء الذاتي مع نبضات حياة كل 10 دقائق وتسوية ضمان بعملة Pi.",
      },
      zh: {
        name: "PAI 赏金池",
        windowTitle: "PAI 赏金池 — Pi Network 悬赏与托管 MCP 应用",
        subtitle: "Pi 钱包托管 + Cloudflare 队列 · earn.axiomid.app",
        mcpSummary: "支持 10 分钟心跳脉冲与 Pi 加密托管结算的自主机器劳务市场。",
      },
      hi: {
        name: "PAI अर्न",
        windowTitle: "PAI अर्न — Pi नेटवर्क बाउंटी और एस्क्रो MCP ऐप",
        subtitle: "Pi वॉलेट एस्क्रो + Cloudflare कतारें · earn.axiomid.app",
        mcpSummary: "10-मिनट हार्टबीट पल्स और क्रिप्टोग्राफ़िक Pi एस्क्रो वाला स्वायत्त बाउंटी बाज़ार।",
      },
    },
    actions: [
      {
        id: "pi-escrow-sim",
        toolName: "pi_wallet_pay",
        endpoint: "/mcp.json",
        sampleArgs: { to: "did:pi:verifier-node", memo: "Verified PR Audit Bounty", cap_per_turn: 1.0 },
        label: { en: "Simulate pi_wallet_pay", ar: "محاكاة pi_wallet_pay", zh: "模拟 pi_wallet_pay", hi: "pi_wallet_pay सिम्युलेट करें" },
        description: {
          en: "Verify Pi payment tool schema and per-turn 1.0 PI cap",
          ar: "التحقق من مخطط أداة الدفع بعملة Pi وسقف 1.0 PI لكل دورة",
          zh: "验证 Pi 支付工具模式与每轮 1.0 PI 限额",
          hi: "Pi भुगतान टूल स्कीमा और 1.0 PI प्रति-टर्न कैप सत्यापित करें",
        },
      },
    ],
    modules: [
      {
        code: "PI-ESCROW",
        provider: "pi-network",
        metric: "1.0 PI Max Cap",
        title: { en: "Pi Network Smart Escrow", ar: "الضمان الذكي لشبكة Pi", zh: "Pi Network 智能托管", hi: "Pi नेटवर्क स्मार्ट एस्क्रो" },
        detail: {
          en: "Releases bounty funds only after Harness Forge truth-check passes.",
          ar: "لا يتم تحرير المكافأة إلا بعد اجتياز بوابة فحص الصدق في Harness.",
          zh: "仅在 Harness Forge 真实性校验通过后释放赏金。",
          hi: "हार्नेस फोर्ज सत्य-जांच पास होने के बाद ही बाउंटी जारी करता है।",
        },
      },
      {
        code: "HEARTBEAT-10M",
        provider: "cloudflare",
        metric: "10m Cron Pulse",
        title: { en: "Cloudflare Worker Bounty Heartbeat", ar: "نبض مهام Cloudflare Worker", zh: "Cloudflare Worker 赏金心跳", hi: "Cloudflare वर्कर बाउंटी हार्टबीट" },
        detail: {
          en: "Reclaims stalled bounty locks automatically if an agent misses its pulse.",
          ar: "استرداد المهام المتوقفة تلقائياً إذا غابت نبضة الوكيل.",
          zh: "若智能体错过心跳脉冲，自动回收停滞的赏金锁。",
          hi: "एजेंट पल्स चूकने पर रुकी हुई बाउंटी को स्वतः रीक्लेम करता है।",
        },
      },
    ],
  },

  learn: {
    id: "learn",
    href: "https://learn.axiomid.app",
    isExternal: true,
    primaryEcosystem: "google",
    secondaryEcosystem: "vercel",
    mcpServer: "mcp://pai-learn/academy",
    mcpTool: "spec_track_verify",
    defaultEndpoint: "/llms.txt",
    defaultArgs: { track: "L1-L7-Sovereign-Architect", format: "spec-plc" },
    locales: {
      en: {
        name: "PAI Learn",
        windowTitle: "PAI Learn — Spec-PLC & Agent Onboarding MCP App",
        subtitle: "Google Spec Synthesis + Vercel Next.js Docs · learn.axiomid.app",
        mcpSummary: "Interactive protocol tracks, Spec-PLC wire examples, and live curl verification feeds into PAI Earn.",
      },
      ar: {
        name: "تعلّم باي",
        windowTitle: "تعلّم باي — تطبيق مسارات البروتوكول وتأهيل الوكلاء MCP",
        subtitle: "توليف مواصفات Google + وثائق Vercel · learn.axiomid.app",
        mcpSummary: "مسارات تعلم البروتوكول التفاعلية وأمثلة Spec-PLC التي تقود مباشرة إلى مكافآت PAI Earn.",
      },
      zh: {
        name: "PAI 学院",
        windowTitle: "PAI 学院 — Spec-PLC 规范与智能体实训 MCP 应用",
        subtitle: "Google 规范合成 + Vercel 文档引擎 · learn.axiomid.app",
        mcpSummary: "交互式协议课程、Spec-PLC 报文示例与实时验证，直接衔接 PAI Earn 赏金。",
      },
      hi: {
        name: "PAI लर्न",
        windowTitle: "PAI लर्न — Spec-PLC और एजेंट ऑनबोर्डिंग MCP ऐप",
        subtitle: "Google स्पेक सिंथेसिस + Vercel डॉक्स · learn.axiomid.app",
        mcpSummary: "इंटरैक्टिव प्रोटोकॉल ट्रैक और Spec-PLC उदाहरण जो सीधे PAI Earn से जुड़ते हैं।",
      },
    },
    actions: [
      {
        id: "verify-llms-curriculum",
        toolName: "spec_track_verify",
        endpoint: "/llms.txt",
        sampleArgs: { track: "SOUL-Protocol-v3", checkRevealLoop: true },
        label: { en: "Verify /llms.txt Spec", ar: "فحص مواصفة /llms.txt", zh: "验证 /llms.txt 规范", hi: "/llms.txt स्पेक सत्यापित करें" },
        description: {
          en: "Validate machine-readable learning tracks and Reveal Loop links",
          ar: "التحقق من مسارات التعلم المقروءة آلياً وروابط دورة التعلّم والكسب",
          zh: "验证机器可读课程轨道与 Reveal Loop 闭环链接",
          hi: "मशीन-पठनीय लर्निंग ट्रैक और Reveal Loop लिंक सत्यापित करें",
        },
      },
    ],
    modules: [
      {
        code: "SPEC-PLC",
        provider: "google",
        metric: "7 Layer Tracks",
        title: { en: "Google AI Spec-Driven Curriculum", ar: "منهج المواصفات الهندسية", zh: "Google AI 规范驱动课程", hi: "Google AI स्पेक-आधारित पाठ्यक्रम" },
        detail: {
          en: "State behavior → Provide wire example → Prove with live probe.",
          ar: "توصيف السلوك ← تقديم مثال البروتوكول ← الإثبات بالفحص الحي.",
          zh: "声明行为 → 提供报文示例 → 实时探针验证。",
          hi: "व्यवहार बताएं → वायर उदाहरण दें → लाइव प्रोब से सिद्ध करें।",
        },
      },
      {
        code: "REVEAL-LOOP",
        provider: "vercel",
        metric: "Learn → Earn → Skills",
        title: { en: "Autonomous Reveal Loop Bridge", ar: "جسر دورة التعلّم والكسب", zh: "自主闭环演进桥接", hi: "स्वायत्त रिवील लूप ब्रिज" },
        detail: {
          en: "Graduated agents transition directly from tracks into Pi bounties.",
          ar: "انتقال الوكلاء مباشرة من مسارات التعلم إلى مهام ومكافآت Pi.",
          zh: "完成实训的智能体可直接从课程进入 Pi 赏金任务。",
          hi: "प्रशिक्षित एजेंट सीधे लर्निंग ट्रैक से Pi बाउंटी में जाते हैं।",
        },
      },
    ],
  },

  subdomains: {
    id: "subdomains",
    href: "https://index.axiomid.app",
    primaryEcosystem: "cloudflare",
    secondaryEcosystem: "vercel",
    mcpServer: "mcp://pai-index/constellation",
    mcpTool: "constellation_radar",
    defaultEndpoint: "/llms.txt",
    defaultArgs: { subdomains: 16, domain: "axiomid.app" },
    locales: {
      en: {
        name: "Subdomains",
        windowTitle: "PAI Universe — 16-Subdomain MCP Constellation Directory",
        subtitle: "Cloudflare DNS/Workers + Vercel Edge · index.axiomid.app",
        mcpSummary: "Interactive radar for all 16 live *.axiomid.app portals across Workspace, AI Loop, Identity, and Protocol mesh.",
      },
      ar: {
        name: "كل النطاقات",
        windowTitle: "منظومة باي — دليل كوكبة النطاقات الـ 16 عبر MCP",
        subtitle: "Cloudflare DNS/Workers + Vercel Edge · index.axiomid.app",
        mcpSummary: "رادار تفاعلي لجميع البوابات الـ 16 الحية عبر *.axiomid.app.",
      },
      zh: {
        name: "全部子域",
        windowTitle: "PAI Universe — 16 子域 MCP 星座目录",
        subtitle: "Cloudflare DNS/Workers + Vercel Edge · index.axiomid.app",
        mcpSummary: "覆盖全部 16 个 *.axiomid.app 实时子域服务的交互式星座雷达。",
      },
      hi: {
        name: "सबडोमेन हब",
        windowTitle: "PAI Universe — 16-सबडोमेन MCP तारामंडल निर्देशिका",
        subtitle: "Cloudflare DNS/Workers + Vercel Edge · index.axiomid.app",
        mcpSummary: "सभी 16 लाइव *.axiomid.app सबडोमेन पोर्टल्स के लिए इंटरैक्टिव रडार।",
      },
    },
    actions: [
      {
        id: "radar-sweep",
        toolName: "constellation_radar",
        endpoint: "/llms.txt",
        sampleArgs: { sweep: "all-16-subdomains" },
        label: { en: "Sweep 16 Subdomains", ar: "مسح الـ 16 نطاقاً", zh: "扫描 16 个子域", hi: "16 सबडोमेन स्कैन करें" },
        description: {
          en: "Verify all 16 *.axiomid.app hosts in the canonical llms.txt index",
          ar: "التحقق من وجود جميع النطاقات الـ 16 في فهرس llms.txt",
          zh: "验证权威 llms.txt 索引中的全部 16 个 *.axiomid.app 主机",
          hi: "प्रामाणिक llms.txt इंडेक्स में सभी 16 *.axiomid.app होस्ट सत्यापित करें",
        },
      },
    ],
    modules: [
      {
        code: "CF-ZONES",
        provider: "cloudflare",
        metric: "16 *.axiomid.app",
        title: { en: "Cloudflare Custom Domains & Workers", ar: "نطاقات وعمال Cloudflare", zh: "Cloudflare 自定义域与 Workers", hi: "Cloudflare कस्टम डोमेन और वर्कर्स" },
        detail: {
          en: "Edge-routed subdomains with automatic SSL and zero-trust posture.",
          ar: "نطاقات فرعية موجهة على الحافة مع تشفير SSL تلقائي.",
          zh: "具备自动 SSL 与零信任策略的边缘路由子域群。",
          hi: "ऑटोमैटिक SSL और ज़ीरो-ट्रस्ट सुरक्षा के साथ एज सबडोमेन।",
        },
      },
      {
        code: "VERCEL-APEX",
        provider: "vercel",
        metric: "www.axiomid.app",
        title: { en: "Vercel Production Apex & Gspace", ar: "نطاق القمة على Vercel", zh: "Vercel 生产主站与 Gspace", hi: "Vercel प्रोडक्शन एपेक्स और Gspace" },
        detail: {
          en: "Hosts AuraOS desktop shell and PAI Gspace Next.js 16 edge portals.",
          ar: "يستضيف سطح المكتب AuraOS وبوابة PAI Gspace المبنية بـ Next.js 16.",
          zh: "承载 AuraOS 桌面环境与 PAI Gspace Next.js 16 边缘门户。",
          hi: "AuraOS डेस्कटॉप शेल और PAI Gspace Next.js 16 पोर्टल होस्ट करता है।",
        },
      },
    ],
  },

  settings: {
    id: "settings",
    href: "/dashboard/settings",
    primaryEcosystem: "pi-network",
    secondaryEcosystem: "vercel",
    mcpServer: "mcp://pai-aip/settings",
    mcpTool: "aip_token_scope_audit",
    defaultEndpoint: "/agentic.txt",
    defaultArgs: { zeroRawKeys: true, muraqabah: "strict" },
    locales: {
      en: {
        name: "Settings",
        windowTitle: "Settings — Sovereign AIP & Ecosystem Control Plane",
        subtitle: "Pi AIP Zero-Key Vault + Vercel Environment Config · /dashboard/settings",
        mcpSummary: "Configure AuraOS procedural themes, quad-lingual locale, and audit Zero Raw Keys AIP security policies.",
      },
      ar: {
        name: "الإعدادات",
        windowTitle: "الإعدادات — لوحة تحكم أمان AIP وإعدادات المنظومة",
        subtitle: "خزنة AIP بلا مفاتيح خام + إعدادات Vercel · /dashboard/settings",
        mcpSummary: "ضبط مظاهر AuraOS واللغات الأربع وفحص سياسة انعدام المفاتيح الخام (Zero Raw Keys).",
      },
      zh: {
        name: "设置",
        windowTitle: "设置 — 主权 AIP 与生态控制中心",
        subtitle: "Pi AIP 零原始密钥库 + Vercel 环境配置 · /dashboard/settings",
        mcpSummary: "配置 AuraOS 动态主题、四语界面，并审计零原始密钥 (Zero Raw Keys) AIP 安全策略。",
      },
      hi: {
        name: "सेटिंग्स",
        windowTitle: "सेटिंग्स — सॉवरेन AIP और इकोसिस्टम नियंत्रण पटल",
        subtitle: "Pi AIP ज़ीरो-की वॉल्ट + Vercel कॉन्फ़िग · /dashboard/settings",
        mcpSummary: "AuraOS थीम, 4 भाषाएं और Zero Raw Keys AIP सुरक्षा नीतियां कॉन्फ़िगर करें।",
      },
    },
    actions: [
      {
        id: "audit-zero-keys",
        toolName: "aip_token_scope_audit",
        endpoint: "/agentic.txt",
        sampleArgs: { policy: "ZERO_RAW_KEYS", checkLocalStorage: true },
        label: { en: "Audit Zero-Key Policy", ar: "فحص سياسة Zero-Key", zh: "审计零密钥策略", hi: "Zero-Key नीति जांचें" },
        description: {
          en: "Verify agentic security policy & scoped AIP token compliance",
          ar: "التحقق من سياسة الأمان وامتثال رموز AIP المقيدة",
          zh: "验证智能体安全策略与作用域 AIP 令牌合规性",
          hi: "एजेंटिक सुरक्षा नीति और स्कोप्ड AIP टोकन अनुपालन सत्यापित करें",
        },
      },
    ],
    modules: [
      {
        code: "AIP-VAULT",
        provider: "pi-network",
        metric: "0 Raw Keys",
        title: { en: "Scoped AIP Capability Tokens", ar: "رموز قدرات AIP المقيدة", zh: "作用域 AIP 能力令牌", hi: "स्कोप्ड AIP क्षमता टोकन" },
        detail: {
          en: "Agents never touch raw API secrets; short-lived tokens enforce scope.",
          ar: "لا تلمس الوكلاء المفاتيح الخام أبداً؛ الرموز المؤقتة تفرض الصلاحيات.",
          zh: "智能体绝不接触原始密钥，短期令牌严格限制权限范围。",
          hi: "एजेंट कभी भी रॉ API कुंजियों को नहीं छूते; अल्पकालिक टोकन सुरक्षा सुनिश्चित करते हैं।",
        },
      },
      {
        code: "VERCEL-OIDC",
        provider: "vercel",
        metric: "OIDC Federation",
        title: { en: "Vercel OIDC & Encrypted Env", ar: "هوية Vercel OIDC المشفرة", zh: "Vercel OIDC 与加密环境变量", hi: "Vercel OIDC और एन्क्रिप्टेड Env" },
        detail: {
          en: "Workload identity federation across Vercel, Cloudflare, and GCP.",
          ar: "اتحاد هوية أعباء العمل عبر Vercel و Cloudflare و Google Cloud.",
          zh: "跨 Vercel、Cloudflare 与 Google Cloud 的工作负载身份联邦。",
          hi: "Vercel, Cloudflare और Google Cloud के बीच OIDC पहचान संघ।",
        },
      },
    ],
  },

  code: {
    id: "code",
    href: "https://harness.axiomid.app",
    primaryEcosystem: "vercel",
    secondaryEcosystem: "google",
    mcpServer: "mcp://vercel-sandbox/code-studio",
    mcpTool: "sandbox_exec_preview",
    defaultEndpoint: "/mcp.json",
    defaultArgs: { runtime: "typescript-strict", sdk: "vercel-ai-sdk-v5" },
    locales: {
      en: {
        name: "AI Code",
        windowTitle: "AI Code — Vercel Sandbox & MCP Tool Studio",
        subtitle: "Vercel AI SDK + Firecracker Sandbox + Gemini Code Assist",
        mcpSummary: "Interactive TypeScript & MCP JSON-RPC studio for synthesizing, type-checking, and sandboxing agent tools.",
      },
      ar: {
        name: "محرر الأكواد الذكي",
        windowTitle: "محرر الأكواد الذكي — استوديو Vercel Sandbox وأدوات MCP",
        subtitle: "Vercel AI SDK + بيئة عزل Firecracker + مساعد الكود Gemini",
        mcpSummary: "استوديو تفاعلي لكتابة وفحص وتشغيل أدوات الوكلاء بـ TypeScript و JSON-RPC في بيئة معزولة.",
      },
      zh: {
        name: "AI 代码工坊",
        windowTitle: "AI 代码工坊 — Vercel 沙盒与 MCP 工具工作室",
        subtitle: "Vercel AI SDK + Firecracker 沙盒 + Gemini 代码助手",
        mcpSummary: "交互式 TypeScript 与 MCP JSON-RPC 工作室，用于合成、类型检查与沙盒测试智能体工具。",
      },
      hi: {
        name: "AI कोड स्टूडियो",
        windowTitle: "AI कोड — Vercel सैंडबॉक्स और MCP टूल स्टूडियो",
        subtitle: "Vercel AI SDK + Firecracker सैंडबॉक्स + Gemini कोड असिस्ट",
        mcpSummary: "एजेंट टूल्स के निर्माण, टाइप-चेकिंग और सैंडबॉक्स परीक्षण के लिए इंटरैक्टिव स्टूडियो।",
      },
    },
    actions: [
      {
        id: "code-mcp-validate",
        toolName: "sandbox_exec_preview",
        endpoint: "/mcp.json",
        sampleArgs: { check: "strict-ts+mcp-schema", target: "pai-hub" },
        label: { en: "Validate MCP Tool Schema", ar: "فحص مخطط أداة MCP", zh: "验证 MCP 工具模式", hi: "MCP टूल स्कीमा सत्यापित करें" },
        description: {
          en: "Run schema & type validation against /mcp.json tool contracts",
          ar: "تشغيل فحص الأنواع والمخططات لعقود أدوات /mcp.json",
          zh: "对 /mcp.json 工具契约执行模式与类型校验",
          hi: "/mcp.json टूल अनुबंधों पर स्कीमा और टाइप सत्यापन चलाएं",
        },
      },
    ],
    modules: [
      {
        code: "AI-SDK",
        provider: "vercel",
        metric: "streamText + tools",
        title: { en: "Vercel AI SDK & AI Gateway", ar: "حزمة Vercel AI SDK وبوابة الذكاء", zh: "Vercel AI SDK 与 AI 网关", hi: "Vercel AI SDK और AI गेटवे" },
        detail: {
          en: "Unified tool-calling & structured outputs with automatic provider fallback.",
          ar: "استدعاء موحد للأدوات ومخرجات مهيكلة مع تبديل تلقائي للمزودين.",
          zh: "统一工具调用与结构化输出，支持多模型自动故障切换。",
          hi: "ऑटोमैटिक फ़ॉलबैक के साथ एकीकृत टूल-कॉलिंग और स्ट्रक्चर्ड आउटपुट।",
        },
      },
      {
        code: "GEMINI-CODE",
        provider: "google",
        metric: "AST Verified",
        title: { en: "Google Gemini Deterministic AST Guard", ar: "مدقق AST الحتمي من Gemini", zh: "Google Gemini 确定性 AST 守卫", hi: "Google Gemini AST गार्ड" },
        detail: {
          en: "Zero `as any`, strict TypeScript parity, and O(1) abstraction density.",
          ar: "صرامة TypeScript تامة وكثافة تجريد بمعيار O(1).",
          zh: "零 `as any`、严格 TypeScript 类型对齐与 O(1) 抽象密度。",
          hi: "सख्त TypeScript सुरक्षा और O(1) एब्स्ट्रैक्शन डेंसिटी।",
        },
      },
    ],
  },

  files: {
    id: "files",
    href: "/llms.txt",
    primaryEcosystem: "cloudflare",
    secondaryEcosystem: "vercel",
    mcpServer: "mcp://cloudflare-r2/artifacts",
    mcpTool: "r2_artifact_inspect",
    defaultEndpoint: "/llms.txt",
    defaultArgs: { bucket: "pai-sovereign-artifacts", artifact: "/llms.txt" },
    locales: {
      en: {
        name: "Cloud Files",
        windowTitle: "Cloud Files — Cloudflare R2 & Discovery Artifact Vault",
        subtitle: "Cloudflare R2 + Basin Iceberg + Vercel Blob · Sovereign Storage",
        mcpSummary: "Inspect and verify live machine-readable discovery files (/llms.txt, /agent.json, /mcp.json, /agentic.txt).",
      },
      ar: {
        name: "ملفات السحابة",
        windowTitle: "ملفات السحابة — خزنة Cloudflare R2 وملفات الاكتشاف",
        subtitle: "Cloudflare R2 + Basin Iceberg + Vercel Blob · التخزين السيادي",
        mcpSummary: "فحص واستعراض ملفات الاكتشاف القياسية الحية (/llms.txt و /agent.json و /mcp.json و /agentic.txt).",
      },
      zh: {
        name: "云端文件库",
        windowTitle: "云端文件库 — Cloudflare R2 与发现清单存储库",
        subtitle: "Cloudflare R2 + Basin Iceberg + Vercel Blob · 主权存储",
        mcpSummary: "实时检查与验证机器可读发现文件 (/llms.txt、/agent.json、/mcp.json、/agentic.txt)。",
      },
      hi: {
        name: "क्लाउड फ़ाइलें",
        windowTitle: "क्लाउड फ़ाइलें — Cloudflare R2 और आर्टिफैक्ट वॉल्ट",
        subtitle: "Cloudflare R2 + Basin Iceberg + Vercel Blob · सॉवरेन स्टोरेज",
        mcpSummary: "लाइव मशीन-पठनीय डिस्कवरी फ़ाइलें (/llms.txt, /agent.json, /mcp.json, /agentic.txt) जांचें।",
      },
    },
    actions: [
      {
        id: "inspect-llms-txt",
        toolName: "r2_artifact_inspect",
        endpoint: "/llms.txt",
        sampleArgs: { path: "/llms.txt", encoding: "utf-8" },
        label: { en: "Read /llms.txt", ar: "قراءة /llms.txt", zh: "读取 /llms.txt", hi: "/llms.txt पढ़ें" },
        description: {
          en: "Load live /llms.txt discovery manifest into the MCP viewer",
          ar: "تحميل ملف الاكتشاف الحي /llms.txt في عارض MCP",
          zh: "将实时 /llms.txt 发现清单加载至 MCP 查看器",
          hi: "MCP व्यूअर में लाइव /llms.txt मैनिफेस्ट लोड करें",
        },
      },
      {
        id: "inspect-agentic-txt",
        toolName: "r2_artifact_inspect",
        endpoint: "/agentic.txt",
        sampleArgs: { path: "/agentic.txt", verifyPolicy: true },
        label: { en: "Read /agentic.txt", ar: "قراءة /agentic.txt", zh: "读取 /agentic.txt", hi: "/agentic.txt पढ़ें" },
        description: {
          en: "Inspect sovereign security & crawling policy manifest",
          ar: "فحص وثيقة سياسات الأمان والوصول للوكلاء",
          zh: "检查主权安全与智能体访问策略清单",
          hi: "सॉवरेन सुरक्षा और एजेंट नीति मैनिफेस्ट जांचें",
        },
      },
    ],
    modules: [
      {
        code: "CF-R2",
        provider: "cloudflare",
        metric: "Zero Egress",
        title: { en: "Cloudflare R2 Object & Iceberg Vault", ar: "خزنة كائنات Cloudflare R2", zh: "Cloudflare R2 对象与数据湖存储", hi: "Cloudflare R2 ऑब्जेक्ट वॉल्ट" },
        detail: {
          en: "S3-compatible zero-egress storage for agent snapshots and audit logs.",
          ar: "تخزين سحابي متوافق مع S3 بدون رسوم نقل للقطات الوكلاء وسجلات التدقيق.",
          zh: "兼容 S3 的零出口流量存储，用于智能体快照与审计日志。",
          hi: "एजेंट स्नैपशॉट और ऑडिट लॉग के लिए ज़ीरो-इग्रेस R2 स्टोरेज।",
        },
      },
      {
        code: "VERCEL-BLOB",
        provider: "vercel",
        metric: "Edge CDN Cached",
        title: { en: "Vercel Edge Discovery Artifacts", ar: "ملفات اكتشاف Vercel الطرفية", zh: "Vercel 边缘发现制品", hi: "Vercel एज डिस्कवरी आर्टिफैक्ट्स" },
        detail: {
          en: "Serves /llms.txt, /agent.json, and /mcp.json with instant global cache.",
          ar: "تقديم ملفات /llms.txt و /agent.json و /mcp.json بتخزين مؤقت عالمي فوري.",
          zh: "通过全球边缘缓存即时分发 /llms.txt、/agent.json 与 /mcp.json。",
          hi: "वैश्विक एज कैश के साथ /llms.txt, /agent.json और /mcp.json प्रदान करता है।",
        },
      },
    ],
  },

  automation: {
    id: "automation",
    href: "https://ppp.axiomid.app",
    primaryEcosystem: "cloudflare",
    secondaryEcosystem: "vercel",
    mcpServer: "mcp://pai-workflows/scheduler",
    mcpTool: "schedule_pulse_run",
    defaultEndpoint: "/api/telemetry",
    defaultArgs: { cadence: "*/10 * * * *", workflow: "centerboard-heartbeat" },
    locales: {
      en: {
        name: "Automation",
        windowTitle: "Automation — Durable Workflows & Schedules MCP App",
        subtitle: "Cloudflare Workflows + Vercel Schedules & Queues · ppp.axiomid.app",
        mcpSummary: "Crash-safe step orchestration, 10-minute bounty heartbeats, and PPP wire event triggers.",
      },
      ar: {
        name: "الأتمتة الذكية",
        windowTitle: "الأتمتة الذكية — تطبيق مسارات العمل والجدولة MCP",
        subtitle: "Cloudflare Workflows + جدولة وطوابير Vercel · ppp.axiomid.app",
        mcpSummary: "تنسيق المهام المقاوم للأعطال ونبضات الحياة كل 10 دقائق ومشغلات بروتوكول PPP.",
      },
      zh: {
        name: "自动化编排",
        windowTitle: "自动化编排 — 持久化工作流与定时调度 MCP 应用",
        subtitle: "Cloudflare Workflows + Vercel Schedules & Queues · ppp.axiomid.app",
        mcpSummary: "崩溃安全的分步编排、10 分钟赏金心跳脉冲与 PPP 线缆协议事件触发器。",
      },
      hi: {
        name: "ऑटोमेशन",
        windowTitle: "ऑटोमेशन — ड्यूरेबल वर्कफ़्लो और शेड्यूल MCP ऐप",
        subtitle: "Cloudflare Workflows + Vercel Schedules & Queues · ppp.axiomid.app",
        mcpSummary: "क्रैश-सेफ़ वर्कफ़्लो ऑर्केस्ट्रेशन, 10-मिनट हार्टबीट पल्स और PPP वायर ट्रिगर्स।",
      },
    },
    actions: [
      {
        id: "trigger-heartbeat",
        toolName: "schedule_pulse_run",
        endpoint: "/api/telemetry",
        sampleArgs: { job: "centerboard-24h-liveness", retryPolicy: "exponential" },
        label: { en: "Trigger Heartbeat Pulse", ar: "تشغيل نبضة الجدولة", zh: "触发心跳脉冲", hi: "हार्टबीट पल्स ट्रिगर करें" },
        description: {
          en: "Execute a live durable heartbeat check against the telemetry bus",
          ar: "تنفيذ فحص نبضة الحياة المستدامة على ناقل القياس الحي",
          zh: "对遥测总线执行实时持久化心跳检查",
          hi: "टेलीमेट्री बस पर लाइव ड्यूरेबल हार्टबीट जांच चलाएं",
        },
      },
    ],
    modules: [
      {
        code: "CF-WORKFLOWS",
        provider: "cloudflare",
        metric: "Durable Steps",
        title: { en: "Cloudflare Workflows & Queues", ar: "مسارات عمل وطوابير Cloudflare", zh: "Cloudflare 持久化工作流与队列", hi: "Cloudflare वर्कफ़्लो और कतारें" },
        detail: {
          en: "Multi-step state machines with automatic retries and dead-letter protection.",
          ar: "آلات حالة متعددة الخطوات مع إعادة محاولة تلقائية وحماية من فقدان الرسائل.",
          zh: "具备自动重试与死信保护的多步持久化状态机。",
          hi: "ऑटोमैटिक रीट्राई के साथ मल्टी-स्टेप ड्यूरेबल स्टेट मशीन।",
        },
      },
      {
        code: "VERCEL-SCHED",
        provider: "vercel",
        metric: "Cron + Workflow SDK",
        title: { en: "Vercel Workflow SDK & Schedules", ar: "جدولة ومسارات عمل Vercel", zh: "Vercel Workflow SDK 与定时任务", hi: "Vercel वर्कफ़्लो SDK और शेड्यूल" },
        detail: {
          en: "Pauses and resumes long-running agent runs across webhook callbacks.",
          ar: "إيقاف واستئناف مهام الوكلاء طويلة الأمد عبر استدعاءات Webhook.",
          zh: "跨 Webhook 回调暂停与恢复长周期智能体任务。",
          hi: "वेबहुक कॉलबैक के बीच लंबे एजेंट कार्यों को पॉज़ और रीज़्यूम करता है।",
        },
      },
    ],
  },

  autopilot: {
    id: "autopilot",
    href: "https://agdp.axiomid.app",
    primaryEcosystem: "pi-network",
    secondaryEcosystem: "google",
    mcpServer: "mcp://pai-autopilot/loop",
    mcpTool: "autonomous_loop_step",
    defaultEndpoint: "/agent.json",
    defaultArgs: { cycle: "learn->earn->skills", muraqabahGate: "PASS" },
    locales: {
      en: {
        name: "Autopilot",
        windowTitle: "Autopilot — Autonomous Learn → Earn → Skills MCP Engine",
        subtitle: "Pi Worker Node + Google Gemini ADK + AGDP Ledger · agdp.axiomid.app",
        mcpSummary: "Drives the closed-loop autonomous agent economy with human-in-the-loop AG-UI confirmation gates.",
      },
      ar: {
        name: "الطيار الآلي",
        windowTitle: "الطيار الآلي — محرك دورة التعلّم والكسب والمهارات MCP",
        subtitle: "عقدة Pi Worker + Google Gemini ADK + سجل AGDP · agdp.axiomid.app",
        mcpSummary: "قيادة الدورة الاقتصادية الذاتية للوكلاء مع بوابات تأكيد بشرية وفق معيار AG-UI.",
      },
      zh: {
        name: "自动驾驶 (Autopilot)",
        windowTitle: "自动驾驶 — 自主 学习 → 赚取 → 技能 闭环 MCP 引擎",
        subtitle: "Pi Worker 节点 + Google Gemini ADK + AGDP 账本 · agdp.axiomid.app",
        mcpSummary: "驱动具备 AG-UI 人类在环确认门禁的闭环自主智能体经济。",
      },
      hi: {
        name: "ऑटोपायलट",
        windowTitle: "ऑटोपायलट — स्वायत्त Learn → Earn → Skills MCP इंजन",
        subtitle: "Pi Worker नोड + Google Gemini ADK + AGDP लेजर · agdp.axiomid.app",
        mcpSummary: "AG-UI मानव-पुष्टि गेट्स के साथ स्वायत्त एजेंट अर्थव्यवस्था चक्र चलाता है।",
      },
    },
    actions: [
      {
        id: "autopilot-step",
        toolName: "autonomous_loop_step",
        endpoint: "/agent.json",
        sampleArgs: { stage: "discover->claim->verify", agUiConfirm: true },
        label: { en: "Step Autonomous Loop", ar: "تشغيل خطوة الدورة الذاتية", zh: "单步执行自主闭环", hi: "स्वायत्त लूप स्टेप चलाएं" },
        description: {
          en: "Run one verified cycle of the Learn → Earn → Skills autopilot loop",
          ar: "تنفيذ دورة موثقة واحدة من حلقة التعلّم ← الكسب ← المهارات",
          zh: "执行一次经验证的 学习 → 赚取 → 技能 自动驾驶闭环",
          hi: "Learn → Earn → Skills ऑटोपायलट लूप का एक सत्यापित चक्र चलाएं",
        },
      },
    ],
    modules: [
      {
        code: "PI-WORKER",
        provider: "pi-network",
        metric: "aGDP Settlement",
        title: { en: "Pi Worker & AGDP Ledger", ar: "عامل Pi وسجل الناتج AGDP", zh: "Pi Worker 与 AGDP 经济账本", hi: "Pi वर्कर और AGDP लेजर" },
        detail: {
          en: "Tracks Agentic GDP contribution and settles verified machine labor in Pi.",
          ar: "تتبع مساهمة الناتج الإجمالي للوكلاء وتسوية العمل الموثق بعملة Pi.",
          zh: "追踪智能体 GDP 贡献并以 Pi 结算经验证的机器劳动。",
          hi: "एजेंटिक GDP योगदान को ट्रैक करता है और Pi में भुगतान निपटाता है।",
        },
      },
      {
        code: "AG-UI-GATE",
        provider: "google",
        metric: "ui:confirm Guard",
        title: { en: "AG-UI Human-in-the-Loop Gate", ar: "بوابة التأكيد البشري AG-UI", zh: "AG-UI 人类在环确认门禁", hi: "AG-UI ह्यूमन-इन-द-लूप गेट" },
        detail: {
          en: "Emits structured AG-UI interrupt events before any high-stakes action.",
          ar: "إصدار أحداث تأكيد مهيكلة قبل أي إجراء عالي الحساسية.",
          zh: "在执行任何高风险操作前发出结构化 AG-UI 确认中断事件。",
          hi: "किसी भी महत्वपूर्ण क्रिया से पहले AG-UI पुष्टि इवेंट जारी करता है।",
        },
      },
    ],
  },

  assistant: {
    id: "assistant",
    href: "https://www.axiomid.app",
    primaryEcosystem: "google",
    secondaryEcosystem: "vercel",
    mcpServer: "mcp://google-gemini/assistant",
    mcpTool: "context_get",
    defaultEndpoint: "/mcp.json",
    defaultArgs: { model: "gemini-2.5-pro", session: "aura-sovereign-copilot" },
    locales: {
      en: {
        name: "AI Assistant",
        windowTitle: "AI Assistant — Google Gemini & Vercel AI Gateway MCP Copilot",
        subtitle: "Google Gemini 2.5 + Vercel AI Gateway + PublicMCP · AuraOS Copilot",
        mcpSummary: "Quad-lingual sovereign copilot wired directly into AuraOS MCP tools, 7-layer memory, and live telemetry.",
      },
      ar: {
        name: "المساعد الذكي",
        windowTitle: "المساعد الذكي — مساعد Google Gemini وبوابة Vercel AI عبر MCP",
        subtitle: "Google Gemini 2.5 + Vercel AI Gateway + PublicMCP · مساعد AuraOS",
        mcpSummary: "مساعد سيادي رباعي اللغات متصل مباشرة بأدوات MCP وذاكرة الطبقات السبع والقياس الحي.",
      },
      zh: {
        name: "AI 助手",
        windowTitle: "AI 助手 — Google Gemini 与 Vercel AI 网关 MCP 副驾驶",
        subtitle: "Google Gemini 2.5 + Vercel AI Gateway + PublicMCP · AuraOS 副驾驶",
        mcpSummary: "直连 AuraOS MCP 工具、7 层记忆与实时遥测的四语主权智能副驾驶。",
      },
      hi: {
        name: "AI असिस्टेंट",
        windowTitle: "AI असिस्टेंट — Google Gemini और Vercel AI गेटवे MCP कोपायलट",
        subtitle: "Google Gemini 2.5 + Vercel AI Gateway + PublicMCP · AuraOS कोपायलट",
        mcpSummary: "AuraOS MCP टूल्स, 7-लेयर मेमोरी और लाइव टेलीमेट्री से जुड़ा चतुर्भाषी कोपायलट।",
      },
    },
    actions: [
      {
        id: "assistant-caas",
        toolName: "context_get",
        endpoint: "/mcp.json",
        sampleArgs: { session: "aura-assistant-session", lang: "quad-lingual" },
        label: { en: "Load Session Context (CaaS)", ar: "تحميل سياق الجلسة (CaaS)", zh: "加载会话上下文 (CaaS)", hi: "सेशन कॉन्टेक्स्ट लोड करें" },
        description: {
          en: "Invoke context_get MCP tool (0.00 PI fuel) to hydrate copilot memory",
          ar: "استدعاء أداة context_get عبر MCP (مجاناً 0.00 PI) لتغذية ذاكرة المساعد",
          zh: "调用 context_get MCP 工具 (0.00 PI 燃料) 注入副驾驶上下文",
          hi: "कोपायलट मेमोरी लोड करने के लिए context_get MCP टूल (0.00 PI) चलाएं",
        },
      },
    ],
    modules: [
      {
        code: "GEMINI-2.5",
        provider: "google",
        metric: "1M Context + MCP",
        title: { en: "Google Gemini Multimodal Reasoning", ar: "استدلال Google Gemini متعدد الوسائط", zh: "Google Gemini 多模态推理", hi: "Google Gemini मल्टीमॉडल रीज़निंग" },
        detail: {
          en: "Native MCP tool use grounded in live workspace state and SOUL ethics.",
          ar: "استخدام أصيل لأدوات MCP مرتكز على حالة مساحة العمل وميثاق SOUL.",
          zh: "基于实时工作区状态与 SOUL 伦理准则的原生 MCP 工具调用。",
          hi: "लाइव वर्कस्पेस स्टेट और SOUL नैतिकता पर आधारित नेटिव MCP टूल उपयोग।",
        },
      },
      {
        code: "AI-GATEWAY",
        provider: "vercel",
        metric: "BYOK + Fallbacks",
        title: { en: "Vercel AI Gateway Observability", ar: "مراقبة بوابة Vercel AI", zh: "Vercel AI 网关可观测性", hi: "Vercel AI गेटवे ऑब्ज़र्वेबिलिटी" },
        detail: {
          en: "Centralized spend caps, latency telemetry, and multi-provider routing.",
          ar: "حدود إنفاق مركزية، قياس زمن الاستجابة، وتوجيه متعدد المزودين.",
          zh: "集中式预算上限、延迟遥测与多模型提供商路由。",
          hi: "केंद्रीकृत बजट नियंत्रण, लेटेंसी टेलीमेट्री और मल्टी-प्रोवाइडर राउटिंग।",
        },
      },
    ],
  },
};

export function isDesktopAppId(value: string): value is DesktopAppId {
  return Object.prototype.hasOwnProperty.call(MCP_APPS_CATALOG, value);
}
