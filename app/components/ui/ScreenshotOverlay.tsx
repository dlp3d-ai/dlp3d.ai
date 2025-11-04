'use client'

import { useState, useEffect } from 'react'
import {
  getScreenshotFromStorage,
  clearScreenshotFromStorage,
} from '../../utils/screenshot'

/**
 * Props interface for ScreenshotOverlay component.
 */
interface ScreenshotOverlayProps {
  /** Callback function to be called when the overlay is closed. */
  onClose?: () => void
  /** Session ID for storing and retrieving screenshot data. */
  sessionId?: string | null
}

/**
 * ScreenshotOverlay Component
 *
 * A React component that displays a screenshot overlay with loading progress
 * and start button functionality. It handles screenshot data from storage,
 * monitors loading progress, and provides user interaction for starting
 * character animations.
 *
 * @param onClose Optional callback function called when overlay is closed
 * @param sessionId Optional session ID for screenshot storage management
 */
export default function ScreenshotOverlay({
  onClose,
  sessionId,
}: ScreenshotOverlayProps) {
  const [screenshotData, setScreenshotData] = useState<string | null>(null)
  const [showStartButton, setShowStartButton] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingText, setLoadingText] = useState('Initializing...')
  /** Flag indicating if the component is ready to start */
  const [isReady, setIsReady] = useState(false)
  /** Flag indicating if this is a page refresh scenario */
  const [isPageRefresh, setIsPageRefresh] = useState(false)

  /**
   * Creates a default background canvas with gradient and loading text.
   * Sets the page refresh flag to true.
   */
  const createDefaultBackground = () => {
    setIsPageRefresh(true)
    const canvas = document.createElement('canvas')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, '#1a1a2e')
      gradient.addColorStop(0.5, '#16213e')
      gradient.addColorStop(1, '#0f3460')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.font = '24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Digital Life Project', canvas.width / 2, canvas.height / 2 - 50)
      ctx.fillText('Loading...', canvas.width / 2, canvas.height / 2)

      const defaultScreenshot = canvas.toDataURL('image/png')
      setScreenshotData(defaultScreenshot)
    }
  }

  /**
   * Loads screenshot data from storage or creates default background.
   *
   * @throws {Error} if screenshot loading fails
   */
  const loadScreenshot = async () => {
    if (!sessionId) {
      createDefaultBackground()
      return
    }

    const data = await getScreenshotFromStorage(sessionId)

    if (data) {
      setScreenshotData(data)
      setIsPageRefresh(false)
    } else {
      createDefaultBackground()
    }
  }

  useEffect(() => {
    loadScreenshot().catch(error => {
      console.error('Failed to load screenshot:', error)
    })
  }, [sessionId])

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      const expectedKey = sessionId
        ? `dlp_homepage_screenshot_${sessionId}`
        : 'dlp_homepage_screenshot'
      if (e.key === expectedKey || e.key === 'dlp_homepage_screenshot') {
        loadScreenshot().catch(error => {
          console.error('Failed to reload screenshot:', error)
        })
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [sessionId])

  // Listen for character loaded event to show start button
  useEffect(() => {
    const handler = () => {
      // Wait a short time to ensure state machine is fully initialized
      setTimeout(() => {
        setIsReady(true) // Mark as ready
        setLoadingProgress(100)
        // setLoadingText(t('loading.ready'))
        setTimeout(() => {
          setShowStartButton(true)
        }, 500)
      }, 1000)
    }
    window.addEventListener('character-loaded', handler)
    return () => window.removeEventListener('character-loaded', handler)
  }, [])

  // Listen for real progress update events
  useEffect(() => {
    const progressHandler = (event: CustomEvent) => {
      // If already ready, ignore new progress updates
      if (isReady) {
        return
      }

      const { progress, text } = event.detail
      setLoadingProgress(progress)
      setLoadingText(text)
    }

    window.addEventListener('loading-progress', progressHandler as EventListener)
    return () =>
      window.removeEventListener(
        'loading-progress',
        progressHandler as EventListener,
      )
  }, [isReady]) // Add isReady dependency

  // Initialize progress
  useEffect(() => {
    setLoadingProgress(0)
    setIsReady(false) // Reset ready state
  }, [isPageRefresh])

  /**
   * Handles the start button click event.
   * Dispatches character animation start event and clears screenshot from storage.
   *
   * @throws {Error} if clearing screenshot from storage fails
   */
  const handleStartClick = async () => {
    // Trigger character animation start
    if (typeof window !== 'undefined') {
      // Dispatch custom event to notify state machine to start animation
      window.dispatchEvent(new CustomEvent('start-character-animation'))
    }

    await clearScreenshotFromStorage(sessionId || undefined)
    if (onClose) onClose()
  }

  if (!screenshotData) return null

  return (
    <div className="screenshot-overlay">
      {/* Smart loading effect */}
      <div className="screenshot-loading-center">
        <span className="screenshot-loading-text2">{loadingText}</span>
        <div className="screenshot-progress-bar">
          <div
            className="screenshot-progress-fill"
            style={{ width: `${loadingProgress}%` }}
          ></div>
        </div>
        <div className="screenshot-progress-text">{loadingProgress}%</div>
      </div>

      {/* Start button - only shown after character loading is complete */}
      {showStartButton && (
        <div className="screenshot-start-button-container">
          <button className="screenshot-start-button" onClick={handleStartClick}>
            Start
          </button>
        </div>
      )}

      <div className="screenshot-container">
        <img
          src={screenshotData}
          alt="Homepage Screenshot"
          className="screenshot-image"
        />
      </div>
    </div>
  )
}
