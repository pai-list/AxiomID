export const REVENUE_SPLIT = {
  authorShare: 0.7,
  stakersShare: 0.2,
  protocolShare: 0.1,
} as const

export type RevenueSplitKey = keyof typeof REVENUE_SPLIT

export const PI_TREASURY_FEE = 0.1

export const MIN_PAYMENT_AMOUNT = 0.1
export const MAX_PAYMENT_AMOUNT = 1000

export const PAYMENT_PURPOSE = {
  SKILL_PURCHASE: 'skill_purchase',
  AGENT_SPAWN: 'agent_spawn',
  STAMP_CLAIM: 'stamp_claim',
  BOUNTY_REWARD: 'bounty_reward',
} as const

export type PaymentPurpose = (typeof PAYMENT_PURPOSE)[keyof typeof PAYMENT_PURPOSE]

export function splitRevenue(amount: number, fee?: number): Record<RevenueSplitKey, number> {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('amount must be a non-negative finite number');
  }
  const treasuryFee = fee ?? PI_TREASURY_FEE
  if (!Number.isFinite(treasuryFee) || treasuryFee < 0 || treasuryFee > 1) {
    throw new Error('fee must be a finite number in [0, 1]');
  }
  const afterFee = amount * (1 - treasuryFee)
  const authorShare = Math.round(afterFee * REVENUE_SPLIT.authorShare * 100) / 100
  const stakersShare = Math.round(afterFee * REVENUE_SPLIT.stakersShare * 100) / 100
  const protocolShare = Math.round(afterFee * REVENUE_SPLIT.protocolShare * 100) / 100
  const rounded = authorShare + stakersShare + protocolShare
  const residual = Math.round((afterFee - rounded) * 100) / 100
  return {
    authorShare: authorShare + residual,
    stakersShare,
    protocolShare,
  }
}
