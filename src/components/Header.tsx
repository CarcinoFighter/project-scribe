'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Search, Settings, User, Menu, X, Columns, LayoutTemplate, Eye, Moon, Sun, Maximize2, ScanLine, Plus, Download, FolderOpen, PanelLeft } from 'lucide-react';
import type { ViewMode, Collaborator } from '@/types';
import { useUser } from '@/lib/useUser';
import AccountMenu from '@/components/AccountMenu';

interface HeaderProps {
  fileName: string; 
  setFileName: (n: string) => void;
  isSaved: boolean; 
  zenMode: boolean;
  onExportMd: () => void; 
  onExportHtml: () => void;
  onOpenSearch: () => void; 
  onOpenSettings: () => void;
  onOpenCmd: () => void; 
  collaborators: Collaborator[];
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
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (o: boolean) => void;
}

export default function Header({
  fileName, setFileName, isSaved, zenMode, 
  onExportMd, onExportHtml, onOpenSearch, onOpenSettings, 
  onOpenCmd, collaborators, isDark, setIsDark, viewMode, setViewMode,
  sidebarOpen, setSidebarOpen, status, focusMode, onNew, onOpenFile,
  onOpenTour, onToggleZen, onToggleFocus, onToggleDark, onOpenMetadata,
  onToast, mobileMenuOpen, setMobileMenuOpen
}: HeaderProps) {
  const router = useRouter();
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
        <div className="flex items-center gap-2 sm:gap-4 h-full min-w-0 flex-1">
          {/* Far Left - Sidebar Toggle */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`db-icon-btn ${sidebarOpen ? 'active' : ''}`}
            style={{ border: '1px solid var(--rule)' }}
            title="Toggle sidebar"
          >
            <PanelLeft size={14} />
          </button>

          <div className="db-vr hidden sm:block" />

          {/* Logo - Clickable, returns to root */}
          <div 
            className="flex items-center gap-2 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push('/')}
          >
            <Image src="/logo.svg" alt="Vantage" width={15} height={18} priority className="flex-shrink-0" />
            <span className="db-cap hidden sm:block" style={{ letterSpacing: '0.22em' }}>
              VANTAGE
            </span>
          </div>

          <div className="db-vr hidden sm:block" />

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="db-inp min-w-0"
              style={{ flex: 1, fontSize: '13px', fontWeight: 500 }}
              spellCheck={false}
            />
            <span className={`db-status flex-shrink-0 hidden xs:block ${isSaved ? 'published' : 'draft'}`} style={{ fontSize: '7px' }}>
              {isSaved ? 'SYNCED' : 'MODIFIED'}
            </span>
            <span 
              className="db-status flex-shrink-0 cursor-pointer hidden sm:block"
              style={{ fontSize: '7px', color: 'var(--accent)', borderColor: 'var(--accent)' }}
              onClick={onOpenMetadata}
            >
              {status.toUpperCase().replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        <div className="flex-1 hidden md:block" />

        <div className="flex items-center gap-1 h-full">
          {/* Desktop Controls - View Modes */}
          <div className="hidden lg:flex items-center gap-0 border border-[var(--rule)] mr-2" id="tour-view-modes">
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

          {/* Desktop Controls - Tools (Outline button removed from here) */}
          <div className="hidden md:flex items-center gap-0 border border-[var(--rule)] mr-2">
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

          <div className="hidden md:flex items-center gap-0 border border-[var(--rule)] mr-2" id="tour-export">
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

          <div className="hidden sm:flex -space-x-1 mr-2 border-r border-[var(--rule)] pr-2 h-6 items-center">
            {collaborators.slice(0, 3).map((c) => (
              <div key={c.id} 
                className="db-avatar"
                style={{ width: '20px', height: '20px', fontSize: '8px', zIndex: 10 }}
                title={c.name}
              >
                {c.avatar_url ? <img src={c.avatar_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.name[0]}
              </div>
            ))}
            {collaborators.length > 3 && (
              <div className="db-avatar" style={{ width: '20px', height: '20px', fontSize: '7px', zIndex: 10 }}>
                +{collaborators.length - 3}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button onClick={onOpenCmd} className="db-icon-btn" title="Command palette (Ctrl+K)">
              <Search size={13} />
            </button>
            <button onClick={onOpenSettings} className="db-icon-btn hidden sm:flex" title="Settings">
              <Settings size={13} />
            </button>
            
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="db-icon-btn md:hidden"
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>

            <div className="db-vr hidden sm:block" style={{ margin: '0 8px' }} />
            <button 
              ref={accountBtnRef}
              onClick={toggleAccountMenu}
              className="db-ghost hidden sm:flex"
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
              <span className="db-cap hidden lg:block" style={{ fontSize: '9px', color: 'var(--ink)' }}>
                {user?.name || ''}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[42px] bg-[var(--paper)] border-b border-[var(--rule)] z-40 p-4 space-y-4 max-h-[calc(100vh-42px)] overflow-y-auto">
          <div className="space-y-2">
            <span className="db-cap block mb-2">View Mode</span>
            <div className="flex gap-2">
              <button onClick={() => { setViewMode('editor'); setMobileMenuOpen(false); }} className={`flex-1 py-2 border ${viewMode === 'editor' ? 'border-[var(--accent)] bg-[var(--accent-sub)]' : 'border-[var(--rule)]'}`}>
                <LayoutTemplate size={16} className="mx-auto" />
              </button>
              <button onClick={() => { setViewMode('split'); setMobileMenuOpen(false); }} className={`flex-1 py-2 border ${viewMode === 'split' ? 'border-[var(--accent)] bg-[var(--accent-sub)]' : 'border-[var(--rule)]'}`}>
                <Columns size={16} className="mx-auto" />
              </button>
              <button onClick={() => { setViewMode('preview'); setMobileMenuOpen(false); }} className={`flex-1 py-2 border ${viewMode === 'preview' ? 'border-[var(--accent)] bg-[var(--accent-sub)]' : 'border-[var(--rule)]'}`}>
                <Eye size={16} className="mx-auto" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { onToggleZen(); setMobileMenuOpen(false); }} className="db-ghost justify-center text-xs">
              <Maximize2 size={14} className="mr-2" /> Zen Mode
            </button>
            <button onClick={() => { onToggleFocus(); setMobileMenuOpen(false); }} className="db-ghost justify-center text-xs">
              <ScanLine size={14} className="mr-2" /> Focus
            </button>
            <button onClick={() => { onToggleDark(); setMobileMenuOpen(false); }} className="db-ghost justify-center text-xs">
              {isDark ? <Sun size={14} className="mr-2" /> : <Moon size={14} className="mr-2" />} Theme
            </button>
            <button onClick={() => { setSidebarOpen(!sidebarOpen); setMobileMenuOpen(false); }} className="db-ghost justify-center text-xs">
              <PanelLeft size={14} className="mr-2" /> Sidebar
            </button>
          </div>

          <div className="border-t border-[var(--rule)] pt-4 space-y-2">
            <span className="db-cap block">File</span>
            <button onClick={() => { onNew(); setMobileMenuOpen(false); }} className="w-full db-btn justify-center text-xs">
              <Plus size={14} className="mr-2" /> New Document
            </button>
            <button onClick={() => { onOpenFile(); setMobileMenuOpen(false); }} className="w-full db-ghost justify-center text-xs">
              <FolderOpen size={14} className="mr-2" /> Open File
            </button>
            <button onClick={() => { onExportMd(); setMobileMenuOpen(false); }} className="w-full db-ghost justify-center text-xs">
              <Download size={14} className="mr-2" /> Export Markdown
            </button>
          </div>

          <div className="border-t border-[var(--rule)] pt-4">
            <button 
              onClick={() => { onOpenMetadata(); setMobileMenuOpen(false); }}
              className="w-full db-ghost justify-center text-xs mb-2"
            >
              Document Settings
            </button>
            <button 
              onClick={() => { onOpenSettings(); setMobileMenuOpen(false); }}
              className="w-full db-ghost justify-center text-xs"
            >
              <Settings size={14} className="mr-2" /> App Settings
            </button>
          </div>
        </div>
      )}

      {showAccountMenu && accountMenuPos && createPortal(
        <div 
          className="db-notif-panel"
          style={{ top: accountMenuPos.top, right: accountMenuPos.right, width: '220px' }}
          onMouseDown={e => e.stopPropagation()}
        >
         <AccountMenu 
  user={user} 
  onClose={() => setShowAccountMenu(false)} 
  onToast={onToast} 
  onOpenSettings={onOpenSettings} 
/>
        </div>,
        document.body
      )}
    </>
  );
}