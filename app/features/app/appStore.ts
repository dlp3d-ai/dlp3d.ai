import { AppConfig } from '@/types/app'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppState } from './shared'

const initialState: AppState = {
  config: {
    auth: {
      users: [],
    },
    database: {
      host: '',
      port: 0,
      database: '',
      username: '',
      password: '',
    },
    environment: 'dev',
    version: '1.0.0',
  },
}

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setConfig: (state, action: PayloadAction<AppConfig>) => {
      state.config = action.payload
    },
  },
  selectors: {
    getConfig: state => state.config,
  },
})

export const { setConfig } = appSlice.actions

export const { getConfig } = appSlice.selectors

export default appSlice.reducer
