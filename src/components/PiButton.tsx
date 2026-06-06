"use client";

import React from "react";
import { usePiConnection, usePiPurchase } from "@/lib/pi-sdk-hooks";
import type { PaymentData } from "@pinetwork/pi-sdk-js";

const defaultPaymentData: PaymentData = {
  amount: 0.01,
  memo: "Example Pi Payment",
  metadata: { productId: 42, description: "Demo purchase via Pi Network" },
};

export interface PiButtonProps {
  paymentData?: PaymentData;
  onConnected?: () => void;
  children?: React.ReactNode;
}

export function PiButton({
  paymentData = defaultPaymentData,
  onConnected,
  children,
}: PiButtonProps) {
  const { connected, ready, error, connect } = usePiConnection();
  const purchase = usePiPurchase(paymentData);

  React.useEffect(() => {
    if (connected && onConnected) onConnected();
  }, [connected, onConnected]);

  // REMOVED AUTO-CONNECT: User must click to connect explicitly

  if (error) {
    return (
      <button
        disabled
        className="px-4 py-2 rounded bg-red-500/20 text-red-400 cursor-not-allowed"
        title={error}
      >
        Connection Error
      </button>
    );
  }

  if (!ready) {
    return (
      <button
        disabled
        className="px-4 py-2 rounded bg-gray-500/20 text-gray-400 cursor-wait"
      >
        Loading Pi SDK...
      </button>
    );
  }

  return (
    <button
      disabled={!connected}
      onClick={purchase}
      className="px-4 py-2 rounded bg-neon-green/20 text-neon-green hover:bg-neon-green/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      {children || "Buy with Pi"}
    </button>
  );
}
