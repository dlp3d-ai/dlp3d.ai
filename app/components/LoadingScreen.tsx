import React, { useEffect, useState } from 'react'
import './LoadingScreen.css'
import { useDevice } from '@/contexts/DeviceContext'
import { useTranslation } from 'react-i18next'

/**
 * Props for LoadingScreen component.
 */
interface LoadingScreenProps {
  /** Whether the loading screen should be displayed. */
  isLoading: boolean
  /** Callback function called when loading completes and fade-out animation finishes. */
  onComplete?: () => void
  /** Optional loading message to display. */
  message?: string
  /** Optional progress percentage (0-100) for the progress bar. */
  progress?: number
}

/**
 * Duration of fade-out animation in milliseconds.
 */
const FADE_OUT_DURATION = 500

/**
 * LoadingScreen component.
 *
 * A full-screen loading overlay with animated particles, progress bar, and loading message.
 * Automatically fades out when loading completes and calls the onComplete callback.
 */
const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isLoading,
  onComplete,
  message,
  progress,
}) => {
  const { isMobile } = useDevice()
  const { t } = useTranslation()
  const [visible, setVisible] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const [particles, setParticles] = useState<
    Array<{
      delay: string
      duration: string
      x: string
      y: string
    }>
  >([])

  // Generate particles only on client side to avoid hydration mismatch
  useEffect(() => {
    /**
     * Generate random particle configurations for animation.
     *
     * @returns An array of particle objects with random delay, duration, and position values.
     */
    const generateParticles = () => {
      return Array.from({ length: 20 }).map(() => ({
        delay: `${Math.random() * 3}s`,
        duration: `${2 + Math.random() * 2}s`,
        x: `${Math.random() * 100}%`,
        y: `${Math.random() * 100}%`,
      }))
    }

    setParticles(generateParticles())
  }, [])

  // Reopen when loading starts again
  useEffect(() => {
    if (isLoading) {
      setVisible(true)
      setFadeOut(false)
    }
  }, [isLoading])

  useEffect(() => {
    if (!isLoading) {
      setFadeOut(true)
      const timer = setTimeout(() => {
        setVisible(false)
        if (onComplete) onComplete()
      }, FADE_OUT_DURATION)
      return () => clearTimeout(timer)
    }
  }, [isLoading, onComplete])

  if (!visible) return null

  return (
    <div className={`loading-screen${fadeOut ? ' fade-out' : ''}`}>
      {/* Background particle effects */}
      <div className="loading-background">
        <div className="particles">
          {particles.map((particle, i) => (
            <div
              key={i}
              className="particle"
              style={
                {
                  '--delay': particle.delay,
                  '--duration': particle.duration,
                  '--x': particle.x,
                  '--y': particle.y,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="loading-content">
        {/* Title */}
        <h1 className="loading-title">
          <span className="title-main">{t('loading.title')}</span>
          <span className="title-sub">{t('loading.subTitle')}</span>
        </h1>
        <div
          className="loading-progress-bar"
          style={{ width: isMobile ? '400px' : '800px', height: '10px' }}
        >
          <div
            className="loading-progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        {/* Loading animation - text only */}
        <div className="loading-animation" style={{ marginTop: '10px' }}>
          <span className="progress-text">{message ?? 'Loading...'}</span>
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen
