'use client'

import React, { useState } from 'react'

import CheckIcon from '@mui/icons-material/Check'

import { useSelector } from 'react-redux'
import { getIsSceneLoading } from '@/features/chat/chat'
import { getSelectedChat } from '@/features/chat/chat'
import { usePromptingSettings } from '@/hooks/usePromptingSettings'
import { HDRI_SCENES } from '@/library/babylonjs/config/scene'
import { useTranslation } from 'react-i18next'
import GlobalTooltip from '@/components/common/GlobalTooltip'

/**
 * Props for ScenePanel component.
 */
interface ScenePanelProps {
  /** Callback function called when a scene is selected. */
  onSceneChange: (scene: string) => void
}

/**
 * ScenePanel component.
 *
 * A panel component for selecting and managing HDRI scene environments.
 * Displays a list of available scenes and allows users to select and update
 * the active scene for the character.
 */
export default function ScenePanel({ onSceneChange }: ScenePanelProps) {
  const { t } = useTranslation()
  const settings = useSelector(getSelectedChat)
  const [selectedScene, setSelectedScene] = useState(settings?.scene_name)
  const isLoading = useSelector(getIsSceneLoading)
  const { updateCharacter } = usePromptingSettings()
  /**
   * Handle scene selection.
   *
   * Updates the selected scene, saves it to the character configuration,
   * and calls the parent component's callback function.
   *
   * @param {string} name The name of the selected scene.
   * @param {number} index The index of the selected scene in HDRI_SCENES array.
   */
  const handleSceneSelect = async (name: string, index: number) => {
    if (isLoading) return
    if (name === settings?.scene_name) return
    setSelectedScene(name)
    const res = await updateCharacter(settings!.character_id, 'scene', {
      scene_name: name,
    })
    if (!res) return
    onSceneChange(HDRI_SCENES[index].name) // Call parent component callback
  }

  return (
    <div
      className="config-sidebar-drawer-list"
      style={{ maxHeight: '100%', overflowY: 'auto', position: 'relative' }}
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

            <div className="config-sidebar-drawer-list-item-name">
              {t(`scenes.${scene.name}`)}
            </div>
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
      <div style={{ position: 'absolute', top: '0', right: '20px', color: '#fff' }}>
        <GlobalTooltip content={[t('tip.scene')]} />
      </div>
    </div>
  )
}
