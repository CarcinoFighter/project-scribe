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

export default function OutlineSidebar({ content, isOpen, activeLineNumber, onHeadingClick, onClose, width = 228 }: {
  content: string;
  isOpen: boolean;
  activeLineNumber: number;
  onHeadingClick: (n: number) => void;
  onClose?: () => void;
  width?: number;
}) {
  const headings = useMemo(() => parse(content), [content]);
  const active   = useMemo(() => activeIdx(headings, activeLineNumber), [headings, activeLineNumber]);

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}
      <aside
        id="tour-sidebar"
        className={clsx(
          "sidebar-col glass flex flex-col flex-shrink-0 overflow-hidden",
          "fixed inset-y-0 left-0 z-50 md:relative md:z-20 transition-transform md:transition-all",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        style={{
          width: width,
          minWidth: width,
          opacity: 1, // On mobile opacity is 1, transform handles it.
          // Override for desktop
        }}
      >
        {/* We use a style tag to handle desktop/mobile dynamic width gracefully */}
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 768px) {
            #tour-sidebar {
              width: ${isOpen ? width + 'px' : '0px'} !important;
              min-width: ${isOpen ? width + 'px' : '0px'} !important;
              opacity: ${isOpen ? 1 : 0} !important;
              pointer-events: ${isOpen ? 'auto' : 'none'} !important;
              border-right: ${isOpen ? '1px solid var(--border-med)' : 'none'} !important;
              transform: none !important;
              transition: width 0.22s cubic-bezier(0.4,0,0.2,1), min-width 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.18s ease !important;
            }
          }
          @media (max-width: 767px) {
            #tour-sidebar {
              border-right: 1px solid var(--border-med) !important;
            }
          }
        `}} />
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 flex-shrink-0 anim-slide-down"
        style={{ height: 40, borderBottom: '1px solid var(--border)', animationDelay: '0.12s' }}
      >
        <BookOpen size={13} strokeWidth={2} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-4)' }}>
          Outline
        </span>
        <span
          key={headings.length}
          className="ml-auto rounded-full px-1.5 py-0.5 anim-pop"
          style={{ fontSize: 11, background: 'var(--accent-subtle2)', color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}
        >
          {headings.length}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-3">
        {headings.length === 0 ? (
          <div className="anim-fade-up" style={{ textAlign: 'center', marginTop: 32, color: 'var(--text-4)', fontSize: 12, lineHeight: 1.7, padding: '0 12px' }}>
            No headings yet.
            <br />
            Start with <code style={{ fontSize: 11 }}># Title</code>
          </div>
        ) : headings.map((h, i) => (
          <button
            key={`${h.lineNumber}-${h.id}`}
            className={clsx('outline-item anim-stagger', i === active && 'active')}
            style={{
              paddingLeft: 8 + IND[h.level],
              fontSize: FS[h.level],
              fontWeight: FW[h.level],
              '--i': Math.min(i, 12),
            } as React.CSSProperties}
            onClick={() => onHeadingClick(h.lineNumber)}
            title={h.text}
          >
            {/* Active indicator bar — grows with animation */}
            {i === active && (
              <span
                className="anim-bar-grow"
                style={{
                  position: 'absolute', left: 0, top: '20%', bottom: '20%',
                  width: 2, borderRadius: 1, background: 'var(--accent)',
                  transformOrigin: 'top center',
                }}
              />
            )}
            {h.level >= 3 && (
              <span style={{
                display: 'inline-block',
                width: h.level === 3 ? 4 : 3, height: h.level === 3 ? 4 : 3,
                borderRadius: '50%', flexShrink: 0, verticalAlign: 'middle', marginRight: 4,
                background: i === active ? 'var(--accent)' : 'var(--text-4)',
                transition: 'background 0.15s',
              }} />
            )}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.text}</span>
          </button>
        ))}
      </div>

      <div
        className="anim-slide-up bg-[var(--bg)]"
        style={{
          borderTop: '1px solid var(--border)',
          padding: '6px 12px',
          fontSize: 11,
          color: 'var(--text-4)',
          fontVariantNumeric: 'tabular-nums',
          animationDelay: '0.2s',
          paddingBottom: 'max(6px, env(safe-area-inset-bottom))',
        }}
      >
        {headings.filter(h => h.level === 1).length}H1 &nbsp;
        {headings.filter(h => h.level === 2).length}H2 &nbsp;
        {headings.filter(h => h.level === 3).length}H3
      </div>
    </aside>
    </>
  );
}
