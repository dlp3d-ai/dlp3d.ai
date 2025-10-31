'use client'

import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react'
import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  EquiRectangularCubeTexture,
  SceneLoader,
  AbstractMesh,
  Color4,
  DefaultRenderingPipeline,
  Tools,
  ParticleSystem,
  Texture,
  Mesh,
  ShadowGenerator,
  TransformNode,
  AnimationGroup,
} from '@babylonjs/core'
import { GLTFFileLoader } from '@babylonjs/loaders'
import '@babylonjs/loaders/glTF'
import {
  AdvancedDynamicTexture,
  TextBlock,
  Rectangle,
  Control,
  StackPanel,
  Image,
} from '@babylonjs/gui'
import {
  loadGroundMesh,
  loadGroundMeshWithPreset,
  loadGroundMeshForHDR,
} from '../../library/babylonjs/utils/loadMesh'
import { LoadingProgressManager } from '../../utils/progressManager'
import { HDRI_SCENES } from '@/library/babylonjs/config/scene'
/**
 * Props interface for the BabylonViewer component.
 */
interface BabylonViewerProps {
  /** Width of the viewer canvas, defaults to '600px' */
  width?: string
  /** Height of the viewer canvas, defaults to '400px' */
  height?: string
  /** Additional CSS class name for styling */
  className?: string
  /** sceneName for scenes, defaults to 'Vast' */
  sceneName?: string
  /** Index of the selected character model, defaults to 0 */
  selectedCharacter?: number
  /** Key to trigger character change, defaults to 0 */
  characterChangeKey?: number
  /** Callback function called when character is loaded */
  onCharacterLoaded?: () => void
  /** Callback function called when scene is loaded */
  onSceneLoaded?: () => void
}

/**
 * Reference interface for BabylonViewer component methods.
 */
export interface BabylonViewerRef {
  /** Rotate the camera left by a small angle */
  rotateLeft: () => void
  /** Rotate the camera right by a small angle */
  rotateRight: () => void
  /** Take a screenshot of the current scene and return as base64 string */
  takeScreenshot: () => Promise<string>
  /** Get the current camera state including position and rotation */
  getCameraState: () => {
    alpha: number
    beta: number
    radius: number
    target: { x: number; y: number; z: number }
  } | null
}

/**
 * BabylonViewer Component
 *
 * A React component that renders a 3D scene using Babylon.js with character models,
 * HDRI environment lighting, particle effects, and interactive camera controls.
 * Supports character switching, screenshot capture, and real-time 3D rendering.
 */
const BabylonViewer = forwardRef<BabylonViewerRef, BabylonViewerProps>(
  (
    {
      width = '600px',
      height = '400px',
      className = '',
      sceneName = 'Vast',
      selectedCharacter = 0,
      characterChangeKey = 0,
      onCharacterLoaded,
      onSceneLoaded,
    },
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const engineRef = useRef<Engine | null>(null)
    const sceneRef = useRef<Scene | null>(null)
    const hdrTextureRef = useRef<EquiRectangularCubeTexture | null>(null)
    const characterMeshRef = useRef<AbstractMesh[] | null>(null)
    const cameraRef = useRef<ArcRotateCamera | null>(null)
    const particleSystemRef = useRef<ParticleSystem | null>(null)
    const dlpPatchRef = useRef<Mesh | null>(null)
    const shadowGeneratorRef = useRef<ShadowGenerator | null>(null)
    const currentGroundMeshRef = useRef<Mesh | null>(null)
    const characterRootRef = useRef<TransformNode | null>(null)
    const lastAnimationGroupsRef = useRef<AnimationGroup[] | null>(null)
    const loadVersionRef = useRef<number>(0)

    /**
     * Expose camera rotation methods and other utilities to parent components.
     */
    useImperativeHandle(ref, () => ({
      rotateLeft: () => {
        if (cameraRef.current) {
          cameraRef.current.alpha += Math.PI / 360 // Rotate 1 degree left
        }
      },
      rotateRight: () => {
        if (cameraRef.current) {
          cameraRef.current.alpha -= Math.PI / 360 // Rotate 1 degree right
        }
      },
      /**
       * Take a screenshot of the current scene.
       *
       * @returns Promise that resolves to base64 encoded image data
       * @throws {Error} if engine, scene, or camera is not available
       */
      takeScreenshot: async (): Promise<string> => {
        return new Promise((resolve, reject) => {
          if (
            !engineRef.current ||
            !sceneRef.current ||
            !sceneRef.current.activeCamera
          ) {
            reject(new Error('Engine, scene, or camera not available'))
            return
          }
          try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { Tools } = require('@babylonjs/core')
            Tools.CreateScreenshot(
              engineRef.current,
              sceneRef.current.activeCamera!,
              {
                width: engineRef.current.getRenderWidth(),
                height: engineRef.current.getRenderHeight(),
              },
              (data: string) => {
                // Return raw base64 data
                resolve(data)
              },
            )
          } catch (error) {
            reject(error)
          }
        })
      },
      /**
       * Get the current camera state including rotation and position.
       *
       * @returns Camera state object with alpha, beta, radius, and target coordinates, or null if camera not available
       */
      getCameraState: () => {
        if (!cameraRef.current) return null
        return {
          alpha: cameraRef.current.alpha,
          beta: cameraRef.current.beta,
          radius: cameraRef.current.radius,
          target: {
            x: cameraRef.current.target.x,
            y: cameraRef.current.target.y,
            z: cameraRef.current.target.z,
          },
        }
      },
    }))

    /**
     * Add GUI text patch with logo (only displayed on homepage).
     *
     * @param scene The Babylon.js scene to add the patch to
     */
    const addDlpTextPatch = useCallback((scene: Scene) => {
      if (dlpPatchRef.current) return // Only create once
      if (typeof window !== 'undefined' && window.location.pathname !== '/') return // Only show on homepage
      const patchWidth = 10
      const patchHeight = 3.0
      const patchPlane = MeshBuilder.CreatePlane(
        'dlpTextPatch',
        { width: patchWidth, height: patchHeight },
        scene,
      )
      const texture = AdvancedDynamicTexture.CreateForMesh(
        patchPlane,
        2048,
        512,
        false,
      )
      // Background
      const rect = new Rectangle()
      rect.width = 1
      rect.height = 1
      rect.thickness = 0
      rect.background = 'transparent'
      texture.addControl(rect)
      // Vertical layout
      const stack = new StackPanel()
      stack.width = 1
      stack.height = 1
      stack.isVertical = true
      rect.addControl(stack)

      // Title logo image with enhanced glow effect
      const titleLogo = new Image('titleLogo', '/img/logo-title.png')
      titleLogo.width = '65%'
      titleLogo.height = '100px'
      titleLogo.top = '-10px'
      titleLogo.stretch = Image.STRETCH_UNIFORM
      titleLogo.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER

      // Add glow effect to the image
      titleLogo.shadowBlur = 8
      titleLogo.shadowColor = 'rgba(138, 43, 226, 0.8)' // Purple glow
      titleLogo.shadowOffsetX = 0
      titleLogo.shadowOffsetY = 0

      stack.addControl(titleLogo)

      // Position in scene space
      patchPlane.position = new Vector3(0, -0.4, -1.6) // Slightly raised position
      patchPlane.billboardMode = Mesh.BILLBOARDMODE_NONE
      dlpPatchRef.current = patchPlane

      // Add rainbow gradient animation effect
      let time = 0
      scene.registerBeforeRender(() => {
        time += scene.getEngine().getDeltaTime() * 0.001

        // Rainbow gradient colors
        const hue = (time * 30) % 360 // 30 degrees per second hue change
        const rainbowGlow = `hsla(${hue}, 80%, 70%, 0.8)`

        // Update image glow color, maintain maximum glow intensity
        titleLogo.shadowBlur = 10 // Maintain maximum glow intensity
        titleLogo.shadowColor = rainbowGlow
      })
    }, [])

    /**
     * Load a character model by index with animation and effects.
     *
     * @param characterIndex The index of the character to load (0-3)
     */
    const loadCharacter = useCallback(
      async (characterIndex: number) => {
        if (!sceneRef.current) return

        try {
          // Increment version to invalidate any in-flight loads
          const myVersion = ++loadVersionRef.current

          // Stop and dispose previous animation groups
          if (lastAnimationGroupsRef.current) {
            lastAnimationGroupsRef.current.forEach(g => {
              try {
                g.stop()
              } catch (_) {}
              try {
                g.dispose()
              } catch (_) {}
            })
            lastAnimationGroupsRef.current = null
          }

          // Remove previous meshes from shadow generator
          if (shadowGeneratorRef.current && characterMeshRef.current) {
            characterMeshRef.current.forEach(m => {
              try {
                if (m && m instanceof Mesh) {
                  shadowGeneratorRef.current!.removeShadowCaster(m, true)
                }
              } catch (_) {}
            })
          }

          // Dispose previous character root (disposes all child meshes)
          if (characterRootRef.current) {
            try {
              characterRootRef.current.dispose()
            } catch (_) {}
            characterRootRef.current = null
          }
          characterMeshRef.current = null

          const character_index_file_name_mapping: { [key: number]: string } = {
            0: 'Ani-default_225.glb',
            1: 'KQ-default_181.glb',
            2: 'HT-default_215.glb',
            3: 'FNN-default_297.glb',
          }

          const characterFile = character_index_file_name_mapping[characterIndex]

          const result = await SceneLoader.ImportMeshAsync(
            '',
            '/characters/',
            characterFile,
            sceneRef.current,
          )

          // Stale check: if a newer load started, discard this result
          if (myVersion !== loadVersionRef.current) {
            try {
              result.animationGroups?.forEach(g => {
                try {
                  g.stop()
                } catch (_) {}
                try {
                  g.dispose()
                } catch (_) {}
              })
              result.meshes?.forEach(m => {
                try {
                  m.dispose()
                } catch (_) {}
              })
            } catch (_) {}
            return
          }

          if (result.meshes.length > 0) {
            // Create a dedicated root for the character to simplify cleanup
            const root = new TransformNode('characterRoot', sceneRef.current!)
            result.meshes.forEach(m => {
              if (m && m.parent == null) m.parent = root
            })
            characterRootRef.current = root
            characterMeshRef.current = result.meshes
            // Position and scale the character - aligned with babylon page settings
            const rootMesh = result.meshes[0]
            if (rootMesh) {
              rootMesh.position = Vector3.Zero()
              rootMesh.scaling = new Vector3(0.8, 0.8, 0.8) // Reduced from 1,1,1 to avoid UI overlap

              // Apply rotation to match camera initial angle (0 degrees)
              rootMesh.rotation = new Vector3(0, Tools.ToRadians(0), 0) // Y-axis rotation 0 degrees
              // Immediately refresh bounding info after transformation
              if (rootMesh instanceof Mesh) {
                rootMesh.refreshBoundingInfo()
              }
              // Apply to all child meshes too
              result.meshes.forEach(mesh => {
                if (mesh instanceof Mesh && mesh !== rootMesh) {
                  mesh.refreshBoundingInfo()
                }
              })
              rootMesh.position.y = 0 // Keep at ground level like babylon page
            }

            // Enable animation playback for GLB files with embedded animations
            if (result.animationGroups.length > 0) {
              const animationGroup = result.animationGroups[0]
              // Store the original end frame before modifying the animation group
              const originalEndFrame = animationGroup.to
              // Middle frame is the frame number of last int in file name
              const middleFrame = parseInt(
                character_index_file_name_mapping[characterIndex].split('_')[1],
              )
              // First play the entrance animation (first half frames) once
              animationGroup.play(false) // Play without loop
              animationGroup.setWeightForAllAnimatables(1.0)

              // Set the frame range for entrance animation
              animationGroup.to = middleFrame

              // Listen for the entrance animation to end
              const onEntranceAnimationEnd = () => {
                // Clean up the event listener
                animationGroup.onAnimationGroupEndObservable.removeCallback(
                  onEntranceAnimationEnd,
                )

                // Now play the loop animation (second half frames) continuously
                animationGroup.from = middleFrame
                // Special case for character4_367.glb: loop from 367 to 391 instead of to the end
                const loopEndFrame = characterIndex === 3 ? 391 : originalEndFrame
                animationGroup.to = loopEndFrame
                animationGroup.play(true) // Play with loop
              }

              // Add event listener for entrance animation end
              animationGroup.onAnimationGroupEndObservable.add(
                onEntranceAnimationEnd,
              )
              // remember for future cleanup
              lastAnimationGroupsRef.current = result.animationGroups
            }

            // Set all loaded meshes to cast shadows
            if (shadowGeneratorRef.current) {
              result.meshes.forEach(mesh => {
                if (mesh && mesh.receiveShadows !== undefined)
                  mesh.receiveShadows = false
                if (mesh && mesh instanceof Mesh) {
                  shadowGeneratorRef.current!.addShadowCaster(mesh, true)
                }
              })
            }

            // Add self-illumination effect to all character meshes
            result.meshes.forEach(mesh => {
              if (mesh.material) {
                const material = mesh.material as StandardMaterial

                // Store original emissive color (or create default if none exists)
                const originalEmissive = material.emissiveColor
                  ? material.emissiveColor.clone()
                  : new Color3(0, 0, 0)

                // Set bright self-illumination - synchronized with particle effects
                material.emissiveColor = new Color3(0.8, 0.9, 1.0) // Bright blue-white glow

                // Gradually fade back to normal over 0.8 seconds to match particle duration
                let time = 0
                const fadeOut = () => {
                  time += sceneRef.current!.getEngine().getDeltaTime() * 0.001 // Convert to seconds
                  const fadeProgress = Math.min(time / 0.8, 1.0) // 0.8 second fade to match particles

                  if (fadeProgress >= 1.0) {
                    // Restore original emissive
                    material.emissiveColor = originalEmissive
                    sceneRef.current!.unregisterBeforeRender(fadeOut)
                  } else {
                    // Interpolate between glow and original
                    const currentEmissive = Color3.Lerp(
                      new Color3(0.8, 0.9, 1.0),
                      originalEmissive,
                      fadeProgress,
                    )
                    material.emissiveColor = currentEmissive
                  }
                }

                sceneRef.current!.registerBeforeRender(fadeOut)
              }
            })
            // Disable back face culling for all loaded meshes to ensure both sides are rendered
            result.meshes.forEach(mesh => {
              mesh.alwaysSelectAsActiveMesh = true
              if (mesh.material && mesh.material.backFaceCulling !== undefined) {
                mesh.material.backFaceCulling = false
              }
            })
            if (onCharacterLoaded) onCharacterLoaded()
          }
        } catch (error) {
          console.error('Error loading character:', error)

          // Fallback: create a simple placeholder
          const placeholder = MeshBuilder.CreateBox(
            'placeholder',
            { size: 2 },
            sceneRef.current,
          )
          const material = new StandardMaterial(
            'placeholderMaterial',
            sceneRef.current,
          )
          material.diffuseColor = new Color3(0.5, 0.5, 0.8)
          placeholder.material = material

          characterMeshRef.current = [placeholder]
        }
      },
      [onCharacterLoaded],
    )

    /**
     * Spawn particle light effects when switching characters - synchronized with glow effects.
     */
    const spawnCharacterSwitchEffect = useCallback(() => {
      const scene = sceneRef.current
      if (!scene) return

      // Emit main glow particles (circular) - matching character glow effect colors
      const bodyGlowSystemCircle = new ParticleSystem(
        'bodyGlowEffectCircle',
        100,
        scene,
      )
      bodyGlowSystemCircle.particleTexture = new Texture(
        '/img/particle_circle.png.png',
        scene,
      )
      bodyGlowSystemCircle.emitter = new Vector3(0, 0.8, 0) // Character center
      bodyGlowSystemCircle.minSize = 0.02
      bodyGlowSystemCircle.maxSize = 0.05
      bodyGlowSystemCircle.manualEmitCount = 100
      bodyGlowSystemCircle.color1 = new Color4(0.8, 0.9, 1.0, 0.8) // Blue-white matching glow effect
      bodyGlowSystemCircle.color2 = new Color4(1, 1, 1, 0.6) // White
      bodyGlowSystemCircle.minLifeTime = 0.4
      bodyGlowSystemCircle.maxLifeTime = 0.8
      bodyGlowSystemCircle.emitRate = 120
      bodyGlowSystemCircle.blendMode = ParticleSystem.BLENDMODE_ADD
      bodyGlowSystemCircle.addColorGradient(0, new Color4(1, 1, 1, 0))
      bodyGlowSystemCircle.addColorGradient(0.2, new Color4(0.8, 0.9, 1.0, 0.8))
      bodyGlowSystemCircle.addColorGradient(0.6, new Color4(1, 1, 1, 0.6))
      bodyGlowSystemCircle.addColorGradient(1, new Color4(1, 1, 1, 0))
      bodyGlowSystemCircle.direction1 = new Vector3(0, 1, 0) // Upward
      bodyGlowSystemCircle.direction2 = new Vector3(0, 1, 0) // Also upward
      bodyGlowSystemCircle.minEmitPower = 0.15
      bodyGlowSystemCircle.maxEmitPower = 0.4
      bodyGlowSystemCircle.start()

      // Add surrounding particle effects
      const ringParticleSystem = new ParticleSystem('ringParticleEffect', 50, scene)
      ringParticleSystem.particleTexture = new Texture(
        '/img/particle_circle.png.png',
        scene,
      )
      ringParticleSystem.emitter = new Vector3(0, 0.8, 0) // Character center
      ringParticleSystem.minSize = 0.01
      ringParticleSystem.maxSize = 0.03
      ringParticleSystem.manualEmitCount = 50
      ringParticleSystem.color1 = new Color4(0.6, 0.8, 1.0, 0.6) // Light blue
      ringParticleSystem.color2 = new Color4(1, 1, 1, 0.4) // White
      ringParticleSystem.minLifeTime = 0.6
      ringParticleSystem.maxLifeTime = 1.0
      ringParticleSystem.emitRate = 80
      ringParticleSystem.blendMode = ParticleSystem.BLENDMODE_ADD
      ringParticleSystem.addColorGradient(0, new Color4(1, 1, 1, 0))
      ringParticleSystem.addColorGradient(0.3, new Color4(0.6, 0.8, 1.0, 0.6))
      ringParticleSystem.addColorGradient(0.7, new Color4(1, 1, 1, 0.4))
      ringParticleSystem.addColorGradient(1, new Color4(1, 1, 1, 0))
      // Surrounding direction
      ringParticleSystem.direction1 = new Vector3(1, 0, 0) // Horizontal direction
      ringParticleSystem.direction2 = new Vector3(-1, 0, 0) // Reverse direction
      ringParticleSystem.minEmitPower = 0.1
      ringParticleSystem.maxEmitPower = 0.3
      ringParticleSystem.start()

      // Duration synchronized with glow effects
      setTimeout(() => {
        bodyGlowSystemCircle.stop()
        bodyGlowSystemCircle.dispose()
        ringParticleSystem.stop()
        ringParticleSystem.dispose()
      }, 800)
    }, [])

    /**
     * Listen for chat-starting event to hide homepage 3D title and ribbon.
     */
    useEffect(() => {
      const handler = () => {
        if (dlpPatchRef.current) dlpPatchRef.current.setEnabled(false)
      }
      window.addEventListener('chat-starting', handler)
      return () => window.removeEventListener('chat-starting', handler)
    }, [])

    /**
     * Listen for chat-screenshot-done event to show homepage 3D title and ribbon.
     */
    useEffect(() => {
      const handler = () => {
        if (dlpPatchRef.current) dlpPatchRef.current.setEnabled(true)
      }
      window.addEventListener('chat-screenshot-done', handler)
      return () => window.removeEventListener('chat-screenshot-done', handler)
    }, [])

    /**
     * Initialize the Babylon.js scene with camera, lighting, and effects.
     */
    useEffect(() => {
      if (!canvasRef.current) return

      // Initialize LoadingProgressManager
      LoadingProgressManager.getInstance().reset()

      // Initialize Babylon.js engine if it doesn't exist
      if (!engineRef.current) {
        engineRef.current = new Engine(canvasRef.current, true)
        engineRef.current.hideLoadingUI() // Immediately hide Babylon default loading UI
      }
      const engine = engineRef.current

      // Create scene if it doesn't exist
      if (!sceneRef.current) {
        const scene = new Scene(engine)
        sceneRef.current = scene

        // Update scene coordinate system to match babylon page
        scene.useRightHandedSystem = true

        // Configure GLTFFileLoader for consistency
        SceneLoader.OnPluginActivatedObservable.add(function (plugin) {
          if (plugin.name === 'gltf' && plugin instanceof GLTFFileLoader)
            plugin.targetFps = 30
        })

        // Create camera - initial angle set to 90 degrees
        const camera = new ArcRotateCamera(
          'camera',
          Tools.ToRadians(90), // alpha: initial angle set to 90 degrees
          Tools.ToRadians(85), // beta: keep 85 degrees
          2.7, // radius: keep 2.7
          new Vector3(0, 0.8, 0), // target: keep target point
          scene,
        )
        // Disable keyboard control to match chat interface
        camera.inputs.remove(camera.inputs.attached.keyboard)

        // Set camera as active camera for the scene
        scene.activeCamera = camera

        // Attach camera controls to canvas
        camera.attachControl(canvasRef.current, true)
        camera.setTarget(new Vector3(0, 0.8, 0))
        camera.fov = Tools.ToRadians(45) // match babylon page FOV
        camera.panningSensibility = 2000
        camera.maxZ = 999
        camera.minZ = 0
        camera.wheelPrecision = 200 // Higher value = smaller zoom steps
        camera.lowerRadiusLimit = 0.8 // Minimum distance - prevent getting too close
        camera.upperRadiusLimit = 5.0 // Maximum distance - prevent getting too far
        camera.useBouncingBehavior = false // Disable bouncing - camera will stop at limits
        // Lock vertical rotation to current angle - only allow horizontal rotation
        camera.upperBetaLimit = Tools.ToRadians(85)
        camera.lowerBetaLimit = Tools.ToRadians(85)

        // Add keyboard control keys to match chat interface
        camera.keysUp.push(87) // W key
        camera.keysDown.push(83) // S key
        camera.keysLeft.push(65) // A key
        camera.keysRight.push(68) // D key

        // Ensure camera controls are properly initialized
        camera.inertia = 0.9
        camera.angularSensibilityX = 1000
        camera.angularSensibilityY = 1000
        cameraRef.current = camera

        // Replace lighting with dual hemispheric lights matching babylon page
        // Primary light
        const primaryLight = new HemisphericLight(
          'hemiLight',
          new Vector3(0, 1, 0),
          scene,
        )
        primaryLight.intensity = 0.6
        primaryLight.specular = new Color3(0, 0, 0)
        primaryLight.groundColor = new Color3(1, 1, 1)

        // Secondary light (matches onSceneReady.ts)
        const secondaryLight = new HemisphericLight(
          'HemisphericLight',
          new Vector3(0, 1, 0),
          scene,
        )
        secondaryLight.intensity = 0.3
        secondaryLight.specular = new Color3(0, 0, 0)
        secondaryLight.groundColor = new Color3(1, 1, 1)

        // Create particle effects - adjusted for closer camera view
        const createParticleEffect = () => {
          if (!sceneRef.current) return

          // Create particle system
          const particleSystem = new ParticleSystem(
            'particles',
            300,
            sceneRef.current,
          )

          // Create a simple white dot texture for particles
          const particleTexture = new Texture(
            '/img/particle_circle.png.png',
            sceneRef.current,
          )
          particleSystem.particleTexture = particleTexture

          // Create directed sphere emitter as suggested
          const boxEmitter = particleSystem.createBoxEmitter(
            new Vector3(0, 1, 0), // direction1: upward
            new Vector3(0, -1, 0), // direction2: downward
            new Vector3(-5, -5, -5), // minEmitBox
            new Vector3(5, 5, 5), // maxEmitBox
          )

          // Set beautiful colors
          particleSystem.color1 = new Color4(1, 0.4, 0.4, 1) // Red
          particleSystem.color2 = new Color4(0.4, 1, 0.6, 1) // Green
          particleSystem.colorDead = new Color4(0.5, 0.5, 1, 1) // Blue-purple

          // Size settings - adjusted for closer camera
          particleSystem.minSize = 0.01 // Reduced from 0.02
          particleSystem.maxSize = 0.05 // Reduced from 0.1

          // Life time
          particleSystem.minLifeTime = 99999
          particleSystem.maxLifeTime = 99999

          // Emission rate
          particleSystem.emitRate = 0

          // Generate only once with fixed number of particles
          particleSystem.manualEmitCount = 150 // Fixed particle count, reduced quantity

          // Set emitter position slightly above ground - adjusted for closer camera
          particleSystem.emitter = new Vector3(0, 0.5, 0) // Lowered from y=1 to y=0.5

          // Speed
          particleSystem.minEmitPower = -0.1
          particleSystem.maxEmitPower = 0.1
          particleSystem.updateSpeed = 0.01

          // Gravity for natural falling effect
          particleSystem.gravity = new Vector3(0, 0, 0)

          // Blend mode for normal alpha blending
          particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD

          // Start the particle system
          particleSystem.start()

          particleSystemRef.current = particleSystem

          // Add some animation to make it more dynamic - adjusted for closer view
          let time = 0
          sceneRef.current.registerBeforeRender(() => {
            if (!sceneRef.current) return
            time += sceneRef.current.getEngine().getDeltaTime() * 0.0001
            // Particles only distributed within 0.5~5m spherical shell
            if (particleSystemRef.current) {
              const minR = 0.5
              const maxR = 5
              for (let i = 0; i < particleSystemRef.current.particles.length; i++) {
                const p = particleSystemRef.current.particles[i]
                const r = Math.sqrt(
                  p.position.x ** 2 + p.position.y ** 2 + p.position.z ** 2,
                )
                if (r < minR || r > maxR) {
                  // Re-randomize a valid spherical shell position
                  const theta = Math.random() * 2 * Math.PI
                  const phi = Math.acos(2 * Math.random() - 1)
                  const newR = minR + Math.random() * (maxR - minR)
                  p.position.x = newR * Math.sin(phi) * Math.cos(theta)
                  p.position.y = newR * Math.sin(phi) * Math.sin(theta)
                  p.position.z = newR * Math.cos(phi)
                }
              }
            }
          })
          particleSystem.direction1 = new Vector3(0, 1, 0)
          particleSystem.direction2 = new Vector3(0, -1, 0)
        }
        createParticleEffect()

        // Add rendering pipeline for professional graphics
        const renderPipeline = new DefaultRenderingPipeline(
          'defaultRenderingPipeline',
          true,
          scene,
          [camera],
        )
        renderPipeline.bloomEnabled = true
        renderPipeline.fxaaEnabled = true
        renderPipeline.bloomWeight = 0.4
        renderPipeline.imageProcessing.exposure = 1.1
        renderPipeline.imageProcessing.vignetteEnabled = true
        renderPipeline.imageProcessing.vignetteWeight = 2
        renderPipeline.imageProcessing.vignetteStretch = 1
        renderPipeline.imageProcessing.vignetteColor = new Color4(0, 0, 0, 0)
        renderPipeline.samples = 4

        // Create patch only once during initialization
        addDlpTextPatch(scene)

        // Render loop
        engine.runRenderLoop(() => {
          scene.render()
        })

        // Handle resize
        const handleResize = () => {
          engine.resize()
        }
        window.addEventListener('resize', handleResize)

        // Store cleanup function
        const cleanup = () => {
          window.removeEventListener('resize', handleResize)
          if (characterMeshRef.current) {
            characterMeshRef.current.forEach(mesh => mesh.dispose())
          }
          if (particleSystemRef.current) {
            particleSystemRef.current.dispose()
          }
          // Reset LoadingProgressManager
          LoadingProgressManager.getInstance().reset()
          scene.dispose()
          engine.dispose()
        }
        ;(scene as any).customCleanup = cleanup
      }
    }, [])

    /**
     * Handle HDRI texture changes and ground mesh loading.
     */
    useEffect(() => {
      let canceled = false
      if (sceneRef.current && sceneName) {
        // Update HDR texture
        if (hdrTextureRef.current) {
          hdrTextureRef.current.dispose()
        }
        const sceneConfig = HDRI_SCENES.find(scene => scene.name === sceneName)!
        const image = `/img/hdr/${sceneConfig.hdri}`

        const newHdrTexture = new EquiRectangularCubeTexture(
          image,
          sceneRef.current,
          1024,
        )
        sceneRef.current.environmentTexture = newHdrTexture

        // Set environment intensity to brighter level for better visibility
        sceneRef.current.environmentIntensity = 0.9

        // Dispose existing skybox if it exists
        const oldSkybox = sceneRef.current.getMeshByName('skyBox')
        if (oldSkybox) {
          oldSkybox.dispose()
        }
        const skybox = sceneRef.current.createDefaultSkybox(
          newHdrTexture,
          true,
          1000,
          0.8,
        )

        // Rotate skybox 15 degrees counterclockwise to rotate HDR environment
        if (skybox) {
          skybox.rotate(new Vector3(0, 1, 0), Tools.ToRadians(15))
        }
        hdrTextureRef.current = newHdrTexture

        // Dispose existing ground mesh (supports both array and single mesh)
        if (currentGroundMeshRef.current) {
          console.log(
            'Disposing current ground mesh ref:',
            currentGroundMeshRef.current.name,
          )
          if (Array.isArray(currentGroundMeshRef.current)) {
            currentGroundMeshRef.current.forEach(mesh => mesh.dispose())
          } else {
            currentGroundMeshRef.current.dispose()
          }
          currentGroundMeshRef.current = null
        }

        // Clean up all possible ground-related models
        const groundMeshes = sceneRef.current.getMeshesByTags('ground')
        groundMeshes.forEach(mesh => {
          mesh.dispose()
        })

        // Clean up all meshes named ground or containing ground
        const allMeshes = [...sceneRef.current.meshes] // Create copy to avoid modifying array during iteration
        allMeshes.forEach(mesh => {
          if (
            mesh.name.toLowerCase().includes('ground') ||
            mesh.name.toLowerCase().includes('platform') ||
            mesh.name.toLowerCase().includes('floor') ||
            mesh.name.toLowerCase().includes('groundparent')
          ) {
            console.log('Disposing mesh by name:', mesh.name)
            mesh.dispose()
          }
        })

        // Force clean up all meshes in scene to ensure no residue
        const remainingMeshes = [...sceneRef.current.meshes] // Create copy again
        remainingMeshes.forEach(mesh => {
          if (
            mesh.metadata &&
            mesh.metadata.parentMesh &&
            mesh.metadata.parentMesh.name.toLowerCase().includes('ground')
          ) {
            console.log(
              'Disposing mesh by parent:',
              mesh.name,
              'parent:',
              mesh.metadata.parentMesh.name,
            )
            mesh.dispose()
          }
        })

        // Load corresponding ground model and await full scene readiness before signaling loaded
        const run = async () => {
          try {
            const sceneConfig = HDRI_SCENES.find(scene => scene.name === sceneName)!
            const meshes = await loadGroundMeshForHDR(
              sceneRef.current!,
              sceneConfig.groundModel!.filename,
              sceneConfig.groundModel!.translation,
              sceneConfig.groundModel!.rotation,
              sceneConfig.groundModel!.scale,
              true,
            )
            // Only save the first Mesh type mesh
            if (meshes && meshes.length > 0) {
              const mesh = meshes.find(m => m instanceof Mesh)
              if (mesh) currentGroundMeshRef.current = mesh as Mesh
            }
          } catch (error) {
            console.warn(
              `Failed to load ground model for ${sceneName}, nothing will be shown:`,
              error,
            )
            // No longer create fallback platform box
            currentGroundMeshRef.current = null
          }

          // Await entire scene readiness (HDR, skybox, materials, textures)
          try {
            await sceneRef.current!.whenReadyAsync()
          } catch (_) {
            // ignore
          }

          // Small 2-frame delay to avoid flicker
          await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
          await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

          if (!canceled) {
            onSceneLoaded?.()
          }
        }

        run()
      }
      return () => {
        canceled = true
      }
    }, [
      sceneName,
      HDRI_SCENES,
      loadGroundMeshForHDR,
      currentGroundMeshRef,
      onSceneLoaded,
      onCharacterLoaded,
    ])

    /**
     * Handle character selection changes with synchronized loading and effects.
     */
    useEffect(() => {
      if (sceneRef.current) {
        // Simultaneously trigger character loading and particle effects to ensure complete synchronization
        const loadAndEffect = async () => {
          // console.log('Loading character:', selectedCharacter)
          await loadCharacter(selectedCharacter)
          // Slight delay to ensure character loading is complete before triggering particle effects
          setTimeout(() => {
            spawnCharacterSwitchEffect()
          }, 50)
        }
        loadAndEffect()
      }
    }, [
      selectedCharacter,
      characterChangeKey,
      loadCharacter,
      spawnCharacterSwitchEffect,
    ])

    /**
     * Cleanup on component unmount.
     */
    useEffect(() => {
      const engine = engineRef.current
      return () => {
        if (sceneRef.current) {
          if ((sceneRef.current as any).customCleanup) {
            ;(sceneRef.current as any).customCleanup()
          } else {
            sceneRef.current.dispose()
          }
        }
        if (engine) {
          engine.dispose()
        }
      }
    }, [])

    return (
      <div className={`babylon-viewer ${className}`} style={{ width, height }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            outline: 'none',
          }}
        />
      </div>
    )
  },
)

BabylonViewer.displayName = 'BabylonViewer'

export default BabylonViewer
