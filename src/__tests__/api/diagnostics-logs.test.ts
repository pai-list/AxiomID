/**
 * @jest-environment node
 */
import { GET, DELETE } from '@/app/api/diagnostics/logs/route';
import { getDiagnostics, clearDiagnostics } from '@/lib/diagnostics/capture';
import { logger } from '@/lib/logger';

jest.mock('@/lib/diagnostics/capture', () => ({
  getDiagnostics: jest.fn(),
  clearDiagnostics: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

jest.mock('@/lib/auth-middleware', () => ({
  requireAuth: jest.fn().mockResolvedValue({ user: { id: 'test-user' }, error: null }),
}));

jest.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true }),
  RATE_LIMITS: { authenticated: { limit: 100, windowMs: 60000 } },
}));

function mockAuthedRequest(): Request {
  return new Request('http://localhost', {
    headers: { authorization: 'Bearer test-token', 'x-forwarded-for': '127.0.0.1' },
  });
}

describe('Diagnostics Logs Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('returns diagnostics entries successfully', async () => {
      const mockEntries = [{ id: '1', message: 'test' }];
      (getDiagnostics as jest.Mock).mockReturnValue(mockEntries);

      const res = await GET(mockAuthedRequest());
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toEqual({ count: 1, entries: mockEntries });
    });

    it('handles errors and logs them', async () => {
      const error = new Error('Capture failed');
      (getDiagnostics as jest.Mock).mockImplementation(() => { throw error; });

      const res = await GET(mockAuthedRequest());
      expect(res.status).toBe(500);
      expect(logger.error).toHaveBeenCalledWith('[DIAGNOSTICS] Failed to get diagnostics logs', error);

      const body = await res.json();
      expect(body).toEqual({ error: 'Internal Server Error' });
    });

    it('returns 401 when not authenticated', async () => {
      const { requireAuth } = await import('@/lib/auth-middleware');
      (requireAuth as jest.Mock).mockResolvedValueOnce({ user: null, error: new Response('Unauthorized', { status: 401 }) });

      const res = await GET(new Request('http://localhost'));
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE', () => {
    it('clears diagnostics successfully', async () => {
      const res = await DELETE(mockAuthedRequest());
      expect(res.status).toBe(200);
      expect(clearDiagnostics).toHaveBeenCalled();

      const body = await res.json();
      expect(body).toEqual({ ok: true, message: 'Diagnostics cleared' });
    });

    it('handles errors and logs them', async () => {
      const error = new Error('Clear failed');
      (clearDiagnostics as jest.Mock).mockImplementation(() => { throw error; });

      const res = await DELETE(mockAuthedRequest());
      expect(res.status).toBe(500);
      expect(logger.error).toHaveBeenCalledWith('[DIAGNOSTICS] Failed to clear diagnostics logs', error);

      const body = await res.json();
      expect(body).toEqual({ error: 'Internal Server Error' });
    });

    it('returns 401 when not authenticated', async () => {
      const { requireAuth } = await import('@/lib/auth-middleware');
      (requireAuth as jest.Mock).mockResolvedValueOnce({ user: null, error: new Response('Unauthorized', { status: 401 }) });

      const res = await DELETE(new Request('http://localhost'));
      expect(res.status).toBe(401);
    });
  });
});
