import { z } from "zod";
import crypto from "crypto";

// ─── Schema ──────────────────────────────────────────────────────────────────

const MemoryEntrySchema = z.object({
  content: z.string().min(1, "content is required").max(10000, "content exceeds 10000 characters"),
  metadata: z.record(z.string(), z.unknown()).optional(),
  pinned: z.boolean().default(false),
});

export type MemoryEntry = z.infer<typeof MemoryEntrySchema>;

export type StoredEntry = MemoryEntry & {
  id: string;
  hash: string;
  previousHash: string;
  createdAt: number;
};

// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Validates a raw input against the MemoryEntry schema.
 * @throws {z.ZodError} if validation fails
 */
export function validateEntry(entry: unknown): MemoryEntry {
  return MemoryEntrySchema.parse(entry);
}

// ─── Hash Chain ──────────────────────────────────────────────────────────────

/**
 * Computes a SHA-256 hash chain from an entry and its predecessor's hash.
 * This provides structural tamper evidence — any modification changes the hash.
 */
export function hashChain(entry: MemoryEntry, previousHash: string): string {
  const payload = JSON.stringify({
    content: entry.content,
    previousHash,
  });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

/**
 * Generates a unique ID for a memory entry.
 */
export function generateEntryId(): string {
  return crypto.randomUUID();
}

// ─── Store Operations ────────────────────────────────────────────────────────

const DEFAULT_MAX_ENTRIES = 200;
const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Rebuilds the hash chain for a list of entries after eviction.
 * Each entry's previousHash and hash are recomputed to maintain chain integrity.
 */
function rehashChain(entries: StoredEntry[]): StoredEntry[] {
  return entries.map((entry, i) => {
    const prevHash = i === 0 ? GENESIS_HASH : entries[i - 1].hash;
    const newHash = hashChain({ content: entry.content, pinned: entry.pinned, metadata: entry.metadata }, prevHash);
    return { ...entry, previousHash: prevHash, hash: newHash };
  });
}

/**
 * Appends a validated entry to the memory store with hash-chain integrity.
 * Evicts oldest non-pinned entries if the store exceeds maxEntries.
 * After eviction, the chain is rehashed to maintain integrity.
 */
export function appendToMemory(
  entry: MemoryEntry,
  store: StoredEntry[],
  maxEntries: number = DEFAULT_MAX_ENTRIES
): { store: StoredEntry[]; entry: StoredEntry } {
  const previousHash = store.length > 0
    ? store[store.length - 1].hash
    : GENESIS_HASH;

  const hash = hashChain(entry, previousHash);
  const id = generateEntryId();

  const storedEntry: StoredEntry = {
    ...entry,
    id,
    hash,
    previousHash,
    createdAt: Date.now(),
  };

  const newStore = [...store, storedEntry];

  // Evict oldest non-pinned entries if over limit
  if (newStore.length > maxEntries) {
    const evictCount = newStore.length - maxEntries;
    const pinnedIndices = new Set(
      newStore
        .map((e, i) => (e.pinned ? i : -1))
        .filter((i) => i !== -1)
    );

    let evicted = 0;
    const filtered = newStore.filter((_, i) => {
      if (evicted >= evictCount) return true;
      if (pinnedIndices.has(i)) return true;
      evicted++;
      return false;
    });

    // Rehash chain after eviction to maintain integrity
    const rehashed = rehashChain(filtered);
    return { store: rehashed, entry: rehashed[rehashed.length - 1] };
  }

  return { store: newStore, entry: storedEntry };
}

/**
 * Retrieves all entries from the store, optionally filtered by a predicate.
 */
export function queryMemory(
  store: StoredEntry[],
  filter?: (entry: StoredEntry) => boolean
): StoredEntry[] {
  if (!filter) return [...store];
  return store.filter(filter);
}

/**
 * Verifies the integrity of the hash chain.
 * Returns the index of the first broken link, or -1 if chain is valid.
 */
export function verifyChain(store: StoredEntry[]): number {
  if (store.length === 0) return -1;
  const firstExpected = hashChain(
    { content: store[0].content, pinned: store[0].pinned, metadata: store[0].metadata },
    "0000000000000000000000000000000000000000000000000000000000000000"
  );
  if (store[0].hash !== firstExpected) {
    return 0;
  }
  for (let i = 1; i < store.length; i++) {
    const expected = hashChain(
      { content: store[i].content, pinned: store[i].pinned, metadata: store[i].metadata },
      store[i - 1].hash
    );
    if (store[i].hash !== expected) {
      return i;
    }
  }
  return -1;
}
}
