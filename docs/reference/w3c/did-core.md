# DID Core 1.0

**URL:** <https://www.w3.org/TR/did-core/>

**Purpose:** W3C Recommendation defining Decentralized Identifiers — a globally unique, persistent identifier that does not require a centralised registry and can be resolved to a DID Document containing cryptographic material, service endpoints, and metadata.

## Key concepts

- **DID URI** — `did:method:method-specific-id`
- **DID Document** — JSON-LD resource describing the DID subject (verification methods, authentication, assertion, key agreement, service endpoints)
- **Verification Method** — Public key material embedded or referenced in the DID Document
- **Verification Relationship** — How a verification method is used (authentication, assertionMethod, keyAgreement, capabilityInvocation, capabilityDelegation)
- **DID Resolution** — Process of retrieving a DID Document from the underlying ledger or registry
- **DID URL Dereferencing** — Resolving a DID URL (with path, query, fragment) to a resource

## How AxiomID uses it

- Implements `did:axiom:` method — a custom DID method for AxiomID identities
- DID Document generation in `src/lib/did.ts`
- DID Document API endpoint at `src/app/api/did-document/route.ts`
- DID strings used for agent identity, passport signatures, and Stellar anchor operations
- Verification methods use Ed25519 keys from `packages/crypto/`
