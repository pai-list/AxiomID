/**
 * @jest-environment node
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('verifyWithPiVerify', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    mockFetch.mockReset();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns unverified and skips API call when PI_VERIFY_API_KEY is not set', async () => {
    delete process.env.PI_VERIFY_API_KEY;
    const { verifyWithPiVerify } = await import('@/lib/pi-verify');
    const result = await verifyWithPiVerify('pi-123', 'token-abc');
    expect(result).toEqual({ verified: false, uid: 'pi-123', provider: 'pi_verify' });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns verified when PiVerify API confirms KYC', async () => {
    process.env.PI_VERIFY_API_KEY = 'test-api-key';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ verified: true }),
    });
    const { verifyWithPiVerify } = await import('@/lib/pi-verify');
    const result = await verifyWithPiVerify('pi-123', 'token-abc');
    expect(result).toEqual({ verified: true, uid: 'pi-123', provider: 'pi_verify' });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://piverify.minepi.com/api/v1/verify',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-api-key',
        }),
        body: JSON.stringify({ uid: 'pi-123', access_token: 'token-abc' }),
      }),
    );
  });

  it('returns unverified when PiVerify API returns non-ok status', async () => {
    process.env.PI_VERIFY_API_KEY = 'test-api-key';
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => 'Forbidden',
    });
    const { verifyWithPiVerify } = await import('@/lib/pi-verify');
    const result = await verifyWithPiVerify('pi-123', 'token-abc');
    expect(result).toEqual({ verified: false, uid: 'pi-123', provider: 'pi_verify' });
  });

  it('returns unverified when PiVerify API throws', async () => {
    process.env.PI_VERIFY_API_KEY = 'test-api-key';
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    const { verifyWithPiVerify } = await import('@/lib/pi-verify');
    const result = await verifyWithPiVerify('pi-123', 'token-abc');
    expect(result).toEqual({ verified: false, uid: 'pi-123', provider: 'pi_verify' });
  });

  it('uses PI_VERIFY_API_BASE_URL override when set', async () => {
    process.env.PI_VERIFY_API_KEY = 'test-api-key';
    process.env.PI_VERIFY_API_BASE_URL = 'https://custom.example.com/api';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ verified: false }),
    });
    const { verifyWithPiVerify } = await import('@/lib/pi-verify');
    await verifyWithPiVerify('pi-123', 'token-abc');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://custom.example.com/api/verify',
      expect.any(Object),
    );
  });
});
