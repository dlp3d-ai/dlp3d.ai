/**
 * RuntimeAnimationRange
 *
 * A class for representing animation frame ranges with start and end indices.
 * Provides methods for managing range boundaries and calculating range length.
 */
export class RuntimeAnimationRange {
  /**
   * Start frame index of the animation range.
   */
  private _start: number
  /**
   * End frame index of the animation range.
   */
  private _end: number

  /**
   * Create a new RuntimeAnimationRange instance.
   *
   * @param start Start frame index. Defaults to 0.
   * @param end End frame index. Defaults to 0.
   */
  constructor(start: number = 0, end: number = 0) {
    this._start = start
    this._end = end
  }

  /**
   * Get the start frame index.
   *
   * @returns The start frame index.
   */
  get start(): number {
    return this._start
  }

  /**
   * Get the end frame index.
   *
   * @returns The end frame index.
   */
  get end(): number {
    return this._end
  }

  /**
   * Set the start frame index.
   *
   * @param start The start frame index.
   */
  set start(start: number) {
    this._start = start
  }

  /**
   * Set the end frame index.
   *
   * @param end The end frame index.
   */
  set end(end: number) {
    this._end = end
  }

  /**
   * Get the length of the range.
   *
   * @returns The length of the range (end - start).
   */
  get length(): number {
    return this._end - this._start
  }

  /**
   * Set the range using an array of two numbers.
   *
   * @param range Array containing [start, end] frame indices.
   * @throws {Error} if the array does not contain exactly two numbers.
   */
  set range(range: number[]) {
    if (range.length !== 2) {
      throw new Error('Range must be an array of two numbers')
    }

    this._start = range[0]
    this._end = range[1]
  }

  /**
   * Get the range as an array of two numbers.
   *
   * @returns Array containing [start, end] frame indices.
   */
  get range(): number[] {
    return [this._start, this._end]
  }
}
