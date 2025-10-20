'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface MobileNoticePanelProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message?: string
  /**
   * Duration in milliseconds before the panel auto-closes.
   * If null or undefined, the panel will not auto-dismiss.
   */
  autoDismissDuration?: number | null
}

export default function MobileNoticePanel({
  isOpen,
  onClose,
  title = 'Notice',
  message = 'Settings panel is not available on mobile devices',
  autoDismissDuration = 3000,
}: MobileNoticePanelProps) {
  // 自动关闭功能
  useEffect(() => {
    if (isOpen && autoDismissDuration && autoDismissDuration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, autoDismissDuration)

      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose, autoDismissDuration])

  // 点击遮罩关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="mobile-notice-overlay" onClick={handleBackdropClick}>
      <div className="mobile-notice-panel">
        <h3 className="mobile-notice-title">{title}</h3>
        <p className="mobile-notice-message">{message}</p>
        <button className="mobile-notice-close-btn" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>,
    document.body,
  )
}
