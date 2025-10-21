import { Logger } from '@/library/babylonjs/utils'

/**
 * Type character for stream chunks.
 */
export type StreamTypeChar = 'a' | 'f' | 'm'

/**
 * Type name for stream chunks.
 */
export type StreamTypeName = 'audio' | 'face' | 'motion'

/**
 * StreamChunk
 *
 * A class for handling stream data chunks from the Orchestrator.
 */
export class StreamChunk {
  /**
   * Type character of the stream chunk.
   */
  private typeChar: StreamTypeChar
  /**
   * Sequence number of the stream chunk.
   */
  private sequenceNumber: number
  /**
   * Binary data of the stream chunk.
   */
  private binaryData: Uint8Array

  constructor(data: Uint8Array) {
    const { typeChar, sequenceNumber, binaryData } = StreamChunk.unpackData(data)
    this.typeChar = typeChar
    this.sequenceNumber = sequenceNumber
    this.binaryData = binaryData
  }

  /**
   * Unpack the stream data.
   *
   * @param receivedData The received data to unpack.
   * @returns An object containing the type character, sequence number, and binary data.
   */
  private static unpackData(receivedData: Uint8Array): {
    typeChar: StreamTypeChar
    sequenceNumber: number
    binaryData: Uint8Array
  } {
    const typeChar = String.fromCharCode(receivedData[0]) as StreamTypeChar
    const sequenceNumber = new DataView(receivedData.buffer).getUint32(1, false)
    const binaryData = receivedData.slice(5)
    return { typeChar, sequenceNumber, binaryData }
  }

  /**
   * Get the binary data of the stream chunk.
   *
   * @returns The binary data as a Uint8Array.
   */
  public getBytes(): Uint8Array {
    return this.binaryData
  }

  /**
   * Get the type character of the stream chunk.
   *
   * @returns The type character.
   */
  public getTypeChar(): StreamTypeChar {
    return this.typeChar
  }

  /**
   * Get the type name of the stream chunk.
   *
   * @returns The type name.
   * @throws {Error} if the type character is invalid.
   */
  public getTypeName(): StreamTypeName {
    switch (this.typeChar) {
      case 'a':
        return 'audio'
      case 'f':
        return 'face'
      case 'm':
        return 'motion'
      default: {
        const msg = `Invalid type char: ${this.typeChar}`
        Logger.error(msg)
        throw new Error(msg)
      }
    }
  }

  /**
   * Get the sequence number of the stream chunk.
   *
   * @returns The sequence number.
   */
  public getSequenceNumber(): number {
    return this.sequenceNumber
  }

  /**
   * Compare this stream chunk with another for less than.
   *
   * @param other The other stream chunk to compare with.
   * @returns True if this chunk's sequence number is less than the other's.
   */
  public lt(other: StreamChunk): boolean {
    return this.sequenceNumber < other.sequenceNumber
  }

  /**
   * Compare this stream chunk with another for less than or equal.
   *
   * @param other The other stream chunk to compare with.
   * @returns True if this chunk's sequence number is less than or equal to the other's.
   */
  public le(other: StreamChunk): boolean {
    return this.sequenceNumber <= other.sequenceNumber
  }

  /**
   * Compare this stream chunk with another for greater than.
   *
   * @param other The other stream chunk to compare with.
   * @returns True if this chunk's sequence number is greater than the other's.
   */
  public gt(other: StreamChunk): boolean {
    return this.sequenceNumber > other.sequenceNumber
  }

  /**
   * Compare this stream chunk with another for greater than or equal.
   *
   * @param other The other stream chunk to compare with.
   * @returns True if this chunk's sequence number is greater than or equal to the other's.
   */
  public ge(other: StreamChunk): boolean {
    return this.sequenceNumber >= other.sequenceNumber
  }
}
