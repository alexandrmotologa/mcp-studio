import { describe, it, expect, beforeEach } from 'vitest'
import { McpClientManager } from '../../src/main/mcp/McpClientManager'
import { InterceptorRule } from '../../src/shared/types'

describe('McpClientManager Interceptor & OS Stats Unit Tests', () => {
  let manager: McpClientManager

  beforeEach(() => {
    manager = new McpClientManager()
  })

  it('should initialize with empty interceptor rules and allow updating them', () => {
    expect(manager.getInterceptorRules()).toEqual([])

    const rules: InterceptorRule[] = [
      {
        id: 'rule_1',
        toolPattern: 'query_*',
        action: 'mock_override',
        mockResponseJson: JSON.stringify({ mocked: true }),
        isEnabled: true
      },
      {
        id: 'rule_2',
        toolPattern: 'dangerous_drop',
        action: 'drop',
        isEnabled: true
      }
    ]

    manager.setInterceptorRules(rules)
    expect(manager.getInterceptorRules()).toHaveLength(2)
    expect(manager.getInterceptorRules()[0]?.toolPattern).toBe('query_*')
  })

  it('should return error if calling tool on non-connected server', async () => {
    const res = await manager.callTool('non-existent-id', 'test_tool', {})
    expect(res.success).toBe(false)
    expect(res.error).toBe('Server not connected')
  })

  it('should return empty process stats when no servers are connected', async () => {
    const stats = await manager.getServerProcessStats()
    expect(Array.isArray(stats)).toBe(true)
    expect(stats).toHaveLength(0)
  })
})
