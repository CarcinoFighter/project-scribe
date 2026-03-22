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
import SettingsModal, { loadSettings, saveSettings, applySettings, DEFAULT_SETTINGS, THEMES } from '@/components/SettingsModal';
import type { AppSettings } from '@/components/SettingsModal';
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
  const [showSettings, setShowSettings] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Keep a ref in sync so handleCommand closures always get the latest settings
  useEffect(() => { appSettingsRef.current = appSettings; }, [appSettings]);
  
  const editorRef = useRef<EditorAPI | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const splitRef = useRef<HTMLDivElement>(null);
  const prevGoalHit = useRef(false);
  const appSettingsRef = useRef<AppSettings>(DEFAULT_SETTINGS);

  // Helper: Active Tab
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // ---- Load initial state ----
  useEffect(() => {
    try {
      const savedTabs = localStorage.getItem('cs-tabs');
      const goal = localStorage.getItem('cs-goal');
      const toured = localStorage.getItem('cs-toured');

      if (goal) setWordGoal(parseInt(goal, 10) || 0);
      if (!toured) setShowTour(true);

      // Load settings, apply theme (manages .dark on <html>), sync isDark state
      const s = loadSettings();
      setAppSettings(s);
      const darkFromTheme = applySettings(s);
      setIsDark(darkFromTheme);

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

    // Mark unsaved after a short delay (avoids flicker on fast typing)
    const markUnsaved = setTimeout(() => {
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isSaved: false } : t));
    }, 300);

    const t = setTimeout(async () => {
      try {
        // Local persist (filter out error tabs)
        const tabsToSave = tabsRef.current.filter(tab => tab.title !== 'Error loading' && !tab.isLoading);
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
    return () => { clearTimeout(markUnsaved); clearTimeout(t); };
  }, [activeTab?.content, activeTab?.title, activeTab?.slug, activeTab?.status, activeTabId]);

  // ---- Title Management ----
  useEffect(() => {
    if (!activeTab) return;
    const unsaved = !activeTab.isSaved;
    const base = `${activeTab.title} — Scribe`;
    document.title = unsaved ? `\u25CF ${base}` : base;
  }, [activeTab?.title, activeTab?.isSaved]);

  // ---- Persist word goal ----
  useEffect(() => {
    localStorage.setItem('cs-goal', String(wordGoal));
  }, [wordGoal]);

  // handleCommandRef lets keyboard handler always call latest version without re-registering
  const handleCommandRef = useRef<(id: string) => void>(() => {});

  // ---- Global keyboard shortcuts ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.shiftKey && e.key === 'Z') { e.preventDefault(); setZenMode(z => !z); }
      if (ctrl && e.shiftKey && e.key === 'F') { e.preventDefault(); setFocusMode(f => !f); }
      if (ctrl && e.shiftKey && e.key === 'D') { e.preventDefault(); handleCommandRef.current('theme'); }
      if (e.key === 'Escape' && zenMode)        { e.preventDefault(); setZenMode(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zenMode]);

  // ---- Word goal celebration ----
  useEffect(() => {
    if (!wordGoal || wordGoal <= 0) return;
    const stats = activeTab ? computeStats(activeTab.content) : computeStats('');
    const hit = stats.words >= wordGoal;
    if (hit && !prevGoalHit.current) {
      setGoalCelebrated(true);
      setTimeout(() => setGoalCelebrated(false), 3000);
    }
    prevGoalHit.current = hit;
  }, [activeTab?.content, wordGoal]);

  // ---- Actions ----
  const handleAddNew = useCallback((type: Tab['type'] = 'blogs') => {
    const id = `new-${Date.now()}`;
    const newTab: Tab = {
      id,
      type,
      title: 'Untitled Document',
      content: '# New Document\n\n',
      slug: '',
      status: 'draft',
      isSaved: true
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(id);
  }, []);

  const doCloseTab = useCallback((id: string) => {
    setTabs(prev => {
      const next = prev.filter(t => t.id !== id);
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

  const handleCloseTab = useCallback((id: string) => {
    const tab = tabsRef.current.find(t => t.id === id);
    if (tab && !tab.isSaved && tab.content.trim() && tab.title !== 'Untitled Document') {
      setConfirm({
        title: 'Close unsaved tab?',
        message: `"${tab.title}" has unsaved changes that will be lost.`,
        confirmLabel: 'Close anyway',
        danger: true,
        onConfirm: () => doCloseTab(id),
      });
      return;
    }
    doCloseTab(id);
  }, [activeTabId, doCloseTab]);

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
      case 'ol': api?.prefixLines('', true); break;
      case 'h3': api?.prefixLines('###'); break;
      case 'strikethrough': api?.wrapSelection('~~', '~~', 'strikethrough text'); break;
      case 'code': api?.wrapSelection('`', '`', 'code'); break;
      case 'codeblock': api?.insertAtCursor('```\n\n```'); break;
      case 'quote': api?.prefixLines('>'); break;
      case 'link': api?.wrapSelection('[', '](url)', 'link text'); break;
      case 'image': api?.insertAtCursor('![alt text](image-url)'); break;
      case 'hr': api?.insertAtCursor('\n---\n'); break;
      case 'table': api?.insertAtCursor('| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Cell | Cell | Cell |\n'); break;
      case 'new': handleAddNew(); break;
      case 'zen': setZenMode(z => !z); break;
      case 'focus': setFocusMode(f => !f); break;
      case 'view-editor': setViewMode('editor'); break;
      case 'view-split': setViewMode('split'); break;
      case 'view-preview': setViewMode('preview'); break;
      case 'theme': {
        const currentTheme = appSettingsRef.current.theme;
        const darkToLight: Record<string, string> = { 'default-dark': 'default-light', 'catppuccin-mocha': 'catppuccin-latte', 'solarized-dark': 'solarized-light' };
        const lightToDark: Record<string, string> = Object.fromEntries(Object.entries(darkToLight).map(([k, v]) => [v, k]));
        const currentIsDark = THEMES[currentTheme]?.dark ?? true;
        const nextTheme = currentIsDark ? (darkToLight[currentTheme] ?? 'default-light') : (lightToDark[currentTheme] ?? 'default-dark');
        const next = { ...appSettingsRef.current, theme: nextTheme };
        setAppSettings(next); saveSettings(next); setIsDark(applySettings(next));
        break;
      }
      case 'search': editorRef.current?.openSearch(); break;
      case 'open': {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.md,.markdown,.txt';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const content = ev.target?.result as string;
            const id = `file-${Date.now()}`;
            setTabs(prev => [...prev, { id, type: 'blogs', title: file.name.replace(/\.[^/.]+$/, ''), content, slug: '', status: 'draft', isSaved: true }]);
            setActiveTabId(id);
          };
          reader.readAsText(file);
        };
        input.click(); break;
      }
      case 'export-md': {
        const tab = tabs.find(t => t.id === activeTabId);
        if (!tab) break;
        const blob = new Blob([tab.content], { type: 'text/markdown' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `${tab.title}.md`; a.click(); URL.revokeObjectURL(a.href); break;
      }
      case 'export-html': {
        const tab = tabs.find(t => t.id === activeTabId);
        if (!tab) break;
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${tab.title}</title></head><body><pre>${tab.content}</pre></body></html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `${tab.title}.html`; a.click(); URL.revokeObjectURL(a.href); break;
      }
      case 'tour': setShowTour(true); break;
      default:
        if (id.startsWith('tpl-')) {
          const templates = makeTemplates();
          if (templates[id]) updateActiveTab({ content: templates[id] });
        }
    }
  }, [handleAddNew, activeTabId, tabs]);

  // Keep handleCommandRef up to date
  useEffect(() => { handleCommandRef.current = handleCommand; }, [handleCommand]);

  // Word stats
  const stats = activeTab ? computeStats(activeTab.content) : computeStats('');

  if (!activeTab) return null;

  return (
    <div className={`h-screen overflow-hidden flex flex-col app-bg ${zenMode ? 'zen-mode' : ''}`}>
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
        onOpenFile={() => handleCommand('open')}
        onExportMd={() => handleCommand('export-md')}
        onExportHtml={() => handleCommand('export-html')}
        onOpenSearch={() => editorRef.current?.openSearch()}
        onOpenTour={() => setShowTour(true)}
        onOpenCmd={() => setShowCmd(true)}
        onToggleZen={() => setZenMode(!zenMode)}
        onToggleFocus={() => setFocusMode(!focusMode)}
        onOpenSettings={() => setShowSettings(true)}
        onToggleDark={() => handleCommand('theme')}
      />

      <div className={`zen-tabbar${zenMode ? ' zen-hidden' : ''}`}>
        <TabBar 
          tabs={tabs} 
          activeTabId={activeTabId} 
          onSwitch={setActiveTabId} 
          onClose={handleCloseTab} 
          onNew={handleAddNew} 
        />
      </div>

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

            <div style={{ flex: viewMode === 'preview' ? 1 : (viewMode === 'split' ? 1 : 0), overflow: 'hidden', borderLeft: viewMode === 'split' ? '1px solid var(--border-med)' : 'none' }}>
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
      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger}
          onConfirm={() => { confirm.onConfirm(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {showSettings && (
        <SettingsModal
          settings={appSettings}
          onClose={() => setShowSettings(false)}
          onChange={(next) => {
            setAppSettings(next);
            saveSettings(next);
            const dark = applySettings(next);
            setIsDark(dark);
          }}
        />
      )}
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
