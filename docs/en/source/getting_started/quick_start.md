# Quick Start

- [System Requirements](md-system-requirements)
- [Data Preparation](md-data-preparation)
- [Start Service](md-start-service)

In this section, we introduce how to setup DLP3D services.

(md-system-requirements)=

## System Requirements

### Backend Services

### Web App

Since the web app runs on the browser, it exhibits cross- platforms and computing capabilities. 

**Desktop Devices**:

 - Windows:

 - MacOS: [MacBook Pro (16-inch, 2019)](https://support.apple.com/en-us/111932) or later

\* Note: for better performance, your screen resolution should be at least 1920x1080.

Mobile Devices:

 - Android:

 - iOS: [iPhone 12 Pro Max](https://support.apple.com/en-us/111874) or later

 - iPadOS: 

(md-data-preparation)=

## Data Preparation

To start DLP3d web service, you need to download the ONNX model file and motion data file and set up the required directory structure.

### Download ONNX Model

1. **Download the ONNX model file:**
   - **GitHub Download:** [unitalker_v0.4.0_base.onnx](https://github.com/LazyBusyYang/CatStream/releases/download/a2f_cicd_files/unitalker_v0.4.0_base.onnx)
   - **Google Drive Download:** [unitalker_v0.4.0_base.onnx](https://drive.google.com/file/d/1E0NTrsh4mciRPb265n64Dd5vR3Sa7Dgx/view?usp=drive_link)
   - **Baidu Cloud：** [unitalker_v0.4.0_base.onnx](https://pan.baidu.com/s/1A_vUj_ZBMFPbO1lgUYVCPA)（Share Code：`shre`）

2. **Download the motion data file:**
   - **Google Drive Download:** [motion_data.zip](https://drive.google.com/file/d/112pnjuIuNqADS-fAT6RUIAVPtb3VlWlq/view?usp=drive_link)
   - **Baidu Cloud：** [motion_data.zip](https://pan.baidu.com/s/1YJSuLaoDKKV7JuE0Ws89zA)（Share Code：`g64i`）

3. **Organize the data:**
   - Create a `weights` directory in your project root if it doesn't exist
   - Create a `motion_data` directory in your project root if it doesn't exist
   - Place the downloaded `unitalker_v0.4.0_base.onnx` file in the `weights` directory
   - Extract the downloaded `motion_data.zip` file to the `motion_data` directory
   - Ensure the following directory structure is created:

```
├─docker-compose.yml
├─motion_data
│   ├─motion_database.db
│   ├─blendshapes_meta
│   ├─joints_meta
│   ├─mesh_glb
│   ├─motion_files
│   ├─restpose_npz
│   └─rigids_meta
└─weights
    └─unitalker_v0.4.0_base.onnx
```
### Directory Structure Explanation

- `docker-compose.yml`: Docker Compose configuration file for running all services.
- `motion_data/`: Directory containing motion-related data files.
  - `motion_database.db`: SQLite database containing motion metadata.
  - `blendshapes_meta/`: Directory for blendshapes metadata files.
  - `joints_meta/`: Directory for joint metadata files.
  - `mesh_glb/`: Directory for 3D mesh files in GLB format.
  - `motion_files/`: Directory containing motion animation files.
  - `restpose_npz/`: Directory for rest pose data in NPZ format.
  - `rigids_meta/`: Directory for rigid body metadata files.
- `weights/`: Directory for storing ONNX model files.
  - `unitalker_v0.4.0_base.onnx`: The main ONNX model file for audio-to-face generation.

(md-start-service)=

## Start Service

The easiest way to get started with DLP3d web service is using the pre-built Docker image. First, make sure that you have [Docker Compose](https://docs.docker.com/compose/install/) correctly installed. In the provided [docker-compose.yml](https://github.com/dlp3d-ai/dlp3d.ai/blob/main/docker-compose.yml), we demonstrate how to seamlessly orchestrate all DLP3d services — including the backend, frontend, and supporting components. The DLP3D services can be started with a single command:

```bash
# cd to the project root
docker compose up
```

Wait until all the services are started. To create a web fronted window, open the browser and visit `https://127.0.0.1:18001`. For the first time visit, the browser may raise an error indicating that the connection is not private. This is because we're using a self-signed certificate. To bypass the issue, click the `Advanced` button and click `Proceed to 127.0.0.1 (unsafe)`:

<div style="text-align: center;">
  <img src="../_static/getting_started/insecure_connection.jpg" style="width: 100%; max-width: 100%;">
  <p><em>Insecure Connection Error</em></p>
</div>


If everything works well, you should see the web page:

<div style="text-align: center;">
  <img src="../_static/getting_started/fronted_window_example.jpg" style="width: 100%; max-width: 100%;">
  <p><em>Fronted Window Example</em></p>
</div>

## First Chat

### Setup Account

You need to create account or login first. Click the `Account` icon on the top-right corner of the window. Then an authentication window will popup. Enter the user name and password, then click `Sign In` button: 

<div style="text-align: center;">
  <img src="../_static/getting_started/authentication.jpg" style="width: 100%; max-width: 100%;">
  <p><em>Authentication</em></p>
</div>

Notice that if the user is not registered before, the backend will automatically create a new account for you.

Once you've successfully logged in, the UI panel will display: 

- Left: simulation settings, e.g., whether enable cloth simulation, debug mode.

- Right: chat settings, where the character's prompt, LLMs, TTS are configured.

- Top: chat list settings, you can select your desired avatar or create new avatars here.

- Bottom: entrypoint for starting a chat.

<div style="text-align: center;">
  <img src="../_static/getting_started/homepage.jpg" style="width: 100%; max-width: 100%;">
  <p><em>Home Page</em></p>
</div>


### Select Avatar

Expand the `Chat List` panel by clicking it. Then, all available avatars will be listed below:

<div style="text-align: center;">
  <img src="../_static/getting_started/chat_list.jpg" style="width: 100%; max-width: 100%;">
  <p><em>Chat List</em></p>
</div>

We provide 4 avatars by default, namely `KeQing-default`, `Furina-default`, `HuTao-default` and `Ani-default`. Notice that the default characters cannot be edited directly. Instead, you should create a new avatar by duplicating existing default avatars. You can find the duplicate button in the top-right corner of each avatar card. The newly created avatar, comparatively, can be further customized. The name at the bottom of the avatar card will be used during the chat, here we rename it as `KeQing-test` as an example:

<div style="text-align: center;">
  <img src="../_static/getting_started/duplicate_character.jpg" style="width: 100%; max-width: 100%;">
  <p><em>Duplicate Character</em></p>
</div>

### Prompt Settings

To customize an avatar’s intrinsic behaviors—such as personality, abilities, and preferences—open the `Prompt` panel on the right side of the window. Each avatar comes with a default character prompt that you can freely edit to create your own unique personality.

<div style="text-align: center;">
  <img src="../_static/getting_started/character_prompt.jpg" style="width: 100%; max-width: 100%;">
  <p><em>Prompt Settings</em></p>
</div>

### Configure LLMs

We employ LLMs to handle conversations, user behavior and relationship with avatar:

- Conversation: handles text conversations, supports multiple LLMs.

- Reaction & Classification: for emotional analysis, which analyzes user intent, character emotional changes, relationship changes and triggered actions.

- Memory: for multi-level conversation memory, emotional state tracking, relationship state management.

To enable these features, you need to configure api keys for LLMs. Open the `LLM` panel on the right side of window, then, click the `key` icon on the bottom-left side of the LLM card and save your api key on the popped window: 

<div style="text-align: center;">
  <img src="../_static/getting_started/api_key_unsaved.jpg" style="width: 100%; max-width: 100%;">
  <p><em>LLM Settings</em></p>
</div>

### Configure TTS

