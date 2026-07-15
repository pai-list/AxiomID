/**
 * @jest-environment node
 */

import {
  REVENUE_SPLIT,
  splitRevenue,
  PI_TREASURY_FEE,
  PAYMENT_PURPOSE,
} from '@/lib/economics/constants';

describe('REVENUE_SPLIT', () => {
  it('sums to 1.0', () => {
    const total = REVENUE_SPLIT.authorShare + REVENUE_SPLIT.stakersShare + REVENUE_SPLIT.protocolShare;
    expect(total).toBeCloseTo(1.0, 10);
  });

  it('author gets 70%', () => {
    expect(REVENUE_SPLIT.authorShare).toBe(0.7);
  });

  it('stakers get 20%', () => {
    expect(REVENUE_SPLIT.stakersShare).toBe(0.2);
  });

  it('protocol gets 10%', () => {
    expect(REVENUE_SPLIT.protocolShare).toBe(0.1);
  });
});

describe('splitRevenue', () => {
  it('splits revenue after 10% treasury fee', () => {
    const result = splitRevenue(100);
    expect(result.authorShare).toBe(63);
    expect(result.stakersShare).toBe(18);
    expect(result.protocolShare).toBe(9);
  });

  it('handles zero amount', () => {
    const result = splitRevenue(0);
    expect(result.authorShare).toBe(0);
    expect(result.stakersShare).toBe(0);
    expect(result.protocolShare).toBe(0);
  });

  it('accepts custom fee', () => {
    const result = splitRevenue(100, 0.2);
    expect(result.authorShare).toBeCloseTo(56, 0);
  });
});

describe('PI_TREASURY_FEE', () => {
  it('is 10%', () => {
    expect(PI_TREASURY_FEE).toBe(0.1);
  });
});

describe('PAYMENT_PURPOSE', () => {
  it('has skill_purchase', () => {
    expect(PAYMENT_PURPOSE.SKILL_PURCHASE).toBe('skill_purchase');
  });

  it('has agent_spawn', () => {
    expect(PAYMENT_PURPOSE.AGENT_SPAWN).toBe('agent_spawn');
  });

  it('has stamp_claim', () => {
    expect(PAYMENT_PURPOSE.STAMP_CLAIM).toBe('stamp_claim');
  });

  it('has bounty_reward', () => {
    expect(PAYMENT_PURPOSE.BOUNTY_REWARD).toBe('bounty_reward');
  });
});
