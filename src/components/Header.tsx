'use client';
import { LucideIcon} from 'lucide-react';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import {
  LayoutTemplate,
  Columns2,
  Eye,
  Moon,
  Sun,
  PanelLeft,
  Plus,
  FolderOpen,
  Download,
  Search,
  Check,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import clsx from 'clsx';
import type { ViewMode } from '@/types';

interface HeaderProps {
  fileName: string;
  setFileName: (name: string) => void;
  isDark: boolean;
  setIsDark: (d: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (o: boolean) => void;
  isSaved: boolean;
  onNew: () => void;
  onOpenFile: () => void;
  onExportMd: () => void;
  onExportHtml: () => void;
  onOpenSearch: () => void;
}

const VIEW_MODES: { id: ViewMode; icon: LucideIcon; label: string }[] = [
  { id: 'editor',  icon: LayoutTemplate, label: 'Editor only' },
  { id: 'split',   icon: Columns2,       label: 'Split view' },
  { id: 'preview', icon: Eye,            label: 'Preview only' },
];

export default function Header({
  fileName, setFileName, isDark, setIsDark,
  viewMode, setViewMode, sidebarOpen, setSidebarOpen,
  isSaved, onNew, onOpenFile, onExportMd, onExportHtml, onOpenSearch,
}: HeaderProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(fileName);
  const [exportOpen, setExportOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setNameValue(fileName); }, [fileName]);

  /* click-outside for export dropdown */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const commitName = () => {
    setEditingName(false);
    setFileName(nameValue.trim() || 'Untitled Document');
  };

  return (
    <header
      className="glass glass-glow flex items-center px-3 gap-2 flex-shrink-0 z-30"
      style={{ height: 52, borderBottom: '1px solid var(--border)', borderRadius: 0 }}
    >
      {/* Sidebar toggle */}
      <button
        className="tb-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        title="Toggle sidebar (outline)"
        aria-label="Toggle sidebar"
      >
        <PanelLeft size={16} strokeWidth={1.8} />
      </button>

      {/* Logo + brand */}
      <div className="flex items-center gap-2 mr-1">
        <Image src="/logo.svg" alt="Carcino Foundation" width={22} height={26} priority />
        <span
          className="font-semibold text-sm tracking-tight hidden sm:inline"
          style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}
        >
          Carcino Scribe
        </span>
      </div>

      {/* Divider */}
      <div className="toolbar-sep" />

      {/* File name */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 max-w-xs">
        {editingName ? (
          <input
            ref={nameRef}
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName();
              if (e.key === 'Escape') { setEditingName(false); setNameValue(fileName); }
            }}
            className="text-sm font-medium bg-transparent border-b outline-none w-full min-w-0"
            style={{
              color: 'var(--text)',
              borderColor: 'var(--accent)',
              paddingBottom: '1px',
              fontFamily: 'inherit',
            }}
            autoFocus
          />
        ) : (
          <button
            onClick={() => { setEditingName(true); setTimeout(() => nameRef.current?.select(), 10); }}
            className="text-sm font-medium truncate max-w-full text-left hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            title="Click to rename"
          >
            {fileName}
          </button>
        )}

        {/* Save status */}
        <span
          className="flex-shrink-0 flex items-center gap-1 text-xs"
          style={{ color: isSaved ? 'var(--accent)' : 'var(--text-muted)' }}
        >
          {isSaved
            ? <Check size={12} strokeWidth={2.5} />
            : <Loader2 size={12} strokeWidth={2.5} className="animate-spin" />
          }
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* View mode switcher */}
      <div
        className="glass-raised flex items-center p-0.5 gap-0.5 rounded-lg"
        style={{ borderRadius: 10 }}
      >
        {VIEW_MODES.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setViewMode(id)}
            title={label}
            aria-label={label}
            className={clsx(
              'flex items-center justify-center rounded-md px-2.5 py-1.5 transition-all duration-150',
              viewMode === id
                ? 'text-white shadow-sm'
                : 'hover:bg-white/10',
            )}
            style={
              viewMode === id
                ? { background: 'var(--accent)', color: '#fff' }
                : { color: 'var(--text-secondary)' }
            }
          >
            <Icon size={15} strokeWidth={1.8} />
          </button>
        ))}
      </div>

      <div className="toolbar-sep" />

      {/* Action buttons */}
      <div className="flex items-center gap-0.5">
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
        <div className="relative" ref={exportRef}>
          <button
            className="tb-btn"
            onClick={() => setExportOpen(!exportOpen)}
            title="Export"
          >
            <Download size={15} strokeWidth={1.8} />
            <ChevronDown size={11} strokeWidth={2} />
          </button>

          {exportOpen && (
            <div
              className="glass glass-glow absolute right-0 top-full mt-1 rounded-xl overflow-hidden fade-in"
              style={{ minWidth: 148, zIndex: 50 }}
            >
              <button
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors"
                style={{ color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => { onExportMd(); setExportOpen(false); }}
              >
                Export as .md
              </button>
              <div style={{ height: 1, background: 'var(--border)', margin: '0 12px' }} />
              <button
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors"
                style={{ color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => { onExportHtml(); setExportOpen(false); }}
              >
                Export as .html
              </button>
            </div>
          )}
        </div>

        <div className="toolbar-sep" />

        {/* Theme toggle */}
        <button
          className="tb-btn"
          onClick={() => {
            setIsDark(!isDark);
            localStorage.setItem('carcino-dark', String(!isDark));
          }}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark
            ? <Sun size={15} strokeWidth={1.8} />
            : <Moon size={15} strokeWidth={1.8} />
          }
        </button>
      </div>
    </header>
  );
}
