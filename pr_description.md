## 🧪 [Testing] Add unit tests for `getClientIp` function

### 🎯 **What:** The testing gap addressed
The `getClientIp` function in `src/lib/ip.ts` lacked a unit test suite to ensure its behavior correctly prioritizes `request.ip` over headers and correctly falls back depending on the environment (Vercel vs non-Vercel).

### 📊 **Coverage:** What scenarios are now tested
The new `src/__tests__/lib/ip.test.ts` file covers the following scenarios:
- It returns `request.ip` if provided directly on the request object.
- In a Vercel environment (`VERCEL=1`), it prioritizes the first IP from `x-forwarded-for` (which represents the true client IP provided by Vercel), trimming whitespace, and falls back to `x-real-ip` if `x-forwarded-for` is absent.
- In a non-Vercel environment, it ignores `x-forwarded-for` (which could be spoofed) and checks `x-real-ip`.
- It safely falls back to returning `"unknown"` when no relevant IP or header is present.

### ✨ **Result:** The improvement in test coverage
We now have reliable, isolated tests for resolving the client IP, ensuring that it remains secure and doesn't suffer from unintended spoofing vulnerabilities during refactors or environment changes.
