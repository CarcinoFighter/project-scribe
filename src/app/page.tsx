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
interface Notif { id: string; title: string; body: string; time: string; read: boolean; }
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const DASH_STYLES = `
  /* ─────────────────────────────────────────────────────────────
     TOKENS  (mirrors login page exactly)
  ───────────────────────────────────────────────────────────── */
  :root {
    --ink:        #0e0c10;
    --paper:      #f8f5fc;
    --cream:      #ede8f5;
    --mid:        #9e97ab;
    --rule:       rgba(90,60,140,0.13);
    --accent:     #9875c1;
    --accent-dim: rgba(152,117,193,0.12);
    --accent-sub: rgba(152,117,193,0.07);
    --tape-bg:    #1c1528;
    --ff-display: 'Google Sans Flex';
    --ff-ui:      'Google Sans Flex';
  }
  html.dark, [data-theme*="dark"] {
    --ink:        #eee8f8;
    --paper:      #110f17;
    --cream:      #1d1828;
    --mid:        #6b647a;
    --rule:       rgba(152,117,193,0.14);
    --accent:     #b090d8;
    --accent-dim: rgba(176,144,216,0.14);
    --accent-sub: rgba(176,144,216,0.07);
    --tape-bg:    #0c0a12;
  }

  /* ─────────────────────────────────────────────────────────────
     GLOBAL RESET — no border-radius anywhere
  ───────────────────────────────────────────────────────────── */
  *, *::before, *::after {
    box-sizing: border-box;
    border-radius: 0 !important;   /* absolute zero — overrides everything */
  }

  /* ─────────────────────────────────────────────────────────────
     BASE
  ───────────────────────────────────────────────────────────── */
  .db-root {
    font-family: var(--ff-ui);
    background: var(--paper);
    color: var(--ink);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* ─────────────────────────────────────────────────────────────
     TYPOGRAPHY
  ───────────────────────────────────────────────────────────── */
  .db-display {
    font-family: var(--ff-display);
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1;
    color: var(--ink);
  }
  /* Small-caps mono label — used everywhere for section names,
     counts, timestamps, status tags */
  .db-cap {
    font-family: var(--ff-ui);
    font-size: 8.5px;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--mid);
  }

  /* ─────────────────────────────────────────────────────────────
     HEADER — newspaper masthead with triple rule
  ───────────────────────────────────────────────────────────── */
  .db-header {
    height: 42px;
    display: flex;
    align-items: center;
    padding: 0 22px;
    position: sticky;
    top: 0;
    z-index: 50;
    background: var(--paper);
    /* Triple rule: thin / thick / thin  (login page motif) */
    border-bottom: 1px solid var(--rule);
    box-shadow:
      0 1.5px 0 var(--rule),
      0 1px   0 var(--ink),
      0 2.5px 0 var(--rule);
  }

  /* Vertical divider between header sections */
  .db-vr {
    width: 1px;
    height: 16px;
    background: var(--rule);
    margin: 0 12px;
    flex-shrink: 0;
  }

  /* ─────────────────────────────────────────────────────────────
     SEARCH TRIGGER
  ───────────────────────────────────────────────────────────── */
  .db-search {
    display: flex; align-items: center; gap: 7px;
    padding: 4px 10px;
    border: 1px solid var(--rule);
    background: transparent;
    cursor: pointer;
    font-family: var(--ff-ui);
    font-size: 9.5px;
    letter-spacing: 0.08em;
    color: var(--mid);
    transition: border-color 0.15s, color 0.15s;
  }
  .db-search:hover { border-color: var(--accent); color: var(--accent); }

  /* ─────────────────────────────────────────────────────────────
     ICON BUTTON  (bell, theme toggle)
  ───────────────────────────────────────────────────────────── */
  .db-icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px;
    background: none;
    border: 1px solid transparent;
    cursor: pointer;
    color: var(--mid);
    transition: border-color 0.15s, color 0.15s;
    position: relative;
    font-family: var(--ff-ui);
  }
  .db-icon-btn:hover,
  .db-icon-btn.active { border-color: var(--rule); color: var(--ink); }

  /* ─────────────────────────────────────────────────────────────
     GHOST BUTTON  (secondary: "Mark read", account, close)
  ───────────────────────────────────────────────────────────── */
  .db-ghost {
    display: inline-flex; align-items: center; gap: 5px;
    background: none;
    border: 1px solid var(--rule);
    cursor: pointer;
    padding: 4px 10px;
    font-family: var(--ff-ui);
    font-size: 8.5px;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--mid);
    transition: border-color 0.15s, color 0.15s;
    text-decoration: none;
  }
  .db-ghost:hover { border-color: var(--accent); color: var(--accent); }

  /* ─────────────────────────────────────────────────────────────
     PRIMARY BUTTON  (cut-corner + purple slide-fill)
  ───────────────────────────────────────────────────────────── */
  .db-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 7px 14px;
    background: var(--ink);
    color: var(--paper);
    border: none;
    cursor: pointer;
    font-family: var(--ff-ui);
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    /* cut top-right corner — login page motif */
    clip-path: polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 0 100%);
    position: relative;
    overflow: hidden;
    text-decoration: none;
    white-space: nowrap;
    transition: opacity 0.15s;
  }
  .db-btn::before {
    content: '';
    position: absolute; inset: 0;
    background: var(--accent);
    transform: translateX(-105%);
    transition: transform 0.28s cubic-bezier(0.22,1,0.36,1);
  }
  .db-btn:hover:not(:disabled)::before { transform: translateX(0); }
  .db-btn > * { position: relative; z-index: 1; }
  .db-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  /* ─────────────────────────────────────────────────────────────
     SIDEBAR — ruled department index (login page left panel)
  ───────────────────────────────────────────────────────────── */
  .db-sidebar {
    width: 210px;
    flex-shrink: 0;
    border-right: 1px solid var(--rule);
    padding: 14px 0;
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 46px;
    height: calc(100vh - 46px);
    overflow-y: auto;
    background: var(--paper);
  }

  .db-sidebar-label {
    padding: 0 20px 7px;
    font-family: var(--ff-ui);
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--ink);
    opacity: 0.9;
  }

  /* Each nav row: left-border active indicator, no bg pill */
  .db-nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 7px 20px;
    border: none;
    border-left: 2px solid transparent;
    border-top: 1px solid var(--rule);
    background: transparent;
    color: var(--ink);
    cursor: pointer;
    font-family: var(--ff-ui);
    font-size: 9.5px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-align: left;
    width: 100%;
    transition: color 0.12s, border-color 0.12s, background 0.12s;
    text-decoration: none;
  }
  .db-nav-item:hover { color: var(--ink); background: rgba(152,117,193,0.06); }
  .db-nav-item.active {
    color: var(--accent);
    border-left-color: var(--accent);
    background: transparent;
    font-weight: 600;
    outline: 2px solid var(--accent);
    outline-offset: -1px;
  }

  /* italic serif index numeral — login dept index style */
  .db-nav-num {
    font-family: var(--ff-display);
    font-style: italic;
    font-size: 10px;
    width: 18px;
    flex-shrink: 0;
    color: var(--mid);
    transition: color 0.12s;
  }
  .db-nav-item.active  .db-nav-num,
  .db-nav-item:hover   .db-nav-num { color: var(--accent); }

  .db-sidebar-rule {
    height: 1px;
    background: var(--rule);
    margin: 10px 0;
  }

  .db-starred-row {
    display: flex; align-items: center; gap: 7px;
    padding: 5px 20px;
    background: none; border: none;
    cursor: pointer; width: 100%;
    font-family: var(--ff-ui); font-size: 9.5px; letter-spacing: 0.04em;
    color: var(--mid); text-align: left;
    transition: color 0.12s;
    text-decoration: none;
    border-top: 1px solid var(--rule);
  }
  .db-starred-row:hover { color: var(--ink); }

  /* word goal */
  .db-goal {
    margin: 4px 16px 0;
    padding: 9px 12px;
    border: 1px solid var(--rule);
    border-left: 2px solid var(--accent);
    background: var(--accent-sub);
  }

  /* ─────────────────────────────────────────────────────────────
     MAIN CONTENT
  ───────────────────────────────────────────────────────────── */
  .db-main {
    flex: 1;
    padding: 28px 32px;
    overflow-y: auto;
    min-width: 0;
    background: var(--paper);
  }

  /* Page title — display serif, login h2 scale */
  .db-page-title {
    font-family: var(--ff-display);
    font-size: 34px;
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 0.95;
    color: var(--ink);
    margin: 0;
  }
  .db-page-title em { font-style: italic; color: var(--accent); }

  .db-page-sub {
    font-family: var(--ff-ui);
    font-size: 9.5px;
    letter-spacing: 0.1em;
    color: var(--mid);
    margin: 0;
    text-transform: uppercase;
  }

  /* Horizontal rule divider below headings */
  .db-hr {
    height: 1px;
    background: var(--rule);
    margin: 14px 0 20px;
  }
  /* Triple rule for section breaks */
  .db-triple-rule {
    border: none;
    border-top: 1px solid var(--rule);
    box-shadow: 0 1.5px 0 var(--ink), 0 3px 0 var(--rule);
    margin: 0 0 20px;
    height: 0;
  }

  /* ─────────────────────────────────────────────────────────────
     SORT/FILTER BAR
  ───────────────────────────────────────────────────────────── */
  .db-filter-bar {
    display: flex; align-items: center; gap: 0;
    margin-bottom: 18px;
    border: 1px solid var(--rule);
  }
  .db-filter-btn {
    padding: 5px 12px;
    border: none;
    border-right: 1px solid var(--rule);
    background: none;
    cursor: pointer;
    font-family: var(--ff-ui);
    font-size: 8.5px;
    font-weight: 400;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--mid);
    transition: background 0.12s, color 0.12s;
    white-space: nowrap;
  }
  .db-filter-btn:last-child { border-right: none; }
  .db-filter-btn:hover { color: var(--ink); background: var(--accent-sub); }
  .db-filter-btn.active {
    background: var(--ink);
    color: var(--paper);
  }
  .db-filter-btn.active:hover::before {
    content: '';
    position: absolute; inset: 0;
    background: var(--accent);
  }
  /* Sort section separator */
  .db-filter-spacer {
    flex: 1;
    height: 100%;
    border-right: 1px solid var(--rule);
  }
  .db-filter-label {
    padding: 5px 10px;
    font-family: var(--ff-ui);
    font-size: 8.5px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--mid);
    border-right: 1px solid var(--rule);
    white-space: nowrap;
  }

  /* ─────────────────────────────────────────────────────────────
     NOTIFICATION PANEL
  ───────────────────────────────────────────────────────────── */
  .db-notif-panel {
    position: absolute;
    right: 0; top: calc(100% + 7px);
    width: 300px;
    background: var(--paper);
    border: 1px solid var(--rule);
    border-top: 2px solid var(--accent); /* accent top bar — login card motif */
    z-index: 200;
    overflow: hidden;
  }

  /* ─────────────────────────────────────────────────────────────
     COMMAND PALETTE
  ───────────────────────────────────────────────────────────── */
  .db-cmd-wrap {
    position: fixed;
    top: 10%;
    left: 50%;
    transform: translateX(-50%);
    width: 520px;
    max-width: calc(100vw - 32px);
    background: var(--paper);
    border: 1px solid var(--rule);
    border-top: 2px solid var(--accent);
    z-index: 9990;
    overflow: hidden;
  }
  .db-cmd-item {
    display: flex; align-items: center; gap: 10px;
    width: 100%; padding: 9px 16px;
    background: none;
    border: none;
    border-left: 2px solid transparent;
    border-top: 1px solid var(--rule);
    cursor: pointer;
    font-family: var(--ff-ui); font-size: 10.5px; letter-spacing: 0.03em;
    color: var(--mid); text-align: left;
    transition: background 0.1s, color 0.1s, border-color 0.1s;
  }
  .db-cmd-item:first-child { border-top: none; }
  .db-cmd-item:hover,
  .db-cmd-item.sel {
    background: var(--accent-dim);
    border-left-color: var(--accent);
    color: var(--ink);
  }

  /* ─────────────────────────────────────────────────────────────
     CONTEXT MENU
  ───────────────────────────────────────────────────────────── */
  .db-ctx-menu {
    background: var(--paper);
    border: 1px solid var(--rule);
    border-top: 2px solid var(--accent);
    width: 172px;
    overflow: hidden;
  }
  .db-ctx-item {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 8px 12px;
    background: none;
    border: none;
    border-left: 2px solid transparent;
    border-top: 1px solid var(--rule);
    cursor: pointer;
    font-family: var(--ff-ui); font-size: 9.5px; letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--mid); text-align: left;
    transition: background 0.1s, color 0.1s, border-color 0.1s;
  }
  .db-ctx-item:first-child { border-top: none; }
  .db-ctx-item:hover { background: var(--accent-sub); border-left-color: var(--accent); color: var(--ink); }
  .db-ctx-item.danger { color: #b03030; }
  .db-ctx-item.danger:hover { background: rgba(176,48,48,0.07); border-left-color: #b03030; color: #b03030; }

  /* ─────────────────────────────────────────────────────────────
     MOBILE BOTTOM NAV
  ───────────────────────────────────────────────────────────── */
  .db-mobile-nav {
    display: none;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: var(--paper);
    border-top: 1px solid var(--rule);
    box-shadow: 0 -1.5px 0 var(--ink), 0 -3px 0 var(--rule); /* inverted triple rule */
    z-index: 40;
  }
  .db-mob-inner {
    display: flex; align-items: stretch;
    height: 52px;
  }
  .db-mob-item {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 3px;
    background: none;
    border: none;
    border-right: 1px solid var(--rule);
    cursor: pointer;
    font-family: var(--ff-ui); font-size: 7px;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--mid); transition: color 0.12s, background 0.12s;
    text-decoration: none;
    position: relative;
  }
  .db-mob-item:last-child { border-right: none; }
  .db-mob-item:hover { background: var(--accent-sub); }
  .db-mob-item.active {
    color: var(--accent);
    border-bottom: 2px solid var(--accent);
    background: var(--accent-dim);
  }

  /* ─────────────────────────────────────────────────────────────
     ACCOUNT AVATAR
  ───────────────────────────────────────────────────────────── */
  .db-avatar {
    width: 22px; height: 22px;
    background: var(--accent);
    display: flex; align-items: center; justify-content: center;
    color: var(--paper);
    font-family: var(--ff-ui);
    font-size: 8.5px; font-weight: 500; letter-spacing: 0.06em;
    flex-shrink: 0;
    /* No border-radius — square, like logo container on login */
  }

  /* ─────────────────────────────────────────────────────────────
     NOTIFICATION BADGE  (square dot)
  ───────────────────────────────────────────────────────────── */
  .db-badge {
    position: absolute; top: 4px; right: 4px;
    width: 5px; height: 5px;
    background: var(--accent);
    /* deliberately square — no border-radius */
  }

  /* ─────────────────────────────────────────────────────────────
     KBD CHIP
  ───────────────────────────────────────────────────────────── */
  .db-kbd {
    font-family: var(--ff-ui);
    font-size: 8.5px; letter-spacing: 0.08em;
    padding: 1px 5px;
    border: 1px solid var(--rule);
    color: var(--mid);
    background: var(--cream);
    cursor: pointer;
  }

  /* ─────────────────────────────────────────────────────────────
     TAPE MARQUEE (mobile + desktop footer strip)
  ───────────────────────────────────────────────────────────── */
  .db-tape-bar {
    background: var(--tape-bg);
    overflow: hidden;
    height: 26px;
    display: flex; align-items: center;
    flex-shrink: 0;
  }
  .db-tape { display: flex; width: max-content; animation: db-scroll 28s linear infinite; }

  /* ─────────────────────────────────────────────────────────────
     ANIMATIONS
  ───────────────────────────────────────────────────────────── */
  @keyframes db-scroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  @keyframes db-rise   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes db-blink  { 0%,100%{opacity:1} 50%{opacity:0} }

  .db-rise-0 { animation: db-rise 0.45s 0.00s cubic-bezier(0.22,1,0.36,1) both; }
  .db-rise-1 { animation: db-rise 0.45s 0.06s cubic-bezier(0.22,1,0.36,1) both; }
  .db-rise-2 { animation: db-rise 0.45s 0.12s cubic-bezier(0.22,1,0.36,1) both; }

  /* ─────────────────────────────────────────────────────────────
     RESPONSIVE
  ───────────────────────────────────────────────────────────── */
  @media (max-width: 767px) {
    .db-sidebar     { display: none !important; }
    .db-main        { padding: 18px 16px 80px; }
    .db-mobile-nav  { display: block; }
    .db-search span { display: none; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function NotifPanel({ notifs, onMarkAllRead, onClose }: { notifs: Notif[]; onMarkAllRead: () => void; onClose: () => void; }) {
  const unread = notifs.filter(n => !n.read).length;
  return (
    <div className="db-notif-panel db-rise-0">
      {/* Masthead row */}
      <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={11} strokeWidth={1.8} style={{ color: 'var(--mid)' }} />
          <span style={{ fontFamily: 'var(--ff-ui)', fontSize: 9, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink)' }}>
            Notifications
          </span>
          {unread > 0 && (
            <span style={{ fontFamily: 'var(--ff-ui)', fontSize: 8, fontWeight: 700, background: 'var(--accent)', color: 'var(--paper)', padding: '1px 5px', letterSpacing: '0.08em' }}>
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <button className="db-ghost" onClick={onMarkAllRead} style={{ padding: '2px 7px', fontSize: 8 }}>
            <BellOff size={9} strokeWidth={1.8} /> Mark read
          </button>
        )}
      </div>

      {/* Items */}
      <div style={{ maxHeight: 270, overflowY: 'auto' }}>
        {notifs.map(n => (
          <div key={n.id} style={{
            padding: '9px 14px',
            borderBottom: '1px solid var(--rule)',
            borderLeft: !n.read ? '2px solid var(--accent)' : '2px solid transparent',
            background: !n.read ? 'var(--accent-sub)' : 'transparent',
          }}>
            <div style={{ fontFamily: 'var(--ff-ui)', fontSize: 10.5, fontWeight: 500, color: 'var(--ink)', marginBottom: 2, letterSpacing: '0.02em' }}>{n.title}</div>
            <div style={{ fontFamily: 'var(--ff-ui)', fontSize: 9.5, color: 'var(--mid)', lineHeight: 1.5, marginBottom: 4 }}>{n.body}</div>
            <span className="db-cap">{n.time}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '7px 14px', borderTop: '1px solid var(--rule)' }}>
        <button className="db-ghost" onClick={onClose} style={{ padding: '2px 7px', fontSize: 8 }}>
          Close <ChevronRight size={9} />
        </button>
      </div>
    </div>
  );
}

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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
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
      <style>{DASH_STYLES}</style>

      {/* ══ HEADER — newspaper masthead ══════════════════════════════════════ */}
      <header className="db-header">

        {/* Brand  */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 0, flexShrink: 0, userSelect: 'none' }}>
          <Image src="/logo.svg" alt="Carcino" width={15} height={18} style={{ height: 'auto' }} priority />
          <span style={{ fontFamily: 'var(--ff-display)', fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--ink)' }}>
            Carcino<span className="hidden sm:inline"> Vantage</span>
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
                onMarkAllRead={() => { setNotifs(ns => ns.map(n => ({ ...n, read: true }))); setToast('All read'); }}
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
              {wordGoal > 0 && lsDoc && (
                <>
                  <div className="db-sidebar-rule" />
                  <div className="db-goal">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Target size={10} style={{ color: 'var(--accent)' }} />
                        <span className="db-cap" style={{ color: 'var(--accent)' }}>Word Goal</span>
                      </div>
                      <span className="db-cap" style={{ color: 'var(--accent)' }}>
                        {Math.round((lsDoc.words / wordGoal) * 100)}%
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--ff-ui)', fontSize: 10.5, color: 'var(--ink)', fontWeight: 500, marginBottom: 7, letterSpacing: '0.04em' }}>
                      {lsDoc.words.toLocaleString()} <span style={{ color: 'var(--mid)', fontWeight: 400 }}>/ {wordGoal.toLocaleString()}</span>
                    </div>
                    {/* Flat progress bar — no border-radius */}
                    <div style={{ height: 2, background: 'var(--rule)' }}>
                      <div style={{ height: '100%', background: lsDoc.words >= wordGoal ? '#4ade80' : 'var(--accent)', width: `${Math.min((lsDoc.words / wordGoal) * 100, 100)}%`, transition: 'width 0.4s cubic-bezier(0.34,1.2,0.64,1)' }} />
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
        {/* Tape strip at top of mobile nav */}
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
          {NAV_ITEMS.map(item => {
            const isActive = activeNav === item.id;
            const inner = (
              <>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {item.id === 'home'     && <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />}
                  {item.id === 'articles' && <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></>}
                  {item.id === 'blogs'    && <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>}
                  {item.id === 'tasks'    && <><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>}
                  {item.id === 'team'     && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>}
                </svg>
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
                onClick={() => setActiveNav(item.id as 'home' | 'articles' | 'blogs')}>
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

      {showAccountMenu && accountMenuPos && createPortal(
        <div style={{ position: 'fixed', top: accountMenuPos.top, right: accountMenuPos.right, zIndex: 9960 }} onMouseDown={e => e.stopPropagation()}>
          <AccountMenu user={user} onClose={() => setShowAccountMenu(false)} onToast={showToastMsg} onOpenSettings={() => setShowSettings(true)} />
        </div>,
        document.body
      )}

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