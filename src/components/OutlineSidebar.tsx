'use client';

import { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import clsx from 'clsx';
import type { Heading } from '@/types';

function parse(content: string): Heading[] {
  const lines = content.split('\n');
  const out: Heading[] = [];
  let inCode = false;
  lines.forEach((line, i) => {
    if (line.startsWith('```')) { inCode = !inCode; return; }
    if (inCode) return;
    const m = line.match(/^(#{1,6})\s+(.+)/);
    if (m) out.push({
      level: m[1].length as 1|2|3|4|5|6,
      text:  m[2].trim().replace(/[*_~`]/g, ''),
      lineNumber: i + 1,
      id:    m[2].toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
    });
  });
  return out;
}

function activeIdx(headings: Heading[], line: number) {
  let a = 0;
  for (let i = 0; i < headings.length; i++) {
    if (headings[i].lineNumber <= line) a = i; else break;
  }
  return a;
}

const IND: Record<number, number> = { 1:0, 2:0, 3:12, 4:20, 5:26, 6:32 };
const FS:  Record<number, number> = { 1:13, 2:12.5, 3:12, 4:11.5, 5:11, 6:11 };
const FW:  Record<number, string> = { 1:'650', 2:'600', 3:'500', 4:'450', 5:'400', 6:'400' };

export default function OutlineSidebar({ content, isOpen, activeLineNumber, onHeadingClick }: {
  content: string;
  isOpen: boolean;
  activeLineNumber: number;
  onHeadingClick: (n: number) => void;
}) {
  const headings = useMemo(() => parse(content), [content]);
  const active   = useMemo(() => activeIdx(headings, activeLineNumber), [headings, activeLineNumber]);

  return (
    <aside
      id="tour-sidebar"
      className="sidebar-col glass flex flex-col flex-shrink-0 overflow-hidden"
      style={{
        width:         isOpen ? 228 : 0,
        minWidth:      isOpen ? 228 : 0,
        opacity:       isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        borderRight:   isOpen ? '1px solid var(--border-med)' : 'none',
        borderRadius:  0,
        zIndex:        20,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 flex-shrink-0"
        style={{ height: 40, borderBottom: '1px solid var(--border)' }}
      >
        <BookOpen size={13} strokeWidth={2} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-4)' }}>
          Outline
        </span>
        <span
          className="ml-auto rounded-full px-1.5 py-0.5"
          style={{ fontSize: 11, background: 'var(--accent-subtle2)', color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}
        >
          {headings.length}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {headings.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 32, color: 'var(--text-4)', fontSize: 12, lineHeight: 1.7, padding: '0 12px' }}>
            No headings yet.
            <br />
            Start with <code style={{ fontSize: 11 }}># Title</code>
          </div>
        ) : headings.map((h, i) => (
          <button
            key={`${h.lineNumber}-${h.id}`}
            className={clsx('outline-item', i === active && 'active')}
            style={{ paddingLeft: 8 + IND[h.level], fontSize: FS[h.level], fontWeight: FW[h.level] }}
            onClick={() => onHeadingClick(h.lineNumber)}
            title={h.text}
          >
            {/* Active indicator bar */}
            {i === active && (
              <span style={{
                position: 'absolute', left: 0, top: '20%', bottom: '20%',
                width: 2, borderRadius: 1, background: 'var(--accent)',
              }} />
            )}
            {h.level >= 3 && (
              <span style={{
                display: 'inline-block', width: h.level === 3 ? 4 : 3, height: h.level === 3 ? 4 : 3,
                borderRadius: '50%', flexShrink: 0, verticalAlign: 'middle', marginRight: 4,
                background: i === active ? 'var(--accent)' : 'var(--text-4)',
              }} />
            )}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.text}</span>
          </button>
        ))}
      </div>

      {/* Footer stats */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          padding: '6px 12px',
          fontSize: 11,
          color: 'var(--text-4)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {headings.filter(h => h.level === 1).length}H1 &nbsp;
        {headings.filter(h => h.level === 2).length}H2 &nbsp;
        {headings.filter(h => h.level === 3).length}H3
      </div>
    </aside>
  );
}
