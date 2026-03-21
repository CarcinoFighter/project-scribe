'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import type { RefObject } from 'react';

interface PreviewPaneProps {
  content: string;
  containerRef: RefObject<HTMLDivElement>;
}

export default function PreviewPane({ content, containerRef }: PreviewPaneProps) {
  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto"
      style={{ scrollBehavior: 'smooth' }}
    >
      <div className="prose-carcino fade-in">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight, rehypeSlug]}
          components={{
            // Open links in new tab
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
            // Task list items (GFM)
            input: ({ type, checked, ...props }) =>
              type === 'checkbox' ? (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  style={{ accentColor: '#9875c1', marginRight: 6 }}
                  {...props}
                />
              ) : (
                <input type={type} {...props} />
              ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
