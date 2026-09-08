/**
 * IPC Defensive Validation Helpers
 * Validates input parameters received over Electron IPC channels.
 */

export function isValidString(val: unknown, maxLen = 2000): val is string {
  return typeof val === 'string' && val.trim().length > 0 && val.length <= maxLen
}

export function isPlainObject(val: unknown): val is Record<string, any> {
  return typeof val === 'object' && val !== null && !Array.isArray(val)
}

export function isValidEmail(val: unknown, maxLen = 100): val is string {
  if (typeof val !== 'string') return false
  const trimmed = val.trim()
  if (trimmed.length === 0 || trimmed.length > maxLen) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}

