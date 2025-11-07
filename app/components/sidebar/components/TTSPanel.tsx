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
import { useTranslation } from 'react-i18next'
import GlobalTooltip from '@/components/common/GlobalTooltip'
/**
 * TTSPanel component.
 *
 * A panel component for configuring TTS (Text-to-Speech) and ASR (Automatic Speech Recognition) settings.
 * Provides tabs for selecting ASR and TTS providers, voice selection, speed control,
 * and API key configuration for various TTS/ASR services.
 *
 * @returns JSX.Element The rendered TTS/ASR settings panel.
 */
export default function TTSPanel() {
  const settings = useSelector(getSelectedChat)
  const { updateCharacter, updateUserConfig } = usePromptingSettings()
  const { isMobile } = useDevice()
  const { t } = useTranslation()
  const [selectedVoiceKey, setSelectedVoiceKey] = useState(settings?.voice)

  const [speed, setSpeed] = useState(settings?.voice_speed)
  const [modifiedDialogOpen, setModifiedDialogOpen] = useState(false)
  const [modifiedVoiceName, setModifiedVoiceName] = useState('')

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

  /**
   * Handle ASR tab change.
   *
   * Checks if the selected ASR provider is available, updates the selected tab,
   * and saves the configuration to the character settings.
   *
   * @param event The synthetic event object (React.SyntheticEvent).
   * @param newASR The new ASR provider identifier (string).
   *
   * @returns Promise<void> Resolves when the configuration is saved.
   */
  const handleASRTabChange = useCallback(
    async (event: React.SyntheticEvent, newASR: string) => {
      // Check availability: exact match or prefix match
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

  /**
   * Handle TTS tab change.
   *
   * Checks if the selected TTS provider is available and updates the selected tab.
   *
   * @param event The synthetic event object (React.SyntheticEvent).
   * @param newTTS The new TTS provider identifier (string).
   *
   * @returns void
   */
  const handleTTSTabChange = useCallback(
    (event: React.SyntheticEvent, newTTS: string) => {
      if (!availableTTS.includes(newTTS)) {
        return
      }
      setSelectedTTSTab(newTTS)
    },
    [availableTTS],
  )

  // Debounce handling
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Handle voice speed change.
   *
   * Updates the voice speed with debouncing to avoid excessive API calls.
   * Saves the updated settings after a delay.
   *
   * @param newSpeed The event object (Event).
   * @param value The new speed value (number).
   *
   * @returns void
   */
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
      }, 800) // 800ms debounce delay
    },
    [settings, updateCharacter, selectedVoiceKey],
  )
  /**
   * Handle key settings button click.
   *
   * Opens the API key configuration dialog for the selected provider.
   * If keys are already configured, displays placeholder values.
   *
   * @param tab The provider tab identifier (string).
   * @param type The type ("asr" or "tts").
   * @param event The mouse event object (React.MouseEvent).
   *
   * @returns Promise<void> Resolves when dialog state is updated.
   */
  const handleKeySettings = useCallback(
    async (tab: string, type: string, event: React.MouseEvent) => {
      event.stopPropagation()
      setEditTab(tab)
      setEditType(type)
      setDialogOpen(true)

      // Check if already configured: check corresponding available list based on type
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
  /**
   * Handle voice selection.
   *
   * Updates the selected voice and saves the configuration to the character settings.
   *
   * @param voice The selected voice option (VoiceOption).
   *
   * @returns Promise<void> Resolves when the configuration is saved.
   */
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
  /**
   * Save a modified voice name entered by the user.
   *
   * Persists the custom voice value as the selected voice for the active TTS provider.
   *
   * @returns Promise<void> Resolves when the configuration is saved.
   */
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

  /**
   * Open the dialog for editing a custom (modified) voice name.
   *
   * Pre-fills the input with the current custom voice if it is not in the
   * available voice options for the selected TTS provider.
   *
   * @returns void
   */
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
  /**
   * Handle key save action.
   *
   * Saves API keys for various TTS/ASR providers based on the provider type.
   * Only updates keys that are not placeholders. Refreshes available provider lists after saving.
   */
  const handleKeySave = useCallback(async () => {
    const tabName = editTab.toLowerCase()

    switch (tabName) {
      case 'huoshan':
        // Only update if not placeholder
        if (key !== '******') {
          await updateUserConfig('huoshan_app_id', key)
        }
        if (key2 !== '******') {
          await updateUserConfig('huoshan_token', key2)
        }
        break
      case 'huoshan_icl':
        // Only update if not placeholder
        if (key !== '******') {
          await updateUserConfig('huoshan_app_id', key)
        }
        if (key2 !== '******') {
          await updateUserConfig('huoshan_token', key2)
        }
        break
      case 'softsugar':
        // Only update if not placeholder
        if (key !== '******') {
          await updateUserConfig('softsugar_app_id', key)
        }
        if (key2 !== '******') {
          await updateUserConfig('softsugar_app_key', key2)
        }
        break
      case 'sensenova':
        // Only update if not placeholder
        if (key !== '******') {
          await updateUserConfig('nova_tts_api_key', key)
        }
        break
      case 'elevenlabs':
        // Only update if not placeholder
        if (key !== '******') {
          await updateUserConfig('elevenlabs_api_key', key)
        }
        break
      case 'openai_realtime':
        // Only update if not placeholder
        if (key !== '******') {
          await updateUserConfig('openai_api_key', key)
        }
        break
      default:
        // Only update if not placeholder
        if (key !== '******') {
          await updateUserConfig(`${editTab}_${editType}_api_key`, key)
        }
        break
    }

    setDialogOpen(false)

    // Refetch available options to refresh state
    const activeTtsData = await fetchGetAvailableTTS(settings!.user_id)
    const activeAsrData = await fetchGetAvailableASR(settings!.user_id)
    setAvailableTTS(activeTtsData.options)
    setAvailableASR(activeAsrData.options)
  }, [editTab, key, key2, editType, updateUserConfig, settings])
  /**
   * Render the ASR and TTS provider tabs.
   *
   * @returns {JSX.Element} The rendered tabs component.
   */
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
            {t('TTSPanel.asr')}
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
                color: 'rgba(255, 255, 255, 0.5)', // Unselected state
                minWidth: 'auto',
                padding: '6px 16px',
                fontSize: isMobile ? '12px' : '14px',
              },
              '& .Mui-selected': {
                color: '#fff !important', // Selected state
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#fff', // Indicator color
              },
              '& .MuiTab-root.Mui-disabled': {
                color: 'rgba(255, 255, 255, 0.1)', // Disabled state
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
                      {t(`TTSPanel.${tab}`)}
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
              {t('TTSPanel.tts')}
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
                  color: 'rgba(255, 255, 255, 0.5)', // Unselected state
                  minWidth: 'auto',
                  padding: '6px 16px',
                  fontSize: isMobile ? '12px' : '14px',
                },
                '& .Mui-selected': {
                  color: '#fff !important', // Selected state
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#fff', // Indicator color
                },
                '& .MuiTab-root.Mui-disabled': {
                  color: 'rgba(255, 255, 255, 0.1)', // Disabled state
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
                        {t(`TTSPanel.${tab}`)}
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
    t,
  ])
  /**
   * Format a multi-part label by splitting on '-' and rendering as stacked lines.
   *
   * @param label The raw label text to format (string).
   *
   * @returns JSX.Element The formatted label component.
   */
  const formatLabel = useCallback((label: string) => {
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
  /**
   * Render the voice selection list.
   *
   * @returns JSX.Element The rendered voice list component.
   */
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
              <span style={{ display: 'block' }}>{t('TTSPanel.modifiedVoice')}</span>
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

  /**
   * Render the API key configuration dialog.
   *
   * @returns JSX.Element The rendered dialog component.
   */
  const getDialog = useCallback(() => {
    /**
     * Get input fields based on provider type.
     *
     * @returns JSX.Element The rendered input fields for the selected provider.
     */
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
                appId
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
                placeholder={`${t('TTSPanel.enter')} appId`}
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
                key
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
                placeholder={`${t('TTSPanel.enter')} key`}
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
                appId
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
                placeholder={`${t('TTSPanel.enter')} appId`}
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
                key
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
                placeholder={`${t('TTSPanel.enter')} key`}
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
                appId
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
                placeholder={`${t('TTSPanel.enter')} appId`}
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
                appKey
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
                placeholder={`${t('TTSPanel.enter')} appKey`}
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
                apiKey
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
                placeholder={`${t('TTSPanel.enter')} apiKey`}
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
                apiKey
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
                placeholder={`${t('TTSPanel.enter')} apiKey`}
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
                apiKey
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
                placeholder={`${t('TTSPanel.enter')} apiKey`}
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
                apiKey
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
                placeholder={`${t('TTSPanel.enter')} apiKey`}
              />
            </>
          )
      }
    }

    return (
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={`${t('TTSPanel.editKey')}`}
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
              {t('common.save')}
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
        title={`${t('TTSPanel.edit')}${t('TTSPanel.modifiedVoice')}`}
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
            {t('TTSPanel.voiceName')}
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
            placeholder={`${t('TTSPanel.enter')}${t('TTSPanel.modifiedVoiceName')}`}
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
              {t('common.save')}
            </button>
          </div>
        </div>
      </Dialog>
    )
  }, [modifiedDialogOpen, modifiedVoiceName, handleModifiedVoiceSave])
  // Clean up debounce timer
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* TTS Selection */}
      {getTabs()}
      {/* Voice Selection List */}

      {getList()}

      {/* Fixed speed control slider at bottom */}
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
            {t('TTSPanel.voiceSpeed')}: {speed?.toFixed(1)}x
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
            color: '#323451', // Progress bar color
            height: 8,
            '& .MuiSlider-track': {
              border: 'none',
              backgroundColor: '#323451', // Progress bar color
            },
            '& .MuiSlider-rail': {
              backgroundColor: '#323451', // Rail color
              opacity: 1,
            },
            '& .MuiSlider-thumb': {
              height: 30,
              width: 15,
              backgroundColor: '#ffffff', // Thumb color
              border: '2px solid #323451',
              borderRadius: '15px', // Rounded thumb

              '&:hover, &.Mui-focusVisible, &.Mui-active': {
                boxShadow: '0 0 0 8px rgba(255, 255, 255, 0.16)',
              },
            },
            '& .MuiSlider-mark': {
              backgroundColor: '#323451', // Mark color
              height: 8,
              width: 8,
              borderRadius: '50%',
              '&.MuiSlider-markActive': {
                backgroundColor: '#ffffff', // Active mark color
              },
            },
            '& .MuiSlider-markLabel': {
              color: '#ffffff', // Label color
              fontSize: '12px',
              fontWeight: 500,
            },
          }}
        />
      </div>

      {getDialog()}
      {getModifiedDialog()}
      <div style={{ position: 'absolute', top: '0', right: '20px', color: '#fff' }}>
        <GlobalTooltip content={t('tip.tts')} />
      </div>
    </div>
  )
}
