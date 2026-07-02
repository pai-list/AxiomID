"use client";

import { useState, useMemo } from "react";
import { Package } from "lucide-react";
import { useLanguage } from "@/app/context/language-context";

const TIER_LABEL_KEYS: Record<string, string> = {
  BASIC_TOOL: "tier_basic_tool",
  ADVANCED_TOOL: "tier_advanced_tool",
  ADVANCED_INFRASTRUCTURE: "tier_advanced_infrastructure",
  PRO: "tier_pro",
  SOVEREIGN: "tier_sovereign",
};

interface PublishSkillFormProps {
  onPublished: () => void;
}

const MANIFEST_FIELDS = [
  { key: "purpose", label: "PURPOSE", arLabel: "الغرض", header: "## الغرض — Purpose", placeholder: "What does this skill do? 1-2 sentences." },
  { key: "soulAlignment", label: "SOUL ALIGNMENT", arLabel: "التوافق الروحي", header: "## التوافق الروحي — SOUL Alignment", placeholder: "Which SOUL principle does this skill serve? Vigilance, Correction, Ledger, Triad, Septet, Compounding." },
  { key: "operationalFlow", label: "OPERATIONAL FLOW", arLabel: "سير التشغيل", header: "## سير التشغيل — Operational Flow", placeholder: "1. Step one\n2. Step two\n3. Step three" },
  { key: "failureModes", label: "FAILURE MODES", arLabel: "أنماط الفشل", header: "## أنماط الفشل — Failure Modes", placeholder: "| Mode | Detection | Recovery |" },
] as const;

/**
 * Combines the required manifest sections into Markdown.
 *
 * @param sections - Section content keyed by manifest field name
 * @returns The manifest Markdown built from each required section in order
 */
function buildManifest(sections: Record<string, string>): string {
  return MANIFEST_FIELDS.map(f => `${f.header}\n${sections[f.key] || ''}`).join('\n\n');
}

/**
 * Renders the skill publishing form.
 *
 * @param onPublished - Called after the skill is published successfully.
 */
export function PublishSkillForm({ onPublished }: PublishSkillFormProps) {
  const { t, language } = useLanguage();
  const [form, setForm] = useState({
    slug: "",
    name: "",
    description: "",
    manifestSections: Object.fromEntries(MANIFEST_FIELDS.map(f => [f.key, ""])),
    agentScript: "",
    testSuite: "",
    tier: "BASIC_TOOL",
    pricePi: 0,
    version: "1.0.0",
  });
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  const manifestMd = useMemo(() => buildManifest(form.manifestSections), [form.manifestSections]);

  const sectionEmpty = (key: string) => {
    const body = form.manifestSections[key];
    if (!body) return true;
    let withoutComments = body;
    let previous: string;
    do {
      previous = withoutComments;
      withoutComments = withoutComments.replace(/<!--[\s\S]*?-->/g, '');
    } while (withoutComments !== previous);
    const stripped = withoutComments.trim();
    if (!stripped) return true;
    if (body.includes('<!--') && body.lastIndexOf('<!--') > body.lastIndexOf('-->')) return true;
    if (/TODO:|TBD|<fill in>/.test(stripped) || /^\s*\.\.\.\s*$/.test(stripped)) return true;
    return false;
  };

  const handlePublish = async () => {
    if (!form.slug || !form.name) {
      setError(language === "ar" ? "المعرف والاسم مطلوبان" : "slug and name are required");
      return;
    }
    const emptySections = MANIFEST_FIELDS.filter(f => sectionEmpty(f.key));
    if (emptySections.length > 0) {
      const labels = emptySections.map(f => language === "ar" ? f.arLabel : f.label).join(', ');
      setError(language === "ar" ? `الأقسام المطلوبة: ${labels}` : `Required sections: ${labels}`);
      return;
    }
    setPublishing(true);
    setError("");
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          manifestSections: undefined,
          manifestMd,
        }),
      });
      if (res.ok) {
        onPublished();
      } else {
        const data = await res.json();
        setError(data.error || (language === "ar" ? "فشل في نشر المهارة" : "Failed to publish skill"));
      }
    } catch {
      setError(language === "ar" ? "خطأ في الشبكة" : "Network error");
    } finally {
      setPublishing(false);
    }
  };

  const updateSection = (key: string, value: string) => {
    setForm(prev => ({
      ...prev,
      manifestSections: { ...prev.manifestSections, [key]: value },
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bento-card p-6">
        <h2 className="text-lg font-bold text-surface font-mono mb-2 flex items-center">
          <Package className="w-5 h-5 text-emerald-400 inline me-2" />
          {t("marketplace_publish_title")}
        </h2>
        <p className="text-xs text-subtle mb-6">
          {t("marketplace_publish_desc")}
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="skill-slug" className="text-[10px] font-mono block mb-1" style={{ color: "var(--text-muted)" }}>
                {t("marketplace_slug")}
              </label>
              <input
                id="skill-slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="my-skill-name"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-surface font-mono focus:outline-none focus:border-neon-green/40"
              />
            </div>
            <div>
              <label htmlFor="skill-name" className="text-[10px] font-mono block mb-1" style={{ color: "var(--text-muted)" }}>
                {t("marketplace_name")}
              </label>
              <input
                id="skill-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="My Skill Name"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-surface font-mono focus:outline-none focus:border-neon-green/40"
              />
            </div>
          </div>

          <div>
            <label htmlFor="skill-description" className="text-[10px] font-mono block mb-1" style={{ color: "var(--text-muted)" }}>
              {t("marketplace_description")}
            </label>
            <input
              id="skill-description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={language === "ar" ? "وصف قصير لما تفعله هذه المهارة" : "Short description of what this skill does"}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-surface font-mono focus:outline-none focus:border-neon-green/40"
            />
          </div>

          {/* Manifest Sectioned Editor */}
          <div className="space-y-3">
            <label className="text-[10px] font-mono block" style={{ color: "var(--text-muted)" }}>
              {t("marketplace_manifest_sections")}
            </label>
            {MANIFEST_FIELDS.map(field => (
              <div key={field.key}>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor={`manifest-${field.key}`} className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                    {language === "en" ? field.label : field.arLabel}
                  </label>
                  {sectionEmpty(field.key) ? (
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  )}
                </div>
                <textarea
                  id={`manifest-${field.key}`}
                  value={form.manifestSections[field.key]}
                  onChange={(e) => updateSection(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={field.key === "operationalFlow" || field.key === "failureModes" ? 4 : 2}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-surface font-mono focus:outline-none focus:border-neon-green/40 resize-none placeholder:text-white/20"
                />
              </div>
            ))}
          </div>

          <div>
            <label htmlFor="skill-script" className="text-[10px] font-mono block mb-1" style={{ color: "var(--text-muted)" }}>
              {t("marketplace_script_title")}
            </label>
            <textarea
              id="skill-script"
              value={form.agentScript}
              onChange={(e) => setForm({ ...form, agentScript: e.target.value })}
              placeholder={`export async function runSkill(context) {\n  // Agent logic here\n  return { success: true };\n}`}
              rows={6}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-electric-blue font-mono focus:outline-none focus:border-neon-green/40 resize-none"
            />
          </div>

          <div>
            <label htmlFor="skill-tests" className="text-[10px] font-mono block mb-1" style={{ color: "var(--text-muted)" }}>
              {t("marketplace_test_suite")}
            </label>
            <textarea
              id="skill-tests"
              value={form.testSuite}
              onChange={(e) => setForm({ ...form, testSuite: e.target.value })}
              placeholder={`describe('my-skill', () => {\n  it('should do something', () => {\n    expect(true).toBe(true);\n  });\n});`}
              rows={4}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-amber-400 font-mono focus:outline-none focus:border-neon-green/40 resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="skill-tier" className="text-[10px] font-mono block mb-1" style={{ color: "var(--text-muted)" }}>{t("tier")}</label>
              <select
                id="skill-tier"
                value={form.tier}
                onChange={(e) => setForm({ ...form, tier: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-surface font-mono focus:outline-none"
              >
                {Object.entries(TIER_LABEL_KEYS).map(([k, v]) => (
                  <option key={k} value={k}>{t(v)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="skill-price" className="text-[10px] font-mono block mb-1" style={{ color: "var(--text-muted)" }}>{t("marketplace_price")}</label>
              <input
                id="skill-price"
                type="number"
                value={form.pricePi}
                onChange={(e) => setForm({ ...form, pricePi: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-surface font-mono focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="skill-version" className="text-[10px] font-mono block mb-1" style={{ color: "var(--text-muted)" }}>{t("marketplace_version")}</label>
              <input
                id="skill-version"
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-surface font-mono focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
              {error}
            </div>
          )}

          <button
            onClick={handlePublish}
            disabled={publishing || !form.slug || !form.name || MANIFEST_FIELDS.some(f => sectionEmpty(f.key))}
            className="w-full btn-primary py-3 text-xs font-mono disabled:opacity-50"
          >
            {publishing ? t("marketplace_publishing") : t("marketplace_publish_submit_btn")}
          </button>
        </div>
      </div>
    </div>
  );
}
