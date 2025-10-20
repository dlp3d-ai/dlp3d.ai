import React, { useEffect, useState } from 'react'
import './LoadingScreen.css'
import { useDevice } from '@/contexts/DeviceContext'

interface LoadingScreenProps {
  isLoading: boolean
  onComplete?: () => void
  message?: string
  progress?: number
}

const FADE_OUT_DURATION = 500 // ms

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isLoading,
  onComplete,
  message,
  progress,
}) => {
  const { isMobile } = useDevice()

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
      {/* 背景粒子效果 */}
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

      {/* 主要内容 */}
      <div className="loading-content">
        {/* 标题 */}
        <h1 className="loading-title">
          <span className="title-main">DIGITAL LIFE PROJECT</span>
          <span className="title-sub">
            Embodying Autonomous Characters in Living Worlds
          </span>
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
        {/* 加载动画 - 只保留文字 */}
        <div className="loading-animation" style={{ marginTop: '10px' }}>
          <span className="progress-text">{message ?? 'Loading...'}</span>
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen
