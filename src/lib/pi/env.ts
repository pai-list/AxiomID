/**
 * Pi Network environment loader (server-only).
 */
import "server-only";

export interface PiEnv {
  apiKey: string;
  walletPrivateSeed: string;
  sandbox: boolean;
  siteUrl: string;
}

let cached: PiEnv | null = null;

function readRequired(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`[axiomid:pi] Missing required env var: ${name}`);
  return value;
}

function readOptional(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

export function getPiEnv(): PiEnv {
  if (cached) return cached;
  cached = {
    apiKey: readRequired("PI_API_KEY"),
    walletPrivateSeed: readOptional("PI_WALLET_PRIVATE_SEED"),
    sandbox: readOptional("NEXT_PUBLIC_PI_SANDBOX", "false") === "true",
    siteUrl: readOptional("NEXT_PUBLIC_SITE_URL", "https://axiomid.app"),
  };
  return cached;
}

export function __resetPiEnvCache(): void { cached = null; }
