"use client";

import { determineSandboxMode } from "@/lib/pi-sdk";
import { useLanguage } from "@/app/context/language-context";

export function DevModeBanner() {
  const isSandbox = determineSandboxMode();
  const { language } = useLanguage();
  if (!isSandbox) return null;

  return (
    <div role="alert" className="bg-danger/10 border border-danger/30 text-danger px-4 py-2 text-center font-mono text-xs">
      {language === "ar"
        ? "⚠️ وضع التطوير — غير متصل بشبكة Pi. التحقق والمدفوعات الحقيقية معطلة."
        : "⚠️ DEV MODE — Not connected to Pi Network. Real KYC and payments disabled."}
    </div>
  );
}
