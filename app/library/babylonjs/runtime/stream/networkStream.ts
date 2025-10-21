/**
 * Network stream data chunk.
 *
 * Represents a data chunk in a network stream, containing chunk index, playback duration, and reception time information.
 * Used for calculating playback control parameters.
 */
export class NetworkStreamChunk {
  /**
   * Index of the data chunk, used to identify the position of the chunk in the stream.
   */
  public chunkIdx: number

  /**
   * Playback duration of the data chunk in seconds.
   */
  public chunkDuration: number

  /**
   * Reception timestamp of the data chunk in seconds.
   */
  public chunkRecvTime: number

  /**
   * Initialize network stream data chunk.
   *
   * @param chunkIdx - Index of the data chunk, used to identify the position of the chunk in the stream.
   * @param chunkDuration - Playback duration of the data chunk in seconds.
   * @param chunkRecvTime - Reception timestamp of the data chunk in seconds.
   */
  constructor(chunkIdx: number, chunkDuration: number, chunkRecvTime: number) {
    this.chunkIdx = chunkIdx
    this.chunkDuration = chunkDuration
    this.chunkRecvTime = chunkRecvTime
  }

  /**
   * Get string representation of the data chunk.
   *
   * @returns Formatted string containing chunk index, duration, and reception time.
   */
  toString(): string {
    return (
      `Index: ${this.chunkIdx}, ` +
      `Duration: ${this.chunkDuration.toFixed(3)}, ` +
      `Receive Time: ${this.chunkRecvTime.toFixed(3)}`
    )
  }
}

/**
 * Network stream.
 *
 * Represents a complete network stream containing multiple data chunks and their reception time range.
 * Provides list-like interface to access and manage data chunks in the stream.
 */
export class NetworkStream {
  /**
   * Start reception timestamp of the stream in seconds.
   */
  public startRecvTime: number

  /**
   * End reception timestamp of the stream in seconds.
   */
  public endRecvTime: number | null

  /**
   * List of data chunks in the stream.
   */
  public streamChunks: NetworkStreamChunk[]

  /**
   * Initialize network stream.
   *
   * @param startRecvTime - Start reception timestamp of the stream in seconds.
   * @param endRecvTime - End reception timestamp of the stream in seconds. Defaults to null, if null, need to manually call setEndRecvTime method to set.
   * @param streamChunks - List of data chunks in the stream. Defaults to null, will create an empty list.
   */
  constructor(
    startRecvTime: number,
    endRecvTime: number | null = null,
    streamChunks: NetworkStreamChunk[] | null = null,
  ) {
    this.startRecvTime = startRecvTime
    this.endRecvTime = endRecvTime
    this.streamChunks = streamChunks || []
  }

  /**
   * Get the number of data chunks in the stream.
   *
   * @returns Number of data chunks.
   */
  get length(): number {
    return this.streamChunks.length
  }

  /**
   * Get data chunk by index.
   *
   * @param idx - Index of the data chunk.
   * @returns Data chunk at the specified index position.
   */
  get(idx: number): NetworkStreamChunk {
    return this.streamChunks[idx]
  }

  /**
   * Get string representation of the stream.
   *
   * @returns Formatted string containing start time, end time, and all data chunk information.
   */
  toString(): string {
    let retStr =
      `Start Receive Time: ${this.startRecvTime}, ` +
      `End Receive Time: ${this.endRecvTime}\n`
    for (const chunk of this.streamChunks) {
      retStr += `${chunk}\n`
    }
    return retStr
  }

  /**
   * Add data chunk to the stream.
   *
   * @param chunk - Data chunk to add.
   */
  appendChunk(chunk: NetworkStreamChunk): void {
    this.streamChunks.push(chunk)
  }

  /**
   * Set the end reception time of the stream.
   *
   * @param endRecvTime - End reception timestamp of the stream in seconds.
   */
  setEndRecvTime(endRecvTime: number): void {
    this.endRecvTime = endRecvTime
  }
}
