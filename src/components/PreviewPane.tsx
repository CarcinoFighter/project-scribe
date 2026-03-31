'use client';

import { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { RefObject } from 'react';

const PREVIEW_SANITIZE_SCHEMA = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), 'u'],
};

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
    <div className="flex flex-col h-full overflow-hidden bg-[var(--cream)]">
      <div className="h-0.5 bg-[var(--rule)] flex-shrink-0 relative">
        <div 
          className="absolute top-0 left-0 h-full bg-[var(--accent)] transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-12" style={{ scrollBehavior: 'smooth' }}>
        <div className="prose-carcino max-w-none md:max-w-2xl lg:max-w-3xl mx-auto">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeSlug, rehypeRaw, [rehypeSanitize, PREVIEW_SANITIZE_SCHEMA]]}
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
                <div className="overflow-x-auto my-4 md:my-6">
                  <table className="min-w-full border-collapse border border-[var(--rule)] text-sm md:text-base">
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
        .prose-carcino {
          font-size: 15px;
          line-height: 1.7;
        }
        @media (min-width: 768px) {
          .prose-carcino {
            font-size: 16px;
          }
        }
        .prose-carcino h1 { font-size: 1.8em; margin: 1.2em 0 0.5em; }
        .prose-carcino h2 { font-size: 1.4em; margin: 1.2em 0 0.5em; }
        .prose-carcino h3 { font-size: 1.15em; margin: 1.2em 0 0.5em; }
        @media (min-width: 768px) {
          .prose-carcino h1 { font-size: 2em; }
          .prose-carcino h2 { font-size: 1.5em; }
          .prose-carcino h3 { font-size: 1.25em; }
        }
        .prose-carcino ul { list-style-type: disc; padding-left: 1.5em; margin: 1em 0; }
        .prose-carcino ol { list-style-type: decimal; padding-left: 1.5em; margin: 1em 0; }
        .prose-carcino li { margin: 0.3em 0; display: list-item; }
        .prose-carcino blockquote { border-left: 3px solid var(--accent); padding-left: 1em; color: var(--mid); font-style: italic; margin: 1.5em 0; }
        .prose-carcino pre { background: var(--cream); padding: 1em; overflow-x: auto; border: 1px solid var(--rule); border-left: 2px solid var(--accent); font-size: 0.85em; }
        .prose-carcino code { background: var(--cream); padding: 2px 6px; font-family: var(--ff-mono); font-size: 0.9em; }
        .prose-carcino pre code { background: transparent; padding: 0; }
        .prose-carcino th, .prose-carcino td { border: 1px solid var(--rule); padding: 6px 10px; }
        @media (min-width: 768px) {
          .prose-carcino th, .prose-carcino td { padding: 8px 12px; }
        }
        .prose-carcino th { background: var(--cream); font-weight: 600; }
        .prose-carcino img { max-width: 100%; height: auto; }
        .prose-carcino p { margin: 0.8em 0; }
      `}</style>
    </div>
  );
}