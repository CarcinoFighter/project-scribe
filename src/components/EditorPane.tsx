'use client';

import { useCallback, useRef, useEffect } from 'react';
import ReactCodeMirror from '@uiw/react-codemirror';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView, keymap, Decoration, DecorationSet, WidgetType } from '@codemirror/view';
import type { ViewUpdate } from '@codemirror/view';
import { defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands';
import { searchKeymap, openSearchPanel } from '@codemirror/search';
import { createTheme } from '@uiw/codemirror-themes';
import { tags as t } from '@lezer/highlight';
import type { EditorAPI, Collaborator } from '@/types';

const makeTheme = (dark: boolean, fontFamily?: string) =>
  createTheme({
    theme: dark ? 'dark' : 'light',
    settings: {
      background:          'transparent',
      foreground:          dark ? '#e8dff5' : '#1a1028',
      caret:               '#9875c1',
      selection:           'rgba(152,117,193,0.22)',
      selectionMatch:      'rgba(152,117,193,0.12)',
      lineHighlight:       dark ? 'rgba(152,117,193,0.06)' : 'rgba(152,117,193,0.05)',
      gutterBackground:    'transparent',
      gutterForeground:    dark ? 'rgba(152,117,193,0.30)' : 'rgba(120,90,170,0.35)',
      gutterActiveForeground: '#9875c1',
      gutterBorder:        'transparent',
      fontFamily:          fontFamily ?? "'Google Sans Flex','Google Sans','DM Sans',sans-serif",
    },
    styles: [
      { tag: [t.heading1, t.heading2, t.heading3, t.heading4, t.heading5, t.heading6],
        color: dark ? '#c8a8f0' : '#5a3a98', fontWeight: '700' },
      { tag: t.emphasis,    fontStyle: 'italic',  color: dark ? '#d4c0f0' : '#3d2860' },
      { tag: t.strong,      fontWeight: '700',    color: dark ? '#ece5ff' : '#1a1028' },
      { tag: t.strikethrough, textDecoration: 'line-through', color: dark ? '#7a6898' : '#9a8ab8' },
      { tag: t.link,        color: dark ? '#b899e0' : '#7040b0' },
      { tag: t.url,         color: dark ? '#9875c1' : '#6040a8', textDecoration: 'underline' },
      { tag: t.quote,       color: dark ? '#9880b8' : '#6858a0', fontStyle: 'italic' },
      { tag: t.monospace,
        color: dark ? '#c4a8e8' : '#6a40a0',
        background: dark ? 'rgba(152,117,193,0.12)' : 'rgba(152,117,193,0.09)',
        borderRadius: '3px', padding: '0 3px' },
      { tag: t.keyword,     color: dark ? '#c4a0e8' : '#7040b0', fontWeight: '600' },
      { tag: t.string,      color: dark ? '#e8a870' : '#b84820' },
      { tag: t.comment,     color: dark ? '#6a5880' : '#9a8ab8', fontStyle: 'italic' },
      { tag: t.number,      color: dark ? '#c4a8f0' : '#5a3d9a' },
      { tag: [t.function(t.variableName), t.definition(t.variableName)],
        color: dark ? '#80beff' : '#3a6ab0' },
      { tag: t.typeName,    color: dark ? '#c4a0e8' : '#7040b0' },
      { tag: t.bool,        color: dark ? '#9875c1' : '#7040b0' },
      { tag: t.operator,    color: dark ? '#8a7098' : '#7868a8' },
      { tag: t.punctuation, color: dark ? '#8a7098' : '#7868a8' },
    ],
  });

const baseTheme = EditorView.theme({
  '&':                 { height: '100%' },
  '.cm-scroller':      { overflow: 'auto' },
  '.cm-content':       { padding: '32px 0 80px', maxWidth: '740px', margin: '0 auto', caretColor: '#9875c1' },
  '.cm-line':          { padding: '0 40px', letterSpacing: '0.006em' },
  '.cm-cursor':        { borderLeftWidth: '2px', borderLeftColor: '#9875c1' },
  '.cm-gutters':       { borderRight: 'none', paddingRight: '8px', minWidth: '46px' },
  '.cm-activeLineGutter': { background: 'transparent' },
});

// --- Remote Cursor Widget ---
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
    borderRadius: "2px 2px 2px 0",
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
  ".cm-remote-cursor-avatar": {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    objectFit: "cover"
  }
});

interface Props {
  content: string;
  onChange: (v: string) => void;
  isDark: boolean;
  focusMode: boolean;
  collaborators: Collaborator[];
  onCursorChange: (line: number, col: number) => void;
  onReady: (api: EditorAPI) => void;
}

export default function EditorPane({ content, onChange, isDark, focusMode, collaborators, onCursorChange, onReady }: Props) {
  const cmRef       = useRef<ReactCodeMirrorRef>(null);
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
          changes:   { from, to, insert: ins },
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
        const end   = doc.lineAt(to);
        const changes = [];
        let n = 1;
        for (let i = start.number; i <= end.number; i++) {
          const line = doc.line(i);
          const p    = numbered ? `${n++}. ` : `${prefix} `;
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
    };

    onReady(api);
  }, [onReady]);

  const onUpdate = useCallback((update: ViewUpdate) => {
    exposeApi();
    if (update.selectionSet) {
      const { from } = update.state.selection.main;
      const line = update.state.doc.lineAt(from);
      onCursorChange(line.number, from - line.from + 1);
    }
  }, [exposeApi, onCursorChange]);

  useEffect(() => { readyCalled.current = false; }, []);

  const extensions = [
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
          
          const colors = ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#4ade80', '#2dd4bf', '#22d3ee', '#60a5fa', '#818cf8', '#a78bfa', '#c084fc', '#f472b6'];
          const color = colors[collab.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length];
          
          deco.push(Decoration.widget({
            widget: new CursorWidget(collab.name, color, collab.avatar_url),
            side: 1
          }).range(pos));
        } catch (e) {}
      }
      return Decoration.set(deco, true);
    }),
    keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab]),
  ];

  return (
    <div className={`flex-1 overflow-hidden h-full ${focusMode ? 'focus-mode' : ''}`}>
      <ReactCodeMirror
        ref={cmRef}
        value={content}
        onChange={onChange}
        onUpdate={onUpdate}
        theme={makeTheme(isDark, typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--editor-font').trim() || undefined : undefined)}
        extensions={extensions}
        style={{ height: '100%' }}
        basicSetup={{
          lineNumbers:           true,
          highlightActiveLine:   true,
          highlightActiveLineGutter: true,
          foldGutter:            false,
          dropCursor:            true,
          allowMultipleSelections: true,
          indentOnInput:         true,
          bracketMatching:       true,
          autocompletion:        false,
          syntaxHighlighting:    true,
          searchKeymap:          false,
        }}
      />
    </div>
  );
}
