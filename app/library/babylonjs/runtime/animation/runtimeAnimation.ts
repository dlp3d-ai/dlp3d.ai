import * as BABYLON from '@babylonjs/core'
import { RuntimeAnimationRange } from '@/library/babylonjs/runtime/animation'

/**
 * Type definition for morph target values.
 *
 * Maps morph target names to arrays of values for each frame.
 */
export type MorphTargetValues = Record<string, number[]>

/**
 * Interface for runtime face animation data.
 *
 * Contains frame count and morph target values for face animations.
 */
export interface RuntimeFaceAnimationData {
  /** Number of frames in the animation. */
  nFrames: number
  /** Morph target values for each frame. */
  morphTargetValues: MorphTargetValues
}

/**
 * Interface for runtime skeletal animation data.
 *
 * Contains joint rotation quaternions, translations, joint names,
 * loop range, and loopability information for skeletal animations.
 */
export interface RuntimeSkeletalAnimationData {
  /** Joint rotation quaternions for each frame and joint. */
  rotQuat: BABYLON.Quaternion[][]
  /** Global translation vectors for each frame. */
  transl: BABYLON.Vector3[]
  /** Names of the joints in the animation. */
  jointNames: string[]
  /** Range of frames that can be looped. */
  loopRange: RuntimeAnimationRange
  /** Whether the animation can be looped. */
  loopable: boolean
}

/**
 * RuntimeAnimation
 *
 * A class for managing runtime animation data including joint rotations,
 * global translations, and morph target values. Provides observables for
 * animation state changes and supports both skeletal and facial animations.
 */
export class RuntimeAnimation {
  /**
   * Joint rotation data, [N_FRAME, N_JOINT]
   */
  private _jointRot: BABYLON.Quaternion[][] | null = null
  /**
   * Global translation data, [N_FRAME]
   */
  private _globalTrans: BABYLON.Vector3[] | null = null
  /**
   * Morph target data, [N_FRAME, N_MORPH_TARGET]
   */
  private _morphTargetValues: MorphTargetValues = {}
  /**
   * Frame number of joint animation
   */
  private _nJointFrames: number = 0
  /**
   * Frame number of morph target animation
   */
  private _nMorphTargetFrames: number = 0

  /**
   * Notify observers when the duration of the joint animation is changed
   */
  public readonly onJointDurationChangedObservable: BABYLON.Observable<number> =
    new BABYLON.Observable()
  /**
   * Notify observers when the first joint animation is received
   */
  public readonly onFirstJointAnimationObservable: BABYLON.Observable<number> =
    new BABYLON.Observable()
  /**
   * Notify observers when the joint animation is cleared
   */
  public readonly onClearJointAnimationObservable: BABYLON.Observable<void> =
    new BABYLON.Observable()

  /**
   * Notify observers when the loop start frame of the joint animation is changed
   */
  public readonly onJointAnimationLoopRangeChangedObservable: BABYLON.Observable<RuntimeAnimationRange> =
    new BABYLON.Observable()

  /**
   * Notify observers when the duration of the morph target animation is changed
   */
  public readonly onMorphTargetDurationChangedObservable: BABYLON.Observable<number> =
    new BABYLON.Observable()
  /**
   * Notify observers when the first morph target animation is received
   */
  public readonly onFirstMorphTargetAnimationObservable: BABYLON.Observable<number> =
    new BABYLON.Observable()
  /**
   * Notify observers when the morph target animation is cleared
   */
  public readonly onClearMorphTargetAnimationObservable: BABYLON.Observable<void> =
    new BABYLON.Observable()

  constructor() {}

  /**
   * Set joint animation data.
   *
   * @param animation The skeletal animation data to set.
   */
  public setJointAnimation(animation: RuntimeSkeletalAnimationData) {
    this._jointRot = animation.rotQuat
    this._globalTrans = animation.transl
    this._nJointFrames = animation.rotQuat.length

    if (animation.loopable) {
      this.onJointAnimationLoopRangeChangedObservable.notifyObservers(
        animation.loopRange,
      )
      this.onJointDurationChangedObservable.notifyObservers(animation.loopRange.end)
    } else {
      this.onJointDurationChangedObservable.notifyObservers(this._nJointFrames)
    }
  }

  /**
   * Append joint animation data to existing data.
   *
   * @param jointRot Joint rotation quaternions to append.
   * @param globalTrans Global translation vectors to append.
   */
  public appendJointAnimation(
    jointRot: BABYLON.Quaternion[][],
    globalTrans: BABYLON.Vector3[],
  ) {
    this._nJointFrames += jointRot.length
    if (this._jointRot === null) {
      this._jointRot = jointRot
      this.onFirstJointAnimationObservable.notifyObservers(this._nJointFrames)
    } else {
      this._jointRot = this._jointRot.concat(jointRot)
    }

    if (this._globalTrans === null) {
      this._globalTrans = globalTrans
    } else {
      this._globalTrans = this._globalTrans.concat(globalTrans)
    }

    this.onJointDurationChangedObservable.notifyObservers(this._nJointFrames)
  }

  /**
   * Clear all joint animation data.
   */
  public clearJointAnimation() {
    this._jointRot = null
    this._globalTrans = null
    this._nJointFrames = 0
    this.onClearJointAnimationObservable.notifyObservers()
  }

  /**
   * Set morph target values for face animation.
   *
   * @param morphTargetValues The morph target values to set.
   * @param nFrames Number of frames in the animation.
   */
  public setMorphTargetValues(
    morphTargetValues: MorphTargetValues,
    nFrames: number,
  ) {
    this._nMorphTargetFrames = nFrames
    this._morphTargetValues = morphTargetValues
    this.onMorphTargetDurationChangedObservable.notifyObservers(nFrames)
  }

  /**
   * Append morph target values to existing values.
   *
   * @param morphTargetValues The morph target values to append.
   * @param nFrames Number of frames to append.
   */
  public appendMorphTargetValues(
    morphTargetValues: MorphTargetValues,
    nFrames: number,
  ) {
    this._nMorphTargetFrames += nFrames
    if (Object.keys(this.morphTargetValues).length === 0) {
      this.morphTargetValues = morphTargetValues
      this.onFirstMorphTargetAnimationObservable.notifyObservers(nFrames)
    } else {
      Object.keys(morphTargetValues).forEach((morphTargetName: string) => {
        this.morphTargetValues[morphTargetName] = this.morphTargetValues[
          morphTargetName
        ].concat(morphTargetValues[morphTargetName])
      })
    }

    this.onMorphTargetDurationChangedObservable.notifyObservers(
      this._nMorphTargetFrames,
    )
  }

  /**
   * Clear all morph target values.
   */
  public clearMorphTargetValues() {
    this.morphTargetValues = {}
    this._nMorphTargetFrames = 0
    this.onClearMorphTargetAnimationObservable.notifyObservers()
  }

  /**
   * Set joint rotation data.
   *
   * @param jointRot Joint rotation quaternions.
   */
  set jointRot(jointRot: BABYLON.Quaternion[][]) {
    this._jointRot = jointRot
  }

  /**
   * Set global translation data.
   *
   * @param globalTrans Global translation vectors.
   */
  set globalTrans(globalTrans: BABYLON.Vector3[]) {
    this._globalTrans = globalTrans
  }

  /**
   * Set morph target values.
   *
   * @param morphTargetValues Morph target values.
   */
  set morphTargetValues(morphTargetValues: MorphTargetValues) {
    this._morphTargetValues = morphTargetValues
  }

  /**
   * Set number of joint frames.
   *
   * @param nJointFrames Number of joint frames.
   */
  set nJointFrames(nJointFrames: number) {
    this._nJointFrames = nJointFrames
  }

  /**
   * Set number of morph target frames.
   *
   * @param nMorphTargetFrames Number of morph target frames.
   */
  set nMorphTargetFrames(nMorphTargetFrames: number) {
    this._nMorphTargetFrames = nMorphTargetFrames
  }

  /**
   * Get joint rotation data.
   *
   * @returns Joint rotation quaternions or null if not set.
   */
  get jointRot(): BABYLON.Quaternion[][] | null {
    return this._jointRot
  }

  /**
   * Get global translation data.
   *
   * @returns Global translation vectors or null if not set.
   */
  get globalTrans(): BABYLON.Vector3[] | null {
    return this._globalTrans
  }

  /**
   * Get morph target values.
   *
   * @returns Morph target values.
   */
  get morphTargetValues(): MorphTargetValues {
    return this._morphTargetValues
  }

  /**
   * Get number of joint frames.
   *
   * @returns Number of joint frames.
   */
  get nJointFrames(): number {
    return this._nJointFrames
  }

  /**
   * Get number of morph target frames.
   *
   * @returns Number of morph target frames.
   */
  get nMorphTargetFrames(): number {
    return this._nMorphTargetFrames
  }
}
