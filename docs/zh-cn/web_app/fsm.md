# 有限状态机

状态机是3DAC系统的大脑，用于管理整个聊天生命周期，并确保所有系统状态的协调一致。它定义了一系列状态，并在整个系统运行过程中进行状态切换。状态机使用基于条件的事件队列来处理外部信号，如用户交互、网络事件等，包含两个阶段：

- **系统启动**：确保在进入聊天之前所有静态和运行时资源可用，包括环境模型、角色网格、本地动画（例如，道歉行为的音频/动作/面部）。它还会生成开场白作为虚拟形象的第一句话。

- **交互对话**：当用户进入聊天时触发，系统编排流生命周期管理，同步动画播放与运行时管道，并应用强大的错误处理和恢复功能，以提供无缝的聊天体验。

下图展示了状态机的整体工作流程：

<div style="text-align: center;">
  <img src="../_static/en/web_app/fsm.jpg" style="width: 100%; max-width: 100%;">
  <p><em>状态机</em></p>
</div>

# 状态

<a id="init"></a>
## `INIT`

- 初始化 FSM 系统。
- 转换到：
    - [`WAITING_FOR_FRONTEND_READY`](#waiting_for_frontend_ready)：当初始化完成时。

<a id="waiting_for_frontend_ready"></a>
## `WAITING_FOR_FRONTEND_READY`

- 等待Babylon场景准备就绪。
- 转换到：
    - [`SPAWN_ENVIRONMENT`](#spawn_environment)：当收到 `FRONTEND_READY` 条件时。
    - [`EXIT`](#exit)：当场景启动超时时。

<a id="spawn_environment"></a>
## `SPAWN_ENVIRONMENT`

- 使用用户设置加载HDR环境和地面模型。
- 转换到：
    - [`SPAWN_CHARACTER`](#spawn_character)：当场景设置成功后。
    - [`EXIT`](#exit)：当环境设置失败时。

<a id="spawn_character"></a>
## `SPAWN_CHARACTER`

- 加载角色配置和资源。
- 转换到：
    - [`WAITING_FOR_ALGORITHM_READY_ON_START`](#waiting_for_algorithm_ready_on_start)：当角色成功添加到场景时。
    - [`EXIT`](#exit)：当配置获取或模型加载失败时。

<a id="waiting_for_algorithm_ready_on_start"></a>
## `WAITING_FOR_ALGORITHM_READY_ON_START`

- 对算法服务进行健康检查并验证流缓冲区。
- 转换到：
    - [`CHECK_AND_UPDATE_ASSETS`](#check_and_update_assets)：当健康检查和网络流检查通过时。
    - [`ALGORITHM_GENERATION_FAILED`](#algorithm_generation_failed)：当健康检查或网络流检查失败时。

<a id="check_and_update_assets"></a>
## `CHECK_AND_UPDATE_ASSETS`

- 将角色本地动作/音频/面部同步到运行时组件(Runtime)，并生成开场白。
- 转换到：
    - [`WAITING_FOR_USER_START_GAME`](#waiting_for_user_start_game)：当同步和生成完成时。
    - [`EXIT`](#exit)：当发生任何错误时。

<a id="waiting_for_user_start_game"></a>
## `WAITING_FOR_USER_START_GAME`

- 等待用户开始聊天，并开始缓冲开场白的流式数据。
- 转换到：
    - [`ACTOR_ANIMATION_STREAMING`](#actor_animation_streaming)：当收到`USER_START_GAME`条件，且开场白仍在流式传输时。
    - [`WAITING_FOR_ACTOR_ANIMATION_FINISHED`](#waiting_for_actor_animation_finished)：当收到`USER_START_GAME`条件，且开场白已完全接收时。
    - [`EXIT`](#exit)：当麦克风检查失败，或开场白数据缺失时。

<a id="idle"></a>
## `IDLE`

- 待机时监听用户输入。
- 转换到：
    - [`WAITING_FOR_USER_STOP_RECORDING`](#waiting_for_user_stop_recording)：当收到`USER_START_RECORDING`条件时。

<a id="waiting_for_user_stop_recording"></a>
## `WAITING_FOR_USER_STOP_RECORDING`

- 用户正在上传音频。
- 转换到：
    - [`WAITING_FOR_LOCAL_ANIMATION_INTERRUPTED`](#waiting_for_local_animation_interrupted)：当收到 `USER_STOP_RECORDING`条件时。

<a id="waiting_for_local_animation_interrupted"></a>
## `WAITING_FOR_LOCAL_ANIMATION_INTERRUPTED`

- 等待本地动画中断。
- 转换到：
    - [`WAITING_FOR_ACTOR_RESPOND_GENERATION_FINISHED`](#waiting_for_actor_respond_generation_finished)：当收到 `ANIMATION_FINISHED`信号时。

<a id="waiting_for_actor_respond_generation_finished"></a>
## `WAITING_FOR_ACTOR_RESPOND_GENERATION_FINISHED`

- 等待算法响应生成。
- 转换到：
    - [`WAITING_FOR_USER_STOP_RECORDING`](#waiting_for_user_stop_recording)：当收到`USER_START_RECORDING`信号时。
    - [`ACTOR_ANIMATION_STREAMING`](#actor_animation_streaming)：当动画开始流式传输时。
    - [`WAITING_FOR_ACTOR_LEAVING_FINISHED`](#waiting_for_actor_leaving_finished)：当算法服务的响应类型为`leave`时。
    - [`ALGORITHM_GENERATION_FAILED`](#algorithm_generation_failed)：当算法服务未能返回有效流数据时。
    - [`WAITING_FOR_STREAMED_ANIMATION_INTERRUPTED`](#waiting_for_streamed_animation_interrupted)：当收到`USER_INTERRUPT_ANIMATION`信号时。

<a id="actor_animation_streaming"></a>
## `ACTOR_ANIMATION_STREAMING`

- 接收流式数据，并发送到流式动画管线。如果流式动画缓冲区耗尽，则处理断流/恢复事件。
- 转换到：
    - [`WAITING_FOR_ACTOR_ANIMATION_FINISHED`](#waiting_for_actor_animation_finished)：当流结束，或收到播放完成信号时。
    - [`WAITING_FOR_STREAMED_ANIMATION_INTERRUPTED`](#waiting_for_streamed_animation_interrupted)：当收到`USER_INTERRUPT_ANIMATION`信号时。
    - [`ALGORITHM_GENERATION_FAILED`](#algorithm_generation_failed)：当流不可用，或发生未知错误时。

<a id="waiting_for_streamed_animation_interrupted"></a>
## `WAITING_FOR_STREAMED_ANIMATION_INTERRUPTED`

- 中断流式动画，返回聆听状态并重新开始音频录制。
- 转换到：
    - [`WAITING_FOR_USER_STOP_RECORDING`](#waiting_for_user_stop_recording)：当打断行为发送到流式动画管线，且音频录制开始时。

<a id="waiting_for_actor_animation_finished"></a>
## `WAITING_FOR_ACTOR_ANIMATION_FINISHED`

- 等待角色动画完成，并检查关系和情感状态更新。
- 转换到：
    - [`IDLE`](#idle)：当收到`ANIMATION_FINISHED`信号时。
    - [`WAITING_FOR_STREAMED_ANIMATION_INTERRUPTED`](#waiting_for_streamed_animation_interrupted)：当收到`USER_INTERRUPT_ANIMATION`信号时。

<a id="waiting_for_actor_leaving_finished"></a>
## `WAITING_FOR_ACTOR_LEAVING_FINISHED`

- 等待离场动画完成。
- 转换到：
    - [`EXIT`](#exit)：当收到`ANIMATION_FINISHED`信号时。

<a id="algorithm_generation_failed"></a>
## `ALGORITHM_GENERATION_FAILED`

- 切换到本地错误/道歉动画。
- 转换到：
    - [`WAITING_FOR_ACTOR_APOLOGIZE_FINISHED`](#waiting_for_actor_apologize_finished)：当切换动画信号发送到流式动画管线时。

<a id="waiting_for_actor_apologize_finished"></a>
## `WAITING_FOR_ACTOR_APOLOGIZE_FINISHED`

- 等待道歉动画完成。
- 转换到：
    - [`IDLE`](#idle)：当收到`ANIMATION_FINISHED`信号时。


<a id="exit"></a>
## `EXIT`

- 终止状态机，并通知用户。
- 转换到：
    - （终端状态）

