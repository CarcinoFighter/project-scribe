'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import {
  LayoutTemplate, LucideIcon, Columns2, Eye,
  Moon, Sun, PanelLeft, Plus, FolderOpen,
  Download, Search, Check, Loader2, ChevronDown,
  Maximize2, HelpCircle, Command,
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
  onNew: () => void;
  onOpenFile: () => void;
  onExportMd: () => void;
  onExportHtml: () => void;
  onOpenSearch: () => void;
  onOpenTour: () => void;
  onOpenCmd: () => void;
  onToggleZen: () => void;
}

const VIEW_MODES = [
  { id: 'editor'  as ViewMode, icon: LayoutTemplate, label: 'Editor' },
  { id: 'split'   as ViewMode, icon: Columns2,        label: 'Split'  },
  { id: 'preview' as ViewMode, icon: Eye,             label: 'Preview' },
];

export default function Header(props: HeaderProps) {
  const {
    fileName, setFileName, isDark, setIsDark,
    viewMode, setViewMode, sidebarOpen, setSidebarOpen,
    isSaved, zenMode,
    onNew, onOpenFile, onExportMd, onExportHtml,
    onOpenSearch, onOpenTour, onOpenCmd, onToggleZen,
  } = props;

  const [editingName, setEditingName] = useState(false);
  const [nameValue,   setNameValue]   = useState(fileName);
  const [exportOpen,  setExportOpen]  = useState(false);
  const nameRef   = useRef<HTMLInputElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setNameValue(fileName); }, [fileName]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!exportRef.current?.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const commitName = () => {
    setEditingName(false);
    setFileName(nameValue.trim() || 'Untitled Document');
  };

  return (
    <header
      id="app-header"
      className="app-header glass glass-rim flex items-center gap-2 px-3 flex-shrink-0 z-40"
      style={{ height: 52, borderRadius: 0, borderBottom: '1px solid var(--border-med)' }}
    >
      {/* Sidebar toggle */}
      <button
        id="tour-sidebar-toggle"
        className="tb-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        title="Toggle outline sidebar"
      >
        <PanelLeft size={16} strokeWidth={1.8} />
      </button>

      {/* Logo + wordmark */}
      <div className="flex items-center gap-2 select-none mr-1">
        <Image src="/logo.svg" alt="Carcino" width={20} height={24} priority />
        <span className="hidden sm:block font-semibold text-sm" style={{ color: 'var(--text)', letterSpacing: '-0.015em' }}>
          Carcino Scribe
        </span>
      </div>

      <div className="toolbar-sep" />

      {/* File name editor */}
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
            style={{
              fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text)', maxWidth: '100%', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
            title="Click to rename"
          >
            {fileName}
          </button>
        )}
        <span
          style={{
            flexShrink: 0, fontSize: 11,
            color: isSaved ? 'var(--accent)' : 'var(--text-4)',
            display: 'flex', alignItems: 'center', gap: 3,
          }}
        >
          {isSaved
            ? <Check size={11} strokeWidth={2.5} />
            : <Loader2 size={11} strokeWidth={2.5} className="animate-spin" />
          }
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
              borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 12, fontWeight: 500,
              background: viewMode === id ? 'var(--accent)' : 'transparent',
              color: viewMode === id ? '#fff' : 'var(--text-3)',
              boxShadow: viewMode === id ? '0 1px 6px var(--accent-glow)' : 'none',
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
        {/* Command palette */}
        <button
          className="tb-btn flex items-center gap-1.5 tb-btn-pill"
          onClick={onOpenCmd}
          title="Command palette (Ctrl+K)"
          style={{ color: 'var(--text-3)' }}
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
        <div id="tour-export" className="relative" ref={exportRef}>
          <button className="tb-btn" onClick={() => setExportOpen(!exportOpen)} title="Export">
            <Download size={15} strokeWidth={1.8} />
            <ChevronDown size={10} strokeWidth={2.5} />
          </button>
          {exportOpen && (
            <div
              className="glass-overlay absolute right-0 top-full mt-2 fade-in overflow-hidden"
              style={{ minWidth: 168, borderRadius: 14, zIndex: 50 }}
            >
              <button
                className="w-full text-left px-4 py-3 transition-colors"
                onClick={() => { onExportMd();   setExportOpen(false); }}
                style={{ fontFamily: 'inherit', fontSize: 13.5, color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-subtle)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                Save as .md
              </button>
              <div style={{ height: 1, background: 'var(--border)', margin: '0 14px' }} />
              <button
                className="w-full text-left px-4 py-3 transition-colors"
                onClick={() => { onExportHtml(); setExportOpen(false); }}
                style={{ fontFamily: 'inherit', fontSize: 13.5, color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-subtle)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                Save as .html
              </button>
            </div>
          )}
        </div>

        <div className="toolbar-sep" />

        <button
          className={clsx('tb-btn', zenMode && 'active')}
          onClick={onToggleZen}
          title="Zen mode (Ctrl+Shift+Z)"
        >
          <Maximize2 size={14} strokeWidth={1.8} />
        </button>

        <button
          className="tb-btn"
          onClick={() => { setIsDark(!isDark); localStorage.setItem('carcino-dark', String(!isDark)); }}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
        </button>

        <button className="tb-btn" onClick={onOpenTour} title="Help & guided tour">
          <HelpCircle size={15} strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
}
