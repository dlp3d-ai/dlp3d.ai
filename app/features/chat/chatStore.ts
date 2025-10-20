import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

import { Character } from '@/request/api'
import { CharacterConfig } from '@/types/character'
// Export the ChatState type
export type { ChatState }
interface ChatState {
  // initialState
  isChatStarting: boolean
  selectedModelIndex: number
  selectedCharacterId: string | null
  isCharacterLoading: boolean
  loadingText: string
  isSceneLoading: boolean
  isSliderOpen: boolean
  isLeftSliderOpen: boolean
  loadingProgress: number
  chatList: Character[]
  selectedChat: CharacterConfig | null
}

const initialState: ChatState = {
  // initialState
  isChatStarting: false,
  selectedModelIndex: 1,
  selectedCharacterId: null,
  isCharacterLoading: false,
  // loading
  loadingText: 'Loading...',
  isSceneLoading: true,
  isSliderOpen: false,
  isLeftSliderOpen: false,
  loadingProgress: 100,

  chatList: [],
  selectedChat: null,
}

export const chatSlice = createSlice({
  initialState,
  name: 'chat',
  reducers: {
    // initialState
    setIsChatStarting: (state, { payload }: PayloadAction<boolean>) => {
      state.isChatStarting = payload
    },
    // Numeric 3-D model index derived from selected character
    setSelectedModelIndex: (state, { payload }: PayloadAction<number>) => {
      state.selectedModelIndex = payload
    },
    setSelectedCharacterId: (state, { payload }: PayloadAction<string | null>) => {
      state.selectedCharacterId = payload
    },
    setIsCharacterLoading: (state, { payload }: PayloadAction<boolean>) => {
      state.isCharacterLoading = payload
    },
    setLoadingText: (state, { payload }: PayloadAction<string>) => {
      state.loadingText = payload
    },
    setIsSceneLoading: (state, { payload }: PayloadAction<boolean>) => {
      state.isSceneLoading = payload
    },
    setIsSliderOpen: (state, { payload }: PayloadAction<boolean>) => {
      state.isSliderOpen = payload
    },
    setIsLeftSliderOpen: (state, { payload }: PayloadAction<boolean>) => {
      state.isLeftSliderOpen = payload
    },
    setLoadingProgress: (state, { payload }: PayloadAction<number>) => {
      state.loadingProgress = payload
    },
    setChatList: (state, { payload }: PayloadAction<Character[]>) => {
      state.chatList = payload
    },
    setSelectedChat: (state, { payload }: PayloadAction<CharacterConfig | null>) => {
      state.selectedChat = payload
    },
  },
  selectors: {
    getIsChatStarting: state => state.isChatStarting,
    getSelectedModelIndex: state => state.selectedModelIndex,
    getSelectedCharacterId: state => state.selectedCharacterId,
    getIsCharacterLoading: state => state.isCharacterLoading,
    getLoadingText: state => state.loadingText,
    getIsSceneLoading: state => state.isSceneLoading,
    getIsSliderOpen: state => state.isSliderOpen,
    getIsLeftSliderOpen: state => state.isLeftSliderOpen,
    getLoadingProgress: state => state.loadingProgress,
    getChatList: state => state.chatList,
    getSelectedChat: state => state.selectedChat,
  },
})

// Export selectors
export const {
  getIsChatStarting,
  getSelectedModelIndex,
  getSelectedCharacterId,
  getIsCharacterLoading,
  getLoadingText,
  getIsSceneLoading,
  getIsSliderOpen,
  getIsLeftSliderOpen,
  getChatList,
  getSelectedChat,
  getLoadingProgress,
} = chatSlice.selectors

// Export actions
export const {
  setIsChatStarting,
  setSelectedModelIndex,
  setSelectedCharacterId,
  setIsCharacterLoading,
  setLoadingText,
  setIsSceneLoading,
  setIsSliderOpen,
  setIsLeftSliderOpen,
  setChatList,
  setSelectedChat,
  setLoadingProgress,
} = chatSlice.actions
