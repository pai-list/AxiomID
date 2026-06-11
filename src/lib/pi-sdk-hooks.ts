"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { connectPi, isPiSdkLoaded } from "@/lib/pi-sdk";

interface PiUser {
  uid: string;
  username: string;
  name: string;
  stellarAddress?: string;
}

interface PiState {
  connected: boolean;
  user: PiUser | null;
  ready: boolean;
  error: string | null;
  token: string | null;
}

export function usePiConnection(): PiState & { connect: () => Promise<void> } {
  const [state, setState] = useState<PiState>({
    connected: false,
    user: null,
    ready: false,
    error: null,
    token: null,
  });
  const connecting = useRef(false);
  const readyRef = useRef(false);

  useEffect(() => {
    if (readyRef.current) return;
    readyRef.current = true;
    const timer = setTimeout(() => {
      setState((prev) => ({ ...prev, ready: true }));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const connect = useCallback(async () => {
    if (connecting.current || state.connected) return;
    if (!isPiSdkLoaded()) {
      setState((prev) => ({ ...prev, error: "Pi SDK not loaded. Please open in Pi Browser." }));
      return;
    }
    connecting.current = true;
    setState((prev) => ({ ...prev, error: null }));
    try {
      const result = await connectPi();
      setState({
        connected: true,
        user: {
          uid: result.user.uid ?? result.user.name,
          username: result.user.username ?? result.user.name,
          name: result.user.name,
          stellarAddress: result.stellarAddress,
        },
        ready: true,
        error: null,
        token: result.token,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection failed";
      setState((prev) => ({ ...prev, error: message, ready: true }));
    } finally {
      connecting.current = false;
    }
  }, [state.connected]);

  return { ...state, connect };
}

export function usePiPurchase(paymentData: { amount: number; memo: string; metadata: Record<string, unknown> }): () => void {
  const purchase = useCallback(async () => {
    if (!isPiSdkLoaded()) {
      throw new Error("Pi SDK not loaded");
    }
    const { PiSdkBase } = await import("@pinetwork/pi-sdk-js");
    const pi = new PiSdkBase();
    pi.createPayment(paymentData);
  }, [paymentData]);

  return purchase;
}
