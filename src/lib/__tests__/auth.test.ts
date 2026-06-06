// Mock 'siwe' before importing the module under test
jest.mock('siwe', () => ({
  SiweMessage: jest.fn(),
}));

import { isValidWalletAddress, verifySignature } from '../auth';
import { SiweMessage } from 'siwe';

const MockSiweMessage = SiweMessage as jest.MockedClass<typeof SiweMessage>;

describe('isValidWalletAddress', () => {
  it('should return true for a valid checksummed Ethereum address', () => {
    expect(isValidWalletAddress('0x1234567890123456789012345678901234567890')).toBe(true);
  });

  it('should return true for a valid lowercase hex address', () => {
    expect(isValidWalletAddress('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')).toBe(true);
  });

  it('should return true for a valid uppercase hex address', () => {
    expect(isValidWalletAddress('0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD')).toBe(true);
  });

  it('should return true for a mixed-case (EIP-55 checksum) address', () => {
    expect(isValidWalletAddress('0xAbCdEf1234567890AbCdEf1234567890AbCdEf12')).toBe(true);
  });

  it('should return false for an address without 0x prefix', () => {
    expect(isValidWalletAddress('1234567890123456789012345678901234567890')).toBe(false);
  });

  it('should return false for an address that is too short', () => {
    expect(isValidWalletAddress('0x1234567890')).toBe(false);
  });

  it('should return false for an address that is too long', () => {
    expect(isValidWalletAddress('0x12345678901234567890123456789012345678901')).toBe(false);
  });

  it('should return false for an address with invalid characters', () => {
    expect(isValidWalletAddress('0x123456789012345678901234567890123456789g')).toBe(false);
  });

  it('should return false for an empty string', () => {
    expect(isValidWalletAddress('')).toBe(false);
  });

  it('should return false for a non-hex string of the correct length', () => {
    expect(isValidWalletAddress('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG')).toBe(false);
  });
});

describe('verifySignature', () => {
  const mockMessage = 'localhost:3000 wants you to sign in with your Ethereum account:\n0x1234567890123456789012345678901234567890';
  const mockSignature = '0xdeadbeef';

  beforeEach(() => {
    MockSiweMessage.mockClear();
  });

  it('should return success=true with data when verification succeeds', async () => {
    const mockData = { address: '0x1234567890123456789012345678901234567890' };
    const mockVerify = jest.fn().mockResolvedValue({ success: true, data: mockData });
    MockSiweMessage.mockImplementation(() => ({ verify: mockVerify } as any));

    const result = await verifySignature(mockMessage, mockSignature);

    expect(result.success).toBe(true);
    expect(result.data).toBe(mockData);
    expect(result.error).toBeUndefined();
    expect(MockSiweMessage).toHaveBeenCalledWith(mockMessage);
    expect(mockVerify).toHaveBeenCalledWith({ signature: mockSignature });
  });

  it('should return success=false with error when verification fails', async () => {
    const mockError = new Error('Signature mismatch');
    const mockVerify = jest.fn().mockResolvedValue({ success: false, error: mockError });
    MockSiweMessage.mockImplementation(() => ({ verify: mockVerify } as any));

    const result = await verifySignature(mockMessage, mockSignature);

    expect(result.success).toBe(false);
    expect(result.error).toBe(mockError);
    expect(result.data).toBeUndefined();
  });

  it('should return success=false when verify returns success=false with no error', async () => {
    const mockVerify = jest.fn().mockResolvedValue({ success: false });
    MockSiweMessage.mockImplementation(() => ({ verify: mockVerify } as any));

    const result = await verifySignature(mockMessage, mockSignature);

    expect(result.success).toBe(false);
  });

  it('should return success=false with caught error when SiweMessage constructor throws', async () => {
    const constructorError = new Error('Invalid SIWE message format');
    MockSiweMessage.mockImplementation(() => { throw constructorError; });

    const result = await verifySignature('bad message', mockSignature);

    expect(result.success).toBe(false);
    expect(result.error).toBe(constructorError);
  });

  it('should return success=false with caught error when verify() rejects', async () => {
    const networkError = new Error('Network failure');
    const mockVerify = jest.fn().mockRejectedValue(networkError);
    MockSiweMessage.mockImplementation(() => ({ verify: mockVerify } as any));

    const result = await verifySignature(mockMessage, mockSignature);

    expect(result.success).toBe(false);
    expect(result.error).toBe(networkError);
  });

  it('should pass the signature to the verify call', async () => {
    const specificSignature = '0xcafebabe';
    const mockVerify = jest.fn().mockResolvedValue({ success: true, data: {} });
    MockSiweMessage.mockImplementation(() => ({ verify: mockVerify } as any));

    await verifySignature(mockMessage, specificSignature);

    expect(mockVerify).toHaveBeenCalledWith({ signature: specificSignature });
  });
});