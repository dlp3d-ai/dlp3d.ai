import type { PayloadAction } from '@reduxjs/toolkit'
import type { AuthState, UserInfo } from './shared'
import { createSlice } from '@reduxjs/toolkit'

// localStorage 键名
const AUTH_STORAGE_KEY = 'dlp3d_auth_state'
const USER_LOCATION_KEY = 'dlp_user_location'

// 默认状态
export const getDefaultAuthState = (): AuthState => ({
  isLogin: false,
  userInfo: {
    username: '',
    email: '',
    id: '',
  },
})

// 从localStorage读取认证状态（仅在客户端）
export const loadAuthStateFromStorage = (): AuthState => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (stored) {
      const parsedState = JSON.parse(stored)
      // 验证存储的数据结构
      if (parsedState && typeof parsedState.isLogin === 'boolean') {
        return {
          isLogin: parsedState.isLogin,
          userInfo: {
            username: parsedState.userInfo?.username || '',
            email: parsedState.userInfo?.email || '',
            id: parsedState.userInfo?.id || '',
          },
        }
      }
    }
  } catch (error) {
    console.warn('Failed to load auth state from localStorage:', error)
  }

  // 如果读取失败或数据无效，返回默认状态
  return getDefaultAuthState()
}

// 清除localStorage中的认证状态
export const clearAuthStateFromStorage = () => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem(USER_LOCATION_KEY)
  } catch (error) {
    console.warn('Failed to clear auth state from localStorage:', error)
  }
}

// 初始状态始终使用默认状态，避免SSR hydration不匹配
// const initialState: AuthState = loadAuthStateFromStorage();
const initialState: AuthState = getDefaultAuthState()

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setIsLogin: (state, action: PayloadAction<boolean>) => {
      state.isLogin = action.payload
      // 如果设置为未登录，清除用户信息
      if (!action.payload) {
        state.userInfo = {
          username: '',
          email: '',
          id: '',
        }
      }
    },
    setUserInfo: (state, action: PayloadAction<UserInfo>) => {
      state.userInfo = action.payload
      // 设置用户信息时自动设置为已登录
      state.isLogin = true
    },
    // 新增：同时设置登录状态和用户信息
    setAuthState: (
      state,
      action: PayloadAction<{ isLogin: boolean; userInfo: UserInfo }>,
    ) => {
      state.isLogin = action.payload.isLogin
      state.userInfo = action.payload.userInfo
    },
    // 新增：登出操作
    logout: state => {
      console.log('logout')
      state.isLogin = false
      state.userInfo = {
        username: '',
        email: '',
        id: '',
      }
      clearAuthStateFromStorage()
    },

    // 新增：客户端hydration后初始化认证状态
    initializeAuthFromStorage: state => {
      const storedState = loadAuthStateFromStorage()
      state.isLogin = storedState.isLogin
      state.userInfo = storedState.userInfo
    },
  },

  selectors: {
    getIsLogin: state => state.isLogin,
    getUserInfo: state => state.userInfo,
  },
})

export const {
  setIsLogin,
  setUserInfo,
  setAuthState,
  logout,
  initializeAuthFromStorage,
} = authSlice.actions

export const { getIsLogin, getUserInfo } = authSlice.selectors

export default authSlice.reducer
