'use client'

import React, { useEffect, useState } from 'react'
import { Dialog } from '@/components/common/Dialog'
import { useTranslation } from 'react-i18next'

interface EmailCodeModalProps {
  isOpen: boolean
  email?: string
  onClose: () => void
  onSubmit?: (code: string) => void | Promise<void>
  onResend?: () => void | Promise<void>
  isSubmitting?: boolean
  errorMessage?: string
}
export default function EmailCodeModal({
  isOpen,
  email,
  onClose,
  onSubmit,
  isSubmitting = false,
  errorMessage,
}: EmailCodeModalProps) {
  /*
    Handle verification code form submission.

    @param e React.FormEvent - The form submit event.

    @returns Promise<void> Resolves when the submit completes.
  */
  const [code, setCode] = useState('')
  const { t } = useTranslation()
  useEffect(() => {
    if (isOpen) {
      setCode('')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    await onSubmit?.(code.trim())
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={t('auth.emailVerificationCode')}
      maxWidth="420px"
      className="email-code-dialog"
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <div style={{ color: '#cfcfe1', lineHeight: 1.6 }}>
          {t('auth.weHaveSentAVerificationCodeTo')}{' '}
          <span style={{ color: '#fff', fontWeight: 600 }}>
            {email || 'your email'}
          </span>{' '}
          {t('auth.pleaseEnterThe6DigitCodeInTheEmailToCompleteTheVerification')}
        </div>

        <label style={{ color: '#8b8ea8', fontSize: '14px' }}>
          {t('auth.verificationCode')}
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder={t('auth.enterTheVerificationCode')}
          style={{
            width: '100%',
            height: '48px',
            padding: '0 14px',
            backgroundColor: 'transparent',
            border: '1px solid #333652',
            borderRadius: '8px',
            color: '#E0E0E0',
            fontSize: '16px',
            outline: 'none',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = '#6A6A8A'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = '#333652'
          }}
        />

        {errorMessage ? (
          <div style={{ color: '#ff6b6b', fontSize: '13px' }}>{errorMessage}</div>
        ) : null}

        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            marginTop: '8px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              background: 'transparent',
              color: '#aaa',
              border: '1px solid #333652',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#333652'
              e.currentTarget.style.color = '#ffffff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#aaa'
            }}
          >
            {t('common.cancel')}
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !code.trim()}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              backgroundColor: isSubmitting || !code.trim() ? '#4A4A6A' : '#6b7cff',
              color: '#ffffff',
              border: 'none',
              cursor: isSubmitting || !code.trim() ? 'not-allowed' : 'pointer',
              minWidth: '96px',
            }}
          >
            {t('common.confirm')}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
