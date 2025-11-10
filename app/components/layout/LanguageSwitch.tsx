'use client'

import { useTranslation } from 'react-i18next'
import { useState, useEffect, useCallback } from 'react'
import { useDevice } from '@/contexts/DeviceContext'

/**
 * Language switcher component.
 *
 * A component that allows users to switch between Chinese and English languages.
 * Handles client-side rendering to avoid hydration mismatches.
 */
export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [currentLang, setCurrentLang] = useState('zh')

  const { isMobile } = useDevice()
  const LanguageEn = '/img/language_en.png'
  const LanguageZh = '/img/language_zh.png'

  // Ensure client-side rendering only to avoid hydration mismatch
  useEffect(() => {
    // Get current language from i18n
    const initialLang = i18n.language || 'zh'
    setCurrentLang(initialLang)

    // Listen for language changes
    /**
     * Handle language changed event.
     *
     * @param {string} lng The new language code.
     */
    const handleLanguageChanged = (lng: string) => {
      setCurrentLang(lng)
    }

    i18n.on('languageChanged', handleLanguageChanged)

    return () => {
      i18n.off('languageChanged', handleLanguageChanged)
    }
  }, [i18n])

  /**
   * Change the application language.
   *
   * @param {string} lng The language code to switch to ('zh' or 'en').
   */
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    setCurrentLang(lng)
  }
  const icon = useCallback(() => {
    return (
      <img
        src={currentLang === 'zh' ? LanguageEn : LanguageZh}
        alt="Language"
        style={{ width: '25px', height: '25px' }}
      />
    )
  }, [currentLang])
  return (
    <button
      className="account-btn"
      onClick={() => changeLanguage(currentLang === 'zh' ? 'en' : 'zh')}
      style={{
        width: isMobile ? '40px' : '50px',
        height: isMobile ? '40px' : '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon()}
    </button>
  )
}
