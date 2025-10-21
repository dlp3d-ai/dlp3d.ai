import * as BABYLON from '@babylonjs/core'
import * as BABYLON_GUI from '@babylonjs/gui'
import { RoamingCamera } from '@/library/babylonjs/runtime/camera'
import '@babylonjs/loaders'
import { Light } from '@/library/babylonjs/runtime/light'
import { GUI } from '@/library/babylonjs/runtime/gui'
import { GlobalState, INTRINSIC_FRAME_RATE } from '@/library/babylonjs/core'
import { GLTFFileLoader } from '@babylonjs/loaders'
import { StreamAudioPlayer } from '@/library/babylonjs/runtime/audio'
import { Runtime } from '@/library/babylonjs/runtime'
import {
  Conditions,
  ConditionedMessage,
  StateMachine,
} from '@/library/babylonjs/runtime/fsm'
import { Logger, LogLevel } from '@/library/babylonjs/utils'
import { LoadingProgressManager } from '../../utils/progressManager'
import { HDRI_SCENES } from '@/library/babylonjs/config/scene'
import { ConfigSync } from '@/library/babylonjs/config'

/**
 * TypeScript type definitions for user ID handling.
 */
interface UserIdResult {
  /** The user ID string. */
  id: string
}

/**
 * Retrieves the current user ID from local storage
 * with proper error handling and fallback mechanism.
 *
 * @returns A promise that resolves to a UserIdResult object containing
 *          the user ID.
 */
async function getUserId(): Promise<UserIdResult> {
  const authState = localStorage.getItem('dlp3d_auth_state')
  if (!authState) {
    // fallback to default user id
    return {
      id: 'web_test_01_new',
    }
  }
  const userInfo = JSON.parse(authState).userInfo

  return {
    id: userInfo.id,
  }
}

/**
 * Initialize the Babylon scene when it's ready.
 *
 * This function sets up the complete scene including lighting, camera,
 * GUI, network configuration, state machine, and various visual effects.
 * It handles user authentication, network testing, and character loading.
 *
 * @param globalState The global state object containing scene and runtime information.
 * @param characterIdOverride Optional character ID to override the default character.
 *
 * @throws {Error} if scene initialization fails or network configuration is invalid.
 */
export default async function onSceneReady(globalState: GlobalState) {
  const debugModeEnabled = localStorage.getItem('debug_mode') === '1' ? true : false
  const logLevel = debugModeEnabled ? LogLevel.TRACE : LogLevel.WARN
  Logger.getInstance().setLogLevel(logLevel)

  if (typeof window !== 'undefined') {
    LoadingProgressManager.getInstance().updateProgress(
      0,
      'Initializing Scene...',
      'onSceneReady-init',
    )
  }

  const scene = globalState.scene
  scene.useRightHandedSystem = true
  // scene.debugLayer.show()

  BABYLON.SceneLoader.OnPluginActivatedObservable.add(function (plugin) {
    if (plugin.name === 'gltf' && plugin instanceof GLTFFileLoader)
      plugin.targetFps = INTRINSIC_FRAME_RATE
  })

  const light = new Light(scene)

  // read homepage camera parameters
  let initialCameraState: any = null
  if (typeof window !== 'undefined') {
    const camStr = localStorage.getItem('dlp_camera_state')
    if (camStr) {
      try {
        initialCameraState = JSON.parse(camStr)
      } catch {}
    }
  }

  const roamingCamera = new RoamingCamera(scene)
  if (initialCameraState) {
    roamingCamera.alpha = initialCameraState.alpha
    roamingCamera.beta = initialCameraState.beta
    roamingCamera.radius = initialCameraState.radius
    roamingCamera.target = new BABYLON.Vector3(
      initialCameraState.target.x,
      initialCameraState.target.y,
      initialCameraState.target.z,
    )
  }

  const hemisphericLight = new BABYLON.HemisphericLight(
    'HemisphericLight',
    new BABYLON.Vector3(0, 1, 0),
    scene,
  )
  hemisphericLight.intensity = 0.3
  hemisphericLight.specular = new BABYLON.Color3(0, 0, 0)
  hemisphericLight.groundColor = new BABYLON.Color3(1, 1, 1)

  const gui = new GUI(globalState)
  globalState.gui = gui

  Logger.log('Starting dynamic user ID injection process...')
  const userIdResult: UserIdResult = await getUserId()
  Logger.log(`User ID injection result: userId: ${userIdResult.id}`)

  const characterIdOverride = localStorage.getItem('dlp_selected_character_id')
  Logger.log(`Character ID injection result: characterId: ${characterIdOverride}`)

  // Additional logging for character ID debugging
  if (characterIdOverride) {
    Logger.log(
      `Character ID override provided: ${characterIdOverride} This should be sent to backend`,
    )
  } else {
    Logger.warn(
      'No character ID override provided! Will fallback to default_character_1 from config',
    )
  }

  const configSync = new ConfigSync()
  configSync.setItem('userId', userIdResult.id)
  configSync.setItem('characterId', characterIdOverride)

  const assetManagerCfg = {
    type: 'AssetManager',
    appName: 'babylon',
    speechTexts: {
      leave: '公务缠身，先走一步。',
      error: '我没听清楚，请您再说一遍。',
    },
    longIdleRate: 0.7,
    wavNChannels: 1,
    wavSampleWidth: 2,
    wavSampleRate: 16000,
  }

  const bufferSizeEstimatorCfgs = {
    audio: {
      type: 'AdaptiveBufferSizeEstimator',
      name: 'Audio Buffer Size Estimator',
      weight: 0.5,
      safeRate: 0.5,
    },
    face: {
      type: 'AdaptiveBufferSizeEstimator',
      name: 'Face Buffer Size Estimator',
      weight: 0.5,
      safeRate: 0.5,
    },
    motion: {
      type: 'AdaptiveBufferSizeEstimator',
      name: 'Motion Buffer Size Estimator',
      weight: 0.5,
      safeRate: 0.5,
    },
  }

  // Create state machine synchronously
  const stateMachine = new StateMachine(
    globalState,
    configSync,
    assetManagerCfg,
    bufferSizeEstimatorCfgs,
  )
  stateMachine.run()
  globalState.stateMachine = stateMachine

  // listen for start-character-animation event
  if (typeof window !== 'undefined') {
    // ensure the event listener is only added once
    const eventHandler = () => {
      Logger.log(
        'Received start-character-animation event, preparing to send USER_START_GAME condition',
      )

      // Execute camera animation
      const startRadius = roamingCamera.radius
      const targetRadius = Math.max(1.2, 1.6)
      const startTargetY = roamingCamera.target.y
      const targetTargetY = 1
      const duration = 800
      const startTime = performance.now()

      function animateCameraRadius(now: number) {
        const elapsed = now - startTime
        const t = Math.min(1, elapsed / duration)

        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
        roamingCamera.radius = startRadius + (targetRadius - startRadius) * ease

        roamingCamera.target.y = startTargetY + (targetTargetY - startTargetY) * ease
        if (t < 1) {
          requestAnimationFrame(animateCameraRadius)
        } else {
          roamingCamera.radius = targetRadius
          roamingCamera.target.y = targetTargetY
        }
      }

      requestAnimationFrame(animateCameraRadius)

      stateMachine.putConditionedMessage(
        new ConditionedMessage(Conditions.USER_START_GAME, {
          message: 'User clicked start button, starting character animation',
        }),
      )
      Logger.log('USER_START_GAME condition has been sent to state machine')
    }

    // Remove any existing old listeners
    window.removeEventListener('start-character-animation', eventHandler)
    // Add new listener
    window.addEventListener('start-character-animation', eventHandler)
    Logger.log('start-character-animation event listener has been added')
  }

  // setup gizmo
  const utilLayer = new BABYLON.UtilityLayerRenderer(scene)
  utilLayer.setRenderCamera(roamingCamera)

  const audioPlayer = new StreamAudioPlayer(null)

  const runtime = new Runtime(globalState, scene)
  runtime.register(scene)

  runtime.setAudioPlayer(audioPlayer)

  globalState.runtime = runtime

  roamingCamera.viewport = new BABYLON.Viewport(0, 0, 1, 1)
  scene.cameraToUseForPointers = roamingCamera
  scene.activeCameras = [roamingCamera]

  // Character loading completion event
  if (typeof window !== 'undefined') {
    // listen for the progress event of the state machine
    const progressHandler = (event: CustomEvent) => {
      const { progress } = event.detail
      if (progress >= 95) {
        // remove the listener to avoid duplicate dispatching
        window.removeEventListener(
          'loading-progress',
          progressHandler as EventListener,
        )
        // delay a small amount of time to ensure the state machine is fully initialized
        setTimeout(() => {
          window.dispatchEvent(new Event('character-loaded'))
          Logger.log('character-loaded event has been dispatched')
        }, 500)
      }
    }

    window.addEventListener('loading-progress', progressHandler as EventListener)
  }

  const renderPipeline = new BABYLON.DefaultRenderingPipeline(
    'defaultRenderingPipeline',
    true,
    scene,
    [roamingCamera],
  )
  renderPipeline.bloomEnabled = true
  renderPipeline.fxaaEnabled = true
  renderPipeline.bloomWeight = 0.4
  renderPipeline.imageProcessing.exposure = 1.1
  renderPipeline.imageProcessing.vignetteEnabled = true
  renderPipeline.imageProcessing.vignetteWeight = 2
  renderPipeline.imageProcessing.vignetteStretch = 1
  renderPipeline.imageProcessing.vignetteColor = new BABYLON.Color4(0, 0, 0, 0)
  renderPipeline.samples = 4

  scene.getEngine().hideLoadingUI()

  let patchPlane: BABYLON.Mesh | null = null
  if (typeof window !== 'undefined' && window.location.pathname === '/') {
    const patchWidth = 6
    const patchHeight = 1.8
    patchPlane = BABYLON.MeshBuilder.CreatePlane(
      'dlpTextPatch',
      { width: patchWidth, height: patchHeight },
      scene,
    )
    const texture = BABYLON_GUI.AdvancedDynamicTexture.CreateForMesh(
      patchPlane,
      1024,
      256,
      false,
    )

    const rect = new BABYLON_GUI.Rectangle()
    rect.width = 1
    rect.height = 1
    rect.thickness = 0
    rect.background = 'transparent'
    texture.addControl(rect)

    const stack = new BABYLON_GUI.StackPanel()
    stack.width = 1
    stack.height = 1
    stack.isVertical = true
    rect.addControl(stack)

    const titleLogo = new BABYLON_GUI.Image('titleLogo', '/img/logo-title.png')
    titleLogo.width = '50%'
    titleLogo.height = '75px'
    titleLogo.top = '-10px'
    titleLogo.stretch = BABYLON_GUI.Image.STRETCH_UNIFORM
    titleLogo.horizontalAlignment = BABYLON_GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    stack.addControl(titleLogo)

    patchPlane.position = new BABYLON.Vector3(0, 0.2, -1.6)
    patchPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_NONE
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('chat-starting', () => {
      if (patchPlane) patchPlane.setEnabled(false)
    })
  }

  const sceneIndexValid = Number.isInteger(
    Number(localStorage.getItem('dlp_scene_index')),
  )
  if (!sceneIndexValid) {
    Logger.error('Invalid scene index in local storage')
    return
  }
  const sceneIndex = parseInt(localStorage.getItem('dlp_scene_index') || '0')
  const isGreenBackground =
    HDRI_SCENES[sceneIndex].groundModel?.filename.includes('green')

  if (isGreenBackground === false) {
    // Create particle system
    const particleSystem = new BABYLON.ParticleSystem('particles', 300, scene)
    const particleTexture = new BABYLON.Texture(
      '/img/particle_circle.png.png',
      scene,
    )
    particleSystem.particleTexture = particleTexture
    const boxEmitter = particleSystem.createBoxEmitter(
      new BABYLON.Vector3(0, 1, 0),
      new BABYLON.Vector3(0, -1, 0),
      new BABYLON.Vector3(-5, -5, -5),
      new BABYLON.Vector3(5, 5, 5),
    )
    particleSystem.color1 = new BABYLON.Color4(1, 0.4, 0.4, 1)
    particleSystem.color2 = new BABYLON.Color4(0.4, 1, 0.6, 1)
    particleSystem.colorDead = new BABYLON.Color4(0.5, 0.5, 1, 1)
    particleSystem.minSize = 0.01
    particleSystem.maxSize = 0.05
    particleSystem.minLifeTime = 99999
    particleSystem.maxLifeTime = 99999
    particleSystem.emitRate = 0
    particleSystem.manualEmitCount = 150
    particleSystem.emitter = new BABYLON.Vector3(0, 0.5, 0)
    particleSystem.minEmitPower = -0.1
    particleSystem.maxEmitPower = 0.1
    particleSystem.updateSpeed = 0.01
    particleSystem.gravity = new BABYLON.Vector3(0, 0, 0)
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD
    particleSystem.start()
    // dynamically distributed within a sphere shell
    let time = 0
    scene.registerBeforeRender(() => {
      time += scene.getEngine().getDeltaTime() * 0.0001
      const minR = 0.5
      const maxR = 5
      for (let i = 0; i < particleSystem.particles.length; i++) {
        const p = particleSystem.particles[i]
        const r = Math.sqrt(
          p.position.x ** 2 + p.position.y ** 2 + p.position.z ** 2,
        )
        if (r < minR || r > maxR) {
          const theta = Math.random() * 2 * Math.PI
          const phi = Math.acos(2 * Math.random() - 1)
          const newR = minR + Math.random() * (maxR - minR)
          p.position.x = newR * Math.sin(phi) * Math.cos(theta)
          p.position.y = newR * Math.sin(phi) * Math.sin(theta)
          p.position.z = newR * Math.cos(phi)
        }
      }
    })
    particleSystem.direction1 = new BABYLON.Vector3(0, 1, 0)
    particleSystem.direction2 = new BABYLON.Vector3(0, -1, 0)
  }

  // Keyboard Input Listening
  let typedString = ''
  let lastKeyTime = 0
  const keyTimeout = 2000 // Reset typed string after 2 seconds of no input

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', event => {
      const currentTime = Date.now()

      // Reset typed string if too much time has passed
      if (currentTime - lastKeyTime > keyTimeout) {
        typedString = ''
      }

      lastKeyTime = currentTime

      // Only handle printable characters
      if (event.key.length === 1) {
        typedString += event.key.toLowerCase()

        // Check if 'log' was typed
        if (typedString.includes('log')) {
          Logger.flushLogs()
          typedString = ''
        }

        // Keep only the last 10 characters to prevent memory issues
        if (typedString.length > 10) {
          typedString = typedString.slice(-10)
        }
      }

      // Handle backspace
      if (event.key === 'Backspace') {
        typedString = typedString.slice(0, -1)
      }
    })
  }

  stateMachine.putConditionedMessage(
    new ConditionedMessage(Conditions.FRONTEND_READY, { message: 'Scene ready' }),
  )
}
