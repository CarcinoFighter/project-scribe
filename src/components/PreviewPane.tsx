'use client';

import { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import type { RefObject } from 'react';

interface Props {
  content: string;
  containerRef: RefObject<HTMLDivElement | null>;
}

export default function PreviewPane({ content, containerRef }: Props) {
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const max = scrollHeight - clientHeight;
      setProgress(max > 0 ? (scrollTop / max) * 100 : 0);
    };
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    if (containerRef && 'current' in containerRef) {
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = scrollRef.current;
    }
  }, [containerRef]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Reading progress */}
      <div style={{ height: 2, background: 'var(--border)', flexShrink: 0, position: 'relative' }}>
        <div 
          className="progress-bar" 
          style={{ 
            width: `${progress}%`, 
            height: '100%', 
            position: 'absolute', 
            inset: 0,
            backgroundColor: 'var(--accent)',
            transition: 'width 0.2s ease-out'
          }} 
        />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto p-6 md:p-10" style={{ scrollBehavior: 'smooth' }}>
        {/* The 'prose-carcino' class acts as our style boundary */}
        <div className="prose-carcino fade-in mx-auto max-w-3xl">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeSlug]}
            components={{
              // Ensure links open in new tabs
              a: ({ href, children, ...props }) => (
                <a
                  href={href}
                  target={href?.startsWith('http') ? '_blank' : undefined}
                  rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="text-[var(--accent)] hover:underline"
                  {...props}
                >
                  {children}
                </a>
              ),
              // Fix for checkboxes/task lists
              input: ({ type, checked, ...props }) =>
                type === 'checkbox' ? (
                  <input 
                    type="checkbox" 
                    checked={checked} 
                    readOnly 
                    className="mr-2 h-4 w-4 rounded border-gray-300"
                    style={{ accentColor: 'var(--accent)' }} 
                    {...props} 
                  />
                ) : <input type={type} {...props} />,
              // Explicitly ensuring tables have borders
              table: ({ children }) => (
                <div className="overflow-x-auto my-6">
                  <table className="min-w-full border-collapse border border-[var(--border-med)]">
                    {children}
                  </table>
                </div>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>

      {/* CRITICAL FIX: Scoped CSS for lists and typography.
          This ensures bullets appear regardless of global Tailwind/CSS resets.
      */}
      <style jsx global>{`
        .prose-carcino ul {
          list-style-type: disc !important;
          padding-left: 1.6em !important;
          margin: 1.2em 0 !important;
        }
        .prose-carcino ol {
          list-style-type: decimal !important;
          padding-left: 1.6em !important;
          margin: 1.2em 0 !important;
        }
        .prose-carcino li {
          margin: 0.4em 0 !important;
          display: list-item !important;
          line-height: 1.6;
        }
        .prose-carcino h1, .prose-carcino h2, .prose-carcino h3 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 700;
          color: var(--text);
        }
        .prose-carcino blockquote {
          border-left: 4px solid var(--accent);
          padding-left: 1em;
          color: var(--text-4);
          font-style: italic;
          margin: 1.5em 0;
        }
        .prose-carcino pre {
          background: var(--bg-alt);
          padding: 1em;
          border-radius: 8px;
          overflow-x: auto;
          border: 1px solid var(--border-med);
        }
      `}</style>
    </div>
  );
}