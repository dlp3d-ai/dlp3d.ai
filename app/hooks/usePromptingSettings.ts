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

export function usePromptingSettings() {
  const dispatch = useDispatch()

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
      await selectCharacter(userCharacters[0].character_id)
    }
    return userCharacters
  }

  // Select character and load its settings
  const selectCharacter = async (id: string) => {
    if (!user?.id) return

    try {
      const character = await getCharacterConfig(user.id, id)
      if (!character) {
        showErrorNotification('Character not found')
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
      showErrorNotification(error, 'Failed to load character')
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
      showErrorNotification('Please log in to delete characters')
      return
    }

    // if (selectedCharacter?.read_only) {
    //   showErrorNotification('Cannot delete the default character')
    // }
    // if (characters.find(item => item.character_id === id)!.read_only) {
    //   showErrorNotification('Cannot delete the default character')
    //   return
    // }
    const character = await getCharacterConfig(user.id, id)
    if (character.read_only) {
      showErrorNotification('Cannot delete the default character')
      return
    }

    try {
      await fetchDeleteCharacter({ user_id: user.id, character_id: id })

      await loadUserCharacters()

      if (selectedCharacter?.character_id === id) {
        selectCharacter(characters[0].character_id)
      }
    } catch (error) {
      showErrorNotification('Failed to delete character')
    }
  }
  const updateUserConfig = async (key: string, value: any) => {
    if (!user?.id) {
      showErrorNotification('Please log in to update user config')
      return
    }

    await fetchUpdateUserConfig({
      user_id: user.id,
      [key]: value,
    })
  }
  const getLLMList = async () => {
    if (!user?.id) {
      showErrorNotification('Please log in to get LLM list')
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
      showErrorNotification('Please log in to update characters')
      return false
    }
    const character = await getCharacterConfig(user.id, id)
    if (character?.read_only) {
      showErrorNotification(
        'Editing the default character is not allowed. You must create a copy to make any changes.',
      )
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
      showErrorNotification('Please log in to update character name')
      return
    }
    const character = await getCharacterConfig(user.id, id)
    if (character?.read_only) {
      showErrorNotification('Cannot update character name for the default character')
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
