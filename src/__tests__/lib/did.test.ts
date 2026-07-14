import { createUserDid, createIssuerDid, createPiDid, deriveDid } from '@/lib/did';
import crypto from 'crypto';

describe('DID Utils', () => {
  describe('createUserDid', () => {
    it('creates correct user DID format (PR change: did:axiom:pi:<userId>)', () => {
      expect(createUserDid('user123')).toBe('did:axiom:pi:user123');
    });

    it('throws on empty userId', () => {
      expect(() => createUserDid('')).toThrow();
    });
  });

  describe('createIssuerDid', () => {
    it('creates correct issuer DID format', () => {
      expect(createIssuerDid()).toBe('did:axiom:issuer');
    });
  });

  describe('createPiDid', () => {
    it('creates correct Pi DID format (PR change: dropped axiomid.app segment)', () => {
      expect(createPiDid('pi-uid-123')).toBe('did:axiom:pi:pi-uid-123');
    });

    it('URI-encodes special characters in the uid', () => {
      expect(createPiDid('a b/c')).toBe('did:axiom:pi:a%20b%2Fc');
    });

    it('throws on an empty uid', () => {
      expect(() => createPiDid('')).toThrow();
    });
  });

  describe('deriveDid', () => {
    it('derives a did:axiom:pi:<hash> from a JWT-like assertion (PR change: pi segment instead of user)', () => {
      const assertion = 'header.payload.signature';
      const expectedHash = crypto.createHash('sha256').update('payload').digest('hex').slice(0, 16);
      expect(deriveDid(assertion)).toBe(`did:axiom:pi:${expectedHash}`);
    });

    it('produces a DID with exactly 16 hex characters after the prefix', () => {
      const did = deriveDid('header.somepayload.sig');
      const suffix = did.replace('did:axiom:pi:', '');
      expect(suffix).toHaveLength(16);
      expect(suffix).toMatch(/^[0-9a-f]{16}$/);
    });

    it('produces different DIDs for different payloads', () => {
      const did1 = deriveDid('h.payloadOne.s');
      const did2 = deriveDid('h.payloadTwo.s');
      expect(did1).not.toBe(did2);
    });

    it('produces the same DID for the same payload (deterministic)', () => {
      const did1 = deriveDid('h.samepayload.s');
      const did2 = deriveDid('h.samepayload.s');
      expect(did1).toBe(did2);
    });

    it('handles an assertion with no payload segment gracefully', () => {
      const emptyHash = crypto.createHash('sha256').update('').digest('hex').slice(0, 16);
      expect(deriveDid('onlyheader')).toBe(`did:axiom:pi:${emptyHash}`);
    });
  });
});
