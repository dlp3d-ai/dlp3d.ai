# Overview

```text
- contexts
    - BabylonJSContext           # Create Babylon context, initialize engine, physics, maintain global state, etc.
- hooks                          # Reusable state components
    - useAudioStream             # Streaming audio upload
    - useBabylonJS               # Access Babylon scene from other parts of the frontend
    - useWebSocket               # WebSocket connection
- library/babylonjs              # Core implementation
    - config                     # Character and cloud service configuration
    - core                       # Basic type definitions, etc.
    - runtime                    # Runtime modules
        - asset                  # Asset management, motion asset download
        - animation              # Runtime animation storage data structures, character streaming animation modules
        - audio                  # Streaming audio player
        - camera                 # Camera implementation
        - character              # Character implementation, eye tracking mechanism, etc.
        - fsm                    # State definitions, state machine implementation, etc.
        - gui                    # GUI implementation
        - io                     # Motion file server, orchestrator PB data structure definitions
        - light                  # Lighting settings
        - physics                # Cloth simulation implementation
        - stream                 # Streaming behavior management (data structure definitions, orchestrator client, adaptive buffer evaluation)
        - runtime.ts             # Runtime pipeline, manages motion, audio, and facial expression synchronization
    - utils
        - arithmetic             # Floating point data parsing and conversion
        - array                  # Basic container operations
        - logger                 # Log management
        - ...
    - globalState.ts             # Scene global state
    - onSceneReady.ts            # Scene initialization
```