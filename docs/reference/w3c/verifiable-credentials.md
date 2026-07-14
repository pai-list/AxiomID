# Verifiable Credentials Data Model 1.1

**URL:** <https://www.w3.org/TR/vc-data-model/>

**Purpose:** W3C Recommendation defining a standard data model and processing model for verifiable credentials — tamper-evident, cryptographically verifiable statements about a subject that can be issued, stored, and presented without reliance on the issuer.

## Key concepts

- **Issuer** — Entity that creates and signs a verifiable credential
- **Subject** — Entity the credential is about (identified by a DID)
- **Holder** — Entity that stores and presents the credential
- **Verifier** — Entity that verifies the credential's authenticity
- **Verifiable Presentation** — Bundle of one or more credentials signed by the holder
- **Proof** — Cryptographic signature (Data Integrity or JWT) securing the credential
- **Credential Schema** — Optional data model definition for credential contents

## How AxiomID uses it

- Agent manifest published as a verifiable credential at `src/app/api/agent/manifest/route.ts`
- Passport publish endpoint creates signed credentials at `src/app/api/passport/[slug]/publish/route.ts`
- Credentials use `did:axiom:` for issuer and subject identifiers
- Proofs use Ed25519 signatures via `packages/crypto/`
- Presentations submitted during verification flows in the dashboard and trust tiers
