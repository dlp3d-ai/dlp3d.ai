import { Logger } from '@/library/babylonjs/utils'
import { env } from 'next-runtime-env'
/**
 * Exception thrown when an invalid configuration key is used.
 */
export class InvalidConfigKeyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidConfigKey'
  }
}

/**
 * Synchronous configuration from env variables.
 */
export class ConfigSync {
  /**
   * Default configuration values.
   */
  private _config: Record<string, any> = {
    appName: 'babylon',
    orchestratorHost: '',
    orchestratorPort: 0,
    orchestratorPathPrefix: '/dlp3d-ai/orchestrator',
    orchestratorAudioChatPath: 'audio_chat_with_text_llm',
    orchestratorTextChatPath: 'text_chat_with_text_llm',
    orchestratorDirectStreamingPath: 'text_generate',
    orchestratorMotionSettingsPath: 'get_motion_settings',
    orchestratorVoiceSettingsPath: 'get_voice_settings',
    orchestratorTimeout: 0,
    motionFileHost: '',
    motionFilePort: 0,
    motionFilePathPrefix: '/dlp3d-ai/backend',
    motionFilePath: 'motion_file_download',
    motionFileTimeout: 0,
    maxFrontExtensionDuration: 0,
    maxRearExtensionDuration: 0.0,
    voiceSpeed: 1.0,
    faceModel: 'unitalker_emo_base_v0.4.0',
    firstBodyFastResponse: false,
    userId: 'default_user',
    characterId: 'default_character_1',
    language: 'zh',
  }

  constructor() {
    this._updateFromEnv()
  }

  private _updateFromEnv(): void {
    this._config.orchestratorHost = env('NEXT_PUBLIC_ORCHESTRATOR_HOST')
    this._config.orchestratorPort = parseInt(
      env('NEXT_PUBLIC_ORCHESTRATOR_PORT') || '443',
      10,
    )
    this._config.orchestratorPathPrefix = env('NEXT_PUBLIC_ORCHESTRATOR_PATH_PREFIX')
    this._config.orchestratorTimeout = env('NEXT_PUBLIC_ORCHESTRATOR_TIMEOUT')
    this._config.motionFileHost = env('NEXT_PUBLIC_BACKEND_HOST')
    this._config.motionFilePort = parseInt(
      env('NEXT_PUBLIC_BACKEND_PORT') || '443',
      10,
    )
    this._config.motionFilePathPrefix = env('NEXT_PUBLIC_BACKEND_PATH_PREFIX')
    this._config.motionFileTimeout = parseInt(
      env('NEXT_PUBLIC_MOTION_FILE_TIMEOUT') || '600',
      10,
    )
    this._config.maxFrontExtensionDuration = parseFloat(
      env('NEXT_PUBLIC_MAX_FRONT_EXTENSION_DURATION') || '0.0',
    )
    this._config.maxRearExtensionDuration = parseFloat(
      env('NEXT_PUBLIC_MAX_REAR_EXTENSION_DURATION') || '0.0',
    )
    this._config.language = localStorage.getItem('i18nextLng')
  }

  /**
   * Read configuration file content.
   *
   * @returns Configuration content as a dictionary.
   */
  public read(): Record<string, any> {
    return this._config
  }

  /**
   * Write configuration content to file.
   *
   * @param config Configuration content dictionary to write.
   */
  public write(config: Record<string, any>): void {
    const inputKeys = Object.keys(config)
    const requiredKeys = Object.keys(this._config)
    const missingKeys = requiredKeys.filter(x => !inputKeys.includes(x))
    const additionalKeys = inputKeys.filter(x => !requiredKeys.includes(x))

    if (additionalKeys.length > 0) {
      Logger.warn(`Extra configuration items will be ignored: ${additionalKeys}`)
    }

    if (missingKeys.length > 0) {
      const msg = `Cannot update configuration, missing required keys: ${missingKeys}`
      Logger.error(msg)
      throw new InvalidConfigKeyError(msg)
    }

    // Remove additional keys
    for (const key of additionalKeys) {
      delete config[key]
    }

    this._config = { ...config }
  }

  /**
   * Get value for specified key from configuration.
   *
   * @param key Configuration key name.
   * @returns Value corresponding to the configuration key.
   * @throws {InvalidConfigKeyError} When key doesn't exist in configuration.
   */
  public getItem(key: string): any {
    if (!(key in this._config)) {
      const msg = `${key} is not a valid key in the configuration.`
      Logger.error(msg)
      throw new InvalidConfigKeyError(msg)
    }

    return this._config[key]
  }

  /**
   * Set value for specified key in configuration.
   *
   * @param key Configuration key name.
   * @param value Value to set.
   * @throws {InvalidConfigKeyError} When key doesn't exist in configuration.
   */
  public setItem(key: string, value: any): void {
    if (!(key in this._config)) {
      const msg = `${key} is not a valid key in the configuration.`
      Logger.error(msg)
      throw new InvalidConfigKeyError(msg)
    }
    this._config[key] = value
  }
}
