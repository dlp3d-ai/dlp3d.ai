import { PhysicsMode } from '@/library/babylonjs/runtime/physics'
import * as BABYLON from '@babylonjs/core'

/**
 * PhysicsTransformNode
 *
 * A transform node that links a bone to a physics body for dynamic bone simulation.
 * Manages the offset matrices between the bone's transform and the physics body's transform.
 */
export class PhysicsTransformNode extends BABYLON.TransformNode {
  /** The bone linked to this physics transform node */
  public linkedBone: BABYLON.Bone
  /** The physics mode for this node */
  public physicsMode: PhysicsMode
  /** Offset matrix from bone transform to physics body transform */
  bodyOffsetMatrix: BABYLON.Matrix
  /** Inverse of the body offset matrix */
  bodyOffsetMatrixInverse: BABYLON.Matrix

  /**
   * Creates a new PhysicsTransformNode instance.
   *
   * @param name The name of the transform node
   * @param scene The Babylon.js scene instance
   * @param linkedBone The bone to link to this physics node
   * @param physicsMode The physics mode for this node
   */
  constructor(
    name: string,
    scene: BABYLON.Scene,
    linkedBone: BABYLON.Bone,
    physicsMode: PhysicsMode,
  ) {
    super(name, scene)
    this.linkedBone = linkedBone
    this.physicsMode = physicsMode
    this.bodyOffsetMatrix = BABYLON.Matrix.Identity()
    this.bodyOffsetMatrixInverse = BABYLON.Matrix.Identity()
  }

  /**
   * Computes the offset matrix between the bone transform and physics body transform.
   * This matrix is used to convert between bone space and physics body space.
   */
  computeBodyOffsetMatrix() {
    const boneNode = this.linkedBone.getTransformNode()
    if (boneNode) {
      const worldMatrix = this.getWorldMatrix()
      const rotationMatrix = BABYLON.Matrix.RotationY(Math.PI)
      const worldMatrixAfterRotate = boneNode
        .getWorldMatrix()
        .multiply(rotationMatrix)
      this.bodyOffsetMatrix = worldMatrix.multiply(
        BABYLON.Matrix.Invert(worldMatrixAfterRotate),
      )
      this.bodyOffsetMatrixInverse = BABYLON.Matrix.Invert(this.bodyOffsetMatrix)
    }
  }
}
