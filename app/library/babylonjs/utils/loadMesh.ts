import * as BABYLON from '@babylonjs/core'

/**
 * Load a ground model (GLB) and return its meshes, grouped under a parent mesh.
 * The function tags the parent and child meshes with `ground`, applies transform
 * and optionally enables shadow receiving for child meshes.
 *
 * @param scene The Babylon.js scene to load the mesh into.
 * @param rootUrl Base URL path where ground models are hosted. Default: '/models/ground/'.
 * @param filename The model filename to load. Default: 'ground.glb'.
 * @param translation World-space position to place the parent mesh. Default: BABYLON.Vector3(0, 0, 0).
 * @param rotationDegrees Euler rotation in degrees applied to the parent mesh. Default: BABYLON.Vector3(0, 0, 0).
 * @param scale Scaling applied to the parent mesh. Default: BABYLON.Vector3(1, 1, 1).
 * @param receiveShadows Whether child meshes should receive shadows. Default: true.
 *
 * @returns Promise that resolves to the array of imported meshes.
 * @throws {Error} If the model fails to load.
 */
export function loadGroundMesh(
  scene: BABYLON.Scene,
  rootUrl: string = '/models/ground/',
  filename: string = 'ground.glb',
  translation: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 0),
  rotationDegrees: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 0),
  scale: BABYLON.Vector3 = new BABYLON.Vector3(1, 1, 1),
  receiveShadows: boolean = true,
) {
  return new Promise<BABYLON.AbstractMesh[]>((resolve, reject) => {
    BABYLON.SceneLoader.ImportMesh(
      '',
      rootUrl,
      filename,
      scene,
      meshes => {
        const parentMesh = new BABYLON.Mesh('groundParent', scene)
        // Add ground tag to the parent mesh
        BABYLON.Tags.AddTagsTo(parentMesh, 'ground')

        meshes.forEach(mesh => {
          mesh.parent = parentMesh
          mesh.metadata = { parentMesh: parentMesh }
          mesh.isPickable = false // Ground is not pickable

          // Add ground tag to each child mesh
          BABYLON.Tags.AddTagsTo(mesh, 'ground')

          // Configure shadow receiving
          if (receiveShadows) {
            mesh.receiveShadows = true
          }
        })

        parentMesh.rotation = new BABYLON.Vector3(
          BABYLON.Tools.ToRadians(rotationDegrees.x),
          BABYLON.Tools.ToRadians(rotationDegrees.y),
          BABYLON.Tools.ToRadians(rotationDegrees.z),
        )
        parentMesh.scaling = new BABYLON.Vector3(scale.x, scale.y, scale.z)
        parentMesh.position = translation

        resolve(meshes)
      },
      undefined,
      (scene, message, _exception) => {
        void _exception
        reject(new Error(`Failed to load ground mesh: ${message}`))
      },
      '.glb',
    )
  })
}

/**
 * Configuration for ground mesh loading and transform.
 */
export interface GroundMeshConfig {
  /** Base URL path where ground models are hosted */
  rootUrl: string
  /** The model filename to load */
  filename: string
  /** World-space position for the parent mesh */
  translation: BABYLON.Vector3
  /** Euler rotation in degrees for the parent mesh */
  rotationDegrees: BABYLON.Vector3
  /** Scaling for the parent mesh */
  scale: BABYLON.Vector3
  /** Whether child meshes should receive shadows */
  receiveShadows: boolean
}

/**
 * Derive the ground model filename from an HDR image filename.
 * Replaces the '.jpg' extension with '.glb'.
 *
 * @param hdriFilename The HDR image filename, e.g. 'hdr-vast.jpg'.
 * @returns The corresponding ground model filename, e.g. 'hdr-vast.glb'.
 */
export function getGroundModelFilename(hdriFilename: string): string {
  // Replace .jpg with .glb
  return hdriFilename.replace('.jpg', '.glb')
}

/**
 * Preset ground mesh configurations for common scenes.
 */
export const GROUND_MESH_PRESETS = {
  DEFAULT: {
    rootUrl: '/models/ground/',
    filename: 'hdr-black.glb',
    translation: new BABYLON.Vector3(0, 0, 0),
    rotationDegrees: new BABYLON.Vector3(0, 0, 0),
    scale: new BABYLON.Vector3(1.5, 1.5, 1.5),
    receiveShadows: true,
  },
  LARGE: {
    rootUrl: '/models/ground/',
    filename: 'hdr-black.glb',
    translation: new BABYLON.Vector3(0, 0, 0),
    rotationDegrees: new BABYLON.Vector3(0, 0, 0),
    scale: new BABYLON.Vector3(5, 5, 5),
    receiveShadows: true,
  },
  ELEVATED: {
    rootUrl: '/models/ground/',
    filename: 'hdr-black.glb',
    translation: new BABYLON.Vector3(0, 0.5, 0),
    rotationDegrees: new BABYLON.Vector3(0, 0, 0),
    scale: new BABYLON.Vector3(3, 3, 3),
    receiveShadows: true,
  },
  HUGE: {
    rootUrl: '/models/ground/',
    filename: 'hdr-black.glb',
    translation: new BABYLON.Vector3(0, 0, 0),
    rotationDegrees: new BABYLON.Vector3(0, 0, 0),
    scale: new BABYLON.Vector3(8, 8, 8),
    receiveShadows: true,
  },
  MEDIUM: {
    rootUrl: '/models/ground/',
    filename: 'hdr-black.glb',
    translation: new BABYLON.Vector3(0, 0, 0),
    rotationDegrees: new BABYLON.Vector3(0, 0, 0),
    scale: new BABYLON.Vector3(2, 2, 2),
    receiveShadows: true,
  },
} as const

/**
 * Load a ground mesh using a predefined preset configuration.
 *
 *
 * @param scene The Babylon.js scene to load the mesh into.
 * @param preset One of the keys from GROUND_MESH_PRESETS. Default: 'DEFAULT'.
 * @returns Promise that resolves to the array of imported meshes.
 * @throws {Error} If the model fails to load.
 */
export function loadGroundMeshWithPreset(
  scene: BABYLON.Scene,
  preset: keyof typeof GROUND_MESH_PRESETS = 'DEFAULT',
) {
  const config = GROUND_MESH_PRESETS[preset]
  return loadGroundMesh(
    scene,
    config.rootUrl,
    config.filename,
    config.translation,
    config.rotationDegrees,
    config.scale,
    config.receiveShadows,
  )
}

/**
 * Load a ground mesh that corresponds to a given HDR texture filename.
 * The HDR filename is mapped to a ground model by replacing '.jpg' with '.glb'.
 *
 *
 * @param scene The Babylon.js scene to load the mesh into.
 * @param hdriFilename The HDR image filename, e.g. 'hdr-vast.jpg'.
 * @param translation World-space position to place the parent mesh. Default: new BABYLON.Vector3(0, 0, 0).
 * @param rotationDegrees Euler rotation in degrees applied to the parent mesh. Default: new BABYLON.Vector3(0, 0, 0).
 * @param scale Scaling applied to the parent mesh. Default: new BABYLON.Vector3(1.5, 1.5, 1.5).
 * @param receiveShadows Whether child meshes should receive shadows. Default: true.
 *
 * @returns Promise that resolves to the array of imported meshes.
 * @throws {Error} If the model fails to load.
 */
export function loadGroundMeshForHDR(
  scene: BABYLON.Scene,
  hdriFilename: string,
  translation: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 0),
  rotationDegrees: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 0),
  scale: BABYLON.Vector3 = new BABYLON.Vector3(1.5, 1.5, 1.5),
  receiveShadows: boolean = true,
) {
  const groundFilename = getGroundModelFilename(hdriFilename)
  return loadGroundMesh(
    scene,
    '/models/ground/',
    groundFilename,
    translation,
    rotationDegrees,
    scale,
    receiveShadows,
  )
}
