import React, { useEffect } from 'react'
import { useDevice } from '../../../contexts/DeviceContext'
import { useSelector, useDispatch } from 'react-redux'

import List from '@mui/material/List'

// Import panel components
import ModelPanel from './ModelPanel'
import PromptPanel from './PromptPanel'
import LLMPanel from './LLMPanel'
import TTSPanel from './TTSPanel'
import ScenePanel from './ScenePanel'

import '../styles/drawer.scss'
import { getIsSliderOpen, setIsSliderOpen } from '@/features/chat/chat'

interface ConfigDrawerProps {
  active: string
  onClose: () => void
  onSceneChange: (scene: string) => void
}

export default function ConfigDrawer({
  active,

  onSceneChange,
}: ConfigDrawerProps) {
  const { isMobile } = useDevice()
  const dispatch = useDispatch()
  const isSliderOpen = useSelector(getIsSliderOpen)

  useEffect(() => {
    if (active && !isSliderOpen) {
      setIsSliderOpen(true)
    } else if (!active && isSliderOpen) {
      dispatch(setIsSliderOpen(false))
    }
  }, [active, isSliderOpen])

  const renderPanel = () => {
    switch (active) {
      case 'model':
        return <ModelPanel />
      case 'prompt':
        return <PromptPanel />
      case 'llm':
        return <LLMPanel />
      case 'tts':
        return <TTSPanel />
      case 'scene':
        return <ScenePanel onSceneChange={onSceneChange} />

      default:
        return <div>Unknown panel type</div>
    }
  }

  if (!isSliderOpen) return null

  return (
    <>
      {/* Drawer */}
      <div
        className="config-sidebar-drawer"
        style={{
          zIndex: 999,
          height: isMobile ? (active === 'tts' ? '485px' : '320px') : '500px',
        }}
      >
        {/* Content */}
        <div
          style={{
            height: isMobile ? '100%' : '500px',
            overflow: 'hidden',
          }}
        >
          <List style={{ height: '100%', width: '100%' }}>{renderPanel()}</List>
        </div>
      </div>
    </>
  )
}
