---
sd_hide_title: true
---

# 🔎 概览

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

```{rubric} 数字生命计划 2
```
基于Web的开源3D自主角色

````{div} sd-d-flex-row
```{button-ref} getting_started/quick_start
:ref-type: doc
:color: primary
:class: sd-rounded-pill sd-mr-3

快速开始
```

```{button-link} https://dlp3d-ai.github.io/dlp3d.ai/
:color: secondary
:class: sd-rounded-pill

在线体验
```
````

::::

---

<div style="text-align: center;">
  <img src="_static/banner.jpg" style="width: 100%; max-width: 100%;">
</div>

数字生命计划 2（简称 DLP2）是一个开源的实时框架，使大语言模型（LLM）能够通过富有表现力的 3D 虚拟角色栩栩如生地呈现出来。用户可以通过语音与角色自然对话，而角色会即时生成语音、全身动画及物理模拟，并直接在浏览器中进行同步展示。角色的外观（3D 模型）与个性（角色提示词）均可完全自定义，且可无缝适配任意大语言模型或文本转语音（TTS）服务。

<div style="text-align: center;">
  <img src="_static/poster_small.jpg" style="width: 100%; max-width: 100%;">
  <p><em>亚洲计算机图形与交互技术大会 (SIGGRAPH Asia) 2025 实时技术现场秀 (Real-Time Live!), 香港</em></p>
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
