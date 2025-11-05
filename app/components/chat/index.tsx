import { useDevice } from '../../contexts/DeviceContext'
import { usePromptingSettings } from '../../hooks/usePromptingSettings'
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import ModeEditOutlineIcon from '@mui/icons-material/ModeEditOutline'
import DeleteOutline from '@mui/icons-material/Delete'
import ContentCopy from '@mui/icons-material/ContentCopy'
import CheckIcon from '@mui/icons-material/Check'
import { ConfirmDialog } from '../common/Dialog'
import './styles/index.scss'
import { CHARACTER_MODELS } from '@/constants/index'
import { HDRI_SCENES } from '@/library/babylonjs/config/scene'
import { Character, getCharacterConfig } from '@/request/api'
import { CharacterConfig } from '@/types/character'
import {
  getIsSliderOpen,
  setIsSliderOpen,
  getSelectedCharacterId,
  setSelectedCharacterId,
} from '@/features/chat/chat'
import { getUserInfo } from '@/features/auth/authStore'
import { useSelector, useDispatch } from 'react-redux'

/**
 * ChatListDrawer
 *
 * A drawer component that lists user conversations (characters) and allows users
 * to create, select, rename, and delete them. The drawer supports mobile and
 * desktop presentations and handles its own open/close animation state.
 *
 * @returns The chat list drawer React element
 */
export default function ChatListDrawer() {
  const { isMobile } = useDevice()
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const {
    characters,
    deleteCharacter,
    loadUserCharacters,
    selectCharacter,
    copyCharacter,
    updateCharacterName,
  } = usePromptingSettings()

  const selectedCharacterId = useSelector(getSelectedCharacterId)
  const selectedChatId = selectedCharacterId || null
  const user = useSelector(getUserInfo)
  const isSliderOpen = useSelector(getIsSliderOpen)

  const [isOpen, setIsOpen] = useState(false)

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [deleteKey, setDeleteKey] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatDetailList, setChatDetailList] = useState<
    (CharacterConfig & { item_preview: React.ReactNode })[]
  >([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Watch for changes in characters from Redux store and update chatDetailList
  useEffect(() => {
    const updateChatDetailList = async () => {
      if (!user?.id || !characters?.length) return

      const characterDetails = await Promise.allSettled(
        characters.map(async (item: Character) => {
          const character = await getCharacterConfig(user.id, item.character_id)
          return {
            ...character,
            item_preview: getChatPreview(character.avatar, character.scene_name),
          } as CharacterConfig & { item_preview: React.ReactNode }
        }),
      )

      const successfulResults: (CharacterConfig & {
        item_preview: React.ReactNode
      })[] = []

      characterDetails.forEach(result => {
        if (result.status === 'fulfilled') {
          successfulResults.push(result.value)
        }
      })

      setChatDetailList(successfulResults)
    }

    updateChatDetailList()
  }, [characters, user?.id])

  /**
   * Close the drawer with a brief animation.
   */
  /**
   * Close the drawer with a brief animation.
   */
  const handleClose = () => {
    setTimeout(() => setIsOpen(false), 300)
  }
  /**
   * Open the drawer and load user characters while showing a loading spinner.
   *
   * @returns Promise that resolves when loading finishes
   */
  const handleOpen = async () => {
    setIsOpen(true)
    setIsLoading(true)

    await loadUserCharacters()
    setIsLoading(false)
  }
  const handleEdit = (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    const character = chatDetailList.find(
      (item: CharacterConfig & { item_preview: React.ReactNode }) =>
        item.character_id === id,
    )
    if (character) {
      setEditingId(id)
      setEditingName(character.character_name)
    }
  }
  const handleCopy = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    const copyId = await copyCharacter(id)
    if (!copyId) return
    handleChatSelect(copyId)
  }
  const handleConfirmEdit = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (editingName.trim() === '') {
      return // Empty names are not allowed
    }
    await updateCharacterName(id, editingName)
    chatDetailList.find(item => item.character_id === id)!.character_name =
      editingName
    setEditingId(null)
    setEditingName('')
  }

  /**
   * Cancel the current edit and reset editing state.
   *
   * @param event The click event to stop propagation
   * @returns Void
   */
  const handleCancelEdit = (event: React.MouseEvent) => {
    event.stopPropagation()
    setEditingId(null)
    setEditingName('')
  }

  /**
   * Handle keyboard interactions while renaming a character.
   * Enter confirms the edit; Escape cancels it.
   *
   * @param event Keyboard event from the input
   * @param id The character identifier associated with the input
   * @returns Void
   */
  const handleKeyPress = (event: React.KeyboardEvent, id: string) => {
    if (event.key === 'Enter') {
      handleConfirmEdit(id, event as unknown as React.MouseEvent)
    } else if (event.key === 'Escape') {
      handleCancelEdit(event as unknown as React.MouseEvent)
    }
  }

  // Automatically focus the input when entering edit mode
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      // inputRef.current.select();
    }
  }, [editingId])

  useEffect(() => {
    if (isOpen && isSliderOpen) {
      dispatch(setIsSliderOpen(false))
    }
  }, [isOpen, isSliderOpen, dispatch])

  const handleChatSelect = async (id: string) => {
    // 如果正在编辑其他项目，先取消编辑
    if (editingId && editingId !== id) {
      setEditingId(null)
      setEditingName('')
    }

    await selectCharacter(id)
    dispatch(setSelectedCharacterId(id))
  }

  /**
   * Trigger the delete confirmation dialog for a chat (character).
   * Deletion is blocked while the item is being edited.
   *
   * @param id The character identifier to delete
   * @param event The click event to stop propagation
   * @returns Void
   */
  const handleChatDelete = (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    // Deletion is not allowed while the item is being edited
    if (editingId === id) {
      return
    }
    setDeleteKey(id)
    setIsConfirmDialogOpen(true)
  }
  const handleConfirmDelete = async () => {
    await deleteCharacter(deleteKey)

    setIsConfirmDialogOpen(false)
    setDeleteKey('')
  }
  const getChatPreview = (avatar: string, scene_name: string) => {
    const avatarPreview = avatar
      ? CHARACTER_MODELS.find(
          (item: { name: string; preview: string }) => item.name === avatar,
        )?.preview
      : CHARACTER_MODELS[0].preview
    const scenePreview = scene_name
      ? HDRI_SCENES.find(
          (item: { name: string; image: string }) =>
            item.name.toLowerCase() === scene_name.toLowerCase(),
        )?.image
      : HDRI_SCENES[5].image
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: `url(${scenePreview})`,
          backgroundSize: '100%',
        }}
      >
        <img
          src={avatarPreview}
          alt={avatar}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>
    )
  }

  /**
   * Render the chat list items
   */
  const renderChatList = () => {
    return chatDetailList.map(
      (item: CharacterConfig & { item_preview: React.ReactNode }) => (
        <div
          className={`chat-list-drawer-content-list-item ${
            selectedChatId === item.character_id ? 'selected' : ''
          }`}
          key={item.character_id}
          style={{
            position: 'relative',
            cursor: 'pointer',
          }}
        >
          <div
            className="chat-list-drawer-content-list-item-image"
            onClick={() => {
              if (editingId !== item.character_id) {
                handleChatSelect(item.character_id)
              }
            }}
            style={{
              border:
                selectedChatId === item.character_id ? '1px solid #fff' : 'none',
              cursor: editingId === item.character_id ? 'default' : 'pointer',
              opacity: editingId === item.character_id ? 0.7 : 1,
            }}
          >
            {item.item_preview}
          </div>
          <div className="chat-list-drawer-content-list-item-title">
            {editingId === item.character_id ? (
              <input
                ref={inputRef}
                type="text"
                value={editingName}
                onChange={e => setEditingName(e.target.value)}
                onKeyDown={e => handleKeyPress(e, item.character_id)}
                style={{
                  background: 'transparent',
                  borderRadius: '4px',
                  color: '#fff',
                  padding: '4px 8px',
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                  outline: 'none',
                  width: '100%',
                  maxWidth: '200px',
                  border: 'none',
                }}
              />
            ) : (
              <span>{item.character_name}</span>
            )}
            {editingId === item.character_id ? (
              <CheckIcon
                onClick={event => handleConfirmEdit(item.character_id!, event)}
                style={{
                  cursor: 'pointer',
                  color: '#fff',
                  fontSize: isMobile ? '1.2rem' : '1.5rem',
                }}
                className="chat-list-drawer-toggle-content-icon"
              />
            ) : (
              <ModeEditOutlineIcon
                onClick={event => handleEdit(item.character_id, event)}
                style={{ cursor: 'pointer' }}
                className="chat-list-drawer-toggle-content-icon"
              />
            )}
          </div>
          <ContentCopy
            onClick={event => handleCopy(item.character_id, event)}
            style={{
              cursor: editingId === item.character_id ? 'not-allowed' : 'pointer',
              position: 'absolute',
              top: '10px',
              right: isMobile ? '30px' : '40px',
              fontSize: isMobile ? '1rem' : '2rem',
              color: '#fff',
              opacity: editingId === item.character_id ? 0.5 : 1,
            }}
          />
          <DeleteOutline
            onClick={event => handleChatDelete(item.character_id, event)}
            style={{
              cursor: editingId === item.character_id ? 'not-allowed' : 'pointer',
              position: 'absolute',
              top: '10px',
              right: '10px',
              fontSize: isMobile ? '1rem' : '2rem',
              color: editingId === item.character_id ? '#666' : 'red',
              opacity: editingId === item.character_id ? 0.5 : 1,
            }}
          />
        </div>
      ),
    )
  }

  return (
    <>
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={() => handleConfirmDelete()}
        title={t('confirmDialog.title')}
        message={t('confirmDialog.deleteMessage')}
      />
      {isOpen && (
        <>
          {/* Backdrop Mask */}
          <div
            className="chat-list-drawer-mask"
            onClick={handleClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
            }}
          />
          {/* Drawer Content */}
          <div
            className={`chat-list-drawer-${isMobile ? 'mobile' : 'desktop'}`}
            style={{
              zIndex: 1000,

              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div className="chat-list-drawer-header">
              <div className="chat-list-drawer-header-icon" onClick={handleClose}>
                <KeyboardArrowUpIcon
                  style={{ fontSize: isMobile ? '1.5rem' : '3rem' }}
                />
              </div>
              <div className="chat-list-drawer-header-title">
                {t('chat.chatList')}
              </div>
            </div>
            <div className="chat-list-drawer-content">
              {isLoading ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    color: '#fff',
                    fontSize: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '3px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '3px solid #fff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginBottom: '16px',
                    }}
                  />
                  <span>{t('common.loading')}</span>
                </div>
              ) : (
                <>
                  <div className="chat-list-drawer-content-title">
                    {t('chat.myConversations')}
                    <div className="chat-list-drawer-content-title-line"></div>
                  </div>
                  <div
                    className="chat-list-drawer-content-list"
                    style={{
                      marginTop: isMobile ? '10px' : '20px',
                      maxHeight: isMobile ? '250px' : '100%',
                      overflowY: 'scroll',
                    }}
                  >
                    {renderChatList()}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {!isOpen && (
        <div className="chat-list-drawer-toggle">
          <div className="chat-list-drawer-toggle-content" onClick={handleOpen}>
            <span
              className="chat-list-drawer-toggle-content-title"
              style={{ fontSize: isMobile ? '1rem' : '1.2rem' }}
            >
              {t('chat.chatList')}
            </span>
            <ExpandMoreIcon className="chat-list-drawer-toggle-content-icon" />
          </div>
        </div>
      )}
    </>
  )
}
