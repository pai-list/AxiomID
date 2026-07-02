import { AuthenticatedUser } from "./auth-middleware";

export function isAdmin(user: AuthenticatedUser) {
  return (user as any).role === "admin";
}
