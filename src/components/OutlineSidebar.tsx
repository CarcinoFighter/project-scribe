'use client';

import { useMemo } from 'react';
import { BookOpen, X } from 'lucide-react';
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

const IND: Record<number, number> = { 1: 0, 2: 0, 3: 12, 4: 20, 5: 26, 6: 32 };

export default function OutlineSidebar({
  content,
  isOpen,
  activeLineNumber,
  onHeadingClick,
  onClose,
  width = 210,
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

  const handleHeadingClick = (lineNumber: number) => {
    onHeadingClick(lineNumber);
    // Auto-close on mobile after picking a heading
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onClose?.();
    }
  };

  return (
    <>
      {/* ── Mobile backdrop ─────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/*
        Collapse strategy
        ─────────────────
        Mobile  (< md):  fixed overlay drawer — always `width` px wide,
                         translateX controls show/hide so content underneath
                         is never pushed around.

        Desktop (≥ md):  relative, participates in the editor flex row.
                         max-width transitions from `width`px → 0 (with
                         overflow:hidden) so the sidebar smoothly collapses
                         and gives its flex space back to the editor.
                         We inject the concrete pixel value via a scoped
                         <style> tag because Tailwind can't JIT-compile
                         arbitrary runtime values.
      */}
      <aside
        id="tour-sidebar"
        className={clsx(
          'db-sidebar flex-shrink-0 overflow-hidden',
          // Mobile: fixed drawer, z above backdrop
          'fixed inset-y-0 left-0 z-50',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: in-flow, no transform, animate max-width instead
          'md:relative md:inset-auto md:z-20 md:translate-x-0',
          'md:transition-[max-width,opacity] md:duration-300 md:ease-out',
          isOpen ? 'md:opacity-100 md:pointer-events-auto' : 'md:opacity-0 md:pointer-events-none',
        )}
        // Mobile: width is always set (sidebar is fixed, not in flow).
        // Desktop: max-width is driven solely by the <style> tag below so
        // the collapse to 0 isn't blocked by an inline maxWidth declaration.
        style={{ width }}
      >
        {/* Inner panel — always `width` px; <aside> clips it on desktop collapse */}
        <div
          className="flex flex-col h-full bg-[var(--paper)]"
          style={{ width, maxWidth: '85vw' }}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--rule)] flex-shrink-0">
            <div className="flex items-center gap-2">
              <BookOpen size={13} strokeWidth={2} style={{ color: 'var(--accent)' }} />
              <span className="db-cap" style={{ fontSize: '10px' }}>Outline</span>
            </div>
            <div className="flex items-center gap-3">
              <span
                style={{
                  fontSize: '10px',
                  background: 'var(--accent-dim)',
                  color: 'var(--accent)',
                  padding: '1px 6px',
                }}
              >
                {headings.length}
              </span>
              {/* X button — visible on both mobile and desktop */}
              {onClose && (
                <button
                  onClick={onClose}
                  className="db-icon-btn"
                  style={{ width: 24, height: 24 }}
                  title="Close outline"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* ── Heading list ── */}
          <div className="flex-1 overflow-y-auto py-2">
            {headings.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <span className="db-cap block mb-2 opacity-50">No headings yet.</span>
                <code
                  className="text-xs"
                  style={{ fontFamily: 'var(--ff-mono)', color: 'var(--mid)' }}
                >
                  # Title
                </code>
              </div>
            ) : (
              headings.map((h, i) => (
                <button
                  key={`${h.lineNumber}-${h.id}`}
                  onClick={() => handleHeadingClick(h.lineNumber)}
                  className={clsx('db-nav-item relative', i === active && 'active')}
                  style={{
                    paddingLeft: `${16 + IND[h.level]}px`,
                    fontSize: i === active ? '12px' : '11px',
                    borderTop: i === 0 ? 'none' : undefined,
                  }}
                >
                  {i === active && (
                    <span className="absolute left-0 top-[20%] bottom-[20%] w-0.5 bg-[var(--accent)]" />
                  )}
                  {h.level >= 3 && (
                    <span
                      className="inline-block mr-2 flex-shrink-0"
                      style={{
                        width: h.level === 3 ? 4 : 3,
                        height: h.level === 3 ? 4 : 3,
                        background: i === active ? 'var(--accent)' : 'var(--mid)',
                      }}
                    />
                  )}
                  <span className="truncate">{h.text}</span>
                </button>
              ))
            )}
          </div>

          {/* ── Footer ── */}
          <div
            className="border-t border-[var(--rule)] px-4 py-2 flex-shrink-0"
            style={{ fontSize: 11, color: 'var(--mid)', fontFamily: 'var(--ff-mono)' }}
          >
            <span className="db-cap">{headings.filter(h => h.level === 1).length}H1</span>
            <span className="db-cap ml-3">{headings.filter(h => h.level === 2).length}H2</span>
            <span className="db-cap ml-3">{headings.filter(h => h.level === 3).length}H3</span>
          </div>
        </div>
      </aside>

      {/*
        Desktop max-width driver.
        Tailwind cannot JIT-compile the runtime `width` prop value, so we inject
        a tiny scoped rule. This is the only place we need a <style> tag.
        On mobile this rule is inert — the sidebar is `fixed` and therefore
        outside normal flow; its visible area is controlled by translateX.
      */}
      <style>{`
        @media (min-width: 768px) {
          #tour-sidebar { max-width: ${isOpen ? width : 0}px; }
        }
      `}</style>
    </>
  );
}