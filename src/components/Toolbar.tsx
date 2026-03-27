'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Bold, Italic, Strikethrough, Code, Code2, Quote, Link, Image as ImageIcon,
  Heading1, Heading2, Heading3, List, LucideIcon, ListOrdered, Minus, Table, ScanLine, MoreHorizontal, Type, WrapText
} from 'lucide-react';
import clsx from 'clsx';

import type { ViewMode } from '@/types';

export type ToolbarAction =
  | 'bold' | 'italic' | 'strikethrough' | 'code' | 'codeblock'
  | 'quote' | 'link' | 'image' | 'h1' | 'h2' | 'h3'
  | 'ul' | 'ol' | 'hr' | 'table' | 'focus'
  | 'view-editor' | 'view-preview';

interface Props {
  onAction: (a: ToolbarAction) => void;
  focusMode: boolean;
  viewMode?: ViewMode;
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
      { action: 'bold',          icon: Bold,         title: 'Bold (Ctrl+B)'    },
      { action: 'italic',        icon: Italic,       title: 'Italic (Ctrl+I)' },
      { action: 'strikethrough', icon: Strikethrough, title: 'Strikethrough'   },
    ]
  },
  {
    label: 'Code',
    items: [
      { action: 'code',      icon: Code,  title: 'Inline code' },
      { action: 'codeblock', icon: Code2, title: 'Code block'  },
    ]
  },
  {
    label: 'Insert',
    items: [
      { action: 'quote', icon: Quote,     title: 'Blockquote' },
      { action: 'link',  icon: Link,      title: 'Link'       },
      { action: 'image', icon: ImageIcon, title: 'Image'      },
    ]
  },
  {
    label: 'Lists',
    items: [
      { action: 'ul',    icon: List,        title: 'Bullet list'     },
      { action: 'ol',    icon: ListOrdered, title: 'Numbered list'   },
      { action: 'hr',    icon: Minus,       title: 'Horizontal rule' },
      { action: 'table', icon: Table,       title: 'Insert table'    },
    ]
  },
  {
    label: 'Mode',
    items: [
      { action: 'focus', icon: ScanLine, title: 'Focus mode (Ctrl+Shift+F)' },
    ]
  },
];

const ALL_ITEMS = GROUPS.flatMap(g => g.items);

export default function Toolbar({ onAction, focusMode }: Props) {
  const [poppingAction, setPoppingAction] = useState<ToolbarAction | null>(null);
  const [showMore, setShowMore] = useState(false);
  const popTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback((action: ToolbarAction) => {
    onAction(action);
    if (popTimerRef.current) clearTimeout(popTimerRef.current);
    setPoppingAction(action);
    popTimerRef.current = setTimeout(() => setPoppingAction(null), 320);
  }, [onAction]);

  return (
    <div
      id="tour-toolbar"
      className={clsx(
        "toolbar-row bg-[var(--paper)] border-b border-[var(--rule)] relative z-30 transition-all",
        showMore ? "flex-wrap py-3 px-4 h-auto" : "flex items-center px-4 py-2 overflow-x-auto"
      )}
      style={{ minHeight: '48px' }}
    >
      {GROUPS.map((group, gi) => (
        <div 
          key={group.label} 
          className={clsx(
            "flex items-center",
            gi >= 4 && !showMore && "hidden md:flex",
            gi > 0 && "ml-6"
          )}
        >
          {/* Group Label - Editorial style */}
          <span 
            className="db-cap hidden lg:block mr-3 opacity-60" 
            style={{ fontSize: '7.5px', letterSpacing: '0.2em' }}
          >
            {group.label}
          </span>
          
          <div className="flex items-center gap-1">
            {group.items.map(({ action, icon: Icon, title }) => {
              const isFocusActive = action === 'focus' && focusMode;
              const isPopping = poppingAction === action;
              
              return (
                <button
                  key={action}
                  className={clsx(
                    'flex items-center justify-center',
                    'w-8 h-8',
                    'border border-transparent',
                    'text-[var(--mid)]',
                    'transition-all duration-150',
                    'hover:border-[var(--rule)] hover:text-[var(--ink)]',
                    isFocusActive && 'active text-[var(--accent)] border-[var(--accent)] bg-[var(--accent-sub)]',
                    isPopping && 'scale-95 text-[var(--accent)]'
                  )}
                  onClick={() => handleClick(action)}
                  title={title}
                  aria-label={title}
                >
                  <Icon
                    size={15}
                    strokeWidth={1.7}
                    style={{
                      filter: isFocusActive ? 'drop-shadow(0 0 3px var(--accent-glow))' : undefined,
                    }}
                  />
                </button>
              );
            })}
          </div>
          
          {/* Vertical Rule between groups */}
          {gi < GROUPS.length - 1 && (
            <div 
              className={clsx(
                "db-vr ml-6 hidden md:block",
                gi >= 3 && !showMore && "lg:block"
              )} 
            />
          )}
        </div>
      ))}
      
      {/* Mobile More Button */}
      <button
        className={clsx(
          "md:hidden flex items-center justify-center ml-auto",
          "w-8 h-8 border border-[var(--rule)]",
          "text-[var(--mid)] hover:text-[var(--ink)] hover:border-[var(--accent)]",
          showMore && "bg-[var(--accent-sub)] text-[var(--accent)] border-[var(--accent)]"
        )}
        onClick={() => setShowMore(!showMore)}
        title="More options"
      >
        <MoreHorizontal size={16} strokeWidth={1.8} />
      </button>

      {/* Desktop overflow indicator if needed */}
      <div className="hidden md:flex lg:hidden ml-auto items-center gap-2">
        <span className="db-cap" style={{ fontSize: '7px', opacity: 0.5 }}>SCROLL →</span>
      </div>
    </div>
  );
}