'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Loader2, Target, Eye, Edit3, Clock, Type, Hash, AlignLeft } from 'lucide-react';
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
  collabStatus?: 'offline' | 'connecting' | 'online';
  collaboratorCount?: number;
}

function GoalRing({ words, goal }: { words: number; goal: number }) {
  const R = 8;
  const C = 2 * Math.PI * R;
  const pct = Math.min(words / goal, 1);
  const offset = C * (1 - pct);
  const done = pct >= 1;
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r={R} fill="none" stroke="var(--rule)" strokeWidth="2" />
      <circle
        cx="11" cy="11" r={R}
        fill="none"
        stroke={done ? '#4ade80' : 'var(--accent)'}
        strokeWidth="2"
        strokeLinecap="square"
        strokeDasharray={C}
        strokeDashoffset={offset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '11px 11px', transition: 'stroke-dashoffset 0.3s' }}
      />
    </svg>
  );
}

export default function StatusBar({ stats, cursorLine, cursorCol, isSaved, viewMode, wordGoal, goalCelebrated = false, onSetWordGoal, isMobile, onToggleView, collabStatus, collaboratorCount = 0 }: Props) {
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

  const goalProgress = wordGoal > 0 ? Math.min(Math.round((stats.words / wordGoal) * 100), 100) : 0;

  const goalModal = editingGoal ? createPortal(
    <div className="db-overlay" onClick={() => setEditingGoal(false)}>
      <div className="db-modal" style={{ maxWidth: '300px' }} onClick={e => e.stopPropagation()}>
        <div className="db-page-title" style={{ fontSize: '16px', marginBottom: '6px' }}>Set word goal</div>
        <div className="db-cap mb-4 opacity-70">Track your progress with a ring in the status bar.</div>
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
          <button onClick={commitGoal} className="db-btn flex-1 justify-center">Set goal</button>
          <button onClick={() => { onSetWordGoal(0); setEditingGoal(false); }} className="db-ghost">Clear</button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  if (isMobile) {
    return (
      <>
        {goalModal}
        <footer className="status-bar" style={{ height: '40px', borderTop: '1px solid var(--rule)', padding: '0 12px' }}>
          <button onClick={openGoal} className="flex items-center gap-2" style={{ background: 'none', border: 'none', padding: 0 }}>
            {wordGoal > 0 ? (
              <span style={{ filter: goalCelebrated ? 'drop-shadow(0 0 6px #4ade80)' : 'none', transition: 'filter 0.4s' }}>
                <GoalRing words={stats.words} goal={wordGoal} />
              </span>
            ) : (
              <Target size={13} style={{ color: 'var(--mid)' }} />
            )}
            <span className="db-cap" style={{ fontSize: '10px' }}>
              {stats.words.toLocaleString()}
              {wordGoal > 0 && <span className="opacity-50">/{wordGoal.toLocaleString()}</span>}
            </span>
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <span className="db-cap" style={{ fontSize: '10px' }}>
              <Clock size={9} className="inline mr-1" />{stats.readingTime}m
            </span>
            <button
              onClick={onToggleView}
              className="flex items-center gap-1 px-2 py-1 bg-[var(--cream)] border border-[var(--rule)]"
            >
              {viewMode === 'editor' ? <Eye size={11} /> : <Edit3 size={11} />}
              <span className="db-cap text-[9px]">{viewMode === 'editor' ? 'PREV' : 'EDIT'}</span>
            </button>
            <span style={{ color: isSaved ? 'var(--accent)' : 'var(--mid)', transition: 'color 0.2s' }}>
              {isSaved ? <Check size={13} /> : <Loader2 size={13} className="animate-spin" />}
            </span>
          </div>
        </footer>
      </>
    );
  }

  return (
    <>
      {goalModal}
      <footer id="tour-statusbar" className="status-bar" style={{ height: '26px', borderTop: '1px solid var(--rule)', gap: '0' }}>
        {/* Left cluster */}
        <div className="flex items-center gap-0">
          {/* Word goal */}
          <button
            onClick={openGoal}
            className="flex items-center gap-1.5 px-3 h-full transition-colors hover:bg-[var(--cream)]"
            style={{ background: 'none', border: 'none', cursor: 'pointer', borderRight: '1px solid var(--rule)' }}
            title="Set word goal"
          >
            {wordGoal > 0 ? (
              <span style={{ filter: goalCelebrated ? 'drop-shadow(0 0 5px #4ade80)' : 'none', transition: 'filter 0.4s' }}>
                <GoalRing words={stats.words} goal={wordGoal} />
              </span>
            ) : (
              <Target size={10} strokeWidth={2} style={{ color: 'var(--mid)' }} />
            )}
            <span className="db-cap" style={{ fontSize: '10px' }}>
              {stats.words.toLocaleString()}
              {wordGoal > 0 ? (
                <span className="opacity-50">/{wordGoal.toLocaleString()} · {goalProgress}%</span>
              ) : (
                <span className="hidden sm:inline opacity-50 ml-0.5">w</span>
              )}
            </span>
          </button>

          {/* Chars */}
          <div className="hidden sm:flex items-center gap-1 px-3 h-full" style={{ borderRight: '1px solid var(--rule)' }}>
            <Type size={9} style={{ color: 'var(--mid)' }} />
            <span className="db-cap" style={{ fontSize: '10px' }}>
              {stats.chars.toLocaleString()}<span className="opacity-50 ml-0.5">ch</span>
            </span>
          </div>

          {/* Reading time */}
          <div className="hidden sm:flex items-center gap-1 px-3 h-full" style={{ borderRight: '1px solid var(--rule)' }}>
            <Clock size={9} style={{ color: 'var(--mid)' }} />
            <span className="db-cap" style={{ fontSize: '10px' }}>{stats.readingTime}min</span>
          </div>

          {/* Lines */}
          <div className="hidden md:flex items-center gap-1 px-3 h-full" style={{ borderRight: '1px solid var(--rule)' }}>
            <AlignLeft size={9} style={{ color: 'var(--mid)' }} />
            <span className="db-cap" style={{ fontSize: '10px' }}>
              {stats.lines.toLocaleString()}<span className="opacity-50 ml-0.5">ln</span>
            </span>
          </div>
        </div>

        <div className="flex-1" />

        {/* Right cluster */}
        <div className="flex items-center h-full">
          {/* Cursor position */}
          <div className="hidden sm:flex items-center px-3 h-full" style={{ borderLeft: '1px solid var(--rule)' }}>
            <span className="db-cap" style={{ fontSize: '10px' }}>
              <span className="opacity-50">Ln</span> {cursorLine} <span className="opacity-50 ml-1">Col</span> {cursorCol}
            </span>
          </div>

          {/* View mode */}
          <div className="hidden md:flex items-center px-3 h-full" style={{ borderLeft: '1px solid var(--rule)' }}>
            <span className="db-cap" style={{ fontSize: '10px', color: 'var(--mid)' }}>
              {viewMode === 'split' ? 'SPLIT' : viewMode === 'editor' ? 'EDITOR' : 'PREVIEW'}
            </span>
          </div>

          {/* Collab status */}
          {collabStatus && collabStatus !== 'offline' && (
            <div className="flex items-center gap-1.5 px-3 h-full" style={{ borderLeft: '1px solid var(--rule)' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 5, height: 5,
                  borderRadius: '50%',
                  background: collabStatus === 'online' ? '#4ade80' : 'var(--accent)',
                  animation: collabStatus === 'connecting' ? 'db-blink 1s step-start infinite'
                    : (collabStatus === 'online' && collaboratorCount > 0 ? 'db-blink 2.5s ease-in-out infinite' : 'none'),
                  flexShrink: 0,
                }}
              />
              <span className="hidden sm:inline db-cap" style={{ fontSize: '10px', color: collabStatus === 'online' ? '#4ade80' : 'var(--accent)' }}>
                {collabStatus === 'connecting' ? 'Connecting' : collaboratorCount > 0 ? `${collaboratorCount} online` : 'Synced'}
              </span>
            </div>
          )}

          {/* Save status */}
          <div
            className="flex items-center gap-1 px-3 h-full"
            style={{ borderLeft: '1px solid var(--rule)', color: isSaved ? 'var(--accent)' : 'var(--mid)', transition: 'color 0.2s' }}
          >
            {isSaved
              ? <><Check size={10} strokeWidth={2.5} /><span className="hidden sm:inline db-cap ml-1" style={{ fontSize: '10px', fontWeight: 'bold' }}>Saved</span></>
              : <><Loader2 size={10} strokeWidth={2.5} className="animate-spin" /><span className="hidden sm:inline db-cap ml-1" style={{ fontSize: '10px', fontWeight: 'bold' }}>Saving…</span></>
            }
          </div>

          {/* Format badge */}
          <div className="hidden sm:flex items-center px-2 h-full" style={{ borderLeft: '1px solid var(--rule)' }}>
            <span className="db-cap" style={{ fontSize: '8px', padding: '1px 5px', background: 'var(--accent-dim)', color: 'var(--accent)' }}>MD</span>
          </div>
        </div>
      </footer>
    </>
  );
}
