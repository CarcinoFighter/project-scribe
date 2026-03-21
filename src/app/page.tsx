'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { ViewMode, EditorAPI, DocumentStats } from '@/types';
import Header from '@/components/Header';
import OutlineSidebar from '@/components/OutlineSidebar';
import Toolbar from '@/components/Toolbar';
import PreviewPane from '@/components/PreviewPane';
import StatusBar from '@/components/StatusBar';

// CodeMirror must be client-only
const EditorPane = dynamic(() => import('@/components/EditorPane'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
      <div className="text-sm">Loading editor...</div>
    </div>
  ),
});

// Default document content
const DEFAULT_CONTENT = `# Welcome to Carcino Scribe

A beautiful, minimal markdown editor crafted for writers, bloggers, and storytellers. Start typing and the live preview updates instantly.

## Getting Started

Use the **toolbar** above to format text, or write raw Markdown directly. Toggle between *Editor*, *Split*, and *Preview* modes using the view switcher in the header.

### Document Outline

The sidebar on the left automatically tracks your headings, giving you instant navigation. Click any heading to jump to it.

### Keyboard Shortcuts

| Action          | Shortcut         |
|-----------------|------------------|
| Bold            | \`Ctrl+B\`         |
| Italic          | \`Ctrl+I\`         |
| Find & Replace  | \`Ctrl+H\`         |
| Save            | \`Ctrl+S\`         |
| New Document    | \`Ctrl+N\`         |

## Writing in Markdown

**Bold** and *italic* text are simple. You can also ~~strike through~~ text.

> Blockquotes are perfect for pulling out key ideas or notable quotes from your article.

\`\`\`javascript
// Code blocks come with syntax highlighting
const scribe = new CarcinoScribe();
scribe.write("something beautiful");
\`\`\`

### Lists

- Bullet lists for unordered ideas
- Clean, minimal rendering
  - Nested items work too

1. Numbered lists for step-by-step guides
2. Sequential reasoning
3. Structured arguments

---

Happy writing!
`;

// Stats helper
function computeStats(content: string): DocumentStats {
  const text = content.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const chars = content.length;
  const lines = content.split('\n').length;
  const readingTime = Math.max(1, Math.round(words / 200));
  return { words, chars, lines, readingTime };
}

// Main page
export default function HomePage() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [fileName, setFileName] = useState('Untitled Document');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isDark, setIsDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSaved, setIsSaved] = useState(true);
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);
  const [activeHeadingLine, setActiveHeadingLine] = useState<number>(1);

  const editorApiRef = useRef<EditorAPI | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Theme sync
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('carcino-content');
      const savedName = localStorage.getItem('carcino-filename');
      const savedDark = localStorage.getItem('carcino-dark');
      if (saved) setContent(saved);
      if (savedName) setFileName(savedName);
      if (savedDark !== null) setIsDark(savedDark === 'true');
    } catch {}
  }, []);

  // Auto-save with debounce
  useEffect(() => {
    setIsSaved(false);
    const t = setTimeout(() => {
      try {
        localStorage.setItem('carcino-content', content);
        localStorage.setItem('carcino-filename', fileName);
        setIsSaved(true);
      } catch {}
    }, 800);
    return () => clearTimeout(t);
  }, [content, fileName]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key === 's') {
        e.preventDefault();
        localStorage.setItem('carcino-content', content);
        localStorage.setItem('carcino-filename', fileName);
        setIsSaved(true);
      }
      if (e.key === 'n') {
        e.preventDefault();
        if (confirm('Start a new document? Unsaved changes will be lost.')) {
          setContent('# New Document\n\n');
          setFileName('Untitled Document');
        }
      }
      if (e.key === 'h') {
        e.preventDefault();
        editorApiRef.current?.openSearch();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [content, fileName]);

  const handleContentChange = useCallback((val: string) => {
    setContent(val);
  }, []);

  const handleEditorReady = useCallback((api: EditorAPI) => {
    editorApiRef.current = api;
  }, []);

  const handleCursorChange = useCallback((line: number, col: number) => {
    setCursorLine(line);
    setCursorCol(col);
    setActiveHeadingLine(line);
  }, []);

  const handleHeadingClick = useCallback(
    (lineNumber: number) => {
      if (viewMode !== 'preview') {
        editorApiRef.current?.scrollToLine(lineNumber);
      }
      if (viewMode !== 'editor' && previewRef.current) {
        const headings = previewRef.current.querySelectorAll('h1,h2,h3,h4,h5,h6');
        const lines = content.split('\n');
        let headingIndex = 0;
        for (let i = 0; i < lineNumber - 1; i++) {
          if (/^#{1,6}\s/.test(lines[i])) headingIndex++;
        }
        if (headings[headingIndex]) {
          headings[headingIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },
    [viewMode, content],
  );

  const exportMarkdown = useCallback(() => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [content, fileName]);

  const exportHTML = useCallback(() => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${fileName}</title>
<style>
  body { font-family: 'Google Sans Flex','Google Sans','DM Sans',sans-serif; max-width:760px; margin:40px auto; padding:0 24px; line-height:1.85; color:#18102a; }
  h1,h2,h3,h4 { font-weight:700; }
  a { color:#9875c1; }
  code { background:#f0edf7; border-radius:4px; padding:2px 6px; }
  pre { background:#f5f0fb; border-radius:8px; padding:16px; overflow-x:auto; }
  blockquote { border-left:3px solid #9875c1; margin:0; padding:4px 0 4px 20px; color:#5a4475; font-style:italic; }
  table { width:100%; border-collapse:collapse; }
  th,td { padding:8px 12px; border:1px solid rgba(152,117,193,0.2); }
  thead { background:rgba(152,117,193,0.08); }
</style>
</head>
<body>
${previewRef.current?.innerHTML ?? ''}
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [fileName]);

  const stats = computeStats(content);
  const showEditor = viewMode === 'editor' || viewMode === 'split';
  const showPreview = viewMode === 'preview' || viewMode === 'split';

  return (
    <div className={`h-screen flex flex-col overflow-hidden app-bg ${isDark ? 'dark' : ''}`}>
      <Header
        fileName={fileName}
        setFileName={setFileName}
        isDark={isDark}
        setIsDark={setIsDark}
        viewMode={viewMode}
        setViewMode={setViewMode}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isSaved={isSaved}
        onNew={() => {
          if (confirm('Start a new document?')) {
            setContent('# New Document\n\n');
            setFileName('Untitled Document');
          }
        }}
        onOpenFile={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.md,.markdown,.txt';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
              setContent(ev.target?.result as string);
              setFileName(file.name.replace(/\.(md|markdown|txt)$/, ''));
            };
            reader.readAsText(file);
          };
          input.click();
        }}
        onExportMd={exportMarkdown}
        onExportHtml={exportHTML}
        onOpenSearch={() => editorApiRef.current?.openSearch()}
      />

      <div className="flex flex-1 overflow-hidden">
        <OutlineSidebar
          content={content}
          isOpen={sidebarOpen}
          activeLineNumber={activeHeadingLine}
          onHeadingClick={handleHeadingClick}
        />

        <div className="flex flex-col flex-1 overflow-hidden">
          {showEditor && (
            <Toolbar
              onAction={(action) => {
                const api = editorApiRef.current;
                if (!api) return;
                switch (action) {
                  case 'bold':           api.wrapSelection('**', '**', 'bold text'); break;
                  case 'italic':         api.wrapSelection('*', '*', 'italic text'); break;
                  case 'strikethrough':  api.wrapSelection('~~', '~~', 'strikethrough'); break;
                  case 'code':           api.wrapSelection('`', '`', 'code'); break;
                  case 'codeblock':      api.insertAtCursor('\n```\ncode block\n```\n'); break;
                  case 'quote':          api.prefixLines('>'); break;
                  case 'link':           api.wrapSelection('[', '](url)', 'link text'); break;
                  case 'image':          api.insertAtCursor('![alt text](image-url)'); break;
                  case 'h1':             api.prefixLines('#'); break;
                  case 'h2':             api.prefixLines('##'); break;
                  case 'h3':             api.prefixLines('###'); break;
                  case 'ul':             api.prefixLines('-'); break;
                  case 'ol':             api.prefixLines('', true); break;
                  case 'hr':             api.insertAtCursor('\n\n---\n\n'); break;
                  case 'table':
                    api.insertAtCursor(
                      '\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n',
                    );
                    break;
                  case 'search':         api.openSearch(); break;
                }
              }}
            />
          )}

          <div className="flex flex-1 overflow-hidden">
            {showEditor && (
              <div
                className="flex flex-col overflow-hidden"
                style={{
                  width: showPreview ? '50%' : '100%',
                  borderRight: showPreview ? '1px solid var(--border)' : 'none',
                  transition: 'width 0.2s',
                }}
              >
                <EditorPane
                  content={content}
                  onChange={handleContentChange}
                  isDark={isDark}
                  onCursorChange={handleCursorChange}
                  onReady={handleEditorReady}
                />
              </div>
            )}

            {showPreview && (
              <div
                className="flex-1 overflow-auto"
                style={{ width: showEditor ? '50%' : '100%' }}
              >
                <PreviewPane content={content} containerRef={previewRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      <StatusBar
        stats={stats}
        cursorLine={cursorLine}
        cursorCol={cursorCol}
        isSaved={isSaved}
        viewMode={viewMode}
      />
    </div>
  );
}
