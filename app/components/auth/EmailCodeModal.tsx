'use client'

import React, { useEffect, useState } from 'react'
import { Dialog } from '@/components/common/Dialog'
import { useTranslation } from 'react-i18next'
import GloTooltip from '@/components/common/GlobalTooltip'
import { fetchResendConfirmationCode } from '@/request/api'
import {
  useSuccessNotification,
  useErrorNotification,
} from '@/hooks/useGlobalNotification'
/*
  Props for the EmailCodeModal component.
 
  Displays and manages the email verification code modal including code input,
  resend logic with cooldown, and submission handling.
*/
interface EmailCodeModalProps {
  isOpen: boolean
  email: string
  onClose: () => void
  onSubmit?: (code: string) => void | Promise<void>
  onResend?: () => void | Promise<void>
  isSubmitting?: boolean
  errorMessage?: string
  needCoolDown?: boolean
}
/*
  EmailCodeModal component.
 
  Renders a dialog to enter a 6-digit email verification code and supports resending
  the code with a cooldown period.
 
  @param isOpen boolean. Whether the dialog is open.
  @param email string. The email address to which the code was sent.
  @param onClose Function. Called when the dialog should close.
  @param onSubmit Function | Promise<void>. Optional submit handler for the entered code. No default.
  @param onResend Function | Promise<void>. Optional external resend handler (unused here). No default.
  @param isSubmitting boolean. Whether submission is in progress. Default: false.
  @param errorMessage string | undefined. Optional error message to display. No default.
  @param needCoolDown boolean. If true, initializes resend cooldown. Default: false.
 
  @returns JSX.Element The verification code dialog UI.
*/
export default function EmailCodeModal({
  isOpen,
  email,
  onClose,
  onSubmit,
  isSubmitting = false,
  errorMessage,
  needCoolDown = false,
}: EmailCodeModalProps) {
  const { showSuccessNotification } = useSuccessNotification()
  const { showErrorNotification } = useErrorNotification()
  const [code, setCode] = useState('')
  const { t, i18n } = useTranslation()
  useEffect(() => {
    if (isOpen) {
      setCode('')
      if (needCoolDown) {
        setResendCooldown(60)
      }
    }
  }, [isOpen])

  /*
    Handle verification code form submission.
 
    @param e React.FormEvent. The form submit event.
 
    @returns Promise<void> Resolves when the submit completes.
  */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    await onSubmit?.(code.trim())
  }

  const [resendCooldown, setResendCooldown] = useState(0)
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  /*
    Resend a verification code and start/reset the cooldown timer.
 
    No action is taken if the cooldown is still active.
 
    @returns Promise<void> Resolves after the resend attempt completes.
  */
  const handleResend = async () => {
    if (resendCooldown > 0) return
    const response = await fetchResendConfirmationCode(email, i18n.language)
    if (response.auth_code === 200) {
      showSuccessNotification(t('notification.verificationCodeResentSuccessfully'))
      setResendCooldown(60)
    } else {
      showErrorNotification(response.auth_msg)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={t('auth.emailVerificationCode')}
      maxWidth="420px"
      className="email-code-dialog"
      closeOnEscape={false}
      closeOnBackdropClick={false}
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'end',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '16px',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          <GloTooltip content={t('auth.resendVerificationCodeDescription')}>
            <div>{t('auth.didNotReceiveTheVerificationCode')}</div>
          </GloTooltip>
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
            onClick={handleResend}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              background: 'transparent',
              color: '#aaa',
              border: '1px solid #333652',
              cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
              opacity: resendCooldown > 0 ? 0.6 : 1,
            }}
            onMouseEnter={e => {
              if (resendCooldown === 0) {
                e.currentTarget.style.backgroundColor = '#333652'
                e.currentTarget.style.color = '#ffffff'
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#aaa'
            }}
            disabled={resendCooldown > 0}
          >
            {resendCooldown > 0
              ? `${t('auth.resendVerificationCode')} (${resendCooldown}s)`
              : t('auth.resendVerificationCode')}
          </button>

          {/* <button
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
          </button> */}

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
