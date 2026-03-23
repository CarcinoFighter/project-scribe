'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutTemplate, PanelLeft, Columns, Eye,
  Moon, Sun, Plus, FolderOpen, Download, Search,
  Check, Loader2, ChevronDown, ChevronRight,
  Maximize2, Minimize2, HelpCircle, ScanLine,
} from 'lucide-react';
import clsx from 'clsx';
import type { ViewMode } from '@/types';
import { useUser } from '@/lib/useUser';
import AccountMenu from '@/components/AccountMenu';

interface HeaderProps {
  fileName: string; setFileName: (n: string) => void;
  isDark: boolean; setIsDark: (d: boolean) => void;
  viewMode: ViewMode; setViewMode: (m: ViewMode) => void;
  sidebarOpen: boolean; setSidebarOpen: (o: boolean) => void;
  isSaved: boolean; zenMode: boolean; focusMode: boolean;
  onNew: () => void; onOpenFile: () => void;
  onExportMd: () => void; onExportHtml: () => void;
  onOpenSearch: () => void; onOpenTour: () => void; onOpenCmd: () => void;
  onToggleZen: () => void; onToggleFocus: () => void;
  onOpenSettings: () => void; onToggleDark: () => void;
}

const VIEW_MODES = [
  { id: 'editor'  as ViewMode, icon: LayoutTemplate, label: 'Editor'  },
  { id: 'split'   as ViewMode, icon: Columns,        label: 'Split'   },
  { id: 'preview' as ViewMode, icon: Eye,            label: 'Preview' },
];

/* Thin vertical rule */
const SEP = () => (
  <span style={{
    width: 1, height: 14,
    background: 'var(--border-med)',
    flexShrink: 0, display: 'inline-block',
    margin: '0 3px',
    opacity: 0.6,
  }} />
);

/* Icon button base */
const iconBtnStyle = (active = false, accent = false): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
  padding: '5px 7px', borderRadius: 5, border: 'none', cursor: 'pointer',
  background: active
    ? accent ? 'var(--hdr-accent-subtle)' : 'var(--hdr-active-bg)'
    : 'transparent',
  color: active
    ? accent ? 'var(--hdr-accent)' : 'var(--hdr-text)'
    : 'var(--hdr-text-dim)',
  fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
  transition: 'background 0.12s, color 0.12s',
  whiteSpace: 'nowrap',
});

export default function Header(props: HeaderProps) {
  const {
    fileName, setFileName, isDark,
    viewMode, setViewMode, sidebarOpen, setSidebarOpen,
    isSaved, zenMode, focusMode,
    onNew, onOpenFile, onExportMd, onExportHtml,
    onOpenSearch, onOpenTour, onOpenCmd,
    onToggleZen, onToggleFocus, onOpenSettings, onToggleDark,
  } = props;

  const [editingName,     setEditingName]     = useState(false);
  const [nameValue,       setNameValue]       = useState(fileName);
  const [exportOpen,      setExportOpen]      = useState(false);
  const [isFullscreen,    setIsFullscreen]    = useState(false);
  const [exportPos,       setExportPos]       = useState<{ top: number; right: number } | null>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [accountMenuPos,  setAccountMenuPos]  = useState<{ top: number; right: number } | null>(null);
  const { user } = useUser();

  const nameRef       = useRef<HTMLInputElement>(null);
  const exportBtnRef  = useRef<HTMLButtonElement>(null);
  const exportRef     = useRef<HTMLDivElement>(null);
  const accountBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setNameValue(fileName); }, [fileName]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (exportBtnRef.current?.contains(e.target as Node)) return;
      if (exportRef.current?.contains(e.target as Node)) return;
      if (accountBtnRef.current?.contains(e.target as Node)) return;
      setExportOpen(false);
      setShowAccountMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    const sync = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      else await document.exitFullscreen();
    } catch { /* blocked */ }
  }, []);

  const commitName = () => {
    setEditingName(false);
    setFileName(nameValue.trim() || 'Untitled Document');
  };

  return (
    <>
      {/* ── CSS vars injected once ── */}
      <style>{`
        :root {
          --hdr-accent: ${isDark ? '#d4a54b' : '#9a6810'};
          --hdr-accent-subtle: ${isDark ? 'rgba(212,165,75,0.10)' : 'rgba(154,104,16,0.09)'};
          --hdr-active-bg: ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'};
          --hdr-text: ${isDark ? 'rgba(240,235,225,0.82)' : 'rgba(15,12,8,0.80)'};
          --hdr-text-dim: ${isDark ? 'rgba(240,235,225,0.36)' : 'rgba(15,12,8,0.38)'};
          --hdr-bg: ${isDark ? 'rgba(10,9,14,0.94)' : 'rgba(248,246,242,0.96)'};
          --hdr-border: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.09)'};
        }

        /* Toolbar icon button */
        .hdr-btn {
          display: flex; align-items: center; justify-content: center; gap: 5px;
          padding: 5px 7px; border-radius: 5px; border: none; cursor: pointer;
          background: transparent; color: var(--hdr-text-dim);
          font-family: inherit; font-size: 12px; font-weight: 500;
          transition: background 0.11s, color 0.11s;
          white-space: nowrap;
        }
        .hdr-btn:hover { background: var(--hdr-active-bg); color: var(--hdr-text); }
        .hdr-btn.hdr-active { background: var(--hdr-accent-subtle); color: var(--hdr-accent); }
        .hdr-btn.hdr-accent-active {
          background: var(--hdr-accent-subtle); color: var(--hdr-accent);
        }

        /* Filename button */
        .hdr-fname {
          background: none; border: none; cursor: pointer;
          font-family: inherit; font-size: 12.5px; font-weight: 500;
          color: var(--hdr-text); letter-spacing: -0.01em;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          max-width: clamp(70px, 14vw, 190px);
          padding: 3px 2px; border-radius: 4px;
          transition: color 0.12s, background 0.12s;
        }
        .hdr-fname:hover { background: var(--hdr-active-bg); }

        /* View mode pill */
        .hdr-view-pill {
          display: flex; align-items: center; gap: 1px;
          background: ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'};
          border: 1px solid var(--hdr-border);
          border-radius: 7px; padding: 2px;
        }
        .hdr-view-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 4px 9px; border-radius: 5px; border: none; cursor: pointer;
          font-family: inherit; font-size: 11.5px; font-weight: 500;
          transition: background 0.11s, color 0.11s, box-shadow 0.11s;
          white-space: nowrap;
        }
        .hdr-view-btn.hdr-vm-off {
          background: transparent; color: var(--hdr-text-dim);
        }
        .hdr-view-btn.hdr-vm-on {
          background: var(--hdr-accent);
          color: ${isDark ? '#0a0806' : '#fff'};
          box-shadow: 0 1px 8px ${isDark ? 'rgba(212,165,75,0.28)' : 'rgba(154,104,16,0.22)'};
        }

        /* Avatar chip */
        .hdr-avatar {
          display: flex; align-items: center; gap: 7px;
          padding: 3px 4px 3px 3px; border-radius: 20px; border: none; cursor: pointer;
          background: transparent;
          transition: background 0.11s;
        }
        .hdr-avatar:hover { background: var(--hdr-active-bg); }
        .hdr-avatar-img {
          width: 24px; height: 24px; border-radius: 50%;
          border: 1.5px solid ${isDark ? 'rgba(212,165,75,0.28)' : 'rgba(154,104,16,0.25)'};
          overflow: hidden; flex-shrink: 0;
        }
        .hdr-avatar-initials {
          width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, var(--hdr-accent) 0%, ${isDark ? '#a07830' : '#7a5010'} 100%);
          border: 1.5px solid ${isDark ? 'rgba(212,165,75,0.3)' : 'rgba(154,104,16,0.28)'};
          display: flex; align-items: center; justify-content: center;
          color: ${isDark ? '#0a0806' : '#fff'}; font-size: 9px; font-weight: 700;
          letter-spacing: 0.02em;
        }

        /* Breadcrumb brand text */
        .hdr-brand-text {
          font-size: 12px; font-weight: 600; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--hdr-accent);
          text-decoration: none;
        }

        /* Save status */
        .hdr-save-icon {
          display: flex; align-items: center;
          color: ${isSaved ? 'var(--hdr-accent)' : 'var(--hdr-text-dim)'};
          transition: color 0.2s;
        }

        /* Desktop / mobile show-hide */
        @media (max-width: 680px) {
          .hdr-desktop { display: none !important; }
          .hdr-mobile  { display: flex !important; }
        }
        @media (min-width: 681px) {
          .hdr-desktop { display: flex; }
          .hdr-mobile  { display: none !important; }
        }
      `}</style>

      {/* ══════════════════ HEADER BAR ══════════════════ */}
      <header
        id="app-header"
        className="app-header flex-shrink-0 anim-slide-down"
        style={{
          height: 50,
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px 0 10px',
          gap: 0,
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'var(--hdr-bg)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          borderBottom: '1px solid var(--hdr-border)',
          /* Gold accent line at very top */
          boxShadow: `inset 0 1px 0 ${isDark ? 'rgba(212,165,75,0.16)' : 'rgba(154,104,16,0.10)'}, 0 1px 14px rgba(0,0,0,0.07)`,
        }}
      >

        {/* ── LEFT GROUP ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>

          {/* Sidebar toggle */}
          <button
            className={clsx('hdr-btn', !sidebarOpen && 'hdr-active')}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle outline sidebar"
          >
            <PanelLeft size={15} strokeWidth={1.7} />
          </button>

          <SEP />

          {/* Brand / breadcrumb */}
          <Link
            href="/"
            className="hdr-brand-text"
            title="Back to Dashboard"
            style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', flexShrink: 0 }}
          >
            <Image src="/logo.svg" alt="Carcino" width={14} height={18} priority />
            <span className="hidden sm:block" style={{ color: 'var(--hdr-accent)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Vantage
            </span>
          </Link>

          <ChevronRight size={10} strokeWidth={2.5} style={{ color: 'var(--hdr-border)', flexShrink: 0, margin: '0 3px', opacity: 0.7 }} />

          <span className="hidden sm:block" style={{ color: 'var(--hdr-text-dim)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
            Editor
          </span>

          <SEP />

          {/* Filename */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, maxWidth: 'clamp(70px, 14vw, 190px)' }}>
            {editingName ? (
              <input
                ref={nameRef}
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onBlur={commitName}
                onKeyDown={e => {
                  if (e.key === 'Enter')  commitName();
                  if (e.key === 'Escape') { setEditingName(false); setNameValue(fileName); }
                }}
                autoFocus
                style={{
                  fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500,
                  background: 'none', border: 'none', outline: 'none',
                  color: 'var(--text)', borderBottom: '1.5px solid var(--hdr-accent)',
                  paddingBottom: 1, minWidth: 70, maxWidth: 190,
                }}
              />
            ) : (
              <button
                className="hdr-fname"
                onClick={() => { setEditingName(true); setTimeout(() => nameRef.current?.select(), 10); }}
                title="Click to rename"
              >
                {fileName}
              </button>
            )}
            <span className="hdr-save-icon">
              {isSaved
                ? <span className="anim-check-pop" key="saved"><Check size={11} strokeWidth={2.5} /></span>
                : <span key="saving"><Loader2 size={11} strokeWidth={2.5} className="animate-spin" /></span>}
            </span>
          </div>

          <SEP />

          {/* Command search */}
          <button className="hdr-btn editor-cmd-btn" onClick={onOpenCmd} title="Search commands (Ctrl+K)">
            <Search size={14} strokeWidth={1.7} />
          </button>
        </div>

        {/* ── FLEX SPACER ── */}
        <div style={{ flex: 1 }} />

        {/* ── RIGHT GROUP — desktop ── */}
        <div className="hdr-desktop editor-header-desktop" style={{ alignItems: 'center', gap: 2, flexShrink: 0 }}>

          {/* View mode switcher */}
          <div id="tour-view-modes" className="hdr-view-pill">
            {VIEW_MODES.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                title={label}
                className={clsx('hdr-view-btn', viewMode === id ? 'hdr-vm-on' : 'hdr-vm-off')}
              >
                <Icon size={12} strokeWidth={1.8} />
                <span className="hidden lg:inline">{label}</span>
              </button>
            ))}
          </div>

          <SEP />

          {/* Icon actions */}
          <button className="hdr-btn" onClick={onOpenSearch} title="Find & Replace (Ctrl+H)">
            <Search size={13} strokeWidth={1.7} />
          </button>
          <button className="hdr-btn" onClick={onNew} title="New document (Ctrl+N)">
            <Plus size={14} strokeWidth={2} />
          </button>
          <button className="hdr-btn" onClick={onOpenFile} title="Open file">
            <FolderOpen size={13} strokeWidth={1.7} />
          </button>

          {/* Export dropdown */}
          <div id="tour-export" style={{ position: 'relative' }}>
            <button
              ref={exportBtnRef}
              className="hdr-btn"
              onClick={() => {
                const btn = exportBtnRef.current;
                if (btn) {
                  const r = btn.getBoundingClientRect();
                  setExportPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
                }
                setExportOpen(o => !o);
              }}
              title="Export"
              style={{ gap: 3 }}
            >
              <Download size={13} strokeWidth={1.7} />
              <ChevronDown size={9} strokeWidth={2.5} />
            </button>
          </div>

          <SEP />

          <button className={clsx('hdr-btn', focusMode && 'hdr-accent-active')} onClick={onToggleFocus}
            title="Focus mode (Ctrl+Shift+F)">
            <ScanLine size={13} strokeWidth={1.7} />
          </button>
          <button className={clsx('hdr-btn', zenMode && 'hdr-accent-active')} onClick={onToggleZen}
            title="Zen mode (Ctrl+Shift+Z)">
            <Eye size={13} strokeWidth={1.7} />
          </button>
          <button className={clsx('hdr-btn', isFullscreen && 'hdr-active')} onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <Minimize2 size={13} strokeWidth={1.7} /> : <Maximize2 size={13} strokeWidth={1.7} />}
          </button>
          <button className="hdr-btn" onClick={onToggleDark}
            title={isDark ? 'Light mode' : 'Dark mode'}>
            {isDark ? <Sun size={13} strokeWidth={1.7} /> : <Moon size={13} strokeWidth={1.7} />}
          </button>
          <button className="hdr-btn" onClick={onOpenTour} title="Guided tour">
            <HelpCircle size={13} strokeWidth={1.7} />
          </button>

          <SEP />

          {/* Account */}
          <button
            ref={accountBtnRef}
            className="hdr-avatar"
            onClick={() => {
              if (!showAccountMenu && accountBtnRef.current) {
                const r = accountBtnRef.current.getBoundingClientRect();
                setAccountMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
              }
              setShowAccountMenu(v => !v);
            }}
          >
            {user?.avatar_url ? (
              <div className="hdr-avatar-img">
                <Image src={user.avatar_url} alt="Profile" width={24} height={24} />
              </div>
            ) : (
              <div className="hdr-avatar-initials">
                {user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'S'}
              </div>
            )}
          </button>
        </div>

        {/* ── RIGHT GROUP — mobile ── */}
        <div className="hdr-mobile editor-header-mobile" style={{ alignItems: 'center', gap: 2, flexShrink: 0 }}>
          {/* Compact view mode — icons only */}
          <div className="hdr-view-pill">
            {VIEW_MODES.map(({ id, icon: Icon }) => (
              <button key={id} onClick={() => setViewMode(id)} title={id}
                className={clsx('hdr-view-btn', viewMode === id ? 'hdr-vm-on' : 'hdr-vm-off')}
                style={{ padding: '4px 7px' }}>
                <Icon size={13} strokeWidth={1.8} />
              </button>
            ))}
          </div>
          <button className="hdr-btn" onClick={onToggleDark} title={isDark ? 'Light mode' : 'Dark mode'} style={{ padding: '5px 7px' }}>
            {isDark ? <Sun size={14} strokeWidth={1.7} /> : <Moon size={14} strokeWidth={1.7} />}
          </button>
          <button
            ref={accountBtnRef}
            className="hdr-avatar"
            onClick={() => {
              if (!showAccountMenu && accountBtnRef.current) {
                const r = accountBtnRef.current.getBoundingClientRect();
                setAccountMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
              }
              setShowAccountMenu(v => !v);
            }}
          >
            {user?.avatar_url ? (
              <div className="hdr-avatar-img">
                <Image src={user.avatar_url} alt="Profile" width={26} height={26} />
              </div>
            ) : (
              <div className="hdr-avatar-initials" style={{ width: 26, height: 26 }}>
                {user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'S'}
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Account menu portal */}
      {showAccountMenu && accountMenuPos && createPortal(
        <div
          style={{ position: 'fixed', top: accountMenuPos.top, right: accountMenuPos.right, zIndex: 9960 }}
          onMouseDown={e => e.stopPropagation()}
        >
          <AccountMenu user={user} onClose={() => setShowAccountMenu(false)}
            onToast={m => console.log(m)} onOpenSettings={onOpenSettings} />
        </div>,
        document.body
      )}

      {/* Export dropdown portal */}
      {exportOpen && exportPos && createPortal(
        <div
          ref={exportRef}
          className="glass-overlay anim-drop-in"
          style={{
            position: 'fixed', top: exportPos.top, right: exportPos.right,
            minWidth: 164, borderRadius: 8, zIndex: 9950, overflow: 'hidden', padding: 4,
          }}
        >
          {[
            { label: 'Save as .md',   action: () => { onExportMd();   setExportOpen(false); } },
            { label: 'Save as .html', action: () => { onExportHtml(); setExportOpen(false); } },
          ].map((item, i) => (
            <button key={i} onClick={item.action} className="hdr-btn"
              style={{ width: '100%', justifyContent: 'flex-start', padding: '9px 14px', borderRadius: 6, fontSize: 12.5, color: 'var(--hdr-text)' }}>
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
