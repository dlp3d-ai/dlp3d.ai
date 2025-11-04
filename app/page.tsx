'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { HDRI_SCENES } from '@/library/babylonjs/config/scene'
import Navigation from './components/layout/Navigation'

import Footer from './components/layout/Footer'

import MobileNoticePanel from './components/ui/MobileNoticePanel'
import { useDevice } from './contexts/DeviceContext'
import BabylonViewer, { BabylonViewerRef } from './components/ui/BabylonViewer'
import LoadingScreen from './components/LoadingScreen'
import '@/styles/components.css'
import { captureScreenshot, saveScreenshotToStorage } from '@/utils/screenshot'

import ConfigSidebar from './components/sidebar'
import LeftSidebar from './components/setting'
import { useSelector, useDispatch } from 'react-redux'
import {
  getIsChatStarting,
  setIsChatStarting,
  getSelectedModelIndex,
  getSelectedCharacterId,
  setIsCharacterLoading,
  getIsCharacterLoading,
  getLoadingText,
  setLoadingText,
  getIsSceneLoading,
  setIsSceneLoading,
  getLoadingProgress,
  getSelectedChat,
} from '@/features/chat/chat'

import {
  getIsLogin,
  loadAuthStateFromStorage,
  setAuthState,
} from '@/features/auth/authStore'
import { usePromptingSettings } from '@/hooks/usePromptingSettings'
import { checkLocation, isSensetimeOrchestrator } from '@/utils/location'
import { ConfirmDialog } from './components/common/Dialog'
import { useTranslation } from 'react-i18next'

/**
 * Home component.
 *
 * The main page component that manages the 3D scene viewer, chat initialization,
 * character loading, and scene management. Handles user authentication, loading states,
 * and navigation to the chat interface.
 */
export default function Home() {
  const dispatch = useDispatch()
  const selectedChat = useSelector(getSelectedChat)
  const { t } = useTranslation()
  const babylonViewerRef = useRef<BabylonViewerRef>(null)

  const isChatStarting = useSelector(getIsChatStarting)
  const isLogin = useSelector(getIsLogin)
  const selectedModelIndex = useSelector(getSelectedModelIndex)
  const selectedCharacterId = useSelector(getSelectedCharacterId)
  const isCharacterLoading = useSelector(getIsCharacterLoading)
  const loadingText = useSelector(getLoadingText)
  const isSceneLoading = useSelector(getIsSceneLoading)
  const loadingProgress = useSelector(getLoadingProgress)

  const [sceneName, setSceneName] = useState(HDRI_SCENES[3].name)
  const isSensetimeTAServer = isSensetimeOrchestrator()

  const [chatAvailable, setChatAvailable] = useState(false) // Whether Chat should be enabled for current character
  const [characterChangeKey, setCharacterChangeKey] = useState(0) // Track character selection changes

  const [uiFadeOut, setUiFadeOut] = useState(false) // Controls fade-out animation
  const [isLoading, setIsLoading] = useState(true) // Loading state
  const [isGlobalLoading, setIsGlobalLoading] = useState(
    isLoading || isSceneLoading || isCharacterLoading,
  )
  const [currentTtsType, setCurrentTtsType] = useState<string | null>(null)
  const [showUnsupportedTtsNotice, setShowUnsupportedTtsNotice] = useState(false)
  const { isMobile } = useDevice()
  const { loadUserCharacters } = usePromptingSettings()
  const [selectedScene, setSelectedScene] = useState(3) // Parameter for scene navigation
  const [locationDialogOpen, setLocationDialogOpen] = useState(false)

  useEffect(() => {
    setIsGlobalLoading(isLoading || isSceneLoading || isCharacterLoading)
  }, [isLoading, isSceneLoading, isCharacterLoading])

  useEffect(() => {
    ;(window as any).babylonViewerRef = babylonViewerRef
    return () => {
      delete (window as any).babylonViewerRef
    }
  }, [])
  useEffect(() => {
    if (isLogin) {
      ;(async () => {
        await loadUserCharacters()
      })()
      setChatAvailable(true)
    }
  }, [isLogin])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
      dispatch(setIsCharacterLoading(false))
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    dispatch(setAuthState(loadAuthStateFromStorage()))
  }, [])

  useEffect(() => {
    if (selectedChat) {
      const name = HDRI_SCENES.find(
        (scene: any) => scene.name === selectedChat.scene_name,
      )?.name

      if (selectedChat.scene_name && name !== sceneName) {
        const index = HDRI_SCENES.findIndex(
          (scene: any) => scene.name === selectedChat.scene_name,
        )
        if (index !== -1) {
          dispatch(setIsSceneLoading(true))
          setSceneName(HDRI_SCENES[index].name)
          setSelectedScene(index)
        }
      }
    }
  }, [selectedChat])

  /**
   * Handle character loaded event.
   *
   * Dispatches actions to update loading state and triggers a custom event
   * after a delay to ensure all components are initialized.
   */
  const handleCharacterLoaded = useCallback(() => {
    dispatch(setIsCharacterLoading(false))
    dispatch(setLoadingText(''))
    // Delay event trigger to ensure all components are initialized
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('character-loaded'))
      }
    }, 1000)
  }, [])

  /**
   * Handle scene change.
   *
   * @param scene The name of the scene to switch to.
   */
  const handleSceneChange = (scene: string) => {
    dispatch(setIsSceneLoading(true))
    dispatch(setLoadingText('Loading Scene...'))

    setSceneName(scene)
    const index = HDRI_SCENES.findIndex((scene: any) => scene.name === scene)
    setSelectedScene(index)
  }

  /**
   * Handle scene loaded event.
   *
   * Dispatches actions to update loading state when the scene has finished loading.
   */
  const handleSceneLoaded = useCallback(() => {
    dispatch(setIsSceneLoading(false))
    dispatch(setLoadingText(''))
  }, [])

  /**
   * Handle starting a conversation.
   *
   * Validates prerequisites, saves camera and scene state, captures a screenshot,
   * and opens a new window with the chat interface. Handles TTS compatibility checks
   * and location-based warnings for specific server hosts.
   */
  const handleStartConversation = async () => {
    if (isCharacterLoading || isSceneLoading) {
      return
    }

    // Block unsupported TTS for specific server host
    const unsupportedList = [
      'sensenova_v2',
      'sense_v2',
      'softsugar_v2',
      'zoetrope_v2',
    ]
    if (currentTtsType && unsupportedList.includes(currentTtsType)) {
      setShowUnsupportedTtsNotice(true)
      return
    }

    if (chatAvailable) {
      try {
        const cameraState = babylonViewerRef.current?.getCameraState?.()
        if (cameraState) {
          localStorage.setItem('dlp_camera_state', JSON.stringify(cameraState))
        }
        if (selectedChat?.scene_name) {
          localStorage.setItem(
            'dlp_scene_index',
            HDRI_SCENES.findIndex(
              scene => scene.name === selectedChat.scene_name,
            ) === -1
              ? '3'
              : HDRI_SCENES.findIndex(
                  scene => scene.name === selectedChat.scene_name,
                ).toString(),
          )
        }
        const isInMainlandChinaOrHongKong = checkLocation()
        const enterWrongLocation = localStorage.getItem('dlp_enter_wrong_location')
        if (
          !isInMainlandChinaOrHongKong &&
          !enterWrongLocation &&
          isSensetimeTAServer
        ) {
          setLocationDialogOpen(true)
        }
        try {
          dispatch(setIsChatStarting(true))
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('chat-starting'))
          }
          await new Promise(r => setTimeout(r, 100))

          if (!selectedCharacterId) {
            await loadUserCharacters()
          }
          await new Promise(r => setTimeout(r, 800))

          if (babylonViewerRef.current?.takeScreenshot) {
            const screenshotData = await captureScreenshot()
            const sessionId = `chat_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`
            try {
              await saveScreenshotToStorage(screenshotData, sessionId)
              localStorage.setItem('dlp_current_session_id', sessionId)
            } catch (screenshotError) {
              console.error(
                'Failed to save screenshot, continuing without it:',
                screenshotError,
              )
              localStorage.setItem('dlp_current_session_id', sessionId)
            }
          }
          const url = `/babylon?scene=${selectedScene}${
            selectedCharacterId ? `&character_id=${selectedCharacterId}` : ''
          }`
          window.open(url, '_blank', 'noopener,noreferrer')
        } catch (error) {
          console.error('Screenshot failed:', error)
          const url = `/babylon?scene=${selectedScene}${
            selectedCharacterId ? `&character_id=${selectedCharacterId}` : ''
          }`
          window.open(url, '_blank', 'noopener,noreferrer')
        } finally {
          dispatch(setIsChatStarting(false))
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('chat-screenshot-done'))
          }
        }
      } catch (error) {
        console.error('Failed to open new tab: ', error)
        const fallbackUrl = `/babylon?scene=${selectedScene}`
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
      }
    }
  }
  useEffect(() => {
    // Listen for route changes and reset chat state when returning to homepage
    const handleRouteChange = () => {
      if (window.location.pathname === '/') {
        dispatch(setIsChatStarting(false))
        setUiFadeOut(false)
      }
    }

    // Check current path on page load
    handleRouteChange()

    // Listen for browser back/forward events
    window.addEventListener('popstate', handleRouteChange)

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [dispatch])

  return (
    <>
      {/* Loading Screen */}
      <LoadingScreen
        isLoading={isGlobalLoading}
        message={t('loading.message')}
        onComplete={() => setIsLoading(false)}
        progress={loadingProgress}
      />
      {/* Fullscreen Babylon.js Background */}
      <BabylonViewer
        ref={babylonViewerRef}
        width="100vw"
        height="100vh"
        className="fullscreen-babylon-viewer"
        sceneName={sceneName}
        selectedCharacter={selectedModelIndex}
        characterChangeKey={characterChangeKey}
        onCharacterLoaded={handleCharacterLoaded}
        onSceneLoaded={handleSceneLoaded}
      />
      {/* Navigation */}
      <Navigation />

      {/* Main Content Container */}
      <div className={`main-content-container${uiFadeOut ? ' fade-out' : ''}`}>
        {/* Only show UI when not isChatStarting */}
        {!isChatStarting && (
          <>
            {/* Hero Section */}
            <div className="hero-section">
              <div className="hero-content"> </div>
            </div>
          </>
        )}

        {/* Hidden DOM for billboard screenshot */}
        <div
          id="dlp-billboard-capture"
          style={{
            position: 'absolute',
            left: '-9999px',
            top: 0,
            pointerEvents: 'none',
          }}
        >
          <div className="hero-content"> </div>
        </div>
      </div>
      {!isChatStarting && isLogin && (
        <>
          <LeftSidebar />
          <ConfigSidebar
            handleStartConversation={handleStartConversation}
            chatAvailable={chatAvailable}
            isCharacterLoading={isCharacterLoading}
            isSceneLoading={isSceneLoading}
            onSceneChange={handleSceneChange}
          />
        </>
      )}
      {/* Unsupported TTS Notice */}
      <MobileNoticePanel
        isOpen={showUnsupportedTtsNotice}
        onClose={() => setShowUnsupportedTtsNotice(false)}
        title="TTS Unsupported"
        message={`The selected TTS (“${
          currentTtsType ?? ''
        }”) is not available on the current server. Please switch to a different TTS in Character Settings.`}
        autoDismissDuration={null}
      />
      {/* Location Dialog */}
      <ConfirmDialog
        isOpen={locationDialogOpen}
        onClose={() => setLocationDialogOpen(false)}
        showCancelButton={false}
        onConfirm={() => {
          setLocationDialogOpen(false)
          localStorage.setItem('dlp_enter_wrong_location', 'true')
        }}
        title={t('networkLatencyWarning.title')}
        message={t('networkLatencyWarning.message')}
        confirmText={t('networkLatencyWarning.confirmText')}
      />
      {/* Footer */}
      {!isChatStarting && !isLogin && (
        <footer className={uiFadeOut ? 'fade-out' : ''}>
          <Footer />
        </footer>
      )}
      {/* Button Group Container */}
      {!isChatStarting && !isMobile && (
        <div className="button-group-container">
          <button
            className="start-conversation-btn"
            onClick={handleStartConversation}
            disabled={!chatAvailable || isCharacterLoading || isSceneLoading}
            style={{
              opacity:
                chatAvailable && !isCharacterLoading && !isSceneLoading ? 1 : 0.6,
              cursor:
                chatAvailable && !isCharacterLoading && !isSceneLoading
                  ? 'pointer'
                  : 'not-allowed',
              borderRadius: '30px 0 0 30px', // Only round the left side
            }}
          >
            {chatAvailable && !isCharacterLoading && !isSceneLoading && isLogin
              ? t('chat.chat')
              : t('chat.loginToChat')}
          </button>
        </div>
      )}
      {/* Loading overlay removed in favor of full-screen LoadingScreen */}
    </>
  )
}
