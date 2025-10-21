import {
  MotionFileClient,
  CharacterStaticAssetRequest,
} from '@/library/babylonjs/runtime/asset'
import {
  MotionClipWithBidirectionalPriority,
  FaceClip,
} from '@/library/babylonjs/runtime/animation'
import { GlobalState } from '@/library/babylonjs/core'
import { strToMd5 } from '@/library/babylonjs/utils'
import { OrchestratorClient } from '@/library/babylonjs/runtime/stream'
import { Logger } from '@/library/babylonjs/utils'

const DB_NAME = 'runtimeAssets'
const DB_VERSION = 1
const CHARACTER_STORE_NAME = 'characterFiles'
const MOTION_STORE_NAME = 'motionFiles'
const AUDIO_STORE_NAME = 'audioFiles'
const FACE_STORE_NAME = 'faceFiles'
const MAX_CACHE_SIZE = 500 * 1024 * 1024 // 500MB limit

/**
 * Serialized motion clip data structure.
 */
interface SerializedMotionClip {
  nFrames: number
  jointNames: string[]
  jointRotmat: number[][][][]
  rootWorldPosition: number[][]
  startFrame: number
  restposeName: string
  motionRecordId: number
}

/**
 * Serialized motion file data structure.
 */
interface SerializedMotionFile {
  states: string[]
  isIdleLong: boolean
  loopable: boolean
  loopStartFrame: number
  loopEndFrame: number
  motionClip: SerializedMotionClip
}

/**
 * Cached motion files data structure.
 */
interface CachedMotionFiles {
  id: string
  data: Record<string, SerializedMotionFile>
  version: string | null
  timestamp: number
}

/**
 * Cached character data structure.
 */
interface CachedCharacter {
  id: string
  meshData: Uint8Array
  jointsMeta: Uint8Array
  rigidsMeta: Uint8Array
  morphTargetsMeta: Uint8Array
  version: string
  timestamp: number
}

/**
 * Serialized audio file data structure.
 */
interface SerializedAudioFile {
  data: Uint8Array
  nFrames: number
  timestamp: number
}

/**
 * Serialized face clip data structure.
 */
interface SerializedFaceClip {
  blendShapeNames: string[]
  blendShapeValues: number[][]
  timelineStartIdx: number | null
}

/**
 * Serialized face file data structure.
 */
interface SerializedFaceFile {
  data: SerializedFaceClip
  timestamp: number
}

/**
 * Cached audio files data structure.
 */
interface CachedAudioFiles {
  id: string
  data: Record<string, SerializedAudioFile>
  version: string
  timestamp: number
}

/**
 * Cached face files data structure.
 */
interface CachedFaceFiles {
  id: string
  data: Record<string, SerializedFaceFile>
  version: string
  timestamp: number
}

/**
 * Local asset manager for handling character models, motion files, audio files, and face clips.
 * Manages caching, versioning, and synchronization of 3D character assets.
 */
export class AssetManager {
  public static readonly MISSING_VOICE_NAMES = [
    'alloy',
    'nvguo59',
    'M20',
    'zhili',
    'woman',
    'man',
    'zh_female_tianmeixiaoyuan_moon_bigtts',
    'zh_female_linjianvhai_moon_bigtts',
    'zh_male_wennuanahu_moon_bigtt',
    'zh_male_yuanboxiaoshu_moon_bigtts',
  ]
  public static readonly DEFAULT_TTS_ADAPTER = 'huoshan_v2'
  public static readonly DEFAULT_VOICE_NAME = 'BV405_streaming'
  public static readonly NECESSARY_MOTION_TYPES = [
    'long_idle',
    'idle',
    'listen',
    'error',
    'leave',
  ]

  /**
   * Text-to-speech adapter name.
   */
  private _ttsAdapter: string

  /**
   * Voice name for TTS.
   */
  private _voiceName: string

  /**
   * Voice speed for TTS.
   */
  private _voiceSpeed: number

  /**
   * Face model name.
   */
  private _faceModel: string

  /**
   * Avatar name for motion animations.
   */
  private _avatar: string

  /**
   * User ID.
   */
  private _userID: string

  /**
   * Character ID.
   */
  private _characterID: string

  /**
   * Orchestrator server hostname.
   */
  private _orchestratorHost: string

  /**
   * Orchestrator server port.
   */
  private _orchestratorPort: number

  /**
   * Orchestrator server path prefix.
   */
  private _orchestratorPathPrefix: string

  /**
   * Server path for 3DAC dialogue streaming animation generation.
   */
  private _orchestratorDirectStreamingPath: string

  /**
   * Motion file server hostname.
   */
  private _motionFileHost: string

  /**
   * Motion file server port.
   */
  private _motionFilePort: number

  /**
   * Motion file server path prefix.
   */
  private _motionFilePathPrefix: string

  /**
   * Motion file server path.
   */
  private _motionFilePath: string

  /**
   * Motion file server timeout.
   */
  private _motionFileTimeout: number

  /**
   * Preset dialogue texts for 3DAC in different states.
   * Example: { 'leave': 'Goodbye.', 'apologize': 'Sorry, please say it again.' }
   */
  private _speechTexts: Record<string, string>

  /**
   * Probability of selecting long idle animation in IDLE state.
   */
  private _longIdleRate: number

  /**
   * Number of audio channels.
   */
  private _wavNChannels: number

  /**
   * Audio sample width.
   */
  private _wavSampleWidth: number

  /**
   * Audio sample rate.
   */
  private _wavSampleRate: number

  private _motionFileServerVersion: string | null

  /**
   * Face animation data.
   */
  private _faceClips: Record<string, FaceClip> = {}

  /**
   * Audio data.
   */
  private _audioBytes: Record<string, Uint8Array> = {}

  /**
   * Whether we've warned about missing voice.
   */
  private _missingVoiceWarned: boolean = false

  /**
   * Mapping from motion states to motion IDs.
   */
  private _motionStatesToID: Record<string, Array<[number, number]>> = {}

  /**
   * Currently playing motion IDs.
   */
  private _playingIDs: Record<string, number> = {}

  /**
   * Mapping from motion ID to motion loop frames.
   */
  private _motionLoops: Record<number, [number, number]> = {}

  /**
   * Mapping from motion ID to motion clips.
   */
  private _motionClips: Record<number, MotionClipWithBidirectionalPriority> = {}

  private _meshFileUrl: string | null = null
  private _constraintsFileUrl: string | null = null
  private _rigidBodiesFileUrl: string | null = null
  private _morphTargetsFileUrl: string | null = null

  private _globalState: GlobalState

  /**
   * Constructor for AssetManager.
   *
   * @param globalState Global state object.
   * @param ttsAdapter Text-to-speech adapter name.
   * @param voiceName Voice name for TTS.
   * @param voiceSpeed Voice speed for TTS.
   * @param faceModel Face model name.
   * @param avatar Avatar name for motion animations.
   * @param userID User ID.
   * @param characterID Character ID.
   * @param orchestratorHost Orchestrator server hostname.
   * @param orchestratorPort Orchestrator server port.
   * @param orchestratorPathPrefix Orchestrator server path prefix.
   * @param orchestratorDirectStreamingPath Server path for 3DAC dialogue streaming animation generation.
   * @param motionFileHost Motion file server hostname.
   * @param motionFilePort Motion file server port.
   * @param motionFilePathPrefix Motion file server path prefix.
   * @param motionFilePath Motion file server path.
   * @param motionFileTimeout Motion file server timeout.
   * @param speechTexts Preset dialogue texts for 3DAC in different states.
   * @param longIdleRate Probability of selecting long idle animation in IDLE state. Defaults to 0.7.
   * @param wavNChannels Number of audio channels. Defaults to 1.
   * @param wavSampleWidth Audio sample width. Defaults to 2.
   * @param wavSampleRate Audio sample rate. Defaults to 16000.
   */
  constructor(
    globalState: GlobalState,
    ttsAdapter: string,
    voiceName: string,
    voiceSpeed: number,
    faceModel: string,
    avatar: string,
    userID: string,
    characterID: string,
    orchestratorHost: string,
    orchestratorPort: number,
    orchestratorPathPrefix: string,
    orchestratorDirectStreamingPath: string,
    motionFileHost: string,
    motionFilePort: number,
    motionFilePathPrefix: string,
    motionFilePath: string,
    motionFileTimeout: number,
    speechTexts: Record<string, string>,
    longIdleRate: number = 0.7,
    wavNChannels: number = 1,
    wavSampleWidth: number = 2,
    wavSampleRate: number = 16000,
  ) {
    this._globalState = globalState
    this._ttsAdapter = ttsAdapter
    this._voiceName = voiceName
    this._voiceSpeed = voiceSpeed
    this._faceModel = faceModel
    this._avatar = avatar
    this._userID = userID
    this._characterID = characterID
    this._orchestratorHost = orchestratorHost
    this._orchestratorPort = orchestratorPort
    this._orchestratorPathPrefix = orchestratorPathPrefix
    this._orchestratorDirectStreamingPath = orchestratorDirectStreamingPath
    this._motionFileHost = motionFileHost
    this._motionFilePort = motionFilePort
    this._motionFilePathPrefix = motionFilePathPrefix
    this._motionFilePath = motionFilePath
    this._motionFileTimeout = motionFileTimeout
    this._speechTexts = speechTexts
    this._longIdleRate = longIdleRate
    this._wavNChannels = wavNChannels
    this._wavSampleWidth = wavSampleWidth
    this._wavSampleRate = wavSampleRate

    this._motionFileServerVersion = null
  }

  /**
   * Initialize IndexedDB database.
   *
   * @returns Promise that resolves to the IDBDatabase instance.
   * @throws {Error} if database initialization fails.
   */
  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = event => {
        const error = (event.target as IDBOpenDBRequest).error
        if (error?.name === 'VersionError') {
          // If we get a version error, delete the database and try again
          Logger.log('Version conflict detected, deleting database...')
          const deleteRequest = indexedDB.deleteDatabase(DB_NAME)
          deleteRequest.onerror = () => {
            Logger.error(`Error deleting database: ${deleteRequest.error}`)
            reject(deleteRequest.error)
          }
          deleteRequest.onsuccess = () => {
            Logger.log('Database deleted, reopening...')
            // Try opening again after deletion
            const reopenRequest = indexedDB.open(DB_NAME, DB_VERSION)
            reopenRequest.onerror = () => reject(reopenRequest.error)
            reopenRequest.onsuccess = () => {
              const db = reopenRequest.result
              // Ensure all stores exist before resolving
              this.ensureObjectStoresExist(db)
                .then(() => resolve(db))
                .catch(reject)
            }
            reopenRequest.onupgradeneeded = event => {
              const db = (event.target as IDBOpenDBRequest).result
              this.createObjectStores(db)
            }
          }
        } else {
          reject(error)
        }
      }

      request.onsuccess = () => {
        const db = request.result
        // Ensure all stores exist before resolving
        this.ensureObjectStoresExist(db)
          .then(() => resolve(db))
          .catch(reject)
      }

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result
        this.createObjectStores(db)
      }
    })
  }

  /**
   * Create all required object stores in the database.
   *
   * @param db The IDBDatabase instance.
   */
  private createObjectStores(db: IDBDatabase): void {
    const stores = [
      CHARACTER_STORE_NAME,
      MOTION_STORE_NAME,
      AUDIO_STORE_NAME,
      FACE_STORE_NAME,
    ]
    stores.forEach(storeName => {
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' })
      }
    })
  }

  /**
   * Ensure all required object stores exist in the database.
   *
   * @param db The IDBDatabase instance.
   * @returns Promise that resolves when all stores are created.
   * @throws {Error} if store creation fails.
   */
  private async ensureObjectStoresExist(db: IDBDatabase): Promise<void> {
    return new Promise((resolve, reject) => {
      const requiredStores = [
        CHARACTER_STORE_NAME,
        MOTION_STORE_NAME,
        AUDIO_STORE_NAME,
        FACE_STORE_NAME,
      ]
      const missingStores = requiredStores.filter(
        storeName => !db.objectStoreNames.contains(storeName),
      )

      if (missingStores.length === 0) {
        resolve()
        return
      }

      // If stores are missing, we need to upgrade the database
      Logger.log(
        `Missing object stores detected, upgrading database... ${missingStores}`,
      )

      // Close the current connection
      db.close()

      // Reopen with a higher version to trigger onupgradeneeded
      const upgradeRequest = indexedDB.open(DB_NAME, DB_VERSION + 1)

      upgradeRequest.onerror = () => reject(upgradeRequest.error)
      upgradeRequest.onsuccess = () => {
        const upgradedDb = upgradeRequest.result
        resolve()
      }

      upgradeRequest.onupgradeneeded = event => {
        const upgradedDb = (event.target as IDBOpenDBRequest).result
        this.createObjectStores(upgradedDb)
      }
    })
  }

  /**
   * Check if we have enough storage space.
   *
   * @returns Promise that resolves to true if there is enough space, false otherwise.
   */
  private async checkStorageQuota(): Promise<boolean> {
    try {
      const { usage } = await this.getCacheSize()
      return usage < MAX_CACHE_SIZE
    } catch (error) {
      Logger.error(`Error checking storage quota: ${error}`)
      return true // If we can't check, assume we have space
    }
  }

  /**
   * Clean up old cache entries to free up storage space.
   *
   * @returns Promise that resolves when cleanup is complete.
   */
  private async cleanupCache(): Promise<void> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction(MOTION_STORE_NAME, 'readwrite')
      const store = transaction.objectStore(MOTION_STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        const now = Date.now()
        const entries = request.result

        // Sort by timestamp, oldest first
        entries.sort((a, b) => a.timestamp - b.timestamp)

        // Remove entries until we're under MAX_CACHE_SIZE
        let totalSize = 0
        for (const entry of entries) {
          const entrySize = new Blob([JSON.stringify(entry)]).size
          if (totalSize + entrySize > MAX_CACHE_SIZE) {
            store.delete(entry.id)
          } else {
            totalSize += entrySize
          }
        }
      }
    } catch (error) {
      Logger.error(`Error cleaning up cache: ${error}`)
    }
  }

  private async getCachedCharacter(): Promise<CachedCharacter | null> {
    try {
      if (!this._avatar) {
        Logger.warn('Avatar key is not specified, returning null')
        return null
      }

      const db = await this.initDB()
      return new Promise((resolve, reject) => {
        // Check if the object store exists before creating transaction
        if (!db.objectStoreNames.contains(CHARACTER_STORE_NAME)) {
          Logger.warn(
            `Object store ${CHARACTER_STORE_NAME} does not exist, returning null`,
          )
          resolve(null)
          return
        }

        const transaction = db.transaction(CHARACTER_STORE_NAME, 'readwrite')
        const store = transaction.objectStore(CHARACTER_STORE_NAME)
        const request = store.get(this._avatar)

        request.onerror = () => {
          Logger.error(`Error getting cached mesh file: ${request.error}`)
          reject(request.error)
        }
        request.onsuccess = () => {
          const result = request.result as CachedCharacter | undefined

          if (!result) {
            resolve(null)
            return
          }

          // Check if version matches using MD5
          const currentVersionMd5 = strToMd5(this._motionFileServerVersion || '')
          if (result.version !== currentVersionMd5) {
            Logger.log('Version mismatch, updating cache')
            store.delete(this._avatar) // Remove outdated cache
            resolve(null)
            return
          }

          resolve(result)
        }
      })
    } catch (error) {
      Logger.error(`Error when getting cached character: ${error}`)
      return null
    }
  }

  /**
   * Get cached motion files from IndexedDB.
   *
   * @returns Promise that resolves to cached motion files or null if not found.
   * @throws {Error} if database operation fails.
   */
  private async getCachedMotionFiles(): Promise<Record<number, any> | null> {
    try {
      if (!this._avatar) {
        Logger.warn('Avatar key is not specified, returning null')
        return null
      }

      const db = await this.initDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(MOTION_STORE_NAME, 'readwrite')
        const store = transaction.objectStore(MOTION_STORE_NAME)
        const request = store.get(this._avatar)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const result = request.result as CachedMotionFiles | undefined
          if (!result) {
            resolve(null)
            return
          }

          // Check if version matches using MD5
          const currentVersionMd5 = strToMd5(this._motionFileServerVersion || '')
          if (result.version !== currentVersionMd5) {
            Logger.log('Version mismatch, updating cache')
            store.delete(this._avatar) // Remove outdated cache
            resolve(null)
            return
          }

          // Check if all necessary motion types are present
          const motionStates = new Set<string>()
          Object.values(result.data).forEach(file => {
            // Add all states from the file
            file.states.forEach((state: string) => motionStates.add(state))
            // Add long_idle if isIdleLong is true
            if (file.isIdleLong) {
              motionStates.add('long_idle')
            }
          })

          const hasAllTypes = AssetManager.NECESSARY_MOTION_TYPES.every(state =>
            motionStates.has(state),
          )

          if (!hasAllTypes) {
            Logger.log(
              `Missing necessary motion types: ${AssetManager.NECESSARY_MOTION_TYPES.filter(state => !motionStates.has(state))}`,
            )
            store.delete(this._avatar) // Remove incomplete cache
            resolve(null)
            return
          }

          // Deserialize the data and recreate MotionClip objects
          const deserializedData = Object.entries(result.data).reduce(
            (acc, [id, data]) => {
              const numericId = parseInt(id)
              acc[numericId] = {
                states: data.states,
                isIdleLong: data.isIdleLong,
                loopable: data.loopable,
                loopStartFrame: data.loopStartFrame,
                loopEndFrame: data.loopEndFrame,
                motionClip: new MotionClipWithBidirectionalPriority(
                  data.motionClip.nFrames,
                  data.motionClip.jointNames,
                  data.motionClip.jointRotmat,
                  data.motionClip.rootWorldPosition,
                  0,
                  data.motionClip.startFrame,
                  data.motionClip.restposeName,
                  numericId,
                ),
              }
              return acc
            },
            {} as Record<number, any>,
          )

          resolve(deserializedData)
        }
      })
    } catch (error) {
      Logger.error(`Error getting cached motion files: ${error}`)
      return null
    }
  }

  /**
   * Cache mesh file and related metadata to IndexedDB.
   *
   * @param meshFile Mesh file data.
   * @param jointsMeta Joints metadata.
   * @param rigidsMeta Rigid bodies metadata.
   * @param morphTargetsMeta Morph targets metadata.
   * @returns Promise that resolves when caching is complete.
   */
  private async cacheMeshFile(
    meshFile: Uint8Array,
    jointsMeta: Uint8Array,
    rigidsMeta: Uint8Array,
    morphTargetsMeta: Uint8Array,
  ): Promise<void> {
    try {
      const hasSpace = await this.checkStorageQuota()
      if (!hasSpace) {
        Logger.warn('Storage quota exceeded, cleaning up old cache entries')
        await this.cleanupCache()
      }

      const db = await this.initDB()
      return new Promise((resolve, reject) => {
        // Check if the object store exists before creating transaction
        if (!db.objectStoreNames.contains(CHARACTER_STORE_NAME)) {
          Logger.warn(
            `Object store ${CHARACTER_STORE_NAME} does not exist, cannot cache mesh file`,
          )
          resolve() // Don't fail, just skip caching
          return
        }

        const transaction = db.transaction(CHARACTER_STORE_NAME, 'readwrite')
        const store = transaction.objectStore(CHARACTER_STORE_NAME)
        const request = store.put({
          id: this._avatar,
          meshData: meshFile,
          jointsMeta: jointsMeta,
          rigidsMeta: rigidsMeta,
          morphTargetsMeta: morphTargetsMeta,
          version: strToMd5(this._motionFileServerVersion || ''),
          timestamp: Date.now(),
        } as CachedCharacter)

        request.onerror = () => {
          Logger.error(`Error caching mesh file: ${request.error}`)
          reject(request.error)
        }
        request.onsuccess = () => resolve()
      })
    } catch (error) {
      Logger.error(`Error caching mesh file: ${error}`)
      // Don't throw, just log the error to prevent breaking the flow
    }
  }

  /**
   * Cache motion files to IndexedDB.
   *
   * @param motionFiles Motion files data to cache.
   * @returns Promise that resolves when caching is complete.
   */
  private async cacheMotionFiles(motionFiles: Record<number, any>): Promise<void> {
    try {
      // Check if we have enough storage space
      const hasSpace = await this.checkStorageQuota()
      if (!hasSpace) {
        Logger.warn('Storage quota exceeded, cleaning up old cache entries')
        await this.cleanupCache()
      }

      // Serialize the motion files data
      const serializedData = Object.entries(motionFiles).reduce(
        (acc, [id, data]) => {
          acc[id] = {
            states: data.states,
            isIdleLong: data.isIdleLong,
            loopable: data.loopable,
            loopStartFrame: data.loopStartFrame,
            loopEndFrame: data.loopEndFrame,
            motionClip: {
              nFrames: data.motionClip.nFrames,
              jointNames: data.motionClip.jointNames,
              jointRotmat: data.motionClip.jointRotmat,
              rootWorldPosition: data.motionClip.rootWorldPosition,
              startFrame: data.motionClip.startFrame,
              restposeName: data.motionClip.restposeName,
              motionRecordId: data.motionClip.motionRecordId,
            },
          }
          return acc
        },
        {} as Record<string, SerializedMotionFile>,
      )

      const db = await this.initDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(MOTION_STORE_NAME, 'readwrite')
        const store = transaction.objectStore(MOTION_STORE_NAME)
        const request = store.put({
          id: this._avatar,
          data: serializedData,
          version: strToMd5(this._motionFileServerVersion || ''),
          timestamp: Date.now(),
        } as CachedMotionFiles)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    } catch (error) {
      Logger.error(`Error caching motion files: ${error}`)
    }
  }

  /**
   * Get motion clips.
   *
   * @returns Record of motion clips by ID.
   */
  get motionClips(): Record<number, MotionClipWithBidirectionalPriority> {
    return this._motionClips
  }

  /**
   * Get motion loops.
   *
   * @returns Record of motion loops by ID.
   */
  get motionLoops(): Record<number, number[]> {
    return this._motionLoops
  }

  /**
   * Get motion states to ID mapping.
   *
   * @returns Record mapping motion states to IDs.
   */
  get motionStatesToID(): Record<string, Array<[number, number]>> {
    return this._motionStatesToID
  }

  /**
   * Get face clips.
   *
   * @returns Record of face clips by name.
   */
  get faceClips(): Record<string, FaceClip> {
    return this._faceClips
  }

  /**
   * Get audio bytes.
   *
   * @returns Record of audio data by name.
   */
  get audioBytes(): Record<string, Uint8Array> {
    return this._audioBytes
  }

  /**
   * Synchronize character static assets (mesh, joints, rigid bodies, morph targets).
   *
   * @returns Promise that resolves when synchronization is complete.
   * @throws {Error} if asset synchronization fails.
   */
  async syncCharacterStaticAssets(): Promise<void> {
    const cachedCharacter = await this.getCachedCharacter()
    if (cachedCharacter) {
      Logger.debug(`Using cached model files`)
      // create urls for babylon loading
      this._meshFileUrl = URL.createObjectURL(
        new Blob([cachedCharacter.meshData as BlobPart]),
      )
      this._constraintsFileUrl = URL.createObjectURL(
        new Blob([cachedCharacter.jointsMeta as BlobPart]),
      )
      this._rigidBodiesFileUrl = URL.createObjectURL(
        new Blob([cachedCharacter.rigidsMeta as BlobPart]),
      )
      this._morphTargetsFileUrl = URL.createObjectURL(
        new Blob([cachedCharacter.morphTargetsMeta as BlobPart]),
      )
      return
    }

    try {
      const motionFileClient = new MotionFileClient(
        this._globalState,
        this._motionFileHost,
        this._motionFilePort,
        this._motionFilePathPrefix,
        this._motionFilePath,
        this._motionFileTimeout,
      )

      Logger.debug(`motionFileTimeout: ${this._motionFileTimeout}`)

      await motionFileClient.connect()

      let msg = `Starting to fetch ${this._avatar} model files from server`
      Logger.debug(msg)
      const now = Date.now()

      // If no cache or cache invalid, fetch from server
      const assetsDict = await motionFileClient.getCharacterStaticAssets(
        this._avatar,
      )

      const meshFile = assetsDict[CharacterStaticAssetRequest.MESH]
      const jointsMeta = assetsDict[CharacterStaticAssetRequest.JOINTS_META]
      const rigidsMeta = assetsDict[CharacterStaticAssetRequest.RIGIDS_META]
      const morphTargetsMeta =
        assetsDict[CharacterStaticAssetRequest.MORPH_TARGETS_META]

      msg = `Finished fetching model files from server, took ${(Date.now() - now) / 1000}s`
      Logger.debug(msg)

      await this.cacheMeshFile(meshFile, jointsMeta, rigidsMeta, morphTargetsMeta)

      this._meshFileUrl = URL.createObjectURL(new Blob([meshFile as BlobPart]))
      this._constraintsFileUrl = URL.createObjectURL(
        new Blob([jointsMeta as BlobPart]),
      )
      this._rigidBodiesFileUrl = URL.createObjectURL(
        new Blob([rigidsMeta as BlobPart]),
      )
      this._morphTargetsFileUrl = URL.createObjectURL(
        new Blob([morphTargetsMeta as BlobPart]),
      )

      await motionFileClient.disconnect()
    } catch (error) {
      throw new Error('Error syncing character static assets: ' + error)
    }
  }

  /**
   * Synchronize motion files from server or cache.
   *
   * @returns Promise that resolves when synchronization is complete.
   * @throws {Error} if motion synchronization fails.
   */
  async syncMotion(): Promise<void> {
    // Get version first
    const motionFileClient = new MotionFileClient(
      this._globalState,
      this._motionFileHost,
      this._motionFilePort,
      this._motionFilePathPrefix,
      this._motionFilePath,
      this._motionFileTimeout,
    )

    await motionFileClient.connect()
    this._motionFileServerVersion = await motionFileClient.getVersion()
    // Try to get cached motion files
    const cachedMotionFiles = await this.getCachedMotionFiles()
    if (cachedMotionFiles) {
      Logger.debug('Using cached motion files')
      // Process cached motion files
      this._motionClips = {}
      this._motionStatesToID = {}
      this._motionLoops = {}

      // Initialize motion states
      for (const state of AssetManager.NECESSARY_MOTION_TYPES) {
        this._motionStatesToID[state] = []
      }

      let longIdleId: number | null = null

      // Process each motion file
      for (const [motionRecordId, motionFileDict] of Object.entries(
        cachedMotionFiles,
      )) {
        const id = parseInt(motionRecordId)
        const states = [...motionFileDict.states]

        // Add long_idle state if isIdleLong is true
        if (motionFileDict.isIdleLong) {
          states.push('long_idle')
        }

        // Add states to motion_states_to_id
        for (const state of states) {
          if (state in this._motionStatesToID) {
            this._motionStatesToID[state].push([id, 1.0])
          }
        }

        // Store motion clip
        this._motionClips[id] = motionFileDict.motionClip

        // Check for long_idle
        if (states.includes('long_idle')) {
          longIdleId = id
        }

        // Store loop frames if they exist
        if (motionFileDict.loopStartFrame > 0 && motionFileDict.loopEndFrame > 0) {
          this._motionLoops[id] = [
            motionFileDict.loopStartFrame,
            motionFileDict.loopEndFrame,
          ]
        }
      }

      // Check for long_idle
      if (longIdleId === null) {
        throw new Error('Missing long idle animation file.')
      }

      // Update rates
      for (const [state, candidates] of Object.entries(this._motionStatesToID)) {
        if (candidates.length === 0) {
          throw new Error(`Missing motion animation files for state ${state}.`)
        } else if (candidates.length === 1) {
          continue
        } else {
          if (state === 'idle') {
            const avgRate = (1.0 - this._longIdleRate) / (candidates.length - 1)
            for (const candidate of candidates) {
              if (candidate[0] === longIdleId) {
                candidate[1] = this._longIdleRate
              } else {
                candidate[1] = avgRate
              }
            }
          } else {
            const avgRate = 1.0 / candidates.length
            for (const candidate of candidates) {
              candidate[1] = avgRate
            }
          }
        }
      }
      await motionFileClient.disconnect()
      return
    }

    Logger.debug(
      `Starting to fetch ${this._avatar} motion animation files from server`,
    )
    const now = Date.now()
    // If no cache or cache invalid, fetch from server
    const motionFiles = await motionFileClient.getMotionFiles(this._avatar)
    Logger.debug(
      `Finished fetching motion animation files from server, took ${(Date.now() - now) / 1000}s`,
    )

    // Cache the motion files
    await this.cacheMotionFiles(motionFiles)

    // Process motion files
    this._motionClips = {}
    this._motionStatesToID = {}
    this._motionLoops = {}

    // Initialize motion states
    for (const state of AssetManager.NECESSARY_MOTION_TYPES) {
      this._motionStatesToID[state] = []
    }

    let longIdleId: number | null = null

    // Process each motion file
    for (const [motionRecordId, motionFileDict] of Object.entries(motionFiles)) {
      const id = parseInt(motionRecordId)
      const states = [...motionFileDict.states]

      // Add long_idle state if isIdleLong is true
      if (motionFileDict.isIdleLong) {
        states.push('long_idle')
      }

      // Add states to motion_states_to_id
      for (const state of states) {
        if (state in this._motionStatesToID) {
          this._motionStatesToID[state].push([id, 1.0])
        }
      }

      // Store motion clip
      this._motionClips[id] = motionFileDict.motionClip

      // Check for long_idle
      if (states.includes('long_idle')) {
        longIdleId = id
      }

      // Store loop frames if they exist
      if (motionFileDict.loopStartFrame > 0 && motionFileDict.loopEndFrame > 0) {
        this._motionLoops[id] = [
          motionFileDict.loopStartFrame,
          motionFileDict.loopEndFrame,
        ]
      }
    }

    // Check for long_idle
    if (longIdleId === null) {
      throw new Error('Missing long idle animation file.')
    }

    // Update rates
    for (const [state, candidates] of Object.entries(this._motionStatesToID)) {
      if (candidates.length === 0) {
        throw new Error(`Missing motion animation files for state ${state}.`)
      } else if (candidates.length === 1) {
        continue
      } else {
        if (state === 'idle') {
          const avgRate = (1.0 - this._longIdleRate) / (candidates.length - 1)
          for (const candidate of candidates) {
            if (candidate[0] === longIdleId) {
              candidate[1] = this._longIdleRate
            } else {
              candidate[1] = avgRate
            }
          }
        } else {
          const avgRate = 1.0 / candidates.length
          for (const candidate of candidates) {
            candidate[1] = avgRate
          }
        }
      }
    }

    await motionFileClient.disconnect()
  }

  /**
   * Clear all cached files from IndexedDB.
   *
   * @returns Promise that resolves when cache is cleared.
   * @throws {Error} if cache clearing fails.
   */
  public async clearCache(): Promise<void> {
    try {
      const db = await this.initDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(
          [
            CHARACTER_STORE_NAME,
            MOTION_STORE_NAME,
            AUDIO_STORE_NAME,
            FACE_STORE_NAME,
          ],
          'readwrite',
        )
        const motionStore = transaction.objectStore(MOTION_STORE_NAME)
        const audioStore = transaction.objectStore(AUDIO_STORE_NAME)
        const faceStore = transaction.objectStore(FACE_STORE_NAME)
        const meshStore = transaction.objectStore(CHARACTER_STORE_NAME)

        const motionRequest = motionStore.clear()
        const audioRequest = audioStore.clear()
        const faceRequest = faceStore.clear()
        const meshRequest = meshStore.clear()

        let completedRequests = 0
        const checkCompletion = () => {
          completedRequests++
          if (completedRequests === 4) {
            Logger.log('All stores cleared successfully')
            resolve()
          }
        }

        motionRequest.onsuccess = checkCompletion
        audioRequest.onsuccess = checkCompletion
        faceRequest.onsuccess = checkCompletion
        meshRequest.onsuccess = checkCompletion

        transaction.onerror = () => {
          Logger.error(`Error clearing stores: ${transaction.error}`)
          reject(transaction.error)
        }
      })
    } catch (error) {
      Logger.error(`Error clearing cache: ${error}`)
      throw error
    }
  }

  /**
   * Clear cached files for a specific avatar.
   *
   * @param avatar Avatar name to clear cache for.
   * @returns Promise that resolves when cache is cleared.
   * @throws {Error} if cache clearing fails.
   */
  public async clearAvatarCache(avatar: string): Promise<void> {
    try {
      const db = await this.initDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(MOTION_STORE_NAME, 'readwrite')
        const store = transaction.objectStore(MOTION_STORE_NAME)
        const request = store.delete(avatar)

        request.onerror = () => {
          Logger.error(`Error clearing cache for avatar ${avatar}: ${request.error}`)
          reject(request.error)
        }
        request.onsuccess = () => {
          Logger.log(`Cache cleared successfully for avatar ${avatar}`)
          resolve()
        }
      })
    } catch (error) {
      Logger.error(`Error clearing cache for avatar ${avatar}: ${error}`)
      throw error
    }
  }

  /**
   * Get total cache size from IndexedDB.
   *
   * @returns Promise that resolves to total cache size in bytes.
   */
  private async getTotalCacheSize(): Promise<number> {
    try {
      const db = await this.initDB()
      return new Promise((resolve, reject) => {
        // Check which stores exist
        const existingStores = Array.from(db.objectStoreNames)
        const storesToQuery = existingStores.filter(store =>
          [
            MOTION_STORE_NAME,
            CHARACTER_STORE_NAME,
            AUDIO_STORE_NAME,
            FACE_STORE_NAME,
          ].includes(store),
        )

        if (storesToQuery.length === 0) {
          resolve(0)
          return
        }

        const transaction = db.transaction(storesToQuery, 'readonly')
        let totalSize = 0
        let completedRequests = 0

        const processResults = (results: any[]) => {
          totalSize += results.reduce((acc, entry) => {
            // Calculate actual storage size more accurately
            let entrySize = 0

            // Add size of basic properties
            if (entry.id) entrySize += new Blob([entry.id]).size
            if (entry.version) entrySize += new Blob([entry.version]).size
            if (entry.timestamp) entrySize += 8 // timestamp is a number (8 bytes)

            // Add size of data array (most important part)
            if (entry.data && entry.data instanceof Uint8Array) {
              entrySize += entry.data.length
            } else if (entry.data) {
              // Fallback for other data types
              entrySize += new Blob([JSON.stringify(entry.data)]).size
            }

            return acc + entrySize
          }, 0)
          completedRequests++
          if (completedRequests === storesToQuery.length) {
            resolve(totalSize)
          }
        }

        storesToQuery.forEach(storeName => {
          const store = transaction.objectStore(storeName)
          const request = store.getAll()
          request.onsuccess = () => processResults(request.result)
        })

        transaction.onerror = () => reject(transaction.error)
      })
    } catch (error) {
      Logger.error(`Error getting total cache size: ${error}`)
      return 0
    }
  }

  /**
   * Get cache size information.
   *
   * @returns Promise that resolves to cache size information object.
   * @throws {Error} if cache size calculation fails.
   */
  public async getCacheSize(): Promise<{
    usage: number
    quota: number
    percentage: number
  }> {
    try {
      const usage = await this.getTotalCacheSize()
      return {
        usage,
        quota: MAX_CACHE_SIZE,
        percentage: (usage / MAX_CACHE_SIZE) * 100,
      }
    } catch (error) {
      Logger.error(`Error getting cache size: ${error}`)
      throw error
    }
  }

  /**
   * Get cache size for a specific avatar.
   *
   * @param avatar Avatar name to get cache size for.
   * @returns Promise that resolves to cache size in bytes.
   * @throws {Error} if cache size calculation fails.
   */
  public async getAvatarCacheSize(avatar: string): Promise<number> {
    try {
      const db = await this.initDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(MOTION_STORE_NAME, 'readonly')
        const store = transaction.objectStore(MOTION_STORE_NAME)
        const request = store.get(avatar)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const result = request.result as CachedMotionFiles | undefined
          if (!result) {
            resolve(0)
            return
          }

          // Calculate approximate size by converting to string
          const size = new Blob([JSON.stringify(result)]).size
          resolve(size)
        }
      })
    } catch (error) {
      Logger.error(`Error getting avatar cache size: ${error}`)
      throw error
    }
  }

  /**
   * Format bytes to human readable string.
   *
   * @param bytes Number of bytes to format.
   * @returns Formatted string representation of bytes.
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Log cache size information to console.
   *
   * @returns Promise that resolves when logging is complete.
   */
  public async logCacheSize(): Promise<void> {
    try {
      const totalSize = await this.getCacheSize()
      const motionSize = await this.getStoreSize(MOTION_STORE_NAME)
      const audioSize = await this.getStoreSize(AUDIO_STORE_NAME)
      const faceSize = await this.getStoreSize(FACE_STORE_NAME)
      const meshSize = await this.getStoreSize(CHARACTER_STORE_NAME)
      const avatarSize = await this.getAvatarCacheSize(this._avatar)

      Logger.log('Cache Size Information:')
      Logger.log(`Total Usage: ${this.formatBytes(totalSize.usage)}`)
      Logger.log(`Max Cache Size: ${this.formatBytes(MAX_CACHE_SIZE)}`)
      Logger.log(`Usage Percentage: ${totalSize.percentage.toFixed(2)}%`)

      Logger.log(`Motion Store Size: ${this.formatBytes(motionSize)}`)
      Logger.log(`Audio Store Size: ${this.formatBytes(audioSize)}`)
      Logger.log(`Face Store Size: ${this.formatBytes(faceSize)}`)
      Logger.log(`Mesh Store Size: ${this.formatBytes(meshSize)}`)

      Logger.log(`Current Avatar Cache Size: ${this.formatBytes(avatarSize)}`)
    } catch (error) {
      Logger.error(`Error logging cache size: ${error}`)
    }
  }

  /**
   * Cache audio files to IndexedDB.
   *
   * @param audioFiles Audio files data to cache.
   * @param nFrames Number of frames for each audio file.
   * @returns Promise that resolves when caching is complete.
   */
  private async cacheAudioFiles(
    audioFiles: Record<string, Uint8Array>,
    nFrames: Record<string, number>,
  ): Promise<void> {
    try {
      // Check if we have enough storage space
      const hasSpace = await this.checkStorageQuota()
      if (!hasSpace) {
        Logger.warn('Storage quota exceeded, cleaning up old cache entries')
        await this.cleanupCache()
      }

      const db = await this.initDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(AUDIO_STORE_NAME, 'readwrite')
        const store = transaction.objectStore(AUDIO_STORE_NAME)
        const request = store.put({
          id: this._avatar,
          data: Object.entries(audioFiles).reduce(
            (acc, [name, data]) => {
              acc[name] = {
                data,
                nFrames: nFrames[name],
                timestamp: Date.now(),
              }
              return acc
            },
            {} as Record<string, SerializedAudioFile>,
          ),
          version: this._getAssetVersion('audio'),
          timestamp: Date.now(),
        } as CachedAudioFiles)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    } catch (error) {
      Logger.error(`Error caching audio files: ${error}`)
    }
  }

  /**
   * Cache face files to IndexedDB.
   *
   * @param faceFiles Face files data to cache.
   * @returns Promise that resolves when caching is complete.
   */
  private async cacheFaceFiles(faceFiles: Record<string, FaceClip>): Promise<void> {
    try {
      // Check if we have enough storage space
      const hasSpace = await this.checkStorageQuota()
      if (!hasSpace) {
        Logger.warn('Storage quota exceeded, cleaning up old cache entries')
        await this.cleanupCache()
      }

      const db = await this.initDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(FACE_STORE_NAME, 'readwrite')
        const store = transaction.objectStore(FACE_STORE_NAME)
        const request = store.put({
          id: this._avatar,
          data: Object.entries(faceFiles).reduce(
            (acc, [name, clip]) => {
              acc[name] = {
                data: {
                  blendShapeNames: clip.blendShapeNames,
                  blendShapeValues: clip.blendShapeValues,
                  timelineStartIdx: clip.timelineStartIdx,
                },
                timestamp: Date.now(),
              }
              return acc
            },
            {} as Record<string, SerializedFaceFile>,
          ),
          version: this._getAssetVersion('face'),
          timestamp: Date.now(),
        } as CachedFaceFiles)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    } catch (error) {
      Logger.error(`Error caching face files: ${error}`)
    }
  }

  /**
   * Get cached audio files from IndexedDB.
   *
   * @returns Promise that resolves to cached audio files or null if not found.
   * @throws {Error} if database operation fails.
   */
  private async getCachedAudioFiles(): Promise<Record<
    string,
    { data: Uint8Array; nFrames: number }
  > | null> {
    try {
      if (!this._avatar) {
        Logger.warn('Avatar key is not specified, returning null')
        return null
      }

      const db = await this.initDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(AUDIO_STORE_NAME, 'readonly')
        const store = transaction.objectStore(AUDIO_STORE_NAME)
        const request = store.get(this._avatar)

        request.onerror = () => reject(request.error)
        request.onsuccess = async () => {
          const result = request.result as CachedAudioFiles | undefined
          if (!result) {
            resolve(null)
            return
          }

          let reason: string = ''

          if (result.version !== this._getAssetVersion('audio')) {
            reason = 'version mismatch'
          }

          const clearCache = () => {
            // Use a separate readwrite transaction for deletion
            const deleteTransaction = db.transaction(AUDIO_STORE_NAME, 'readwrite')
            const deleteStore = deleteTransaction.objectStore(AUDIO_STORE_NAME)
            deleteStore.delete(this._avatar)
            resolve(null)
          }

          if (reason !== '') {
            Logger.log(`Clearing audio cache due to ${reason}`)
            clearCache()
            return
          }

          // Return deserialized data
          const deserializedData = Object.entries(result.data).reduce(
            (acc, [name, file]) => {
              acc[name] = {
                data: file.data,
                nFrames: file.nFrames,
              }
              return acc
            },
            {} as Record<string, { data: Uint8Array; nFrames: number }>,
          )

          resolve(deserializedData)
        }
      })
    } catch (error) {
      Logger.error(`Error getting cached audio files: ${error}`)
      return null
    }
  }

  /**
   * Get asset version based on TTS settings.
   *
   * @param animType Animation type ('audio' or 'face').
   * @returns Asset version string.
   */
  private _getAssetVersion(animType: 'audio' | 'face'): string {
    const seed = `${this._ttsAdapter}_${this._voiceName}_${this._voiceSpeed}`
    const md5 = strToMd5(seed)
    const assetVersion = `${animType}_${md5}`

    return assetVersion
  }

  /**
   * Get cached face files from IndexedDB.
   *
   * @returns Promise that resolves to cached face files or null if not found.
   * @throws {Error} if database operation fails.
   */
  private async getCachedFaceFiles(): Promise<Record<string, FaceClip> | null> {
    try {
      if (!this._avatar) {
        Logger.warn('Avatar key is not specified, returning null')
        return null
      }

      const db = await this.initDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(FACE_STORE_NAME, 'readonly')
        const store = transaction.objectStore(FACE_STORE_NAME)
        const request = store.get(this._avatar)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const result = request.result as CachedFaceFiles | undefined
          if (!result) {
            resolve(null)
            return
          }

          let reason: string = ''

          if (result.version !== this._getAssetVersion('face')) {
            reason = 'version mismatch'
          }

          const clearCache = () => {
            // Use a separate readwrite transaction for deletion
            const deleteTransaction = db.transaction(FACE_STORE_NAME, 'readwrite')
            const deleteStore = deleteTransaction.objectStore(FACE_STORE_NAME)
            deleteStore.delete(this._avatar)
            resolve(null)
          }

          if (reason !== '') {
            Logger.log(`Clearing face cache due to ${reason}`)
            clearCache()
            return
          }

          // Convert serialized data back to FaceClip objects
          const deserializedData = Object.entries(result.data).reduce(
            (acc, [name, file]) => {
              acc[name] = new FaceClip(
                file.data.blendShapeNames,
                file.data.blendShapeValues,
                file.data.timelineStartIdx,
              )
              return acc
            },
            {} as Record<string, FaceClip>,
          )

          resolve(deserializedData)
        }
      })
    } catch (error) {
      Logger.error(`Error getting cached face files: ${error}`)
      return null
    }
  }

  /**
   * Generate audio and face files for a specific animation.
   *
   * @param animName Animation name to generate files for.
   * @returns Promise that resolves to generated audio and face data.
   * @throws {Error} if generation fails.
   */
  private async _generateAudioAndFace(
    animName: string,
  ): Promise<{ audioData?: Uint8Array; faceClip?: FaceClip }> {
    // Use default voice if current voice is not supported
    const voiceName = AssetManager.MISSING_VOICE_NAMES.includes(this._voiceName)
      ? AssetManager.DEFAULT_VOICE_NAME
      : this._voiceName
    const ttsAdapter = AssetManager.MISSING_VOICE_NAMES.includes(this._voiceName)
      ? AssetManager.DEFAULT_TTS_ADAPTER
      : this._ttsAdapter

    const speechText = this._speechTexts[animName]
    const requestDict = {
      appName: 'babylon',
      speechText: speechText,
      ttsAdapter: ttsAdapter,
      voiceName: voiceName,
      voiceSpeed: this._voiceSpeed,
      faceModel: this._faceModel,
      avatar: this._avatar,
      userId: this._userID,
      characterId: this._characterID,
      maxFrontExtensionDuration: 0.0,
      maxRearExtensionDuration: 0.0,
    }

    const client = new OrchestratorClient(
      this._globalState,
      this._orchestratorHost,
      this._orchestratorPort,
      this._orchestratorPathPrefix,
      this._orchestratorDirectStreamingPath,
      requestDict,
      this._motionFileTimeout,
    )

    try {
      await client.run()

      // Wait for response type
      Logger.debug('Waiting for response type...')
      let respType = null
      let attempts = 0
      const maxAttempts = 1000 // 600 seconds total (1000 * 600ms)

      while (respType === null && attempts < maxAttempts) {
        try {
          respType = await client.getResponseType()
          Logger.debug(`Attempt ${attempts + 1} getResponseType result: ${respType}`)
        } catch (error) {
          Logger.error(`Error getting response type: ${error}`)
        }
        if (respType === null) {
          await new Promise(resolve => setTimeout(resolve, 600))
          attempts++
        }
      }

      if (respType === null) {
        const msg = `Failed to get response type after ${maxAttempts} attempts`
        Logger.error(msg)
        throw new Error(msg)
      }

      Logger.debug(`Got response type: ${respType}`)

      if (respType !== 'normal') {
        const msg = `Client received incorrect generation result type: ${respType}`
        Logger.error(msg)
        throw new Error(msg)
      }

      Logger.debug('Wait for stream end')

      // Wait for stream to end with timeout
      const startTime = Date.now()
      const timeout = 600000 // 600 seconds timeout
      let streamEndAttempts = 0
      while (!(await client.streamEnd())) {
        streamEndAttempts++
        const elapsed = Date.now() - startTime
        if (elapsed > timeout) {
          const msg = `Stream end timeout after ${timeout / 1000} seconds (${streamEndAttempts} attempts)`
          Logger.error(msg)
          throw new Error(msg)
        }
        if (streamEndAttempts % 10 === 0) {
          Logger.debug(
            `Still waiting for stream end... (${elapsed}ms elapsed, ${streamEndAttempts} attempts)`,
          )
        }
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      Logger.debug(
        `Stream end after ${streamEndAttempts} attempts and ${Date.now() - startTime}ms`,
      )

      const animationDict = await client.getAnimation()

      const result: { audioData?: Uint8Array; faceClip?: FaceClip } = {}
      // Process audio data
      if (animationDict.audio) {
        result.audioData = animationDict['audio'] as Uint8Array
        Logger.debug(`Processed audio data for ${animName}`)
      }

      // Process face data
      if (animationDict.face) {
        result.faceClip = animationDict['face'] as FaceClip
        Logger.debug(`Processed face data for ${animName}`)
      }

      await client.dispose()

      return result
    } catch (error) {
      Logger.error(`Error when generating audio and face: ${error}`)
      throw error
    }
  }

  /**
   * Synchronize audio and face files from server or cache.
   *
   * @returns Promise that resolves when synchronization is complete.
   * @throws {Error} if synchronization fails.
   */
  public async syncAudioAndFace(): Promise<void> {
    // Try to get cached files first
    const cachedAudioFiles = await this.getCachedAudioFiles()
    const cachedFaceFiles = await this.getCachedFaceFiles()
    if (cachedAudioFiles && cachedFaceFiles) {
      Logger.debug('Using cached audio and face files')
      this._audioBytes = Object.entries(cachedAudioFiles).reduce(
        (acc, [name, file]) => {
          acc[name] = file.data
          return acc
        },
        {} as Record<string, Uint8Array>,
      )
      this._faceClips = cachedFaceFiles
      return
    }

    // If no cache or cache invalid, generate new files
    const audioFiles: Record<string, Uint8Array> = {}
    const faceFiles: Record<string, FaceClip> = {}
    const nFrames: Record<string, number> = {}

    // Check for missing voice warning
    if (
      AssetManager.MISSING_VOICE_NAMES.includes(this._voiceName) &&
      !this._missingVoiceWarned
    ) {
      Logger.warn(
        `Current voice ${this._voiceName} is not supported, will use default voice instead.`,
      )
      this._missingVoiceWarned = true
    }

    Logger.debug(
      `Starting to generate ${this._avatar} audio and face animation files`,
    )
    const now = Date.now()
    // Generate audio and face files for each animation
    for (const animName of Object.keys(this._speechTexts)) {
      const result = await this._generateAudioAndFace(animName)
      if (result.audioData) {
        audioFiles[animName] = result.audioData
        nFrames[animName] =
          result.audioData.length / (this._wavNChannels * this._wavSampleWidth)
      }

      if (result.faceClip) {
        faceFiles[animName] = result.faceClip
      }
    }
    Logger.debug(
      `Finished generating ${this._avatar} audio and face animation files, took ${(Date.now() - now) / 1000}s`,
    )

    // Cache the generated files
    await this.cacheAudioFiles(audioFiles, nFrames)
    await this.cacheFaceFiles(faceFiles)

    // Update the instance variables
    this._audioBytes = audioFiles
    this._faceClips = faceFiles
  }

  /**
   * Get cache size for a specific store.
   *
   * @param storeName Name of the store to get size for.
   * @returns Promise that resolves to store size in bytes.
   */
  private async getStoreSize(storeName: string): Promise<number> {
    try {
      const db = await this.initDB()
      return new Promise((resolve, reject) => {
        // Check if store exists
        if (!db.objectStoreNames.contains(storeName)) {
          resolve(0)
          return
        }

        const transaction = db.transaction(storeName, 'readonly')
        const store = transaction.objectStore(storeName)
        const request = store.getAll()

        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const size = request.result.reduce((acc, entry) => {
            // Calculate actual storage size more accurately
            let entrySize = 0

            // Add size of basic properties
            if (entry.id) entrySize += new Blob([entry.id]).size
            if (entry.version) entrySize += new Blob([entry.version]).size
            if (entry.timestamp) entrySize += 8 // timestamp is a number (8 bytes)

            // Add size of data array (most important part)
            if (entry.data && entry.data instanceof Uint8Array) {
              entrySize += entry.data.length
            } else if (entry.data) {
              // Fallback for other data types
              entrySize += new Blob([JSON.stringify(entry.data)]).size
            }

            return acc + entrySize
          }, 0)
          resolve(size)
        }
      })
    } catch (error) {
      Logger.error(`Error getting ${storeName} size: ${error}`)
      return 0
    }
  }

  /**
   * Delete the entire database and recreate it.
   * Use this when you need to start fresh or when there are version conflicts.
   *
   * @returns Promise that resolves when database is reset.
   * @throws {Error} if database reset fails.
   */
  public async resetDatabase(): Promise<void> {
    try {
      // Close any existing connections
      const db = await this.initDB()
      db.close()

      // Delete the database
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(DB_NAME)
        request.onerror = () => {
          Logger.error(`Error deleting database: ${request.error}`)
          reject(request.error)
        }
        request.onsuccess = () => {
          resolve()
        }
      })

      // Wait a bit to ensure the deletion is complete
      await new Promise(resolve => setTimeout(resolve, 100))

      // Reinitialize the database
      await this.initDB()
    } catch (error) {
      Logger.error(`Error resetting database: ${error}`)
      throw error
    }
  }

  /**
   * Get mesh file URL.
   *
   * @returns Mesh file URL or null if not available.
   */
  public get meshFileUrl(): string | null {
    return this._meshFileUrl
  }

  /**
   * Get constraints file URL.
   *
   * @returns Constraints file URL or null if not available.
   */
  public get constraintsFileUrl(): string | null {
    return this._constraintsFileUrl
  }

  /**
   * Get rigid bodies file URL.
   *
   * @returns Rigid bodies file URL or null if not available.
   */
  public get rigidBodiesFileUrl(): string | null {
    return this._rigidBodiesFileUrl
  }

  /**
   * Get morph targets file URL.
   *
   * @returns Morph targets file URL or null if not available.
   */
  public get morphTargetsFileUrl(): string | null {
    return this._morphTargetsFileUrl
  }

  /**
   * Get motion file timeout.
   *
   * @returns Motion file timeout in seconds.
   */
  public get motionFileTimeout(): number {
    return this._motionFileTimeout
  }
}
