# Data Integrity 1.0 (Ed25519 Signature Suite)

**URL:** <https://www.w3.org/TR/vc-data-integrity/>

**Purpose:** W3C Recommendation defining a mechanism for cryptographically securing verifiable credentials and other linked data documents using the Ed25519 signature suite, providing integrity and authenticity without requiring JWT encoding.

## Key concepts

- **Data Integrity Proof** — A proof placed in the `proof` property of a JSON-LD document
- **Ed25519Signature2018** — Proof suite using Ed25519 public keys and signature generation
- **Verification Method** — Reference to the public key used for verification (typically a DID URL)
- **Canonicalization** — RDF Dataset Normalization (URDNA2015) for deterministic serialisation
- **Proof Purpose** — Distinguishes authentication, assertion, capability invocation/delegation

## How AxiomID uses it

- `packages/crypto/` implements Ed25519 key derivation, signing, and verification
- Passport manifests and agent attestations use Data Integrity proof format
- DID Documents in `src/lib/did.ts` expose Ed25519 verification methods
- Signature verification in API routes validates incoming credentials and presentations
- Proofs are attached to all published credentials for tamper-evident chain of trust
