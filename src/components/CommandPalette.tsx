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
      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9980,
          background: 'rgba(0,0,0,0.38)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          animation: 'cpBackdropIn 0.14s ease both',
        }}
        aria-hidden="true"
      />

      {/* ── Panel ────────────────────────────────────────────────────────── */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        style={{
          position: 'fixed',
          top: '14vh',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9990,
          width: 580,
          maxWidth: 'calc(100vw - 24px)',
          borderRadius: 14,
          overflow: 'hidden',
          background: 'var(--surface-2)',
          backdropFilter: 'blur(48px) saturate(200%)',
          WebkitBackdropFilter: 'blur(48px) saturate(200%)',
          border: '1px solid var(--border-med)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.50), 0 4px 16px rgba(0,0,0,0.24)',
          animation: 'cpPanelIn 0.18s cubic-bezier(0.22,1,0.36,1) both',
        }}
      >
        {/* ── Search input ─────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px',
          borderBottom: '1px solid var(--border)',
          height: 56,
        }}>
          <Search size={16} strokeWidth={1.8} style={{ color: 'var(--text-4)', flexShrink: 0 }} aria-hidden="true" />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-controls="cmd-results"
            aria-activedescendant={flat[selected] ? `cmd-item-${flat[selected].id}` : undefined}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search commands, formats, views…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontFamily: 'inherit', fontSize: 15, color: 'var(--text)',
              letterSpacing: '-0.01em',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 4, borderRadius: 4, display: 'flex', lineHeight: 1 }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
          <kbd
            onClick={onClose}
            style={{
              cursor: 'pointer', fontSize: 10, fontWeight: 600, padding: '2px 7px',
              borderRadius: 5, border: '1px solid var(--border-med)', background: 'var(--bg-deep)',
              color: 'var(--text-4)', flexShrink: 0, userSelect: 'none',
            }}
            aria-label="Press Escape to close"
          >
            Esc
          </kbd>
        </div>

        {/* ── Results ──────────────────────────────────────────────────── */}
        <div
          id="cmd-results"
          ref={listRef}
          role="listbox"
          style={{ maxHeight: 400, overflowY: 'auto', padding: '6px 8px 8px' }}
        >
          {filtered.length === 0 ? (
            <div style={{
              padding: '32px 16px', textAlign: 'center',
              color: 'var(--text-4)', fontSize: 13,
            }}>
              No results for <strong style={{ color: 'var(--text-3)' }}>&quot;{query}&quot;</strong>
            </div>
          ) : Object.entries(groups).map(([group, cmds]) => (
            <div key={group}>
              {/* Group header */}
              <div style={{
                padding: '8px 10px 4px',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.09em',
                textTransform: 'uppercase', color: 'var(--text-4)',
                userSelect: 'none',
              }}>
                {group}
              </div>

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
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '8px 10px',
                      borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: 13.5, textAlign: 'left',
                      background: isSelected ? 'var(--accent-subtle2)' : 'transparent',
                      color: isSelected ? 'var(--accent)' : 'var(--text-2)',
                      transition: 'background 0.07s, color 0.07s',
                    }}
                  >
                    <span style={{
                      width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isSelected ? 'var(--accent-subtle)' : 'var(--bg-deep)',
                      border: `1px solid ${isSelected ? 'var(--accent-subtle2)' : 'var(--border)'}`,
                      transition: 'background 0.07s, border-color 0.07s',
                    }}>
                      <cmd.icon size={13} strokeWidth={1.8} />
                    </span>
                    <span style={{ flex: 1, fontWeight: 500 }}>{cmd.label}</span>
                    {cmd.hint && !cmd.shortcut && (
                      <span style={{ fontSize: 11.5, color: isSelected ? 'var(--accent)' : 'var(--text-4)', opacity: 0.8 }}>
                        {cmd.hint}
                      </span>
                    )}
                    {cmd.shortcut && (
                      <span style={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
                        {cmd.shortcut.split('+').map((k, i) => (
                          <kbd key={i} style={{
                            fontSize: 10, fontWeight: 600, padding: '1px 5px',
                            borderRadius: 4, border: '1px solid var(--border-med)',
                            background: 'var(--bg-deep)', color: 'var(--text-4)',
                            lineHeight: '16px',
                          }}>{k}</kbd>
                        ))}
                      </span>
                    )}
                    {isSelected && (
                      <ArrowRight size={12} style={{ flexShrink: 0, opacity: 0.5 }} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '8px 16px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-alt)',
        }}>
          {[
            { keys: ['↑', '↓'], label: 'Navigate' },
            { keys: ['↵'],       label: 'Run' },
            { keys: ['Esc'],     label: 'Close' },
          ].map(({ keys, label }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-4)' }}>
              {keys.map(k => (
                <kbd key={k} style={{
                  padding: '1px 5px', borderRadius: 4, border: '1px solid var(--border-med)',
                  background: 'var(--bg-deep)', fontSize: 10, color: 'var(--text-4)',
                  fontFamily: 'monospace',
                }}>{k}</kbd>
              ))}
              <span>{label}</span>
            </span>
          ))}
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: 'var(--text-4)', opacity: 0.6 }}>
            {filtered.length} command{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes cpBackdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cpPanelIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.97); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)     scale(1);    }
        }
      `}</style>
    </>,
    document.body,
  );

  return portal;
}
