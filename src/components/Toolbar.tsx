'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Bold, Italic, Strikethrough, Code, Code2, Quote, Link, Image as ImageIcon,
  Heading1, Heading2, Heading3, List, LucideIcon, ListOrdered, Minus, Table,
  Underline, CheckSquare, Superscript, Subscript, AlignLeft, Highlighter,
  CornerDownLeft, ChevronDown, ChevronRight
} from 'lucide-react';
import clsx from 'clsx';
import type { ViewMode } from '@/types';

export type ToolbarAction =
  | 'bold' | 'italic' | 'strikethrough' | 'underline' | 'code' | 'codeblock'
  | 'quote' | 'link' | 'image' | 'h1' | 'h2' | 'h3'
  | 'ul' | 'ol' | 'task' | 'hr' | 'table' | 'focus'
  | 'footnote' | 'highlight' | 'superscript' | 'subscript' | 'details' | 'kbd';

interface Props {
  onAction: (a: ToolbarAction) => void;
  focusMode: boolean;
  viewMode?: ViewMode;
  isMobile?: boolean;
}

interface ToolItem {
  action: ToolbarAction;
  icon: LucideIcon;
  title: string;
  shortcut?: string;
}

interface Group {
  label: string;
  items: ToolItem[];
}

const GROUPS: Group[] = [
  {
    label: 'Heading',
    items: [
      { action: 'h1', icon: Heading1, title: 'Heading 1', shortcut: 'Ctrl+1' },
      { action: 'h2', icon: Heading2, title: 'Heading 2', shortcut: 'Ctrl+2' },
      { action: 'h3', icon: Heading3, title: 'Heading 3', shortcut: 'Ctrl+3' },
    ]
  },
  {
    label: 'Style',
    items: [
      { action: 'bold',          icon: Bold,          title: 'Bold',          shortcut: 'Ctrl+B' },
      { action: 'italic',        icon: Italic,         title: 'Italic',        shortcut: 'Ctrl+I' },
      { action: 'underline',     icon: Underline,      title: 'Underline' },
      { action: 'strikethrough', icon: Strikethrough,  title: 'Strikethrough' },
      { action: 'highlight',     icon: Highlighter,    title: 'Highlight' },
    ]
  },
  {
    label: 'Code',
    items: [
      { action: 'code',      icon: Code,  title: 'Inline code' },
      { action: 'codeblock', icon: Code2, title: 'Code block' },
      { action: 'kbd',       icon: CornerDownLeft, title: 'Keyboard key' },
    ]
  },
  {
    label: 'Block',
    items: [
      { action: 'quote',    icon: Quote,        title: 'Blockquote' },
      { action: 'ul',       icon: List,         title: 'Bullet list' },
      { action: 'ol',       icon: ListOrdered,  title: 'Numbered list' },
      { action: 'task',     icon: CheckSquare,  title: 'Task list' },
      { action: 'hr',       icon: Minus,        title: 'Divider' },
    ]
  },
  {
    label: 'Insert',
    items: [
      { action: 'link',        icon: Link,       title: 'Link' },
      { action: 'image',       icon: ImageIcon,  title: 'Image' },
      { action: 'table',       icon: Table,      title: 'Table' },
      { action: 'footnote',    icon: Superscript, title: 'Footnote' },
      { action: 'details',     icon: ChevronRight, title: 'Collapsible' },
    ]
  },
];

const ALL_ITEMS = GROUPS.flatMap(g => g.items);

// Mobile shows only the most-used items
const MOBILE_PRIMARY: ToolbarAction[] = ['bold', 'italic', 'h1', 'h2', 'ul', 'ol', 'task', 'quote', 'code', 'link'];

export default function Toolbar({ onAction, focusMode, isMobile }: Props) {
  const [poppingAction, setPoppingAction] = useState<ToolbarAction | null>(null);
  const [expandedMobile, setExpandedMobile] = useState(false);
  const [tooltip, setTooltip] = useState<{ action: ToolbarAction; x: number; y: number } | null>(null);
  const popTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback((action: ToolbarAction) => {
    onAction(action);
    if (popTimerRef.current) clearTimeout(popTimerRef.current);
    setPoppingAction(action);
    popTimerRef.current = setTimeout(() => setPoppingAction(null), 320);
    setTooltip(null);
  }, [onAction]);

  if (isMobile) {
    const primaryItems = ALL_ITEMS.filter(i => MOBILE_PRIMARY.includes(i.action));
    const secondaryItems = ALL_ITEMS.filter(i => !MOBILE_PRIMARY.includes(i.action));
    return (
      <div className="border-t border-[var(--rule)] bg-[var(--paper)] relative z-30">
        <div className="flex items-center gap-0.5 px-1.5 py-1.5 overflow-x-auto no-scrollbar">
          {primaryItems.map(({ action, icon: Icon, title }) => (
            <button
              key={action}
              onClick={() => handleClick(action)}
              className={clsx(
                'flex items-center justify-center w-9 h-9 flex-shrink-0 transition-all',
                'border border-transparent text-[var(--mid)]',
                'active:bg-[var(--accent-sub)] active:text-[var(--accent)]',
                poppingAction === action && 'scale-90 text-[var(--accent)]'
              )}
              title={title}
            >
              <Icon size={17} strokeWidth={1.7} />
            </button>
          ))}
          <button
            onClick={() => setExpandedMobile(v => !v)}
            className={clsx(
              'flex items-center justify-center w-9 h-9 flex-shrink-0 ml-auto',
              'border border-[var(--rule)] text-[var(--mid)] transition-all',
              expandedMobile && 'bg-[var(--accent-sub)] text-[var(--accent)] border-[var(--accent)]'
            )}
            title="More formatting"
          >
            <ChevronDown size={14} strokeWidth={2} style={{ transform: expandedMobile ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>
        {expandedMobile && (
          <div className="flex items-center gap-0.5 px-1.5 pb-1.5 overflow-x-auto no-scrollbar border-t border-[var(--rule)]">
            {secondaryItems.map(({ action, icon: Icon, title }) => (
              <button
                key={action}
                onClick={() => handleClick(action)}
                className={clsx(
                  'flex items-center justify-center w-9 h-9 flex-shrink-0 transition-all',
                  'border border-transparent text-[var(--mid)]',
                  'active:bg-[var(--accent-sub)] active:text-[var(--accent)]',
                )}
                title={title}
              >
                <Icon size={17} strokeWidth={1.7} />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="border-t md:border-t-0 md:border-b border-[var(--rule)] bg-[var(--paper)] relative z-30">
      <div
        id="tour-toolbar"
        className="flex items-center px-3 sm:px-4 overflow-x-auto no-scrollbar"
        style={{ minHeight: '42px' }}
=======
    <div
      className="border-t md:border-t-0 md:border-b border-[var(--rule)] bg-[var(--paper)] relative z-30"
    >
      <div
        id="tour-toolbar"
        className="flex items-center px-2 sm:px-4 py-2 overflow-x-auto no-scrollbar min-h-[48px]"
>>>>>>> c322be5297dd3863bec27106655f91003b9cb468
      >
        {GROUPS.map((group, gi) => (
          <div
            key={group.label}
            className={clsx('flex items-center flex-shrink-0', gi > 0 && 'ml-3 sm:ml-5')}
          >
            {/* Group label — only on xl */}
            <span
              className="db-cap hidden xl:block mr-2 opacity-40 select-none"
              style={{ fontSize: '7px', letterSpacing: '0.22em' }}
            >
              {group.label}
            </span>

            <div className="flex items-center gap-px">
              {group.items.map(({ action, icon: Icon, title, shortcut }) => {
                const isPopping = poppingAction === action;

                return (
                  <div key={action} className="relative group/tip">
                    <button
                      onClick={() => handleClick(action)}
                      className={clsx(
                        'flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9',
                        'border border-transparent text-[var(--mid)]',
                        'transition-all duration-150',
                        'hover:border-[var(--rule)] hover:text-[var(--ink)] hover:bg-[var(--cream)]',
                        isPopping && 'scale-90 text-[var(--accent)] bg-[var(--accent-dim)]'
                      )}
                      title={title}
                    >
                      <Icon size={15} strokeWidth={1.8} />
                    </button>
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tip:flex flex-col items-center z-50">
                      <div className="bg-[var(--ink)] text-[var(--paper)] px-2 py-1 whitespace-nowrap" style={{ fontSize: '9px', letterSpacing: '0.06em', fontFamily: 'var(--ff-mono)' }}>
                        {title}
                        {shortcut && <span className="ml-1.5 opacity-50">{shortcut}</span>}
                      </div>
                      <div className="w-1.5 h-1.5 bg-[var(--ink)]" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {gi < GROUPS.length - 1 && (
              <div className="db-vr ml-3 sm:ml-5" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
