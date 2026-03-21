'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Bold, Italic, Strikethrough, Code, Code2, Quote, Link, Table,
  Heading1, Heading2, Heading3, List, ListOrdered, Minus,
  Eye, Columns, LayoutTemplate, Moon, Sun, Download, FolderOpen,
  Maximize2, ScanLine, Type, Search, FileText, Plus,
} from 'lucide-react';

interface Cmd {
  id: string;
  label: string;
  hint?: string;
  icon: React.FC<{ size?: number; strokeWidth?: number }>;
  shortcut?: string;
  group: string;
}

function buildCommands(isDark: boolean): Cmd[] {
  return [
    { id: 'bold',         label: 'Bold',               hint: 'Wrap selection',    icon: Bold,          shortcut: 'Ctrl+B', group: 'Format' },
    { id: 'italic',       label: 'Italic',              hint: 'Wrap selection',    icon: Italic,        shortcut: 'Ctrl+I', group: 'Format' },
    { id: 'strikethrough',label: 'Strikethrough',       hint: 'Wrap selection',    icon: Strikethrough,                      group: 'Format' },
    { id: 'code',         label: 'Inline code',         hint: 'Wrap selection',    icon: Code,                               group: 'Format' },
    { id: 'codeblock',    label: 'Code block',          hint: 'Insert at cursor',  icon: Code2,                              group: 'Format' },
    { id: 'quote',        label: 'Blockquote',          hint: 'Prefix lines',      icon: Quote,                              group: 'Format' },
    { id: 'link',         label: 'Insert link',         hint: 'Wrap selection',    icon: Link,                               group: 'Insert' },
    { id: 'table',        label: 'Insert table',        hint: '3-column starter',  icon: Table,                              group: 'Insert' },
    { id: 'hr',           label: 'Horizontal rule',     hint: 'Divider line',      icon: Minus,                              group: 'Insert' },
    { id: 'h1',           label: 'Heading 1',           hint: 'Prefix with #',     icon: Heading1,                           group: 'Insert' },
    { id: 'h2',           label: 'Heading 2',           hint: 'Prefix with ##',    icon: Heading2,                           group: 'Insert' },
    { id: 'h3',           label: 'Heading 3',           hint: 'Prefix with ###',   icon: Heading3,                           group: 'Insert' },
    { id: 'ul',           label: 'Bullet list',         hint: 'Prefix lines',      icon: List,                               group: 'Insert' },
    { id: 'ol',           label: 'Numbered list',       hint: 'Prefix lines',      icon: ListOrdered,                        group: 'Insert' },
    { id: 'tpl-blog',     label: 'Template: Blog post', hint: 'Insert starter',    icon: FileText,                           group: 'Templates' },
    { id: 'tpl-article',  label: 'Template: Article',   hint: 'Research layout',   icon: FileText,                           group: 'Templates' },
    { id: 'tpl-notes',    label: 'Template: Meeting notes', hint: 'Notes layout',  icon: FileText,                           group: 'Templates' },
    { id: 'view-editor',  label: 'Editor only',         hint: 'Hide preview',      icon: LayoutTemplate,                     group: 'View' },
    { id: 'view-split',   label: 'Split view',          hint: 'Side by side',      icon: Columns,                            group: 'View' },
    { id: 'view-preview', label: 'Preview only',        hint: 'Read mode',         icon: Eye,                                group: 'View' },
    { id: 'zen',          label: 'Zen mode',            hint: 'Hide all chrome',   icon: Maximize2,     shortcut: 'Ctrl+Shift+Z', group: 'View' },
    { id: 'focus',        label: 'Focus mode',          hint: 'Dim other lines',   icon: ScanLine,      shortcut: 'Ctrl+Shift+F', group: 'View' },
    { id: 'theme',        label: isDark ? 'Light mode' : 'Dark mode', hint: 'Toggle theme', icon: isDark ? Sun : Moon,        group: 'View' },
    { id: 'search',       label: 'Find & Replace',      hint: 'In editor',         icon: Search,        shortcut: 'Ctrl+H',       group: 'Editor' },
    { id: 'wordgoal',     label: 'Set word goal',       hint: 'Track target',      icon: Type,                               group: 'Editor' },
    { id: 'new',          label: 'New document',        hint: 'Clear and start',   icon: Plus,          shortcut: 'Ctrl+N',       group: 'File' },
    { id: 'open',         label: 'Open file',           hint: '.md .markdown .txt',icon: FolderOpen,                         group: 'File' },
    { id: 'export-md',    label: 'Export as Markdown',  hint: 'Download .md',      icon: Download,                           group: 'File' },
    { id: 'export-html',  label: 'Export as HTML',      hint: 'Download .html',    icon: Download,                           group: 'File' },
    { id: 'tour',         label: 'Start guided tour',   hint: 'Replay the tour',   icon: FileText,                           group: 'Help' },
  ];
}

interface Props {
  onClose: () => void;
  onCommand: (id: string) => void;
  isDark: boolean;
}

export default function CommandPalette({ onClose, onCommand, isDark }: Props) {
  const [query,    setQuery]    = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);

  const commands = buildCommands(isDark);

  const filtered = query.trim()
    ? commands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.group.toLowerCase().includes(query.toLowerCase()) ||
        (c.hint ?? '').toLowerCase().includes(query.toLowerCase()),
      )
    : commands;

  const groups = filtered.reduce<Record<string, Cmd[]>>((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group].push(cmd);
    return acc;
  }, {});

  const flat = Object.values(groups).flat();

  useEffect(() => { setSelected(0); }, [query]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const run = useCallback((id: string) => {
    onCommand(id);
    onClose();
  }, [onCommand, onClose]);

  /* Keyboard nav + click-outside */
  useEffect(() => {
    const kh = (e: KeyboardEvent) => {
      if (e.key === 'Escape')    { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, flat.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter')     { e.preventDefault(); if (flat[selected]) run(flat[selected].id); }
    };
    const mh = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('keydown', kh);
    document.addEventListener('mousedown', mh);
    return () => {
      window.removeEventListener('keydown', kh);
      document.removeEventListener('mousedown', mh);
    };
  }, [flat, selected, run, onClose]);

  /* Scroll selected into view */
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${selected}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  let flatIdx = 0;

  const card = (
    /* Floating card — rendered via portal onto document.body so it is
       completely outside the app's flex/overflow tree and cannot affect
       the editor's layout even when backdrop-filter triggers recomposition. */
    <div
      ref={wrapRef}
      className="fixed z-[9990] glass-overlay scale-in"
      style={{
        top: '12%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 520,
        maxWidth: 'calc(100vw - 32px)',
        borderRadius: 18,
        overflow: 'hidden',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
      }}
    >
      {/* Search input */}
      <div
        className="flex items-center gap-3 px-4"
        style={{ borderBottom: '1px solid var(--border-med)', height: 52 }}
      >
        <Search size={15} strokeWidth={1.8} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search commands..."
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            fontFamily: 'inherit', fontSize: 15, color: 'var(--text)',
          }}
        />
        <kbd style={{ cursor: 'pointer' }} onClick={onClose}>Esc</kbd>
      </div>

      {/* Results */}
      <div ref={listRef} style={{ maxHeight: 380, overflowY: 'auto', padding: '8px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            No commands match &quot;{query}&quot;
          </div>
        ) : Object.entries(groups).map(([group, cmds]) => (
          <div key={group}>
            <div style={{
              padding: '6px 10px 3px', fontSize: 10.5, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-4)',
            }}>
              {group}
            </div>
            {cmds.map(cmd => {
              const idx = flatIdx++;
              return (
                <button
                  key={cmd.id}
                  data-idx={idx}
                  className={`cmd-item ${idx === selected ? 'selected' : ''}`}
                  onClick={() => run(cmd.id)}
                  onMouseEnter={() => setSelected(idx)}
                >
                  <cmd.icon size={14} strokeWidth={1.8} style={{ flexShrink: 0, opacity: 0.75 }} />
                  <span style={{ flex: 1 }}>{cmd.label}</span>
                  {cmd.hint && (
                    <span style={{ fontSize: 11.5, color: 'var(--text-4)' }}>{cmd.hint}</span>
                  )}
                  {cmd.shortcut && <kbd>{cmd.shortcut}</kbd>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  return createPortal(card, document.body);
}
