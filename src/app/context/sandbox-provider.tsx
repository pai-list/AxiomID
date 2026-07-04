"use client";

import { useEffect } from "react";
import { initSandboxCompatibility } from "@/lib/pi-sandbox";

export function SandboxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const cleanup = initSandboxCompatibility();
    return cleanup;
  }, []);

  return <>{children}</>;
}
