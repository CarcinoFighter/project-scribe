'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Bold, Italic, Strikethrough, Code, Code2, Quote, Link, Image as ImageIcon,
  Heading1, Heading2, Heading3, List, LucideIcon, ListOrdered, Minus, Table, ScanLine, MoreHorizontal, ChevronDown
} from 'lucide-react';
import clsx from 'clsx';
import type { ViewMode } from '@/types';

export type ToolbarAction =
  | 'bold' | 'italic' | 'strikethrough' | 'code' | 'codeblock'
  | 'quote' | 'link' | 'image' | 'h1' | 'h2' | 'h3'
  | 'ul' | 'ol' | 'hr' | 'table' | 'focus';

interface Props {
  onAction: (a: ToolbarAction) => void;
  focusMode: boolean;
  viewMode?: ViewMode;
  isMobile?: boolean;
}

interface Group {
  label: string;
  items: { action: ToolbarAction; icon: LucideIcon; title: string }[];
}

const GROUPS: Group[] = [
  {
    label: 'Headings',
    items: [
      { action: 'h1', icon: Heading1, title: 'Heading 1' },
      { action: 'h2', icon: Heading2, title: 'Heading 2' },
      { action: 'h3', icon: Heading3, title: 'Heading 3' },
    ]
  },
  {
    label: 'Style',
    items: [
      { action: 'bold', icon: Bold, title: 'Bold (Ctrl+B)' },
      { action: 'italic', icon: Italic, title: 'Italic (Ctrl+I)' },
      { action: 'strikethrough', icon: Strikethrough, title: 'Strikethrough' },
    ]
  },
  {
    label: 'Code',
    items: [
      { action: 'code', icon: Code, title: 'Inline code' },
      { action: 'codeblock', icon: Code2, title: 'Code block' },
    ]
  },
  {
    label: 'Insert',
    items: [
      { action: 'quote', icon: Quote, title: 'Blockquote' },
      { action: 'link', icon: Link, title: 'Link' },
      { action: 'image', icon: ImageIcon, title: 'Image' },
    ]
  },
  {
    label: 'Lists',
    items: [
      { action: 'ul', icon: List, title: 'Bullet list' },
      { action: 'ol', icon: ListOrdered, title: 'Numbered list' },
      { action: 'hr', icon: Minus, title: 'Horizontal rule' },
      { action: 'table', icon: Table, title: 'Insert table' },
    ]
  },
];

const ALL_ITEMS = GROUPS.flatMap(g => g.items);

export default function Toolbar({ onAction, focusMode, isMobile }: Props) {
  const [poppingAction, setPoppingAction] = useState<ToolbarAction | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const popTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback((action: ToolbarAction) => {
    onAction(action);
    if (popTimerRef.current) clearTimeout(popTimerRef.current);
    setPoppingAction(action);
    popTimerRef.current = setTimeout(() => setPoppingAction(null), 320);
    setActiveGroup(null);
  }, [onAction]);

  if (isMobile) {
    return (
      <div className="border-t border-[var(--rule)] bg-[var(--paper)] relative z-30">
        {/* Mobile: Horizontal scrollable toolbar */}
        <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto no-scrollbar">
          {ALL_ITEMS.map(({ action, icon: Icon, title }) => {
            const isFocusActive = action === 'focus' && focusMode;
            return (
              <button
                key={action}
                onClick={() => handleClick(action)}
                className={clsx(
                  'flex items-center justify-center w-10 h-10 flex-shrink-0',
                  'border border-transparent',
                  'text-[var(--mid)]',
                  'active:bg-[var(--accent-sub)] active:text-[var(--accent)]',
                  isFocusActive && 'text-[var(--accent)] border-[var(--accent)] bg-[var(--accent-sub)]'
                )}
                title={title}
              >
                <Icon size={18} strokeWidth={1.7} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      id="tour-toolbar"
      className="border-t md:border-t-0 md:border-b border-[var(--rule)] bg-[var(--paper)] relative z-30"
    >
      <div className="flex items-center px-2 sm:px-4 py-2 overflow-x-auto no-scrollbar min-h-[48px]">
        {GROUPS.map((group, gi) => (
          <div 
            key={group.label} 
            className={clsx(
              "flex items-center flex-shrink-0",
              gi > 0 && "ml-4 sm:ml-6"
            )}
          >
            <span 
              className="db-cap hidden xl:block mr-2 sm:mr-3 opacity-50" 
              style={{ fontSize: '7.5px', letterSpacing: '0.2em' }}
            >
              {group.label}
            </span>
            
            <div className="flex items-center gap-0.5 sm:gap-1">
              {group.items.map(({ action, icon: Icon, title }) => {
                const isFocusActive = action === 'focus' && focusMode;
                const isPopping = poppingAction === action;
                
                return (
                  <button
                    key={action}
                    onClick={() => handleClick(action)}
                    className={clsx(
                      'flex items-center justify-center',
                      'w-8 h-8 sm:w-9 sm:h-9',
                      'border border-transparent',
                      'text-[var(--mid)]',
                      'transition-all duration-150',
                      'hover:border-[var(--rule)] hover:text-[var(--ink)]',
                      isFocusActive && 'active text-[var(--accent)] border-[var(--accent)] bg-[var(--accent-sub)]',
                      isPopping && 'scale-95 text-[var(--accent)]'
                    )}
                    title={title}
                  >
                    <Icon
                      size={16}
                      strokeWidth={1.7}
                    />
                  </button>
                );
              })}
            </div>
            
            {gi < GROUPS.length - 1 && (
              <div className="db-vr ml-4 sm:ml-6" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}