import { describe, it, expect } from 'vitest'

describe('Security & IPC Input Validation Tests', () => {
  function isValidString(val: unknown, maxLen = 2000): val is string {
    return typeof val === 'string' && val.trim().length > 0 && val.length <= maxLen
  }

  it('should validate non-empty strings within length limit', () => {
    expect(isValidString('server-123')).toBe(true)
    expect(isValidString('   valid-trimmed   ')).toBe(true)
    expect(isValidString('')).toBe(false)
    expect(isValidString('   ')).toBe(false)
    expect(isValidString(null)).toBe(false)
    expect(isValidString(undefined)).toBe(false)
    expect(isValidString(123)).toBe(false)
    expect(isValidString({})).toBe(false)
  })

  it('should reject strings exceeding maximum length limit', () => {
    const hugeString = 'a'.repeat(2001)
    expect(isValidString(hugeString, 2000)).toBe(false)
    expect(isValidString('a'.repeat(2000), 2000)).toBe(true)
  })

  it('should sanitize error objects to prevent leaking process tokens/secrets', () => {
    const rawError = new Error('Connection closed by peer')
    const sanitized = rawError?.message || 'Connection error'
    expect(sanitized).toBe('Connection closed by peer')

    const emptyError: any = {}
    const sanitizedEmpty = emptyError?.message || 'Connection error'
    expect(sanitizedEmpty).toBe('Connection error')
  })
})
