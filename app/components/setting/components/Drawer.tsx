import React, { useEffect } from 'react'
import { useDevice } from '../../../contexts/DeviceContext'
import { useSelector, useDispatch } from 'react-redux'

import List from '@mui/material/List'
import Dialog from '@mui/material/Dialog'

import DialogContent from '@mui/material/DialogContent'

import '../styles/drawer.scss'
import { getIsLeftSliderOpen, setIsLeftSliderOpen } from '@/features/chat/chat'
import SettingPanel from './SettingPanel'

interface LeftDrawerProps {
  active: string
  onClose: () => void
}

export default function LeftSidebarDrawer({ active, onClose }: LeftDrawerProps) {
  const { isMobile } = useDevice()
  const dispatch = useDispatch()
  const isLeftSliderOpen = useSelector(getIsLeftSliderOpen)

  useEffect(() => {
    if (active && !isLeftSliderOpen) {
      // 首次打开弹窗
      dispatch(setIsLeftSliderOpen(true))
    } else if (!active && isLeftSliderOpen) {
      // 关闭弹窗
      dispatch(setIsLeftSliderOpen(false))
    }
  }, [active, isLeftSliderOpen, dispatch])

  const renderPanel = () => {
    switch (active) {
      case 'setting':
        return <SettingPanel />
      default:
        return <div>Unknown panel type</div>
    }
  }

  if (!isLeftSliderOpen) return null

  // 手机端使用 Dialog 弹窗
  if (isMobile) {
    return (
      <Dialog
        open={isLeftSliderOpen}
        onClose={onClose}
        maxWidth="sm"
        PaperProps={{
          style: {
            backgroundColor: '#1b1d2b',
            color: '#fff',
            width: '400px',
            height: '210px',
            maxHeight: '210px',
            borderRadius: '12px',
          },
        }}
      >
        <DialogContent
          style={{
            padding: 0,
            backgroundColor: '#1b1d2b',
            height: 'calc(100% - 60px)',
            overflow: 'auto',
          }}
        >
          <List style={{ height: '100%', width: '100%' }}>{renderPanel()}</List>
        </DialogContent>
      </Dialog>
    )
  }

  // 桌面端使用原有的抽屉样式
  return (
    <>
      {/* Drawer */}
      <div
        className="left-sidebar-drawer"
        style={{
          zIndex: 999,
          height: '250px',
        }}
      >
        {/* Content */}
        <div
          style={{
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <List style={{ height: '100%', width: '100%' }}>{renderPanel()}</List>
        </div>
      </div>
    </>
  )
}
