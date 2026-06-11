'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Loader2, Target, Eye, Edit3, Clock, Type, AlignLeft } from 'lucide-react';
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
  const R = 7;
  const C = 2 * Math.PI * R;
  const pct = Math.min(words / goal, 1);
  const offset = C * (1 - pct);
  const done = pct >= 1;
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
      <circle cx="9" cy="9" r={R} fill="none" stroke="var(--rule)" strokeWidth="1.5" />
      <circle
        cx="9" cy="9" r={R}
        fill="none"
        stroke={done ? '#4ade80' : 'var(--accent)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={offset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '9px 9px', transition: 'stroke-dashoffset 0.3s' }}
      />
    </svg>
  );
}

export default function StatusBar({
  stats, cursorLine, cursorCol, isSaved, viewMode, wordGoal, goalCelebrated = false,
  onSetWordGoal, isMobile, onToggleView, collabStatus, collaboratorCount = 0
}: Props) {
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
        <footer className="status-bar" style={{ height: '40px' }}>
          <button onClick={openGoal} className="status-bar-pill clickable" style={{ paddingLeft: 0 }}>
            {wordGoal > 0 ? (
              <span style={{ filter: goalCelebrated ? 'drop-shadow(0 0 6px #4ade80)' : 'none', transition: 'filter 0.4s' }}>
                <GoalRing words={stats.words} goal={wordGoal} />
              </span>
            ) : (
              <Target size={12} />
            )}
            <span>
              {stats.words.toLocaleString()}
              {wordGoal > 0 && <span className="opacity-40">/{wordGoal.toLocaleString()}</span>}
              <span className="opacity-40 ml-0.5">w</span>
            </span>
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-1">
            <span className="status-bar-pill">
              <Clock size={9} />
              {stats.readingTime}m
            </span>
            <button
              onClick={onToggleView}
              className="status-bar-pill clickable border border-[var(--rule)] rounded"
              style={{ borderRadius: 'var(--r-sm)' }}
            >
              {viewMode === 'editor' ? <Eye size={10} /> : <Edit3 size={10} />}
              <span>{viewMode === 'editor' ? 'Preview' : 'Edit'}</span>
            </button>
            <span
              className="status-bar-pill"
              style={{ color: isSaved ? 'var(--accent)' : 'var(--mid)', transition: 'color 0.2s' }}
            >
              {isSaved ? <Check size={11} /> : <Loader2 size={11} className="animate-spin" />}
            </span>
          </div>
        </footer>
      </>
    );
  }

  return (
    <>
      {goalModal}
      <footer id="tour-statusbar" className="status-bar">
        {/* Left cluster */}
        <button
          onClick={openGoal}
          className="status-bar-pill clickable"
          title="Set word goal"
          style={{ paddingLeft: 0 }}
        >
          {wordGoal > 0 ? (
            <span style={{ filter: goalCelebrated ? 'drop-shadow(0 0 5px #4ade80)' : 'none', transition: 'filter 0.4s' }}>
              <GoalRing words={stats.words} goal={wordGoal} />
            </span>
          ) : (
            <Target size={10} strokeWidth={2} />
          )}
          {stats.words.toLocaleString()}
          {wordGoal > 0 ? (
            <span className="opacity-40">/{wordGoal.toLocaleString()} · {goalProgress}%</span>
          ) : (
            <span className="hidden sm:inline opacity-40">w</span>
          )}
        </button>

        <div className="status-bar-sep hidden sm:block" />

        <span className="status-bar-pill hidden sm:inline-flex">
          <Type size={9} />
          {stats.chars.toLocaleString()}<span className="opacity-40 ml-0.5">ch</span>
        </span>

        <div className="status-bar-sep hidden sm:block" />

        <span className="status-bar-pill hidden sm:inline-flex">
          <Clock size={9} />
          {stats.readingTime}min
        </span>

        <div className="status-bar-sep hidden md:block" />

        <span className="status-bar-pill hidden md:inline-flex">
          <AlignLeft size={9} />
          {stats.lines.toLocaleString()}<span className="opacity-40 ml-0.5">ln</span>
        </span>

        <div className="flex-1" />

        {/* Right cluster */}
        <span className="status-bar-pill hidden sm:inline-flex">
          <span className="opacity-40">Ln</span> {cursorLine} <span className="opacity-40 mx-1">Col</span> {cursorCol}
        </span>

        <div className="status-bar-sep hidden sm:block" />

        <span className="status-bar-pill hidden md:inline-flex" style={{ color: 'var(--text-5)' }}>
          {viewMode === 'split' ? 'Split' : viewMode === 'editor' ? 'Editor' : 'Preview'}
        </span>

        {collabStatus && collabStatus !== 'offline' && (
          <>
            <div className="status-bar-sep" />
            <span className="status-bar-pill" style={{ color: collabStatus === 'online' ? '#4ade80' : 'var(--accent)' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 5, height: 5,
                  borderRadius: '50%',
                  background: 'currentColor',
                  animation: collabStatus === 'connecting' ? 'db-blink 1s step-start infinite'
                    : (collabStatus === 'online' && collaboratorCount > 0 ? 'db-blink 2.5s ease-in-out infinite' : 'none'),
                  flexShrink: 0,
                }}
              />
              <span className="hidden sm:inline">
                {collabStatus === 'connecting' ? 'Connecting' : collaboratorCount > 0 ? `${collaboratorCount} online` : 'Synced'}
              </span>
            </span>
          </>
        )}

        <div className="status-bar-sep" />

        <span
          className="status-bar-pill"
          style={{ color: isSaved ? 'var(--accent)' : 'var(--mid)', transition: 'color 0.2s' }}
        >
          {isSaved
            ? <><Check size={9} strokeWidth={2.5} /><span className="hidden sm:inline ml-0.5">Saved</span></>
            : <><Loader2 size={9} strokeWidth={2.5} className="animate-spin" /><span className="hidden sm:inline ml-0.5">Saving…</span></>
          }
        </span>

        <div className="status-bar-sep hidden sm:block" />

        <span className="status-bar-pill hidden sm:inline-flex" style={{
          fontSize: '9px',
          background: 'var(--accent-dim)',
          color: 'var(--accent)',
          borderRadius: 'var(--r-xs)',
          letterSpacing: '0.08em',
          fontWeight: '600',
        }}>
          MD
        </span>
      </footer>
    </>
  );
}
