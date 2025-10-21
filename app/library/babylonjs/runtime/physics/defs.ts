/**
 * Physics mode enumeration for character dynamic bone.
 */
export enum PhysicsMode {
  /** Follow bone animation without physics simulation */
  FollowBone = 0,
  /** Pure physics simulation without bone animation */
  Physics = 1,
  /** Combined physics simulation with bone animation */
  PhysicsWithBone = 2,
}

/**
 * Configuration interface for rigid body physics properties.
 */
export interface RigidBody {
  /** Unique identifier for the rigid body */
  name: string
  /** English name for the rigid body */
  englishName: string
  /** Index of the associated bone in the skeleton */
  boneIndex: number
  /** Collision group identifier for physics filtering */
  collisionGroup: number
  /** Collision mask for determining collision interactions */
  collisionMask: number
  /** Type of collision shape (0: sphere, 1: box, 2: capsule) */
  shapeType: number
  /** Size parameters for the collision shape */
  shapeSize: number[]
  /** Position offset of the collision shape relative to the bone */
  shapePosition: number[]
  /** Rotation offset of the collision shape relative to the bone */
  shapeRotation: number[]
  /** Mass of the rigid body */
  mass: number
  /** Linear damping coefficient for velocity reduction */
  linearDamping: number
  /** Angular damping coefficient for rotation reduction */
  angularDamping: number
  /** Restitution coefficient for collision bounciness */
  repulsion: number
  /** Friction coefficient for surface interaction */
  friction: number
  /** Physics mode for this rigid body */
  physicsMode: number
}
