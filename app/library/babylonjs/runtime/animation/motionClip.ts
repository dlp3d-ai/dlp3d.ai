import { Logger } from '@/library/babylonjs/utils'

export interface MotionClipDict {
  jointNames: string[]
  rotmat: number[][][][]
  transl: number[][]
  len: number
  priority: number
  leftPriority?: number
  rightPriority?: number
  timelineStartIdx?: number
  restposeName?: string
  motionRecordId?: number
}

/**
 * MotionClip
 *
 * A class for motion joint matrix basis rotation and armature
 * translation.
 */
export class MotionClip {
  /**
   * Number of frames in the motion clip.
   */
  public nFrames: number
  /**
   * Names of the joints in the motion clip.
   */
  public jointNames: string[]
  /**
   * Joint rotation matrices of shape (n_frames, n_joints, 3, 3).
   */
  public jointRotmat: number[][][][]
  /**
   * Root world position of shape (n_frames, 3).
   */
  public rootWorldPosition: number[][]
  /**
   * Priority of the motion clip.
   */
  public priority: number
  /**
   * Restpose name. Not necessary for motions
   * older than August 2024.
   */
  public restposeName: string | null
  /**
   * Motion record ID.
   */
  public motionRecordId: number | null
  /**
   * Timeline start index.
   */
  public timelineStartIdx: number | null

  constructor(
    nFrames: number,
    jointNames: string[],
    jointRotmat: number[][][][],
    rootWorldPosition: number[][],
    priority: number = 0,
    restposeName: string | null = null,
    motionRecordId: number | null = null,
    timelineStartIdx: number | null = null,
  ) {
    this.nFrames = nFrames
    this.jointNames = jointNames
    const nJoints = jointNames.length

    if (nJoints !== jointRotmat[0].length) {
      const msg = `jointNames length ${nJoints} != jointRotmat.shape[1] ${jointRotmat[0].length}`
      Logger.error(msg)
      throw new Error(msg)
    }

    if (nFrames !== jointRotmat.length) {
      const msg = `nFrames ${nFrames} != jointRotmat.shape[0] ${jointRotmat.length}`
      Logger.error(msg)
      throw new Error(msg)
    }

    this.jointRotmat = jointRotmat
    this.rootWorldPosition = rootWorldPosition
    this.priority = priority
    this.restposeName = restposeName
    this.motionRecordId = motionRecordId
    this.timelineStartIdx = timelineStartIdx
  }

  /**
   * Get the number of frames in the motion clip.
   *
   * @returns The number of frames.
   */
  public length(): number {
    return this.nFrames
  }

  /**
   * Set joint rotation matrices.
   *
   * @param jointRotmat Joint rotation matrices with shape (n_frames, n_joints, 3, 3).
   * @param jointNames List of joint names.
   * @throws {Error} if the number of joints in jointRotmat doesn't match jointNames length.
   * @throws {Error} if the number of frames doesn't match the current MotionClip's nFrames.
   */
  public setJointRotmat(jointRotmat: number[][][][], jointNames: string[]): void {
    const nJointsRotMat = jointRotmat[0].length
    const nJointsList = jointNames.length

    if (nJointsRotMat !== nJointsList) {
      const msg = `Number of joints in jointRotmat ${nJointsRotMat} doesn't match number of joints in jointNames ${nJointsList}`
      Logger.error(msg)
      throw new Error(msg)
    }

    const nFrames = jointRotmat.length
    if (nFrames !== this.nFrames) {
      const msg = `Number of frames in jointRotmat ${nFrames} doesn't match current MotionClip's nFrames ${this.nFrames}`
      Logger.error(msg)
      throw new Error(msg)
    }

    this.jointNames = jointNames
    this.jointRotmat = jointRotmat
  }

  /**
   * Clone the motion clip.
   *
   * @returns A new motion clip with the same data.
   */
  public clone(): MotionClip {
    return new MotionClip(
      this.nFrames,
      [...this.jointNames],
      this.jointRotmat.map(frame => frame.map(joint => joint.map(row => [...row]))),
      this.rootWorldPosition.map(pos => [...pos]),
      this.priority,
      this.restposeName,
      this.motionRecordId,
      this.timelineStartIdx,
    )
  }

  /**
   * Slice the motion clip.
   *
   * @param startFrame Start frame index.
   * @param endFrame End frame index.
   * @returns A new motion clip containing the sliced frames.
   */
  public slice(startFrame: number, endFrame: number): MotionClip {
    return new MotionClip(
      endFrame - startFrame,
      [...this.jointNames],
      this.jointRotmat
        .slice(startFrame, endFrame)
        .map(frame => frame.map(joint => joint.map(row => [...row]))),
      this.rootWorldPosition.slice(startFrame, endFrame).map(pos => [...pos]),
      this.priority,
      this.restposeName,
    )
  }

  /**
   * Convert the motion clip to a dictionary.
   *
   * @param type Type of conversion, only 'retrieval' is supported. Defaults to 'retrieval'.
   * @returns A dictionary representation of the motion clip.
   */
  public toDict(type: string = 'retrieval'): MotionClipDict {
    if (type === 'retrieval') {
      const retDict: MotionClipDict = {
        jointNames: this.jointNames,
        rotmat: this.jointRotmat,
        transl: this.rootWorldPosition,
        len: this.nFrames,
        priority: this.priority,
        timelineStartIdx: this.timelineStartIdx || undefined,
      }

      if (this.restposeName !== null) {
        retDict.restposeName = this.restposeName
      }

      return retDict
    } else {
      const msg = `Unsupported type ${type}`
      Logger.error(msg)
      throw new Error(msg)
    }
  }

  /**
   * Create a motion clip from a dictionary.
   *
   * @param motionDict The dictionary to create the motion clip from.
   * @returns A new motion clip.
   */
  public static fromDict(motionDict: MotionClipDict): MotionClip {
    return new MotionClip(
      motionDict.len,
      motionDict.jointNames,
      motionDict.rotmat,
      motionDict.transl,
      motionDict.priority,
      motionDict.restposeName || null,
      motionDict.motionRecordId || null,
      motionDict.timelineStartIdx || null,
    )
  }

  /**
   * Concatenate multiple motion clips.
   *
   * @param motionClips The motion clips to concatenate.
   * @returns A new motion clip containing the concatenated data.
   */
  public static concat(motionClips: MotionClip[]): MotionClip {
    if (motionClips.length <= 0) {
      const msg = 'MotionClip.concat() receives empty motionClips'
      Logger.error(msg)
      throw new Error(msg)
    }

    const nFrames = motionClips.reduce((sum, mc) => sum + mc.nFrames, 0)
    const restposeName = motionClips[0].restposeName
    const jointNames = motionClips[0].jointNames
    const timelineStartIdx = motionClips[0].timelineStartIdx

    // Check restpose name and joint names
    for (let idx = 1; idx < motionClips.length; idx++) {
      const curRestposeName = motionClips[idx].restposeName
      if (restposeName !== null) {
        if (curRestposeName !== restposeName) {
          const msg = `MotionClip.concat() receives motionClips with different restposeName.\nClip0: ${restposeName}\nClip${idx}: ${curRestposeName}`
          Logger.error(msg)
          throw new Error(msg)
        }
      }

      const curJointNames = motionClips[idx].jointNames
      if (JSON.stringify(curJointNames) !== JSON.stringify(jointNames)) {
        const msg = `MotionClip.concat() receives motionClips with different jointNames. Clip0: ${jointNames}, Clip${idx}: ${curJointNames}`
        Logger.error(msg)
        throw new Error(msg)
      }
    }

    // Concatenate joint rotation matrices
    const jointRotmat: number[][][][] = []
    for (const clip of motionClips) {
      jointRotmat.push(
        ...clip.jointRotmat.map(frame =>
          frame.map(joint => joint.map(row => [...row])),
        ),
      )
    }

    // Concatenate root world positions
    const rootWorldPosition = motionClips.flatMap(mc =>
      mc.rootWorldPosition.map(pos => [...pos]),
    )

    const priority = Math.max(
      motionClips[0].priority,
      motionClips[motionClips.length - 1].priority,
    )

    return new MotionClip(
      nFrames,
      jointNames,
      jointRotmat,
      rootWorldPosition,
      priority,
      restposeName,
      null,
      timelineStartIdx,
    )
  }
}

/**
 * MotionClipWithBidirectionalPriority
 *
 * A class for motion clips with bidirectional priority.
 */
export class MotionClipWithBidirectionalPriority extends MotionClip {
  /**
   * Left priority of the motion clip.
   */
  public leftPriority: number
  /**
   * Right priority of the motion clip.
   */
  public rightPriority: number

  constructor(
    nFrames: number,
    jointNames: string[],
    jointRotmat: number[][][][],
    rootWorldPosition: number[][],
    leftPriority: number = 0,
    rightPriority: number = 0,
    restposeName: string | null = null,
    motionRecordId: number | null = null,
    timelineStartIdx: number | null = null,
  ) {
    super(
      nFrames,
      jointNames,
      jointRotmat,
      rootWorldPosition,
      Math.max(leftPriority, rightPriority),
      restposeName,
      motionRecordId,
      timelineStartIdx,
    )
    this.leftPriority = leftPriority
    this.rightPriority = rightPriority
  }

  /**
   * Create a motion clip with bidirectional priority from a dictionary.
   *
   * @param motionDict The dictionary to create the motion clip from.
   * @returns A new motion clip with bidirectional priority.
   */
  public static fromDict(
    motionDict: MotionClipDict,
  ): MotionClipWithBidirectionalPriority {
    const motionClip = new MotionClipWithBidirectionalPriority(
      motionDict.len,
      motionDict.jointNames,
      motionDict.rotmat,
      motionDict.transl,
      motionDict.leftPriority || 0,
      motionDict.rightPriority || 0,
      motionDict.restposeName || null,
      motionDict.motionRecordId || null,
      motionDict.timelineStartIdx || null,
    )
    motionClip.priority = motionDict.priority
    return motionClip
  }

  /**
   * Convert the motion clip to a dictionary.
   *
   * @param type The type of dictionary to convert to. Currently only supports 'retrieval'.
   * @returns A dictionary representation of the motion clip.
   */
  public toDict(type: string = 'retrieval'): MotionClipDict {
    if (type === 'retrieval') {
      const retDict = super.toDict(type)
      retDict.leftPriority = this.leftPriority
      retDict.rightPriority = this.rightPriority
      return retDict
    } else {
      const msg = `Unsupported type ${type}`
      Logger.error(msg)
      throw new Error(msg)
    }
  }

  /**
   * Slice the motion clip.
   *
   * @param startFrame Start frame index.
   * @param endFrame End frame index.
   * @returns A new motion clip with bidirectional priority containing the sliced frames.
   */
  public slice(
    startFrame: number,
    endFrame: number,
  ): MotionClipWithBidirectionalPriority {
    const baseClip = super.slice(startFrame, endFrame)
    return new MotionClipWithBidirectionalPriority(
      baseClip.nFrames,
      baseClip.jointNames,
      baseClip.jointRotmat,
      baseClip.rootWorldPosition,
      this.leftPriority,
      this.rightPriority,
      this.restposeName,
    )
  }

  /**
   * Clone the motion clip.
   *
   * @returns A new motion clip with bidirectional priority with the same data.
   */
  public clone(): MotionClipWithBidirectionalPriority {
    return new MotionClipWithBidirectionalPriority(
      this.nFrames,
      [...this.jointNames],
      this.jointRotmat.map(frame => frame.map(joint => joint.map(row => [...row]))),
      this.rootWorldPosition.map(pos => [...pos]),
      this.leftPriority,
      this.rightPriority,
      this.restposeName,
      this.motionRecordId,
      this.timelineStartIdx,
    )
  }

  /**
   * Concatenate multiple motion clips with bidirectional priority.
   *
   * @param motionClips The motion clips to concatenate.
   * @returns A new motion clip with bidirectional priority containing the concatenated data.
   */
  public static concat(
    motionClips: MotionClipWithBidirectionalPriority[],
  ): MotionClipWithBidirectionalPriority {
    const leftPriority = motionClips[0].leftPriority
    const rightPriority = motionClips[motionClips.length - 1].rightPriority
    const motionClip = MotionClip.concat(motionClips)
    const biMotionClip = this.fromMotionClip(motionClip)
    biMotionClip.leftPriority = leftPriority
    biMotionClip.rightPriority = rightPriority
    return biMotionClip
  }

  /**
   * Create a motion clip with bidirectional priority from a motion clip.
   *
   * @param motionClip The motion clip to create from.
   * @returns A new motion clip with bidirectional priority.
   */
  public static fromMotionClip(
    motionClip: MotionClip,
  ): MotionClipWithBidirectionalPriority {
    return new MotionClipWithBidirectionalPriority(
      motionClip.nFrames,
      motionClip.jointNames,
      motionClip.jointRotmat,
      motionClip.rootWorldPosition,
      motionClip.priority,
      motionClip.priority,
      motionClip.restposeName,
      motionClip.motionRecordId,
      motionClip.timelineStartIdx,
    )
  }

  /**
   * Convert the motion clip with bidirectional priority to a regular motion clip.
   *
   * @returns A new motion clip.
   */
  public toMotionClip(): MotionClip {
    return new MotionClip(
      this.nFrames,
      this.jointNames,
      this.jointRotmat,
      this.rootWorldPosition,
      Math.max(this.leftPriority, this.rightPriority),
      this.restposeName,
      this.motionRecordId,
      this.timelineStartIdx,
    )
  }
}
