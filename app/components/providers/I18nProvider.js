'use client'

import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/config'

/**
 * I18n provider component.
 *
 * Provides i18n context to child components. The i18n instance is already
 * initialized in config.js and is used directly here.
 *
 * @param {Object} props Component props.
 * @param {React.ReactNode} props.children Child components to wrap with i18n provider.
 * @returns {JSX.Element} The I18nextProvider wrapper component.
 */
export default function I18nProvider({ children }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
