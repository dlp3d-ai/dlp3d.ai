import {
  NetworkStream,
  UnexpectedStreamPlayError,
} from '@/library/babylonjs/runtime/stream'
import { Logger } from '@/library/babylonjs/utils'

/**
 * Adaptive buffer size estimator.
 *
 * Dynamically estimates appropriate buffer size based on network stream reception to ensure smooth streaming playback.
 * Uses heap sorting algorithm to determine safe thresholds by collecting historical samples and safe playback rates,
 * dynamically updating safe buffer size.
 */
export class AdaptiveBufferSizeEstimator {
  /**
   * Name of the estimator for logging identification.
   */
  private _name: string
  /**
   * Weight ratio between new buffer size and historical buffer size.
   */
  private _weight: number
  /**
   * Maximum number of samples to keep.
   */
  private _maxSamples: number
  /**
   * List of historical buffer size samples.
   */
  private _sampleList: number[]
  /**
   * Safe rate for determining safe buffer thresholds.
   */
  private _safeRate: number
  /**
   * Current estimated buffer size.
   */
  private _bufferSize: number

  /**
   * Initialize the adaptive buffer size estimator.
   *
   * @param name - Name of the estimator for logging identification.
   * @param weight - Weight ratio between new buffer size and historical buffer size, range [0,1]. Defaults to 0.5.
   * @param maxSamples - Maximum number of samples to keep, oldest samples are removed when exceeded. Defaults to 100.
   * @param safeRate - Safe rate for estimating safe buffer size, target is that at least safeRate proportion of sample streams can be safely played. Range (0,1], defaults to 0.9.
   */
  constructor(
    name: string,
    weight: number = 0.5,
    maxSamples: number = 100,
    safeRate: number = 0.9,
  ) {
    this._name = name
    this._weight = weight
    this._maxSamples = maxSamples
    this._sampleList = []
    this._safeRate = safeRate
    this._bufferSize = 1e-6
  }

  /**
   * Get the current estimated buffer size.
   *
   * @returns Current buffer size in seconds.
   */
  public get bufferSize(): number {
    return this._bufferSize
  }

  /**
   * Set buffer size based on network stream.
   *
   * Calculates the safe playback start position of the stream and sets the corresponding buffer size.
   * Optionally records the calculation result as a sample for subsequent adaptive adjustments.
   *
   * @param stream - Network stream object containing multiple data chunks and their reception time information.
   * @param recordAsSample - Whether to record the calculation result as a sample. Defaults to false.
   */
  async setBufferSizeByStream(
    stream: NetworkStream,
    recordAsSample: boolean = false,
  ): Promise<void> {
    try {
      const playStartChunkIdx = await this.getPlayStartChunkIdx(stream)
      let streamBufferSize = 0.0
      for (let chunkIdx = 0; chunkIdx <= playStartChunkIdx; chunkIdx++) {
        streamBufferSize += stream.get(chunkIdx).chunkDuration
      }
      this._bufferSize = streamBufferSize
      if (recordAsSample) {
        this._sampleList.push(this._bufferSize)
        if (this._sampleList.length > this._maxSamples) {
          this._sampleList.shift()
        }
      }
      Logger.debug(
        `${this._name} buffer size estimate set to ${this._bufferSize.toFixed(3)} seconds.`,
      )
    } catch (error) {
      if (error instanceof UnexpectedStreamPlayError) {
        return
      }
      throw error
    }
  }

  /**
   * Update buffer size based on network stream.
   *
   * Calculates the safe playback start position of the stream, adds the result as a new sample to the sample list,
   * then uses heap sorting algorithm to exclude samples outside the safe rate, calculates the safe buffer size of remaining samples,
   * and finally updates the current buffer size using weighted average.
   *
   * @param stream - Network stream object containing multiple data chunks and their reception time information.
   */
  async updateBufferSizeByStream(stream: NetworkStream): Promise<void> {
    if (this._bufferSize < 1e-4) {
      await this.setBufferSizeByStream(stream, true)
      return
    }
    const playStartChunkIdx = await this.getPlayStartChunkIdx(stream)
    let streamBufferSize = 0.0
    for (let chunkIdx = 0; chunkIdx <= playStartChunkIdx; chunkIdx++) {
      streamBufferSize += stream.get(chunkIdx).chunkDuration
    }
    this._sampleList.push(streamBufferSize)
    if (this._sampleList.length > this._maxSamples) {
      this._sampleList.shift()
    }
    const safeIdx = Math.floor(this._sampleList.length * (1 - this._safeRate))

    // Convert list to max heap (by taking negative values)
    const maxHeap = this._sampleList.map(x => -x)
    this.heapify(maxHeap)

    for (let i = 0; i < safeIdx; i++) {
      this.heapPop(maxHeap)
    }

    const targetBufferSize = -maxHeap[0]
    this._bufferSize =
      this._weight * targetBufferSize + (1 - this._weight) * this._bufferSize
    Logger.debug(
      `${this._name} buffer size estimate weighted update to ${this._bufferSize.toFixed(3)} seconds.`,
    )
  }

  /**
   * Clear sample list and reset buffer size.
   */
  async reset(): Promise<void> {
    this._sampleList = []
    this._bufferSize = 0.0
  }

  /**
   * Get the safe playback start chunk index of the stream.
   *
   * Finds the data chunk index that can safely start playback by simulating the playback process.
   * If the current index is unsafe, it will incrementally increase the index until a safe position is found.
   *
   * @param stream - Network stream object containing multiple data chunks and their reception time information.
   * @returns Safe playback start chunk index.
   * @throws UnexpectedStreamPlayError - Thrown when the stream is unsafe to play regardless of the approach.
   */
  private async getPlayStartChunkIdx(stream: NetworkStream): Promise<number> {
    // Try to start playback when playStartChunkIdx is reached,
    // if it fails, increment playStartChunkIdx
    const nChunks = stream.length
    let playStartChunkIdx = 0
    let playSafe = false

    while (playStartChunkIdx < nChunks) {
      let bufferSize = 0.0
      playSafe = true

      for (let chunkIdx = 0; chunkIdx < nChunks; chunkIdx++) {
        // Playback has not started yet, add chunk to buffer
        if (chunkIdx <= playStartChunkIdx || chunkIdx === 0) {
          bufferSize += stream.get(chunkIdx).chunkDuration
        }
        // Playback has started, first check if buffer data has been consumed when data is received
        // If buffer is empty, playback is unsafe, need to increment playStartChunkIdx
        else {
          const timePassed =
            stream.get(chunkIdx).chunkRecvTime -
            stream.get(chunkIdx - 1).chunkRecvTime
          bufferSize -= timePassed
          if (bufferSize <= 0.0) {
            playSafe = false
            break
          } else {
            bufferSize += stream.get(chunkIdx).chunkDuration
          }
        }
      }

      if (playSafe) {
        break
      } else {
        playStartChunkIdx += 1
      }
    }

    if (!playSafe) {
      const msg =
        'Stream is unsafe to play regardless of approach, this should not happen, please check data and code.' +
        `Network stream details: ${JSON.stringify(stream)}`
      Logger.error(msg)
      throw new UnexpectedStreamPlayError(msg)
    }

    return playStartChunkIdx
  }

  /**
   * Heap sort helper method: convert array to max heap.
   */
  private heapify(arr: number[]): void {
    const n = arr.length
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      this.heapifyDown(arr, n, i)
    }
  }

  /**
   * Heap sort helper method: heapify down.
   */
  private heapifyDown(arr: number[], n: number, i: number): void {
    let largest = i
    const left = 2 * i + 1
    const right = 2 * i + 2

    if (left < n && arr[left] > arr[largest]) {
      largest = left
    }

    if (right < n && arr[right] > arr[largest]) {
      largest = right
    }

    if (largest !== i) {
      ;[arr[i], arr[largest]] = [arr[largest], arr[i]]
      this.heapifyDown(arr, n, largest)
    }
  }

  /**
   * Heap sort helper method: pop the top element from heap.
   */
  private heapPop(arr: number[]): number {
    if (arr.length === 0) {
      throw new Error('Heap is empty')
    }

    const result = arr[0]
    arr[0] = arr[arr.length - 1]
    arr.pop()

    if (arr.length > 0) {
      this.heapifyDown(arr, arr.length, 0)
    }

    return result
  }
}
