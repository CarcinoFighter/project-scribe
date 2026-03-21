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

const EditorPane = dynamic(() => import('@/components/EditorPane'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text-4)' }}>
      <span style={{ fontSize: 13 }}>Loading editor...</span>
    </div>
  ),
});

// ----------------------------------------------------------------
// Templates
// ----------------------------------------------------------------
const TEMPLATES: Record<string, string> = {
  'tpl-blog': `# Blog Post Title

*Published on ${new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })} by Author Name*

## Introduction

Write a compelling opening paragraph that hooks your reader and explains what this post is about.

## Section One

Your first main point. Support it with evidence, examples, or anecdotes.

## Section Two

Your second main point. Keep paragraphs short and readable.

## Key Takeaways

- Point one
- Point two
- Point three

## Conclusion

Wrap up with a memorable closing thought and a call to action.

---

*Tags: tag1, tag2, tag3*
`,
  'tpl-article': `# Article Title

**Abstract:** A brief summary of what this article covers and its key findings.

---

## Introduction

Provide background and context. State the purpose and scope of the article.

## Background

### Related Work

Describe the existing landscape.

### Definitions

Define key terms used throughout.

## Methodology

Explain the approach or research method used.

## Results

Present findings clearly. Use tables and lists where appropriate.

| Metric | Value | Notes |
|--------|-------|-------|
|        |       |       |

## Discussion

Interpret results. Address limitations.

## Conclusion

Summarize contributions and suggest future directions.

## References

1. Author, A. (2024). *Title*. Publisher.
`,
  'tpl-notes': `# Meeting Notes

**Date:** ${new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
**Attendees:** 
**Location / Call link:** 

---

## Agenda

- [ ] Item one
- [ ] Item two
- [ ] Item three

## Discussion

### Topic 1

Notes...

### Topic 2

Notes...

## Action Items

| Task | Owner | Due Date |
|------|-------|----------|
|      |       |          |

## Next Meeting

**Date:** 
**Topics:** 
`,
};

// ----------------------------------------------------------------
// Default content
// ----------------------------------------------------------------
const DEFAULT = `# Welcome to Carcino Scribe

A beautiful, distraction-free markdown editor built by The Carcino Foundation for writers, bloggers, and researchers.

## What you can do here

Use the **toolbar** above to format text, or type Markdown directly. The right pane shows a live preview that updates as you write.

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

### Writing features

- **Document outline** sidebar tracks your headings in real time
- **Word goal** with a progress ring in the status bar (click the word count)
- **Reading progress** bar at the top of the preview
- **Focus mode** dims all lines except the current one
- **Zen mode** hides all chrome for total focus (hover to reveal)
- **Templates** for blog posts, articles, and meeting notes (Ctrl+K)
- **Export** as .md or .html

---

> "A writer only begins a book. A reader finishes it." - Samuel Johnson

Happy writing!
`;

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
function computeStats(content: string): DocumentStats {
  const text = content.trim();
  const words     = text ? text.split(/\s+/).length : 0;
  const chars     = content.length;
  const lines     = content.split('\n').length;
  const sentences = text ? (text.match(/[.!?]+/g) ?? []).length : 0;
  const readingTime = Math.max(1, Math.round(words / 200));
  return { words, chars, lines, sentences, readingTime };
}

// ----------------------------------------------------------------
// Page
// ----------------------------------------------------------------
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

  const editorRef  = useRef<EditorAPI | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const splitRef   = useRef<HTMLDivElement>(null);

  // Theme
  useEffect(() => { document.documentElement.classList.toggle('dark', isDark); }, [isDark]);

  // Load persisted state
  useEffect(() => {
    try {
      const c = localStorage.getItem('cs-content');
      const n = localStorage.getItem('cs-name');
      const d = localStorage.getItem('cs-dark');
      const g = localStorage.getItem('cs-goal');
      const toured = localStorage.getItem('cs-toured');
      if (c) setContent(c);
      if (n) setFileName(n);
      if (d !== null) setIsDark(d === 'true');
      if (g) setWordGoal(parseInt(g, 10) || 0);
      if (!toured) { setShowTour(true); }
    } catch {}
  }, []);

  // Auto-save
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

  // Global shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const mod  = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      if (mod && e.key === 's') { e.preventDefault(); setIsSaved(true); }
      if (mod && e.key === 'n') { e.preventDefault(); if (confirm('New document?')) { setContent('# New Document\n\n'); setFileName('Untitled Document'); } }
      if (mod && e.key === 'h') { e.preventDefault(); editorRef.current?.openSearch(); }
      if (mod && e.key === 'k') { e.preventDefault(); setShowCmd(c => !c); }
      if (mod && shift && e.key === 'Z') { e.preventDefault(); setZenMode(z => !z); }
      if (mod && shift && e.key === 'F') { e.preventDefault(); setFocusMode(f => !f); }
      if (e.key === 'Escape') { setShowCmd(false); setZenMode(false); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // Draggable split
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
    const up = () => { setDragging(false); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }, []);

  // Command dispatcher
  const handleCommand = useCallback((id: string) => {
    const api = editorRef.current;
    switch (id) {
      case 'bold':          api?.wrapSelection('**','**','bold text'); break;
      case 'italic':        api?.wrapSelection('*','*','italic text'); break;
      case 'strikethrough': api?.wrapSelection('~~','~~','strikethrough'); break;
      case 'code':          api?.wrapSelection('`','`','code'); break;
      case 'codeblock':     api?.insertAtCursor('\n```\ncode\n```\n'); break;
      case 'quote':         api?.prefixLines('>'); break;
      case 'link':          api?.wrapSelection('[','](url)','link text'); break;
      case 'table':         api?.insertAtCursor('\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell     | Cell     | Cell     |\n'); break;
      case 'hr':            api?.insertAtCursor('\n\n---\n\n'); break;
      case 'h1':            api?.prefixLines('#'); break;
      case 'h2':            api?.prefixLines('##'); break;
      case 'h3':            api?.prefixLines('###'); break;
      case 'ul':            api?.prefixLines('-'); break;
      case 'ol':            api?.prefixLines('', true); break;
      case 'image':         api?.insertAtCursor('![alt text](image-url)'); break;
      case 'view-editor':   setViewMode('editor'); break;
      case 'view-split':    setViewMode('split'); break;
      case 'view-preview':  setViewMode('preview'); break;
      case 'zen':           setZenMode(z => !z); break;
      case 'focus':         setFocusMode(f => !f); break;
      case 'theme':         setIsDark(d => { const nd = !d; localStorage.setItem('cs-dark', String(nd)); return nd; }); break;
      case 'search':        api?.openSearch(); break;
      case 'new':           if (confirm('New document?')) { setContent('# New Document\n\n'); setFileName('Untitled Document'); } break;
      case 'open':          openFile(); break;
      case 'export-md':     exportMd(); break;
      case 'export-html':   exportHtml(); break;
      case 'wordgoal':      /* status bar handles this via its own modal */ break;
      case 'tour':          setShowTour(true); break;
      case 'tpl-blog':
      case 'tpl-article':
      case 'tpl-notes':
        setContent(TEMPLATES[id]);
        setFileName(id === 'tpl-blog' ? 'Blog Post' : id === 'tpl-article' ? 'Research Article' : 'Meeting Notes');
        break;
    }
  }, []);

  const openFile = () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.md,.markdown,.txt';
    inp.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const r = new FileReader();
      r.onload = ev => { setContent(ev.target?.result as string); setFileName(file.name.replace(/\.(md|markdown|txt)$/, '')); };
      r.readAsText(file);
    };
    inp.click();
  };

  const exportMd = () => {
    const b = new Blob([content], { type: 'text/markdown' });
    const u = URL.createObjectURL(b);
    const a = document.createElement('a'); a.href = u; a.download = `${fileName.replace(/\s+/g,'-')}.md`; a.click(); URL.revokeObjectURL(u);
  };

  const exportHtml = () => {
    const body = previewRef.current?.innerHTML ?? '';
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${fileName}</title><style>body{font-family:'Google Sans Flex','DM Sans',sans-serif;max-width:760px;margin:40px auto;padding:0 24px;line-height:1.85;color:#18102a}h1,h2,h3{font-weight:700}a{color:#9875c1}code{background:#f0ecf8;border-radius:4px;padding:2px 6px}pre{background:#f5f0fb;border-radius:8px;padding:16px;overflow-x:auto}blockquote{border-left:3px solid #9875c1;margin:0;padding:4px 0 4px 20px;color:#4a3568;font-style:italic}table{width:100%;border-collapse:collapse}th,td{padding:8px 12px;border:1px solid rgba(152,117,193,0.2)}thead{background:rgba(152,117,193,0.08)}</style></head><body>${body}</body></html>`;
    const b = new Blob([html], { type: 'text/html' });
    const u = URL.createObjectURL(b);
    const a = document.createElement('a'); a.href = u; a.download = `${fileName.replace(/\s+/g,'-')}.html`; a.click(); URL.revokeObjectURL(u);
  };

  const handleHeadingClick = useCallback((lineNumber: number) => {
    if (viewMode !== 'preview') editorRef.current?.scrollToLine(lineNumber);
    if (viewMode !== 'editor' && previewRef.current) {
      const hs = previewRef.current.querySelectorAll('h1,h2,h3,h4,h5,h6');
      const lines = content.split('\n');
      let idx = 0;
      for (let i = 0; i < lineNumber - 1; i++) { if (/^#{1,6}\s/.test(lines[i])) idx++; }
      hs[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [viewMode, content]);

  const showEditor  = viewMode === 'editor'  || viewMode === 'split';
  const showPreview = viewMode === 'preview' || viewMode === 'split';
  const stats       = computeStats(content);

  return (
    <div
      className={`h-screen flex flex-col overflow-hidden app-bg ${isDark ? 'dark' : ''} ${zenMode ? 'zen-mode' : ''}`}
      style={{ cursor: dragging ? 'col-resize' : 'default' }}
    >
      {/* Header */}
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
        onNew={() => { if (confirm('New document?')) { setContent('# New Document\n\n'); setFileName('Untitled Document'); } }}
        onOpenFile={openFile}
        onExportMd={exportMd}
        onExportHtml={exportHtml}
        onOpenSearch={() => editorRef.current?.openSearch()}
        onOpenTour={() => setShowTour(true)}
        onOpenCmd={() => setShowCmd(true)}
        onToggleZen={() => setZenMode(z => !z)}
      />

      {/* Body */}
      <div ref={splitRef} className="flex flex-1 overflow-hidden">
        {/* Outline */}
        <OutlineSidebar
          content={content}
          isOpen={sidebarOpen}
          activeLineNumber={activeLine}
          onHeadingClick={handleHeadingClick}
        />

        {/* Main work area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Toolbar */}
          {showEditor && (
            <Toolbar
              focusMode={focusMode}
              onAction={action => {
                if (action === 'focus') { setFocusMode(f => !f); return; }
                handleCommand(action);
              }}
            />
          )}

          {/* Panes */}
          <div className="flex flex-1 overflow-hidden">
            {/* Editor pane */}
            {showEditor && (
              <div
                style={{
                  width: showPreview ? `${splitPct}%` : '100%',
                  minWidth: showPreview ? '20%' : undefined,
                  display: 'flex', flexDirection: 'column', overflow: 'hidden',
                  transition: dragging ? 'none' : 'width 0.2s',
                }}
              >
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

            {/* Draggable split handle */}
            {showEditor && showPreview && (
              <div
                className={`split-handle ${dragging ? 'dragging' : ''}`}
                onMouseDown={onSplitMouseDown}
                style={{ borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}
              />
            )}

            {/* Preview pane */}
            {showPreview && (
              <div
                style={{
                  flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  borderLeft: showEditor ? 'none' : undefined,
                }}
              >
                <PreviewPane content={content} containerRef={previewRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <StatusBar
        stats={stats}
        cursorLine={cursorLine}
        cursorCol={cursorCol}
        isSaved={isSaved}
        viewMode={viewMode}
        wordGoal={wordGoal}
        onSetWordGoal={g => { setWordGoal(g); localStorage.setItem('cs-goal', String(g)); }}
      />

      {/* Guided tour */}
      {showTour && (
        <GuidedTour
          onClose={() => {
            setShowTour(false);
            localStorage.setItem('cs-toured', '1');
          }}
        />
      )}

      {/* Command palette */}
      {showCmd && (
        <CommandPalette
          isDark={isDark}
          onClose={() => setShowCmd(false)}
          onCommand={handleCommand}
        />
      )}
    </div>
  );
}
