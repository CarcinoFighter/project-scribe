'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Bold, Italic, Strikethrough, Code, Code2, Quote, Link, Image as ImageIcon,
  Heading1, Heading2, Heading3, List, LucideIcon, ListOrdered, Minus, Table, ScanLine,
} from 'lucide-react';
import clsx from 'clsx';

export type ToolbarAction =
  | 'bold' | 'italic' | 'strikethrough' | 'code' | 'codeblock'
  | 'quote' | 'link' | 'image' | 'h1' | 'h2' | 'h3'
  | 'ul' | 'ol' | 'hr' | 'table' | 'focus';

interface Props {
  onAction: (a: ToolbarAction) => void;
  focusMode: boolean;
}

const GROUPS: { action: ToolbarAction; icon: LucideIcon; title: string }[][] = [
  [
    { action: 'h1', icon: Heading1, title: 'H1' },
    { action: 'h2', icon: Heading2, title: 'H2' },
    { action: 'h3', icon: Heading3, title: 'H3' },
  ],
  [
    { action: 'bold',          icon: Bold,         title: 'Bold (Ctrl+B)'    },
    { action: 'italic',        icon: Italic,        title: 'Italic (Ctrl+I)' },
    { action: 'strikethrough', icon: Strikethrough, title: 'Strikethrough'   },
    { action: 'code',          icon: Code,          title: 'Inline code'     },
    { action: 'codeblock',     icon: Code2,         title: 'Code block'      },
  ],
  [
    { action: 'quote', icon: Quote,     title: 'Blockquote' },
    { action: 'link',  icon: Link,      title: 'Link'       },
    { action: 'image', icon: ImageIcon, title: 'Image'      },
  ],
  [
    { action: 'ul',    icon: List,        title: 'Bullet list'     },
    { action: 'ol',    icon: ListOrdered, title: 'Numbered list'   },
    { action: 'hr',    icon: Minus,       title: 'Horizontal rule' },
    { action: 'table', icon: Table,       title: 'Insert table'    },
  ],
  [
    { action: 'focus', icon: ScanLine, title: 'Focus mode (Ctrl+Shift+F)' },
  ],
];

const FLAT_BUTTONS = GROUPS.flatMap(g => g);

export default function Toolbar({ onAction, focusMode }: Props) {
  const [poppingAction, setPoppingAction] = useState<ToolbarAction | null>(null);
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
      className="toolbar-row glass glass-rim flex items-center px-3 gap-1 flex-shrink-0 anim-slide-down"
      style={{ height: 40, borderBottom: '1px solid var(--border)', borderRadius: 0, overflowX: 'auto', animationDelay: '0.08s' }}
    >
      {GROUPS.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {group.map(({ action, icon: Icon, title }) => {
            const flatIdx = FLAT_BUTTONS.findIndex(b => b.action === action);
            const isFocusActive = action === 'focus' && focusMode;
            const isPopping = poppingAction === action;
            return (
              <button
                key={action}
                className={clsx('tb-btn anim-stagger-fast', isFocusActive && 'active', isPopping && 'icon-pop')}
                style={{ '--i': flatIdx } as React.CSSProperties}
                onClick={() => handleClick(action)}
                title={title}
                aria-label={title}
              >
                <Icon
                  size={14}
                  strokeWidth={1.9}
                  style={{
                    filter: isFocusActive ? 'drop-shadow(0 0 4px var(--accent))' : undefined,
                    transition: 'filter 0.2s',
                  }}
                />
              </button>
            );
          })}
          {gi < GROUPS.length - 1 && <div className="toolbar-sep mx-1" />}
        </div>
      ))}
    </div>
  );
}
