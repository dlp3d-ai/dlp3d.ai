/**
 * 弹幕 WebSocket 客户端
 * 
 * 用于连接弹幕服务器，接收和处理弹幕、礼物、成员、超级聊天等消息
 */

import Queue from 'yocto-queue'
import i18n from '@/i18n/config'

// 命令类型枚举
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

// 房间标识类型
export interface RoomKey {
  type: 1 | 2 // 1: 房间ID, 2: 身份码
  value: number | string
}

// 消息类型定义
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

export interface MemberMessage {
  type: 'member'
  id: number
  avatarUrl: string
  timestamp: number
  authorName: string
  privilegeType: number
}

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

// 消息处理器接口
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
 * 弹幕 WebSocket 客户端类
 */
export class DanmakuWebSocketClient {
  private serverUrl: string
  private roomKey: RoomKey
  private autoTranslate: boolean
  private websocket: WebSocket | null = null
  private retryCount: number = 0
  private totalRetryCount: number = 0
  private isDestroying: boolean = false
  private receiveTimeoutTimerId: NodeJS.Timeout | null = null
  private msgHandler: DanmakuMessageHandler | null = null
  public lastTextMessageTime: number | null = null
  public readonly messageQueue: Queue<TextMessage> = new Queue()
  public readonly giftQueue: Queue<GiftMessage> = new Queue()
  public readonly superChatQueue: Queue<SuperChatMessage> = new Queue()

  constructor(serverUrl: string, roomKey: RoomKey, autoTranslate: boolean = false) {
    this.serverUrl = serverUrl
    this.roomKey = roomKey
    this.autoTranslate = autoTranslate
  }

  /**
   * 设置消息处理器
   */
  setMsgHandler(handler: DanmakuMessageHandler) {
    this.msgHandler = handler
  }

  /**
   * 启动连接
   */
  start() {
    this.wsConnect()
  }

  /**
   * 停止连接
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
   * 连接 WebSocket
   */
  private wsConnect() {
    if (this.isDestroying) {
      return
    }

    if (this.msgHandler?.onDebugMsg) {
      this.msgHandler.onDebugMsg('正在连接...')
    }

    const url = this.serverUrl.replace(/^http(s?):/, 'ws$1:') + '/api/chat'
    console.log('[连接websocket]: ', url)
    this.lastTextMessageTime = Date.now()
    this.websocket = new WebSocket(url)

    this.websocket.onopen = () => this.onWsOpen()
    this.websocket.onclose = () => this.onWsClose()
    this.websocket.onmessage = (event) => this.onWsMessage(event)
    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
      if (this.msgHandler?.onDebugMsg) {
        this.msgHandler.onDebugMsg('连接错误')
      }
    }
  }

  /**
   * WebSocket 打开事件处理
   */
  private onWsOpen() {
    if (this.msgHandler?.onDebugMsg) {
      this.msgHandler.onDebugMsg(i18n.t('chat.connected', { ns: 'fronted' }))
    }

    // 发送加入房间请求
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
   * 刷新接收超时定时器
   */
  private refreshReceiveTimeoutTimer() {
    if (this.receiveTimeoutTimerId) {
      clearTimeout(this.receiveTimeoutTimerId)
    }

    this.receiveTimeoutTimerId = setTimeout(() => this.onReceiveTimeout(), 15000)
  }

  /**
   * 接收消息超时处理
   */
  private onReceiveTimeout() {
    this.receiveTimeoutTimerId = null
    console.warn('接收消息超时')

    if (this.msgHandler?.onDebugMsg) {
      this.msgHandler.onDebugMsg('接收消息超时')
    }

    if (this.websocket) {
      this.websocket.close()
    }
  }

  /**
   * WebSocket 关闭事件处理
   */
  private onWsClose() {
    if (this.msgHandler?.onDebugMsg) {
      this.msgHandler.onDebugMsg('已断开连接')
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

    // 防止无限重连
    if (this.totalRetryCount > 30) {
      this.stop()
      if (this.msgHandler?.onFatalError) {
        this.msgHandler.onFatalError('连接失败次数过多')
      }
      return
    }

    if (this.msgHandler?.onDebugMsg) {
      this.msgHandler.onDebugMsg(`正在重连 (${this.totalRetryCount}/30)...`)
    }

    const interval = Math.min(1000 + (this.totalRetryCount - 1) * 2000, 20000)
    const randomDelay = Math.random() * 3000

    setTimeout(() => this.wsConnect(), interval + randomDelay)
  }

  /**
   * WebSocket 消息事件处理
   */
  private onWsMessage(event: MessageEvent) {
    try {
      const { cmd, data } = JSON.parse(event.data)
      console.log('[收到websocket消息]: ', cmd, data)
      switch (cmd) {
        case DanmakuCommand.HEARTBEAT:
          this.refreshReceiveTimeoutTimer()
          // 回复心跳
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
            this.msgHandler.onFatalError(data.msg || '发生致命错误')
          }
          break
      }

      // 至少成功处理1条消息
      if (cmd !== DanmakuCommand.FATAL_ERROR) {
        this.retryCount = 0
      }
    } catch (error) {
      console.error('解析消息错误:', error)
    }
  }

  /**
   * 处理文本消息
   */
  private handleAddText(data: any[]) {
    // data 是数组格式: [avatarUrl, timestamp, authorName, authorType, content, ...]
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
   * 处理礼物消息
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
   * 处理成员消息
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

  private handleHeartBeat(){
    if (this.msgHandler?.onHeartBeat) {
        this.msgHandler.onHeartBeat(this.lastTextMessageTime)
    }
  }

  /**
   * 处理超级聊天消息
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
   * 处理删除超级聊天消息
   */
  private handleDelSuperChat(data: any) {
    if (this.msgHandler?.onDelSuperChat) {
      this.msgHandler.onDelSuperChat(data.ids)
    }
  }

  /**
   * 处理翻译更新
   */
  private handleUpdateTranslation(data: any[]) {
    if (this.msgHandler?.onUpdateTranslation) {
      this.msgHandler.onUpdateTranslation(data[0], data[1])
    }
  }
}

