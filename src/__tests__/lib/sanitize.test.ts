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
  });

  describe("canonicalize", () => {
    it("returns null for null input", () => {
      expect(canonicalize(null)).toBeNull();
    });

    it("returns primitives as-is", () => {
      expect(canonicalize(42)).toBe(42);
      expect(canonicalize("hello")).toBe("hello");
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
  });
});
