'use client'

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useDevice } from '../../contexts/DeviceContext'
import CloseIcon from '@mui/icons-material/Close'

/**
 * Props for the `Dialog` component.
 *
 * Represents a modal dialog rendered via a portal with configurable size,
 * close behaviors, and optional header controls.
 */
interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  maxWidth?: string
  maxHeight?: string
  showCloseButton?: boolean
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
  className?: string
}

/**
 * Dialog
 *
 * A responsive modal dialog rendered into `document.body` using a portal. It supports
 * closing via the Escape key, backdrop clicks, and an optional close button, with
 * adaptive spacing for mobile devices.
 *
 * @param isOpen Whether the dialog is visible.
 * @param onClose Callback invoked when the dialog requests to close.
 * @param title Optional title text displayed in the header.
 * @param children React node(s) rendered as the dialog content.
 * @param maxWidth Optional maximum width of the dialog container. Default: '600px'
 * @param maxHeight Optional maximum height of the dialog container. Default: '80vh'
 * @param showCloseButton Whether to show the close button in the header. Default: true
 * @param closeOnBackdropClick Whether clicking the backdrop closes the dialog. Default: true
 * @param closeOnEscape Whether pressing Escape closes the dialog. Default: true
 * @param className Optional additional class name applied to the overlay.
 *
 * @returns The dialog portal when open; otherwise null.
 */
export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '600px',
  maxHeight = '80vh',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
}: DialogProps) {
  const { isMobile } = useDevice()

  // Handle closing via Escape key
  useEffect(() => {
    if (!closeOnEscape) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent background scrolling while dialog is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      // Restore background scrolling when dialog closes
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, closeOnEscape])

  // Handle closing when clicking on the backdrop
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose()
    }
  }

  const handleCloseClick = () => {
    onClose()
  }

  if (!isOpen) return null

  const dialogContent = (
    <div
      className={`dialog-overlay ${className}`}
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: isMobile ? '16px' : '24px',
        isolation: 'isolate',
      }}
    >
      <div
        className="dialog-container"
        style={{
          backgroundColor: '#1e202f',
          borderRadius: isMobile ? '12px' : '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          width: '100%',
          maxWidth: isMobile ? '100%' : maxWidth,
          maxHeight: isMobile ? '90vh' : maxHeight,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #333652',
          zIndex: 100000, // Ensure the container itself has the highest z-index
        }}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className="dialog-header"
            style={{
              padding: isMobile ? '16px 20px' : '20px 24px',
              borderBottom: '1px solid #333652',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: isMobile ? '48px' : '56px',
            }}
          >
            {title && (
              <h2
                className="dialog-title"
                style={{
                  margin: 0,
                  fontSize: isMobile ? '18px' : '20px',
                  fontWeight: 600,
                  color: '#ffffff',
                  flex: 1,
                }}
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                className="dialog-close-button"
                onClick={handleCloseClick}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#888',
                  transition: 'all 0.2s ease',
                  marginLeft: title ? '12px' : 'auto',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#333652'
                  e.currentTarget.style.color = '#ffffff'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#888'
                }}
              >
                <CloseIcon
                  style={{
                    fontSize: isMobile ? '20px' : '24px',
                  }}
                />
              </button>
            )}
          </div>
        )}

        {/* Content area */}
        <div
          className="dialog-content"
          style={{
            padding: isMobile ? '16px 20px' : '24px',
            flex: 1,
            overflow: 'auto',
            maxHeight: isMobile ? 'calc(90vh - 80px)' : `calc(${maxHeight} - 80px)`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )

  // Render via Portal into document.body
  return createPortal(dialogContent, document.body)
}

/**
 * ConfirmDialog
 *
 * A simple confirmation dialog built on top of `Dialog`. It renders a message and
 * two actions: Cancel and Confirm. Confirm action triggers `onConfirm` then closes.
 *
 * @param isOpen Whether the dialog is visible.
 * @param onClose Callback invoked when the dialog should close.
 * @param onConfirm Callback invoked when the confirm button is clicked.
 * @param title Optional dialog title. Default: '确认'
 * @param message The confirmation message to display.
 * @param confirmText Confirm button text. Default: '确认'
 * @param cancelText Cancel button text. Default: '取消'
 * @param type Visual intent for the confirm button. One of 'default' | 'danger' | 'warning'. Default: 'default'
 *
 * @returns The confirmation dialog.
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = '确认',
  message,
  confirmText = '确认',
  cancelText = '取消',
  type = 'default', // default, danger, warning
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'default' | 'danger' | 'warning'
}) {
  const getButtonStyle = (isConfirm: boolean) => {
    const baseStyle = {
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'all 0.2s ease',
      minWidth: '80px',
    }

    if (isConfirm) {
      switch (type) {
        case 'danger':
          return {
            ...baseStyle,
            backgroundColor: '#dc3545',
            color: '#ffffff',
          }
        case 'warning':
          return {
            ...baseStyle,
            backgroundColor: '#ffc107',
            color: '#000000',
          }
        default:
          return {
            ...baseStyle,
            backgroundColor: '#6b7cff',
            color: '#ffffff',
          }
      }
    } else {
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        color: '#888',
        border: '1px solid #333652',
      }
    }
  }

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="400px"
      className="confirm-dialog"
    >
      <div style={{ marginBottom: '24px' }}>
        <p style={{ margin: 0, color: '#ccc', lineHeight: '1.5' }}>{message}</p>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}
      >
        <button
          onClick={onClose}
          style={getButtonStyle(false)}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = '#333652'
            e.currentTarget.style.color = '#ffffff'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#888'
          }}
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          style={getButtonStyle(true)}
          onMouseEnter={e => {
            e.currentTarget.style.opacity = '0.8'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          {confirmText}
        </button>
      </div>
    </Dialog>
  )
}

/**
 * AlertDialog
 *
 * A single-action informational dialog built on top of `Dialog`. Displays an icon
 * tinted according to the provided type and a message with a single confirmation button.
 *
 * @param isOpen Whether the dialog is visible.
 * @param onClose Callback invoked when the dialog should close.
 * @param title Optional dialog title. Default: '提示'
 * @param message The message text to display in the dialog body.
 * @param type Visual intent of the alert. One of 'info' | 'success' | 'warning' | 'error'. Default: 'info'
 * @param confirmText Confirmation button text. Default: '确定'
 *
 * @returns The alert dialog.
 */
export function AlertDialog({
  isOpen,
  onClose,
  title = '提示',
  message,
  type = 'info', // info, success, warning, error
  confirmText = '确定',
}: {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  confirmText?: string
}) {
  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#28a745'
      case 'warning':
        return '#ffc107'
      case 'error':
        return '#dc3545'
      default:
        return '#6b7cff'
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title} maxWidth="400px">
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: getIconColor(),
              flexShrink: 0,
              marginTop: '2px',
            }}
          />
          <p style={{ margin: 0, color: '#ccc', lineHeight: '1.5' }}>{message}</p>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <button
          onClick={onClose}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            backgroundColor: '#6b7cff',
            color: '#ffffff',
            transition: 'all 0.2s ease',
            minWidth: '80px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.opacity = '0.8'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          {confirmText}
        </button>
      </div>
    </Dialog>
  )
}
