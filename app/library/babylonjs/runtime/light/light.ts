import * as BABYLON from '@babylonjs/core'

/**
 * Light
 *
 * A custom hemispheric light implementation that extends Babylon.js HemisphericLight.
 * Provides ambient lighting with configurable intensity, specular, and ground color properties.
 */
export class Light extends BABYLON.HemisphericLight {
  /**
   * The Babylon.js scene instance this light belongs to.
   */
  scene: BABYLON.Scene

  /**
   * Creates a new Light instance.
   *
   * @param scene The Babylon.js scene to attach the light to.
   */
  constructor(scene: BABYLON.Scene) {
    super('hemiLight', new BABYLON.Vector3(0, 1, 0), scene)

    this.scene = scene

    this.intensity = 0.6
    this.specular = new BABYLON.Color3(0, 0, 0)
    this.groundColor = new BABYLON.Color3(1, 1, 1)
  }
}
