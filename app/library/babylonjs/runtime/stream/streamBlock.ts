import { MotionClipWithBidirectionalPriority } from '@/library/babylonjs/runtime/animation'
import { Logger } from '@/library/babylonjs/utils'

/**
 * Base class for stream blocks.
 *
 * Base class for data blocks in animation streams.
 */
export abstract class StreamBlock {
  /**
   * Block data.
   */
  protected data: any
  /**
   * Block start time.
   */
  protected startTime: number
  /**
   * Block end time.
   */
  protected endTime: number

  constructor(data: any, startTime: number, endTime: number) {
    this.data = data
    this.startTime = startTime
    this.endTime = endTime
  }

  /**
   * Get the start time of the block.
   *
   * @returns The start time.
   */
  public getStartTime(): number {
    return this.startTime
  }

  /**
   * Get the end time of the block.
   *
   * @returns The end time.
   */
  public getEndTime(): number {
    return this.endTime
  }

  /**
   * Get the data of the block.
   *
   * @returns The block data.
   */
  public getData(): any {
    return this.data
  }

  /**
   * Compare this block with another for less than.
   *
   * @param other The other block to compare with.
   * @returns True if this block's start time is less than the other's.
   */
  public lt(other: StreamBlock): boolean {
    return this.startTime < other.startTime
  }

  /**
   * Compare this block with another for less than or equal.
   *
   * @param other The other block to compare with.
   * @returns True if this block's start time is less than or equal to the other's.
   */
  public le(other: StreamBlock): boolean {
    return this.startTime <= other.startTime
  }

  /**
   * Compare this block with another for greater than.
   *
   * @param other The other block to compare with.
   * @returns True if this block's start time is greater than the other's.
   */
  public gt(other: StreamBlock): boolean {
    return this.startTime > other.startTime
  }

  /**
   * Compare this block with another for greater than or equal.
   *
   * @param other The other block to compare with.
   * @returns True if this block's start time is greater than or equal to the other's.
   */
  public ge(other: StreamBlock): boolean {
    return this.startTime >= other.startTime
  }
}

/**
 * Frame-based stream block.
 *
 * Data block composed of frame-based data streams.
 */
export class FrameStreamBlock extends StreamBlock {
  /**
   * Number of frames in the block.
   */
  protected nFrames: number

  constructor(data: any[], startTime: number, endTime: number, nFrames: number) {
    super(data, startTime, endTime)
    this.nFrames = nFrames
  }

  /**
   * Get the length of the block.
   *
   * @returns The number of frames.
   */
  public length(): number {
    return this.nFrames
  }

  /**
   * Get the frame data at the specified index.
   *
   * @param idx The frame index.
   * @returns The frame data.
   */
  public getFrame(idx: number): any {
    return this.data[idx]
  }
}

/**
 * Babylon motion stream block.
 *
 * Data block for Babylon animation streams.
 */
export class BabylonMotionStreamBlock extends FrameStreamBlock {
  /**
   * Source motion clip.
   */
  private srcMotionClip: MotionClipWithBidirectionalPriority | null
  /**
   * Joint names.
   */
  private jointNames: string[]
  /**
   * Rotation quaternions.
   */
  private rotQuat: number[][][]
  /**
   * Root positions.
   */
  private posRoot: number[][]

  constructor(
    jointNames: string[],
    rotQuat: number[][][],
    posRoot: number[][],
    startTime: number,
    endTime: number,
    nFrames: number,
    srcMotionClip: MotionClipWithBidirectionalPriority | null = null,
  ) {
    super([], startTime, endTime, nFrames)
    this.srcMotionClip = srcMotionClip
    this.jointNames = jointNames
    this.rotQuat = rotQuat
    this.posRoot = posRoot
  }

  /**
   * Get the frame data at the specified index.
   *
   * @param idx The frame index.
   * @returns An object containing rotation quaternion and root position.
   */
  public getFrame(idx: number): { rotQuat: number[][]; posRoot: number[] } {
    return {
      rotQuat: this.rotQuat[idx],
      posRoot: this.posRoot[idx],
    }
  }

  /**
   * Set the rotation quaternions.
   *
   * @param rotQuat The new rotation quaternions.
   */
  public setRotQuat(rotQuat: number[][][]): void {
    if (rotQuat.length !== this.nFrames) {
      const msg = `rotQuat frame count does not match block frame count, rotQuat has ${rotQuat.length} frames, block has ${this.nFrames} frames.`
      Logger.error(msg)
      throw new Error(msg)
    }
    this.rotQuat = rotQuat
  }

  /**
   * Get the rotation quaternions.
   *
   * @returns The rotation quaternions.
   */
  public getRotQuat(): number[][][] {
    return this.rotQuat
  }

  /**
   * Set the root positions.
   *
   * @param posRoot The new root positions.
   */
  public setPosRoot(posRoot: number[][]): void {
    if (posRoot.length !== this.nFrames) {
      const msg = `posRoot frame count does not match block frame count, posRoot has ${posRoot.length} frames, block has ${this.nFrames} frames.`
      Logger.error(msg)
      throw new Error(msg)
    }
    this.posRoot = posRoot
  }

  /**
   * Get the root positions.
   *
   * @returns The root positions.
   */
  public getPosRoot(): number[][] {
    return this.posRoot
  }

  /**
   * Set the source motion clip.
   *
   * @param srcMotionClip The new source motion clip.
   */
  public setSrcMotionClip(
    srcMotionClip: MotionClipWithBidirectionalPriority | null,
  ): void {
    this.srcMotionClip = srcMotionClip
  }

  /**
   * Get the joint names.
   *
   * @returns The joint names.
   */
  public getJointNames(): string[] {
    return this.jointNames
  }

  /**
   * Get the source motion clip.
   *
   * @returns The source motion clip.
   */
  public getSrcMotionClip(): MotionClipWithBidirectionalPriority | null {
    return this.srcMotionClip
  }

  /**
   * Get a slice of the block.
   *
   * @param startFrame Start frame index.
   * @param endFrame End frame index.
   * @param startTime Start time.
   * @param endTime End time.
   * @returns A new block containing the sliced data.
   */
  public slice(
    startFrame: number,
    endFrame: number,
    startTime: number,
    endTime: number,
  ): BabylonMotionStreamBlock {
    return new BabylonMotionStreamBlock(
      this.jointNames,
      this.rotQuat.slice(startFrame, endFrame),
      this.posRoot.slice(startFrame, endFrame),
      startTime,
      endTime,
      endFrame - startFrame,
      this.srcMotionClip?.slice(startFrame, endFrame) || null,
    )
  }

  /**
   * Concatenate multiple motion stream blocks.
   *
   * @param streamBlocks The blocks to concatenate.
   * @returns A new block containing the concatenated data.
   */
  public static concat(
    streamBlocks: BabylonMotionStreamBlock[],
  ): BabylonMotionStreamBlock {
    if (streamBlocks.length <= 0) {
      const msg = 'BabylonMotionStreamBlock.concat() receives empty streamBlocks.'
      Logger.error(msg)
      throw new Error(msg)
    }

    const newNFrames = streamBlocks.reduce((sum, block) => sum + block.length(), 0)
    const newStartTime = streamBlocks[0].getStartTime()
    const newEndTime = streamBlocks[streamBlocks.length - 1].getEndTime()
    const newJointNames = streamBlocks[0].getJointNames()

    // Initialize arrays
    const newRotQuat: number[][][] = Array(newNFrames)
      .fill(0)
      .map(() =>
        Array(newJointNames.length)
          .fill(0)
          .map(() => Array(4).fill(0)),
      )
    const newPosRoot: number[][] = Array(newNFrames)
      .fill(0)
      .map(() => Array(3).fill(0))

    let frameBaseIdx = 0
    for (let idx = 0; idx < streamBlocks.length; idx++) {
      const block = streamBlocks[idx]
      const startIdx = frameBaseIdx
      const endIdx = startIdx + block.length()
      const blockJointNames = block.getJointNames()

      if (JSON.stringify(blockJointNames) !== JSON.stringify(newJointNames)) {
        const msg =
          'BabylonMotionStreamBlock.concat() receives streamBlocks with different jointNames.' +
          `Clip0: ${newJointNames}, Clip${idx}: ${blockJointNames}`
        Logger.error(msg)
        throw new Error(msg)
      }

      // Copy data
      for (let frame = 0; frame < block.length(); frame++) {
        for (let joint = 0; joint < newJointNames.length; joint++) {
          for (let quat = 0; quat < 4; quat++) {
            newRotQuat[startIdx + frame][joint][quat] =
              block.getRotQuat()[frame][joint][quat]
          }
        }
        for (let pos = 0; pos < 3; pos++) {
          newPosRoot[startIdx + frame][pos] = block.getPosRoot()[frame][pos]
        }
      }

      frameBaseIdx = endIdx
    }

    const srcMotionClips = streamBlocks
      .map(block => block.getSrcMotionClip())
      .filter((clip): clip is MotionClipWithBidirectionalPriority => clip !== null)
    const newSrcMotionClip =
      srcMotionClips.length > 0
        ? MotionClipWithBidirectionalPriority.concat(srcMotionClips)
        : null

    return new BabylonMotionStreamBlock(
      newJointNames,
      newRotQuat,
      newPosRoot,
      newStartTime,
      newEndTime,
      newNFrames,
      newSrcMotionClip,
    )
  }
}

/**
 * Babylon face stream block.
 *
 * Data block for Babylon face animation streams.
 */
export class BabylonFaceStreamBlock extends FrameStreamBlock {
  /**
   * Blendshape names.
   */
  private blendShapeNames: string[]

  constructor(
    blendShapeNames: string[],
    blendShapeValues: number[][],
    startTime: number,
    endTime: number,
  ) {
    super(blendShapeValues, startTime, endTime, blendShapeValues.length)
    this.blendShapeNames = blendShapeNames
  }

  /**
   * Get the frame data at the specified index.
   *
   * @param idx The frame index.
   * @returns The frame data.
   */
  public getFrame(idx: number): number[] {
    return this.data[idx]
  }

  /**
   * Get the blendshape names.
   *
   * @returns The blendshape names.
   */
  public getBlendShapeNames(): string[] {
    return this.blendShapeNames
  }
}
