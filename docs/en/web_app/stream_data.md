# Stream Data

This page explains how streamed data is structured, transported, and consumed by the web app.

## Schema

Streamed data is encapsulated using Protocol Buffers ([protobuf](https://github.com/protocolbuffers/protobuf)) and sent over WebSocket. Each message is a binary-encoded protobuf payload that the client decodes into typed response objects, then dispatches according to the message class name.

The protocol defines two major categories of messages:

### Stream Data Messages

Stream data messages follow a three-phase lifecycle for each stream type (Audio, Motion, Face):

- **Chunk Start**: Announces the beginning of a typed stream and its stream-level parameters (e.g., data type, dimension).

- **Chunk Body**: Contains the payload for the active stream and feeds the streamed runtime pipeline.

- **Chunk End**: Marks the end of the stream; the client uses this to perform readiness and completion checks.

### Control Messages

Control messages manage the request lifecycle and signal state transitions:

- **RequestIDResponse**: Provides a unique request identifier to correlate the running request with server-side state.

- **NormalResponse**: Indicates a successful, regular response.

- **FailedResponse**: Indicates a failed request and includes a human-readable error message describing the reason.

- **LeaveResponse**: Emitted when the chat session ends.

## Motion

### From Blender to Babylon

Raw motion data are stored as `.npz` files in the motion database. Each `.npz` file contains joint rotation matrices and the skeleton’s global translation. Rotation matrices are stored as the Blender ***matrix_basis***. There is a representational mismatch between Blender and Babylon:

- Blender: both **rest-pose relative** and **parent relative**

- Babylon: **parent relative** only

In other words, if you set all joint transforms to **0** in Blender, the avatar assumes the **rest pose**. In Babylon, the same operation yields a “stick” pose rather than the rest pose. Consequently, Blender’s `matrix_basis` cannot directly animate an avatar in Babylon. The following explains how to convert between the two conventions.

#### Interaction Modes in Blender

- **Object Mode**: Manage and move objects in the scene.

- **Edit Mode**: Used to modify the bone structure, such as adding/deleting bones and adjusting hierarchy.

- **Pose Mode**: Allows adjustment of bone poses in this mode, such as rotating bones and adding keyframe animation.

#### Bones in Blender

|  | **Pose Bone** | **Data Bone** |
|---|---|---|
| **Mode** | Pose Mode | Edit Mode |
| **Purpose** | Control animation, add constraints, insert keyframes | Define bone structure, name, parent-child relationships |
| **Affects animation** | ✅ Yes, affects final animation | ❌ No, only for bone structure |
| **Can deform** | ✅ Yes, can be used for character deformation | ❌ No, does not affect character deformation |
| **Stores keyframes** | ✅ Yes, stores keyframe animation data | ❌ No, does not store animation data |
| **Can add constraints** | ✅ Yes (e.g., IK, Track To) | ❌ No |


#### Spaces in Blender

In Blender, bone transformations are expressed in multiple coordinate spaces. Different spaces serve different computation methods and constraint rules. Conceptually, they fall into two broad categories: local space and world space. Object/armature/bone spaces are specializations of local space.

- **World Space**
  - Transform is relative to the world origin and axes.
  - All parent bone transforms affect the final world-space transform of the current bone.
  - Bones use global coordinates.

- **Local Space**
  - Considers only the transform applied to the bone itself; the rest pose remains the reference.
  - Bones use local coordinates.
  - For bones, local space is equivalent to bone space (a bone-specific local definition).

Specialized spaces derived from local space:

- **Pose Space**: Transform relative to the rest pose. Each bone’s transform is computed from its rest-pose position and orientation, independent of the armature’s object transform. This is the primary space used in pose mode and where keyframes store bone transforms.

- **Object Space**: Local space of objects (Mesh, Armature, etc.). For armatures, object space equals armature space. If the armature has an object-mode transform, bone transforms are affected accordingly.

- **Bone Space**: Local space of the bone; the bone’s origin is at its head and axes align with the bone direction.

- **Armature Space**: Same as object space but specifically for the armature object. The armature’s transform relative to world coordinates occurs here.

#### Matrices in Blender

- ```Bone.matrix```: A 3×3 matrix that transforms the bone from bone space to the parent bone’s bone space in the rest position.

```python
armature = bpy.data.objects['Armature']
armature.data.bones["Bone"].matrix
```

- ```Bone.matrix_local```: The unposed matrix of the bone in armature space. ```Bone.matrix_local``` is equivalent to ```PoseBone.matrix``` in the rest pose.

```python
armature = bpy.data.objects['Armature']
data_bone = armature.data.bones["Bone"]
matrix_local = data_bone.matrix_local
```

- ```PoseBone.matrix_basis```: The transform of the bone in bone space, unaffected by parent bones.

```python
armature = bpy.data.objects['Armature']
pose_bone = armature.pose.bones["Bone"]
matrix_basis = pose_bone.matrix_basis
```

#### Convention

To make the matrix basis get working in babylon, we need convert it into ***parent-relative matrix***. The problem can be formulated as:

```shell
parent_relative_matrix = parent_matrix_local.inverted() @ matrix_local @ matrix_basis
```

In python code:

```python
def parent_relative_matrix(armature: bpy.types.Object, bone_name: str):
    matrix_local = armature.data.bones[bone_name].matrix_local
    matrix_basis = armature.pose.bones[bone_name].matrix_basis

    parent_bone = armature.pose.bones[bone_name].parent

    if parent_bone is None:
        return matrix_local @ matrix_basis
    else:
        parent_matrix_local = armature.data.bones[parent_bone.name].matrix_local
        return parent_matrix_local.inverted() @ matrix_local @ matrix_basis
```

For more details, please refer to [_convert_to_babylon](https://github.com/dlp3d-ai/speech2motion/blob/main/speech2motion/apis/streaming_speech2motion_v3.py#L1868).

The resulting parent-relative matrices are serialized into protobuf messages and sent to the web app.

::::{Important}
For the arithmetic for the tensor calculus and stream data, please use float32(by default). Using float16 causes numerical instability (maximum of 3 significant decimal 
digits), which can break cloth simulation and introduce jitter in character animation.
::::

### Data Structure

Motion data is packed into motion chunks:

- MotionChunkStart:
  - Joint Names: Declares the ordered list of joints that contain animation data. Joints that do not include animations will not be in the list.
  - Data Type: Specifies the numeric data type (float16 or float32) for the motion stream.
  - (Optional) Timeline Start Index: Frame shift between the first frame of motion data and the first frame of audio data

- MotionChunkBody:
  - Contains packed floating-point data for animation frames. Each frame stores: joint rotation matrices (3×3 matrix per joint, flattened row-major), root global translation (1x3), and reserved metadata (1x3).
  - The client reshapes the rotation data into per-joint 3×3 matrices and extracts the root position vector.
  - Each body contributes its frame count to the streamed runtime pipeline.

- MotionChunkEnd:
  - Marks the end of the motion stream; used by the client to determine when all motion data has been received and to enable completion checks in coordination with audio and face streams.

## Face

The face animations, also named as ***Blend Shape Values***, ***Shape Key Values*** or ***Morph Target Values***, are packed into face chunks:

- FaceChunkStart:
  - Morph Target Names: Declares the ordered list of morph target names that will be animated.
  - Data Type: Specifies the numeric data type (float16 or float32) for the face animation stream.
  - (Optional) Timeline Start Index: Frame shift between the first frame of face data and the first frame of audio data

- FaceChunkBody:
  - Contains packed floating-point data for animation frames. Each frame stores morph target values in the same order as declared in FaceChunkStart.
  - Each body contributes its frame count to the streamed runtime pipeline.

- FaceChunkEnd:
  - Marks the end of the face animation stream; used by the client to determine when all facial expression data has been received and to enable completion checks.

## Audio

Raw audio PCM data is packed into audio chunks:

- AudioChunkStart:
  - Declares the audio sample rate in Hz (e.g., 16000, 24000, 48000).
  - Specifies the number of audio channels (e.g., 1 for mono, 2 for stereo).
  - Defines the sample width in bytes per sample (e.g., 2 for 16-bit PCM).

- AudioChunkBody:
  - Contains raw PCM audio bytes ready for playback.
  - The duration of each chunk is computed from the byte size divided by (sample rate × number of channels × sample width).
  - Bodies are appended to the streamed runtime pipeline and queued for sequential playback.

- AudioChunkEnd:
  - Marks the end of the audio stream; used by the client to determine when all audio data has been received and to enable completion checks.

# References

[1] https://docs.blender.org/manual/en/latest/animation/constraints/interface/common.html#space-types

[2] https://blenderartists.org/t/what-is-different-local-space-and-pose-space/578162/5