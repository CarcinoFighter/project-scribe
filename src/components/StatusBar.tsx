'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Loader2, Target, Eye, Edit3 } from 'lucide-react';
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
  isMobile?: boolean;
  onToggleView?: () => void;
}

function GoalRing({ words, goal }: { words: number; goal: number }) {
  const R = 10;
  const C = 2 * Math.PI * R;
  const pct = Math.min(words / goal, 1);
  const offset = C * (1 - pct);
  const done = pct >= 1;

  return (
    <svg width="24" height="24" viewBox="0 0 26 26" style={{ flexShrink: 0 }}>
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

export default function StatusBar({ stats, cursorLine, cursorCol, isSaved, viewMode, wordGoal, goalCelebrated = false, onSetWordGoal, isMobile, onToggleView }: Props) {
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

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
    <div className="db-overlay" onClick={() => setEditingGoal(false)}>
      <div className="db-modal" style={{ maxWidth: '300px' }} onClick={e => e.stopPropagation()}>
        <div className="db-page-title" style={{ fontSize: '16px', marginBottom: '6px' }}>
          Set word goal
        </div>
        <div className="db-cap mb-4 opacity-70">
          Track your progress with a ring in the status bar.
        </div>
        <input
          autoFocus
          type="number"
          value={goalInput}
          onChange={e => setGoalInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commitGoal(); if (e.key === 'Escape') setEditingGoal(false); }}
          placeholder="e.g. 500"
          className="db-inp mb-4"
        />
        <div className="flex gap-2">
          <button onClick={commitGoal} className="db-btn flex-1 justify-center">
            Set goal
          </button>
          <button onClick={() => { onSetWordGoal(0); setEditingGoal(false); }} className="db-ghost">
            Clear
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  if (isMobile) {
    return (
      <>
        {goalModal}
        <footer className="status-bar" style={{ height: '44px', borderTop: '1px solid var(--rule)', padding: '0 12px' }}>
          <button onClick={openGoal} className="flex items-center gap-2" style={{ background: 'none', border: 'none', padding: 0 }}>
            {wordGoal > 0 ? (
              <span style={{ filter: goalCelebrated ? 'drop-shadow(0 0 6px #4ade80)' : 'none' }}>
                <GoalRing words={stats.words} goal={wordGoal} />
              </span>
            ) : (
              <Target size={16} style={{ color: 'var(--mid)' }} />
            )}
            <span className="db-cap" style={{ fontSize: '11px' }}>
              {stats.words.toLocaleString()}
              {wordGoal > 0 && <span className="opacity-50">/{wordGoal.toLocaleString()}</span>}
            </span>
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <span className="db-cap" style={{ fontSize: '10px' }}>
              {stats.readingTime}min
            </span>
            
            <button
              onClick={onToggleView}
              className="flex items-center gap-1 px-2 py-1 bg-[var(--cream)] border border-[var(--rule)]"
            >
              {viewMode === 'editor' ? <Eye size={12} /> : <Edit3 size={12} />}
              <span className="db-cap text-[9px]">{viewMode === 'editor' ? 'PREV' : 'EDIT'}</span>
            </button>

            <span className={isSaved ? 'text-[var(--accent)]' : 'text-[var(--mid)]'}>
              {isSaved ? <Check size={14} /> : <Loader2 size={14} className="animate-spin" />}
            </span>
          </div>
        </footer>
      </>
    );
  }

  return (
    <>
      {goalModal}
      <footer id="tour-statusbar" className="status-bar" style={{ height: '28px', borderTop: '1px solid var(--rule)' }}>
        <button onClick={openGoal} className="flex items-center gap-1.5" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          {wordGoal > 0 ? (
            <span style={{ filter: goalCelebrated ? 'drop-shadow(0 0 6px #4ade80)' : 'none', transition: 'filter 0.4s' }}>
              <GoalRing words={stats.words} goal={wordGoal} />
            </span>
          ) : (
            <Target size={12} strokeWidth={2} style={{ color: 'var(--mid)' }} />
          )}
          <span className="db-cap" style={{ fontSize: '10px' }}>
            {stats.words.toLocaleString()}
            {wordGoal > 0 && <span className="opacity-50">/{wordGoal.toLocaleString()}</span>}
            <span className="hidden sm:inline ml-1">w</span>
          </span>
        </button>

        <div className="db-vr mx-2" />

        <span className="db-cap hidden sm:block" style={{ fontSize: '10px' }}>
          {stats.chars.toLocaleString()}<span className="opacity-50 ml-1">ch</span>
        </span>
        <span className="db-cap ml-3" style={{ fontSize: '10px' }}>
          {stats.readingTime}min read
        </span>
        <span className="db-cap ml-3 hidden md:block" style={{ fontSize: '10px' }}>
          {stats.lines.toLocaleString()}<span className="opacity-50 ml-1">ln</span>
        </span>

        <div className="flex-1" />

        <span className="db-cap hidden sm:block" style={{ fontSize: '10px' }}>
          {cursorLine}:{cursorCol}
        </span>

        <div className="db-vr mx-2 hidden sm:block" />

        <span className="db-cap hidden md:block" style={{ fontSize: '10px' }}>
          {viewMode === 'split' ? 'SPLIT' : viewMode === 'editor' ? 'EDITOR' : 'PREVIEW'}
        </span>

        <div className="db-vr mx-2" />

        <span className="flex items-center gap-1" style={{ color: isSaved ? 'var(--accent)' : 'var(--mid)', transition: 'color 0.2s' }}>
          {isSaved
            ? <><Check size={11} strokeWidth={2.5} /><span className="hidden sm:inline db-cap ml-1" style={{ fontSize: '10px' }}>Saved</span></>
            : <><Loader2 size={11} strokeWidth={2.5} className="animate-spin" /><span className="hidden sm:inline db-cap ml-1" style={{ fontSize: '10px' }}>Saving...</span></>
          }
        </span>

        <span className="hidden sm:inline db-cap ml-2" style={{ fontSize: '9px', padding: '1px 6px', background: 'var(--accent-dim)', color: 'var(--accent)' }}>
          MD
        </span>
      </footer>
    </>
  );
}