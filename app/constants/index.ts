// Social media links
export const SOCIAL_LINKS = [
  // { href: 'https://youtube.com/', className: 'youtube', title: 'YouTube', label: 'YouTube' },
  // { href: 'https://x.com/dlp3d_ai', className: 'instagram', title: 'Instagram', label: 'Instagram' },
  {
    href: 'https://x.com/dlp3d_ai',
    className: 'twitter',
    title: 'Twitter',
    label: 'Twitter',
  },
  {
    href: 'https://www.xiaohongshu.com/user/profile/678df66a000000000d008dd1',
    className: 'xiaohongshu',
    title: '小红书',
    label: '小红书',
  },
  // { href: 'https://github.com/caizhongang/digital_life_project', className: 'peper', title: 'GitHub', label: 'GitHub' },
] as const

export const marks = [
  {
    value: 0.5,
    label: '0.5x',
  },
  {
    value: 0.75,
    label: '0.75x',
  },
  {
    value: 1.0,
    label: '1.0x',
  },
  {
    value: 1.25,
    label: '1.25x',
  },
  {
    value: 1.5,
    label: '1.5x',
  },
  {
    value: 2.0,
    label: '2.0x',
  },
]
// Character Models Data - 按模型类型分类
export const CHARACTER_MODELS = [
  {
    id: 'character2',
    name: 'Ani-default',
    preview: '/img/preview/character/Ani-default.png',
  },
  {
    id: 'character1',
    name: 'KQ-default',
    preview: '/img/preview/character/KQ-default.png',
  },
  {
    id: 'character3',
    name: 'HT-default',
    preview: '/img/preview/character/HT-default.png',
  },
  {
    id: 'character4',
    name: 'FNN-default',
    preview: '/img/preview/character/FNN-default.png',
  },
]
// TTS-specific voice options
// NOTE: This is now used as fallback only. Voice options are fetched dynamically from API in useTTSVoices hook
export const TTS_VOICE_OPTIONS = {
  default: [{ value: 'xiaotao', label: 'Default Voice' }],
} as const
