'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Bell, Moon, Sun, Plus, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';
import AccountMenu from './AccountMenu';
import NotifPanel, { Notif } from './NotifPanel';

interface HeaderProps {
  user: any;
  notifs?: Notif[];
  unreadCount?: number;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onMarkAllRead: () => void;
  onToast: (msg: string) => void;
  // Optional: Add specific breadcrumb or sub-label for specific pages
  pageTitle?: string;
  pageTitleHref?: string;
  children?: React.ReactNode;
}

export default function Header({
  user,
  notifs = [],
  unreadCount = 0,
  isDark,
  onToggleTheme,
  onOpenSearch,
  onOpenSettings,
  onMarkAllRead,
  onToast,
  pageTitle,
  pageTitleHref,
  children
}: HeaderProps) {
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [accountMenuPos, setAccountMenuPos] = useState<{ top: number; right: number } | null>(null);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const accountBtnRef = useRef<HTMLButtonElement>(null);

  // Close panels on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) setShowNotifPanel(false);
      if (accountRef.current && !accountRef.current.contains(target)) setShowAccountMenu(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleAccountClick = () => {
    if (!showAccountMenu && accountBtnRef.current) {
      const rect = accountBtnRef.current.getBoundingClientRect();
      setAccountMenuPos({ top: rect.bottom + 5, right: window.innerWidth - rect.right });
    }
    setShowAccountMenu(!showAccountMenu);
    setShowNotifPanel(false);
  };

  return (
    <header className="db-header">
      {/* ── Brand / Logo ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, userSelect: 'none' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'inherit', textDecoration: 'none' }}>
          <Image src="/logo.svg" alt="Vantage" width={15} height={18} style={{ height: 'auto' }} priority />
          <span style={{ fontFamily: 'var(--ff-display)', fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--ink)' }}>
            <span className="hidden sm:inline">Carcino</span> Vantage
          </span>
        </Link>
        {pageTitle && (
          <>
            <span style={{ color: 'var(--rule)', fontSize: 14, fontFamily: 'var(--ff-mono)' }}>/</span>
            {pageTitleHref ? (
              <Link href={pageTitleHref} style={{ textDecoration: 'none' }}>
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mid)' }}>
                  {pageTitle}
                </span>
              </Link>
            ) : (
              <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mid)' }}>
                {pageTitle}
              </span>
            )}
          </>
        )}
      </div>

      <div className="db-vr" />

      {children}

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <button className="db-search" onClick={onOpenSearch} title="Search (Ctrl+K)">
        <Search size={11} strokeWidth={1.8} />
        <span>Search or command…</span>
        <span className="db-kbd hidden md:inline-block">⌘K</span>
      </button>

      <div style={{ flex: 1 }} />

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        
        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button 
            className={`db-icon-btn${showNotifPanel ? ' active' : ''}`}
            onClick={() => { setShowNotifPanel(!showNotifPanel); setShowAccountMenu(false); }}
            title="Notifications"
          >
            <Bell size={13} strokeWidth={1.8} />
            {unreadCount > 0 && <span className="db-badge" style={{ animation: 'db-blink 2.2s step-start infinite' }} />}
          </button>
          {showNotifPanel && (
            <NotifPanel
              notifs={notifs}
              onMarkAllRead={onMarkAllRead}
              onClose={() => setShowNotifPanel(false)}
            />
          )}
        </div>

        {/* Theme Toggle */}
        <button className="db-icon-btn" onClick={onToggleTheme} title={isDark ? 'Light mode' : 'Dark mode'}>
          {isDark ? <Sun size={13} strokeWidth={1.8} /> : <Moon size={13} strokeWidth={1.8} />}
        </button>

        <div className="db-vr" />

        {/* New Document Button */}
        <Link href="/editor">
          <button className="db-btn" style={{ padding: '6px 12px' }}>
            <Plus size={10} strokeWidth={2.2} />
            <span className="hidden sm:inline">New</span>
          </button>
        </Link>

        <div className="db-vr" />

        {/* Account Menu */}
        <div ref={accountRef} style={{ position: 'relative' }}>
          <button
            ref={accountBtnRef}
            className="db-ghost"
            style={{ gap: 6, padding: '3px 8px 3px 4px' }}
            onClick={handleAccountClick}
          >
            {user?.avatar_url ? (
              <div style={{ width: 20, height: 20, overflow: 'hidden', border: '1px solid var(--rule)', flexShrink: 0 }}>
                <Image src={user.avatar_url} alt="Profile" width={20} height={20} />
              </div>
            ) : (
              <div className="db-avatar" style={{ width: 20, height: 20 }}>
                {user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'S'}
              </div>
            )}
            <span className="hidden md:block" style={{ fontFamily: 'var(--ff-ui)', fontSize: 9.5, fontWeight: 500, letterSpacing: '0.06em', color: 'var(--ink)' }}>
              {user?.name || ''}
            </span>
            <ChevronDown className="hidden sm:block" size={10} strokeWidth={2} style={{ color: 'var(--mid)' }} />
          </button>

          {showAccountMenu && accountMenuPos && createPortal(
            <div style={{ position: 'fixed', top: accountMenuPos.top, right: accountMenuPos.right, zIndex: 9960 }}>
              <AccountMenu user={user} onClose={() => setShowAccountMenu(false)} onToast={onToast} onOpenSettings={onOpenSettings} />
            </div>,
            document.body
          )}
        </div>
      </div>
    </header>
  );
}