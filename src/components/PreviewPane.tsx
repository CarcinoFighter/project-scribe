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
  tagNames: [...(defaultSchema.tagNames || []), 'u', 'kbd', 'mark', 'details', 'summary', 'sup', 'sub'],
  attributes: {
    ...defaultSchema.attributes,
    '*': ['className', 'style'],
  },
};

interface Props {
  content: string;
  containerRef: RefObject<HTMLDivElement | null>;
}

// Pre-process content to support ==highlight== syntax -> <mark>
function preprocessContent(content: string): string {
  // ==highlight== → <mark>highlight</mark>
  return content.replace(/==(.+?)==/g, '<mark>$1</mark>');
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

  const processedContent = preprocessContent(content);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--cream)]">
      {/* Scroll progress bar */}
      <div className="h-px bg-[var(--rule)] flex-shrink-0 relative">
        <div 
          className="absolute top-0 left-0 h-full bg-[var(--accent)] transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto px-4 py-6 sm:px-8 sm:py-8 md:px-12 md:py-12" style={{ scrollBehavior: 'smooth' }}>
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
                    className="mr-2 h-3.5 w-3.5 border border-[var(--rule)]"
                    style={{ accentColor: 'var(--accent)', flexShrink: 0, marginTop: '3px' }}
                    {...props}
                  />
                ) : <input type={type} {...props} />,
              table: ({ children }) => (
                <div className="overflow-x-auto my-4 md:my-6">
                  <table className="min-w-full border-collapse border border-[var(--rule)] text-sm">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th style={{ border: '1px solid var(--rule)', padding: '7px 12px', background: 'var(--tape-bg)', fontWeight: '600', textAlign: 'left', fontFamily: 'var(--ff-mono)', fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td style={{ border: '1px solid var(--rule)', padding: '7px 12px' }}>
                  {children}
                </td>
              ),
              blockquote: ({ children }) => (
                <blockquote style={{ borderLeft: '2px solid var(--accent)', paddingLeft: '1em', marginLeft: 0, color: 'var(--mid)', fontStyle: 'italic', margin: '1.5em 0' }}>
                  {children}
                </blockquote>
              ),
              code: ({ children, className, ...props }) => {
                const isBlock = className?.startsWith('language-');
                if (isBlock) return <code className={className} {...props}>{children}</code>;
                return (
                  <code style={{ background: 'var(--tape-bg)', padding: '1px 5px', fontFamily: 'var(--ff-mono)', fontSize: '0.88em', color: 'var(--accent)', border: '1px solid var(--rule)' }} {...props}>
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre style={{ background: 'var(--tape-bg)', padding: '1em 1.2em', overflowX: 'auto', borderLeft: '2px solid var(--accent)', border: '1px solid var(--rule)', borderLeft: '2px solid var(--accent)', fontSize: '0.85em', fontFamily: 'var(--ff-mono)', margin: '1.5em 0', lineHeight: '1.6' }}>
                  {children}
                </pre>
              ),
            }}
          >
            {processedContent}
          </ReactMarkdown>
        </div>
      </div>

      <style jsx global>{`
        .prose-carcino {
          font-size: 15px;
          line-height: 1.75;
          color: var(--ink);
          font-family: var(--ff-display);
        }
        @media (min-width: 768px) { .prose-carcino { font-size: 16px; } }

        .prose-carcino h1 { font-size: 1.9em; font-weight: 700; letter-spacing: -0.025em; line-height: 1.2; margin: 0 0 0.6em; color: var(--ink); }
        .prose-carcino h2 { font-size: 1.4em; font-weight: 700; letter-spacing: -0.015em; margin: 1.8em 0 0.5em; padding-bottom: 0.25em; border-bottom: 1px solid var(--rule); }
        .prose-carcino h3 { font-size: 1.15em; font-weight: 600; margin: 1.4em 0 0.4em; }
        .prose-carcino h4 { font-size: 1em; font-weight: 600; margin: 1.2em 0 0.3em; color: var(--mid); }
        @media (min-width: 768px) {
          .prose-carcino h1 { font-size: 2.1em; }
          .prose-carcino h2 { font-size: 1.5em; }
          .prose-carcino h3 { font-size: 1.25em; }
        }
        .prose-carcino p { margin: 0 0 0.9em; }
        .prose-carcino ul { list-style-type: none; padding-left: 1.2em; margin: 0.8em 0; }
        .prose-carcino ul li::before { content: '–'; position: absolute; left: -1em; color: var(--accent); }
        .prose-carcino ul li { position: relative; margin: 0.3em 0; }
        .prose-carcino ol { list-style-type: decimal; padding-left: 1.6em; margin: 0.8em 0; }
        .prose-carcino ol li { margin: 0.3em 0; }
        .prose-carcino li { display: list-item; }
        /* Task list items */
        .prose-carcino .task-list-item { list-style: none; display: flex; align-items: flex-start; gap: 8px; }
        .prose-carcino .task-list-item::before { display: none; }
        .prose-carcino .task-list-item input[type="checkbox"] { margin-top: 3px; }
        /* Highlight */
        .prose-carcino mark { background: color-mix(in srgb, var(--accent) 20%, transparent); color: var(--ink); padding: 1px 3px; }
        /* KBD */
        .prose-carcino kbd { font-family: var(--ff-mono); font-size: 0.8em; padding: 1px 6px; border: 1px solid var(--rule); border-bottom-width: 2px; background: var(--cream); color: var(--ink); white-space: nowrap; }
        /* Footnotes */
        .prose-carcino sup { font-size: 0.75em; color: var(--accent); }
        .prose-carcino .footnotes { font-size: 0.85em; color: var(--mid); border-top: 1px solid var(--rule); margin-top: 2em; padding-top: 1em; }
        /* Details/Summary */
        .prose-carcino details { border: 1px solid var(--rule); padding: 0.5em 1em; margin: 1em 0; }
        .prose-carcino summary { cursor: pointer; font-weight: 500; color: var(--accent); user-select: none; }
        .prose-carcino summary:hover { opacity: 0.8; }
        /* HR */
        .prose-carcino hr { border: none; border-top: 1px solid var(--rule); margin: 2em 0; }
        /* Images */
        .prose-carcino img { max-width: 100%; height: auto; border: 1px solid var(--rule); }
        /* Strong / em */
        .prose-carcino strong { font-weight: 700; color: var(--ink); }
        .prose-carcino em { font-style: italic; }
        .prose-carcino del { color: var(--mid); }
        /* Links */
        .prose-carcino a { color: var(--accent); text-decoration: none; border-bottom: 1px solid color-mix(in srgb, var(--accent) 40%, transparent); }
        .prose-carcino a:hover { border-bottom-color: var(--accent); }
      `}</style>
    </div>
  );
}
