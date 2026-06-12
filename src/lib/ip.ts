/**
 * Simple interface for the parts of Request we need,
 * helping us avoid a dependency on next/server in tests.
 */
interface IpRequest {
    ip?: string;
    headers: {
        get(name: string): string | null;
    };
}

/**
 * Resolves the client's IP address from a request, prioritizing
 * trusted framework-provided IP over potentially spoofed headers.
 * In Vercel production, `request.ip` is the true client IP set by
 * the platform. Falls back to x-forwarded-for only when on Vercel
 * (which strips untrusted headers) or in local dev.
 */
export function getClientIp(request: IpRequest): string {
    if (request.ip) return request.ip;

    const isVercel = !!process.env.VERCEL;
    const forwarded = request.headers.get("x-forwarded-for");

    if (forwarded) {
        const first = forwarded.split(",")[0].trim();
        if (isVercel) return first;
    }

    return request.headers.get("x-real-ip") || "unknown";
}
