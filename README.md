<div align="center">
    <img src="docs/_static/banner.jpg"/>
</div>

<br/>

<div align="center">

**SIGGRAPH Asia 2025 (Real-Time Live!), Hong Kong**

> **English** | [中文](docs/README_CN.md)

</div>

<p align="center">
  <a href="https://dlp3d.ai/"><img src="https://img.shields.io/badge/Try%20it-dlp3d.ai-232C4B?style=flat"></a>
  <a href="https://www.youtube.com/watch?v=cNEMW6IHKl8"><img src="https://img.shields.io/badge/%20Demo-YouTube-FF0000?style=flat&logo=youtube&logoColor=white"></a>
  <a href="https://x.com/dlp3d_ai"><img src="https://img.shields.io/badge/Digital%20Life%20Project-%232d2e30?style=flat&logo=x&labelColor=%23101419&color=%232d2e30"></a>
  <a href="https://www.xiaohongshu.com/user/profile/678df66a000000000d008dd1"><img src="https://img.shields.io/badge/Digital%20Life%20Project-%232d2e30?style=flat&logo=xiaohongshu&labelColor=%23101419&color=%23FF2442"></a>
  <a href="https://discord.gg/XYXuBn9R8c"><img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fdiscord.com%2Fapi%2Finvites%2FXYXuBn9R8c%3Fwith_counts%3Dtrue&query=%24.approximate_member_count&suffix=%20members&logo=discord&logoColor=white&label=%20&color=7389D8&labelColor=6A7EC2"></a>
  <a href="https://deepwiki.com/dlp3d-ai/dlp3d.ai"><img src="https://deepwiki.com/badge.svg"></a>
  <a href="https://dlp3d.readthedocs.io/en/latest/index.html"><img src="https://img.shields.io/badge/Docs-EN-2C5282?style=flat&logo=readthedocs"></a>
  <a href="https://dlp3d.readthedocs.io/zh-cn/latest/"><img src="https://img.shields.io/badge/文档-%E4%B8%AD%E6%96%87-2C5282?style=flat&logo=readthedocs"></a>
  <a href="https://github.com/dlp3d-ai/dlp3d.ai/blob/main/LICENSE"><img src="https://img.shields.io/github/license/dlp3d-ai/dlp3d.ai?style=flat"></a>
</p>

## Overview
Digital Life Project 2 (DLP3D) is an open-source real-time framework that brings Large Language Models (LLMs) to life through expressive 3D avatars. Users converse naturally by voice, while characters respond on demand with unified audio, whole-body animation, and physics simulation directly in the browser. Characters are fully customizable in both appearance (3D models) and personality (character prompts) and readily adaptable to any LLM or text-to-speech (TTS) service. 

<div align="center">
    <a href="https://www.youtube.com/watch?v=cNEMW6IHKl8">
    <img src="docs/_static/poster_small.jpg" alt="Watch the video">
    [Click to Watch the Demo Video]
    </a>
</div>

## Content

This organization contains the following key repositories:

- **[dlp3d.ai](https://github.com/dlp3d-ai/dlp3d.ai): the main entry point, start here!**
- [orchestrator](https://github.com/dlp3d-ai/orchestrator): coordinates and synchronizes all components.
- [web_backend](https://github.com/dlp3d-ai/web_backend): manages the backend web services.
- [speech2motion](https://github.com/dlp3d-ai/speech2motion): converts speech into body animation.
- [audio2face](https://github.com/dlp3d-ai/audio2face): generates facial animation from audio.
- [MotionDataViewer](https://github.com/dlp3d-ai/MotionDataViewer): visualizes and inspects motion data.

## Get Started

- Option 1: Check out **[Quick Start](https://dlp3d.readthedocs.io/en/latest/getting_started/quick_start.html)** to deploy your own DLP3D locally! You’ll need to provide your own API keys, but you’ll have complete freedom to modify, extend, and integrate the system into anything you like.

- Option 2: Visit **[https://dlp3d.ai](https://dlp3d.ai/)** to to enjoy a ready-to-play hosted service — entirely free, including complimentary API access to selected providers (recommended for users in mainland China for the smoothest experience)! 


## License and Copyrights

While DLP3D itself is distributed under the [MIT License](LICENSE), we remind users to comply with the licenses and terms of any third-party or community assets (e.g., 3D models) included or referenced in the project. Certain materials may feature characters from Genshin Impact by HoYoverse (MiHoYo). The 3D models used are from HoYoverse’s official release and are utilized in accordance with their fan content policy, which permits non-commercial, personal, and educational use. These materials are presented solely for illustrative and academic purposes and do not imply any official affiliation or endorsement by HoYoverse.


## Citations
Digital Life Project 2 (SIGGRAPH Asia 2025)
```
@inproceedings{dlp3d,
    author    = {Cai, Zhongang and Ren, Daxuan and Gao, Yang and Wei, Yukun and Zhou, Tongxi and Lin, Zhengyu and Jang, Huimuk and Zeng, Haoyang and Loy, Chen Change and Liu, Ziwei and Yang, Lei},
    title     = {Digital Life Project 2: Open-source Autonomous 3D Characters on the Web},
    booktitle = {SIGGRAPH Asia 2025 Real-Time Live!},
    year      = {2025},
    pages     = {3},
    isbn      = {9798400721359},
    publisher = {Association for Computing Machinery},
    address   = {New York, NY, USA},
    url       = {https://doi.org/10.1145/3757375.3774342},
    doi       = {10.1145/3757375.3774342},
    abstract  = {Digital Life Project 2 (DLP2) presents an open-source real-time framework that brings Large Language Models (LLMs) to life through expressive 3D avatars. Users converse naturally by voice, while characters respond on demand with unified audio, whole-body animation, and physics simulation directly in the browser. At its core are: (1) an agentic orchestration of large and small LLMs that governs character behavior, supported by a memory system tracking emotional states and evolving relationships to enable context-dependent reactions; (2) a hybrid real-time pipeline that segments long LLM responses, performs parallel motion retrieval and audio-motion synchronization, and streams efficiently through a custom Protocol Buffers structure for low-latency playback of voice, motion, and expression; and (3) robust mechanisms for user interruption handling, adaptive buffering, and fault tolerance. Characters are fully customizable in both appearance (3D models) and personality (character prompts) and readily adaptable to any LLM or text-to-speech (TTS) service. DLP2 demonstrates how LLMs can be embodied in responsive 3D characters, offering a practical blueprint for real-time, emotionally adaptive digital interactions on the web.},
    articleno = {3},
    numpages  = {2},
    location  = {Hong Kong Convention and Exhibition Centre, Hong Kong, Hong Kong},
    series    = {SA '25}
}
```
Digital Life Project (CVPR 2024) [[Homepage]](https://digital-life-project.com/)
```
@InProceedings{dlp,
    author    = {Cai, Zhongang and Jiang, Jianping and Qing, Zhongfei and Guo, Xinying and Zhang, Mingyuan and Lin, Zhengyu and Mei, Haiyi and Wei, Chen and Wang, Ruisi and Yin, Wanqi and Pan, Liang and Fan, Xiangyu and Du, Han and Gao, Peng and Yang, Zhitao and Gao, Yang and Li, Jiaqi and Ren, Tianxiang and Wei, Yukun and Wang, Xiaogang and Loy, Chen Change and Yang, Lei and Liu, Ziwei},
    title     = {Digital Life Project: Autonomous 3D Characters with Social Intelligence},
    booktitle = {Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR)},
    month     = {June},
    year      = {2024},
    pages     = {582-592}
}
```
