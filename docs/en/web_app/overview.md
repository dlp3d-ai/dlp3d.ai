# Overview

Web App provides an intuitive graphical interface for customizing and interacting with 3D avatars. Depending whether the user has entered a chat session, the web app can be divided into two functional parts: the **Web Fronted** and **Web Client**. The web client is developed using [Babylon.js](https://babylonjs.com/) and packaged into a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app). 

## Core Features

- User Authentication: supports login state management. Authentication state is globally managed through Redux with local storage persistence, ensuring session continuity.

- Avatar Customization: each avatar is highly configurable — including 3D models, LLMs, prompts, voices and background environments. 

- Real-time AI Chat: chatting with an embodied AI is as simple as holding the microphone button and speaking. The system integrated LLM, ASR, and TTS for natural voice/text conversations and supports multi-turn dialogue, session persistence, and real-time message streaming.

- Chat State Management: a dedicated finite state machine (FSM) governs the entire chat lifecycle, ensuring consistent behavior and reliable state transitions.

- Runtime Animation Pipeline: since the system streams character audio, facial expressions, and body motions in real time, a robust runtime animation pipeline is implemented to receive, organize, and replay streamed data, featuring mechanisms such as adaptive motion blending, connection-loss recovery, and network health estimation to ensure responsiveness and interactivity.

- Efficient Resource Management: for reusable resources such as idle animations, an asset manager leverages the browser’s IndexedDB to efficiently cache data, avoiding redundant network requests and minimizing loading time.

- Advanced 3D Features: supports **eye focus** and **cloth simulation** for enhanced realism. The eye focus mechanism constrains eye joint rotations so that the avatar naturally gazes toward the camera. The cloth simulation, powered by [Havok Physics](https://www.havok.com/havok-physics/), delivers dynamic and physically plausible clothing deformations to garments and accessories during real-time interactions.


## Project Structure

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
│   ├── hooks               # Reusable state components
│   ├── layouts
│   ├── library/babylonjs   # Web client core implementation
│   │   ├── config          # Character and backend service configuration
│   │   ├── core            # Basic type definitions, etc.
│   │   ├── runtime         # Runtime modules
│   │   │   ├── animation   # Runtime animation storage data structures, character animation modules
│   │   │   ├── asset       # Asset management, motion asset download
│   │   │   ├── audio       # Streamed audio player
│   │   │   ├── camera      # Camera implementation
│   │   │   ├── character   # Character implementation, eye tracking mechanism, etc.
│   │   │   ├── fsm         # State definitions, state machine implementation, etc.
│   │   │   ├── gui         # GUI implementation
│   │   │   ├── io          # Motion file server, Protobuf definitions
│   │   │   ├── light       # Lighting settings
│   │   │   ├── physics     # Cloth simulation implementation
│   │   │   ├── request     # http request to orchestrator/backend API
│   │   │   ├── stream      # Streamed data management
│   │   │   └── runtime.ts  # Motion, audio, and facial expression playback & synchronization
│   │   ├── globalState.ts  # Globally stored variables
│   │   ├── onSceneReady.ts # Setup scene 
│   │   └── utils           # Helper functions and tools, e.g., logger
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

## Core Components

### Stream

Animation data is uploaded and received in a streamed manner. We designed and implemented a series of data structures to efficiently manipulate the [stream data](stream_data.md):

- [**orchestrator_v4_pb**](https://github.com/dlp3d-ai/dlp3d.ai/blob/main/app/library/babylonjs/runtime/io/orchestrator_v4_pb.d.ts): Defines the Protobuf communication protocol

- [**StreamChunk**](https://github.com/dlp3d-ai/dlp3d.ai/blob/main/app/library/babylonjs/runtime/stream/streamChunk.ts): Unpacks raw WebSocket packets with type identifier and indexing info

- [**StreamBlock**](https://github.com/dlp3d-ai/dlp3d.ai/blob/main/app/library/babylonjs/runtime/stream/streamBlock.ts): Organizes animation data into time-bounded, frame-based blocks for efficient playback.

- [**NetworkStream**](https://github.com/dlp3d-ai/dlp3d.ai/blob/main/app/library/babylonjs/runtime/stream/networkStream.ts): Tracks network performance metrics for health analysis

We employ the following components to mange the stream connection:

- [**Orchestrator Client**](https://github.com/dlp3d-ai/dlp3d.ai/blob/main/app/library/babylonjs/runtime/stream/orchestratorClient.ts). The web client does not directly communicate with LLM, TTS, or other AI services. Instead, it interacts with the orchestrator. The orchestrator client handles WebSocket communication with the orchestrator service, supporting audio, facial expression, and motion data streaming. It provides complete streaming media processing functionality, including data transition, multi-stream buffering, stream state management and error handling.

- [**Adaptive Buffer Size Estimator**](https://github.com/dlp3d-ai/dlp3d.ai/blob/main/app/library/babylonjs/runtime/stream/adaptiveBufferSizeEstimator.ts). Due to varying network conditions between users and backend services, animation playback speed may exceed the stream data receiving rate. When the stream buffer is exhausted, we need to determine the optimal buffer size required for continued playback. The adaptive buffer size estimator dynamically adjusts buffer sizes based on network stream reception patterns to ensure smooth streaming playback.

#### Runtime Pipeline

The **Runtime Pipeline** is the core system responsible for organizing, and replaying streamed character animations in real-time. The pipeline is composed of two components:

- [**RuntimeAnimationGroup**](https://github.com/dlp3d-ai/dlp3d.ai/blob/main/app/library/babylonjs/runtime/animation/runtimeAnimationGroup.ts). Stores both skeletal and facial animations for characters in multiple animation buffers (long idle, local, streamed). 

- [**Runtime**](https://github.com/dlp3d-ai/dlp3d.ai/blob/main/app/library/babylonjs/runtime/runtime.ts). The runtime updates character's audio, motion and face by advancing animation clocks. The built-in motion blending system ensures seamless switch between different animation buffers. Regarding the physics, the runtime synchronizes dynamic bones with skeletal animations.

### FSM (Finite State Machine)

The brain of the 3DAC system, governing the entire chat lifecycle and ensuring consistent behavior across all system states. It defines a series of states and manages state transitions throughout the system. The FSM uses a condition-based event queue to process external events such as user interactions, network events. It's core responsibilities include: character loading, asset download, stream lifecycle management, animation playback coordination with runtime pipeline, error handling and recovery. For more details, please refer to [Finite State Machine](fsm.md)

### Asset Manager

The [asset manager](https://github.com/dlp3d-ai/dlp3d.ai/blob/main/app/library/babylonjs/runtime/asset/assetManager.ts) is responsible for requesting assets from the backend services and converting them into runtime-ready data structures, which leverages the browser's *IndexedDB* to efficiently cache reusable resources (such as idle animations, audio clips, and character models), avoiding redundant network requests and minimizing loading time. Static assets like motion files are downloaded via the [motion file client](https://github.com/dlp3d-ai/dlp3d.ai/blob/main/app/library/babylonjs/runtime/asset/motionFileClient.ts). Assets that may varies with the user settings, e.g., audio is determined by the TTS choice, are generated using the orchestrator client.

### Character

The module for managing 3D character models, animations, and physics. Each character is converted from raw MMD to *glTF* format for web compatibility. A character has the following core components:

- **RuntimeAnimationGroup**: Stores multiple animation buffers(long idle, local, streamed) that contains skeletal and facial animations
- **DynamicBoneSolver**: Handles cloth and hair physics simulation
- **Meshes & Skeletons**: mesh data and bone hierarchy
- **Relationship & Emotion**: Tracks relationship stage with user and character emotional states
- **EyeTrackingController**: Constrains eye joints to naturally gaze toward the user

### GUI

Manages GUI elements within the chat. The audio controls is used to determine whether the user is talking to the character. When the stream data is exhausted, the GUI system will give visual feedback indicating that the stream is in recovery status. The character's emotional change, as well as the relationship with the user, will also be displayed in an interactive manner.

### Physics

This delivers dynamic and physically plausible deformations to garments, hair, and accessories during real-time interactions. For dynamics, 6DOF constraints are added to the connected bones. For collisions, dynamic bones and rigid bodies are presented as SDF shapes(e.g., box, sphere, capsule). Hence, we can efficiently handle collisions without notable computational overhead. All constraints are stored as physics metadata and will be downloaded with the character model together.
