import { createPublicKey } from "crypto";

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function encodeBase58(buffer: Buffer): string {
  let num = BigInt("0x" + buffer.toString("hex"));
  let result = "";
  const zero = BigInt(0);
  const fiftyEight = BigInt(58);
  while (num > zero) {
    const remainder = Number(num % fiftyEight);
    result = ALPHABET[remainder] + result;
    num = num / fiftyEight;
  }
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] === 0x00) {
      result = ALPHABET[0] + result;
    } else {
      break;
    }
  }
  return result;
}

export function buildDidDocument(did: string, publicKeyPem?: string) {
  const doc: Record<string, unknown> = {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/ed25519-2020/v1",
    ],
    id: did,
  };

  if (publicKeyPem) {
    const method: Record<string, unknown> = {
      id: `${did}#key-1`,
      controller: did,
    };

    try {
      const key = createPublicKey({
        key: publicKeyPem,
        format: "pem",
      });

      if (key.asymmetricKeyType === "ed25519") {
        const der = key.export({ format: "der", type: "spki" });
        const rawPublicKey = der.subarray(-32);
        const multicodecKey = Buffer.concat([Buffer.from([0xed, 0x01]), rawPublicKey]);
        const publicKeyMultibase = "z" + encodeBase58(multicodecKey);

        method.type = "Ed25519VerificationKey2020";
        method.publicKeyMultibase = publicKeyMultibase;
      } else {
        method.type = "RsaVerificationKey2018";
        method.publicKeyPem = publicKeyPem;
      }
    } catch (err) {
      console.error("[DID-DOCUMENT] Failed to parse issuer public key:", err);
      throw new Error(
        "Failed to parse ISSUER_PUBLIC_KEY. Ensure it is a valid Ed25519 or RSA PEM key."
      );
    }

    doc.verificationMethod = [method];
    doc.authentication = [`${did}#key-1`];
    doc.assertionMethod = [`${did}#key-1`];
  }

  doc.service = [
    {
      id: `${did}#credential-status`,
      type: "CredentialStatusList",
      serviceEndpoint: "https://axiomid.app/api/credential-status",
    },
  ];

  return doc;
}
