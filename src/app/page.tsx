'use client';

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  FileText, BookOpen, Search, Moon, Sun, Bell, BellOff,
  ChevronRight, Plus, TrendingUp, Clock, BarChart2,
  Star, MoreHorizontal, Trash2, ExternalLink,
  ArrowRight, Settings,
  Activity, ChevronDown, PenTool,
  Home, Edit3, Award,
  Check, ArrowUpDown, Target, Loader2,
  Briefcase, Users, Heart, Calendar, Zap,
  Flame, BookMarked, Sparkles, TrendingDown,
  Layers
} from 'lucide-react';
import { useUser } from '@/lib/useUser';
import { useTheme } from '@/lib/useTheme';
import AccountMenu from '@/components/AccountMenu';
import Toast from '@/components/Toast';
import TaskSubmissionModal from '@/components/TaskSubmissionModal';
import SettingsModal, { loadSettings, saveSettings, applySettings, DEFAULT_SETTINGS, THEMES } from '@/components/SettingsModal';
import type { AppSettings } from '@/components/SettingsModal';

import DevelopmentDashboard from '@/components/DevelopmentDashboard';
import MarketingDashboard from '@/components/MarketingDashboard';
import DesignLabDashboard from '@/components/DesignLabDashboard';
import LeadershipDashboard from '@/components/LeadershipDashboard';
import WritersDashboard from '@/components/WritersDashboard';
import { StatCard, ActivityChart, QuickAction, DocCard, EmptyDocState, Skeleton, TaskCard } from '@/components/WritersDashboardComponents';
import { DEPARTMENTS } from '@/config/departments';
import { getGreeting, getTodayLabel, fmtWords, fmtDate, getWeekWindow, getTodayStr, countWords, excerptFrom } from '@/lib/utils';
import { Task } from '@/types/task';
import { Sidebar } from '@/components/Sidebar';
import Header from '@/components/Header';
import { Notif } from '@/components/NotifPanel';

// --- Types --------------------------------------------------------------------
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

const SEED_NOTIFS: Notif[] = [
  { id: 'n1', title: 'Word goal reached', body: 'You hit your word goal for the day — keep going!', time: '2m ago', read: false },
  { id: 'n2', title: 'Draft reminder',    body: 'You have 2 documents still in draft.',              time: '1h ago', read: false },
  { id: 'n3', title: 'Weekly summary',    body: 'Great writing week — check your overview.',          time: '3h ago', read: true  },
];

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
              No results for "{query}"
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

// -----------------------------------------------------------------------------
// MAIN DASHBOARD
// -----------------------------------------------------------------------------
export default function Dashboard() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const [docs,             setDocs]             = useState<Doc[]>([]);
  const [lsDoc,            setLsDoc]            = useState<Doc | null>(null);
  const { isDark, toggleTheme }                 = useTheme();
  const [showSettings,     setShowSettings]     = useState(false);
  const [appSettings,      setAppSettings]      = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeNav,        setActiveNav]        = useState<'home' | 'articles' | 'blogs'>('home');
  const [showCmd,          setShowCmd]          = useState(false);
  const [notifs,           setNotifs]           = useState<Notif[]>(SEED_NOTIFS);
  const [toast,            setToast]            = useState<string | null>(null);
  const [sortBy,           setSortBy]           = useState<SortKey>('date');
  const [filter,           setFilter]           = useState<FilterStatus>('all');
  const [ctxMenu,          setCtxMenu]          = useState<CtxPos | null>(null);
  const [wordGoal,         setWordGoal]         = useState(0);
  const [tasks,            setTasks]            = useState<Task[]>([]);
  const [selectedDept,     setSelectedDept]     = useState<string | null>(null);
  const [submittingTask,   setSubmittingTask]   = useState<{ id: string; title: string } | null>(null);
  const [docsLoading,      setDocsLoading]      = useState(true);
  const [tasksLoading,     setTasksLoading]     = useState(true);
  const [activeDeptKey,    setActiveDeptKey]    = useState<string | null>(null);

  const appSettingsRef = useRef<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => { appSettingsRef.current = appSettings; }, [appSettings]);
  useEffect(() => { if (!userLoading && !user) router.push('/login'); }, [user, userLoading, router]);

  useEffect(() => {
    try {
      const s = loadSettings(); setAppSettings(s); applySettings(s);
      const goal = localStorage.getItem('cs-goal');
      if (goal) setWordGoal(parseInt(goal, 10) || 0);
      const rawContent = localStorage.getItem('cs-content');
      const name = localStorage.getItem('cs-name') || 'Untitled Document';
      if (rawContent) {
        const words = countWords(rawContent), readTime = Math.max(1, Math.round(words / 200)), excerpt = excerptFrom(rawContent);
        setLsDoc({ id: 'ls-active', type: 'cancer_docs', title: name, excerpt: excerpt || 'Document in editor.', words, status: 'draft', date: getTodayStr(), readTime, tags: [], starred: false, isActive: true });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (user && !activeDeptKey) setActiveDeptKey(user.department || "Writers' Block");
  }, [user, activeDeptKey]);

  useEffect(() => { (async () => { try { const r = await fetch('/api/documents'); if (r.ok) { const d = await r.json(); setDocs(d.documents); } } catch {} finally { setDocsLoading(false); } })(); }, []);
  useEffect(() => { (async () => { try { const r = await fetch('/api/tasks'); if (r.ok) { const d = await r.json(); setTasks(d.assignments || []); } } catch {} finally { setTasksLoading(false); } })(); }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 'k') { e.preventDefault(); setShowCmd(c => !c); }
      if (e.key === 'Escape') { setShowCmd(false); setCtxMenu(null); }
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, []);


  const handleMarkAllRead = useCallback(() => {
    setNotifs(ns => ns.map(n => ({ ...n, read: true })));
    setToast('All notifications marked as read');
  }, []);

  const showToastMsg = useCallback((msg: string) => setToast(msg), []);

  const toggleStar = useCallback((id: string) => {
    if (id === 'ls-active') { setLsDoc(d => d ? { ...d, starred: !d.starred } : null); setToast(lsDoc?.starred ? 'Removed from starred' : 'Added to starred'); return; }
    setDocs(ds => ds.map(d => d.id === id ? { ...d, starred: !d.starred } : d));
    const doc = docs.find(d => d.id === id); setToast(doc?.starred ? 'Removed from starred' : 'Added to starred');
  }, [docs, lsDoc]);

  const deleteDoc = useCallback(async (id: string) => {
    const all = lsDoc ? [lsDoc, ...docs] : docs;
    const doc = all.find(d => d.id === id); if (!doc) return;
    if (id === 'ls-active') { setLsDoc(null); localStorage.removeItem('cs-content'); localStorage.removeItem('cs-name'); localStorage.removeItem('cs-tabs'); }
    else { setDocs(ds => ds.filter(d => d.id !== id)); try { await fetch(`/api/documents?id=${id}&type=${doc.type}`, { method: 'DELETE' }); } catch {} }
    setToast(`Deleted "${doc.title.slice(0, 28)}…"`);
  }, [docs, lsDoc]);

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

  const allDocs        = useMemo(() => lsDoc ? [lsDoc, ...docs] : docs, [docs, lsDoc]);
  const articles       = useMemo(() => allDocs.filter(d => d.type === 'cancer_docs' || d.type === 'survivor_stories'), [allDocs]);
  const blogs          = useMemo(() => allDocs.filter(d => d.type === 'blogs'), [allDocs]);
  const totalWords     = useMemo(() => docs.reduce((s, d) => s + d.words, 0), [docs]);
  const published      = useMemo(() => allDocs.filter(d => d.status === 'published').length, [allDocs]);
  const drafts         = useMemo(() => allDocs.filter(d => d.status === 'draft').length, [allDocs]);
  const starredDocs    = useMemo(() => allDocs.filter(d => d.starred), [allDocs]);
  const unreadCount    = useMemo(() => notifs.filter(n => !n.read).length, [notifs]);
  const weekWindow     = useMemo(() => getWeekWindow().map((w: any) => w.date), []);
  const weekWords      = useMemo(() => allDocs.filter(d => weekWindow.includes(d.date)).reduce((s, d) => s + d.words, 0), [allDocs, weekWindow]);
  const goalProgress   = wordGoal > 0 && lsDoc ? { current: lsDoc.words, goal: wordGoal } : null;
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

  return (
    <div className={`db-root${isDark ? ' dark' : ''}`}>

      {/* == HEADER ========================================================== */}
      <Header 
        user={user}
        notifs={notifs}
        unreadCount={unreadCount}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenSearch={() => setShowCmd(true)}
        onOpenSettings={() => setShowSettings(true)}
        onMarkAllRead={handleMarkAllRead}
        onToast={showToastMsg}
      />

      {/* == BODY ============================================================ */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* Sidebar */}
        <Sidebar 
          activeNav={activeNav}
          isFullSidebar={isFullSidebar}
          counts={{
            articles: articles.length,
            blogs: blogs.length,
            tasks: pendingTasks.length
          }}
          starredDocs={starredDocs}
          wordGoal={wordGoal}
          lsDoc={lsDoc}
          onNavClick={(id: any) => setActiveNav(id)}
        />

        {/* -- MAIN ---------------------------------------------------------- */}
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
              ) : (
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
      <nav className="db-mobile-nav">
        <div className="db-tape-bar">
          <div className="db-tape">
            {[...TAPE_ITEMS, ...TAPE_ITEMS].map((item, i) => (
              <span key={i} className="db-cap" style={{
                color: i % 8 === 7 || (i - 7) % 8 === 0 ? 'var(--accent)' : 'var(--cream)',
                opacity: 0.8, padding: '0 14px', marginBottom: 0,
              }}>{item}</span>
            ))}
          </div>
        </div>

        <div className="db-mob-inner">
          {[
            { id: 'home',     label: 'Overview',    icon: Home,      href: '/'      },
            { id: 'articles', label: 'Articles',    icon: FileText,  href: null     },
            { id: 'blogs',    label: 'Blog Posts',  icon: BookOpen,  href: null     },
            { id: 'tasks',    label: 'Assignments', icon: Briefcase, href: '/tasks' },
            { id: 'team',     label: 'Team',        icon: Users,     href: '/team'  },
          ].map(item => {
            const isActive = activeNav === item.id;
            const inner = (
              <>
                <item.icon size={17} strokeWidth={1.8} />
                <span>{item.label}</span>
                {item.id === 'tasks' && pendingTasks.length > 0 && (
                  <span style={{ position: 'absolute', top: 5, left: '50%', transform: 'translateX(4px)', width: 12, height: 12, background: 'var(--accent)', color: 'var(--paper)', fontSize: 7, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-ui)' }}>
                    {pendingTasks.length > 9 ? '9+' : pendingTasks.length}
                  </span>
                )}
              </>
            );
            if (item.href) {
              return <Link key={item.id} href={item.href} className={`db-mob-item${isActive ? ' active' : ''}`}>{inner}</Link>;
            }
            return (
              <button key={item.id} className={`db-mob-item${isActive ? ' active' : ''}`}
                onClick={() => setActiveNav(item.id as any)}>
                {inner}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ══ OVERLAYS ════════════════════════════════════════════════════════ */}
      {showCmd && <CommandPalette docs={allDocs} onClose={() => setShowCmd(false)} onCommand={handleCommand} />}
      {ctxMenu && <DocContextMenu pos={ctxMenu} docs={allDocs} onStar={toggleStar} onDelete={deleteDoc} onOpen={() => router.push('/editor')} onClose={() => setCtxMenu(null)} />}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}



      {showSettings && (
        <SettingsModal settings={appSettings} onClose={() => setShowSettings(false)} onChange={next => { setAppSettings(next); saveSettings(next); applySettings(next); }} />
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