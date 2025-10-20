'use client'

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { Snackbar, Alert, AlertColor, Slide, SlideProps } from '@mui/material'

/**
 *Notification type definition.
 */
interface Notification {
  /** Unique identifier for the notification. */
  id: string
  /** Message content to display. */
  message: string
  /** Severity level of the notification. */
  severity: AlertColor
  /** Duration in milliseconds before auto-hide. */
  duration?: number
  /** Optional action component to display. */
  action?: ReactNode
}

/**
 *Context type definition for notification management.
 */
interface NotificationContextType {
  /**
   *Show a notification with custom parameters.
   *
   * @param message The message to display.
   * @param severity The severity level of the notification.
   * @param duration Duration in milliseconds before auto-hide.
   * @param action Optional action component to display.
   */
  showNotification: (
    message: string,
    severity?: AlertColor,
    duration?: number,
    action?: ReactNode,
  ) => void
  /**
   *Show a success notification.
   *
   * @param message The success message to display.
   * @param duration Duration in milliseconds before auto-hide.
   */
  showSuccess: (message: string, duration?: number) => void
  /**
   *Show an error notification.
   *
   * @param message The error message to display.
   * @param duration Duration in milliseconds before auto-hide.
   */
  showError: (message: string, duration?: number) => void
  /**
   *Show a warning notification.
   *
   * @param message The warning message to display.
   * @param duration Duration in milliseconds before auto-hide.
   */
  showWarning: (message: string, duration?: number) => void
  /**
   *Show an info notification.
   *
   * @param message The info message to display.
   * @param duration Duration in milliseconds before auto-hide.
   */
  showInfo: (message: string, duration?: number) => void
  /**
   *Hide a specific notification by ID.
   *
   * @param id The ID of the notification to hide.
   */
  hideNotification: (id: string) => void
  /**
   *Clear all notifications.
   */
  clearAll: () => void
}

/**
 *Create notification context.
 */
const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
)

/**
 * Slide transition component for notification animations.
 *
 * @param props The slide transition props.
 * @returns A slide transition component with upward direction.
 */
function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />
}

/**
 *Notification provider component that manages global notification state.
 */
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  /**
   *Show a notification with custom parameters.
   *
   * @param message The message to display.
   * @param severity The severity level of the notification.
   * @param duration Duration in milliseconds before auto-hide.
   * @param action Optional action component to display.
   */
  const showNotification = useCallback(
    (
      message: string,
      severity: AlertColor = 'info',
      duration: number = 6000,
      action?: ReactNode,
    ) => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      const notification: Notification = {
        id,
        message,
        severity,
        duration,
        action,
      }

      setNotifications(prev => [...prev, notification])

      // Auto-hide notification after specified duration
      if (duration > 0) {
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id))
        }, duration)
      }
    },
    [],
  )

  /**
   *Show a success notification.
   *
   * @param message The success message to display.
   * @param duration Duration in milliseconds before auto-hide.
   */
  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      showNotification(message, 'success', duration)
    },
    [showNotification],
  )

  /**
   *Show an error notification.
   *
   * @param message The error message to display.
   * @param duration Duration in milliseconds before auto-hide.
   */
  const showError = useCallback(
    (message: string, duration?: number) => {
      showNotification(message, 'error', duration)
    },
    [showNotification],
  )

  /**
   *Show a warning notification.
   *
   * @param message The warning message to display.
   * @param duration Duration in milliseconds before auto-hide.
   */
  const showWarning = useCallback(
    (message: string, duration?: number) => {
      showNotification(message, 'warning', duration)
    },
    [showNotification],
  )

  /**
   *Show an info notification.
   *
   * @param message The info message to display.
   * @param duration Duration in milliseconds before auto-hide.
   */
  const showInfo = useCallback(
    (message: string, duration?: number) => {
      showNotification(message, 'info', duration)
    },
    [showNotification],
  )

  /**
   *Hide a specific notification by ID.
   *
   * @param id The ID of the notification to hide.
   */
  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  /**
   *Clear all notifications.
   */
  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const contextValue: NotificationContextType = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification,
    clearAll,
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}

      {/* Render all notifications */}
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.duration}
          onClose={() => hideNotification(notification.id)}
          TransitionComponent={SlideTransition}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          style={{
            marginBottom: index * 70, // Stacking effect
            zIndex: 99999 + index, // Ensure correct layering
          }}
        >
          <Alert
            onClose={() => hideNotification(notification.id)}
            severity={notification.severity}
            variant="filled"
            sx={{
              width: '100%',
              minWidth: '300px',
              maxWidth: '500px',
              '& .MuiAlert-message': {
                fontSize: '14px',
                fontWeight: 500,
              },
              '& .MuiAlert-action': {
                alignItems: 'center',
              },
            }}
            action={notification.action}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  )
}

/**
 *Hook for using notifications.
 *
 * @returns The notification context with all notification methods.
 * @throws {Error} if used outside of NotificationProvider.
 */
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

// Convenient global notification functions (independent of React Context)
let globalNotificationHandler: NotificationContextType | null = null

/**
 *Set the global notification handler.
 *
 * @param handler The notification context handler to set.
 */
export const setGlobalNotificationHandler = (handler: NotificationContextType) => {
  globalNotificationHandler = handler
}

/**
 *Global notification object with convenience methods.
 */
export const notify = {
  /**
   *Show a success notification.
   *
   * @param message The success message to display.
   * @param duration Duration in milliseconds before auto-hide.
   */
  success: (message: string, duration?: number) => {
    globalNotificationHandler?.showSuccess(message, duration)
  },
  /**
   *Show an error notification.
   *
   * @param message The error message to display.
   * @param duration Duration in milliseconds before auto-hide.
   */
  error: (message: string, duration?: number) => {
    globalNotificationHandler?.showError(message, duration)
  },
  /**
   *Show a warning notification.
   *
   * @param message The warning message to display.
   * @param duration Duration in milliseconds before auto-hide.
   */
  warning: (message: string, duration?: number) => {
    globalNotificationHandler?.showWarning(message, duration)
  },
  /**
   *Show an info notification.
   *
   * @param message The info message to display.
   * @param duration Duration in milliseconds before auto-hide.
   */
  info: (message: string, duration?: number) => {
    globalNotificationHandler?.showInfo(message, duration)
  },
  /**
   *Show a notification with custom parameters.
   *
   * @param message The message to display.
   * @param severity The severity level of the notification.
   * @param duration Duration in milliseconds before auto-hide.
   * @param action Optional action component to display.
   */
  show: (
    message: string,
    severity?: AlertColor,
    duration?: number,
    action?: ReactNode,
  ) => {
    globalNotificationHandler?.showNotification(message, severity, duration, action)
  },
}

/**
 *Error handling hook for displaying error notifications.
 *
 * @returns An object containing the handleError function.
 */
export const useErrorHandler = () => {
  const { showError } = useNotification()

  /**
   *Handle errors by displaying them as notifications.
   *
   * @param error The error to handle.
   * @param fallbackMessage Optional fallback message if error cannot be processed.
   */
  const handleError = useCallback(
    (error: unknown, fallbackMessage?: string) => {
      let message = fallbackMessage || 'An unexpected error occurred'

      if (error instanceof Error) {
        message = error.message
      } else if (typeof error === 'string') {
        message = error
      }

      showError(message)
    },
    [showError],
  )

  return { handleError }
}

export default NotificationProvider
