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

  // Forward the ref for heading navigation
  useEffect(() => {
    if (containerRef && 'current' in containerRef) {
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = scrollRef.current;
    }
  }, [containerRef]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Reading progress */}
      <div style={{ height: 2, background: 'var(--border)', flexShrink: 0, position: 'relative' }}>
        <div className="progress-bar" style={{ width: `${progress}%`, height: '100%', position: 'absolute', inset: 0 }} />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto" style={{ scrollBehavior: 'smooth' }}>
        <div className="prose-carcino fade-in">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeSlug]}
            components={{
              a: ({ href, children, ...props }) => (
                <a
                  href={href}
                  target={href?.startsWith('http') ? '_blank' : undefined}
                  rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  {...props}
                >
                  {children}
                </a>
              ),
              input: ({ type, checked, ...props }) =>
                type === 'checkbox' ? (
                  <input type="checkbox" checked={checked} readOnly style={{ accentColor: '#9875c1' }} {...props} />
                ) : <input type={type} {...props} />,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
