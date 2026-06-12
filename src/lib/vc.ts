import { createPrivateKey, sign } from "crypto";
import { createIssuerDid } from "./did";

function getIssuerPrivateKey(): { key: string; alg: string } {
  const key = process.env.ISSUER_PRIVATE_KEY;
  if (!key) throw new Error("ISSUER_PRIVATE_KEY not set");
  // Determine algorithm from key type
  const alg = key.includes("Ed25519") ? "EdDSA" : key.includes("RSA") ? "RS256" : "EdDSA";
  return { key, alg };
}

export function signSocialCredential(
  userId: string,
  userDid: string,
  platform: string,
  handle: string,
  walletAddress: string
) {
  const issuanceDate = new Date();
  const issuerDid = createIssuerDid();

  const credential = {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://w3id.org/security/suites/ed25519-2020/v1",
    ],
    id: `${userDid}#social-${platform}`,
    type: ["VerifiableCredential", "SocialIdentityCredential"],
    issuer: issuerDid,
    issuanceDate: issuanceDate.toISOString(),
    credentialSubject: {
      id: userDid,
      platform,
      handle,
      walletAddress,
    },
  };

  // Canonicalize object keys recursively (deterministic JSON serialization)
  const canonicalize = (obj: unknown): unknown => {
    if (obj === null || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(canonicalize);
    const record = obj as Record<string, unknown>;
    return Object.keys(record).sort().reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = canonicalize(record[key]);
      return acc;
    }, {});
  };

  const dataToSign = JSON.stringify(canonicalize(credential), null, 0);
  const { key: pemKey, alg } = getIssuerPrivateKey();
  const key = createPrivateKey({
    key: pemKey,
    format: "pem",
    type: "pkcs8",
  });

  let signature: string;
  let proofType: string;

  if (alg === "EdDSA" && key.asymmetricKeyType === "ed25519") {
    signature = sign(null, Buffer.from(dataToSign), key).toString("hex");
    proofType = "Ed25519Signature2020";
  } else if (alg === "RS256" && key.asymmetricKeyType === "rsa") {
    signature = sign("sha256", Buffer.from(dataToSign), key).toString("hex");
    proofType = "RsaSignature2018";
  } else {
    throw new Error(`Key type ${key.asymmetricKeyType} doesn't match expected algorithm ${alg}`);
  }

  return {
    ...credential,
    proof: {
      type: proofType,
      created: issuanceDate.toISOString(),
      verificationMethod: `${issuerDid}#key-1`,
      proofPurpose: "assertionMethod",
      proofValue: signature,
    },
  };
}
