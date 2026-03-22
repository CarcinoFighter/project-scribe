'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import type { ViewMode, EditorAPI, DocumentStats } from '@/types';
import Header from '@/components/Header';
import OutlineSidebar from '@/components/OutlineSidebar';
import Toolbar from '@/components/Toolbar';
import PreviewPane from '@/components/PreviewPane';
import StatusBar from '@/components/StatusBar';
import GuidedTour from '@/components/GuidedTour';
import CommandPalette from '@/components/CommandPalette';
import ConfirmModal from '@/components/ConfirmModal';
import MetadataPanel from '@/components/MetadataPanel';
import { X, Plus, FileText, BookOpen, Heart, Loader2 } from 'lucide-react';

const EditorPane = dynamic(() => import('@/components/EditorPane'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text-4)' }}>
      <span style={{ fontSize: 13 }}>Loading editor...</span>
    </div>
  ),
});

// ---------------------------------------------------------------
// Types
// ---------------------------------------------------------------
interface Tab {
  id: string;
  type: 'blogs' | 'survivor_stories' | 'cancer_docs';
  title: string;
  content: string;
  slug: string;
  status: 'draft' | 'review' | 'published';
  author_id?: string;
  isSaved: boolean;
  isLoading?: boolean;
}

// ---------------------------------------------------------------
// Templates & Defaults
// ---------------------------------------------------------------
const DEFAULT_CONTENT = `# Welcome to Carcino Scribe\n\nA beautiful, distraction-free markdown editor built by The Carcino Foundation.\n`;

function makeTemplates() {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return {
    'tpl-blog': `# Blog Post Title\n\n*Published on ${today}*\n\n## Introduction\n\nWrite a compelling opening paragraph.\n`,
    'tpl-article': `# Article Title\n\n**Abstract:** A brief summary.\n\n## Introduction\n\nContext here.\n`,
    'tpl-notes': `# Meeting Notes\n\n**Date:** ${today}\n\n## Agenda\n\n- [ ] Item one\n`,
  } as Record<string, string>;
}

function computeStats(content: string): DocumentStats {
  const text = content.trim();
  const words       = text ? text.split(/\s+/).length : 0;
  const chars       = content.length;
  const lines       = content.split('\n').length;
  const sentences   = text ? (text.match(/[.!?]+/g) ?? []).length : 0;
  const readingTime = Math.max(1, Math.round(words / 200));
  return { words, chars, lines, sentences, readingTime };
}

// ---------------------------------------------------------------
// TabBar Component
// ---------------------------------------------------------------
function TabBar({ 
  tabs, activeTabId, onSwitch, onClose, onNew 
}: { 
  tabs: Tab[], activeTabId: string, onSwitch: (id: string) => void, onClose: (id: string) => void, onNew: () => void 
}) {
  return (
    <div className="flex items-center gap-px px-2 h-10 border-b border-[var(--border-med)] bg-[var(--bg-alt)] overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const Icon = tab.type === 'blogs' ? BookOpen : tab.type === 'survivor_stories' ? Heart : FileText;
        return (
          <div 
            key={tab.id}
            onClick={() => onSwitch(tab.id)}
            className={`group flex items-center h-8 gap-2 px-3 min-w-[120px] max-w-[200px] rounded-t-[var(--r-md)] border-x border-t transition-all cursor-pointer select-none
              ${isActive 
                ? 'bg-[var(--bg)] border-[var(--border-med)] border-b-[var(--bg)] z-10' 
                : 'bg-transparent border-transparent text-[var(--text-4)] hover:bg-[var(--surface-0)]'
              }`}
            style={isActive ? { marginBottom: -1 } : {}}
          >
            {tab.isLoading ? (
              <Loader2 size={12} className="animate-spin text-[var(--accent)]" />
            ) : (
              <Icon size={12} className={isActive ? 'text-[var(--accent)]' : 'text-[var(--text-4)]'} />
            )}
            <span className={`text-[12px] font-medium truncate flex-1 ${isActive ? 'text-[var(--text)]' : ''}`}>
              {tab.title}
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
              className={`p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-deep)] transition-all ${isActive ? 'opacity-100' : ''}`}
            >
              <X size={10} />
            </button>
          </div>
        );
      })}
      <button 
        onClick={onNew}
        className="p-1.5 ml-1 rounded-md text-[var(--text-4)] hover:bg-[var(--surface-0)] hover:text-[var(--accent)] transition-all"
        title="New Tab"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------
// Main Editor Implementation
// ---------------------------------------------------------------
function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Tab State
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  
  // View State (Shared)
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isDark, setIsDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);
  const [activeLine, setActiveLine] = useState(1);
  const [zenMode, setZenMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [wordGoal, setWordGoal] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const [showCmd, setShowCmd] = useState(false);
  const [splitPct, setSplitPct] = useState(50);
  const [dragging, setDragging] = useState(false);

  const [confirm, setConfirm] = useState<{ title: string; message: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void; } | null>(null);
  const [goalCelebrated, setGoalCelebrated] = useState(false);
  
  const editorRef = useRef<EditorAPI | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const splitRef = useRef<HTMLDivElement>(null);
  const prevGoalHit = useRef(false);

  // Helper: Active Tab
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // ---- Load initial state ----
  useEffect(() => {
    try {
      const savedTabs = localStorage.getItem('cs-tabs');
      const dark = localStorage.getItem('cs-dark') === 'true';
      const goal = localStorage.getItem('cs-goal');
      const toured = localStorage.getItem('cs-toured');

      setIsDark(dark);
      if (goal) setWordGoal(parseInt(goal, 10) || 0);
      if (!toured) setShowTour(true);

      if (savedTabs) {
        const parsed = JSON.parse(savedTabs);
        if (parsed.length > 0) {
          setTabs(parsed);
          setActiveTabId(parsed[0].id);
          return;
        }
      }

      // Default tab if nothing saved
      const defaultTab: Tab = {
        id: 'ls-active',
        type: 'blogs',
        title: 'Untitled Document',
        content: DEFAULT_CONTENT,
        slug: '',
        status: 'draft',
        isSaved: true
      };
      setTabs([defaultTab]);
      setActiveTabId(defaultTab.id);
    } catch (e) {
      console.error('Failed to load tabs:', e);
    }
  }, []);

  // Use a ref for tabs to check for existence in effects without dependency cycles
  const tabsRef = useRef<Tab[]>([]);
  useEffect(() => { tabsRef.current = tabs; }, [tabs]);

  // ---- Handle Search Params ----
  useEffect(() => {
    const id = searchParams.get('id');
    const type = searchParams.get('type') as Tab['type'];

    if (id && type) {
      // Check if already open (using ref to avoid stale state issues)
      const existing = tabsRef.current.find(t => t.id === id);
      if (existing) {
        setActiveTabId(id);
        return;
      }

      // Add new tab
      const newTab: Tab = {
        id, type, 
        title: 'Loading...', 
        content: '', 
        slug: '', 
        status: 'draft', 
        isSaved: true, 
        isLoading: true 
      };
      
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(id);

      // Fetch content
      fetch(`/api/editor/load?id=${id}&type=${type}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setTabs(prev => prev.map(t => t.id === id ? { ...t, ...data.doc, isLoading: false } : t));
          } else {
            setTabs(prev => prev.map(t => t.id === id ? { ...t, title: 'Error loading', isLoading: false } : t));
          }
        })
        .catch(() => {
          setTabs(prev => prev.map(t => t.id === id ? { ...t, title: 'Error loading', isLoading: false } : t));
        });
    }
  }, [searchParams]);

  // ---- Auto-save (debounced) ----
  useEffect(() => {
    if (!activeTab || activeTab.title === 'Error loading') return;
    
    // Mark as unsaved immediately on change
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isSaved: false } : t));

    const t = setTimeout(async () => {
      try {
        // Local persist (filter out error tabs)
        const tabsToSave = tabs.filter(tab => tab.title !== 'Error loading' && !tab.isLoading);
        if (tabsToSave.length > 0) {
          localStorage.setItem('cs-tabs', JSON.stringify(tabsToSave));
        }

        // Cloud sync if named
        if (activeTab.title !== 'Untitled Document' && activeTab.slug && activeTab.title !== 'Error loading') {
          const res = await fetch('/api/editor/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: activeTab.id === 'ls-active' ? null : activeTab.id,
              title: activeTab.title,
              slug: activeTab.slug,
              content: activeTab.content,
              contentType: activeTab.type,
              status: activeTab.status,
              tags: [],
            }),
          });
          
          if (res.ok) {
            const data = await res.json();
            setTabs(prev => prev.map(t => {
              if (t.id === activeTabId) {
                return { ...t, id: data.doc?.id || t.id, isSaved: true };
              }
              return t;
            }));
            if (data.doc?.id && activeTabId === 'ls-active') setActiveTabId(data.doc.id);
          }
        } else {
          setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isSaved: true } : t));
        }
      } catch (e) {}
    }, 1500);
    return () => clearTimeout(t);
  }, [activeTab?.content, activeTab?.title, activeTab?.slug, activeTab?.status]);

  // ---- Title Management ----
  useEffect(() => {
    if (!activeTab) return;
    const unsaved = !activeTab.isSaved;
    const base = `${activeTab.title} — Scribe`;
    document.title = unsaved ? `\u25CF ${base}` : base;
  }, [activeTab?.title, activeTab?.isSaved]);

  // ---- Actions ----
  const handleAddNew = useCallback(() => {
    const id = `new-${Date.now()}`;
    const newTab: Tab = {
      id,
      type: 'blogs',
      title: 'Untitled Document',
      content: '# New Document\n\n',
      slug: '',
      status: 'draft',
      isSaved: true
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(id);
  }, []);

  const handleCloseTab = useCallback((id: string) => {
    setTabs(prev => {
      const next = prev.filter(t => t.id !== id);
      
      // If we closed the last tab, reset to a default one
      if (next.length === 0) {
        const defaultTab: Tab = {
          id: 'ls-active',
          type: 'blogs',
          title: 'Untitled Document',
          content: DEFAULT_CONTENT,
          slug: '',
          status: 'draft',
          isSaved: true
        };
        setActiveTabId(defaultTab.id);
        return [defaultTab];
      }

      if (activeTabId === id) {
        const currentIdx = prev.findIndex(t => t.id === id);
        const nextIdx = Math.max(0, currentIdx - 1);
        setActiveTabId(next[nextIdx].id);
      }
      return next;
    });
  }, [activeTabId]);

  const updateActiveTab = (patch: Partial<Tab>) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, ...patch } : t));
  };

  const handleAutoSlug = useCallback(() => {
    if (!activeTab) return;
    const newSlug = activeTab.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    updateActiveTab({ slug: newSlug });
  }, [activeTab?.title, activeTabId]);

  const handleCommand = useCallback((id: string) => {
    const api = editorRef.current;
    switch (id) {
      case 'bold': api?.wrapSelection('**', '**', 'bold text'); break;
      case 'italic': api?.wrapSelection('*', '*', 'italic text'); break;
      case 'h1': api?.prefixLines('#'); break;
      case 'h2': api?.prefixLines('##'); break;
      case 'ul': api?.prefixLines('-'); break;
      case 'new': handleAddNew(); break;
      case 'zen': setZenMode(z => !z); break;
      case 'focus': setFocusMode(f => !f); break;
      case 'view-editor': setViewMode('editor'); break;
      case 'view-split': setViewMode('split'); break;
      case 'view-preview': setViewMode('preview'); break;
    }
  }, [handleAddNew]);

  // Word stats
  const stats = activeTab ? computeStats(activeTab.content) : computeStats('');

  if (!activeTab) return null;

  return (
    <div className={`h-screen overflow-hidden flex flex-col app-bg ${isDark ? 'dark' : ''} ${zenMode ? 'zen-mode' : ''}`}>
      <Header
        fileName={activeTab.title}
        setFileName={(n) => updateActiveTab({ title: n, slug: n.toLowerCase().replace(/\s+/g, '-') })}
        isDark={isDark}
        setIsDark={setIsDark}
        viewMode={viewMode}
        setViewMode={setViewMode}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isSaved={activeTab.isSaved}
        zenMode={zenMode}
        focusMode={focusMode}
        onNew={handleAddNew}
        onOpenFile={() => {}}
        onExportMd={() => {}}
        onExportHtml={() => {}}
        onOpenSearch={() => editorRef.current?.openSearch()}
        onOpenTour={() => setShowTour(true)}
        onOpenCmd={() => setShowCmd(true)}
        onToggleZen={() => setZenMode(!zenMode)}
        onToggleFocus={() => setFocusMode(!focusMode)}
      />

      <TabBar 
        tabs={tabs} 
        activeTabId={activeTabId} 
        onSwitch={setActiveTabId} 
        onClose={handleCloseTab} 
        onNew={handleAddNew} 
      />

      <div ref={splitRef} className="flex flex-1 overflow-hidden">
        <OutlineSidebar
          content={activeTab.content}
          isOpen={sidebarOpen}
          activeLineNumber={activeLine}
          onHeadingClick={(line) => editorRef.current?.scrollToLine(line)}
        />

        <div className="flex flex-col flex-1 overflow-hidden">
          <Toolbar onAction={handleCommand} focusMode={focusMode} />

          <div className="flex flex-1 overflow-hidden">
            <div style={{ width: viewMode === 'split' ? `${splitPct}%` : (viewMode === 'editor' ? '100%' : '0%'), overflow: 'hidden' }}>
              <EditorPane
                content={activeTab.content}
                onChange={(c) => updateActiveTab({ content: c })}
                isDark={isDark}
                focusMode={focusMode}
                onCursorChange={(l, c) => { setCursorLine(l); setCursorCol(c); setActiveLine(l); }}
                onReady={(api) => { editorRef.current = api; }}
              />
            </div>

            {viewMode === 'split' && (
              <div 
                className={`split-handle ${dragging ? 'dragging' : ''}`} 
                onMouseDown={(e) => {
                  setDragging(true);
                  const move = (m: MouseEvent) => {
                    const rect = splitRef.current?.getBoundingClientRect();
                    if (rect) setSplitPct(Math.min(Math.max((m.clientX - rect.left) / rect.width * 100, 20), 80));
                  };
                  const up = () => { setDragging(false); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
                  window.addEventListener('mousemove', move);
                  window.addEventListener('mouseup', up);
                }}
              />
            )}

            <div style={{ flex: viewMode === 'preview' ? 1 : (viewMode === 'split' ? 1 : 0), overflow: 'hidden' }}>
              <PreviewPane content={activeTab.content} containerRef={previewRef} />
            </div>
          </div>
        </div>

        {/* Metadata Panel */}
        {!zenMode && (
          <MetadataPanel
            title={activeTab.title}
            slug={activeTab.slug}
            setSlug={(s) => updateActiveTab({ slug: s })}
            status={activeTab.status}
            setStatus={(s) => updateActiveTab({ status: s })}
            contentType={activeTab.type}
            author_id={activeTab.author_id}
            setContentType={(t) => updateActiveTab({ type: t })}
            onAutoGenerateSlug={handleAutoSlug}
          />
        )}
      </div>

      <StatusBar
        stats={stats}
        cursorLine={cursorLine}
        cursorCol={cursorCol}
        isSaved={activeTab.isSaved}
        viewMode={viewMode}
        wordGoal={wordGoal}
        goalCelebrated={goalCelebrated}
        onSetWordGoal={setWordGoal}
      />

      {showCmd && <CommandPalette isDark={isDark} onClose={() => setShowCmd(false)} onCommand={handleCommand} />}
      {showTour && <GuidedTour onClose={() => setShowTour(false)} />}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center app-bg"><Loader2 className="animate-spin text-[var(--accent)]" /></div>}>
      <EditorContent />
    </Suspense>
  );
}
