/* eslint-disable no-case-declarations */
import * as orchestrator_v4 from '@/library/babylonjs/runtime/io/orchestrator_v4_pb'
import { GlobalState } from '@/library/babylonjs/core'
import Queue from 'yocto-queue'
import { FaceClip, MotionClip } from '@/library/babylonjs/runtime/animation'
import {
  StreamEndedError,
  StreamUnavailableError,
} from '@/library/babylonjs/runtime/stream'
import { Arithmetic } from '@/library/babylonjs/core/arithmetic'
import {
  getArithmetic,
  parseFloatingData,
  ArithmeticParseError,
} from '@/library/babylonjs/utils/arithmetic'
import {
  reshapeArray,
  sliceArray,
  uint8Array2ArrayBuffer,
} from '@/library/babylonjs/utils'
import { Nullable, Observable } from '@babylonjs/core'
import { RuntimeBufferType } from '../animation/runtimeAnimationGroup'
import {
  NetworkStream,
  NetworkStreamChunk,
} from '@/library/babylonjs/runtime/stream/networkStream'
import { INTRINSIC_FRAME_RATE } from '@/library/babylonjs/core/common'
import { Logger } from '@/library/babylonjs/utils'

/**
 * Orchestrator client.
 *
 * Client for WebSocket communication with Orchestrator service, supporting audio, face,
 * and motion data streaming. Provides complete streaming media processing functionality,
 * including data upload, reception, buffering, and state management.
 */
export class OrchestratorClient {
  /**
   * Orchestrator host address.
   */
  private _orchestratorHost: string

  /**
   * Orchestrator port.
   */
  private _orchestratorPort: number

  /**
   * Orchestrator server path prefix.
   */
  private _orchestratorPathPrefix: string

  /**
   * Orchestrator path.
   */
  private _orchestratorPath: string

  /**
   * JSON string describing the request.
   */
  private _requestDict: Record<string, any>

  /**
   * Request timeout time.
   */
  private _timeout: number | null = null

  /**
   * Minimum time required to determine audio stream readiness.
   */
  private _audioReadySeconds: number

  /**
   * Minimum number of frames required to determine face stream readiness.
   */
  private _faceReadyNFrames: number

  /**
   * Minimum number of frames required to determine motion stream readiness.
   */
  private _motionReadyNFrames: number

  /**
   * Client global state.
   */
  private _globalState: GlobalState

  /**
   * Error occurred during loop execution.
   */
  private _runningLoopFailed: boolean = false

  /**
   * Response type.
   */
  private _responseType: 'leave' | 'failed' | 'normal' | null = 'normal'

  /**
   * Stream data processing failure.
   */
  private _failureOnStreaming: boolean = false

  /**
   * Last reception time.
   */
  private _lastRecvTime: number | null = null

  /**
   * WAV audio queue.
   */
  private _audioQueue: Queue<Uint8Array> = new Queue()

  /**
   * Face animation queue.
   */
  private _faceQueue: Queue<FaceClip> = new Queue()

  /**
   * Motion queue.
   */
  private _motionQueue: Queue<MotionClip> = new Queue()

  /**
   * Audio duration.
   */
  private _audioDuration: number = 0

  /**
   * Face animation duration.
   */
  private _faceNFrames: number = 0

  /**
   * Motion duration.
   */
  private _motionNFrames: number = 0

  /**
   * Number of audio channels.
   */
  private _audioNChannels: number | null = null

  /**
   * Audio sample width.
   */
  private _audioSampleWidth: number | null = null

  /**
   * Audio frame rate.
   */
  private _audioFrameRate: number | null = null

  /**
   * Audio stream.
   */
  private _audioStream: NetworkStream | null = null

  /**
   * Face animation name list.
   */
  private _faceBlendshapeNames: string[] | null = null

  /**
   * Number of face animations.
   */
  private _faceNBlendshapes: number | null = null

  /**
   * Face animation data type.
   */
  private _faceDtype: Arithmetic | null = null

  /**
   * Face animation stream.
   */
  private _faceStream: NetworkStream | null = null

  /**
   * Motion joint name list.
   */
  private _motionJointNames: string[] | null = null

  /**
   * Number of motion joints.
   */
  private _motionNJoints: number | null = null

  /**
   * Motion data type.
   */
  private _motionDtype: Arithmetic | null = null

  /**
   * Motion rest pose name.
   */
  private _motionRestposeName: string | null = null

  /**
   * Motion timeline start index.
   */
  private _motionTimelineStartIdx: number | null = null

  /**
   * Face animation timeline start index.
   */
  private _faceTimelineStartIdx: number | null = null

  /**
   * Motion stream.
   */
  private _motionStream: NetworkStream | null = null

  /**
   * Number of motion chunk bodies received.
   */
  private _motionChunkBodyCount: number = 0
  /**
   * Number of face chunk bodies received.
   */
  private _faceChunkBodyCount: number = 0
  /**
   * Number of audio chunk bodies received.
   */
  private _audioChunkBodyCount: number = 0

  /**
   * Whether the audio readiness log has been emitted.
   */
  private _audioReadyLogged: boolean = false
  /**
   * Whether the face readiness log has been emitted.
   */
  private _faceReadyLogged: boolean = false
  /**
   * Whether the motion readiness log has been emitted.
   */
  private _motionReadyLogged: boolean = false

  /**
   * Request ID.
   */
  private _requestId: string | null = null

  /**
   * Timestamp (ms) when the stop-audio message was sent.
   */
  private _stopRecordingTime: number | null = null

  /**
   * Observable for request-id changes.
   */
  public readonly onRequestIDChangedObservable = new Observable<string | null>()

  /**
   * Callback invoked when a new WebSocket data block arrives.
   */
  private _streamDataCallback: Nullable<(data: ArrayBuffer) => void> = null
  /**
   * Callback invoked before each render for animation updates.
   */
  private _animationCallback: Nullable<() => void> = null
  /**
   * Callback invoked when the request-id is received or changed.
   */
  private _requestIdCallback: Nullable<(requestId: string | null) => void> = null

  /**
   * Construct an OrchestratorClient.
   *
   * Initializes client state, target endpoint, request payload and readiness
   * thresholds for audio, face and motion streams.
   *
   * @param globalState Global application state and WebSocket manager.
   * @param orchestratorHost Hostname of the Orchestrator service.
   * @param orchestratorPort Port of the Orchestrator service.
   * @param orchestratorPathPrefix Orchestrator server path prefix.
   * @param orchestratorPath URL path indicating the service endpoint.
   * @param requestDict Initial request dictionary to be encoded and sent.
   * @param timeout Maximum wait time in milliseconds before considering the response failed.
   * @param audioReadySeconds Minimum seconds of buffered audio to consider ready.
   * @param faceReadyFrames Minimum number of face frames to consider ready.
   * @param motionReadyFrames Minimum number of motion frames to consider ready.
   */
  constructor(
    globalState: GlobalState,
    orchestratorHost: string,
    orchestratorPort: number,
    orchestratorPathPrefix: string,
    orchestratorPath: string,
    requestDict: Record<string, any>,
    timeout: number | null = null,
    audioReadySeconds: number = 2.0,
    faceReadyFrames: number = 60,
    motionReadyFrames: number = 60,
  ) {
    this._globalState = globalState
    this._orchestratorHost = orchestratorHost
    this._orchestratorPort = orchestratorPort
    this._orchestratorPathPrefix = orchestratorPathPrefix
    this._orchestratorPath = orchestratorPath
    this._requestDict = requestDict
    this._timeout = timeout
    this._audioReadySeconds = audioReadySeconds
    this._faceReadyNFrames = faceReadyFrames
    this._motionReadyNFrames = motionReadyFrames
  }

  /**
   * Check connectivity to the Orchestrator service.
   *
   * Establishes a short-lived WebSocket connection to verify that the given
   * host, port and path are reachable, then immediately disconnects.
   *
   * @returns Promise that resolves when the connectivity check completes.
   */
  public async checkConnection(): Promise<void> {
    const protocol = 'wss'
    const url = `${protocol}://${this._orchestratorHost}:${this._orchestratorPort}${this._orchestratorPathPrefix}/${this._orchestratorPath}`
    await this._globalState.webSocketState?.connectWebSocketAndWait(url)
    this._globalState.webSocketState.disconnectWebSocket()
  }

  /**
   * Run the client.
   *
   * Establishes WebSocket connection, sends initial request and receives responses.
   * Supports automatic identification of multiple service paths and corresponding protocol handling.
   *
   * @returns Promise that resolves when the client is set up and listeners are attached.
   */
  public async run(): Promise<void> {
    const protocol = 'wss'
    const url = `${protocol}://${this._orchestratorHost}:${this._orchestratorPort}${this._orchestratorPathPrefix}/${this._orchestratorPath}`

    const messages = [
      `Client accessing ${url} starts running.`,
      `Request dictionary: ${JSON.stringify(this._requestDict)}`,
    ]
    Logger.debug(messages.join('\n'))

    await this._globalState.webSocketState?.connectWebSocketAndWait(url)

    const pbRequest = new orchestrator_v4.orchestrator_v4.OrchestratorV4Request()
    if (this._orchestratorPath.includes('audio_chat_with_text_llm')) {
      pbRequest.className = 'AudioChatCompleteStartRequestV4'
    } else if (this._orchestratorPath.includes('audio_chat_with_audio_llm')) {
      pbRequest.className = 'AudioChatExpressStartRequestV4'
    } else if (this._orchestratorPath.includes('text_generate')) {
      pbRequest.className = 'DirectGenerationRequest'
    } else if (this._orchestratorPath.includes('text_chat_with_text_llm')) {
      pbRequest.className = 'TextChatCompleteRequestV4'
    } else {
      const msg = `Unknown path: ${this._orchestratorPath}`
      Logger.error(msg)
      throw new Error(msg)
    }

    for (const [key, value] of Object.entries(this._requestDict)) {
      if (key in pbRequest) {
        const typedKey =
          key as keyof orchestrator_v4.orchestrator_v4.IOrchestratorV4Request
        ;(pbRequest as any)[typedKey] = value
      } else {
        Logger.warn(`Property ${key} does not exist on pb_request`)
      }
    }
    const requestBytes =
      orchestrator_v4.orchestrator_v4.OrchestratorV4Request.encode(
        pbRequest,
      ).finish()
    const buffer = new ArrayBuffer(requestBytes.byteLength)
    new Uint8Array(buffer).set(requestBytes)
    this._globalState.webSocketState.sendMessage(buffer)

    this._lastRecvTime = Date.now()
    this._streamDataCallback = (data: ArrayBuffer) => {
      this._onMessage(new Uint8Array(data), this._lastRecvTime!)
    }

    this._requestIdCallback = (requestId: string | null) => {
      if (requestId === null) {
        Logger.error('Request ID not received yet.')
        return
      }
      if (this._orchestratorPath.includes('chat')) {
        this._responseType = 'normal'
      } else if (this._orchestratorPath.includes('with_audio_llm')) {
        // If calling audio LLM to generate actor animation interface, default response_type is normal
        this._responseType = 'normal'
      }
    }
    this._globalState.onStreamDataBlockChangedObservable.add(
      this._streamDataCallback,
    )
    this.onRequestIDChangedObservable.add(this._requestIdCallback)
  }

  /**
   * Get response type.
   *
   * If the type is not determined yet, returns null. Otherwise returns one of
   * 'leave', 'failed', or 'normal'.
   *
   * @returns The current response type or null if undetermined.
   */
  public async getResponseType(): Promise<'leave' | 'failed' | 'normal' | null> {
    if (this._runningLoopFailed) {
      return 'failed'
    }
    const curTime = performance.now()
    if (
      this._lastRecvTime !== null &&
      this._timeout !== null &&
      curTime - this._lastRecvTime > this._timeout
    ) {
      const msg = 'Get response type timeout.'
      Logger.error(msg)
      return 'failed'
    }
    return this._responseType
  }

  /**
   * Get animation.
   *
   * Retrieves all available audio, face, and motion data from internal queues,
   * and returns a combined animation dictionary. Returned animation data can be:
   * - Motion animation
   * - Face animation
   * - Audio PCM data
   *
   * @returns A dictionary containing any of the keys 'motion', 'face', or 'audio'.
   *
   * @throws StreamUnavailableError Streaming failed and data cannot be provided.
   * @throws StreamEndedError All streams have ended and no more data is available.
   */
  public async getAnimation(): Promise<Record<string, any>> {
    if (this._failureOnStreaming) {
      const msg = 'Streaming failed, unable to get animation.'
      // LoggerManager.error(msg)
      throw new StreamUnavailableError(msg)
    }

    const retDict: Record<string, MotionClip | FaceClip | Uint8Array> = {}
    const mcList = Array.from(this._motionQueue.drain())

    if (mcList.length > 0) {
      retDict['motion'] = MotionClip.concat(mcList)
    }

    const fcList = Array.from(this._faceQueue.drain())
    if (fcList.length > 0) {
      retDict['face'] = FaceClip.concat(fcList)
    }

    const pcmChunks = Array.from(this._audioQueue.drain())
    const totalSize = pcmChunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const pcmBytes = new Uint8Array(totalSize)

    let offset = 0
    for (const pcm of pcmChunks) {
      pcmBytes.set(pcm, offset)
      offset += pcm.length
    }

    if (pcmBytes.length > 0) {
      retDict['audio'] = pcmBytes
    }

    if (
      Object.keys(retDict).length === 0 &&
      this._motionStream &&
      this._motionStream.endRecvTime !== null &&
      this._faceStream &&
      this._faceStream.endRecvTime !== null &&
      this._audioStream &&
      this._audioStream.endRecvTime !== null
    ) {
      throw new StreamEndedError()
    }

    return retDict
  }

  /**
   * Get network stream reception status.
   *
   * Returns current network reception status information for all streams,
   * used for monitoring and analyzing network performance.
   *
   * @returns A dictionary containing network stream stats for 'audio', 'face', and 'motion' when available.
   */
  public async getNetworkStreams(): Promise<Record<string, NetworkStream>> {
    const ans: Record<string, NetworkStream> = {}
    if (this._motionStream) {
      ans['motion'] = this._motionStream
    }
    if (this._faceStream) {
      ans['face'] = this._faceStream
    }
    if (this._audioStream) {
      ans['audio'] = this._audioStream
    }
    return ans
  }

  /**
   * Get audio PCM data.
   *
   * Retrieves all available PCM audio data from the audio queue.
   *
   * @returns A Uint8Array containing concatenated PCM audio bytes.
   *
   * @throws StreamUnavailableError Streaming failed and audio cannot be provided.
   */
  public async getAudioPcm(): Promise<Uint8Array> {
    if (this._failureOnStreaming) {
      const msg = 'Streaming failed, unable to get audio PCM.'
      Logger.error(msg)
      throw new StreamUnavailableError(msg)
    }

    const pcmChunks = Array.from(this._audioQueue.drain())
    const totalSize = pcmChunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const pcmBytes = new Uint8Array(totalSize)

    let offset = 0
    for (const pcm of pcmChunks) {
      pcmBytes.set(pcm, offset)
      offset += pcm.length
    }

    return pcmBytes
  }
  /**
   * Get audio parameters.
   *
   * Returns audio sample rate, number of channels, and sample width.
   *
   * @returns A tuple [sampleRate, numChannels, sampleWidthBytes].
   *
   * @throws StreamUnavailableError Audio parameters are not ready yet.
   */
  public async getAudioParams(): Promise<[number, number, number]> {
    if (
      this._audioNChannels === null ||
      this._audioSampleWidth === null ||
      this._audioFrameRate === null
    ) {
      throw new StreamUnavailableError('Audio parameters not ready')
    }
    return [this._audioFrameRate, this._audioNChannels, this._audioSampleWidth]
  }

  /**
   * Interrupt streaming.
   *
   * Stops client execution and cleans up all internal queues.
   *
   * @returns Promise that resolves when internal state is cleared.
   */
  public async interrupt(): Promise<void> {
    await this._cleanQueues()
  }

  /**
   * Check if stream is ready.
   *
   * Determines whether audio, face, and motion streams have all reached the
   * configured readiness thresholds, or all streams have ended.
   *
   * @returns True if the stream is considered ready for playback.
   */
  public async streamReady(): Promise<boolean> {
    if (
      this._audioDuration >= this._audioReadySeconds &&
      this._faceNFrames >= this._faceReadyNFrames &&
      this._motionNFrames >= this._motionReadyNFrames
    ) {
      if (this._stopRecordingTime !== null) {
        Logger.debug(`Streamed animation ready, reached minimum playback time`)
      }
      return true
    } else if (
      this._audioStream &&
      this._audioStream.endRecvTime !== null &&
      this._faceStream &&
      this._faceStream.endRecvTime !== null &&
      this._motionStream &&
      this._motionStream.endRecvTime !== null
    ) {
      if (this._stopRecordingTime !== null) {
        Logger.debug(`Streamed animation ready, received animation end signal`)
      }
      return true
    } else {
      return false
    }
  }

  /**
   * Check if stream has ended.
   *
   * Determines whether all streams have ended and a response type has been determined.
   *
   * @returns True if the stream has ended.
   */
  public async streamEnd(): Promise<boolean> {
    if (
      this._motionStream &&
      this._motionStream.endRecvTime !== null &&
      this._faceStream &&
      this._faceStream.endRecvTime !== null &&
      this._audioStream &&
      this._audioStream.endRecvTime !== null &&
      this._responseType !== null
    ) {
      return true
    } else {
      return false
    }
  }

  /**
   * Process received message.
   *
   * Parses protobuf message and executes corresponding processing logic based on message type.
   *
   * @param message Message.
   * @param recvTime Message reception timestamp.
   *
   * @returns True if processing succeeds, false otherwise.
   */
  private async _onMessage(message: Uint8Array, recvTime: number): Promise<boolean> {
    const pbResponse =
      orchestrator_v4.orchestrator_v4.OrchestratorV4Response.decode(message)
    const className = pbResponse.className
    let reason: string
    let nFrames: number = 0
    let data
    let shape: number[] = []
    let streamChunk: NetworkStreamChunk

    switch (className) {
      case 'NormalResponse':
        this._responseType = 'normal'
        Logger.debug(`Received signal of response type normal`)
        return true
      case 'FailedResponse':
        reason = pbResponse.message
        if (this._responseType === 'normal') {
          this._failureOnStreaming = true
        }
        this._responseType = 'failed'
        Logger.error(`Received failure signal, reason: ${reason}`)
        return false
      case 'LeaveResponse':
        this._responseType = 'leave'
        return false
      case 'AudioChunkStart':
        this._audioFrameRate = pbResponse.audioFrameRate
        this._audioNChannels = pbResponse.audioNChannels
        this._audioSampleWidth = pbResponse.audioSampleWidth
        this._audioStream = new NetworkStream(recvTime)
        break
      case 'AudioChunkBody':
        await this._audioQueue.enqueue(pbResponse.data)
        const chunkDuration =
          pbResponse.data.length /
          (this._audioFrameRate! * this._audioNChannels! * this._audioSampleWidth!)
        this._audioDuration += chunkDuration
        this._audioChunkBodyCount += 1

        if (
          this._audioDuration > this._audioReadySeconds &&
          !this._audioReadyLogged
        ) {
          const message = `Audio streaming ready, buffer has ${this._audioDuration} seconds of audio, reached minimum playback time`
          Logger.debug(message)
          this._audioReadyLogged = true
        }
        streamChunk = new NetworkStreamChunk(
          this._audioStream!.length,
          chunkDuration,
          recvTime,
        )
        this._audioStream!.appendChunk(streamChunk)
        break
      case 'AudioChunkEnd':
        this._audioStream!.setEndRecvTime(recvTime)
        break
      case 'MotionChunkStart':
        this._motionJointNames = pbResponse.motionJointNames
        this._motionNJoints = pbResponse.motionJointNames.length
        this._motionDtype = getArithmetic(pbResponse.dtype)
        if (this._motionDtype === Arithmetic.unknown) {
          const msg = `Unknown motion dtype: ${pbResponse.dtype}`
          Logger.error(msg)
          if (this._responseType === 'normal') {
            this._failureOnStreaming = true
          }
          return false
        }
        this._motionRestposeName = pbResponse.motionRestposeName
        if (
          pbResponse.motionTimelineStartIdxValue !== null &&
          pbResponse.motionTimelineStartIdxValue !== 0
        ) {
          this._motionTimelineStartIdx =
            pbResponse.motionTimelineStartIdxValue !== undefined
              ? pbResponse.motionTimelineStartIdxValue
              : null
        }
        this._motionStream = new NetworkStream(recvTime)
        break
      case 'MotionChunkBody':
        // |JOINT|*9 for joint rot mat, 3 for global transl, 3 for cutoff frame
        shape = [-1, this._motionNJoints! * 9 + 3 + 3]
        data = parseFloatingData(pbResponse.data, this._motionDtype, shape)
        if (data === null) {
          const msg = `Failed to parse motion data, data type: ${this._motionDtype}, shape: ${shape}`
          Logger.error(msg)
          throw new ArithmeticParseError(msg)
        }
        // @ts-expect-error data already assigned
        nFrames = data.length as number
        const jointRotmatData = sliceArray(data, [
          null,
          [0, this._motionNJoints! * 9],
        ])
        const jointRotmat = reshapeArray(jointRotmatData.flat(), [
          nFrames,
          this._motionNJoints!,
          3,
          3,
        ])
        const rootPosition = sliceArray(data, [
          null,
          [this._motionNJoints! * 9, this._motionNJoints! * 9 + 3],
        ])
        const motionTimelineStartIdx: number | null =
          this._motionStream!.length === 0 ? this._motionTimelineStartIdx : null
        const motionClip = new MotionClip(
          nFrames,
          this._motionJointNames!,
          jointRotmat,
          rootPosition,
          0,
          this._motionRestposeName,
          null,
          motionTimelineStartIdx,
        )
        this._motionQueue.enqueue(motionClip)
        this._motionNFrames += nFrames
        this._motionChunkBodyCount += 1

        if (
          this._motionNFrames > this._motionReadyNFrames &&
          !this._motionReadyLogged
        ) {
          const message = `Motion streaming ready, buffer has ${this._motionNFrames} frames of animation, reached minimum playback time`
          Logger.debug(message)
          this._motionReadyLogged = true
        }

        streamChunk = new NetworkStreamChunk(
          this._motionStream!.length,
          nFrames / INTRINSIC_FRAME_RATE,
          recvTime,
        )
        this._motionStream!.appendChunk(streamChunk)

        break
      case 'MotionChunkEnd':
        this._motionStream?.setEndRecvTime(recvTime)
        break
      case 'FaceChunkStart':
        this._faceBlendshapeNames = pbResponse.faceBlendshapeNames
        this._faceNBlendshapes = pbResponse.faceBlendshapeNames.length
        if (pbResponse.dtype === 'float16') {
          this._faceDtype = Arithmetic.float16
        } else if (pbResponse.dtype === 'float32') {
          this._faceDtype = Arithmetic.float32
        } else {
          const msg = `Unknown face dtype: ${pbResponse.dtype}`
          Logger.error(msg)
          return false
        }
        this._globalState.characters[0].runtimeAnimationGroup.morphTargetSize =
          pbResponse.faceBlendshapeNames.length
        this._globalState.characters[0].runtimeAnimationGroup.morphTargetDataType =
          this._faceDtype
        this._globalState.characters[0].runtimeAnimationGroup.morphTargetNames =
          pbResponse.faceBlendshapeNames
        if (
          pbResponse.faceTimelineStartIdxValue &&
          pbResponse.faceTimelineStartIdxValue !== 0
        ) {
          this._faceTimelineStartIdx = pbResponse.faceTimelineStartIdxValue
        }
        this._faceStream = new NetworkStream(recvTime)
        break
      case 'FaceChunkBody':
        shape = [-1, this._faceNBlendshapes!]
        data = parseFloatingData(pbResponse.data, this._faceDtype, shape)
        if (data === null) {
          const msg = `Failed to parse face data, data type: ${this._faceDtype}, shape: ${shape}`
          Logger.error(msg)
          throw new ArithmeticParseError(msg)
        }
        const faceTimelineStartIdx: number | null =
          this._faceStream!.length === 0 ? this._faceTimelineStartIdx : null
        const faceClip = new FaceClip(
          this._faceBlendshapeNames!,
          data as number[][],
          faceTimelineStartIdx,
        )
        // @ts-expect-error data already assigned
        nFrames = data.length as number
        this._faceQueue.enqueue(faceClip)
        this._faceNFrames += nFrames
        this._faceChunkBodyCount += 1

        if (this._faceNFrames > this._faceReadyNFrames && !this._faceReadyLogged) {
          const message = `Face streaming ready, buffer has ${this._faceNFrames} frames of expressions, reached minimum playback time`
          Logger.debug(message)
          this._faceReadyLogged = true
        }
        streamChunk = new NetworkStreamChunk(
          this._faceStream!.length,
          nFrames / INTRINSIC_FRAME_RATE,
          recvTime,
        )
        this._faceStream!.appendChunk(streamChunk)
        break
      case 'FaceChunkEnd':
        this._faceStream?.setEndRecvTime(recvTime)
        break
      case 'RequestIDResponse':
        this._requestId = pbResponse.requestId
        this.onRequestIDChangedObservable.notifyObservers(this._requestId)
        Logger.debug(`Received request ID: ${pbResponse.requestId}`)
        break
      default:
        const msg = `Unknown response type: ${className}`
        Logger.error(msg)
        if (this._responseType === 'normal') {
          this._failureOnStreaming = true
        }
        return false
    }

    if (
      this._motionStream &&
      this._motionStream.endRecvTime !== null &&
      this._faceStream &&
      this._faceStream.endRecvTime !== null &&
      this._audioStream &&
      this._audioStream.endRecvTime !== null &&
      this._responseType !== null &&
      this._responseType !== null
    ) {
      this._globalState.webSocketState.disconnectWebSocket()
      return false
    }

    return true
  }

  /**
   * Clean up queues.
   */
  private async _cleanQueues(): Promise<void> {
    this._audioQueue.clear()
    this._motionQueue.clear()
    this._faceQueue.clear()
  }

  /**
   * Send a stop message for audio streaming.
   *
   * Sends the appropriate protocol buffer request to instruct the server to
   * stop receiving audio, and records the stop time.
   *
   * @returns Promise that resolves once the message is sent.
   */
  public async sendStopAudioStreamingMessage(): Promise<void> {
    const stopRequest = new orchestrator_v4.orchestrator_v4.OrchestratorV4Request()
    if (this._orchestratorPath.includes('audio_chat_with_text_llm')) {
      stopRequest.className = 'AudioChatCompleteStopRequestV4'
    } else if (this._orchestratorPath.includes('audio_chat_with_audio_llm')) {
      stopRequest.className = 'AudioChatExpressStopRequestV4'
    } else {
      const msg = `Unknown path: ${this._orchestratorPath}`
      Logger.error(msg)
      throw new Error(msg)
    }
    const stopPbBytes =
      orchestrator_v4.orchestrator_v4.OrchestratorV4Request.encode(
        stopRequest,
      ).finish()
    const stopBuffer = uint8Array2ArrayBuffer(stopPbBytes)
    await this._globalState.webSocketState?.sendMessage(stopBuffer)
    this._stopRecordingTime = performance.now()
    Logger.debug(`Sent stop audio stream message`)
  }

  /**
   * Reset streamed runtime animation buffers.
   *
   * Clears streamed joint animation data and morph target data from the first
   * character's runtime animation group.
   *
   * @returns Promise that resolves when buffers are cleared.
   */
  public async resetRuntimeStreamed(): Promise<void> {
    this._globalState.characters[0].runtimeAnimationGroup.clearJointAnimationData(
      RuntimeBufferType.STREAMED,
    )
    this._globalState.characters[0].runtimeAnimationGroup.clearMorphTargetData(
      RuntimeBufferType.STREAMED,
    )
  }

  /**
   * Dispose the client and remove observers.
   *
   * Detaches any subscribed callbacks from observables and clears internal
   * observables to prevent memory leaks.
   *
   * @returns Promise that resolves when disposal is complete.
   */
  public async dispose(): Promise<void> {
    if (this._streamDataCallback !== null) {
      this._globalState.onStreamDataBlockChangedObservable.removeCallback(
        this._streamDataCallback,
      )
    }

    if (this._animationCallback !== null) {
      this._globalState.scene.onBeforeRenderObservable.removeCallback(
        this._animationCallback,
      )
    }

    if (this._requestIdCallback !== null) {
      this.onRequestIDChangedObservable.removeCallback(this._requestIdCallback)
    }

    this.onRequestIDChangedObservable.clear()
  }

  /**
   * Get timeout time.
   *
   * @returns The timeout in milliseconds or null if unset.
   */
  public get timeOut(): number | null {
    return this._timeout
  }
}
