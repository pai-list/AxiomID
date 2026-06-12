import '@testing-library/jest-dom'
import { fetch, Request, Response, Headers } from 'undici'
import { TextEncoder, TextDecoder } from 'util'

// Polyfill Web APIs for Next.js 13+ route handlers
if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder
}
if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder
}
if (!global.fetch) {
  global.fetch = fetch
  global.Request = Request
  global.Response = Response
  global.Headers = Headers
}

// Global Mock for Auth Middleware
jest.mock('@/lib/auth-middleware', () => ({
  requireAuth: jest.fn().mockResolvedValue({
    error: null,
    user: {
      id: 'mock-user-id',
      walletAddress: 'pi:mockuser',
      piUid: 'mock-pi-uid',
      piUsername: 'mockuser',
      xp: 0,
      tier: 'Beginner',
    },
  }),
}));

process.env.ISSUER_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIJPXm5IHbMq9+f2t/c3EbitLbv6pvIQzLWEHZaQ1jkvm
-----END PRIVATE KEY-----`;

process.env.PI_TOKEN_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // 32-byte hex

