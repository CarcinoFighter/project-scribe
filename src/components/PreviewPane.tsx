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
      <div style={{ height: 2, background: 'var(--rule)', flexShrink: 0, position: 'relative' }}>
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
        <div className="prose-carcino mx-auto max-w-3xl">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeSlug]}
            components={{
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
              input: ({ type, checked, ...props }) =>
                type === 'checkbox' ? (
                  <input 
                    type="checkbox" 
                    checked={checked} 
                    readOnly 
                    className="mr-2 h-4 w-4 border border-[var(--rule)]"
                    style={{ accentColor: 'var(--accent)' }} 
                    {...props} 
                  />
                ) : <input type={type} {...props} />,
              table: ({ children }) => (
                <div className="overflow-x-auto my-6">
                  <table className="min-w-full border-collapse border border-[var(--rule)]">
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
          color: var(--ink);
          font-family: var(--ff-display);
        }
        .prose-carcino blockquote {
          border-left: 3px solid var(--accent);
          padding-left: 1em;
          color: var(--mid);
          font-style: italic;
          margin: 1.5em 0;
        }
        .prose-carcino pre {
          background: var(--cream);
          padding: 1em;
          overflow-x: auto;
          border: 1px solid var(--rule);
          border-left: 2px solid var(--accent);
        }
        .prose-carcino code {
          background: var(--cream);
          padding: 2px 6px;
          font-family: var(--ff-mono);
          font-size: 0.88em;
        }
        .prose-carcino pre code {
          background: transparent;
          padding: 0;
        }
        .prose-carcino th, .prose-carcino td {
          border: 1px solid var(--rule);
          padding: 8px 12px;
        }
        .prose-carcino th {
          background: var(--cream);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}