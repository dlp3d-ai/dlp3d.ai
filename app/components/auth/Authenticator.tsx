import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { setAuthState } from '@/features/auth/authStore'
import { createUser, verifyUser, authenticateUser } from '@/request/api'
import { logger } from '@/utils/tslog'
import { usePromptingSettings } from '@/hooks/usePromptingSettings'
/**
 * Props interface for the Authenticator component.
 */
interface AuthenticatorProps {
  /**
   * Called when authentication is successful.
   */
  onAuthSuccess: () => void
}

/**
 * Authenticator Component
 *
 * A React component that provides user authentication functionality with email and password input fields.
 * Handles login verification, form submission, and authentication state management.
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
  /**
   * Verifies user login credentials and handles authentication.
   *
   * @param email The user's email address for authentication.
   * @param password The user's password for authentication.
   * @returns Promise<boolean> Returns true if login is successful, false otherwise.
   */
  const loginVerify = async (email: string, password: string) => {
    setIsLoading(true)
    setShowError(false)
    const AUTH_STORAGE_KEY = 'dlp3d_auth_state'

    try {
      const response = await authenticateUser({ username: email, password })
      if (response.user_id) {
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
        onAuthSuccess()
      }
    } catch (error) {
      logger.error(error)
      try {
        const response = await verifyUser({ username: email, password })
        if (response.user_id) {
          const login = await authenticateUser({ username: email, password })
          if (login.user_id) {
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
            await createUser(response.user_id)
            await loadUserCharacters()
            onAuthSuccess()
          }
        }
      } catch (error) {
        logger.error(error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handles form submission for user authentication.
   *
   * @param e The form event object.
   * @returns Promise<void>
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (email && password) {
      await loginVerify(email, password)
    } else {
      setErrorMessage('Invalid email or password')
      setShowError(true)
    }
  }

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
          Username
        </label>

        {/* Email Input */}
        <input
          type="text"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter your email"
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
          Password
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
            placeholder="Enter your password"
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
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
