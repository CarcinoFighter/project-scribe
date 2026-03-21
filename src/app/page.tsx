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
  ArrowRight, User, Settings, LogOut,
  Activity, ChevronDown, PenTool,
  Home, LayoutGrid, Edit3, Award,
  Check, X, ArrowUpDown, SlidersHorizontal,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Doc {
  id: string;
  type: 'article' | 'blog';
  title: string;
  excerpt: string;
  words: number;
  status: 'published' | 'draft';
  date: string; // YYYY-MM-DD
  readTime: number;
  tags: string[];
  starred: boolean;
}

interface Notif {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

interface Cmd {
  id: string;
  label: string;
  hint?: string;
  icon: React.ElementType;
  shortcut?: string;
  group: string;
}

type SortKey = 'date' | 'words' | 'status';
type FilterStatus = 'all' | 'published' | 'draft';

// ─────────────────────────────────────────────────────────────────────────────
// Seed data  (dates span the week of Mon Mar 16 – Sat Mar 21 2026)
// Activity chart derives from these dates, so the chart reflects real totals.
// ─────────────────────────────────────────────────────────────────────────────

const SEED_ARTICLES: Doc[] = [
  {
    id: 'a1', type: 'article',
    title: 'The Architecture of Modern Writing Systems',
    excerpt: 'How digital tools have reshaped the cognitive process of long-form writing, and what it means for the craft.',
    words: 3240, status: 'published', date: '2026-03-21', readTime: 16,
    tags: ['writing', 'cognition'], starred: true,
  },
  {
    id: 'a2', type: 'article',
    title: 'Markdown as a Thinking Tool',
    excerpt: 'Exploring how structured plain text enables clearer thinking through enforced simplicity.',
    words: 1870, status: 'draft', date: '2026-03-17', readTime: 9,
    tags: ['markdown', 'productivity'], starred: false,
  },
  {
    id: 'a3', type: 'article',
    title: 'The Case for Distraction-Free Editors',
    excerpt: 'An evidence-based argument for why interface minimalism directly correlates with writing quality.',
    words: 2650, status: 'published', date: '2026-03-13', readTime: 13,
    tags: ['tools', 'focus'], starred: true,
  },
];

const SEED_BLOGS: Doc[] = [
  {
    id: 'b1', type: 'blog',
    title: 'Week 11: Building in Public',
    excerpt: 'What shipping a writing tool taught me about the gap between what users say they want and what they need.',
    words: 890, status: 'published', date: '2026-03-21', readTime: 4,
    tags: ['personal', 'indie'], starred: false,
  },
  {
    id: 'b2', type: 'blog',
    title: 'On Creative Momentum',
    excerpt: 'The subtle physics of creative work — how inertia applies to writing streaks, and how to protect them.',
    words: 1120, status: 'published', date: '2026-03-19', readTime: 5,
    tags: ['creativity', 'habits'], starred: true,
  },
  {
    id: 'b3', type: 'blog',
    title: 'My Note-taking Stack in 2026',
    excerpt: 'After years of tool hopping, here is what actually stuck — and more importantly, why.',
    words: 740, status: 'draft', date: '2026-03-18', readTime: 4,
    tags: ['tools', 'notes'], starred: false,
  },
  {
    id: 'b4', type: 'blog',
    title: 'Reading Aloud as an Editing Method',
    excerpt: 'The single highest-leverage editing habit I have developed this year, with a practical workflow.',
    words: 620, status: 'published', date: '2026-03-10', readTime: 3,
    tags: ['editing', 'craft'], starred: false,
  },
];

const SEED_NOTIFS: Notif[] = [
  { id: 'n1', title: 'Word goal reached', body: 'You hit 4,000 words today — a new daily record.', time: '2m ago', read: false },
  { id: 'n2', title: 'Draft reminder', body: '"Markdown as a Thinking Tool" has been a draft for 4 days.', time: '1h ago', read: false },
  { id: 'n3', title: 'Weekly summary', body: 'You wrote 7.9k words this week — your best week yet.', time: '3h ago', read: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const TODAY       = '2026-03-21';
const WEEK_DATES  = ['2026-03-15','2026-03-16','2026-03-17','2026-03-18','2026-03-19','2026-03-20','2026-03-21'];
const WEEK_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function fmtWords(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
function computeActivity(docs: Doc[]) {
  return WEEK_DATES.map((date, i) => ({
    day: WEEK_LABELS[i],
    words: docs.filter(d => d.date === date).reduce((s, d) => s + d.words, 0),
    isToday: date === TODAY,
  }));
}
function sortDocs(docs: Doc[], by: SortKey): Doc[] {
  return [...docs].sort((a, b) => {
    if (by === 'date')   return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (by === 'words')  return b.words - a.words;
    if (by === 'status') return a.status.localeCompare(b.status);
    return 0;
  });
}
function filterDocs(docs: Doc[], status: FilterStatus): Doc[] {
  if (status === 'all') return docs;
  return docs.filter(d => d.status === status);
}

// ─────────────────────────────────────────────────────────────────────────────
// Command registry
// ─────────────────────────────────────────────────────────────────────────────

function buildCmds(): Cmd[] {
  return [
    { id: 'new-doc',     label: 'New Document',      hint: 'Open editor',       icon: Plus,        shortcut: 'Ctrl+N', group: 'Create'      },
    { id: 'open-editor', label: 'Open Editor',        hint: 'Go to /editor',     icon: Edit3,                           group: 'Navigate'    },
    { id: 'go-articles', label: 'View Articles',      hint: 'Show articles',     icon: FileText,                        group: 'Navigate'    },
    { id: 'go-blogs',    label: 'View Blog Posts',    hint: 'Show blogs',        icon: BookOpen,                        group: 'Navigate'    },
    { id: 'go-overview', label: 'Overview',           hint: 'Dashboard home',    icon: Home,                            group: 'Navigate'    },
    { id: 'theme',       label: 'Toggle Theme',       hint: 'Dark / Light',      icon: Moon,        shortcut: 'Ctrl+T', group: 'Preferences' },
    { id: 'settings',    label: 'Account Settings',   hint: 'Profile & billing', icon: Settings,                        group: 'Preferences' },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3200);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return createPortal(
    <div
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
        background: 'var(--surface-2)', border: '1px solid var(--border-med)',
        borderRadius: 'var(--r-lg)', padding: '11px 16px',
        boxShadow: 'var(--sh-md)',
        display: 'flex', alignItems: 'center', gap: 10,
        animation: 'fadeIn 0.18s ease',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-subtle2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Check size={11} style={{ color: 'var(--accent)' }} strokeWidth={2.5} />
      </div>
      <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{message}</span>
      <button className="tb-btn" onClick={onDismiss} style={{ padding: '2px 3px', borderRadius: 4, marginLeft: 4 }}>
        <X size={12} />
      </button>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification panel
// ─────────────────────────────────────────────────────────────────────────────

function NotifPanel({
  notifs, onMarkAllRead, onClose,
}: { notifs: Notif[]; onMarkAllRead: () => void; onClose: () => void }) {
  const unread = notifs.filter(n => !n.read).length;
  return (
    <div
      className="glass-overlay"
      style={{
        position: 'absolute', right: 0, top: 'calc(100% + 8px)',
        borderRadius: 'var(--r-lg)', width: 300, overflow: 'hidden', zIndex: 200,
      }}
    >
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Bell size={13} strokeWidth={2} style={{ color: 'var(--text-3)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Notifications</span>
          {unread > 0 && (
            <span style={{ fontSize: 10.5, fontWeight: 700, background: 'var(--accent)', color: '#fff', borderRadius: 99, padding: '1px 6px' }}>
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <button className="tb-btn" onClick={onMarkAllRead} style={{ fontSize: 11.5, gap: 4, color: 'var(--accent)', padding: '3px 7px', borderRadius: 6 }}>
            <BellOff size={11} strokeWidth={2} /> Mark all read
          </button>
        )}
      </div>

      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {notifs.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>
            All caught up!
          </div>
        ) : notifs.map(n => (
          <div
            key={n.id}
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              background: !n.read ? 'var(--accent-subtle)' : 'transparent',
              transition: 'background 0.12s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
              {!n.read && (
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 5 }} />
              )}
              <div style={{ flex: 1, minWidth: 0, paddingLeft: n.read ? 15 : 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2, lineHeight: 1.5 }}>{n.body}</div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 5, opacity: 0.8 }}>{n.time}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
        <button className="tb-btn" onClick={onClose} style={{ fontSize: 12, color: 'var(--accent)', gap: 4, padding: '4px 0' }}>
          View all notifications <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Account menu
// ─────────────────────────────────────────────────────────────────────────────

function AccountMenu({ onClose, onToast }: { onClose: () => void; onToast: (msg: string) => void }) {
  const router = useRouter();
  return (
    <div
      className="glass-overlay"
      style={{
        position: 'absolute', right: 0, top: 'calc(100% + 8px)',
        borderRadius: 'var(--r-lg)', minWidth: 210, overflow: 'hidden', zIndex: 200,
      }}
    >
      {/* User info */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 12, fontWeight: 700,
          }}>CF</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Carcino Foundation</div>
            <div style={{ fontSize: 11, color: 'var(--text-4)' }}>hello@carcino.org</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      {([
        { icon: User,       label: 'Profile',   action: () => { onClose(); onToast('Profile settings coming soon'); } },
        { icon: Settings,   label: 'Settings',  action: () => { onClose(); onToast('Account settings coming soon'); } },
        { icon: LayoutGrid, label: 'Dashboard', action: onClose, active: true },
        { icon: Edit3,      label: 'Open Editor', action: () => { onClose(); router.push('/editor'); } },
      ] as const).map(item => (
        <button
          key={item.label}
          className="tb-btn"
          style={{
            width: '100%', justifyContent: 'flex-start', padding: '9px 16px',
            borderRadius: 0, gap: 10,
            color: (item as { active?: boolean }).active ? 'var(--accent)' : 'var(--text-3)',
            background: (item as { active?: boolean }).active ? 'var(--accent-subtle)' : 'transparent',
          }}
          onClick={(item as { action: () => void }).action}
        >
          <item.icon size={14} strokeWidth={1.8} />
          <span style={{ fontSize: 13 }}>{item.label}</span>
        </button>
      ))}

      <div style={{ borderTop: '1px solid var(--border)' }}>
        <button
          className="tb-btn"
          style={{ width: '100%', justifyContent: 'flex-start', padding: '9px 16px', borderRadius: 0, gap: 10, color: '#ef4444' }}
          onClick={() => { onClose(); onToast('Signed out'); }}
        >
          <LogOut size={14} strokeWidth={1.8} />
          <span style={{ fontSize: 13 }}>Sign out</span>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Command palette
// ─────────────────────────────────────────────────────────────────────────────

function CommandPalette({
  docs, onClose, onCommand,
}: { docs: Doc[]; onClose: () => void; onCommand: (id: string) => void }) {
  const [query, setQuery]       = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const router   = useRouter();

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setSelected(0); }, [query]);

  const cmds = useMemo(() => buildCmds(), []);
  const q = query.trim().toLowerCase();

  const matchDocs = useMemo(() =>
    q ? docs.filter(d => d.title.toLowerCase().includes(q)) : [],
  [docs, q]);

  const matchCmds = useMemo(() =>
    cmds.filter(c => !q || c.label.toLowerCase().includes(q) || (c.hint ?? '').toLowerCase().includes(q)),
  [cmds, q]);

  const groups = useMemo(() =>
    matchCmds.reduce<Record<string, Cmd[]>>((acc, cmd) => {
      (acc[cmd.group] ??= []).push(cmd);
      return acc;
    }, {}),
  [matchCmds]);

  // Pre-compute flat list with stable indices — no side-effects during render
  type FlatItem = { kind: 'doc'; doc: Doc; idx: number } | { kind: 'cmd'; cmd: Cmd; idx: number };
  const flat = useMemo<FlatItem[]>(() => {
    let i = 0;
    return [
      ...matchDocs.map(doc => ({ kind: 'doc' as const, doc, idx: i++ })),
      ...Object.values(groups).flat().map(cmd => ({ kind: 'cmd' as const, cmd, idx: i++ })),
    ];
  }, [matchDocs, groups]);

  const run = useCallback((id: string) => { onCommand(id); onClose(); }, [onCommand, onClose]);

  useEffect(() => {
    const kh = (e: KeyboardEvent) => {
      if (e.key === 'Escape')    { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, flat.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter') {
        e.preventDefault();
        const item = flat[selected];
        if (!item) return;
        if (item.kind === 'doc') { router.push('/editor'); onClose(); }
        else                     { run(item.cmd.id); }
      }
    };
    const mh = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('keydown', kh);
    document.addEventListener('mousedown', mh);
    return () => { window.removeEventListener('keydown', kh); document.removeEventListener('mousedown', mh); };
  }, [flat, selected, run, onClose, router]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${selected}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  return createPortal(
    <>
      {/* Dim backdrop */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)', zIndex: 9989 }} />
      <div
        ref={wrapRef}
        className="glass-overlay scale-in"
        style={{
          position: 'fixed', top: '12%', left: '50%', transform: 'translateX(-50%)',
          width: 520, maxWidth: 'calc(100vw - 32px)',
          borderRadius: 18, overflow: 'hidden', zIndex: 9990,
        }}
      >
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderBottom: '1px solid var(--border-med)', height: 52 }}>
          <Search size={15} strokeWidth={1.8} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search documents and commands…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 15, color: 'var(--text)' }}
          />
          <kbd onClick={onClose} style={{ cursor: 'pointer', fontSize: 11 }}>Esc</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: 380, overflowY: 'auto', padding: 8 }}>
          {flat.length === 0 ? (
            <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              {matchDocs.length > 0 && (
                <section>
                  <div style={{ padding: '6px 10px 3px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-4)' }}>
                    Documents
                  </div>
                  {matchDocs.map(doc => {
                    const entry = flat.find(f => f.kind === 'doc' && f.doc.id === doc.id)!;
                    const isSelected = entry.idx === selected;
                    const Icon = doc.type === 'article' ? FileText : BookOpen;
                    return (
                      <button
                        key={doc.id}
                        data-idx={entry.idx}
                        className={`cmd-item${isSelected ? ' selected' : ''}`}
                        onMouseEnter={() => setSelected(entry.idx)}
                        onClick={() => { router.push('/editor'); onClose(); }}
                      >
                        <Icon size={14} strokeWidth={1.8} style={{ flexShrink: 0, opacity: 0.75 }} />
                        <span style={{ flex: 1 }}>{doc.title}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'capitalize' }}>{doc.type}</span>
                      </button>
                    );
                  })}
                </section>
              )}
              {Object.entries(groups).map(([group, groupCmds]) => (
                <section key={group}>
                  <div style={{ padding: '6px 10px 3px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-4)' }}>
                    {group}
                  </div>
                  {groupCmds.map(cmd => {
                    const entry = flat.find(f => f.kind === 'cmd' && f.cmd.id === cmd.id)!;
                    const isSelected = entry.idx === selected;
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        data-idx={entry.idx}
                        className={`cmd-item${isSelected ? ' selected' : ''}`}
                        onMouseEnter={() => setSelected(entry.idx)}
                        onClick={() => run(cmd.id)}
                      >
                        <Icon size={14} strokeWidth={1.8} style={{ flexShrink: 0, opacity: 0.75 }} />
                        <span style={{ flex: 1 }}>{cmd.label}</span>
                        {cmd.hint && <span style={{ fontSize: 11.5, color: 'var(--text-4)' }}>{cmd.hint}</span>}
                        {cmd.shortcut && <kbd>{cmd.shortcut}</kbd>}
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

// ─────────────────────────────────────────────────────────────────────────────
// Doc context menu (portal, fixed-positioned)
// ─────────────────────────────────────────────────────────────────────────────

interface CtxPos { x: number; y: number; docId: string }

function DocContextMenu({
  pos, docs, onStar, onDelete, onOpen, onClose,
}: {
  pos: CtxPos;
  docs: Doc[];
  onStar: (id: string) => void;
  onDelete: (id: string) => void;
  onOpen: () => void;
  onClose: () => void;
}) {
  const doc = docs.find(d => d.id === pos.docId);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const s = () => onClose();
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    window.addEventListener('scroll', s, true);
    return () => {
      document.removeEventListener('mousedown', h);
      document.removeEventListener('keydown', k);
      window.removeEventListener('scroll', s, true);
    };
  }, [onClose]);

  if (!doc) return null;

  // Flip if near right/bottom edge
  const menuW = 180, menuH = 120;
  const left = Math.min(pos.x, window.innerWidth  - menuW - 8);
  const top  = Math.min(pos.y, window.innerHeight - menuH - 8);

  const items = [
    {
      icon: ExternalLink, label: 'Open in Editor',
      action: () => { onOpen(); onClose(); },
    },
    {
      icon: Star, label: doc.starred ? 'Remove star' : 'Add star',
      action: () => { onStar(doc.id); onClose(); },
      style: doc.starred ? { color: 'var(--accent)' } as React.CSSProperties : undefined,
    },
    {
      icon: Trash2, label: 'Delete',
      action: () => { onDelete(doc.id); onClose(); },
      style: { color: '#ef4444' } as React.CSSProperties,
    },
  ];

  return createPortal(
    <div
      ref={ref}
      className="glass-overlay scale-in"
      style={{ position: 'fixed', left, top, width: menuW, borderRadius: 'var(--r-lg)', overflow: 'hidden', zIndex: 9980, padding: 4 }}
    >
      {items.map(item => (
        <button
          key={item.label}
          className="tb-btn"
          style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px', borderRadius: 'var(--r-sm)', gap: 9, ...item.style }}
          onClick={item.action}
        >
          <item.icon size={13} strokeWidth={1.8} />
          <span style={{ fontSize: 12.5 }}>{item.label}</span>
        </button>
      ))}
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status pill — dark-mode-aware backgrounds
// ─────────────────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const pub = status === 'published';
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
      padding: '2px 8px', borderRadius: 99,
      background: pub ? 'var(--accent-subtle2)' : 'var(--bg-deep)',
      color:      pub ? 'var(--accent)'        : 'var(--text-4)',
      border:     `1px solid ${pub ? 'rgba(152,117,193,0.22)' : 'var(--border-med)'}`,
      flexShrink: 0,
    }}>
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Doc card
// ─────────────────────────────────────────────────────────────────────────────

function DocCard({
  doc, onStar, onContextMenu,
}: {
  doc: Doc;
  onStar: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const router = useRouter();
  const isArticle = doc.type === 'article';

  return (
    <div
      role="button"
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => router.push('/editor')}
      onKeyDown={e => { if (e.key === 'Enter') router.push('/editor'); }}
      style={{
        background:   hovered ? 'var(--bg-alt)' : 'transparent',
        border:       '1px solid',
        borderColor:  hovered ? 'var(--border-med)' : 'var(--border)',
        borderRadius: 'var(--r-lg)',
        padding:      '14px 16px',
        cursor:       'pointer',
        transition:   'border-color 0.15s, background 0.15s, box-shadow 0.15s, transform 0.15s',
        display:      'flex', flexDirection: 'column', gap: 8,
        transform:    hovered ? 'translateY(-1px)' : 'none',
        boxShadow:    hovered ? 'var(--sh-sm)' : 'none',
        userSelect:   'none',
      }}
    >
      {/* Top row: icon + status + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isArticle ? 'var(--accent-subtle)' : 'var(--bg-deep)',
          }}>
            {isArticle
              ? <FileText size={12} strokeWidth={2.2} style={{ color: 'var(--accent)' }} />
              : <BookOpen  size={12} strokeWidth={2.2} style={{ color: 'var(--text-4)' }} />}
          </div>
          <StatusPill status={doc.status} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {doc.starred && (
            <Star size={12} fill="var(--accent)" stroke="none" />
          )}
          <button
            className="tb-btn"
            title="More options"
            onClick={e => { e.stopPropagation(); onContextMenu(e, doc.id); }}
            style={{
              padding: '3px 4px', borderRadius: 5,
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.12s',
            }}
          >
            <MoreHorizontal size={13} />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.45, margin: 0 }}>
        {doc.title}
      </h3>

      {/* Excerpt */}
      <p style={{
        fontSize: 12, color: 'var(--text-4)', lineHeight: 1.6, margin: 0,
        overflow: 'hidden', display: '-webkit-box',
        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
      }}>
        {doc.excerpt}
      </p>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, gap: 8 }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', minWidth: 0 }}>
          {doc.tags.map(tag => (
            <span key={tag} style={{
              fontSize: 10.5, color: 'var(--text-4)',
              background: 'var(--bg-deep)', borderRadius: 4, padding: '1px 6px', flexShrink: 0,
            }}>
              #{tag}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: 'var(--text-4)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={10} /> {doc.readTime}m
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{fmtWords(doc.words)}</span>
          <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{fmtDate(doc.date)}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, accent, onClick,
}: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; accent?: boolean; onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? e => { if (e.key === 'Enter') onClick(); } : undefined}
      onMouseEnter={() => onClick && setHovered(true)}
      onMouseLeave={() => onClick && setHovered(false)}
      style={{
        background:   accent ? 'var(--accent)' : 'var(--surface-1)',
        border:       `1px solid ${accent ? 'transparent' : 'var(--border-med)'}`,
        borderRadius: 'var(--r-lg)',
        padding:      '16px 18px',
        boxShadow:    accent ? '0 4px 24px var(--accent-glow)' : 'var(--sh-xs)',
        cursor:       onClick ? 'pointer' : 'default',
        transition:   'transform 0.12s, box-shadow 0.12s',
        transform:    hovered ? 'translateY(-1px)' : 'none',
        userSelect:   'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.02em', color: accent ? 'rgba(255,255,255,0.75)' : 'var(--text-4)' }}>
          {label}
        </span>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: accent ? 'rgba(255,255,255,0.18)' : 'var(--accent-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={13} strokeWidth={2} style={{ color: accent ? '#fff' : 'var(--accent)' }} />
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, color: accent ? '#fff' : 'var(--text)' }}>
        {value}
      </div>
      <div style={{ fontSize: 11, marginTop: 4, color: accent ? 'rgba(255,255,255,0.6)' : 'var(--text-4)' }}>
        {sub}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sort / filter bar
// ─────────────────────────────────────────────────────────────────────────────

function SortFilterBar({
  sortBy, setSortBy, filter, setFilter, total,
}: {
  sortBy: SortKey; setSortBy: (k: SortKey) => void;
  filter: FilterStatus; setFilter: (f: FilterStatus) => void;
  total: number;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 4 }}>
        {(['all', 'published', 'draft'] as FilterStatus[]).map(f => (
          <button
            key={f}
            className="tb-btn"
            onClick={() => setFilter(f)}
            style={{
              padding: '4px 11px', borderRadius: 99, fontSize: 12, fontWeight: filter === f ? 600 : 400,
              background: filter === f ? 'var(--accent-subtle2)' : 'var(--bg-deep)',
              color:      filter === f ? 'var(--accent)' : 'var(--text-4)',
              border:     `1px solid ${filter === f ? 'rgba(152,117,193,0.22)' : 'var(--border)'}`,
              textTransform: 'capitalize',
            }}
          >
            {f === 'all' ? `All (${total})` : f}
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      {/* Sort */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <ArrowUpDown size={12} style={{ color: 'var(--text-4)' }} />
        <span style={{ fontSize: 12, color: 'var(--text-4)' }}>Sort by</span>
        {(['date', 'words', 'status'] as SortKey[]).map(k => (
          <button
            key={k}
            className="tb-btn"
            onClick={() => setSortBy(k)}
            style={{
              padding: '3px 9px', borderRadius: 6, fontSize: 12,
              background: sortBy === k ? 'var(--accent-subtle2)' : 'transparent',
              color:      sortBy === k ? 'var(--accent)' : 'var(--text-4)',
              fontWeight: sortBy === k ? 600 : 400,
              textTransform: 'capitalize',
            }}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity chart
// ─────────────────────────────────────────────────────────────────────────────

function ActivityChart({ activity, weekWords }: {
  activity: { day: string; words: number; isToday: boolean }[];
  weekWords: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...activity.map(d => d.words), 1);

  return (
    <div className="glass-raised" style={{ borderRadius: 'var(--r-lg)', padding: '16px 18px', marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>Writing Activity</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-4)', marginTop: 1 }}>Words per day this week, from your documents</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 'var(--r-sm)', background: 'var(--accent-subtle)', border: '1px solid var(--accent-subtle2)' }}>
          <Activity size={11} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--accent)' }}>{fmtWords(weekWords)} this week</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
        {activity.map((d, i) => (
          <div
            key={d.day}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end', cursor: 'default', position: 'relative' }}
          >
            {/* Tooltip */}
            {hovered === i && d.words > 0 && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 2px)',
                background: 'var(--surface-2)', border: '1px solid var(--border-med)',
                borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600,
                color: 'var(--text)', whiteSpace: 'nowrap', boxShadow: 'var(--sh-sm)',
                pointerEvents: 'none', zIndex: 10,
              }}>
                {fmtWords(d.words)}
              </div>
            )}
            <div style={{
              width: '100%', borderRadius: 5,
              background:  d.words === 0 ? 'var(--bg-deep)' : d.isToday ? 'var(--accent)' : 'var(--accent-subtle2)',
              height:      `${Math.max((d.words / max) * 100, d.words === 0 ? 4 : 8)}%`,
              boxShadow:   d.isToday ? '0 2px 8px var(--accent-glow)' : 'none',
              transition:  'height 0.3s cubic-bezier(0.34,1.2,0.64,1)',
              transform:   hovered === i ? 'scaleX(0.88)' : 'scaleX(1)',
            }} />
            <span style={{ fontSize: 10, color: d.isToday ? 'var(--accent)' : 'var(--text-4)', fontWeight: d.isToday ? 700 : 400 }}>
              {d.day}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main dashboard
// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();

  const [docs,     setDocs]     = useState<Doc[]>([...SEED_ARTICLES, ...SEED_BLOGS]);
  const [isDark,   setIsDark]   = useState(false);
  const [activeNav, setActiveNav] = useState<'home' | 'articles' | 'blogs'>('home');
  const [showCmd,  setShowCmd]  = useState(false);
  const [notifs,   setNotifs]   = useState<Notif[]>(SEED_NOTIFS);
  const [toast,    setToast]    = useState<string | null>(null);
  const [sortBy,   setSortBy]   = useState<SortKey>('date');
  const [filter,   setFilter]   = useState<FilterStatus>('all');
  const [ctxMenu,  setCtxMenu]  = useState<CtxPos | null>(null);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const notifRef   = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // ── Theme init from localStorage ──────────────────────────────────────────
  useEffect(() => {
    try { const d = localStorage.getItem('cs-dark'); if (d !== null) setIsDark(d === 'true'); } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // ── Global keyboard shortcuts ─────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 'k') { e.preventDefault(); setShowCmd(c => !c); }
      if (e.key === 'Escape')   { setShowCmd(false); setCtxMenu(null); setShowNotifPanel(false); setShowAccountMenu(false); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!notifRef.current?.contains(e.target as Node))   setShowNotifPanel(false);
      if (!accountRef.current?.contains(e.target as Node)) setShowAccountMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Document actions ──────────────────────────────────────────────────────
  const toggleStar = useCallback((id: string) => {
    setDocs(ds => ds.map(d => d.id === id ? { ...d, starred: !d.starred } : d));
    const doc = docs.find(d => d.id === id);
    if (doc) showToast(doc.starred ? 'Removed from starred' : 'Added to starred');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs]);

  const deleteDoc = useCallback((id: string) => {
    const doc = docs.find(d => d.id === id);
    setDocs(ds => ds.filter(d => d.id !== id));
    if (doc) showToast(`Deleted "${doc.title.slice(0, 30)}…"`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs]);

  const showToast = useCallback((msg: string) => { setToast(msg); }, []);

  // ── Command handler ───────────────────────────────────────────────────────
  const handleCommand = useCallback((id: string) => {
    if (id === 'theme')       { toggleTheme(); }
    else if (id === 'new-doc' || id === 'open-editor') { router.push('/editor'); }
    else if (id === 'go-articles') { setActiveNav('articles'); }
    else if (id === 'go-blogs')    { setActiveNav('blogs'); }
    else if (id === 'go-overview') { setActiveNav('home'); }
    else if (id === 'settings')    { showToast('Account settings coming soon'); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const toggleTheme = useCallback(() => {
    setIsDark(d => { const nd = !d; localStorage.setItem('cs-dark', String(nd)); return nd; });
  }, []);

  // ── Derived metrics (all from docs) ──────────────────────────────────────
  const articles     = useMemo(() => docs.filter(d => d.type === 'article'), [docs]);
  const blogs        = useMemo(() => docs.filter(d => d.type === 'blog'), [docs]);
  const totalWords   = useMemo(() => docs.reduce((s, d) => s + d.words, 0), [docs]);
  const published    = useMemo(() => docs.filter(d => d.status === 'published').length, [docs]);
  const drafts       = useMemo(() => docs.filter(d => d.status === 'draft').length, [docs]);
  const starredDocs  = useMemo(() => docs.filter(d => d.starred), [docs]);
  const activity     = useMemo(() => computeActivity(docs), [docs]);
  const weekWords    = useMemo(() => activity.reduce((s, d) => s + d.words, 0), [activity]);
  const unreadCount  = useMemo(() => notifs.filter(n => !n.read).length, [notifs]);
  const avgReadTime  = useMemo(() => {
    if (!docs.length) return 0;
    return Math.round(docs.reduce((s, d) => s + d.readTime, 0) / docs.length);
  }, [docs]);

  // Sorted + filtered lists
  const sortedArticles = useMemo(() => filterDocs(sortDocs(articles, sortBy), filter), [articles, sortBy, filter]);
  const sortedBlogs    = useMemo(() => filterDocs(sortDocs(blogs, sortBy), filter), [blogs, sortBy, filter]);

  // ── Context menu handler ──────────────────────────────────────────────────
  const handleContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setCtxMenu({ docId: id, x: rect.left, y: rect.bottom + 4 });
  }, []);

  // Shared separator
  const sep = { width: 1, height: 18, background: 'var(--border-med)', margin: '0 2px', flexShrink: 0 } as const;

  return (
    <div className={`app-bg ${isDark ? 'dark' : ''}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <header
        id="app-header"
        className="app-header glass glass-rim flex items-center flex-shrink-0"
        style={{ height: 52, padding: '0 12px', borderRadius: 0, borderBottom: '1px solid var(--border-med)', gap: 2, position: 'sticky', top: 0, zIndex: 50 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 select-none" style={{ marginRight: 2 }}>
          <Image src="/logo.svg" alt="Carcino" width={18} height={22} priority />
          <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>
            Carcino <span style={{ color: 'var(--accent)' }}>Scribe</span>
          </span>
        </div>

        <div style={sep} />

        {/* Search bar */}
        <button
          className="tb-btn"
          onClick={() => setShowCmd(true)}
          title="Search or command (Ctrl+K)"
          style={{ gap: 7, padding: '5px 10px', borderRadius: 8 }}
        >
          <Search size={13} strokeWidth={1.8} />
          <span className="hidden sm:inline" style={{ fontSize: 12, color: 'var(--text-4)', fontWeight: 400, whiteSpace: 'nowrap' }}>
            Search or command…
          </span>
          <kbd style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 4, background: 'var(--bg-deep)', border: '1px solid var(--border-med)', color: 'var(--text-4)', lineHeight: 1.6, flexShrink: 0, marginLeft: 2 }}>
            ⌘K
          </kbd>
        </button>

        <div style={{ flex: 1 }} />

        <div className="flex items-center gap-0.5">
          {/* Notifications */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              className="tb-btn"
              title="Notifications"
              onClick={() => { setShowNotifPanel(o => !o); setShowAccountMenu(false); }}
              style={{
                position: 'relative',
                background: showNotifPanel ? 'var(--accent-subtle2)' : undefined,
                color: showNotifPanel ? 'var(--accent)' : undefined,
              }}
            >
              <Bell size={15} strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  minWidth: 7, height: 7, borderRadius: 99,
                  background: 'var(--accent)', border: '1.5px solid var(--bg)',
                  fontSize: 8, fontWeight: 700, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifPanel && (
              <NotifPanel
                notifs={notifs}
                onMarkAllRead={() => { setNotifs(ns => ns.map(n => ({ ...n, read: true }))); showToast('All notifications marked as read'); }}
                onClose={() => setShowNotifPanel(false)}
              />
            )}
          </div>

          {/* Theme */}
          <button className="tb-btn" onClick={toggleTheme} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {isDark ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
          </button>

          <div style={sep} />

          {/* New document */}
          <Link href="/editor">
            <button
              className="tb-btn"
              style={{
                background: 'var(--accent)', color: '#fff',
                padding: '5px 13px', borderRadius: 8,
                fontWeight: 600, fontSize: 12.5, gap: 5,
                boxShadow: '0 1px 8px var(--accent-glow)',
              }}
            >
              <Plus size={13} strokeWidth={2.5} />
              <span className="hidden sm:inline">New</span>
            </button>
          </Link>

          <div style={sep} />

          {/* Account chip */}
          <div ref={accountRef} style={{ position: 'relative' }}>
            <button
              className="tb-btn"
              onClick={() => { setShowAccountMenu(o => !o); setShowNotifPanel(false); }}
              style={{
                gap: 7, padding: '4px 8px 4px 5px', borderRadius: 8,
                background: showAccountMenu ? 'var(--accent-subtle2)' : undefined,
                color: showAccountMenu ? 'var(--accent)' : undefined,
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.02em',
              }}>CF</div>
              <span className="hidden md:block" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>Carcino</span>
              <ChevronDown size={11} strokeWidth={2.5} style={{ color: 'var(--text-4)' }} />
            </button>
            {showAccountMenu && (
              <AccountMenu
                onClose={() => setShowAccountMenu(false)}
                onToast={showToast}
              />
            )}
          </div>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1 }}>

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside
          className="sidebar-col"
          style={{
            width: 210, flexShrink: 0,
            borderRight: '1px solid var(--border-med)',
            padding: '18px 10px',
            display: 'flex', flexDirection: 'column', gap: 3,
            position: 'sticky', top: 52, height: 'calc(100vh - 52px)', overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 8px 6px' }}>
            Workspace
          </div>

          {([
            { id: 'home',     label: 'Overview',   icon: Home,     count: null },
            { id: 'articles', label: 'Articles',   icon: FileText, count: articles.length },
            { id: 'blogs',    label: 'Blog Posts', icon: BookOpen, count: blogs.length },
          ] as const).map(item => {
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className="outline-item"
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '7px 10px', borderRadius: 'var(--r-sm)', border: 'none',
                  background: active ? 'var(--accent-subtle2)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-3)',
                  cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  transition: 'all 0.12s', textAlign: 'left', width: '100%',
                }}
              >
                <item.icon size={13} strokeWidth={active ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.count !== null && (
                  <span style={{
                    fontSize: 10.5, fontWeight: 600, borderRadius: 99, padding: '1px 7px',
                    background: active ? 'var(--accent)' : 'var(--bg-deep)',
                    color:      active ? '#fff' : 'var(--text-4)',
                    flexShrink: 0,
                  }}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}

          <div style={{ height: 1, background: 'var(--border)', margin: '8px 4px' }} />

          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 8px 4px' }}>
            Starred
          </div>

          {starredDocs.length === 0 && (
            <p style={{ fontSize: 11.5, color: 'var(--text-4)', padding: '4px 10px', margin: 0, lineHeight: 1.5 }}>
              Star a document to pin it here.
            </p>
          )}

          {starredDocs.map(doc => (
            <button
              key={doc.id}
              className="outline-item"
              onClick={() => router.push('/editor')}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '5px 10px',
                borderRadius: 'var(--r-sm)', border: 'none', background: 'transparent',
                color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 12, width: '100%', textAlign: 'left',
              }}
            >
              <Star size={11} fill="var(--accent)" stroke="none" style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {doc.title.length > 22 ? doc.title.slice(0, 22) + '…' : doc.title}
              </span>
            </button>
          ))}

          <div style={{ flex: 1 }} />

          {/* Open Editor CTA */}
          <Link href="/editor" style={{ textDecoration: 'none' }}>
            <button
              className="tb-btn"
              style={{
                width: '100%', justifyContent: 'flex-start', gap: 7,
                padding: '8px 12px', borderRadius: 'var(--r-md)',
                border: '1px solid var(--border-med)',
                background: 'var(--accent-subtle)', color: 'var(--accent)',
                fontWeight: 600, fontSize: 12.5,
              }}
            >
              <PenTool size={12} strokeWidth={2.2} />
              Open Editor
              <ArrowRight size={11} style={{ marginLeft: 'auto' }} />
            </button>
          </Link>
        </aside>

        {/* ── Main ─────────────────────────────────────────────────────── */}
        <main style={{ flex: 1, padding: '26px 28px', overflowY: 'auto', minWidth: 0 }}>

          {/* Page heading */}
          <div style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 21, fontWeight: 700, color: 'var(--text)', margin: '0 0 3px', letterSpacing: '-0.025em' }}>
                {activeNav === 'home' ? 'Overview' : activeNav === 'articles' ? 'Articles' : 'Blog Posts'}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-4)', margin: 0 }}>
                {activeNav === 'home'
                  ? `${docs.length} documents · ${fmtWords(totalWords)} total words`
                  : activeNav === 'articles'
                  ? `${articles.length} articles · ${articles.filter(a => a.status === 'published').length} published`
                  : `${blogs.length} blog posts · ${blogs.filter(b => b.status === 'published').length} published`}
              </p>
            </div>

            {activeNav !== 'home' && (
              <Link href="/editor">
                <button
                  className="tb-btn"
                  style={{
                    background: 'var(--accent)', color: '#fff',
                    padding: '7px 14px', borderRadius: 'var(--r-md)',
                    fontWeight: 600, fontSize: 13, gap: 6, flexShrink: 0,
                    boxShadow: '0 1px 8px var(--accent-glow)',
                  }}
                >
                  <Plus size={14} strokeWidth={2.5} />
                  New {activeNav === 'articles' ? 'Article' : 'Blog Post'}
                </button>
              </Link>
            )}
          </div>

          {/* ── Overview ─────────────────────────────────────────────── */}
          {activeNav === 'home' && (
            <>
              {/* Stats row — all computed from docs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
                <StatCard
                  label="Total Words"  value={fmtWords(totalWords)}
                  sub={`across ${docs.length} documents`}
                  icon={BarChart2} accent
                />
                <StatCard
                  label="This Week"    value={fmtWords(weekWords)}
                  sub="words written"
                  icon={TrendingUp}
                  onClick={() => {}}
                />
                <StatCard
                  label="Published"    value={published}
                  sub={`${drafts} draft${drafts !== 1 ? 's' : ''} remaining`}
                  icon={Award}
                  onClick={() => setActiveNav('articles')}
                />
                <StatCard
                  label="Avg Read Time" value={`${avgReadTime}m`}
                  sub="per document"
                  icon={Clock}
                />
              </div>

              {/* Activity chart — bars derived from doc dates */}
              <ActivityChart activity={activity} weekWords={weekWords} />

              {/* Recent docs — 2-col preview */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Recent articles */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={13} strokeWidth={2} style={{ color: 'var(--accent)' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Articles</span>
                    </div>
                    <button className="tb-btn" onClick={() => setActiveNav('articles')} style={{ fontSize: 11.5, gap: 2, color: 'var(--accent)' }}>
                      View all <ChevronRight size={11} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {articles.slice(0, 2).map(doc => (
                      <DocCard key={doc.id} doc={doc} onStar={toggleStar} onContextMenu={handleContextMenu} />
                    ))}
                  </div>
                </div>

                {/* Recent blogs */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <BookOpen size={13} strokeWidth={2} style={{ color: 'var(--text-4)' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Blog Posts</span>
                    </div>
                    <button className="tb-btn" onClick={() => setActiveNav('blogs')} style={{ fontSize: 11.5, gap: 2, color: 'var(--accent)' }}>
                      View all <ChevronRight size={11} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {blogs.slice(0, 2).map(doc => (
                      <DocCard key={doc.id} doc={doc} onStar={toggleStar} onContextMenu={handleContextMenu} />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Articles list ─────────────────────────────────────────── */}
          {activeNav === 'articles' && (
            <>
              <SortFilterBar sortBy={sortBy} setSortBy={setSortBy} filter={filter} setFilter={setFilter} total={articles.length} />
              {sortedArticles.length === 0 ? (
                <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-4)' }}>
                  <FileText size={32} strokeWidth={1.2} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No articles found</div>
                  <div style={{ fontSize: 12 }}>Try changing the filter, or write something new.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sortedArticles.map(doc => (
                    <DocCard key={doc.id} doc={doc} onStar={toggleStar} onContextMenu={handleContextMenu} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Blogs list ────────────────────────────────────────────── */}
          {activeNav === 'blogs' && (
            <>
              <SortFilterBar sortBy={sortBy} setSortBy={setSortBy} filter={filter} setFilter={setFilter} total={blogs.length} />
              {sortedBlogs.length === 0 ? (
                <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-4)' }}>
                  <BookOpen size={32} strokeWidth={1.2} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No blog posts found</div>
                  <div style={{ fontSize: 12 }}>Try changing the filter, or start a new post.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sortedBlogs.map(doc => (
                    <DocCard key={doc.id} doc={doc} onStar={toggleStar} onContextMenu={handleContextMenu} />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ── Overlays ─────────────────────────────────────────────────────── */}
      {showCmd && (
        <CommandPalette docs={docs} onClose={() => setShowCmd(false)} onCommand={handleCommand} />
      )}

      {ctxMenu && (
        <DocContextMenu
          pos={ctxMenu}
          docs={docs}
          onStar={toggleStar}
          onDelete={deleteDoc}
          onOpen={() => router.push('/editor')}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {toast && (
        <Toast message={toast} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
