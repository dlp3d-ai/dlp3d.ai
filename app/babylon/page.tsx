'use client'
import { useState, useEffect } from 'react'
import { BabylonJSProvider } from '../contexts/BabylonJSContext'
import SceneLayout from '../layouts/scene'
import Navigation from '../components/layout/Navigation'
import AuthGuard from '../components/auth/AuthGuard'
import ScreenshotOverlay from '../components/ui/ScreenshotOverlay'
import { CssBaseline, ThemeProvider } from '@mui/material'
import appTheme from '@/themes/theme'
import '@/styles/components.css'
import { useDispatch } from 'react-redux'
import { setAuthState, loadAuthStateFromStorage } from '@/features/auth/authStore'
import { setIsChatStarting } from '@/features/chat/chat'

/**
 * Homepage 3D scene component.
 *
 * This component renders the interactive 3D scene powered by Babylon.js,
 * including authentication guard, navigation, and screenshot overlay functionality.
 * It handles character ID retrieval from URL parameters or localStorage.
 */
export default function BabylonPage() {
  const dispatch = useDispatch()
  const [showScreenshotOverlay, setShowScreenshotOverlay] = useState(true)
  const [characterId, setCharacterId] = useState<string | null>(null)

  // Initialize auth state from localStorage
  useEffect(() => {
    dispatch(setAuthState(loadAuthStateFromStorage()))
  }, [dispatch])

  // Hide chat list in babylon page (new tab)
  useEffect(() => {
    dispatch(setIsChatStarting(true))
  }, [dispatch])

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  useEffect(() => {
    const sessionId = localStorage.getItem('dlp_current_session_id')
    setCurrentSessionId(sessionId)
  }, [])

  // Get character ID from URL parameters or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const characterIdFromUrl = urlParams.get('character_id')

    if (characterIdFromUrl) {
      setCharacterId(characterIdFromUrl)
    } else {
      // Fallback to localStorage if available
      const storedCharacterId = localStorage.getItem('dlp_selected_character_id')
      if (storedCharacterId) {
        setCharacterId(storedCharacterId)
      }
    }
  }, [])

  /**
   * Handle screenshot overlay close event.
   *
   * Hides the screenshot overlay when the user closes it.
   */
  const handleScreenshotOverlayClose = () => {
    setShowScreenshotOverlay(false)
  }

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline enableColorScheme />
      <Navigation />
      <AuthGuard redirectTo="/">
        <BabylonJSProvider characterId={characterId}>
          <SceneLayout />
        </BabylonJSProvider>
      </AuthGuard>

      {/* Screenshot Overlay */}
      {showScreenshotOverlay && (
        <ScreenshotOverlay
          onClose={handleScreenshotOverlayClose}
          sessionId={currentSessionId}
        />
      )}
    </ThemeProvider>
  )
}
