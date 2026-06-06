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
 */
export function getClientIp(request: IpRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    return (
        request.ip ||
        (forwarded ? forwarded.split(",")[0].trim() : null) ||
        request.headers.get("x-real-ip") ||
        "unknown"
    );
}
