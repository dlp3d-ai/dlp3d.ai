import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { setAuthState } from '@/features/auth/authStore'
import {
  verifyUser,
  authenticateUser,
  fetchResendVerificationCode,
  fetchUpdateUserConfig,
  fetchResendConfirmationCode,
} from '@/request/api'
// replaced logger with console to avoid dependency issues
import { usePromptingSettings } from '@/hooks/usePromptingSettings'
import { getBrowserTimeZone } from '@/utils/timeZone'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import EmailCodeModal from './EmailCodeModal'
import {
  useSuccessNotification,
  useErrorNotification,
} from '@/hooks/useGlobalNotification'
import { useTranslation } from 'react-i18next'
/**
 * Props interface for the Authenticator component.
 */
interface AuthenticatorProps {
  /**
   * Called when authentication is successful.
   */
  onAuthSuccess: () => void
}

/*
  Authenticator Component

  A React component that provides user authentication with email and password input, including
  registration, verification code flow, and login.

  @param onAuthSuccess Type: () => void. Callback invoked on successful authentication.

  @returns JSX.Element The authenticator UI.
*/
export default function Authenticator({ onAuthSuccess }: AuthenticatorProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('Invalid email or password')
  const [isLoading, setIsLoading] = useState(false)
  const dispatch = useDispatch()
  const { loadUserCharacters } = usePromptingSettings()
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [needCode, setNeedCode] = useState(false)
  const { showSuccessNotification } = useSuccessNotification()
  const { showErrorNotification } = useErrorNotification()
  const [codeErrorMessage, setCodeErrorMessage] = useState('')
  const { t } = useTranslation()

  const getCurrentPositionAsync = (options: PositionOptions) => {
    return new Promise((resolve, reject) => {
      let resolved = false

      const timer = setTimeout(() => {
        if (!resolved) {
          reject(new Error('Location request timed out or no response received'))
        }
      }, options.timeout || 5000)

      navigator.geolocation.getCurrentPosition(
        position => {
          resolved = true
          clearTimeout(timer)
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }

          resolve(location)
        },
        error => {
          resolved = true
          clearTimeout(timer)
          reject(error)
        },
        options,
      )
    })
  }
  /*
    Verify user credentials and handle registration or login.

    @param email Type: string. The user's email address.
    @param password Type: string. The user's password.

    @returns Promise<void> Resolves when the flow completes.
  */
  const loginVerify = async (email: string, password: string) => {
    setIsLoading(true)
    setShowError(false)
    const AUTH_STORAGE_KEY = 'dlp3d_auth_state'
    if (activeTab === 'register') {
      try {
        const response = await verifyUser({ username: email, password })
        setIsLoading(false)
        if (response.auth_code === 200) {
          setNeedCode(response.confirmation_required)
          if (!response.confirmation_required) {
            showSuccessNotification('Registration Successful!')
            setActiveTab('login')
          } else {
            showSuccessNotification(t('notification.verificationCodeSent'))
          }
        } else {
          showErrorNotification(response.auth_msg)
        }
      } catch (error) {
        setIsLoading(false)
        const errorMessage = (error as unknown as Error).message
        showErrorNotification(errorMessage)
      }
    } else {
      try {
        const response = await authenticateUser({ username: email, password })
        if (response.auth_code === 200) {
          try {
            const position = await getCurrentPositionAsync({
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            })
            localStorage.setItem('dlp_user_location', JSON.stringify(position))
          } catch (error) {
            console.error('Failed to get location:', error)
            localStorage.setItem('dlp_user_location', JSON.stringify(null))
          }
          dispatch(
            setAuthState({
              isLogin: true,
              userInfo: {
                username: email,
                email: email,
                id: response.user_id,
              },
            }),
          )
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              position => {
                const location = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                }
                localStorage.setItem('dlp_user_location', JSON.stringify(location))
              },
              error => {
                console.error('Failed to get location:', error)
                localStorage.setItem('dlp_user_location', JSON.stringify({}))
              },
              {
                enableHighAccuracy: true, // high-accuracy mode
                timeout: 5000, // timeout in milliseconds
                maximumAge: 0, // do not use cached position
              },
            )
          } else {
            localStorage.setItem('dlp_user_location', JSON.stringify({}))
          }
          localStorage.setItem(
            AUTH_STORAGE_KEY,
            JSON.stringify({
              isLogin: true,
              userInfo: {
                username: email,
                email: email,
                id: response.user_id,
              },
            }),
          )

          await loadUserCharacters()
          await fetchUpdateUserConfig({
            user_id: response.user_id,
            timezone: getBrowserTimeZone(),
          })
          onAuthSuccess()
        } else {
          showErrorNotification(response.auth_msg)
        }
      } finally {
        setIsLoading(false)
      }
    }
  }

  /*
    Handle form submission for user authentication.

    @param e Type: React.FormEvent. The form submit event.

    @returns Promise<void> Resolves after submit handling is complete.
  */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowError(false)
    if (email && password) {
      // email and password verify
      // password 8-16 characters, at least one uppercase letter, one lowercase letter, one number, one special character
      if (!email.includes('@') || !email.includes('.')) {
        setErrorMessage('Please enter a valid email address.')
        setShowError(true)
        return
      }

      await loginVerify(email, password)
    } else {
      setErrorMessage(
        'Please check your email and password to confirm they are entered correctly.',
      )
      setShowError(true)
    }
  }

  /*
    Switch between login and register tabs.

    @param event Type: React.SyntheticEvent. The tab change event.
    @param value Type: 'login' | 'register'. The target tab value.

    @returns void
  */
  const handleTabChange = (
    event: React.SyntheticEvent,
    value: 'login' | 'register',
  ) => {
    setActiveTab(value)
  }
  /*
    Submit the verification code in register flow.

    @param inputCode Type: string. The 6-digit verification code.

    @returns Promise<void> Resolves when the action completes.
  */
  const handleCodeSubmit = async (inputCode: string) => {
    setCodeErrorMessage('')
    setIsLoading(true)
    try {
      if (!inputCode.trim()) {
        setCodeErrorMessage('Please enter the verification code.')
        return
      }
      // After user confirms email, try authenticating
      const response = await fetchResendVerificationCode(email, inputCode)
      if (response.auth_code === 200) {
        showSuccessNotification(t('notification.verificationCodeSentSuccessfully'))
        setActiveTab('login')
        setNeedCode(false)
      } else {
        showErrorNotification(response.auth_msg)
        if (response.auth_msg.includes('please request a code again')) {
          const res = await fetchResendConfirmationCode(email)
          if (res.auth_code === 200) {
            showSuccessNotification(
              t('notification.verificationCodeResentSuccessfully'),
            )
          } else {
            showErrorNotification(res.auth_msg)
          }
        }
      }
      // await loginVerify(email, password)
    } catch (error) {
      console.error(error)
      setCodeErrorMessage(
        'Invalid or expired verification code, please try again later.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const buttonText = (() => {
    if (activeTab === 'login') {
      return isLoading ? t('auth.signingIn') : t('auth.signIn')
    }
    return isLoading ? t('auth.registering') : t('auth.register')
  })()
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',

        backgroundColor: '#1A1A2E',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          backgroundColor: 'transparent',
          borderRadius: '8px',
          width: '100%',
          marginBottom: '10px',
          '& .MuiTab-root': {
            color: 'rgba(255, 255, 255, 0.5)', // unselected state
            minWidth: 'auto',
            padding: '6px 16px',
            fontSize: '14px',
            width: '50%',
          },
          '& .Mui-selected': {
            color: '#fff !important', // selected state
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#fff', // underline color
          },
          '& .MuiTab-root.Mui-disabled': {
            color: 'rgba(255, 255, 255, 0.1)', // unselected state
          },
          '& .MuiTabs-scrollButtons': {
            color: '#fff',
            '&.Mui-disabled': {
              opacity: 0.3,
            },
          },
        }}
      >
        <Tab label={<span>{t('auth.login')}</span>} key="login" value="login" />
        <Tab
          label={<span>{t('auth.register')}</span>}
          key="register"
          value="register"
        />
      </Tabs>
      <div style={{ width: '100%' }}>
        {showError && (
          <div
            style={{
              color: 'red',
              border: '1px solid red',
              padding: '10px',
              borderRadius: '5px',
            }}
          >
            {errorMessage}
          </div>
        )}
      </div>
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px',
          backgroundColor: '#1A1A2E',
          borderRadius: '8px',
        }}
      >
        {/* Email Label */}
        <label
          style={{
            display: 'block',
            color: '#63667e',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            textAlign: 'left',
          }}
        >
          {t('auth.email')}
        </label>
        {/* Email Input */}
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={t('auth.emailPlaceholder')}
          style={{
            width: '100%',
            height: '48px',
            padding: '0 16px',
            backgroundColor: 'transparent',
            border: '1px solid #4A4A6A',
            borderRadius: '6px',
            color: '#E0E0E0',
            fontSize: '16px',
            marginBottom: '24px',
            boxSizing: 'border-box',
            outline: 'none',
          }}
          onFocus={e => {
            e.target.style.borderColor = '#6A6A8A'
          }}
          onBlur={e => {
            e.target.style.borderColor = '#4A4A6A'
          }}
        />
        {/* Password Label */}
        <label
          style={{
            display: 'block',
            color: '#63667e',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            textAlign: 'left',
          }}
        >
          {t('auth.password')}
        </label>
        {/* Password Input Container */}
        <div
          style={{
            position: 'relative',
            marginBottom: '32px',
          }}
        >
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t('auth.passwordPlaceholder')}
            style={{
              width: '100%',
              height: '48px',
              padding: '0 50px 0 16px',
              backgroundColor: 'transparent',
              border: '1px solid #4A4A6A',
              borderRadius: '6px',
              color: '#E0E0E0',
              fontSize: '16px',
              boxSizing: 'border-box',
              outline: 'none',
            }}
            onFocus={e => {
              e.target.style.borderColor = '#6A6A8A'
            }}
            onBlur={e => {
              e.target.style.borderColor = '#4A4A6A'
            }}
          />

          {/* Eye Icon */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '12px',
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
        {/** code */}

        {/* Sign In Button */}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            height: '48px',
            backgroundColor: isLoading ? '#4A4A6A' : '#292a3e',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease',
            opacity: isLoading ? 0.7 : 1,
          }}
          onMouseOver={e => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#4A4A6A'
            }
          }}
          onMouseOut={e => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#292a3e'
            }
          }}
        >
          {buttonText}
        </button>
      </form>
      <EmailCodeModal
        isOpen={needCode}
        email={email}
        onClose={() => setNeedCode(false)}
        onSubmit={handleCodeSubmit}
        isSubmitting={isLoading}
        errorMessage={codeErrorMessage}
      />
    </div>
  )
}
