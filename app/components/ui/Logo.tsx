'use client'

import Image from 'next/image'
import { useDevice } from '../../contexts/DeviceContext'
interface LogoProps {
  className?: string

  onClick?: () => void
  clickable?: boolean
}

export default function Logo({
  className = '',

  onClick,
  clickable = false,
}: LogoProps) {
  const { isMobile } = useDevice()
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
          DLP3D
        </span>
      </div>
    </>
  )
}
