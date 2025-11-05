import React, { useState, useEffect, useCallback } from 'react'
import { usePromptingSettings } from '../../../hooks/usePromptingSettings'

import CheckIcon from '@mui/icons-material/Check'
import Settings from '@mui/icons-material/Settings'
import KeyIcon from '@mui/icons-material/Key'
import { useSelector } from 'react-redux'
import { getSelectedChat } from '@/features/chat/chat'
import { Dialog } from '../../common/Dialog'
import { CharacterConfig } from '@/types/character'

import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import {
  fetchGetConversation,
  fetchGetReaction,
  fetchGetClassification,
  fetchGetMemory,
} from '@/request/configApi'
import { getAvailableLlm } from '@/request/api'
import { useDevice } from '@/contexts/DeviceContext'
import { useTranslation } from 'react-i18next'

/**
 * Choice interface for LLM model selection.
 */
interface Choice {
  /** The model value identifier. */
  value: string
  /** The model key identifier. */
  key: string
  /** The image URL for the model icon. */
  img: string
  /** The display label for the model. */
  label: string
}

/**
 * LLMPanel component.
 *
 * A panel component for configuring LLM (Large Language Model) settings.
 * Supports multiple tabs for conversation, reaction, classification, and memory models.
 * Allows users to select models, configure API keys, and override model names.
 *
 * @returns JSX.Element The rendered LLM settings panel.
 */
export default function LLMPanel() {
  const { isMobile } = useDevice()
  const settings = useSelector(getSelectedChat)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { updateCharacter, updateUserConfig } = usePromptingSettings()
  const { t } = useTranslation()
  const [choseModel, setChoseModel] = useState<{
    value: string
    label: string
  } | null>(null)
  const [textContent, setTextContent] = useState(
    settings?.conversation_model_override || '',
  )
  const [textName, setTextName] = useState(settings?.conversation_adapter || '')
  const [selectedLLMKey, setSelectedLLMKey] = useState(
    settings?.conversation_adapter,
  )
  const [dialogType, setDialogType] = useState<'name' | 'key'>('name')

  const [selectedTab, setSelectedTab] = useState('conversation')
  const [keyType, setKeyType] = useState<string>('')
  const [textContent2, setTextContent2] = useState('')
  const [choices, setChoices] = useState<Choice[]>([])
  const [choicesLoading, setChoicesLoading] = useState(false)
  const [availableLLM, setAvailableLLM] = useState<string[]>([])
  /**
   * Handle tab change event.
   *
   * Updates the selected tab and loads the corresponding model settings
   * from the character configuration.
   *
   * @param event The synthetic event object (React.SyntheticEvent).
   * @param newValue The new tab value (string).
   *
   * @returns void
   */
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue)
    if (settings) {
      const adapterKey = `${newValue}_adapter` as keyof CharacterConfig
      const modelOverrideKey = `${newValue}_model_override` as keyof CharacterConfig
      setSelectedLLMKey((settings[adapterKey] as string) || '')
      setTextName((settings[modelOverrideKey] as string) || '')
    }
  }

  /**
   * Handle model selection.
   *
   * If the model requires API key configuration, opens the key dialog.
   * Otherwise, updates the character configuration with the selected model.
   *
   * @param model The selected model choice (Choice).
   *
   * @returns Promise<void> Resolves when the selection is processed.
   */
  const handleModelSelect = useCallback(
    async (model: Choice) => {
      setChoseModel(model)
      if (!availableLLM.includes(model.key)) {
        setDialogType('key')
        setDialogOpen(true)
        setTextContent('')
        setTextName('')
        setKeyType(model.key)
        return
      }

      setSelectedLLMKey(model.value)
      if (settings) {
        const modelOverrideKey =
          `${selectedTab}_model_override` as keyof CharacterConfig

        const res = await updateCharacter(
          settings.character_id,
          selectedTab as
            | 'prompt'
            | 'asr'
            | 'scene'
            | 'tts'
            | 'classification'
            | 'conversation'
            | 'reaction'
            | 'memory',
          {
            [`${selectedTab}_adapter`]: model.value,
            [`${selectedTab}_model_override`]:
              (settings[modelOverrideKey] as string) || '',
          },
        )
        if (!res) {
          return
        }
        setTextName((settings[modelOverrideKey] as string) || '')
        setDialogOpen(false)
      }
    },
    [availableLLM, settings, selectedTab, updateCharacter],
  )
  /**
   * Handle save action.
   *
   * Saves model name override or API key configuration based on dialog type.
   * Updates available LLM list after saving API keys.
   *
   * @returns Promise<void> Resolves when the data is saved.
   */
  const handleSave = async () => {
    if (dialogType === 'name') {
      if (textName?.trim()) {
        await updateCharacter(settings!.character_id, 'conversation', {
          conversation_adapter: settings!.conversation_adapter,
          conversation_model_override: textName,
        })
        setDialogOpen(false)
      }
    } else {
      if (keyType === 'sensenova') {
        // Only update if not placeholder
        if (textContent2 !== '******') {
          await updateUserConfig('sensenova_sk', textContent2)
        }
        if (textContent !== '******') {
          await updateUserConfig('sensenova_ak', textContent)
        }
      } else {
        const data = choseModel?.value.toLowerCase().split('_')[0]
        // Only update if not placeholder
        if (textContent !== '******') {
          await updateUserConfig(`${data}_api_key`, textContent)
        }
      }
      setDialogOpen(false)
      const data = await getAvailableLlm(settings!.user_id)
      setAvailableLLM(data.options)
    }
  }
  /**
   * Handle key settings button click.
   *
   * Opens the API key configuration dialog for the selected model.
   * If the model already has keys configured, displays placeholder values.
   *
   * @param model The model to configure (Choice).
   * @param event The mouse event object (React.MouseEvent).
   *
   * @returns Promise<void> Resolves when dialog state is updated.
   */
  const handleKeySettings = useCallback(
    async (model: Choice, event: React.MouseEvent) => {
      event.stopPropagation()
      setDialogType('key')
      setDialogOpen(true)
      setChoseModel(model)
      setKeyType(model.key)
      if (availableLLM.includes(model.key)) {
        setTextContent2('******')
        setTextContent('******')
        return
      }
      setTextContent2('')
      setTextContent('')
      setTextName('')
    },
    [availableLLM],
  )
  /**
   * Handle settings button click.
   *
   * Opens the model name override dialog for the selected model.
   *
   * @param model The model to configure (Choice).
   * @param event The mouse event object (React.MouseEvent).
   *
   * @returns Promise<void> Resolves when dialog state is updated.
   */
  const handleSettings = useCallback(
    async (model: Choice, event: React.MouseEvent) => {
      event.stopPropagation()
      setDialogType('name')
      setDialogOpen(true)
      setTextContent('')
      setTextContent2('')
      if (settings) {
        const modelOverrideKey =
          `${selectedTab}_model_override` as keyof CharacterConfig
        setTextName((settings[modelOverrideKey] as string) || '')
      }
      setChoseModel(model)
    },
    [settings, selectedTab],
  )
  /**
   * Get LLM image URL by key.
   *
   * @param key The LLM provider key (string).
   *
   * @returns string The image URL for the LLM provider.
   */
  const getLLMImage = (key: string) => {
    switch (key) {
      case 'openai':
        return '/img/llm/openai.png'
      case 'anthropic':
        return '/img/llm/anthropic.png'
      case 'gemini':
        return '/img/llm/gemini.png'
      case 'sensenova':
        return '/img/llm/sensenova.png'
      case 'deepseek':
        return '/img/llm/deepseek.png'
      case 'xai':
        return '/img/llm/xai.png'
      default:
        return '/img/llm/openai.png'
    }
  }
  /**
   * Render the list of available LLM models.
   *
   * @returns JSX.Element The rendered list component with loading state or model items.
   */
  const getList = useCallback(() => {
    return choicesLoading ? (
      <div style={{ color: '#fff', textAlign: 'center', padding: '20px' }}>
        Loading AI models...
      </div>
    ) : (
      <div
        className="config-sidebar-drawer-list"
        style={{ overflowY: 'auto', height: '100%' }}
      >
        {choices.map(choices => (
          <div
            className={`config-sidebar-drawer-list-item ${
              selectedLLMKey === choices.value ? 'active' : ''
            } ${
              !availableLLM.includes(choices.key)
                ? 'config-sidebar-drawer-list-item-disabled'
                : ''
            }`}
            key={choices.value}
            onClick={() => handleModelSelect(choices)}
            style={{
              position: 'relative',
            }}
          >
            <div
              className="config-sidebar-drawer-list-item-content"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <img
                src={choices.img}
                style={{
                  width: '50%',
                  height: '50%',
                  objectFit: 'contain',
                  color: '#fff',
                }}
              />
            </div>
            <div className="config-sidebar-drawer-list-item-name text-ellipsis">
              {choices.label}
            </div>
            {selectedLLMKey === choices.value && (
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
            {selectedLLMKey === choices.value && (
              <Settings
                onClick={event => handleSettings(choices, event)}
                style={{
                  cursor: 'pointer',
                  position: 'absolute',
                  color: '#fff',
                  bottom: isMobile ? '3px' : '10px',
                  right: isMobile ? '3px' : '10px',
                }}
              />
            )}

            <KeyIcon
              onClick={event => handleKeySettings(choices, event)}
              style={{
                cursor: 'pointer',
                position: 'absolute',
                color: '#fff',
                bottom: isMobile ? '3px' : '10px',
                left: isMobile ? '3px' : '10px',
              }}
            />
          </div>
        ))}
      </div>
    )
  }, [
    choicesLoading,
    choices,
    availableLLM,
    selectedLLMKey,
    handleModelSelect,
    handleSettings,
    handleKeySettings,
    isMobile,
  ])
  /**
   * Filter and transform choice strings into Choice objects.
   *
   * @param choices Array of choice strings (string[]).
   *
   * @returns Choice[] Array of Choice objects with processed data.
   */
  const filterChoices = useCallback((choices: string[]) => {
    return choices.map(choice => {
      return {
        value: choice,
        key: choice.toLowerCase().split('_')[0],
        img: getLLMImage(choice.toLowerCase().split('_')[0]),
        label: choice.toLowerCase().split('_').slice(0, -1).join(' '),
      }
    })
  }, [])
  useEffect(() => {
    setChoicesLoading(true)
    const fetchData = async () => {
      if (selectedTab === 'conversation') {
        const data = await fetchGetConversation()
        // Process data
        setChoices(filterChoices(data.choices))
      } else if (selectedTab === 'reaction') {
        const data = await fetchGetReaction()
        setChoices(filterChoices(data.choices))
      } else if (selectedTab === 'classification') {
        const data = await fetchGetClassification()
        setChoices(filterChoices(data.choices))
      } else if (selectedTab === 'memory') {
        const data = await fetchGetMemory()
        setChoices(filterChoices(data.choices))
      }
    }

    fetchData()
    setChoicesLoading(false)
  }, [selectedTab, filterChoices])
  useEffect(() => {
    const fetchData = async () => {
      const data = await getAvailableLlm(settings!.user_id)
      setAvailableLLM(data.options)
    }
    fetchData()
  }, [settings])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* AI Model Selection List */}
      <Tabs
        value={selectedTab}
        onChange={handleTabChange}
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
          '& .MuiTabs-scrollButtons': {
            color: '#fff',
            '&.Mui-disabled': {
              opacity: 0.3,
            },
          },
        }}
      >
        <Tab label={t('llmPanel.conversation')} value="conversation" />
        <Tab label={t('llmPanel.reaction')} value="reaction" />
        <Tab label={t('llmPanel.classification')} value="classification" />
        <Tab label={t('llmPanel.memory')} value="memory" />
      </Tabs>
      {getList()}

      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={t('llmPanel.editLLM')}
      >
        <div
          style={{
            padding: '20px',
            borderTop: '1px solid #333652',
            backgroundColor: '#1e202f',
          }}
        >
          {dialogType === 'name' && (
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
                {t('llmPanel.modelNameOverride')}
              </label>
              <input
                type="text"
                value={textName}
                onChange={e => setTextName(e.target.value)}
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
                placeholder={t('llmPanel.modelNameOverridePlaceholder')}
              />
            </>
          )}
          {dialogType === 'key' && (
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
                {keyType === 'sensenova'
                  ? t('llmPanel.sensenovaAK')
                  : `${keyType} ${t('llmPanel.apiKey')}`}
              </label>
              <input
                type="text"
                value={textContent}
                onChange={e => setTextContent(e.target.value)}
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
                placeholder={t('llmPanel.apiKeyPlaceholder')}
              />
              {keyType === 'sensenova' && (
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
                    {t('llmPanel.sensenovaSK')}
                  </label>
                  <input
                    type="text"
                    value={textContent2}
                    onChange={e => setTextContent2(e.target.value)}
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
                    placeholder={t('llmPanel.apiKeyPlaceholder')}
                  />
                </>
              )}
            </>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '10px',
            }}
          >
            <button
              onClick={handleSave}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                // cursor: textContent?.trim() ? 'pointer' : 'not-allowed',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                // backgroundColor: textContent?.trim() ? '#6b7cff' : '#4a4d6a',
                backgroundColor: '#6b7cff',
                color: '#ffffff',
                transition: 'all 0.2s ease',
                minWidth: '80px',
                // opacity: textContent?.trim() ? 1 : 0.6,
              }}
              onMouseEnter={e => {
                // if (textContent?.trim()) {
                e.currentTarget.style.opacity = '0.8'
                // }
              }}
              onMouseLeave={e => {
                // if (textContent?.trim()) {
                e.currentTarget.style.opacity = '1'
                // }
              }}
            >
              {t('common.save')}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
