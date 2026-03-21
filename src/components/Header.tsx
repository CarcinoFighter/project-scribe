'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutTemplate,
  PanelLeft,
  Columns,
  Eye,
  Moon,
  Sun,
  Plus,
  FolderOpen,
  Download,
  Search,
  Check,
  Loader2,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  HelpCircle,
  Command,
  ScanLine,
} from 'lucide-react';
import clsx from 'clsx';
import type { ViewMode } from '@/types';

interface HeaderProps {
  fileName: string;
  setFileName: (n: string) => void;
  isDark: boolean;
  setIsDark: (d: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (o: boolean) => void;
  isSaved: boolean;
  zenMode: boolean;
  focusMode: boolean;
  onNew: () => void;
  onOpenFile: () => void;
  onExportMd: () => void;
  onExportHtml: () => void;
  onOpenSearch: () => void;
  onOpenTour: () => void;
  onOpenCmd: () => void;
  onToggleZen: () => void;
  onToggleFocus: () => void;
}

const VIEW_MODES = [
  { id: 'editor'  as ViewMode, icon: LayoutTemplate, label: 'Editor'  },
  { id: 'split'   as ViewMode, icon: Columns,        label: 'Split'   },
  { id: 'preview' as ViewMode, icon: Eye,            label: 'Preview' },
];

export default function Header(props: HeaderProps) {
  const {
    fileName, setFileName, isDark, setIsDark,
    viewMode, setViewMode, sidebarOpen, setSidebarOpen,
    isSaved, zenMode, focusMode,
    onNew, onOpenFile, onExportMd, onExportHtml,
    onOpenSearch, onOpenTour, onOpenCmd, onToggleZen, onToggleFocus,
  } = props;

  const [editingName,  setEditingName]  = useState(false);
  const [nameValue,    setNameValue]    = useState(fileName);
  const [exportOpen,   setExportOpen]   = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exportPos,    setExportPos]    = useState<{ top: number; right: number } | null>(null);

  const nameRef   = useRef<HTMLInputElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const exportBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setNameValue(fileName); }, [fileName]);

  /* Close export dropdown on outside click */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (exportBtnRef.current?.contains(e.target as Node)) return;
      if (exportRef.current?.contains(e.target as Node)) return;
      setExportOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* Sync fullscreen state from the browser */
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
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      } else {
        await document.exitFullscreen();
      }
    } catch {
      /* Fullscreen blocked by browser policy — silently ignore */
    }
  }, []);

  const commitName = () => {
    setEditingName(false);
    setFileName(nameValue.trim() || 'Untitled Document');
  };

  const btnStyle = (active = false): React.CSSProperties => ({
    background: active ? 'var(--accent-subtle2)' : 'transparent',
    color:      active ? 'var(--accent)' : undefined,
  });

  return (
    <>
      <header
        id="app-header"
        className="app-header glass glass-rim flex items-center gap-2 px-3 flex-shrink-0 z-40"
        style={{ height: 52, borderRadius: 0, borderBottom: '1px solid var(--border-med)' }}
      >
      {/* Sidebar toggle */}
      <button
        className="tb-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        title="Toggle outline sidebar"
        style={btnStyle(!sidebarOpen)}
      >
        <PanelLeft size={16} strokeWidth={1.8} />
      </button>

      {/* Logo + breadcrumb */}
      <div className="flex items-center gap-1.5 select-none mr-1">
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
          title="Back to Dashboard"
        >
          <Image src="/logo.svg" alt="Carcino" width={18} height={22} priority />
          <span
            className="hidden sm:block"
            style={{ color: 'var(--text-4)', letterSpacing: '-0.015em', fontSize: 13, fontWeight: 600 }}
          >
            Scribe
          </span>
        </Link>
        <ChevronRight size={11} strokeWidth={2} style={{ color: 'var(--border-strong)', flexShrink: 0 }} />
        <span
          className="hidden sm:block"
          style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600, letterSpacing: '-0.015em' }}
        >
          Editor
        </span>
      </div>

      <div className="toolbar-sep" />

      {/* File name */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 max-w-[280px]">
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
              fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500,
              background: 'none', border: 'none', outline: 'none',
              color: 'var(--text)', borderBottom: '1.5px solid var(--accent)',
              paddingBottom: 1, width: '100%',
            }}
          />
        ) : (
          <button
            onClick={() => { setEditingName(true); setTimeout(() => nameRef.current?.select(), 10); }}
            title="Click to rename"
            style={{
              fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text)', maxWidth: '100%', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {fileName}
          </button>
        )}
        <span style={{
          flexShrink: 0, fontSize: 11, display: 'flex', alignItems: 'center', gap: 3,
          color: isSaved ? 'var(--accent)' : 'var(--text-4)',
        }}>
          {isSaved
            ? <Check   size={11} strokeWidth={2.5} />
            : <Loader2 size={11} strokeWidth={2.5} className="animate-spin" />}
        </span>
      </div>

      <div className="flex-1" />

      {/* View mode switcher */}
      <div
        id="tour-view-modes"
        className="glass-raised flex items-center p-0.5 gap-px"
        style={{ borderRadius: 12 }}
      >
        {VIEW_MODES.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setViewMode(id)}
            title={label}
            className="flex items-center gap-1.5 px-2.5 py-1.5 transition-all"
            style={{
              borderRadius: 10, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
              background: viewMode === id ? 'var(--accent)' : 'transparent',
              color:      viewMode === id ? '#fff' : 'var(--text-3)',
              boxShadow:  viewMode === id ? '0 1px 6px var(--accent-glow)' : 'none',
            }}
          >
            <Icon size={14} strokeWidth={1.8} />
            <span className="hidden md:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="toolbar-sep" />

      {/* Actions */}
      <div className="flex items-center gap-0.5">

        {/* Command palette badge */}
        <button
          className="tb-btn tb-btn-pill"
          onClick={onOpenCmd}
          title="Command palette (Ctrl+K)"
        >
          <Command size={13} strokeWidth={2} />
          <span className="hidden lg:inline" style={{ fontSize: 11.5 }}>Ctrl K</span>
        </button>

        <div className="toolbar-sep" />

        <button className="tb-btn" onClick={onOpenSearch} title="Find & Replace (Ctrl+H)">
          <Search size={15} strokeWidth={1.8} />
        </button>

        <button className="tb-btn" onClick={onNew} title="New document (Ctrl+N)">
          <Plus size={15} strokeWidth={2} />
        </button>

        <button className="tb-btn" onClick={onOpenFile} title="Open file">
          <FolderOpen size={15} strokeWidth={1.8} />
        </button>

        {/* Export dropdown */}
        <div id="tour-export" className="relative">
          <button
            ref={exportBtnRef}
            className="tb-btn"
            onClick={() => {
              const btn = exportBtnRef.current;
              if (btn) {
                const rect = btn.getBoundingClientRect();
                setExportPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
              }
              setExportOpen(o => !o);
            }}
            title="Export"
          >
            <Download   size={15} strokeWidth={1.8} />
            <ChevronDown size={10} strokeWidth={2.5} />
          </button>
        </div>

        <div className="toolbar-sep" />

        {/* Focus mode */}
        <button
          className={clsx('tb-btn', focusMode && 'active')}
          onClick={onToggleFocus}
          title="Focus mode — dims all lines except current (Ctrl+Shift+F)"
          style={btnStyle(focusMode)}
        >
          <ScanLine size={15} strokeWidth={1.8} />
        </button>

        {/* Zen mode */}
        <button
          className={clsx('tb-btn', zenMode && 'active')}
          onClick={onToggleZen}
          title="Zen mode — hides all chrome (Ctrl+Shift+Z)"
          style={btnStyle(zenMode)}
        >
          <Eye size={15} strokeWidth={1.8} />
        </button>

        {/* Fullscreen — real browser fullscreen */}
        <button
          className={clsx('tb-btn', isFullscreen && 'active')}
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit fullscreen (F11)' : 'Enter fullscreen'}
          style={btnStyle(isFullscreen)}
        >
          {isFullscreen
            ? <Minimize2 size={15} strokeWidth={1.8} />
            : <Maximize2 size={15} strokeWidth={1.8} />}
        </button>

        {/* Theme */}
        <button
          className="tb-btn"
          onClick={() => { setIsDark(!isDark); localStorage.setItem('cs-dark', String(!isDark)); }}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
        </button>

        {/* Help / Tour */}
        <button className="tb-btn" onClick={onOpenTour} title="Guided tour">
          <HelpCircle size={15} strokeWidth={1.8} />
        </button>
      </div>
    </header>

    {/* Export dropdown portal */}
    {exportOpen && exportPos && createPortal(
      <div
        ref={exportRef}
        className="glass-overlay fixed fade-in overflow-hidden"
        style={{
          top: exportPos.top,
          right: exportPos.right,
          minWidth: 168,
          borderRadius: 14,
          zIndex: 9950,
        }}
      >
        {[
          { label: 'Save as .md',   action: () => { onExportMd();   setExportOpen(false); } },
          { label: 'Save as .html', action: () => { onExportHtml(); setExportOpen(false); } },
        ].map((item, i) => (
          <button
            key={i}
            onClick={item.action}
            className="w-full text-left px-4 py-3 tb-btn"
            style={{ borderRadius: 0, justifyContent: 'flex-start', width: '100%' }}
          >
            {item.label}
          </button>
        ))}
      </div>,
      document.body
    )}
  </>
);
}
