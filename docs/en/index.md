---
sd_hide_title: true
---

# 🔎 Overview

::::{grid}
:reverse:
:gutter: 3 4 4 4
:margin: 1 2 1 2

:::{grid-item}
:columns: 12 4 4 4

:::

:::{grid-item}
:columns: 12 8 8 8
:child-align: justify
:class: sd-fs-5

```{rubric} Digital Life Project
```
Embodying Large Language Models on the Web

````{div} sd-d-flex-row
```{button-ref} getting_started/quick_start
:ref-type: doc
:color: primary
:class: sd-rounded-pill sd-mr-3

Quick Start
```

```{button-link} https://dlp3d.ai
:color: secondary
:class: sd-rounded-pill

Live Demo
```
````

::::

---

dlp3d\.ai is a web platform that embodies Large Language Models in interactive 3D avatars. Users converse by voice, while avatars respond with speech, expressions, and gestures that adapt to context, mood, and relationship. Characters are fully customizable, including 3D models, LLMs, prompts, and voices.

The project embodies LLMs in responsive, expressive 3D avatars by designing an end-to-end real-time framework that unifies audio, language, and animation in the browser.

Our technical contributions include three main breakthroughs in the real-time space: 

- Hybrid multi-LLM orchestration for expressive, adaptive behavior. 

- An efficient streaming animation pipeline that operates across web constraints.

- Robust mechanisms for interruption, resource management, and fault tolerance.

On the backend, our flexible modular framework includes key components such as Automatic Speech Recognition (ASR), a collaborative mixture of large and small language models, and Text-to-Speech (TTS) voice synthesis. Besides the main LLM that produces the character's response, lightweight LLMs run concurrently and can override the main LLM (e.g., when the character has to reject a user’s request or exit the conversation), and analyze the character's response to maintain emotion and relationship parameters, generating motion keywords to trigger semantically rich and expressive motions where appropriate without stalling interaction. To enhance efficiency, we segment the character's speech into sub-sentences, align audio with timestamps, and perform motion retrieval in parallel. This hybrid pipeline ensures smooth, semantically accurate motion synthesis synchronized to voice.

To further enhance real-time performance, we design a custom data structure with a unified skeleton header encoded in Protocol Buffers. This design maintains constant width with dynamic length, allowing efficient streaming of motion, expression, and audio.

On the frontend, we design a streaming animation pipeline distinct from traditional game engines. Instead of relying solely on local assets, our system streams animations in real time, blending streamed and local data for low-latency playback. We also implement adaptive buffering to match users' bandwidth and seamless recovery during connection loss.

This work offers both a practical system for virtually embodied AI and a blueprint for fusing multi-modal intelligence with real-time graphics.

```{toctree}
:hidden:
:maxdepth: 2
getting_started/quick_start.md
```

```{toctree}
:hidden:
:caption: Web App
:maxdepth: 2

web_app/overview.md
web_app/build_from_source.md
web_app/runtime_pipeline.md
web_app/stream_data.md
web_app/fsm.md
```

```{include} _subrepos_index.md
```