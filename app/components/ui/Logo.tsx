'use client'

import Image from 'next/image'
import { useDevice } from '../../contexts/DeviceContext'
import { useTranslation } from 'react-i18next'
interface LogoProps {
  className?: string

  onClick?: () => void
  clickable?: boolean
}

/**
 * Logo component.
 *
 * Displays the app logo and title text. Optionally renders as a clickable
 * button with keyboard accessibility.
 *
 * @param className Optional additional class names.
 * @param onClick Optional click handler when clickable is true.
 * @param clickable Whether the logo acts as a button. Default: false
 *
 * @returns JSX.Element The logo element.
 */
export default function Logo({
  className = '',

  onClick,
  clickable = false,
}: LogoProps) {
  const { isMobile } = useDevice()
  const { t } = useTranslation()
  /**
   * Handle keyboard activation when logo is clickable.
   *
   * @param event Keyboard event (Enter/Space triggers onClick).
   *
   * @returns void
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && onClick) {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <>
      <div
        className={`logo ${className}`}
        onClick={clickable ? onClick : undefined}
        onKeyDown={clickable ? handleKeyDown : undefined}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        aria-label={clickable ? 'Navigate to home page' : undefined}
        style={{ cursor: clickable ? 'pointer' : 'default' }}
      >
        <Image
          src="/img/logo.png"
          alt="DLP3D Logo"
          width={42}
          height={42}
          className="logo-image"
        />
        <span
          className="logo-text"
          style={{ fontSize: isMobile ? '1rem' : '1.5rem' }}
        >
          {t('nav.title')}
        </span>
      </div>
    </>
  )
}
