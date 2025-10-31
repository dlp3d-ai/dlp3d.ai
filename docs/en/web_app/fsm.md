# Finite State Machine

FSM is the brain of the 3DAC system, governing the entire chat lifecycle and ensuring consistent behavior across all system states. It defines a series of states and makes state transitions throughout the system. The FSM uses a condition-based event queue to process external signals such as user interactions, network events, which consists of 2 stages:

- **System Startup**: Ensures that all static and runtime assets are available before entering the chat, including environment model, character mesh, local animations(e.g., audio/motion/face for apologize behavior). It also generates an opening remark as the avatar's first sentence. 

- **Interactive Conversation**: Triggered when the user enters the chat, the system orchestrates stream lifecycle management, synchronizes animation playback with the runtime pipeline, and applies robust error handling and recovery to deliver a seamless chat experience.

The following figure illustrates the overall workflow of FSM:

<div style="text-align: center;">
  <img src="../_static/en/web_app/fsm.jpg" style="width: 100%; max-width: 100%;">
  <p><em>FSM</em></p>
</div>

# States

<a id="init"></a>
## `INIT`

- Initialize the FSM system.
- Transit to:
    - [`WAITING_FOR_FRONTEND_READY`](#waiting_for_frontend_ready) when initialization finished.

<a id="waiting_for_frontend_ready"></a>
## `WAITING_FOR_FRONTEND_READY`

- Wait for Babylon scene to be ready.
- Transit to:
    - [`SPAWN_ENVIRONMENT`](#spawn_environment) when received `FRONTEND_READY` condition.
    - [`EXIT`](#exit) when scene startup timed out.

<a id="spawn_environment"></a>
## `SPAWN_ENVIRONMENT`

- Load HDR environment and ground model using user settings.
- Transit to:
    - [`SPAWN_CHARACTER`](#spawn_character) after scene setup succeeds.
    - [`EXIT`](#exit) when environment setup fails.

<a id="spawn_character"></a>
## `SPAWN_CHARACTER`

- Loads character configuration and assets.
- Transit to:
    - [`WAITING_FOR_ALGORITHM_READY_ON_START`](#waiting_for_algorithm_ready_on_start) when the character is successfully added to the scene.
    - [`EXIT`](#exit) when configuration fetch or model loading fails.

<a id="waiting_for_algorithm_ready_on_start"></a>
## `WAITING_FOR_ALGORITHM_READY_ON_START`

- Health-check for algorithm services and validate stream buffer.
- Transit to:
    - [`CHECK_AND_UPDATE_ASSETS`](#check_and_update_assets) when health-check and stream evaluation passed.
    - [`ALGORITHM_GENERATION_FAILED`](#algorithm_generation_failed) when health-check or stream evaluation failed.

<a id="check_and_update_assets"></a>
## `CHECK_AND_UPDATE_ASSETS`

- Sync character local motion/audio/face into runtime and generate opening remark.
- Transit to:
    - [`WAITING_FOR_USER_START_GAME`](#waiting_for_user_start_game) when synchronization and generation finished.
    - [`EXIT`](#exit) if any error occurs.

<a id="waiting_for_user_start_game"></a>
## `WAITING_FOR_USER_START_GAME`

- Wait for user to start chat and accumulate opening remark stream.
- Transit to:
    - [`ACTOR_ANIMATION_STREAMING`](#actor_animation_streaming) when received `USER_START_GAME` condition and the opening remark is still streaming.
    - [`WAITING_FOR_ACTOR_ANIMATION_FINISHED`](#waiting_for_actor_animation_finished) when received `USER_START_GAME` condition and the opening remark is fully received.
    - [`EXIT`](#exit) when microphone check fails or opening remark data is missing.

<a id="idle"></a>
## `IDLE`

- Default rest state, which listens for the user input.
- Transit to:
    - [`WAITING_FOR_USER_STOP_RECORDING`](#waiting_for_user_stop_recording) when received `USER_START_RECORDING` condition.

<a id="waiting_for_user_stop_recording"></a>
## `WAITING_FOR_USER_STOP_RECORDING`

- The user is uploading audio.
- Transit to:
    - [`WAITING_FOR_LOCAL_ANIMATION_INTERRUPTED`](#waiting_for_local_animation_interrupted) when received `USER_STOP_RECORDING` condition.

<a id="waiting_for_local_animation_interrupted"></a>
## `WAITING_FOR_LOCAL_ANIMATION_INTERRUPTED`

- Wait for local animation to interrupt.
- Transit to:
    - [`WAITING_FOR_ACTOR_RESPOND_GENERATION_FINISHED`](#waiting_for_actor_respond_generation_finished) when received `ANIMATION_FINISHED` signal.

<a id="waiting_for_actor_respond_generation_finished"></a>
## `WAITING_FOR_ACTOR_RESPOND_GENERATION_FINISHED`

- Wait for algorithm response generation.
- Transit to:
    - [`WAITING_FOR_USER_STOP_RECORDING`](#waiting_for_user_stop_recording) when received `USER_START_RECORDING` signal.
    - [`ACTOR_ANIMATION_STREAMING`](#actor_animation_streaming) when the animation started streaming.
    - [`WAITING_FOR_ACTOR_LEAVING_FINISHED`](#waiting_for_actor_leaving_finished) when response type from the algorithm service is `leave`.
    - [`ALGORITHM_GENERATION_FAILED`](#algorithm_generation_failed) when algorithm service failed to return valid stream data.
    - [`WAITING_FOR_STREAMED_ANIMATION_INTERRUPTED`](#waiting_for_streamed_animation_interrupted) when received `USER_INTERRUPT_ANIMATION` signal.

<a id="actor_animation_streaming"></a>
## `ACTOR_ANIMATION_STREAMING`

- Receive and feed stream data to runtime. If the stream buffer is exhausted, handle the pause/recover event.
- Transit to:
    - [`WAITING_FOR_ACTOR_ANIMATION_FINISHED`](#waiting_for_actor_animation_finished) when stream ended or playback finished signals received.
    - [`WAITING_FOR_STREAMED_ANIMATION_INTERRUPTED`](#waiting_for_streamed_animation_interrupted) when received `USER_INTERRUPT_ANIMATION` signal.
    - [`ALGORITHM_GENERATION_FAILED`](#algorithm_generation_failed) on stream unavailable or unknown errors.

<a id="waiting_for_streamed_animation_interrupted"></a>
## `WAITING_FOR_STREAMED_ANIMATION_INTERRUPTED`

- Interrupt streamed animation, return to listen state and restart audio recording.
- Transit to:
    - [`WAITING_FOR_USER_STOP_RECORDING`](#waiting_for_user_stop_recording) when the interrupt event is sent to runtime and the audio recording started.

<a id="waiting_for_actor_animation_finished"></a>
## `WAITING_FOR_ACTOR_ANIMATION_FINISHED`

- Wait for character animation to complete and check for relationship and emotion updates.
- Transit to:
    - [`IDLE`](#idle) when received `ANIMATION_FINISHED` signal.
    - [`WAITING_FOR_STREAMED_ANIMATION_INTERRUPTED`](#waiting_for_streamed_animation_interrupted) when received `USER_INTERRUPT_ANIMATION` signal.

<a id="waiting_for_actor_leaving_finished"></a>
## `WAITING_FOR_ACTOR_LEAVING_FINISHED`

- Wait for leaving animation to complete.
- Transit to:
    - [`EXIT`](#exit) when received `ANIMATION_FINISHED` signal.

<a id="algorithm_generation_failed"></a>
## `ALGORITHM_GENERATION_FAILED`

- Switch to local error/apology animation.
- Transit to:
    - [`WAITING_FOR_ACTOR_APOLOGIZE_FINISHED`](#waiting_for_actor_apologize_finished) when the switch animation signal is sent to runtime.

<a id="waiting_for_actor_apologize_finished"></a>
## `WAITING_FOR_ACTOR_APOLOGIZE_FINISHED`

- Wait for apology animation to complete.
- Transit to:
    - [`IDLE`](#idle) when received `ANIMATION_FINISHED` signal.


<a id="exit"></a>
## `EXIT`

- Terminate state machine and notify user.
- Transit to:
    - (terminal state)
