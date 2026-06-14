/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDelegatedTrustScore, addDelegation } from '@/lib/trust-server';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    delegatedTrust: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Trust Server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDelegatedTrustScore', () => {
    it('calculates sum of weights', async () => {
      mockPrisma.delegatedTrust.findMany.mockResolvedValue([
        { weight: 10 },
        { weight: 20 }
      ] as any);
      
      const score = await getDelegatedTrustScore('did:axiom:test');
      expect(score).toBe(30);
    });

    it('caps at 100', async () => {
      mockPrisma.delegatedTrust.findMany.mockResolvedValue([
        { weight: 60 },
        { weight: 60 }
      ] as any);
      
      const score = await getDelegatedTrustScore('did:axiom:test');
      expect(score).toBe(100);
    });
  });

  describe('addDelegation', () => {
    it('calls upsert correctly', async () => {
      mockPrisma.delegatedTrust.upsert.mockResolvedValue({ id: 'deleg-1' } as any);
      
      await addDelegation('did:axiom:from', 'did:axiom:to', 50);
      
      expect(mockPrisma.delegatedTrust.upsert).toHaveBeenCalledWith({
        where: { delegation_unique: { fromDid: 'did:axiom:from', toDid: 'did:axiom:to' } },
        update: { weight: 50 },
        create: { fromDid: 'did:axiom:from', toDid: 'did:axiom:to', weight: 50 },
      });
    });
  });
});
