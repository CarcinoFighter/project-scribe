'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Settings,
  Menu,
  X,
  Check,
} from 'lucide-react';
import AccountMenu from '@/components/AccountMenu';
import NotifPanel, { Notif } from '@/components/NotifPanel';

interface PageHeaderProps {
  pageTitle: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  hideSearch?: boolean;
  user?: any;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  notifs?: Notif[];
  unreadCount?: number;
  onMarkAllRead?: () => void;
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
  children?: React.ReactNode;
}

function Logo({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.2)}
      viewBox="0 0 20 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M9.13307 5.97435C9.21934 5.23291 9.33279 4.80925 9.89802 4.0092C10.9029 2.80263 11.6709 2.67501 12.9912 2.4556L13.0042 2.45344C14.8586 2.34816 15.7395 3.26056 16.1799 4.26653C16.6203 5.27251 16.5553 7.03881 16.4233 7.9863C16.2913 8.93378 15.7627 11.4166 12.7608 13.8614C13.5837 14.1538 13.6573 14.1074 14.65 14.2561C15.6004 13.2384 16.1436 12.4864 17.5128 10.8405C18.882 9.19453 19.661 6.91014 19.8772 5.50646C20.0934 4.10278 20.1438 2.45344 18.9963 1.26031C17.8489 0.0671784 15.5888 -0.131673 14.198 0.067179C12.8072 0.266031 10.3732 1.26031 8.68105 2.6289C6.98888 3.9975 6.20076 5.50646 5.57488 7.5418C4.949 9.57714 5.30938 11.2467 6.08485 13.332C7.40174 16.0707 9.01717 17.9291 10.4196 18.8415C11.822 19.7539 12.8072 20.2451 14.3487 22.842C16.2495 19.8123 16.9991 18.6706 18.4632 16.9465C17.5128 15.7767 16.2842 15.1142 13.8735 14.7825C11.4627 14.4508 10.6865 13.6665 10.2341 13.6478C9.78183 13.6291 9.26057 13.6244 9.09831 13.5776C8.93605 13.5309 8.89093 13.5242 8.76218 13.2384C8.62326 12.7331 8.76218 11.9985 8.76218 11.8932C8.76218 11.7879 8.54197 11.6476 8.54197 11.5072C8.54197 11.3668 8.61607 11.2835 8.77377 11.2031C8.77377 11.2031 8.41448 11.0042 8.41448 10.8405C8.41448 10.6767 8.57673 10.0567 8.54197 9.91637C8.50721 9.776 7.68429 9.60054 7.83497 9.3198C7.98565 9.03906 9.16153 7.60314 9.30692 7.30785C9.45232 7.01256 9.15359 6.6787 9.13307 5.97435Z"
        fill="currentColor"
      />
      <path
        d="M8.00883 18.0928C5.32942 19.6789 3.54237 20.5984 1.2981 21.2277L0 24C1.2981 23.9064 5.74874 21.7424 9.23739 19.169L8.00883 18.0928Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function PageHeader({
  pageTitle,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  hideSearch = false,
  user,
  isDark,
  onToggleTheme,
  onOpenSettings,
  notifs = [],
  unreadCount = 0,
  onMarkAllRead,
  mobileMenuOpen = false,
  setMobileMenuOpen,
  children,
}: PageHeaderProps) {
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [accountMenuPos, setAccountMenuPos] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const accountBtnRef = useRef<HTMLButtonElement>(null);

  const handleAccountMenuClick = () => {
    if (!showAccountMenu && accountBtnRef.current) {
      const r = accountBtnRef.current.getBoundingClientRect();
      setAccountMenuPos({
        top: r.bottom + 5,
        right: window.innerWidth - r.right,
      });
    }
    setShowAccountMenu((o) => !o);
  };

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          background: 'var(--paper)',
          borderBottom: '1px solid var(--rule)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 40,
        }}
      >
        {/* Logo + Title */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--ink)',
            textDecoration: 'none',
            lineHeight: 1,
          }}
        >
          <Logo size={14} />
          <span
            style={{
              fontFamily: 'var(--ff-display)',
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            <span className="hidden sm:inline"> Carcino</span> Vantage
          </span>
        </Link>

        {/* Separator */}
        <div
          className="db-vr"
          style={{ marginTop: 0 }}
        />

        {/* Page Title */}
        <span
          style={{
            fontFamily: 'var(--ff-mono)',
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--mid)',
          }}
        >
          {pageTitle}
        </span>

        <div
          className="db-vr"
          style={{ marginTop: 0 }}
        />

        {/* Search — hidden on mobile */}
        {!hideSearch && (
          <div
            className="hidden md:flex"
            style={{
              position: 'relative',
              flex: 1,
              maxWidth: 320,
              alignItems: 'center',
            }}
          >
            <Search
              size={11}
              style={{
                position: 'absolute',
                left: 10,
                color: 'var(--mid)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: '1px solid var(--rule)',
                padding: '5px 10px 5px 28px',
                fontFamily: 'var(--ff-mono)',
                fontSize: 10,
                letterSpacing: '0.04em',
                color: 'var(--ink)',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = 'var(--accent)')
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = 'var(--rule)')
              }
            />
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Custom children (right-aligned slot) */}
        {children}

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Theme toggle - unified with other buttons */}
          <button
            className="db-icon-btn"
            onClick={onToggleTheme}
            title={isDark ? 'Light mode' : 'Dark mode'}
            style={{
              padding: '4px',
              borderRadius: '4px',
              border: '1px solid transparent',
              transition: 'all 0.15s',
              cursor: 'pointer',
            }}
          >
            {isDark ? (
              <Sun size={13} strokeWidth={1.8} />
            ) : (
              <Moon size={13} strokeWidth={1.8} />
            )}
          </button>

          {/* Settings */}
          <button
            className="db-icon-btn"
            onClick={onOpenSettings}
            title="Settings"
            style={{
              padding: '4px',
              borderRadius: '4px',
              border: '1px solid transparent',
              transition: 'all 0.15s',
              cursor: 'pointer',
            }}
          >
            <Settings size={13} strokeWidth={1.8} />
          </button>

          {/* Notifications */}
          <button
            className="db-icon-btn"
            style={{
              position: 'relative',
              padding: '4px',
              borderRadius: '4px',
              border: '1px solid transparent',
              transition: 'all 0.15s',
              cursor: 'pointer',
            }}
            onClick={() => setShowNotifPanel((o) => !o)}
            title="Notifications"
          >
            <Bell size={13} strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 6,
                  height: 6,
                  background: 'var(--accent)',
                  borderRadius: '50%',
                  border: '1px solid var(--paper)',
                }}
              />
            )}
          </button>

          {/* Mark all read button */}
          {unreadCount > 0 && (
            <button
              className="db-ghost hidden sm:flex"
              style={{
                padding: '3px 7px',
                gap: 4,
                borderRadius: '4px',
                border: '1px solid var(--rule)',
                transition: 'all 0.15s',
              }}
              onClick={onMarkAllRead}
              title="Mark all read"
            >
              <Check size={10} strokeWidth={2} />
              <span
                style={{
                  fontFamily: 'var(--ff-mono)',
                  fontSize: 8,
                  letterSpacing: '0.08em',
                }}
              >
                All read
              </span>
            </button>
          )}

          <div
            className="db-vr"
            style={{ marginTop: 0 }}
          />

          {/* Mobile menu toggle */}
          {setMobileMenuOpen && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="db-icon-btn md:hidden"
              title="Menu"
              style={{
                padding: '4px',
                borderRadius: '4px',
                border: '1px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          )}

          {/* Account menu */}
          <button
            ref={accountBtnRef}
            className="db-ghost"
            style={{
              gap: 6,
              padding: '3px 8px 3px 4px',
              borderRadius: '4px',
              border: '1px solid var(--rule)',
              transition: 'all 0.15s',
            }}
            onClick={handleAccountMenuClick}
          >
            {user?.avatar_url ? (
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '1px solid var(--rule)',
                }}
              >
                <Image
                  src={user.avatar_url}
                  alt={user.name || 'User'}
                  width={20}
                  height={20}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--paper)',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Account Menu Portal */}
      {showAccountMenu &&
        accountMenuPos &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: accountMenuPos.top,
              right: accountMenuPos.right,
              zIndex: 1000,
            }}
          >
            <AccountMenu
              onClose={() => setShowAccountMenu(false)}
              user={user}
            />
          </div>,
          document.body
        )}

      {/* Notifications Panel Portal */}
      {showNotifPanel &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 999,
            }}
            onClick={() => setShowNotifPanel(false)}
          >
            <NotifPanel
              notifs={notifs}
              onMarkAllRead={onMarkAllRead}
              onClose={() => setShowNotifPanel(false)}
            />
          </div>,
          document.body
        )}
    </>
  );
}