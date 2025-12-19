/**
 * Danmaku WebSocket Client
 * 
 * Used to connect to danmaku server, receive and process messages such as danmaku, gifts, members, super chat, etc.
 */

import Queue from 'yocto-queue'
import i18n from '@/i18n/config'

/**
 * Command type enumeration for danmaku WebSocket protocol.
 */
export enum DanmakuCommand {
  HEARTBEAT = 0,
  JOIN_ROOM = 1,
  ADD_TEXT = 2,
  ADD_GIFT = 3,
  ADD_MEMBER = 4,
  ADD_SUPER_CHAT = 5,
  DEL_SUPER_CHAT = 6,
  UPDATE_TRANSLATION = 7,
  FATAL_ERROR = 8,
}

/**
 * Room identifier type.
 */
export interface RoomKey {
  /**
   * Room key type: 1 for room ID, 2 for identity code.
   */
  type: 1 | 2
  /**
   * Room key value: number for room ID, string for identity code.
   */
  value: number | string
}

/**
 * Text message type definition.
 */
export interface TextMessage {
  type: 'text'
  avatarUrl: string
  timestamp: number
  authorName: string
  authorType: number
  content: string
  privilegeType: number
  isGiftDanmaku: boolean
  authorLevel: number
  isNewbie: boolean
  isMobileVerified: boolean
  medalLevel: number
  id: number
  translation?: string
  emoticon?: string
  uid: number
  medalName?: string
}

/**
 * Gift message type definition.
 */
export interface GiftMessage {
  type: 'gift'
  id: number
  avatarUrl: string
  timestamp: number
  authorName: string
  totalCoin: number
  giftName: string
  num: number
}

/**
 * Member message type definition.
 */
export interface MemberMessage {
  type: 'member'
  id: number
  avatarUrl: string
  timestamp: number
  authorName: string
  privilegeType: number
}

/**
 * Super chat message type definition.
 */
export interface SuperChatMessage {
  type: 'superChat'
  id: number
  avatarUrl: string
  timestamp: number
  authorName: string
  price: number
  content: string
  translation?: string
}

/**
 * Message handler interface for danmaku WebSocket client.
 */
export interface DanmakuMessageHandler {
  onDebugMsg?: (msg: string) => void
  onAddText?: (message: TextMessage) => void
  onAddGift?: (message: GiftMessage) => void
  onAddMember?: (message: MemberMessage) => void
  onAddSuperChat?: (message: SuperChatMessage) => void
  onDelSuperChat?: (ids: number[]) => void
  onUpdateTranslation?: (msgId: number, translation: string) => void
  onFatalError?: (error: string) => void
  onHeartBeat?: (lastTextMessageTime: number | null) => void
}

/**
 * DanmakuWebSocketClient
 * 
 * A WebSocket client for connecting to danmaku server and handling various message types.
 */
export class DanmakuWebSocketClient {
  /**
   * Server URL for WebSocket connection.
   */
  private serverUrl: string
  /**
   * Room key for identifying the target room.
   */
  private roomKey: RoomKey
  /**
   * Whether to enable auto translation.
   */
  private autoTranslate: boolean
  /**
   * WebSocket connection instance.
   */
  private websocket: WebSocket | null = null
  /**
   * Current retry count for reconnection.
   */
  private retryCount: number = 0
  /**
   * Total retry count since connection start.
   */
  private totalRetryCount: number = 0
  /**
   * Whether the client is being destroyed.
   */
  private isDestroying: boolean = false
  /**
   * Timer ID for receive timeout.
   */
  private receiveTimeoutTimerId: NodeJS.Timeout | null = null
  /**
   * Message handler for processing received messages.
   */
  private msgHandler: DanmakuMessageHandler | null = null
  /**
   * Timestamp of the last text message received.
   */
  public lastTextMessageTime: number | null = null
  /**
   * Queue for storing text messages.
   */
  public readonly messageQueue: Queue<TextMessage> = new Queue()
  /**
   * Queue for storing gift messages.
   */
  public readonly giftQueue: Queue<GiftMessage> = new Queue()
  /**
   * Queue for storing super chat messages.
   */
  public readonly superChatQueue: Queue<SuperChatMessage> = new Queue()

  /**
   * Create a new DanmakuWebSocketClient instance.
   * 
   * @param serverUrl The server URL for WebSocket connection.
   * @param roomKey The room key for identifying the target room.
   * @param autoTranslate Whether to enable auto translation. Defaults to false.
   */
  constructor(serverUrl: string, roomKey: RoomKey, autoTranslate: boolean = false) {
    this.serverUrl = serverUrl
    this.roomKey = roomKey
    this.autoTranslate = autoTranslate
  }

  /**
   * Set the message handler.
   * 
   * @param handler The message handler to process received messages.
   * @returns void
   */
  setMsgHandler(handler: DanmakuMessageHandler) {
    this.msgHandler = handler
  }

  /**
   * Start the WebSocket connection.
   * 
   * @returns void
   */
  start() {
    this.wsConnect()
  }

  /**
   * Stop the WebSocket connection.
   * 
   * @returns void
   */
  stop() {
    this.isDestroying = true
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }
    if (this.receiveTimeoutTimerId) {
      clearTimeout(this.receiveTimeoutTimerId)
      this.receiveTimeoutTimerId = null
    }
  }

  /**
   * Connect to WebSocket server.
   * 
   * @returns void
   */
  private wsConnect() {
    if (this.isDestroying) {
      return
    }

    if (this.msgHandler?.onDebugMsg) {
      this.msgHandler.onDebugMsg('Connecting...')
    }

    const url = this.serverUrl.replace(/^http(s?):/, 'ws$1:') + '/api/chat'
    console.log('[Connect websocket]: ', url)
    this.lastTextMessageTime = Date.now()
    this.websocket = new WebSocket(url)

    this.websocket.onopen = () => this.onWsOpen()
    this.websocket.onclose = () => this.onWsClose()
    this.websocket.onmessage = (event) => this.onWsMessage(event)
    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
      if (this.msgHandler?.onDebugMsg) {
        this.msgHandler.onDebugMsg('Connection error')
      }
    }
  }

  /**
   * Handle WebSocket open event.
   * 
   * Sends join room request and refreshes the receive timeout timer.
   * 
   * @returns void
   */
  private onWsOpen() {
    if (this.msgHandler?.onDebugMsg) {
      this.msgHandler.onDebugMsg(i18n.t('chat.connected', { ns: 'fronted' }))
    }

    // Send join room request
    if (this.websocket) {
      this.websocket.send(
        JSON.stringify({
          cmd: DanmakuCommand.JOIN_ROOM,
          data: {
            roomKey: this.roomKey,
            config: {
              autoTranslate: this.autoTranslate,
            },
          },
        }),
      )
    }

    this.refreshReceiveTimeoutTimer()
  }

  /**
   * Refresh the receive timeout timer.
   * 
   * Resets the timer that monitors if messages are received within the timeout period.
   * 
   * @returns void
   */
  private refreshReceiveTimeoutTimer() {
    if (this.receiveTimeoutTimerId) {
      clearTimeout(this.receiveTimeoutTimerId)
    }

    this.receiveTimeoutTimerId = setTimeout(() => this.onReceiveTimeout(), 15000)
  }

  /**
   * Handle receive message timeout.
   * 
   * Closes the WebSocket connection when no messages are received within the timeout period.
   * 
   * @returns void
   */
  private onReceiveTimeout() {
    this.receiveTimeoutTimerId = null
    console.warn('Receive message timeout')

    if (this.msgHandler?.onDebugMsg) {
      this.msgHandler.onDebugMsg('Receive message timeout')
    }

    if (this.websocket) {
      this.websocket.close()
    }
  }

  /**
   * Handle WebSocket close event.
   * 
   * Attempts to reconnect if not being destroyed. Stops reconnection attempts after 30 retries.
   * 
   * @returns void
   */
  private onWsClose() {
    if (this.msgHandler?.onDebugMsg) {
      this.msgHandler.onDebugMsg('Disconnected')
    }

    this.websocket = null

    if (this.receiveTimeoutTimerId) {
      clearTimeout(this.receiveTimeoutTimerId)
      this.receiveTimeoutTimerId = null
    }

    if (this.isDestroying) {
      return
    }

    this.retryCount++
    this.totalRetryCount++

    // Prevent infinite reconnection
    if (this.totalRetryCount > 30) {
      this.stop()
      if (this.msgHandler?.onFatalError) {
        this.msgHandler.onFatalError('Too many connection failures')
      }
      return
    }

    if (this.msgHandler?.onDebugMsg) {
      this.msgHandler.onDebugMsg(`Reconnecting (${this.totalRetryCount}/30)...`)
    }

    const interval = Math.min(1000 + (this.totalRetryCount - 1) * 2000, 20000)
    const randomDelay = Math.random() * 3000

    setTimeout(() => this.wsConnect(), interval + randomDelay)
  }

  /**
   * Handle WebSocket message event.
   * 
   * Parses and processes incoming messages based on command type.
   * 
   * @param event The WebSocket message event.
   * @returns void
   */
  private onWsMessage(event: MessageEvent) {
    try {
      const { cmd, data } = JSON.parse(event.data)
      console.log('[Receive websocket message]: ', cmd, data)
      switch (cmd) {
        case DanmakuCommand.HEARTBEAT:
          this.refreshReceiveTimeoutTimer()
          // Reply to heartbeat
          if (this.websocket) {
            this.websocket.send(JSON.stringify({ cmd: DanmakuCommand.HEARTBEAT }))
          }
          this.handleHeartBeat()
          break

        case DanmakuCommand.ADD_TEXT:
          this.handleAddText(data)
          break

        case DanmakuCommand.ADD_GIFT:
          this.handleAddGift(data)
          break

        case DanmakuCommand.ADD_MEMBER:
          this.handleAddMember(data)
          break

        case DanmakuCommand.ADD_SUPER_CHAT:
          this.handleAddSuperChat(data)
          break

        case DanmakuCommand.DEL_SUPER_CHAT:
          this.handleDelSuperChat(data)
          break

        case DanmakuCommand.UPDATE_TRANSLATION:
          this.handleUpdateTranslation(data)
          break

        case DanmakuCommand.FATAL_ERROR:
          this.stop()
          if (this.msgHandler?.onFatalError) {
            this.msgHandler.onFatalError(data.msg || 'Fatal error occurred')
          }
          break
      }

      // At least one message processed successfully
      if (cmd !== DanmakuCommand.FATAL_ERROR) {
        this.retryCount = 0
      }
    } catch (error) {
      console.error('Parse message error:', error)
    }
  }

  /**
   * Handle text message.
   * 
   * @param data Message data in array format: [avatarUrl, timestamp, authorName, authorType, content, ...]
   * @returns void
   */
  private handleAddText(data: any[]) {
    // data is in array format: [avatarUrl, timestamp, authorName, authorType, content, ...]
    const emoticon = data[13] === 1 ? data[14][0] : null
    const message: TextMessage = {
      type: 'text',
      avatarUrl: data[0],
      timestamp: data[1],
      authorName: data[2],
      authorType: data[3],
      content: data[4],
      privilegeType: data[5],
      isGiftDanmaku: Boolean(data[6]),
      authorLevel: data[7],
      isNewbie: Boolean(data[8]),
      isMobileVerified: Boolean(data[9]),
      medalLevel: data[10],
      id: data[11],
      translation: data[12],
      emoticon: emoticon,
      uid: data[16],
      medalName: data[17],
    }
    this.lastTextMessageTime = Date.now()
    if (this.msgHandler?.onAddText) {
      this.msgHandler.onAddText(message)
    }
  }

  /**
   * Handle gift message.
   * 
   * @param data Gift message data.
   * @returns void
   */
  private handleAddGift(data: any) {
    const message: GiftMessage = {
      type: 'gift',
      id: data.id,
      avatarUrl: data.avatarUrl,
      timestamp: data.timestamp,
      authorName: data.authorName,
      totalCoin: data.totalCoin,
      giftName: data.giftName,
      num: data.num,
    }

    if (this.msgHandler?.onAddGift) {
      this.msgHandler.onAddGift(message)
    }
  }

  /**
   * Handle member message.
   * 
   * @param data Member message data.
   * @returns void
   */
  private handleAddMember(data: any) {
    const message: MemberMessage = {
      type: 'member',
      id: data.id,
      avatarUrl: data.avatarUrl,
      timestamp: data.timestamp,
      authorName: data.authorName,
      privilegeType: data.privilegeType,
    }

    if (this.msgHandler?.onAddMember) {
      this.msgHandler.onAddMember(message)
    }
  }

  /**
   * Handle heartbeat message.
   * 
   * Notifies the message handler about the heartbeat event.
   * 
   * @returns void
   */
  private handleHeartBeat(){
    if (this.msgHandler?.onHeartBeat) {
        this.msgHandler.onHeartBeat(this.lastTextMessageTime)
    }
  }

  /**
   * Handle super chat message.
   * 
   * @param data Super chat message data.
   * @returns void
   */
  private handleAddSuperChat(data: any) {
    const message: SuperChatMessage = {
      type: 'superChat',
      id: data.id,
      avatarUrl: data.avatarUrl,
      timestamp: data.timestamp,
      authorName: data.authorName,
      price: data.price,
      content: data.content,
      translation: data.translation,
    }

    if (this.msgHandler?.onAddSuperChat) {
      this.msgHandler.onAddSuperChat(message)
    }
  }

  /**
   * Handle delete super chat message.
   * 
   * @param data Delete super chat message data containing IDs to delete.
   * @returns void
   */
  private handleDelSuperChat(data: any) {
    if (this.msgHandler?.onDelSuperChat) {
      this.msgHandler.onDelSuperChat(data.ids)
    }
  }

  /**
   * Handle translation update.
   * 
   * @param data Translation update data in array format: [msgId, translation]
   * @returns void
   */
  private handleUpdateTranslation(data: any[]) {
    if (this.msgHandler?.onUpdateTranslation) {
      this.msgHandler.onUpdateTranslation(data[0], data[1])
    }
  }
}

