'use client';

import {
  Bold, Italic, Strikethrough, Code, Code2, Quote, Link, Image as ImageIcon,
  Heading1, Heading2, Heading3, List, ListOrdered, Minus, Table2, Focus,
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

const GROUPS: { action: ToolbarAction; icon: React.FC<{ size?: number; strokeWidth?: number }>; title: string; shortcut?: string }[][] = [
  [
    { action: 'h1', icon: Heading1, title: 'H1' },
    { action: 'h2', icon: Heading2, title: 'H2' },
    { action: 'h3', icon: Heading3, title: 'H3' },
  ],
  [
    { action: 'bold',          icon: Bold,         title: 'Bold (Ctrl+B)',    shortcut: 'B' },
    { action: 'italic',        icon: Italic,        title: 'Italic (Ctrl+I)', shortcut: 'I' },
    { action: 'strikethrough', icon: Strikethrough, title: 'Strikethrough' },
    { action: 'code',          icon: Code,          title: 'Inline code' },
    { action: 'codeblock',     icon: Code2,         title: 'Code block' },
  ],
  [
    { action: 'quote', icon: Quote,      title: 'Blockquote' },
    { action: 'link',  icon: Link,       title: 'Link' },
    { action: 'image', icon: ImageIcon,  title: 'Image' },
  ],
  [
    { action: 'ul',    icon: List,        title: 'Bullet list' },
    { action: 'ol',    icon: ListOrdered, title: 'Numbered list' },
    { action: 'hr',    icon: Minus,       title: 'Horizontal rule' },
    { action: 'table', icon: Table2,      title: 'Insert table' },
  ],
  [
    { action: 'focus', icon: Focus, title: 'Focus mode (Ctrl+Shift+F)' },
  ],
];

export default function Toolbar({ onAction, focusMode }: Props) {
  return (
    <div
      id="tour-toolbar"
      className="toolbar-row glass glass-rim flex items-center px-3 gap-1 flex-shrink-0"
      style={{ height: 40, borderBottom: '1px solid var(--border)', borderRadius: 0, overflowX: 'auto' }}
    >
      {GROUPS.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {group.map(({ action, icon: Icon, title }) => (
            <button
              key={action}
              className={clsx('tb-btn', action === 'focus' && focusMode && 'active')}
              onClick={() => onAction(action)}
              title={title}
              aria-label={title}
            >
              <Icon size={14} strokeWidth={1.9} />
            </button>
          ))}
          {gi < GROUPS.length - 1 && <div className="toolbar-sep mx-1" />}
        </div>
      ))}
    </div>
  );
}
