"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PiSdkBase } from "@pinetwork/pi-sdk-js";
import type { PaymentData } from "@pinetwork/pi-sdk-js";
import { connectPi, isPiSdkLoaded } from "@/lib/pi-sdk";

interface PiConnectionState {
  connected: boolean;
  user: { uid: string; username: string; name: string } | null;
  ready: boolean;
  error: string | null;
}

export function usePiConnection(): PiConnectionState & { connect: () => Promise<void> } {
  const [state, setState] = useState<PiConnectionState>({
    connected: false,
    user: null,
    ready: false,
    error: null,
  });
  const connecting = useRef(false);

  useEffect(() => {
    const check = () => {
      setState((prev) => ({ ...prev, ready: isPiSdkLoaded() }));
    };
    check();
    const timer = setInterval(check, 500);
    return () => clearInterval(timer);
  }, []);

  const connect = useCallback(async () => {
    if (connecting.current || state.connected) return;
    connecting.current = true;
    setState((prev) => ({ ...prev, error: null }));
    try {
      const result = await connectPi();
      setState({
        connected: true,
        user: result.user,
        ready: true,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection failed";
      setState((prev) => ({ ...prev, error: message, ready: true }));
    } finally {
      connecting.current = false;
    }
  }, [state.connected]);

  useEffect(() => {
    if (state.connected && PiSdkBase.user) {
      setState({
        connected: true,
        user: {
          uid: PiSdkBase.user.uid ?? PiSdkBase.user.name,
          username: PiSdkBase.user.username ?? PiSdkBase.user.name,
          name: PiSdkBase.user.name,
        },
        ready: true,
        error: null,
      });
    }
  }, [state.connected]);

  return { ...state, connect };
}

export function usePiPurchase(paymentData: PaymentData): () => void {
  const purchase = useCallback(() => {
    const pi = new PiSdkBase();
    pi.createPayment(paymentData);
  }, [paymentData]);

  return purchase;
}
