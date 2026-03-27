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
      <circle cx="13" cy="13" r={R} fill="none" stroke="var(--rule)" strokeWidth="2.5" />
      <circle
        cx="13" cy="13" r={R}
        fill="none"
        stroke={done ? '#4ade80' : 'var(--accent)'}
        strokeWidth="2.5"
        strokeLinecap="square"
        strokeDasharray={C}
        strokeDashoffset={offset}
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
      className="db-overlay"
      onClick={() => setEditingGoal(false)}
    >
      <div
        className="db-modal"
        style={{ maxWidth: '300px' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="db-page-title" style={{ fontSize: '16px', marginBottom: '6px' }}>
          Set word goal
        </div>
        <div className="db-cap" style={{ marginBottom: '16px' }}>
          Track your progress with a ring in the status bar.
        </div>
        <input
          autoFocus
          type="number"
          value={goalInput}
          onChange={e => setGoalInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commitGoal(); if (e.key === 'Escape') setEditingGoal(false); }}
          placeholder="e.g. 500"
          className="db-inp"
          style={{ marginBottom: '14px' }}
        />
        <div className="flex gap-2">
          <button
            onClick={commitGoal}
            className="db-btn flex-1 justify-center"
          >
            Set goal
          </button>
          <button
            onClick={() => { onSetWordGoal(0); setEditingGoal(false); }}
            className="db-ghost"
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
        className="status-bar"
        style={{ height: '28px', borderTop: '1px solid var(--rule)' }}
      >
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
            <Target size={12} strokeWidth={2} style={{ color: 'var(--mid)' }} />
          )}
          <span className="db-cap" style={{ fontSize: '10px' }}>
            {stats.words.toLocaleString()}
            {wordGoal > 0 && (
              <span style={{ color: 'var(--mid)' }}>/{wordGoal.toLocaleString()}</span>
            )}
            <span className="hidden sm:inline" style={{ marginLeft: 2 }}>w</span>
          </span>
        </button>

        <div className="db-vr" style={{ margin: '0 8px' }} />

        <span className="db-cap" style={{ fontSize: '10px' }}>
          {stats.chars.toLocaleString()}<span className="hidden sm:inline" style={{ marginLeft: 2 }}>ch</span>
        </span>
        <span className="db-cap" style={{ fontSize: '10px', marginLeft: '12px' }}>
          {stats.readingTime}min read
        </span>
        <span className="db-cap" style={{ fontSize: '10px', marginLeft: '12px' }}>
          {stats.lines.toLocaleString()}<span className="hidden sm:inline" style={{ marginLeft: 2 }}>ln</span>
        </span>

        <div className="flex-1" />

        <span className="db-cap hidden md:inline" style={{ fontSize: '10px' }}>
          {cursorLine}:{cursorCol}
        </span>

        <div className="db-vr hidden md:block" style={{ margin: '0 8px' }} />

        <span className="hidden md:inline db-cap" style={{ fontSize: '10px' }}>
          {viewMode === 'split' ? 'SPLIT' : viewMode === 'editor' ? 'EDITOR' : 'PREVIEW'}
        </span>

        <div className="db-vr" style={{ margin: '0 8px' }} />

        <span className="flex items-center gap-1" style={{ color: isSaved ? 'var(--accent)' : 'var(--mid)', transition: 'color 0.2s' }}>
          {isSaved
            ? <><Check size={11} strokeWidth={2.5} /><span className="hidden sm:inline db-cap" style={{ fontSize: '10px' }}>Saved</span></>
            : <><Loader2 size={11} strokeWidth={2.5} className="animate-spin" /><span className="hidden sm:inline db-cap" style={{ fontSize: '10px' }}>Saving...</span></>
          }
        </span>

        <span
          className="hidden sm:inline db-cap"
          style={{
            fontSize: '9px', padding: '1px 6px', marginLeft: '8px',
            background: 'var(--accent-dim)', color: 'var(--accent)',
          }}
        >
          MD
        </span>
      </footer>
    </>
  );
}