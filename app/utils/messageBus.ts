import { EventEmitter } from 'events'

/**
 * Message data structure for center-left messages.
 */
export type CenterLeftMessage = {
  /** Unique identifier for the message. */
  id: string
  /** Optional title for the message. */
  title?: string
  /** Main text content of the message. */
  text: string
  /** Duration in milliseconds for how long the message should be displayed. */
  durationMs?: number
}

/**
 * MessageBus
 *
 * A class that extends EventEmitter to handle message broadcasting throughout the application.
 * Used for managing and emitting various types of messages, particularly center-left messages.
 */
class MessageBus extends EventEmitter {}

/**
 * Global instance of MessageBus for application-wide message handling.
 */
export const messageBus = new MessageBus()

/**
 * Show a side message with title and text content.
 *
 * @param title The title of the message to display.
 * @param text The main text content of the message.
 * @param durationMs Duration in milliseconds for how long the message should be displayed. Defaults to 5000ms.
 */
export function showSideMessageWithTitle(
  title: string,
  text: string,
  durationMs: number = 5000,
) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const payload: CenterLeftMessage = { id, title, text, durationMs }
  messageBus.emit('center-left-message', payload)
}

/**
 * Event type definitions for MessageBus.
 */
export type MessageBusEvents = {
  /** Event emitted when a center-left message should be displayed. */
  'center-left-message': (payload: CenterLeftMessage) => void
}
