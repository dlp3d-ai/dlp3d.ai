'use client'
import React, { useState } from 'react'

import { TextField } from '@mui/material'
import { useDevice } from '../../../contexts/DeviceContext'

import { getSelectedChat } from '@/features/chat/chat'
import { useSelector } from 'react-redux'

import { usePromptingSettings } from '@/hooks/usePromptingSettings'
import { useTranslation } from 'react-i18next'
import GlobalTooltip from '@/components/common/GlobalTooltip'
/**
 * PromptPanel component.
 *
 * Panel for editing the character's system prompt text. Supports live editing
 * and persisting the prompt to the selected character configuration.
 *
 * @returns JSX.Element The prompt editor panel.
 */
export default function PromptPanel() {
  const { isMobile } = useDevice()
  const settings = useSelector(getSelectedChat)
  const { updateCharacter } = usePromptingSettings()
  const { t } = useTranslation()
  const [textContent, setTextContent] = useState(settings?.prompt || '')

  /**
   * Handle text input change for prompt content.
   *
   * @param event React.ChangeEvent<HTMLInputElement> The change event.
   *
   * @returns void
   */
  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newContent = event.target.value
    setTextContent(newContent)
  }

  /**
   * Persist prompt content to the character configuration.
   *
   * @returns Promise<void> Resolves when the prompt is saved.
   */
  const handleSave = async () => {
    if (textContent?.trim()) {
      await updateCharacter(settings!.character_id, 'prompt', {
        prompt: textContent,
      })
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
      }}
    >
      <div
        style={{
          padding: '20px',
          backgroundColor: '#1e202f',
          height: '100%',
        }}
      >
        <TextField
          fullWidth
          multiline
          rows={isMobile ? 6 : 15}
          variant="outlined"
          placeholder="Select a prompt template or edit here..."
          value={textContent}
          onChange={handleTextChange}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: '#fff',
              backgroundColor: '#22243a',
              '& fieldset': {
                borderColor: '#333652',
              },
              '&:hover fieldset': {
                borderColor: '#4a4d6a',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#6b7cff',
              },
            },
            '& .MuiInputBase-input': {
              color: '#fff',
              '&::placeholder': {
                color: '#888',
                opacity: 1,
              },
            },
          }}
        />
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
              cursor: textContent?.trim() ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: textContent?.trim() ? '#6b7cff' : '#4a4d6a',
              color: '#ffffff',
              transition: 'all 0.2s ease',
              minWidth: '80px',
              opacity: textContent?.trim() ? 1 : 0.6,
            }}
            onMouseEnter={e => {
              if (textContent?.trim()) {
                e.currentTarget.style.opacity = '0.8'
              }
            }}
            onMouseLeave={e => {
              if (textContent?.trim()) {
                e.currentTarget.style.opacity = '1'
              }
            }}
          >
            {t('common.save')}
          </button>
        </div>
      </div>
      <div style={{ position: 'absolute', top: '0', right: '20px', color: '#fff' }}>
        <GlobalTooltip
          content={[
            t('tip.promptFirst'),
            t('tip.promptSecond'),
            t('tip.promptCoreDirectivesTitle'),
            t('tip.promptCoreDirectivesDesc'),
            t('tip.promptCharacterProfileTitle'),
            t('tip.promptCharacterProfileDesc'),
            t('tip.promptActiveGreetingTitle'),
            t('tip.promptActiveGreetingDesc'),
            t('tip.promptRelationshipSystemTitle'),
            t('tip.promptRelationshipSystemDesc'),
          ].join('\n')}
        />
      </div>
    </div>
  )
}
