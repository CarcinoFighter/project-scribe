'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Bold, Italic, Strikethrough, Code, Code2, Quote, Link, Table,
  Heading1, Heading2, Heading3, List, ListOrdered, Minus,
  Eye, Columns, LayoutTemplate, Moon, Sun, Download, FolderOpen,
  Maximize2, ScanLine, Type, Search, LucideIcon, FileText, Plus,
  ArrowRight,
} from 'lucide-react';

interface Cmd {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  shortcut?: string;
  group: string;
}

function buildCommands(isDark: boolean): Cmd[] {
  return [
    { id: 'bold',         label: 'Bold',                hint: 'Wrap selection',      icon: Bold,          shortcut: 'Ctrl+B',       group: 'Format' },
    { id: 'italic',       label: 'Italic',              hint: 'Wrap selection',      icon: Italic,        shortcut: 'Ctrl+I',       group: 'Format' },
    { id: 'strikethrough',label: 'Strikethrough',        hint: 'Wrap selection',      icon: Strikethrough,                           group: 'Format' },
    { id: 'code',         label: 'Inline code',          hint: 'Wrap selection',      icon: Code,                                    group: 'Format' },
    { id: 'codeblock',    label: 'Code block',           hint: 'Insert at cursor',    icon: Code2,                                   group: 'Format' },
    { id: 'quote',        label: 'Blockquote',           hint: 'Prefix lines',        icon: Quote,                                   group: 'Format' },
    { id: 'link',         label: 'Insert link',          hint: 'Wrap selection',      icon: Link,                                    group: 'Insert' },
    { id: 'table',        label: 'Insert table',         hint: '3-column starter',    icon: Table,                                   group: 'Insert' },
    { id: 'hr',           label: 'Horizontal rule',      hint: 'Divider line',        icon: Minus,                                   group: 'Insert' },
    { id: 'h1',           label: 'Heading 1',            hint: 'Prefix with #',       icon: Heading1,                                group: 'Insert' },
    { id: 'h2',           label: 'Heading 2',            hint: 'Prefix with ##',      icon: Heading2,                                group: 'Insert' },
    { id: 'h3',           label: 'Heading 3',            hint: 'Prefix with ###',     icon: Heading3,                                group: 'Insert' },
    { id: 'ul',           label: 'Bullet list',          hint: 'Prefix lines',        icon: List,                                    group: 'Insert' },
    { id: 'ol',           label: 'Numbered list',        hint: 'Prefix lines',        icon: ListOrdered,                             group: 'Insert' },
    { id: 'tpl-blog',     label: 'Template: Blog post',  hint: 'Insert starter',      icon: FileText,                                group: 'Templates' },
    { id: 'tpl-article',  label: 'Template: Article',    hint: 'Research layout',     icon: FileText,                                group: 'Templates' },
    { id: 'tpl-notes',    label: 'Template: Meeting notes', hint: 'Notes layout',     icon: FileText,                                group: 'Templates' },
    { id: 'view-editor',  label: 'Editor only',          hint: 'Hide preview',        icon: LayoutTemplate,                          group: 'View' },
    { id: 'view-split',   label: 'Split view',           hint: 'Side by side',        icon: Columns,                                 group: 'View' },
    { id: 'view-preview', label: 'Preview only',         hint: 'Read mode',           icon: Eye,                                     group: 'View' },
    { id: 'zen',          label: 'Zen mode',             hint: 'Hide all chrome',     icon: Maximize2,     shortcut: 'Ctrl+Shift+Z', group: 'View' },
    { id: 'focus',        label: 'Focus mode',           hint: 'Dim other lines',     icon: ScanLine,      shortcut: 'Ctrl+Shift+F', group: 'View' },
    { id: 'theme',        label: isDark ? 'Switch to light' : 'Switch to dark', hint: 'Toggle theme', icon: isDark ? Sun : Moon, group: 'View' },
    { id: 'search',       label: 'Find & Replace',       hint: 'In editor',           icon: Search,        shortcut: 'Ctrl+H',       group: 'Editor' },
    { id: 'wordgoal',     label: 'Set word goal',        hint: 'Track target',        icon: Type,                                    group: 'Editor' },
    { id: 'new',          label: 'New document',         hint: 'Open a blank tab',    icon: Plus,          shortcut: 'Ctrl+N',       group: 'File' },
    { id: 'open',         label: 'Open file',            hint: '.md .markdown .txt',  icon: FolderOpen,                              group: 'File' },
    { id: 'export-md',    label: 'Export as Markdown',   hint: 'Download .md',        icon: Download,                                group: 'File' },
    { id: 'export-html',  label: 'Export as HTML',       hint: 'Download .html',      icon: Download,                                group: 'File' },
    { id: 'tour',         label: 'Start guided tour',    hint: 'Replay the walkthrough', icon: FileText,                             group: 'Help' },
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
  const inputRef  = useRef<HTMLInputElement>(null);
  const listRef   = useRef<HTMLDivElement>(null);
  const panelRef  = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => { setSelected(0); }, [query]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const run = useCallback((id: string) => {
    onCommand(id);
    onClose();
  }, [onCommand, onClose]);

  useEffect(() => {
    const kh = (e: KeyboardEvent) => {
      if (e.key === 'Escape')    { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, flat.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter')     { e.preventDefault(); if (flat[selected]) run(flat[selected].id); }
    };
    const mh = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('keydown', kh);
    document.addEventListener('mousedown', mh);
    return () => {
      window.removeEventListener('keydown', kh);
      document.removeEventListener('mousedown', mh);
    };
  }, [flat, selected, run, onClose]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${selected}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  let flatIdx = 0;

  const portal = createPortal(
    <>
      <div className="db-overlay" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="db-cmd-wrap db-rise-0"
      >
        <div className="db-cmd-search">
          <Search size={13} strokeWidth={1.8} className="db-cmd-search-icon" />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-controls="cmd-results"
            aria-activedescendant={flat[selected] ? `cmd-item-${flat[selected].id}` : undefined}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search documents and commands…"
            className="db-cmd-input"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="db-cmd-clear"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
          <span className="db-kbd" onClick={onClose}>Esc</span>
        </div>

        <div
          id="cmd-results"
          ref={listRef}
          role="listbox"
          className="db-cmd-list"
        >
          {filtered.length === 0 ? (
            <div className="db-cmd-empty">
              No results for <strong>"{query}"</strong>
            </div>
          ) : (
            <>
              {Object.entries(groups).map(([group, cmds]) => (
                <div key={group}>
                  <div className="db-cmd-group">{group}</div>
                  {cmds.map(cmd => {
                    const idx = flatIdx++;
                    const isSelected = idx === selected;
                    return (
                      <button
                        key={cmd.id}
                        id={`cmd-item-${cmd.id}`}
                        role="option"
                        aria-selected={isSelected}
                        data-idx={idx}
                        onClick={() => run(cmd.id)}
                        onMouseEnter={() => setSelected(idx)}
                        className={`db-cmd-item ${isSelected ? 'sel' : ''}`}
                      >
                        <cmd.icon size={12} strokeWidth={1.8} />
                        <span className="db-cmd-label">{cmd.label}</span>
                        {cmd.hint && !cmd.shortcut && (
                          <span className="db-cmd-hint">{cmd.hint}</span>
                        )}
                        {cmd.shortcut && (
                          <span className="db-cmd-shortcut">
                            {cmd.shortcut}
                          </span>
                        )}
                        {isSelected && (
                          <ArrowRight size={12} className="db-cmd-arrow" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="db-cmd-footer">
          <span className="db-cmd-footer-hint">
            <span className="db-kbd">↑</span>
            <span className="db-kbd">↓</span>
            <span>Navigate</span>
          </span>
          <span className="db-cmd-footer-hint">
            <span className="db-kbd">↵</span>
            <span>Run</span>
          </span>
          <span className="db-cmd-footer-hint">
            <span className="db-kbd">Esc</span>
            <span>Close</span>
          </span>
          <span className="db-cmd-count">
            {filtered.length} command{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </>,
    document.body,
  );

  return portal;
}