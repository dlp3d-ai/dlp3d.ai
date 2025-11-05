'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import CheckIcon from '@mui/icons-material/Check'
import { marks } from '@/constants/index'
import { getSelectedChat } from '@/features/chat/chat'
import { usePromptingSettings } from '@/hooks/usePromptingSettings'
import { VoiceOption } from '@/hooks/useTTSVoices'
import Slider from '@mui/material/Slider'
import { useDevice } from '@/contexts/DeviceContext'
import { useTTSVoices } from '@/hooks/useTTSVoices'
import KeyIcon from '@mui/icons-material/Key'
import { Dialog } from '../../common/Dialog'
import { fetchGetAvailableTTS, fetchGetAvailableASR } from '@/request/api'
import { fetchGetTTS, fetchGetASR } from '@/request/configApi'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Settings from '@mui/icons-material/Settings'

export default function TTSPanel() {
  const settings = useSelector(getSelectedChat)
  const { updateCharacter, updateUserConfig } = usePromptingSettings()
  const { isMobile } = useDevice()

  const [selectedVoiceKey, setSelectedVoiceKey] = useState(settings?.voice)

  const [speed, setSpeed] = useState(settings?.voice_speed)
  const [modifiedDialogOpen, setModifiedDialogOpen] = useState(false)
  const [modifiedVoiceName, setModifiedVoiceName] = useState('')

  /**
   * tabs
   */
  const [ASRTabs, setASRTabs] = useState<string[]>([])
  const [TTSTabs, setTTSTabs] = useState<string[]>([])
  const [availableASR, setAvailableASR] = useState<string[]>([])
  const [availableTTS, setAvailableTTS] = useState<string[]>([])

  const [selectedASRTab, setSelectedASRTab] = useState('')
  const [selectedTTSTab, setSelectedTTSTab] = useState('')
  const { voiceOptions } = useTTSVoices(selectedTTSTab)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [key, setKey] = useState('')
  const [key2, setKey2] = useState('')
  const [editTab, setEditTab] = useState('')
  const [editType, setEditType] = useState('')

  const handleASRTabChange = useCallback(
    async (event: React.SyntheticEvent, newASR: string) => {
      // 检查是否可用：完全匹配或前缀匹配
      const isAvailable = availableASR.some(
        available => available === newASR || newASR.startsWith(available),
      )
      if (!isAvailable) {
        return
      }
      setSelectedASRTab(newASR)
      await updateCharacter(settings!.character_id, 'asr', { asr_adapter: newASR })
    },
    [availableASR, settings, updateCharacter],
  )

  const handleTTSTabChange = useCallback(
    (event: React.SyntheticEvent, newTTS: string) => {
      if (!availableTTS.includes(newTTS)) {
        return
      }
      setSelectedTTSTab(newTTS)
    },
    [availableTTS],
  )

  // 防抖处理
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleSpeedChange = useCallback(
    (newSpeed: Event, value: number | number[]) => {
      const newSpeedValue = value as number

      setSpeed(newSpeedValue)

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      debounceTimeoutRef.current = setTimeout(() => {
        const updatedSettings = {
          tts_adapter: settings?.tts_adapter,
          voice: selectedVoiceKey,
          voice_speed: newSpeedValue,
        }

        updateCharacter(settings!.character_id, 'tts', updatedSettings)
      }, 800) // 300ms 防抖延迟
    },
    [settings, updateCharacter, selectedVoiceKey],
  )
  const handleKeySettings = useCallback(
    async (tab: string, type: string, event: React.MouseEvent) => {
      event.stopPropagation()
      setEditTab(tab)
      setEditType(type)
      setDialogOpen(true)

      // 检查是否已配置：根据类型检查对应的可用列表
      const isAvailable =
        type === 'asr'
          ? availableASR.some(
              available => available === tab || tab.startsWith(available),
            )
          : availableTTS.some(
              available => available === tab || tab.startsWith(available),
            )

      if (isAvailable) {
        setKey('******')
        setKey2('******')
        return
      }

      setKey('')
      setKey2('')
    },
    [availableASR, availableTTS],
  )
  const handleVoiceSelect = useCallback(
    async (voice: VoiceOption) => {
      setSelectedVoiceKey(voice.value)

      const updatedSettings = {
        tts_adapter: selectedTTSTab,
        voice: voice.value,
        voice_speed: speed,
      }
      await updateCharacter(settings!.character_id, 'tts', updatedSettings)
    },
    [settings, updateCharacter, speed, selectedTTSTab],
  )
  const handleModifiedVoiceSave = useCallback(async () => {
    if (!modifiedVoiceName.trim()) {
      return
    }
    setSelectedVoiceKey(modifiedVoiceName)

    const updatedSettings = {
      tts_adapter: selectedTTSTab,
      voice: modifiedVoiceName,
      voice_speed: speed,
    }
    await updateCharacter(settings!.character_id, 'tts', updatedSettings)
    setModifiedDialogOpen(false)
  }, [settings, updateCharacter, speed, selectedTTSTab, modifiedVoiceName])

  const handleVoiceSelectModified = () => {
    setModifiedVoiceName('')
    if (
      selectedVoiceKey &&
      !voiceOptions.some(item => item.value === selectedVoiceKey)
    ) {
      setModifiedVoiceName(selectedVoiceKey)
    }

    setModifiedDialogOpen(true)
  }
  const handleKeySave = useCallback(async () => {
    const tabName = editTab.toLowerCase()

    switch (tabName) {
      case 'huoshan':
        // 只有当不是占位符时才更新
        if (key !== '******') {
          await updateUserConfig('huoshan_app_id', key)
        }
        if (key2 !== '******') {
          await updateUserConfig('huoshan_token', key2)
        }
        break
      case 'huoshan_icl':
        // 只有当不是占位符时才更新
        if (key !== '******') {
          await updateUserConfig('huoshan_app_id', key)
        }
        if (key2 !== '******') {
          await updateUserConfig('huoshan_token', key2)
        }
        break
      case 'softsugar':
        // 只有当不是占位符时才更新
        if (key !== '******') {
          await updateUserConfig('softsugar_app_id', key)
        }
        if (key2 !== '******') {
          await updateUserConfig('softsugar_app_key', key2)
        }
        break
      case 'sensenova':
        // 只有当不是占位符时才更新
        if (key !== '******') {
          await updateUserConfig('nova_tts_api_key', key)
        }
        break
      case 'elevenlabs':
        // 只有当不是占位符时才更新
        if (key !== '******') {
          await updateUserConfig('elevenlabs_api_key', key)
        }
        break
      case 'openai_realtime':
        // 只有当不是占位符时才更新
        if (key !== '******') {
          await updateUserConfig('openai_api_key', key)
        }
        break
      default:
        // 只有当不是占位符时才更新
        if (key !== '******') {
          await updateUserConfig(`${editTab}_${editType}_api_key`, key)
        }
        break
    }

    setDialogOpen(false)

    // 重新获取可用选项以刷新状态
    const activeTtsData = await fetchGetAvailableTTS(settings!.user_id)
    const activeAsrData = await fetchGetAvailableASR(settings!.user_id)
    setAvailableTTS(activeTtsData.options)
    setAvailableASR(activeAsrData.options)
  }, [editTab, key, key2, editType, updateUserConfig, settings])
  const getTabs = useCallback(() => {
    return (
      <div>
        <div>
          <div
            style={{
              color: '#fff',
              fontSize: '20px',
              fontWeight: 500,
              margin: '10px',
              paddingLeft: '10px',
            }}
          >
            ASR
          </div>
          <Tabs
            value={selectedASRTab}
            onChange={handleASRTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              backgroundColor: '#1e202d',
              borderRadius: '8px',
              marginBottom: '10px',
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.5)', // 未选中状态
                minWidth: 'auto',
                padding: '6px 16px',
                fontSize: isMobile ? '12px' : '14px',
              },
              '& .Mui-selected': {
                color: '#fff !important', // 选中状态
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#fff', // 下划线颜色
              },
              '& .MuiTab-root.Mui-disabled': {
                color: 'rgba(255, 255, 255, 0.1)', // 未选中状态
              },
              '& .MuiTabs-scrollButtons': {
                color: '#fff',
                '&.Mui-disabled': {
                  opacity: 0.3,
                },
              },
            }}
          >
            {ASRTabs.map(tab => (
              <Tab
                label={
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <KeyIcon
                      onClick={event => handleKeySettings(tab, 'asr', event)}
                      style={{
                        cursor: 'pointer',
                        color: '#fff',
                        fontSize: '16px',
                        opacity: 0.7,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.opacity = '1'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.opacity = '0.7'
                      }}
                    />
                    <span
                      style={{
                        opacity: availableASR.some(
                          available =>
                            available === tab || tab.startsWith(available),
                        )
                          ? 1
                          : 0.2,
                      }}
                    >
                      {tab}
                    </span>
                  </div>
                }
                value={tab}
                key={tab}
              />
            ))}
          </Tabs>
          <div>
            <span
              style={{
                color: '#fff',
                fontSize: '20px',
                fontWeight: 500,
                margin: '10px',
                paddingLeft: '10px',
              }}
            >
              TTS
            </span>
            <Tabs
              value={selectedTTSTab}
              onChange={handleTTSTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                backgroundColor: '#1e202d',
                borderRadius: '8px',
                marginBottom: '10px',
                '& .MuiTab-root': {
                  color: 'rgba(255, 255, 255, 0.5)', // 未选中状态
                  minWidth: 'auto',
                  padding: '6px 16px',
                  fontSize: isMobile ? '12px' : '14px',
                },
                '& .Mui-selected': {
                  color: '#fff !important', // 选中状态
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#fff', // 下划线颜色
                },
                '& .MuiTab-root.Mui-disabled': {
                  color: 'rgba(255, 255, 255, 0.1)', // 未选中状态
                },
                '& .MuiTabs-scrollButtons': {
                  color: '#fff',
                  '&.Mui-disabled': {
                    opacity: 0.3,
                  },
                },
              }}
            >
              {TTSTabs.map(tab => (
                <Tab
                  label={
                    <div
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <KeyIcon
                        onClick={event => handleKeySettings(tab, 'tts', event)}
                        style={{
                          cursor: 'pointer',
                          color: '#fff',
                          fontSize: '16px',
                          opacity: 0.7,
                          transition: 'opacity 0.2s',
                          zIndex: 1,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.opacity = '1'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.opacity = '0.7'
                        }}
                      />
                      <span
                        style={{ opacity: availableTTS.includes(tab) ? 1 : 0.2 }}
                      >
                        {tab}
                      </span>
                    </div>
                  }
                  value={tab}
                  key={tab}
                />
              ))}
            </Tabs>
          </div>
        </div>
      </div>
    )
  }, [
    ASRTabs,
    TTSTabs,
    selectedASRTab,
    selectedTTSTab,
    availableASR,
    availableTTS,
    isMobile,
    handleASRTabChange,
    handleTTSTabChange,
    handleKeySettings,
  ])
  const formatLabel = useCallback((label: string) => {
    // 把-处理成换行
    const lines = label.split('-')
    return (
      <div
        style={{
          color: '#fff',
          fontSize: '14px',
          height: '100%',
          width: 'calc(100% - 20px)',
          flexDirection: 'column',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
        }}
      >
        {lines.map(line => (
          <span key={line} style={{ display: 'block' }}>
            {line}
          </span>
        ))}
      </div>
    )
  }, [])
  const getList = useCallback(() => {
    return (
      <div
        className="config-sidebar-drawer-list"
        style={{
          height: 'calc(100% - 200px)',
          overflowY: 'auto',
          paddingBottom: '120px',
        }}
      >
        {voiceOptions.map(voice => (
          <div
            className={`config-sidebar-drawer-list-item ${
              selectedVoiceKey === voice.value ? 'active' : ''
            }`}
            key={voice.value}
            onClick={() => handleVoiceSelect(voice)}
            style={{
              position: 'relative',
              height: 'auto',
              opacity: selectedVoiceKey === voice.value ? 1 : 0.5,
            }}
          >
            <div
              className="config-sidebar-drawer-list-item-content"
              style={{
                textAlign: 'center',
                padding: isMobile ? '20px 8px 8px' : '10px',
              }}
            >
              {formatLabel(voice.label)}
            </div>
            {/* <div className="config-sidebar-drawer-list-item-name text-ellipsis">
              {voice.label}
            </div> */}
            {selectedVoiceKey === voice.value && (
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: '#1e202d',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                }}
              >
                <CheckIcon style={{ color: 'white', fontSize: '16px' }} />
              </div>
            )}
          </div>
        ))}
        <div
          className={`config-sidebar-drawer-list-item ${
            selectedVoiceKey &&
            settings?.tts_adapter === selectedTTSTab &&
            !voiceOptions.some(item => item.value === selectedVoiceKey)
              ? 'active'
              : ''
          }`}
          key="modified"
          onClick={handleVoiceSelectModified}
          style={{
            position: 'relative',
            height: 'auto',
            opacity:
              selectedVoiceKey &&
              settings?.tts_adapter === selectedTTSTab &&
              !voiceOptions.some(item => item.value === selectedVoiceKey)
                ? 1
                : 0.5,
          }}
        >
          <div
            className="config-sidebar-drawer-list-item-content"
            style={{
              textAlign: 'center',
              padding: isMobile ? '20px 8px 8px' : '10px',
            }}
          >
            <div
              style={{
                color: '#fff',
                fontSize: '14px',
                height: '100%',
                width: 'calc(100% - 20px)',
                flexDirection: 'column',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <span style={{ display: 'block' }}>Modified Voice</span>
            </div>
          </div>
          {/* <div className="config-sidebar-drawer-list-item-name text-ellipsis">
              {voice.label}
            </div> */}
          {selectedVoiceKey &&
            settings?.tts_adapter === selectedTTSTab &&
            !voiceOptions.some(item => item.value === selectedVoiceKey) && (
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: '#1e202d',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                }}
              >
                <CheckIcon style={{ color: 'white', fontSize: '16px' }} />
              </div>
            )}
          <Settings
            onClick={handleVoiceSelectModified}
            style={{
              cursor: 'pointer',
              position: 'absolute',
              color: '#fff',
              top: isMobile ? '3px' : '10px',
              left: isMobile ? '3px' : '10px',
            }}
          />
        </div>
      </div>
    )
  }, [
    voiceOptions,
    selectedVoiceKey,
    settings?.tts_adapter,
    selectedTTSTab,
    handleVoiceSelectModified,
    isMobile,
    formatLabel,
    handleVoiceSelect,
  ])

  const getDialog = useCallback(() => {
    const getInputFields = () => {
      const tabName = editTab.toLowerCase()

      switch (tabName) {
        case 'huoshan':
          return (
            <>
              <label
                style={{
                  display: 'block',
                  color: '#63667e',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  textAlign: 'left',
                }}
              >
                App ID
              </label>
              <input
                type="text"
                value={key}
                onChange={e => setKey(e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '0 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #4A4A6A',
                  borderRadius: '6px',
                  color: '#E0E0E0',
                  fontSize: '16px',
                  marginBottom: '16px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#6A6A8A'
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#4A4A6A'
                }}
                placeholder="Enter Huoshan App ID"
              />
              <label
                style={{
                  display: 'block',
                  color: '#63667e',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  textAlign: 'left',
                }}
              >
                Token
              </label>
              <input
                type="text"
                value={key2}
                onChange={e => setKey2(e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '0 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #4A4A6A',
                  borderRadius: '6px',
                  color: '#E0E0E0',
                  fontSize: '16px',
                  marginBottom: '24px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#6A6A8A'
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#4A4A6A'
                }}
                placeholder="Enter Huoshan Token"
              />
            </>
          )
        case 'huoshan_icl':
          return (
            <>
              <label
                style={{
                  display: 'block',
                  color: '#63667e',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  textAlign: 'left',
                }}
              >
                App ID
              </label>
              <input
                type="text"
                value={key}
                onChange={e => setKey(e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '0 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #4A4A6A',
                  borderRadius: '6px',
                  color: '#E0E0E0',
                  fontSize: '16px',
                  marginBottom: '16px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#6A6A8A'
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#4A4A6A'
                }}
                placeholder="Enter Huoshan ICL App ID"
              />
              <label
                style={{
                  display: 'block',
                  color: '#63667e',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  textAlign: 'left',
                }}
              >
                Token
              </label>
              <input
                type="text"
                value={key2}
                onChange={e => setKey2(e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '0 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #4A4A6A',
                  borderRadius: '6px',
                  color: '#E0E0E0',
                  fontSize: '16px',
                  marginBottom: '24px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#6A6A8A'
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#4A4A6A'
                }}
                placeholder="Enter Huoshan ICL Token"
              />
            </>
          )
        case 'softsugar':
          return (
            <>
              <label
                style={{
                  display: 'block',
                  color: '#63667e',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  textAlign: 'left',
                }}
              >
                App ID
              </label>
              <input
                type="text"
                value={key}
                onChange={e => setKey(e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '0 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #4A4A6A',
                  borderRadius: '6px',
                  color: '#E0E0E0',
                  fontSize: '16px',
                  marginBottom: '16px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#6A6A8A'
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#4A4A6A'
                }}
                placeholder="Enter Softsugar App ID"
              />
              <label
                style={{
                  display: 'block',
                  color: '#63667e',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  textAlign: 'left',
                }}
              >
                App Key
              </label>
              <input
                type="text"
                value={key2}
                onChange={e => setKey2(e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '0 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #4A4A6A',
                  borderRadius: '6px',
                  color: '#E0E0E0',
                  fontSize: '16px',
                  marginBottom: '24px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#6A6A8A'
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#4A4A6A'
                }}
                placeholder="Enter Softsugar App Key"
              />
            </>
          )
        case 'sensenova':
          return (
            <>
              <label
                style={{
                  display: 'block',
                  color: '#63667e',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  textAlign: 'left',
                }}
              >
                API Key
              </label>
              <input
                type="text"
                value={key}
                onChange={e => setKey(e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '0 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #4A4A6A',
                  borderRadius: '6px',
                  color: '#E0E0E0',
                  fontSize: '16px',
                  marginBottom: '24px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#6A6A8A'
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#4A4A6A'
                }}
                placeholder="Enter Sensenova API Key"
              />
            </>
          )
        case 'elevenlabs':
          return (
            <>
              <label
                style={{
                  display: 'block',
                  color: '#63667e',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  textAlign: 'left',
                }}
              >
                API Key
              </label>
              <input
                type="text"
                value={key}
                onChange={e => setKey(e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '0 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #4A4A6A',
                  borderRadius: '6px',
                  color: '#E0E0E0',
                  fontSize: '16px',
                  marginBottom: '24px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#6A6A8A'
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#4A4A6A'
                }}
                placeholder="Enter ElevenLabs API Key"
              />
            </>
          )
        case 'openai_realtime':
          return (
            <>
              <label
                style={{
                  display: 'block',
                  color: '#63667e',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  textAlign: 'left',
                }}
              >
                API Key
              </label>
              <input
                type="text"
                value={key}
                onChange={e => setKey(e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '0 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #4A4A6A',
                  borderRadius: '6px',
                  color: '#E0E0E0',
                  fontSize: '16px',
                  marginBottom: '24px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#6A6A8A'
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#4A4A6A'
                }}
                placeholder="Enter OpenAI API Key"
              />
            </>
          )
        default:
          return (
            <>
              <label
                style={{
                  display: 'block',
                  color: '#63667e',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  textAlign: 'left',
                }}
              >
                API Key
              </label>
              <input
                type="text"
                value={key}
                onChange={e => setKey(e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '0 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #4A4A6A',
                  borderRadius: '6px',
                  color: '#E0E0E0',
                  fontSize: '16px',
                  marginBottom: '24px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#6A6A8A'
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#4A4A6A'
                }}
                placeholder="Enter API Key"
              />
            </>
          )
      }
    }

    return (
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Edit KEY"
      >
        <div
          style={{
            padding: '20px',
            borderTop: '1px solid #333652',
            backgroundColor: '#1e202f',
          }}
        >
          {getInputFields()}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '10px',
            }}
          >
            <button
              onClick={handleKeySave}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: '#6b7cff',
                color: '#ffffff',
                transition: 'all 0.2s ease',
                minWidth: '80px',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.opacity = '0.8'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              Save
            </button>
          </div>
        </div>
      </Dialog>
    )
  }, [dialogOpen, editTab, key, key2, handleKeySave])
  const getModifiedDialog = useCallback(() => {
    return (
      <Dialog
        isOpen={modifiedDialogOpen}
        onClose={() => setModifiedDialogOpen(false)}
        title="Edit Modified Voice"
      >
        <div
          style={{
            padding: '20px',
            borderTop: '1px solid #333652',
            backgroundColor: '#1e202f',
          }}
        >
          <label
            style={{
              display: 'block',
              color: '#63667e',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              textAlign: 'left',
            }}
          >
            Voice Name
          </label>
          <input
            type="text"
            value={modifiedVoiceName}
            onChange={e => setModifiedVoiceName(e.target.value)}
            style={{
              width: '100%',
              height: '48px',
              padding: '0 16px',
              backgroundColor: 'transparent',
              border: '1px solid #4A4A6A',
              borderRadius: '6px',
              color: '#E0E0E0',
              fontSize: '16px',
              marginBottom: '16px',
              boxSizing: 'border-box',
              outline: 'none',
            }}
            onFocus={e => {
              e.target.style.borderColor = '#6A6A8A'
            }}
            onBlur={e => {
              e.target.style.borderColor = '#4A4A6A'
            }}
            placeholder="Enter Modified Voice Name"
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '10px',
            }}
          >
            <button
              onClick={handleModifiedVoiceSave}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: '#6b7cff',
                color: '#ffffff',
                transition: 'all 0.2s ease',
                minWidth: '80px',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.opacity = '0.8'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              Save
            </button>
          </div>
        </div>
      </Dialog>
    )
  }, [modifiedDialogOpen, modifiedVoiceName, handleModifiedVoiceSave])
  // 清理防抖定时器
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const asrData = await fetchGetASR()
      setASRTabs(asrData.choices)
      setSelectedASRTab(settings!.asr_adapter || '')
      const ttsData = await fetchGetTTS()
      setTTSTabs(ttsData.choices)
      setSelectedTTSTab(settings!.tts_adapter || '')
      const activeTtsData = await fetchGetAvailableTTS(settings!.user_id)
      const activeAsrData = await fetchGetAvailableASR(settings!.user_id)
      setAvailableTTS(activeTtsData.options)
      setAvailableASR(activeAsrData.options)
    }
    fetchData()
  }, [settings])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* TTS Selection */}
      {getTabs()}
      {/* Voice Selection List */}

      {getList()}

      {/* 固定在底部的速度控制滑块 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#1b1d2b',
          padding: '15px 25px',
          borderTop: '1px solid #333652',
          zIndex: 10,
        }}
      >
        <div style={{ marginBottom: isMobile ? '0' : '8px' }}>
          <span style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>
            voice speed: {speed?.toFixed(1)}x
          </span>
        </div>
        <Slider
          value={speed!}
          marks={marks}
          step={null}
          min={0.5}
          max={2.0}
          onChange={handleSpeedChange}
          sx={{
            color: '#323451', // 进度条颜色
            height: 8,
            '& .MuiSlider-track': {
              border: 'none',
              backgroundColor: '#323451', // 进度条颜色
            },
            '& .MuiSlider-rail': {
              backgroundColor: '#323451', // 轨道颜色
              opacity: 1,
            },
            '& .MuiSlider-thumb': {
              height: 30,
              width: 15,
              backgroundColor: '#ffffff', // 滑块颜色
              border: '2px solid #323451',
              borderRadius: '15px', // 方形滑块

              '&:hover, &.Mui-focusVisible, &.Mui-active': {
                boxShadow: '0 0 0 8px rgba(255, 255, 255, 0.16)',
              },
            },
            '& .MuiSlider-mark': {
              backgroundColor: '#323451', // 标记点颜色
              height: 8,
              width: 8,
              borderRadius: '50%',
              '&.MuiSlider-markActive': {
                backgroundColor: '#ffffff', // 激活的标记点颜色
              },
            },
            '& .MuiSlider-markLabel': {
              color: '#ffffff', // 标签颜色
              fontSize: '12px',
              fontWeight: 500,
            },
          }}
        />
      </div>

      {getDialog()}
      {getModifiedDialog()}
    </div>
  )
}
