export const PRISTINE_MULTIPLIER = 2.0
export const REPEATED_MULTIPLIER = 0.8
export const STALE_MULTIPLIER = 0.5
export const STALE_THRESHOLD = 9

export type PathKey = string

export interface PristinePathResult {
  multiplier: number
  isPristine: boolean
  label: 'pristine' | 'repeated' | 'stale'
}

export function evaluatePath(uses: number): PristinePathResult {
  if (uses <= 0) {
    return { multiplier: PRISTINE_MULTIPLIER, isPristine: true, label: 'pristine' }
  }
  if (uses >= STALE_THRESHOLD) {
    return { multiplier: STALE_MULTIPLIER, isPristine: false, label: 'stale' }
  }
  return { multiplier: REPEATED_MULTIPLIER, isPristine: false, label: 'repeated' }
}

export function computeReward(
  baseXp: number,
  pathUses: number,
): number {
  const { multiplier } = evaluatePath(pathUses)
  return Math.round(baseXp * multiplier)
}

export function buildPathKey(...segments: string[]): PathKey {
  return segments.filter(Boolean).join(':')
}
