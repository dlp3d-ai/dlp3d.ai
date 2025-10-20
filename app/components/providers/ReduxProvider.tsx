'use client'

import { Provider } from 'react-redux'
import { store } from '@/store'

interface ReduxProviderProps {
  children: React.ReactNode
}

export default function ReduxProvider({ children }: ReduxProviderProps) {
  return <Provider store={store}>{children}</Provider>
}
