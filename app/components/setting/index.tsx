'use client'
import { useDevice } from '../../contexts/DeviceContext'
import { useDispatch } from 'react-redux'
import { useState } from 'react'

import LeftSidebarDrawer from './components/Drawer'
import './styles/index.scss'

// Redux imports
import { setIsLeftSliderOpen } from '@/features/chat/chat'
import { useTranslation } from 'react-i18next'

/**
 * LeftSidebar
 *
 * Entry component for the left settings sidebar. Manages open/close state
 * and toggles the settings drawer.
 *
 * @returns JSX.Element The left settings sidebar launcher.
 */
export default function LeftSidebar() {
  const { isMobile } = useDevice()
  const dispatch = useDispatch()
  const [active, setActive] = useState('')
  const { t } = useTranslation()
  /**
   * Handle click on the settings launcher.
   *
   * Toggles the left drawer and updates Redux state accordingly.
   *
   * @param event React.MouseEvent The click event.
   *
   * @returns void
   */
  const onSettingClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    if (active === 'setting') {
      setActive('')
      dispatch(setIsLeftSliderOpen(false))
      return
    }
    setActive('setting')
    dispatch(setIsLeftSliderOpen(true))
  }

  return (
    <>
      <div
        className={`left-sidebar left-sidebar-${isMobile ? 'mobile' : 'desktop'}`}
        style={{
          borderRadius: '0 50px 50px 0',
        }}
      >
        <div className={`left-sidebar-item }`} onClick={onSettingClick}>
          <div
            className="left-sidebar-item-icon"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <img src="/img/setting.png" />
            <span
              style={{
                color: '#fff',
                fontSize: isMobile ? '12px' : '12px',
                fontWeight: 600,
              }}
            >
              {t('simulationPanel.title')}
            </span>
          </div>
        </div>
      </div>

      <LeftSidebarDrawer
        active={active}
        onClose={() => {
          setActive('')
          dispatch(setIsLeftSliderOpen(false))
        }}
      />
    </>
  )
}
