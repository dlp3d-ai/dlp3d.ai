import * as BABYLON from '@babylonjs/core'
import { GlobalState } from '@/library/babylonjs/core'
import {
  RuntimeAnimationGroup,
  RuntimeBufferType,
} from '@/library/babylonjs/runtime/animation'
import { DynamicBoneSolver } from '@/library/babylonjs/runtime/physics'
import { Logger } from '@/library/babylonjs/utils'
import {
  Relationship,
  RelationshipStage,
} from '@/library/babylonjs/runtime/character/relationship'
import { Emotion } from '@/library/babylonjs/runtime/character/emotions'

/**
 * Character
 *
 * A class for managing 3D character models, animations, and physics in Babylon.js scenes.
 * Handles loading, animation control, and disposal of character assets.
 */
export class Character {
  /**
   * Static counter for generating unique character names.
   */
  private static counter: number = 0

  /**
   * Unique name identifier for the character.
   */
  public readonly name: string

  /**
   * Observable triggered when the current animation is changed.
   */
  public readonly onCurrentAnimationChangedObservable: BABYLON.Observable<
    BABYLON.Nullable<BABYLON.AnimationGroup>
  >

  /**
   * Runtime animation group for managing character animations.
   */
  runtimeAnimationGroup: RuntimeAnimationGroup

  /**
   * Root mesh of the character model.
   */
  rootMesh: BABYLON.Mesh | null = null

  /**
   * Array of animation groups available for the character.
   */
  animationGroups: BABYLON.AnimationGroup[] = []

  /**
   * Array of all meshes belonging to the character.
   */
  meshes: BABYLON.AbstractMesh[] = []

  /**
   * Array of skeletons used by the character.
   */
  skeletons: BABYLON.Skeleton[] = []

  /**
   * Array of bones in the character's skeleton.
   */
  bones: BABYLON.Bone[] = []

  /**
   * Dynamic bone solver for physics simulation.
   */
  dynamicBoneSolver: DynamicBoneSolver | null = null

  /**
   * Global state reference for the character.
   */
  globalState: GlobalState

  /**
   * Currently active animation group.
   */
  currentAnimationGroup: BABYLON.AnimationGroup | null | undefined = null

  relationship: Relationship

  emotions: Emotion

  /**
   * Creates a new Character instance.
   *
   * @param globalState The global state reference for the character.
   * @param name Optional custom name for the character. If not provided, a default name will be generated.
   *
   * @throws {Error} if the provided name is already in use by another character.
   */
  constructor(globalState: GlobalState, name: string | undefined = undefined) {
    this.globalState = globalState
    if (name !== undefined) {
      const duplicatedName = this.globalState.characters.some(
        character => character.name === name,
      )
      if (duplicatedName) throw new Error('Duplicated character name')
      this.name = name
    } else {
      this.name = 'character_'.concat(Character.counter.toString()) // using the default name
    }
    Character.counter++
    this.onCurrentAnimationChangedObservable = new BABYLON.Observable<
      BABYLON.Nullable<BABYLON.AnimationGroup>
    >()

    this.runtimeAnimationGroup = new RuntimeAnimationGroup(globalState)

    this.relationship = {
      stage: RelationshipStage.Stranger,
      score: 0,
    }
    this.emotions = {
      emotions: [],
    }

    globalState.characters.push(this)
  }

  /**
   * Loads a GLB character model asynchronously.
   *
   * @param scene The Babylon.js scene to load the character into.
   * @param assetUrl URL path to the GLB file.
   * @param translation Position offset for the character. Defaults to (0, 0, 0).
   * @param rotationDegrees Rotation in degrees for the character. Defaults to (0, 0, 0).
   * @param scale Scale factor for the character. Defaults to (1, 1, 1).
   * @param motion_name Name of the animation to play by default. If null or undefined, uses the first animation.
   * @param constraintsUrl URL to the physics constraints file. Optional.
   * @param rigidBodiesUrl URL to the rigid bodies file. Optional.
   */
  async loadGLBAsync(
    scene: BABYLON.Scene,
    assetUrl: string,
    translation: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 0),
    rotationDegrees: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 0),
    scale: BABYLON.Vector3 = new BABYLON.Vector3(1, 1, 1),
    motion_name: string | undefined | null,
    constraintsUrl: string | undefined | null,
    rigidBodiesUrl: string | undefined | null,
  ) {
    const rootUrl = BABYLON.Tools.GetFolderPath(assetUrl)
    const fileName = BABYLON.Tools.GetFilename(assetUrl)
    try {
      const imported = await BABYLON.SceneLoader.ImportMeshAsync(
        '',
        rootUrl,
        fileName,
        scene,
        undefined,
        '.glb',
      )
      const parentMesh = new BABYLON.Mesh('parent', scene)
      const res = imported.meshes.find(mesh => {
        return mesh.name === '__root__'
      })

      if (res !== undefined) {
        this.rootMesh = res as BABYLON.Mesh

        this.rootMesh.scaling = scale
        this.rootMesh.position = translation
        this.rootMesh.rotation = new BABYLON.Vector3(
          BABYLON.Tools.ToRadians(rotationDegrees.x),
          BABYLON.Tools.ToRadians(rotationDegrees.y),
          BABYLON.Tools.ToRadians(rotationDegrees.z),
        )
        res.parent = parentMesh
      } else {
        Logger.error('root mesh not found')
      }

      imported.meshes.forEach(mesh => {
        mesh.metadata = { parentMesh: parentMesh }
        mesh.isPickable = false
        mesh.alwaysSelectAsActiveMesh = true
      })
      this.meshes = imported.meshes
      this.skeletons = imported.skeletons
      this.bones = imported.skeletons[0].bones
      this.rootMesh = parentMesh

      this.runtimeAnimationGroup.nonuniformScaling =
        (this.meshes.filter(mesh => mesh.skeleton === scene.skeletons[0])[0]
          ._worldMatrix?.m[0] || 1) * 100

      this.animationGroups = imported.animationGroups
      let animationGroup: BABYLON.AnimationGroup = imported.animationGroups[0]
      this.currentAnimationGroup = imported.animationGroups[0]
      if (motion_name !== undefined && motion_name !== null) {
        const res = imported.animationGroups.find((animationGroup, idx) => {
          return animationGroup.name === motion_name
        })
        if (res !== undefined) {
          animationGroup = res
        } else {
          Logger.warn(
            `motion ${motion_name} not found, using default motion: ${this.currentAnimationGroup.name}`,
          )
        }
      }
      if (this.currentAnimationGroup !== undefined) {
        this.currentAnimationGroup.play()
        this.currentAnimationGroup.pause()
        this.onCurrentAnimationChangedObservable.notifyObservers(
          this.currentAnimationGroup,
        )
      }
    } catch (error) {
      Logger.error(`Error importing mesh: ${error}`)
    }

    this.runtimeAnimationGroup.initialize(this.skeletons[0])

    try {
      if (constraintsUrl && rigidBodiesUrl) {
        this.dynamicBoneSolver = new DynamicBoneSolver(scene, this.bones)
        await this.dynamicBoneSolver.addConstraints(
          constraintsUrl,
          rigidBodiesUrl,
          scale,
        )
      }
    } catch (error) {
      Logger.error(`Error adding physics constraints: ${error}`)
    }
  }

  /**
   * Animates the character using LBS (Linear Blend Skinning) forward.
   *
   * @param jointFrameIndexLocal The frame index for local joint animation.
   * @param jointFrameIndexStreamed The frame index for streamed joint animation.
   * @param streamedJointBlendWeight Weight for blending between local and streamed joint animations.
   * @param morphTargetFrameIndexLocal The frame index for local morph target animation.
   * @param morphTargetFrameIndexStreamed The frame index for streamed morph target animation.
   * @param streamedMorphTargetBlendWeight Weight for blending between local and streamed morph target animations.
   * @param target The target buffer type for the animation data.
   */
  public animate(
    jointFrameIndexLocal: number,
    jointFrameIndexStreamed: number,
    streamedJointBlendWeight: number,
    morphTargetFrameIndexLocal: number,
    morphTargetFrameIndexStreamed: number,
    streamedMorphTargetBlendWeight: number,
    target: RuntimeBufferType,
  ): void {
    this.runtimeAnimationGroup.goToFrame(
      Math.max(0, Math.trunc(jointFrameIndexLocal)),
      Math.max(0, Math.trunc(jointFrameIndexStreamed)),
      streamedJointBlendWeight,
      Math.max(0, Math.trunc(morphTargetFrameIndexLocal)),
      Math.max(0, Math.trunc(morphTargetFrameIndexStreamed)),
      streamedMorphTargetBlendWeight,
      target,
    )
  }

  /**
   * Animates the character using imported animation groups.
   *
   * @param frameTime The frame time to set the animation to.
   */
  public animateUsingImported(frameTime: number): void {
    if (!this.currentAnimationGroup) return

    this.currentAnimationGroup.goToFrame(frameTime)
  }

  /**
   * Disposes of the character and all its resources.
   * Cleans up meshes, animations, skeletons, and observables.
   */
  dispose() {
    this.onCurrentAnimationChangedObservable.clear()

    this.rootMesh?.dispose(false, true)
    this.animationGroups.forEach(animationGroup => {
      animationGroup.dispose()
    })
    this.skeletons.forEach(skeleton => {
      skeleton.dispose()
    })
  }
}
