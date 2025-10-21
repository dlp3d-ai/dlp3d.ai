import * as BABYLON from '@babylonjs/core'
import { RoamingCamera } from '@/library/babylonjs/runtime/camera'
import { Logger } from '@/library/babylonjs/utils'

/**
 * EyeTrackingController
 *
 * A class for controlling eye tracking and gaze direction in 3D characters.
 * Manages smooth eye movement based on camera position and gaze targets.
 */
export class EyeTrackingController {
  /**
   * Maximum horizontal rotation angle for eyes in degrees.
   */
  public maxHorizontalAngle: number = 16

  /**
   * Maximum vertical rotation angle for eyes in degrees.
   */
  public maxVerticalAngle: number = 6

  /**
   * Weight factor for rotation intensity (0.0 to 1.0).
   */
  public rotationWeight: number = 0.8

  /**
   * Whether to invert vertical eye movement.
   */
  public invertVertical: boolean = false

  /**
   * Whether to invert horizontal eye movement.
   */
  public invertHorizontal: boolean = false

  /**
   * Whether eye tracking is currently enabled.
   */
  public eyeTrackingEnabled: boolean = true

  /**
   * Forward axis vector for the left eye in local space.
   */
  public leftEyeForwardAxis: BABYLON.Vector3 = BABYLON.Vector3.Forward()

  /**
   * Up axis vector for the left eye in local space.
   */
  public leftEyeUpAxis: BABYLON.Vector3 = BABYLON.Vector3.Up()

  /**
   * Forward axis vector for the right eye in local space.
   */
  public rightEyeForwardAxis: BABYLON.Vector3 = BABYLON.Vector3.Forward()

  /**
   * Up axis vector for the right eye in local space.
   */
  public rightEyeUpAxis: BABYLON.Vector3 = BABYLON.Vector3.Up()

  /**
   * Smoothing factor for eye movement interpolation (0.0 to 1.0). Lower values = smoother but slower response.
   */
  public smoothingFactor: number = 0.15

  /**
   * Minimum angle change in degrees to trigger an eye update.
   */
  public minUpdateThreshold: number = 0.5

  /**
   * Maximum number of eye updates per second.
   */
  public maxUpdateRate: number = 30

  /**
   * Reference to the Babylon.js scene.
   */
  private _scene: BABYLON.Scene

  /**
   * Transform node for the left eye bone.
   */
  private _leftEyeNode: BABYLON.TransformNode

  /**
   * Transform node for the right eye bone.
   */
  private _rightEyeNode: BABYLON.TransformNode

  /**
   * Camera group transform node containing the camera and gaze point.
   */
  private _cameraGroup: BABYLON.TransformNode | null = null

  /**
   * Reference to the roaming camera.
   */
  private _camera: RoamingCamera | null = null

  /**
   * Transform node representing the gaze target point.
   */
  private _gazePointNode: BABYLON.TransformNode | null = null

  /**
   * Initial rotation quaternion for the left eye.
   */
  private _leftEyeInitRotQuat: BABYLON.Quaternion

  /**
   * Initial rotation quaternion for the right eye.
   */
  private _rightEyeInitRotQuat: BABYLON.Quaternion

  /**
   * Current smoothed rotation for the left eye.
   */
  private _currentLeftEyeRotation: BABYLON.Quaternion

  /**
   * Current smoothed rotation for the right eye.
   */
  private _currentRightEyeRotation: BABYLON.Quaternion

  /**
   * Target rotation for the left eye.
   */
  private _targetLeftEyeRotation: BABYLON.Quaternion

  /**
   * Target rotation for the right eye.
   */
  private _targetRightEyeRotation: BABYLON.Quaternion

  /**
   * Timestamp of the last eye update.
   */
  private _lastUpdateTime: number = 0

  /**
   * Minimum interval between eye updates in milliseconds.
   */
  private _updateInterval: number = 10

  /**
   * Creates a new EyeTrackingController instance.
   *
   * @param scene The Babylon.js scene containing the character.
   * @param leftEyeBoneName Name of the left eye bone in the scene. Defaults to 'Eye_L'.
   * @param rightEyeBoneName Name of the right eye bone in the scene. Defaults to 'Eye_R'.
   *
   * @throws {Error} if left or right eye nodes are not found in the scene.
   * @throws {Error} if camera group is not found in the scene.
   */
  constructor(
    scene: BABYLON.Scene,
    leftEyeBoneName: string = 'Eye_L',
    rightEyeBoneName: string = 'Eye_R',
  ) {
    this._scene = scene

    const leftEyeNode = scene.getTransformNodeByName(leftEyeBoneName)
    const rightEyeNode = scene.getTransformNodeByName(rightEyeBoneName)

    if (!leftEyeNode || !rightEyeNode) {
      throw new Error('Left or right eye node not found')
    }

    this._leftEyeNode = leftEyeNode
    this._rightEyeNode = rightEyeNode

    this._cameraGroup = scene.getTransformNodeByName('cameraGroup')

    this._leftEyeInitRotQuat = leftEyeNode.rotationQuaternion!.clone()
    this._rightEyeInitRotQuat = rightEyeNode.rotationQuaternion!.clone()

    // Initialize smoothing state
    this._currentLeftEyeRotation = this._leftEyeInitRotQuat.clone()
    this._currentRightEyeRotation = this._rightEyeInitRotQuat.clone()
    this._targetLeftEyeRotation = this._leftEyeInitRotQuat.clone()
    this._targetRightEyeRotation = this._rightEyeInitRotQuat.clone()
    this._updateInterval = 1000 / this.maxUpdateRate

    if (!this._cameraGroup) {
      throw new Error('Camera group is not set')
    }

    this.registerEyeTrackingEvent()
  }

  /**
   * Registers the eye tracking event handlers and sets up the gaze update system.
   * Initializes camera and gaze point references, then starts the tracking loop.
   */
  registerEyeTrackingEvent() {
    const fixedCenter = new BABYLON.Vector3(0) // Ground center of the circle
    const orbitRadius = -10

    const CAMERA_BETA_UPPER_BOUND = 60
    const CAMERA_BETA_LOWER_BOUND = 120
    const GAZE_POINT_Y_LIMIT = 2

    if (!this._cameraGroup) {
      Logger.error('Camera group is not set')
      return
    }

    const nodes = this._cameraGroup.getChildren()
    nodes.forEach(node => {
      if (node instanceof RoamingCamera) {
        this._camera = node
      }
      if (node instanceof BABYLON.TransformNode && node.name === 'gazePointNode') {
        this._gazePointNode = node
      }
    })

    if (this._camera === null) {
      Logger.error('Camera is not set')
      return
    }

    const updateGaze = () => {
      if (!this.eyeTrackingEnabled) {
        return
      }

      // Check if parent matrices are available
      if (!this._leftEyeNode.parent || !this._rightEyeNode.parent) {
        return
      }

      // Rate limiting
      const currentTime = Date.now()
      if (currentTime - this._lastUpdateTime < this._updateInterval) {
        return
      }

      // Get the cameras view direction
      const lookDir = this._camera!.getTarget()
        .subtract(this._camera!.position)
        .normalize()
      // Project onto XZ plane to ignore vertical angle
      lookDir.y = 0
      lookDir.normalize()
      // Position B along this direction at fixed radius from the fixed center
      const offset = lookDir.scale(orbitRadius)
      const pos = fixedCenter.add(offset)

      let cameraYDegress = BABYLON.Tools.ToDegrees(this._camera!.beta)

      if (cameraYDegress <= CAMERA_BETA_UPPER_BOUND) {
        cameraYDegress = CAMERA_BETA_UPPER_BOUND
      }
      if (cameraYDegress >= CAMERA_BETA_LOWER_BOUND) {
        cameraYDegress = CAMERA_BETA_LOWER_BOUND
      }

      const ratio = (90 - cameraYDegress) / 30
      const y = ratio * GAZE_POINT_Y_LIMIT
      this._gazePointNode!.position.set(pos.x, y, pos.z)

      // Calculate target rotations
      const leftTargetRot = this.calculateTargetRotation(
        this._leftEyeNode,
        this._gazePointNode!.position,
        this._leftEyeInitRotQuat,
        true,
      )
      const rightTargetRot = this.calculateTargetRotation(
        this._rightEyeNode,
        this._gazePointNode!.position,
        this._rightEyeInitRotQuat,
        false,
      )

      // Check if change is significant enough to update
      const leftAngleDiff = this.getQuaternionAngleDifference(
        this._currentLeftEyeRotation,
        leftTargetRot,
      )
      const rightAngleDiff = this.getQuaternionAngleDifference(
        this._currentRightEyeRotation,
        rightTargetRot,
      )

      if (
        leftAngleDiff > this.minUpdateThreshold ||
        rightAngleDiff > this.minUpdateThreshold
      ) {
        this._targetLeftEyeRotation = leftTargetRot
        this._targetRightEyeRotation = rightTargetRot
        this._lastUpdateTime = currentTime
      }
    }

    // Wait for scene to be fully ready
    this._scene.onReadyObservable.addOnce(() => {
      // Add a small delay to ensure parent matrices are available
      setTimeout(() => {
        updateGaze()
        this._camera!.onViewMatrixChangedObservable.add(() => {
          updateGaze()
        })

        // Start smooth update loop
        this._scene.onBeforeRenderObservable.add(() => {
          this.updateEyeSmoothing()
        })
      }, 100)
    })
  }

  /**
   * Calculates the target rotation for an eye based on the gaze target position.
   *
   * @param eyeNode The transform node of the eye bone.
   * @param targetPosition The world position of the gaze target.
   * @param initialRotQuat The initial rotation quaternion of the eye.
   * @param isLeftEye Whether this is the left eye (affects axis configuration).
   *
   * @returns The calculated target rotation quaternion for the eye.
   */
  private calculateTargetRotation(
    eyeNode: BABYLON.TransformNode,
    targetPosition: BABYLON.Vector3,
    initialRotQuat: BABYLON.Quaternion,
    isLeftEye: boolean,
  ): BABYLON.Quaternion {
    // Calculate world space direction from eye to target
    const eyeWorldPos = eyeNode.getAbsolutePosition()
    const targetDirWorld = targetPosition.subtract(eyeWorldPos).normalize()

    // Transform target direction to eye bone's local space
    const parentWorldMatrix = eyeNode.parent!.getWorldMatrix()
    const parentInvMatrix = BABYLON.Matrix.Invert(parentWorldMatrix)
    const localTargetDir = BABYLON.Vector3.TransformNormal(
      targetDirWorld,
      parentInvMatrix,
    ).normalize()

    // Transform target direction to eye's custom local coordinate system
    const eyeForward = isLeftEye ? this.leftEyeForwardAxis : this.rightEyeForwardAxis
    let eyeUp = isLeftEye ? this.leftEyeUpAxis : this.rightEyeUpAxis
    const eyeRight = BABYLON.Vector3.Cross(eyeUp, eyeForward).normalize()
    eyeUp = BABYLON.Vector3.Cross(eyeForward, eyeRight).normalize() // ensure orthogonality

    // Project target direction onto eye coordinate system
    const forwardDot = BABYLON.Vector3.Dot(localTargetDir, eyeForward)
    const rightDot = BABYLON.Vector3.Dot(localTargetDir, eyeRight)
    const upDot = BABYLON.Vector3.Dot(localTargetDir, eyeUp)

    // Calculate horizontal and vertical angles
    let horizontalAngle = BABYLON.Tools.ToDegrees(Math.atan2(rightDot, forwardDot))
    let verticalAngle = -BABYLON.Tools.ToDegrees(Math.atan2(upDot, forwardDot)) // invert vertical angle

    // Apply direction corrections
    if (this.invertHorizontal) {
      horizontalAngle = -horizontalAngle
    }
    if (this.invertVertical) {
      verticalAngle = -verticalAngle
    }

    // Clamp angle ranges
    horizontalAngle =
      BABYLON.Scalar.Clamp(
        horizontalAngle,
        -this.maxHorizontalAngle,
        this.maxHorizontalAngle,
      ) * this.rotationWeight
    verticalAngle =
      BABYLON.Scalar.Clamp(
        verticalAngle,
        -this.maxVerticalAngle,
        this.maxVerticalAngle,
      ) * this.rotationWeight

    // Create target rotation (horizontal first, then vertical)
    const horizontalRot = BABYLON.Quaternion.RotationAxis(
      eyeUp,
      BABYLON.Tools.ToRadians(horizontalAngle),
    )
    const verticalRot = BABYLON.Quaternion.RotationAxis(
      eyeRight,
      BABYLON.Tools.ToRadians(verticalAngle),
    )
    const targetRot = verticalRot.multiply(horizontalRot)

    return initialRotQuat.multiply(targetRot)
  }

  /**
   * Calculates the angle difference between two quaternions.
   *
   * @param q1Quaternion The first quaternion.
   * @param q2 The second quaternion.
   *
   * @returns The angle difference in degrees.
   */
  private getQuaternionAngleDifference(
    q1Quaternion: BABYLON.Quaternion,
    q2: BABYLON.Quaternion,
  ): number {
    const dot = Math.abs(BABYLON.Quaternion.Dot(q1Quaternion, q2))
    return BABYLON.Tools.ToDegrees(2 * Math.acos(Math.min(dot, 1)))
  }

  /**
   * Updates eye smoothing by interpolating between current and target rotations.
   * Called on every frame to provide smooth eye movement.
   */
  private updateEyeSmoothing() {
    if (!this.eyeTrackingEnabled) {
      return
    }

    // Smooth interpolation between current and target rotations
    this._currentLeftEyeRotation = BABYLON.Quaternion.Slerp(
      this._currentLeftEyeRotation,
      this._targetLeftEyeRotation,
      this.smoothingFactor,
    )

    this._currentRightEyeRotation = BABYLON.Quaternion.Slerp(
      this._currentRightEyeRotation,
      this._targetRightEyeRotation,
      this.smoothingFactor,
    )

    // Apply smoothed rotations
    this._leftEyeNode.rotationQuaternion = this._currentLeftEyeRotation
    this._rightEyeNode.rotationQuaternion = this._currentRightEyeRotation
  }

  /**
   * Gets the left eye transform node.
   *
   * @returns The left eye transform node.
   */
  get leftEyeNode(): BABYLON.TransformNode {
    return this._leftEyeNode
  }

  /**
   * Gets the right eye transform node.
   *
   * @returns The right eye transform node.
   */
  get rightEyeNode(): BABYLON.TransformNode {
    return this._rightEyeNode
  }
}
