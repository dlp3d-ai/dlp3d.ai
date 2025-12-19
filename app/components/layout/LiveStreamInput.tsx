'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { GlobalState } from '@/library/babylonjs/core'
import { States } from '@/library/babylonjs/runtime/fsm/states'
import {
  DanmakuWebSocketClient,
  DanmakuMessageHandler,
  RoomKey,
  TextMessage,
  GiftMessage,
  MemberMessage,
  SuperChatMessage,
} from '@/utils/danmakuWebSocketClient'
import {
  Conditions,
  ConditionedMessage,
} from '@/library/babylonjs/runtime/fsm/conditions'
/**
 * Props for the LiveStreamInput component.
 */
interface LiveStreamInputProps {
  /**
   * Global state for accessing BabylonJS scene and runtime.
   */
  globalState?: GlobalState
}

/**
 * LiveStreamInput
 *
 * A component for inputting and confirming live stream URLs.
 * Displays an input field and confirm button positioned next to the chat mode button.
 *
 * @param globalState Global state for accessing BabylonJS scene and runtime.
 * @returns JSX.Element The live stream input UI component.
 */
export default function LiveStreamInput({ globalState }: LiveStreamInputProps) {
  const { t } = useTranslation('fronted')
  const [liveStreamUrl, setLiveStreamUrl] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<string>(t('chat.notConnected'))
  const [isConnected, setIsConnected] = useState(false)
  const [autoMode, setAutoMode] = useState(false)
  const clientRef = useRef<DanmakuWebSocketClient | null>(null)

  /**
   * Parse live stream URL and extract server address and room identifier.
   * 
   * Supports two formats:
   * 1. file:// URL: file:///path/loader.html?url=http%3A%2F%2Flocalhost%3A12450%2Froom%2FKEY%3FroomKeyType%3D2
   * 2. Direct HTTP URL: http://localhost:12450/room/KEY?roomKeyType=2
   * 
   * @param url The live stream URL to parse.
   * @returns An object containing serverUrl and roomKey, or null if parsing fails.
   */
  const parseLiveStreamUrl = (url: string): { serverUrl: string; roomKey: RoomKey } | null => {
    try {
      let actualUrl = url
      
      // Handle file:// protocol URLs
      if (url.startsWith('file://')) {
        const urlObj = new URL(url)
        // Get url query parameter
        const urlParam = urlObj.searchParams.get('url')
        if (!urlParam) {
          console.error('Missing url parameter in file:// URL')
          return null
        }
        // URL decode
        actualUrl = decodeURIComponent(urlParam)
      }

      // Parse the actual URL
      const urlObj = new URL(actualUrl)
      const serverUrl = `${urlObj.protocol}//${urlObj.host}`
      
      // Extract roomKey from path (e.g., /room/F3RY9LX2M9KW9)
      const pathParts = urlObj.pathname.split('/').filter(Boolean)
      if (pathParts.length < 2 || pathParts[0] !== 'room') {
        console.error('Invalid URL path format, expected format: /room/KEY')
        return null
      }
      
      const roomValue = pathParts[1] // Get roomKey
      
      // Get roomKeyType from query parameter, default to 2 (identity code)
      const roomKeyTypeParam = urlObj.searchParams.get('roomKeyType')
      let roomKeyType: 1 | 2 = 2 // Default to identity code
      
      if (roomKeyTypeParam) {
        const type = parseInt(roomKeyTypeParam, 10)
        if (type === 1 || type === 2) {
          roomKeyType = type as 1 | 2
        }
      } else {
        // If roomKeyType is not specified, try to determine from roomValue
        const roomId = parseInt(roomValue, 10)
        if (!isNaN(roomId)) {
          roomKeyType = 1 // Numeric value is considered room ID
        }
      }
      
      // Build roomKey
      const roomKey: RoomKey = {
        type: roomKeyType,
        value: roomKeyType === 1 ? parseInt(roomValue, 10) : roomValue,
      }

      return { serverUrl, roomKey }
    } catch (error) {
      console.error('Failed to parse URL:', error)
      return null
    }
  }

  /**
   * Send user text message to the state machine.
   * 
   * Processes messages from queues (super chat, gift, text) and sends them to the state machine
   * when it's in IDLE state. In auto mode, sends a "no message" notification if no messages
   * have been received for more than 10 seconds.
   * 
   * @param lastTextMessageTime The timestamp of the last text message, or null if none.
   * @returns void
   */
  const sendUserTextMessage = (lastTextMessageTime: number | null) => {
    if (globalState?.stateMachine?.stateValue === States.IDLE) {
      if (clientRef.current) {
        if (clientRef.current.superChatQueue.size > 0) {
          const message = clientRef.current.superChatQueue.dequeue()
          if (message) {
            const formattedMessages = `[${message.authorName}] sent super chat: ${message.content}`
            globalState?.stateMachine?.putConditionedMessage(
              new ConditionedMessage(Conditions.USER_TEXT_INPUT, { message: formattedMessages }),
            )
            console.log('[Send background message]: ', formattedMessages)
            return
          }
        }
        if (clientRef.current.giftQueue.size > 0) {
          const message = clientRef.current.giftQueue.dequeue()
          if (message) {
            const formattedMessages = `[${message.authorName}] sent gift: ${message.giftName}, ${message.num} pieces`
            globalState?.stateMachine?.putConditionedMessage(
              new ConditionedMessage(Conditions.USER_TEXT_INPUT, { message: formattedMessages }),
            )
            console.log('[Send background message]: ', formattedMessages)
            return
          }
        }
        if (clientRef.current.messageQueue.size > 0) {
          const messages = Array.from(clientRef.current.messageQueue.drain())
          const formattedMessages = messages
            .map((msg) => `[${msg.authorName}]: ${msg.content}`)
            .join('\n')
          globalState?.stateMachine?.putConditionedMessage(
            new ConditionedMessage(Conditions.USER_TEXT_INPUT, { message: formattedMessages }),
          )
          console.log('[Send background message]: ', formattedMessages)
          return
        }else{
          if (autoMode && lastTextMessageTime !== null && Date.now() - lastTextMessageTime > 10000) {
            globalState?.stateMachine?.putConditionedMessage(
              new ConditionedMessage(Conditions.USER_TEXT_INPUT, { message: 'No message' }),
            )
            console.log('[Send background message]: No message')
          }
          return
        }
      }
    }
  }
  /**
   * Message handler for danmaku WebSocket client.
   */
  const messageHandler: DanmakuMessageHandler = {
    onDebugMsg: (msg: string) => {
      console.log('[Danmaku client]', msg)
      setConnectionStatus(msg)
    },
    onHeartBeat: (lastTextMessageTime: number | null) => {
      sendUserTextMessage(lastTextMessageTime)
    },
    onAddText: (message: TextMessage) => {
      console.log('[Danmaku]', message.authorName, ':', message.content)
      if (clientRef.current) {
        clientRef.current.messageQueue.enqueue(message)
        sendUserTextMessage(Date.now())
      }
    },
    onAddGift: (message: GiftMessage) => {
      console.log('[Gift]', message.authorName, ':', message.giftName, 'x', message.num)
      if (clientRef.current) {
        clientRef.current.giftQueue.enqueue(message)
        sendUserTextMessage(Date.now())
      }
    },
    onAddMember: (message: MemberMessage) => {
      console.log('[Member]', message.authorName, 'joined the live stream')
      // Logic for handling member messages can be added here
    },
    onAddSuperChat: (message: SuperChatMessage) => {
      console.log('[Super chat]', message.authorName, ':', message.content, '¥', message.price)
      if (clientRef.current) {
        clientRef.current.superChatQueue.enqueue(message)
        sendUserTextMessage(Date.now())
      }
    },
    onFatalError: (error: string) => {
      console.error('[Fatal error]', error)
      setConnectionStatus(`Connection failed: ${error}`)
      setIsConnected(false)
    },
  }

  /**
   * Handle live stream URL confirmation.
   * 
   * Parses the URL, disconnects any existing connection, and creates a new WebSocket client
   * to connect to the live stream server.
   * 
   * @returns void
   */
  const handleConfirm = () => {
    if (!liveStreamUrl.trim()) {
      return
    }

    // If already connected, disconnect the old connection first
    if (clientRef.current) {
      clientRef.current.stop()
      clientRef.current = null
    }

    // Parse URL
    // URL format examples:
    // - file:///path/loader.html?url=http%3A%2F%2Flocalhost%3A12450%2Froom%2FKEY%3FroomKeyType%3D2
    // - http://localhost:12450/room/KEY?roomKeyType=2
    const parsed = parseLiveStreamUrl(liveStreamUrl.trim())
    if (!parsed) {
      alert('Invalid live stream URL, please check the format\nSupported formats:\n1. file:// URL (with url parameter)\n2. http://server:port/room/KEY?roomKeyType=2')
      return
    }

    // Create WebSocket client
    const client = new DanmakuWebSocketClient(parsed.serverUrl, parsed.roomKey, false)
    client.setMsgHandler(messageHandler)
    client.start()

    clientRef.current = client
    setIsConnected(true)
    setConnectionStatus('Connecting...')
  }

  /**
   * Handle disconnection from the live stream.
   * 
   * Stops the WebSocket client and updates the connection status.
   * 
   * @returns void
   */
  const handleDisconnect = () => {
    if (clientRef.current) {
      clientRef.current.stop()
      clientRef.current = null
      setIsConnected(false)
      setConnectionStatus('Disconnected')
    }
  }

  /**
   * Clean up connection when component unmounts.
   */
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.stop()
        clientRef.current = null
      }
    }
  }, [])

  /**
   * Handle Enter key press in input.
   * 
   * Triggers the confirm action when Enter is pressed.
   * 
   * @param e The keyboard event from the input element.
   * @returns void
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirm()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '40px',
        left: '160px',
        zIndex: 1000,
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
      }}
    >
      <input
        type="text"
        className="live-stream-input"
        placeholder={t('chat.inputLiveStreamUrlPlaceholder')}
        value={liveStreamUrl}
        onChange={(e) => setLiveStreamUrl(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          padding: '10px 16px',
          background: 'rgba(26, 26, 46, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          color: '#ffffff',
          fontSize: '0.875rem',
          width: '300px',
          outline: 'none',
          transition: 'all 0.2s ease',
        }}
        onFocus={(e) => {
          e.currentTarget.style.background = 'rgba(26, 26, 46, 0.95)'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.background = 'rgba(26, 26, 46, 0.9)'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
        }}
      />
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.8)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setAutoMode(!autoMode)}
      >
        <div
          style={{
            position: 'relative',
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            background: autoMode ? 'rgba(0, 123, 255, 0.9)' : 'rgba(128, 128, 128, 0.5)',
            transition: 'background 0.2s ease',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '2px',
              left: autoMode ? '22px' : '2px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#ffffff',
              transition: 'left 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            }}
          />
        </div>
        <span>{t('chat.autoMode')}</span>
      </label>
      {!isConnected ? (
        <button
          className="chatSwitch-btn"
          onClick={handleConfirm}
          disabled={!liveStreamUrl.trim()}
          style={{
            width: 'auto',
            padding: '6px 20px',
            minWidth: '80px',
            height: 'auto',
            background: 'rgba(0, 123, 255, 0.9)',
            border: '1px solid rgba(0, 123, 255, 0.3)',
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.background = 'rgba(0, 123, 255, 1)'
              e.currentTarget.style.borderColor = 'rgba(0, 123, 255, 0.5)'
            }
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.background = 'rgba(0, 123, 255, 0.9)'
              e.currentTarget.style.borderColor = 'rgba(0, 123, 255, 0.3)'
            }
          }}
        >
          {t('chat.connect')}
        </button>
      ) : (
        <button
          className="chatSwitch-btn"
          onClick={handleDisconnect}
          style={{
            width: 'auto',
            padding: '6px 20px',
            minWidth: '80px',
            height: 'auto',
            background: 'rgba(220, 53, 69, 0.9)',
            border: '1px solid rgba(220, 53, 69, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(220, 53, 69, 1)'
            e.currentTarget.style.borderColor = 'rgba(220, 53, 69, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(220, 53, 69, 0.9)'
            e.currentTarget.style.borderColor = 'rgba(220, 53, 69, 0.3)'
          }}
        >
          {t('chat.disconnect')}
        </button>
      )}
      {connectionStatus && (
        <span
          style={{
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.7)',
            marginLeft: '8px',
          }}
        >
          {connectionStatus}
        </span>
      )}
    </div>
  )
}

