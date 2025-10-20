import { useDevice } from '../../contexts/DeviceContext'
import { useSelector, useDispatch } from 'react-redux'
import { useState } from 'react'
import ConfigSidebarDrawer from './components/Drawer'

import './styles/index.scss'

// Redux imports
import { getIsChatStarting, getSelectedCharacterId } from '@/features/chat/chat'

import { setIsSliderOpen } from '@/features/chat/chat'
import { usePromptingSettings } from '@/hooks/usePromptingSettings'

interface ConfigSidebarProps {
  chatAvailable: boolean
  isCharacterLoading: boolean
  isSceneLoading: boolean

  handleStartConversation: () => void
  onSceneChange: (scene: string) => void
}

export default function ConfigSidebar({
  handleStartConversation,
  chatAvailable,
  isCharacterLoading,
  isSceneLoading,

  onSceneChange,
}: ConfigSidebarProps) {
  const { isMobile } = useDevice()
  const dispatch = useDispatch()
  const isChatStarting = useSelector(getIsChatStarting)

  const selectedCharacterId = useSelector(getSelectedCharacterId)

  const [active, setActive] = useState('')
  const { loadUserCharacters } = usePromptingSettings()

  const operationList = [
    {
      name: '3D model',
      icon: '/img/icons/model.png',
      key: 'model',
    },
    {
      name: 'Prompt',
      icon: '/img/icons/prompt.png',
      key: 'prompt',
    },
    {
      name: 'LLM',
      icon: '/img/icons/llm.png',
      key: 'llm',
    },
    {
      name: 'ASR/TTS',
      icon: '/img/icons/tts.png',
      key: 'tts',
    },
    {
      name: 'Scene',
      icon: '/img/icons/scene.png',
      key: 'scene',
    },
  ]

  const onItemClick = async (key: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (!selectedCharacterId) {
      await loadUserCharacters()
    }
    if (key === active) {
      setActive('')
      return
    }
    setActive(key)

    dispatch(setIsSliderOpen(true)) // 更新 Redux 状态
  }

  return (
    <>
      {/* 移动端 */}
      {!isChatStarting && isMobile && (
        <div className="config-sidebar-mobile-button">
          <div className="button-group-container button-group-container-mobile">
            <button
              className="start-conversation-btn"
              onClick={handleStartConversation}
              disabled={!chatAvailable || isCharacterLoading || isSceneLoading}
              style={{
                opacity:
                  chatAvailable && !isCharacterLoading && !isSceneLoading ? 1 : 0.6,
                cursor:
                  chatAvailable && !isCharacterLoading && !isSceneLoading
                    ? 'pointer'
                    : 'not-allowed',
                borderRadius: '30px 0 0 30px', // Only round the left side
                left: '0',
              }}
            >
              {chatAvailable && !isCharacterLoading && !isSceneLoading
                ? 'Chat'
                : 'Coming Soon'}
            </button>
          </div>
        </div>
      )}

      <div
        className={`config-sidebar config-sidebar-${
          isMobile ? 'mobile' : 'desktop'
        }`}
        style={{
          borderRadius: isMobile && active ? '0' : '25px 0 0 25px',
        }}
      >
        {operationList.map((item, index) => (
          <div
            className={`config-sidebar-item ${active === item.key ? 'active' : ''}`}
            key={index}
            onClick={event => onItemClick(item.key, event)}
          >
            <div className="config-sidebar-item-icon">
              <img src={item.icon} />
            </div>
            <span className="config-sidebar-item-name">{item.name}</span>
          </div>
        ))}
      </div>
      <ConfigSidebarDrawer
        active={active}
        onClose={() => {
          setActive('')
          dispatch(setIsSliderOpen(false)) // 更新 Redux 状态
        }}
        onSceneChange={onSceneChange}
      />
    </>
  )
}
