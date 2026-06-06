import { SiweMessage } from 'siwe';

export function isValidWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export async function verifySignature(message: string, signature: string): Promise<{ success: boolean; data?: SiweMessage; error?: unknown }> {
  try {
    const siweMessage = new SiweMessage(message);
    const result = await siweMessage.verify({ signature });

    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
  } catch (error) {
    return { success: false, error };
  }
}
