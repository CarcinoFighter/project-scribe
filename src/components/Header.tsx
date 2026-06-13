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
  Smartphone, Save, Pencil, Check,
} from 'lucide-react';
import type { ViewMode, Collaborator } from '@/types';
import AccountMenu from './AccountMenu';
import NotifPanel, { Notif } from './NotifPanel';
import { usePWAInstall } from '@/lib/usePWAInstall';
import { getCollaboratorColor } from '@/lib/utils';
import SettingsModal, {
  loadSettings,
  saveSettings,
  applySettings,
  type AppSettings,
} from '@/components/SettingsModal';

interface HeaderProps {
  user: any;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenSearch: () => void;
  onOpenCmd: () => void;
  onOpenSettings: () => void;
  onToast: (msg: string) => void;
  notifs?: Notif[];
  unreadCount?: number;
  onMarkAllRead?: () => void;
  pageTitle?: string;
  pageTitleHref?: string;
  breadcrumb?: React.ReactNode;
  children?: React.ReactNode;
  sidebarOpen?: boolean;
  setSidebarOpen?: (o: boolean) => void;
  fileName?: string;
  setFileName?: (n: string) => void;
  isSaved?: boolean;
  status?: string;
  onOpenMetadata?: () => void;
  onSave?: () => void;
  viewMode?: ViewMode;
  setViewMode?: (v: ViewMode) => void;
  zenMode?: boolean;
  focusMode?: boolean;
  onToggleZen?: () => void;
  onToggleFocus?: () => void;
  onNew?: () => void;
  onOpenFile?: () => void;
  onExportMd?: () => void;
  onExportHtml?: () => void;
  collaborators?: Collaborator[];
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (o: boolean) => void;
  onOpenTour?: () => void;
  extraMobileContent?: React.ReactNode;
}

export default function Header({
  user, isDark, onToggleTheme, onOpenSearch, onOpenSettings, onOpenCmd, onToast,
  notifs = [], unreadCount = 0, onMarkAllRead,
  pageTitle, pageTitleHref, children, breadcrumb,
  sidebarOpen, setSidebarOpen,
  fileName, setFileName, isSaved, status, onOpenMetadata, onSave,
  viewMode, setViewMode,
  zenMode, focusMode, onToggleZen, onToggleFocus,
  onNew, onOpenFile, onExportMd, onExportHtml,
  collaborators = [],
  mobileMenuOpen, setMobileMenuOpen,
  onOpenTour, extraMobileContent,
}: HeaderProps) {
  const router = useRouter();

  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [accountMenuPos, setAccountMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [notifPanelPos, setNotifPanelPos] = useState<{ top: number; right: number } | null>(null);
  const [mobileRenaming, setMobileRenaming] = useState(false);
  const [mobileFileName, setMobileFileName] = useState(fileName ?? '');
  const mobileRenameInputRef = useRef<HTMLInputElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  useEffect(() => {
    if (!mobileRenaming) setMobileFileName(fileName ?? '');
  }, [fileName, mobileRenaming]);

  const commitMobileRename = () => {
    if (setFileName && mobileFileName.trim()) setFileName(mobileFileName.trim());
    else setMobileFileName(fileName ?? '');
    setMobileRenaming(false);
  };

  const { canInstall, install } = usePWAInstall();
  const notifBtnRef = useRef<HTMLButtonElement>(null);
  const notifPanelRef = useRef<HTMLDivElement>(null);
  const accountBtnRef = useRef<HTMLButtonElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!notifBtnRef.current?.contains(target) && !notifPanelRef.current?.contains(target))
        setShowNotifPanel(false);
      if (!accountBtnRef.current?.contains(target) && !accountMenuRef.current?.contains(target))
        setShowAccountMenu(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleAccountClick = () => {
    if (!showAccountMenu && accountBtnRef.current) {
      const rect = accountBtnRef.current.getBoundingClientRect();
      setAccountMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setShowAccountMenu(prev => !prev);
    setShowNotifPanel(false);
  };

  const handleNotifClick = () => {
    if (!showNotifPanel && notifBtnRef.current) {
      const rect = notifBtnRef.current.getBoundingClientRect();
      setNotifPanelPos({ top: rect.bottom + 6, right: Math.max(8, window.innerWidth - rect.right) });
    }
    setShowNotifPanel(prev => !prev);
    setShowAccountMenu(false);
  };

  if (zenMode) return null;

  const hasEditorCtx = fileName !== undefined && setFileName;

  return (
    <>
      <header className="db-header">

        {/* Sidebar toggle */}
        {setSidebarOpen && (
          <>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`db-icon-btn ${sidebarOpen ? 'active' : ''}`}
              title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <PanelLeft size={13} />
            </button>
            <div className="db-vr" />
          </>
        )}

        {/* Brand / Breadcrumb */}
        <div className="flex items-center gap-2 flex-shrink-0 select-none">
          {breadcrumb ?? (
            <>
              <Link href="/" className="flex items-center gap-2 no-underline text-inherit">
                <Image src="/logo.svg" alt="Vantage" width={14} height={16} priority style={{ height: 'auto' }} />
                <span className="hidden sm:inline font-bold text-sm tracking-tight" style={{ fontFamily: 'var(--ff-display)', color: 'var(--ink)' }}>
                  Vantage
                </span>
              </Link>
              {pageTitle && (
                <>
                  <span style={{ color: 'var(--rule)', fontFamily: 'var(--ff-mono)', fontSize: 13 }}>/</span>
                  {pageTitleHref
                    ? <Link href={pageTitleHref} style={{ textDecoration: 'none' }}><span className="db-cap">{pageTitle}</span></Link>
                    : <span className="db-cap">{pageTitle}</span>}
                </>
              )}
            </>
          )}
        </div>

        <div className="db-vr" />

        {/* Filename input — desktop */}
        {hasEditorCtx && (
          <>
            <div className="hidden sm:flex items-center gap-2 min-w-0" style={{ flex: '0 1 240px' }}>
              <input
                value={fileName}
                onChange={e => setFileName!(e.target.value)}
                className="db-inp min-w-0"
                style={{ flex: 1, fontSize: '12px', fontWeight: 500, height: '26px', padding: '0 8px' }}
                spellCheck={false}
              />
              <span className={`db-status flex-shrink-0 ${isSaved ? 'published' : 'draft'}`} style={{ fontSize: '7px' }}>
                {isSaved ? 'Saved' : 'Unsaved'}
              </span>
              {status && (
                <span
                  className="db-status flex-shrink-0 cursor-pointer hidden md:block"
                  style={{ fontSize: '7px', color: 'var(--accent)', borderColor: 'var(--accent)', background: 'var(--accent-dim)' }}
                  onClick={onOpenMetadata}
                >
                  {status.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <div className="db-vr hidden sm:block" />
          </>
        )}

        {children}

        {/* Search — full bar on desktop, icon-only on mobile */}
        <button className="db-search hidden md:flex" onClick={onOpenCmd} title="Command palette (Ctrl+K)">
          <Search size={10} strokeWidth={1.8} />
          <span>Search or command…</span>
          <span className="db-kbd hidden lg:inline-block">⌘K</span>
        </button>
        <button className="db-icon-btn md:hidden" onClick={onOpenCmd} title="Command palette">
          <Search size={13} />
        </button>

        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-1">

          {/* View mode — desktop */}
          {setViewMode && (
            <div className="hidden lg:flex items-center rounded overflow-hidden border border-[var(--rule)]" id="tour-view-modes">
              {([
                { m: 'editor' as ViewMode, icon: LayoutTemplate, title: 'Editor only' },
                { m: 'split' as ViewMode, icon: Columns, title: 'Split view' },
                { m: 'preview' as ViewMode, icon: Eye, title: 'Preview only' },
              ]).map(({ m, icon: Icon, title }, i, arr) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`db-icon-btn ${viewMode === m ? 'active' : ''}`}
                  style={{ border: 'none', borderRadius: 0, borderRight: i < arr.length - 1 ? '1px solid var(--rule)' : 'none', width: 26, height: 26 }}
                  title={title}
                >
                  <Icon size={12} />
                </button>
              ))}
            </div>
          )}

          {/* Zen / Focus */}
          {(onToggleZen || onToggleFocus) && (
            <div className="hidden md:flex items-center rounded overflow-hidden border border-[var(--rule)]">
              {onToggleZen && (
                <button onClick={onToggleZen} className="db-icon-btn" style={{ border: 'none', borderRadius: 0, borderRight: onToggleFocus ? '1px solid var(--rule)' : 'none', width: 26, height: 26 }} title="Zen mode">
                  <Maximize2 size={12} />
                </button>
              )}
              {onToggleFocus && (
                <button onClick={onToggleFocus} className={`db-icon-btn ${focusMode ? 'active' : ''}`} style={{ border: 'none', borderRadius: 0, width: 26, height: 26 }} title="Focus mode">
                  <ScanLine size={12} />
                </button>
              )}
            </div>
          )}

          {/* File actions */}
          {(onNew || onOpenFile || onExportMd) && (
            <div className="hidden md:flex items-center rounded overflow-hidden border border-[var(--rule)]" id="tour-export">
              {onNew && (
                <button onClick={onNew} className="db-icon-btn" style={{ border: 'none', borderRadius: 0, borderRight: (onOpenFile || onExportMd) ? '1px solid var(--rule)' : 'none', width: 26, height: 26 }} title="New document">
                  <Plus size={12} strokeWidth={2.5} />
                </button>
              )}
              {onOpenFile && (
                <button onClick={onOpenFile} className="db-icon-btn" style={{ border: 'none', borderRadius: 0, borderRight: onExportMd ? '1px solid var(--rule)' : 'none', width: 26, height: 26 }} title="Open file">
                  <FolderOpen size={12} />
                </button>
              )}
              {onExportMd && (
                <button onClick={onExportMd} className="db-icon-btn" style={{ border: 'none', borderRadius: 0, width: 26, height: 26 }} title="Export Markdown">
                  <Download size={12} />
                </button>
              )}
            </div>
          )}

          {/* Collaborator avatars */}
          {collaborators.length > 0 && (
            <div className="hidden sm:flex -space-x-1 pl-1">
              {collaborators.slice(0, 3).map(c => (
                <div
                  key={c.id}
                  className="db-avatar"
                  style={{ width: 22, height: 22, fontSize: 8, border: `1.5px solid ${getCollaboratorColor(c.id)}`, zIndex: 10 }}
                  title={c.name}
                >
                  {c.avatar_url
                    ? <img src={c.avatar_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : c.name[0]}
                </div>
              ))}
              {collaborators.length > 3 && (
                <div className="db-avatar" style={{ width: 22, height: 22, fontSize: 7, zIndex: 10 }}>
                  +{collaborators.length - 3}
                </div>
              )}
            </div>
          )}

          {/* Mobile document status + setup button */}
          {hasEditorCtx && status && onOpenMetadata && (
            <button
              className="sm:hidden db-status cursor-pointer flex-shrink-0"
              style={{ fontSize: '7px', color: 'var(--accent)', borderColor: 'var(--accent)', background: 'var(--accent-dim)' }}
              onClick={onOpenMetadata}
              title="Document Setup"
            >
              {status.replace(/_/g, ' ')}
            </button>
          )}

          {/* Mobile save */}
          {hasEditorCtx && onSave && (
            <button
              className="db-icon-btn sm:hidden"
              onClick={onSave}
              title={isSaved ? 'Saved' : 'Save'}
              style={!isSaved ? { color: 'var(--accent)', borderColor: 'var(--accent-sub)' } : undefined}
            >
              <Save size={13} />
            </button>
          )}

          {/* Notifications */}
          <button ref={notifBtnRef} className={`db-icon-btn${showNotifPanel ? ' active' : ''}`} onClick={handleNotifClick} title="Notifications">
            <Bell size={12} />
            {unreadCount > 0 && <span className="db-badge" />}
          </button>

          {showNotifPanel && onMarkAllRead && notifPanelPos && createPortal(
            <div ref={notifPanelRef} style={{ position: 'fixed', top: notifPanelPos.top, right: notifPanelPos.right, zIndex: 9960, maxWidth: 'calc(100vw - 16px)' }}>
              <NotifPanel notifs={notifs} onMarkAllRead={onMarkAllRead} onClose={() => setShowNotifPanel(false)} />
            </div>,
            document.body
          )}

          {/* Theme */}
          <button onClick={onToggleTheme} className="db-icon-btn hidden sm:flex" title="Toggle theme">
            {isDark ? <Sun size={12} /> : <Moon size={12} />}
          </button>

          {/* Settings */}
          <button className="db-icon-btn hidden sm:flex" onClick={() => setShowSettings(true)} title="Settings">
            <Settings size={12} />
          </button>

          <div className="db-vr" />

          {/* Mobile menu */}
          {setMobileMenuOpen && (
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="db-icon-btn md:hidden" title="Menu">
              {mobileMenuOpen ? <X size={14} /> : <Menu size={14} />}
            </button>
          )}

          {/* Account */}
          <button
            ref={accountBtnRef}
            className="db-ghost flex items-center gap-1.5"
            style={{ padding: '2px 6px 2px 3px', height: '26px' }}
            onClick={handleAccountClick}
          >
            {user?.avatar_url ? (
              <div style={{ width: 18, height: 18, borderRadius: '50%', overflow: 'hidden', border: `1.5px solid ${getCollaboratorColor(user.id)}`, flexShrink: 0 }}>
                <Image src={user.avatar_url} alt="Profile" width={18} height={18} style={{ display: 'block' }} />
              </div>
            ) : (
              <div className="db-avatar" style={{ width: 18, height: 18, fontSize: 7, border: `1.5px solid ${getCollaboratorColor(user?.id || '')}` }}>
                {user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'S'}
              </div>
            )}
            <span className="hidden md:block" style={{ fontFamily: 'var(--ff-ui)', fontSize: 12, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              {user?.name?.split(' ')[0] || ''}
            </span>
            <ChevronDown className="hidden sm:block" size={10} strokeWidth={2} style={{ color: 'var(--mid)' }} />
          </button>

          {showAccountMenu && accountMenuPos && createPortal(
            <div ref={accountMenuRef} style={{ position: 'fixed', top: accountMenuPos.top, right: accountMenuPos.right, zIndex: 9960 }}>
              <AccountMenu user={user} onClose={() => setShowAccountMenu(false)} onToast={onToast} onOpenSettings={onOpenSettings} isDark={isDark} onToggleTheme={onToggleTheme} />
            </div>,
            document.body
          )}
        </div>
      </header>

      {/* Mobile menu panel */}
      {mobileMenuOpen && setMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 bg-[var(--paper)] border-b border-[var(--rule)] z-40 p-4 space-y-4 max-h-[calc(100dvh-42px)] overflow-y-auto" style={{ top: '42px' }}>

          {hasEditorCtx && (
            <div className="border-b border-[var(--rule)] pb-4 space-y-2">
              <span className="db-cap block">Document</span>
              <div className="flex items-center gap-2">
                {mobileRenaming ? (
                  <>
                    <input
                      ref={mobileRenameInputRef}
                      value={mobileFileName}
                      onChange={e => setMobileFileName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') commitMobileRename(); if (e.key === 'Escape') { setMobileFileName(fileName ?? ''); setMobileRenaming(false); } }}
                      className="db-inp flex-1 text-xs"
                      autoFocus spellCheck={false}
                    />
                    <button onClick={commitMobileRename} className="db-icon-btn" style={{ color: 'var(--accent)', borderColor: 'var(--accent-sub)' }}><Check size={12} /></button>
                    <button onClick={() => { setMobileFileName(fileName ?? ''); setMobileRenaming(false); }} className="db-icon-btn"><X size={12} /></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 truncate text-xs font-medium" style={{ color: 'var(--ink)', fontFamily: 'var(--ff-ui)' }}>{fileName || 'Untitled'}</span>
                    <span className={`db-status flex-shrink-0 ${isSaved ? 'published' : 'draft'}`} style={{ fontSize: '7px' }}>{isSaved ? 'Saved' : 'Unsaved'}</span>
                    <button onClick={() => { setMobileRenaming(true); setTimeout(() => mobileRenameInputRef.current?.select(), 50); }} className="db-icon-btn flex-shrink-0"><Pencil size={12} /></button>
                  </>
                )}
              </div>
              {onSave && (
                <button onClick={() => { onSave(); setMobileMenuOpen(false); }} className="flex-1 db-btn justify-center text-xs w-full" style={!isSaved ? { background: 'var(--accent)' } : undefined}>
                  <Save size={13} className="mr-2" />{isSaved ? 'Saved' : 'Save now'}
                </button>
              )}
            </div>
          )}

          {setSidebarOpen && (
            <div className="border-b border-[var(--rule)] pb-4">
              <button onClick={() => { setSidebarOpen(!sidebarOpen); setMobileMenuOpen(false); }} className={`w-full db-ghost justify-center text-xs ${sidebarOpen ? 'active' : ''}`}>
                <PanelLeft size={13} className="mr-2" />{sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
              </button>
            </div>
          )}

          {setViewMode && (
            <div className="space-y-2">
              <span className="db-cap block">View</span>
              <div className="flex gap-2">
                {(['editor', 'split', 'preview'] as ViewMode[]).map((m, i) => (
                  <button key={m} onClick={() => { setViewMode(m); setMobileMenuOpen(false); }} className={`flex-1 py-2 border rounded ${viewMode === m ? 'border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]' : 'border-[var(--rule)] text-[var(--mid)]'}`}>
                    {i === 0 ? <LayoutTemplate size={15} className="mx-auto" /> : i === 1 ? <Columns size={15} className="mx-auto" /> : <Eye size={15} className="mx-auto" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {onToggleZen && <button onClick={() => { onToggleZen(); setMobileMenuOpen(false); }} className="db-ghost justify-center text-xs"><Maximize2 size={13} className="mr-1.5" />Zen</button>}
            {onToggleFocus && <button onClick={() => { onToggleFocus(); setMobileMenuOpen(false); }} className="db-ghost justify-center text-xs"><ScanLine size={13} className="mr-1.5" />Focus</button>}
            <button className="db-ghost justify-center text-xs" onClick={() => onToggleTheme()}>
              {isDark ? <Sun size={12} className="mr-1.5" /> : <Moon size={12} className="mr-1.5" />}
              {isDark ? 'Light' : 'Dark'}
            </button>
            {canInstall && <button onClick={() => { install(); setMobileMenuOpen(false); }} className="db-ghost justify-center text-xs"><Smartphone size={13} className="mr-1.5" />Install</button>}
          </div>

          {(onNew || onOpenFile || onExportMd) && (
            <div className="border-t border-[var(--rule)] pt-4 space-y-2">
              <span className="db-cap block">File</span>
              {onNew && <button onClick={() => { onNew(); setMobileMenuOpen(false); }} className="w-full db-btn justify-center text-xs"><Plus size={13} className="mr-1.5" />New Document</button>}
              {onOpenFile && <button onClick={() => { onOpenFile(); setMobileMenuOpen(false); }} className="w-full db-ghost justify-center text-xs"><FolderOpen size={13} className="mr-1.5" />Open File</button>}
              {onExportMd && <button onClick={() => { onExportMd(); setMobileMenuOpen(false); }} className="w-full db-ghost justify-center text-xs"><Download size={13} className="mr-1.5" />Export Markdown</button>}
            </div>
          )}

          <div className="border-t border-[var(--rule)] pt-4 space-y-2">

            {onOpenMetadata && <button onClick={() => { onOpenMetadata(); setMobileMenuOpen(false); }} className="w-full db-ghost justify-center text-xs">Document Settings</button>}
            <button onClick={() => { onOpenSettings(); setMobileMenuOpen(false); }} className="w-full db-ghost justify-center text-xs"><Settings size={13} className="mr-1.5" />App Settings</button>
          </div>

          {extraMobileContent && <div className="border-t border-[var(--rule)] pt-4">{extraMobileContent}</div>}
        </div>
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onChange={next => { setSettings(next); saveSettings(next); applySettings(next); }}
        />
      )}
    </>
  );
}