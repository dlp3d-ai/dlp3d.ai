import * as BABYLON from '@babylonjs/core'
import { RigidBody, PhysicsTransformNode } from '@/library/babylonjs/runtime/physics'
import { Logger } from '@/library/babylonjs/utils'

/**
 * DynamicBoneSolver
 *
 * A physics solver for dynamic bone simulation using Havok physics engine.
 * Handles rigid body creation, constraints, and synchronization between physics
 * simulation and bone animation for character models.
 */
export class DynamicBoneSolver {
  /** The Babylon.js scene instance */
  private _scene: BABYLON.Scene
  /** Array of bones to be simulated */
  private _bones: BABYLON.Bone[] = []
  /** Map of rigid bodies by name */
  private _rigidBodies: Record<string, BABYLON.PhysicsBody> = {}
  /** Map of physics transform nodes by bone name */
  private _bodyNodes: Record<string, PhysicsTransformNode[]> = {}
  /** Map of 6DOF constraints by joint name */
  private _constraints: Record<string, BABYLON.Physics6DoFConstraint> = {}
  /** List of rigid body configurations */
  private _rigidBodyList: RigidBody[] = []

  /**
   * Angular limit clamp threshold in radians to prevent constraint issues.
   *
   * If your model's constraints have an odd bend, try increasing the value appropriately.
   * A value of 5 * Math.PI / 180 to 30 * Math.PI / 180 is expected to work well.
   */
  private _angularLimitClampThreshold: number = (10 * Math.PI) / 180

  /**
   * Creates a new DynamicBoneSolver instance.
   *
   * @param scene The Babylon.js scene instance
   * @param bones Array of bones to be simulated
   */
  constructor(scene: BABYLON.Scene, bones: BABYLON.Bone[]) {
    this._scene = scene
    this._bones = bones
  }

  /**
   * Converts physics parameters from Bullet physics to Havok physics format.
   *
   * @param parameter The parameter value to convert
   * @returns The converted parameter value
   */
  private _convertParameter(parameter: number): number {
    const timeStep = 1 / 60
    return (1 - (1 - parameter) ** timeStep) / timeStep
  }

  /**
   * Clamps angular limits.
   *
   * @param limit The angular limit value to clamp
   * @returns The clamped limit value (0 if below threshold)
   */
  private _clampAngularLimit(limit: number): number {
    return Math.abs(limit) < this._angularLimitClampThreshold ? 0 : limit
  }

  /**
   * Converts rotation from Euler angles to quaternion with coordinate system transformation.
   *
   * @param rotation Array of three Euler angles [x, y, z]
   * @returns The converted quaternion
   */
  private convertRotation(rotation: number[]) {
    const rotationToQuaternion = new BABYLON.Vector3(
      rotation[0],
      rotation[1],
      rotation[2],
    ).toQuaternion()
    const newQuaternion = new BABYLON.Quaternion(
      -rotationToQuaternion.x,
      rotationToQuaternion.y,
      rotationToQuaternion.z,
      -rotationToQuaternion.w,
    )
    return newQuaternion
  }

  /**
   * Adds physics constraints and rigid bodies from configuration files.
   *
   * @param constraintsUrl URL to the constraints configuration JSON file
   * @param rigidBodiesUrl URL to the rigid bodies configuration JSON file
   * @param scale Scaling factor for the physics simulation
   */
  public async addConstraints(
    constraintsUrl: string,
    rigidBodiesUrl: string,
    scale: BABYLON.Vector3,
  ) {
    const scalingFactor = 0.08 * Math.min(scale.x, scale.y, scale.z)
    Logger.debug('Add dynamic bone constraints')
    await fetch(rigidBodiesUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load rigid bodies metadata')
        }
        return response.json()
      })
      .then(data => {
        this._rigidBodyList = data
        data.forEach((rigidBody: any) => {
          if (rigidBody.name !== '') {
            let isZeroVolume = false
            let shape
            if (rigidBody.shapeType === 0) {
              shape = new BABYLON.PhysicsShapeSphere(
                new BABYLON.Vector3(),
                rigidBody.shapeSize[0] * scalingFactor,
                this._scene,
              )
              if (rigidBody.shapeSize[0] === 0) {
                isZeroVolume = true
              }
            }
            if (rigidBody.shapeType === 1) {
              shape = new BABYLON.PhysicsShapeBox(
                new BABYLON.Vector3(),
                new BABYLON.Quaternion(),
                new BABYLON.Vector3(
                  rigidBody.shapeSize[0] * 2 * scalingFactor,
                  rigidBody.shapeSize[1] * 2 * scalingFactor,
                  rigidBody.shapeSize[2] * 2 * scalingFactor,
                ),
                this._scene,
              )
              if (
                rigidBody.shapeSize[0] === 0 ||
                rigidBody.shapeSize[1] === 0 ||
                rigidBody.shapeSize[2] === 0
              ) {
                isZeroVolume = true
              }
            }
            if (rigidBody.shapeType === 2) {
              shape = new BABYLON.PhysicsShapeCapsule(
                new BABYLON.Vector3(
                  0,
                  (rigidBody.shapeSize[1] / 2) * scalingFactor,
                  0,
                ),
                new BABYLON.Vector3(
                  0,
                  (-rigidBody.shapeSize[1] / 2) * scalingFactor,
                  0,
                ),
                rigidBody.shapeSize[0] * scalingFactor,
                this._scene,
              )
              if (rigidBody.shapeSize[0] === 0 || rigidBody.shapeSize[1] === 0)
                isZeroVolume = true
            }

            const bone = this._bones.find(b => b.name === rigidBody.englishName)
            if (bone && shape) {
              shape.material = {
                friction: rigidBody.friction,
                restitution: rigidBody.repulsion,
              }
              shape.filterCollideMask = isZeroVolume ? 0 : rigidBody.collisionMask
              shape.filterMembershipMask = 1 << rigidBody.collisionGroup
              const node = new PhysicsTransformNode(
                bone.name,
                this._scene,
                bone,
                rigidBody.physicsMode,
              )
              const shapePosition = rigidBody.shapePosition
              node.position.copyFromFloats(
                -shapePosition[0] * scalingFactor,
                shapePosition[1] * scalingFactor,
                shapePosition[2] * scalingFactor,
              )
              const shapeRotation = rigidBody.shapeRotation
              node.rotationQuaternion = this.convertRotation(shapeRotation)
              const motionType =
                rigidBody.physicsMode === 0
                  ? BABYLON.PhysicsMotionType.ANIMATED
                  : BABYLON.PhysicsMotionType.DYNAMIC
              const body = new BABYLON.PhysicsBody(
                node,
                motionType,
                false,
                this._scene,
              )
              body.shape = shape
              body.setMassProperties({ mass: rigidBody.mass })
              body.setLinearDamping(this._convertParameter(rigidBody.linearDamping))
              body.setAngularDamping(
                this._convertParameter(rigidBody.angularDamping),
              )
              body.computeMassProperties()

              body.setAngularVelocity(BABYLON.Vector3.Zero())
              body.setLinearVelocity(BABYLON.Vector3.Zero())
              node.computeBodyOffsetMatrix()
              if (rigidBody.englishName !== '') {
                ;(this._bodyNodes[rigidBody.englishName] ??= []).push(node)
              }
              this._rigidBodies[rigidBody.name] = body
            }
          }
        })
      })
      .catch(error => {
        Logger.error(`Error when parsing rigid bodies: ${error}`)
      })

    await fetch(constraintsUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load constraints metadata')
        }
        return response.json()
      })
      .then(data => {
        data.forEach((joint: any) => {
          const one = BABYLON.Vector3.One()
          const jointRotation = new BABYLON.Quaternion()
          const jointPosition = new BABYLON.Vector3()
          const jointTransform = new BABYLON.Matrix()
          const rigidBodyRotation = new BABYLON.Quaternion()
          const rigidBodyPosition = new BABYLON.Vector3()
          const rigidBodyAInverse = new BABYLON.Matrix()
          const rigidBodyBInverse = new BABYLON.Matrix()
          const jointFinalTransformA = new BABYLON.Matrix()
          const jointFinalTransformB = new BABYLON.Matrix()

          if (
            joint.englishName !== '' &&
            joint.rigidbodyIndexA >= 0 &&
            joint.rigidbodyIndexA < this._rigidBodyList.length &&
            joint.rigidbodyIndexB >= 0 &&
            joint.rigidbodyIndexB < this._rigidBodyList.length
          ) {
            const bodyA =
              this._rigidBodies[this._rigidBodyList[joint.rigidbodyIndexA].name]
            const bodyB =
              this._rigidBodies[this._rigidBodyList[joint.rigidbodyIndexB].name]
            if (bodyA !== undefined && bodyB !== undefined) {
              const shapeRotation = this.convertRotation(
                joint.rotation,
              ).toEulerAngles()
              BABYLON.Matrix.ComposeToRef(
                BABYLON.Vector3.One(),
                BABYLON.Quaternion.FromEulerAnglesToRef(
                  shapeRotation.x,
                  shapeRotation.y,
                  shapeRotation.z,
                  jointRotation,
                ),
                jointPosition.copyFromFloats(
                  -joint.position[0] * scalingFactor,
                  joint.position[1] * scalingFactor,
                  joint.position[2] * scalingFactor,
                ),
                jointTransform,
              )
              const bodyInfoA = this._rigidBodyList[joint.rigidbodyIndexA]
              const bodyInfoB = this._rigidBodyList[joint.rigidbodyIndexB]
              {
                const shapeRotation = this.convertRotation(
                  bodyInfoA.shapeRotation,
                ).toEulerAngles()
                const shapePosition = bodyInfoA.shapePosition
                BABYLON.Matrix.ComposeToRef(
                  BABYLON.Vector3.One(),
                  BABYLON.Quaternion.FromEulerAnglesToRef(
                    shapeRotation.x,
                    shapeRotation.y,
                    shapeRotation.z,
                    rigidBodyRotation,
                  ),
                  rigidBodyPosition.copyFromFloats(
                    -shapePosition[0] * scalingFactor,
                    shapePosition[1] * scalingFactor,
                    shapePosition[2] * scalingFactor,
                  ),
                  rigidBodyAInverse,
                ).invert()
              }
              {
                const shapeRotation = this.convertRotation(
                  bodyInfoB.shapeRotation,
                ).toEulerAngles()
                const shapePosition = bodyInfoB.shapePosition
                BABYLON.Matrix.ComposeToRef(
                  BABYLON.Vector3.One(),
                  BABYLON.Quaternion.FromEulerAnglesToRef(
                    shapeRotation.x,
                    shapeRotation.y,
                    shapeRotation.z,
                    rigidBodyRotation,
                  ),
                  rigidBodyPosition.copyFromFloats(
                    -shapePosition[0] * scalingFactor,
                    shapePosition[1] * scalingFactor,
                    shapePosition[2] * scalingFactor,
                  ),
                  rigidBodyBInverse,
                ).invert()
              }
              jointTransform.multiplyToRef(rigidBodyAInverse, jointFinalTransformA)
              jointTransform.multiplyToRef(rigidBodyBInverse, jointFinalTransformB)
              const damping = this._convertParameter(1)
              const limits = [
                {
                  axis: BABYLON.PhysicsConstraintAxis.LINEAR_X,
                  minLimit: joint.positionMin[0],
                  maxLimit: joint.positionMax[0],
                  stiffness: this._convertParameter(joint.springPosition[0]),
                  damping: damping,
                },
                {
                  axis: BABYLON.PhysicsConstraintAxis.LINEAR_Y,
                  minLimit: joint.positionMin[1],
                  maxLimit: joint.positionMax[1],
                  stiffness: this._convertParameter(joint.springPosition[1]),
                  damping: damping,
                },
                {
                  axis: BABYLON.PhysicsConstraintAxis.LINEAR_Z,
                  minLimit: joint.positionMin[2],
                  maxLimit: joint.positionMax[2],
                  stiffness: this._convertParameter(joint.springPosition[2]),
                  damping: damping,
                },
                {
                  axis: BABYLON.PhysicsConstraintAxis.ANGULAR_X,
                  minLimit: this._clampAngularLimit(joint.rotationMin[0]),
                  maxLimit: this._clampAngularLimit(joint.rotationMax[0]),
                  stiffness: this._convertParameter(joint.springRotation[0]),
                  damping: damping,
                },
                {
                  axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Y,
                  minLimit: this._clampAngularLimit(joint.rotationMin[1]),
                  maxLimit: this._clampAngularLimit(joint.rotationMax[1]),
                  stiffness: this._convertParameter(joint.springRotation[1]),
                  damping: damping,
                },
                {
                  axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Z,
                  minLimit: this._clampAngularLimit(joint.rotationMin[2]),
                  maxLimit: this._clampAngularLimit(joint.rotationMax[2]),
                  stiffness: this._convertParameter(joint.springRotation[2]),
                  damping: damping,
                },
              ]

              for (let j = 0; j < limits.length; ++j) {
                const limit = limits[j]
                if (limit.stiffness === 0) {
                  limit.stiffness = 0
                  limit.damping = 0
                }
              }

              const constraint = new BABYLON.Physics6DoFConstraint(
                {
                  pivotA: jointFinalTransformA.getTranslation(),
                  pivotB: jointFinalTransformB.getTranslation(),
                  axisA: new BABYLON.Vector3(
                    jointFinalTransformA.m[0],
                    jointFinalTransformA.m[1],
                    jointFinalTransformA.m[2],
                  ).negateInPlace(),
                  axisB: new BABYLON.Vector3(
                    jointFinalTransformB.m[0],
                    jointFinalTransformB.m[1],
                    jointFinalTransformB.m[2],
                  ).negateInPlace(),
                  perpAxisA: new BABYLON.Vector3(
                    jointFinalTransformA.m[4],
                    jointFinalTransformA.m[5],
                    jointFinalTransformA.m[6],
                  ),
                  perpAxisB: new BABYLON.Vector3(
                    jointFinalTransformB.m[4],
                    jointFinalTransformB.m[5],
                    jointFinalTransformB.m[6],
                  ),
                  collision: true,
                },
                limits,
                this._scene,
              )
              bodyA.addConstraint(bodyB, constraint)
              this._constraints[joint.name] = constraint
            }
          }
        })
      })
      .catch(error => {
        Logger.error(`Error when parsing constraints: ${error}`)
      })
  }

  /**
   * Synchronizes physics bodies with bone animations for FollowBone mode.
   * Updates the target transform of physics bodies to match bone positions.
   */
  public syncBodies() {
    for (let i = 0; i < this._bones.length; ++i) {
      const bone = this._bones[i]
      if (this._bodyNodes[bone.name] && this._bodyNodes[bone.name].length > 0) {
        for (const node of this._bodyNodes[bone.name]) {
          if (node && node.physicsMode === 0) {
            const worldMatrix = node.linkedBone.getTransformNode()?.getWorldMatrix()

            // const rotationMatrix = BABYLON.Matrix.Identity()
            const rotationMatrix = BABYLON.Matrix.RotationY(Math.PI)
            if (worldMatrix) {
              const worldMatrixAfterRotate = worldMatrix.multiply(rotationMatrix)
              const MatrixNew = node.bodyOffsetMatrix.multiply(
                worldMatrixAfterRotate,
              )
              const _NodeWorldPosition = new BABYLON.Vector3()
              const _NodeWorldRotation = new BABYLON.Quaternion()
              const _NodeWorldScale = new BABYLON.Vector3()
              MatrixNew.decompose(
                _NodeWorldScale,
                _NodeWorldRotation,
                _NodeWorldPosition,
              )
              if (node.physicsBody) {
                node.physicsBody.setTargetTransform(
                  _NodeWorldPosition,
                  _NodeWorldRotation,
                )
              }
            }
          }
        }
      }
    }
  }

  /**
   * Synchronizes bone animations with physics simulation results.
   * Updates bone rotations based on physics body transforms for Physics and PhysicsWithBone modes.
   */
  public syncBones() {
    const matrixMap = new Map()
    for (let i = 0; i < this._bones.length; ++i) {
      const bone = this._bones[i]
      if (this._bodyNodes[bone.name]) {
        const node = this._bodyNodes[bone.name][0]
        const worldMatrix = node.getWorldMatrix()
        const MatrixNew = node.bodyOffsetMatrixInverse.multiply(worldMatrix)
        const rotationMatrix = BABYLON.Matrix.RotationY(Math.PI)
        const worldMatrixAfterRotate = MatrixNew.multiply(rotationMatrix)
        matrixMap.set(node.linkedBone.name, worldMatrixAfterRotate)
      }
    }
    for (let i = 0; i < this._bones.length; ++i) {
      const bone = this._bones[i]
      if (this._bodyNodes[bone.name]) {
        const node = this._bodyNodes[bone.name][0]
        if (node.physicsMode !== 0) {
          const worldMatrix = matrixMap.get(node.linkedBone.name)
          const parentWorldMatrix = matrixMap.get(node.linkedBone.parent.name)
          const boneNode = node.linkedBone.getTransformNode()
          const relativeRotation = new BABYLON.Quaternion()
          if (parentWorldMatrix && boneNode) {
            worldMatrix
              .multiply(BABYLON.Matrix.Invert(parentWorldMatrix))
              .decompose(undefined, relativeRotation, undefined)
            boneNode.rotationQuaternion = relativeRotation
          }
        }
      }
    }
  }

  /**
   * Gets the rigid bodies of the dynamic bone solver.
   *
   * @returns The rigid bodies of the dynamic bone solver.
   */
  get rigidBodies() {
    return this._rigidBodies
  }
}
