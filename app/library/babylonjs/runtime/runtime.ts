import * as BABYLON from '@babylonjs/core'
import Queue from 'yocto-queue'
import {
  INTRINSIC_FRAME_RATE,
  GlobalState,
  IDisposeObservable,
} from '@/library/babylonjs/core'
import { IRuntime as IRuntime } from '@/library/babylonjs/runtime/IRuntime'
import {
  RuntimeAnimationControl,
  RuntimeBufferType,
} from '@/library/babylonjs/runtime/animation'
import { StreamAudioPlayer } from '@/library/babylonjs/runtime/audio'
import { Character } from '@/library/babylonjs/runtime/character'
import { Conditions, ConditionedMessage } from '@/library/babylonjs/runtime/fsm'
import { StreamHealth } from '@/library/babylonjs/runtime/stream'
import { Logger } from '@/library/babylonjs/utils'

/**
 * Duration in seconds for blend-in transitions.
 */
const BLEND_IN_TIME: number = 0.3
/**
 * Duration in seconds for blend-out transitions.
 */
const BLEND_OUT_TIME: number = 0.8

/**
 * Easing function for smoother animation blending.
 *
 * @param t Normalized time in range [0, 1].
 *
 * @returns Eased value in range [0, 1].
 */
const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * RuntimeAnimationEvent
 *
 * Enumerates animation control and state transition events used by the
 * state machine and event queue.
 */
export enum RuntimeAnimationEvent {
  TO_LOCAL_SOFT_IN_SOFT_OUT,
  TO_LOCAL_SOFT_IN_HARD_OUT,
  TO_LOCAL_HARD_IN_SOFT_OUT,
  TO_STREAMED_SOFT_IN_SOFT_OUT,
  TO_STREAMED_SOFT_IN_HARD_OUT,
  TO_STREAMED_HARD_IN_SOFT_OUT,
  SOFT_INTERRUPT,
  HARD_INTERRUPT,
  RHS_LOOPABLE,
  RHS_NON_LOOPABLE,
  USE_LINEAR_BLEND,
  USE_CUBIC_BLEND,
  STREAM_ENDED,
  MOTION_DELAYED_PLAY,
  MORPH_DELAYED_PLAY,
  AUDIO_DELAYED_PLAY,
  PAUSE_ANIMATION,
  RESUME_ANIMATION,
}

/**
 * Arbitrary payload carried alongside a conditioned message.
 */
interface ConditionedMessageData {
  [key: string]: any
}

/**
 * RuntimeConditionedMessage
 *
 * Wraps a runtime animation event and optional payload to be processed by the
 * runtime event queue.
 */
export class RuntimeConditionedMessage {
  event: RuntimeAnimationEvent
  data: ConditionedMessageData | null

  /**
   * Create a conditioned message.
   *
   * @param event Event type to dispatch.
   * @param data Optional payload data. Defaults to null.
   */
  constructor(
    event: RuntimeAnimationEvent,
    data: ConditionedMessageData | null = null,
  ) {
    this.event = event
    this.data = data
  }
}

/**
 * Internal blend curve type used for weight evaluation.
 */
enum RuntimeAnimationBlendType {
  LINEAR,
  CUBIC,
}

/**
 * Runtime
 *
 * Coordinates character animations, audio synchronization, and physics hooks
 * within a Babylon.js scene. Provides observables for playback state, exposes
 * time and duration controls, and routes events to a simple internal state
 * system for blending and transitions.
 */
export class Runtime implements IRuntime {
  /**
   * Characters managed by this runtime
   */
  private _characters: Character[]
  /**
   * Global engine-level state shared across systems
   */
  private _globalState: GlobalState
  /**
   * Audio player used for synchronized playback with animation
   */
  private _audioPlayer: BABYLON.Nullable<StreamAudioPlayer>

  /**
   * Whether runtime callbacks have been registered to a scene
   */
  private _isRegistered: boolean

  /**
   * Fired when long-idle duration changes
   */
  public readonly onLongIdleAnimationDurationChangedObservable: BABYLON.Observable<void>

  /**
   * Fired when playback starts or resumes
   */
  public readonly onPlayAnimationObservable: BABYLON.Observable<void>

  /**
   * Fired when playback is paused
   */
  public readonly onPauseAnimationObservable: BABYLON.Observable<void>

  /**
   * Fired when the runtime is disposed
   */
  public readonly onEndRuntimeObservable: BABYLON.Observable<void>

  /**
   * Fired every animation tick (typically each frame)
   */
  public readonly onAnimationTickObservable: BABYLON.Observable<void>

  /**
   * Fired when current animation reaches end
   */
  public readonly onAnimationEndObservable: BABYLON.Observable<void>

  /**
   * Control for long-idle (background/idle) animation buffer
   */
  private _longIdleControl: RuntimeAnimationControl
  /**
   * Control for local (preloaded) animation buffer
   */
  private _localControl: RuntimeAnimationControl
  /**
   * Control for streamed (live) animation buffer
   */
  private _streamedControl: RuntimeAnimationControl

  /**
   * Left-hand side of blending (usually long-idle)
   */
  private _lhs: RuntimeAnimationControl
  /**
   * Right-hand side of blending (target buffer to blend to)
   */
  private _rhs: RuntimeAnimationControl

  /**
   * Whether streamed buffer has reached its end
   */
  private _streamEnded: boolean = false

  /**
   * Use hard blend-in (instant weight = 1)
   */
  private _useHardBlendIn: boolean = false
  /**
   * Use hard blend-out (instant weight = 0)
   */
  private _useHardBlendOut: boolean = false

  /**
   * Global animation time scale multiplier
   */
  private _animationTimeScale: number
  /**
   * Whether long-idle duration is overridden manually
   */
  private _useManualAnimationDuration: boolean

  /**
   * Global pause flag for animation progression
   */
  private _animationPausedGlobal: boolean = false

  /**
   * Joint-channel blend-in flag
   */
  private isJointBlendingIn: boolean = false
  /**
   * Joint-channel blend-out flag
   */
  private isJointBlendingOut: boolean = false
  /**
   * Current joint-channel blend weight [0,1]
   */
  private jointBlendWeight: number = 0
  /**
   * Joint-channel blend timer in seconds
   */
  private jointBlendTimer: number = 0

  /**
   * Morph-target-channel blend-in flag
   */
  private isMorphTargetBlendingIn: boolean = false
  /**
   * Morph-target-channel blend-out flag
   */
  private isMorphTargetBlendingOut: boolean = false
  /**
   * Current morph-target blend weight [0,1]
   */
  private morphTargetBlendWeight: number = 0
  /**
   * Morph-target blend timer in seconds
   */
  private morphTargetBlendTimer: number = 0

  /**
   * Active blend curve used for weight evaluation
   */
  private _blendType: RuntimeAnimationBlendType = RuntimeAnimationBlendType.LINEAR

  /**
   * In-memory local audios mapped by motion label
   */
  private _audiosLocal: Record<string, Uint8Array> = {}

  /**
   * Queue of conditioned messages to process each tick
   */
  private _eventQueue: Queue<RuntimeConditionedMessage> =
    new Queue<RuntimeConditionedMessage>()

  /**
   * Bound callback for scene.onBeforeAnimationsObservable
   */
  private _beforePhysicsBinded: BABYLON.Nullable<(scene: BABYLON.Scene) => void>
  /**
   * Bound callback for scene.onBeforeRenderObservable
   */
  private readonly _afterPhysicsBinded: () => void

  /**
   * Bound disposer registered to onDisposeObservable of the scene
   */
  private readonly _bindedDispose: BABYLON.Nullable<(scene: BABYLON.Scene) => void>
  /**
   * Scene or object providing onDisposeObservable used to auto-dispose runtime
   */
  private readonly _disposeObservableObject: BABYLON.Nullable<IDisposeObservable>

  /**
   * Construct a new runtime.
   *
   * @param globalState The global state instance.
   * @param scene Optional Babylon.js scene to bind lifecycle hooks to. Defaults to null.
   */
  public constructor(
    globalState: GlobalState,
    scene: BABYLON.Nullable<BABYLON.Scene> = null,
  ) {
    this._characters = []
    this._audioPlayer = null
    this._globalState = globalState

    this._isRegistered = false

    this.onLongIdleAnimationDurationChangedObservable =
      new BABYLON.Observable<void>()
    this.onPlayAnimationObservable = new BABYLON.Observable<void>()
    this.onPauseAnimationObservable = new BABYLON.Observable<void>()
    this.onAnimationTickObservable = new BABYLON.Observable<void>()
    this.onEndRuntimeObservable = new BABYLON.Observable<void>()
    this.onAnimationEndObservable = new BABYLON.Observable<void>()

    this._longIdleControl = new RuntimeAnimationControl(
      false,
      RuntimeBufferType.LONG_IDLE,
    )
    this._longIdleControl.loopable = true
    this._localControl = new RuntimeAnimationControl(true, RuntimeBufferType.LOCAL)
    this._localControl.loopable = false
    this._streamedControl = new RuntimeAnimationControl(
      true,
      RuntimeBufferType.STREAMED,
    )
    this._streamedControl.loopable = false

    this._lhs = this._longIdleControl
    this._rhs = this._streamedControl

    this._animationTimeScale = 1
    this._useManualAnimationDuration = false

    this._beforePhysicsBinded = null
    this._afterPhysicsBinded = this.afterPhysics.bind(this)

    if (scene !== null) {
      this._bindedDispose = (): void => this.dispose(scene)
      this._disposeObservableObject = scene
      if (this._disposeObservableObject !== null) {
        this._disposeObservableObject.onDisposeObservable.add(this._bindedDispose)
      }
    } else {
      this._bindedDispose = null
      this._disposeObservableObject = null
    }
  }

  /**
   * Set local audio data for a motion label.
   *
   * @param motionLabel Motion identifier to associate the audio with.
   * @param audio Raw PCM audio data buffer.
   */
  public setAudioLocal(motionLabel: string, audio: Uint8Array): void {
    this._audiosLocal[motionLabel] = audio
  }

  /**
   * Switch audio player buffer to the audio mapped to the given motion label.
   *
   * @param motionLabel Motion identifier whose audio should be used.
   */
  public switchAudioLocal(motionLabel: string): void {
    if (!Object.keys(this._audiosLocal).includes(motionLabel)) {
      this._audioPlayer?.clearPCMBuffer()
      return
    }

    const audio = this._audiosLocal[motionLabel]
    this._audioPlayer?.appendPCMData(audio)
  }

  public _registerAnimationDurationChangedEvents(character: Character): void {
    character.runtimeAnimationGroup.longIdleBuffer.onJointDurationChangedObservable.add(
      nJointFrames => {
        this._longIdleControl.jointFrameTimeDuration = nJointFrames
      },
    )

    character.runtimeAnimationGroup.localBuffer.onJointDurationChangedObservable.add(
      nJointFrames => {
        this._localControl.jointFrameTimeDuration = nJointFrames
      },
    )

    character.runtimeAnimationGroup.streamedBuffer.onJointDurationChangedObservable.add(
      nJointFrames => {
        this._streamedControl.jointFrameTimeDuration = nJointFrames
      },
    )

    character.runtimeAnimationGroup.streamedBuffer.onClearJointAnimationObservable.add(
      () => {
        this._streamedControl.jointFrameTime = 0
        this.jointBlendTimer = 0
      },
    )

    character.runtimeAnimationGroup.longIdleBuffer.onMorphTargetDurationChangedObservable.add(
      nMorphTargetFrames => {
        this._longIdleControl.morphTargetFrameTimeDuration = nMorphTargetFrames
      },
    )

    character.runtimeAnimationGroup.localBuffer.onMorphTargetDurationChangedObservable.add(
      nMorphTargetFrames => {
        this._localControl.morphTargetFrameTimeDuration = nMorphTargetFrames
      },
    )

    character.runtimeAnimationGroup.streamedBuffer.onMorphTargetDurationChangedObservable.add(
      nMorphTargetFrames => {
        this._streamedControl.morphTargetFrameTimeDuration = nMorphTargetFrames
      },
    )

    character.runtimeAnimationGroup.streamedBuffer.onClearMorphTargetAnimationObservable.add(
      () => {
        this._streamedControl.morphTargetFrameTime = 0
        this.morphTargetBlendTimer = 0
      },
    )

    character.runtimeAnimationGroup.longIdleBuffer.onMorphTargetDurationChangedObservable.add(
      nMorphTargetFrames => {
        this._longIdleControl.morphTargetFrameTimeDuration = nMorphTargetFrames
      },
    )

    character.runtimeAnimationGroup.localBuffer.onMorphTargetDurationChangedObservable.add(
      nMorphTargetFrames => {
        this._localControl.morphTargetFrameTimeDuration = nMorphTargetFrames
      },
    )

    character.runtimeAnimationGroup.streamedBuffer.onMorphTargetDurationChangedObservable.add(
      nMorphTargetFrames => {
        this._streamedControl.morphTargetFrameTimeDuration = nMorphTargetFrames
      },
    )

    character.runtimeAnimationGroup.localBuffer.onJointAnimationLoopRangeChangedObservable.add(
      loopRange => {
        this._localControl.loopRange = loopRange
        this._localControl.jointFrameTimeDuration = loopRange.end
      },
    )
  }

  /**
   * Add a character to the runtime and wire its animation observers.
   *
   * @param character Character instance to add.
   */
  public addCharacter(character: Character): void {
    this._characters.push(character)
    character.onCurrentAnimationChangedObservable.add(this._onAnimationChanged)
    this._onAnimationChanged(character.currentAnimationGroup)
    this._registerAnimationDurationChangedEvents(character)
  }

  /**
   * Remove a character by name.
   *
   * @param name Unique character name to remove.
   * @throws {Error} if a character with the given name exists but the index lookup fails.
   */
  public removeCharacter(name: string): void {
    const res = this._characters.filter(character => {
      return character.name === name
    })[0]

    if (!res) return

    const index = this._characters.indexOf(res)
    if (index < 0) throw new Error('Character not found')

    this._characters.splice(index, 1)
  }

  /**
   * Set or replace the audio player used for synchronized playback.
   *
   * @param audioPlayer The audio player instance or null to detach.
   * @returns Resolves when the player is swapped and rate applied.
   */
  public async setAudioPlayer(
    audioPlayer: BABYLON.Nullable<StreamAudioPlayer>,
  ): Promise<void> {
    if (this._audioPlayer === audioPlayer) return

    if (this._audioPlayer !== null) {
      this._audioPlayer.pause()
    }

    this._audioPlayer = null
    if (audioPlayer === null) return

    this._audioPlayer = audioPlayer
    audioPlayer._setPlaybackRateWithoutNotify(this._animationTimeScale)
  }

  /**
   * Register runtime callbacks with the scene.
   *
   * @param scene Babylon.js scene to register with.
   */
  public register(scene: BABYLON.Scene): void {
    if (this._isRegistered) return

    this._isRegistered = true

    this._beforePhysicsBinded = (): void =>
      this.beforePhysics(scene.getEngine().getDeltaTime())

    scene.onBeforeAnimationsObservable.add(this._beforePhysicsBinded)
    scene.onBeforeRenderObservable.add(this._afterPhysicsBinded)
  }

  /**
   * Unregister runtime callbacks from the scene.
   *
   * @param scene Babylon.js scene to unregister from.
   */
  public unregister(scene: BABYLON.Scene): void {
    if (!this._isRegistered) return
    this._isRegistered = false

    scene.onBeforeAnimationsObservable.removeCallback(this._afterPhysicsBinded!)

    scene.onBeforeRenderObservable.removeCallback(this._afterPhysicsBinded)

    this._beforePhysicsBinded = null
  }

  private _flushEvents(): void {
    const events = Array.from(this._eventQueue.drain())

    const handleEvent = (message: RuntimeConditionedMessage): void => {
      switch (message.event) {
        case RuntimeAnimationEvent.TO_LOCAL_SOFT_IN_SOFT_OUT:
          this._rhs = this._localControl
          this._useHardBlendIn = false
          this._useHardBlendOut = false
          this.isJointBlendingIn = true
          this.isMorphTargetBlendingIn = true
          this._rhs.jointFrameTime = 0
          this._rhs.jointPaused = false
          this._rhs.morphTargetFrameTime = 0
          this._rhs.morphTargetPaused = false
          this._rhs.jointFinished = false
          this._rhs.morphTargetFinished = false
          this._rhs.finishedNotified = false
          this.jointBlendWeight = 0
          this.morphTargetBlendWeight = 0
          this.jointBlendTimer = 0
          this.morphTargetBlendTimer = 0
          break
        case RuntimeAnimationEvent.TO_LOCAL_SOFT_IN_HARD_OUT:
          this._rhs = this._localControl
          this._useHardBlendIn = false
          this._useHardBlendOut = true
          this.isJointBlendingIn = true
          this.isMorphTargetBlendingIn = true
          this._rhs.jointFrameTime = 0
          this._rhs.jointPaused = false
          this._rhs.morphTargetFrameTime = 0
          this._rhs.morphTargetPaused = false
          this._rhs.jointFinished = false
          this._rhs.morphTargetFinished = false
          this._rhs.finishedNotified = false
          this.jointBlendWeight = 0
          this.morphTargetBlendWeight = 0
          this.jointBlendTimer = 0
          this.morphTargetBlendTimer = 0
          break
        case RuntimeAnimationEvent.TO_STREAMED_SOFT_IN_SOFT_OUT:
          this._rhs = this._streamedControl
          this._useHardBlendIn = false
          this._useHardBlendOut = false
          this.isJointBlendingIn = true
          this.isMorphTargetBlendingIn = true
          this._rhs.jointFrameTime = 0
          this._rhs.jointPaused = false
          this._rhs.morphTargetFrameTime = 0
          this._rhs.morphTargetPaused = false
          this._rhs.jointFinished = false
          this._rhs.morphTargetFinished = false
          this._rhs.finishedNotified = false
          this._useHardBlendIn = false
          this.jointBlendWeight = 0
          this.morphTargetBlendWeight = 0
          this.jointBlendTimer = 0
          this.morphTargetBlendTimer = 0
          this._streamEnded = false
          Logger.debug(`Start playing streamed animation`)
          break
        case RuntimeAnimationEvent.TO_STREAMED_SOFT_IN_HARD_OUT:
          this._rhs = this._streamedControl
          this._useHardBlendIn = false
          this._useHardBlendOut = true
          this.isJointBlendingIn = true
          this.isMorphTargetBlendingIn = true
          this._rhs.jointFrameTime = 0
          this._rhs.morphTargetFrameTime = 0
          this._rhs.jointFinished = false
          this._rhs.morphTargetFinished = false
          this._rhs.finishedNotified = false
          this._useHardBlendIn = false
          this.jointBlendWeight = 0
          this.morphTargetBlendWeight = 0
          this.jointBlendTimer = 0
          this.morphTargetBlendTimer = 0
          this._streamEnded = false
          break
        case RuntimeAnimationEvent.TO_LOCAL_HARD_IN_SOFT_OUT:
          this._useHardBlendIn = true
          this._rhs = this._localControl
          this._rhs.jointFrameTime = 0
          this._rhs.jointPaused = false
          this._rhs.morphTargetFrameTime = 0
          this._rhs.morphTargetPaused = false
          this._rhs.jointFinished = false
          this._rhs.morphTargetFinished = false
          this._rhs.finishedNotified = false
          break
        case RuntimeAnimationEvent.TO_STREAMED_HARD_IN_SOFT_OUT:
          this._useHardBlendIn = true
          this._rhs = this._streamedControl
          this._rhs.jointFrameTime = 0
          this._rhs.morphTargetFrameTime = 0
          this._rhs.jointFinished = false
          this._rhs.morphTargetFinished = false
          this._rhs.finishedNotified = false
          this._streamEnded = false
          break
        case RuntimeAnimationEvent.SOFT_INTERRUPT:
          this.isJointBlendingOut = true
          this.isMorphTargetBlendingOut = true
          this._rhs.jointPaused = true
          this._rhs.morphTargetPaused = true
          this.jointBlendTimer = 0
          this.morphTargetBlendTimer = 0
          this._rhs.jointFinished = false
          this._rhs.morphTargetFinished = false
          this._rhs.finishedNotified = false
          break
        case RuntimeAnimationEvent.HARD_INTERRUPT:
          this.isJointBlendingOut = true
          this.isMorphTargetBlendingOut = true
          this._rhs.jointPaused = true
          this._rhs.morphTargetPaused = true
          this.jointBlendTimer = BLEND_OUT_TIME
          this.morphTargetBlendTimer = BLEND_OUT_TIME
          this._rhs.jointFinished = false
          this._rhs.morphTargetFinished = false
          this._rhs.finishedNotified = false
          break
        case RuntimeAnimationEvent.RHS_LOOPABLE:
          this._rhs.loopable = true
          break
        case RuntimeAnimationEvent.RHS_NON_LOOPABLE:
          this._rhs.loopable = false
          break
        case RuntimeAnimationEvent.USE_LINEAR_BLEND:
          this._blendType = RuntimeAnimationBlendType.LINEAR
          break
        case RuntimeAnimationEvent.USE_CUBIC_BLEND:
          this._blendType = RuntimeAnimationBlendType.CUBIC
          break
        case RuntimeAnimationEvent.STREAM_ENDED:
          this._streamEnded = true
          break
        case RuntimeAnimationEvent.MOTION_DELAYED_PLAY:
          if (
            message.data !== null &&
            Object.keys(message.data).includes('delay_time')
          ) {
            const delay_time = message.data['delay_time'] as number
            setTimeout(() => {
              this._rhs.jointPaused = false
            }, delay_time)
            const msg = `Motion animation delayed ${delay_time}ms to start`
            Logger.debug(msg)
          }
          break
        case RuntimeAnimationEvent.MORPH_DELAYED_PLAY:
          if (
            message.data !== null &&
            Object.keys(message.data).includes('delay_time')
          ) {
            const delay_time = message.data['delay_time'] as number
            setTimeout(() => {
              this._rhs.morphTargetPaused = false
            }, delay_time)
            const msg = `Morph target animation delayed ${delay_time}ms to start`
            Logger.debug(msg)
          }
          break
        case RuntimeAnimationEvent.AUDIO_DELAYED_PLAY:
          if (
            message.data !== null &&
            Object.keys(message.data).includes('delay_time')
          ) {
            this._audioPlayer?.pause()
            const delay_time = message.data['delay_time'] as number
            setTimeout(async () => {
              await this._audioPlayer?.play()
            }, delay_time)
            const msg = `Audio delayed ${delay_time}ms to start`
            Logger.debug(msg)
          }
          break
        case RuntimeAnimationEvent.PAUSE_ANIMATION:
          if (!this._rhs.jointPaused) {
            this._rhs.jointPaused = true
          }
          if (!this._rhs.morphTargetPaused) {
            this._rhs.morphTargetPaused = true
          }
          if (!this._audioPlayer?.paused) {
            this._audioPlayer?.pause()
          }
          break
        case RuntimeAnimationEvent.RESUME_ANIMATION:
          if (this._rhs.jointPaused) {
            this._rhs.jointPaused = false
          }
          if (this._rhs.morphTargetPaused) {
            this._rhs.morphTargetPaused = false
          }
          if (this._audioPlayer?.paused) {
            this._audioPlayer?.play()
          }
          break
        case undefined:
          // no event, keep as it is
          break
        default:
          throw new Error(`Unknown event: ${event}`)
      }
    }

    for (const event of events) {
      handleEvent(event)
    }
  }

  private _evaluateBlendInWeight(progress: number): number {
    let ans = 0
    switch (this._blendType) {
      case RuntimeAnimationBlendType.LINEAR:
        ans = progress / BLEND_IN_TIME
        break
      case RuntimeAnimationBlendType.CUBIC:
        ans = easeInOutCubic(progress / BLEND_IN_TIME)
        break
    }
    return Math.min(1, ans)
  }

  private _evaluateBlendOutWeight(progress: number): number {
    let ans = 0
    switch (this._blendType) {
      case RuntimeAnimationBlendType.LINEAR:
        ans = 1 - progress / BLEND_OUT_TIME
        break
      case RuntimeAnimationBlendType.CUBIC:
        ans = 1 - easeInOutCubic(progress / BLEND_OUT_TIME)
        break
    }
    return Math.max(0, ans)
  }

  /**
   * Compute stream health metrics.
   *
   * @returns Remaining motion seconds, remaining face frames, and remaining audio seconds.
   */
  public streamHealth(): StreamHealth {
    const m = Math.max(
      0,
      (this._streamedControl.jointFrameTimeDuration -
        this._streamedControl.jointFrameTime) /
        INTRINSIC_FRAME_RATE,
    )
    let a = 0
    if (this._audioPlayer) {
      a = Math.max(
        0,
        this._audioPlayer.duration - this._audioPlayer.playbackPosition(),
      )
    }
    const f = Math.max(
      0,
      (this._streamedControl.morphTargetFrameTimeDuration -
        this._streamedControl.morphTargetFrameTime) /
        INTRINSIC_FRAME_RATE,
    )
    return {
      motionHealthTimeInSeconds: m,
      faceHealthTimeInFrames: f,
      audioHealthTimeInSeconds: a,
    }
  }

  /**
   * Whether all three streams (motion, face, audio) are paused.
   *
   * @returns True if motion, face, and audio are paused.
   */
  public streamPaused(): boolean {
    return (
      this._streamedControl.jointPaused &&
      this._streamedControl.morphTargetPaused &&
      this._audioPlayer!.paused
    )
  }

  /**
   * Audio stream length in seconds.
   */
  public get audioStreamLength(): number {
    return this._audioPlayer!.duration
  }

  /**
   * Motion stream length in frames.
   */
  public get motionStreamLength(): number {
    return this._streamedControl.jointFrameTimeDuration
  }

  /**
   * Morph target stream length in frames.
   */
  public get morphStreamLength(): number {
    return this._streamedControl.morphTargetFrameTimeDuration
  }

  /**
   * Update runtime before physics evaluation.
   *
   * Advances animation clocks, evaluates blending, and notifies observers.
   *
   * @param deltaTime Elapsed milliseconds since last frame.
   */
  beforePhysics(deltaTime: number): void {
    this._flushEvents()

    if (this._animationPausedGlobal) {
      return
    }

    // only use delta time to compute animation time
    const step = (deltaTime / 1000) * INTRINSIC_FRAME_RATE * this._animationTimeScale
    this._lhs.jointFrameTime += step

    const elapsedJointFrameTimeLHS = this._lhs.jointFrameTime
    // long idle is finished, return to origin
    if (this._lhs.jointFrameTimeDuration <= elapsedJointFrameTimeLHS) {
      this._lhs.jointFrameTime = 0
    }

    // joint
    const elapsedJointFrameTimeRHS = this._rhs.jointFrameTime
    if (!this._rhs.jointPaused) {
      // target animation is playing
      if (this._rhs.jointFrameTimeDuration >= elapsedJointFrameTimeRHS) {
        this._rhs.jointFrameTime += step

        if (this._useHardBlendIn) {
          this.jointBlendWeight = 1
        } else {
          if (this.isJointBlendingIn) {
            if (this.jointBlendTimer >= BLEND_IN_TIME) {
              this.isJointBlendingIn = false
              this.jointBlendTimer = 1
            } else {
              this.jointBlendTimer += (deltaTime / 1000) * this._animationTimeScale
            }

            this.jointBlendWeight = this._evaluateBlendInWeight(this.jointBlendTimer)
          }
        }
      } else {
        if (this._rhs.loopable) {
          this._rhs.jointFrameTime = this._rhs.loopRange.start
        } else {
          if (this._rhs.type === RuntimeBufferType.STREAMED && !this._streamEnded) {
            this._globalState.stateMachine?.putConditionedMessage(
              new ConditionedMessage(Conditions.JOINT_STREAM_BROKEN, {
                message: `Joint stream interrupted`,
              }),
            )
          }

          if (
            this._rhs.type === RuntimeBufferType.LOCAL ||
            (this._rhs.type === RuntimeBufferType.STREAMED && this._streamEnded)
          ) {
            // target animation is finished, blend to local animation
            this._rhs.jointPaused = true

            if (this._useHardBlendOut) {
              this.isJointBlendingOut = true
              this.jointBlendTimer = BLEND_OUT_TIME
            } else {
              this.isJointBlendingOut = true
              this.jointBlendTimer = 0
            }

            this._rhs.jointFinished = true
          }
        }
      }
    } else {
      // streamed animation is paused
      if (this.isJointBlendingOut) {
        if (this.jointBlendTimer >= BLEND_OUT_TIME) {
          this.isJointBlendingOut = false
          this.jointBlendTimer = 1
          this._rhs.jointFinished = true
          this._globalState.stateMachine?.putConditionedMessage(
            new ConditionedMessage(Conditions.JOINT_ANIMATION_FINISHED, {
              message: `Joint animation of type ${this._rhs.type} finished`,
            }),
          )
        } else {
          this.jointBlendTimer += (deltaTime / 1000) * this._animationTimeScale
        }
        this.jointBlendWeight = this._evaluateBlendOutWeight(this.jointBlendTimer)
      }
    }

    // morph target
    this._lhs.morphTargetFrameTime += step
    const elapsedMorphTargetFrameTimeRHS = this._rhs.morphTargetFrameTime
    if (!this._rhs.morphTargetPaused) {
      if (this._rhs.morphTargetFrameTimeDuration >= elapsedMorphTargetFrameTimeRHS) {
        this._rhs.morphTargetFrameTime += step

        if (this._useHardBlendIn) {
          this.morphTargetBlendWeight = 1
        } else {
          if (this.isMorphTargetBlendingIn) {
            if (this.morphTargetBlendTimer >= BLEND_IN_TIME) {
              this.isMorphTargetBlendingIn = false
              this.morphTargetBlendTimer = 1
            } else {
              this.morphTargetBlendTimer +=
                (deltaTime / 1000) * this._animationTimeScale
            }
            this.morphTargetBlendWeight = this._evaluateBlendInWeight(
              this.morphTargetBlendTimer,
            )
          }
        }
      } else {
        if (this._rhs.loopable) {
          this._rhs.morphTargetFrameTime = 0
        } else {
          if (this._rhs.type === RuntimeBufferType.STREAMED && !this._streamEnded) {
            this._globalState.stateMachine?.putConditionedMessage(
              new ConditionedMessage(Conditions.MORPH_STREAM_BROKEN, {
                message: `Face stream interrupted`,
              }),
            )
          }

          if (
            this._rhs.type === RuntimeBufferType.LOCAL ||
            (this._rhs.type === RuntimeBufferType.STREAMED && this._streamEnded)
          ) {
            this._rhs.morphTargetPaused = true
            this.isMorphTargetBlendingOut = true
            this.morphTargetBlendTimer = 0
            this._rhs.morphTargetFinished = true

            this._globalState.stateMachine?.putConditionedMessage(
              new ConditionedMessage(Conditions.MORPH_ANIMATION_FINISHED, {
                message: `Face animation of type ${this._rhs.type} finished`,
              }),
            )
          }
        }
      }
    } else {
      if (this.isMorphTargetBlendingOut) {
        if (this.morphTargetBlendTimer >= BLEND_OUT_TIME) {
          this.isMorphTargetBlendingOut = false
          this.morphTargetBlendTimer = 1
          this._rhs.morphTargetFinished = true
        } else {
          this.morphTargetBlendTimer += (deltaTime / 1000) * this._animationTimeScale
        }
        this.morphTargetBlendWeight = this._evaluateBlendOutWeight(
          this.morphTargetBlendTimer,
        )
      }
    }

    if (
      this._rhs.jointFinished &&
      this._rhs.morphTargetFinished &&
      !this._rhs.finishedNotified
    ) {
      this._globalState.stateMachine?.putConditionedMessage(
        new ConditionedMessage(Conditions.ANIMATION_FINISHED, {
          message: `Animation of type ${this._rhs.type} finished`,
        }),
      )
      this._rhs.finishedNotified = true
    }

    const elapsedMorphTargetFrameTimeLHS = this._lhs.morphTargetFrameTime
    // local animation is end, return to origin
    if (this._lhs.morphTargetFrameTimeDuration <= elapsedMorphTargetFrameTimeLHS) {
      this._lhs.morphTargetFrameTime = 0
    }

    const characters = this._characters
    for (let i = 0; i < characters.length; ++i) {
      characters[i].animate(
        elapsedJointFrameTimeLHS,
        elapsedJointFrameTimeRHS,
        this.jointBlendWeight,
        elapsedMorphTargetFrameTimeLHS,
        elapsedMorphTargetFrameTimeRHS,
        this.morphTargetBlendWeight,
        this._rhs.type,
      )

      characters[i].dynamicBoneSolver?.syncBodies()
    }

    this.onAnimationTickObservable.notifyObservers()
  }

  /**
   * Update runtime after physics evaluation.
   */
  public afterPhysics(): void {
    const characters = this._characters
    for (let i = 0; i < characters.length; ++i) {
      characters[i].dynamicBoneSolver?.syncBones()
    }
  }

  private readonly _onAnimationChanged = (
    newAnimation: BABYLON.AnimationGroup | null | undefined,
  ): void => {
    if (this._useManualAnimationDuration) return

    const newAnimationDuration = newAnimation?.to ?? 0

    if (this._longIdleControl.jointFrameTimeDuration < newAnimationDuration) {
      this._longIdleControl.jointFrameTimeDuration = newAnimationDuration
    } else {
      this._longIdleControl.jointFrameTimeDuration = this._computeAnimationDuration()
    }

    newAnimation?.goToFrame(this.currentJointFrameTime)

    this.onLongIdleAnimationDurationChangedObservable.notifyObservers()
  }

  private _computeAnimationDuration(): number {
    let duration = 0
    const characters = this._characters
    for (let i = 0; i < characters.length; ++i) {
      const character = characters[i]
      if (
        character.currentAnimationGroup !== null &&
        character.currentAnimationGroup !== undefined
      ) {
        duration = Math.max(duration, character.currentAnimationGroup.to)
      }
    }

    return duration
  }

  private _playAnimationInternal(): void {
    if (!this._animationPausedGlobal) return
    this._animationPausedGlobal = false

    this.onPlayAnimationObservable.notifyObservers()
  }

  /**
   * Start or resume animation playback.
   */
  public async playAnimation(): Promise<void> {
    this._playAnimationInternal()
  }

  /**
   * Pause animation playback.
   */
  public pauseAnimation(): void {
    this._animationPausedGlobal = true
    this.onPauseAnimationObservable.notifyObservers()
  }

  /**
   * Enqueue an event with optional payload for processing.
   *
   * @param message The conditioned message to enqueue.
   */
  public addConditionedMessage(message: RuntimeConditionedMessage): void {
    this._eventQueue.enqueue(message)
  }

  /**
   * Whether the runtime is currently playing.
   */
  public get isAnimationPlaying(): boolean {
    return !this._animationPausedGlobal
  }

  /**
   * Characters managed by the runtime.
   */
  public get characters(): readonly Character[] {
    return this._characters
  }

  /**
   * The currently attached audio player, if any.
   */
  public get audioPlayer(): BABYLON.Nullable<StreamAudioPlayer> {
    return this._audioPlayer
  }

  /**
   * Current animation time scale multiplier.
   */
  public get timeScale(): number {
    return this._animationTimeScale
  }

  /**
   * Set the animation time scale multiplier.
   *
   * @param value New time scale; also applied to audio playback rate if present.
   */
  public set timeScale(value: number) {
    this._animationTimeScale = value

    if (this._audioPlayer !== null) {
      this._audioPlayer._setPlaybackRateWithoutNotify(value)
    }
  }

  /**
   * Current joint time of the long-idle buffer, measured in frames.
   */
  public get currentJointFrameTime(): number {
    return this._longIdleControl.jointFrameTime
  }

  /**
   * Joint frame time of the long-idle buffer.
   */
  public get jointFrameTimeLongIdle(): number {
    return this._longIdleControl.jointFrameTime
  }

  /**
   * Joint frame time of the local buffer.
   */
  public get jointFrameTimeLocal(): number {
    return this._localControl.jointFrameTime
  }

  /**
   * Joint frame time of the streamed buffer.
   */
  public get jointFrameTimeStreamed(): number {
    return this._streamedControl.jointFrameTime
  }

  /**
   * Joint time of the long-idle buffer, measured in seconds.
   */
  public get jointTimeLongIdle(): number {
    return this._longIdleControl.jointFrameTime / INTRINSIC_FRAME_RATE
  }

  /**
   * Joint duration of the long-idle buffer, measured in frames.
   */
  public get jointFrameTimeDurationLongIdle(): number {
    return this._longIdleControl.jointFrameTimeDuration
  }

  /**
   * Joint duration of the local buffer, measured in frames.
   */
  public get jointFrameTimeDurationLocal(): number {
    return this._localControl.jointFrameTimeDuration
  }

  /**
   * Joint duration of the streamed buffer, measured in frames.
   */
  public get jointFrameTimeDurationStreamed(): number {
    return this._streamedControl.jointFrameTimeDuration
  }

  /**
   * Joint duration of the long-idle buffer, measured in seconds.
   */
  public get jointDurationLongIdle(): number {
    return this._longIdleControl.jointFrameTimeDuration / INTRINSIC_FRAME_RATE
  }

  /**
   * Joint duration of the local buffer, measured in seconds.
   */
  public get jointDurationLocal(): number {
    return this._localControl.jointFrameTimeDuration / INTRINSIC_FRAME_RATE
  }

  /**
   * Joint duration of the streamed buffer, measured in seconds.
   */
  public get jointDurationStreamed(): number {
    return this._streamedControl.jointFrameTimeDuration / INTRINSIC_FRAME_RATE
  }

  /**
   * Morph target frame time of the long-idle buffer.
   */
  public get morphTargetFrameTimeLongIdle(): number {
    return this._longIdleControl.morphTargetFrameTime
  }

  /**
   * Morph target frame time of the local buffer.
   */
  public get morphTargetFrameTimeLocal(): number {
    return this._localControl.morphTargetFrameTime
  }

  /**
   * Morph target frame time of the streamed buffer.
   */
  public get morphTargetFrameTimeStreamed(): number {
    return this._streamedControl.morphTargetFrameTime
  }

  /**
   * Morph target duration of the long-idle buffer, measured in frames.
   */
  public get morphTargetFrameTimeDurationLongIdle(): number {
    return this._longIdleControl.morphTargetFrameTimeDuration
  }

  /**
   * Morph target duration of the local buffer, measured in frames.
   */
  public get morphTargetFrameTimeDurationLocal(): number {
    return this._localControl.morphTargetFrameTimeDuration
  }

  /**
   * Morph target duration of the streamed buffer, measured in frames.
   */
  public get morphTargetFrameTimeDurationStreamed(): number {
    return this._streamedControl.morphTargetFrameTimeDuration
  }

  /**
   * Morph target duration of the long-idle buffer, measured in seconds.
   */
  public get morphTargetDurationLongIdle(): number {
    return this._longIdleControl.morphTargetFrameTimeDuration / INTRINSIC_FRAME_RATE
  }

  /**
   * Morph target duration of the local buffer, measured in seconds.
   */
  public get morphTargetDurationLocal(): number {
    return this._localControl.morphTargetFrameTimeDuration / INTRINSIC_FRAME_RATE
  }

  /**
   * Morph target duration of the streamed buffer, measured in seconds.
   */
  public get morphTargetDurationStreamed(): number {
    return this._streamedControl.morphTargetFrameTimeDuration / INTRINSIC_FRAME_RATE
  }

  /**
   * Set the long-idle joint duration.
   *
   * When null, reverts to the intrinsic (auto-computed) duration.
   *
   * @param jointFrameTimeDuration New duration in frames, or null to auto-compute.
   */
  public setJointFrameTimeDurationLongIdle(
    jointFrameTimeDuration: BABYLON.Nullable<number>,
  ): void {
    if (jointFrameTimeDuration === null && !this._useManualAnimationDuration) return

    if (jointFrameTimeDuration === null) {
      this._useManualAnimationDuration = false
      this._longIdleControl.jointFrameTimeDuration = this._computeAnimationDuration()
    } else {
      this._useManualAnimationDuration = true
      this._longIdleControl.jointFrameTimeDuration = jointFrameTimeDuration
    }

    this.onLongIdleAnimationDurationChangedObservable.notifyObservers()
  }

  /**
   * Whether streamed animations are currently playing (joint or morph).
   *
   * @returns True if any streamed channel is still progressing.
   */
  public streamedAnimationPlaying(): boolean {
    const jointPlaying =
      !this._streamedControl.jointFinished &&
      this._streamedControl.jointFrameTimeDuration !== 0 &&
      this._streamedControl.jointFrameTime <=
        this._streamedControl.jointFrameTimeDuration
    const morphPlaying =
      !this._streamedControl.morphTargetFinished &&
      this._streamedControl.morphTargetFrameTimeDuration !== 0 &&
      this._streamedControl.morphTargetFrameTime <=
        this._streamedControl.morphTargetFrameTimeDuration

    return jointPlaying || morphPlaying
  }

  /**
   * Dispose runtime resources.
   *
   * Destroys all characters, clears observables, and unregisters callbacks from the scene.
   *
   * @param scene The Babylon.js scene used for registration.
   */
  public dispose(scene: BABYLON.Scene): void {
    // reset characters
    for (let i = 0; i < this._characters.length; ++i) this._characters[i].dispose()
    this._characters.length = 0

    this.onLongIdleAnimationDurationChangedObservable.clear()
    this.onPlayAnimationObservable.clear()
    this.onPauseAnimationObservable.clear()
    this.onAnimationTickObservable.clear()

    this.unregister(scene)

    if (this._disposeObservableObject !== null && this._bindedDispose !== null) {
      this._disposeObservableObject.onDisposeObservable.removeCallback(
        this._bindedDispose,
      )
    }
  }
}
