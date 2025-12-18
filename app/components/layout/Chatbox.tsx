'use client'

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GlobalState } from '@/library/babylonjs/core'
import { States } from '@/library/babylonjs/runtime/fsm/states'
import {
  Conditions,
  ConditionedMessage,
} from '@/library/babylonjs/runtime/fsm/conditions'

/**
 * Props for the Chatbox component.
 */
interface ChatboxProps {
  /**
   * Global state for accessing BabylonJS scene and runtime.
   */
  globalState?: GlobalState
}

/**
 * Chatbox
 *
 * A text input component for sending chat messages.
 * Displays a textarea and send button, positioned at the bottom center of the screen.
 *
 * @returns JSX.Element The chatbox UI component.
 */
export default function Chatbox({ globalState }: ChatboxProps) {
  const { t } = useTranslation('fronted')
  const [chatMessage, setChatMessage] = useState('')

  /**
   * Handle sending chat message.
   */
  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      console.log('[Handle Text Message]:', chatMessage)
      if (globalState?.runtime?.streamedAnimationPlaying()) {
        globalState?.stateMachine?.putConditionedMessage(
          new ConditionedMessage(Conditions.USER_TEXT_INTERRUPT_ANIMATION, null),
        )
      }
      globalState?.stateMachine?.putConditionedMessage(
        new ConditionedMessage(Conditions.USER_TEXT_INPUT, { message: chatMessage }),
      )
      setChatMessage('')
    }
  }

  /**
   * Handle Enter key press in textarea.
   */
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="chatbox">
      <textarea
        className="chatbox-textarea"
        placeholder={t('chat.inputMessagePlaceholder')}
        value={chatMessage}
        onChange={(e) => setChatMessage(e.target.value)}
        onKeyDown={handleTextareaKeyDown}
      />
      <button
        className="chatbox-send-btn"
        onClick={handleSendMessage}
        disabled={!chatMessage.trim()}
      >
        {t('chat.send')}
      </button>
    </div>
  )
}

