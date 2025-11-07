'use client'

import { useDevice } from '../../contexts/DeviceContext'
import { useSelector, useDispatch } from 'react-redux'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ConfigSidebarDrawer from './components/Drawer'

import './styles/index.scss'

// Redux imports
import { getIsChatStarting, getSelectedCharacterId } from '@/features/chat/chat'

import { setIsSliderOpen } from '@/features/chat/chat'
import { usePromptingSettings } from '@/hooks/usePromptingSettings'

/**
 * Props for ConfigSidebar component.
 */
interface ConfigSidebarProps {
  /** Whether chat functionality is available. */
  chatAvailable: boolean
  /** Whether character is currently loading. */
  isCharacterLoading: boolean
  /** Whether scene is currently loading. */
  isSceneLoading: boolean

  /** Callback function to handle starting a conversation. */
  handleStartConversation: () => void
  /** Callback function to handle scene changes. */
  onSceneChange: (scene: string) => void
}

/**
 * ConfigSidebar component.
 *
 * A sidebar component that provides configuration options for model, prompt,
 * LLM, TTS, and scene settings. Displays operation buttons and manages the
 * drawer panel for detailed configuration.
 */
export default function ConfigSidebar({
  handleStartConversation,
  chatAvailable,
  isCharacterLoading,
  isSceneLoading,

  onSceneChange,
}: ConfigSidebarProps) {
  const { isMobile } = useDevice()
  const dispatch = useDispatch()
  const isChatStarting = useSelector(getIsChatStarting)
  const { t } = useTranslation()

  const selectedCharacterId = useSelector(getSelectedCharacterId)

  const [active, setActive] = useState('')
  const { loadUserCharacters } = usePromptingSettings()

  const operationList = [
    {
      name: t('sidebar.model'),
      icon: '/img/icons/model.png',
      key: 'model',
    },
    {
      name: t('sidebar.prompt'),
      icon: '/img/icons/prompt.png',
      key: 'prompt',
    },
    {
      name: t('sidebar.llm'),
      icon: '/img/icons/llm.png',
      key: 'llm',
    },
    {
      name: t('sidebar.tts'),
      icon: '/img/icons/tts.png',
      key: 'tts',
    },
    {
      name: t('sidebar.scene'),
      icon: '/img/icons/scene.png',
      key: 'scene',
    },
  ]

  /**
   * Handle sidebar item click event.
   *
   * Loads user characters if needed, toggles the active item, and opens
   * the configuration drawer.
   *
   * @param {string} key The key of the clicked item.
   * @param {React.MouseEvent} event The mouse event object.
   */
  const onItemClick = async (key: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (!selectedCharacterId) {
      await loadUserCharacters()
    }
    if (key === active) {
      setActive('')
      return
    }
    setActive(key)

    dispatch(setIsSliderOpen(true)) // Update Redux state
  }

  return (
    <>
      {/* Mobile */}
      {!isChatStarting && isMobile && (
        <div className="config-sidebar-mobile-button">
          <div className="button-group-container button-group-container-mobile">
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
                left: '0',
              }}
            >
              {chatAvailable && !isCharacterLoading && !isSceneLoading
                ? t('chat.chat')
                : t('chat.loginToChat')}
            </button>
          </div>
        </div>
      )}

      <div
        className={`config-sidebar config-sidebar-${
          isMobile ? 'mobile' : 'desktop'
        }`}
        style={{
          borderRadius: isMobile && active ? '0' : '25px 0 0 25px',
        }}
      >
        {operationList.map((item, index) => (
          <div
            className={`config-sidebar-item ${active === item.key ? 'active' : ''}`}
            key={index}
            onClick={event => onItemClick(item.key, event)}
            style={{ position: 'relative' }}
          >
            <div className="config-sidebar-item-icon">
              <img src={item.icon} />
            </div>
            <span className="config-sidebar-item-name">{item.name}</span>
          </div>
        ))}
      </div>
      <ConfigSidebarDrawer
        active={active}
        onClose={() => {
          setActive('')
          dispatch(setIsSliderOpen(false)) // Update Redux state
        }}
        onSceneChange={onSceneChange}
      />
    </>
  )
}
