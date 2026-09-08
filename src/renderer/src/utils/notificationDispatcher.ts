import { playSuccessSound, playErrorSound } from './soundEngine'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export type NotificationCategory = 'system' | 'license' | 'updater' | 'servers' | 'processes' | 'settings'

export type NotificationActionType = 'restart-update' | 'open-settings' | 'open-license' | 'open-tools'

export interface StudioNotification {
  id: string
  title: string
  message: string
  type: NotificationType
  category?: NotificationCategory
  timestamp: number
  read: boolean
  actionLabel?: string
  actionType?: NotificationActionType
}

export interface DispatchNotificationOptions {
  title: string
  message: string
  type?: NotificationType
  category?: NotificationCategory
  actionLabel?: string
  actionType?: NotificationActionType
  playSound?: boolean
}

export const NOTIFICATION_EVENT = 'studio:notification'
export const NOTIFICATIONS_STORAGE_KEY = 'mcp_studio_notifications_v1'

export function dispatchNotification(options: DispatchNotificationOptions): StudioNotification {
  const notif: StudioNotification = {
    id: `notif_${crypto.randomUUID()}`,
    title: options.title,
    message: options.message,
    type: options.type || 'info',
    category: options.category || 'system',
    timestamp: Date.now(),
    read: false,
    actionLabel: options.actionLabel,
    actionType: options.actionType
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, { detail: notif }))

    if (options.playSound !== false) {
      try {
        if (notif.type === 'success') {
          playSuccessSound()
        } else if (notif.type === 'error' || notif.type === 'warning') {
          playErrorSound()
        }
      } catch {
        // audio context errors should never break execution
      }
    }
  }

  return notif
}
