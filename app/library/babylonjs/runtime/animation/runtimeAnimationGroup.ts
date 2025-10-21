import * as BABYLON from '@babylonjs/core'
import { Arithmetic, GlobalState } from '@/library/babylonjs/core'
import { BONES_TO_EXCLUDE } from '@/library/babylonjs/runtime/character'
import {
  MotionClip,
  FaceClip,
  RuntimeAnimationRange,
  RuntimeAnimation,
  RuntimeFaceAnimationData,
  RuntimeSkeletalAnimationData,
  MorphTargetValues,
} from '@/library/babylonjs/runtime/animation'
import { Logger } from '@/library/babylonjs/utils'

/**
 * Enumeration of runtime buffer types.
 *
 * Defines the different types of animation buffers used in the runtime system.
 */
export enum RuntimeBufferType {
  /** Long idle animation buffer. */
  LONG_IDLE = 'LONG_IDLE',
  /** Local animation buffer. */
  LOCAL = 'LOCAL',
  /** Streamed animation buffer. */
  STREAMED = 'STREAMED',
}

/**
 * RuntimeAnimationGroup
 *
 * A comprehensive animation management class that handles both skeletal and facial
 * animations. Manages multiple animation buffers (long idle, local, streamed),
 * morph targets, joint mappings, and provides methods for switching between
 * different animation types and managing animation playback.
 */
export class RuntimeAnimationGroup {
  /** Global state object containing scene and runtime information. */
  private _globalState: GlobalState
  /** Face mesh for morph target animations. */
  private _faceMesh: BABYLON.Mesh | null = null
  /** Root bone transform node of the skeleton. */
  private _rootBoneTransformNode: BABYLON.TransformNode | null = null
  /** Hips bone transform node for root motion. */
  private _hipsBoneTransformNode: BABYLON.TransformNode | null = null

  /** Long idle animation buffer for background animations. */
  private _longIdleAnimation: RuntimeAnimation = new RuntimeAnimation()
  /** Local animation buffer for local animations. */
  private _localAnimation: RuntimeAnimation = new RuntimeAnimation()
  /** Streamed animation buffer for real-time streaming animations. */
  private _streamedAnimation: RuntimeAnimation = new RuntimeAnimation()

  /** Mapping of morph target names to their BabylonJS morph target objects. */
  public morphTargetMap: Record<string, BABYLON.MorphTarget> = {}
  /** Mapping of morph target indices to their names. */
  public morphTargetIndexMap: Record<number, string> = {}
  /** Mapping of joint names to their transform nodes. */
  public jointNodeMap: Record<string, BABYLON.TransformNode> = {}
  /** Mapping of joint names to their indices in animation data. */
  public jointMap: Record<string, number> = {}

  /** Array of morph target names. */
  public morphTargetNames: string[] | null = null
  /** Number of morph targets. */
  public morphTargetSize: number | null = null
  /** Data type for morph target values. */
  public morphTargetDataType: Arithmetic | null = null

  /** Local joint animations indexed by motion label. */
  private _jointAnimationsLocal: Record<string, RuntimeSkeletalAnimationData[]> = {}
  /** Local morph target animations indexed by motion label. */
  private _morphTargetAnimationsLocal: Record<string, RuntimeFaceAnimationData> = {}

  /** Counter for eye joint idle state. */
  private _eyeJointIdleCounter: number = 0

  /** Lower bound threshold for eye joint animation detection. */
  private readonly _eyeJointAnimationLowerBound: number = 3

  /** Threshold for enabling eye tracking after idle period. */
  private readonly _eyeJointAnimationThreshold: number = 0.0001

  /** Non-uniform scaling factor for character mesh. */
  private _nonuniformScaling: number = 1

  /**
   * Create a new RuntimeAnimationGroup instance.
   *
   * @param globalState The global state object containing scene and runtime information.
   */
  constructor(globalState: GlobalState) {
    this._globalState = globalState
  }

  /**
   * Switch to a different joint animation.
   *
   * @param motionLabel The label of the motion to switch to.
   * @param target The target buffer type to switch to.
   */
  public switchJointAnimation(motionLabel: string, target: RuntimeBufferType) {
    if (!Object.keys(this._jointAnimationsLocal).includes(motionLabel)) {
      Logger.error(`Joint animation for ${motionLabel} not found`)
      return
    }

    const randomInt = (min: number, max: number) => {
      return Math.floor(Math.random() * (max - min + 1)) + min
    }

    const animations = this._jointAnimationsLocal[motionLabel]
    const idx = randomInt(0, animations.length - 1)
    const animation = animations[idx]
    if (Object.keys(this.jointMap).length !== animation.jointNames.length) {
      this._updateJointMap(animation.jointNames)
    }
    this.setJointAnimationData(animation, target)
  }

  /**
   * Switch to a different morph target animation.
   *
   * @param motionLabel The label of the motion to switch to.
   * @param target The target buffer type to switch to.
   */
  public switchMorphTargetAnimation(motionLabel: string, target: RuntimeBufferType) {
    if (!Object.keys(this._morphTargetAnimationsLocal).includes(motionLabel)) {
      this.clearMorphTargetData(target)
      return
    }

    const animation = this._morphTargetAnimationsLocal[motionLabel]
    this.setFaceAnimationData(animation, target)
  }

  /**
   * Convert a MotionClip to RuntimeSkeletalAnimationData.
   *
   * @param motionClip The motion clip to convert.
   * @param loopable Whether the animation is loopable. Defaults to false.
   * @param loopRange The loop range for the animation. Defaults to empty range.
   * @returns The converted skeletal animation data.
   */
  private _motionClip2RuntimeAnimation(
    motionClip: MotionClip,
    loopable: boolean = false,
    loopRange: RuntimeAnimationRange = new RuntimeAnimationRange(),
  ): RuntimeSkeletalAnimationData {
    const rotMat: BABYLON.Quaternion[][] = []
    const transl: BABYLON.Vector3[] = []

    for (let i = 0; i < motionClip.nFrames; i++) {
      const frameData = motionClip.jointRotmat[i]
      const frameRotQuat: BABYLON.Quaternion[] = []
      for (let j = 0; j < motionClip.jointNames.length; j++) {
        const jMat = frameData[j]
        // BabylonJS uses row-major order
        const jRotMat = BABYLON.Matrix.FromValues(
          jMat[0][0],
          jMat[1][0],
          jMat[2][0],
          0,
          jMat[0][1],
          jMat[1][1],
          jMat[2][1],
          0,
          jMat[0][2],
          jMat[1][2],
          jMat[2][2],
          0,
          0,
          0,
          0,
          1,
        )
        const jRotQuat = BABYLON.Quaternion.FromRotationMatrix(jRotMat)
        frameRotQuat.push(jRotQuat)
      }
      rotMat.push(frameRotQuat)
    }
    for (let i = 0; i < motionClip.nFrames; i++) {
      transl.push(
        new BABYLON.Vector3(
          motionClip.rootWorldPosition[i][0],
          motionClip.rootWorldPosition[i][1],
          motionClip.rootWorldPosition[i][2],
        ),
      )
    }

    return {
      rotQuat: rotMat,
      transl: transl,
      jointNames: motionClip.jointNames,
      loopable: loopable,
      loopRange: loopRange,
    }
  }

  /**
   * Convert a FaceClip to RuntimeFaceAnimationData.
   *
   * @param faceClip The face clip to convert.
   * @returns The converted face animation data.
   */
  private _faceClip2RuntimeAnimation(faceClip: FaceClip): RuntimeFaceAnimationData {
    const morphTargetValues: MorphTargetValues = {}
    const morphTargetSize = faceClip.blendShapeNames.length

    for (let mid = 0; mid < morphTargetSize; mid++) {
      const morphTargetName = faceClip.blendShapeNames[mid]
      morphTargetValues[morphTargetName] = []
    }
    const nFrames = faceClip.length()
    for (let fid = 0; fid < nFrames; fid++) {
      for (let mid = 0; mid < morphTargetSize; mid++) {
        const morphTargetName = faceClip.blendShapeNames[mid]
        morphTargetValues[morphTargetName].push(faceClip.blendShapeValues[fid][mid])
      }
    }

    return {
      nFrames: nFrames,
      morphTargetValues: morphTargetValues,
    }
  }

  /**
   * Set a morph target animation clip for local playback.
   *
   * @param motionLabel The label for the motion.
   * @param faceClip The face clip to set.
   */
  public setMorphTargetAnimationClipLocal(motionLabel: string, faceClip: FaceClip) {
    const runtimeAnimation = this._faceClip2RuntimeAnimation(faceClip)

    this._morphTargetAnimationsLocal[motionLabel] = runtimeAnimation
  }

  /**
   * Add a joint animation clip for local playback.
   *
   * @param motionLabel The label for the motion.
   * @param motionClip The motion clip to add.
   * @param loopable Whether the animation is loopable. Defaults to false.
   * @param loopRange The loop range for the animation. Defaults to empty range.
   */
  public addJointAnimationClipLocal(
    motionLabel: string,
    motionClip: MotionClip,
    loopable: boolean = false,
    loopRange: RuntimeAnimationRange = new RuntimeAnimationRange(),
  ) {
    if (this._jointAnimationsLocal[motionLabel] === undefined) {
      this._jointAnimationsLocal[motionLabel] = []
    }
    const runtimeAnimation = this._motionClip2RuntimeAnimation(
      motionClip,
      loopable,
      loopRange,
    )
    this._jointAnimationsLocal[motionLabel].push(runtimeAnimation)
  }

  /**
   * Initialize morph targets for the face mesh.
   *
   * @param name The name of the face mesh to initialize morph targets for.
   */
  public initializeMorphTargets(name: string) {
    this._faceMesh = this._globalState.scene.getMeshByName(name) as BABYLON.Mesh
    if (this._faceMesh.morphTargetManager === null) {
      Logger.error('Morph target not found for face mesh')
      return
    }
    const nMorphTargets = this._faceMesh.morphTargetManager.numTargets
    for (let i = 0; i < nMorphTargets; i++) {
      const target = this._faceMesh.morphTargetManager.getTarget(i)
      this.morphTargetMap[target.name] = target
      this.morphTargetIndexMap[i] = target.name
    }
  }

  /**
   * Initialize the animation group with a skeleton.
   *
   * @param skeleton The BabylonJS skeleton to initialize with.
   */
  public initialize(skeleton: BABYLON.Skeleton) {
    const rootBoneName = skeleton.bones[0].name
    this._rootBoneTransformNode =
      this._globalState.scene.getTransformNodeByName(rootBoneName)
    if (this._rootBoneTransformNode !== null) {
      this._hipsBoneTransformNode =
        this._rootBoneTransformNode.getChildTransformNodes(true)[0]
      this.mapBones(this._rootBoneTransformNode)
    } else {
      Logger.error('Root bone not found')
    }
  }

  /**
   * Update the joint mapping with new joint names.
   *
   * @param jointNames Array of joint names to map.
   */
  private _updateJointMap(jointNames: string[]) {
    this.jointMap = {}
    const nJoints = jointNames.length
    for (let i = 0; i < nJoints; i++) {
      if (BONES_TO_EXCLUDE.includes(jointNames[i])) {
        continue
      }
      this.jointMap[jointNames[i]] = i
    }
  }

  /**
   * Recursively map bones to their transform nodes.
   *
   * @param node The transform node to map and process its children.
   */
  private mapBones(node: BABYLON.TransformNode) {
    this.jointNodeMap[node.name] = node
    node.getChildTransformNodes(true).forEach(childNode => {
      this.mapBones(childNode)
    })
  }

  /**
   * Append morph target values to the streamed animation buffer.
   *
   * @param srcMorphTargetValues The morph target values to append.
   * @param nFrames Number of frames to append.
   */
  public appendMorphTargetValuesStreamed(
    srcMorphTargetValues: MorphTargetValues,
    nFrames: number,
  ) {
    this._streamedAnimation.appendMorphTargetValues(srcMorphTargetValues, nFrames)
  }

  /**
   * Set face animation data for a specific buffer type.
   *
   * @param animationData The face animation data to set.
   * @param target The target buffer type.
   */
  public setFaceAnimationData(
    animationData: RuntimeFaceAnimationData | null,
    target: RuntimeBufferType,
  ) {
    if (animationData === null) {
      Logger.warn('Empty face animation data')
      return
    }
    switch (target) {
      case RuntimeBufferType.LONG_IDLE:
        this._longIdleAnimation.setMorphTargetValues(
          animationData.morphTargetValues,
          animationData.nFrames,
        )
        break
      case RuntimeBufferType.LOCAL:
        this._localAnimation.setMorphTargetValues(
          animationData.morphTargetValues,
          animationData.nFrames,
        )
        break
      case RuntimeBufferType.STREAMED:
        this._streamedAnimation.setMorphTargetValues(
          animationData.morphTargetValues,
          animationData.nFrames,
        )
        break
      default:
        Logger.error(`Undefined target: ${target}`)
        break
    }
  }

  /**
   * Set joint animation data for a specific buffer type.
   *
   * @param animation The skeletal animation data to set.
   * @param target The target buffer type.
   */
  public setJointAnimationData(
    animation: RuntimeSkeletalAnimationData,
    target: RuntimeBufferType,
  ) {
    switch (target) {
      case RuntimeBufferType.LONG_IDLE:
        this._longIdleAnimation.setJointAnimation(animation)
        break
      case RuntimeBufferType.LOCAL:
        this._localAnimation.setJointAnimation(animation)
        break
      case RuntimeBufferType.STREAMED:
        this._streamedAnimation.setJointAnimation(animation)
        break
      default:
        Logger.error(`Undefined target: ${target}`)
        break
    }
  }

  /**
   * Clear joint animation data for a specific buffer type.
   *
   * @param target The target buffer type to clear.
   */
  public clearJointAnimationData(target: RuntimeBufferType) {
    switch (target) {
      case RuntimeBufferType.STREAMED:
        this._streamedAnimation.clearJointAnimation()
        break
      case RuntimeBufferType.LOCAL:
        this._localAnimation.clearJointAnimation()
        break
      case RuntimeBufferType.LONG_IDLE:
        this._longIdleAnimation.clearJointAnimation()
        break
      default:
        Logger.error(`Undefined target: ${target}`)
        break
    }
  }

  /**
   * Clear morph target data for a specific buffer type.
   *
   * @param target The target buffer type to clear.
   */
  public clearMorphTargetData(target: RuntimeBufferType) {
    switch (target) {
      case RuntimeBufferType.LONG_IDLE:
        this._longIdleAnimation.clearMorphTargetValues()
        break
      case RuntimeBufferType.LOCAL:
        this._localAnimation.clearMorphTargetValues()
        break
      case RuntimeBufferType.STREAMED:
        this._streamedAnimation.clearMorphTargetValues()
        break
      default:
        Logger.error(`Undefined target: ${target}`)
        break
    }
  }

  /**
   * Append joint animation data to the streamed animation buffer.
   *
   * @param jointRot Array of joint rotations for each frame.
   * @param globalTrans Array of global translations for each frame.
   */
  public appendJointAnimationDataStreamed(
    jointRot: BABYLON.Quaternion[][],
    globalTrans: BABYLON.Vector3[],
  ) {
    this._streamedAnimation.appendJointAnimation(jointRot, globalTrans)
  }

  /**
   * Go to a specific frame with blending between left and right animations.
   *
   * @param jointFrameIndexLHS Left-hand side joint frame index.
   * @param jointFrameIndexRHS Right-hand side joint frame index.
   * @param jointBlendWeightRHS Right-hand side joint blend weight.
   * @param morphTargetFrameIndexLHS Left-hand side morph target frame index.
   * @param morphTargetFrameIndexRHS Right-hand side morph target frame index.
   * @param morphTargetBlendWeightRHS Right-hand side morph target blend weight.
   * @param target The target buffer type.
   */
  public goToFrame(
    jointFrameIndexLHS: number,
    jointFrameIndexRHS: number,
    jointBlendWeightRHS: number,
    morphTargetFrameIndexLHS: number,
    morphTargetFrameIndexRHS: number,
    morphTargetBlendWeightRHS: number,
    target: RuntimeBufferType,
  ) {
    const lhs = this._longIdleAnimation
    const rhs =
      target === RuntimeBufferType.STREAMED
        ? this._streamedAnimation
        : this._localAnimation

    if (
      lhs.nJointFrames === 0 ||
      lhs.jointRot === null ||
      lhs.globalTrans === null
    ) {
      return
    }
    if (jointFrameIndexLHS >= lhs.nJointFrames) {
      jointFrameIndexLHS = lhs.nJointFrames - 1
    }
    if (rhs.nJointFrames !== null && jointFrameIndexRHS >= rhs.nJointFrames) {
      jointFrameIndexRHS = rhs.nJointFrames - 1
    }

    if (
      morphTargetFrameIndexLHS > 0 &&
      morphTargetFrameIndexLHS >= lhs.nMorphTargetFrames
    ) {
      morphTargetFrameIndexLHS = lhs.nMorphTargetFrames - 1
    }
    if (
      rhs.nMorphTargetFrames !== null &&
      morphTargetFrameIndexRHS >= rhs.nMorphTargetFrames
    ) {
      morphTargetFrameIndexRHS = rhs.nMorphTargetFrames - 1
    }

    const rotLHS: BABYLON.Quaternion[] = lhs.jointRot[jointFrameIndexLHS]
    const translLHS: BABYLON.Vector3 = lhs.globalTrans[jointFrameIndexLHS]
    const rotRHS: BABYLON.Quaternion[] =
      rhs.jointRot === null ? rotLHS : rhs.jointRot[jointFrameIndexRHS]
    const translRHS: BABYLON.Vector3 =
      rhs.globalTrans === null ? translLHS : rhs.globalTrans[jointFrameIndexRHS]

    if (this._hipsBoneTransformNode) {
      this._hipsBoneTransformNode.position = BABYLON.Vector3.Lerp(
        translLHS.scale(1 / this._nonuniformScaling),
        translRHS.scale(1 / this._nonuniformScaling),
        jointBlendWeightRHS,
      )
    }
    Object.keys(this.jointMap).forEach((jointName: string) => {
      const jid = this.jointMap[jointName]
      if (jointName === 'Eye_L' || jointName === 'Eye_R') {
        const delta =
          Math.sqrt(rotRHS[jid].x) +
          Math.sqrt(rotRHS[jid].y) +
          Math.sqrt(rotRHS[jid].z) +
          Math.sqrt(rotRHS[jid].w)
        if (delta <= this._eyeJointAnimationLowerBound) {
          this._eyeJointIdleCounter += 1
          return
        } else {
          this._eyeJointIdleCounter = 0
          if (this._globalState.eyeTracker?.eyeTrackingEnabled) {
            this._globalState.eyeTracker.eyeTrackingEnabled = false
          }
        }
      }
      const rot = BABYLON.Quaternion.Slerp(
        rotLHS[jid],
        rotRHS[jid],
        jointBlendWeightRHS,
      )
      const jointTransformNode = this.jointNodeMap[jointName]
      jointTransformNode.rotationQuaternion = rot
    })

    if (this._eyeJointIdleCounter >= this._eyeJointAnimationThreshold) {
      // enable eye tracking
      if (
        this._globalState.eyeTracker &&
        !this._globalState.eyeTracker.eyeTrackingEnabled
      ) {
        this._globalState.eyeTracker.eyeTrackingEnabled = true
      }
    }

    if (lhs.nMorphTargetFrames === 0 && rhs.nMorphTargetFrames === 0) {
      return
    }

    let morphTargetValueLHS: number = 0,
      morphTargetValueRHS: number = 0

    Object.keys(this.morphTargetMap).forEach((morphTargetName: string) => {
      const target = this.morphTargetMap[morphTargetName]
      if (
        lhs.morphTargetValues[morphTargetName] &&
        lhs.morphTargetValues[morphTargetName][morphTargetFrameIndexLHS]
      ) {
        morphTargetValueLHS =
          lhs.morphTargetValues[morphTargetName][morphTargetFrameIndexLHS]
      } else {
        morphTargetValueLHS = 0
      }

      if (
        rhs.morphTargetValues[morphTargetName] &&
        rhs.morphTargetValues[morphTargetName][morphTargetFrameIndexRHS]
      ) {
        morphTargetValueRHS =
          rhs.morphTargetValues[morphTargetName][morphTargetFrameIndexRHS]
      } else {
        morphTargetValueRHS = 0
      }
      const influence =
        morphTargetBlendWeightRHS * morphTargetValueRHS +
        (1 - morphTargetBlendWeightRHS) * morphTargetValueLHS
      target.influence = influence
    })
  }

  /**
   * Get the number of joint frames in the long idle buffer.
   *
   * @returns Number of joint frames in the long idle buffer.
   */
  get nJointFramesLongIdle(): number {
    return this._longIdleAnimation.nJointFrames
  }

  /**
   * Get the number of joint frames in the streamed buffer.
   *
   * @returns Number of joint frames in the streamed buffer.
   */
  get nJointFramesStreamed(): number {
    return this._streamedAnimation.nJointFrames
  }

  /**
   * Get the long idle animation buffer.
   *
   * @returns The long idle animation buffer.
   */
  get longIdleBuffer(): RuntimeAnimation {
    return this._longIdleAnimation
  }

  /**
   * Get the local animation buffer.
   *
   * @returns The local animation buffer.
   */
  get localBuffer(): RuntimeAnimation {
    return this._localAnimation
  }

  /**
   * Get the streamed animation buffer.
   *
   * @returns The streamed animation buffer.
   */
  get streamedBuffer(): RuntimeAnimation {
    return this._streamedAnimation
  }

  /**
   * Set the non-uniform scaling factor for character mesh.
   *
   * @param scaling The non-uniform scaling factor.
   */
  set nonuniformScaling(scaling: number) {
    this._nonuniformScaling = scaling
  }
}
