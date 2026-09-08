import { describe, it, expect, beforeEach, vi } from 'vitest'
import { McpClientManager } from '../src/main/mcp/McpClientManager'
import { McpServerConfig } from '../src/shared/types'

describe('McpClientManager Auto-Reconnect Watchdog', () => {
  let manager: McpClientManager
  let mockWindow: any
  let sentEvents: { channel: string; data: any }[]

  const sampleServer: McpServerConfig = {
    id: 'test-watchdog-server',
    name: 'Test Watchdog',
    transport: 'stdio',
    command: 'node',
    args: ['-e', 'console.log("test")'],
    status: 'connected',
    createdAt: Date.now()
  }

  beforeEach(() => {
    sentEvents = []
    mockWindow = {
      isDestroyed: () => false,
      webContents: {
        send: (channel: string, data: any) => {
          sentEvents.push({ channel, data })
        }
      }
    }
    manager = new McpClientManager(mockWindow)
    vi.useFakeTimers()
  })

  it('should schedule auto-reconnect with exponential backoff on unexpected disconnect', () => {
    manager.scheduleAutoReconnect(sampleServer)

    const status = manager.getReconnectStatus(sampleServer.id)
    expect(status.isReconnecting).toBe(true)
    expect(status.attempt).toBe(1)

    // Should notify renderer that server is connecting/reconnecting
    const connectingEvent = sentEvents.find(
      (e) => e.channel === 'mcp:server-status' && e.data.status === 'connecting'
    )
    expect(connectingEvent).toBeDefined()
    expect(connectingEvent?.data.serverId).toBe(sampleServer.id)

    manager.cancelReconnect(sampleServer.id)
    expect(manager.getReconnectStatus(sampleServer.id).isReconnecting).toBe(false)
  })

  it('should stop and notify error after max reconnection attempts (3) exceeded', () => {
    // Attempt 1
    manager.scheduleAutoReconnect(sampleServer)
    expect(manager.getReconnectStatus(sampleServer.id).attempt).toBe(1)

    // Attempt 2
    manager.cancelReconnect(sampleServer.id)
    // Clear manual disconnect flag by calling schedule directly through repeated increments
    manager['manualDisconnects'].delete(sampleServer.id)
    manager['reconnectAttempts'].set(sampleServer.id, 2)
    manager.scheduleAutoReconnect(sampleServer)
    expect(manager.getReconnectStatus(sampleServer.id).attempt).toBe(3)

    // Attempt 4 (exceeds limit 3)
    manager['manualDisconnects'].delete(sampleServer.id)
    manager.cancelReconnect(sampleServer.id)
    manager['manualDisconnects'].delete(sampleServer.id)
    manager['reconnectAttempts'].set(sampleServer.id, 3)
    manager.scheduleAutoReconnect(sampleServer)

    const errorEvent = sentEvents.find(
      (e) => e.channel === 'mcp:server-status' && e.data.status === 'error'
    )
    expect(errorEvent).toBeDefined()
    expect(errorEvent?.data.serverId).toBe(sampleServer.id)
    expect(errorEvent?.data.error).toContain('Auto-reconnect failed')
    expect(manager.getReconnectStatus(sampleServer.id).isReconnecting).toBe(false)
  })

  it('should cancel pending reconnect timers when disconnectServer is called', () => {
    manager.scheduleAutoReconnect(sampleServer)
    expect(manager.getReconnectStatus(sampleServer.id).isReconnecting).toBe(true)

    manager.disconnectServer(sampleServer.id)

    expect(manager.getReconnectStatus(sampleServer.id).isReconnecting).toBe(false)
    expect(manager['manualDisconnects'].has(sampleServer.id)).toBe(true)
  })

  it('should clean up all reconnection timers on disconnectAll', async () => {
    const server2: McpServerConfig = {
      ...sampleServer,
      id: 'server-2',
      name: 'Server Two'
    }

    manager.scheduleAutoReconnect(sampleServer)
    manager.scheduleAutoReconnect(server2)

    expect(manager.getReconnectStatus(sampleServer.id).isReconnecting).toBe(true)
    expect(manager.getReconnectStatus(server2.id).isReconnecting).toBe(true)

    await manager.disconnectAll()

    expect(manager.getReconnectStatus(sampleServer.id).isReconnecting).toBe(false)
    expect(manager.getReconnectStatus(server2.id).isReconnecting).toBe(false)
  })
})
