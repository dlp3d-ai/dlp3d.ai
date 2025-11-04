'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  WebSocketState,
  WebSocketConnectionState,
  WebSocketEventPayloads,
  WebSocketEvents,
} from '@/data_structures/webSocketState'
import { EventEmitter } from '@/hooks/eventEmitter'
import { errorBus } from '@/utils/errorBus'
import i18n from '@/i18n/config'

/**
 * Custom hook for managing WebSocket connections with message queuing and event handling.
 *
 * Provides a comprehensive WebSocket interface with features including:
 * - Connection state management
 * - Message queuing with confirmation
 * - Event-based communication
 * - Binary data handling
 * - Automatic cleanup
 *
 * @param initialUrl Optional initial WebSocket URL to connect to.
 * @returns WebSocketState object containing connection state and methods for WebSocket operations.
 */
const useWebSocket = (initialUrl?: string): WebSocketState => {
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>(
    WebSocketConnectionState.DISCONNECTED,
  )
  const wsRef = useRef<WebSocket | null>(null)
  const urlRef = useRef<string | undefined>(initialUrl)
  const messageHandlerRef = useRef<(e: MessageEvent) => void>()
  const eventEmitter = useRef(
    new EventEmitter<WebSocketEvents, WebSocketEventPayloads>(),
  ).current

  // Message queue for tracking individual messages
  const messageQueueRef = useRef<
    {
      id: string
      message: string | ArrayBuffer
      resolve: () => void
      reject: (error: Error) => void
      timestamp: number
    }[]
  >([])

  const isProcessingQueueRef = useRef(false)

  /**
   * Process the message queue sequentially.
   *
   * Ensures messages are sent one at a time and waits for confirmation
   * before sending the next message. Uses bufferedAmount to determine
   * when a message has been successfully sent.
   */
  const processMessageQueue = useCallback(async () => {
    if (
      isProcessingQueueRef.current ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN
    ) {
      return
    }

    isProcessingQueueRef.current = true

    while (
      messageQueueRef.current.length > 0 &&
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN
    ) {
      const queueItem = messageQueueRef.current[0]

      try {
        // Get the buffered amount before sending
        const bufferedBefore = wsRef.current.bufferedAmount
        // Send the message
        wsRef.current.send(queueItem.message)

        // Wait for this specific message to be sent
        await new Promise<void>((resolve, reject) => {
          const checkBufferedAmount = () => {
            if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
              reject(new Error(i18n.t('websocket.connectionLost', { ns: 'client' })))
              return
            }

            const currentBuffered = wsRef.current.bufferedAmount

            // Wait until bufferedAmount is less than or equal to what it was before we sent this message
            // This ensures we wait for our specific message to be sent
            if (currentBuffered <= bufferedBefore) {
              resolve()
            } else {
              setTimeout(checkBufferedAmount, 10)
            }
          }

          // Start checking after a small delay to allow the message to be queued
          setTimeout(checkBufferedAmount, 10)

          // Timeout for individual message
          setTimeout(() => {
            reject(
              new Error(
                i18n.t('websocket.individualMessageSendingTimeout', {
                  ns: 'client',
                }),
              ),
            )
          }, 5000)
        })

        // Message sent successfully, resolve and remove from queue
        queueItem.resolve()
        messageQueueRef.current.shift()
      } catch (error) {
        // Message failed, reject and remove from queue
        queueItem.reject(error as Error)
        messageQueueRef.current.shift()
      }
    }

    isProcessingQueueRef.current = false
  }, [])

  /**
   * Update the URL reference when the initial URL changes.
   */
  useEffect(() => {
    urlRef.current = initialUrl
  }, [initialUrl])

  /**
   * Set the message handler for WebSocket messages.
   *
   * @param handler The message event handler function.
   */
  const setOnMessage = useCallback((handler: (e: MessageEvent) => void) => {
    messageHandlerRef.current = handler
    if (wsRef.current) {
      wsRef.current.onmessage = handler
    }
  }, [])

  /**
   * Set up the default message handler for incoming WebSocket messages.
   */
  useEffect(() => {
    setOnMessage(e => {
      if (typeof e.data === 'string') {
        const data = JSON.parse(e.data)
        console.log('📦 Received string message:', data)
      } else if (e.data instanceof ArrayBuffer) {
        eventEmitter.emit(WebSocketEvents.DATA_BLOCK, e.data)
      } else {
        console.warn('📦 Received unknown data type:', e.data)
      }
    })
  }, [setOnMessage])

  /**
   * Connect to WebSocket and wait for the connection to be established.
   *
   * @param url Optional WebSocket URL to connect to. If not provided, uses the stored URL.
   * @returns Promise that resolves when the connection is successfully established.
   * @throws {Error} If WebSocket URL is required but not provided.
   * @throws {Error} If WebSocket connection fails.
   */
  const connectWebSocketAndWait = (url?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      const connectionUrl = url || urlRef.current
      if (!connectionUrl) {
        console.error('❌ WebSocket URL is required')
        reject(new Error(i18n.t('websocket.urlRequired', { ns: 'client' })))
        return
      }

      urlRef.current = connectionUrl

      const ws = new WebSocket(connectionUrl)
      ws.binaryType = 'arraybuffer'

      ws.onopen = () => {
        // console.log(`✅ WebSocket connected: ${connectionUrl}`)
        wsRef.current = ws
        setConnectionState(WebSocketConnectionState.CONNECTED)
        eventEmitter.emit(
          WebSocketEvents.CONNECTION_STATE,
          WebSocketConnectionState.CONNECTED,
        )
        // Set message handler if it exists
        if (messageHandlerRef.current) {
          ws.onmessage = messageHandlerRef.current
        }

        resolve()
      }

      ws.onerror = err => {
        console.error('❌ WebSocket error:', err)
        console.error('WebSocket readyState:', ws.readyState)
        console.error('WebSocket url:', connectionUrl)
        errorBus.emit('error', {
          message:
            i18n.t('websocket.connectionFailed', { ns: 'client' }) +
            ': ' +
            connectionUrl,
          severity: 'error',
          durationMs: 6000,
        })
        reject(err)
      }

      ws.onclose = event => {
        setConnectionState(WebSocketConnectionState.DISCONNECTED)
        eventEmitter.emit(
          WebSocketEvents.CONNECTION_STATE,
          WebSocketConnectionState.DISCONNECTED,
        )
        // Store the current URL before nulling the WebSocket reference
        const currentUrl = urlRef.current
        wsRef.current = null
        // Ensure the URL reference is maintained
        urlRef.current = currentUrl
      }
    })
  }

  /**
   * Disconnect the WebSocket connection if it is currently open.
   */
  const disconnectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close()
    }
    // console.log(`Websocket connection to ${urlRef.current} closed`)
  }

  /**
   * Send a message immediately if the WebSocket is connected.
   *
   * @param message The message to send, either as a string or ArrayBuffer.
   * @returns True if the message was sent successfully, false otherwise.
   */
  const sendMessage = (message: string | ArrayBuffer): boolean => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(message)
        return true
      } catch (error) {
        console.error('❌ Failed to send message:', error)
        return false
      }
    } else {
      console.warn(i18n.t('websocket.notConnected', { ns: 'client' }))
      return false
    }
  }

  /**
   * Send a message and wait for confirmation that it has been sent.
   *
   * Adds the message to a queue and processes it sequentially to ensure
   * proper delivery confirmation using WebSocket bufferedAmount.
   *
   * @param message The message to send, either as a string or ArrayBuffer.
   * @returns Promise that resolves when the message has been successfully sent.
   * @throws {Error} If WebSocket is not connected.
   * @throws {Error} If individual message sending times out.
   * @throws {Error} If WebSocket connection is lost during sending.
   */
  const sendMessageAndWait = (message: string | ArrayBuffer): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        reject(new Error(i18n.t('websocket.notConnected', { ns: 'client' })))
        return
      }

      const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      messageQueueRef.current.push({
        id: messageId,
        message,
        resolve,
        reject,
        timestamp: Date.now(),
      })

      // Start processing queue if not already processing
      processMessageQueue()
    })
  }

  /**
   * Send a message and wait for a binary response.
   *
   * Sets up a temporary message handler to capture the next ArrayBuffer
   * response and automatically cleans up after receiving the response or timeout.
   *
   * @param message The message to send, either as a string or ArrayBuffer.
   * @returns Promise that resolves with the response ArrayBuffer, or null on timeout.
   * @throws {Error} If WebSocket is not connected.
   * @throws {Error} If response timeout occurs (60 seconds).
   */
  const sendMessageAndWaitResponse = (
    message: string | ArrayBuffer,
  ): Promise<ArrayBuffer | null> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        reject(new Error(i18n.t('websocket.notConnected', { ns: 'client' })))
        return
      }

      // Create a one-time message handler for the response
      const responseHandler = (e: MessageEvent) => {
        if (e.data instanceof ArrayBuffer) {
          wsRef.current?.removeEventListener('message', responseHandler)
          resolve(e.data)
        }
      }

      // Add the handler and send the message
      wsRef.current.addEventListener('message', responseHandler)
      wsRef.current.send(message)

      // Set a timeout to prevent hanging
      setTimeout(() => {
        wsRef.current?.removeEventListener('message', responseHandler)
        reject(new Error('Response timeout'))
      }, 60000) // 60 seconds timeout
    })
  }

  /**
   * Get the current status of the message queue.
   *
   * @returns Object containing queue length, processing status, and metadata for each queued item.
   */
  const getMessageQueueStatus = () => {
    return {
      queueLength: messageQueueRef.current.length,
      isProcessing: isProcessingQueueRef.current,
      queueItems: messageQueueRef.current.map(item => ({
        id: item.id,
        timestamp: item.timestamp,
        age: Date.now() - item.timestamp,
      })),
    }
  }

  /**
   * Clear all pending messages in the queue.
   *
   * Rejects all pending promises with an error and empties the queue.
   * Useful for cleanup operations.
   *
   * @returns Number of items that were removed from the queue.
   */
  const clearMessageQueue = () => {
    const remainingItems = messageQueueRef.current.length
    messageQueueRef.current.forEach(item => {
      item.reject(new Error('Message queue cleared'))
    })
    messageQueueRef.current = []
    return remainingItems
  }

  /**
   * Cleanup WebSocket connection when the component unmounts.
   */
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  return {
    connectionState: connectionState,
    streamDataBlock: null,
    wsRef: wsRef,
    urlRef: urlRef,
    connectWebSocketAndWait: connectWebSocketAndWait,
    disconnectWebSocket: disconnectWebSocket,
    sendMessage: sendMessage,
    sendMessageAndWait: sendMessageAndWait,
    sendMessageAndWaitResponse: sendMessageAndWaitResponse,
    getMessageQueueStatus: getMessageQueueStatus,
    clearMessageQueue: clearMessageQueue,
    onConnectionStateChanged: cb =>
      eventEmitter.on(WebSocketEvents.CONNECTION_STATE, cb),
    offConnectionStateChanged: cb =>
      eventEmitter.off(WebSocketEvents.CONNECTION_STATE, cb),
    onDataBlock: cb => eventEmitter.on(WebSocketEvents.DATA_BLOCK, cb),
    offDataBlock: cb => eventEmitter.off(WebSocketEvents.DATA_BLOCK, cb),
  }
}

export default useWebSocket
