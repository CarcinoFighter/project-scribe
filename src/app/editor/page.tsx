'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { ViewMode, EditorAPI, DocumentStats } from '@/types';
import Header from '@/components/Header';
import OutlineSidebar from '@/components/OutlineSidebar';
import Toolbar from '@/components/Toolbar';
import PreviewPane from '@/components/PreviewPane';
import StatusBar from '@/components/StatusBar';
import GuidedTour from '@/components/GuidedTour';
import CommandPalette from '@/components/CommandPalette';
import ConfirmModal from '@/components/ConfirmModal';

const EditorPane = dynamic(() => import('@/components/EditorPane'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text-4)' }}>
      <span style={{ fontSize: 13 }}>Loading editor...</span>
    </div>
  ),
});

// ---------------------------------------------------------------
// Templates
// ---------------------------------------------------------------
function makeTemplates() {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const dayFull = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return {
    'tpl-blog': `# Blog Post Title\n\n*Published on ${today} by Author Name*\n\n## Introduction\n\nWrite a compelling opening paragraph that hooks your reader.\n\n## Section One\n\nYour first main point, backed with evidence or examples.\n\n## Section Two\n\nYour second main point. Keep paragraphs short.\n\n## Key Takeaways\n\n- Point one\n- Point two\n- Point three\n\n## Conclusion\n\nA memorable closing thought and a call to action.\n\n---\n\n*Tags: tag1, tag2, tag3*\n`,
    'tpl-article': `# Article Title\n\n**Abstract:** A brief summary of findings.\n\n---\n\n## Introduction\n\nBackground and context.\n\n## Background\n\n### Related Work\n\n### Definitions\n\n## Methodology\n\n## Results\n\n| Metric | Value | Notes |\n|--------|-------|-------|\n|        |       |       |\n\n## Discussion\n\n## Conclusion\n\n## References\n\n1. Author, A. (${new Date().getFullYear()}). *Title*. Publisher.\n`,
    'tpl-notes': `# Meeting Notes\n\n**Date:** ${dayFull}\n**Attendees:**\n**Location / Link:**\n\n---\n\n## Agenda\n\n- [ ] Item one\n- [ ] Item two\n- [ ] Item three\n\n## Discussion\n\n### Topic 1\n\n### Topic 2\n\n## Action Items\n\n| Task | Owner | Due Date |\n|------|-------|----------|\n|      |       |          |\n\n## Next Meeting\n\n**Date:**\n**Topics:**\n`,
  } as Record<string, string>;
}

// ---------------------------------------------------------------
// Default content
// ---------------------------------------------------------------
const DEFAULT = `# Welcome to Carcino Scribe

A beautiful, distraction-free markdown editor built by The Carcino Foundation.

## Features at a glance

Use the **toolbar** above to format text, or type Markdown directly. The right pane shows a live preview.

### Keyboard shortcuts

| Action | Shortcut |
|--------|----------|
| Bold | \`Ctrl+B\` |
| Italic | \`Ctrl+I\` |
| Find & Replace | \`Ctrl+H\` |
| Command palette | \`Ctrl+K\` |
| Zen mode | \`Ctrl+Shift+Z\` |
| Focus mode | \`Ctrl+Shift+F\` |
| New document | \`Ctrl+N\` |
| Save | \`Ctrl+S\` |

### What's included

- **Document outline** sidebar tracks headings in real time
- **Word goal** with a progress ring (click the word count in the status bar)
- **Reading progress** bar in the preview pane
- **Focus mode** dims all lines except the current one
- **Zen mode** hides all chrome — hover to reveal
- **Templates** for blog posts, articles, and meeting notes via \`Ctrl+K\`
- **Draggable split** — drag the divider to resize editor and preview
- **Export** as .md or styled .html

---

> "A writer only begins a book. A reader finishes it." — Samuel Johnson

Happy writing!
`;

// ---------------------------------------------------------------
// Stats
// ---------------------------------------------------------------
function computeStats(content: string): DocumentStats {
  const text = content.trim();
  const words       = text ? text.split(/\s+/).length : 0;
  const chars       = content.length;
  const lines       = content.split('\n').length;
  const sentences   = text ? (text.match(/[.!?]+/g) ?? []).length : 0;
  const readingTime = Math.max(1, Math.round(words / 200));
  return { words, chars, lines, sentences, readingTime };
}

// ---------------------------------------------------------------
// Tab-title messages
// ---------------------------------------------------------------
const AWAY_TITLES = [
  'Come back! Your draft misses you.',
  'Still here, waiting for you...',
  'Your story is waiting. Come back!',
  'Ideas cooling down... hop back in!',
];
const GOAL_TITLES = [
  'Goal reached! Keep going!',
  'Word goal hit! Amazing work.',
  'You did it! Goal complete.',
];
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// ---------------------------------------------------------------
// Page
// ---------------------------------------------------------------
export default function Page() {
  const [content,     setContent]     = useState(DEFAULT);
  const [fileName,    setFileName]    = useState('Untitled Document');
  const [viewMode,    setViewMode]    = useState<ViewMode>('split');
  const [isDark,      setIsDark]      = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSaved,     setIsSaved]     = useState(true);
  const [cursorLine,  setCursorLine]  = useState(1);
  const [cursorCol,   setCursorCol]   = useState(1);
  const [activeLine,  setActiveLine]  = useState(1);
  const [zenMode,     setZenMode]     = useState(false);
  const [focusMode,   setFocusMode]   = useState(false);
  const [wordGoal,    setWordGoal]    = useState(0);
  const [showTour,    setShowTour]    = useState(false);
  const [showCmd,     setShowCmd]     = useState(false);
  const [splitPct,    setSplitPct]    = useState(50);
  const [dragging,    setDragging]    = useState(false);

  // Confirm modal state
  const [confirm, setConfirm] = useState<{
    title: string; message: string;
    confirmLabel?: string; danger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Word-goal celebration (briefly)
  const [goalCelebrated, setGoalCelebrated] = useState(false);
  const prevGoalHit = useRef(false);

  const editorRef  = useRef<EditorAPI | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const splitRef   = useRef<HTMLDivElement>(null);

  // ---- Theme sync ----
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // ---- Load persisted state ----
  useEffect(() => {
    try {
      const c       = localStorage.getItem('cs-content');
      const n       = localStorage.getItem('cs-name');
      const d       = localStorage.getItem('cs-dark');
      const g       = localStorage.getItem('cs-goal');
      const toured  = localStorage.getItem('cs-toured');
      if (c) setContent(c);
      if (n) setFileName(n);
      if (d !== null) setIsDark(d === 'true');
      if (g) setWordGoal(parseInt(g, 10) || 0);
      if (!toured) setShowTour(true);
    } catch {}
  }, []);

  // ---- Auto-save (debounced) ----
  useEffect(() => {
    setIsSaved(false);
    const t = setTimeout(() => {
      try {
        localStorage.setItem('cs-content', content);
        localStorage.setItem('cs-name', fileName);
        setIsSaved(true);
      } catch {}
    }, 800);
    return () => clearTimeout(t);
  }, [content, fileName]);

  // ---- Dynamic tab title ----
  const stats = computeStats(content);

  useEffect(() => {
    const unsaved = !isSaved;
    const base    = `${fileName} — Carcino Scribe`;
    document.title = unsaved ? `\u25CF ${base}` : base;
  }, [fileName, isSaved]);

  // Away / return title
  useEffect(() => {
    const onBlur = () => {
      document.title = pick(AWAY_TITLES) + ' — Carcino Scribe';
    };
    const onFocus = () => {
      document.title = `${fileName} — Carcino Scribe`;
    };
    window.addEventListener('blur',  onBlur);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('blur',  onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, [fileName]);

  // Word-goal celebration title
  useEffect(() => {
    if (wordGoal <= 0) { prevGoalHit.current = false; return; }
    const hit = stats.words >= wordGoal;
    if (hit && !prevGoalHit.current) {
      prevGoalHit.current = true;
      setGoalCelebrated(true);
      document.title = pick(GOAL_TITLES) + ' — Carcino Scribe';
      const t = setTimeout(() => {
        document.title = `${fileName} — Carcino Scribe`;
        setGoalCelebrated(false);
      }, 3500);
      return () => clearTimeout(t);
    }
    if (!hit) prevGoalHit.current = false;
  }, [stats.words, wordGoal, fileName]);

  // ---- Global keyboard shortcuts ----
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const mod   = e.ctrlKey || e.metaKey;
      // Use e.code for shift combos to avoid layout/shift issues
      if (mod && e.key === 's') {
        e.preventDefault();
        localStorage.setItem('cs-content', content);
        localStorage.setItem('cs-name', fileName);
        setIsSaved(true);
      }
      if (mod && !e.shiftKey && e.code === 'KeyB') {
        e.preventDefault();
        editorRef.current?.wrapSelection('**', '**', 'bold text');
      }
      if (mod && !e.shiftKey && e.code === 'KeyI') {
        e.preventDefault();
        editorRef.current?.wrapSelection('*',  '*',  'italic text');
      }
      if (mod && !e.shiftKey && e.code === 'KeyN') {
        e.preventDefault();
        triggerNew();
      }
      if (mod && !e.shiftKey && e.code === 'KeyH') {
        e.preventDefault();
        editorRef.current?.openSearch();
      }
      if (mod && !e.shiftKey && e.code === 'KeyK') {
        e.preventDefault();
        setShowCmd(c => !c);
      }
      if (mod && e.shiftKey && e.code === 'KeyZ') {
        e.preventDefault();
        setZenMode(z => !z);
      }
      if (mod && e.shiftKey && e.code === 'KeyF') {
        e.preventDefault();
        setFocusMode(f => !f);
      }
      if (e.key === 'Escape') {
        setShowCmd(false);
        if (zenMode) setZenMode(false);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, fileName, zenMode]);

  // ---- Draggable split ----
  const onSplitMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    const container = splitRef.current;
    if (!container) return;
    const move = (mv: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const pct  = ((mv.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.min(Math.max(pct, 20), 80));
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup',   up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup',   up);
  }, []);

  // ---- Confirm helper ----
  const askConfirm = useCallback((
    title: string, message: string,
    onConfirm: () => void,
    opts?: { confirmLabel?: string; danger?: boolean }
  ) => {
    setConfirm({ title, message, onConfirm, ...opts });
  }, []);

  // ---- New document ----
  const triggerNew = useCallback(() => {
    askConfirm(
      'New document',
      'Starting a new document will clear your current work. Make sure you have exported anything you want to keep.',
      () => {
        setContent('# New Document\n\n');
        setFileName('Untitled Document');
        setConfirm(null);
      },
      { confirmLabel: 'New document', danger: true },
    );
  }, [askConfirm]);

  // ---- Open file ----
  const openFile = useCallback(() => {
    const inp = document.createElement('input');
    inp.type   = 'file';
    inp.accept = '.md,.markdown,.txt';
    inp.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const r = new FileReader();
      r.onload = ev => {
        const text = ev.target?.result as string;
        // If document already has meaningful content, ask first
        if (content.trim().length > 80) {
          askConfirm(
            'Replace current document?',
            `Opening "${file.name}" will replace your current document. Export it first if needed.`,
            () => {
              setContent(text);
              setFileName(file.name.replace(/\.(md|markdown|txt)$/, ''));
              setConfirm(null);
            },
            { confirmLabel: 'Open file' },
          );
        } else {
          setContent(text);
          setFileName(file.name.replace(/\.(md|markdown|txt)$/, ''));
        }
      };
      r.readAsText(file);
    };
    inp.click();
  }, [content, askConfirm]);

  // ---- Export ----
  const exportMd = useCallback(() => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${fileName.replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [content, fileName]);

  const exportHtml = useCallback(() => {
    // Grab rendered HTML from the preview pane
    const body = previewRef.current?.innerHTML ?? '';
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${fileName}</title>
<style>
  body{font-family:'Google Sans Flex','DM Sans',sans-serif;max-width:760px;margin:48px auto;padding:0 24px;line-height:1.85;color:#18102a}
  h1,h2,h3,h4{font-weight:700;letter-spacing:-0.02em}
  h1{font-size:2rem;border-bottom:2px solid #e4dff2;padding-bottom:.3em}
  h2{font-size:1.5rem;border-bottom:1px solid #e4dff2;padding-bottom:.2em}
  a{color:#9875c1;text-underline-offset:2px}
  code{background:#f0ecf8;border-radius:4px;padding:2px 6px;font-family:'JetBrains Mono',monospace;font-size:.87em}
  pre{background:#f5f0fb;border-radius:10px;padding:18px 22px;overflow-x:auto;border:1px solid #e4dff2}
  pre code{background:none;padding:0}
  blockquote{border-left:3px solid #9875c1;margin:0;padding:4px 0 4px 20px;color:#4a3568;font-style:italic}
  table{width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e4dff2}
  th{background:#f0ecf8;font-weight:600;text-align:left;padding:10px 14px;border-bottom:1px solid #d4c9e8}
  td{padding:9px 14px;border-bottom:1px solid #e4dff2}
  tr:last-child td{border-bottom:none}
  img{max-width:100%;border-radius:8px}
  hr{border:none;border-top:1px solid #e4dff2;margin:2em 0}
</style>
</head>
<body>${body}</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${fileName.replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [content, fileName]);

  // ---- Command dispatcher ----
  const handleCommand = useCallback((id: string) => {
    const api = editorRef.current;
    switch (id) {
      // Formatting
      case 'bold':          api?.wrapSelection('**', '**', 'bold text'); break;
      case 'italic':        api?.wrapSelection('*',  '*',  'italic text'); break;
      case 'strikethrough': api?.wrapSelection('~~', '~~', 'strikethrough'); break;
      case 'code':          api?.wrapSelection('`',  '`',  'code'); break;
      case 'codeblock':     api?.insertAtCursor('\n```\ncode block\n```\n'); break;
      case 'quote':         api?.prefixLines('>'); break;
      case 'link':          api?.wrapSelection('[', '](url)', 'link text'); break;
      case 'image':         api?.insertAtCursor('![alt text](image-url)'); break;
      case 'h1':            api?.prefixLines('#'); break;
      case 'h2':            api?.prefixLines('##'); break;
      case 'h3':            api?.prefixLines('###'); break;
      case 'ul':            api?.prefixLines('-'); break;
      case 'ol':            api?.prefixLines('', true); break;
      case 'hr':            api?.insertAtCursor('\n\n---\n\n'); break;
      case 'table':
        api?.insertAtCursor('\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell     | Cell     | Cell     |\n');
        break;
      // View
      case 'view-editor':   setViewMode('editor');  break;
      case 'view-split':    setViewMode('split');   break;
      case 'view-preview':  setViewMode('preview'); break;
      case 'zen':           setZenMode(z => !z);    break;
      case 'focus':         setFocusMode(f => !f);  break;
      case 'theme':
        setIsDark(d => {
          const nd = !d;
          localStorage.setItem('cs-dark', String(nd));
          return nd;
        });
        break;
      // File
      case 'search':       api?.openSearch(); break;
      case 'new':          triggerNew(); break;
      case 'open':         openFile(); break;
      case 'export-md':    exportMd(); break;
      case 'export-html':  exportHtml(); break;
      // Templates
      case 'tpl-blog':
      case 'tpl-article':
      case 'tpl-notes': {
        const tpls = makeTemplates();
        const names: Record<string, string> = {
          'tpl-blog':    'Blog Post',
          'tpl-article': 'Research Article',
          'tpl-notes':   'Meeting Notes',
        };
        const load = () => {
          setContent(tpls[id]);
          setFileName(names[id]);
          setConfirm(null);
        };
        if (content.trim().length > 80) {
          askConfirm(
            `Load ${names[id]} template?`,
            'This will replace your current document.',
            load,
            { confirmLabel: 'Load template' },
          );
        } else {
          load();
        }
        break;
      }
      // Misc
      case 'wordgoal': break; // status bar opens its own modal
      case 'tour':     setShowTour(true); break;
    }
  }, [triggerNew, openFile, exportMd, exportHtml, content, askConfirm]);

  // ---- Heading navigation ----
  const handleHeadingClick = useCallback((lineNumber: number) => {
    if (viewMode !== 'preview') editorRef.current?.scrollToLine(lineNumber);
    if (viewMode !== 'editor' && previewRef.current) {
      const hs    = previewRef.current.querySelectorAll('h1,h2,h3,h4,h5,h6');
      const lines = content.split('\n');
      let idx = 0;
      for (let i = 0; i < lineNumber - 1; i++) {
        if (/^#{1,6}\s/.test(lines[i])) idx++;
      }
      hs[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [viewMode, content]);

  // ---- Layout flags ----
  const showEditor  = viewMode === 'editor'  || viewMode === 'split';
  const showPreview = viewMode === 'preview' || viewMode === 'split';

  return (
    <div
      className={`h-screen overflow-hidden flex flex-col app-bg ${isDark ? 'dark' : ''} ${zenMode ? 'zen-mode' : ''}`}
      style={{ cursor: dragging ? 'col-resize' : 'default' }}
    >
      {/* ── Header ── */}
      <Header
        fileName={fileName}
        setFileName={setFileName}
        isDark={isDark}
        setIsDark={v => { setIsDark(v); localStorage.setItem('cs-dark', String(v)); }}
        viewMode={viewMode}
        setViewMode={setViewMode}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isSaved={isSaved}
        zenMode={zenMode}
        focusMode={focusMode}
        onNew={triggerNew}
        onOpenFile={openFile}
        onExportMd={exportMd}
        onExportHtml={exportHtml}
        onOpenSearch={() => editorRef.current?.openSearch()}
        onOpenTour={() => setShowTour(true)}
        onOpenCmd={() => setShowCmd(true)}
        onToggleZen={() => setZenMode(z => !z)}
        onToggleFocus={() => setFocusMode(f => !f)}
      />

      {/* ── Body ── */}
      <div ref={splitRef} className="flex flex-1 overflow-hidden">
        <OutlineSidebar
          content={content}
          isOpen={sidebarOpen}
          activeLineNumber={activeLine}
          onHeadingClick={handleHeadingClick}
        />

        <div className="flex flex-col flex-1 overflow-hidden">
          {showEditor && (
            <Toolbar
              focusMode={focusMode}
              onAction={action => {
                if (action === 'focus') { setFocusMode(f => !f); return; }
                handleCommand(action);
              }}
            />
          )}

          <div className="flex flex-1 overflow-hidden">
            {/* Editor */}
            {showEditor && (
              <div style={{
                width:     showPreview ? `${splitPct}%` : '100%',
                minWidth:  showPreview ? '20%' : undefined,
                display:   'flex', flexDirection: 'column', overflow: 'hidden',
                transition: dragging ? 'none' : 'width 0.18s',
              }}>
                <EditorPane
                  content={content}
                  onChange={setContent}
                  isDark={isDark}
                  focusMode={focusMode}
                  onCursorChange={(l, c) => { setCursorLine(l); setCursorCol(c); setActiveLine(l); }}
                  onReady={api => { editorRef.current = api; }}
                />
              </div>
            )}

            {/* Drag handle */}
            {showEditor && showPreview && (
              <div
                className={`split-handle ${dragging ? 'dragging' : ''}`}
                onMouseDown={onSplitMouseDown}
                style={{ borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}
              />
            )}

            {/* Preview */}
            {showPreview && (
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <PreviewPane content={content} containerRef={previewRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Status bar ── */}
      <StatusBar
        stats={stats}
        cursorLine={cursorLine}
        cursorCol={cursorCol}
        isSaved={isSaved}
        viewMode={viewMode}
        wordGoal={wordGoal}
        goalCelebrated={goalCelebrated}
        onSetWordGoal={g => { setWordGoal(g); localStorage.setItem('cs-goal', String(g)); }}
      />

      {/* ── Overlays ── */}
      {showTour && (
        <GuidedTour onClose={() => { setShowTour(false); localStorage.setItem('cs-toured', '1'); }} />
      )}

      {showCmd && (
        <CommandPalette
          isDark={isDark}
          onClose={() => setShowCmd(false)}
          onCommand={handleCommand}
        />
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
