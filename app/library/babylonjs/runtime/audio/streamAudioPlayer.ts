import * as BABYLON from '@babylonjs/core'
import type { IDisposeObservable } from '@/library/babylonjs/core'
import type { IAudioPlayer } from '@/library/babylonjs/runtime/audio'
import { Logger } from '@/library/babylonjs/utils'

/**
 * Stream audio player
 *
 * This class is used to play the audio from the stream
 *
 * It is suitable for playing long sounds because it plays even if all of the audio is not loaded
 *
 * Wrapper of `HTMLAudioElement` which handles audio playback permission issues gracefully
 *
 * Also supports PCM audio playback through appendPCMData method
 */
export class StreamAudioPlayer implements IAudioPlayer {
  /**
   * On load error observable
   *
   * This observable is notified when the audio load is failed
   */
  public readonly onLoadErrorObservable: BABYLON.Observable<void>

  /**
   * On duration changed observable
   *
   * This observable is notified when the audio duration is changed
   */
  public readonly onDurationChangedObservable: BABYLON.Observable<void>

  /**
   * On playback rate changed observable
   *
   * This observable is notified when the playback rate is changed
   */
  public readonly onPlaybackRateChangedObservable: BABYLON.Observable<void>

  /**
   * On mute state changed observable
   *
   * This observable is notified when the mute state is changed
   */
  public readonly onMuteStateChangedObservable: BABYLON.Observable<void>

  /**
   * On play observable
   *
   * This observable is notified when the player is played
   */
  public readonly onPlayObservable: BABYLON.Observable<void>

  /**
   * On pause observable
   *
   * This observable is notified when the player is paused
   */
  public readonly onPauseObservable: BABYLON.Observable<void>

  /**
   * On seek observable
   *
   * This observable is notified when the player is seeked
   */
  public readonly onSeekObservable: BABYLON.Observable<void>

  /**
   * HTML audio element for standard audio playback
   */
  private readonly _audio: HTMLAudioElement
  /**
   * Audio duration in seconds
   */
  private _duration: number
  /**
   * Playback rate multiplier
   */
  private _playbackRate: number

  /**
   * Whether the audio is in virtual play mode (muted)
   */
  private _isVirtualPlay: boolean
  /**
   * Start time for virtual play mode
   */
  private _virtualStartTime: number
  /**
   * Whether virtual play is paused
   */
  private _virtualPaused: boolean
  /**
   * Current time when virtual play is paused
   */
  private _virtualPauseCurrentTime: number
  /**
   * Whether audio metadata is loaded
   */
  private _metadataLoaded: boolean

  /**
   * Bound dispose function for cleanup
   */
  private readonly _bindedDispose: () => void
  /**
   * Object that limits the lifetime of this instance
   */
  private readonly _disposeObservableObject: BABYLON.Nullable<IDisposeObservable>

  /**
   * Web Audio API context for PCM audio playback
   */
  private _audioContext: AudioContext | null = null
  /**
   * Audio buffer source node for PCM playback
   */
  private _audioSource: AudioBufferSourceNode | null = null
  /**
   * Whether the player is in PCM mode
   */
  private _isPCMMode: boolean = true
  /**
   * Sample rate for PCM audio
   */
  private _sampleRate: number = 16000
  /**
   * Number of audio channels
   */
  private _channels: number = 1
  /**
   * Start time for PCM playback
   */
  private _pcmStartTime: number = 0
  /**
   * Current time for PCM playback
   */
  private _pcmCurrentTime: number = 0
  /**
   * Whether PCM playback is paused
   */
  private _pcmPaused: boolean = false
  /**
   * Whether PCM audio is currently playing
   */
  private _isPlaying: boolean = false
  /**
   * Continuous buffer for PCM data
   */
  private _continuousBuffer: Float32Array = new Float32Array(0)
  /**
   * Current playback position in samples
   */
  private _playbackPosition: number = 0
  /**
   * Flag to prevent overlapping continuation handling
   */
  private _isHandlingContinuation: boolean = false

  /**
   * Create a stream audio player
   *
   * In general disposeObservable should be `Scene` of Babylon.js
   *
   * @param disposeObservable Objects that limit the lifetime of this instance
   */
  public constructor(disposeObservable: BABYLON.Nullable<IDisposeObservable>) {
    this.onLoadErrorObservable = new BABYLON.Observable<void>()
    this.onDurationChangedObservable = new BABYLON.Observable<void>()
    this.onPlaybackRateChangedObservable = new BABYLON.Observable<void>()
    this.onMuteStateChangedObservable = new BABYLON.Observable<void>()

    this.onPlayObservable = new BABYLON.Observable<void>()
    this.onPauseObservable = new BABYLON.Observable<void>()
    this.onSeekObservable = new BABYLON.Observable<void>()

    const audio = (this._audio = new Audio())
    audio.loop = false
    audio.autoplay = false

    this._duration = 0
    this._playbackRate = 1

    this._isVirtualPlay = false
    this._virtualStartTime = 0
    this._virtualPaused = true
    this._virtualPauseCurrentTime = 0
    this._metadataLoaded = false

    audio.ondurationchange = this._onDurationChanged
    audio.onerror = this._onLoadError
    audio.onplaying = this._onPlay
    audio.onpause = this._onPause
    audio.onseeked = this._onSeek

    this._bindedDispose = this.dispose.bind(this)
    this._disposeObservableObject = disposeObservable
    if (this._disposeObservableObject !== null) {
      this._disposeObservableObject.onDisposeObservable.add(this._bindedDispose)
    }

    // Initialize AudioContext for PCM mode with matching sample rate
    this._audioContext = new AudioContext({
      sampleRate: this._sampleRate,
    })
    this._pcmStartTime = 0
    this._pcmCurrentTime = 0
    this._pcmPaused = false
    this._isPlaying = false
    this._continuousBuffer = new Float32Array(0)
    this._playbackPosition = 0
    this._isHandlingContinuation = false

    // Resume the context immediately to avoid the "suspended" state
    this._audioContext.resume().catch(err => {
      Logger.warn(`Failed to resume audio context: ${err}`)
    })
  }

  /**
   * Handle duration change event
   */
  private readonly _onDurationChanged = (): void => {
    this._duration = this._audio.duration

    if (this._isVirtualPlay) {
      this._isVirtualPlay = false
      this.onMuteStateChangedObservable.notifyObservers()
    }
    this._virtualPaused = true
    this._virtualPauseCurrentTime = 0
    this._metadataLoaded = true

    this.onDurationChangedObservable.notifyObservers()
  }

  /**
   * Handle load error event
   */
  private readonly _onLoadError = (): void => {
    this._duration = 0

    if (this._isVirtualPlay) {
      this._isVirtualPlay = false
      this.onMuteStateChangedObservable.notifyObservers()
    }
    this._virtualPaused = true
    this._virtualPauseCurrentTime = 0
    this._metadataLoaded = false

    this.onLoadErrorObservable.notifyObservers()
    this.onDurationChangedObservable.notifyObservers()
  }

  /**
   * Handle play event
   */
  private readonly _onPlay = (): void => {
    if (!this._isVirtualPlay) {
      this._audio.playbackRate = this._playbackRate
    }
    this.onPlayObservable.notifyObservers()
  }

  /**
   * Handle pause event
   */
  private readonly _onPause = (): void => {
    if (!this._isVirtualPlay) {
      this.onPauseObservable.notifyObservers()
    } else {
      if (this._virtualPaused) {
        this.onPauseObservable.notifyObservers()
      }
    }
  }

  /**
   * Flag to ignore the next seek event
   */
  private _ignoreSeekedEventOnce = false

  /**
   * Handle seek event
   */
  private readonly _onSeek = (): void => {
    if (this._ignoreSeekedEventOnce) {
      this._ignoreSeekedEventOnce = false
      return
    }
    this.onSeekObservable.notifyObservers()
  }

  /**
   * Audio duration (in seconds)
   */
  public get duration(): number {
    if (this._isPCMMode) {
      return this._duration
    } else {
      return this._audio.duration
    }
  }

  /**
   * Get the current playback position in seconds
   *
   * @returns The current playback position in seconds
   */
  public playbackPosition(): number {
    if (this._isPCMMode) {
      return this._playbackPosition / this._sampleRate / this._channels
    } else {
      return this._audio.currentTime
    }
  }

  /**
   * Current time (in seconds)
   *
   * This property may be slow to update
   */
  public get currentTime(): number {
    if (this._isPCMMode) {
      if (this._pcmPaused || !this._isPlaying) {
        return this._pcmCurrentTime
      }
      // If playing, calculate current time based on elapsed time since start
      const elapsedTime =
        (this._audioContext!.currentTime - this._pcmStartTime) * this._playbackRate
      return this._pcmCurrentTime + elapsedTime
    }
    if (this._isVirtualPlay) {
      if (this._virtualPaused) {
        return this._virtualPauseCurrentTime
      } else {
        const computedTime =
          (performance.now() / 1000 - this._virtualStartTime) * this._playbackRate
        if (computedTime > this._duration) {
          this._virtualPaused = true
          this._virtualPauseCurrentTime = this._duration
          this._onPause()
          return this._virtualPauseCurrentTime
        } else {
          return computedTime
        }
      }
    } else {
      return this._audio.currentTime
    }
  }

  public set currentTime(value: number) {
    if (this._isPCMMode) {
      this._pcmCurrentTime = value
      this._playbackPosition = Math.floor(value * this._sampleRate * this._channels)

      if (!this._pcmPaused) {
        this._pausePCM()
        this._playContinuous()
      }
      this.onSeekObservable.notifyObservers()
    } else {
      if (this._isVirtualPlay) {
        if (this._virtualPaused) {
          this._virtualPauseCurrentTime = value
        } else {
          this._virtualStartTime =
            performance.now() / 1000 - value / this._playbackRate
        }
        this._onSeek()
      } else {
        this._ignoreSeekedEventOnce = true
        this._audio.currentTime = value
      }
    }
  }

  /**
   * Set current time without notifying observers
   *
   * @param value The time in seconds to set
   * @internal
   */
  public _setCurrentTimeWithoutNotify(value: number): void {
    if (this._isPCMMode) {
      this._pcmCurrentTime = value
    } else if (this._isVirtualPlay) {
      if (this._virtualPaused) {
        this._virtualPauseCurrentTime = value
      } else {
        this._virtualStartTime =
          performance.now() / 1000 - value / this._playbackRate
      }
    } else {
      this._ignoreSeekedEventOnce = true
      this._audio.currentTime = value
    }
  }

  /**
   * Volume (0.0 to 1.0)
   */
  public get volume(): number {
    return this._audio.volume
  }

  public set volume(value: number) {
    this._audio.volume = value
  }

  /**
   * Whether the audio is muted
   */
  public get muted(): boolean {
    return this._isVirtualPlay
  }

  /**
   * Mute the audio
   */
  public mute(): void {
    if (this._isVirtualPlay) return

    this._isVirtualPlay = true
    this._virtualStartTime =
      performance.now() / 1000 - this._audio.currentTime / this._playbackRate
    this._virtualPaused = this._audio.paused
    this._virtualPauseCurrentTime = this._audio.currentTime
    this._audio.pause()

    this.onMuteStateChangedObservable.notifyObservers()
  }

  /**
   * Unmute the audio
   *
   * Unmute is possible failed if user interaction is not performed
   * @returns Whether the audio is unmuted
   */
  public async unmute(): Promise<boolean> {
    if (!this._isVirtualPlay) return false

    let notAllowedError = false

    this._ignoreSeekedEventOnce = true
    if (this._virtualPaused) {
      this._audio.currentTime = this._virtualPauseCurrentTime
    } else {
      this._audio.currentTime =
        (performance.now() / 1000 - this._virtualStartTime) * this._playbackRate

      try {
        await this._audio.play()
        this._audio.playbackRate = this._playbackRate
      } catch (e) {
        if (!(e instanceof DOMException && e.name === 'NotAllowedError')) throw e
        notAllowedError = true
      }
    }

    if (!notAllowedError) {
      this._isVirtualPlay = false
      this._virtualPaused = true
      this._virtualPauseCurrentTime = 0

      this.onMuteStateChangedObservable.notifyObservers()
      return true
    }

    return false
  }

  /**
   * Playback rate (0.07 to 16.0)
   */
  public get playbackRate(): number {
    return this._playbackRate
  }

  public set playbackRate(value: number) {
    this._setPlaybackRateWithoutNotify(value)
    this.onPlaybackRateChangedObservable.notifyObservers()
  }

  /**
   * Set playback rate without notifying observers
   *
   * @param value The playback rate to set
   * @internal
   */
  public _setPlaybackRateWithoutNotify(value: number): void {
    if (this._isVirtualPlay && !this._virtualPaused) {
      const nowInSec = performance.now() / 1000
      const currentTime = (nowInSec - this._virtualStartTime) * this._playbackRate
      this._virtualStartTime = nowInSec - currentTime / value
    }

    this._playbackRate = value
    this._audio.playbackRate = value
  }

  /**
   * Determines whether or not the browser should adjust the pitch of the audio to compensate for changes to the playback rate made by setting
   */
  public get preservesPitch(): boolean {
    return this._audio.preservesPitch
  }

  public set preservesPitch(value: boolean) {
    this._audio.preservesPitch = value
  }

  /**
   * Whether the player is paused
   */
  public get paused(): boolean {
    if (this._isPCMMode) {
      return this._pcmPaused
    } else if (this._isVirtualPlay) {
      return this._virtualPaused
    } else {
      return this._audio.paused
    }
  }

  /**
   * Audio source URL
   */
  public get source(): string {
    return this._audio.src
  }

  public set source(value: string) {
    if (value === this._audio.src) return

    this._audio.src = value
    this._metadataLoaded = false

    if (this._isVirtualPlay) {
      this._isVirtualPlay = false
      this.onMuteStateChangedObservable.notifyObservers()
    }
    this._virtualPaused = true
    this._virtualPauseCurrentTime = 0

    this._audio.load()
  }

  /**
   * Whether the audio metadata(durations) is loaded
   */
  public get metadataLoaded(): boolean {
    return this._metadataLoaded
  }

  /**
   * Play audio in virtual mode (muted)
   *
   * @returns Promise that resolves when virtual play starts
   */
  private async _virtualPlay(): Promise<void> {
    if (this._metadataLoaded) {
      if (this._virtualPaused) {
        this._virtualStartTime =
          performance.now() / 1000 -
          this._virtualPauseCurrentTime / this._playbackRate
        this._virtualPaused = false
      }
      if (!this._isVirtualPlay) {
        this._isVirtualPlay = true
        this.onMuteStateChangedObservable.notifyObservers()
      }
      this._onPlay()
    } else {
      await new Promise<void>((resolve, reject) => {
        const onDurationChanged = (): void => {
          if (this._virtualPaused) {
            this._virtualStartTime =
              performance.now() / 1000 -
              this._virtualPauseCurrentTime / this._playbackRate
            this._virtualPaused = false
          }
          if (!this._isVirtualPlay) {
            this._isVirtualPlay = true
            this.onMuteStateChangedObservable.notifyObservers()
          }
          this._onPlay()
          this.onLoadErrorObservable.removeCallback(onLoadError)
          resolve()
        }

        const onLoadError = (): void => {
          this.onDurationChangedObservable.removeCallback(onDurationChanged)

          reject(
            new DOMException(
              'The media resource indicated by the src attribute or assigned media provider object was not suitable.',
              'NotSupportedError',
            ),
          )
        }

        this.onDurationChangedObservable.addOnce(onDurationChanged)
        this.onLoadErrorObservable.addOnce(onLoadError)
      })
    }
  }

  /**
   * Flag to prevent overlapping play requests
   */
  private _playRequestBlocking = false

  /**
   * Play the audio from the current position
   *
   * If context don't have permission to play the audio, play audio in a mute state
   *
   * @returns Promise that resolves when play starts
   */
  public async play(): Promise<void> {
    if (this._isPCMMode) {
      if (!this._pcmPaused) return
      this._pcmPaused = false
      if (this._continuousBuffer.length > 0) {
        await this._playContinuous()
      }
    } else {
      if (this._isVirtualPlay && !this._virtualPaused) return

      if (this._isVirtualPlay) {
        await this._virtualPlay()
        return
      }

      if (this._playRequestBlocking) return
      this._playRequestBlocking = true

      try {
        await this._audio.play()
      } catch (e) {
        if (e instanceof DOMException && e.name === 'NotAllowedError') {
          await this._virtualPlay()
        } else {
          throw e
        }
      } finally {
        this._playRequestBlocking = false
      }
    }
  }

  /**
   * Pause the audio
   */
  public pause(): void {
    if (this._isPCMMode) {
      if (this._pcmPaused) return
      this._pausePCM()
    } else {
      if (this._isVirtualPlay) {
        if (this._virtualPaused) return
        this._virtualPaused = true

        this._virtualPauseCurrentTime =
          (performance.now() / 1000 - this._virtualStartTime) * this._playbackRate
        this._onPause()
      } else {
        this._audio.pause()
      }
    }
  }

  /**
   * Set PCM audio parameters
   *
   * @param sampleRate Sample rate of the PCM data (default: 16000)
   * @param channels Number of channels (default: 1)
   */
  public setPCMParameters(sampleRate: number = 16000, channels: number = 1): void {
    this._sampleRate = sampleRate
    this._channels = channels
  }

  /**
   * Append PCM data block to the buffer
   *
   * @param pcmData PCM data block as Uint8Array
   * @returns Promise that resolves when data is appended
   */
  public async appendPCMData(pcmData: Uint8Array): Promise<void> {
    if (!this._audioContext) {
      Logger.error('Audio context not initialized')
      return
    }

    // Ensure AudioContext is running
    if (this._audioContext.state === 'suspended') {
      await this._audioContext.resume()
    }

    // Convert Uint8Array to Float32Array
    const float32Data = new Float32Array(pcmData.length / 2)
    for (let i = 0; i < pcmData.length; i += 2) {
      // Convert 16-bit PCM to float32
      const int16 = pcmData[i] | (pcmData[i + 1] << 8)
      const sample = int16 >= 0x8000 ? -(0x10000 - int16) / 32768.0 : int16 / 32768.0
      float32Data[i / 2] = sample
    }

    // Append new data to continuous buffer
    const newBuffer = new Float32Array(
      this._continuousBuffer.length + float32Data.length,
    )
    newBuffer.set(this._continuousBuffer)
    newBuffer.set(float32Data, this._continuousBuffer.length)
    this._continuousBuffer = newBuffer

    // Update duration
    this._duration =
      this._continuousBuffer.length / this._sampleRate / this._channels
    this.onDurationChangedObservable.notifyObservers()

    // Only start playback if nothing is currently playing or handling continuation
    if (!this._isPlaying && !this._pcmPaused && !this._isHandlingContinuation) {
      await this._playContinuous()
    }
  }

  /**
   * Clear the PCM buffer and reset playback state
   */
  public clearPCMBuffer(): void {
    // Stop current playback if playing
    if (this._audioSource) {
      try {
        // Clear the onended handler to prevent it from firing after we stop
        this._audioSource.onended = null
        this._audioSource.stop()
        this._audioSource.disconnect()
      } catch (e) {
        // Ignore errors if source is already stopped
      }
      this._audioSource = null
    }

    // Clear the continuous buffer
    this._continuousBuffer = new Float32Array(0)
    this._playbackPosition = 0

    // Reset ALL state variables to initial state
    this._pcmCurrentTime = 0
    this._pcmStartTime = 0
    this._isPlaying = false
    this._pcmPaused = false // Important: reset paused state so new data can play
    this._isHandlingContinuation = false

    // Notify observers about duration change
    this._duration = 0
    this.onDurationChangedObservable.notifyObservers()
  }

  /**
   * Pause PCM audio playback
   */
  private _pausePCM(): void {
    if (!this._audioContext || !this._audioSource) return

    // Calculate elapsed time to update current time and position
    const elapsedTime =
      (this._audioContext.currentTime - this._pcmStartTime) * this._playbackRate
    this._pcmCurrentTime += elapsedTime

    // Update playback position based on elapsed time
    const elapsedSamples = Math.floor(
      elapsedTime * this._sampleRate * this._channels,
    )
    this._playbackPosition += elapsedSamples

    try {
      // Clear the onended handler to prevent it from firing after we stop
      this._audioSource.onended = null
      this._audioSource.stop()
      this._audioSource.disconnect()
    } catch (e) {
      // Ignore errors
    }
    this._audioSource = null
    this._pcmPaused = true
    this._isPlaying = false
    this._isHandlingContinuation = false // Reset continuation flag
    this.onPauseObservable.notifyObservers()
  }

  /**
   * Play continuous PCM audio from the current position
   *
   * @returns Promise that resolves when playback starts
   */
  private async _playContinuous(): Promise<void> {
    if (this._isPlaying) {
      return
    }

    if (!this._audioContext) {
      return
    }

    // Calculate remaining samples from current position
    const remainingSamples = this._continuousBuffer.length - this._playbackPosition
    if (remainingSamples <= 0) {
      return
    }

    // Ensure AudioContext is running
    if (this._audioContext.state === 'suspended') {
      await this._audioContext.resume()
    }

    // Create audio buffer for remaining samples
    const audioBuffer = this._audioContext.createBuffer(
      this._channels,
      remainingSamples / this._channels,
      this._sampleRate,
    )

    // Fill audio buffer with remaining data
    for (let channel = 0; channel < this._channels; channel++) {
      const channelData = audioBuffer.getChannelData(channel)
      for (let i = 0; i < channelData.length; i++) {
        const sampleIndex = this._playbackPosition + i * this._channels + channel
        channelData[i] =
          sampleIndex < this._continuousBuffer.length
            ? this._continuousBuffer[sampleIndex]
            : 0
      }
    }

    // Stop any existing source
    if (this._audioSource) {
      try {
        // Clear the onended handler to prevent old handlers from firing
        this._audioSource.onended = null
        this._audioSource.stop()
        this._audioSource.disconnect()
      } catch (e) {
        // Ignore errors
      }
      this._audioSource = null
    }

    // Create and start new source
    this._audioSource = this._audioContext.createBufferSource()
    this._audioSource.buffer = audioBuffer
    this._audioSource.connect(this._audioContext.destination)
    this._audioSource.playbackRate.value = this._playbackRate

    // Store the starting position and samples for this playback session
    const startPosition = this._playbackPosition
    const samplesBeingPlayed = remainingSamples

    // Handle completion
    this._audioSource.onended = () => {
      // Only process if this is still the current audio source
      if (!this._audioSource) {
        return
      }

      this._isPlaying = false
      this._audioSource = null

      // Update position to end of what we just played (use stored values, not current buffer state)
      this._playbackPosition = startPosition + samplesBeingPlayed
      // Check if more data was added during playback
      if (
        this._playbackPosition < this._continuousBuffer.length &&
        !this._pcmPaused
      ) {
        this._isHandlingContinuation = true
        this._playContinuous().finally(() => {
          this._isHandlingContinuation = false
        })
      }
    }

    this._pcmStartTime = this._audioContext.currentTime
    this._pcmPaused = false
    this._isPlaying = true
    this._audioSource.start(0)
    this.onPlayObservable.notifyObservers()
  }

  /**
   * Dispose the player
   */
  public dispose(): void {
    const audio = this._audio
    audio.pause()
    audio.ondurationchange = null
    audio.onerror = null
    audio.onplaying = null
    audio.onpause = null
    audio.onseeked = null
    this._audio.remove()

    if (this._isPCMMode) {
      if (this._audioSource) {
        this._audioSource.stop()
        this._audioSource.disconnect()
      }
      if (this._audioContext) {
        this._audioContext.close().catch(err => {
          Logger.warn(`Failed to close audio context: ${err}`)
        })
      }
      this._continuousBuffer = new Float32Array(0)
      this._playbackPosition = 0
    }

    this.onLoadErrorObservable.clear()
    this.onDurationChangedObservable.clear()
    this.onPlaybackRateChangedObservable.clear()
    this.onMuteStateChangedObservable.clear()

    this.onPlayObservable.clear()
    this.onPauseObservable.clear()
    this.onSeekObservable.clear()

    if (this._disposeObservableObject !== null) {
      this._disposeObservableObject.onDisposeObservable.removeCallback(
        this._bindedDispose,
      )
    }
  }
}
