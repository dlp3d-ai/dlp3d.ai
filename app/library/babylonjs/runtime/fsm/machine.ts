/* eslint-disable no-case-declarations */
import * as BABYLON from '@babylonjs/core'
import * as BABYLON_GUI from '@babylonjs/gui'
import Queue from 'yocto-queue'
import { States, stateToEnglishName } from './states'
import { ConditionedMessage, Conditions } from './conditions'
import {
  GlobalState,
  INTRINSIC_FRAME_RATE,
  IDisposeObservable,
} from '@/library/babylonjs/core'
import { Logger } from '@/library/babylonjs/utils'
import {
  OrchestratorClient,
  AdaptiveBufferSizeEstimator,
  ConnectionTimeoutError,
  StreamEndedError,
  StreamUnavailableError,
} from '@/library/babylonjs/runtime/stream'
import { AudioRecordState } from '@/data_structures/audioStreamState'
import { ConfigSync } from '@/library/babylonjs/config'
import { AssetManager } from '@/library/babylonjs/runtime/asset'
import {
  MotionClip,
  FaceClip,
  MorphTargetValues,
  RuntimeAnimationGroup,
  RuntimeBufferType,
  RuntimeAnimationRange,
} from '@/library/babylonjs/runtime/animation'
import {
  RuntimeAnimationEvent,
  RuntimeConditionedMessage,
} from '@/library/babylonjs/runtime'
import { SceneConfig, HDRI_SCENES } from '@/library/babylonjs/config/scene'
import { LoadingProgressManager } from '@/utils/progressManager'
import {
  Character,
  EyeTrackingController,
} from '@/library/babylonjs/runtime/character'
import { loadGroundMesh, loadGroundMeshWithPreset } from '@/library/babylonjs/utils'
import { PhysicsViewer } from '@babylonjs/core/Debug/physicsViewer'
import {
  getRelationship,
  getEmotion,
  getChatList,
} from '@/library/babylonjs/runtime/request'
import {
  EmotionType,
  toEmotionAdjective,
  toEmotionTypeArray,
} from '@/library/babylonjs/runtime/character/emotions'
import i18n from '@/i18n/config'

/**
 * Finite state machine that controls the core functionality of the 3DAC system.
 *
 * Responsible for managing state transitions throughout the 3DAC system, including frontend connections,
 * algorithm services, resource management, animation playback, and other core functionality coordination.
 * The state machine receives external conditions through an event queue and performs state transitions
 * based on the current state and received conditions, achieving automated system control.
 */
export class StateMachine {
  /**
   * The previous state value before the current state.
   */
  private _lastStateValue: States | null = null
  /**
   * The current state of the state machine.
   */
  private _stateValue: States = States.INIT
  /**
   * Whether the state machine is currently running.
   */
  private _running: boolean = false
  /**
   * The global state object containing shared system state.
   */
  private _globalState: GlobalState

  /**
   * Configuration synchronization handler.
   */
  private _configSync: ConfigSync

  /**
   * Event queue for processing conditioned messages.
   */
  private _eventQueue: Queue<ConditionedMessage> = new Queue()
  /**
   * Timestamp when the basic scene was launched.
   */
  private _basicSceneLaunchTimeInMilliSeconds: number = 0
  /**
   * Timeout duration for basic scene launch in milliseconds.
   */
  private _basicSceneTimeOutInMilliSeconds: number = 60000

  /**
   * Orchestrator streaming client for communication with the algorithm service.
   */
  private _orchestratorStreamingClient: OrchestratorClient | null = null
  /**
   * Asset manager for handling character and animation assets.
   */
  private _assetManager: AssetManager | null = null
  /**
   * Asset manager configuration.
   */
  private _assetManagerCfg: Record<string, any> = {}

  /**
   * Motion clips for the opening remark animation.
   */
  private _openingRemarkMotionClips: MotionClip[] = []
  /**
   * Face clips for the opening remark animation.
   */
  private _openingRemarkFaceClips: FaceClip[] = []
  /**
   * Audio clips for the opening remark animation.
   */
  private _openingRemarkAudioClips: Uint8Array[] = []
  /**
   * Whether the opening remark stream has ended.
   */
  private _openingRemarkStreamEnded: boolean = false

  /**
   * Buffer size estimators for different stream types.
   */
  private _bufferSizeEstimators: Record<string, AdaptiveBufferSizeEstimator> = {}

  /**
   * Sleep time between state machine iterations in seconds.
   */
  private _sleepTimeInSeconds: number = 0.1

  /**
   * Bound dispose function for cleanup.
   */
  private readonly _bindedDispose: BABYLON.Nullable<() => void>
  /**
   * Observable object for disposal events.
   */
  private readonly _disposeObservableObject: BABYLON.Nullable<IDisposeObservable>

  /**
   * Observable that fires when the state changes.
   */
  public readonly onStateChangedObservable = new BABYLON.Observable<void>()

  /**
   * Create a new state machine instance.
   *
   * @param globalState The global state object containing shared system state.
   * @param configSyncCfg Configuration synchronization settings.
   * @param assetManagerCfg Asset manager configuration.
   * @param bufferSizeEstimatorCfgs Configuration for buffer size estimators.
   */
  constructor(
    globalState: GlobalState,
    // configSyncCfg: Record<string, any>,
    configSync: ConfigSync,
    assetManagerCfg: Record<string, any>,
    bufferSizeEstimatorCfgs: Record<string, Record<string, any>>,
  ) {
    this._globalState = globalState
    this._configSync = configSync
    this._assetManagerCfg = assetManagerCfg
    this._globalState.runtime?.pauseAnimation()
    Object.keys(bufferSizeEstimatorCfgs).forEach(key => {
      const cfg: Record<string, any> = bufferSizeEstimatorCfgs[key]
      const className = cfg['type']
      if (className === 'AdaptiveBufferSizeEstimator') {
        this._bufferSizeEstimators[key] = new AdaptiveBufferSizeEstimator(
          cfg['name'],
          cfg['weight'],
          undefined,
          cfg['safeRate'],
        )
      } else {
        throw new Error(`Unknown buffer size estimator type: ${className}`)
      }
    })

    if (globalState.scene !== null) {
      this._bindedDispose = (): void => this.dispose()
      this._disposeObservableObject = globalState.scene
      if (this._disposeObservableObject !== null) {
        this._disposeObservableObject.onDisposeObservable.add(this._bindedDispose)
      }
    } else {
      this._bindedDispose = null
      this._disposeObservableObject = null
    }
  }

  /**
   * Get the current state value.
   *
   * @returns The current state of the state machine.
   */
  get stateValue(): States {
    return this._stateValue
  }

  /**
   * Set the current state value.
   *
   * @param value The new state value.
   */
  set stateValue(value: States) {
    this._stateValue = value
  }

  /**
   * Get whether the state machine is running.
   *
   * @returns True if the state machine is running, false otherwise.
   */
  get running(): boolean {
    return this._running
  }

  /**
   * Start the state machine.
   *
   * Initializes the state machine and begins the state loop.
   */
  async run() {
    this._lastStateValue = null
    this._stateValue = States.INIT
    this._running = true
    Logger.log(i18n.t('fsm.started', { ns: 'client' }))
    this._startStateLoop()
  }

  /**
   * Start the main state loop.
   *
   * Continuously processes state transitions based on the current state and received conditions.
   * Runs at approximately 30fps to prevent CPU overuse.
   */
  private async _startStateLoop() {
    if (!this._running) return

    while (this._running) {
      try {
        switch (this._stateValue as States) {
          case States.INIT:
            await this.init()
            break
          case States.WAITING_FOR_FRONTEND_READY:
            await this.waitingForFrontedReady()
            break
          case States.SPAWN_CHARACTER:
            await this.spawnCharacter()
            break
          case States.SPAWN_ENVIRONMENT:
            await this.spawnEnvironment()
            break
          case States.WAITING_FOR_ALGORITHM_READY_ON_START:
            await this.waitingForAlgorithmReadyOnStart()
            break
          case States.ALGORITHM_NOT_READY_ON_START:
            await this.algorithmNotReadyOnStart()
            break
          case States.CHECK_AND_UPDATE_ASSETS:
            await this.checkAndUpdateAssets()
            break
          case States.IDLE:
            await this.idle()
            break
          case States.WAITING_FOR_USER_STOP_RECORDING:
            await this.waitingForUserStopRecording()
            break
          case States.ALGORITHM_GENERATION_FAILED:
            await this.algorithmGenerationFailed()
            break
          case States.WAITING_FOR_ACTOR_APOLOGIZE_FINISHED:
            await this.waitingForActorApologizeFinished()
            break
          case States.WAITING_FOR_ACTOR_RESPOND_GENERATION_FINISHED:
            await this.waitingForActorRespondGenerationFinished()
            break
          case States.WAITING_FOR_ACTOR_DIRECT_GENERATION_FINISHED:
            await this.waitingForActorDirectGenerationFinished()
            break
          case States.ACTOR_ANIMATION_STREAMING:
            await this.actorAnimationStreaming()
            break
          case States.WAITING_FOR_ACTOR_ANIMATION_FINISHED:
            await this.waitingForActorAnimationFinished()
            break
          case States.WAITING_FOR_ACTOR_LEAVING_FINISHED:
            await this.waitingForActorLeavingFinished()
            break
          case States.WAITING_FOR_STREAMED_ANIMATION_INTERRUPTED:
            await this.waitingForStreamedAnimationInterrupted()
            break
          case States.WAITING_FOR_LOCAL_ANIMATION_INTERRUPTED:
            await this.waitingForLocalAnimationInterrupted()
            break
          case States.EXIT:
            await this.exit()
            break
          case States.WAITING_FOR_USER_START_GAME:
            await this.waitingForUserStartGame()
            break
          default: {
            Logger.error(
              i18n.t('fsm.unknownState', { ns: 'client' }) + ': ' + this._stateValue,
            )
            break
          }
        }
      } catch (e) {
        Logger.error(
          i18n.t('fsm.runtimeError', { ns: 'client' }) + ': ' + typeof e + ', ' + e,
        )
      }

      // Add a small delay to prevent CPU overuse
      await new Promise(resolve => setTimeout(resolve, 33.3)) // ~30fps
    }
  }

  /**
   * Initialize the system.
   *
   * Performs initialization processing when the system starts. If the frontend ready condition
   * is received, switches to WAITING_FOR_FRONTEND_READY state.
   */
  async init() {
    this._basicSceneLaunchTimeInMilliSeconds = performance.now()

    if (typeof window !== 'undefined') {
      LoadingProgressManager.getInstance().updateProgress(
        5,
        i18n.t('loading.initialize3DACSystem', { ns: 'client' }),
        'machine-init',
      )
    }

    await this._switchState(States.WAITING_FOR_FRONTEND_READY)
  }

  /**
   * Wait for frontend to be ready.
   *
   * Waits for the frontend program to start and establish WebSocket connection. If frontend startup
   * times out, switches to EXIT state; if frontend ready condition is received, establishes
   * WebSocket connection and switches to WAITING_FOR_ALGORITHM_READY_ON_START state.
   */
  async waitingForFrontedReady() {
    const message = this._getConditionNoWait()
    if (message === null) {
      if (
        performance.now() - this._basicSceneLaunchTimeInMilliSeconds >
        this._basicSceneTimeOutInMilliSeconds
      ) {
        Logger.error(i18n.t('fsm.basicSceneStartupTimeout', { ns: 'client' }))
        await this._switchState(States.EXIT)
        return
      }
      return
    }
    if (message.condition === Conditions.FRONTEND_READY) {
      await this._switchState(States.SPAWN_ENVIRONMENT)
      // await this._switchState(States.WAITING_FOR_ALGORITHM_READY_ON_START)
    } else if (message.condition === Conditions.USER_START_GAME) {
      // Handle USER_START_GAME condition gracefully if received early
      // This can happen if the user clicks start before the system is fully ready
      Logger.log(
        'Received USER_START_GAME condition, but system is not fully ready yet, will wait for system initialization to complete',
      )
      // Re-queue the message to be processed later when the system is ready
      this.putConditionedMessage(message)
    } else {
      this._logUnexpectedCondition(message)
    }
  }

  /**
   * Spawn the 3D environment.
   *
   * Loads the HDR environment and ground model based on configuration or URL parameters.
   * Handles scene selection and environment setup.
   */
  async spawnEnvironment() {
    const message = this._getConditionNoWait()
    if (message !== null) {
      if (message.condition === Conditions.USER_START_GAME) {
        Logger.log(
          'Received USER_START_GAME condition, but environment has not finished loading yet, will wait for environment loading to complete',
        )
        this.putConditionedMessage(message)
        return
      }
    }

    if (typeof window !== 'undefined') {
      LoadingProgressManager.getInstance().updateProgress(
        20,
        i18n.t('loading.loadEnvironment', { ns: 'client' }),
        'machine-environment',
      )
    }

    const loadGroundModel = async (groundConfig: SceneConfig['groundModel']) => {
      try {
        if (groundConfig) {
          // Load specific ground model for this scene
          await loadGroundMesh(
            this._globalState.scene,
            '/models/ground/',
            groundConfig.filename,
            groundConfig.translation,
            groundConfig.rotation,
            groundConfig.scale,
            true,
          )
          Logger.log(`Ground model loaded: ${groundConfig.filename}`)
        } else {
          // Fallback to default ground model
          await loadGroundMeshWithPreset(this._globalState.scene, 'DEFAULT')
          Logger.log('Using default ground model')
        }
      } catch (error) {
        Logger.warn(`Failed to load ground model, nothing will be shown: ${error}`)
      }
    }

    const loadHDREnvironment = (hdriFileName: string) => {
      try {
        const hdrTexture = new BABYLON.EquiRectangularCubeTexture(
          `/img/hdr/${hdriFileName}`,
          this._globalState.scene,
          1024,
        )
        this._globalState.scene.environmentTexture = hdrTexture
        this._globalState.scene.createDefaultSkybox(hdrTexture, true, 1000, 0)

        Logger.log(`HDRi environment loaded: ${hdriFileName}`)
      } catch (error) {
        Logger.error(i18n.t('fsm.hdrLoadingError', { ns: 'client' }) + ': ' + error)
      }
    }

    const changeScene = async (sceneIndex: number) => {
      if (sceneIndex >= 0 && sceneIndex < HDRI_SCENES.length) {
        const sceneConfig = HDRI_SCENES[sceneIndex]

        // Load HDR environment
        await loadHDREnvironment(sceneConfig.hdri)

        // Load matching ground model
        await loadGroundModel(sceneConfig.groundModel)

        Logger.log(`Scene changed to: ${sceneConfig.name}`)
      }
    }

    const selectedSceneIndex = parseInt(
      localStorage.getItem('dlp_scene_index') || '0',
    )

    try {
      await changeScene(selectedSceneIndex)
    } catch (error) {
      Logger.error(i18n.t('fsm.sceneSetupError', { ns: 'client' }) + ': ' + error)
      await this._switchState(States.EXIT)
      return
    }

    await this._switchState(States.SPAWN_CHARACTER)
  }

  /**
   * Spawn the 3D character.
   *
   * Loads character configuration, downloads character model, and sets up character assets.
   * Handles character-specific physics constraints and morph targets.
   */
  async spawnCharacter() {
    const message = this._getConditionNoWait()
    if (message !== null) {
      if (message.condition === Conditions.USER_START_GAME) {
        Logger.log(
          'Received USER_START_GAME condition, but character has not finished loading yet, will wait for character loading to complete',
        )
        this.putConditionedMessage(message)
        return
      }
    }

    if (typeof window !== 'undefined') {
      LoadingProgressManager.getInstance().updateProgress(
        25,
        i18n.t('loading.loadCharacterConfig', { ns: 'client' }),
        'machine-character',
      )
    }

    // Clean up old instance if it exists
    if (this._orchestratorStreamingClient) {
      await this._orchestratorStreamingClient.interrupt()
      this._globalState.webSocketState?.disconnectWebSocket()
      this._orchestratorStreamingClient.dispose()
    }

    const assetManagerKeysToCopy = [
      'orchestratorHost',
      'orchestratorPort',
      'orchestratorPathPrefix',
      'orchestratorTimeout',
      'orchestratorDirectStreamingPath',
      'orchestratorMotionSettingsPath',
      'orchestratorVoiceSettingsPath',
      'motionFileHost',
      'motionFilePort',
      'motionFilePathPrefix',
      'motionFilePath',
      'motionFileTimeout',
      'userId',
      'characterId',
    ]
    for (const key of assetManagerKeysToCopy) {
      this._assetManagerCfg[key] = await this._configSync.getItem(key)
    }
    const className = this._assetManagerCfg['type']
    if (className === 'AssetManager') {
      const userId = this._assetManagerCfg['userId']
      const characterId = this._assetManagerCfg['characterId']
      const faceModel = this._assetManagerCfg['faceModel']
      const orchestratorHost = this._assetManagerCfg['orchestratorHost']
      const orchestratorPort = this._assetManagerCfg['orchestratorPort']
      const orchestratorPathPrefix = this._assetManagerCfg['orchestratorPathPrefix']
      const orchestratorTimeout = this._assetManagerCfg['orchestratorTimeout']
      const orchestratorDirectStreamingPath =
        this._assetManagerCfg['orchestratorDirectStreamingPath']
      const orchestratorMotionSettingsPath =
        this._assetManagerCfg['orchestratorMotionSettingsPath']
      const orchestratorVoiceSettingsPath =
        this._assetManagerCfg['orchestratorVoiceSettingsPath']
      const motionFileHost = this._assetManagerCfg['motionFileHost']
      const motionFilePort = this._assetManagerCfg['motionFilePort']
      const motionFilePathPrefix = this._assetManagerCfg['motionFilePathPrefix']
      const motionFilePath = this._assetManagerCfg['motionFilePath']
      const motionFileTimeout = this._assetManagerCfg['motionFileTimeout']
      const speechTexts = this._assetManagerCfg['speechTexts'] // This comes from original assetManagerCfg, not config sync

      const orchestratorAPI = `https://${orchestratorHost}:${orchestratorPort}${orchestratorPathPrefix}`
      const motionSettingFullPath = `${orchestratorAPI}/${orchestratorMotionSettingsPath}/${userId}/${characterId}`
      const voiceSettingFullPath = `${orchestratorAPI}/${orchestratorVoiceSettingsPath}/${userId}/${characterId}`
      const settings = [motionSettingFullPath, voiceSettingFullPath]
      const controller = new AbortController()

      // Use fallback if orchestratorTimeout is undefined or NaN
      const safeTimeout =
        orchestratorTimeout && !isNaN(orchestratorTimeout) ? orchestratorTimeout : 30
      const extendedTimeout = Math.max(safeTimeout * 2, 60) // At least 60 seconds
      const timeoutId = setTimeout(() => controller.abort(), extendedTimeout * 1000)

      try {
        const promises = settings.map(async (settingFullPath, index) => {
          const response = await fetch(settingFullPath, {
            method: 'GET',
            signal: controller.signal,
          })

          if (response.status !== 200) {
            Logger.error(
              i18n.t('fsm.getConfigFailed', { ns: 'client' }) +
                ': ' +
                settingFullPath +
                ': ' +
                response.status +
                ', ' +
                response.statusText,
            )
            this._switchState(States.EXIT)
            return
          }
          const jsonData = await response.json()
          return jsonData
        })

        const results = await Promise.all(promises)
        clearTimeout(timeoutId)

        this._assetManagerCfg['avatar'] = results[0]['avatar']
        this._assetManagerCfg['ttsAdapter'] = results[1]['tts_adapter']
        this._assetManagerCfg['voiceName'] = results[1]['voice']
        this._assetManagerCfg['voiceSpeed'] = results[1]['voice_speed']
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
          Logger.error(i18n.t('fsm.characterConfigFetchTimeout', { ns: 'client' }))
        } else {
          Logger.error(
            i18n.t('fsm.characterConfigFetchFailed', { ns: 'client' }) + ': ' + e,
          )
        }
        await this._switchState(States.EXIT)
        return
      }

      const ttsAdapter = this._assetManagerCfg['ttsAdapter']
      const voiceName = this._assetManagerCfg['voiceName']
      const voiceSpeed = this._assetManagerCfg['voiceSpeed']
      // Use the updated avatar value, with fallback to the original value
      const avatar = this._assetManagerCfg['avatar']

      if (typeof window !== 'undefined') {
        LoadingProgressManager.getInstance().updateProgress(
          30,
          i18n.t('loading.loadCharacterStaticAssets', { ns: 'client' }),
          'machine-character',
        )
      }

      this._assetManager = new AssetManager(
        this._globalState,
        ttsAdapter,
        voiceName,
        voiceSpeed,
        faceModel,
        avatar,
        userId,
        characterId,
        orchestratorHost,
        orchestratorPort,
        orchestratorPathPrefix,
        orchestratorDirectStreamingPath,
        motionFileHost,
        motionFilePort,
        motionFilePathPrefix,
        motionFilePath,
        motionFileTimeout,
        speechTexts,
      )
    } else {
      Logger.error(
        i18n.t('fsm.unknownAssetManagerType', { ns: 'client' }) + ': ' + className,
      )
      await this._switchState(States.EXIT)
      return
    }

    try {
      // Setup ETA countdown timer
      const progressManager = LoadingProgressManager.getInstance()
      const estimatedTimeSeconds = this._assetManager.motionFileTimeout * 1.1
      let remainingSeconds = estimatedTimeSeconds
      let countdownInterval: NodeJS.Timeout | null = null

      // Get current progress to keep it unchanged during countdown
      const currentState = progressManager.getCurrentProgress()
      const startProgress = currentState.progress

      countdownInterval = setInterval(() => {
        if (remainingSeconds > 0) {
          progressManager.updateProgress(
            startProgress,
            i18n.t('loading.loadCharacterStaticAssets', { ns: 'client' }) +
              `${remainingSeconds}s`,
            'machine-assets',
          )
          remainingSeconds--
        }
      }, 1000)

      await this._assetManager.syncCharacterStaticAssets()

      if (countdownInterval) {
        clearInterval(countdownInterval)
      }
    } catch (e) {
      Logger.error(
        i18n.t('fsm.characterStaticAssetsDownloadFailed', { ns: 'client' }) +
          ': ' +
          e,
      )
      await this._switchState(States.EXIT)
      return
    }

    if (typeof window !== 'undefined') {
      LoadingProgressManager.getInstance().updateProgress(
        40,
        i18n.t('loading.loadCharacterModel', { ns: 'client' }),
        'machine-character',
      )
    }

    try {
      if (!this._assetManager.morphTargetsFileUrl) {
        throw new Error('morphTargetsFileUrl is null')
      }

      const response = await fetch(this._assetManager.morphTargetsFileUrl)
      if (!response.ok) {
        Logger.error(i18n.t('fsm.fetchMorphTargetsMetadataFailed', { ns: 'client' }))
        await this._switchState(States.EXIT)
        return
      }
      const morphTargetsMeta = await response.json()

      const chatList = await getChatList(this._assetManagerCfg['userId'])
      const idx = chatList.character_id_list.indexOf(
        this._assetManagerCfg['characterId'],
      )

      if (idx === -1) {
        throw new Error('Character id not found in chat list')
      }

      await this._loadCharacter(
        chatList.character_name_list[idx],
        this._assetManager.meshFileUrl,
        this._assetManager.constraintsFileUrl,
        this._assetManager.rigidBodiesFileUrl,
        morphTargetsMeta['mesh_name'],
      )

      this._updateRelationshipAndEmotion(false)

      await this._switchState(States.WAITING_FOR_ALGORITHM_READY_ON_START)
    } catch (e) {
      Logger.error(
        i18n.t('fsm.characterModelLoadingFailed', { ns: 'client' }) + ': ' + e,
      )
      await this._switchState(States.EXIT)
      return
    }
  }

  /**
   * Wait for algorithm to be ready on startup.
   *
   * Waits for algorithm service connection to be ready during system startup. If algorithm
   * connection succeeds, switches to CHECK_AND_UPDATE_ASSETS state; if algorithm connection
   * fails, switches to ALGORITHM_NOT_READY_ON_START state.
   */
  async waitingForAlgorithmReadyOnStart() {
    if (typeof window !== 'undefined') {
      LoadingProgressManager.getInstance().updateProgress(
        60,
        i18n.t('loading.waitForAlgorithmReady', { ns: 'client' }),
        'machine-assets',
      )
    }

    const message = this._getConditionNoWait()
    if (message !== null) {
      if (message.condition === Conditions.USER_START_GAME) {
        // Handle USER_START_GAME condition gracefully if received early
        Logger.log(
          'Received USER_START_GAME condition, but algorithm is not fully ready yet, will wait for algorithm initialization to complete',
        )
        // Re-queue the message to be processed later when the system is ready
        this.putConditionedMessage(message)
        return
      }
    }

    try {
      await this._uploadActorText('Health check')
      const requestTime = Date.now()
      if (this._orchestratorStreamingClient === null) {
        Logger.error(i18n.t('fsm.noRunningStreamingClientFound', { ns: 'client' }))
        await this._handleAlgorithmGenerationFailure()
        return
      }

      const orchestratorTimeout = this._orchestratorStreamingClient.timeOut ?? 10
      let currentTime: number
      let streamReady: boolean | undefined
      let readyTime: number
      while (true) {
        currentTime = Date.now()
        streamReady = await this._orchestratorStreamingClient.streamReady()
        if (streamReady) {
          readyTime = currentTime
          break
        } else {
          if (currentTime - requestTime > orchestratorTimeout * 1000) {
            Logger.error(
              i18n.t('fsm.algorithmTimedOutDuringStreaming', { ns: 'client' }),
            )
            await this._handleAlgorithmGenerationFailure()
            return
          }
          await new Promise(resolve =>
            setTimeout(resolve, this._sleepTimeInSeconds * 1000),
          )
        }
      }
      let streamEnd: boolean | undefined
      while (true) {
        currentTime = Date.now()
        streamEnd = await this._orchestratorStreamingClient.streamEnd()
        if (streamEnd) {
          break
        } else {
          if (currentTime - readyTime > orchestratorTimeout * 1000) {
            Logger.error(
              i18n.t('fsm.algorithmTimedOutDuringStreaming', { ns: 'client' }),
            )
            await this._handleAlgorithmGenerationFailure()
            return
          }
          await new Promise(resolve =>
            setTimeout(resolve, this._sleepTimeInSeconds * 1000),
          )
        }
      }

      const streams = await this._orchestratorStreamingClient.getNetworkStreams()
      if (Object.keys(streams).length !== 3) {
        Logger.error(
          i18n.t('fsm.incorrectStreamNumber', { ns: 'client' }) +
            ': ' +
            Object.keys(streams).length,
        )
        await this._handleAlgorithmGenerationFailure()
        return
      }

      this._switchState(States.CHECK_AND_UPDATE_ASSETS)
    } catch (e) {
      Logger.error(
        i18n.t('fsm.streamingBufferEvaluationFailed', { ns: 'client' }) + ': ' + e,
      )
      await this._switchState(States.ALGORITHM_NOT_READY_ON_START)
    }
  }

  /**
   * Handle algorithm not ready on startup.
   *
   * Handles the case when algorithm service connection fails during startup. If configuration
   * update condition is received, updates configuration and switches to WAITING_FOR_ALGORITHM_READY_ON_START state.
   */
  async algorithmNotReadyOnStart() {
    const message = this._getConditionNoWait()
    if (message === null) {
      return
    }
    if (message.condition === Conditions.FRONTEND_UPDATE_CONFIG) {
      const data = message.data
      try {
        if (data) {
          await this._configSync.write(data)
        }
      } catch (e) {
        Logger.error(
          i18n.t('fsm.configurationUpdateFailed', { ns: 'client' }) + ': ' + e,
        )
        return
      }
      await this._switchState(States.WAITING_FOR_ALGORITHM_READY_ON_START)
    } else {
      this._logUnexpectedCondition(message)
    }
  }

  /**
   * Load a 3D character model.
   *
   * @param characterName The name of the character to load.
   * @param url The URL of the character model file.
   * @param constraintsUrl The URL of the physics constraints file.
   * @param rigidBodiesUrl The URL of the rigid bodies file.
   * @param morphTargetMeshName The name of the mesh for morph targets.
   */
  private async _loadCharacter(
    characterName: string,
    url: string | null,
    constraintsUrl: string | null,
    rigidBodiesUrl: string | null,
    morphTargetMeshName: string | null,
  ) {
    if (url === null || morphTargetMeshName === null) {
      Logger.error(
        i18n.t('fsm.modelFileUrlOrMorphTargetMeshNameEmpty', { ns: 'client' }),
      )
      await this._switchState(States.EXIT)
      return
    }

    const newCharacter = new Character(this._globalState, characterName)

    const clothSimulationEnabled = localStorage.getItem('cloth_simulation')
    if (clothSimulationEnabled === '0') {
      constraintsUrl = null
      rigidBodiesUrl = null
    }
    Logger.log('Loading character model: ' + url)
    await newCharacter.loadGLBAsync(
      this._globalState.scene,
      url,
      new BABYLON.Vector3(0, 0, 0),
      new BABYLON.Vector3(0, 0, 0),
      new BABYLON.Vector3(1, 1, 1),
      undefined,
      constraintsUrl,
      rigidBodiesUrl,
    )
    this._globalState.runtime?.addCharacter(newCharacter)

    this._globalState.characters.push(newCharacter)

    try {
      const targetCharacter = this._globalState.characters[0]
      if (!targetCharacter) {
        Logger.error('Character not found')
        return
      }

      targetCharacter.runtimeAnimationGroup.initializeMorphTargets(
        morphTargetMeshName,
      )
      const boneEyeTrackingController = new EyeTrackingController(
        this._globalState.scene,
      )
      this._globalState.eyeTracker = boneEyeTrackingController

      const debugModeEnabled =
        localStorage.getItem('debug_mode') === '1' ? true : false
      if (debugModeEnabled) {
        const viewer = new PhysicsViewer(
          this._globalState.scene,
          0,
          this._globalState.utilityLayer,
        )
        if (targetCharacter.dynamicBoneSolver?.rigidBodies !== undefined) {
          Object.values(targetCharacter.dynamicBoneSolver!.rigidBodies).forEach(
            body => {
              viewer.showBody(body)
            },
          )
        }
      }
    } catch (err) {
      Logger.error(i18n.t('fsm.characterSetupError', { ns: 'client' }) + ': ' + err)
      await this._switchState(States.EXIT)
      return
    }
  }

  /**
   * Check and update assets.
   *
   * Checks if local assets are ready, including animation files, audio files, etc. If assets
   * are ready, initializes multi-stream sender and switches to ACTOR_ANIMATION_STREAMING state;
   * if assets are not ready, switches to EXIT state.
   */
  async checkAndUpdateAssets() {
    if (this._assetManager === null) {
      Logger.error(i18n.t('fsm.noRunningAssetManagerFound', { ns: 'client' }))
      await this._switchState(States.EXIT)
      return
    }

    // Clean up old instance if it exists
    if (this._orchestratorStreamingClient) {
      await this._orchestratorStreamingClient.interrupt()
      this._globalState.webSocketState?.disconnectWebSocket()
      this._orchestratorStreamingClient.dispose()
    }

    try {
      if (typeof window !== 'undefined') {
        LoadingProgressManager.getInstance().updateProgress(
          70,
          i18n.t('loading.syncLocalAssets', { ns: 'client' }),
          'machine-assets',
        )
      }

      // Setup ETA countdown timer
      const progressManager = LoadingProgressManager.getInstance()
      const estimatedTimeSeconds = this._assetManager.motionFileTimeout * 2 * 1.1
      let remainingSeconds = estimatedTimeSeconds
      let countdownInterval: NodeJS.Timeout | null = null

      // Get current progress to keep it unchanged during countdown
      const currentState = progressManager.getCurrentProgress()
      const startProgress = currentState.progress

      countdownInterval = setInterval(() => {
        if (remainingSeconds > 0) {
          progressManager.updateProgress(
            startProgress,
            i18n.t('loading.syncLocalAssets', { ns: 'client' }) +
              `${remainingSeconds}s`,
            'machine-assets',
          )
          remainingSeconds--
        }
      }, 1000)

      // await this._assetManager.resetDatabase()
      await this._assetManager.syncMotion()
      await this._assetManager.syncAudioAndFace()
      // this._assetManager.logCacheSize()

      if (countdownInterval) {
        clearInterval(countdownInterval)
      }

      const character = this._globalState.characters[0]
      Object.keys(this._assetManager.motionStatesToID).forEach(motionState => {
        const motionIDPairs = this._assetManager!.motionStatesToID[motionState]
        motionIDPairs.forEach(motionIDPair => {
          const [motionID, hitRatio] = motionIDPair
          const motionClip = this._assetManager!.motionClips[motionID]
          const loopRange = new RuntimeAnimationRange()
          let loopable = false
          if (
            Object.keys(this._assetManager!.motionLoops).includes(
              motionID.toString(),
            )
          ) {
            const range = this._assetManager!.motionLoops[motionID]
            loopRange.start = range[0]
            loopRange.end = range[1]
            loopable = true
          }
          character.runtimeAnimationGroup.addJointAnimationClipLocal(
            motionState,
            motionClip,
            loopable,
            loopRange,
          )
        })
      })
      for (const [faceID, faceClip] of Object.entries(
        this._assetManager.faceClips,
      )) {
        character.runtimeAnimationGroup.setMorphTargetAnimationClipLocal(
          faceID,
          faceClip,
        )
      }

      for (const [motionLabel, audio] of Object.entries(
        this._assetManager.audioBytes,
      )) {
        this._globalState.runtime?.setAudioLocal(motionLabel, audio)
      }
      character.runtimeAnimationGroup.switchJointAnimation(
        'long_idle',
        RuntimeBufferType.LONG_IDLE,
      )
      this._globalState.runtime?.addConditionedMessage(
        new RuntimeConditionedMessage(RuntimeAnimationEvent.USE_LINEAR_BLEND),
      )

      if (typeof window !== 'undefined') {
        LoadingProgressManager.getInstance().updateProgress(
          80,
          i18n.t('loading.generateOpeningRemark', { ns: 'client' }),
          'machine-assets',
        )
      }
      const language = await this._configSync.getItem('language')
      if (language === 'zh') {
        await this._uploadUserTextStreaming('用户已进入对话')
      } else if (language === 'en') {
        await this._uploadUserTextStreaming('The user has entered the chat')
      } else {
        Logger.error(
          i18n.t('fsm.unsupportedLanguage', { ns: 'client' }) + ': ' + language,
        )
        await this._switchState(States.EXIT)
        return
      }
    } catch (e) {
      Logger.error(i18n.t('fsm.localAssetSyncFailed', { ns: 'client' }) + ': ' + e)
      await this._switchState(States.EXIT)
      return
    }

    if (this._orchestratorStreamingClient === null) {
      Logger.error(i18n.t('fsm.noRunningStreamingClientFound', { ns: 'client' }))
      await this._handleAlgorithmGenerationFailure()
      return
    }
    let respType: BABYLON.Nullable<string> = null
    let cnt = 0
    const waitTimeInSeconds = this._orchestratorStreamingClient.timeOut ?? 10
    const sleepTimeInSeconds = 0.1
    const retryTimes = waitTimeInSeconds / sleepTimeInSeconds
    while (true) {
      respType = await this._orchestratorStreamingClient.getResponseType()
      if (respType === null) {
        await new Promise(resolve => setTimeout(resolve, sleepTimeInSeconds * 1000))
        cnt += 1
        if (cnt > retryTimes) {
          Logger.error(
            i18n.t('fsm.waitForServiceResponseTypeTimeout', { ns: 'client' }),
          )
          await this._switchState(States.EXIT)
          return
        }
        continue
      }
      break
    }
    cnt = 0
    let streamReady = false
    while (true) {
      streamReady = await this._orchestratorStreamingClient.streamReady()
      if (!streamReady) {
        await new Promise(resolve => setTimeout(resolve, sleepTimeInSeconds * 1000))
        cnt += 1
        if (cnt > retryTimes) {
          Logger.error(i18n.t('fsm.waitForDataStreamReadyTimeout', { ns: 'client' }))
          await this._switchState(States.EXIT)
          return
        }
        continue
      }
      break
    }

    if (respType === 'normal') {
      let animationDict: Record<string, any> = {}
      try {
        animationDict = await this._orchestratorStreamingClient!.getAnimation()
      } catch (error) {
        if (error instanceof StreamUnavailableError) {
          Logger.error(i18n.t('fsm.dataStreamActuallyUnavailable', { ns: 'client' }))
          await this._switchState(States.EXIT)
          return
        } else if (error instanceof StreamEndedError) {
          Logger.error(i18n.t('fsm.dataStreamEnded', { ns: 'client' }))
          await this._switchState(States.EXIT)
          return
        } else if (error instanceof ConnectionTimeoutError) {
          Logger.error(i18n.t('fsm.dataStreamConnectionTimedOut', { ns: 'client' }))
          await this._switchState(States.EXIT)
          return
        } else {
          Logger.error(i18n.t('fsm.unknownError', { ns: 'client' }) + ': ' + error)
          await this._switchState(States.EXIT)
          return
        }
      }
      if (Object.keys(animationDict).length !== 3) {
        Logger.error(
          i18n.t('fsm.dataStreamAvailableWithIncompleteChannel', { ns: 'client' }) +
            ': ' +
            Object.keys(animationDict),
        )
        await this._switchState(States.EXIT)
        return
      }
      this._addOpeningRemarkAnimation(animationDict)
    }

    if (typeof window !== 'undefined') {
      LoadingProgressManager.getInstance().updateProgress(
        95,
        i18n.t('loading.systemReady', { ns: 'client' }),
        'machine-ready',
      )
    }

    await this._switchState(States.WAITING_FOR_USER_START_GAME)
  }

  /**
   * Wait for actor enter animation to finish.
   *
   * If animation finished condition is received, switches to IDLE state.
   */
  async waitingForActorEnterFinished() {
    const message = this._getConditionNoWait()
    if (message === null) {
      return
    }
    if (message.condition === Conditions.ANIMATION_FINISHED) {
      // play enter animation
      this._setRecordAudioButtonEnabled(true)
      await this._switchState(States.IDLE)
    } else {
      await this._logUnexpectedCondition(message)
    }
  }

  /**
   * Idle state.
   *
   * The state machine should remain in this state most of the time when no user input or debug
   * input is received. If user start recording condition is received, switches to WAITING_FOR_USER_UPLOAD;
   * if upload 3DAC dialogue text condition is received, uploads dialogue text to orchestrator service
   * and switches to WAITING_FOR_ACTOR_DIRECT_ANIMATION_FINISHED.
   */
  async idle() {
    const message = this._getConditionNoWait()
    if (message === null) {
      return
    }
    if (message.condition === Conditions.FRONTEND_UPDATE_CONFIG) {
      // const data = message.data
      return
    }
    if (message.condition === Conditions.USER_START_RECORDING) {
      const character = this._globalState.characters[0]
      character.runtimeAnimationGroup.switchJointAnimation(
        'listen',
        RuntimeBufferType.LOCAL,
      )
      character.runtimeAnimationGroup.switchMorphTargetAnimation(
        'listen',
        RuntimeBufferType.LOCAL,
      )
      this._globalState.runtime?.switchAudioLocal('listen')
      this._globalState.runtime?.addConditionedMessage(
        new RuntimeConditionedMessage(
          RuntimeAnimationEvent.TO_LOCAL_SOFT_IN_SOFT_OUT,
        ),
      )
      this._globalState.runtime?.addConditionedMessage(
        new RuntimeConditionedMessage(RuntimeAnimationEvent.RHS_LOOPABLE),
      )
      const success = await this._startUserAudioStreaming()
      if (success) {
        await this._switchState(States.WAITING_FOR_USER_STOP_RECORDING)
      }
    } else {
      this._logUnexpectedCondition(message)
    }
  }

  /**
   * Wait for algorithm to be ready.
   *
   * If algorithm is ready, switches to IDLE; if algorithm is not ready, switches to ALGORITHM_NOT_READY.
   */
  async waitingForAlgorithmReady() {}

  /**
   * Wait for user to stop recording.
   *
   * If audio upload condition is received, uploads audio to orchestrator service, records request ID,
   * and switches to WAITING_FOR_ACTOR_RESPOND_GENERATION_FINISHED.
   */
  async waitingForUserStopRecording() {
    const message = this._getConditionNoWait()
    if (message === null) {
      return
    }
    if (message.condition === Conditions.ANIMATION_FINISHED) {
      const character = this._globalState.characters[0]
      character.runtimeAnimationGroup.switchJointAnimation(
        'listen',
        RuntimeBufferType.LOCAL,
      )
      this._globalState.runtime?.addConditionedMessage(
        new RuntimeConditionedMessage(
          RuntimeAnimationEvent.TO_LOCAL_SOFT_IN_SOFT_OUT,
        ),
      )
      this._globalState.runtime?.addConditionedMessage(
        new RuntimeConditionedMessage(RuntimeAnimationEvent.USE_CUBIC_BLEND),
      )
    } else if (message.condition === Conditions.USER_STOP_RECORDING) {
      // Temporarily skip think animation, directly switch to long IDLE for faster response
      this._globalState.runtime?.addConditionedMessage(
        new RuntimeConditionedMessage(RuntimeAnimationEvent.SOFT_INTERRUPT),
      )
      this._globalState.runtime?.addConditionedMessage(
        new RuntimeConditionedMessage(RuntimeAnimationEvent.USE_CUBIC_BLEND),
      )
      await this._stopUserAudioStreaming()
      await this._switchState(States.WAITING_FOR_LOCAL_ANIMATION_INTERRUPTED)
    } else {
      this._logUnexpectedCondition(message)
    }
  }

  /**
   * Wait for local animation to be interrupted.
   *
   * Handles the transition after local animation interruption.
   */
  async waitingForLocalAnimationInterrupted() {
    const message = this._getConditionNoWait()
    if (message === null) {
      return
    } else if (message.condition === Conditions.ANIMATION_FINISHED) {
      await this._switchState(States.WAITING_FOR_ACTOR_RESPOND_GENERATION_FINISHED)
    } else {
      this._logUnexpectedCondition(message)
    }
  }

  /**
   * Wait for 3DAC response animation generation to finish.
   *
   * If 3DAC leaving generation result is received, switches to WAITING_FOR_ACTOR_LEAVING_FINISHED;
   * if general 3DAC animation generation result is received, switches to WAITING_FOR_ACTOR_ANIMATION_FINISHED;
   * if 3DAC generation failure result is received, switches to ALGORITHM_GENERATION_FAILED.
   */
  async waitingForActorRespondGenerationFinished() {
    const message = this._getConditionNoWait()
    if (message !== null && message.condition === Conditions.USER_START_RECORDING) {
      this._orchestratorStreamingClient?.interrupt()
      this._orchestratorStreamingClient?.dispose()
      this._orchestratorStreamingClient = null
      // switch local animation to listen
      const success = await this._startUserAudioStreaming()
      if (success) {
        await this._switchState(States.WAITING_FOR_USER_STOP_RECORDING)
      }
      await this._switchState(States.WAITING_FOR_USER_STOP_RECORDING)
    } else if (message === null) {
      if (this._orchestratorStreamingClient === null) {
        Logger.error(i18n.t('fsm.noRunningStreamingClientFound', { ns: 'client' }))
        await this._handleAlgorithmGenerationFailure()
      }

      const resp_type = await this._orchestratorStreamingClient?.getResponseType()
      switch (resp_type) {
        case 'normal':
          const streamReady = await this._orchestratorStreamingClient?.streamReady()
          if (!streamReady) {
            // Received data is not long enough, wait for next response_type query
            return
          }

          let animationDict: Record<string, any> = {}
          try {
            animationDict = await this._orchestratorStreamingClient!.getAnimation()
          } catch (error) {
            if (error instanceof StreamUnavailableError) {
              Logger.error(
                i18n.t('fsm.dataStreamActuallyUnavailable', { ns: 'client' }),
              )
              await this._handleAlgorithmGenerationFailure()
              return
            } else if (error instanceof StreamEndedError) {
              Logger.error(i18n.t('fsm.dataStreamEnded', { ns: 'client' }))
              await this._handleAlgorithmGenerationFailure()
              return
            } else if (error instanceof ConnectionTimeoutError) {
              Logger.error(
                i18n.t('fsm.dataStreamConnectionTimedOut', { ns: 'client' }),
              )
              await this._handleAlgorithmGenerationFailure()
              return
            } else {
              Logger.error(
                i18n.t('fsm.unknownError', { ns: 'client' }) + ': ' + error,
              )
              await this._handleAlgorithmGenerationFailure()
              return
            }
          }
          if (Object.keys(animationDict).length !== 3) {
            Logger.error(
              i18n.t('fsm.dataStreamAvailableWithIncompleteChannel', {
                ns: 'client',
              }) +
                ': ' +
                Object.keys(animationDict),
            )
            await this._handleAlgorithmGenerationFailure()
            return
          }
          const animationGroup =
            this._globalState.characters[0].runtimeAnimationGroup
          await this._feedStreamedAnimation(animationDict, animationGroup)
          const motionClip = animationDict['motion'] as MotionClip
          const faceClip = animationDict['face'] as FaceClip

          const motionTimelineShift =
            motionClip.timelineStartIdx !== null
              ? motionClip.timelineStartIdx / INTRINSIC_FRAME_RATE
              : 0
          const faceTimelineShift =
            faceClip.timelineStartIdx !== null
              ? faceClip.timelineStartIdx / INTRINSIC_FRAME_RATE
              : 0
          this._globalState.runtime!.addConditionedMessage(
            new RuntimeConditionedMessage(
              RuntimeAnimationEvent.TO_STREAMED_SOFT_IN_SOFT_OUT,
            ),
          )

          const earliestShift = Math.min(motionTimelineShift, faceTimelineShift, 0)
          const motionDelayedTimeInMilliseconds =
            (motionTimelineShift - earliestShift) * 1000
          const morphDelayedTimeInMilliseconds =
            (faceTimelineShift - earliestShift) * 1000
          const audioDelayedTimeInMilliseconds = (0 - earliestShift) * 1000
          this._globalState.runtime!.addConditionedMessage(
            new RuntimeConditionedMessage(
              RuntimeAnimationEvent.MOTION_DELAYED_PLAY,
              {
                delay_time: motionDelayedTimeInMilliseconds,
              },
            ),
          )
          this._globalState.runtime!.addConditionedMessage(
            new RuntimeConditionedMessage(RuntimeAnimationEvent.MORPH_DELAYED_PLAY, {
              delay_time: morphDelayedTimeInMilliseconds,
            }),
          )
          this._globalState.runtime!.addConditionedMessage(
            new RuntimeConditionedMessage(RuntimeAnimationEvent.AUDIO_DELAYED_PLAY, {
              delay_time: audioDelayedTimeInMilliseconds,
            }),
          )

          await this._switchState(States.ACTOR_ANIMATION_STREAMING)
          break
        case 'leave':
          const character = this._globalState.characters[0]
          character.runtimeAnimationGroup.switchJointAnimation(
            'leave',
            RuntimeBufferType.LOCAL,
          )
          character.runtimeAnimationGroup.switchMorphTargetAnimation(
            'leave',
            RuntimeBufferType.LOCAL,
          )
          this._globalState.runtime?.switchAudioLocal('leave')
          this._globalState.runtime?.addConditionedMessage(
            new RuntimeConditionedMessage(
              RuntimeAnimationEvent.TO_LOCAL_SOFT_IN_HARD_OUT,
            ),
          )
          this._globalState.runtime?.addConditionedMessage(
            new RuntimeConditionedMessage(RuntimeAnimationEvent.RHS_NON_LOOPABLE),
          )
          this._globalState.runtime?.addConditionedMessage(
            new RuntimeConditionedMessage(RuntimeAnimationEvent.USE_LINEAR_BLEND),
          )
          await this._switchState(States.WAITING_FOR_ACTOR_LEAVING_FINISHED)
          break
        case 'failed':
          await this._handleAlgorithmGenerationFailure()
          break
        case null:
        case undefined:
          return
        default:
          Logger.error(
            i18n.t('fsm.unknown3DACGenerationResultType', { ns: 'client' }) +
              ': ' +
              resp_type,
          )
          await this._handleAlgorithmGenerationFailure()
      }
    } else if (message.condition === Conditions.USER_INTERRUPT_ANIMATION) {
      this._globalState.runtime?.addConditionedMessage(
        new RuntimeConditionedMessage(RuntimeAnimationEvent.SOFT_INTERRUPT),
      )
      this._globalState.runtime?.addConditionedMessage(
        new RuntimeConditionedMessage(RuntimeAnimationEvent.USE_CUBIC_BLEND),
      )
      this._globalState.runtime?.audioPlayer?.clearPCMBuffer()
      await this._switchState(States.WAITING_FOR_STREAMED_ANIMATION_INTERRUPTED)
    } else if (
      message !== null &&
      message.condition === Conditions.ANIMATION_FINISHED
    ) {
      return
    } else {
      if (message !== null) {
        this._logUnexpectedCondition(message)
      }
    }
  }

  /**
   * Handle 3DAC generation failure.
   *
   * If actor apology animation finished condition is received, switches to WAITING_FOR_ACTOR_APOLOGIZE_FINISHED.
   */
  async algorithmGenerationFailed() {
    this._globalState.characters[0].runtimeAnimationGroup.switchJointAnimation(
      'error',
      RuntimeBufferType.LOCAL,
    )
    this._globalState.runtime?.addConditionedMessage(
      new RuntimeConditionedMessage(RuntimeAnimationEvent.TO_LOCAL_SOFT_IN_SOFT_OUT),
    )
    this._globalState.runtime?.addConditionedMessage(
      new RuntimeConditionedMessage(RuntimeAnimationEvent.USE_CUBIC_BLEND),
    )
    this._globalState.runtime?.addConditionedMessage(
      new RuntimeConditionedMessage(RuntimeAnimationEvent.RHS_NON_LOOPABLE),
    )

    await this._switchState(States.WAITING_FOR_ACTOR_APOLOGIZE_FINISHED)
  }

  /**
   * Wait for actor apology animation to finish.
   *
   * If animation finished condition is received, switches to IDLE state.
   */
  async waitingForActorApologizeFinished() {
    const message = this._getConditionNoWait()
    if (message === null) {
      return
    }
    if (message.condition === Conditions.ANIMATION_FINISHED) {
      await this._switchState(States.IDLE)
    } else {
      this._logUnexpectedCondition(message)
    }
  }

  /**
   * Handle actor animation streaming.
   *
   * Manages real-time streaming of actor animations while receiving data from the algorithm service.
   */
  async actorAnimationStreaming() {
    const message = this._getConditionNoWait()
    if (message === null) {
      try {
        const animationDict = await this._orchestratorStreamingClient!.getAnimation()
        const animationGroup = this._globalState.characters[0].runtimeAnimationGroup
        await this._feedStreamedAnimation(animationDict, animationGroup)
        const streamHealth = this._globalState.runtime!.streamHealth()
        if (
          this._globalState.runtime!.streamPaused() &&
          streamHealth.motionHealthTimeInSeconds > 2 &&
          streamHealth.faceHealthTimeInFrames > 2 &&
          streamHealth.audioHealthTimeInSeconds > 2
        ) {
          this._globalState.runtime?.addConditionedMessage(
            new RuntimeConditionedMessage(RuntimeAnimationEvent.RESUME_ANIMATION),
          )
          this._globalState.gui.hideStreamRecovering()
        }
      } catch (error) {
        if (error instanceof StreamUnavailableError) {
          Logger.error(
            i18n.t('fsm.dataStreamUnavailableDuringPlayback', { ns: 'client' }),
          )
          await this._handleAlgorithmGenerationFailure()
          return
        } else if (error instanceof StreamEndedError) {
          const streams =
            await this._orchestratorStreamingClient!.getNetworkStreams()
          if (Object.keys(streams).length !== 3) {
            Logger.error(
              i18n.t('fsm.dataStreamEndedWithIncompleteChannel', { ns: 'client' }) +
                ': ' +
                Object.keys(streams).length,
            )
            await this._handleAlgorithmGenerationFailure()
            return
          }

          Object.keys(streams).forEach(async key => {
            const stream = streams[key]
            const estimator = this._bufferSizeEstimators[key]
            await estimator.updateBufferSizeByStream(stream)
          })

          this._globalState.runtime?.addConditionedMessage(
            new RuntimeConditionedMessage(RuntimeAnimationEvent.STREAM_ENDED),
          )
          if (this._globalState.runtime!.streamPaused()) {
            this._globalState.runtime!.addConditionedMessage(
              new RuntimeConditionedMessage(RuntimeAnimationEvent.RESUME_ANIMATION),
            )
            this._globalState.gui.hideStreamRecovering()
          }
          try {
            this._updateRelationshipAndEmotion()
          } catch {
            Logger.warn('Error while updating relationship and emotion')
          }
          await this._switchState(States.WAITING_FOR_ACTOR_ANIMATION_FINISHED)
        } else {
          Logger.error(i18n.t('fsm.unknownError', { ns: 'client' }) + ': ' + error)
          await this._handleAlgorithmGenerationFailure()
        }
      }
    } else if (message.condition === Conditions.USER_INTERRUPT_ANIMATION) {
      this._globalState.runtime?.addConditionedMessage(
        new RuntimeConditionedMessage(RuntimeAnimationEvent.SOFT_INTERRUPT),
      )
      this._globalState.runtime?.addConditionedMessage(
        new RuntimeConditionedMessage(RuntimeAnimationEvent.USE_CUBIC_BLEND),
      )
      this._globalState.runtime?.audioPlayer?.clearPCMBuffer()
      await this._switchState(States.WAITING_FOR_STREAMED_ANIMATION_INTERRUPTED)
    } else if (message.condition === Conditions.ANIMATION_FINISHED) {
      Logger.warn(
        'Received animation finished signal during animation streaming state, playback rate is greater than transmission rate, please check network status.',
      )
      await this._switchState(States.WAITING_FOR_ACTOR_ANIMATION_FINISHED)
    } else if (message.condition === Conditions.JOINT_ANIMATION_FINISHED) {
      Logger.warn(
        `Received joint animation finished signal during animation streaming state, playback rate is greater than transmission rate, please check network status.`,
      )
      await this._switchState(States.WAITING_FOR_ACTOR_ANIMATION_FINISHED)
    } else if (message.condition === Conditions.MORPH_ANIMATION_FINISHED) {
      Logger.warn(
        `Received morph animation finished signal during animation streaming state, playback rate is greater than transmission rate, please check network status.`,
      )
      await this._switchState(States.WAITING_FOR_ACTOR_ANIMATION_FINISHED)
    } else if (
      message.condition === Conditions.JOINT_STREAM_BROKEN ||
      message.condition === Conditions.MORPH_STREAM_BROKEN
    ) {
      Logger.warn(
        `Received message during animation streaming state: ${message.data?.message}`,
      )
      this._globalState.runtime?.addConditionedMessage(
        new RuntimeConditionedMessage(RuntimeAnimationEvent.PAUSE_ANIMATION),
      )
      this._globalState.gui.showStreamRecovering()
    } else {
      await this._logUnexpectedCondition(message)
    }
  }

  /**
   * Wait for streamed animation to be interrupted.
   *
   * If animation finished condition is received, switches to IDLE state.
   */
  async waitingForStreamedAnimationInterrupted() {
    const message = this._getConditionNoWait()
    if (message === null) {
      return
    }
    if (message.condition === Conditions.ANIMATION_FINISHED) {
      const character = this._globalState.characters[0]
      character.runtimeAnimationGroup.switchJointAnimation(
        'listen',
        RuntimeBufferType.LOCAL,
      )
      character.runtimeAnimationGroup.switchMorphTargetAnimation(
        'listen',
        RuntimeBufferType.LOCAL,
      )
      this._globalState.runtime?.switchAudioLocal('listen')
      this._globalState.runtime?.addConditionedMessage(
        new RuntimeConditionedMessage(
          RuntimeAnimationEvent.TO_LOCAL_SOFT_IN_SOFT_OUT,
        ),
      )
      this._globalState.runtime?.addConditionedMessage(
        new RuntimeConditionedMessage(RuntimeAnimationEvent.RHS_LOOPABLE),
      )
      this._globalState.runtime?.addConditionedMessage(
        new RuntimeConditionedMessage(RuntimeAnimationEvent.USE_CUBIC_BLEND),
      )
      const success = await this._startUserAudioStreaming()
      if (success) {
        await this._switchState(States.WAITING_FOR_USER_STOP_RECORDING)
      }
    } else {
      this._logUnexpectedCondition(message)
    }
  }

  /**
   * Wait for 3DAC direct animation generation to finish.
   *
   * If correct generation result is received, switches to WAITING_FOR_ACTOR_ANIMATION_FINISHED,
   * otherwise switches to ALGORITHM_GENERATION_FAILED.
   */
  async waitingForActorDirectGenerationFinished() {}

  /**
   * Wait for actor leaving animation to finish.
   *
   * If animation finished condition is received, switches to EXIT state.
   */
  async waitingForActorLeavingFinished() {
    const message = this._getConditionNoWait()
    if (message === null) {
      return
    }
    if (message.condition === Conditions.ANIMATION_FINISHED) {
      await this._switchState(States.EXIT)
      // window.close()
      const character = this._globalState.characters[0]
      await character.dispose()
    } else {
      this._logUnexpectedCondition(message)
    }
  }

  /**
   * Wait for actor animation to finish.
   *
   * If user start recording condition is received, switches to WAITING_FOR_USER_UPLOAD;
   * if upload 3DAC dialogue text condition is received, uploads dialogue text to orchestrator service
   * and switches to WAITING_FOR_ACTOR_DIRECT_GENERATION_FINISHED;
   * if animation finished condition is received, switches to IDLE.
   */
  async waitingForActorAnimationFinished() {
    const message = this._getConditionNoWait()
    if (message === null) {
      return
    }
    if (message.condition === Conditions.ANIMATION_FINISHED) {
      try {
        this._updateRelationshipAndEmotion()
      } catch {
        Logger.warn('Error while updating relationship and emotion')
      }
      await this._switchState(States.IDLE)
    }
    if (message.condition === Conditions.USER_INTERRUPT_ANIMATION) {
      this._globalState.runtime?.addConditionedMessage(
        new RuntimeConditionedMessage(RuntimeAnimationEvent.SOFT_INTERRUPT),
      )
      this._globalState.runtime?.addConditionedMessage(
        new RuntimeConditionedMessage(RuntimeAnimationEvent.USE_CUBIC_BLEND),
      )
      this._globalState.runtime?.audioPlayer?.clearPCMBuffer()
      await this._switchState(States.WAITING_FOR_STREAMED_ANIMATION_INTERRUPTED)
    }
  }

  /**
   * Exit the state machine.
   *
   * This state causes the state machine to terminate unconditionally.
   */
  async exit() {
    await this._globalState.audioStreamState?.stopRecord()
    // Import errorBus dynamically to show Home button
    const { errorBus } = await import('@/utils/errorBus')

    const payload = {
      message: 'State machine stopped, exit chat.',
      severity: 'neutral' as const,
      actionText: 'Home',
      onAction: () => {
        window.location.href = '/'
      },
      durationMs: 0,
      closable: false,
    }
    errorBus.emit('error', payload)

    this._running = false
  }

  /**
   * Wait for user to start the game.
   *
   * If user start game condition is received, switches to WAITING_FOR_ACTOR_ENTER_FINISHED.
   */
  async waitingForUserStartGame() {
    const message = this._getConditionNoWait()
    if (message === null) {
      try {
        const animationDict = await this._orchestratorStreamingClient!.getAnimation()
        this._addOpeningRemarkAnimation(animationDict)
      } catch (error) {
        if (error instanceof StreamUnavailableError) {
          Logger.error(
            i18n.t('fsm.dataStreamUnavailableDuringStreaming', { ns: 'client' }),
          )
          await this._handleAlgorithmGenerationFailure()
          return
        } else if (error instanceof StreamEndedError) {
          if (!this._openingRemarkStreamEnded) {
            Logger.log(
              'Received data stream end signal during streaming animation reception.',
            )
            this._openingRemarkStreamEnded = true
          }
          return
        } else {
          Logger.error(
            i18n.t('fsm.unknownErrorDuringStreaming', { ns: 'client' }) +
              ': ' +
              error,
          )
          await this._handleAlgorithmGenerationFailure()
        }
      }
      return
    }

    if (message.condition === Conditions.USER_START_GAME) {
      const recordState = await this._globalState.audioStreamState?.checkDevice()
      if (recordState && recordState !== AudioRecordState.NOT_RECORDING) {
        let msg = i18n.t('audio.deviceCheckFailed', { ns: 'client' }) + ': '
        switch (recordState) {
          case AudioRecordState.PERMISSION_DENIED:
            msg += i18n.t('audio.microphoneState.permissionDenied', { ns: 'client' })
            break
          case AudioRecordState.MICROPHONE_NOT_FOUND:
            msg += i18n.t('audio.microphoneState.microphoneNotFound', {
              ns: 'client',
            })
            break
          case AudioRecordState.UNKNOWN_ERROR:
            msg += i18n.t('audio.microphoneState.unknownError', { ns: 'client' })
            break
          default:
            msg += i18n.t('audio.microphoneState.unknownError', { ns: 'client' })
            break
        }
        Logger.error(msg)
        await this._switchState(States.EXIT)
      }

      await this._globalState.audioStreamState?.startRecord()
      Logger.log('Microphone is now enabled')

      this._globalState.runtime?.playAnimation()
      Logger.log('Starting character entrance animation playback')

      if (
        this._openingRemarkMotionClips.length === 0 ||
        this._openingRemarkFaceClips.length === 0 ||
        this._openingRemarkAudioClips.length === 0
      ) {
        Logger.error(i18n.t('fsm.entranceAnimationDataMissing', { ns: 'client' }))
        await this._switchState(States.EXIT)
      }

      const animationGroup = this._globalState.characters[0].runtimeAnimationGroup
      this._openingRemarkMotionClips.forEach(motionClip => {
        this._feedStreamedMotionClip(motionClip, animationGroup)
      })

      this._openingRemarkFaceClips.forEach(faceClip => {
        this._feedStreamedFaceClip(faceClip, animationGroup)
      })

      this._openingRemarkAudioClips.forEach(audioPcm => {
        this._feedStreamedAudioClip(audioPcm)
      })

      const firstMotionClip = this._openingRemarkMotionClips[0] as MotionClip
      const firstFaceClip = this._openingRemarkFaceClips[0] as FaceClip

      const motionTimelineShift =
        firstMotionClip.timelineStartIdx !== null
          ? firstMotionClip.timelineStartIdx / INTRINSIC_FRAME_RATE
          : 0
      const faceTimelineShift =
        firstFaceClip.timelineStartIdx !== null
          ? firstFaceClip.timelineStartIdx / INTRINSIC_FRAME_RATE
          : 0
      this._globalState.runtime!.addConditionedMessage(
        new RuntimeConditionedMessage(
          RuntimeAnimationEvent.TO_STREAMED_HARD_IN_SOFT_OUT,
        ),
      )

      const earliestShift = Math.min(motionTimelineShift, faceTimelineShift, 0)
      const motionDelayedTimeInMilliseconds =
        (motionTimelineShift - earliestShift) * 1000
      const morphDelayedTimeInMilliseconds =
        (faceTimelineShift - earliestShift) * 1000
      const audioDelayedTimeInMilliseconds = (0 - earliestShift) * 1000
      this._globalState.runtime!.addConditionedMessage(
        new RuntimeConditionedMessage(RuntimeAnimationEvent.MOTION_DELAYED_PLAY, {
          delay_time: motionDelayedTimeInMilliseconds,
        }),
      )
      this._globalState.runtime!.addConditionedMessage(
        new RuntimeConditionedMessage(RuntimeAnimationEvent.MORPH_DELAYED_PLAY, {
          delay_time: morphDelayedTimeInMilliseconds,
        }),
      )
      this._globalState.runtime!.addConditionedMessage(
        new RuntimeConditionedMessage(RuntimeAnimationEvent.AUDIO_DELAYED_PLAY, {
          delay_time: audioDelayedTimeInMilliseconds,
        }),
      )

      this._setRecordAudioButtonEnabled(true)
      if (this._openingRemarkStreamEnded) {
        this._globalState.runtime?.addConditionedMessage(
          new RuntimeConditionedMessage(RuntimeAnimationEvent.STREAM_ENDED),
        )
        await this._switchState(States.WAITING_FOR_ACTOR_ANIMATION_FINISHED)
      } else {
        await this._switchState(States.ACTOR_ANIMATION_STREAMING)
      }
    }
  }

  /**
   * Add a conditioned message to the event queue.
   *
   * @param conditionedMessage The conditioned message to add to the queue.
   */
  public putConditionedMessage(conditionedMessage: ConditionedMessage) {
    this._eventQueue.enqueue(conditionedMessage)
  }

  /**
   * Get a condition message from the event queue without waiting.
   *
   * If the queue is empty, returns null; otherwise returns the condition message.
   *
   * @returns The condition message from the queue, or null if empty.
   */
  private _getConditionNoWait(): BABYLON.Nullable<ConditionedMessage> {
    const ans = this._eventQueue.dequeue()
    if (ans === undefined) {
      return null
    }
    return ans
  }

  /**
   * Switch to a target state and log the transition.
   *
   * @param targetState The target state to switch to.
   */
  private async _switchState(targetState: States) {
    this._lastStateValue = this._stateValue
    this._stateValue = targetState
    let lastStateName
    if (this._lastStateValue !== null) {
      lastStateName = stateToEnglishName(this._lastStateValue)
    } else {
      lastStateName = 'None'
    }
    const currentStateName = stateToEnglishName(this._stateValue)
    Logger.log(`State machine switched from ${lastStateName} to ${currentStateName}`)
  }

  /**
   * Log an unexpected condition and print a warning.
   *
   * @param conditionMsg The unexpected condition message to log.
   */
  private async _logUnexpectedCondition(conditionMsg: ConditionedMessage) {
    if (
      conditionMsg.condition === Conditions.JOINT_ANIMATION_FINISHED ||
      conditionMsg.condition === Conditions.MORPH_ANIMATION_FINISHED
    ) {
      return
    }

    const conditionMsgStr = conditionMsg.convertToString()
    const stateName = stateToEnglishName(this._stateValue)
    Logger.error(
      i18n.t('fsm.unexpectedCondition', { ns: 'client' }) +
        ': ' +
        conditionMsgStr +
        ', ' +
        stateName,
    )
  }

  /**
   * Handle 3DAC generation failure.
   *
   * Cleans up the orchestrator streaming client and switches to algorithm generation failed state.
   */
  private async _handleAlgorithmGenerationFailure() {
    if (this._orchestratorStreamingClient) {
      await this._orchestratorStreamingClient.interrupt()
      this._globalState.webSocketState?.disconnectWebSocket()
      this._orchestratorStreamingClient.dispose()
    }
    await this._switchState(States.ALGORITHM_GENERATION_FAILED)
  }

  /**
   * Start streaming user audio to generate 3DAC results.
   *
   * @param nChannels Number of audio channels, defaults to 1.
   * @param sampleWidth Sample width in bytes, defaults to 2.
   * @param frameRate Audio frame rate, defaults to 16000.
   * @returns Promise that resolves to true if successful.
   */
  private async _startUserAudioStreaming(
    nChannels: number = 1,
    sampleWidth: number = 2,
    frameRate: number = 16000,
  ): Promise<boolean> {
    this._globalState.updateUserStreamingState(true)

    // Clean up old instance if it exists
    if (this._orchestratorStreamingClient) {
      await this._orchestratorStreamingClient.interrupt()
      this._globalState.webSocketState?.disconnectWebSocket()
      this._orchestratorStreamingClient.dispose()
    }

    const requestKeys = [
      'orchestratorHost',
      'orchestratorPort',
      'orchestratorPathPrefix',
      'orchestratorTimeout',
      'orchestratorAudioChatPath',
      'maxFrontExtensionDuration',
      'maxRearExtensionDuration',
      'userId',
      'characterId',
      'language',
    ]
    const requestDict: Record<string, any> = {}
    for (const key of requestKeys) {
      requestDict[key] = await this._configSync.getItem(key)
    }

    const audioReadySeconds = this._bufferSizeEstimators['audio'].bufferSize
    const faceReadyNFrames = Math.ceil(
      this._bufferSizeEstimators['face'].bufferSize * 30,
    )
    const motionReadyNFrames = Math.ceil(
      this._bufferSizeEstimators['motion'].bufferSize * 30,
    )

    // Create new instance
    const newClient = new OrchestratorClient(
      this._globalState,
      requestDict['orchestratorHost'],
      requestDict['orchestratorPort'],
      requestDict['orchestratorPathPrefix'],
      requestDict['orchestratorAudioChatPath'],
      {
        appName: 'babylon',
        maxFrontExtensionDuration: requestDict['maxFrontExtensionDuration'],
        maxRearExtensionDuration: requestDict['maxRearExtensionDuration'],
        nChannels: nChannels,
        sampleWidth: sampleWidth,
        frameRate: frameRate,
        language: requestDict['language'],
        userId: requestDict['userId'],
        characterId: requestDict['characterId'],
      },
      requestDict['orchestratorTimeout'],
      audioReadySeconds,
      faceReadyNFrames,
      motionReadyNFrames,
    )

    // Assign new instance and start it
    this._orchestratorStreamingClient = newClient
    await newClient.resetRuntimeStreamed()
    await newClient.run()

    return true
  }

  /**
   * Stop user audio streaming.
   *
   * Flushes remaining PCM data and sends stop streaming message to server.
   */
  private async _stopUserAudioStreaming() {
    this._globalState.updateUserStreamingState(false)
    const message = `User stopped audio streaming`
    Logger.debug(message)

    // First, flush any remaining PCM data in the queue
    if (this._globalState.flushPCMQueue !== null) {
      try {
        await this._globalState.flushPCMQueue()
        const msg = `PCM queue has been cleared, all audio data has been sent`
        Logger.debug(msg)
      } catch (error) {
        Logger.error(
          i18n.t('fsm.clearPCMQueueFailed', { ns: 'client' }) + ': ' + error,
        )
      }
    }

    // Send stop streaming message to server
    await this._orchestratorStreamingClient?.sendStopAudioStreamingMessage()
  }

  /**
   * Feed streamed motion clip data to the animation group.
   *
   * @param motionClip The motion clip data to feed.
   * @param animationGroup The animation group to feed data to.
   */
  private _feedStreamedMotionClip(
    motionClip: MotionClip,
    animationGroup: RuntimeAnimationGroup,
  ) {
    const rotMat: BABYLON.Quaternion[][] = []
    const transl: BABYLON.Vector3[] = []

    for (let i = 0; i < motionClip.nFrames; i++) {
      const frameData = motionClip.jointRotmat[i]
      const frameRotQuat: BABYLON.Quaternion[] = []
      for (let j = 0; j < motionClip.jointNames.length; j++) {
        const jMat = frameData[j]
        // BabylonJS uses row-major order
        const jRotMat = BABYLON.Matrix.FromValues(
          jMat[0][0],
          jMat[1][0],
          jMat[2][0],
          0,
          jMat[0][1],
          jMat[1][1],
          jMat[2][1],
          0,
          jMat[0][2],
          jMat[1][2],
          jMat[2][2],
          0,
          0,
          0,
          0,
          1,
        )
        const jRotQuat = BABYLON.Quaternion.FromRotationMatrix(jRotMat)
        frameRotQuat.push(jRotQuat)
      }
      rotMat.push(frameRotQuat)
    }
    for (let i = 0; i < motionClip.nFrames; i++) {
      transl.push(
        new BABYLON.Vector3(
          motionClip.rootWorldPosition[i][0],
          motionClip.rootWorldPosition[i][1],
          motionClip.rootWorldPosition[i][2],
        ),
      )
    }
    animationGroup.appendJointAnimationDataStreamed(rotMat, transl)
  }

  /**
   * Feed streamed face clip data to the animation group.
   *
   * @param faceClip The face clip data to feed.
   * @param animationGroup The animation group to feed data to.
   */
  private _feedStreamedFaceClip(
    faceClip: FaceClip,
    animationGroup: RuntimeAnimationGroup,
  ) {
    const morphTargetValues: MorphTargetValues = {}
    const morphTargetSize = faceClip.blendShapeNames.length

    for (let mid = 0; mid < morphTargetSize; mid++) {
      const morphTargetName = animationGroup.morphTargetNames![mid]
      morphTargetValues[morphTargetName] = []
    }
    const nFrames = faceClip.length()
    for (let fid = 0; fid < nFrames; fid++) {
      for (let mid = 0; mid < morphTargetSize; mid++) {
        const morphTargetName = animationGroup.morphTargetNames![mid]
        morphTargetValues[morphTargetName].push(faceClip.blendShapeValues[fid][mid])
      }
    }

    animationGroup.appendMorphTargetValuesStreamed(morphTargetValues, nFrames)
  }

  /**
   * Feed streamed audio clip data to the audio player.
   *
   * @param audioPcm The PCM audio data to feed.
   */
  private _feedStreamedAudioClip(audioPcm: Uint8Array) {
    this._globalState.runtime?.audioPlayer?.appendPCMData(audioPcm)
  }

  /**
   * Feed streamed animation data to the animation group.
   *
   * @param animationDict Dictionary containing motion, face, and audio data.
   * @param animationGroup The animation group to feed data to.
   */
  private async _feedStreamedAnimation(
    animationDict: Record<string, any>,
    animationGroup: RuntimeAnimationGroup,
  ) {
    if (Object.keys(animationDict).length <= 0) {
      return
    }

    if (Object.keys(animationDict).includes('motion')) {
      const motionClip = animationDict['motion'] as MotionClip
      this._feedStreamedMotionClip(motionClip, animationGroup)
    }

    if (Object.keys(animationDict).includes('face')) {
      const faceClip = animationDict['face'] as FaceClip
      this._feedStreamedFaceClip(faceClip, animationGroup)
    }

    if (Object.keys(animationDict).includes('audio')) {
      const audioPcm = animationDict['audio'] as Uint8Array
      this._feedStreamedAudioClip(audioPcm)
    }
  }

  /**
   * Set the record audio button enabled state.
   *
   * @param enabled Whether the button should be enabled.
   */
  private _setRecordAudioButtonEnabled(enabled: boolean) {
    const recordAudioButton =
      this._globalState.gui?.renderViewTexture.getControlByName(
        'recordAudioButton',
      ) as BABYLON.Nullable<BABYLON_GUI.Button>
    if (recordAudioButton === null) {
      // Log warning instead of error since this might happen during initialization
      Logger.log('recordAudioButton not found - audio controls may not be ready yet')
      return
    }
    recordAudioButton.isEnabled = enabled
  }

  /**
   * Upload 3DAC dialogue text to orchestrator service.
   *
   * @param text The dialogue text to upload.
   */
  private async _uploadActorText(text: string) {
    // Clean up old instance if it exists
    if (this._orchestratorStreamingClient) {
      await this._orchestratorStreamingClient.interrupt()
      this._globalState.webSocketState?.disconnectWebSocket()
      this._orchestratorStreamingClient.dispose()
    }

    const requestKeys = [
      'orchestratorHost',
      'orchestratorPort',
      'orchestratorPathPrefix',
      'orchestratorTimeout',
      'orchestratorDirectStreamingPath',
      'maxFrontExtensionDuration',
      'maxRearExtensionDuration',
      'userId',
      'characterId',
      'language',
    ]

    const requestDict: Record<string, any> = {}
    for (const key of requestKeys) {
      requestDict[key] = await this._configSync.getItem(key)
    }

    const audioReadySeconds = this._bufferSizeEstimators['audio'].bufferSize
    const faceReadyNFrames = Math.ceil(
      this._bufferSizeEstimators['face'].bufferSize * 30,
    )
    const motionReadyNFrames = Math.ceil(
      this._bufferSizeEstimators['motion'].bufferSize * 30,
    )

    const client = new OrchestratorClient(
      this._globalState,
      requestDict['orchestratorHost'],
      requestDict['orchestratorPort'],
      requestDict['orchestratorPathPrefix'],
      requestDict['orchestratorDirectStreamingPath'],
      {
        appName: 'babylon',
        maxFrontExtensionDuration: requestDict['maxFrontExtensionDuration'],
        maxRearExtensionDuration: requestDict['maxRearExtensionDuration'],
        nChannels: 1,
        sampleWidth: 2,
        frameRate: 16000,
        userId: requestDict['userId'],
        characterId: requestDict['characterId'],
        speechText: text,
        language: requestDict['language'],
      },
      requestDict['orchestratorTimeout'],
      audioReadySeconds,
      faceReadyNFrames,
      motionReadyNFrames,
    )

    // Assign new instance and start it
    this._orchestratorStreamingClient = client
    await client.resetRuntimeStreamed()
    await client.run()
  }

  /**
   * Upload user text to generate 3DAC results.
   *
   * @param text The user text to upload.
   */
  private async _uploadUserTextStreaming(text: string) {
    // Clean up old instance if it exists
    if (this._orchestratorStreamingClient) {
      await this._orchestratorStreamingClient.interrupt()
      this._globalState.webSocketState?.disconnectWebSocket()
      this._orchestratorStreamingClient.dispose()
    }

    const requestKeys = [
      'orchestratorHost',
      'orchestratorPort',
      'orchestratorPathPrefix',
      'orchestratorTimeout',
      'orchestratorTextChatPath',
      'maxFrontExtensionDuration',
      'maxRearExtensionDuration',
      'userId',
      'characterId',
      'language',
    ]

    const requestDict: Record<string, any> = {}
    for (const key of requestKeys) {
      requestDict[key] = await this._configSync.getItem(key)
    }

    const audioReadySeconds = this._bufferSizeEstimators['audio'].bufferSize
    const faceReadyNFrames = Math.ceil(
      this._bufferSizeEstimators['face'].bufferSize * 30,
    )
    const motionReadyNFrames = Math.ceil(
      this._bufferSizeEstimators['motion'].bufferSize * 30,
    )

    // Create new instance
    const client = new OrchestratorClient(
      this._globalState,
      requestDict['orchestratorHost'],
      requestDict['orchestratorPort'],
      requestDict['orchestratorPathPrefix'],
      requestDict['orchestratorTextChatPath'],
      {
        appName: 'babylon',
        maxFrontExtensionDuration: requestDict['maxFrontExtensionDuration'],
        maxRearExtensionDuration: requestDict['maxRearExtensionDuration'],
        language: requestDict['language'],
        userId: requestDict['userId'],
        characterId: requestDict['characterId'],
        speechText: text,
      },
      requestDict['orchestratorTimeout'],
      audioReadySeconds,
      faceReadyNFrames,
      motionReadyNFrames,
    )

    // Assign new instance and start it
    this._orchestratorStreamingClient = client
    await client.resetRuntimeStreamed()
    await client.run()
  }

  /**
   * Add opening remark animation data to the internal arrays.
   *
   * @param animationDict Dictionary containing motion, face, and audio data for opening remark.
   */
  private _addOpeningRemarkAnimation(animationDict: Record<string, any>) {
    if (Object.keys(animationDict).includes('motion')) {
      const motionClip = animationDict['motion'] as MotionClip
      this._openingRemarkMotionClips.push(motionClip)
    }
    if (Object.keys(animationDict).includes('face')) {
      const faceClip = animationDict['face'] as FaceClip
      this._openingRemarkFaceClips.push(faceClip)
    }
    if (Object.keys(animationDict).includes('audio')) {
      const audioPcm = animationDict['audio'] as Uint8Array
      this._openingRemarkAudioClips.push(audioPcm)
    }
  }

  private async _updateRelationshipAndEmotion(displayMessage: boolean = true) {
    const character = this._globalState.characters[0]
    const userId = await this._configSync.getItem('userId')
    const characterId = await this._configSync.getItem('characterId')
    const avatarName = character.name
    const relationship = await getRelationship(characterId)
    const emotion = await getEmotion(userId, characterId)
    const prevScore = character.relationship.score
    const newScore = relationship.score
    const { showSideMessageWithTitle } = await import('@/utils/messageBus')
    if (prevScore !== newScore) {
      if (displayMessage) {
        if (newScore > prevScore) {
          showSideMessageWithTitle(
            avatarName,
            i18n.t('relationship.improved', { ns: 'client' }),
          )
        } else if (newScore < prevScore) {
          showSideMessageWithTitle(
            avatarName,
            i18n.t('relationship.decreased', { ns: 'client' }),
          )
        }
      }
      character.relationship.score = relationship.score

      if (character.relationship.stage !== relationship.relationship) {
        if (displayMessage) {
          showSideMessageWithTitle(
            avatarName,
            i18n.t('relationship.newStatus', { ns: 'client' }) +
              ': ' +
              relationship.relationship,
          )
        }
        character.relationship.stage = relationship.relationship
      }
    }
    const newEmotions = toEmotionTypeArray(emotion.emotions)
    if (character.emotions.emotions !== newEmotions) {
      const prevEmotion =
        character.emotions.emotions.length > 0
          ? character.emotions.emotions[0]
          : EmotionType.Neutral
      const newEmotion =
        newEmotions.length > 0 ? newEmotions[0] : EmotionType.Neutral
      character.emotions.emotions = newEmotions
      if (
        displayMessage &&
        prevEmotion !== newEmotion &&
        newEmotion !== EmotionType.Neutral
      ) {
        showSideMessageWithTitle(
          avatarName,
          i18n.t('emotion.seemsToBe', { ns: 'client' }) +
            ' ' +
            toEmotionAdjective(newEmotion),
        )
      }
    }
  }

  /**
   * Dispose of the state machine and clean up resources.
   */
  public dispose() {}
}
