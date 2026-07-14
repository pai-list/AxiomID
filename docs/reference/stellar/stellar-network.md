# Stellar Network

**URL:** <https://developers.stellar.org/docs>

**Purpose:** The Stellar Network is a decentralised, open-source blockchain protocol for cross-border payments and asset tokenisation. It uses the Stellar Consensus Protocol (SCP) for fast, low-cost transaction settlement.

## Key concepts

- **Stellar Consensus Protocol (SCP)** — Federated Byzantine Agreement (FBA) for decentralised consensus
- **Lumens (XLM)** — Native asset used for transaction fees and anti-spam
- **Accounts** — Stellar accounts identified by a public key (`G...`), with a sequence number for transaction ordering
- **Operations** — Individual actions within a transaction (payment, manage data, set options, etc.)
- **Transaction** — Atomic bundle of one or more operations with a fee, sequence number, and signature
- **Transaction Memo** — Stores a truncated 28-byte hash in the transaction memo field of a self-payment transaction on the Stellar ledger
- **Horizon API** — RESTful HTTP interface to query the network and submit transactions

## How AxiomID uses it

- Hash anchoring for tamper evidence: document hashes stored via Manage Data operations on the Stellar ledger
- Timestamp proofs: the ledger provides a decentralised, immutable timestamp for each anchored hash
- DID method: `did:axiom:` resolution can verify anchor proofs against Stellar state
- Stellar account per user agent for anchoring passport and credential hashes
- Reference implementation at `src/app/api/stellar/`
