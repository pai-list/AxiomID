export const TOTAL_STAMPS = 6;

export function calculateTrustScore(xp: number, stampsClaimed: number): number {
  const clamped = Math.max(0, Math.min(stampsClaimed, TOTAL_STAMPS));

  const xpScore = Math.min(100, Math.floor((xp || 0) / 10));

  const stampScore = TOTAL_STAMPS > 0
    ? Math.round((clamped / TOTAL_STAMPS) * 100)
    : 0;

  return Math.min(100, Math.round(xpScore * 0.7 + stampScore * 0.3));
}
