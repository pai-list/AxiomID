import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/errors';

export async function requireUser(request: NextRequest) {
  const walletAddress = request.headers.get('x-wallet-address');
  if (!walletAddress) {
    return { error: apiError('UNAUTHORIZED', 'Missing x-wallet-address header'), user: null };
  }

  const user = await prisma.user.findUnique({ where: { walletAddress } });
  if (!user) {
    return { error: apiError('UNAUTHORIZED', 'User not found for this wallet'), user: null };
  }

  return { error: null, user };
}
