import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  dispatchNotification,
  NOTIFICATION_EVENT,
  NOTIFICATIONS_STORAGE_KEY,
  StudioNotification
} from '../src/renderer/src/utils/notificationDispatcher'

describe('NotificationDispatcher Unit Tests', () => {
  let dispatchedEvents: CustomEvent<StudioNotification>[] = []
  const originalWindow = globalThis.window

  beforeEach(() => {
    dispatchedEvents = []
    // Setup a mock window with CustomEvent and addEventListener / dispatchEvent
    const listeners: Record<string, ((e: any) => void)[]> = {}

    const mockWindow: any = {
      addEventListener: (type: string, listener: any) => {
        listeners[type] = listeners[type] || []
        listeners[type].push(listener)
      },
      removeEventListener: (type: string, listener: any) => {
        if (listeners[type]) {
          listeners[type] = listeners[type].filter((l) => l !== listener)
        }
      },
      dispatchEvent: (event: CustomEvent<StudioNotification>) => {
        dispatchedEvents.push(event)
        const handlers = listeners[event.type] || []
        handlers.forEach((h) => h(event))
        return true
      }
    }

    // @ts-ignore
    globalThis.window = mockWindow
  })

  afterEach(() => {
    globalThis.window = originalWindow
    vi.restoreAllMocks()
  })

  it('should have consistent constant identifiers', () => {
    expect(NOTIFICATION_EVENT).toBe('studio:notification')
    expect(NOTIFICATIONS_STORAGE_KEY).toBe('mcp_studio_notifications_v1')
  })

  it('should generate a valid notification with default type and category', () => {
    const notif = dispatchNotification({
      title: 'Server Initialized',
      message: 'Postgres MCP server initialized with 12 tools.'
    })

    expect(notif.id).toMatch(/^notif_[0-9a-f-]+/)
    expect(notif.title).toBe('Server Initialized')
    expect(notif.message).toBe('Postgres MCP server initialized with 12 tools.')
    expect(notif.type).toBe('info')
    expect(notif.category).toBe('system')
    expect(notif.read).toBe(false)
    expect(typeof notif.timestamp).toBe('number')
    expect(notif.timestamp).toBeGreaterThan(0)
  })

  it('should broadcast custom event via window.dispatchEvent', () => {
    const notif = dispatchNotification({
      title: 'Test Suite Passed',
      message: 'All 8 tests executed successfully.',
      type: 'success',
      category: 'processes'
    })

    expect(dispatchedEvents).toHaveLength(1)
    expect(dispatchedEvents[0].type).toBe('studio:notification')
    expect(dispatchedEvents[0].detail).toEqual(notif)
  })

  it('should support actionLabel and actionType', () => {
    const notif = dispatchNotification({
      title: 'Update Downloaded',
      message: 'Version 2.2.0 is ready to install.',
      type: 'success',
      category: 'updater',
      actionLabel: 'Restart Now',
      actionType: 'restart-update'
    })

    expect(notif.actionLabel).toBe('Restart Now')
    expect(notif.actionType).toBe('restart-update')
    expect(dispatchedEvents[0].detail.actionType).toBe('restart-update')
  })

  it('should correctly format license notifications', () => {
    const notif = dispatchNotification({
      title: 'License Inactive',
      message: 'Your license key was deactivated or deleted. MCP Studio reverted to Community Edition.',
      type: 'error',
      category: 'license',
      actionLabel: 'Open License Manager',
      actionType: 'open-license'
    })

    expect(notif.category).toBe('license')
    expect(notif.type).toBe('error')
    expect(notif.actionType).toBe('open-license')
  })

  it('should generate distinct UUIDs for consecutive dispatches', () => {
    const notif1 = dispatchNotification({ title: 'A', message: 'A' })
    const notif2 = dispatchNotification({ title: 'B', message: 'B' })

    expect(notif1.id).not.toBe(notif2.id)
  })
})
