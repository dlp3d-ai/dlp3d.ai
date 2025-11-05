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

```{rubric} Digital Life Project 2
```
Open-source Autonomous 3D Characters on the Web

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

<div style="text-align: center;">
  <img src="_static/banner.jpg" style="width: 100%; max-width: 100%;">
</div>

Digital Life Project 2 (DLP2) is an open-source real-time framework that brings Large Language Models (LLMs) to life through expressive 3D avatars. Users converse naturally by voice, while characters respond on demand with unified audio, whole-body animation, and physics simulation directly in the browser. Characters are fully customizable in both appearance (3D models) and personality (character prompts) and readily adaptable to any LLM or text-to-speech (TTS) service. 

<div style="text-align: center;">
  <img src="_static/poster_small.jpg" style="width: 100%; max-width: 100%;">
  <p><em>SIGGRAPH Asia 2025 (Real-Time Live!), Hong Kong</em></p>
</div>

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
web_app/stream_data.md
web_app/fsm.md
```

```{include} _subrepos_index.md
```