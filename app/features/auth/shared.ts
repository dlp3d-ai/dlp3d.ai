import { useDispatch } from 'react-redux'
import { logout } from './authStore'

export interface AuthState {
  isLogin: boolean
  userInfo: UserInfo
}
export interface UserInfo {
  username: string
  email: string
  id: string
}
