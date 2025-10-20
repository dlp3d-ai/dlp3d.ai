'use client'

import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { CHARACTER_MODELS } from '@/constants/index'
import { getSelectedChat } from '@/features/chat/chat'
import { setSelectedModelIndex } from '@/features/chat/chatStore'
import CheckIcon from '@mui/icons-material/Check'
import { fetchUpdateAvatar } from '@/request/api'
import { useErrorNotification } from '@/hooks/useGlobalNotification'

export default function ModelPanel() {
  const { showErrorNotification } = useErrorNotification()
  const dispatch = useDispatch()
  const settings = useSelector(getSelectedChat)
  const [selectAvatar, setSelectAvatar] = useState(settings?.avatar)

  const handleCharacterSelect = async (index: number) => {
    if (settings?.read_only) {
      showErrorNotification(
        'Editing the default character is not allowed. You must create a copy to make any changes.',
      )
      return
    }
    setSelectAvatar(CHARACTER_MODELS[index].name)
    await fetchUpdateAvatar(
      settings!.user_id!,
      settings!.character_id!,
      CHARACTER_MODELS[index].name,
    )
    dispatch(setSelectedModelIndex(index))
  }

  return (
    <div
      className="config-sidebar-drawer-list"
      style={{ overflowY: 'auto', height: '100%' }}
    >
      {/* 角色列表 - 使用 userCharacters 数据 */}
      {CHARACTER_MODELS.map((character, index) => {
        return (
          <div
            className={`config-sidebar-drawer-list-item ${
              selectAvatar === character.name ? 'active' : ''
            }`}
            key={character.id}
            onClick={() => handleCharacterSelect(index)}
            style={{ position: 'relative' }}
          >
            <img
              src={character.preview}
              alt={character.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            <div className="config-sidebar-drawer-list-item-name">
              {character.name}
            </div>
            {selectAvatar === character.name && (
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
