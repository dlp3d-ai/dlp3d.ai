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

const link = {
  href: 'https://github.com/dlp3d-ai/dlp3d.ai',
  className: 'peper',
  title: 'GitHub',
  label: 'GitHub',
}
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
  const handleStartConversation = useCallback(async () => {
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
          return
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
  }, [
    isCharacterLoading,
    isSceneLoading,
    currentTtsType,
    chatAvailable,
    selectedChat,
    isSensetimeTAServer,
    dispatch,
    selectedCharacterId,
    selectedScene,
    loadUserCharacters,
  ])
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
  const ChatButton = useCallback(() => {
    if (isChatStarting || (isMobile && isLogin)) return null
    return (
      <div className="button-group-container">
        <button
          className="start-conversation-btn"
          onClick={handleStartConversation}
          disabled={
            !chatAvailable || isCharacterLoading || isSceneLoading || !isLogin
          }
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
    )
  }, [
    isChatStarting,
    isMobile,
    isLogin,
    handleStartConversation,
    chatAvailable,
    isCharacterLoading,
    isSceneLoading,
  ])

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
        onCancel={() => {
          window.open(link.href, '_blank')
        }}
        onClose={() => {
          setLocationDialogOpen(false)
        }}
        cancelText={
          <a
            key={link.className}
            href={link.href}
            target="_blank"
            title={link.title}
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',

              color: '#ffffff',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span>{link.label}</span>
          </a>
        }
        onConfirm={() => {
          setLocationDialogOpen(false)
          localStorage.setItem('dlp_enter_wrong_location', 'true')
          handleStartConversation()
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

      <ChatButton />
    </>
  )
}
