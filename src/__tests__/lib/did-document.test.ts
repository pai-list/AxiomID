/**
 * @jest-environment node
 */

jest.mock("@/lib/sovereign-keys", () => ({
  deriveSovereignAgentKeypair: jest.fn(),
}));

import crypto from "crypto";
import { buildDidDocument, DidDocumentSchema, pemToMultibase } from "@/lib/did-document";
import { deriveSovereignAgentKeypair } from "@/lib/sovereign-keys";

const mockDerive = deriveSovereignAgentKeypair as jest.Mock;

describe("DID Document", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDerive.mockReturnValue({
      publicKey: "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwA...\n-----END PUBLIC KEY-----",
      privateKey: "-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQ...\n-----END PRIVATE KEY-----",
    });
  });

  it("builds a valid W3C DID Document", () => {
    const doc = buildDidDocument("did:axiom:axiomid.app:pi:abc123", "z6MkhaXgBZD...");

    expect(doc["@context"]).toContain("https://www.w3.org/ns/did/v1");
    expect(doc.id).toBe("did:axiom:axiomid.app:pi:abc123");
    expect(doc.verificationMethod).toHaveLength(1);
    expect(doc.verificationMethod![0].type).toBe("Ed25519VerificationKey2020");
    expect(doc.verificationMethod![0].controller).toBe("did:axiom:axiomid.app:pi:abc123");
    expect(doc.authentication).toContain("#key-1");
    expect(doc.assertionMethod).toContain("#key-1");
  });

  it("sets the correct key ID using DID + key version", () => {
    const did = "did:axiom:axiomid.app:pi:abc123";
    const doc = buildDidDocument(did, "z6MkhaXgBZD...");

    const keyId = `${did}#key-1`;
    expect(doc.verificationMethod![0].id).toBe(keyId);
  });

  it("sets publicKeyMultibase on the verification method", () => {
    const doc = buildDidDocument("did:axiom:axiomid.app:pi:abc123", "z6MkhaXgBZD...");

    expect(doc.verificationMethod![0].publicKeyMultibase).toBe("z6MkhaXgBZD...");
  });

  it("builds document without verificationMethod when no publicKeyMultibase given", () => {
    const doc = buildDidDocument("did:axiom:axiomid.app:pi:abc123");

    expect(doc.verificationMethod).toBeUndefined();
    expect(doc.authentication).toBeUndefined();
    expect(doc.assertionMethod).toBeUndefined();
  });

  it("uses custom keyVersion in key ID", () => {
    const did = "did:axiom:axiomid.app:pi:abc123";
    const doc = buildDidDocument(did, "z6MkhaXgBZD...", 2);

    expect(doc.verificationMethod![0].id).toBe(`${did}#key-2`);
    expect(doc.authentication).toContain("#key-2");
    expect(doc.assertionMethod).toContain("#key-2");
  });

  it("does not include key-1 references when keyVersion is 2", () => {
    const doc = buildDidDocument("did:axiom:axiomid.app:pi:abc123", "z6MkhaXgBZD...", 2);

    expect(doc.authentication).not.toContain("#key-1");
    expect(doc.assertionMethod).not.toContain("#key-1");
  });

  it("builds context as array with W3C DID v1 URL", () => {
    const doc = buildDidDocument("did:axiom:axiomid.app:pi:abc123", "z6MkhaXgBZD...");

    expect(Array.isArray(doc["@context"])).toBe(true);
    expect(doc["@context"][0]).toBe("https://www.w3.org/ns/did/v1");
  });

  it("passes Zod schema validation", () => {
    const doc = buildDidDocument("did:axiom:axiomid.app:pi:abc123", "z6MkhaXgBZD...");
    const result = DidDocumentSchema.safeParse(doc);

    expect(result.success).toBe(true);
  });
});

describe("pemToMultibase", () => {
  const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

  /**
   * Independent base58btc decoder used only to verify pemToMultibase's output.
   * Mirrors the standard base58 algorithm without reusing any implementation
   * details from src/lib/did-document.ts.
   */
  function base58Decode(str: string): Buffer {
    let num = BigInt(0);
    for (const char of str) {
      const idx = BASE58_ALPHABET.indexOf(char);
      if (idx === -1) {
        throw new Error(`Invalid base58 character: ${char}`);
      }
      num = num * BigInt(58) + BigInt(idx);
    }

    let hex = num.toString(16);
    if (hex.length % 2 !== 0) hex = "0" + hex;
    let bytes = num === BigInt(0) ? Buffer.alloc(0) : Buffer.from(hex, "hex");

    let leadingZeroChars = 0;
    for (const char of str) {
      if (char === "1") leadingZeroChars++;
      else break;
    }
    if (leadingZeroChars > 0) {
      bytes = Buffer.concat([Buffer.alloc(leadingZeroChars, 0), bytes]);
    }
    return bytes;
  }

  function generateEd25519Pem(): { pem: string; rawKey: Buffer } {
    const { publicKey } = crypto.generateKeyPairSync("ed25519");
    const pem = publicKey.export({ type: "spki", format: "pem" }) as string;
    // Independently derive the raw 32-byte public key via JWK export, rather
    // than re-deriving it the same way pemToMultibase does (DER slicing).
    const jwk = publicKey.export({ format: "jwk" }) as { x: string };
    const rawKey = Buffer.from(jwk.x, "base64url");
    return { pem, rawKey };
  }

  it("returns a multibase string prefixed with 'z' (base58btc)", () => {
    const { pem } = generateEd25519Pem();
    const result = pemToMultibase(pem);

    expect(typeof result).toBe("string");
    expect(result.startsWith("z")).toBe(true);
    expect(result.length).toBeGreaterThan(1);
  });

  it("encodes the ed25519 multicodec prefix followed by the raw 32-byte public key", () => {
    const { pem, rawKey } = generateEd25519Pem();
    const result = pemToMultibase(pem);

    const decoded = base58Decode(result.slice(1));
    expect(decoded.subarray(0, 2)).toEqual(Buffer.from([0xed, 0x01]));
    expect(decoded.subarray(2)).toEqual(rawKey);
  });

  it("is deterministic for the same PEM input", () => {
    const { pem } = generateEd25519Pem();

    expect(pemToMultibase(pem)).toBe(pemToMultibase(pem));
  });

  it("produces different multibase output for different keys", () => {
    const { pem: pemA } = generateEd25519Pem();
    const { pem: pemB } = generateEd25519Pem();

    expect(pemToMultibase(pemA)).not.toBe(pemToMultibase(pemB));
  });

  it("handles PEM strings with Windows-style CRLF line endings", () => {
    const { pem, rawKey } = generateEd25519Pem();
    const crlfPem = pem.replace(/\n/g, "\r\n");

    const result = pemToMultibase(crlfPem);
    const decoded = base58Decode(result.slice(1));

    expect(decoded.subarray(2)).toEqual(rawKey);
  });

  it("handles PEM input without a trailing newline", () => {
    const { pem, rawKey } = generateEd25519Pem();
    const trimmedPem = pem.trimEnd();

    const result = pemToMultibase(trimmedPem);
    const decoded = base58Decode(result.slice(1));

    expect(decoded.subarray(2)).toEqual(rawKey);
  });

  it("produces a value usable as publicKeyMultibase in buildDidDocument", () => {
    const { pem } = generateEd25519Pem();
    const multibase = pemToMultibase(pem);

    const doc = buildDidDocument("did:axiom:pi:testuser", multibase);
    const result = DidDocumentSchema.safeParse(doc);

    expect(result.success).toBe(true);
    expect(doc.verificationMethod?.[0].publicKeyMultibase).toBe(multibase);
  });
});
