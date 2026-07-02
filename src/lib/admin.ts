import { AuthenticatedUser } from "./auth-middleware";

export function isAdmin(user: AuthenticatedUser) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (user as { role?: string }).role === "admin";
}
