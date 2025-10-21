import * as BABYLON from '@babylonjs/core'

/**
 * RoamingCamera
 *
 * A specialized arc-rotate camera for roaming around a 3D scene with keyboard controls.
 * Extends BabylonJS ArcRotateCamera with custom configuration for smooth navigation.
 */
export class RoamingCamera extends BABYLON.ArcRotateCamera {
  /**
   * The BabylonJS scene this camera belongs to.
   */
  scene: BABYLON.Scene

  /**
   * Creates a new RoamingCamera instance with optimized settings for 3D scene navigation.
   *
   * @param scene The BabylonJS scene to attach the camera to.
   */
  constructor(scene: BABYLON.Scene) {
    super(
      'roamingCamera',
      BABYLON.Tools.ToRadians(90), // alpha: consistent with homepage
      BABYLON.Tools.ToRadians(85), // beta: consistent with homepage
      2.2,
      new BABYLON.Vector3(0, 0.8, 0),
      scene,
    )

    this.scene = scene

    // disable keyboard control
    this.inputs.remove(this.inputs.attached.keyboard)
    this.fov = BABYLON.Tools.ToRadians(45)
    this.panningSensibility = 2000
    this.maxZ = 999
    this.minZ = 0
    this.wheelPrecision = 200 // Higher value = smaller zoom steps
    // prevent camera from infinite zoom in/out
    // see https://doc.babylonjs.com/features/featuresDeepDive/behaviors/cameraBehaviors
    this.lowerRadiusLimit = 0.8 // Minimum distance - prevent getting too close
    this.upperRadiusLimit = 5.0 // Maximum distance - prevent getting too far
    this.useBouncingBehavior = false // Disable bouncing - camera will stop at limits
    // Lock vertical rotation to current angle - only allow horizontal rotation
    this.upperBetaLimit = BABYLON.Tools.ToRadians(85)
    this.lowerBetaLimit = BABYLON.Tools.ToRadians(85)
    this.inertia = 0.9
    this.angularSensibilityX = 1000
    this.angularSensibilityY = 1000
    // enable keyboard control of camera
    // see https://www.toptal.com/developers/keycode for keycode.
    this.keysUp.push(87)
    this.keysDown.push(83)
    this.keysLeft.push(65)
    this.keysRight.push(68)
    const canvas = document.getElementById('canvas') as HTMLCanvasElement
    this.scene.activeCamera!.attachControl(canvas, true)

    const node = new BABYLON.TransformNode('cameraGroup', scene)
    this.parent = node

    const gazePointNode = new BABYLON.TransformNode('gazePointNode', scene)
    gazePointNode.parent = node

    const gazePointMesh = BABYLON.MeshBuilder.CreateSphere(
      'gazePoint',
      { diameter: 0.1 },
      scene,
    )
    gazePointMesh.parent = gazePointNode
  }
}
