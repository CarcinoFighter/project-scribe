'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutTemplate, PanelLeft, Columns, Eye,
  Moon, Sun, Plus, FolderOpen, Download, Search,
  Check, Loader2, ChevronDown, ChevronRight,
  Maximize2, Minimize2, HelpCircle, ScanLine, Save,
} from 'lucide-react';
import clsx from 'clsx';
import type { ViewMode, Collaborator } from '@/types';
import { useUser } from '@/lib/useUser';
import AccountMenu from '@/components/AccountMenu';

interface HeaderProps {
  fileName: string; setFileName: (n: string) => void;
  isDark: boolean; setIsDark: (d: boolean) => void;
  viewMode: ViewMode; setViewMode: (m: ViewMode) => void;
  sidebarOpen: boolean; setSidebarOpen: (o: boolean) => void;
  isSaved: boolean; status: string; zenMode: boolean; focusMode: boolean;
  onNew: () => void; onOpenFile: () => void;
  onExportMd: () => void; onExportHtml: () => void;
  onOpenSearch: () => void; onOpenTour: () => void; onOpenCmd: () => void;
  onToggleZen: () => void; onToggleFocus: () => void;
  onOpenSettings: () => void; onToggleDark: () => void;
  onOpenMetadata: () => void;
  collaborators: Collaborator[];
}

const VIEW_MODES = [
  { id: 'editor'  as ViewMode, icon: LayoutTemplate, label: 'Editor'  },
  { id: 'split'   as ViewMode, icon: Columns,        label: 'Split'   },
  { id: 'preview' as ViewMode, icon: Eye,            label: 'Preview' },
];

const SEP = () => (
  <span style={{ width: 1, height: 16, background: 'var(--border-med)', flexShrink: 0, display: 'inline-block' }} />
);

export default function Header(props: HeaderProps) {
  const {
    fileName, setFileName, isDark,
    viewMode, setViewMode, sidebarOpen, setSidebarOpen,
    isSaved, zenMode, focusMode,
    onNew, onOpenFile, onExportMd, onExportHtml,
    onOpenSearch, onOpenTour, onOpenCmd,
    onToggleZen, onToggleFocus, onOpenSettings, onToggleDark, onOpenMetadata,
    collaborators,
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

  const active = (on: boolean): React.CSSProperties => ({
    background: on ? 'var(--accent-subtle2)' : 'transparent',
    color: on ? 'var(--accent)' : undefined,
  });

  return (
    <>
      {/* ── Header bar ─────────────────────────────────────────────────── */}
      <header
        id="app-header"
        className="app-header flex-shrink-0 anim-slide-down"
        style={{
          height: 52,
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          padding: '0 10px',
          borderRadius: 0,
          borderBottom: '1px solid var(--border-med)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          /* Glass */
          background: 'var(--surface-0)',
          backdropFilter: 'blur(20px) saturate(180%) brightness(1.02)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%) brightness(1.02)',
          /* Rim highlight */
          boxShadow: 'inset 0 -1px 0 var(--border), 0 1px 12px rgba(0,0,0,0.06)',
        }}
      >
        {/* ── LEFT: sidebar toggle + breadcrumb + filename + status ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 1, minWidth: 0, marginRight: 8 }}>
          {/* Sidebar toggle */}
          <button
            className="tb-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle outline sidebar"
            style={active(!sidebarOpen)}
          >
            <PanelLeft size={16} strokeWidth={1.8} />
          </button>

          <SEP />

          {/* Breadcrumb */}
          <Link
            href="/"
            style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', flexShrink: 0 }}
            title="Back to Dashboard"
          >
            <Image src="/logo.svg" alt="Carcino" width={16} height={20} priority />
            <span className="hidden sm:block" style={{ color: 'var(--text-4)', fontSize: 12.5, fontWeight: 600, letterSpacing: '-0.01em' }}>
              Vantage
            </span>
          </Link>

          <ChevronRight size={11} strokeWidth={2.2} style={{ color: 'var(--border-strong)', flexShrink: 0, margin: '0 1px' }} />

          <span className="hidden sm:block" style={{ color: 'var(--text-3)', fontSize: 12.5, fontWeight: 600, letterSpacing: '-0.01em', flexShrink: 0 }}>
            Editor
          </span>

          <SEP />

          {/* Filename */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, maxWidth: 'clamp(80px, 16vw, 200px)' }}>
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
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
                  background: 'none', border: 'none', outline: 'none',
                  color: 'var(--text)', borderBottom: '1.5px solid var(--accent)',
                  paddingBottom: 1, minWidth: 80, maxWidth: 200,
                }}
              />
            ) : (
              <button
                onClick={() => { setEditingName(true); setTimeout(() => nameRef.current?.select(), 10); }}
                title="Click to rename"
                style={{
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text)', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
                  padding: '2px 0',
                }}
              >
                {fileName}
              </button>
            )}
            <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: isSaved ? 'var(--accent)' : 'var(--text-4)', transition: 'color 0.2s' }}>
              {isSaved
                ? <span className="anim-check-pop" key="saved"><Check size={11} strokeWidth={2.5} /></span>
                : <span key="saving"><Loader2 size={11} strokeWidth={2.5} className="animate-spin" /></span>}
            </span>
          </div>
          <SEP />

          {/* Collaborators Avatar Stack */}
          {collaborators.length > 0 && (
            <div className="flex items-center -space-x-2 mr-2">
              {collaborators.map((c) => (
                <div 
                  key={c.id}
                  className="w-6 h-6 rounded-full border-2 border-[var(--surface-0)] overflow-hidden shadow-sm transition-transform hover:-translate-y-0.5"
                  title={c.name}
                >
                  {c.avatar_url ? (
                    <Image src={c.avatar_url} alt={c.name} width={24} height={24} />
                  ) : (
                    <div className="w-full h-full bg-[var(--accent)] flex items-center justify-center text-[8px] font-bold text-white uppercase">
                      {c.name[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Status / Metadata Button (Icon Only) */}
          <button
            className="tb-btn"
            onClick={onOpenMetadata}
            title={`Status: ${status} (Click to change)`}
          >
            <div className="relative">
              <Save size={15} strokeWidth={1.8} style={{ 
                color: status === 'published' ? '#10b981' : status === 'review' ? '#f59e0b' : 'var(--text-3)' 
              }} />
              {status !== 'draft' && (
                <div 
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-[var(--bg)]"
                  style={{ background: status === 'published' ? '#10b981' : '#f59e0b' }}
                />
              )}
            </div>
          </button>
        </div>

        {/* ── Flex spacer ── */}
        <div style={{ flex: 1 }} />

        {/* ── RIGHT: view mode + toolbar (desktop) ── */}
        <div className="editor-header-desktop" style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>

          {/* View mode switcher */}
          <div
            id="tour-view-modes"
            style={{
              display: 'flex', alignItems: 'center', gap: 2,
              background: 'var(--bg-deep)',
              border: '1px solid var(--border)',
              borderRadius: 10, padding: '2px 2px',
            }}
          >
            {VIEW_MODES.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                title={label}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 9px', borderRadius: 8, border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
                  background: viewMode === id ? 'var(--accent)' : 'transparent',
                  color:      viewMode === id ? '#fff' : 'var(--text-3)',
                  boxShadow:  viewMode === id ? '0 1px 6px var(--accent-glow)' : 'none',
                  transition: 'background 0.12s, color 0.12s',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={13} strokeWidth={1.8} />
                <span className="hidden lg:inline">{label}</span>
              </button>
            ))}
          </div>

          <SEP />

          {/* Icon toolbar */}
          <button
            onClick={onOpenCmd}
            className="flex items-center gap-3 px-3 py-1.5 rounded-lg border border-[var(--border-med)] bg-[var(--bg-deep)] hover:bg-[var(--surface-0)] transition-all mr-2 group"
            title="Search commands (Ctrl+K)"
            style={{ minWidth: 140 }}
          >
            <Search size={14} className="text-[var(--text-4)] group-hover:text-[var(--accent)] transition-colors" />
            <span className="text-[12.5px] font-medium text-[var(--text-3)] group-hover:text-[var(--text)] transition-colors flex-1 text-left">Search</span>
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-[var(--border-med)] bg-[var(--bg)] text-[10px] font-bold text-[var(--text-4)] shadow-sm">
              <span style={{ fontSize: 11 }}>⌘</span>
              <span>K</span>
            </div>
          </button>
          <button className="tb-btn" onClick={onOpenSearch} title="Find & Replace (Ctrl+H)">
            <Search size={14} strokeWidth={1.8} />
          </button>
          <button className="tb-btn" onClick={onNew} title="New document (Ctrl+N)">
            <Plus size={15} strokeWidth={2} />
          </button>
          <button className="tb-btn" onClick={onOpenFile} title="Open file">
            <FolderOpen size={14} strokeWidth={1.8} />
          </button>

          {/* Export dropdown */}
          <div id="tour-export" style={{ position: 'relative' }}>
            <button
              ref={exportBtnRef}
              className="tb-btn"
              onClick={() => {
                const btn = exportBtnRef.current;
                if (btn) {
                  const r = btn.getBoundingClientRect();
                  setExportPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
                }
                setExportOpen(o => !o);
              }}
              title="Export"
            >
              <Download size={14} strokeWidth={1.8} />
              <ChevronDown size={10} strokeWidth={2.5} />
            </button>
          </div>

          <SEP />

          <button className={clsx('tb-btn', focusMode && 'active')} onClick={onToggleFocus}
            title="Focus mode (Ctrl+Shift+F)" style={active(focusMode)}>
            <ScanLine size={14} strokeWidth={1.8} />
          </button>
          <button className={clsx('tb-btn', zenMode && 'active')} onClick={onToggleZen}
            title="Zen mode (Ctrl+Shift+Z)" style={active(zenMode)}>
            <Eye size={14} strokeWidth={1.8} />
          </button>
          <button className={clsx('tb-btn', isFullscreen && 'active')} onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} style={active(isFullscreen)}>
            {isFullscreen ? <Minimize2 size={14} strokeWidth={1.8} /> : <Maximize2 size={14} strokeWidth={1.8} />}
          </button>
          <button className="tb-btn" onClick={onToggleDark}
            title={isDark ? 'Light mode' : 'Dark mode'}>
            {isDark ? <Sun size={14} strokeWidth={1.8} /> : <Moon size={14} strokeWidth={1.8} />}
          </button>
          <button className="tb-btn" onClick={onOpenTour} title="Guided tour">
            <HelpCircle size={14} strokeWidth={1.8} />
          </button>

          <SEP />

          {/* Account */}
          <button
            ref={accountBtnRef}
            className="tb-btn"
            onClick={() => {
              if (!showAccountMenu && accountBtnRef.current) {
                const r = accountBtnRef.current.getBoundingClientRect();
                setAccountMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
              }
              setShowAccountMenu(v => !v);
            }}
            style={{ padding: '2px 3px', borderRadius: 99 }}
          >
            {user?.avatar_url ? (
              <div style={{ width: 24, height: 24, borderRadius: '50%', overflow: 'hidden' }}>
                <Image src={user.avatar_url} alt="Profile" width={24} height={24} />
              </div>
            ) : (
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 9.5, fontWeight: 700,
              }}>
                {user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'S'}
              </div>
            )}
          </button>
        </div>

        {/* ── RIGHT: compact mobile toolbar ── */}
        <div className="editor-header-mobile" style={{ alignItems: 'center', gap: 2, flexShrink: 0 }}>
          {/* Search commands */}
          <button className="tb-btn" onClick={onOpenCmd} title="Search commands (Ctrl+K)" style={{ padding:'5px 7px' }}>
            <Search size={15} strokeWidth={1.8} />
          </button>

          {/* Compact view mode switcher — icons only */}
          <div style={{ display:'flex', alignItems:'center', gap:1, background:'var(--bg-deep)', border:'1px solid var(--border)', borderRadius:8, padding:2 }}>
            {VIEW_MODES.map(({ id, icon: Icon }) => (
              <button key={id} onClick={() => setViewMode(id)} title={id}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', width:28, height:24, borderRadius:6, border:'none', cursor:'pointer', background:viewMode===id?'var(--accent)':'transparent', color:viewMode===id?'#fff':'var(--text-3)', transition:'all 0.12s' }}>
                <Icon size={13} strokeWidth={1.8} />
              </button>
            ))}
          </div>

          {/* Export dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              ref={exportBtnRef}
              className="tb-btn"
              onClick={() => {
                const btn = exportBtnRef.current;
                if (btn) {
                  const r = btn.getBoundingClientRect();
                  setExportPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
                }
                setExportOpen(o => !o);
              }}
              title="Export"
              style={{ padding:'5px 7px' }}
            >
              <Download size={14} strokeWidth={1.8} />
            </button>
          </div>

          {/* Account avatar */}
          <button
            ref={accountBtnRef}
            className="tb-btn"
            onClick={() => {
              if (!showAccountMenu && accountBtnRef.current) {
                const r = accountBtnRef.current.getBoundingClientRect();
                setAccountMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
              }
              setShowAccountMenu(v => !v);
            }}
            style={{ padding: '2px 3px', borderRadius: 99 }}
          >
            {user?.avatar_url ? (
              <div style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden' }}>
                <Image src={user.avatar_url} alt="Profile" width={26} height={26} />
              </div>
            ) : (
              <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9.5, fontWeight: 700 }}>
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
          style={{ position: 'fixed', top: exportPos.top, right: exportPos.right, minWidth: 160, borderRadius: 12, zIndex: 9950, overflow: 'hidden', padding: 4 }}
        >
          {[
            { label: 'Save as .md',   action: () => { onExportMd();   setExportOpen(false); } },
            { label: 'Save as .html', action: () => { onExportHtml(); setExportOpen(false); } },
          ].map((item, i) => (
            <button key={i} onClick={item.action} className="tb-btn"
              style={{ width: '100%', justifyContent: 'flex-start', padding: '9px 14px', borderRadius: 8, fontSize: 13 }}>
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
