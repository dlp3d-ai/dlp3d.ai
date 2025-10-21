import { RefObject } from 'react'

/**
 * WebSocketConnectionState
 *
 * Describes the high-level connection state of a WebSocket.
 */
export enum WebSocketConnectionState {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
}

/**
 * WebSocketEvents
 *
 * Enumerates logical event names emitted by the WebSocket layer.
 */
export enum WebSocketEvents {
  CONNECTION_STATE = 'connectionState',
  DATA_BLOCK = 'dataBlock',
}

/**
 * Payload types for each `WebSocketEvents` key.
 */
export interface WebSocketEventPayloads {
  /** The current connection state payload. */
  connectionState: WebSocketConnectionState
  /** A single binary data block received from the stream. */
  dataBlock: ArrayBuffer
}

/**
 * WebSocketState
 *
 * Shape of the WebSocket service state and public API exposed to consumers.
 * Includes connection status, latest stream block, and utility methods for
 * connecting, messaging, and subscribing to updates.
 */
export interface WebSocketState {
  /** Current WebSocket connection state. */
  connectionState: WebSocketConnectionState
  /** Most recently received binary data block from the stream, if any. */
  streamDataBlock: ArrayBuffer | null
  /** Ref to the underlying WebSocket instance. */
  wsRef: RefObject<WebSocket | null>
  /** Ref to the target WebSocket URL. */
  urlRef: RefObject<string | undefined>
  /**
   * Establish a WebSocket connection and wait until it is open.
   *
   * @param url Optional override of the WebSocket endpoint URL.
   * @returns Promise that resolves when the connection is open.
   */
  connectWebSocketAndWait: (url?: string) => Promise<void>
  /**
   * Close the WebSocket connection if currently open.
   */
  disconnectWebSocket: () => void
  /**
   * Send a message immediately if the socket is open.
   *
   * @param message Message payload to send. Accepts string or ArrayBuffer.
   * @returns True if the message was queued/sent, false otherwise.
   */
  sendMessage: (message: string | ArrayBuffer) => boolean
  /**
   * Send a message and wait for it to be flushed on the socket.
   *
   * @param message Message payload to send. Accepts string or ArrayBuffer.
   * @returns Promise that resolves when the message is flushed.
   */
  sendMessageAndWait: (message: string | ArrayBuffer) => Promise<void>
  /**
   * Send a message and wait for a corresponding binary response.
   *
   * @param message Message payload to send. Accepts string or ArrayBuffer.
   * @returns Promise that resolves with the response `ArrayBuffer`, or null on timeout/no response.
   */
  sendMessageAndWaitResponse: (
    message: string | ArrayBuffer,
  ) => Promise<ArrayBuffer | null>
  /**
   * Inspect the current internal outbound message queue.
   *
   * @returns Object describing queue length, processing status, and per-item metadata.
   */
  getMessageQueueStatus: () => {
    queueLength: number
    isProcessing: boolean
    queueItems: Array<{
      /** Unique identifier for the queued item. */
      id: string
      /** Enqueue timestamp in milliseconds. */
      timestamp: number
      /** Age of the queued item in milliseconds. */
      age: number
    }>
  }
  /**
   * Clear all pending items in the outbound message queue.
   *
   * @returns Number of items removed from the queue.
   */
  clearMessageQueue: () => number
  /**
   * Subscribe to connection state changes.
   *
   * @param cb Callback invoked with the latest `WebSocketConnectionState`.
   */
  onConnectionStateChanged: (cb: (state: WebSocketConnectionState) => void) => void
  /**
   * Unsubscribe from connection state changes.
   *
   * @param cb Previously registered callback to remove.
   */
  offConnectionStateChanged: (cb: (state: WebSocketConnectionState) => void) => void
  /**
   * Subscribe to incoming binary data blocks.
   *
   * @param cb Callback invoked with each received `ArrayBuffer`.
   */
  onDataBlock: (cb: (dataBlock: ArrayBuffer) => void) => void
  /**
   * Unsubscribe from incoming binary data blocks.
   *
   * @param cb Previously registered callback to remove.
   */
  offDataBlock: (cb: (dataBlock: ArrayBuffer) => void) => void
}
