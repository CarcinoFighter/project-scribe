'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Settings, User, MoreVertical, Columns, LayoutTemplate, Eye, Moon, Sun, Maximize2, ScanLine, Plus, Download, FolderOpen, FileText } from 'lucide-react';
import type { ViewMode, Collaborator } from '@/types';
import { useUser } from '@/lib/useUser';
import AccountMenu from '@/components/AccountMenu';

interface HeaderProps {
  fileName: string; setFileName: (n: string) => void;
  isSaved: boolean; zenMode: boolean;
  onExportMd: () => void; onExportHtml: () => void;
  onOpenSearch: () => void; onOpenSettings: () => void;
  onOpenCmd: () => void; collaborators: Collaborator[];
  isDark: boolean;
  setIsDark: (d: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (o: boolean) => void;
  status: string;
  focusMode: boolean;
  onNew: () => void;
  onOpenFile: () => void;
  onOpenTour: () => void;
  onToggleZen: () => void;
  onToggleFocus: () => void;
  onToggleDark: () => void;
  onOpenMetadata: () => void;
  onToast: (msg: string) => void;
}

export default function Header({
  fileName, setFileName, isSaved, zenMode, 
  onExportMd, onExportHtml, onOpenSearch, onOpenSettings, 
  onOpenCmd, collaborators, isDark, setIsDark, viewMode, setViewMode,
  sidebarOpen, setSidebarOpen, status, focusMode, onNew, onOpenFile,
  onOpenTour, onToggleZen, onToggleFocus, onToggleDark, onOpenMetadata,
  onToast
}: HeaderProps) {
  const { user } = useUser();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [accountMenuPos, setAccountMenuPos] = useState<{ top: number; right: number } | null>(null);
  const accountBtnRef = useRef<HTMLButtonElement>(null);

  const toggleAccountMenu = () => {
    if (accountBtnRef.current) {
      const rect = accountBtnRef.current.getBoundingClientRect();
      setAccountMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
      setShowAccountMenu(!showAccountMenu);
    }
  };

  if (zenMode) return null;

  return (
    <>
      <header className="db-header">
        <div className="flex items-center gap-4 h-full">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Vantage" width={15} height={18} priority />
            <span className="db-cap" style={{ letterSpacing: '0.22em' }}>
              VANTAGE
            </span>
          </div>

          <div className="db-vr" />

          <div className="flex items-center gap-3">
            <input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="db-inp"
              style={{ width: '200px', fontSize: '13px', fontWeight: 500 }}
              spellCheck={false}
            />
            <span className={`db-status ${isSaved ? 'published' : 'draft'}`} style={{ fontSize: '7px' }}>
              {isSaved ? 'SYNCED' : 'MODIFIED'}
            </span>
            <span 
              className="db-status cursor-pointer"
              style={{ fontSize: '7px', color: 'var(--accent)', borderColor: 'var(--accent)' }}
              onClick={onOpenMetadata}
            >
              {status.toUpperCase().replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1 h-full">
          <div id="tour-view-modes" className="flex items-center gap-0 border border-[var(--rule)] mr-3">
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

          <div className="flex items-center gap-0 border border-[var(--rule)] mr-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`db-icon-btn ${sidebarOpen ? 'active' : ''}`}
              style={{ border: 'none', borderRight: '1px solid var(--rule)' }}
              title="Toggle outline"
            >
              <FileText size={13} />
            </button>
            <button 
              onClick={onToggleZen}
              className="db-icon-btn"
              style={{ border: 'none', borderRight: '1px solid var(--rule)' }}
              title="Zen mode (Ctrl+Shift+Z)"
            >
              <Maximize2 size={13} />
            </button>
            <button 
              onClick={onToggleFocus}
              className={`db-icon-btn ${focusMode ? 'active' : ''}`}
              style={{ border: 'none', borderRight: '1px solid var(--rule)' }}
              title="Focus mode (Ctrl+Shift+F)"
            >
              <ScanLine size={13} />
            </button>
            <button 
              onClick={onToggleDark}
              className="db-icon-btn"
              style={{ border: 'none' }}
              title="Toggle theme"
            >
              {isDark ? <Sun size={13} /> : <Moon size={13} />}
            </button>
          </div>

          <div className="flex items-center gap-0 border border-[var(--rule)] mr-3" id="tour-export">
            <button 
              onClick={onNew}
              className="db-icon-btn"
              style={{ border: 'none', borderRight: '1px solid var(--rule)' }}
              title="New document"
            >
              <Plus size={13} />
            </button>
            <button 
              onClick={onOpenFile}
              className="db-icon-btn"
              style={{ border: 'none', borderRight: '1px solid var(--rule)' }}
              title="Open file"
            >
              <FolderOpen size={13} />
            </button>
            <button 
              onClick={onExportMd}
              className="db-icon-btn"
              style={{ border: 'none' }}
              title="Export Markdown"
            >
              <Download size={13} />
            </button>
          </div>

          <div className="flex -space-x-1 mr-3 border-r border-[var(--rule)] pr-3 h-6 items-center">
            {collaborators.map((c) => (
              <div key={c.id} 
                className="db-avatar"
                style={{ width: '20px', height: '20px', fontSize: '8px', zIndex: 10 }}
                title={c.name}
              >
                {c.avatar_url ? <img src={c.avatar_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.name[0]}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button onClick={onOpenCmd} className="db-icon-btn" title="Command palette (Ctrl+K)">
              <Search size={13} />
            </button>
            <button onClick={onOpenSettings} className="db-icon-btn" title="Settings">
              <Settings size={13} />
            </button>
            <div className="db-vr" style={{ margin: '0 8px' }} />
            <button 
              ref={accountBtnRef}
              onClick={toggleAccountMenu}
              className="db-ghost"
              style={{ gap: '6px', padding: '3px 8px 3px 4px' }}
            >
              {user?.avatar_url ? (
                <div className="db-avatar" style={{ width: '20px', height: '20px' }}>
                  <img src={user.avatar_url} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div className="db-avatar" style={{ width: '20px', height: '20px' }}>
                  <User size={12} />
                </div>
              )}
              <span className="hidden md:block db-cap" style={{ fontSize: '9px', color: 'var(--ink)' }}>
                {user?.name || ''}
              </span>
            </button>
          </div>
        </div>
      </header>

      {showAccountMenu && accountMenuPos && createPortal(
        <div 
          className="db-notif-panel"
          style={{ top: accountMenuPos.top, right: accountMenuPos.right, width: '220px' }}
          onMouseDown={e => e.stopPropagation()}
        >
          <AccountMenu user={user} onClose={() => setShowAccountMenu(false)} />
        </div>,
        document.body
      )}
    </>
  );
}