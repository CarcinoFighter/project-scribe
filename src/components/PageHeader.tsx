'use client';

/**
 * PageHeader — self-contained sticky header for all non-editor pages.
 *
 * All shared state is managed internally:
 *   • Theme  (useTheme)
 *   • User   (useUser)
 *   • Notifs (useNotifications)
 *   • SettingsModal
 *   • Toast
 *
 * Pages only need to wire up what's page-specific:
 *   pageTitle, search props, children slot, mobileMenuOpen/setMobileMenuOpen
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  ChevronDown,
  Command,
} from 'lucide-react';

import { useTheme }         from '@/lib/useTheme';
import { useUser }          from '@/lib/useUser';
import { useNotifications } from '@/lib/useNotifications';
import AccountMenu          from '@/components/AccountMenu';
import NotifPanel           from '@/components/NotifPanel';
import Toast                from '@/components/Toast';
import SettingsModal, {
  loadSettings,
  saveSettings,
  applySettings,
  type AppSettings,
} from '@/components/SettingsModal';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface PageHeaderProps {
  /** Breadcrumb label shown after the logo. */
  pageTitle: string;

  /** Search field — pass these to enable an inline search bar. */
  searchValue?:       string;
  onSearchChange?:    (value: string) => void;
  searchPlaceholder?: string;
  hideSearch?:        boolean;

  /** Mobile menu toggle — managed by the parent page (content varies). */
  mobileMenuOpen?:    boolean;
  setMobileMenuOpen?: (open: boolean) => void;

  /** Extra controls injected between the spacer and the right controls. */
  children?: React.ReactNode;
}

// ─── Logo ────────────────────────────────────────────────────────────────────

function Logo({ size = 16 }: { size?: number }) {
  return (
    <Image
      src="/logo.svg"
      alt="Carcino Vantage"
      width={size}
      height={Math.round(size * 1.2)}
      style={{ width: size, height: 'auto' }}
    />
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

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

  // ── Shared hooks ────────────────────────────────────────────────────────────
  const { isDark, toggleTheme }                       = useTheme();
  const { user }                                      = useUser();
  const { notifications, unreadCount, markAllRead }   = useNotifications();

  // ── Settings ────────────────────────────────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings]         = useState<AppSettings>(() => loadSettings());

  // ── Toast ───────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<string | null>(null);

  // ── Notification panel ──────────────────────────────────────────────────────
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifPanelPos,  setNotifPanelPos]  = useState<{ top: number; right: number } | null>(null);
  const notifBtnRef  = useRef<HTMLButtonElement>(null);
  const notifPanelRef = useRef<HTMLDivElement>(null);

  // ── Account menu ────────────────────────────────────────────────────────────
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [accountMenuPos,  setAccountMenuPos]  = useState<{ top: number; right: number } | null>(null);
  const accountBtnRef  = useRef<HTMLButtonElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // ── Search focus state (for visual feedback) ────────────────────────────────
  const [searchFocused, setSearchFocused] = useState(false);

  // ── Scroll shadow ───────────────────────────────────────────────────────────
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Outside-click: close both menus ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideNotif =
        notifBtnRef.current?.contains(target) ||
        notifPanelRef.current?.contains(target);
      if (!insideNotif) setShowNotifPanel(false);

      const insideAccount =
        accountBtnRef.current?.contains(target) ||
        accountMenuRef.current?.contains(target);
      if (!insideAccount) setShowAccountMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Keyboard: close menus on Escape ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNotifPanel(false);
        setShowAccountMenu(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleNotifClick = useCallback(() => {
    if (!showNotifPanel && notifBtnRef.current) {
      const rect = notifBtnRef.current.getBoundingClientRect();
      const right = Math.max(8, window.innerWidth - rect.right);
      setNotifPanelPos({ top: rect.bottom + 7, right });
    }
    setShowNotifPanel(prev => !prev);
    setShowAccountMenu(false);
  }, [showNotifPanel]);

  const handleAccountClick = useCallback(() => {
    if (!showAccountMenu && accountBtnRef.current) {
      const rect = accountBtnRef.current.getBoundingClientRect();
      setAccountMenuPos({ top: rect.bottom + 5, right: window.innerWidth - rect.right });
    }
    setShowAccountMenu(prev => !prev);
    setShowNotifPanel(false);
  }, [showAccountMenu]);

  const handleMarkAllRead = useCallback(async () => {
    await markAllRead();
    setToast('All notifications marked as read');
  }, [markAllRead]);

  // ── User initials ───────────────────────────────────────────────────────────
  const initials = user?.name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2) || '?';

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header
        style={{
          position:        'sticky',
          top:             0,
          left:            0,
          right:           0,
          width:           '100%',
          background:      'var(--paper)',
          borderBottom:    '1px solid var(--rule)',
          padding:         '0 14px',
          display:         'flex',
          alignItems:      'center',
          gap:             8,
          height:          44,
          zIndex:          40,
          // Subtle elevation on scroll
          boxShadow:       scrolled ? '0 1px 12px rgba(0,0,0,0.07)' : 'none',
          transition:      'box-shadow 0.2s ease',
        }}
      >
        {/* ── Logo + Breadcrumb ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0, userSelect: 'none' }}>
          <Link
            href="/"
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            7,
              color:          'var(--ink)',
              textDecoration: 'none',
              padding:        '4px 8px 4px 2px',
              borderRadius:   3,
              transition:     'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <Logo size={14} />
            <span className="hidden sm:inline" style={{
              fontFamily:    'var(--ff-display)',
              fontSize:      14,
              fontWeight:    700,
              letterSpacing: '-0.02em',
              lineHeight:    1,
            }}>
              <span className="hidden sm:inline">Carcino</span> Vantage
            </span>
          </Link>

          {/* Slash separator */}
          <span style={{
            fontFamily: 'var(--ff-mono)',
            fontSize:   13,
            color:      'var(--rule)',
            margin:     '0 2px',
            userSelect: 'none',
          }}>
            /
          </span>

          {/* Page title */}
          <span style={{
            fontFamily:    'var(--ff-mono)',
            fontSize:      9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color:         'var(--mid)',
            padding:       '0 6px',
          }}>
            {pageTitle}
          </span>
        </div>

        <div className="db-vr" style={{ marginTop: 0 }} />

        {/* ── Search bar (desktop) ───────────────────────────────────────── */}
        {!hideSearch && (
          <div
            className="hidden md:flex"
            style={{
              position:  'relative',
              flex:      1,
              maxWidth:  300,
              alignItems:'center',
            }}
          >
            <Search
              size={11}
              style={{
                position:      'absolute',
                left:          10,
                color:         searchFocused ? 'var(--accent)' : 'var(--mid)',
                pointerEvents: 'none',
                transition:    'color 0.15s',
              }}
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={e => onSearchChange?.(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                width:         '100%',
                background:    searchFocused ? 'var(--accent-sub)' : 'transparent',
                border:        `1px solid ${searchFocused ? 'var(--accent)' : 'var(--rule)'}`,
                padding:       '5px 32px 5px 28px',
                fontFamily:    'var(--ff-mono)',
                fontSize:      10,
                letterSpacing: '0.04em',
                color:         'var(--ink)',
                outline:       'none',
                transition:    'border-color 0.15s, background 0.15s',
              }}
            />
            {/* ⌘K hint */}
            <span
              className="hidden lg:flex"
              style={{
                position:      'absolute',
                right:         8,
                fontFamily:    'var(--ff-mono)',
                fontSize:      8,
                letterSpacing: '0.06em',
                color:         'var(--mid)',
                opacity:       searchFocused ? 0 : 0.7,
                display:       'flex',
                alignItems:    'center',
                gap:           2,
                pointerEvents: 'none',
                transition:    'opacity 0.15s',
              }}
            >
              <Command size={8} strokeWidth={1.8} />K
            </span>
          </div>
        )}

        {/* ── Flex spacer ───────────────────────────────────────────────── */}
        <div style={{ flex: 1 }} />

        {/* ── Page-specific controls (children slot) ────────────────────── */}
        {children}

        {/* ── Right controls ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>

          {/* Theme toggle */}
          <button
            className="db-icon-btn"
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark
              ? <Sun  size={13} strokeWidth={1.8} style={{ color: 'var(--mid)' }} />
              : <Moon size={13} strokeWidth={1.8} style={{ color: 'var(--mid)' }} />}
          </button>

          {/* Settings */}
          <button
            className="db-icon-btn"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <Settings size={13} strokeWidth={1.8} style={{ color: 'var(--mid)' }} />
          </button>

          {/* Notifications */}
          <button
            ref={notifBtnRef}
            className={`db-icon-btn${showNotifPanel ? ' active' : ''}`}
            onClick={handleNotifClick}
            title="Notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={13} strokeWidth={1.8} style={{ color: 'var(--mid)' }} />
            {unreadCount > 0 && (
              <span
                className="db-badge"
                style={{ animation: 'db-blink 2.4s step-start infinite' }}
              />
            )}
          </button>

          <div className="db-vr" style={{ marginTop: 0, margin: '0 4px' }} />

          {/* Mobile menu toggle */}
          {setMobileMenuOpen && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="db-icon-btn md:hidden"
              title="Menu"
            >
              {mobileMenuOpen
                ? <X    size={15} strokeWidth={1.8} />
                : <Menu size={15} strokeWidth={1.8} />}
            </button>
          )}

          {/* Account button */}
          <button
            ref={accountBtnRef}
            className="db-ghost"
            style={{
              gap:     5,
              padding: '3px 8px 3px 4px',
              border:  `1px solid ${showAccountMenu ? 'var(--accent)' : 'var(--rule)'}`,
              background: showAccountMenu ? 'var(--accent-sub)' : 'transparent',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onClick={handleAccountClick}
            aria-label="Account menu"
          >
            {/* Avatar */}
            {user?.avatar_url ? (
              <div style={{
                width:    20,
                height:   20,
                overflow: 'hidden',
                border:   '1px solid var(--rule)',
                flexShrink: 0,
              }}>
                <Image
                  src={user.avatar_url}
                  alt={user.name || 'User'}
                  width={20}
                  height={20}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ) : (
              <div style={{
                width:          20,
                height:         20,
                background:     'var(--accent)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                color:          'var(--paper)',
                fontFamily:     'var(--ff-display)',
                fontWeight:     700,
                fontSize:       9,
                flexShrink:     0,
                letterSpacing:  '0.04em',
              }}>
                {initials}
              </div>
            )}

            {/* Name — desktop only */}
            <span
              className="hidden md:block"
              style={{
                fontFamily:    'var(--ff-mono)',
                fontSize:      9.5,
                fontWeight:    500,
                letterSpacing: '0.05em',
                color:         'var(--ink)',
                maxWidth:      100,
                overflow:      'hidden',
                textOverflow:  'ellipsis',
                whiteSpace:    'nowrap',
              }}
            >
              {user?.name || ''}
            </span>

            <ChevronDown
              size={9}
              strokeWidth={2}
              style={{
                color:     'var(--mid)',
                transform: showAccountMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                transition:'transform 0.2s ease',
              }}
              className="hidden sm:block"
            />
          </button>
        </div>
      </header>

      {/* ── Accent rule at bottom of header (decorative) ──────────────────── */}
      <div
        aria-hidden
        style={{
          position:   'sticky',
          top:        44,
          left:       0,
          right:      0,
          height:     1,
          zIndex:     39,
          background: 'linear-gradient(90deg, transparent 0%, var(--accent) 40%, var(--accent) 60%, transparent 100%)',
          opacity:    0.18,
          pointerEvents: 'none',
        }}
      />

      {/* ── Notification panel portal ──────────────────────────────────────── */}
      {showNotifPanel && notifPanelPos && createPortal(
        <div
          ref={notifPanelRef}
          style={{
            position: 'fixed',
            top:      notifPanelPos.top,
            right:    notifPanelPos.right,
            zIndex:   9960,
            maxWidth: 'calc(100vw - 16px)',
          }}
        >
          <NotifPanel
            notifs={notifications}
            onMarkAllRead={handleMarkAllRead}
            onClose={() => setShowNotifPanel(false)}
          />
        </div>,
        document.body
      )}

      {/* ── Account menu portal ────────────────────────────────────────────── */}
      {showAccountMenu && accountMenuPos && createPortal(
        <div
          ref={accountMenuRef}
          style={{
            position: 'fixed',
            top:      accountMenuPos.top,
            right:    accountMenuPos.right,
            zIndex:   9960,
          }}
        >
          <AccountMenu
            user={user}
            onClose={() => setShowAccountMenu(false)}
            onToast={setToast}
            onOpenSettings={() => {
              setShowAccountMenu(false);
              setShowSettings(true);
            }}
            isDark={isDark}
            onToggleTheme={toggleTheme}
          />
        </div>,
        document.body
      )}

      {/* ── Settings modal ─────────────────────────────────────────────────── */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onChange={next => {
            setSettings(next);
            saveSettings(next);
            applySettings(next);
          }}
        />
      )}

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  );
}