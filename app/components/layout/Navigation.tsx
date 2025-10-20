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

export default function Navigation() {
  const dispatch = useDispatch()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const isAuthenticated = useSelector(getIsLogin)
  const userInfo = useSelector(getUserInfo)

  const userMenuRef = useRef<HTMLDivElement>(null)
  const { isMobile } = useDevice()
  const isChatStarting = useSelector(getIsChatStarting)
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
                    onClick={handleSignOut}
                  >
                    Sign Out
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

      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx>{`
        .account-container {
          position: relative;
        }

        .user-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 0.5rem 0;
          min-width: 200px;
          z-index: 100;
          margin-top: 0.5rem;
        }

        .user-menu-item {
          display: block;
          width: 100%;
          padding: 0.75rem 1rem;
          text-align: left;
          border: none;
          background: none;
          cursor: default;
          font-size: 0.875rem;
        }

        .user-menu-item strong {
          display: block;
          color: #333;
          margin-top: 0.25rem;
        }

        .user-menu-action {
          cursor: pointer;
          border-top: 1px solid #eee;
          color: #dc3545;
          transition: background-color 0.2s;
        }

        .user-menu-action:hover {
          background-color: #f8f9fa;
        }
      `}</style>
    </>
  )
}
