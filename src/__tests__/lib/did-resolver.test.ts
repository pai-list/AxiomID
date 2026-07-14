
import { resolveDid } from '@/lib/did-resolver';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('resolveDid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns user if DID is found (PR change: select now includes id and piUid)', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      did: 'did:axiom:pi:1',
      piUid: 'pi-uid-1',
      kycStatus: 'VERIFIED',
    } as any);
    const result = await resolveDid('did:axiom:pi:1');
    expect(result).toEqual({
      id: 'user-1',
      did: 'did:axiom:pi:1',
      piUid: 'pi-uid-1',
      kycStatus: 'VERIFIED',
    });
    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
      where: { did: 'did:axiom:pi:1' },
      select: { id: true, did: true, piUid: true, kycStatus: true },
    });
  });

  it('returns null if DID is not found', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);
    const result = await resolveDid('did:axiom:not-found');
    expect(result).toBeNull();
  });

  it('returns null if the user record has no did set', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'user-2',
      did: null,
      piUid: 'pi-uid-2',
      kycStatus: 'PENDING',
    } as any);
    const result = await resolveDid('did:axiom:pi:2');
    expect(result).toBeNull();
  });

  it('returns the user even when piUid is null (fallback to id upstream)', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'user-3',
      did: 'did:axiom:pi:3',
      piUid: null,
      kycStatus: 'VERIFIED',
    } as any);
    const result = await resolveDid('did:axiom:pi:3');
    expect(result).toEqual({
      id: 'user-3',
      did: 'did:axiom:pi:3',
      piUid: null,
      kycStatus: 'VERIFIED',
    });
  });
});
