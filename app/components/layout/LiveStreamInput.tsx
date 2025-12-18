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
   * 解析直播流 URL，提取服务器地址和房间标识
   * 支持两种格式：
   * 1. file:// URL: file:///path/loader.html?url=http%3A%2F%2Flocalhost%3A12450%2Froom%2FKEY%3FroomKeyType%3D2
   * 2. 直接 HTTP URL: http://localhost:12450/room/KEY?roomKeyType=2
   */
  const parseLiveStreamUrl = (url: string): { serverUrl: string; roomKey: RoomKey } | null => {
    try {
      let actualUrl = url
      
      // 处理 file:// 协议的 URL
      if (url.startsWith('file://')) {
        const urlObj = new URL(url)
        // 获取 url 查询参数
        const urlParam = urlObj.searchParams.get('url')
        if (!urlParam) {
          console.error('file:// URL 中缺少 url 参数')
          return null
        }
        // URL 解码
        actualUrl = decodeURIComponent(urlParam)
      }

      // 解析实际的 URL
      const urlObj = new URL(actualUrl)
      const serverUrl = `${urlObj.protocol}//${urlObj.host}`
      
      // 从路径中提取 roomKey（例如：/room/F3RY9LX2M9KW9）
      const pathParts = urlObj.pathname.split('/').filter(Boolean)
      if (pathParts.length < 2 || pathParts[0] !== 'room') {
        console.error('URL 路径格式不正确，期望格式: /room/KEY')
        return null
      }
      
      const roomValue = pathParts[1] // 获取 roomKey
      
      // 从查询参数中获取 roomKeyType，默认为 2（身份码）
      const roomKeyTypeParam = urlObj.searchParams.get('roomKeyType')
      let roomKeyType: 1 | 2 = 2 // 默认为身份码
      
      if (roomKeyTypeParam) {
        const type = parseInt(roomKeyTypeParam, 10)
        if (type === 1 || type === 2) {
          roomKeyType = type as 1 | 2
        }
      } else {
        // 如果没有指定 roomKeyType，尝试根据 roomValue 判断
        const roomId = parseInt(roomValue, 10)
        if (!isNaN(roomId)) {
          roomKeyType = 1 // 数字则认为是房间ID
        }
      }
      
      // 构建 roomKey
      const roomKey: RoomKey = {
        type: roomKeyType,
        value: roomKeyType === 1 ? parseInt(roomValue, 10) : roomValue,
      }

      return { serverUrl, roomKey }
    } catch (error) {
      console.error('解析 URL 失败:', error)
      return null
    }
  }

  const sendUserTextMessage = (lastTextMessageTime: number | null) => {
    if (globalState?.stateMachine?.stateValue === States.IDLE) {
      if (clientRef.current) {
        if (clientRef.current.superChatQueue.size > 0) {
          const message = clientRef.current.superChatQueue.dequeue()
          if (message) {
            const formattedMessages = `[${message.authorName}]发送了醒目留言: ${message.content}`
            globalState?.stateMachine?.putConditionedMessage(
              new ConditionedMessage(Conditions.USER_TEXT_INPUT, { message: formattedMessages }),
            )
            console.log('[发送后台消息]: ', formattedMessages)
            return
          }
        }
        if (clientRef.current.giftQueue.size > 0) {
          const message = clientRef.current.giftQueue.dequeue()
          if (message) {
            const formattedMessages = `[${message.authorName}]发送了礼物: ${message.giftName}, ${message.num} 件`
            globalState?.stateMachine?.putConditionedMessage(
              new ConditionedMessage(Conditions.USER_TEXT_INPUT, { message: formattedMessages }),
            )
            console.log('[发送后台消息]: ', formattedMessages)
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
          console.log('[发送后台消息]: ', formattedMessages)
          return
        }else{
          if (autoMode && lastTextMessageTime !== null && Date.now() - lastTextMessageTime > 10000) {
            globalState?.stateMachine?.putConditionedMessage(
              new ConditionedMessage(Conditions.USER_TEXT_INPUT, { message: '无消息/No message' }),
            )
            console.log('[发送后台消息]: 无消息/No message')
          }
          return
        }
      }
    }
  }
  /**
   * 消息处理器
   */
  const messageHandler: DanmakuMessageHandler = {
    onDebugMsg: (msg: string) => {
      console.log('[弹幕客户端]', msg)
      setConnectionStatus(msg)
    },
    onHeartBeat: (lastTextMessageTime: number | null) => {
      sendUserTextMessage(lastTextMessageTime)
    },
    onAddText: (message: TextMessage) => {
      console.log('[弹幕]', message.authorName, ':', message.content)
      if (clientRef.current) {
        clientRef.current.messageQueue.enqueue(message)
        sendUserTextMessage(Date.now())
      }
    },
    onAddGift: (message: GiftMessage) => {
      console.log('[礼物]', message.authorName, ':', message.giftName, 'x', message.num)
      if (clientRef.current) {
        clientRef.current.giftQueue.enqueue(message)
        sendUserTextMessage(Date.now())
      }
    },
    onAddMember: (message: MemberMessage) => {
      console.log('[成员]', message.authorName, '加入了直播间')
      // 这里可以添加处理成员消息的逻辑
    },
    onAddSuperChat: (message: SuperChatMessage) => {
      console.log('[超级聊天]', message.authorName, ':', message.content, '¥', message.price)
      if (clientRef.current) {
        clientRef.current.superChatQueue.enqueue(message)
        sendUserTextMessage(Date.now())
      }
    },
    onFatalError: (error: string) => {
      console.error('[致命错误]', error)
      setConnectionStatus(`连接失败: ${error}`)
      setIsConnected(false)
    },
  }

  /**
   * Handle live stream URL confirmation.
   */
  const handleConfirm = () => {
    if (!liveStreamUrl.trim()) {
      return
    }

    // 如果已经连接，先断开旧连接
    if (clientRef.current) {
      clientRef.current.stop()
      clientRef.current = null
    }

    // 解析 URL
    // URL 格式示例: 
    // - file:///path/loader.html?url=http%3A%2F%2Flocalhost%3A12450%2Froom%2FKEY%3FroomKeyType%3D2
    // - http://localhost:12450/room/KEY?roomKeyType=2
    const parsed = parseLiveStreamUrl(liveStreamUrl.trim())
    if (!parsed) {
      alert('无效的直播流 URL，请检查格式\n支持格式:\n1. file:// URL (带 url 参数)\n2. http://server:port/room/KEY?roomKeyType=2')
      return
    }

    // 创建 WebSocket 客户端
    const client = new DanmakuWebSocketClient(parsed.serverUrl, parsed.roomKey, false)
    client.setMsgHandler(messageHandler)
    client.start()

    clientRef.current = client
    setIsConnected(true)
    setConnectionStatus('连接中...')
  }

  /**
   * 断开连接
   */
  const handleDisconnect = () => {
    if (clientRef.current) {
      clientRef.current.stop()
      clientRef.current = null
      setIsConnected(false)
      setConnectionStatus('已断开')
    }
  }

  /**
   * 组件卸载时清理连接
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

