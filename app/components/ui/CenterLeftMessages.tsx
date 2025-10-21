'use client'

import React from 'react'
import { messageBus, CenterLeftMessage } from '@/utils/messageBus'

/**
 * CenterLeftMessages
 *
 * A React component that displays center-left messages with animation effects.
 * It listens to the message bus for 'center-left-message' events and renders
 * messages with fade-in, bump animation, and fade-out transitions.
 */
export default function CenterLeftMessages() {
  /** Array of messages to be displayed. */
  const [messages, setMessages] = React.useState<CenterLeftMessage[]>([])
  /** Record tracking which messages are currently exiting (fading out). */
  const [exiting, setExiting] = React.useState<Record<string, boolean>>({})
  /** Flag indicating if messages should have bump animation effect. */
  const [bumping, setBumping] = React.useState(false)
  /** ID of the newest message for bump animation targeting. */
  const [newestId, setNewestId] = React.useState<string | null>(null)

  /** Reference to timers for message auto-removal. */
  const timersRef = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  /** Reference to timers for message removal after fade-out animation. */
  const removeTimersRef = React.useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({})

  React.useEffect(() => {
    /**
     * Handle incoming center-left messages from the message bus.
     *
     * @param payload The message payload containing id, title, text, and duration.
     */
    const handler = (payload: CenterLeftMessage) => {
      setMessages(prev => {
        const next = [...prev, payload]
        return next
      })

      // Record the newest message and trigger bump transition
      setNewestId(payload.id)
      setBumping(true)
      setTimeout(() => setBumping(false), 220)

      const duration = payload.durationMs ?? 5000
      if (duration > 0) {
        const t = setTimeout(() => {
          setExiting(prev => ({ ...prev, [payload.id]: true }))
          // Wait for fade-out animation to complete before removal (must match CSS transition duration)
          const rt = setTimeout(() => {
            setMessages(prev => prev.filter(m => m.id !== payload.id))
            setExiting(prev => {
              const next = { ...prev }
              delete next[payload.id]
              return next
            })
            delete removeTimersRef.current[payload.id]
          }, 250)
          removeTimersRef.current[payload.id] = rt
          delete timersRef.current[payload.id]
        }, duration)
        timersRef.current[payload.id] = t
      }
    }

    messageBus.on('center-left-message', handler)
    return () => {
      messageBus.off('center-left-message', handler)
      Object.values(timersRef.current).forEach(t => clearTimeout(t))
      Object.values(removeTimersRef.current).forEach(t => clearTimeout(t))
      timersRef.current = {}
      removeTimersRef.current = {}
    }
  }, [])

  if (messages.length === 0) return null

  return (
    <div className="side-messages-container">
      {messages.map((m, idx) => (
        <div
          key={m.id}
          className={`side-message-item${exiting[m.id] ? ' exiting' : ''}${bumping && newestId !== m.id ? ' bump' : ''}`}
          style={{ marginTop: idx === 0 ? 0 : 8 }}
        >
          <div className="side-message-lines">
            {m.title && <div className="side-message-title">{m.title}</div>}
            <div className="side-message-text">{m.text}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
