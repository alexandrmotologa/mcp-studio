import { describe, it, expect } from 'vitest'

describe('Security URL Validation Tests', () => {
  const isSafeExternalUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'https:' || parsed.protocol === 'http:'
    } catch {
      return false
    }
  }

  it('should allow legitimate https and http links', () => {
    expect(isSafeExternalUrl('https://mtlglabs.space')).toBe(true)
    expect(isSafeExternalUrl('https://github.com/alexandrmotologa/mcp-studio')).toBe(true)
    expect(isSafeExternalUrl('http://localhost:3000')).toBe(true)
  })

  it('should BLOCK dangerous local file, javascript, data, and relative protocols', () => {
    expect(isSafeExternalUrl('file:///C:/Windows/System32/calc.exe')).toBe(false)
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
    expect(isSafeExternalUrl('smb://malicious-share/payload')).toBe(false)
    expect(isSafeExternalUrl('vbscript:msgbox(1)')).toBe(false)
    expect(isSafeExternalUrl('not-a-url')).toBe(false)
  })
})
