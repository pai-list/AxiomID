# 🏗️ Architecture: Sovereign Identity Infrastructure

## The Sovereign Stack
AxiomID is built as a multi-layer protocol:
1. **L1 - Sovereign Anchor (Pi Network)**: Proof of ownership, VC signing, and economic settlement.
2. **L2 - Sovereign Edge (Cloudflare)**: 
   - **Durable Objects**: Manages live agent session state.
   - **Workflows**: Orchestrates long-running autonomous missions.
   - **D1**: Append-only event log for the Living Passport.
3. **L3 - DX Layer (Vercel)**: Next.js 16 / React 19 for high-fidelity identity visualization and the Developer Experience.

## Core Axioms
- **Persistence = Append-Only Log**: No mutations, everything is versioned.
- **Reads are Queries**: State is derived from the event log, never stored as "current state" in the core.
- **Capability-Based Access**: Access is granted via time-bound capability tokens, not broad sessions.
