'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Authenticator from './Authenticator'
import './index.scss'
import { useTranslation } from 'react-i18next'

/**
 * Props interface for the AuthModal component.
 */
interface AuthModalProps {
  /** Whether the modal is currently open */
  isOpen: boolean
  /** Callback function to close the modal */
  onClose: () => void
  /** Callback function called when authentication is successful */
  onAuthSuccess: () => void
}

/**
 * AuthModal component for user authentication.
 *
 * A modal component that displays an authentication interface with animated background particles.
 * It handles client-side rendering and provides a modern UI for user login/registration.
 */
export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
}: AuthModalProps) {
  /** State to track if the component is rendered on client side */
  const [isClient, setIsClient] = useState(false)
  /** State to store particle animation data for background effect */
  const [particles, setParticles] = useState<
    Array<{
      delay: string
      duration: string
      x: string
      y: string
    }>
  >([])
  const router = useRouter()
  const { t } = useTranslation()
  useEffect(() => {
    setIsClient(true)
  }, [])

  /**
   * Generate particles for background effect when modal opens.
   */
  useEffect(() => {
    if (isOpen) {
      /**
       * Generate random particle data for animation.
       *
       * @returns Array of particle objects with random properties
       */
      const generateParticles = () => {
        return Array.from({ length: 15 }).map(() => ({
          delay: `${Math.random() * 3}s`,
          duration: `${2 + Math.random() * 2}s`,
          x: `${Math.random() * 100}%`,
          y: `${Math.random() * 100}%`,
        }))
      }

      setParticles(generateParticles())
    }
  }, [isOpen])

  /**
   * Handle modal close action and redirect to home page.
   */
  const handleClose = () => {
    if (onClose) onClose()
    router.push('/')
  }

  if (!isClient || !isOpen) {
    return null
  }

  return (
    <div className="auth-modal-overlay">
      {/* Background particle effects */}
      <div className="auth-modal-background">
        <div className="auth-particles">
          {particles.map((particle, i) => (
            <div
              key={i}
              className="auth-particle"
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

      <div className="auth-modal-content">
        <button className="auth-modal-close" onClick={handleClose}>
          &times;
        </button>
        <div className="auth-modal-header">
          <h2 className="auth-title">
            <span className="auth-title-main">{t('auth.title')}</span>
            <span className="auth-title-sub">{t('auth.subTitle')}</span>
          </h2>
        </div>
        <Authenticator onAuthSuccess={onAuthSuccess} />
      </div>
    </div>
  )
}
