import { safeJsonStringify, canonicalize } from "@/lib/sanitize";

describe("Sanitize library", () => {
  describe("safeJsonStringify", () => {
    it("returns null for null or undefined", () => {
      expect(safeJsonStringify(null)).toBeNull();
      expect(safeJsonStringify(undefined)).toBeNull();
    });

    it("stringifies a valid object", () => {
      const obj = { name: "Alice", active: true };
      expect(safeJsonStringify(obj)).toBe(JSON.stringify(obj));
    });

    it("handles circular references gracefully by returning null", () => {
      const obj: Record<string, unknown> = { name: "Alice" };
      obj.self = obj; // circular
      expect(safeJsonStringify(obj)).toBeNull();
    });

    it("returns null for objects exceeding max length limit", () => {
      const largeObj = { data: "x".repeat(10005) };
      expect(safeJsonStringify(largeObj)).toBeNull();
    });

    it("returns null when JSON.stringify throws an error (e.g., BigInt)", () => {
      expect(safeJsonStringify({ val: BigInt(9007199254740991) })).toBeNull();
    });
  });

  describe("canonicalize", () => {
    it("returns null for null input", () => {
      expect(canonicalize(null)).toBeNull();
    });

    it("returns primitives as-is", () => {
      expect(canonicalize(42)).toBe(42);
      expect(canonicalize("hello")).toBe("hello");
      expect(canonicalize(true)).toBe(true);
      expect(canonicalize(undefined)).toBe(undefined);
    });

    it("sorts object keys", () => {
      expect(canonicalize({ b: 2, a: 1 })).toEqual({ a: 1, b: 2 });
    });

    it("recursively sorts nested objects", () => {
      expect(canonicalize({ z: { b: 2, a: 1 }, y: [3, 4] })).toEqual({
        y: [3, 4],
        z: { a: 1, b: 2 },
      });
    });

    it("handles empty objects and arrays", () => {
      expect(canonicalize({})).toEqual({});
      expect(canonicalize([])).toEqual([]);
    });

    it("canonicalizes objects within arrays without altering array order", () => {
      expect(canonicalize([{ b: 2, a: 1 }, { d: 4, c: 3 }])).toEqual([
        { a: 1, b: 2 },
        { c: 3, d: 4 },
      ]);
    });
  });
});
