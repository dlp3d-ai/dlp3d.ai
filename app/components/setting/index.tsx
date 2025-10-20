import { useDevice } from '../../contexts/DeviceContext'
import { useDispatch } from 'react-redux'
import { useState } from 'react'

import LeftSidebarDrawer from './components/Drawer'
import './styles/index.scss'

// Redux imports
import { setIsLeftSliderOpen } from '@/features/chat/chat'

export default function LeftSidebar() {
  const { isMobile } = useDevice()
  const dispatch = useDispatch()
  const [active, setActive] = useState('')

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
              SIMULATION
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
