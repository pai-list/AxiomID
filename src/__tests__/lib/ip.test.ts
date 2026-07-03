import { getClientIp } from "@/lib/ip";

describe("getClientIp", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    function createMockRequest(ip?: string, headers: Record<string, string> = {}) {
        return {
            ip,
            headers: {
                get: (name: string) => headers[name.toLowerCase()] || null,
            },
        };
    }

    it("should return request.ip if it is provided", () => {
        const req = createMockRequest("192.168.1.1");
        expect(getClientIp(req)).toBe("192.168.1.1");
    });

    it("should prioritize request.ip over headers", () => {
        const req = createMockRequest("192.168.1.1", {
            "x-forwarded-for": "10.0.0.1",
            "x-real-ip": "10.0.0.2",
        });
        expect(getClientIp(req)).toBe("192.168.1.1");
    });

    describe("in Vercel environment", () => {
        beforeEach(() => {
            process.env.VERCEL = "1";
        });

        it("should return the first IP from x-forwarded-for", () => {
            const req = createMockRequest(undefined, {
                "x-forwarded-for": "203.0.113.1, 198.51.100.1",
            });
            expect(getClientIp(req)).toBe("203.0.113.1");
        });

        it("should trim the IP from x-forwarded-for", () => {
            const req = createMockRequest(undefined, {
                "x-forwarded-for": "  203.0.113.2  ",
            });
            expect(getClientIp(req)).toBe("203.0.113.2");
        });

        it("should fall back to x-real-ip if x-forwarded-for is missing", () => {
            const req = createMockRequest(undefined, {
                "x-real-ip": "198.51.100.2",
            });
            expect(getClientIp(req)).toBe("198.51.100.2");
        });

        it("should return 'unknown' if no relevant headers are present", () => {
            const req = createMockRequest(undefined, {
                "other-header": "123",
            });
            expect(getClientIp(req)).toBe("unknown");
        });
    });

    describe("in non-Vercel environment", () => {
        beforeEach(() => {
            delete process.env.VERCEL;
        });

        it("should ignore x-forwarded-for and use x-real-ip if available", () => {
            const req = createMockRequest(undefined, {
                "x-forwarded-for": "203.0.113.1",
                "x-real-ip": "198.51.100.3",
            });
            expect(getClientIp(req)).toBe("198.51.100.3");
        });

        it("should return 'unknown' if x-forwarded-for is provided but x-real-ip is missing", () => {
            const req = createMockRequest(undefined, {
                "x-forwarded-for": "203.0.113.1",
            });
            expect(getClientIp(req)).toBe("unknown");
        });

        it("should fall back to x-real-ip if x-forwarded-for is missing", () => {
            const req = createMockRequest(undefined, {
                "x-real-ip": "198.51.100.4",
            });
            expect(getClientIp(req)).toBe("198.51.100.4");
        });

        it("should return 'unknown' if no relevant headers are present", () => {
            const req = createMockRequest();
            expect(getClientIp(req)).toBe("unknown");
        });
    });
});
