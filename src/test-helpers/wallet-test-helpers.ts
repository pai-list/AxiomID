import { User } from "@/app/context/wallet-types";

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-test",
    walletAddress: "pi:user-test",
    xp: 100,
    tier: "Citizen",
    trustScore: 0,
    createdAt: new Date().toISOString(),
    actions: [],
    stamps: [],
    ...overrides,
  };
}
