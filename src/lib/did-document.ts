import { z } from "zod";

const DID_CONTEXT = "https://www.w3.org/ns/did/v1";

// Ed25519 multicodec prefix: 0xed01 (2 bytes)
const ED25519_MULTICODEC_PREFIX = Buffer.from([0xed, 0x01]);

// Base58btc alphabet (Bitcoin)
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/**
 * Minimal base58 encoding (no external deps — Ponytail).
 */
function base58Encode(buffer: Buffer): string {
  if (buffer.length === 0) return "";
  let num = BigInt(`0x${buffer.toString("hex")}`);
  let result = "";
  while (num > BigInt(0)) {
    const remainder = Number(num % BigInt(58));
    num = num / BigInt(58);
    result = BASE58_ALPHABET[remainder] + result;
  }
  // Handle leading zeros
  for (const byte of buffer) {
    if (byte === 0) result = "1" + result;
    else break;
  }
  return result;
}

/**
 * Converts a PEM-encoded Ed25519 public key to multibase (z + base58btc + multicodec).
 * ponytail: minimal impl, no new deps.
 */
export function pemToMultibase(pem: string): string {
  const lines = pem.replace(/\r?\n/g, "").split("");
  const b64 = lines
    .join("")
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "");
  const der = Buffer.from(b64, "base64");

  // SPKI: last 32 bytes of the DER encoding are the raw Ed25519 public key
  const rawKey = der.subarray(der.length - 32);
  const multicodecKey = Buffer.concat([ED25519_MULTICODEC_PREFIX, rawKey]);
  return "z" + base58Encode(multicodecKey);
}

export const DidDocumentSchema = z.object({
  "@context": z.array(z.string()),
  id: z.string(),
  verificationMethod: z.array(z.object({
    id: z.string(),
    type: z.string(),
    controller: z.string(),
    publicKeyMultibase: z.string(),
  })).optional(),
  authentication: z.array(z.string()).optional(),
  assertionMethod: z.array(z.string()).optional(),
});

export type DidDocument = z.infer<typeof DidDocumentSchema>;

/**
 * Constructs a DID document from a DID identifier and optional public key.
 *
 * @param did - The DID identifier
 * @param publicKeyMultibase - The public key in multibase format
 * @param keyVersion - Version number used to generate the key identifier
 * @returns A DID document with verification methods if a public key is provided
 */
export function buildDidDocument(
  did: string,
  publicKeyMultibase?: string,
  keyVersion = 1
): DidDocument {
  const keyId = `${did}#key-${keyVersion}`;
  const keyRef = `#key-${keyVersion}`;

  const doc: DidDocument = {
    "@context": [DID_CONTEXT],
    id: did,
  };

  if (publicKeyMultibase) {
    doc.verificationMethod = [{
      id: keyId,
      type: "Ed25519VerificationKey2020",
      controller: did,
      publicKeyMultibase,
    }];
    doc.authentication = [keyRef];
    doc.assertionMethod = [keyRef];
  }

  return doc;
}
