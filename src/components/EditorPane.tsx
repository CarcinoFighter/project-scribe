'use client';

import { useCallback, useRef, useEffect } from 'react';
import ReactCodeMirror from '@uiw/react-codemirror';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView, keymap } from '@codemirror/view';
import type { ViewUpdate } from '@codemirror/view';
import { defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands';
import { searchKeymap, openSearchPanel } from '@codemirror/search';
import { createTheme } from '@uiw/codemirror-themes';
import { tags as t } from '@lezer/highlight';
import type { EditorAPI } from '@/types';

/* ------ Custom themes ------------------------------------------------------------------------------------------------------------------------------------------------ */
const makeTheme = (dark: boolean) =>
  createTheme({
    theme: dark ? 'dark' : 'light',
    settings: {
      background: 'transparent',
      foreground: dark ? '#d4c9e8' : '#18102a',
      caret: '#9875c1',
      selection: 'rgba(152,117,193,0.25)',
      selectionMatch: 'rgba(152,117,193,0.12)',
      lineHighlight: 'rgba(152,117,193,0.04)',
      gutterBackground: 'transparent',
      gutterForeground: dark ? 'rgba(152,117,193,0.35)' : 'rgba(100,80,140,0.40)',
      gutterBorder: 'transparent',
      gutterActiveForeground: '#9875c1',
      fontFamily: "'Google Sans Flex','Google Sans','DM Sans',sans-serif",
    },
    styles: [
      // Headings
      { tag: [t.heading1, t.heading2, t.heading3, t.heading4, t.heading5, t.heading6],
        color: dark ? '#b899d9' : '#5a3d8a', fontWeight: '700' },
      // Emphasis
      { tag: t.emphasis, fontStyle: 'italic', color: dark ? '#c8b8e4' : '#3d2a5c' },
      { tag: t.strong, fontWeight: '700', color: dark ? '#e2d6f0' : '#18102a' },
      { tag: t.strikethrough, textDecoration: 'line-through', color: dark ? '#7a6a9a' : '#9a8ab8' },
      // Links & URLs
      { tag: t.link, color: dark ? '#b399d4' : '#7b5aa0' },
      { tag: t.url, color: dark ? '#9875c1' : '#6a4a9a', textDecoration: 'underline' },
      // Quotes & code
      { tag: t.quote, color: dark ? '#8a7aaa' : '#6a5a88', fontStyle: 'italic' },
      { tag: t.monospace, color: dark ? '#c4a8e8' : '#6a4a9a',
        background: dark ? 'rgba(152,117,193,0.12)' : 'rgba(152,117,193,0.08)' },
      // Code syntax tokens
      { tag: t.keyword, color: dark ? '#b399d4' : '#7b5aa0', fontWeight: '600' },
      { tag: t.string, color: dark ? '#e8a87c' : '#c4522a' },
      { tag: t.comment, color: dark ? '#6a5a88' : '#9a8ab8', fontStyle: 'italic' },
      { tag: t.number, color: dark ? '#c4a8e8' : '#5a3d8a' },
      { tag: [t.function(t.variableName), t.definition(t.variableName)],
        color: dark ? '#79b8ff' : '#4a7ab5' },
      { tag: t.typeName, color: dark ? '#b399d4' : '#7b5aa0' },
      { tag: t.bool, color: dark ? '#9875c1' : '#7b5aa0' },
      { tag: t.operator, color: dark ? '#8a7aaa' : '#6a5a88' },
      { tag: t.punctuation, color: dark ? '#8a7aaa' : '#6a5a88' },
      { tag: t.processingInstruction, color: dark ? '#6a5a88' : '#9a8ab8' },
      { tag: t.bracket, color: dark ? '#8a7aaa' : '#6a5a88' },
    ],
  });

/* ------ Editor CSS extension ------------------------------------------------------------------------------------------------------------------------ */
const editorBaseTheme = EditorView.theme({
  '&': { height: '100%' },
  '.cm-scroller': { overflow: 'auto', padding: '0' },
  '.cm-content': {
    padding: '24px 0 80px',
    maxWidth: '720px',
    margin: '0 auto',
    caretColor: '#9875c1',
  },
  '.cm-line': { padding: '0 32px', letterSpacing: '0.005em' },
  '.cm-cursor': { borderLeftWidth: '2px', borderLeftColor: '#9875c1' },
  '.cm-gutters': { borderRight: 'none', paddingRight: '6px', minWidth: '42px' },
  '.cm-activeLineGutter': { background: 'transparent' },
  '.cm-foldPlaceholder': {
    background: 'rgba(152,117,193,0.15)',
    border: '1px solid rgba(152,117,193,0.3)',
    borderRadius: '4px',
    color: '#9875c1',
  },
  '.cm-tooltip': {
    background: 'rgba(22,14,42,0.9)',
    border: '1px solid rgba(152,117,193,0.2)',
    borderRadius: '8px',
    color: '#e6ddf5',
    backdropFilter: 'blur(12px)',
  },
  '.cm-completionLabel': { fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: '13px' },
});

/* ------ Component --------------------------------------------------------------------------------------------------------------------------------------------------------- */
interface EditorPaneProps {
  content: string;
  onChange: (value: string) => void;
  isDark: boolean;
  onCursorChange: (line: number, col: number) => void;
  onReady: (api: EditorAPI) => void;
}

export default function EditorPane({
  content, onChange, isDark, onCursorChange, onReady,
}: EditorPaneProps) {
  const cmRef = useRef<ReactCodeMirrorRef>(null);
  const onReadyCalled = useRef(false);

  /* Expose API once the view is available */
  const exposeApi = useCallback(() => {
    const view = cmRef.current?.view;
    if (!view || onReadyCalled.current) return;
    onReadyCalled.current = true;

    const api: EditorAPI = {
      wrapSelection(before, after, placeholder = 'text') {
        const { from, to } = view.state.selection.main;
        const selected = view.state.sliceDoc(from, to);
        const insert = `${before}${selected || placeholder}${after}`;
        view.dispatch({
          changes: { from, to, insert },
          selection: selected
            ? { anchor: from + before.length, head: from + before.length + selected.length }
            : { anchor: from + before.length, head: from + before.length + placeholder.length },
        });
        view.focus();
      },

      insertAtCursor(text) {
        const { from, to } = view.state.selection.main;
        view.dispatch({
          changes: { from, to, insert: text },
          selection: { anchor: from + text.length },
        });
        view.focus();
      },

      prefixLines(prefix, numbered = false) {
        const { from, to } = view.state.selection.main;
        const doc = view.state.doc;
        const startLine = doc.lineAt(from);
        const endLine = doc.lineAt(to);
        const changes: { from: number; to: number; insert: string }[] = [];
        let counter = 1;
        for (let i = startLine.number; i <= endLine.number; i++) {
          const line = doc.line(i);
          const p = numbered ? `${counter++}. ` : `${prefix} `;
          changes.push({ from: line.from, to: line.from, insert: p });
        }
        view.dispatch({ changes });
        view.focus();
      },

      openSearch() {
        openSearchPanel(view);
        view.focus();
      },

      scrollToLine(lineNumber) {
        if (lineNumber < 1 || lineNumber > view.state.doc.lines) return;
        const line = view.state.doc.line(lineNumber);
        view.dispatch({
          selection: { anchor: line.from },
          effects: EditorView.scrollIntoView(line.from, { y: 'start', yMargin: 80 }),
        });
        view.focus();
      },

      focus() { view.focus(); },
    };

    onReady(api);
  }, [onReady]);

  /* Track cursor updates */
  const onUpdate = useCallback(
    (update: ViewUpdate) => {
      // Try to expose API on first update
      exposeApi();

      if (update.selectionSet) {
        const { from } = update.state.selection.main;
        const line = update.state.doc.lineAt(from);
        const col = from - line.from + 1;
        onCursorChange(line.number, col);
      }
    },
    [onCursorChange, exposeApi],
  );

  /* Re-expose API if view re-mounts */
  useEffect(() => {
    onReadyCalled.current = false;
  }, []);

  const extensions = [
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    EditorView.lineWrapping,
    editorBaseTheme,
    keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab]),
  ];

  return (
    <div className="flex-1 overflow-hidden h-full">
      <ReactCodeMirror
        ref={cmRef}
        value={content}
        onChange={onChange}
        onUpdate={onUpdate}
        theme={makeTheme(isDark)}
        extensions={extensions}
        style={{ height: '100%' }}
        basicSetup={{
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
          searchKeymap: false, // we add it manually
        }}
      />
    </div>
  );
}
