import { GlobalState } from '@/library/babylonjs/core'
import { motion_file_v1 } from '@/library/babylonjs/runtime/io/motion_file_v1_pb'
import {
  uint8Array2ArrayBuffer,
  parseFloatingData,
  getArithmetic,
} from '@/library/babylonjs/utils'
import { MotionClip } from '@/library/babylonjs/runtime/animation'
import { Logger } from '@/library/babylonjs/utils'

/**
 * Character static asset request types.
 */
export enum CharacterStaticAssetRequest {
  MESH = 'MeshV1Request',
  JOINTS_META = 'JointsMetaV1Request',
  RIGIDS_META = 'RigidsMetaV1Request',
  MORPH_TARGETS_META = 'BlendshapesMetaV1Request',
}

/**
 * MotionFileClient
 *
 * A client for communicating with the MotionFile service to retrieve character assets and motion data.
 */
export class MotionFileClient {
  /**
   * Motion file service host address.
   */
  private _motionFileHost: string
  /**
   * Motion file service port number.
   */
  private _motionFilePort: number
  /**
   * Motion file server path prefix.
   */
  private _motionFilePathPrefix: string
  /**
   * Motion file service path.
   */
  private _motionFilePath: string
  /**
   * Request timeout duration in milliseconds.
   */
  private _timeout: number

  /**
   * Global state instance for WebSocket management.
   */
  private _globalState: GlobalState

  /**
   * Create a new MotionFileClient instance.
   *
   * @param globalState The global state instance for WebSocket management.
   * @param motionFileHost The host address of the motion file service.
   * @param motionFilePort The port number of the motion file service.
   * @param motionFilePathPrefix Motion file server path prefix.
   * @param motionFilePath The path of the motion file service.
   * @param timeout The timeout duration in milliseconds.
   */
  constructor(
    globalState: GlobalState,
    motionFileHost: string,
    motionFilePort: number,
    motionFilePathPrefix: string,
    motionFilePath: string,
    timeout: number,
  ) {
    this._globalState = globalState
    this._motionFileHost = motionFileHost
    this._motionFilePort = motionFilePort
    this._motionFilePathPrefix = motionFilePathPrefix
    this._motionFilePath = motionFilePath
    this._timeout = timeout
  }

  /**
   * Connect to the MotionFile service.
   *
   * @returns A promise that resolves when the connection is established.
   */
  async connect(): Promise<void> {
    Logger.log(`Motion file client starts running for ${this._motionFilePath}`)
    const url = `wss://${this._motionFileHost}:${this._motionFilePort}${this._motionFilePathPrefix}/${this._motionFilePath}`

    await this._globalState.webSocketState.connectWebSocketAndWait(url)
  }

  /**
   * Disconnect from the MotionFile service.
   *
   * @returns A promise that resolves when the disconnection is complete.
   */
  async disconnect(): Promise<void> {
    this._globalState.webSocketState?.disconnectWebSocket()
  }

  /**
   * Get the version of the MotionFile service.
   *
   * @returns A promise that resolves to the version string.
   * @throws {Error} if the version response is empty or invalid.
   */
  async getVersion(): Promise<string> {
    const pbRequest = new motion_file_v1.MotionFileV1Request()
    pbRequest.className = 'VersionV1Request'
    const pbBytes = motion_file_v1.MotionFileV1Request.encode(pbRequest).finish()
    const buffer = uint8Array2ArrayBuffer(pbBytes)

    const response =
      await this._globalState.webSocketState.sendMessageAndWaitResponse(buffer)
    if (!response) {
      throw new Error('Failed to get version response')
    }

    const pbResponse = motion_file_v1.MotionFileV1Response.decode(
      new Uint8Array(response),
    )

    return pbResponse.version
  }

  /**
   * Get character static assets from the MotionFile service.
   *
   * @param avatar The avatar identifier to request assets for.
   * @returns A promise that resolves to a record containing asset data by class name.
   * @throws {Error} if any asset request returns empty response.
   */
  async getCharacterStaticAssets(
    avatar: string,
  ): Promise<Record<string, Uint8Array>> {
    const assetsDict: Record<string, any> = {}

    for (const className of Object.values(CharacterStaticAssetRequest)) {
      const pbRequest = new motion_file_v1.MotionFileV1Request()
      pbRequest.className = className
      pbRequest.avatar = avatar
      const pbBytes = motion_file_v1.MotionFileV1Request.encode(pbRequest).finish()
      const buffer = uint8Array2ArrayBuffer(pbBytes)

      const responseBytes =
        await this._globalState.webSocketState.sendMessageAndWaitResponse(buffer)
      if (!responseBytes) {
        throw new Error(`Got empty ${className} file response`)
      }
      const pbResponse = motion_file_v1.MotionFileV1Response.decode(
        new Uint8Array(responseBytes),
      )

      assetsDict[className] = pbResponse.data
    }

    return assetsDict
  }

  /**
   * Get motion files for a specific avatar from the MotionFile service.
   *
   * @param avatar The avatar identifier to request motion files for.
   * @returns A promise that resolves to a record containing motion data by record ID.
   * @throws {Error} if the response times out while collecting motion files.
   */
  async getMotionFiles(avatar: string): Promise<Record<number, any>> {
    const pbRequest = new motion_file_v1.MotionFileV1Request()
    pbRequest.appName = 'babylon'
    pbRequest.className = 'MotionFileV1Request'
    pbRequest.avatar = avatar
    const pbBytes = motion_file_v1.MotionFileV1Request.encode(pbRequest).finish()
    const buffer = uint8Array2ArrayBuffer(pbBytes)

    this._globalState.webSocketState.sendMessage(buffer)

    // Create a promise that will resolve when we get all responses
    return new Promise((resolve, reject) => {
      const retDict: Record<number, any> = {}
      let isCollecting = true

      // Create a message handler for collecting responses
      const messageHandler = (e: MessageEvent) => {
        if (!isCollecting) return

        if (e.data instanceof ArrayBuffer) {
          const pbResponse = motion_file_v1.MotionFileV1Response.decode(
            new Uint8Array(e.data),
          )

          // Check if this is the end signal
          if (pbResponse.className === 'MotionFileEndV1Response') {
            isCollecting = false
            const ws = this._globalState.webSocketState?.wsRef.current
            if (ws) {
              ws.removeEventListener('message', messageHandler)
            }
            resolve(retDict)
            return
          }

          // Process the motion file response
          if (!pbResponse.jointRotmat || !pbResponse.rootWorldPosition) {
            Logger.warn('Received incomplete MotionFile data')
            return
          }

          const data = pbResponse.jointRotmat.data!
          const dtype = getArithmetic(pbResponse.jointRotmat.dtype!)
          const shape = pbResponse.jointRotmat.shape!
          const nFrames = shape[0]
          const jointRotmat = parseFloatingData(data, dtype, shape)

          const translData = pbResponse.rootWorldPosition.data!
          const translDType = getArithmetic(pbResponse.rootWorldPosition.dtype!)
          const translShape = pbResponse.rootWorldPosition.shape!
          const rootWorldPosition = parseFloatingData(
            translData,
            translDType,
            translShape,
          )

          const motionClip = new MotionClip(
            nFrames,
            pbResponse.jointNames!,
            jointRotmat as number[][][][],
            rootWorldPosition as number[][],
            0,
            pbResponse.restposeName,
            pbResponse.motionRecordId,
          )

          const isIdleLong = pbResponse.isIdleLong ? true : false
          const loopable = pbResponse.loopStartFrame > 0 ? true : false

          retDict[pbResponse.motionRecordId] = {
            isIdleLong: isIdleLong,
            states: pbResponse.states,
            loopable: loopable,
            loopStartFrame: pbResponse.loopStartFrame,
            loopEndFrame: pbResponse.loopEndFrame,
            motionClip: motionClip,
          }
        }
      }

      // Add the message handler
      const ws = this._globalState.webSocketState?.wsRef.current
      if (ws) {
        ws.addEventListener('message', messageHandler)
      }

      // Set a timeout to prevent hanging
      setTimeout(() => {
        if (isCollecting) {
          isCollecting = false
          const ws = this._globalState.webSocketState?.wsRef.current
          if (ws) {
            ws.removeEventListener('message', messageHandler)
          }
          reject(new Error('Response timeout while collecting motion files'))
        }
      }, 600000) // 600 seconds timeout for collecting all files
    })
  }
}
