"use client";

import { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from "react";
import { getLevelProgress, getNextLevelXP } from "@/lib/tiers";
import { checkPiBrowser, determineSandboxMode } from "@/lib/pi-sdk";
import { logger } from "@/lib/logger";
import { User, getStoredWallet, getLocalStorageItem, removeLocalStorageItem, mapApiUser } from "./wallet-types";
import { setSovereignBadge } from "@/lib/pwa-badging";

export type { User } from "./wallet-types";
import { useWalletAuth } from "./use-wallet-auth";
import { useWalletAgent } from "./use-wallet-agent";
import { useWalletActions } from "./use-wallet-actions";

interface WalletContextType {
  user: User | null;
  isLoading: boolean;
  isConnecting: boolean;
  error: string | null;
  isPiBrowser: boolean;
  piAccessToken: string | null;
  connectWallet: () => Promise<boolean>;
  logout: () => void;
  claimAction: (actionType: string, metadata?: Record<string, unknown>) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  createAgent: (name?: string) => Promise<boolean>;
  activateAgent: () => Promise<boolean>;
  pauseAgent: () => Promise<boolean>;
  claimKya: (username: string) => Promise<boolean>;
  levelProgress: number;
  nextXP: number | null;
  walletLogs: string[];
  runWalletTest: () => Promise<void>;
  clearWalletLogs: () => void;
  disconnectWallet: () => Promise<void>;
  connectDemo: () => Promise<void>;
}

export const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const userRef = useRef<User | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    if (localStorage.getItem("axiomid_logged_out") === "true") return false;
    return !!(getStoredWallet() || getLocalStorageItem("pi_access_token"));
  });
  const [error, setError] = useState<string | null>(null);
  // ponytail: isPiBrowser must be reactive — in Pi Browser, window.Pi loads
  // asynchronously after React mounts. A one-time useState check sets it to
  // false permanently, blocking the entire connect flow.
  const [isPiBrowser, setIsPiBrowser] = useState(() => checkPiBrowser());
  const [piAccessToken, setPiAccessToken] = useState<string | null>(() => {
    return getLocalStorageItem("pi_access_token");
  });

  const levelProgress = useMemo(() => user ? getLevelProgress(user.xp, user.tier) : 0, [user]);
  const nextXP = useMemo(() => user ? getNextLevelXP(user.tier) : null, [user]);
  const [walletLogs, setWalletLogs] = useState<string[]>([]);

  // ponytail: Poll for Pi SDK availability after mount. In Pi Browser, the SDK
  // script loads asynchronously — window.Pi isn't available on first render.
  // Without this, isPiBrowser stays false and the connect flow is blocked.
  // Consolidated: this effect ONLY updates isPiBrowser. The initRef effect
  // below handles SDK init + authentication on detection.
  useEffect(() => {
    if (isPiBrowser) return;
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (checkPiBrowser()) {
        setIsPiBrowser(true);
        clearInterval(interval);
      } else if (attempts > 25) {
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [isPiBrowser]);

  useEffect(() => {
    // 1. Compare current user with previous state (stored in ref)
    if (user && userRef.current) {
      const prev = userRef.current;
      if (user.xp > prev.xp) {
        setSovereignBadge('XP_GAIN', 0);
      }
      if (user.stamps.length > prev.stamps.length) {
        setSovereignBadge('NEW_STAMP', 0);
      }
    }

    // 2. Update ref for next render
    userRef.current = user;
  }, [user]);


  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      let reasonStr = "";
      if (typeof event.reason === "string") {
        reasonStr = event.reason;
      } else if (event.reason instanceof Error) {
        reasonStr = event.reason.message || event.reason.toString();
      } else if (typeof event.reason === "object" && event.reason !== null) {
        reasonStr = (event.reason as Record<string, unknown>).message as string || (event.reason as Record<string, unknown>).error as string || String(event.reason);
      } else {
        reasonStr = String(event.reason);
      }

      const isConnectionClosed =
        reasonStr.toLowerCase().includes("connection closed") ||
        reasonStr.toLowerCase().includes("connection_closed");

      if (isConnectionClosed) {
        console.warn("[WalletContext] Suppressed connection closed rejection:", reasonStr);
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerSW = async () => {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (!reg) {
            await navigator.serviceWorker.register("/sw.js");
          }
        } catch (err) {
          logger.error("Service worker registration failed:", err);
        }
      };
      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW);
      }
    }

    return () => window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  }, []);

  const { refreshUser, claimAction, claimKya, runTest, clearWalletLogs, pushLog } = useWalletActions({
    piAccessToken,
    userRef,
    setUser,
    setError,
    setWalletLogs,
  });

  const { connectWallet, logout, disconnectWallet, connectDemo } = useWalletAuth({
    setUser,
    setPiAccessToken,
    setIsConnecting,
    setError,
    setIsLoading,
    pushLog,
  });

  const { createAgent, activateAgent, pauseAgent } = useWalletAgent({
    piAccessToken,
    userRef,
    refreshUser,
  });

  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    if (getLocalStorageItem("axiomid_logged_out") === "true") {
      return;
    }

    let checkInterval: ReturnType<typeof setInterval> | undefined;

    const initPiSdk = () => {
      if (typeof window !== "undefined" && window.Pi) {
        try {
          window.Pi.init({
            version: "2.0",
            sandbox: determineSandboxMode(),
          });
        } catch (err) {
          logger.error("Failed to initialize Pi SDK:", err);
        }
      }
    };

    const authenticate = async () => {
      setIsLoading(true);
      try {
        await connectWallet();
      } finally {
        setIsLoading(false);
      }
    };

    const restoreSession = () => {
      const storedWallet = getStoredWallet();
      const storedToken = getLocalStorageItem("pi_access_token");
      if (!storedWallet && !storedToken) {
        return;
      }

      const headers: Record<string, string> = {};
      if (storedToken) {
        headers["Authorization"] = `Bearer ${storedToken}`;
      }

      fetch(`/api/user/status`, { headers }).then(res => {
        if (!res.ok) {
          removeLocalStorageItem("axiomid_wallet");
          removeLocalStorageItem("pi_access_token");
          setIsLoading(false);
          return;
        }
        return res.json().then(data => {
          setUser(mapApiUser(data));
          setIsLoading(false);
        }).catch(() => {
          removeLocalStorageItem("axiomid_wallet");
          removeLocalStorageItem("pi_access_token");
          setIsLoading(false);
        });
      }).catch(() => {
        removeLocalStorageItem("axiomid_wallet");
        removeLocalStorageItem("pi_access_token");
        setIsLoading(false);
      });
    };

    initPiSdk();

    if (checkPiBrowser()) {
      authenticate();
      return;
    }

    let checkCount = 0;
    checkInterval = setInterval(() => {
      checkCount++;
      if (checkPiBrowser()) {
        clearInterval(checkInterval);
        checkInterval = undefined;
        setIsPiBrowser(true);
        initPiSdk();
        authenticate();
      } else if (checkCount > 25) {
        clearInterval(checkInterval);
        checkInterval = undefined;
      }
    }, 200);

    restoreSession();

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [connectWallet]);

  const contextValue = useMemo(
    () => ({
      user,
      isLoading,
      isConnecting,
      error,
      isPiBrowser,
      piAccessToken,
      connectWallet,
      logout,
      claimAction,
      refreshUser,
      createAgent,
      activateAgent,
      pauseAgent,
      claimKya,
      levelProgress,
      nextXP,
      walletLogs,
      runWalletTest: runTest,
      clearWalletLogs,
      disconnectWallet,
      connectDemo,
    }),
    [
      user,
      isLoading,
      isConnecting,
      error,
      isPiBrowser,
      piAccessToken,
      connectWallet,
      logout,
      claimAction,
      refreshUser,
      createAgent,
      activateAgent,
      pauseAgent,
      claimKya,
      levelProgress,
      nextXP,
      walletLogs,
      runTest,
      clearWalletLogs,
      disconnectWallet,
      connectDemo,
    ]
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletLogs(): string[] {
  const ctx = useContext(WalletContext);
  return ctx?.walletLogs ?? [];
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    return {
      user: null,
      isLoading: false,
      isConnecting: false,
      error: null,
      isPiBrowser: false,
      piAccessToken: null,
      connectWallet: async () => false,
      logout: () => {},
      claimAction: async () => false,
      refreshUser: async () => {},
      createAgent: async () => false,
      activateAgent: async () => false,
      pauseAgent: async () => false,
      claimKya: async () => false,
      levelProgress: 0,
      nextXP: null,
      walletLogs: [],
      runWalletTest: async () => {},
      clearWalletLogs: () => {},
      disconnectWallet: async () => {},
      connectDemo: async () => {},
    };
  }
  return ctx;
}
