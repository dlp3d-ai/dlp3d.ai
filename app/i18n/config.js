/* eslint-disable no-undef */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { env } from 'next-runtime-env'
// Import language resource files directly
import zhFronted from './locales/zh/fronted.json'
import enFronted from './locales/en/fronted.json'
import zhClient from './locales/zh/client.json'
import enClient from './locales/en/client.json'

/**
 * i18n configuration module.
 *
 * Configures i18next for internationalization support with Chinese and English languages.
 * Handles language detection, resource loading, and initialization for both client and server environments.
 */
const resources = {
  zh: {
    fronted: zhFronted,
    client: zhClient,
  },
  en: {
    fronted: enFronted,
    client: enClient,
  },
}

/**
 * Get default language from environment variable.
 *
 * Reads NEXT_PUBLIC_LANGUAGE from .env file, defaults to 'en' if not set.
 *
 * @returns {string} The default language code ('zh' or 'en').
 */
const getDefaultLanguage = () => {
  const envLang = env('NEXT_PUBLIC_LANGUAGE')
  if (envLang === 'zh' || envLang === 'en') {
    return envLang
  }
  return 'en' // Default to English if not set
}

/**
 * Get initial language setting.
 *
 * Determines the initial language based on localStorage, environment variable,
 * or browser language detection. Priority: localStorage > env variable > browser language.
 * Returns default language for server-side rendering.
 *
 * @returns {string} The initial language code ('zh' or 'en').
 */
const getInitialLanguage = () => {
  const defaultLang = getDefaultLanguage()

  if (typeof window === 'undefined') {
    return defaultLang // Default to env language on server side
  }

  // Priority 1: read from localStorage (user's previous choice)
  try {
    const savedLang = window.localStorage?.getItem('i18nextLng')
    if (savedLang === 'zh' || savedLang === 'en') {
      return savedLang
    }
  } catch {
    // localStorage may not be available
  }

  // Priority 2: use environment variable (if no localStorage)
  // Don't detect browser language here, let it use env variable instead
  return defaultLang
}

i18n
  // Detect user language (client-side only)
  .use(LanguageDetector)
  // Pass react-i18next instance
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    lng: getInitialLanguage(), // Set initial language
    fallbackLng: getDefaultLanguage(), // Default language from env or 'en'
    defaultNS: 'fronted', // Default namespace
    ns: ['fronted', 'client'], // Supported namespaces
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      // Language detection order: only check localStorage (don't use navigator)
      // We want to use env variable as default, not browser language
      order: ['localStorage'],
      // Cache user language selection
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    react: {
      useSuspense: false, // Avoid Suspense issues
    },
  })

// Ensure language setting is correct
if (typeof window !== 'undefined') {
  try {
    const savedLang = window.localStorage?.getItem('i18nextLng')
    if (savedLang === 'zh' || savedLang === 'en') {
      // Use saved language if exists
      i18n.changeLanguage(savedLang)
    } else {
      // If no saved language, use environment variable
      const defaultLang = getDefaultLanguage()
      i18n.changeLanguage(defaultLang)
    }
  } catch {
    // If localStorage is not available, use environment variable
    const defaultLang = getDefaultLanguage()
    i18n.changeLanguage(defaultLang)
  }
}

export default i18n
