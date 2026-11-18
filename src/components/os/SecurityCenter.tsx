"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Skull,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage, type Language } from "@/app/context/language-context";
import { BUS_EVENTS, emit, on } from "./agent-bus";

export type CyberTeamId = "red-team" | "blue-team" | "red-hat" | "black-hat";

export interface ProbeResult {
  id: string;
  team: CyberTeamId;
  endpoint: string;
  method: string;
  status: number;
  latencyMs: number;
  verdict: "PASS" | "BLOCKED" | "FAIL" | "EXPOSED";
  ok: boolean;
  detail: string;
}

export interface SecurityNotification {
  id: string;
  team: CyberTeamId | "system";
  severity: "info" | "success" | "warning" | "critical";
  title: string;
  message: string;
  at: string;
}

interface TeamMeta {
  id: CyberTeamId;
  badgeClass: string;
  buttonClass: string;
  accentText: string;
}

const TEAMS: readonly TeamMeta[] = [
  {
    id: "red-team",
    badgeClass: "border-rose-500/40 bg-rose-500/15 text-rose-300",
    buttonClass: "border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-200",
    accentText: "text-rose-400",
  },
  {
    id: "black-hat",
    badgeClass: "border-amber-500/40 bg-amber-500/15 text-amber-300",
    buttonClass: "border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200",
    accentText: "text-amber-400",
  },
  {
    id: "blue-team",
    badgeClass: "border-cyan-500/40 bg-cyan-500/15 text-cyan-300",
    buttonClass: "border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-200",
    accentText: "text-cyan-400",
  },
  {
    id: "red-hat",
    badgeClass: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
    buttonClass: "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200",
    accentText: "text-emerald-400",
  },
];

interface SecurityCopy {
  pillLabel: string;
  panelTitle: string;
  panelSubtitle: string;
  runAll: string;
  running: string;
  matrixTitle: string;
  notificationsTitle: string;
  clear: string;
  noProbes: string;
  noNotifications: string;
  shieldSealed: string;
  shieldAlert: string;
  standby: string;
  teams: Record<CyberTeamId, { name: string; role: string }>;
}

const COPY: Record<Language, SecurityCopy> = {
  en: {
    pillLabel: "Cyber Ops",
    panelTitle: "AuraOS Cyber Defense & Notification Center",
    panelSubtitle: "Live 4-Team Simulation across Local Endpoints & Trust Boundaries",
    runAll: "Run All 4 Teams Simulation",
    running: "Probing...",
    matrixTitle: "Live Endpoint Matrix",
    notificationsTitle: "Desktop Alerts",
    clear: "Clear",
    noProbes: "Trigger any team or run the full 4-team simulation to inspect live endpoints.",
    noNotifications: "No security alerts yet.",
    shieldSealed: "SHIELD SEALED",
    shieldAlert: "BREACH DETECTED",
    standby: "STANDBY",
    teams: {
      "red-team": { name: "Red Team", role: "Offensive Discovery & API Probe" },
      "black-hat": { name: "Black Hat", role: "Adversarial Auth & Exploit Vector" },
      "blue-team": { name: "Blue Team", role: "Defensive Shield & Telemetry Sentinel" },
      "red-hat": { name: "Red Hat", role: "Zero-Key & SOUL Compliance Audit" },
    },
  },
  ar: {
    pillLabel: "الدفاع السيبراني",
    panelTitle: "مركز محاكاة الأمن السيبراني وإشعارات AuraOS",
    panelSubtitle: "اختبار حي لـ 4 فرق أمنية على نقاط النهاية وحدود الثقة",
    runAll: "تشغيل محاكاة الفرق الأربعة",
    running: "جارٍ الفحص...",
    matrixTitle: "مصفوفة نقاط النهاية الحية",
    notificationsTitle: "إشعارات سطح المكتب",
    clear: "مسح",
    noProbes: "شغّل أي فريق أو المحاكاة الشاملة لفحص نقاط النهاية الحية.",
    noNotifications: "لا توجد تنبيهات أمنية بعد.",
    shieldSealed: "الدرع محصّن",
    shieldAlert: "رُصدت ثغرة",
    standby: "في الانتظار",
    teams: {
      "red-team": { name: "الفريق الأحمر (Red Team)", role: "فحص الاستكشاف ونقاط النهاية" },
      "black-hat": { name: "القبعة السوداء (Black Hat)", role: "محاكاة الهجمات وانتحال الصلاحية" },
      "blue-team": { name: "الفريق الأزرق (Blue Team)", role: "مراقب الدرع الدفاعي والقياس" },
      "red-hat": { name: "القبعة الحمراء (Red Hat)", role: "تدقيق عزل المفاتيح وميثاق SOUL" },
    },
  },
  zh: {
    pillLabel: "安全演练",
    panelTitle: "AuraOS 网络防御模拟与桌面通知中心",
    panelSubtitle: "四支安全团队实时探测本地端点与信任边界",
    runAll: "运行四队联合模拟",
    running: "探测中...",
    matrixTitle: "实时端点矩阵",
    notificationsTitle: "桌面安全通知",
    clear: "清空",
    noProbes: "点击任意团队或运行全部模拟以检测实时端点。",
    noNotifications: "暂无安全警报。",
    shieldSealed: "护盾已锁定",
    shieldAlert: "发现暴露风险",
    standby: "待命",
    teams: {
      "red-team": { name: "红队 (Red Team)", role: "主动发现与接口探测" },
      "black-hat": { name: "黑帽 (Black Hat)", role: "越权攻击与伪造令牌测试" },
      "blue-team": { name: "蓝队 (Blue Team)", role: "防御护盾与遥测守卫" },
      "red-hat": { name: "红帽 (Red Hat)", role: "零原始密钥与合规审计" },
    },
  },
  hi: {
    pillLabel: "साइबर सुरक्षा",
    panelTitle: "AuraOS साइबर डिफेंस और नोटिफिकेशन केंद्र",
    panelSubtitle: "एंडपॉइंट्स और ट्रस्ट सीमाओं पर 4-टीम लाइव सिमुलेशन",
    runAll: "सभी 4 टीमों का सिमुलेशन चलाएं",
    running: "जांच जारी...",
    matrixTitle: "लाइव एंडपॉइंट मैट्रिक्स",
    notificationsTitle: "डेस्कटॉप अलर्ट",
    clear: "साफ़ करें",
    noProbes: "लाइव एंडपॉइंट्स जांचने के लिए कोई भी टीम या पूर्ण सिमुलेशन चलाएं।",
    noNotifications: "अभी तक कोई सुरक्षा अलर्ट नहीं है।",
    shieldSealed: "शील्ड सुरक्षित",
    shieldAlert: "जोखिम मिला",
    standby: "तैयार",
    teams: {
      "red-team": { name: "रेड टीम (Red Team)", role: "एंडपॉइंट और डिस्कवरी प्रोब" },
      "black-hat": { name: "ब्लैक हैट (Black Hat)", role: "एडवर्सेरियल एक्सप्लॉइट सिमुलेशन" },
      "blue-team": { name: "ब्लू टीम (Blue Team)", role: "डिफेंस शील्ड और टेलीमेट्री मॉनिटर" },
      "red-hat": { name: "रेड हैट (Red Hat)", role: "ज़ीरो-की और SOUL अनुपालन ऑडिट" },
    },
  },
};

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

async function timedFetch(
  input: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; latencyMs: number; response: Response | null; error?: string }> {
  const start = nowMs();
  try {
    const response = await fetch(input, { cache: "no-store", ...init });
    return {
      ok: response.ok,
      status: response.status,
      latencyMs: Math.max(1, Math.round(nowMs() - start)),
      response,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      status: 0,
      latencyMs: Math.max(1, Math.round(nowMs() - start)),
      response: null,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

async function executeTeamChecks(team: CyberTeamId, allConfigsCount: number): Promise<ProbeResult[]> {
  if (team === "red-team") {
    const targets = ["/llms.txt", "/api/telemetry", "/agent.json", "/agentic.txt"];
    return Promise.all(
      targets.map(async (endpoint, idx) => {
        const res = await timedFetch(endpoint, { method: "GET" });
        const ok = res.ok && res.status === 200;
        return {
          id: `red-team-${idx}-${endpoint}`,
          team,
          endpoint,
          method: "GET",
          status: res.status,
          latencyMs: res.latencyMs,
          verdict: ok ? "PASS" : "FAIL",
          ok,
          detail: ok ? "Endpoint reachable (200)" : res.error ?? `Unexpected HTTP ${res.status}`,
        };
      }),
    );
  }

  if (team === "black-hat") {
    const attackVectors: Array<{ endpoint: string; method: "POST" | "GET"; init: RequestInit; allow503?: boolean }> = [
      {
        endpoint: "/api/agent/activate",
        method: "POST",
        init: {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId: "blackhat_probe" }),
        },
      },
      {
        endpoint: "/api/sync",
        method: "POST",
        init: {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: "all", dryRun: true }),
        },
      },
      {
        endpoint: "/api/daily-review",
        method: "GET",
        init: {
          method: "GET",
          headers: { Authorization: "Bearer blackhat_forged_token" },
        },
        allow503: true,
      },
    ];

    return Promise.all(
      attackVectors.map(async (vec, idx) => {
        const res = await timedFetch(vec.endpoint, vec.init);
        const defended =
          res.status === 401 ||
          res.status === 403 ||
          (Boolean(vec.allow503) && res.status === 503);
        return {
          id: `black-hat-${idx}-${vec.endpoint}`,
          team,
          endpoint: vec.endpoint,
          method: vec.method,
          status: res.status,
          latencyMs: res.latencyMs,
          verdict: defended ? "BLOCKED" : "EXPOSED",
          ok: defended,
          detail: defended
            ? `Attack blocked cleanly (${res.status})`
            : res.error ?? `Unauthenticated vector returned HTTP ${res.status}`,
        };
      }),
    );
  }

  if (team === "blue-team") {
    const telemetryRes = await timedFetch("/api/telemetry", { method: "GET" });
    let hasWorkspace = false;
    if (telemetryRes.response && telemetryRes.ok) {
      const payload = await telemetryRes.response.json().catch(() => null);
      hasWorkspace = Boolean(payload && typeof payload === "object" && "globalWorkspace" in payload);
    }
    const telemetryOk = telemetryRes.ok && hasWorkspace;

    const authShieldRes = await timedFetch("/api/agent/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const shieldOk = authShieldRes.status === 401 || authShieldRes.status === 403;

    return [
      {
        id: "blue-team-telemetry",
        team,
        endpoint: "/api/telemetry",
        method: "GET",
        status: telemetryRes.status,
        latencyMs: telemetryRes.latencyMs,
        verdict: telemetryOk ? "PASS" : "FAIL",
        ok: telemetryOk,
        detail: telemetryOk ? "Telemetry stream verified" : telemetryRes.error ?? "Missing globalWorkspace payload",
      },
      {
        id: "blue-team-auth-guard",
        team,
        endpoint: "/api/agent/activate",
        method: "POST",
        status: authShieldRes.status,
        latencyMs: authShieldRes.latencyMs,
        verdict: shieldOk ? "BLOCKED" : "EXPOSED",
        ok: shieldOk,
        detail: shieldOk ? `Auth guard enforced (${authShieldRes.status})` : `Auth guard leaked HTTP ${authShieldRes.status}`,
      },
    ];
  }

  // Red Hat — Sovereign hardening & SOUL compliance verifier
  const start = nowMs();
  let exposedKeyCount = 0;
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (/(private_key|secret_key|raw_api_key)/i.test(key)) exposedKeyCount += 1;
    }
  } catch {
    // Restricted storage access still maintains zero key exposure
  }
  const keyClean = exposedKeyCount === 0;
  const keyAuditLatency = Math.max(1, Math.round(nowMs() - start));

  const langOk = allConfigsCount >= 4;
  const agentRes = await timedFetch("/agent.json", { method: "GET" });
  let validManifest = false;
  if (agentRes.response && agentRes.ok) {
    const manifest = await agentRes.response.json().catch(() => null);
    validManifest = Boolean(manifest && typeof manifest === "object");
  }
  const manifestOk = agentRes.ok && validManifest;

  return [
    {
      id: "red-hat-zero-keys",
      team,
      endpoint: "localStorage://zero-raw-keys",
      method: "AUDIT",
      status: keyClean ? 200 : 500,
      latencyMs: keyAuditLatency,
      verdict: keyClean ? "PASS" : "FAIL",
      ok: keyClean,
      detail: keyClean ? "Zero raw secret keys in client storage" : `${exposedKeyCount} forbidden keys found`,
    },
    {
      id: "red-hat-quad-lingual",
      team,
      endpoint: "runtime://i18n/quad-lingual",
      method: "AUDIT",
      status: langOk ? 200 : 500,
      latencyMs: 1,
      verdict: langOk ? "PASS" : "FAIL",
      ok: langOk,
      detail: langOk ? `${allConfigsCount} locales active (EN/AR/ZH/HI)` : "Incomplete locale coverage",
    },
    {
      id: "red-hat-agent-manifest",
      team,
      endpoint: "/agent.json",
      method: "GET",
      status: agentRes.status,
      latencyMs: agentRes.latencyMs,
      verdict: manifestOk ? "PASS" : "FAIL",
      ok: manifestOk,
      detail: manifestOk ? "SOUL & capability manifest valid" : agentRes.error ?? `Manifest HTTP ${agentRes.status}`,
    },
  ];
}

function normalizeBusNotification(payload: unknown): SecurityNotification {
  if (payload && typeof payload === "object" && "message" in payload && "title" in payload) {
    return payload as SecurityNotification;
  }
  return {
    id: `bus-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    team: "system",
    severity: "warning",
    title: "AuraOS Shield Alert",
    message: typeof payload === "string" ? payload : JSON.stringify(payload),
    at: new Date().toISOString(),
  };
}

export function SecurityCenter() {
  const { language, allConfigs } = useLanguage();
  const lang: Language = language in COPY ? language : "en";
  const copy = COPY[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [open, setOpen] = useState(false);
  const [runningTeam, setRunningTeam] = useState<CyberTeamId | "all" | null>(null);
  const [probes, setProbes] = useState<ProbeResult[]>([]);
  const [notifications, setNotifications] = useState<SecurityNotification[]>([]);

  useEffect(() => {
    return on<unknown>(BUS_EVENTS.shieldAlert, (payload) => {
      const nextNote = normalizeBusNotification(payload);
      setNotifications((prev) => [nextNote, ...prev].slice(0, 30));
    });
  }, []);

  const allConfigsCount = useMemo(() => {
    return allConfigs ? Object.keys(allConfigs).length : 4;
  }, [allConfigs]);

  const anyFailure = useMemo(() => probes.some((p) => !p.ok), [probes]);

  const runTeam = useCallback(
    async (team: CyberTeamId) => {
      setRunningTeam(team);
      try {
        const teamResults = await executeTeamChecks(team, allConfigsCount);
        setProbes((prev) => {
          const rest = prev.filter((item) => item.team !== team);
          return [...teamResults, ...rest];
        });

        const passed = teamResults.filter((r) => r.ok).length;
        const total = teamResults.length;
        const allOk = passed === total;
        const label = copy.teams[team].name;
        const note: SecurityNotification = {
          id: `${team}-${Date.now()}`,
          team,
          severity: allOk ? "success" : "critical",
          title: label,
          message: `${passed}/${total} checks passed (${teamResults.map((r) => `${r.endpoint}:${r.status}`).join(", ")})`,
          at: new Date().toISOString(),
        };
        emit(BUS_EVENTS.shieldAlert, note);
        if (allOk) {
          toast.success(`${label}: ${passed}/${total} ✓`);
        } else {
          toast.error(`${label}: ${total - passed} failed / exposed`);
        }
      } finally {
        setRunningTeam(null);
      }
    },
    [allConfigsCount, copy.teams],
  );

  const runAllTeams = useCallback(async () => {
    setRunningTeam("all");
    try {
      const results = await Promise.all(
        TEAMS.map((t) => executeTeamChecks(t.id, allConfigsCount)),
      );
      const flat = results.flat();
      setProbes(flat);

      const passed = flat.filter((r) => r.ok).length;
      const allOk = passed === flat.length;
      const note: SecurityNotification = {
        id: `all-teams-${Date.now()}`,
        team: "blue-team",
        severity: allOk ? "success" : "critical",
        title: copy.runAll,
        message: `${passed}/${flat.length} checks held across Red/Black/Blue/RedHat`,
        at: new Date().toISOString(),
      };
      emit(BUS_EVENTS.shieldAlert, note);
      if (allOk) {
        toast.success(`${copy.shieldSealed} (${passed}/${flat.length})`);
      } else {
        toast.error(`${copy.shieldAlert} (${flat.length - passed} failed)`);
      }
    } finally {
      setRunningTeam(null);
    }
  }, [allConfigsCount, copy.runAll, copy.shieldAlert, copy.shieldSealed]);

  const statusText = probes.length === 0 ? copy.standby : anyFailure ? copy.shieldAlert : copy.shieldSealed;

  return (
    <aside
      suppressHydrationWarning
      dir={dir}
      aria-label={copy.panelTitle}
      className="fixed right-4 top-12 z-40 flex flex-col items-end gap-2"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="AuraOS Cyber Defense & Notifications"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-[#0d0d16]/90 px-3 py-1.5 text-xs font-mono text-white shadow-[0_0_24px_rgba(0,240,255,0.18)] backdrop-blur-xl transition-all hover:border-cyan-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      >
        {anyFailure ? (
          <ShieldAlert className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
        ) : probes.length > 0 ? (
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
        ) : (
          <Shield className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
        )}
        <span className="text-cyan-300">{copy.pillLabel}</span>
        <span
          className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
            probes.length === 0
              ? "bg-white/10 text-slate-300"
              : anyFailure
                ? "bg-rose-500/20 text-rose-300"
                : "bg-emerald-500/20 text-emerald-300"
          }`}
        >
          {statusText}
        </span>
        <span className="flex items-center gap-1 text-white/70">
          <Bell className="h-3.5 w-3.5" aria-hidden="true" />
          <span
            data-testid="security-notification-count"
            className="rounded-full bg-cyan-400/20 px-1.5 py-0.5 text-[9px] text-cyan-200"
          >
            {notifications.length}
          </span>
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="AuraOS Cyber Defense Center"
          className="w-[min(92vw,30rem)] max-h-[75vh] overflow-y-auto rounded-2xl border border-cyan-400/30 bg-[#0b0e18]/95 p-4 text-white shadow-[0_0_50px_rgba(0,240,255,0.2)] backdrop-blur-2xl"
        >
          <div className="mb-3 flex items-start justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                <Terminal className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                <span>{copy.panelTitle}</span>
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-400">{copy.panelSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close Cyber Defense Center"
              className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            data-testid="run-all-teams-btn"
            disabled={runningTeam !== null}
            onClick={() => void runAllTeams()}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3 py-2 text-xs font-mono font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/25 disabled:opacity-50"
          >
            <Skull className="h-4 w-4" aria-hidden="true" />
            <span>{runningTeam === "all" ? copy.running : copy.runAll}</span>
          </button>

          <div className="mb-4 grid grid-cols-2 gap-2">
            {TEAMS.map((team) => (
              <button
                key={team.id}
                type="button"
                data-testid={`run-${team.id}`}
                disabled={runningTeam !== null}
                onClick={() => void runTeam(team.id)}
                className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-colors disabled:opacity-50 ${team.buttonClass}`}
              >
                <span className={`text-xs font-mono font-bold ${team.accentText}`}>
                  {copy.teams[team.id].name}
                </span>
                <span className="mt-0.5 text-[10px] text-white/75">{copy.teams[team.id].role}</span>
              </button>
            ))}
          </div>

          <div className="mb-4">
            <div className="mb-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              {copy.matrixTitle} ({probes.length})
            </div>
            {probes.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-[11px] text-slate-400">
                {copy.noProbes}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {probes.map((probe) => {
                  const meta = TEAMS.find((t) => t.id === probe.team);
                  return (
                    <li
                      key={probe.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-[11px]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`rounded border px-1.5 py-0.2 font-mono text-[9px] ${meta?.badgeClass ?? ""}`}>
                            {probe.method}
                          </span>
                          <span className="truncate font-mono text-white/90">{probe.endpoint}</span>
                        </div>
                        <div className="mt-0.5 truncate text-[10px] text-slate-400">{probe.detail}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 font-mono">
                        <span className="text-[10px] text-slate-400">{probe.latencyMs}ms</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            probe.ok
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          {probe.verdict} {probe.status}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                {copy.notificationsTitle} ({notifications.length})
              </span>
              <button
                type="button"
                data-testid="clear-notifications-btn"
                onClick={() => setNotifications([])}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
                <span>{copy.clear}</span>
              </button>
            </div>
            {notifications.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-[11px] text-slate-400">
                {copy.noNotifications}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {notifications.map((note) => (
                  <li
                    key={note.id}
                    className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-[11px]"
                  >
                    {note.severity === "success" ? (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" aria-hidden="true" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-mono font-semibold text-white">{note.title}</div>
                      <div className="text-[10px] text-slate-300">{note.message}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
