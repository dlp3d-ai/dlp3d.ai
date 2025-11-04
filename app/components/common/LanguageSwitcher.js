'use client'

import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import './LanguageSwitcher.scss'

/**
 * Language switcher component.
 *
 * A component that allows users to switch between Chinese and English languages.
 * Handles client-side rendering to avoid hydration mismatches.
 */
export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [currentLang, setCurrentLang] = useState('zh')
  const [mounted, setMounted] = useState(false)

  // Ensure client-side rendering only to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    // Get current language from i18n
    const initialLang = i18n.language || 'zh'
    setCurrentLang(initialLang)

    // Listen for language changes
    /**
     * Handle language changed event.
     *
     * @param {string} lng The new language code.
     */
    const handleLanguageChanged = lng => {
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
  const changeLanguage = lng => {
    i18n.changeLanguage(lng)
    setCurrentLang(lng)
  }

  // Don't render before client-side mount to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="language-switcher">
        <button className="lang-btn" disabled>
          中文
        </button>
        <button className="lang-btn" disabled>
          EN
        </button>
      </div>
    )
  }

  return (
    <div className="language-switcher">
      <button
        className={`lang-btn ${currentLang === 'zh' ? 'active' : ''}`}
        onClick={() => changeLanguage('zh')}
        title="中文"
      >
        中文
      </button>
      <button
        className={`lang-btn ${currentLang === 'en' ? 'active' : ''}`}
        onClick={() => changeLanguage('en')}
        title="English"
      >
        EN
      </button>
    </div>
  )
}
