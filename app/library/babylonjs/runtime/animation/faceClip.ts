import { Logger } from '@/library/babylonjs/utils'

/**
 * Dictionary interface for face clip data.
 *
 * Contains blendshape values and metadata for face animation clips.
 */
export interface FaceClipDict {
  [key: string]: number[] | number
  nFrames: number
  blendShapeCount: number
  timecode: number[]
}

/**
 * FaceClip
 *
 * A class for storing and passing blendshape values in animations.
 */
export class FaceClip {
  private static readonly NPZ_KEYS_TO_EXCLUDE = [
    'Timecode',
    'BlendShapeCount',
    'nFrames',
  ]

  /**
   * Names of the blendshapes.
   */
  public blendShapeNames: string[]
  /**
   * Values of the blendshapes, shape is (nFrames, nBlendShapes).
   */
  public blendShapeValues: number[][]
  /**
   * Start index of the clip in the timeline.
   */
  public timelineStartIdx: number | null

  constructor(
    blendShapeNames: string[],
    blendShapeValues: number[][],
    timelineStartIdx: number | null = null,
  ) {
    this.blendShapeNames = blendShapeNames
    this.blendShapeValues = blendShapeValues
    this._checkNBlendShapes()
    this.timelineStartIdx = timelineStartIdx
  }

  /**
   * Check if the number of blendshapes matches between names and values.
   *
   * @throws {Error} if the number of blendshape names does not match the number of blendshape values.
   */
  private _checkNBlendShapes(): void {
    const nBlendShapesNp = this.blendShapeValues[0].length
    const nBlendShapesNames = this.blendShapeNames.length
    if (nBlendShapesNp !== nBlendShapesNames) {
      const msg = `Length of blendShapeNames ${nBlendShapesNames} != number of blendShapeValues.shape[1] ${nBlendShapesNp}`
      Logger.error(msg)
      throw new Error(msg)
    }
  }

  /**
   * Get the number of frames in the face clip.
   *
   * @returns The number of frames.
   */
  public length(): number {
    return this.blendShapeValues.length
  }

  /**
   * Set the timeline start index.
   *
   * @param timelineStartIdx The new timeline start index.
   */
  public setTimelineStartIdx(timelineStartIdx: number | null): void {
    this.timelineStartIdx = timelineStartIdx
  }

  /**
   * Set the blendshape values.
   *
   * @param blendShapeValues The new blendshape values, shape is (nFrames, nBlendShapes).
   */
  public setBlendShapeValues(blendShapeValues: number[][]): void {
    this.blendShapeValues = blendShapeValues
    this._checkNBlendShapes()
  }

  /**
   * Clone the face clip.
   *
   * @returns A new face clip with the same data.
   */
  public clone(): FaceClip {
    return new FaceClip(
      [...this.blendShapeNames],
      this.blendShapeValues.map(frame => [...frame]),
    )
  }

  /**
   * Slice the face clip.
   *
   * @param startFrame Start frame index.
   * @param endFrame End frame index.
   * @returns A new face clip containing the sliced frames.
   */
  public slice(startFrame: number, endFrame: number): FaceClip {
    const timelineStartIdx =
      this.timelineStartIdx !== null ? this.timelineStartIdx + startFrame : null

    return new FaceClip(
      [...this.blendShapeNames],
      this.blendShapeValues.slice(startFrame, endFrame).map(frame => [...frame]),
      timelineStartIdx,
    )
  }

  /**
   * Convert the face clip to a dictionary.
   *
   * @returns A dictionary representation of the face clip.
   */
  public toDict(): FaceClipDict {
    const retDict: FaceClipDict = {
      nFrames: this.length(),
      blendShapeCount: this.blendShapeNames.length,
      timecode: Array.from({ length: this.length() }, (_, i) => i),
    }

    for (let bsIdx = 0; bsIdx < this.blendShapeNames.length; bsIdx++) {
      const bsName = this.blendShapeNames[bsIdx]
      retDict[bsName] = this.blendShapeValues.map(frame => frame[bsIdx])
    }

    return retDict
  }

  /**
   * Create a face clip from a dictionary.
   *
   * @param faceDict The dictionary to create the face clip from.
   * @returns A new face clip.
   */
  public static fromDict(faceDict: FaceClipDict): FaceClip {
    const blendShapeNames: string[] = []
    for (const key in faceDict) {
      if (!FaceClip.NPZ_KEYS_TO_EXCLUDE.includes(key)) {
        blendShapeNames.push(key)
      }
    }

    const nFrames = faceDict.nFrames as number
    const blendShapeValues: number[][] = Array(nFrames)
      .fill(0)
      .map(() => Array(blendShapeNames.length).fill(0))

    for (let bsIdx = 0; bsIdx < blendShapeNames.length; bsIdx++) {
      const bsName = blendShapeNames[bsIdx]
      const values = faceDict[bsName] as number[]
      for (let frame = 0; frame < nFrames; frame++) {
        blendShapeValues[frame][bsIdx] = values[frame]
      }
    }

    return new FaceClip(blendShapeNames, blendShapeValues)
  }

  /**
   * Concatenate multiple face clips.
   *
   * @param faceClips The face clips to concatenate.
   * @returns A new face clip containing the concatenated data.
   * @throws {Error} if faceClips is empty or contains clips with different blendShapeNames.
   */
  public static concat(faceClips: FaceClip[]): FaceClip {
    if (faceClips.length <= 0) {
      const msg = 'FaceClip.concat() parameter faceClips is an empty list.'
      Logger.error(msg)
      throw new Error(msg)
    }

    const nFrames = faceClips.reduce((sum, fc) => sum + fc.length(), 0)
    const blendShapeNames = faceClips[0].blendShapeNames
    const timelineStartIdx = faceClips[0].timelineStartIdx

    // Check blend shape names
    for (let idx = 1; idx < faceClips.length; idx++) {
      const curBlendShapeNames = faceClips[idx].blendShapeNames
      if (JSON.stringify(curBlendShapeNames) !== JSON.stringify(blendShapeNames)) {
        const msg =
          'FaceClip.concat() parameter faceClips contains different blendShapeNames.\n' +
          `Clip0: ${blendShapeNames}\n` +
          `Clip${idx}: ${curBlendShapeNames}`
        Logger.error(msg)
        throw new Error(msg)
      }
    }

    // Concatenate blend shape values
    const blendShapeValues: number[][] = Array(nFrames)
      .fill(0)
      .map(() => Array(blendShapeNames.length).fill(0))

    let clipStartFrame = 0
    for (const clip of faceClips) {
      const curBlendShapeValues = clip.blendShapeValues
      const curNFrames = clip.length()
      for (let frame = 0; frame < curNFrames; frame++) {
        for (let bs = 0; bs < blendShapeNames.length; bs++) {
          blendShapeValues[clipStartFrame + frame][bs] =
            curBlendShapeValues[frame][bs]
        }
      }
      clipStartFrame += curNFrames
    }

    return new FaceClip(blendShapeNames, blendShapeValues, timelineStartIdx)
  }
}
