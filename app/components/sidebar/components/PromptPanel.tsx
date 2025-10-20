import React, { useState } from 'react'

import { TextField } from '@mui/material'
import { useDevice } from '../../../contexts/DeviceContext'

import { getSelectedChat } from '@/features/chat/chat'
import { useSelector } from 'react-redux'

import { usePromptingSettings } from '@/hooks/usePromptingSettings'

export default function PromptPanel() {
  const { isMobile } = useDevice()
  const settings = useSelector(getSelectedChat)
  const { updateCharacter } = usePromptingSettings()

  const [textContent, setTextContent] = useState(settings?.prompt || '')

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newContent = event.target.value
    setTextContent(newContent)
  }

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
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
