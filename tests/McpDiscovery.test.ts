import { describe, it, expect, vi } from 'vitest'
import { McpDiscovery } from '../src/main/mcp/McpDiscovery'

describe('McpDiscovery Multi-IDE Auto-Detection Tests', () => {
  it('should discover servers from Antigravity and Cursor if configs exist', async () => {
    const results = await McpDiscovery.discoverInstalledServers()
    expect(Array.isArray(results)).toBe(true)

    for (const r of results) {
      expect(r.source).toBeDefined()
      expect(Array.isArray(r.servers)).toBe(true)
      for (const s of r.servers) {
        expect(s.name).toBeDefined()
        expect(['stdio', 'sse']).toContain(s.transport)
      }
    }
  })
})
