'use client';

import { useCallback, useRef, useEffect, useMemo } from 'react';
import ReactCodeMirror from '@uiw/react-codemirror';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView, keymap, Decoration, WidgetType } from '@codemirror/view';
import type { ViewUpdate } from '@codemirror/view';
import { Transaction } from '@codemirror/state';
import { defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands';
import { searchKeymap, openSearchPanel } from '@codemirror/search';
import { createTheme } from '@uiw/codemirror-themes';
import { tags as t } from '@lezer/highlight';
import type { EditorAPI, Collaborator } from '@/types';
import { getCollaboratorColor } from '@/lib/utils';
import { diff_match_patch } from 'diff-match-patch';

const dmp = new diff_match_patch();

/** Read the current theme's CSS custom properties from the document root. */
function readThemeVars() {
  if (typeof window === 'undefined') return null;
  const s = getComputedStyle(document.documentElement);
  const g = (v: string) => s.getPropertyValue(v).trim();
  return {
    accent: g('--accent')  || '#9875c1',
    text:   g('--text')    || '#f0f0f0',
    text3:  g('--text-3')  || '#b8b8b8',
    text4:  g('--text-4')  || '#787878',
  };
}

/**
 * Build a CodeMirror theme from the active CSS variables so the editor
 * always matches the selected app theme (Catppuccin, Nord, Gruvbox, etc.)
 * instead of being locked to the default purple palette.
 */
const makeTheme = (isDark: boolean, fontFamily?: string) => {
  const v = readThemeVars();
  const accent = v?.accent ?? '#9875c1';
  const text   = v?.text   ?? (isDark ? '#f0f0f0' : '#1a1028');
  const text3  = v?.text3  ?? (isDark ? '#b8b8b8' : '#4a4458');
  const text4  = v?.text4  ?? (isDark ? '#787878' : '#9a8ab8');

  return createTheme({
    theme: isDark ? 'dark' : 'light',
    settings: {
      background:             'transparent',
      foreground:             text,
      caret:                  accent,
      selection:              `${accent}${isDark ? '38' : '30'}`,
      selectionMatch:         `${accent}20`,
      lineHighlight:          `${accent}0e`,
      gutterBackground:       'transparent',
      gutterForeground:       text4,
      gutterActiveForeground: accent,
      gutterBorder:           'transparent',
      fontFamily: fontFamily ?? "'Google Sans Flex','Google Sans','DM Mono',sans-serif",
    },
    styles: [
      { tag: [t.heading1, t.heading2, t.heading3, t.heading4, t.heading5, t.heading6], color: accent, fontWeight: '700' },
      { tag: t.emphasis,                            fontStyle: 'italic', color: text3 },
      { tag: t.strong,                              fontWeight: '700',   color: text  },
      { tag: t.strikethrough,                       textDecoration: 'line-through', color: text4 },
      { tag: t.link,                                color: accent },
      { tag: t.url,                                 color: accent, textDecoration: 'underline' },
      { tag: t.quote,                               color: text3, fontStyle: 'italic' },
      { tag: t.monospace,                           color: accent, background: `${accent}18`, padding: '0 3px' },
      { tag: t.keyword,                             color: accent, fontWeight: '600' },
      { tag: t.string,                              color: isDark ? '#e8a870' : '#b84820' },
      { tag: t.comment,                             color: text4, fontStyle: 'italic' },
      { tag: t.number,                              color: accent },
      { tag: [t.function(t.variableName), t.definition(t.variableName)], color: isDark ? '#80beff' : '#3a6ab0' },
      { tag: t.typeName,                            color: accent },
      { tag: t.bool,                                color: accent },
      { tag: t.operator,                            color: text4 },
      { tag: t.punctuation,                         color: text4 },
    ],
  });
};

const baseTheme = EditorView.theme({
  '&': { height: '100%' },
  '.cm-scroller': { overflow: 'auto' },
  '.cm-content': { 
    padding: '24px 16px 80px', 
    maxWidth: '100%',
    caretColor: 'var(--accent)',
    fontSize: '15px',
  },
  '.cm-line': { 
    padding: '0 8px', 
    letterSpacing: '0.006em',
    lineHeight: '1.6',
  },
  '.cm-cursor': { borderLeftWidth: '2px', borderLeftColor: 'var(--accent)' },
  '.cm-gutters': { borderRight: 'none', paddingRight: '4px', minWidth: '40px' },
  '.cm-activeLineGutter': { background: 'transparent' },
  '@media (min-width: 768px)': {
    '.cm-content': { 
      padding: '32px 24px 80px', 
      maxWidth: '740px', 
      margin: '0 auto',
      fontSize: '16px',
    },
    '.cm-line': { padding: '0 12px' },
    '.cm-gutters': { paddingRight: '8px', minWidth: '46px' },
  },
});

class CursorWidget extends WidgetType {
  constructor(readonly name: string, readonly color: string, readonly avatar: string | null) { super(); }
  toDOM() {
    const wrap = document.createElement("span");
    wrap.className = "cm-remote-cursor-wrap";
    const cursor = document.createElement("span");
    cursor.className = "cm-remote-cursor";
    cursor.style.borderLeftColor = this.color;
    const label = document.createElement("div");
    label.className = "cm-remote-cursor-label";
    label.style.backgroundColor = this.color;
    if (this.avatar) {
      const img = document.createElement("img");
      img.src = this.avatar;
      img.className = "cm-remote-cursor-avatar";
      label.appendChild(img);
    }
    const nameSpan = document.createElement("span");
    nameSpan.innerText = this.name;
    label.appendChild(nameSpan);
    wrap.appendChild(cursor);
    wrap.appendChild(label);
    return wrap;
  }
}

const remoteCursorStyle = EditorView.baseTheme({
  ".cm-remote-cursor-wrap": { position: "relative" },
  ".cm-remote-cursor": {
    position: "absolute",
    height: "1.2em",
    borderLeft: "2px solid",
    marginLeft: "-1px",
    pointerEvents: "none",
    zIndex: "10"
  },
  ".cm-remote-cursor-label": {
    position: "absolute",
    top: "-1.4em",
    left: "0",
    whiteSpace: "nowrap",
    fontSize: "10px",
    fontWeight: "600",
    color: "white",
    padding: "1px 4px",
    pointerEvents: "none",
    zIndex: "11",
    display: "flex",
    alignItems: "center",
    gap: "3px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    opacity: "0",
    transition: "opacity 0.2s"
  },
  ".cm-remote-cursor-wrap:hover .cm-remote-cursor-label": { opacity: "1" },
  ".cm-remote-cursor-avatar": { width: "12px", height: "12px", objectFit: "cover" }
});

interface Props {
  content: string;
  onChange: (v: string) => void;
  isDark: boolean;
  /** Active theme ID — triggers editor re-theme when switching dark→dark or light→light */
  themeId?: string;
  focusMode: boolean;
  collaborators: Collaborator[];
  onCursorChange: (line: number, col: number) => void;
  onReady: (api: EditorAPI) => void;
}

export default function EditorPane({ content, onChange, isDark, themeId, focusMode, collaborators, onCursorChange, onReady }: Props) {
  const cmRef = useRef<ReactCodeMirrorRef>(null);
  const readyCalled = useRef(false);

  const exposeApi = useCallback(() => {
    const view = cmRef.current?.view;
    if (!view || readyCalled.current) return;
    readyCalled.current = true;

    const api: EditorAPI = {
      wrapSelection(before, after, placeholder = 'text') {
        const { from, to } = view.state.selection.main;
        const sel = view.state.sliceDoc(from, to);
        const ins = `${before}${sel || placeholder}${after}`;
        view.dispatch({
          changes: { from, to, insert: ins },
          selection: sel
            ? { anchor: from + before.length, head: from + before.length + sel.length }
            : { anchor: from + before.length, head: from + before.length + placeholder.length },
        });
        view.focus();
      },
      insertAtCursor(text) {
        const { from, to } = view.state.selection.main;
        view.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + text.length } });
        view.focus();
      },
      prefixLines(prefix, numbered = false) {
        const { from, to } = view.state.selection.main;
        const doc = view.state.doc;
        const start = doc.lineAt(from);
        const end = doc.lineAt(to);
        const changes = [];
        let n = 1;
        for (let i = start.number; i <= end.number; i++) {
          const line = doc.line(i);
          const p = numbered ? `${n++}. ` : `${prefix} `;
          changes.push({ from: line.from, to: line.from, insert: p });
        }
        view.dispatch({ changes });
        view.focus();
      },
      openSearch() { openSearchPanel(view); view.focus(); },
      scrollToLine(lineNumber) {
        if (lineNumber < 1 || lineNumber > view.state.doc.lines) return;
        const line = view.state.doc.line(lineNumber);
        view.dispatch({
          selection: { anchor: line.from },
          effects: EditorView.scrollIntoView(line.from, { y: 'start', yMargin: 90 }),
        });
        view.focus();
      },
      focus() { view.focus(); },
      getValue() { return view.state.doc.toString(); },
      applyRemotePatch(patchText: string) {
        const currentContent = view.state.doc.toString();
        try {
          const patches = dmp.patch_fromText(patchText);
          const [newContent] = dmp.patch_apply(patches, currentContent);
          
          // Only dispatch if content actually changed
          if (newContent !== currentContent) {
            // Preserve cursor position
            const cursor = view.state.selection.main.head;
            view.dispatch({
              changes: { from: 0, to: currentContent.length, insert: newContent },
              annotations: [Transaction.remote.of(true)],
              userEvent: 'remote.sync',
              selection: { anchor: Math.min(cursor, newContent.length) },
            });
          }
        } catch (err) {
          console.error('[Editor] Remote patch failed completely:', err);
        }
      },
    };

    onReady(api);
  }, [onReady]);

  const onUpdate = useCallback((update: ViewUpdate) => {
    exposeApi();
    
    // Check if any transaction in this update was remote
    const isRemote = update.transactions.some(tr => tr.annotation(Transaction.remote));
    
    if (update.selectionSet) {
      const { from } = update.state.selection.main;
      const line = update.state.doc.lineAt(from);
      onCursorChange(line.number, from - line.from + 1);
    }

    // We only call onChange if the update was NOT remote and the doc changed
    if (update.docChanged && !isRemote) {
      onChange(update.state.doc.toString());
    }
  }, [exposeApi, onCursorChange, onChange]);

  useEffect(() => { readyCalled.current = false; }, []);

  const theme = useMemo(() => {
    const font = typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--editor-font').trim() || undefined : undefined;
    return makeTheme(isDark, font);
  // themeId ensures we recompute even when isDark doesn't change (e.g. Nord → Dracula)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark, themeId]);

  const extensions = useMemo(() => [
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    EditorView.lineWrapping,
    baseTheme,
    remoteCursorStyle,
    EditorView.decorations.of((view) => {
      const deco = [];
      for (const collab of collaborators) {
        if (!collab.cursor) continue;
        try {
          const pos = view.state.doc.line(Math.min(collab.cursor.line, view.state.doc.lines)).from + 
                     Math.min(collab.cursor.col - 1, view.state.doc.line(Math.min(collab.cursor.line, view.state.doc.lines)).length);
          const color = getCollaboratorColor(collab.id);
          deco.push(Decoration.widget({
            widget: new CursorWidget(collab.name, color, collab.avatar_url),
            side: 1
          }).range(pos));
        } catch (e) {}
      }
      return Decoration.set(deco, true);
    }),
    keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab]),
  ], [collaborators]);

  const basicSetup = useMemo(() => ({
    lineNumbers: true,
    highlightActiveLine: true,
    highlightActiveLineGutter: true,
    foldGutter: false,
    dropCursor: true,
    allowMultipleSelections: true,
    indentOnInput: true,
    bracketMatching: true,
    autocompletion: false,
    syntaxHighlighting: true,
    searchKeymap: false,
  }), []);

  return (
    <div className={`flex-1 overflow-hidden h-full ${focusMode ? 'focus-mode' : ''}`}>
      <ReactCodeMirror
        ref={cmRef}
        value={content}
        onUpdate={onUpdate}
        theme={theme}
        extensions={extensions}
        style={{ height: '100%' }}
        basicSetup={basicSetup}
      />
    </div>
  );
}