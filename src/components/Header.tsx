'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import {
  Search, Bell, Moon, Sun, Plus, ChevronDown,
  Settings, Menu, X, Columns, LayoutTemplate, Eye,
  Maximize2, ScanLine, Download, FolderOpen, PanelLeft,
} from 'lucide-react';
import type { ViewMode, Collaborator } from '@/types';
import AccountMenu from './AccountMenu';
import NotifPanel, { Notif } from './NotifPanel';
import CommandPalette from './CommandPalette';
interface HeaderProps {
  user: any;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenSearch: () => void;
  onOpenCmd: () => void;
  onOpenSettings: () => void;
  onToast: (msg: string) => void;

  // Notifications
  notifs?: Notif[];
  unreadCount?: number;
  onMarkAllRead?: () => void;

  // Breadcrumb
  pageTitle?: string;
  pageTitleHref?: string;

  // Slot for extra header content
  children?: React.ReactNode;

  // Sidebar
  sidebarOpen?: boolean;
  setSidebarOpen?: (o: boolean) => void;

  // Filename + save state
  fileName?: string;
  setFileName?: (n: string) => void;
  isSaved?: boolean;
  status?: string;
  onOpenMetadata?: () => void;

  // View modes
  viewMode?: ViewMode;
  setViewMode?: (v: ViewMode) => void;

  // Zen / Focus
  zenMode?: boolean;
  focusMode?: boolean;
  onToggleZen?: () => void;
  onToggleFocus?: () => void;

  // File actions
  onNew?: () => void;
  onOpenFile?: () => void;
  onExportMd?: () => void;
  onExportHtml?: () => void;

  // Collaborators
  collaborators?: Collaborator[];

  // Mobile menu
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (o: boolean) => void;

  // Tour
  onOpenTour?: () => void;
}

export default function Header({
  user,
  isDark,
  onToggleTheme,
  onOpenSearch,
  onOpenSettings,
  onOpenCmd,
  onToast,
  notifs = [],
  unreadCount = 0,
  onMarkAllRead,
  pageTitle,
  pageTitleHref,
  children,
  sidebarOpen,
  setSidebarOpen,
  fileName,
  setFileName,
  isSaved,
  status,
  onOpenMetadata,
  viewMode,
  setViewMode,
  zenMode,
  focusMode,
  onToggleZen,
  onToggleFocus,
  onNew,
  onOpenFile,
  onExportMd,
  onExportHtml,
  collaborators = [],
  mobileMenuOpen,
  setMobileMenuOpen,
  onOpenTour,
}: HeaderProps) {
  const router = useRouter();

  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [accountMenuPos, setAccountMenuPos] = useState<{ top: number; right: number } | null>(null);

  const notifRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const accountBtnRef = useRef<HTMLButtonElement>(null);

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

  if (zenMode) return null;

  return (
    <>
      <header className="db-header">

        {/* ── Sidebar toggle ───────────────────────────────────────────── */}
        {setSidebarOpen && (
          <>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`db-icon-btn ${sidebarOpen ? 'active' : ''}`}
              style={{ border: '1px solid var(--rule)', flexShrink: 0 }}
              title="Toggle sidebar"
            >
              <PanelLeft size={14} />
            </button>
            <div className="db-vr" />
          </>
        )}

        {/* ── Brand / Logo ─────────────────────────────────────────────── */}
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

        {/* ── Filename input (when in editor context) ──────────────────── */}
        {fileName !== undefined && setFileName && (
          <>
            <div className="flex items-center gap-2 min-w-0" style={{ flex: '0 1 260px' }}>
              <input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="db-inp min-w-0"
                style={{ flex: 1, fontSize: '13px', fontWeight: 500 }}
                spellCheck={false}
              />
              <span
                className={`db-status flex-shrink-0 hidden sm:block ${isSaved ? 'published' : 'draft'}`}
                style={{ fontSize: '7px' }}
              >
                {isSaved ? 'SYNCED' : 'MODIFIED'}
              </span>
              {status && (
                <span
                  className="db-status flex-shrink-0 cursor-pointer hidden md:block"
                  style={{ fontSize: '7px', color: 'var(--accent)', borderColor: 'var(--accent)' }}
                  onClick={onOpenMetadata}
                >
                  {status.toUpperCase().replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <div className="db-vr hidden sm:block" />
          </>
        )}

        {/* ── Injected children ────────────────────────────────────────── */}
        {children}

        {/* ── Search ───────────────────────────────────────────────────── */}
        <button className="db-search hidden sm:flex" onClick={onOpenCmd} title="Search (Ctrl+K)">
          <Search size={11} strokeWidth={1.8} />
          <span>Search or command…</span>
          <span className="db-kbd hidden md:inline-block">⌘K</span>
        </button>

        <div style={{ flex: 1 }} />

        {/* ── Right-side actions ───────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>

          {/* View mode toggles */}
          {setViewMode && (
            <div className="hidden lg:flex items-center gap-0 border border-[var(--rule)]" id="tour-view-modes">
              <button
                onClick={() => setViewMode('editor')}
                className={`db-icon-btn ${viewMode === 'editor' ? 'active' : ''}`}
                style={{ border: 'none', borderRight: '1px solid var(--rule)' }}
                title="Editor only"
              >
                <LayoutTemplate size={13} />
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`db-icon-btn ${viewMode === 'split' ? 'active' : ''}`}
                style={{ border: 'none', borderRight: '1px solid var(--rule)' }}
                title="Split view"
              >
                <Columns size={13} />
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`db-icon-btn ${viewMode === 'preview' ? 'active' : ''}`}
                style={{ border: 'none' }}
                title="Preview only"
              >
                <Eye size={13} />
              </button>
            </div>
          )}

          {/* Zen / Focus tools */}
          {(onToggleZen || onToggleFocus) && (
            <div className="hidden md:flex items-center gap-0 border border-[var(--rule)]">
              {onToggleZen && (
                <button
                  onClick={onToggleZen}
                  className="db-icon-btn"
                  style={{ border: 'none', borderRight: onToggleFocus ? '1px solid var(--rule)' : 'none' }}
                  title="Zen mode (Ctrl+Shift+Z)"
                >
                  <Maximize2 size={13} strokeWidth={1.8} />
                </button>
              )}
              {onToggleFocus && (
                <button
                  onClick={onToggleFocus}
                  className={`db-icon-btn ${focusMode ? 'active' : ''}`}
                  style={{ border: 'none' }}
                  title="Focus mode (Ctrl+Shift+F)"
                >
                  <ScanLine size={13} strokeWidth={1.8} />
                </button>
              )}
            </div>
          )}

          {/* File actions: new / open / export */}
          {(onNew || onOpenFile || onExportMd) && (
            <div className="hidden md:flex items-center gap-0 border border-[var(--rule)]" id="tour-export">
              {onNew && (
                <button
                  onClick={onNew}
                  className="db-icon-btn"
                  style={{ border: 'none', borderRight: (onOpenFile || onExportMd) ? '1px solid var(--rule)' : 'none' }}
                  title="New document"
                >
                  <Plus size={13} strokeWidth={2.2} />
                </button>
              )}
              {onOpenFile && (
                <button
                  onClick={onOpenFile}
                  className="db-icon-btn"
                  style={{ border: 'none', borderRight: onExportMd ? '1px solid var(--rule)' : 'none' }}
                  title="Open file"
                >
                  <FolderOpen size={13} strokeWidth={1.8} />
                </button>
              )}
              {onExportMd && (
                <button
                  onClick={onExportMd}
                  className="db-icon-btn"
                  style={{ border: 'none' }}
                  title="Export Markdown"
                >
                  <Download size={13} strokeWidth={1.8} />
                </button>
              )}
            </div>
          )}

          {/* Collaborator avatars */}
          {collaborators.length > 0 && (
            <div className="hidden sm:flex -space-x-1 border-l border-[var(--rule)] pl-2 ml-1 h-6 items-center">
              {collaborators.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  className="db-avatar"
                  style={{ width: 20, height: 20, fontSize: 8, zIndex: 10 }}
                  title={c.name}
                >
                  {c.avatar_url
                    ? <img src={c.avatar_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : c.name[0]}
                </div>
              ))}
              {collaborators.length > 3 && (
                <div className="db-avatar" style={{ width: 20, height: 20, fontSize: 7, zIndex: 10 }}>
                  +{collaborators.length - 3}
                </div>
              )}
            </div>
          )}

          {/* Notifications */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              className={`db-icon-btn${showNotifPanel ? ' active' : ''}`}
              onClick={() => { setShowNotifPanel(!showNotifPanel); setShowAccountMenu(false); }}
              title="Notifications"
            >
              <Bell size={13} strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span className="db-badge" style={{ animation: 'db-blink 2.2s step-start infinite' }} />
              )}
            </button>
            {showNotifPanel && onMarkAllRead && (
              <NotifPanel
                notifs={notifs}
                onMarkAllRead={onMarkAllRead}
                onClose={() => setShowNotifPanel(false)}
              />
            )}
          </div>

          {/* Theme toggle */}
          <button 
  onClick={onToggleTheme} 
  className="p-2 transition-colors hover:bg-[var(--accent-sub)] text-[var(--mid)] hover:text-[var(--accent)] hidden sm:flex" 
  title="Toggle Theme"
>
  {isDark ? (
    <Sun size={17} className="text-yellow-500" />
  ) : (
    <Moon size={17} />
  )}
</button>

          {/* Settings */}
          <button className="db-icon-btn hidden sm:flex" onClick={onOpenSettings} title="Settings">
            <Settings size={13} strokeWidth={1.8} />
          </button>

          <div className="db-vr" />

          {/* Mobile menu toggle */}
          {setMobileMenuOpen && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="db-icon-btn md:hidden"
              title="Menu"
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          )}

          {/* Account */}
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
                <AccountMenu 
                  user={user} 
                  onClose={() => setShowAccountMenu(false)} 
                  onToast={onToast} 
                  onOpenSettings={onOpenSettings} 
                  isDark={isDark}
                  onToggleTheme={onToggleTheme}
                />
              </div>,
              document.body
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile menu panel ────────────────────────────────────────────── */}
      {mobileMenuOpen && setMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[42px] bg-[var(--paper)] border-b border-[var(--rule)] z-40 p-4 space-y-4 max-h-[calc(100vh-42px)] overflow-y-auto">

          {setViewMode && (
            <div className="space-y-2">
              <span className="db-cap block mb-2">View Mode</span>
              <div className="flex gap-2">
                {(['editor', 'split', 'preview'] as ViewMode[]).map((m, i) => (
                  <button
                    key={m}
                    onClick={() => { setViewMode(m); setMobileMenuOpen(false); }}
                    className={`flex-1 py-2 border ${viewMode === m ? 'border-[var(--accent)] bg-[var(--accent-sub)]' : 'border-[var(--rule)]'}`}
                  >
                    {i === 0 ? <LayoutTemplate size={16} className="mx-auto" />
                     : i === 1 ? <Columns size={16} className="mx-auto" />
                     : <Eye size={16} className="mx-auto" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {onToggleZen && (
              <button onClick={() => { onToggleZen(); setMobileMenuOpen(false); }} className="db-ghost justify-center text-xs">
                <Maximize2 size={14} className="mr-2" /> Zen Mode
              </button>
            )}
            {onToggleFocus && (
              <button onClick={() => { onToggleFocus(); setMobileMenuOpen(false); }} className="db-ghost justify-center text-xs">
                <ScanLine size={14} className="mr-2" /> Focus
              </button>
            )}
            {/* Theme Toggle */}
        <button className="db-icon-btn" onClick={onToggleTheme} title={isDark ? 'Light mode' : 'Dark mode'}>
          {isDark ? <Sun size={13} strokeWidth={1.8} /> : <Moon size={13} strokeWidth={1.8} />}
        </button>
            {setSidebarOpen && (
              <button onClick={() => { setSidebarOpen(!sidebarOpen); setMobileMenuOpen(false); }} className="db-ghost justify-center text-xs">
                <PanelLeft size={14} className="mr-2" /> Sidebar
              </button>
            )}
          </div>

          {(onNew || onOpenFile || onExportMd) && (
            <div className="border-t border-[var(--rule)] pt-4 space-y-2">
              <span className="db-cap block">File</span>
              {onNew && (
                <button onClick={() => { onNew(); setMobileMenuOpen(false); }} className="w-full db-btn justify-center text-xs">
                  <Plus size={14} className="mr-2" /> New Document
                </button>
              )}
              {onOpenFile && (
                <button onClick={() => { onOpenFile(); setMobileMenuOpen(false); }} className="w-full db-ghost justify-center text-xs">
                  <FolderOpen size={14} className="mr-2" /> Open File
                </button>
              )}
              {onExportMd && (
                <button onClick={() => { onExportMd(); setMobileMenuOpen(false); }} className="w-full db-ghost justify-center text-xs">
                  <Download size={14} className="mr-2" /> Export Markdown
                </button>
              )}
            </div>
          )}

          <div className="border-t border-[var(--rule)] pt-4 space-y-2">
            {onOpenMetadata && (
              <button onClick={() => { onOpenMetadata(); setMobileMenuOpen(false); }} className="w-full db-ghost justify-center text-xs">
                Document Settings
              </button>
            )}
            <button onClick={() => { onOpenSettings(); setMobileMenuOpen(false); }} className="w-full db-ghost justify-center text-xs">
              <Settings size={14} className="mr-2" /> App Settings
            </button>
          </div>
        </div>
      )}
    </>
  );
}