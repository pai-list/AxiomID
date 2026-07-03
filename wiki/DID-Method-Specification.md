# DID Method Specification: `did:axiom`

> Back to [Home](./Home) | See also: [Trust Score Algorithm](./Trust-Score-Algorithm)

---

## Abstract

This document specifies the `did:axiom` DID method — a W3C DID Core-compliant decentralized identifier designed for AI agents, humans, and automated systems on Pi Network.

**Method Name:** `axiom`
**Status:** Production (v0.1.0+)
**Conformance:** [W3C DID Core 1.0](https://www.w3.org/TR/did-core/)
**Source:** [`src/lib/did.ts`](https://github.com/Moeabdelaziz007/AxiomID/blob/main/src/lib/did.ts)

---

## DID Syntax

### Method-Specific ID Format

```
did-axiom         = "did:axiom:" axiom-specific-id
axiom-specific-id = authority ":" entity-type ":" unique-id
authority         = "axiomid.app" | "user-" prefix
entity-type       = "pi" | "issuer" | "user"
unique-id         = URL-encoded identifier
```

### Examples

```
# Pi Network user DID (primary format)
did:axiom:axiomid.app:pi:{firebase-uid}

# Legacy user DID
did:axiom:user-{userId}

# Issuer DID
did:axiom:issuer

# Derived DID (from JWT assertion)
did:axiom:user:{sha256-hash-first-16-chars}
```

### DID Creation Functions

```typescript
// Pi Network user (primary)
createPiDid(uid: string)
// → did:axiom:axiomid.app:pi:{uid}

// Legacy user
createUserDid(userId: string)
// → did:axiom:user-{userId}

// Issuer
createIssuerDid()
// → did:axiom:issuer

// Derived from JWT
deriveDid(assertion: string)
// → did:axiom:user:{hash}
```

---

## DID Document Structure

AxiomID DID Documents follow W3C DID Core:

```json
{
  "@context": ["https://www.w3.org/ns/did/v1"],
  "id": "did:axiom:axiomid.app:pi:user123",
  "verificationMethod": [
    {
      "id": "did:axiom:axiomid.app:pi:user123#key-1",
      "type": "Ed25519VerificationKey2020",
      "controller": "did:axiom:axiomid.app:pi:user123",
      "publicKeyMultibase": "z6MkhaXgBZDvotDkL5257f..."
    }
  ],
  "authentication": ["#key-1"],
  "assertionMethod": ["#key-1"]
}
```

### Key Type

| Key Type | Curve | Usage |
|:---|:---|:---|
| `Ed25519VerificationKey2020` | Ed25519 | Authentication, VC signing (default) |

### DID Document Builder

```typescript
buildDidDocument(did, publicKeyMultibase?, keyVersion = 1)
// Returns DID Document with verification methods
```

**Source:** [`src/lib/did-document.ts`](https://github.com/Moeabdelaziz007/AxiomID/blob/main/src/lib/did-document.ts)

---

## CRUD Operations

### Create

DIDs are created during the claim flow:

1. User connects Pi Wallet
2. Pi SDK authenticates user (returns `uid`)
3. Server creates DID: `createPiDid(uid)`
4. Ed25519 sovereign keypair derived from `SOVEREIGN_KEY_SALT`
5. DID Document built with `buildDidDocument()`
6. DID stored in PostgreSQL via Prisma

### Read (Resolve)

DIDs are resolved from PostgreSQL:

```
Resolution Order:
1. In-memory cache (if applicable)
2. PostgreSQL via Prisma
3. DID Document reconstructed from stored keys
```

**Resolution endpoint:** `GET /api/did-document?did={did}`

### Update

DID Documents are updated when:
- Key rotation (new sovereign keypair)
- Agent identity changes
- New stamps/VCs attached

### Deactivate

DIDs can be deactivated by the controller. Deactivated DIDs cannot authenticate or sign.

---

## Verifiable Credentials

AxiomID issues Ed25519-signed Verifiable Credentials for:

| VC Type | Purpose |
|:---|:---|
| **KYA** (Know Your Agent) | Proves agent identity via Pi Network |
| **KYC** (Know Your Customer) | Proves human identity via Pi KYC |
| **Social** | Proves social account ownership |
| **Wallet Age** | Proves Stellar wallet history |
| **Agent Delegation** | Proves delegated authority |

### VC Anchoring on Stellar

VCs can be anchored on Stellar for tamper-proof on-chain verification:

1. `computeVcHash(signedVc)` — SHA-256 of canonicalized VC
2. `anchorVcHash(stellarAddress, vcHash)` — build + sign + submit Stellar transaction
3. `verifyVcOnChain(stellarAddress, vcHash)` — fetch memo from Horizon, compare

**Source:** [`src/lib/stellar-anchoring.ts`](https://github.com/Moeabdelaziz007/AxiomID/blob/main/src/lib/stellar-anchoring.ts)

---

## Security Considerations

- **Sovereign keys** derived from `SOVEREIGN_KEY_SALT` via HMAC — never use public inputs alone
- **Server-side cryptography** — key derivations use Node.js `crypto` module, never browser
- **Pi SDK browser-only** — all Pi SDK access gated behind `typeof window !== 'undefined'`
- **Ed25519 signing** — VCs signed with Ed25519 for cryptographic integrity
- **No PII in DID Documents** — identity data stored separately in database

---

*→ [Trust Score Algorithm](./Trust-Score-Algorithm)*
