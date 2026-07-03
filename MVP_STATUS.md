# AxiomID MVP Status Report (Honest Audit)

## 1. Authentication System
- ✅ **Pi SDK Integration**: Works reliably in sandbox and production.
- ✅ **Zod Validation**: Auth routes (`/api/auth/pi`, `state`, `connect`) **ARE** validated via Zod. (Claim that they aren't is outdated).
- ✅ **Middleware**: Bearer token verification and caching work as intended.

## 2. Database & Models
- ⚠️ **D1 ↔ PostgreSQL Split**: Skills data is split. This is a known architectural choice but needs a sync bridge for full MVP functionality.
- 🔴 **Dead Models**: `SlashingEvent`, `EphemeralDid`, etc., are in the schema but not used. (Low priority for MVP but adds noise).

## 3. Marketplace & Skills (Critical)
- 🔴 **Broken Filter**: `soulPrinciple` filter is ignored by the API (GET /api/skills).
- 🔴 **Security Hole**: `POST /api/skills/[slug]/execute` is anonymous. Anyone can spam execution stats.
- ⚠️ **Missing Auth Check**: Executions don't verify if the user actually installed the skill.

## 4. Digital Identity (DID)
- 🔴 **Broken DID Documents**: `GET /api/did-document` returns documents without public keys for users. This breaks signature verification.
- ⚠️ **Dual DID Formats**: Inconsistent DID formats between user creation and Pi auth (`did:axiom:user-...` vs `did:axiom:pi:...`).

## 5. Passport & Publishing
- 🔴 **Data Loss**: `passportUrl` is **not saved** to the database after IPFS publishing.
- 🔴 **UI Gap**: No "Publish" button exists in the Dashboard UI.
- ⚠️ **IPFS Pinning**: Mock by default; needs Pinata keys for real persistence.

## 6. Payments
- 🔴 **Testing Gap**: `POST /api/pi/payment/complete` has **ZERO** tests. This is high-risk for a production app.

---
**Conclusion**: The core infrastructure is solid, but 5-6 "last mile" bugs and missing tests are blocking a production-ready MVP.
