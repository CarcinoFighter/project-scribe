'use client';

import { useMemo } from 'react';
import { FileText } from 'lucide-react';
import clsx from 'clsx';
import type { Heading } from '@/types';

interface OutlineSidebarProps {
  content: string;
  isOpen: boolean;
  activeLineNumber: number;
  onHeadingClick: (lineNumber: number) => void;
}

function parseHeadings(content: string): Heading[] {
  const lines = content.split('\n');
  const headings: Heading[] = [];
  let inCodeBlock = false;

  lines.forEach((line, index) => {
    // Ignore headings inside fenced code blocks
    if (line.startsWith('```')) { inCodeBlock = !inCodeBlock; return; }
    if (inCodeBlock) return;

    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      const text = match[2].trim().replace(/\*\*/g, '').replace(/\*/g, '');
      headings.push({
        level: match[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        text,
        lineNumber: index + 1,
        id: text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
      });
    }
  });

  return headings;
}

function getActiveHeading(headings: Heading[], activeLine: number): number {
  let active = 0;
  for (let i = 0; i < headings.length; i++) {
    if (headings[i].lineNumber <= activeLine) active = i;
    else break;
  }
  return active;
}

const INDENT = { 1: 0, 2: 0, 3: 12, 4: 20, 5: 28, 6: 36 };
const FONT_SIZE = { 1: 13, 2: 12.5, 3: 12, 4: 11.5, 5: 11, 6: 11 };
const FONT_WEIGHT = { 1: '600', 2: '600', 3: '500', 4: '400', 5: '400', 6: '400' };

export default function OutlineSidebar({
  content, isOpen, activeLineNumber, onHeadingClick,
}: OutlineSidebarProps) {
  const headings = useMemo(() => parseHeadings(content), [content]);
  const activeIndex = useMemo(
    () => getActiveHeading(headings, activeLineNumber),
    [headings, activeLineNumber],
  );

  return (
    <aside
      className="glass flex flex-col flex-shrink-0 overflow-hidden sidebar-enter"
      style={{
        width: isOpen ? 220 : 0,
        borderRight: isOpen ? '1px solid var(--border)' : 'none',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.18s',
        borderRadius: 0,
        zIndex: 20,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
        style={{
          borderBottom: '1px solid var(--border)',
          height: 40,
        }}
      >
        <FileText size={13} strokeWidth={2} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <span
          className="text-xs font-semibold uppercase tracking-widest truncate"
          style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}
        >
          Outline
        </span>
        <span
          className="ml-auto text-xs rounded-full px-1.5 py-0.5"
          style={{
            background: 'var(--accent-subtle)',
            color: 'var(--accent)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {headings.length}
        </span>
      </div>

      {/* Heading list */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {headings.length === 0 ? (
          <div
            className="text-xs text-center mt-8 px-4"
            style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}
          >
            No headings yet.
            <br />
            Add <code style={{ fontSize: 11 }}># H1</code> to start your outline.
          </div>
        ) : (
          headings.map((h, i) => (
            <button
              key={`${h.lineNumber}-${h.text}`}
              className={clsx('outline-item w-full text-left', i === activeIndex && 'active')}
              style={{
                paddingLeft: 8 + INDENT[h.level],
                fontSize: FONT_SIZE[h.level],
                fontWeight: FONT_WEIGHT[h.level],
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onClick={() => onHeadingClick(h.lineNumber)}
              title={h.text}
            >
              {/* Level indicator dot */}
              {h.level >= 3 && (
                <span
                  style={{
                    display: 'inline-block',
                    width: h.level === 3 ? 4 : 3,
                    height: h.level === 3 ? 4 : 3,
                    borderRadius: '50%',
                    background: i === activeIndex ? 'var(--accent)' : 'var(--text-muted)',
                    marginRight: 5,
                    flexShrink: 0,
                    verticalAlign: 'middle',
                  }}
                />
              )}
              <span className="truncate">{h.text}</span>
            </button>
          ))
        )}
      </div>

      {/* Footer word count hint */}
      <div
        className="px-3 py-2 text-xs flex-shrink-0"
        style={{
          borderTop: '1px solid var(--border)',
          color: 'var(--text-muted)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {headings.filter(h => h.level === 1).length} sections ·{' '}
        {headings.filter(h => h.level === 2).length} subsections
      </div>
    </aside>
  );
}
