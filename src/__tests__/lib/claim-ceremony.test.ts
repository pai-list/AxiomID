/**
 * @jest-environment node
 */

import { createClaimToken, verifyClaimToken, confirmClaimToken } from "@/lib/claim-ceremony";

describe("Claim Ceremony", () => {
  it("creates a claim token with user code", () => {
    const claim = createClaimToken();

    expect(claim.token).toBeDefined();
    expect(claim.userCode).toMatch(/^AXIO-[A-Z0-9]{4}$/);
    expect(claim.verificationUri).toBe("https://axiomid.app/claim");
    expect(claim.expiresAt).toBeGreaterThan(Date.now());
    expect(claim.status).toBe("pending");
  });

  it("verifies a valid claim token", () => {
    const claim = createClaimToken();
    const result = verifyClaimToken(claim.token);

    expect(result).not.toBeNull();
    expect(result!.status).toBe("pending");
  });

  it("confirms a claim token", () => {
    const claim = createClaimToken();
    confirmClaimToken(claim.token, "user-123");

    const result = verifyClaimToken(claim.token);
    expect(result!.status).toBe("confirmed");
    expect(result!.userId).toBe("user-123");
  });

  it("rejects expired claim tokens", () => {
    const claim = createClaimToken(-1);

    const result = verifyClaimToken(claim.token);
    expect(result).toBeNull();

    expect(() => confirmClaimToken(claim.token, "user-456")).toThrow("Claim token expired");
  });

  it("rejects unknown tokens", () => {
    const result = verifyClaimToken("nonexistent-token");
    expect(result).toBeNull();

    expect(() => confirmClaimToken("nonexistent-token", "user-789")).toThrow("Claim token not found");
  });
});
