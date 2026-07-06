"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AgentPassport } from "@/components/AgentPassport";
import { AgentQR } from "@/components/AgentQR";
import Link from "next/link";
import { useLanguage } from "../../context/language-context";
import { sharePassport } from "@/lib/pi-native-features";
import type { PassportStamp } from "@/components/passport/types";
import { CheckCircle2, Loader2 } from "lucide-react";

interface PassportData {
  username: string;
  walletAddress: string | null;
  stellarAddress?: string | null;
  did: string;
  tier: string;
  xp: number;
  trustScore: number;
  kyaStatus: "verified" | "pending" | "denied";
  kycStatus: "verified" | "pending" | "denied";
  stamps?: PassportStamp[];
  issuedDate: string;
  agentName: string | null;
  agentStatus: string | null;
  jobStatus?: string; // Inject IdentityJob status if still building
}

export function PassportView() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const [passport, setPassport] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    await sharePassport({
      title: t("share_title"),
      text: t("share_text"),
      url: window.location.href,
    });
  };

  useEffect(() => {
    if (!slug) return;

    let pollTimeout: NodeJS.Timeout;
    let cancelled = false;

    const fetchPassport = async () => {
      try {
        const res = await fetch(`/api/passport/${encodeURIComponent(slug)}`);
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.message || 'translated_passport_not_found');
        }
        const data = await res.json();
        if (cancelled) return;
        setPassport(data);
        setLoading(false);

        // If the identity is still being built, keep polling
        if (data.jobStatus && data.jobStatus !== "COMPLETED" && data.jobStatus !== "ACTIVE") {
           pollTimeout = setTimeout(fetchPassport, 3000) as unknown as NodeJS.Timeout;
        }

      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : t('passport_load_error'));
        setLoading(false);
      }
    };

    fetchPassport();

    return () => {
        cancelled = true;
        if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [slug, t]);

  if (loading) {
     return (
        <div className="w-full max-w-lg flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-10 h-10 text-electric-blue animate-spin mb-4" />
            <p className="text-zinc-400 font-mono text-sm animate-pulse">{t('loading_identity')}</p>
        </div>
     );
  }

  // Identity is still being built
  if (passport && passport.jobStatus && passport.jobStatus !== "COMPLETED" && passport.jobStatus !== "ACTIVE") {
      return (
         <div className="w-full max-w-lg flex flex-col items-center text-center p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
             <div className="w-16 h-16 rounded-full border-4 border-electric-blue border-t-transparent animate-spin mx-auto mb-6" />
             <h2 className="text-2xl font-bold font-mono text-white mb-2">{t('preparing_your_ai')}</h2>
             <p className="text-zinc-400 font-mono text-sm mb-8">{t('status')}: {passport.jobStatus}</p>
             <div className="space-y-2 text-xs font-mono text-left bg-black/30 p-4 rounded-xl w-full">
                 <div className="flex items-center gap-2 text-zinc-500"><CheckCircle2 className="w-3 h-3" /> {t('reserving_domain')}</div>
                 <div className="flex items-center gap-2 text-emerald-400 animate-pulse"><Loader2 className="w-3 h-3 animate-spin" /> {t('provisioning_identity')}</div>
                 <div className="flex items-center gap-2 text-zinc-700"> {t('generating_did')}</div>
                 <div className="flex items-center gap-2 text-zinc-700"> {t('issuing_passport')}</div>
             </div>
         </div>
      );
  }

  if (!passport && !error && !loading) {
    return null;
  }

  return (
    <>
      {error ? (

        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-surface mb-4">{t('passport_not_found')}</h2>
          <p className="text-subtle mb-8">{error}</p>
          <Link href="/claim" className="btn-primary text-xs">
            {t('create_your_passport')}
          </Link>
        </div>
      ) : passport ? (
        <>
          <div className="relative">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[400px] h-[400px] spotlight-accent rounded-full pointer-events-none" />
            <div className="absolute -bottom-10 right-0 w-[300px] h-[300px] spotlight-primary rounded-full pointer-events-none" />
            <AgentPassport
            username={passport.username}
            walletAddress={passport.walletAddress || undefined}
            stellarAddress={passport.stellarAddress || undefined}
            tier={passport.tier as "Visitor" | "Citizen" | "Validator" | "Sovereign"}
            trustScore={passport.trustScore}
            kyaStatus={passport.kyaStatus}
            kycStatus={passport.kycStatus}
            stamps={passport.stamps}
            issuedDate={passport.issuedDate}
            did={passport.did}
            xp={passport.xp}
            agentName={passport.agentName || undefined}
            agentStatus={passport.agentStatus || undefined}
          />
          </div>
 
          <div className="mt-8 flex flex-col items-center gap-3">
            <AgentQR did={passport.did} />
            <button
              onClick={handleShare}
              className="btn-primary text-xs flex items-center gap-2 px-4 py-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 10.742l4.639-2.32m0 0a3 3 0 114.12 4.119l-4.64 2.32m0 0a3 3 0 11-4.119-4.12l4.64-2.32z" />
              </svg>
              {t('share_passport')}
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-faint mb-4">
              {t('passport_verified_by')}
            </p>
            <Link href="/claim" className="btn-primary text-xs">
              {t('create_your_passport')}
            </Link>
          </div>
        </>
      ) : null}
    </>
  );
}
