import React, { useState } from 'react'

import CheckIcon from '@mui/icons-material/Check'

import { useSelector } from 'react-redux'
import { getIsSceneLoading } from '@/features/chat/chat'
import { getSelectedChat } from '@/features/chat/chat'
import { usePromptingSettings } from '@/hooks/usePromptingSettings'
import { HDRI_SCENES } from '@/library/babylonjs/config/scene'
interface ScenePanelProps {
  onSceneChange: (scene: string) => void
}

export default function ScenePanel({ onSceneChange }: ScenePanelProps) {
  // Local state for selected scene index
  const settings = useSelector(getSelectedChat)
  const [selectedScene, setSelectedScene] = useState(settings?.scene_name)
  const isLoading = useSelector(getIsSceneLoading)
  const { updateCharacter } = usePromptingSettings()
  const handleSceneSelect = async (name: string, index: number) => {
    if (isLoading) return
    if (name === settings?.scene_name) return
    setSelectedScene(name)
    const res = await updateCharacter(settings!.character_id, 'scene', {
      scene_name: name,
    })
    if (!res) return
    onSceneChange(HDRI_SCENES[index].name) // 调用父组件的回调函数
  }

  return (
    <div
      className="config-sidebar-drawer-list"
      style={{ maxHeight: '100%', overflowY: 'auto' }}
    >
      {HDRI_SCENES.map((scene, index) => {
        return (
          <div
            className={`config-sidebar-drawer-list-item ${
              selectedScene === scene.name ? 'active' : ''
            }`}
            key={scene.id}
            onClick={() => handleSceneSelect(scene.name, index)}
            style={{ position: 'relative' }}
          >
            <img
              src={scene.image}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            <div className="config-sidebar-drawer-list-item-name">{scene.name}</div>
            {selectedScene === scene.name && (
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
        )
      })}
    </div>
  )
}
