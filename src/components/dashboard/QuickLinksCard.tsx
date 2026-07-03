"use client";

import { useCallback, useMemo, useState } from "react";
import { useLanguage } from "@/app/context/language-context";
import { toast } from "sonner";
import { AxiomRenderer } from "../ui/AxiomRenderer";

interface QuickLinksCardProps {
  passportSlug: string;
  did?: string;
  passportUrl?: string | null;
}

/**
 * Renders a card with quick navigation links to a passport view and DID document.
 *
 * @param passportSlug - The slug identifying the passport to link to
 * @param did - Optional decentralized identifier to pass to the DID document endpoint
 * @returns A card component with quick navigation links
 */
export function QuickLinksCard({ passportSlug, did, passportUrl }: QuickLinksCardProps) {
  const { t } = useLanguage();
    const handlePublish = useCallback(async () => {
    setPublishing(true);
    const promise = fetch(`/api/passport/${passportSlug}/publish`, { method: 'POST' });

    toast.promise(promise, {
      loading: 'Publishing passport to IPFS & Stellar...',
      success: (res) => {
        if (!res.ok) throw new Error('Publish failed');
        // Simple page reload to update passportUrl from server state
        setTimeout(() => window.location.reload(), 1500);
        return 'Passport published successfully!';
      },
      error: 'Failed to publish passport',
      finally: () => setPublishing(false)
    });
  }, [passportSlug, toast]);

  const [publishing, setPublishing] = useState(false);
  
  const spec = useMemo(() => ({
    root: "card",
    elements: {
      publish: {
        type: "Button",
        props: {
          label: publishing ? "Publishing..." : "Publish Passport",
          onClick: handlePublish,
          variant: "outline",
          size: "sm",
          icon: "upload",
          loading: publishing,
          className: "mt-2 w-full font-mono text-[10px] tracking-widest uppercase border-axiom-purple/30 text-axiom-purple hover:bg-axiom-purple/10"
        }
      },
      card: {
        type: "Card",
        props: { title: t("quick_links"), variant: "bento", animate: true },
        children: passportUrl ? ["link1", "link2", "link3"] : ["link1", "link2", "publish"],
      },
      link1: {
        type: "LinkItem",
        props: {
          label: t("view_passport"),
          href: `/passport/${passportSlug}`,
          icon: "fingerprint",
          color: "default",
        },
      },
      link2: {
        type: "LinkItem",
        props: {
          label: t("did_document"),
          href: `/api/did-document${did ? `?did=${encodeURIComponent(did)}` : ""}`,
          icon: "clipboard",
          color: "default",
        },
      },
      ...(passportUrl ? {
        link3: {
          type: "LinkItem",
          props: {
            label: "Published Passport",
            href: passportUrl,
            icon: "globe",
            color: "accent",
            external: true,
          },
        },
      } : {}),
    },
  }), [t, passportSlug, did, passportUrl]);

  return <AxiomRenderer spec={spec} />;
}
