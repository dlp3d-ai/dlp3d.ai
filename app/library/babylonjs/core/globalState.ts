import * as BABYLON from '@babylonjs/core'
import { Runtime } from '@/library/babylonjs/runtime'
import {
  Character,
  EyeTrackingController,
} from '@/library/babylonjs/runtime/character'
import { StateMachine } from '@/library/babylonjs/runtime/fsm'
import { GUI } from '@/library/babylonjs/runtime/gui'
import {
  WebSocketState,
  WebSocketConnectionState,
} from '@/data_structures/webSocketState'
import {
  AudioStreamState,
  AudioRecordState,
} from '@/data_structures/audioStreamState'

/**
 * GlobalState
 *
 * A centralized state management class that holds global application state
 * including BabylonJS scene, characters, runtime, WebSocket state, and audio stream state.
 * Provides observables for state change notifications and manages PCM queue operations.
 */
export class GlobalState {
  scene!: BABYLON.Scene
  utilityLayer!: BABYLON.UtilityLayerRenderer
  gui!: GUI
  characters: Character[] = []
  runtime: BABYLON.Nullable<Runtime> = null
  eyeTracker: EyeTrackingController | null = null

  private _webSocketState: WebSocketState | null = null
  audioStreamState: AudioStreamState | null = null
  stateMachine: StateMachine | null = null

  private _isUserStreaming: boolean = false

  // PCM queue management methods (will be set by BabylonJSContext)
  flushPCMQueue: (() => Promise<void>) | null = null
  getPCMQueueLength: (() => number) | null = null

  public readonly onAudioStreamStateChangedObservable =
    new BABYLON.Observable<AudioRecordState>()
  public readonly onWebSocketConnectionStateChangedObservable =
    new BABYLON.Observable<WebSocketConnectionState>()
  public readonly onStreamDataBlockChangedObservable =
    new BABYLON.Observable<ArrayBuffer>()
  public readonly onUserStreamingStateChangedObservable =
    new BABYLON.Observable<boolean>()

  // Getter for isUserRecording
  get isUserStreaming(): boolean {
    return this._isUserStreaming
  }

  // Setter for isUserRecording that notifies observers
  set isUserStreaming(value: boolean) {
    if (this._isUserStreaming !== value) {
      this._isUserStreaming = value
      this.onUserStreamingStateChangedObservable.notifyObservers(value)
    }
  }

  /**
   * Update the user streaming state.
   *
   * @param isStreaming Whether the user is currently streaming audio.
   */
  public updateUserStreamingState(isStreaming: boolean) {
    this.isUserStreaming = isStreaming
  }

  // Getter for webSocketState that ensures it's initialized
  get webSocketState(): WebSocketState {
    if (!this._webSocketState) {
      throw new Error(
        'WebSocket state is not initialized. Make sure you are using this within a BabylonJSProvider context.',
      )
    }
    return this._webSocketState
  }

  // Setter for webSocketState
  set webSocketState(state: WebSocketState | null) {
    this._webSocketState = state
  }

  /**
   * Check if WebSocket state is initialized.
   *
   * @returns True if WebSocket state is initialized, false otherwise.
   */
  isWebSocketStateInitialized(): boolean {
    return this._webSocketState !== null
  }

  /**
   * Update the audio stream state and notify observers.
   *
   * @param recordState The new audio record state to set.
   */
  public updateAudioStreamState(recordState: AudioRecordState) {
    if (!this.audioStreamState) return

    this.audioStreamState.recordState = recordState
    this.onAudioStreamStateChangedObservable.notifyObservers(recordState)
  }

  /**
   * Update the WebSocket connection state and notify observers.
   *
   * @param connectionState The new WebSocket connection state to set.
   */
  public updateWebSocketConnectionState(connectionState: WebSocketConnectionState) {
    if (!this._webSocketState) return

    this._webSocketState.connectionState = connectionState
    this.onWebSocketConnectionStateChangedObservable.notifyObservers(connectionState)
  }

  /**
   * Update the stream data block and notify observers.
   *
   * @param streamDataBlock The new stream data block to set.
   */
  public updateStreamDataBlock(streamDataBlock: ArrayBuffer) {
    if (!this._webSocketState) return

    this._webSocketState.streamDataBlock = streamDataBlock
    this.onStreamDataBlockChangedObservable.notifyObservers(streamDataBlock)
  }
}
