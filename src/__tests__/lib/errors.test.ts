/**
 * @jest-environment node
 */
import { apiError, apiSuccess } from '@/lib/errors';

describe('apiError', () => {
  it('returns correct status for VALIDATION_ERROR', async () => {
    const res = apiError('VALIDATION_ERROR', 'Bad input');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.error).toBe('Bad input');
  });

  it('returns correct status for UNAUTHORIZED', async () => {
    const res = apiError('UNAUTHORIZED', 'Not logged in');
    expect(res.status).toBe(401);
  });

  it('returns correct status for RATE_LIMITED', async () => {
    const res = apiError('RATE_LIMITED', 'Slow down');
    expect(res.status).toBe(429);
  });

  it('returns correct status for NOT_FOUND', async () => {
    const res = apiError('NOT_FOUND', 'User missing');
    expect(res.status).toBe(404);
  });

  it('returns correct status for CONFLICT', async () => {
    const res = apiError('CONFLICT', 'Already claimed');
    expect(res.status).toBe(409);
  });

  it('returns correct status for PI_AUTH_FAILED', async () => {
    const res = apiError('PI_AUTH_FAILED', 'Token bad');
    expect(res.status).toBe(401);
  });

  it('returns correct status for PI_PAYMENT_FAILED', async () => {
    const res = apiError('PI_PAYMENT_FAILED', 'Payment failed');
    expect(res.status).toBe(402);
  });

  it('returns correct status for INTERNAL_ERROR', async () => {
    const res = apiError('INTERNAL_ERROR', 'Something broke');
    expect(res.status).toBe(500);
  });

  it('includes details when provided', async () => {
    const details = [{ field: 'email', message: 'required' }];
    const res = apiError('VALIDATION_ERROR', 'Invalid', details);
    const body = await res.json();
    expect(body.details).toEqual(details);
  });
});

describe('apiSuccess', () => {
  it('returns 200 by default', async () => {
    const res = apiSuccess({ id: 1, name: 'test' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(1);
    expect(body.name).toBe('test');
  });

  it('returns custom status code', async () => {
    const res = apiSuccess({ created: true }, 201);
    expect(res.status).toBe(201);
  });
});
