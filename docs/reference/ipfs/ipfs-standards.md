# IPFS and Content Addressing (CID)

**URL:** <https://ipfs.tech/>

**Purpose:** The InterPlanetary File System (IPFS) is a peer-to-peer distributed file system that enables content-addressed storage using Content Identifiers (CIDs). CIDs are self-describing hashes that uniquely and immutably identify content.

## Key concepts

- **CID (Content Identifier)** — A hash-based identifier (CIDv0 / CIDv1) that represents the content, not its location
- **Content Addressing** — Files are identified by their cryptographic hash; identical files produce identical CIDs
- **IPLD (InterPlanetary Linked Data)** — Data model for content-addressed graphs, enabling merkle-tree structures
- **IPFS Node** — A peer that stores, retrieves, and pins IPFS content
- **Pin** — A persistence mechanism that prevents content from being garbage-collected
- **Gateway** — HTTP interface to access IPFS content via CID (e.g. `ipfs.io/ipfs/<cid>`)
- **Mutable File System (MFS)** — Filesystem-like abstraction for mutable content on IPFS

## How AxiomID uses it

- Passport manifests published to IPFS at `src/app/api/passport/[slug]/publish/route.ts`
- CID returned in publish response for content-addressable retrieval
- Passport data pinned to ensure availability
- DID Document `serviceEndpoint` references IPFS URLs for passport and manifest resolution
- Tamper evidence: any modification to published content produces a different CID
