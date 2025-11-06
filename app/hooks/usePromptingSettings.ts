import { useErrorNotification } from './useGlobalNotification'

import { useSelector, useDispatch } from 'react-redux'

import { getUserInfo, getIsLogin } from '@/features/auth/authStore'

import { CHARACTER_MODELS } from '@/constants/index'
import {
  getChatList,
  getSelectedChat,
  setChatList,
  setSelectedChat,
  setSelectedModelIndex,
  getSelectedModelIndex,
} from '@/features/chat/chatStore'
import { getSelectedCharacterId, setSelectedCharacterId } from '@/features/chat/chat'
import {
  getCharactersList,
  getCharacterConfig,
  fetchDeleteCharacter,
  updateCharacterPrompt,
  updateCharacterAsr,
  updateCharacterMemory,
  updateCharacterScene,
  updateCharacterTts,
  updateCharacterClassification,
  updateCharacterConversation,
  updateCharacterReaction,
  duplicateCharacter,
  fetchUpdateUserConfig,
  getAvailableLlm,
  fetchUpdateName,
} from '@/request/api'
import { useTranslation } from 'react-i18next'

export function usePromptingSettings() {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const selectedCharacterId = useSelector(getSelectedCharacterId)
  const selectedModelIndex = useSelector(getSelectedModelIndex)
  const { showErrorNotification } = useErrorNotification()

  const characters = useSelector(getChatList)
  const selectedCharacter = useSelector(getSelectedChat)

  const user = useSelector(getUserInfo)
  const isLogin = useSelector(getIsLogin)

  // Load user characters
  const loadUserCharacters = async () => {
    if (!user?.id || !isLogin) return
    const userCharacters = await getCharactersList(user.id)
    dispatch(setChatList(userCharacters))
    if (!selectedCharacter) {
      const id = localStorage.getItem('dlp_selected_character_id')
      if (id && userCharacters.some(item => item.character_id === id)) {
        await selectCharacter(id)
      } else {
        await selectCharacter(userCharacters[0].character_id)
      }
    }
    return userCharacters
  }

  // Select character and load its settings
  const selectCharacter = async (id: string) => {
    if (!user?.id) return

    try {
      const character = await getCharacterConfig(user.id, id)
      if (!character) {
        showErrorNotification(t('notification.characterNotFound'))
        return
      }
      dispatch(setSelectedChat(character))
      dispatch(setSelectedCharacterId(id))
      localStorage.setItem('dlp_selected_character_id', id)
      const index = CHARACTER_MODELS.findIndex(i => i.name === character.avatar)
      if (index !== selectedModelIndex) {
        dispatch(setSelectedModelIndex(index))
      }
    } catch (error) {
      showErrorNotification(error, t('notification.loadCharacterFailed'))
    }
  }
  const copyCharacter = async (id: string) => {
    if (!user?.id) return
    const res = await duplicateCharacter({ user_id: user.id, character_id: id })
    await loadUserCharacters()
    return res.character_id
  }
  // Delete character
  const deleteCharacter = async (id: string): Promise<void> => {
    if (!user?.id) {
      showErrorNotification(t('notification.logInToDeleteCharacters'))
      return
    }

    const character = await getCharacterConfig(user.id, id)
    if (character.read_only) {
      showErrorNotification(t('notification.deleteDefaultCharacterNotAllowed'))
      return
    }

    try {
      await fetchDeleteCharacter({ user_id: user.id, character_id: id })

      await loadUserCharacters()

      if (selectedCharacter?.character_id === id) {
        selectCharacter(characters[0].character_id)
      }
    } catch (error) {
      showErrorNotification(t('notification.deleteCharacterFailed'))
    }
  }
  const updateUserConfig = async (key: string, value: any) => {
    if (!user?.id) {
      showErrorNotification(t('notification.logInToUpdateUserConfig'))
      return
    }

    await fetchUpdateUserConfig({
      user_id: user.id,
      [key]: value,
    })
  }
  const getLLMList = async () => {
    if (!user?.id) {
      showErrorNotification(t('notification.logInToGetLLMList'))
      return
    }
    return await getAvailableLlm(user.id)
  }
  const updateCharacter = async (
    id: string,
    configName:
      | 'prompt'
      | 'asr'
      | 'scene'
      | 'tts'
      | 'classification'
      | 'conversation'
      | 'reaction'
      | 'memory',
    value: any,
  ) => {
    if (!user?.id) {
      showErrorNotification(t('notification.logInToUpdateCharacters'))
      return false
    }
    const character = await getCharacterConfig(user.id, id)
    if (character?.read_only) {
      showErrorNotification(t('notification.editDefaultCharacterNotAllowed'))
      return false
    }

    switch (configName) {
      case 'prompt':
        await updateCharacterPrompt({
          user_id: user.id,
          character_id: id,
          prompt: value.prompt,
        })
        break
      case 'asr':
        await updateCharacterAsr({
          user_id: user.id,
          character_id: id,
          asr_adapter: value.asr_adapter,
        })
        break
      case 'memory':
        await updateCharacterMemory({
          user_id: user.id,
          character_id: id,
          memory_adapter: value.memory_adapter,
          memory_model_override: value.memory_model_override,
        })
        break
      case 'scene':
        await updateCharacterScene({
          user_id: user.id,
          character_id: id,
          scene_name: value.scene_name,
        })
        break
      case 'tts':
        await updateCharacterTts({
          user_id: user.id,
          character_id: id,
          tts_adapter: value.tts_adapter,
          voice: value.voice,
          voice_speed: value.voice_speed,
        })
        break
      case 'classification':
        await updateCharacterClassification({
          user_id: user.id,
          character_id: id,
          classification_adapter: value.classification_adapter,
          classification_model_override: value.classification_model_override,
        })
        break
      case 'conversation':
        await updateCharacterConversation({
          user_id: user.id,
          character_id: id,
          conversation_adapter: value.conversation_adapter,
          conversation_model_override: value.conversation_model_override,
        })
        break
      case 'reaction':
        await updateCharacterReaction({
          user_id: user.id,
          character_id: id,
          reaction_adapter: value.reaction_adapter,
          reaction_model_override: value.reaction_model_override,
        })
        break
      default:
        break
    }

    const selectedCharacter = await getCharacterConfig(user.id, selectedCharacterId!)
    dispatch(setSelectedChat(selectedCharacter))
  }
  const updateCharacterName = async (id: string, name: string) => {
    if (!user?.id) {
      showErrorNotification(t('notification.logInToUpdateCharacterName'))
      return
    }
    const character = await getCharacterConfig(user.id, id)
    if (character?.read_only) {
      showErrorNotification(t('notification.updateDefaultCharacterNameNotAllowed'))
      return
    }

    await fetchUpdateName(user.id, id, name)
  }
  return {
    // State
    characters,
    selectedCharacter,

    // Methods
    selectCharacter,
    deleteCharacter,
    loadUserCharacters,
    updateCharacter,
    copyCharacter,
    updateUserConfig,
    getLLMList,
    updateCharacterName,
  }
}
