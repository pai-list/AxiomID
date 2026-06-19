"use client";

import { useMemo } from "react";
import { useLanguage } from "@/app/context/language-context";
import { AxiomRenderer } from "../ui/AxiomRenderer";

interface QuickLinksCardProps {
  passportSlug: string;
  did?: string;
}

/**
 * Renders a card with quick navigation links to a passport view and DID document.
 *
 * @param passportSlug - The slug identifying the passport to link to
 * @param did - Optional decentralized identifier to pass to the DID document endpoint
 * @returns A card component with quick navigation links
 */
export function QuickLinksCard({ passportSlug, did }: QuickLinksCardProps) {
  const { t } = useLanguage();
  
  const spec = useMemo(() => ({
    root: "card",
    elements: {
      card: {
        type: "Card",
        props: { title: t("quick_links"), variant: "bento", animate: true },
        children: ["link1", "link2"],
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
    },
  }), [t, passportSlug, did]);

  return <AxiomRenderer spec={spec} />;
}
