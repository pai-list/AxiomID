import { AuthenticatedUser } from "@/lib/auth-middleware";

const ADMIN_WALLETS = (process.env.ADMIN_WALLETS || "")
  .split(",")
  .map((w) => w.trim())
  .filter(Boolean);

export function isAdmin(user: AuthenticatedUser): boolean {
  if (user.role === "ADMIN") return true;

  if (ADMIN_WALLETS.length > 0 && ADMIN_WALLETS.includes(user.walletAddress)) {
    return true;
  }

  return false;
}
