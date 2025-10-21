import {
  RuntimeAnimationRange,
  RuntimeBufferType,
} from '@/library/babylonjs/runtime/animation'
import { Logger } from '@/library/babylonjs/utils'

/**
 * RuntimeAnimationControl
 *
 * A class for controlling runtime animation playback including joint and morph target
 * animations. Manages animation state, timing, loop settings, and completion status.
 */
export class RuntimeAnimationControl {
  /**
   * Whether joint animation is currently paused.
   */
  private _jointPaused: boolean = true
  /**
   * Current frame time for joint animation.
   */
  private _jointFrameTime: number = 0
  /**
   * Total duration of joint animation in frame time.
   */
  private _jointFrameTimeDuration: number = 0

  /**
   * Whether morph target animation is currently paused.
   */
  private _morphTargetPaused: boolean = true
  /**
   * Current frame time for morph target animation.
   */
  private _morphTargetFrameTime: number = 0
  /**
   * Total duration of morph target animation in frame time.
   */
  private _morphTargetFrameTimeDuration: number = 0

  /**
   * Whether the animation can be looped.
   */
  private _loopable: boolean = false
  /**
   * The range of frames for animation looping.
   */
  private _loopRange: RuntimeAnimationRange = new RuntimeAnimationRange()

  /**
   * The type of runtime buffer for this animation control.
   */
  private _type: RuntimeBufferType

  /**
   * Whether joint animation has finished playing.
   */
  private _jointFinished = false
  /**
   * Whether morph target animation has finished playing.
   */
  private _morphTargetFinished = false
  /**
   * Whether finish notification has been sent to listeners.
   */
  private _finishedNotified = false

  /**
   * Create a new RuntimeAnimationControl instance.
   *
   * @param paused Whether the animation should start in paused state. Defaults to true.
   * @param type The runtime buffer type for this animation control.
   */
  constructor(paused: boolean = true, type: RuntimeBufferType) {
    if (!paused) {
      this._jointPaused = false
      this._morphTargetPaused = false
    }
    this._type = type
  }

  /**
   * Log current animation control parameters for debugging.
   */
  public logParams() {
    Logger.log(`jointPaused: ${this._jointPaused}`)
    Logger.log(`jointFrameTime: ${this._jointFrameTime}`)
    Logger.log(`jointFrameTimeDuration: ${this._jointFrameTimeDuration}`)
    Logger.log(`morphTargetPaused: ${this._morphTargetPaused}`)
    Logger.log(`morphTargetFrameTime: ${this._morphTargetFrameTime}`)
  }

  /**
   * Get the runtime buffer type.
   *
   * @returns The runtime buffer type.
   */
  get type(): RuntimeBufferType {
    return this._type
  }

  /**
   * Get whether joint animation is paused.
   *
   * @returns True if joint animation is paused, false otherwise.
   */
  get jointPaused(): boolean {
    return this._jointPaused
  }

  /**
   * Get current joint frame time.
   *
   * @returns Current joint frame time.
   */
  get jointFrameTime(): number {
    return this._jointFrameTime
  }

  /**
   * Get joint frame time duration.
   *
   * @returns Joint frame time duration.
   */
  get jointFrameTimeDuration(): number {
    return this._jointFrameTimeDuration
  }

  /**
   * Get whether morph target animation is paused.
   *
   * @returns True if morph target animation is paused, false otherwise.
   */
  get morphTargetPaused(): boolean {
    return this._morphTargetPaused
  }

  /**
   * Get current morph target frame time.
   *
   * @returns Current morph target frame time.
   */
  get morphTargetFrameTime(): number {
    return this._morphTargetFrameTime
  }

  /**
   * Get morph target frame time duration.
   *
   * @returns Morph target frame time duration.
   */
  get morphTargetFrameTimeDuration(): number {
    return this._morphTargetFrameTimeDuration
  }

  /**
   * Get whether the animation is loopable.
   *
   * @returns True if the animation is loopable, false otherwise.
   */
  get loopable(): boolean {
    return this._loopable
  }

  /**
   * Get the loop range for the animation.
   *
   * @returns The loop range.
   */
  get loopRange(): RuntimeAnimationRange {
    return this._loopRange
  }

  /**
   * Set whether joint animation is paused.
   *
   * @param jointPaused Whether joint animation should be paused.
   */
  set jointPaused(jointPaused: boolean) {
    this._jointPaused = jointPaused
  }

  /**
   * Set current joint frame time.
   *
   * @param jointFrameTime Current joint frame time.
   */
  set jointFrameTime(jointFrameTime: number) {
    this._jointFrameTime = jointFrameTime
  }

  /**
   * Set joint frame time duration.
   *
   * @param jointFrameTimeDuration Joint frame time duration.
   */
  set jointFrameTimeDuration(jointFrameTimeDuration: number) {
    this._jointFrameTimeDuration = jointFrameTimeDuration
  }

  /**
   * Set whether morph target animation is paused.
   *
   * @param morphTargetPaused Whether morph target animation should be paused.
   */
  set morphTargetPaused(morphTargetPaused: boolean) {
    this._morphTargetPaused = morphTargetPaused
  }

  /**
   * Set current morph target frame time.
   *
   * @param morphTargetFrameTime Current morph target frame time.
   */
  set morphTargetFrameTime(morphTargetFrameTime: number) {
    this._morphTargetFrameTime = morphTargetFrameTime
  }

  /**
   * Set morph target frame time duration.
   *
   * @param morphTargetFrameTimeDuration Morph target frame time duration.
   */
  set morphTargetFrameTimeDuration(morphTargetFrameTimeDuration: number) {
    this._morphTargetFrameTimeDuration = morphTargetFrameTimeDuration
  }

  /**
   * Set whether the animation is loopable.
   *
   * @param loopable Whether the animation should be loopable.
   */
  set loopable(loopable: boolean) {
    this._loopable = loopable
  }

  /**
   * Set the loop range for the animation.
   *
   * @param loopRange The loop range to set.
   */
  set loopRange(loopRange: RuntimeAnimationRange) {
    this._loopRange = loopRange
  }

  /**
   * Get whether joint animation has finished.
   *
   * @returns True if joint animation has finished, false otherwise.
   */
  get jointFinished(): boolean {
    return this._jointFinished
  }

  /**
   * Set whether joint animation has finished.
   *
   * @param finished Whether joint animation has finished.
   */
  set jointFinished(finished: boolean) {
    this._jointFinished = finished
  }

  /**
   * Get whether morph target animation has finished.
   *
   * @returns True if morph target animation has finished, false otherwise.
   */
  get morphTargetFinished(): boolean {
    return this._morphTargetFinished
  }

  /**
   * Set whether morph target animation has finished.
   *
   * @param finished Whether morph target animation has finished.
   */
  set morphTargetFinished(finished: boolean) {
    this._morphTargetFinished = finished
  }

  /**
   * Get whether finish notification has been sent.
   *
   * @returns True if finish notification has been sent, false otherwise.
   */
  get finishedNotified(): boolean {
    return this._finishedNotified
  }

  /**
   * Set whether finish notification has been sent.
   *
   * @param finishedNotified Whether finish notification has been sent.
   */
  set finishedNotified(finishedNotified: boolean) {
    this._finishedNotified = finishedNotified
  }
}
