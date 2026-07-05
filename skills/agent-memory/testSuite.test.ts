import {
  validateEntry,
  hashChain,
  generateEntryId,
  appendToMemory,
  queryMemory,
  verifyChain,
  MemoryEntry,
  StoredEntry,
} from "./agentScript";

describe("Agent Memory Skill", () => {
  // ─── validateEntry ────────────────────────────────────────────────────

  describe("validateEntry", () => {
    it("accepts a valid entry", () => {
      const entry = validateEntry({ content: "Hello, world" });
      expect(entry.content).toBe("Hello, world");
      expect(entry.pinned).toBe(false);
    });

    it("accepts entry with metadata", () => {
      const entry = validateEntry({
        content: "Test",
        metadata: { source: "api" },
        pinned: true,
      });
      expect(entry.metadata).toEqual({ source: "api" });
      expect(entry.pinned).toBe(true);
    });

    it("rejects empty content", () => {
      expect(() => validateEntry({ content: "" })).toThrow("content is required");
    });

    it("rejects content exceeding 10000 characters", () => {
      const longContent = "x".repeat(10001);
      expect(() => validateEntry({ content: longContent })).toThrow(
        "content exceeds 10000 characters"
      );
    });

    it("accepts content at exactly 10000 characters", () => {
      const maxContent = "x".repeat(10000);
      const entry = validateEntry({ content: maxContent });
      expect(entry.content.length).toBe(10000);
    });
  });

  // ─── hashChain ────────────────────────────────────────────────────────

  describe("hashChain", () => {
    it("produces a deterministic 64-character hex hash", () => {
      const entry: MemoryEntry = { content: "test", pinned: false };
      const hash = hashChain(entry, "prev-hash");
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("produces different hashes for different content", () => {
      const hash1 = hashChain({ content: "a", pinned: false }, "prev");
      const hash2 = hashChain({ content: "b", pinned: false }, "prev");
      expect(hash1).not.toBe(hash2);
    });

    it("produces different hashes for different previousHash", () => {
      const entry: MemoryEntry = { content: "same", pinned: false };
      const hash1 = hashChain(entry, "hash-a");
      const hash2 = hashChain(entry, "hash-b");
      expect(hash1).not.toBe(hash2);
    });

    it("produces the same hash for same inputs", () => {
      const entry: MemoryEntry = { content: "consistent", pinned: false };
      const hash1 = hashChain(entry, "prev");
      const hash2 = hashChain(entry, "prev");
      expect(hash1).toBe(hash2);
    });
  });

  // ─── generateEntryId ──────────────────────────────────────────────────

  describe("generateEntryId", () => {
    it("generates a valid UUID", () => {
      const id = generateEntryId();
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    it("generates unique IDs", () => {
      const id1 = generateEntryId();
      const id2 = generateEntryId();
      expect(id1).not.toBe(id2);
    });
  });

  // ─── appendToMemory ───────────────────────────────────────────────────

  describe("appendToMemory", () => {
    it("appends to an empty store with genesis hash", () => {
      const entry: MemoryEntry = { content: "first", pinned: false };
      const { store, entry: stored } = appendToMemory(entry, []);

      expect(store).toHaveLength(1);
      expect(stored.content).toBe("first");
      expect(stored.previousHash).toBe(
        "0000000000000000000000000000000000000000000000000000000000000000"
      );
      expect(stored.id).toBeDefined();
      expect(stored.hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("chains entries correctly", () => {
      const e1: MemoryEntry = { content: "first", pinned: false };
      const e2: MemoryEntry = { content: "second", pinned: false };

      const r1 = appendToMemory(e1, []);
      const r2 = appendToMemory(e2, r1.store);

      expect(r2.entry.previousHash).toBe(r1.entry.hash);
      expect(r2.store).toHaveLength(2);
    });

    it("evicts oldest non-pinned entries when over limit", () => {
      const store: StoredEntry[] = [];
      for (let i = 0; i < 5; i++) {
        const r = appendToMemory(
          { content: `entry-${i}`, pinned: false },
          store,
          5
        );
        store.push(...r.store.slice(store.length));
      }

      // Add one more to trigger eviction
      const { store: newStore } = appendToMemory(
        { content: "entry-5", pinned: false },
        store,
        5
      );

      expect(newStore.length).toBeLessThanOrEqual(5);
      expect(newStore[0].content).not.toBe("entry-0"); // oldest evicted
    });

    it("never evicts pinned entries", () => {
      const store: StoredEntry[] = [];
      // Fill with pinned entries
      for (let i = 0; i < 5; i++) {
        const r = appendToMemory(
          { content: `pinned-${i}`, pinned: true },
          store,
          5
        );
        store.push(...r.store.slice(store.length));
      }

      // Add one more to try to trigger eviction
      const { store: newStore } = appendToMemory(
        { content: "extra", pinned: false },
        store,
        5
      );

      // All pinned entries should survive
      const pinnedCount = newStore.filter((e) => e.pinned).length;
      expect(pinnedCount).toBe(5);
    });
  });

  // ─── queryMemory ──────────────────────────────────────────────────────

  describe("queryMemory", () => {
    it("returns all entries when no filter", () => {
      const store: StoredEntry[] = [
        {
          content: "a",
          pinned: false,
          id: "1",
          hash: "h1",
          previousHash: "p0",
          createdAt: 1,
        },
        {
          content: "b",
          pinned: false,
          id: "2",
          hash: "h2",
          previousHash: "h1",
          createdAt: 2,
        },
      ];

      const result = queryMemory(store);
      expect(result).toHaveLength(2);
    });

    it("filters entries by predicate", () => {
      const store: StoredEntry[] = [
        {
          content: "a",
          pinned: true,
          id: "1",
          hash: "h1",
          previousHash: "p0",
          createdAt: 1,
        },
        {
          content: "b",
          pinned: false,
          id: "2",
          hash: "h2",
          previousHash: "h1",
          createdAt: 2,
        },
      ];

      const result = queryMemory(store, (e) => e.pinned);
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("a");
    });
  });

  // ─── verifyChain ──────────────────────────────────────────────────────

  describe("verifyChain", () => {
    it("returns -1 for a valid chain", () => {
      const store: StoredEntry[] = [];
      const r1 = appendToMemory({ content: "a", pinned: false }, []);
      store.push(r1.entry);
      const r2 = appendToMemory({ content: "b", pinned: false }, store);
      store.push(r2.entry);

      expect(verifyChain(store)).toBe(-1);
    });

    it("returns index of broken link", () => {
      const store: StoredEntry[] = [];
      const r1 = appendToMemory({ content: "a", pinned: false }, []);
      store.push(r1.entry);
      const r2 = appendToMemory({ content: "b", pinned: false }, store);
      store.push(r2.entry);

      // Tamper with entry
      store[1].hash = "tampered-hash";

      expect(verifyChain(store)).toBe(1);
    });
  });
});
