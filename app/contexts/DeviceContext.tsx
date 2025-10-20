'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react'

interface DeviceContextValue {
  isMobile: boolean
  isInitialized: boolean
}

const DeviceContext = createContext<DeviceContextValue>({
  isMobile: false,
  isInitialized: false,
})

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isMobile, setIsMobile] = useState<boolean>(false)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)

  // 使用 useLayoutEffect 确保在 DOM 更新前就设置正确的值
  useLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth <= 768)
      setIsInitialized(true)
    }
  }, [])

  useEffect(() => {
    // 处理窗口大小变化
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth <= 768)
      }
    }

    // 添加事件监听器
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [])

  return (
    <DeviceContext.Provider value={{ isMobile, isInitialized }}>
      {children}
    </DeviceContext.Provider>
  )
}

export const useDevice = () => useContext(DeviceContext)
