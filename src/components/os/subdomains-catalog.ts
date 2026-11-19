import type { Language } from "@/app/context/language-context";
import type { DesktopAppId } from "./mcp-apps-catalog";

export type SubdomainCategory = "workspace" | "ai-loop" | "identity" | "protocol";

export interface SubdomainLocaleText {
  name: string;
  tagline: string;
}

export interface SubdomainEntry {
  id: string;
  host: string;
  href: string;
  category: SubdomainCategory;
  gradient: readonly [string, string];
  shortTag: string;
  windowApp?: DesktopAppId;
  protocolStub?: boolean;
  locales: Record<Language, SubdomainLocaleText>;
}

export const SUBDOMAINS_CATALOG: readonly SubdomainEntry[] = [
  {
    id: "gspace",
    host: "gspace.axiomid.app",
    href: "https://gspace.axiomid.app",
    category: "workspace",
    gradient: ["#22d3ee", "#6366f1"],
    shortTag: "GWT",
    windowApp: "gspace",
    locales: {
      en: { name: "PAI Gspace", tagline: "Global Workspace Interpretability & Live Mesh Telemetry" },
      ar: { name: "مساحة باي", tagline: "مراقبة مساحة العمل العالمية والقياس الحي للشبكة" },
      zh: { name: "PAI 工作区", tagline: "全局工作区可解释性与实时网络遥测" },
      hi: { name: "PAI Gspace", tagline: "ग्लोबल वर्कस्पेस टेलीमेट्री और लाइव मेश मॉनिटर" },
    },
  },
  {
    id: "harness",
    host: "harness.axiomid.app",
    href: "https://harness.axiomid.app",
    category: "workspace",
    gradient: ["#06b6d4", "#8b5cf6"],
    shortTag: "FORGE",
    windowApp: "terminal",
    protocolStub: true,
    locales: {
      en: { name: "Harness Forge", tagline: "Eval suites, truth-check, sandboxes & centerboard gates" },
      ar: { name: "الطرفية — Harness", tagline: "حزم التقييم وفحص الصدق وبيئات العزل الآمنة" },
      zh: { name: "Harness 熔炉", tagline: "评估套件、真实性校验与安全沙盒门禁" },
      hi: { name: "हार्नेस फोर्ज", tagline: "Eval सूट, truth-check और सैंडबॉक्स सत्यापन" },
    },
  },
  {
    id: "memory",
    host: "memory.axiomid.app",
    href: "https://memory.axiomid.app",
    category: "workspace",
    gradient: ["#a855f7", "#ec4899"],
    shortTag: "7-LAYER",
    windowApp: "notes",
    protocolStub: true,
    locales: {
      en: { name: "PAI Memory", tagline: "7-Layer WikiGraph vector & bitemporal notes engine" },
      ar: { name: "ذاكرة باي", tagline: "محرك الذاكرة ذو الـ 7 طبقات واسترجاع WikiGraph" },
      zh: { name: "PAI 记忆引擎", tagline: "7 层 WikiGraph 向量与双时态笔记引擎" },
      hi: { name: "PAI मेमोरी", tagline: "7-लेयर WikiGraph वेक्टर और बायटेम्पोरल नोट्स इंजन" },
    },
  },
  {
    id: "learn",
    host: "learn.axiomid.app",
    href: "https://learn.axiomid.app",
    category: "ai-loop",
    gradient: ["#38bdf8", "#10b981"],
    shortTag: "LEARN",
    windowApp: "learn",
    protocolStub: true,
    locales: {
      en: { name: "PAI Learn", tagline: "Interactive protocol tracks, specs & agent onboarding" },
      ar: { name: "تعلّم باي", tagline: "مسارات تعلم البروتوكول والمواصفات وتأهيل الوكلاء" },
      zh: { name: "PAI 学院", tagline: "交互式协议课程、技术规范与智能体入门" },
      hi: { name: "PAI लर्न", tagline: "प्रोटोकॉल लर्निंग ट्रैक, स्पेक्स और एजेंट गाइड" },
    },
  },
  {
    id: "earn",
    host: "earn.axiomid.app",
    href: "https://earn.axiomid.app",
    category: "ai-loop",
    gradient: ["#fbbf24", "#f97316"],
    shortTag: "PI BOUNTY",
    windowApp: "earn",
    protocolStub: true,
    locales: {
      en: { name: "PAI Earn", tagline: "Pi Network machine-labor bounties & escrow settlements" },
      ar: { name: "منصة الكسب", tagline: "مكافآت عمل الوكلاء وتسوية الضمان بعملة Pi" },
      zh: { name: "PAI 赏金池", tagline: "Pi Network 机器劳动赏金与托管结算" },
      hi: { name: "PAI अर्न", tagline: "Pi नेटवर्क मशीन-लेबर बाउंटी और एस्क्रो भुगतान" },
    },
  },
  {
    id: "skills",
    host: "skills.axiomid.app",
    href: "https://skills.axiomid.app",
    category: "ai-loop",
    gradient: ["#10b981", "#22d3ee"],
    shortTag: "SKILLS",
    windowApp: "skills",
    locales: {
      en: { name: "PAI Skills", tagline: "Agentic skills registry, SKILL.md specs & x402 manifests" },
      ar: { name: "متجر المهارات", tagline: "سجل مهارات الوكلاء الذكية ومواصفات x402" },
      zh: { name: "PAI 技能库", tagline: "智能体技能注册中心与 x402 能力清单" },
      hi: { name: "PAI स्किल्स", tagline: "एजेंटिक स्किल्स रजिस्ट्री और x402 मेनिफेस्ट" },
    },
  },
  {
    id: "mcp",
    host: "mcp.axiomid.app",
    href: "https://mcp.axiomid.app",
    category: "protocol",
    gradient: ["#8b5cf6", "#06b6d4"],
    shortTag: "MCP",
    windowApp: "mcp",
    locales: {
      en: { name: "MCP Gateway", tagline: "Model Context Protocol hub with Al-Mizan router & DO" },
      ar: { name: "بوابة MCP", tagline: "بوابة بروتوكول السياق وموجّه الميزان للوكلاء" },
      zh: { name: "MCP 网关", tagline: "集成 Al-Mizan 路由与持久对象的 MCP 中心" },
      hi: { name: "MCP गेटवे", tagline: "Al-Mizan राउटर और टूल ब्रिज वाला MCP हब" },
    },
  },
  {
    id: "openid",
    host: "openid.axiomid.app",
    href: "https://openid.axiomid.app",
    category: "identity",
    gradient: ["#34d399", "#059669"],
    shortTag: "DID / VC",
    locales: {
      en: { name: "OpenIdentity", tagline: "Sovereign AI passport schema, W3C DID & credentials" },
      ar: { name: "الهوية المفتوحة", tagline: "مخطط جواز الوكيل السيادي ووثائق الهوية القابلة للتحقق" },
      zh: { name: "开放身份标准", tagline: "主权 AI 护照规范、W3C DID 与可验证凭证" },
      hi: { name: "ओपन-आइडेंटिटी", tagline: "सॉवरेन AI पासपोर्ट स्कीमा और W3C DID क्रेडेंशियल" },
    },
  },
  {
    id: "aip",
    host: "aip.axiomid.app",
    href: "https://aip.axiomid.app",
    category: "identity",
    gradient: ["#f43f5e", "#f59e0b"],
    shortTag: "ZERO-KEY",
    protocolStub: true,
    locales: {
      en: { name: "AIP Security Gateway", tagline: "Zero raw keys token vault & scoped capability policies" },
      ar: { name: "بوابة أمان AIP", tagline: "خزنة التوكنات المقيّدة بسياسة انعدام المفاتيح الخام" },
      zh: { name: "AIP 安全网关", tagline: "零原始密钥令牌库与作用域权限策略" },
      hi: { name: "AIP सुरक्षा गेटवे", tagline: "ज़ीरो रॉ-की टोकन वॉल्ट और स्कोप्ड एक्सेस नीतियां" },
    },
  },
  {
    id: "auth",
    host: "auth.axiomid.app",
    href: "https://auth.axiomid.app",
    category: "identity",
    gradient: ["#60a5fa", "#3b82f6"],
    shortTag: "OAUTH2",
    protocolStub: true,
    locales: {
      en: { name: "Pi Auth Gateway", tagline: "Pi Network OAuth2 authentication & W3C DID issuer" },
      ar: { name: "بوابة المصادقة", tagline: "مصادقة OAuth2 لشبكة Pi وإصدار الهويات اللامركزية" },
      zh: { name: "Pi 认证网关", tagline: "Pi Network OAuth2 鉴权与 DID 签发服务" },
      hi: { name: "Pi ऑथ गेटवे", tagline: "Pi नेटवर्क OAuth2 प्रमाणीकरण और DID जारीकर्ता" },
    },
  },
  {
    id: "piverify",
    host: "piverify.axiomid.app",
    href: "https://piverify.axiomid.app",
    category: "identity",
    gradient: ["#f59e0b", "#ec4899"],
    shortTag: "KYC",
    locales: {
      en: { name: "Pi Verify", tagline: "Human-backed Sybil resistance & Pi KYC proof oracle" },
      ar: { name: "التحقق — PiVerify", tagline: "مقاومة انتحال الروبوتات وإثبات KYC البشري عبر Pi" },
      zh: { name: "Pi 实人认证", tagline: "抗女巫攻击与 Pi Network KYC 真人验证预言机" },
      hi: { name: "Pi वेरिफाई", tagline: "एंटी-सिबिल सुरक्षा और Pi KYC मानव सत्यापन" },
    },
  },
  {
    id: "ppp",
    host: "ppp.axiomid.app",
    href: "https://ppp.axiomid.app",
    category: "protocol",
    gradient: ["#06b6d4", "#14b8a6"],
    shortTag: "WIRE",
    protocolStub: true,
    locales: {
      en: { name: "PPP Connector", tagline: "USB-like universal wire format for plug-and-play agents" },
      ar: { name: "موصّل PPP", tagline: "بروتوكول التوصيل العالمي السريع بين الوكلاء والخدمات" },
      zh: { name: "PPP 通用连接器", tagline: "即插即用的智能体 USB 级统一通信线缆协议" },
      hi: { name: "PPP कनेक्टर", tagline: "प्लग-एंड-प्ले एजेंट्स के लिए यूनिवर्सल वायर प्रोटोकॉल" },
    },
  },
  {
    id: "node",
    host: "node.axiomid.app",
    href: "https://node.axiomid.app",
    category: "protocol",
    gradient: ["#818cf8", "#22d3ee"],
    shortTag: "MESH",
    protocolStub: true,
    locales: {
      en: { name: "Node Port", tagline: "Decentralized sovereign agent node registry & peers" },
      ar: { name: "منفذ العُقد", tagline: "سجل عُقد الوكلاء السيادية واكتشاف الأقران اللامركزي" },
      zh: { name: "节点端口", tagline: "去中心化主权智能体节点注册与对等网络" },
      hi: { name: "नोड पोर्ट", tagline: "विकेंद्रीकृत सॉवरेन एजेंट नोड रजिस्ट्री और पीयर्स" },
    },
  },
  {
    id: "agdp",
    host: "agdp.axiomid.app",
    href: "https://agdp.axiomid.app",
    category: "ai-loop",
    gradient: ["#10b981", "#fbbf24"],
    shortTag: "COMMERCE",
    protocolStub: true,
    locales: {
      en: { name: "AGDP Engine", tagline: "Agentic Gross Domestic Product & autonomous commerce ledger" },
      ar: { name: "اقتصاد الوكلاء — AGDP", tagline: "قياس الناتج الاقتصادي للوكلاء وسجل التجارة الذاتية" },
      zh: { name: "AGDP 经济引擎", tagline: "智能体生产总值计量与自主商业结算账本" },
      hi: { name: "AGDP इंजन", tagline: "एजेंटिक GDP और स्वायत्त वाणिज्य लेजर" },
    },
  },
  {
    id: "mail",
    host: "mail.axiomid.app",
    href: "https://mail.axiomid.app",
    category: "protocol",
    gradient: ["#ec4899", "#8b5cf6"],
    shortTag: "EMAIL",
    protocolStub: true,
    locales: {
      en: { name: "PAI Mail", tagline: "Agentic Cloudflare email routing & transactional bridge" },
      ar: { name: "بريد باي", tagline: "التوجيه البريدي للوكلاء وجسر الرسائل السيادي" },
      zh: { name: "PAI 邮件路由", tagline: "Cloudflare 智能体邮件路由与事务投递网桥" },
      hi: { name: "PAI मेल", tagline: "एजेंटिक ईमेल राउटिंग और ट्रांज़ैक्शनल ब्रिज" },
    },
  },
  {
    id: "index",
    host: "index.axiomid.app",
    href: "https://index.axiomid.app",
    category: "workspace",
    gradient: ["#38bdf8", "#a855f7"],
    shortTag: "INDEX",
    protocolStub: true,
    locales: {
      en: { name: "Universe Index", tagline: "Central subdomain directory, sitemap & agent radar" },
      ar: { name: "دليل النطاقات", tagline: "الفهرس المركزي لجميع نطاقات وبروتوكولات المنظومة" },
      zh: { name: "全域索引目录", tagline: "PAI Universe 全子域中心目录与站点地图" },
      hi: { name: "यूनिवर्स इंडेक्स", tagline: "सभी सबडोमेन और प्रोटोकॉल की केंद्रीय निर्देशिका" },
    },
  },
];

export const SUBDOMAIN_CATEGORY_LABELS: Record<
  Language,
  Record<"all" | SubdomainCategory, string>
> = {
  en: {
    all: "All (16)",
    workspace: "Workspace",
    "ai-loop": "Learn → Earn → Skills",
    identity: "Identity & Auth",
    protocol: "Protocol Mesh",
  },
  ar: {
    all: "الكل (16)",
    workspace: "مساحة العمل",
    "ai-loop": "تعلّم ← اكسب ← مهارات",
    identity: "الهوية والأمان",
    protocol: "شبكة البروتوكولات",
  },
  zh: {
    all: "全部 (16)",
    workspace: "工作空间",
    "ai-loop": "学习 → 赚取 → 技能",
    identity: "身份与鉴权",
    protocol: "协议矩阵",
  },
  hi: {
    all: "सभी (16)",
    workspace: "वर्कस्पेस",
    "ai-loop": "लर्न → अर्न → स्किल्स",
    identity: "पहचान और सुरक्षा",
    protocol: "प्रोटोकॉल मेश",
  },
};

export function resolveSubdomainHref(sub: string): string {
  const cleanSub = sub.trim().toLowerCase();
  const entry = SUBDOMAINS_CATALOG.find((item) => item.id === cleanSub);
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") &&
    window.location.port === "3000" &&
    (cleanSub === "harness" || cleanSub === "memory")
  ) {
    return `http://localhost:8787/${cleanSub}`;
  }
  return entry?.href ?? `https://${cleanSub}.axiomid.app`;
}
