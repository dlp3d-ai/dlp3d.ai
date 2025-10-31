# 流数据

本页解释了流数据在Web应用中的结构、传输和使用方式。

## Schema

流数据使用Protocol Buffers([protobuf](https://github.com/protocolbuffers/protobuf))封装，并通过WebSocket传输。每条消息都是一个二进制编码的Protobuf消息，客户端将其解码为类型化的响应对象，然后根据消息类型进行事件响应。

流消息分为以下两大类：

### 流数据消息

流数据消息封装了音频、动作或表情数据中的一种，消息通过三阶段生命周期进行管理：

- **消息头(Chunk Start)**：用于宣布流的开始，并包含流数据相关的参数（例如，数据类型、维度）。

- **消息体(Chunk Body)**：包含具体的音频、动作或表情数据，这些数据将被传输至到流式动画管线进行播放。

- **消息尾(Chunk End)**：标记流的结束；客户端使用此消息执行就绪性和完成性检查。

### 控制消息

控制消息管理请求的整体生命周期，并发出状态转换信号：

- **RequestIDResponse**：唯一的请求标识符，用于将运行中的请求与服务端状态相关联。

- **NormalResponse**：表示成功的常规响应。

- **FailedResponse**：表示失败的请求，并包含错误消息。

- **LeaveResponse**：在聊天会话结束时发出。

## 动作(Motion)

### 从Blender到Babylon

原始动作数据以`.npz`文件的形式存储在动作数据库中。每个`.npz`文件包含关节旋转矩阵和骨骼的全局位移。旋转矩阵存储为Blender的 ***matrix_basis***，这导致Blender和Babylon的骨骼旋转之间存在表示差异：

- Blender：既相对于中立姿态(**rest-pose relative**)，也相对于父骨骼(**parent relative**)

- Babylon：仅相对于父骨骼(**parent relative**)

换句话说，如果在Blender中将所有关节变换设置为 **0**，角色会呈现中立姿态(**rest pose**)。而在Babylon中，相同的操作会导致角色姿态异常，角色看起来会像一根木棍。因此，Blender的`matrix_basis`无法直接驱动Babylon中的角色运动。接下来将解释如何在两种不同的旋转表示之间进行转换。

#### Blender中的交互模式

- 对象模式(**Object Mode**)：管理/移动场景中的整个对象。

- 编辑模式(**Edit Mode**)：用于修改骨骼结构，如添加/删除骨骼、调整层级。

- 姿态模式(**Pose Mode**)：该模式下允许调整骨骼姿态，如旋转骨骼、添加关键帧动画。

#### Blender中的骨骼

|  | **Pose Bone** | **Data Bone** |
|---|---|---|
| **模式** | Pose Mode | Edit Mode |
| **作用** | 控制动画、添加约束、插入关键帧 | 定义骨骼结构、名称、父子关系 |
| **是否影响动画** | ✅ 是，会影响最终动画 | ❌ 否，仅用于骨骼结构 |
| **是否可变形** | ✅ 是，可用于角色变形 | ❌ 否，不影响角色变形 |
| **是否存储关键帧** | ✅ 是，存储关键帧动画数据 | ❌ 否，不存储动画数据 |
| **可否添加约束** | ✅ 可以（如 IK、Track To） | ❌ 不能 |

#### Blender中的空间

Blender中，骨骼的变换涉及多个坐标空间，不同的空间适用不同的计算方式和约束规则，因此衍生出了一系列空间，本质上分为局部空间(local space)和世界空间(world space)两种。对象空间/骨架/骨骼空间(object/armature/bone space)是local space的特例。

- **World Space**
  - 骨骼的变换参考世界坐标系，即：位置相对于世界原点，旋转/缩放相对于世界坐标轴。
  - 所有父骨骼的变换都会影响当前骨骼的最终world space的坐标。
  - 骨骼在world space下使用的是全局坐标(global coordinates)。

- **Local Space**
  - 仅考虑对骨骼自身施加的变换(Transform)，不受父骨骼(parent bone)影响，但中立姿态(rest pose)仍然是基准。
  - 骨骼在local space下使用的是局部坐标(local coordinates)。
  - 对于骨骼而言，local space相当于bone space，bone space是特定于骨骼的local space定义方式。

接下来是特化空间：

- **Pose Space**：Bone transform相对于rest pose，表示骨骼在pose mode下的变换。每个bone的transform是基于它在rest pose下的位置和朝向计算的，与armature的object transform无关。pose space是pose mode使用的主要空间，也是关键帧存储bone transform的空间。

- **Object Space**：Object（Mesh、Armature 等）的local space。对armature而言，object space就是armature space。如果 armature在object mode下有 transform，它的骨骼变换也会受到影响。

- **Bone Space**：bone的local space，即bone的origin是它本身的head，坐标轴沿着bone direction。

- **Armature Space**：等同于object space，但特指armature这个object的local space。整个Armature相对于世界坐标的变换发生在这个空间里。

#### Blender中的矩阵

- ```Bone.matrix```：在rest position下，将bone从bone space变换到parent bone的bone space下的3x3矩阵。

```python
armature = bpy.data.objects['Armature']
armature.data.bones["Bone"].matrix
```

- ```Bone.matrix_local```：bone在armature space下的无pose矩阵，```Bone.matrix_local```等价于rest pose状态下的 ```PoseBone.matrix```。

```python
armature = bpy.data.objects['Armature']
data_bone = armature.data.bones["Bone"]
matrix_local = data_bone.matrix_local
```

- ```PoseBone.matrix_basis```：bone在bone space的变换矩阵，不受父骨骼影响。

```python
armature = bpy.data.objects['Armature']
pose_bone = armature.pose.bones["Bone"]
matrix_basis = pose_bone.matrix_basis
```

#### 旋转空间转换

为了在Babylon中使matrix basis正常工作，我们需要将其转换为***parent-relative matrix***（相对于父骨骼的矩阵）。该问题可以描述为：

```shell
parent_relative_matrix = parent_matrix_local.inverted() @ matrix_local @ matrix_basis
```

Blender Python可写作：

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

更多详细信息，请参阅 [_convert_to_babylon](https://github.com/dlp3d-ai/speech2motion/blob/main/speech2motion/apis/streaming_speech2motion_v3.py#L1868)。

生成的parent-relative矩阵会被序列化为protobuf消息并发送到Web应用。

::::{Important}
对于张量计算和Web客户端中流数据的算术运算，请使用单精度浮点数（float32，默认）。使用半精度浮点数(float16) 会导致数值不稳定（float16最多只有3位有效小数位），这可能导致布料模拟崩坏，并使得角色动画出现异常的抖动。
::::

### 数据结构

动作数据被打包到motion chunks中：

- MotionChunkStart：
  - 关节名称列表：声明包含动画数据的关节的有序列表。不包含动画的关节不会出现在该列表中。
  - 数据类型：指定动作数据流的数据类型（float16或float32）。
  - （可选）时间轴位移：动作数据的第一帧与音频数据的第一帧之间的偏移量。

- MotionChunkBody：
  - 包含动画帧的浮点数据。每帧存储：关节旋转矩阵（每个关节是3×3矩阵，按行主序展开）、全局位移（1x3向量）和元数据（1x3向量）。
  - 客户端将旋转数据reshape为每个关节的3×3矩阵，并提取出全局位移。
  - 每个chunk body中的数据将作为流式动画管线的播放数据。

- MotionChunkEnd：
  - 标记运动流的结束；客户端使用此消息来确定何时已接收完所有运动数据，并进行与音频和面部流的传输情况检查。

## 表情(Face)

面部动画，也称为 ***Blend Shape Values***、***Shape Key Values*** 或 ***Morph Target Values***，被封装至face chunks中：

- FaceChunkStart：
  - 表情基名称列表：声明将被驱动的表情基名称的有序列表。
  - 数据类型：指定面部动画流的数值数据类型（float16 或 float32）。
  - （可选）时间轴位移：面部数据的第一帧与音频数据的第一帧之间的偏移量。

- FaceChunkBody：
  - 包含动画帧的打包浮点数据。每帧按照 FaceChunkStart 中声明的相同顺序存储 morph target 值。
  - 每个 body 将其帧数贡献给流式运行时管道。

- FaceChunkEnd：
  - 标记面部动画流的结束；客户端使用此消息来确定何时已接收所有面部表情数据，并进行与音频和动作流的传输情况检查。

## 音频(Audio)

原始音频PCM数据被封装至audio chunks中：

- AudioChunkStart：
  - 声明以Hz为单位的音频采样率（例如，16000、24000、48000）。
  - 指定音频通道数（例如，1表示单声道，2表示立体声）。
  - 定义每个采样的字节宽度（例如，2表示16位PCM）。

- AudioChunkBody：
  - 包含字节形式存储的原始PCM音频。
  - 每个chunk的持续时间通过字节大小除以（采样率 × 通道数 × 采样宽度）进行计算。
  - Chunk body被添加到流式动画管线的音频队列，并按顺序进行播放。

- AudioChunkEnd：
  - 标记音频流的结束；客户端使用此消息来确定何时已接收所有音频数据，并进行传输状态检查。

# 参考文献

[1] https://docs.blender.org/manual/en/latest/animation/constraints/interface/common.html#space-types

[2] https://blenderartists.org/t/what-is-different-local-space-and-pose-space/578162/5

