'use client';

import { Clock, Type, Hash, Check, Loader2, LucideIcon, AlignLeft } from 'lucide-react';
import type { DocumentStats, ViewMode } from '@/types';

interface StatusBarProps {
  stats: DocumentStats;
  cursorLine: number;
  cursorCol: number;
  isSaved: boolean;
  viewMode: ViewMode;
}

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
}) {
  return (
    <span
      className="flex items-center gap-1.5"
      title={label}
      style={{ color: 'var(--text-muted)', fontSize: 12 }}
    >
      <Icon size={11} strokeWidth={2} />
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      <span className="hidden sm:inline" style={{ opacity: 0.6 }}>{label}</span>
    </span>
  );
}

export default function StatusBar({
  stats, cursorLine, cursorCol, isSaved, viewMode,
}: StatusBarProps) {
  return (
    <footer
      className="glass flex items-center px-4 gap-4 flex-shrink-0 flex-wrap"
      style={{
        height: 30,
        borderTop: '1px solid var(--border)',
        borderRadius: 0,
        overflowX: 'auto',
      }}
    >
      {/* Doc stats */}
      <div className="flex items-center gap-3">
        <StatItem icon={Type}     label="words"  value={stats.words.toLocaleString()} />
        <StatItem icon={Hash}     label="chars"  value={stats.chars.toLocaleString()} />
        <StatItem icon={Clock}    label="min read" value={`${stats.readingTime}`} />
        <StatItem icon={AlignLeft} label="lines" value={stats.lines.toLocaleString()} />
      </div>

      {/* Divider */}
      <div className="toolbar-sep" />

      {/* Cursor */}
      <span
        className="flex items-center gap-1"
        style={{ color: 'var(--text-muted)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}
      >
        Ln {cursorLine}, Col {cursorCol}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* View mode label */}
      <span
        className="text-xs capitalize hidden md:inline"
        style={{ color: 'var(--text-muted)' }}
      >
        {viewMode === 'split' ? 'Split view' : viewMode === 'editor' ? 'Editor' : 'Preview'}
      </span>

      <div className="toolbar-sep" />

      {/* Save status */}
      <span
        className="flex items-center gap-1 text-xs"
        style={{ color: isSaved ? 'var(--accent)' : 'var(--text-muted)' }}
      >
        {isSaved ? (
          <><Check size={11} strokeWidth={2.5} /> Saved</>
        ) : (
          <><Loader2 size={11} strokeWidth={2.5} className="animate-spin" /> Saving...</>
        )}
      </span>

      {/* Lang badge */}
      <span
        className="text-xs px-2 py-0.5 rounded"
        style={{
          background: 'var(--accent-subtle)',
          color: 'var(--accent)',
          fontSize: 11,
        }}
      >
        Markdown
      </span>
    </footer>
  );
}
