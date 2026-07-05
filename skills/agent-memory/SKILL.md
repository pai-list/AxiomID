---
name: Agent Memory
slug: agent-memory
tier: ADVANCED_TOOL
pricePi: 0
version: "1.0.0"
soulPrinciple: TRUSTCHAIN
chainable: true
tags: [memory, persistence, agent, hash-chain]
---

# Agent Memory

## الغرض — Purpose

Manages agent working memory with append-only log semantics and hash-chain integrity.

**English:** Provides agents with persistent working memory that maintains a tamper-evident log of all mutations. Every memory entry is hash-chained to its predecessor, ensuring any modification or deletion is cryptographically detectable.

**Arabic:** يوفر للمضيف ذاكرة عمل دائمة تحافظ على سجل مُثبت التلاعب من جميع الطفرات. كل سجل ذاكرة مُسلسل بالتجريبي الذي يسبقه، مما يضمن اكتشاف أي تعديل أو حذف بشكل تشفيري.

## مبدأ التوافق — Principle Alignment

This skill embodies **TRUSTCHAIN** (الحارس — The Guardian).

Every memory mutation is an append-only event. No entry is ever modified or deleted — only appended. The hash chain provides structural tamper evidence:

- **Append-only logs** — We don't delete history. We append truth.
- **Hash chains** — Each entry references the previous hash. Tamper evidence is structural, not policy-based.
- **Reads are queries, not state** — Derive from the event log, never from "current state."

## سير التشغيل — Operational Flow

1. **Input validation** — Validate entry against `MemoryEntrySchema` using Zod. Reject entries with empty content or content exceeding 10,000 characters.

2. **Hash computation** — Compute SHA-256 hash of `JSON.stringify({ content: entry.content, previousHash })`. This creates a tamper-evident chain.

3. **Store operation** — Append the validated entry to the in-memory store. If the store exceeds `maxEntries`, evict the oldest non-pinned entries first.

4. **Telemetry** — Emit `memory.append` event with entry ID and chain length for observability.

5. **Return** — Return the full entry including its computed hash.

## أنماط الفشل — Failure Modes

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Store unavailable | Connection timeout | Queue locally in array, retry on next heartbeat |
| Hash collision | Same hash as existing entry | Reject entry, log `memory.hash_collision` incident |
| Memory limit exceeded | Store.length > maxEntries | Evict oldest non-pinned entries until under limit |
| Invalid input | Zod validation error | Return `VALIDATION_ERROR` with specific field errors |
| Serialization error | JSON.stringify fails | Reject entry, log error, return `INTERNAL_ERROR` |
