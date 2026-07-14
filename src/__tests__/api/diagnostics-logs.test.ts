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

describe('Diagnostics Logs Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('returns diagnostics entries successfully', async () => {
      const mockEntries = [{ id: '1', message: 'test' }];
      (getDiagnostics as jest.Mock).mockReturnValue(mockEntries);

      const res = await GET();
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toEqual({ count: 1, entries: mockEntries });
    });

    it('handles errors and logs them', async () => {
      const error = new Error('Capture failed');
      (getDiagnostics as jest.Mock).mockImplementation(() => { throw error; });

      const res = await GET();
      expect(res.status).toBe(500);
      expect(logger.error).toHaveBeenCalledWith('[DIAGNOSTICS] Failed to get diagnostics logs', error);

      const body = await res.json();
      expect(body).toEqual({ error: 'Internal Server Error' });
    });
  });

  describe('DELETE', () => {
    it('clears diagnostics successfully', async () => {
      const res = await DELETE();
      expect(res.status).toBe(200);
      expect(clearDiagnostics).toHaveBeenCalled();

      const body = await res.json();
      expect(body).toEqual({ ok: true, message: 'Diagnostics cleared' });
    });

    it('handles errors and logs them', async () => {
      const error = new Error('Clear failed');
      (clearDiagnostics as jest.Mock).mockImplementation(() => { throw error; });

      const res = await DELETE();
      expect(res.status).toBe(500);
      expect(logger.error).toHaveBeenCalledWith('[DIAGNOSTICS] Failed to clear diagnostics logs', error);

      const body = await res.json();
      expect(body).toEqual({ error: 'Internal Server Error' });
    });
  });
});
