/**
 * PWA App Badging Service
 * Provides a clean wrapper around the browser's App Badging API to show 
 * notifications on the home screen icon.
 */

import { logger } from '@/lib/logger';

export type BadgeEvent = 'XP_GAIN' | 'NEW_STAMP' | 'AGENT_READY';

interface BadgeConfig {
  XP_GAIN: { label: string; priority: 'low' | 'high' };
  NEW_STAMP: { label: string; priority: 'high' };
  AGENT_READY: { label: string; priority: 'high' };
}

const BADGE_CONFIG: BadgeConfig = {
  XP_GAIN: { label: 'XP Boost!', priority: 'low' },
  NEW_STAMP: { label: 'New Stamp!', priority: 'high' },
  AGENT_READY: { label: 'Agent Active', priority: 'high' },
};

/**
 * Updates the app badge count based on a specific event.
 * @param event The type of event triggering the badge.
 * @param currentCount Current badge count (if any).
 * @returns The new badge count.
 */
export async function setSovereignBadge(event: BadgeEvent, currentCount: number = 0): Promise<number> {
  if (!('setAppBadge' in navigator)) {
    logger.info('[PWA] App Badging API not supported in this browser.');
    return currentCount;
  }

  const config = BADGE_CONFIG[event];
  
  // Strategy: Only badge for high priority events or if current count is 0
  if (config.priority === 'low' && currentCount > 0) {
    return currentCount;
  }

  const newCount = currentCount + 1;
  
  try {
    await navigator.setAppBadge(newCount);
    logger.info(`[PWA] Badge set to ${newCount} for ${config.label}`);
    return newCount;
  } catch (error) {
    logger.error('[PWA] Failed to set app badge:', error);
    return currentCount;
  }
}

/**
 * Clears the app badge.
 */
export async function clearSovereignBadge(): Promise<void> {
  if (!('setAppBadge' in navigator)) return;

  try {
    await navigator.clearAppBadge();
    console.log('[PWA] App badge cleared.');
  } catch (error) {
    console.error('[PWA] Failed to clear app badge:', error);
  }
}
