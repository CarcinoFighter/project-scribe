'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Loader2, Target } from 'lucide-react';
import type { DocumentStats, ViewMode } from '@/types';

interface Props {
  stats: DocumentStats;
  cursorLine: number;
  cursorCol: number;
  isSaved: boolean;
  viewMode: ViewMode;
  wordGoal: number;
  goalCelebrated?: boolean;
  onSetWordGoal: (g: number) => void;
}

function GoalRing({ words, goal }: { words: number; goal: number }) {
  const R = 10;
  const C = 2 * Math.PI * R;
  const pct = Math.min(words / goal, 1);
  const offset = C * (1 - pct);
  const done = pct >= 1;

  return (
    <svg width="26" height="26" viewBox="0 0 26 26" style={{ flexShrink: 0 }}>
      <circle cx="13" cy="13" r={R} fill="none" stroke="var(--border-strong)" strokeWidth="2.5" />
      <circle
        cx="13" cy="13" r={R}
        fill="none"
        stroke={done ? '#4ade80' : 'var(--accent)'}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={offset}
        className="goal-ring"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '13px 13px' }}
      />
      {done && (
        <text x="13" y="17" textAnchor="middle" fontSize="10" fill="#4ade80" fontWeight="700">!</text>
      )}
    </svg>
  );
}

export default function StatusBar({ stats, cursorLine, cursorCol, isSaved, viewMode, wordGoal, goalCelebrated = false, onSetWordGoal }: Props) {
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput,   setGoalInput]   = useState('');

  const openGoal = () => {
    setGoalInput(wordGoal > 0 ? String(wordGoal) : '');
    setEditingGoal(true);
  };
  const commitGoal = () => {
    const n = parseInt(goalInput, 10);
    if (!isNaN(n) && n > 0) onSetWordGoal(n);
    else if (goalInput === '0' || goalInput === '') onSetWordGoal(0);
    setEditingGoal(false);
  };

  const goalModal = editingGoal ? createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(10,6,20,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={() => setEditingGoal(false)}
    >
      <div
        className="glass-overlay scale-in"
        style={{ borderRadius: 18, padding: '28px 32px', width: 300 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.02em' }}>
          Set word goal
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>
          Track your progress with a ring in the status bar.
        </div>
        <input
          autoFocus
          type="number"
          value={goalInput}
          onChange={e => setGoalInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commitGoal(); if (e.key === 'Escape') setEditingGoal(false); }}
          placeholder="e.g. 500"
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            background: 'var(--surface-1)', border: '1.5px solid var(--border-strong)',
            fontFamily: 'inherit', fontSize: 15, color: 'var(--text)', outline: 'none',
            marginBottom: 14,
          }}
        />
        <div className="flex gap-2">
          <button
            onClick={commitGoal}
            style={{
              flex: 1, padding: '9px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'var(--accent)', color: '#fff', fontFamily: 'inherit', fontWeight: 600, fontSize: 13.5,
            }}
          >
            Set goal
          </button>
          <button
            onClick={() => { onSetWordGoal(0); setEditingGoal(false); }}
            style={{
              padding: '9px 16px', borderRadius: 10, border: '1px solid var(--border-strong)',
              cursor: 'pointer', background: 'none', fontFamily: 'inherit', fontSize: 13.5, color: 'var(--text-3)',
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      {goalModal}
      <footer
        id="tour-statusbar"
        className="status-bar glass glass-rim flex items-center gap-3 px-4 flex-shrink-0"
        style={{ height: 30, borderTop: '1px solid var(--border-med)', borderRadius: 0, overflowX: 'auto' }}
      >
        {/* Word goal ring + count (clickable) */}
        <button
          onClick={openGoal}
          className="flex items-center gap-1.5"
          title="Click to set word goal"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, flexShrink: 0 }}
        >
          {wordGoal > 0 ? (
            <span style={{ filter: goalCelebrated ? 'drop-shadow(0 0 6px #4ade80)' : 'none', transition: 'filter 0.4s' }}>
              <GoalRing words={stats.words} goal={wordGoal} />
            </span>
          ) : (
            <Target size={12} strokeWidth={2} style={{ color: 'var(--text-4)' }} />
          )}
          <span style={{ fontSize: 12, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
            {stats.words.toLocaleString()}
            {wordGoal > 0 && (
              <span style={{ color: 'var(--text-4)' }}>/{wordGoal.toLocaleString()}</span>
            )}
            <span className="hidden sm:inline" style={{ color: 'var(--text-4)', marginLeft: 2 }}>w</span>
          </span>
        </button>

      {/* Separator */}
      <div className="toolbar-sep" />

      {/* Other stats */}
      <span style={{ fontSize: 12, color: 'var(--text-4)', fontVariantNumeric: 'tabular-nums' }}>
        {stats.chars.toLocaleString()}<span className="hidden sm:inline" style={{ marginLeft: 2 }}>ch</span>
      </span>
      <span style={{ fontSize: 12, color: 'var(--text-4)', fontVariantNumeric: 'tabular-nums' }}>
        {stats.readingTime}min read
      </span>
      <span style={{ fontSize: 12, color: 'var(--text-4)' }}>
        {stats.lines.toLocaleString()}<span className="hidden sm:inline" style={{ marginLeft: 2 }}>ln</span>
      </span>

      <div className="flex-1" />

      {/* Cursor */}
      <span style={{ fontSize: 12, color: 'var(--text-4)', fontVariantNumeric: 'tabular-nums' }}>
        {cursorLine}:{cursorCol}
      </span>

      <div className="toolbar-sep" />

      {/* View label */}
      <span className="hidden md:inline" style={{ fontSize: 11.5, color: 'var(--text-4)' }}>
        {viewMode === 'split' ? 'Split' : viewMode === 'editor' ? 'Editor' : 'Preview'}
      </span>

      <div className="toolbar-sep" />

      {/* Save state */}
      <span className="flex items-center gap-1" style={{ fontSize: 12, color: isSaved ? 'var(--accent)' : 'var(--text-4)' }}>
        {isSaved
          ? <><Check size={11} strokeWidth={2.5} /><span className="hidden sm:inline">Saved</span></>
          : <><Loader2 size={11} strokeWidth={2.5} className="animate-spin" /><span className="hidden sm:inline">Saving...</span></>
        }
      </span>

      {/* Lang badge */}
      <span
        className="hidden sm:inline"
        style={{
          fontSize: 10.5, padding: '1px 7px', borderRadius: 99,
          background: 'var(--accent-subtle2)', color: 'var(--accent)', fontWeight: 600,
        }}
      >
        MD
      </span>
    </footer>
    </>
  );
}
