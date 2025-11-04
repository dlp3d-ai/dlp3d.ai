'use client'

import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { CHARACTER_MODELS } from '@/constants/index'
import { getSelectedChat } from '@/features/chat/chat'
import { setSelectedModelIndex } from '@/features/chat/chatStore'
import CheckIcon from '@mui/icons-material/Check'
import { fetchUpdateAvatar } from '@/request/api'
import { useErrorNotification } from '@/hooks/useGlobalNotification'
import { useTranslation } from 'react-i18next'

/**
 * ModelPanel component.
 *
 * A panel component for selecting and managing character models/avatars.
 * Displays a list of available character models and allows users to select
 * and update the active character avatar.
 */
export default function ModelPanel() {
  const { showErrorNotification } = useErrorNotification()
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const settings = useSelector(getSelectedChat)
  const [selectAvatar, setSelectAvatar] = useState(settings?.avatar)

  /**
   * Handle character selection.
   *
   * Updates the selected avatar, saves it to the backend, and updates
   * the Redux store. Shows an error notification if the character is read-only.
   *
   * @param {number} index The index of the selected character model.
   */
  const handleCharacterSelect = async (index: number) => {
    if (settings?.read_only) {
      showErrorNotification(t('notification.editDefaultCharacterNotAllowed'))
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
      {/* Character list */}
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
              {t(`characters.${character.name}`)}
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
