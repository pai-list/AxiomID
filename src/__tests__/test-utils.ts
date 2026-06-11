import { NextRequest } from 'next/server';

/**
 * Helper to mock an authenticated request.
 * Since requireAuth reads headers, we simulate the presence of an auth header.
 */
export function mockAuthenticatedRequest(token: string = 'mock-token'): NextRequest {
  const request = new NextRequest('http://localhost:3000', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return request;
}
