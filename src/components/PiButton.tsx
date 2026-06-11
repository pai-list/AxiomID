"use client";

import { useEffect, useState } from "react";

export interface PiButtonProps {
  paymentData?: Record<string, unknown>;
  onConnected?: () => void;
  children?: React.ReactNode;
}

export function PiButton({
  onConnected,
  children,
}: PiButtonProps) {
  const [connected] = useState(false);

  useEffect(() => {
    if (connected && onConnected) onConnected();
  }, [connected, onConnected]);

  return (
    <button
      disabled={!connected}
      className="px-4 py-2 rounded bg-neon-green/20 text-neon-green hover:bg-neon-green/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      {children || "Buy with Pi"}
    </button>
  );
}
