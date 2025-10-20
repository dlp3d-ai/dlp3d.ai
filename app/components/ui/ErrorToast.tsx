'use client'

import React, { useEffect, useState } from 'react'
import { errorBus, ErrorEventPayload } from '@/utils/errorBus'

export default function ErrorToast() {
  const [visible, setVisible] = useState(false)
  const [payload, setPayload] = useState<ErrorEventPayload | null>(null)
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const queueRef = React.useRef<ErrorEventPayload[]>([])

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const showNext = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    const next = queueRef.current.shift()
    if (next) {
      setPayload(next)
      setVisible(true)
      // Only set auto-hide timer if durationMs is provided and greater than 0
      if (next.durationMs && next.durationMs > 0) {
        const t = setTimeout(() => {
          setVisible(false)
          setPayload(null)
          showNext()
        }, next.durationMs)
        timerRef.current = t
        setTimer(t)
      } else if (next.durationMs === undefined) {
        // Default behavior: auto-hide after 5 seconds
        const t = setTimeout(() => {
          setVisible(false)
          setPayload(null)
          showNext()
        }, 5000)
        timerRef.current = t
        setTimer(t)
      }
      // If durationMs is 0, don't set timer (stay visible until manually closed)
    } else {
      setVisible(false)
      setPayload(null)
      timerRef.current = null
      setTimer(null)
    }
  }, [])

  useEffect(() => {
    const handler = (p: ErrorEventPayload) => {
      if (!payload && !visible) {
        setPayload(p)
        setVisible(true)
        // Only set auto-hide timer if durationMs is provided and greater than 0
        if (p.durationMs && p.durationMs > 0) {
          const t = setTimeout(() => {
            setVisible(false)
            setPayload(null)
            showNext()
          }, p.durationMs)
          timerRef.current = t
          setTimer(t)
        } else if (p.durationMs === undefined) {
          // Default behavior: auto-hide after 5 seconds
          const t = setTimeout(() => {
            setVisible(false)
            setPayload(null)
            showNext()
          }, 5000)
          timerRef.current = t
          setTimer(t)
        }
        // If durationMs is 0, don't set timer (stay visible until manually closed)
      } else {
        queueRef.current.push(p)
      }
    }
    errorBus.on('error', handler)
    return () => {
      errorBus.off('error', handler)
    }
  }, [payload, visible, showNext])

  // 清理定时器的 useEffect
  useEffect(() => {
    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [timer])

  if (!visible || !payload) return null

  const severity = payload.severity ?? 'error'

  const handleClose = () => {
    setVisible(false)
    setPayload(null)
    showNext()
  }

  const closable = payload.closable ?? true
  return (
    <div className={`error-toast error-toast-${severity}`} role="alert">
      <div className="error-toast-content">
        <span className="error-toast-message">{payload.message}</span>
        {payload.actionText && payload.onAction && (
          <button
            className="error-toast-action"
            onClick={() => {
              payload.onAction?.()
              setVisible(false)
              setPayload(null)
              showNext()
            }}
          >
            {payload.actionText}
          </button>
        )}
        {closable && (
          <button className="error-toast-close" onClick={handleClose}>
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
