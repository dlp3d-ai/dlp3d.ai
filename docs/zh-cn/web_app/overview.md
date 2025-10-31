# 概览

Web App提供直观的图形界面，用于定制3D角色并与之交互。根据用户是否已进入聊天会话，Web App可分为两部分：**Web前端** 和 **Web客户端**。Web客户端基于[Babylon.js](https://babylonjs.com/)开发，并集成至一个通过[`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app)创建的[Next.js](https://nextjs.org/)项目中。

## 核心功能

- 用户认证：支持登录状态管理。认证状态通过Redux全局管理，并持久化到本地存储，确保会话连续性。

- 角色定制：支持定制角色模型、大语言模型（LLM）服务商、人设、音色背景环境。

- 实时AI聊天：与虚拟角色聊天只需要按下麦克风按钮并讲话，系统集成了LLM、语音识别技术（ASR）和文本转语音技术（TTS），实现自然的语音/文本对话。系统支持多轮对话，且历史对话存储于数据库中，作为角色的记忆。此外，为保证实时体验，消息以流式方式进行传输。

- 聊天状态管理：使用有限状态机（FSM）管理与3D角色对话的生命周期，确保稳健的角色响应与可靠的状态切换。

- 运行时动画管线：由于应用以流式方式实时传输角色的音频、面部表情与身体动作，系统实现了健壮的运行时动画管线以接收、组织并播放流式数据，内置自适应动作平滑、断流恢复与网络健康度评估等机制，以确保响应性与交互性。

- 高效资源管理：对于可复用资源（如待机动画），使用浏览器数据库（IndexedDB） 高效缓存数据，避免冗余网络请求，并减少加载时间。

- 高级图形特性：内置**实现追踪**与**布料仿真**，用于增强与角色互动的真实感。实现追踪机制通过约束眼部关节旋转，使得角色可以自然地看向用户。布料仿真基于[Havok Physics](https://www.havok.com/havok-physics/)实现，为服饰与配件提供动态变形效果。

## 项目结构

```text
dlp3d.ai
├── app
│   ├── api
│   ├── babylon
│   ├── components
│   ├── constants
│   ├── contexts
│   ├── data_structures
│   ├── features
│   ├── hooks               # 可复用的状态组件
│   ├── layouts
│   ├── library/babylonjs   # Web客户端核心实现
│   │   ├── config          # 角色与后端服务配置
│   │   ├── core            # 基础类型定义等
│   │   ├── runtime         # 运行时模块
│   │   │   ├── animation   # 运行时动画数据结构定义、角色动画模块
│   │   │   ├── asset       # 资产管理、动作资产下载
│   │   │   ├── audio       # 流式音频播放器
│   │   │   ├── camera      # 相机实现
│   │   │   ├── character   # 角色实现、视线追踪机制等
│   │   │   ├── fsm         # 状态机实现
│   │   │   ├── gui         # 图形用户界面实现
│   │   │   ├── io          # 动作文件服务、流式数据传输结构定义
│   │   │   ├── light       # 光照设置
│   │   │   ├── physics     # 布料模拟实现
│   │   │   ├── request     # 用于向orchestrator/后端API发起HTTP请求
│   │   │   ├── stream      # 流式数据管理
│   │   │   └── runtime.ts  # 动作、音频、面部表情的播放与同步
│   │   ├── globalState.ts  # 存储全局变量
│   │   ├── onSceneReady.ts # 场景初始化 
│   │   └── utils           # 辅助函数与工具，例如日志工具
│   ├── request
│   ├── store
│   ├── styles
│   ├── themes
│   ├── types
│   └── utils
├── configs
├── dockerfiles
├── docs
└── public
```

## 核心组件

### 流(Stream)

动画以流式方式上传和接收，基于此，我们设计并实现了一系列数据结构以高效处理[流式数据](stream_data.md)：

- [**orchestrator_v4_pb**](https://github.com/dlp3d-ai/dlp3d.ai/blob/main/app/library/babylonjs/runtime/io/orchestrator_v4_pb.d.ts)：基于Protobuf定义流式数据传输结构。

- [**StreamChunk**](https://github.com/dlp3d-ai/dlp3d.ai/blob/main/app/library/babylonjs/runtime/stream/streamChunk.ts)：解析带有类型标识与索引信息的原始WebSocket数据包。

- [**StreamBlock**](https://github.com/dlp3d-ai/dlp3d.ai/blob/main/app/library/babylonjs/runtime/stream/streamBlock.ts)：将动画数据组织为Babylon能够直接播放的格式。

- [**NetworkStream**](https://github.com/dlp3d-ai/dlp3d.ai/blob/main/app/library/babylonjs/runtime/stream/networkStream.ts)：追踪用户网络状况，通过特定性能指标进行健康度分析。

我们采用以下组件来管理流连接：

- [**Orchestrator客户端**](https://github.com/dlp3d-ai/dlp3d.ai/blob/main/app/library/babylonjs/runtime/stream/orchestratorClient.ts)。Web客户端不直接与LLM、TTS或其它AI服务通信，而是与orchestrator交互。Orchestrator客户端处理与 orchestrator服务的WebSocket通信，支持音频、面部表情与动作数据的流式传输。客户端提供完整的流媒体处理能力，包括数据转换、多通道流缓冲、流状态管理与错误处理。

- [**自适应流式动画缓冲区评估器**](https://github.com/dlp3d-ai/dlp3d.ai/blob/main/app/library/babylonjs/runtime/stream/adaptiveBufferSizeEstimator.ts)。由于用户与后端服务的网络状况存在不确定性，动画播放速率可能超过流式数据接收速率。当Web客户端的流式动画被播放完时，角色的动作将暂停，此时需要确定，继续播放所需的流式动画缓冲区大小。自适应流式动画缓冲区评估器会根据网络流接收模式动态调整缓冲大小，以确保流畅的播放体验。

#### 运行时管线(Runtime Pipeline)

运行时管线是管理角色流式动画的核心系统。管线由两个部分组成：

- [**运行时动画组(RuntimeAnimationGroup)**](https://github.com/dlp3d-ai/dlp3d.ai/blob/main/app/library/babylonjs/runtime/animation/runtimeAnimationGroup.ts)。存储不同类型的角色动画（长idle动画、本地动画、流式动画），包含骨骼与表情数据。

- [**运行时组件(Runtime)**](https://github.com/dlp3d-ai/dlp3d.ai/blob/main/app/library/babylonjs/runtime/runtime.ts)。Runtime通过控制动画时钟来更新角色的音频、动作与表情；内置的动作平滑算法可以确保在不同动画类型缓冲之间无缝切换；对于物理仿真，Runtime负责将骨骼动画与物理解算效果进行同步。

### 有限状态机(Finite State Machine, FSM)

有限状态机是Web客户端的的大脑，用于管理与3D角色对话的生命周期，并确保稳健的角色响应与可靠的状态切换。状态机定义了一系列状态，并根据一定的条件在这些状态之间进行转换。有限状态机使用基于条件的事件队列来处理外部事件，例如用户交互、网络请求，其核心职责包括：角色加载、资产下载、网络流生命周期管理、控制运行时管线的动画播放、错误处理与断流恢复。更多细节请参考 [有限状态机](fsm.md)。

### 资产管理器(Asset Manager)

[资产管理器](https://github.com/dlp3d-ai/dlp3d.ai/blob/main/app/library/babylonjs/runtime/asset/assetManager.ts)负责从后端服务请求资产，并将其转换为可在运行时使用的数据，同时利用浏览器的数据库高效缓存可复用资源（如角色模型、道歉音频、待机动画等），避免冗余网络请求并减少加载时间。静态资产（如动作文件）通过 [动作文件客户端](https://github.com/dlp3d-ai/dlp3d.ai/blob/main/app/library/babylonjs/runtime/asset/motionFileClient.ts)进行下载。由于不同的用户设定可能会导致资产发生变化（例如通过TTS修改了角色的音色），这些可能发生变化的资产则通过orchestrator客户端生成。

### 角色(Character)

用于管理3D角色模型、动画与物理的模块。每个角色均由原始MMD格式转换为*glTF*格式以支持Web客户端加载。一个角色通常包含以下核心组件：

- **运行时动画组(RuntimeAnimationGroup)**：存储不同类型的角色动画（长idle动画、本地动画、流式动画），包含骨骼与表情数据
- **动态骨骼解算器(DynamicBoneSolver)**：处理服装与头发的物理模拟
- **网格及骨骼(Meshes & Skeletons)**：网格数据与骨骼结构
- **关系及情绪(Relationship & Emotion)**：用户与角色的关系阶段以及角色的情绪状态
- **目光追踪器(EyeTrackingController)**：约束眼部关节，使其自然地看向用户

### 图形用户界面(GUI)

管理聊天中的UI元素，包含音频控制模块、断流提示及情绪&关系可视化。音频控制模块用于控制用户是否正在和角色讲话；对于断流提示，当流式动画播放殆尽时，GUI 聊天界面会给出相应的视觉提示，提醒用户数据流处于正在恢复状态；当角色情绪或其与用户的关系发生变化时，相应内容将以交互方式呈现。

### 物理(Physics)

用于在实时交互过程中，为服饰、头发与配件提供动态且物理可信的形变。对于动力学约束，为相互连接的骨骼添加6DOF约束；对于碰撞，动态骨骼与刚体的碰撞体是通过SDF形状进行表示的（例如：包围盒、球体、胶囊体），这种表示可以在不显著增加计算开销的情况下高效处理碰撞。所有约束都以元数据的形式存储，并会随角色模型一同下载。
