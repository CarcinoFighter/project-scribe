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
  items: ToolItem[];
}

const GROUPS: Group[] = [
  {
    items: [
      { action: 'h1', icon: Heading1, title: 'Heading 1', shortcut: 'Ctrl+1' },
      { action: 'h2', icon: Heading2, title: 'Heading 2', shortcut: 'Ctrl+2' },
      { action: 'h3', icon: Heading3, title: 'Heading 3', shortcut: 'Ctrl+3' },
    ]
  },
  {
    items: [
      { action: 'bold',          icon: Bold,          title: 'Bold',          shortcut: 'Ctrl+B' },
      { action: 'italic',        icon: Italic,         title: 'Italic',        shortcut: 'Ctrl+I' },
      { action: 'underline',     icon: Underline,      title: 'Underline' },
      { action: 'strikethrough', icon: Strikethrough,  title: 'Strikethrough' },
      { action: 'highlight',     icon: Highlighter,    title: 'Highlight' },
    ]
  },
  {
    items: [
      { action: 'code',      icon: Code,  title: 'Inline code' },
      { action: 'codeblock', icon: Code2, title: 'Code block' },
      { action: 'kbd',       icon: CornerDownLeft, title: 'Keyboard key' },
    ]
  },
  {
    items: [
      { action: 'quote',    icon: Quote,        title: 'Blockquote' },
      { action: 'ul',       icon: List,         title: 'Bullet list' },
      { action: 'ol',       icon: ListOrdered,  title: 'Numbered list' },
      { action: 'task',     icon: CheckSquare,  title: 'Task list' },
      { action: 'hr',       icon: Minus,        title: 'Divider' },
    ]
  },
  {
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
const MOBILE_PRIMARY: ToolbarAction[] = ['bold', 'italic', 'h1', 'h2', 'ul', 'ol', 'task', 'quote', 'code', 'link'];

export default function Toolbar({ onAction, focusMode, isMobile }: Props) {
  const [poppingAction, setPoppingAction] = useState<ToolbarAction | null>(null);
  const [expandedMobile, setExpandedMobile] = useState(false);
  const popTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback((action: ToolbarAction) => {
    onAction(action);
    if (popTimerRef.current) clearTimeout(popTimerRef.current);
    setPoppingAction(action);
    popTimerRef.current = setTimeout(() => setPoppingAction(null), 320);
  }, [onAction]);

  if (isMobile) {
    const primaryItems = ALL_ITEMS.filter(i => MOBILE_PRIMARY.includes(i.action));
    const secondaryItems = ALL_ITEMS.filter(i => !MOBILE_PRIMARY.includes(i.action));
    return (
      <div className="border-t border-[var(--rule)] bg-[var(--paper)] relative z-30">
        <div className="flex items-center gap-0.5 px-2 py-1.5 overflow-x-auto no-scrollbar" style={{ height: '44px' }}>
          {primaryItems.map(({ action, icon: Icon, title }) => (
            <button
              key={action}
              onClick={() => handleClick(action)}
              className={clsx(
                'editor-toolbar-btn flex-shrink-0',
                poppingAction === action && 'active scale-90'
              )}
              title={title}
            >
              <Icon size={16} strokeWidth={1.7} />
            </button>
          ))}
          <button
            onClick={() => setExpandedMobile(v => !v)}
            className={clsx(
              'editor-toolbar-btn flex-shrink-0 ml-auto',
              expandedMobile && 'active'
            )}
            title="More formatting"
          >
            <ChevronDown size={13} strokeWidth={2} style={{ transform: expandedMobile ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>
        {expandedMobile && (
          <div className="flex items-center gap-0.5 px-2 pb-2 overflow-x-auto no-scrollbar border-t border-[var(--rule)]" style={{ paddingTop: '6px' }}>
            {secondaryItems.map(({ action, icon: Icon, title }) => (
              <button
                key={action}
                onClick={() => handleClick(action)}
                className="editor-toolbar-btn flex-shrink-0"
                title={title}
              >
                <Icon size={16} strokeWidth={1.7} />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div id="tour-toolbar" className="editor-toolbar border-t md:border-t-0">
      {GROUPS.map((group, gi) => (
        <div key={gi} className="flex items-center flex-shrink-0">
          {gi > 0 && <div className="editor-toolbar-sep" />}
          <div className="flex items-center gap-0.5">
            {group.items.map(({ action, icon: Icon, title, shortcut }) => {
              const isPopping = poppingAction === action;
              return (
                <div key={action} className="relative group/tip">
                  <button
                    onClick={() => handleClick(action)}
                    className={clsx(
                      'editor-toolbar-btn',
                      isPopping && 'active scale-90'
                    )}
                    title={title}
                  >
                    <Icon size={14} strokeWidth={1.8} />
                  </button>
                  {/* Tooltip */}
                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tip:flex flex-col items-center z-50">
                    <div
                      className="px-2 py-1 whitespace-nowrap rounded"
                      style={{
                        fontSize: '10px',
                        fontFamily: 'var(--ff-mono)',
                        letterSpacing: '0.04em',
                        background: 'var(--cream)',
                        color: 'var(--ink)',
                        border: '1px solid var(--rule)',
                      }}
                    >
                      {title}
                      {shortcut && <span className="ml-1.5 opacity-40">{shortcut}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
