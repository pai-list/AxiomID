"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PiSdkBase } from "@pinetwork/pi-sdk-js";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface PiState {
  connected: boolean;
  user: { uid: string; username: string; name: string } | null;
  ready: boolean;
  error: string | null;
}

export function usePiConnection(): any {
  const [state, setState] = useState<PiState>({
    connected: false,
    user: null,
    ready: false,
    error: null,
  });
  const connecting = useRef(false);
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!syncedRef.current && state.connected && PiSdkBase.user) {
      syncedRef.current = true;
      const pu = PiSdkBase.user;
      setState((prev) => ({
        ...prev,
        user: {
          uid: pu.uid ?? pu.name,
          username: pu.username ?? pu.name,
          name: pu.name,
        },
      }));
    }
  }, [state.connected]);

  const connect = useCallback(async () => {
    if (connecting.current || state.connected) return;
    connecting.current = true;
    setState((prev) => ({ ...prev, error: null }));
    try {
      const result = await new Promise<{ user: { uid: string; username: string; name: string } }>((resolve) => {
        setTimeout(() => resolve({
          user: { uid: "test", username: "test", name: "test" }
        }), 100);
      });
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

  return { ...state, connect };
}

export function usePiPurchase(paymentData: any): () => void {
  const purchase = useCallback(() => {
    const pi = new PiSdkBase();
    pi.createPayment(paymentData);
  }, [paymentData]);

  return purchase;
}
