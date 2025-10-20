'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AuthModal from './AuthModal'
import { getIsLogin } from '@/features/auth/authStore'
import { useSelector } from 'react-redux'
import { usePromptingSettings } from '@/hooks/usePromptingSettings'

/**
 * Props interface for the AuthGuard component.
 */
interface AuthGuardProps {
  /** The protected content to render when authenticated. */
  children: React.ReactNode
  /** The route to redirect to when authentication is cancelled. */
  redirectTo?: string
}

/**
 * AuthGuard component that protects routes by checking authentication status.
 *
 * @param children The protected content to render when authenticated.
 * @param redirectTo The route to redirect to when authentication is cancelled. Defaults to '/'.
 * @returns JSX element containing either the protected content or authentication modal.
 */
export default function AuthGuard({ children, redirectTo = '/' }: AuthGuardProps) {
  const isAuthenticated = useSelector(getIsLogin)
  const { loadUserCharacters } = usePromptingSettings()
  const router = useRouter()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isLoading] = useState(false)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowAuthModal(true)
    }
  }, [isLoading, isAuthenticated])

  /**
   * Handle successful authentication by closing the auth modal.
   */
  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    loadUserCharacters()
  }

  /**
   * Handle authentication modal close by redirecting to the specified route.
   */
  const handleAuthClose = () => {
    setShowAuthModal(false)
    router.push(redirectTo)
  }

  // Show loading state while checking auth
  if (isLoading) {
    return null // Do not display any content
  }

  // Show protected content if authenticated
  if (isAuthenticated) {
    return <>{children}</>
  }

  // Show auth modal for unauthenticated users
  return (
    <AuthModal
      isOpen={showAuthModal}
      onClose={handleAuthClose}
      onAuthSuccess={handleAuthSuccess}
    />
  )
}
