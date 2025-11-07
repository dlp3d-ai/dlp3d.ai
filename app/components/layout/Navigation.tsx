'use client'

import { useState, useEffect, useRef } from 'react'

import Image from 'next/image'
import Logo from '../ui/Logo'
import AuthModal from '../auth/AuthModal'

import { useDevice } from '../../contexts/DeviceContext'
import ChatListDrawer from '../chat'
import { getIsChatStarting } from '@/features/chat/chat'
import { useSelector, useDispatch } from 'react-redux'
import { getIsLogin } from '@/features/auth/authStore'
import {
  getUserInfo,
  clearAuthStateFromStorage,
  setAuthState,
  getDefaultAuthState,
  logout,
} from '@/features/auth/authStore'
import UpdatePassword from '../auth/UpdatePassword'
import DeleteUser from '../auth/DeleteUser'
import { fetchUpdatePassword, fetchDeleteUser } from '@/request/api'
import {
  useSuccessNotification,
  useErrorNotification,
} from '@/hooks/useGlobalNotification'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitch'
import './Navigation.scss'
/*
  Top navigation component for the application.

  @returns JSX.Element The navigation bar UI.
*/
export default function Navigation() {
  const dispatch = useDispatch()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const isAuthenticated = useSelector(getIsLogin)
  const userInfo = useSelector(getUserInfo)
  const { t, i18n } = useTranslation()

  const userMenuRef = useRef<HTMLDivElement>(null)
  const { isMobile } = useDevice()
  const isChatStarting = useSelector(getIsChatStarting)
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false)
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false)
  const { showSuccessNotification } = useSuccessNotification()
  const { showErrorNotification } = useErrorNotification()
  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  /*
    Handle clicks on the account button to toggle the user menu or open auth modal.

    @returns void
  */
  const handleAccountClick = () => {
    if (isAuthenticated) {
      setShowUserMenu(!showUserMenu)
    } else {
      setShowAuthModal(true)
    }
  }

  /*
    Clear auth state and sign out the current user.

    @returns Promise<void> Resolves when sign-out completes.
  */
  const handleSignOut = async () => {
    try {
      clearAuthStateFromStorage()
      dispatch(setAuthState(getDefaultAuthState()))
      setShowUserMenu(false)
      dispatch(logout())
      // Force page reload to update auth state
      window.location.reload()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  /*
    Close auth modal and reload the page after successful authentication.

    @returns void
  */
  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    // Force page reload to update auth state
    window.location.reload()
  }

  /*
    Open the delete account confirmation dialog.

    @returns void
  */
  const handleDeleteAccount = () => {
    setShowDeleteAccountDialog(true)
  }
  /*
    Open the change password dialog.

    @returns void
  */
  const handleChangePassword = () => {
    setShowChangePasswordDialog(true)
  }
  /*
    Submit handler for changing password from the user menu.

    @param param { email: string; oldPassword: string; newPassword: string } - The password change payload.

    @returns Promise<void> Resolves when the flow completes.
  */
  const handleChangePasswordSubmit = async (param: {
    email: string
    oldPassword: string
    newPassword: string
  }) => {
    try {
      const response = await fetchUpdatePassword(
        param.email,
        param.oldPassword,
        param.newPassword,
        i18n.language,
      )
      if (response.auth_code === 200) {
        setShowChangePasswordDialog(false)
        showSuccessNotification(t('nav.passwordUpdated'))
        handleSignOut()
      } else {
        showErrorNotification(response.auth_msg)
      }
    } catch (error) {
      console.error('Error changing password:', error)
    }
  }
  /*
    Confirm and process account deletion.

    @param param { email: string; password: string } - The deletion payload.

    @returns Promise<void> Resolves when deletion completes.
  */
  const handleConfirmDeleteAccount = async (param: {
    email: string
    password: string
  }) => {
    try {
      const response = await fetchDeleteUser(
        userInfo.id,
        param.password,
        param.email,
        i18n.language,
      )
      if (response.auth_code === 200) {
        setShowDeleteAccountDialog(false)
        showSuccessNotification(t('nav.accountDeleted'))
        handleSignOut()
      } else {
        showErrorNotification(response.auth_msg)
      }
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  }
  /*
    Navigate to the home page when the logo is clicked.

    @returns void
  */
  const handleLogoClick = () => {
    window.location.href = '/'
  }

  return (
    <>
      <nav className="modern-nav-menu relative">
        {/** Top Drawer */}
        {isAuthenticated && !isChatStarting && (
          <div className="nav-top">
            <ChatListDrawer />
          </div>
        )}
        {/* Left Section - Logo */}
        <div className="nav-left">
          <div className="logo-container">
            <Logo onClick={handleLogoClick} clickable={true} />
          </div>
        </div>

        {/* Right Section - Account Only */}
        <div className="nav-right">
          <div className="nav-right-content">
            {/* <button className="about-btn">About</button> */}
            {!isChatStarting && <LanguageSwitcher />}

            <div className="account-container" ref={userMenuRef}>
              <button
                className="account-btn"
                onClick={handleAccountClick}
                title={isAuthenticated ? userInfo.username || 'User' : 'Account'}
                style={{
                  width: isMobile ? '40px' : '50px',
                  height: isMobile ? '40px' : '50px',
                }}
              >
                {isAuthenticated ? (
                  userInfo.username ? (
                    userInfo.username.charAt(0).toUpperCase()
                  ) : (
                    'U'
                  )
                ) : (
                  <Image
                    src="/img/account-icon.png"
                    alt="Account"
                    width={20}
                    height={20}
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                )}
              </button>

              {isAuthenticated && showUserMenu && (
                <div
                  className="user-menu"
                  style={{ position: 'absolute', top: '100%', right: '10px' }}
                >
                  <div className="user-menu-item">
                    <span>{t('nav.signedInAs')}</span>
                    <strong
                      style={{
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {userInfo.username}
                    </strong>
                  </div>
                  <button
                    className="user-menu-item user-menu-action"
                    onClick={handleChangePassword}
                  >
                    {t('nav.changePassword')}
                  </button>

                  <button
                    className="user-menu-item user-menu-action"
                    onClick={handleSignOut}
                  >
                    {t('nav.signOut')}
                  </button>
                  <button
                    className="user-menu-item user-menu-action user-menu-action-error"
                    onClick={handleDeleteAccount}
                  >
                    {t('nav.deleteAccount')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <DeleteUser
        isOpen={showDeleteAccountDialog}
        onClose={() => setShowDeleteAccountDialog(false)}
        onSubmit={handleConfirmDeleteAccount}
      />

      <UpdatePassword
        isOpen={showChangePasswordDialog}
        onClose={() => setShowChangePasswordDialog(false)}
        onSubmit={handleChangePasswordSubmit}
      />
    </>
  )
}
