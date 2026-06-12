import { safeJsonStringify, safeJsonParse, sanitizeForDisplay } from "@/lib/sanitize";

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

  describe("safeJsonParse", () => {
    it("returns null for falsy inputs", () => {
      expect(safeJsonParse(null)).toBeNull();
      expect(safeJsonParse(undefined)).toBeNull();
      expect(safeJsonParse("")).toBeNull();
    });

    it("parses valid JSON", () => {
      const data = { count: 42 };
      expect(safeJsonParse(JSON.stringify(data))).toEqual(data);
    });

    it("returns null for invalid JSON", () => {
      expect(safeJsonParse("not-a-json")).toBeNull();
    });
  });

  describe("sanitizeForDisplay", () => {
    it("strips HTML tags and trims whitespace", () => {
      expect(sanitizeForDisplay("  <b>Hello</b> <i>World</i>  ", 100)).toBe("Hello World");
    });

    it("respects max length constraint", () => {
      expect(sanitizeForDisplay("1234567890", 5)).toBe("12345");
    });
  });
});
