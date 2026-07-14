# Stellar Anchor Platform

**URL:** <https://developers.stellar.org/docs/category/anchors>

**Purpose:** The Stellar Anchor platform enables regulated financial institutions to issue assets and provide fiat‑crypto rails on the Stellar Network. Anchors bridge traditional banking with the Stellar ecosystem through a standardised API framework (SEP series).

## Key concepts

- **SEP-1** — Stellar Info: defines well-known endpoint for anchor metadata
- **SEP-6 / SEP-24** — Deposit/Withdrawal APIs for asset transfer between Stellar and traditional accounts
- **SEP-10** — Stellar Web Authentication: enables wallet-to-anchor authentication using Stellar keypairs
- **SEP-12** — KYC/Customer Information: standardised customer due diligence data exchange
- **SEP-38** — Quotes API for asset conversion rates
- **Anchor** — A regulated entity that issues assets on Stellar and handles fiat settlement

## How AxiomID uses it

- SEP-10 authentication for Stellar-based login flows
- Anchor API implementation at `src/app/api/stellar/anchor/route.ts`
- KYC status integration with Stellar SEP-12 data models
- Passport credential anchoring to Stellar for tamper-evident publication
- Future: asset issuance for on‑chain passport badges and reputation tokens
