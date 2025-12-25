'use client'

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GlobalState } from '@/library/babylonjs/core'
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
 * @param globalState Global state for accessing BabylonJS scene and runtime.
 * @returns JSX.Element The chatbox UI component.
 */
export default function Chatbox({ globalState }: ChatboxProps) {
  const { t } = useTranslation('fronted')
  const [chatMessage, setChatMessage] = useState('')

  /**
   * Handle sending chat message.
   *
   * Sends the current chat message to the state machine. If an animation is currently playing,
   * it will interrupt the animation before sending the message.
   *
   * @returns void
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
   *
   * Sends the message when Enter is pressed without Shift. Prevents default behavior
   * to avoid adding a new line.
   *
   * @param e The keyboard event from the textarea.
   * @returns void
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
        onChange={e => setChatMessage(e.target.value)}
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
