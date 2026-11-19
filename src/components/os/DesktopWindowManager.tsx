"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Compass,
  Database,
  ExternalLink,
  LayoutGrid,
  NotebookPen,
  Play,
  Plus,
  Search,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import { useLanguage, type Language } from "@/app/context/language-context";
import { BUS_EVENTS, emit, on } from "./agent-bus";
import {
  SUBDOMAINS_CATALOG,
  SUBDOMAIN_CATEGORY_LABELS,
  resolveSubdomainHref,
  type SubdomainCategory,
} from "./subdomains-catalog";

export type DesktopAppId = "terminal" | "notes" | "agents" | "subdomains";

interface TerminalLine {
  id: string;
  kind: "cmd" | "out" | "ok" | "err";
  text: string;
}

interface AiNote {
  id: string;
  layer: "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | "L7";
  title: string;
  content: string;
  updatedAt: string;
}

interface AgentFleetItem {
  id: string;
  name: string;
  layer: string;
  endpoint: string;
  role: string;
}

interface WindowCopy {
  close: string;
  openFullPage: string;
  openLiveSubdomain: string;
  terminal: {
    title: string;
    subtitle: string;
    promptPlaceholder: string;
    run: string;
    welcome: string;
    evalsLabel: string;
    suites: Array<{ title: string; desc: string }>;
  };
  notes: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    newTitlePlaceholder: string;
    newBodyPlaceholder: string;
    addNote: string;
    empty: string;
    matchLabel: string;
    graphTitle: string;
  };
  agents: {
    title: string;
    subtitle: string;
    openDashboard: string;
    openSettings: string;
    probeBtn: string;
    probing: string;
    launchTerminal: string;
    launchNotes: string;
    fleet: AgentFleetItem[];
    statusReady: string;
    statusStandby: string;
  };
  subdomains: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    loopTitle: string;
    openInOs: string;
    openExternal: string;
    liveLabel: string;
    empty: string;
  };
}

const COPY: Record<Language, WindowCopy> = {
  en: {
    close: "Close window",
    openFullPage: "Open Full View",
    openLiveSubdomain: "Live Portal ↗",
    terminal: {
      title: "AI Terminal — Harness Forge",
      subtitle: "harness.axiomid.app · Local Forge Shell & Verification Gates",
      promptPlaceholder: "Type a command (help, status, truth-check, evals, sandbox, memory, agents, clear)...",
      run: "Run",
      welcome: "AuraOS Harness Forge Terminal ready. Run `help` or click a quick command below.",
      evalsLabel: "Harness Forge Suites",
      suites: [
        { title: "Eval Suites", desc: "truth-check, doc-intel, centerboard & skills.json schema checks" },
        { title: "Sandbox Runtimes", desc: "Vercel Sandbox, Cloudflare workerd & QuickJS-WASI" },
        { title: "Verification Gates", desc: "SOUL Protocol Muraqabah & Sidq pre-deploy verification" },
        { title: "Centerboard Loop", desc: "Autonomous heartbeat monitor (< 24h liveness)" },
      ],
    },
    notes: {
      title: "AI Notes — 7-Layer Memory Engine",
      subtitle: "memory.axiomid.app · Local Bitemporal Notes & WikiGraph Recall",
      searchPlaceholder: "Search / recall memories across L1–L7...",
      newTitlePlaceholder: "Note title (e.g. Harness Eval Notes)",
      newBodyPlaceholder: "Write knowledge, context, or agent instructions...",
      addNote: "Save Note",
      empty: "No matching notes found. Add a note above to persist it locally.",
      matchLabel: "Match",
      graphTitle: "7-Layer Memory Architecture",
    },
    agents: {
      title: "AI Agents — Sovereign Fleet Hub",
      subtitle: "AuraOS Control Plane · Local Fleet Overview & Diagnostics",
      openDashboard: "Open Full Control Center",
      openSettings: "Settings",
      probeBtn: "Probe Live Endpoints",
      probing: "Probing...",
      launchTerminal: "Launch AI Terminal",
      launchNotes: "Open AI Notes",
      statusReady: "LIVE",
      statusStandby: "STANDBY",
      fleet: [
        { id: "pioneer", name: "Pioneer Identity Agent", layer: "L1 Identity", endpoint: "/agent.json", role: "W3C DID & Pi KYC verification" },
        { id: "eve", name: "Eve 7-Layer Memory Agent", layer: "L5 Memory", endpoint: "/llms.txt", role: "Bitemporal notes & Matryoshka recall" },
        { id: "harness", name: "Harness Forge Verifier", layer: "L3 Harness", endpoint: "/mcp.json", role: "Eval suites, truth-check & sandbox gates" },
        { id: "telemetry", name: "Global Workspace Sentinel", layer: "L7 Mesh", endpoint: "/api/telemetry", role: "Live health & AuraOS defense bus" },
      ],
    },
    subdomains: {
      title: "PAI Universe — Live Subdomains Directory",
      subtitle: "16 Live *.axiomid.app Services, Workers & Protocol Surfaces",
      searchPlaceholder: "Filter subdomains, protocols, or descriptions...",
      loopTitle: "Autonomous Loop",
      openInOs: "Open Window",
      openExternal: "Open ↗",
      liveLabel: "LIVE",
      empty: "No subdomains matched your filter.",
    },
  },
  ar: {
    close: "إغلاق النافذة",
    openFullPage: "فتح الصفحة الكاملة",
    openLiveSubdomain: "البوابة الحية ↗",
    terminal: {
      title: "الطرفية الذكية — Harness Forge",
      subtitle: "harness.axiomid.app · طرفية التحقق والاختبارات المحلية",
      promptPlaceholder: "اكتب أمراً (help, status, truth-check, evals, sandbox, memory, agents, clear)...",
      run: "تنفيذ",
      welcome: "الطرفية الذكية AuraOS Harness Forge جاهزة. اكتب help أو اختر أمراً سريعاً بالأسفل.",
      evalsLabel: "حزم Harness Forge",
      suites: [
        { title: "حزم التقييم", desc: "فحص truth-check و doc-intel ومخطط skills.json" },
        { title: "بيئات العزل", desc: "Vercel Sandbox و Cloudflare workerd و QuickJS-WASI" },
        { title: "بوابات التحقق", desc: "التحقق الإلزامي لميثاق SOUL: مراقبة وصدق قبل النشر" },
        { title: "حلقة Centerboard", desc: "مراقبة نبض التحديث المستمر خلال 24 ساعة" },
      ],
    },
    notes: {
      title: "ملاحظات الذكاء الاصطناعي — محرك الذاكرة ذو الـ 7 طبقات",
      subtitle: "memory.axiomid.app · مفكرة الذاكرة المحلية واسترجاع المعرفة",
      searchPlaceholder: "ابحث في الملاحظات والذاكرة عبر الطبقات L1–L7...",
      newTitlePlaceholder: "عنوان الملاحظة (مثال: ملاحظات الأمان)",
      newBodyPlaceholder: "اكتب المعرفة أو تعليمات الوكلاء لحفظها محلياً...",
      addNote: "حفظ الملاحظة",
      empty: "لا توجد ملاحظات مطابقة. أضف ملاحظة جديدة لحفظها محلياً.",
      matchLabel: "تطابق",
      graphTitle: "بنية الذاكرة ذات 7 طبقات",
    },
    agents: {
      title: "وكلاء الذكاء الاصطناعي — مركز التحكم السيادي",
      subtitle: "لوحة تحكم AuraOS · فحص الوكلاء ونقاط النهاية الحية",
      openDashboard: "فتح لوحة التحكم الكاملة",
      openSettings: "الإعدادات",
      probeBtn: "فحص نقاط النهاية الحية",
      probing: "جارٍ الفحص...",
      launchTerminal: "فتح الطرفية الذكية",
      launchNotes: "فتح ملاحظات AI",
      statusReady: "نشط",
      statusStandby: "جاهز",
      fleet: [
        { id: "pioneer", name: "وكيل الهوية السيادية", layer: "L1 الهوية", endpoint: "/agent.json", role: "التحقق عبر DID وهوية Pi KYC" },
        { id: "eve", name: "وكيل الذاكرة (إيف)", layer: "L5 الذاكرة", endpoint: "/llms.txt", role: "مفكرة الطبقات السبع والاسترجاع الدلالي" },
        { id: "harness", name: "مدقق Harness Forge", layer: "L3 الاختبار", endpoint: "/mcp.json", role: "بوابات التحقق وبيئات العزل الآمنة" },
        { id: "telemetry", name: "حارس مساحة العمل", layer: "L7 المراقبة", endpoint: "/api/telemetry", role: "القياس الحي وتنبيهات الدفاع السيبراني" },
      ],
    },
    subdomains: {
      title: "منظومة باي — دليل النطاقات الفرعية الحية",
      subtitle: "16 خدمة وعامل حافة نشط عبر نطاقات *.axiomid.app",
      searchPlaceholder: "ابحث في النطاقات الفرعية أو البروتوكولات...",
      loopTitle: "الدورة الذاتية",
      openInOs: "فتح كنافذة",
      openExternal: "فتح ↗",
      liveLabel: "مباشر",
      empty: "لا توجد نطاقات مطابقة لبحثك.",
    },
  },
  zh: {
    close: "关闭窗口",
    openFullPage: "打开完整页面",
    openLiveSubdomain: "实时门户 ↗",
    terminal: {
      title: "AI 终端 — Harness Forge",
      subtitle: "harness.axiomid.app · 本地验证网关与沙盒终端",
      promptPlaceholder: "输入命令 (help, status, truth-check, evals, sandbox, memory, agents, clear)...",
      run: "运行",
      welcome: "AuraOS Harness Forge 终端已就绪。输入 help 或点击下方快捷命令。",
      evalsLabel: "Harness Forge 套件",
      suites: [
        { title: "评估套件", desc: "truth-check、doc-intel 与 skills.json 模式校验" },
        { title: "沙盒运行时", desc: "Vercel Sandbox、Cloudflare workerd 与 QuickJS-WASI" },
        { title: "验证网关", desc: "部署前 SOUL 协议 Muraqabah 与 Sidq 合规校验" },
        { title: "Centerboard 循环", desc: "24 小时心跳活跃度自动监控" },
      ],
    },
    notes: {
      title: "AI 笔记 — 7 层向量与图谱记忆引擎",
      subtitle: "memory.axiomid.app · 本地双时态笔记与语义检索",
      searchPlaceholder: "搜索 L1–L7 记忆笔记...",
      newTitlePlaceholder: "笔记标题",
      newBodyPlaceholder: "记录知识、上下文或智能体指令...",
      addNote: "保存笔记",
      empty: "暂无匹配笔记，请添加一条本地记忆。",
      matchLabel: "匹配度",
      graphTitle: "7 层记忆架构图谱",
    },
    agents: {
      title: "AI 智能体 — 主权智能体控制中心",
      subtitle: "AuraOS 控制平面 · 实时集群探测与快捷入口",
      openDashboard: "打开完整控制台",
      openSettings: "设置",
      probeBtn: "探测实时端点",
      probing: "探测中...",
      launchTerminal: "打开 AI 终端",
      launchNotes: "打开 AI 笔记",
      statusReady: "在线",
      statusStandby: "待命",
      fleet: [
        { id: "pioneer", name: "Pioneer 身份智能体", layer: "L1 身份层", endpoint: "/agent.json", role: "W3C DID 与 Pi KYC 认证" },
        { id: "eve", name: "Eve 7 层记忆智能体", layer: "L5 记忆层", endpoint: "/llms.txt", role: "双时态笔记与 Matryoshka 检索" },
        { id: "harness", name: "Harness Forge 校验器", layer: "L3 校验层", endpoint: "/mcp.json", role: "评估套件与沙盒安全门禁" },
        { id: "telemetry", name: "全局工作区哨兵", layer: "L7 遥测层", endpoint: "/api/telemetry", role: "实时健康度与安全总线告警" },
      ],
    },
    subdomains: {
      title: "PAI Universe — 实时子域目录中心",
      subtitle: "16 个活跃运行中的 *.axiomid.app 协议服务与工作区入口",
      searchPlaceholder: "搜索子域、协议或能力描述...",
      loopTitle: "生态闭环",
      openInOs: "窗口内打开",
      openExternal: "打开 ↗",
      liveLabel: "在线",
      empty: "未找到匹配的子域。",
    },
  },
  hi: {
    close: "विंडो बंद करें",
    openFullPage: "पूरा पेज खोलें",
    openLiveSubdomain: "लाइव पोर्टल ↗",
    terminal: {
      title: "AI टर्मिनल — Harness Forge",
      subtitle: "harness.axiomid.app · लोकल सत्यापन शेल और सैंडबॉक्स गेट",
      promptPlaceholder: "कमांड लिखें (help, status, truth-check, evals, sandbox, memory, agents, clear)...",
      run: "चलाएं",
      welcome: "AuraOS Harness Forge टर्मिनल तैयार है। `help` लिखें या नीचे दिए बटन दबाएं।",
      evalsLabel: "Harness Forge सूट",
      suites: [
        { title: "Eval सूट", desc: "truth-check, doc-intel और skills.json स्कीमा जांच" },
        { title: "सैंडबॉक्स रनटाइम", desc: "Vercel Sandbox, Cloudflare workerd और QuickJS-WASI" },
        { title: "सत्यापन गेट", desc: "SOUL प्रोटोकॉल Muraqabah और Sidq सुरक्षा जांच" },
        { title: "Centerboard लूप", desc: "24 घंटे की हार्टबीट मॉनिटरिंग" },
      ],
    },
    notes: {
      title: "AI नोट्स — 7-लेयर मेमोरी इंजन",
      subtitle: "memory.axiomid.app · लोकल बायटेम्पोरल नोट्स और मेमोरी सर्च",
      searchPlaceholder: "L1–L7 मेमोरी नोट्स में खोजें...",
      newTitlePlaceholder: "नोट शीर्षक",
      newBodyPlaceholder: "ज्ञान, संदर्भ या एजेंट निर्देश लिखें...",
      addNote: "नोट सहेजें",
      empty: "कोई मिलता-जुलता नोट नहीं मिला। ऊपर नया नोट जोड़ें।",
      matchLabel: "मिलान",
      graphTitle: "7-लेयर मेमोरी आर्किटेक्चर",
    },
    agents: {
      title: "AI एजेंट — सॉवरेन एजेंट कंट्रोल हब",
      subtitle: "AuraOS कंट्रोल प्लेन · लाइव एंडपॉइंट जांच और डैशबोर्ड लिंक",
      openDashboard: "पूरा कंट्रोल सेंटर खोलें",
      openSettings: "सेटिंग्स",
      probeBtn: "लाइव एंडपॉइंट जांचें",
      probing: "जांच जारी...",
      launchTerminal: "AI टर्मिनल खोलें",
      launchNotes: "AI नोट्स खोलें",
      statusReady: "लाइव",
      statusStandby: "तैयार",
      fleet: [
        { id: "pioneer", name: "Pioneer आइडेंटिटी एजेंट", layer: "L1 पहचान", endpoint: "/agent.json", role: "W3C DID और Pi KYC सत्यापन" },
        { id: "eve", name: "Eve 7-लेयर मेमोरी एजेंट", layer: "L5 मेमोरी", endpoint: "/llms.txt", role: "बायटेम्पोरल नोट्स और सिमेंटिक रिकॉल" },
        { id: "harness", name: "Harness Forge वेरिफायर", layer: "L3 हार्नेस", endpoint: "/mcp.json", role: "Eval सूट और सैंडबॉक्स गेट्स" },
        { id: "telemetry", name: "ग्लोबल वर्कस्पेस सेंटिनल", layer: "L7 टेलीमेट्री", endpoint: "/api/telemetry", role: "लाइव हेल्थ और डिफेंस अलर्ट बस" },
      ],
    },
    subdomains: {
      title: "PAI यूनिवर्स — लाइव सबडोमेन निर्देशिका",
      subtitle: "16 सक्रिय *.axiomid.app सेवाएं और प्रोटोकॉल पोर्टल",
      searchPlaceholder: "सबडोमेन या प्रोटोकॉल खोजें...",
      loopTitle: "स्वायत्त लूप",
      openInOs: "विंडो में खोलें",
      openExternal: "खोलें ↗",
      liveLabel: "लाइव",
      empty: "कोई मिलता-जुलता सबडोमेन नहीं मिला।",
    },
  },
};

const NOTES_STORAGE_KEY = "aura.ai_notes";

const DEFAULT_NOTES: AiNote[] = [
  {
    id: "note-l1",
    layer: "L1",
    title: "Sovereign Passport & DID Anchoring",
    content: "All AuraOS agent calls authenticate via scoped AIP tokens — zero raw private keys stored client-side.",
    updatedAt: "2026-11-18",
  },
  {
    id: "note-l3",
    layer: "L3",
    title: "Harness Forge Verification Pipeline",
    content: "truth-check, doc-intel, centerboard heartbeat (<24h), and 4-language EN/AR/ZH/HI parity enforced.",
    updatedAt: "2026-11-18",
  },
  {
    id: "note-l7",
    layer: "L7",
    title: "7-Layer WikiGraph & TrustChain Sync",
    content: "Local notes persist in browser storage and sync cleanly to https://memory.axiomid.app and /memory.",
    updatedAt: "2026-11-18",
  },
];

function loadNotes(): AiNote[] {
  if (typeof window === "undefined") return DEFAULT_NOTES;
  try {
    const raw = window.localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) return DEFAULT_NOTES;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as AiNote[]) : DEFAULT_NOTES;
  } catch {
    return DEFAULT_NOTES;
  }
}

function saveNotes(notes: AiNote[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // Restricted storage mode: keep in-memory state
  }
}

function isDesktopAppId(value: unknown): value is DesktopAppId {
  return value === "terminal" || value === "notes" || value === "agents" || value === "subdomains";
}

export function DesktopWindowManager({
  initialApp = null,
  standalone = false,
}: {
  initialApp?: DesktopAppId | null;
  standalone?: boolean;
} = {}) {
  const { language } = useLanguage();
  const lang: Language = language in COPY ? language : "en";
  const copy = COPY[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [openApps, setOpenApps] = useState<DesktopAppId[]>(() =>
    initialApp ? [initialApp] : [],
  );
  const [activeApp, setActiveApp] = useState<DesktopAppId | null>(initialApp);

  // Terminal state
  const [commandInput, setCommandInput] = useState("");
  const [terminalRunning, setTerminalRunning] = useState(false);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { id: "init", kind: "out", text: copy.terminal.welcome },
  ]);

  // Notes state
  const [notes, setNotes] = useState<AiNote[]>(() => loadNotes());
  const [noteQuery, setNoteQuery] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newLayer, setNewLayer] = useState<AiNote["layer"]>("L3");

  // Agents probe state
  const [probingFleet, setProbingFleet] = useState(false);
  const [fleetStatus, setFleetStatus] = useState<Record<string, { ok: boolean; status: number }>>({});

  // Subdomains directory filter state
  const [subdomainQuery, setSubdomainQuery] = useState("");
  const [subdomainCategory, setSubdomainCategory] = useState<"all" | SubdomainCategory>("all");

  const filteredSubdomains = useMemo(() => {
    const q = subdomainQuery.trim().toLowerCase();
    return SUBDOMAINS_CATALOG.filter((entry) => {
      if (subdomainCategory !== "all" && entry.category !== subdomainCategory) return false;
      if (!q) return true;
      const localized = entry.locales[lang];
      return (
        entry.host.toLowerCase().includes(q) ||
        entry.shortTag.toLowerCase().includes(q) ||
        localized.name.toLowerCase().includes(q) ||
        localized.tagline.toLowerCase().includes(q) ||
        entry.locales.en.name.toLowerCase().includes(q)
      );
    });
  }, [lang, subdomainCategory, subdomainQuery]);

  useEffect(() => {
    emit(BUS_EVENTS.windowState, { openApps, activeApp });
  }, [openApps, activeApp]);

  const openApp = useCallback((id: DesktopAppId) => {
    setOpenApps((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setActiveApp(id);
  }, []);

  useEffect(() => {
    return on<unknown>(BUS_EVENTS.openApp, (payload) => {
      if (!isDesktopAppId(payload)) return;
      openApp(payload);
    });
  }, [openApp]);

  useEffect(() => {
    if (!activeApp || standalone) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveApp(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeApp, standalone]);

  const closeApp = useCallback((id: DesktopAppId) => {
    setOpenApps((prev) => {
      const next = prev.filter((item) => item !== id);
      setActiveApp((current) => (current === id ? next[next.length - 1] ?? null : current));
      return next;
    });
  }, []);

  const appendTerminal = useCallback((entries: Array<Omit<TerminalLine, "id">>) => {
    setTerminalLines((prev) => [
      ...prev.slice(-80),
      ...entries.map((entry, idx) => ({
        ...entry,
        id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      })),
    ]);
  }, []);

  const runTerminalCommand = useCallback(
    async (rawCmd: string) => {
      const cmd = rawCmd.trim().toLowerCase();
      if (!cmd) return;
      setCommandInput("");

      if (cmd === "clear") {
        setTerminalLines([{ id: `clear-${Date.now()}`, kind: "out", text: copy.terminal.welcome }]);
        return;
      }

      appendTerminal([{ kind: "cmd", text: `$ ${rawCmd.trim()}` }]);

      if (cmd === "help") {
        appendTerminal([
          {
            kind: "out",
            text: "Available commands: help, status, truth-check, evals, sandbox, memory, agents, clear",
          },
        ]);
        return;
      }

      if (cmd === "evals") {
        appendTerminal(
          copy.terminal.suites.map((s) => ({ kind: "ok" as const, text: `✓ ${s.title}: ${s.desc}` })),
        );
        return;
      }

      if (cmd === "sandbox") {
        appendTerminal([
          { kind: "out", text: "Vercel Sandbox: npx @vercel/sandbox create --template nextjs" },
          { kind: "out", text: "Cloudflare Workerd: npx wrangler dev --test-scheduled" },
          { kind: "out", text: "QuickJS-WASI: npx quickjs-wasi eval 'console.log(\"hello\")'" },
        ]);
        return;
      }

      if (cmd === "memory") {
        openApp("notes");
        return;
      }

      if (cmd === "agents") {
        openApp("agents");
        return;
      }

      if (cmd === "status" || cmd === "truth-check") {
        setTerminalRunning(true);
        try {
          const targets = ["/api/telemetry", "/llms.txt", "/agent.json", "/mcp.json"];
          const checks = await Promise.all(
            targets.map(async (endpoint) => {
              try {
                const res = await fetch(endpoint, { cache: "no-store" });
                return { endpoint, ok: res.ok, status: res.status };
              } catch {
                return { endpoint, ok: false, status: 0 };
              }
            }),
          );
          appendTerminal(
            checks.map((c) => ({
              kind: c.ok ? ("ok" as const) : ("err" as const),
              text: `${c.ok ? "PASS" : "FAIL"} ${c.endpoint} -> HTTP ${c.status}`,
            })),
          );
        } finally {
          setTerminalRunning(false);
        }
        return;
      }

      appendTerminal([
        {
          kind: "err",
          text: `Unknown command "${rawCmd.trim()}". Type "help" for supported Harness commands.`,
        },
      ]);
    },
    [appendTerminal, copy.terminal.suites, copy.terminal.welcome, openApp],
  );

  const filteredNotes = useMemo(() => {
    const q = noteQuery.trim().toLowerCase();
    if (!q) {
      return notes.map((n) => ({ note: n, score: 100 }));
    }
    const terms = q.split(/\s+/).filter(Boolean);
    return notes
      .map((note) => {
        const hay = `${note.layer} ${note.title} ${note.content}`.toLowerCase();
        const hits = terms.filter((term) => hay.includes(term)).length;
        const score = Math.round((hits / terms.length) * 100);
        return { note, score };
      })
      .filter((entry) => entry.score > 0);
  }, [notes, noteQuery]);

  const handleAddNote = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const title = newTitle.trim();
      const content = newContent.trim();
      if (!title || !content) return;
      const nextNote: AiNote = {
        id: `note-${Date.now()}`,
        layer: newLayer,
        title,
        content,
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      setNotes((prev) => {
        const updated = [nextNote, ...prev];
        saveNotes(updated);
        return updated;
      });
      setNewTitle("");
      setNewContent("");
    },
    [newContent, newLayer, newTitle],
  );

  const handleDeleteNote = useCallback((id: string) => {
    setNotes((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveNotes(updated);
      return updated;
    });
  }, []);

  const probeFleet = useCallback(async () => {
    setProbingFleet(true);
    try {
      const results = await Promise.all(
        copy.agents.fleet.map(async (agent) => {
          try {
            const res = await fetch(agent.endpoint, { cache: "no-store" });
            return [agent.id, { ok: res.ok, status: res.status }] as const;
          } catch {
            return [agent.id, { ok: false, status: 0 }] as const;
          }
        }),
      );
      setFleetStatus(Object.fromEntries(results));
    } finally {
      setProbingFleet(false);
    }
  }, [copy.agents.fleet]);

  if (!activeApp) return null;

  const title =
    activeApp === "terminal"
      ? copy.terminal.title
      : activeApp === "notes"
        ? copy.notes.title
        : activeApp === "subdomains"
          ? copy.subdomains.title
          : copy.agents.title;

  const subtitle =
    activeApp === "terminal"
      ? copy.terminal.subtitle
      : activeApp === "notes"
        ? copy.notes.subtitle
        : activeApp === "subdomains"
          ? copy.subdomains.subtitle
          : copy.agents.subtitle;

  return (
    <section
      dir={dir}
      role={standalone ? "region" : "dialog"}
      aria-modal="false"
      aria-label={title}
      data-testid={`desktop-window-${activeApp}`}
      className={
        standalone
          ? "mx-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-cyan-400/30 bg-[#0b0d15]/95 shadow-[0_24px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
          : "fixed inset-x-4 top-14 bottom-24 z-50 mx-auto flex max-w-4xl flex-col overflow-hidden rounded-2xl border border-cyan-400/30 bg-[#0b0d15]/95 shadow-[0_24px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
      }
    >
      {/* Window Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-black/50 px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
            {activeApp === "terminal" && <Terminal className="h-4 w-4" />}
            {activeApp === "notes" && <NotebookPen className="h-4 w-4" />}
            {activeApp === "agents" && <Bot className="h-4 w-4" />}
            {activeApp === "subdomains" && <Compass className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-mono text-xs font-bold text-white">{title}</h2>
            <p className="truncate font-mono text-[10px] text-white/50">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {standalone && (
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-white/80 hover:bg-white/10"
            >
              <ArrowLeft className="h-3 w-3" />
              AuraOS Desktop
            </Link>
          )}
          {activeApp === "terminal" && !standalone && (
            <>
              <a
                href="/harness"
                className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 font-mono text-[10px] text-cyan-200 hover:bg-cyan-500/20"
              >
                {copy.openFullPage}
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={resolveSubdomainHref("harness")}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-white/70 hover:bg-white/10"
              >
                {copy.openLiveSubdomain}
              </a>
            </>
          )}
          {activeApp === "notes" && !standalone && (
            <>
              <a
                href="/memory"
                className="inline-flex items-center gap-1 rounded-lg border border-purple-400/30 bg-purple-500/10 px-2.5 py-1 font-mono text-[10px] text-purple-200 hover:bg-purple-500/20"
              >
                {copy.openFullPage}
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={resolveSubdomainHref("memory")}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-white/70 hover:bg-white/10"
              >
                {copy.openLiveSubdomain}
              </a>
            </>
          )}
          {activeApp === "subdomains" && (
            <a
              href={resolveSubdomainHref("index")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 font-mono text-[10px] text-cyan-200 hover:bg-cyan-500/20"
            >
              index.axiomid.app
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {activeApp === "agents" && (
            <a
              href="/dashboard"
              className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/30 bg-cyan-500/15 px-2.5 py-1 font-mono text-[10px] text-cyan-200 hover:bg-cyan-500/25"
            >
              {copy.agents.openDashboard}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {!standalone && (
            <button
              type="button"
              onClick={() => closeApp(activeApp)}
              aria-label={copy.close}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* App Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeApp === "terminal" && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {(["help", "status", "truth-check", "evals", "sandbox", "memory", "agents", "clear"] as const).map(
                (preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={terminalRunning}
                    onClick={() => void runTerminalCommand(preset)}
                    className="rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-1 font-mono text-[10px] text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
                  >
                    {preset}
                  </button>
                ),
              )}
            </div>

            <div
              role="log"
              aria-live="polite"
              className="min-h-[180px] max-h-[260px] overflow-y-auto rounded-xl border border-white/10 bg-black/70 p-3 font-mono text-[11px] space-y-1"
            >
              {terminalLines.map((line) => (
                <div
                  key={line.id}
                  className={
                    line.kind === "cmd"
                      ? "text-cyan-300 font-semibold"
                      : line.kind === "ok"
                        ? "text-emerald-300"
                        : line.kind === "err"
                          ? "text-rose-300"
                          : "text-white/75"
                  }
                >
                  {line.id === "init" ? copy.terminal.welcome : line.text}
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void runTerminalCommand(commandInput);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder={copy.terminal.promptPlaceholder}
                aria-label="Harness terminal command"
                className="flex-1 rounded-xl border border-white/15 bg-black/50 px-3 py-2 font-mono text-xs text-white placeholder:text-white/35 focus:border-cyan-400/60 focus:outline-none"
              />
              <button
                type="submit"
                disabled={terminalRunning}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/20 px-3.5 py-2 font-mono text-xs font-semibold text-cyan-200 hover:bg-cyan-500/30 disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5" />
                {copy.terminal.run}
              </button>
            </form>

            <div>
              <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-white/50">
                {copy.terminal.evalsLabel}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {copy.terminal.suites.map((suite) => (
                  <div key={suite.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="font-mono text-xs font-semibold text-amber-300">{suite.title}</div>
                    <div className="mt-1 font-mono text-[10px] text-white/60">{suite.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeApp === "notes" && (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-white/40" />
              <input
                type="search"
                value={noteQuery}
                onChange={(e) => setNoteQuery(e.target.value)}
                placeholder={copy.notes.searchPlaceholder}
                aria-label={copy.notes.searchPlaceholder}
                className="w-full rounded-xl border border-white/15 bg-black/50 pl-9 pr-3 py-2 font-mono text-xs text-white placeholder:text-white/40 focus:border-purple-400/60 focus:outline-none"
              />
            </div>

            <form onSubmit={handleAddNote} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
              <div className="flex flex-wrap gap-2">
                <select
                  value={newLayer}
                  onChange={(e) => setNewLayer(e.target.value as AiNote["layer"])}
                  aria-label="Memory layer"
                  className="rounded-lg border border-white/15 bg-black/70 px-2.5 py-1.5 font-mono text-xs text-purple-200 focus:outline-none"
                >
                  {(["L1", "L2", "L3", "L4", "L5", "L6", "L7"] as const).map((layer) => (
                    <option key={layer} value={layer}>
                      {layer}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={copy.notes.newTitlePlaceholder}
                  className="flex-1 min-w-[180px] rounded-lg border border-white/15 bg-black/50 px-3 py-1.5 font-mono text-xs text-white placeholder:text-white/40 focus:border-purple-400/60 focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg border border-purple-400/40 bg-purple-500/20 px-3 py-1.5 font-mono text-xs font-semibold text-purple-200 hover:bg-purple-500/30"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {copy.notes.addNote}
                </button>
              </div>
              <textarea
                rows={2}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder={copy.notes.newBodyPlaceholder}
                className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 font-mono text-xs text-white placeholder:text-white/40 focus:border-purple-400/60 focus:outline-none"
              />
            </form>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-purple-300">
                <Database className="h-3.5 w-3.5" />
                <span>{copy.notes.graphTitle}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["L1 Episodic", "L2 Working", "L3 Semantic", "L4 Procedural", "L5 Vector", "L6 Graph", "L7 TrustChain"].map(
                  (node) => (
                    <span
                      key={node}
                      className="rounded-md border border-purple-400/20 bg-purple-500/10 px-2 py-0.5 font-mono text-[10px] text-purple-200"
                    >
                      {node}
                    </span>
                  ),
                )}
              </div>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-center font-mono text-xs text-white/50">
                {copy.notes.empty}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {filteredNotes.map(({ note, score }) => (
                  <article
                    key={note.id}
                    className="rounded-xl border border-white/10 bg-black/45 p-3 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded border border-purple-400/30 bg-purple-500/15 px-1.5 py-0.5 font-mono text-[10px] text-purple-200">
                          {note.layer}
                        </span>
                        <h3 className="font-mono text-xs font-semibold text-white">{note.title}</h3>
                        {noteQuery.trim() && (
                          <span className="font-mono text-[10px] text-emerald-300">
                            {copy.notes.matchLabel}: {score}%
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[11px] text-white/70">{note.content}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      aria-label={`Delete ${note.title}`}
                      className="rounded-lg p-1.5 text-white/40 hover:bg-rose-500/15 hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {activeApp === "agents" && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={probingFleet}
                onClick={() => void probeFleet()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/20 px-3 py-2 font-mono text-xs font-semibold text-cyan-200 hover:bg-cyan-500/30 disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5" />
                {probingFleet ? copy.agents.probing : copy.agents.probeBtn}
              </button>
              <button
                type="button"
                onClick={() => openApp("terminal")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 font-mono text-xs text-white/80 hover:bg-white/10"
              >
                <Terminal className="h-3.5 w-3.5" />
                {copy.agents.launchTerminal}
              </button>
              <button
                type="button"
                onClick={() => openApp("notes")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 font-mono text-xs text-white/80 hover:bg-white/10"
              >
                <NotebookPen className="h-3.5 w-3.5" />
                {copy.agents.launchNotes}
              </button>
              <a
                href="/dashboard/settings"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 font-mono text-xs text-white/80 hover:bg-white/10"
              >
                {copy.agents.openSettings}
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {copy.agents.fleet.map((agent) => {
                const probe = fleetStatus[agent.id];
                return (
                  <div key={agent.id} className="rounded-xl border border-white/10 bg-black/45 p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded border border-cyan-400/25 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
                        {agent.layer}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-[10px] ${
                          probe
                            ? probe.ok
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-rose-500/20 text-rose-300"
                            : "bg-white/10 text-white/50"
                        }`}
                      >
                        {probe ? `${probe.ok ? copy.agents.statusReady : "ERR"} (${probe.status})` : copy.agents.statusStandby}
                      </span>
                    </div>
                    <h3 className="font-mono text-xs font-bold text-white">{agent.name}</h3>
                    <p className="font-mono text-[11px] text-white/65">{agent.role}</p>
                    <div className="font-mono text-[10px] text-cyan-400/80">{agent.endpoint}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeApp === "subdomains" && (
          <>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-white/40" />
                <input
                  type="search"
                  value={subdomainQuery}
                  onChange={(e) => setSubdomainQuery(e.target.value)}
                  placeholder={copy.subdomains.searchPlaceholder}
                  aria-label={copy.subdomains.searchPlaceholder}
                  data-testid="subdomains-search-input"
                  className="w-full rounded-xl border border-white/15 bg-black/50 pl-9 pr-3 py-2 font-mono text-xs text-white placeholder:text-white/40 focus:border-cyan-400/60 focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Subdomain categories">
                {(["all", "workspace", "ai-loop", "identity", "protocol"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    data-testid={`subdomain-cat-${cat}`}
                    onClick={() => setSubdomainCategory(cat)}
                    className={`rounded-lg px-2.5 py-1.5 font-mono text-[10px] transition-colors ${
                      subdomainCategory === cat
                        ? "border border-cyan-400/40 bg-cyan-500/20 text-cyan-200"
                        : "border border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {SUBDOMAIN_CATEGORY_LABELS[lang][cat]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-emerald-500/10 to-amber-500/10 px-3 py-2 font-mono text-[10px]">
              <span className="flex items-center gap-1.5 text-cyan-200 font-semibold">
                <LayoutGrid className="h-3.5 w-3.5" />
                {copy.subdomains.loopTitle}
              </span>
              <div className="flex flex-wrap items-center gap-2 text-white/80">
                <a href="https://learn.axiomid.app" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300 underline decoration-white/25">
                  learn.axiomid.app
                </a>
                <span aria-hidden="true">→</span>
                <a href="https://earn.axiomid.app" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 underline decoration-white/25">
                  earn.axiomid.app
                </a>
                <span aria-hidden="true">→</span>
                <a href="https://skills.axiomid.app" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-300 underline decoration-white/25">
                  skills.axiomid.app
                </a>
              </div>
            </div>

            {filteredSubdomains.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-center font-mono text-xs text-white/50">
                {copy.subdomains.empty}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredSubdomains.map((entry) => {
                  const [gStart, gEnd] = entry.gradient;
                  const localized = entry.locales[lang];
                  return (
                    <div
                      key={entry.id}
                      className="group flex flex-col justify-between gap-2 rounded-xl border border-white/10 bg-black/45 p-3 transition-colors hover:border-cyan-400/35"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="rounded-md border border-white/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-white"
                            style={{
                              background: `linear-gradient(135deg, ${gStart}33 0%, ${gEnd}22 100%)`,
                            }}
                          >
                            {entry.shortTag}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[9px] text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            {copy.subdomains.liveLabel}
                          </span>
                        </div>
                        <h3 className="font-mono text-xs font-bold text-white">{localized.name}</h3>
                        <p className="font-mono text-[11px] text-white/65 leading-relaxed">{localized.tagline}</p>
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2">
                        <span className="truncate font-mono text-[10px] text-cyan-300/80">{entry.host}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {entry.windowApp && (
                            <button
                              type="button"
                              onClick={() => openApp(entry.windowApp!)}
                              className="rounded-lg border border-cyan-400/30 bg-cyan-500/15 px-2 py-1 font-mono text-[10px] text-cyan-200 hover:bg-cyan-500/25"
                            >
                              {copy.subdomains.openInOs}
                            </button>
                          )}
                          <a
                            href={resolveSubdomainHref(entry.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1 font-mono text-[10px] text-white/85 hover:bg-white/15"
                          >
                            {copy.subdomains.openExternal}
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
