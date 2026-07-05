"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/app/context/wallet-context";

/**
 * Memory tab — IQRA mesh placeholder (full implementation in PR 2).
 * Trust history SVG chart placeholder.
 * Skills node list (fetched from /api/skills).
 */
export function MemoryTab() {
  const { user } = useWallet();
  const [skillNodes, setSkillNodes] = useState<Array<{ name: string; tier: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/skills?limit=10", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { skills: [] }))
      .then((json) => {
        setSkillNodes(json?.skills ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="space-y-5">
      {/* IQRA Mesh — placeholder for PR 2 D3.js component */}
      <div className="bento-card p-5 min-h-[300px] flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full border border-axiom-purple/20 bg-axiom-purple/5 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-axiom-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="3" />
            <circle cx="5" cy="6" r="2" />
            <circle cx="19" cy="6" r="2" />
            <circle cx="5" cy="18" r="2" />
            <circle cx="19" cy="18" r="2" />
            <line x1="9.5" y1="10.5" x2="6.5" y2="7.5" />
            <line x1="14.5" y1="10.5" x2="17.5" y2="7.5" />
            <line x1="9.5" y1="13.5" x2="6.5" y2="16.5" />
            <line x1="14.5" y1="13.5" x2="17.5" y2="16.5" />
          </svg>
        </div>
        <h3 className="text-xs font-mono text-axiom-purple mb-2">IQRA Neural Mesh</h3>
        <p className="text-[10px] font-mono text-zinc-500 text-center">
          Interactive knowledge graph coming in PR 2
        </p>
      </div>

      {/* Trust history — SVG chart placeholder */}
      <div className="bento-card p-5 min-h-[200px]">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-zinc-400 mb-4">
          Trust History
        </h3>
        <div className="flex items-center justify-center h-32">
          <p className="text-[10px] font-mono text-zinc-500">
            Trust history chart coming in PR 2
          </p>
        </div>
      </div>

      {/* Dynamic skill nodes — fetched from API */}
      <div className="bento-card p-5">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-zinc-400 mb-4">
          Skill Nodes
        </h3>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-3 bg-white/5 rounded animate-pulse w-2/3" />
            ))}
          </div>
        ) : skillNodes.length === 0 ? (
          <p className="text-xs font-mono text-zinc-500 text-center py-2">No skills installed</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skillNodes.map((skill, i) => (
              <span
                key={i}
                className="px-2 py-1 rounded-md text-[10px] font-mono border border-white/5 bg-white/[0.02] text-zinc-400"
              >
                {skill.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
