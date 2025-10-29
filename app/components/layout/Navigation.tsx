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
} from '@/features/auth/authStore'
import UpdatePassword from '../auth/UpdatePassword'
import DeleteUser from '../auth/DeleteUser'
import { fetchUpdatePassword, fetchDeleteUser } from '@/request/api'
import {
  useSuccessNotification,
  useErrorNotification,
} from '@/hooks/useGlobalNotification'
import './Navigation.scss'

export default function Navigation() {
  const dispatch = useDispatch()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const isAuthenticated = useSelector(getIsLogin)
  const userInfo = useSelector(getUserInfo)

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

  const handleAccountClick = () => {
    if (isAuthenticated) {
      setShowUserMenu(!showUserMenu)
    } else {
      setShowAuthModal(true)
    }
  }

  const handleSignOut = async () => {
    try {
      clearAuthStateFromStorage()
      dispatch(setAuthState(getDefaultAuthState()))
      setShowUserMenu(false)
      // Force page reload to update auth state
      // window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    // Force page reload to update auth state
    window.location.reload()
  }

  const handleDeleteAccount = () => {
    setShowDeleteAccountDialog(true)
  }
  const handleChangePassword = () => {
    setShowChangePasswordDialog(true)
  }
  const handleChangePasswordSubmit = async (param: {
    email: string
    oldPassword: string
    newPassword: string
  }) => {
    setShowChangePasswordDialog(false)
    try {
      await fetchUpdatePassword(param.email, param.oldPassword, param.newPassword)
      setShowChangePasswordDialog(false)
      showSuccessNotification('Password updated successfully')
      handleSignOut()
    } catch (error) {
      console.error('Error changing password:', error)
    }
  }
  const handleConfirmDeleteAccount = async (param: {
    email: string
    password: string
  }) => {
    try {
      const response = await fetchDeleteUser(
        userInfo.id,
        param.password,
        param.email,
      )
      if (response.auth_code === 200) {
        setShowDeleteAccountDialog(false)
        showSuccessNotification('Account deleted successfully')
        handleSignOut()
      } else {
        showErrorNotification(response.auth_msg)
      }
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  }
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
                <div className="user-menu">
                  <div className="user-menu-item">
                    <span>Signed in as</span>
                    <strong>{userInfo.username}</strong>
                  </div>
                  <button
                    className="user-menu-item user-menu-action"
                    onClick={handleChangePassword}
                  >
                    Change Password
                  </button>

                  <button
                    className="user-menu-item user-menu-action"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                  <button
                    className="user-menu-item user-menu-action user-menu-action-error"
                    onClick={handleDeleteAccount}
                  >
                    Delete Account
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
