/**
 * Stream playback error.
 *
 * Thrown when unable to find buffer parameters that make the stream safe to play.
 */
export class UnexpectedStreamPlayError extends Error {
  /**
   * Create a new UnexpectedStreamPlayError.
   *
   * @param message - Error message describing the issue.
   */
  constructor(message: string) {
    super(message)
    this.name = 'UnexpectedStreamPlayError'
  }
}

/**
 * Stream unavailable error.
 *
 * Thrown when the stream is not available for use.
 */
export class StreamUnavailableError extends Error {
  /**
   * Create a new StreamUnavailableError.
   *
   * @param message - Error message describing why the stream is unavailable. Defaults to 'Stream is unavailable'.
   */
  constructor(message: string = 'Stream is unavailable') {
    super(message)
    this.name = 'StreamUnavailableError'
  }
}

/**
 * Stream ended error.
 *
 * Thrown when the stream has ended.
 */
export class StreamEndedError extends Error {
  /**
   * Create a new StreamEndedError.
   *
   * @param message - Error message describing that the stream has ended. Defaults to 'Stream has ended'.
   */
  constructor(message: string = 'Stream has ended') {
    super(message)
    this.name = 'StreamEndedError'
  }
}

/**
 * Connection timeout error.
 *
 * Thrown when a connection times out.
 */
export class ConnectionTimeoutError extends Error {
  /**
   * Create a new ConnectionTimeoutError.
   *
   * @param message - Error message describing the timeout. Defaults to 'Connection timed out'.
   */
  constructor(message: string = 'Connection timed out') {
    super(message)
    this.name = 'ConnectionTimeoutError'
  }
}
