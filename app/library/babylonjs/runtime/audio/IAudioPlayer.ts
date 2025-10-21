import type { Observable } from '@babylonjs/core/Misc/observable'

/**
 * Abstract player interface for media playback.
 *
 * Provides common functionality for media players including playback control,
 * time management, and event notifications.
 */
export interface IPlayer {
  /**
   * Observable that notifies when the audio duration changes.
   */
  readonly onDurationChangedObservable: Observable<void>

  /**
   * Observable that notifies when the playback rate changes.
   */
  readonly onPlaybackRateChangedObservable: Observable<void>

  /**
   * Observable that notifies when the player starts playing.
   */
  readonly onPlayObservable: Observable<void>

  /**
   * Observable that notifies when the player is paused.
   */
  readonly onPauseObservable: Observable<void>

  /**
   * Observable that notifies when the player seeks to a new position.
   */
  readonly onSeekObservable: Observable<void>

  /**
   * Duration of the audio in seconds.
   */
  readonly duration: number

  /**
   * Current playback time in seconds.
   */
  currentTime: number

  /**
   * Set current time without triggering notifications.
   *
   * @param value The new current time in seconds.
   * @internal
   */
  _setCurrentTimeWithoutNotify(value: number): void

  /**
   * Playback rate where 1.0 is normal speed.
   */
  playbackRate: number

  /**
   * Set playback rate without triggering notifications.
   *
   * @param value The new playback rate.
   * @internal
   */
  _setPlaybackRateWithoutNotify(value: number): void

  /**
   * Whether the player is currently paused.
   */
  readonly paused: boolean

  /**
   * Whether the audio metadata (including duration) is loaded.
   */
  readonly metadataLoaded: boolean

  /**
   * Start playing the media.
   *
   * @returns A promise that resolves when playback starts.
   */
  play(): Promise<void>

  /**
   * Pause the media playback.
   */
  pause(): void
}

/**
 * Abstract audio player interface.
 *
 * Extends the base player interface with audio-specific functionality
 * including volume control, muting, and pitch preservation.
 */
export interface IAudioPlayer extends IPlayer {
  /**
   * Observable that notifies when the mute state changes.
   */
  readonly onMuteStateChangedObservable: Observable<void>

  /**
   * Audio volume level from 0.0 (silent) to 1.0 (maximum).
   */
  volume: number

  /**
   * Whether the audio player is currently muted.
   */
  readonly muted: boolean

  /**
   * Mute the audio player.
   */
  mute(): void

  /**
   * Unmute the audio player.
   *
   * Unmuting may fail if user interaction has not been performed.
   *
   * @returns True if the player was successfully unmuted, false otherwise.
   */
  unmute(): Promise<boolean>

  /**
   * Whether the player preserves pitch when changing playback rate.
   */
  preservesPitch: boolean
}
