'use client'
import React, { useState, useEffect } from 'react'
import { useDevice } from '../../../contexts/DeviceContext'
import { ListItem, ListItemText, Switch } from '@mui/material'
import { useTranslation } from 'react-i18next'
import GlobalTooltip from '@/components/common/GlobalTooltip'

export default function SettingPanel() {
  /**
   * Handle cloth simulation toggle change.
   *
   * Updates local state and persists the selection to localStorage under key
   * 'cloth_simulation'.
   *
   * @param event Change event from the toggle input.
   *
   * @returns void
   */
  const { isMobile } = useDevice()
  const { t } = useTranslation()
  const [toggleEnabled, setToggleEnabled] = useState(
    window.localStorage.getItem('cloth_simulation') === '1',
  )
  const [debugEnabled, setDebugEnabled] = useState(
    window.localStorage.getItem('debug_mode') === '1',
  )

  /**
   * Handle cloth simulation toggle changes.
   *
   * @param event React.ChangeEvent<HTMLInputElement> The change event.
   *
   * @returns void
   */
  const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setToggleEnabled(event.target.checked)
    window.localStorage.setItem('cloth_simulation', event.target.checked ? '1' : '0')
  }

  /**
   * Handle debug mode toggle changes.
   *
   * @param event React.ChangeEvent<HTMLInputElement> The change event.
   *
   * @returns void
   */
  const handleDebugToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDebugEnabled(event.target.checked)
    window.localStorage.setItem('debug_mode', event.target.checked ? '1' : '0')
  }
  /**
   * Initialize default values in localStorage for cloth simulation and debug mode
   * when absent, and sync corresponding component states.
   *
   * @returns void
   */
  const initData = () => {
    if (window.localStorage.getItem('cloth_simulation') === null) {
      window.localStorage.setItem('cloth_simulation', '1')
      setToggleEnabled(true)
    }
    if (window.localStorage.getItem('debug_mode') === null) {
      window.localStorage.setItem('debug_mode', '0')
      setDebugEnabled(false)
    }
  }
  useEffect(() => {
    initData()
  }, [])
  return (
    <div
      style={{
        padding: isMobile ? '20px' : '20px',

        overflow: 'auto',
      }}
    >
      <ListItem
        style={{
          padding: 0,
          marginBottom: '20px',
          backgroundColor: '#222439',
          borderRadius: '10px',
          paddingLeft: '20px',
          paddingRight: '20px',
        }}
      >
        <ListItemText
          primary={
            <>
              <span style={{ height: '20px' }}>
                {t('simulationPanel.clothSimulation')}
              </span>
              <GlobalTooltip content={t('tip.settingClothDescription')} />
            </>
          }
          primaryTypographyProps={{
            style: {
              color: '#fff',
              fontSize: isMobile ? '14px' : '16px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',

              gap: '4px',
            },
          }}
          secondary={t('tip.settingCloth')}
          secondaryTypographyProps={{
            style: {
              color: '#888',
              fontSize: isMobile ? '12px' : '14px',
            },
          }}
        />
        <Switch
          checked={toggleEnabled}
          onChange={handleToggleChange}
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: '#5e6bd5',
              '& + .MuiSwitch-track': {
                backgroundColor: '#5e6bd5',
              },
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: '#5e6bd5',
            },
            '& .MuiSwitch-track': {
              backgroundColor: '#666',
            },
          }}
        />
      </ListItem>

      <ListItem
        style={{
          padding: 0,
          marginBottom: '20px',
          backgroundColor: '#222439',
          borderRadius: '10px',
          paddingLeft: '20px',
          paddingRight: '20px',
        }}
      >
        <ListItemText
          primary={
            <>
              <span style={{ height: '20px' }}>
                {t('simulationPanel.debugMode')}
              </span>
              <GlobalTooltip content={t('tip.settingDebugDescription')} />
            </>
          }
          primaryTypographyProps={{
            style: {
              color: '#fff',
              fontSize: isMobile ? '14px' : '16px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            },
          }}
          secondary={t('tip.settingDebug')}
          secondaryTypographyProps={{
            style: {
              color: '#888',
              fontSize: isMobile ? '12px' : '14px',
            },
          }}
        />
        <Switch
          checked={debugEnabled}
          onChange={handleDebugToggleChange}
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: '#5e6bd5',
              '& + .MuiSwitch-track': {
                backgroundColor: '#5e6bd5',
              },
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: '#5e6bd5',
            },
            '& .MuiSwitch-track': {
              backgroundColor: '#666',
            },
          }}
        />
      </ListItem>
    </div>
  )
}
