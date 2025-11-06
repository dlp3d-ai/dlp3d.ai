'use client'

import React, { useEffect, useState } from 'react'
import { Dialog } from '@/components/common/Dialog'
import { useTranslation } from 'react-i18next'

interface DeleteUserProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (params: { email: string; password: string }) => void | Promise<void>
  isSubmitting?: boolean
  errorMessage?: string
  defaultEmail?: string
}
export default function DeleteUser({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  errorMessage,
  defaultEmail = '',
}: DeleteUserProps) {
  /*
    Submit handler for deleting the user account.

    @param e React.FormEvent - The form submit event.

    @returns Promise<void> Resolves when submission completes.
  */
  const [email, setEmail] = useState(defaultEmail)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')
  const { t } = useTranslation()
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (!email.trim() || !password.trim()) {
      setLocalError(t('auth.pleaseFillInAllFields'))
      return
    }

    await onSubmit?.({ email: email.trim(), password })
  }

  useEffect(() => {
    if (isOpen) {
      setEmail(defaultEmail)
      setPassword('')
    }
  }, [isOpen, defaultEmail])

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={t('auth.deleteAccount')}
      closeOnBackdropClick={false}
      maxWidth="420px"
      className="delete-user-dialog"
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ color: '#cfcfe1', lineHeight: 1.6 }}>
          <span>
            {t('auth.toDeleteYourAccountPleaseConfirmYourEmailAndPassword')}
          </span>
          <span> {t('auth.thisActionIsIrreversible')}</span>
        </div>

        <label style={{ color: '#8b8ea8', fontSize: '14px' }}>
          {t('auth.email')}
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={t('auth.enterYourEmail')}
          autoComplete="off"
          style={{
            width: '340px',
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

        <label style={{ color: '#8b8ea8', fontSize: '14px' }}>
          {t('auth.password')}
        </label>
        <div style={{ position: 'relative', marginBottom: '0px' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t('auth.enterYourPassword')}
            autoComplete="off"
            style={{
              width: '340px',
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
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              backgroundColor: '#3A3A5A',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#E0E0E0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {showPassword ? (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              ) : (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              )}
            </svg>
          </button>
        </div>

        {errorMessage || localError ? (
          <div style={{ color: '#ff6b6b', fontSize: '13px' }}>
            {errorMessage || localError}
          </div>
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
            disabled={isSubmitting || !email.trim() || !password.trim()}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              backgroundColor:
                isSubmitting || !email.trim() || !password.trim()
                  ? '#4A4A6A'
                  : '#dc3545',
              color: '#ffffff',
              border: 'none',
              cursor:
                isSubmitting || !email.trim() || !password.trim()
                  ? 'not-allowed'
                  : 'pointer',
              minWidth: '96px',
            }}
          >
            {t('common.delete')}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
