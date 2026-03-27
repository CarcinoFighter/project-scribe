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

export default function OutlineSidebar({ content, isOpen, activeLineNumber, onHeadingClick, onClose, width = 210 }: {
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
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        id="tour-sidebar"
        className={clsx(
          "db-sidebar",
          "fixed inset-y-0 left-0 z-50 md:relative md:z-20 transition-transform md:transition-all",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        style={{
          width: width,
          minWidth: width,
        }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 768px) {
            #tour-sidebar {
              width: ${isOpen ? width + 'px' : '0px'} !important;
              min-width: ${isOpen ? width + 'px' : '0px'} !important;
              opacity: ${isOpen ? 1 : 0} !important;
              pointer-events: ${isOpen ? 'auto' : 'none'} !important;
              border-right: ${isOpen ? '1px solid var(--rule)' : 'none'} !important;
              transform: none !important;
              transition: width 0.22s cubic-bezier(0.4,0,0.2,1), min-width 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.18s ease !important;
            }
          }
          @media (max-width: 767px) {
            #tour-sidebar {
              border-right: 1px solid var(--rule) !important;
            }
          }
        `}} />
      
      <div className="db-sidebar-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px 8px' }}>
        <BookOpen size={12} strokeWidth={2} style={{ color: 'var(--accent)' }} />
        <span>Outline</span>
        <span className="ml-auto" style={{ fontSize: '10px', background: 'var(--accent-dim)', color: 'var(--accent)', padding: '1px 5px' }}>
          {headings.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {headings.length === 0 ? (
          <div className="db-rise-1" style={{ textAlign: 'center', marginTop: 32, color: 'var(--mid)', fontSize: 12, lineHeight: 1.7, padding: '0 16px' }}>
            <span className="db-cap">No headings yet.</span>
            <br />
            Start with <code style={{ fontSize: 11, fontFamily: 'var(--ff-mono)' }}># Title</code>
          </div>
        ) : headings.map((h, i) => (
          <button
            key={`${h.lineNumber}-${h.id}`}
            onClick={() => onHeadingClick(h.lineNumber)}
            className={`db-nav-item ${i === active ? 'active' : ''}`}
            style={{
              paddingLeft: `${16 + IND[h.level]}px`,
              fontSize: `${FS[h.level]}px`,
              fontWeight: FW[h.level],
              borderTop: i === 0 ? 'none' : '1px solid var(--rule)',
            }}
            title={h.text}
          >
            {i === active && (
              <span
                style={{
                  position: 'absolute', left: 0, top: '20%', bottom: '20%',
                  width: 2, background: 'var(--accent)',
                }}
              />
            )}
            {h.level >= 3 && (
              <span style={{
                display: 'inline-block',
                width: h.level === 3 ? 4 : 3, height: h.level === 3 ? 4 : 3,
                flexShrink: 0, marginRight: 6,
                background: i === active ? 'var(--accent)' : 'var(--mid)',
              }} />
            )}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.text}</span>
          </button>
        ))}
      </div>

      <div
        style={{
          borderTop: '1px solid var(--rule)',
          padding: '8px 16px',
          fontSize: 11,
          color: 'var(--mid)',
          fontFamily: 'var(--ff-mono)',
        }}
      >
        <span className="db-cap">{headings.filter(h => h.level === 1).length}H1</span>
        <span className="db-cap" style={{ marginLeft: 8 }}>{headings.filter(h => h.level === 2).length}H2</span>
        <span className="db-cap" style={{ marginLeft: 8 }}>{headings.filter(h => h.level === 3).length}H3</span>
      </div>
    </aside>
    </>
  );
}