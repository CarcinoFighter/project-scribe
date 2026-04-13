'use client';

import React, {
  useState, useEffect, useRef, useCallback, useMemo, Suspense
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText, BookOpen, Search, Moon, Sun, Bell, BellOff,
  ChevronRight, Plus, TrendingUp, Clock, BarChart2,
  Star, MoreHorizontal, Trash2,
  ArrowRight, Settings, ExternalLink,
  Activity, ChevronDown, PenTool,
  Home, Edit3, Award,
  Check, ArrowUpDown, Target, Loader2,
  Briefcase, Users, Heart, Calendar, Zap,
  Flame, BookMarked
} from 'lucide-react';
import { useUser } from '@/lib/useUser';
import { useTheme } from '@/lib/useTheme';
import AccountMenu from '@/components/AccountMenu';
import Toast from '@/components/Toast';
import TaskSubmissionModal from '@/components/TaskSubmissionModal';
import SettingsModal, { AppSettings, loadSettings, saveSettings, applySettings, DEFAULT_SETTINGS } from '@/components/SettingsModal';

import DevelopmentDashboard from '@/components/DevelopmentDashboard';
import MarketingDashboard from '@/components/MarketingDashboard';
import DesignLabDashboard from '@/components/DesignLabDashboard';
import LeadershipDashboard from '@/components/LeadershipDashboard';
import WritersDashboard from '@/components/WritersDashboard';
import MobileNav from '@/components/MobileNav';
import { DocCard, EmptyDocState } from '@/components/WritersDashboardComponents';
import { getGreeting, getTodayLabel, fmtWords, getWeekWindow, getTodayStr, countWords, excerptFrom } from '@/lib/utils';
import { Task } from '@/types/task';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Doc {
  id: string;
  type: 'blogs' | 'survivor_stories' | 'cancer_docs';
  title: string;
  excerpt: string;
  words: number;
  status: 'published' | 'review' | 'draft';
  date: string;
  readTime: number;
  tags: string[];
  starred: boolean;
  isActive?: boolean;
}
import { useNotifications } from '@/lib/useNotifications';
import NotifPanel from '@/components/NotifPanel';
interface Cmd   { id: string; label: string; hint?: string; icon: React.ElementType; shortcut?: string; group: string; }
type SortKey      = 'date' | 'words' | 'status';
type FilterStatus = 'all' | 'published' | 'review' | 'draft';

function sortDocs(docs: Doc[], by: SortKey) {
  return [...docs].sort((a, b) => {
    if (by === 'date')   return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (by === 'words')  return b.words - a.words;
    if (by === 'status') return a.status.localeCompare(b.status);
    return 0;
  });
}
function filterDocs(docs: Doc[], s: FilterStatus) { return s === 'all' ? docs : docs.filter(d => d.status === s); }


function buildCmds(): Cmd[] {
  return [
    { id: 'new-doc',     label: 'New Document',    hint: 'Open editor',       icon: Plus,     shortcut: 'Ctrl+N', group: 'Create'      },
    { id: 'open-editor', label: 'Open Editor',      hint: 'Go to /editor',     icon: Edit3,                        group: 'Navigate'    },
    { id: 'go-articles', label: 'View Articles',    hint: 'Show articles',     icon: FileText,                     group: 'Navigate'    },
    { id: 'go-blogs',    label: 'View Blog Posts',  hint: 'Show blogs',        icon: BookOpen,                     group: 'Navigate'    },
    { id: 'go-overview', label: 'Overview',          hint: 'Dashboard home',    icon: Home,                         group: 'Navigate'    },
    { id: 'theme',       label: 'Toggle Theme',     hint: 'Dark / Light',      icon: Moon,     shortcut: 'Ctrl+T', group: 'Preferences' },
    { id: 'settings',    label: 'Account Settings', hint: 'Profile & billing', icon: Settings,                     group: 'Preferences' },
  ];
}

const TAPE_ITEMS = ['WRITERS', 'DESIGN', 'DEV', 'PR', 'LEADERSHIP', 'VANTAGE', '2026', '✦'];

// ─── Styles ───────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────


// ── Command palette ────────────────────────────────────────────────────────────
interface CtxPos { x: number; y: number; docId: string }

function CommandPalette({ docs, onClose, onCommand }: { docs: Doc[]; onClose: () => void; onCommand: (id: string) => void; }) {
  const [query,    setQuery]    = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const router   = useRouter();

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);
  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setSelected(0); }, [query]);

  const cmds      = useMemo(() => buildCmds(), []);
  const q         = query.trim().toLowerCase();
  const matchDocs = useMemo(() => q ? docs.filter(d => d.title.toLowerCase().includes(q)) : [], [docs, q]);
  const matchCmds = useMemo(() => cmds.filter(c => !q || c.label.toLowerCase().includes(q) || (c.hint ?? '').toLowerCase().includes(q)), [cmds, q]);
  const groups    = useMemo(() => matchCmds.reduce<Record<string, Cmd[]>>((acc, cmd) => { (acc[cmd.group] ??= []).push(cmd); return acc; }, {}), [matchCmds]);

  type FI = { kind: 'doc'; doc: Doc; idx: number } | { kind: 'cmd'; cmd: Cmd; idx: number };
  const flat = useMemo<FI[]>(() => {
    let i = 0;
    return [...matchDocs.map(doc => ({ kind: 'doc' as const, doc, idx: i++ })), ...Object.values(groups).flat().map(cmd => ({ kind: 'cmd' as const, cmd, idx: i++ }))];
  }, [matchDocs, groups]);

  const run = useCallback((id: string) => { onCommand(id); onClose(); }, [onCommand, onClose]);

  useEffect(() => {
    const kh = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, flat.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter') {
        e.preventDefault();
        const item = flat[selected]; if (!item) return;
        if (item.kind === 'doc') { router.push('/editor'); onClose(); } else run(item.cmd.id);
      }
    };
    const mh = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) onClose(); };
    window.addEventListener('keydown', kh); document.addEventListener('mousedown', mh);
    return () => { window.removeEventListener('keydown', kh); document.removeEventListener('mousedown', mh); };
  }, [flat, selected, run, onClose, router]);

  useEffect(() => { listRef.current?.querySelector(`[data-idx="${selected}"]`)?.scrollIntoView({ block: 'nearest' }); }, [selected]);

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,12,16,0.6)', zIndex: 9989 }} />
      <div ref={wrapRef} className="db-cmd-wrap db-rise-0">
        {/* Search input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderBottom: '1px solid var(--rule)', height: 44 }}>
          <Search size={13} strokeWidth={1.8} style={{ color: 'var(--mid)', flexShrink: 0 }} />
          <input
            ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search documents and commands…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--ff-ui)', fontSize: 12, color: 'var(--ink)', letterSpacing: '0.03em' }}
          />
          <span className="db-kbd" onClick={onClose}>Esc</span>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: 340, overflowY: 'auto' }}>
          {flat.length === 0 ? (
            <div style={{ padding: '22px 16px', textAlign: 'center', fontFamily: 'var(--ff-ui)', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid)' }}>
              No results for &quot;{query}&quot;
            </div>
          ) : (
            <>
              {matchDocs.length > 0 && (
                <section>
                  <div className="db-cap" style={{ padding: '7px 16px 3px', borderBottom: '1px solid var(--rule)' }}>Documents</div>
                  {matchDocs.map(doc => {
                    const entry = flat.find(f => f.kind === 'doc' && f.doc.id === doc.id)!;
                    const Icon = doc.type === 'blogs' ? BookOpen : FileText;
                    return (
                      <button key={doc.id} data-idx={entry.idx} className={`db-cmd-item${entry.idx === selected ? ' sel' : ''}`}
                        onMouseEnter={() => setSelected(entry.idx)} onClick={() => { router.push('/editor'); onClose(); }}>
                        <Icon size={12} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>{doc.title}</span>
                        {doc.isActive && <span style={{ fontSize: 8, background: 'var(--accent)', color: 'var(--paper)', padding: '1px 5px', fontWeight: 700, letterSpacing: '0.1em' }}>ACTIVE</span>}
                      </button>
                    );
                  })}
                </section>
              )}
              {Object.entries(groups).map(([group, groupCmds]) => (
                <section key={group}>
                  <div className="db-cap" style={{ padding: '7px 16px 3px', borderBottom: '1px solid var(--rule)' }}>{group}</div>
                  {groupCmds.map(cmd => {
                    const entry = flat.find(f => f.kind === 'cmd' && f.cmd.id === cmd.id)!;
                    const Icon = cmd.icon;
                    return (
                      <button key={cmd.id} data-idx={entry.idx} className={`db-cmd-item${entry.idx === selected ? ' sel' : ''}`}
                        onMouseEnter={() => setSelected(entry.idx)} onClick={() => run(cmd.id)}>
                        <Icon size={12} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>{cmd.label}</span>
                        {cmd.hint && <span className="db-cap" style={{ textTransform: 'none', fontSize: 9 }}>{cmd.hint}</span>}
                        {cmd.shortcut && <span className="db-kbd">{cmd.shortcut}</span>}
                      </button>
                    );
                  })}
                </section>
              ))}
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

// ── Doc context menu ──────────────────────────────────────────────────────────
function DocContextMenu({ pos, docs, onStar, onDelete, onOpen, onClose }: { pos: CtxPos; docs: Doc[]; onStar: (id: string) => void; onDelete: (id: string) => void; onOpen: () => void; onClose: () => void; }) {
  const doc = docs.find(d => d.id === pos.docId);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, [onClose]);
  if (!doc) return null;
  const left = Math.min(pos.x, window.innerWidth - 190);
  const top  = Math.min(pos.y, window.innerHeight - 140);
  return createPortal(
    <div ref={ref} className="db-ctx-menu db-rise-0" style={{ position: 'fixed', left, top, zIndex: 9980 }}>
      {[
        { icon: ExternalLink, label: 'Open in Editor', action: () => { onOpen(); onClose(); }, danger: false, accent: false },
        { icon: Star,         label: doc.starred ? 'Remove star' : 'Add star', action: () => { onStar(doc.id); onClose(); }, danger: false, accent: doc.starred },
        { icon: Trash2,       label: 'Delete',          action: () => { onDelete(doc.id); onClose(); }, danger: true, accent: false },
      ].map(item => (
        <button key={item.label} className={`db-ctx-item${item.danger ? ' danger' : ''}`}
          style={item.accent ? { color: 'var(--accent)' } : undefined}
          onClick={item.action}>
          <item.icon size={11} strokeWidth={1.8} />
          {item.label}
        </button>
      ))}
    </div>,
    document.body
  );
}

// ── Sort/filter bar ───────────────────────────────────────────────────────────
function SortFilterBar({ sortBy, setSortBy, filter, setFilter, total }: { sortBy: SortKey; setSortBy: (k: SortKey) => void; filter: FilterStatus; setFilter: (f: FilterStatus) => void; total: number; }) {
  return (
    <div className="db-filter-bar">
      {(['all', 'published', 'review', 'draft'] as FilterStatus[]).map(f => (
        <button key={f} className={`db-filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
          {f === 'all' ? `All (${total})` : f}
        </button>
      ))}
      <div className="db-filter-spacer" />
      <span className="db-filter-label">Sort</span>
      {(['date', 'words', 'status'] as SortKey[]).map(k => (
        <button key={k} className={`db-filter-btn${sortBy === k ? ' active' : ''}`} onClick={() => setSortBy(k)}>{k}</button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: userLoading, updateMetadata } = useUser();

  const [docs,             setDocs]             = useState<Doc[]>([]);
  const [lsDoc,            setLsDoc]            = useState<Doc | null>(null);
  const { isDark, toggleTheme }                 = useTheme();
  const [showSettings,     setShowSettings]     = useState(false);
  const [appSettings,      setAppSettings]      = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeNav,        setActiveNav]        = useState<'home' | 'articles' | 'blogs'>('home');
  const [showCmd,          setShowCmd]          = useState(false);
  const {
    notifications: notifs,
    unreadCount,
    markAllRead: handleMarkAllRead,
  } = useNotifications();
  const [toast,            setToast]            = useState<string | null>(null);
  const [sortBy,           setSortBy]           = useState<SortKey>('date');
  const [filter,           setFilter]           = useState<FilterStatus>('all');
  const [ctxMenu,          setCtxMenu]          = useState<CtxPos | null>(null);
  const [showNotifPanel,   setShowNotifPanel]   = useState(false);
  const [showAccountMenu,  setShowAccountMenu]  = useState(false);
  const [accountMenuPos,   setAccountMenuPos]   = useState<{ top: number; right: number } | null>(null);
  const [wordGoal,         setWordGoal]         = useState(0);
  const [tasks,            setTasks]            = useState<Task[]>([]);
  const [selectedDept,     setSelectedDept]     = useState<string | null>(null);
  const [submittingTask,   setSubmittingTask]   = useState<{ id: string; title: string } | null>(null);
  const [docsLoading,      setDocsLoading]      = useState(true);
  const [tasksLoading,     setTasksLoading]     = useState(true);
  const [activeDeptKey,    setActiveDeptKey]    = useState<string | null>(null);

  const notifRef       = useRef<HTMLDivElement>(null);
  const accountBtnRef  = useRef<HTMLButtonElement>(null);
  const accountRef     = useRef<HTMLDivElement>(null);
  const appSettingsRef = useRef<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => { appSettingsRef.current = appSettings; }, [appSettings]);
  useEffect(() => { if (!userLoading && !user) router.push('/login'); }, [user, userLoading, router]);

  useEffect(() => {
    if (!user || userLoading) return;
    try {
      const meta = user.metadata || {};
      const goal = meta.wordGoal;
      if (goal) setWordGoal(parseInt(goal, 10) || 0);

      const s = meta.settings || loadSettings();
      setAppSettings(s);
      applySettings(s);
    } catch {}
  }, [user, userLoading]);

  useEffect(() => {
    if (user && !activeDeptKey) setActiveDeptKey(user.department || "Writers' Block");
  }, [user, activeDeptKey]);

  useEffect(() => { (async () => { try { const r = await fetch('/api/documents'); if (r.ok) { const d = await r.json(); setDocs(d.documents); } } catch {} finally { setDocsLoading(false); } })(); }, []);
  useEffect(() => { (async () => { try { const r = await fetch('/api/tasks'); if (r.ok) { const d = await r.json(); setTasks(d.assignments || []); } } catch {} finally { setTasksLoading(false); } })(); }, []);

  useEffect(() => {
    const nav = searchParams.get('nav');
    if (nav === 'articles' || nav === 'blogs' || nav === 'home') {
      setActiveNav(nav as 'articles' | 'blogs' | 'home');
    }
  }, [searchParams]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 'k') { e.preventDefault(); setShowCmd(c => !c); }
      if (e.key === 'Escape') { setShowCmd(false); setCtxMenu(null); setShowNotifPanel(false); setShowAccountMenu(false); }
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!notifRef.current?.contains(e.target as Node)) setShowNotifPanel(false);
      if (!accountBtnRef.current?.contains(e.target as Node)) setShowAccountMenu(false);
    };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);

  const showToastMsg = useCallback((msg: string) => setToast(msg), []);

  const toggleStar = useCallback((id: string) => {
    setDocs(ds => ds.map(d => d.id === id ? { ...d, starred: !d.starred } : d));
    const doc = docs.find(d => d.id === id); setToast(doc?.starred ? 'Removed from starred' : 'Added to starred');
  }, [docs]);

  const deleteDoc = useCallback(async (id: string) => {
    const doc = docs.find(d => d.id === id); if (!doc) return;
    setDocs(ds => ds.filter(d => d.id !== id)); try { await fetch(`/api/documents?id=${id}&type=${doc.type}`, { method: 'DELETE' }); } catch {}
    setToast(`Deleted "${doc.title.slice(0, 28)}…"`);
  }, [docs]);

  const handleCompleteTask = useCallback(async (taskId: string) => {
    try {
      const r = await fetch('/api/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: taskId, status: 'done' }) });
      if (r.ok) { setTasks(ts => ts.map(t => t.id === taskId ? { ...t, status: 'done' } : t)); setToast('Task completed ✓'); }
      else setToast('Failed to update task');
    } catch { setToast('Error updating task'); }
  }, []);

  const handleTaskCardComplete = useCallback(async (taskId: string) => {
    const t = tasks.find(x => x.id === taskId); if (!t) return;
    if (t.category === 'task') setSubmittingTask({ id: t.id, title: t.title });
    else await handleCompleteTask(taskId);
  }, [tasks, handleCompleteTask]);

  const handleCommand = useCallback((id: string) => {
    if (id === 'theme') toggleTheme();
    else if (id === 'new-doc' || id === 'open-editor') router.push('/editor');
    else if (id === 'go-articles') setActiveNav('articles');
    else if (id === 'go-blogs') setActiveNav('blogs');
    else if (id === 'go-overview') setActiveNav('home');
    else if (id === 'settings') setShowSettings(true);
  }, [toggleTheme, router]);

  const allDocs        = docs;
  const articles       = useMemo(() => allDocs.filter(d => d.type === 'cancer_docs' || d.type === 'survivor_stories'), [allDocs]);
  const blogs          = useMemo(() => allDocs.filter(d => d.type === 'blogs'), [allDocs]);
  const totalWords     = useMemo(() => docs.reduce((s, d) => s + d.words, 0), [docs]);
  const published      = useMemo(() => docs.filter(d => d.status === 'published').length, [docs]);
  const drafts         = useMemo(() => docs.filter(d => d.status === 'draft').length, [docs]);
  const starredDocs    = useMemo(() => allDocs.filter(d => d.starred), [allDocs]);
  const weekWindow     = useMemo(() => getWeekWindow().map((w) => w.date), []);
  const weekWords      = useMemo(() => docs.filter(d => weekWindow.includes(d.date)).reduce((s, d) => s + d.words, 0), [docs, weekWindow]);
  const goalProgress   = wordGoal > 0 && docs.length > 0 ? { current: docs[0].words, goal: wordGoal } : null;
  const sortedArticles = useMemo(() => filterDocs(sortDocs(articles, sortBy), filter), [articles, sortBy, filter]);
  const sortedBlogs    = useMemo(() => filterDocs(sortDocs(blogs, sortBy), filter), [blogs, sortBy, filter]);
  const pendingTasks   = useMemo(() => tasks.filter(t => t.status !== 'done'), [tasks]);
  const doneTasks      = useMemo(() => tasks.filter(t => t.status === 'done'), [tasks]);

  const handleContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setCtxMenu({ docId: id, x: rect.left, y: rect.bottom + 4 });
  }, []);

  const isWritersBlock = activeDeptKey === "Writers' Block" || !activeDeptKey;
  const isFullSidebar  = isWritersBlock || activeDeptKey === 'Leadership';

  // Nav list shared by sidebar + mobile
  const NAV_ITEMS = ([
    { id: 'home',     label: 'Overview',    icon: Home,      count: null,                       href: null     },
    { id: 'articles', label: 'Articles',    icon: FileText,  count: articles.length,             href: null     },
    { id: 'blogs',    label: 'Blog Posts',  icon: BookOpen,  count: blogs.length,                href: null     },
    { id: 'tasks',    label: 'Assignments', icon: Briefcase, count: pendingTasks.length || null,  href: '/tasks' },
    { id: 'team',     label: 'Team',        icon: Users,     count: null,                       href: '/team'  },
  ] as const).filter(item => isFullSidebar || (item.id !== 'articles' && item.id !== 'blogs'));

  return (
    <div className={`db-root${isDark ? ' dark' : ''}`}>
     

      {/* ══ HEADER — newspaper masthead ══════════════════════════════════════ */}
      <header className="db-header">

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 0, flexShrink: 0, userSelect: 'none' }}>
          <Image src="/logo.svg" alt="Carcino" width={15} height={18} style={{ height: 'auto' }} priority />
          <span style={{ fontFamily: 'var(--ff-display)', fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--ink)' }}>
            <span className="hidden sm:inline">Carcino</span> Vantage
          </span>
        </div>

        <div className="db-vr" />

        {/* Search */}
        <button className="db-search" onClick={() => setShowCmd(true)} title="Search (Ctrl+K)">
          <Search size={11} strokeWidth={1.8} />
          <span>Search or command…</span>
          <span className="db-kbd hidden md:inline-block">⌘K</span>
        </button>

        <div style={{ flex: 1 }} />

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>

          {/* Bell */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button className={`db-icon-btn${showNotifPanel ? ' active' : ''}`}
              onClick={() => { setShowNotifPanel(o => !o); setShowAccountMenu(false); }}
              title="Notifications">
              <Bell size={13} strokeWidth={1.8} />
              {unreadCount > 0 && <span className="db-badge" style={{ animation: 'db-blink 2.2s step-start infinite' }} />}
            </button>
            {showNotifPanel && (
              <NotifPanel
                notifs={notifs}
                onMarkAllRead={handleMarkAllRead}
                onClose={() => setShowNotifPanel(false)}
              />
            )}
          </div>

          {/* Theme toggle */}
          <button className="db-icon-btn" onClick={toggleTheme} title={isDark ? 'Light mode' : 'Dark mode'}>
            {isDark ? <Sun size={13} strokeWidth={1.8} /> : <Moon size={13} strokeWidth={1.8} />}
          </button>

          <div className="db-vr" />

          {/* New doc */}
          <Link href="/editor">
            <button className="db-btn" style={{ padding: '6px 12px' }}>
              <Plus size={10} strokeWidth={2.2} />
              <span className="hidden sm:inline">New</span>
            </button>
          </Link>

          <div className="db-vr" />

          {/* Account */}
          <div ref={accountRef} style={{ position: 'relative' }}>
            <button
              ref={accountBtnRef}
              className="db-ghost"
              style={{ gap: 6, padding: '3px 8px 3px 4px' }}
              onClick={() => {
                if (!showAccountMenu && accountBtnRef.current) {
                  const r = accountBtnRef.current.getBoundingClientRect();
                  setAccountMenuPos({ top: r.bottom + 5, right: window.innerWidth - r.right });
                }
                setShowAccountMenu(o => !o); setShowNotifPanel(false);
              }}
            >
              {user?.avatar_url ? (
                <div style={{ width: 20, height: 20, overflow: 'hidden', border: '1px solid var(--rule)', flexShrink: 0 }}>
                  <Image src={user.avatar_url} alt="Profile" width={20} height={20} />
                </div>
              ) : (
                <div className="db-avatar" style={{ width: 20, height: 20 }}>
                  {user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'S'}
                </div>
              )}
              <span className="hidden md:block" style={{ fontFamily: 'var(--ff-ui)', fontSize: 9.5, fontWeight: 500, letterSpacing: '0.06em', color: 'var(--ink)' }}>
                {user?.name || ''}
              </span>
              <ChevronDown className="hidden sm:block" size={10} strokeWidth={2} style={{ color: 'var(--mid)' }} />
            </button>
          </div>

        </div>
      </header>

      {/* ══ BODY ════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* ── SIDEBAR — dept index ─────────────────────────────────────────── */}
        <aside className="db-sidebar">

          <div className="db-sidebar-label">Workspace</div>

          {NAV_ITEMS.map((item, i) => {
            const isActive = activeNav === (item.id as string);
            const inner = (
              <>
                {/* Italic serif numeral — mirrors login page dept index */}
                <span className="db-nav-num">{String(i + 1).padStart(2, '0')}</span>
                <item.icon size={11} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.count !== null && item.count > 0 && (
                  <span style={{
                    fontFamily: 'var(--ff-ui)', fontSize: 8, fontWeight: 700,
                    letterSpacing: '0.08em', padding: '1px 5px',
                    background: isActive ? 'var(--accent)' : 'var(--accent-dim)',
                    color: isActive ? 'var(--paper)' : 'var(--mid)',
                    flexShrink: 0,
                  }}>
                    {item.count}
                  </span>
                )}
              </>
            );
            return item.href ? (
              <Link key={item.id} href={item.href} className={`db-nav-item${isActive ? ' active' : ''}`}>{inner}</Link>
            ) : (
              <button key={item.id} className={`db-nav-item${isActive ? ' active' : ''}`}
                onClick={() => setActiveNav(item.id as 'home' | 'articles' | 'blogs')}>
                {inner}
              </button>
            );
          })}

          {isFullSidebar && (
            <>
              <div className="db-sidebar-rule" />
              <div className="db-sidebar-label">Starred</div>

              {starredDocs.length === 0 ? (
                <p style={{ fontFamily: 'var(--ff-ui)', fontSize: 9, color: 'var(--mid)', padding: '3px 20px', lineHeight: 1.7, letterSpacing: '0.04em' }}>
                  Star a document to pin it here.
                </p>
              ) : starredDocs.map(doc => (
                <button key={doc.id} className="db-starred-row" onClick={() => router.push('/editor')}>
                  <Star size={8} fill="var(--accent)" stroke="none" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.title.length > 24 ? doc.title.slice(0, 24) + '…' : doc.title}
                  </span>
                </button>
              ))}

              {/* Word goal */}
              {wordGoal > 0 && docs.length > 0 && (
                <>
                  <div className="db-sidebar-rule" />
                  <div className="db-goal">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Target size={10} style={{ color: 'var(--accent)' }} />
                        <span className="db-cap" style={{ color: 'var(--accent)' }}>Word Goal</span>
                      </div>
                      <span className="db-cap" style={{ color: 'var(--accent)' }}>
                        {Math.round((docs[0].words / wordGoal) * 100)}%
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--ff-ui)', fontSize: 10.5, color: 'var(--ink)', fontWeight: 500, marginBottom: 7, letterSpacing: '0.04em' }}>
                      {docs[0].words.toLocaleString()} <span style={{ color: 'var(--mid)', fontWeight: 400 }}>/ {wordGoal.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 2, background: 'var(--rule)' }}>
                      <div style={{ height: '100%', background: docs[0].words >= wordGoal ? '#4ade80' : 'var(--accent)', width: `${Math.min((docs[0].words / wordGoal) * 100, 100)}%`, transition: 'width 0.4s cubic-bezier(0.34,1.2,0.64,1)' }} />
                    </div>
                  </div>
                </>
              )}

              <div style={{ flex: 1 }} />

              {/* Open Editor CTA — full-width db-btn at sidebar bottom */}
              <div style={{ padding: '0 16px 4px', borderTop: '1px solid var(--rule)', paddingTop: 12 }}>
                <Link href="/editor" className="db-btn" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <PenTool size={10} strokeWidth={2} />
                  <span style={{ flex: 1, paddingLeft: 6 }}>Open Editor</span>
                  <ArrowRight size={10} />
                </Link>
              </div>
            </>
          )}
        </aside>

        {/* ── MAIN ────────────────────────────────────────────────────────── */}
        <main className="db-main">

          {/* Overview */}
          {activeNav === 'home' && (
            <>
              <div className="db-rise-0" style={{ marginBottom: 6 }}>
                <h1 className="db-page-title">{getGreeting(user?.name)}<em>.</em></h1>
                <p className="db-page-sub" style={{ marginTop: 6 }}>{getTodayLabel()}</p>
              </div>
              <hr className="db-triple-rule" />

              {activeDeptKey === 'Leadership' && (
                <div style={{ marginBottom: 32 }}>
                  <LeadershipDashboard tasks={tasks} selectedDept={selectedDept} setSelectedDept={setSelectedDept} />
                </div>
              )}

              {userLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ height: 72, background: 'var(--accent-sub)', border: '1px solid var(--rule)', borderLeft: '2px solid var(--accent)', opacity: 0.6 + i * 0.1 }} />
                  ))}
                </div>
              ) : user && (
                <>
                  {(activeDeptKey === 'Development' || (activeDeptKey === 'Leadership' && selectedDept === 'Development')) && <DevelopmentDashboard />}
                  {(activeDeptKey === 'Marketing'   || (activeDeptKey === 'Leadership' && selectedDept === 'Marketing'))   && <MarketingDashboard />}
                  {(activeDeptKey === 'Design Lab'  || (activeDeptKey === 'Leadership' && selectedDept === 'Design Lab'))  && <DesignLabDashboard />}
                  {(activeDeptKey === "Writers' Block" || !activeDeptKey || (activeDeptKey === 'Leadership' && selectedDept === "Writers' Block")) && (
                    <WritersDashboard
                      user={user} allDocs={allDocs} fmtWords={fmtWords}
                      totalWords={totalWords} weekWords={weekWords}
                      published={published} drafts={drafts} goalProgress={goalProgress}
                      docsLoading={docsLoading} tasksLoading={tasksLoading}
                      pendingTasks={pendingTasks} doneTasks={doneTasks}
                      articles={articles} blogs={blogs} router={router}
                      setActiveNav={setActiveNav} toggleStar={toggleStar}
                      handleContextMenu={handleContextMenu}
                      handleTaskCardComplete={handleTaskCardComplete}
                    />
                  )}
                </>
              )}
            </>
          )}

          {/* Articles */}
          {activeNav === 'articles' && (
            <>
              <div className="db-rise-0" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                <div>
                  <h1 className="db-page-title">Articles</h1>
                  <p className="db-page-sub" style={{ marginTop: 6 }}>{articles.length} articles · {articles.filter(a => a.status === 'published').length} published</p>
                </div>
                <Link href="/editor"><button className="db-btn"><Plus size={10} strokeWidth={2.2} /> New Article</button></Link>
              </div>
              <hr className="db-triple-rule" />
              <SortFilterBar sortBy={sortBy} setSortBy={setSortBy} filter={filter} setFilter={setFilter} total={articles.length} />
              {sortedArticles.length === 0 ? (
                <EmptyDocState type="articles" onNew={() => router.push('/editor')} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--rule)', borderBottom: 'none' }}>
                  {sortedArticles.map((doc, i) => (
                    <div key={doc.id} className="db-rise-1" style={{ animationDelay: `${i * 0.04}s`, borderBottom: '1px solid var(--rule)' }}>
                      <DocCard doc={doc} onStar={toggleStar} onContextMenu={handleContextMenu} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Blogs */}
          {activeNav === 'blogs' && (
            <>
              <div className="db-rise-0" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                <div>
                  <h1 className="db-page-title">Blog Posts</h1>
                  <p className="db-page-sub" style={{ marginTop: 6 }}>{blogs.length} posts · {blogs.filter(b => b.status === 'published').length} published</p>
                </div>
                <Link href="/editor"><button className="db-btn"><Plus size={10} strokeWidth={2.2} /> New Post</button></Link>
              </div>
              <hr className="db-triple-rule" />
              <SortFilterBar sortBy={sortBy} setSortBy={setSortBy} filter={filter} setFilter={setFilter} total={blogs.length} />
              {sortedBlogs.length === 0 ? (
                <EmptyDocState type="blogs" onNew={() => router.push('/editor')} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--rule)', borderBottom: 'none' }}>
                  {sortedBlogs.map((doc, i) => (
                    <div key={doc.id} className="db-rise-1" style={{ animationDelay: `${i * 0.04}s`, borderBottom: '1px solid var(--rule)' }}>
                      <DocCard doc={doc} onStar={toggleStar} onContextMenu={handleContextMenu} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ══ MOBILE BOTTOM NAV ═══════════════════════════════════════════════ */}
      <Suspense fallback={null}>
        <MobileNav 
          activeNav={activeNav} 
          pendingTasksCount={pendingTasks.length} 
          isFullSidebar={isFullSidebar} 
        />
      </Suspense>

      {/* ══ OVERLAYS ════════════════════════════════════════════════════════ */}
      {showCmd && <CommandPalette docs={allDocs} onClose={() => setShowCmd(false)} onCommand={handleCommand} />}
      {ctxMenu && <DocContextMenu pos={ctxMenu} docs={allDocs} onStar={toggleStar} onDelete={deleteDoc} onOpen={() => router.push('/editor')} onClose={() => setCtxMenu(null)} />}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      {showAccountMenu && accountMenuPos && createPortal(
        <div style={{ position: 'fixed', top: accountMenuPos.top, right: accountMenuPos.right, zIndex: 9960 }} onMouseDown={e => e.stopPropagation()}>
          <AccountMenu user={user} onClose={() => setShowAccountMenu(false)} onToast={showToastMsg} onOpenSettings={() => setShowSettings(true)} />
        </div>,
        document.body
      )}

      {showSettings && (
        <SettingsModal 
          settings={appSettings} 
          onClose={() => setShowSettings(false)} 
          onChange={next => { 
            setAppSettings(next); 
            applySettings(next);
            if (user) {
              const meta = user.metadata || {};
              updateMetadata({ ...meta, settings: next });
            }
          }} 
        />
      )}

      {submittingTask && (
        <TaskSubmissionModal
          taskId={submittingTask.id}
          taskTitle={submittingTask.title}
          onClose={() => setSubmittingTask(null)}
          onSuccess={() => {
            setSubmittingTask(null);
            setTasks(ts => ts.map(t => t.id === submittingTask.id ? { ...t, status: 'done' } : t));
            setToast('Task submitted for review successfully');
          }}
        />
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="app-bg flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-[1px] bg-[var(--accent)] animate-pulse" />
          <span className="db-cap text-[8px] tracking-[0.3em]" style={{ color: 'var(--mid)', letterSpacing: '0.3em' }}>LOADING VANTAGE</span>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}