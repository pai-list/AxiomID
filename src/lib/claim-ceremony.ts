import crypto from "crypto";

const CLAIM_TOKEN_EXPIRY_MS = 10 * 60 * 1000;

interface ClaimRecord {
  token: string;
  userCode: string;
  verificationUri: string;
  expiresAt: number;
  userId: string | null;
  status: "pending" | "confirmed" | "expired";
}

const claimStore = new Map<string, ClaimRecord>();

function generateUserCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "AXIO-";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Create a claim token. Pass expiresInMs < 0 to create an already-expired token for testing. */
export function createClaimToken(expiresInMs: number = CLAIM_TOKEN_EXPIRY_MS): ClaimRecord {
  const token = crypto.randomBytes(32).toString("hex");
  const userCode = generateUserCode();

  const record: ClaimRecord = {
    token,
    userCode,
    verificationUri: "https://axiomid.app/claim",
    expiresAt: Date.now() + expiresInMs,
    userId: null,
    status: "pending",
  };

  claimStore.set(token, record);
  return record;
}

export function verifyClaimToken(token: string): ClaimRecord | null {
  const record = claimStore.get(token);
  if (!record) return null;

  if (Date.now() > record.expiresAt) {
    record.status = "expired";
    return null;
  }

  return record;
}

export function confirmClaimToken(token: string, userId: string): void {
  const record = claimStore.get(token);
  if (!record) throw new Error("Claim token not found");

  if (Date.now() > record.expiresAt) {
    record.status = "expired";
    throw new Error("Claim token expired");
  }

  record.status = "confirmed";
  record.userId = userId;
}

export function findClaimByUserCode(userCode: string): ClaimRecord | null {
  for (const record of claimStore.values()) {
    if (record.userCode === userCode && record.status === "pending") {
      return record;
    }
  }
  return null;
}
