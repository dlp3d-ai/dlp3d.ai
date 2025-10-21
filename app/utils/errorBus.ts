'use client'

import { EventEmitter } from '../hooks/eventEmitter'

/**
 * Severity levels for error events.
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'neutral'

/**
 * Payload structure for error events.
 */
export type ErrorEventPayload = {
  /** The error message to display. */
  message: string
  /** Duration in milliseconds to show the error (optional). */
  durationMs?: number
  /** Text for the action button (optional). */
  actionText?: string
  /** Callback function to execute when action button is clicked (optional). */
  onAction?: () => void
  /** Severity level of the error (optional). */
  severity?: ErrorSeverity
  /** Whether the error can be closed by the user (optional). */
  closable?: boolean
}

/**
 * Event map for error bus events.
 */
type ErrorEventMap = {
  error: ErrorEventPayload
}

/**
 * Global error bus instance for managing error events across the application.
 * Provides type-safe event emission and listening for error notifications.
 */
export const errorBus = new EventEmitter<'error', ErrorEventMap>()
