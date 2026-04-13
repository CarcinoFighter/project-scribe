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
import { X, Plus, FileText, BookOpen, Heart, Loader2, Menu } from 'lucide-react';
import { useUser } from '@/lib/useUser';
import { supabase } from '@/lib/supabase';
import type { Collaborator } from '@/types';
import Toast from '@/components/Toast';
import { convertDocxToMarkdown } from '@/lib/document-utils';
import { diff_match_patch } from 'diff-match-patch';

const dmp = new diff_match_patch();

const EditorPane = dynamic(() => import('@/components/EditorPane'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-[var(--paper)] min-h-[50vh]">
      <div className="flex flex-col items-center gap-4 db-rise-1">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
        <span className="db-cap text-[10px] text-[var(--mid)] tracking-[0.2em]">INITIALIZING COMPOSITION ✦</span>
      </div>
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
  status: 'draft' | 'review' | 'published' | 'ready_for_proofreading' | 'proofreading' | 'ready_for_upload' | 'in_review';
  author_id?: string;
  isSaved: boolean;
  isShared?: boolean;
  isLoading?: boolean;
}

// ---------------------------------------------------------------  
// Templates & Defaults
// ---------------------------------------------------------------
const DEFAULT_CONTENT = `# Welcome to Carcino Vantage\n\nA beautiful, distraction-free markdown editor built by The Carcino Foundation.\n`;

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
// TabBar Component - Responsive
// ---------------------------------------------------------------
function TabBar({ 
  tabs, activeTabId, onSwitch, onClose, onNew 
}: { 
  tabs: Tab[], activeTabId: string, onSwitch: (id: string) => void, onClose: (id: string) => void, onNew: () => void 
}) {
  return (
    <div className="tab-bar flex items-center gap-0 px-2 h-10 border-b border-[var(--rule)] bg-[var(--cream)] overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const Icon = tab.type === 'blogs' ? BookOpen : tab.type === 'survivor_stories' ? Heart : FileText;
        return (
          <div 
            key={tab.id}
            onClick={() => onSwitch(tab.id)}
            className={`group flex items-center h-9 gap-2 px-3 min-w-[100px] sm:min-w-[120px] max-w-[160px] sm:max-w-[200px] border-r border-[var(--rule)] transition-all cursor-pointer select-none flex-shrink-0
              ${isActive 
                ? 'bg-[var(--paper)] border-t-2 border-t-[var(--accent)]' 
                : 'bg-transparent text-[var(--mid)] hover:bg-[var(--accent-sub)]'
              }`}
          >
            {tab.isLoading ? (
              <Loader2 size={12} className="animate-spin text-[var(--accent)] flex-shrink-0" />
            ) : (
              <Icon size={12} className={`flex-shrink-0 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--mid)]'}`} />
            )}
            <span className={`text-[11px] sm:text-[12px] font-medium truncate flex-1 ${isActive ? 'text-[var(--ink)]' : ''}`}>
              {tab.title}
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
              className={`p-1 opacity-0 group-hover:opacity-100 hover:bg-[var(--accent-dim)] transition-all flex-shrink-0 ${isActive ? 'opacity-100' : ''}`}
            >
              <X size={10} />
            </button>
          </div>
        );
      })}
      <button 
        onClick={onNew}
        className="h-9 w-9 flex items-center justify-center border-r border-[var(--rule)] text-[var(--mid)] hover:bg-[var(--accent-sub)] hover:text-[var(--accent)] transition-all flex-shrink-0"
        title="New Tab"
      >
        <Plus size={16} />
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(210);
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);
  const [activeLine, setActiveLine] = useState(1);
  const [zenMode, setZenMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [wordGoal, setWordGoal] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const [showCmd, setShowCmd] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [splitPct, setSplitPct] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [sidebarDragging, setSidebarDragging] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Collaboration State
  const { user, loading: userLoading } = useUser();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const presenceChannelRef = useRef<any>(null);
  const lastBroadcastedContentRef = useRef<string>('');
  const lastSavedContentRef = useRef<string>('');
  const lastSyncVersionRef = useRef<number>(0);
  const docVersionRef = useRef<number>(0);
  const patchQueueRef = useRef<{ version: number, patch: string, senderId: string }[]>([]);

  // Check mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 767px)').matches);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ---- Presence Logic ----
  useEffect(() => {
    if (!user || !activeTabId || activeTabId === 'ls-active' || activeTabId.startsWith('new-')) {
      setCollaborators([]);
      return;
    }

    const channel = supabase.channel(`editor:${activeTabId}`, {
      config: { presence: { key: user.id } }
    });
    presenceChannelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const otherUsers: Collaborator[] = [];
        let maxRemoteVersion = docVersionRef.current;

        for (const key in state) {
          const presences = state[key] as any[];
          presences.forEach(presence => {
            if (presence.id !== user.id) {
              otherUsers.push({
                id: presence.id,
                name: presence.name,
                avatar_url: presence.avatar_url,
                cursor: presence.cursor,
                lastSeen: Date.now()
              });
            }
            if (presence.version > maxRemoteVersion) {
              maxRemoteVersion = presence.version;
            }
          });
        }
        
        // If we joined and others are ahead, catch up our version counter
        if (maxRemoteVersion > docVersionRef.current) {
          docVersionRef.current = maxRemoteVersion;
        }

        setCollaborators(otherUsers);
      })
      .on('broadcast', { event: 'patch-update' }, (payload) => {
        const { tabId, patch, senderId, version } = payload.payload;
        if (senderId !== user.id && tabId === activeTabId) {
          
          const processPatch = (p: string, v: number) => {
            if (editorRef.current) {
              editorRef.current.applyRemotePatch(p);
              const mergedContent = editorRef.current.getValue();
              lastBroadcastedContentRef.current = mergedContent;
              lastSavedContentRef.current = mergedContent;
              lastSyncVersionRef.current++;
              docVersionRef.current = v;
              
              setTabs(prev => prev.map(t => {
                if (t.id !== tabId) return t;
                return { ...t, content: mergedContent, isSaved: true };
              }));
            }
          };

          const isInitialPatch = docVersionRef.current === 0;
          const isNextPatch = version === docVersionRef.current + 1;
          const isFuturePatch = version > docVersionRef.current + 1;

          if (isInitialPatch || isNextPatch) {
            processPatch(patch, version);

            // Check queue for next versions
            while (patchQueueRef.current.length > 0 && patchQueueRef.current[0].version === docVersionRef.current + 1) {
              const next = patchQueueRef.current.shift()!;
              processPatch(next.patch, next.version);
            }
          } else if (isFuturePatch) {
            // Future patch, queue it
            patchQueueRef.current.push({ version, patch, senderId });
            patchQueueRef.current.sort((a, b) => a.version - b.version);
            
            // If the queue gets too long, we've likely missed something permanently. 
            // Jump to the oldest in queue to unblock.
            if (patchQueueRef.current.length > 20) {
               const next = patchQueueRef.current.shift()!;
               processPatch(next.patch, next.version);
            }
          }
          // If version <= docVersionRef.current, we ignore it (unless it was the initial patch)
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: user.id,
            name: user.name,
            avatar_url: user.avatar_url,
            cursor: { line: cursorLine, col: cursorCol },
            version: docVersionRef.current
          });
        }
      });

    return () => {
      channel.unsubscribe();
      presenceChannelRef.current = null;
    };
  }, [activeTabId, user]);

  // Update presence on cursor move
  useEffect(() => {
    if (presenceChannelRef.current && user) {
      presenceChannelRef.current.track({
        id: user.id,
        name: user.name,
        avatar_url: user.avatar_url,
        cursor: { line: cursorLine, col: cursorCol }
      });
    }
  }, [cursorLine, cursorCol, user]);

  // Set default view on mobile + Keyboard resize observer
  const [viewportHeight, setViewportHeight] = useState<string | number>('100dvh');

  useEffect(() => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      setViewMode('editor');
    }

    const handler = () => {
      if (window.visualViewport) setViewportHeight(window.visualViewport.height);
    };
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handler);
      handler();
    }
    return () => window.visualViewport?.removeEventListener('resize', handler);
  }, []);

  const [confirm, setConfirm] = useState<{ title: string; message: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void; } | null>(null);
  const [goalCelebrated, setGoalCelebrated] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const appSettingsRef = useRef<AppSettings>(DEFAULT_SETTINGS);
  useEffect(() => { appSettingsRef.current = appSettings; }, [appSettings]);
  
  const editorRef = useRef<EditorAPI | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const splitRef = useRef<HTMLDivElement>(null);
  const prevGoalHit = useRef(false);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // ---- Load initial state ----
  const initialized = useRef(false);

  useEffect(() => {
    if (!user || userLoading || initialized.current) return;
    initialized.current = true;

    try {
      const meta = user.metadata || {};
      const goal = meta.wordGoal;
      const toured = meta.toured;

      if (goal) setWordGoal(parseInt(goal, 10) || 0);
      if (!toured) setShowTour(true);

      const s = meta.settings || loadSettings();
      setAppSettings(s);
      setIsDark(applySettings(s));

      const id = searchParams.get('id');
      const typeFromUrl = searchParams.get('type') as Tab['type'];

      if (id) {
        // Fetch fresh data for the document
        const effectiveType = typeFromUrl || 'blogs';
        
        const newTab: Tab = {
          id, 
          type: effectiveType,
          title: 'Loading...',
          content: '',
          slug: '',
          status: 'draft',
          isSaved: true,
          isLoading: true
        };
        setTabs([newTab]);
        setActiveTabId(id);

        const typeParam = typeFromUrl ? `&type=${typeFromUrl}` : '';
        fetch(`/api/editor/load?id=${id}${typeParam}`)
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setTabs(prev => prev.map(t => {
                if (t.id === id) {
                  lastBroadcastedContentRef.current = data.doc.content || '';
                  lastSavedContentRef.current = data.doc.content || '';
                  docVersionRef.current = 0; 
                  patchQueueRef.current = [];
                  return { ...t, ...data.doc, isLoading: false };
                }
                return t;
              }));
            } else {
              setTabs(prev => prev.map(t => t.id === id ? { ...t, title: 'Error loading', isLoading: false } : t));
            }
          })
          .catch(() => {
            setTabs(prev => prev.map(t => t.id === id ? { ...t, title: 'Error loading', isLoading: false } : t));
          });
        return;
      }

      // No ID in URL, start with a fresh untitled doc
      const defaultTab: Tab = {
        id: 'new-active',
        type: 'blogs',
        title: 'Untitled Document',
        content: DEFAULT_CONTENT,
        slug: '',
        status: 'draft',
        isSaved: true,
        isShared: false
      };
      setTabs([defaultTab]);
      setActiveTabId(defaultTab.id);

    } catch (e) {
      console.error('Failed to initialize editor:', e);
    }
  }, [user, userLoading, searchParams]);

  const tabsRef = useRef<Tab[]>([]);
  useEffect(() => { tabsRef.current = tabs; }, [tabs]);

  // ---- Handle Search Params (Subsequent changes) ----
  useEffect(() => {
    if (!initialized.current) return;

    const id = searchParams.get('id');
    const type = searchParams.get('type') as Tab['type'];

    if (id && type) {
      setActiveTabId(id);
      
      setTabs(prev => {
        if (prev.find(t => t.id === id)) return prev;

        const newTab: Tab = {
          id, type,
          title: 'Loading...',
          content: '',
          slug: '',
          status: 'draft',
          isSaved: true,
          isLoading: true
        };

        fetch(`/api/editor/load?id=${id}&type=${type}`)
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setTabs(curr => curr.map(t => {
                if (t.id === id) {
                  lastBroadcastedContentRef.current = data.doc.content || '';
                  lastSavedContentRef.current = data.doc.content || '';
                  return { ...t, ...data.doc, isLoading: false };
                }
                return t;
              }));
            } else {
              setTabs(curr => curr.map(t => t.id === id ? { ...t, title: 'Error loading', isLoading: false } : t));
            }
          })
          .catch(() => {
            setTabs(curr => curr.map(t => t.id === id ? { ...t, title: 'Error loading', isLoading: false } : t));
          });

        return [...prev, newTab];
      });
    }
  }, [searchParams]);

  // ---- Auto-save (debounced) ----
  useEffect(() => {
    if (!activeTab || activeTab.title === 'Error loading') return;

    const markUnsaved = setTimeout(() => {
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isSaved: false } : t));
    }, 300);

    const saveInterval = activeTab.isShared ? 300 : 1500;

    const t = setTimeout(async () => {
      try {
        const startVersion = lastSyncVersionRef.current;

        if (activeTab.title !== 'Error loading') {
          const currentContent = activeTab.content || '';
          let body: any = {
            id: activeTab.id.startsWith('new-') ? null : activeTab.id,
            title: activeTab.title,
            slug: activeTab.slug,
            contentType: activeTab.type,
            status: activeTab.status,
            tags: [],
          };

          // For shared docs, send patches instead of full content
          if (activeTab.isShared && lastSavedContentRef.current) {
            const patches = dmp.patch_make(lastSavedContentRef.current, currentContent);
            if (patches.length === 0) {
              setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isSaved: true } : t));
              return;
            }
            body.patch = dmp.patch_toText(patches);
          } else {
            body.content = currentContent;
          }

          const res = await fetch('/api/editor/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (res.ok) {
            const data = await res.json();
            const newId = data.doc?.id;
            
            // Only update refs if no broadcasts happened in the meantime
            if (lastSyncVersionRef.current === startVersion) {
              lastSavedContentRef.current = currentContent;
              lastBroadcastedContentRef.current = currentContent;
            }
            
            setTabs(prev => prev.map(t => {
              if (t.id === activeTabId) {
                return { ...t, id: newId || t.id, isSaved: true };
              }
              return t;
            }));

            if (newId && activeTabId !== newId) {
              setActiveTabId(newId);
            }
          }
        } else {
          setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isSaved: true } : t));
        }
      } catch (e) {}
    }, saveInterval);
    return () => { clearTimeout(markUnsaved); clearTimeout(t); };
  }, [activeTab?.content, activeTab?.title, activeTab?.slug, activeTab?.status, activeTabId]);

  // ---- Content Broadcasting (Realtime) ----
  useEffect(() => {
    if (!activeTab || !presenceChannelRef.current || !user) return;

    const t = setTimeout(() => {
      if (!activeTab || activeTab.title === 'Error loading') return;
      
      const currentContent = activeTab.content || '';
      const patches = dmp.patch_make(lastBroadcastedContentRef.current, currentContent);
      
      if (patches.length > 0) {
        docVersionRef.current++;
        presenceChannelRef.current.send({
          type: 'broadcast',
          event: 'patch-update',
          payload: {
            tabId: activeTabId,
            patch: dmp.patch_toText(patches),
            senderId: user.id,
            version: docVersionRef.current
          }
        });
        // Update presence too so others know we advanced our version
        presenceChannelRef.current.track({
          id: user.id,
          name: user.name,
          avatar_url: user.avatar_url,
          cursor: { line: cursorLine, col: cursorCol },
          version: docVersionRef.current
        });
        lastBroadcastedContentRef.current = currentContent;
      }
    }, 200);

    return () => clearTimeout(t);
  }, [activeTab?.content, activeTabId, user]);

  // ---- Title Management ----
  useEffect(() => {
    if (!activeTab) return;
    const unsaved = !activeTab.isSaved;
    const base = `${activeTab.title} — Vantage`;
    document.title = unsaved ? `\u25CF ${base}` : base;
  }, [activeTab?.title, activeTab?.isSaved]);

  // ---- Sync metadata ----
  const { updateMetadata } = useUser();

  useEffect(() => {
    if (!userLoading && user) {
      const currentMeta = user.metadata || {};
      if (currentMeta.wordGoal !== wordGoal || currentMeta.toured !== !showTour) {
         updateMetadata({ ...currentMeta, wordGoal, toured: !showTour });
      }
    }
  }, [wordGoal, showTour]);

  // Persist app settings to Supabase
  useEffect(() => {
    if (!userLoading && user) {
      const currentMeta = user.metadata || {};
      if (JSON.stringify(currentMeta.settings) !== JSON.stringify(appSettings)) {
        updateMetadata({ ...currentMeta, settings: appSettings });
      }
    }
  }, [appSettings]);

  const handleCommandRef = useRef<(id: string) => void>(() => {});

  // ---- Global keyboard shortcuts ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.shiftKey && e.key === 'Z') { e.preventDefault(); setZenMode(z => !z); }
      if (ctrl && e.shiftKey && e.key === 'F') { e.preventDefault(); setFocusMode(f => !f); }
      if (ctrl && e.shiftKey && e.key === 'D') { e.preventDefault(); handleCommandRef.current('theme'); }
      if (ctrl && String(e.key).toLowerCase() === 's') { e.preventDefault(); setShowMetadata(true); }
      if (e.key === 'Escape' && zenMode)        { e.preventDefault(); setZenMode(false); }
      if (e.key === 'Escape' && mobileMenuOpen) { setMobileMenuOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zenMode, mobileMenuOpen]);

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
    const id = `new-${typeof crypto !== 'undefined' ? crypto.randomUUID().slice(0, 8) : Date.now()}`;
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
    setMobileMenuOpen(false);
  }, []);

  const doCloseTab = useCallback((id: string) => {
    setTabs(prev => {
      const idx = prev.findIndex(t => t.id === id);
      if (idx === -1) return prev;
      
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
        const nextIdx = Math.max(0, idx - 1);
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
      case 'underline': api?.wrapSelection('<u>', '</u>', 'underlined text'); break;
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
        
        // Define map for toggling between light and dark variants
        const themeMap: Record<string, string> = {
          'default-dark': 'default-light',
          'default-light': 'default-dark',
          'catppuccin-mocha': 'catppuccin-latte',
          'catppuccin-latte': 'catppuccin-mocha',
          'solarized-dark': 'solarized-light',
          'solarized-light': 'solarized-dark'
        };

        const nextTheme = themeMap[currentTheme] || 'default-dark';
        const next = { ...appSettingsRef.current, theme: nextTheme };
        
        setAppSettings(next); 
        saveSettings(next); 
        
        // applySettings returns true if the new theme is a dark variant
        const isNowDark = applySettings(next);
        setIsDark(isNowDark); 
        break;
      }
      case 'search': editorRef.current?.openSearch(); break;
      case 'open': {
        const input = document.createElement('input');
        input.type = 'file'; 
        input.accept = '.md,.markdown,.txt,.docx';
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;
          
          const isDocx = file.name.toLowerCase().endsWith('.docx');
          const id = `file-${typeof crypto !== 'undefined' ? crypto.randomUUID().slice(0, 8) : Date.now()}`;
          const title = file.name.replace(/\.[^/.]+$/, '');

          if (isDocx) {
            const reader = new FileReader();
            reader.onload = async (ev) => {
              const arrayBuffer = ev.target?.result as ArrayBuffer;
              try {
                const content = await convertDocxToMarkdown(arrayBuffer);
                setTabs(prev => [...prev, { id, type: 'blogs', title, content, slug: '', status: 'draft', isSaved: true }]);
                setActiveTabId(id);
              } catch (err) {
                alert('Failed to convert Word document.');
              }
            };
            reader.readAsArrayBuffer(file);
          } else {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const content = ev.target?.result as string;
              setTabs(prev => [...prev, { id, type: 'blogs', title, content, slug: '', status: 'draft', isSaved: true }]);
              setActiveTabId(id);
            };
            reader.readAsText(file);
          }
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
      case 'tour': setShowTour(true); break;
      default:
        if (id.startsWith('tpl-')) {
          const templates = makeTemplates();
          if (templates[id]) updateActiveTab({ content: templates[id] });
        }
    }
  }, [handleAddNew, activeTabId, tabs]);

  useEffect(() => { handleCommandRef.current = handleCommand; }, [handleCommand]);

  const stats = activeTab ? computeStats(activeTab.content) : computeStats('');

  if (!activeTab) return null;

  return (
    <div className={`editor-layout ${zenMode ? 'zen-mode' : ''}`} style={{ height: viewportHeight }}>
      <Header
      user={user}
        fileName={activeTab.title}
        setFileName={(n) => updateActiveTab({ title: n, slug: n.toLowerCase().replace(/\s+/g, '-') })}
        isDark={isDark}
        viewMode={viewMode}
        setViewMode={setViewMode}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isSaved={activeTab.isSaved}
        status={activeTab.status}
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
        onToggleTheme={() => handleCommand('theme')}
        onOpenMetadata={() => setShowMetadata(true)}
        onToast={setToastMsg}
        collaborators={collaborators}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="w-full h-px bg-[var(--rule)] flex-shrink-0" />

      <div className={`hidden md:block ${zenMode ? 'hidden' : ''}`}>
        <TabBar 
          tabs={tabs} 
          activeTabId={activeTabId} 
          onSwitch={setActiveTabId} 
          onClose={handleCloseTab} 
          onNew={handleAddNew} 
        />
      </div>

      {/* Mobile Tab Bar - Simplified */}
      <div className="md:hidden border-b border-[var(--rule)] bg-[var(--cream)] overflow-x-auto flex">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`px-3 py-2 text-xs whitespace-nowrap border-r border-[var(--rule)] ${isActive ? 'bg-[var(--paper)] text-[var(--ink)] border-t-2 border-t-[var(--accent)]' : 'text-[var(--mid)]'}`}
            >
              {tab.title.length > 12 ? tab.title.slice(0, 12) + '…' : tab.title}
            </button>
          );
        })}
        <button onClick={() => handleAddNew()} className="px-3 py-2 text-[var(--mid)] border-r border-[var(--rule)]">
          <Plus size={14} />
        </button>
      </div>

<div ref={splitRef} className="editor-body relative">
  {/* Always mounted so the CSS slide-in transition works on mobile */}
  <OutlineSidebar
    content={activeTab.content}
    isOpen={sidebarOpen}
    activeLineNumber={activeLine}
    onHeadingClick={(line) => { editorRef.current?.scrollToLine(line); setSidebarOpen(false); }}
    onClose={() => setSidebarOpen(false)}
    width={isMobile ? 280 : sidebarWidth}
  />

  {sidebarOpen && !isMobile && (
    <div
      className="hidden md:block"
      style={{
        width: 5, 
        flexShrink: 0, 
        cursor: 'col-resize', 
        position: 'relative',
        background: sidebarDragging ? 'var(--accent-dim)' : 'transparent',
        borderRight: `1px solid ${sidebarDragging ? 'var(--accent)' : 'var(--rule)'}`,
        zIndex: 21,
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        setSidebarDragging(true);
        const startX = e.clientX;
        const startW = sidebarWidth;
        const move = (m: MouseEvent) => {
          const rect = splitRef.current?.getBoundingClientRect();
          if (rect) {
            const next = Math.min(Math.max(startW + (m.clientX - startX), 160), 420);
            setSidebarWidth(next);
          }
        };
        const up = () => {
          setSidebarDragging(false);
          window.removeEventListener('mousemove', move);
          window.removeEventListener('mouseup', up);
        };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
      }}
    />
  )}

        <div className="flex flex-col-reverse md:flex-col flex-1 overflow-hidden min-w-0">
          <Toolbar onAction={handleCommand} focusMode={focusMode} viewMode={viewMode} isMobile={isMobile} />

          <div className="flex flex-1 overflow-hidden relative">
            <div 
              className="border-r border-[var(--rule)] min-w-0"
              style={{ 
                width: isMobile 
                  ? (viewMode === 'preview' ? '0%' : '100%') 
                  : (viewMode === 'split' ? `${splitPct}%` : (viewMode === 'editor' ? '100%' : '0%')), 
                overflow: 'hidden',
                display: isMobile && viewMode === 'preview' ? 'none' : 'block'
              }}
            >
              <EditorPane
                content={activeTab.content}
                onChange={(c) => updateActiveTab({ content: c })}
                isDark={isDark}
                focusMode={focusMode}
                collaborators={collaborators}
                onCursorChange={(l, c) => { setCursorLine(l); setCursorCol(c); setActiveLine(l); }}
                onReady={(api) => { editorRef.current = api; }}
              />
            </div>

            {!isMobile && viewMode === 'split' && (
              <div 
                className={`split-handle ${dragging ? 'active' : ''}`}
                style={{ left: `${splitPct}%` }}
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

            <div 
              className="bg-[var(--cream)] prose-editor min-w-0"
              style={{ 
                flex: isMobile 
                  ? (viewMode === 'editor' ? 0 : 1) 
                  : (viewMode === 'preview' ? 1 : (viewMode === 'split' ? 1 : 0)), 
                overflow: 'hidden',
                display: isMobile && viewMode === 'editor' ? 'none' : 'block',
                width: isMobile && viewMode === 'editor' ? '0%' : 'auto'
              }}
            >
              <div className="h-full overflow-y-auto p-4 md:p-8 lg:p-16 max-w-4xl mx-auto">
                <PreviewPane content={activeTab.content} containerRef={previewRef} />
              </div>
            </div>
          </div>
        </div>

        {showMetadata && (
          <div className="db-overlay" onClick={() => setShowMetadata(false)}>
            <div 
              className="db-modal"
              style={{ maxWidth: isMobile ? 'calc(100vw - 32px)' : '400px', margin: isMobile ? '16px' : 'auto' }}
              onClick={e => e.stopPropagation()}
            >
              <MetadataPanel
                id={activeTab.id}
                title={activeTab.title}
                slug={activeTab.slug}
                setSlug={(s) => updateActiveTab({ slug: s })}
                status={activeTab.status}
                setStatus={(s) => updateActiveTab({ status: s })}
                contentType={activeTab.type}
                author_id={activeTab.author_id}
                setContentType={(t) => updateActiveTab({ type: t })}
                onAutoGenerateSlug={handleAutoSlug}
                onClose={() => setShowMetadata(false)}
              />
            </div>
          </div>
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
        isMobile={isMobile}
        onToggleView={() => setViewMode(viewMode === 'editor' ? 'preview' : 'editor')}
      />

      {showCmd && <CommandPalette isDark={isDark} onClose={() => setShowCmd(false)} onCommand={handleCommand} isMobile={isMobile} />}
      {showTour && <GuidedTour onClose={() => setShowTour(false)} isMobile={isMobile} />}
      
      {confirm && (
        <div className="db-overlay">
          <div className="db-modal" style={{ maxWidth: isMobile ? 'calc(100vw - 32px)' : '480px', margin: isMobile ? '16px' : 'auto', borderLeft: '3px solid #b03030' }}>
             <ConfirmModal
              title={confirm.title}
              message={confirm.message}
              confirmLabel={confirm.confirmLabel}
              danger={confirm.danger}
              onConfirm={() => { confirm.onConfirm(); setConfirm(null); }}
              onCancel={() => setConfirm(null)}
            />
          </div>
        </div>
      )}

      {toastMsg && (
        <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />
      )}

      {showSettings && (
        <div className="db-overlay">
          <div className="db-modal" style={{ maxWidth: isMobile ? 'calc(100vw - 32px)' : '600px', margin: isMobile ? '16px' : 'auto', maxHeight: isMobile ? 'calc(100vh - 32px)' : '90vh', overflow: 'auto' }}>
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
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="app-bg flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-[1px] bg-[var(--accent)] animate-pulse" />
          <span className="db-cap text-[8px] tracking-[0.3em]">LOADING VANTAGE</span>
        </div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}