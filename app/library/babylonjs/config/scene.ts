import * as BABYLON from '@babylonjs/core'

/**
 * Configuration interface for 3D scenes.
 *
 * Defines the structure for scene configuration including identification,
 * display information, HDRi environment mapping, and optional ground model settings.
 */
export interface SceneConfig {
  /** Unique identifier for the scene. */
  id: string
  /** Display name of the scene. */
  name: string
  /** Path to the preview image for the scene. */
  image: string
  /** HDRi filename for environment mapping. */
  hdri: string
  /** Optional ground model configuration. */
  groundModel?: {
    /** Filename of the ground model GLB file. */
    filename: string
    /** Scaling for the ground model. */
    scale: BABYLON.Vector3
    /** Translation for the ground model. */
    translation: BABYLON.Vector3
    /** Rotation for the ground model. */
    rotation: BABYLON.Vector3
  }
}

/**
 * Available HDRi scenes with matching ground models.
 *
 * Contains predefined scene configurations for different 3D environments,
 * each with corresponding HDRi environment maps and ground model settings.
 */
export const HDRI_SCENES: SceneConfig[] = [
  {
    id: 'scene1',
    name: 'Seabed',
    image: '/img/preview/hdr/hdr-seabed.jpg',
    hdri: 'hdr-seabed.jpg',
    groundModel: {
      filename: 'hdr-seabed.glb',
      scale: new BABYLON.Vector3(1.5, 1.5, 1.5),
      translation: new BABYLON.Vector3(0, 0, 0),
      rotation: new BABYLON.Vector3(0, 0, 0),
    },
  },
  {
    id: 'scene2',
    name: 'Ground View',
    image: '/img/preview/hdr/hdr-black.jpg',
    hdri: 'hdr-black.jpg',
    groundModel: {
      filename: 'hdr-black.glb',
      scale: new BABYLON.Vector3(1.5, 1.5, 1.5),
      translation: new BABYLON.Vector3(0, 0, 0),
      rotation: new BABYLON.Vector3(0, 0, 0),
    },
  },
  {
    id: 'scene3',
    name: 'Cobbled Street',
    image: '/img/preview/hdr/hdr-street.jpg',
    hdri: 'hdr-street.jpg',
    groundModel: {
      filename: 'hdr-street.glb',
      scale: new BABYLON.Vector3(1.5, 1.5, 1.5),
      translation: new BABYLON.Vector3(0, 0, 0),
      rotation: new BABYLON.Vector3(0, 0, 0),
    },
  },
  {
    id: 'scene4',
    name: 'Vast',
    image: '/img/preview/hdr/hdr-vast.jpg',
    hdri: 'hdr-vast.jpg',
    groundModel: {
      filename: 'hdr-vast.glb',
      scale: new BABYLON.Vector3(1.5, 1.5, 1.5),
      translation: new BABYLON.Vector3(0, 0, 0),
      rotation: new BABYLON.Vector3(0, 0, 0),
    },
  },
  {
    id: 'scene5',
    name: 'Cyber Black',
    image: '/img/preview/hdr/hdr-cyber_black.png',
    hdri: 'hdr-cyber_black.png',
    groundModel: {
      filename: 'hdr-cyber_black.glb',
      scale: new BABYLON.Vector3(1, 1, 1),
      translation: new BABYLON.Vector3(0, -1, 0),
      rotation: new BABYLON.Vector3(0, 0, 0),
    },
  },
  {
    id: 'scene6',
    name: 'Green',
    image: '/img/preview/hdr/hdr-green.jpg',
    hdri: 'hdr-vast.jpg',
    groundModel: {
      filename: 'hdr-green.glb',
      scale: new BABYLON.Vector3(1.5, 1.5, 1.5),
      translation: new BABYLON.Vector3(0, 0, 0),
      rotation: new BABYLON.Vector3(0, 0, 0),
    },
  },
]
