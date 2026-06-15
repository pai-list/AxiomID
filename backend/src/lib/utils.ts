/**
 * Shared utility functions for AxiomID backend Worker.
 */

/**
 * Generate a short random ID with a prefix.
 * Format: {prefix}-{timestamp_base36}-{random_6_chars}
 */
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}