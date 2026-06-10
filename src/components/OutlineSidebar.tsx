'use client';

import { useMemo, useState } from 'react';
import { BookOpen, X, Hash } from 'lucide-react';
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
      level: m[1].length as 1 | 2 | 3 | 4 | 5 | 6,
      text: m[2].trim().replace(/[*_~`]/g, ''),
      lineNumber: i + 1,
      id: m[2].toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
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

// Indent per heading level
const IND: Record<number, number> = { 1: 0, 2: 0, 3: 12, 4: 20, 5: 26, 6: 32 };

// Visual weight per heading level  
const WEIGHT: Record<number, string> = { 
  1: '600', 2: '500', 3: '400', 4: '400', 5: '400', 6: '400' 
};
const SIZE: Record<number, string> = { 
  1: '12px', 2: '11.5px', 3: '11px', 4: '10.5px', 5: '10px', 6: '10px' 
};

export default function OutlineSidebar({
  content,
  isOpen,
  activeLineNumber,
  onHeadingClick,
  onClose,
  width = 220,
}: {
  content: string;
  isOpen: boolean;
  activeLineNumber: number;
  onHeadingClick: (n: number) => void;
  onClose?: () => void;
  width?: number;
}) {
  const headings = useMemo(() => parse(content), [content]);
  const active = useMemo(() => activeIdx(headings, activeLineNumber), [headings, activeLineNumber]);

  // Word count per "section" (H1/H2)
  const sectionWordCounts = useMemo(() => {
    const lines = content.split('\n');
    const counts: Record<number, number> = {};
    let currentSection = -1;
    lines.forEach((line, i) => {
      const m = line.match(/^(#{1,2})\s+(.+)/);
      if (m) {
        currentSection = i + 1; // lineNumber
        counts[currentSection] = 0;
      } else if (currentSection >= 0 && line.trim()) {
        const words = line.trim().split(/\s+/).length;
        counts[currentSection] = (counts[currentSection] || 0) + words;
      }
    });
    return counts;
  }, [content]);

  const handleHeadingClick = (lineNumber: number) => {
    onHeadingClick(lineNumber);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onClose?.();
    }
  };

  const h1Count = headings.filter(h => h.level === 1).length;
  const h2Count = headings.filter(h => h.level === 2).length;
  const h3Count = headings.filter(h => h.level === 3).length;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="tour-sidebar"
        className={clsx(
          'db-sidebar flex-shrink-0 overflow-hidden',
          'fixed inset-y-0 left-0 z-50',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'md:relative md:inset-auto md:z-20 md:translate-x-0',
          'md:transition-[max-width,opacity] md:duration-300 md:ease-out',
          isOpen ? 'md:opacity-100 md:pointer-events-auto' : 'md:opacity-0 md:pointer-events-none',
        )}
        style={{ width }}
      >
        <div className="flex flex-col h-full bg-[var(--paper)]" style={{ width, maxWidth: '85vw' }}>
          
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--rule)] flex-shrink-0">
            <div className="flex items-center gap-2">
              <BookOpen size={12} strokeWidth={2} style={{ color: 'var(--accent)' }} />
              <span className="db-cap" style={{ fontSize: '9px' }}>Document Outline</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '9px', background: 'var(--accent-dim)', color: 'var(--accent)', padding: '1px 5px', fontFamily: 'var(--ff-mono)', fontWeight: '600' }}>
                {headings.length}
              </span>
              {onClose && (
                <button onClick={onClose} className="db-icon-btn" style={{ width: 22, height: 22 }} title="Close outline">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Heading list */}
          <div className="flex-1 overflow-y-auto py-1.5">
            {headings.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Hash size={20} style={{ color: 'var(--rule)', margin: '0 auto 8px' }} />
                <span className="db-cap block mb-1 opacity-40" style={{ fontSize: '9px' }}>No headings yet</span>
                <code className="text-xs" style={{ fontFamily: 'var(--ff-mono)', color: 'var(--mid)', fontSize: '11px' }}>
                  # Your Title
                </code>
              </div>
            ) : (
              headings.map((h, i) => {
                const isActive = i === active;
                const sectionWords = (h.level <= 2) ? sectionWordCounts[h.lineNumber] : undefined;
                
                return (
                  <button
                    key={`${h.lineNumber}-${h.id}`}
                    onClick={() => handleHeadingClick(h.lineNumber)}
                    className={clsx(
                      'w-full text-left flex items-center gap-1.5 relative transition-colors group/item',
                      'hover:bg-[var(--cream)]',
                      isActive ? 'bg-[var(--cream)]' : ''
                    )}
                    style={{
                      paddingLeft: `${12 + IND[h.level]}px`,
                      paddingRight: '10px',
                      paddingTop: '5px',
                      paddingBottom: '5px',
                      fontSize: SIZE[h.level],
                      fontWeight: WEIGHT[h.level],
                      fontFamily: 'var(--ff-ui)',
                      color: isActive ? 'var(--ink)' : 'var(--mid)',
                    }}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-[15%] bottom-[15%] w-0.5 bg-[var(--accent)]" />
                    )}

                    {/* Heading level dot for H3+ */}
                    {h.level >= 3 && (
                      <span
                        className="inline-block flex-shrink-0"
                        style={{
                          width: 3, height: 3,
                          background: isActive ? 'var(--accent)' : 'var(--rule)',
                          flexShrink: 0,
                        }}
                      />
                    )}

                    <span className="truncate flex-1">{h.text}</span>

                    {/* Section word count hint for H1/H2 */}
                    {sectionWords !== undefined && sectionWords > 0 && (
                      <span
                        className="opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0"
                        style={{ fontSize: '9px', fontFamily: 'var(--ff-mono)', color: 'var(--mid)', letterSpacing: '0.04em' }}
                      >
                        {sectionWords}w
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer stats */}
          <div className="border-t border-[var(--rule)] px-3 py-2 flex-shrink-0 flex items-center gap-0">
            {[
              { label: 'H1', count: h1Count },
              { label: 'H2', count: h2Count },
              { label: 'H3', count: h3Count },
            ].map(({ label, count }, i) => (
              <span
                key={label}
                className="db-cap"
                style={{
                  fontSize: '8.5px',
                  color: count > 0 ? 'var(--mid)' : 'var(--rule)',
                  marginRight: i < 2 ? '10px' : 0,
                }}
              >
                {count} {label}
              </span>
            ))}
            <div className="flex-1" />
            <span className="db-cap" style={{ fontSize: '8.5px' }}>{headings.length} total</span>
          </div>
        </div>
      </aside>

      <style>{`
        @media (min-width: 768px) {
          #tour-sidebar { max-width: ${isOpen ? width : 0}px; }
        }
      `}</style>
    </>
  );
}
