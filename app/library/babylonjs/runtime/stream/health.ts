/**
 * Stream health interface.
 *
 * Defines the health status of different stream types with their respective time measurements.
 */
export interface StreamHealth {
  /**
   * Motion stream health time in seconds.
   */
  motionHealthTimeInSeconds: number
  /**
   * Face stream health time in frames.
   */
  faceHealthTimeInFrames: number
  /**
   * Audio stream health time in seconds.
   */
  audioHealthTimeInSeconds: number
}
