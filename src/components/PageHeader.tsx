'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { Search, Bell, Sun, Moon, Settings, Menu, X, ChevronDown, Command } from 'lucide-react';

import { useTheme }         from '@/lib/useTheme';
import { useUser }          from '@/lib/useUser';
import { useNotifications } from '@/lib/useNotifications';
import AccountMenu          from '@/components/AccountMenu';
import NotifPanel           from '@/components/NotifPanel';
import Toast                from '@/components/Toast';
import SettingsModal, {
  loadSettings, saveSettings, applySettings, type AppSettings,
} from '@/components/SettingsModal';

export interface PageHeaderProps {
  pageTitle: string;
  searchValue?:       string;
  onSearchChange?:    (value: string) => void;
  searchPlaceholder?: string;
  hideSearch?:        boolean;
  mobileMenuOpen?:    boolean;
  setMobileMenuOpen?: (open: boolean) => void;
  children?: React.ReactNode;
}

function Logo({ size = 16 }: { size?: number }) {
  return (
    <Image
      src="/logo.svg"
      alt="Vantage"
      width={size}
      height={Math.round(size * 1.2)}
      style={{ width: size, height: 'auto' }}
    />
  );
}

export default function PageHeader({
  pageTitle,
  searchValue        = '',
  onSearchChange,
  searchPlaceholder  = 'Search…',
  hideSearch         = false,
  mobileMenuOpen     = false,
  setMobileMenuOpen,
  children,
}: PageHeaderProps) {
  const { isDark, toggleTheme }                     = useTheme();
  const { user }                                    = useUser();
  const { notifications, unreadCount, markAllRead } = useNotifications();

  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings]         = useState<AppSettings>(() => loadSettings());
  const [toast, setToast]               = useState<string | null>(null);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifPanelPos,  setNotifPanelPos]  = useState<{ top: number; right: number } | null>(null);
  const notifBtnRef   = useRef<HTMLButtonElement>(null);
  const notifPanelRef = useRef<HTMLDivElement>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [accountMenuPos,  setAccountMenuPos]  = useState<{ top: number; right: number } | null>(null);
  const accountBtnRef  = useRef<HTMLButtonElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!notifBtnRef.current?.contains(t) && !notifPanelRef.current?.contains(t))
        setShowNotifPanel(false);
      if (!accountBtnRef.current?.contains(t) && !accountMenuRef.current?.contains(t))
        setShowAccountMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowNotifPanel(false); setShowAccountMenu(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleNotifClick = useCallback(() => {
    if (!showNotifPanel && notifBtnRef.current) {
      const r = notifBtnRef.current.getBoundingClientRect();
      setNotifPanelPos({ top: r.bottom + 7, right: Math.max(8, window.innerWidth - r.right) });
    }
    setShowNotifPanel(p => !p);
    setShowAccountMenu(false);
  }, [showNotifPanel]);

  const handleAccountClick = useCallback(() => {
    if (!showAccountMenu && accountBtnRef.current) {
      const r = accountBtnRef.current.getBoundingClientRect();
      setAccountMenuPos({ top: r.bottom + 5, right: window.innerWidth - r.right });
    }
    setShowAccountMenu(p => !p);
    setShowNotifPanel(false);
  }, [showAccountMenu]);

  const handleMarkAllRead = useCallback(async () => {
    await markAllRead();
    setToast('All notifications marked as read');
  }, [markAllRead]);

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?';

  return (
    <>
      <style>{`
        .ph-root {
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          height: 44px;
          background: var(--paper);
          border-bottom: 1px solid var(--rule);
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 12px;
          z-index: 40;
          transition: box-shadow 0.2s ease;
        }

        /* Logo + breadcrumb */
        .ph-brand {
          display: flex;
          align-items: center;
          gap: 0;
          flex-shrink: 0;
          user-select: none;
          text-decoration: none;
          color: var(--ink);
          padding: 4px 6px 4px 2px;
          border-radius: var(--r-xs);
          transition: opacity 0.15s;
        }
        .ph-brand:hover { opacity: 0.7; }

        .ph-brand-name {
          font-family: var(--ff-display);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-left: 7px;
        }

        .ph-slash {
          font-family: var(--ff-mono);
          font-size: 13px;
          color: var(--rule);
          margin: 0 2px;
          user-select: none;
        }

        .ph-page-title {
          font-family: var(--ff-mono);
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--mid);
          padding: 0 6px;
          flex-shrink: 0;
        }

        .ph-divider {
          width: 1px;
          height: 16px;
          background: var(--rule);
          flex-shrink: 0;
          margin: 0 2px;
        }

        /* Search — desktop only */
        .ph-search-wrap {
          position: relative;
          flex: 1;
          max-width: 280px;
          display: flex;
          align-items: center;
        }

        .ph-search-icon {
          position: absolute;
          left: 9px;
          color: var(--mid);
          pointer-events: none;
          transition: color 0.15s;
          display: flex;
        }

        .ph-search-input {
          width: 100%;
          background: transparent;
          border: 1px solid var(--rule);
          border-radius: var(--r-md);
          padding: 5px 60px 5px 28px;
          font-family: var(--ff-mono);
          font-size: 10px;
          letter-spacing: 0.04em;
          color: var(--ink);
          outline: none;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
        }
        .ph-search-input:focus {
          border-color: var(--accent);
          background: var(--accent-sub);
          box-shadow: 0 0 0 2px var(--accent-dim);
        }
        .ph-search-input::placeholder { color: var(--mid); opacity: 0.6; }

        .ph-search-hint {
          position: absolute;
          right: 8px;
          display: flex;
          align-items: center;
          gap: 2px;
          font-family: var(--ff-mono);
          font-size: 8px;
          color: var(--mid);
          opacity: 0.55;
          pointer-events: none;
          transition: opacity 0.15s;
        }

        /* Right cluster */
        .ph-right {
          display: flex;
          align-items: center;
          gap: 2px;
          margin-left: auto;
          flex-shrink: 0;
        }

        .ph-icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          background: none;
          border: 1px solid transparent;
          border-radius: var(--r-sm);
          cursor: pointer;
          color: var(--mid);
          transition: background 0.12s, color 0.12s, border-color 0.12s;
          position: relative;
          flex-shrink: 0;
        }
        .ph-icon-btn:hover {
          background: var(--cream);
          border-color: var(--rule);
          color: var(--ink);
        }
        .ph-icon-btn.active {
          background: var(--accent-dim);
          border-color: var(--accent-sub);
          color: var(--accent);
        }

        /* Account button */
        .ph-account {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 3px 8px 3px 4px;
          background: none;
          border: 1px solid var(--rule);
          border-radius: var(--r-sm);
          cursor: pointer;
          color: var(--ink);
          transition: border-color 0.15s, background 0.15s;
          flex-shrink: 0;
        }
        .ph-account:hover {
          background: var(--cream);
          border-color: var(--border-med);
        }

        .ph-avatar {
          width: 20px;
          height: 20px;
          background: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-family: var(--ff-display);
          font-weight: 700;
          font-size: 8px;
          flex-shrink: 0;
          border-radius: 3px;
          letter-spacing: 0.04em;
        }

        .ph-account-name {
          font-family: var(--ff-mono);
          font-size: 9.5px;
          font-weight: 500;
          letter-spacing: 0.04em;
          color: var(--ink);
          max-width: 90px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Badge */
        .ph-badge {
          position: absolute;
          top: 5px;
          right: 5px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent);
          border: 1.5px solid var(--paper);
        }

        /* Responsive: hide/show */
        @media (max-width: 767px) {
          .ph-search-wrap  { display: none !important; }
          .ph-desktop-only { display: none !important; }
        }
        @media (min-width: 768px) {
          .ph-mobile-only  { display: none !important; }
          .ph-brand-name   { display: block; }
        }
        @media (max-width: 479px) {
          .ph-brand-name { display: none; }
        }

        /* Accent rule */
        .ph-accent-rule {
          position: sticky;
          top: 44px;
          left: 0; right: 0;
          height: 1px;
          z-index: 39;
          background: linear-gradient(90deg, transparent 0%, var(--accent) 40%, var(--accent) 60%, transparent 100%);
          opacity: 0.15;
          pointer-events: none;
        }
      `}</style>

      <header className="ph-root" style={{ boxShadow: scrolled ? '0 1px 12px rgba(0,0,0,0.1)' : 'none' }}>

        {/* Logo + breadcrumb */}
        <Link href="/" className="ph-brand">
          <Logo size={14} />
          <span className="ph-brand-name">Vantage</span>
        </Link>
        <span className="ph-slash">/</span>
        <span className="ph-page-title">{pageTitle}</span>

        <div className="ph-divider" />

        {/* Search — hides on mobile via CSS */}
        {!hideSearch && (
          <div className="ph-search-wrap">
            <span className="ph-search-icon">
              <Search size={11} strokeWidth={1.8} style={{ color: searchFocused ? 'var(--accent)' : 'var(--mid)' }} />
            </span>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={e => onSearchChange?.(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="ph-search-input"
            />
            {!searchFocused && (
              <span className="ph-search-hint">
                <Command size={8} strokeWidth={1.8} />K
              </span>
            )}
          </div>
        )}

        {/* Children slot (e.g. page-specific command bar) — also hides on mobile */}
        {children && (
          <div className="ph-search-wrap" style={{ maxWidth: 320 }}>
            {children}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Right controls */}
        <div className="ph-right">

          {/* Theme — desktop only */}
          <button
            className="ph-icon-btn ph-desktop-only"
            onClick={toggleTheme}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark
              ? <Sun  size={13} strokeWidth={1.8} />
              : <Moon size={13} strokeWidth={1.8} />}
          </button>

          {/* Settings — desktop only */}
          <button
            className="ph-icon-btn ph-desktop-only"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <Settings size={13} strokeWidth={1.8} />
          </button>

          {/* Notifications */}
          <button
            ref={notifBtnRef}
            className={`ph-icon-btn${showNotifPanel ? ' active' : ''}`}
            onClick={handleNotifClick}
            title="Notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={13} strokeWidth={1.8} />
            {unreadCount > 0 && <span className="ph-badge" />}
          </button>

          <div className="ph-divider" style={{ margin: '0 3px' }} />

          {/* Mobile menu toggle */}
          {setMobileMenuOpen && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="ph-icon-btn ph-mobile-only"
              title="Menu"
            >
              {mobileMenuOpen ? <X size={15} strokeWidth={1.8} /> : <Menu size={15} strokeWidth={1.8} />}
            </button>
          )}

          {/* Account */}
          <button
            ref={accountBtnRef}
            className="ph-account"
            style={{
              borderColor: showAccountMenu ? 'var(--accent)' : 'var(--rule)',
              background:  showAccountMenu ? 'var(--accent-sub)' : 'transparent',
            }}
            onClick={handleAccountClick}
            aria-label="Account menu"
          >
            {user?.avatar_url ? (
              <div style={{ width: 20, height: 20, overflow: 'hidden', flexShrink: 0, borderRadius: 3 }}>
                <Image src={user.avatar_url} alt={user.name || ''} width={20} height={20} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div className="ph-avatar">{initials}</div>
            )}
            <span className="ph-account-name ph-desktop-only">{user?.name || ''}</span>
            <ChevronDown
              size={9} strokeWidth={2}
              className="ph-desktop-only"
              style={{ color: 'var(--mid)', transform: showAccountMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            />
          </button>
        </div>
      </header>

      <div className="ph-accent-rule" aria-hidden />

      {/* Portals */}
      {showNotifPanel && notifPanelPos && createPortal(
        <div ref={notifPanelRef} style={{ position: 'fixed', top: notifPanelPos.top, right: notifPanelPos.right, zIndex: 9960, maxWidth: 'calc(100vw - 16px)' }}>
          <NotifPanel notifs={notifications} onMarkAllRead={handleMarkAllRead} onClose={() => setShowNotifPanel(false)} />
        </div>,
        document.body
      )}

      {showAccountMenu && accountMenuPos && createPortal(
        <div ref={accountMenuRef} style={{ position: 'fixed', top: accountMenuPos.top, right: accountMenuPos.right, zIndex: 9960 }}>
          <AccountMenu user={user} onClose={() => setShowAccountMenu(false)} onToast={setToast} onOpenSettings={() => { setShowAccountMenu(false); setShowSettings(true); }} isDark={isDark} onToggleTheme={toggleTheme} />
        </div>,
        document.body
      )}

      {showSettings && (
        <SettingsModal settings={settings} onClose={() => setShowSettings(false)} onChange={next => { setSettings(next); saveSettings(next); applySettings(next); }} />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  );
}
