'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Props for the ChatModeMenu component.
 */
interface ChatModeMenuProps {
  /**
   * Current chat mode.
   */
  chatMode: 'text' | 'voice' | 'live'
  /**
   * Callback function called when a chat mode is selected.
   * @param mode The selected chat mode.
   */
  onModeSelect: (mode: 'text' | 'voice' | 'live') => void
  /**
   * Whether live chat mode is enabled.
   * @default true
   */
  enableLiveChat?: boolean
}

/**
 * ChatModeMenu
 *
 * A menu component for selecting chat modes (Text Chat, Voice Chat, Live Stream).
 * Displays a button that opens a popup menu with mode options.
 *
 * @param chatMode Current chat mode.
 * @param onModeSelect Callback function called when a mode is selected.
 * @param enableLiveChat Whether live chat mode is enabled. Defaults to true.
 * @returns JSX.Element The chat mode menu UI component.
 */
export default function ChatModeMenu({
  chatMode,
  onModeSelect,
  enableLiveChat = true,
}: ChatModeMenuProps) {
  const { t } = useTranslation('fronted')
  const [showChatModeMenu, setShowChatModeMenu] = useState(false)
  const chatModeMenuRef = useRef<HTMLDivElement>(null)

  /**
   * Close chat mode menu when clicking outside.
   */
  useEffect(() => {
    /**
     * Handle click outside event to close the menu.
     * 
     * @param event The mouse event.
     * @returns void
     */
    function handleClickOutside(event: MouseEvent) {
      if (
        chatModeMenuRef.current &&
        !chatModeMenuRef.current.contains(event.target as Node)
      ) {
        setShowChatModeMenu(false)
      }
    }

    if (showChatModeMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showChatModeMenu])

  /**
   * Get the display text for the current chat mode.
   * 
   * @returns The translated text for the current chat mode.
   */
  const getChatModeText = () => {
    switch (chatMode) {
      case 'text':
        return t('chat.textChat')
      case 'voice':
        return t('chat.voiceChat')
      case 'live':
        return t('chat.liveStream')
      default:
        return t('chat.voiceChat')
    }
  }

  /**
   * Handle chat mode selection.
   * 
   * Calls the onModeSelect callback and closes the menu.
   * 
   * @param mode The selected chat mode.
   * @returns void
   */
  const handleChatModeSelect = (mode: 'text' | 'voice' | 'live') => {
    onModeSelect(mode)
    setShowChatModeMenu(false)
  }

  return (
    <div
      ref={chatModeMenuRef}
      style={{
        position: 'fixed',
        bottom: '40px',
        left: '20px',
        zIndex: 1000,
      }}
    >
      <button
        className="chatSwitch-btn"
        onClick={() => setShowChatModeMenu(!showChatModeMenu)}
      >
        {getChatModeText()}
      </button>

      {showChatModeMenu && (
        <div className="chat-mode-menu">
          <button
            className={`chat-mode-menu-item ${chatMode === 'text' ? 'active' : ''}`}
            onClick={() => handleChatModeSelect('text')}
          >
            {t('chat.textChat')}
          </button>

          <button
            className={`chat-mode-menu-item ${chatMode === 'voice' ? 'active' : ''}`}
            onClick={() => handleChatModeSelect('voice')}
          >
            {t('chat.voiceChat')}
          </button>

          {enableLiveChat && (
            <button
              className={`chat-mode-menu-item ${chatMode === 'live' ? 'active' : ''}`}
              onClick={() => handleChatModeSelect('live')}
            >
              {t('chat.liveStream')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

