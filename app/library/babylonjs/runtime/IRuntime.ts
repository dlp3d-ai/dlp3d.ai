import * as BABYLON from '@babylonjs/core'
import { Character } from '@/library/babylonjs/runtime/character'

/**
 * IRuntime
 *
 * Defines the runtime contract for driving character animation playback,
 * physics-tick hooks, audio synchronization, and lifecycle management within a
 * Babylon.js scene. Implementations should coordinate characters, expose
 * animation observables, and provide control over time and duration.
 */
export interface IRuntime {
  /**
   * Notified when the long-idle animation duration changes.
   */
  readonly onLongIdleAnimationDurationChangedObservable: BABYLON.Observable<void>

  /**
   * Notified when animation playback starts or resumes.
   */
  readonly onPlayAnimationObservable: BABYLON.Observable<void>

  /**
   * Notified when animation playback is paused.
   */
  readonly onPauseAnimationObservable: BABYLON.Observable<void>

  /**
   * Notified when animation is evaluated (typically once per frame).
   */
  readonly onAnimationTickObservable: BABYLON.Observable<void>

  /**
   * Notified when animation playback reaches its end.
   */
  readonly onAnimationEndObservable: BABYLON.Observable<void>

  /**
   * Dispose runtime resources.
   *
   * Destroys all characters and audio resources, and unregister this runtime
   * from the provided Babylon.js scene.
   *
   * @param scene The Babylon.js scene to clean up and detach from.
   */
  dispose(scene: BABYLON.Scene): void

  /**
   * Add a character to the runtime.
   *
   * @param character The character instance to be managed by the runtime.
   */
  addCharacter(character: Character): void

  /**
   * Remove a character from the runtime.
   *
   * @param name The unique name of the character to remove.
   */
  removeCharacter(name: string): void

  /**
   * Register the runtime with a scene.
   *
   * Hooks the runtime into the scene's update loop, wiring `beforePhysics` and
   * `afterPhysics` callbacks.
   *
   * @param scene The Babylon.js scene to register with.
   */
  register(scene: BABYLON.Scene): void

  /**
   * Unregister the runtime from a scene.
   *
   * Detaches previously registered `beforePhysics` and `afterPhysics` callbacks
   * from the scene.
   *
   * @param scene The Babylon.js scene to unregister from.
   */
  unregister(scene: BABYLON.Scene): void

  /**
   * Execute pre-physics updates.
   *
   * Updates animations and runs runtime solvers before the physics stage.
   *
   * @param deltaTime Elapsed time since last tick, in milliseconds.
   */
  beforePhysics(deltaTime: number): void

  /**
   * Execute post-physics updates.
   *
   * Updates physics-driven state and runs runtime solvers after the physics stage.
   */
  afterPhysics(): void

  /**
   * Play animation from the current animation time.
   *
   * If audio player is set, it try to play the audio from the current animation time
   *
   * @returns A promise that resolves when asynchronous playback setup completes.
   */
  playAnimation(): Promise<void>

  /**
   * Pause animation playback.
   */
  pauseAnimation(): void

  /**
   * Whether the animation is currently playing.
   *
   * @returns True if the animation is playing; otherwise false.
   */
  get isAnimationPlaying(): boolean

  /**
   * Characters managed by the runtime.
   *
   * @returns A readonly array of characters.
   */
  get characters(): readonly Character[]

  /**
   * Current animation time scale.
   *
   * A multiplier applied to animation progression speed. Defaults to 1.
   *
   * @returns The current time scale.
   */
  get timeScale(): number

  /**
   * Set the current animation time scale.
   *
   * @param value The new time scale multiplier. Defaults to 1.
   */
  set timeScale(value: number)

  /**
   * Current animation time in the intrinsic frame rate.
   *
   * @returns The current time measured in frames.
   */
  get currentJointFrameTime(): number

  /**
   * Current animation time in seconds.
   *
   * @returns The current time measured in seconds.
   */
  get jointTimeLongIdle(): number

  /**
   * Current long-idle animation duration in the intrinsic frame rate.
   *
   * @returns The duration measured in frames.
   */
  get jointFrameTimeDurationLongIdle(): number

  /**
   * Current long-idle animation duration in seconds.
   *
   * @returns The duration measured in seconds.
   */
  get jointDurationLongIdle(): number

  /**
   * Set the long-idle animation duration manually.
   *
   *
   * @param frameTimeDuration The duration in the intrinsic frame rate (frames);
   *                           pass null to revert to the intrinsic duration.
   */
  setJointFrameTimeDurationLongIdle(
    frameTimeDuration: BABYLON.Nullable<number>,
  ): void
}
