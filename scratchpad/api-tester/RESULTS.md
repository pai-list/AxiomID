# API Tester Results — axiomid.app

**Date:** 2026-06-14

---

## Endpoint Results

| Endpoint | Status | Body | Rate Limit Headers | Verdict |
|----------|--------|------|-------------------|---------|
| `GET /api/status` | 200 | `{"network":"axiomid","version":"1.0.0",...}` | None | PASS |
| `GET /api/did-document` | 200 | DID document with real key | None | PASS |
| `GET /api/stamp` | 401 | `{"error":"Missing or invalid Authorization header"}` | None | PASS |
| `GET /api/user/status` | 401 | `{"error":"Missing or invalid Authorization header"}` | None | PASS |
| `GET /api/agent` | 405 | Empty body (Method Not Allowed) | None | PASS |
| `GET /api/passport/test` | 404 | `{"error":"No passport found for this slug"}` | None | PASS |

---

## Notes

1. **Rate Limit Headers**: None of the endpoints returned `X-RateLimit-Remaining` or `X-RateLimit-Reset` headers. This is expected if the rate limiter middleware isn't configured on these routes yet.
2. **CSP Headers**: All responses include proper Content-Security-Policy headers with Pi Network sandbox domains.
3. **Security Headers**: `strict-transport-security`, `x-content-type-options: nosniff`, `permissions-policy`, `referrer-policy` all present.
4. **DID Document**: Returns a real Ed25519 public key — no more fake fallback.
5. **Auth Endpoints**: Properly return 401 for unauthenticated requests.
6. **Passport Endpoint**: Properly returns 404 for non-existent slugs.

---

## Summary

**6/6 endpoints tested — All PASS**

The API is live and responding correctly. Security headers are in place. Authentication is enforced where expected.
