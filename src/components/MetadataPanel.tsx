'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Globe, 
  Lock, 
  Tag, 
  Layers, 
  ChevronDown, 
  Info,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface MetadataPanelProps {
  title: string;
  slug: string;
  setSlug: (s: string) => void;
  status: 'draft' | 'published';
  setStatus: (s: 'draft' | 'published') => void;
  contentType: 'blogs' | 'survivor_stories' | 'cancer_docs';
  setContentType: (t: 'blogs' | 'survivor_stories' | 'cancer_docs') => void;
  onAutoGenerateSlug: () => void;
}

export default function MetadataPanel(props: MetadataPanelProps) {
  const { 
    title, slug, setSlug, 
    status, setStatus, 
    contentType, setContentType,
    onAutoGenerateSlug 
  } = props;

  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed right-6 bottom-20 bg-[var(--accent)] text-white p-3 rounded-full shadow-lg hover:scale-105 transition-transform z-30"
        title="Open Metadata"
      >
        <Info size={20} />
      </button>
    );
  }

  return (
    <div className="glass-raised w-72 flex flex-col h-full border-l border-[var(--border-med)] anim-slide-left overflow-y-auto">
      <div className="p-4 border-b border-[var(--border-med)] flex items-center justify-between bg-[var(--bg-deep)]">
        <div className="flex items-center gap-2">
          <Tag size={14} className="text-[var(--accent)]" />
          <span className="text-sm font-bold text-[var(--text)]">Document Metadata</span>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-[var(--text-4)] hover:text-[var(--text)] transition-colors"
        >
          <ChevronDown size={14} className="rotate-[-90deg]" />
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Content Type */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] flex items-center gap-1.5">
            <Layers size={10} />
            Content Category
          </label>
          <div className="grid grid-cols-1 gap-1">
            {[
              { id: 'blogs', label: 'Blog Posts', color: 'var(--accent)' },
              { id: 'survivor_stories', label: 'Survivor Stories', color: '#10b981' },
              { id: 'cancer_docs', label: 'Cancer Docs', color: '#3b82f6' },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setContentType(type.id as any)}
                className={`flex items-center justify-between px-3 py-2 rounded-[var(--r-md)] text-xs transition-all border ${
                  contentType === type.id 
                    ? 'bg-[var(--accent-subtle2)] border-[var(--accent-subtle)] text-[var(--accent)] font-semibold' 
                    : 'bg-transparent border-transparent text-[var(--text-3)] hover:bg-[var(--bg-deep)]'
                }`}
              >
                <span>{type.label}</span>
                {contentType === type.id && <div className="w-1.5 h-1.5 rounded-full" style={{ background: type.color }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Slug Management */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] flex items-center gap-1.5">
              <Globe size={10} />
              URL Slug
            </label>
            <button 
              onClick={onAutoGenerateSlug}
              className="text-[10px] text-[var(--accent)] hover:underline flex items-center gap-1"
            >
              <RefreshCw size={10} />
              Regenerate
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="url-friendly-slug"
              className="w-full bg-[var(--bg-deep)] border border-[var(--border-med)] rounded-[var(--r-md)] py-2 px-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors font-mono"
            />
          </div>
          <p className="text-[10px] text-[var(--text-4)] italic leading-relaxed">
            Final URL: /{contentType === 'blogs' ? 'blog' : contentType === 'survivor_stories' ? 'stories' : 'docs'}/{slug || '...'}
          </p>
        </div>

        {/* Publication Status */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] flex items-center gap-1.5">
            <RefreshCw size={10} />
            Publication Status
          </label>
          <div className="flex p-1 bg-[var(--bg-deep)] rounded-[var(--r-md)] border border-[var(--border-med)]">
            <button
              onClick={() => setStatus('draft')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-[var(--r-sm)] text-[11px] font-semibold transition-all ${
                status === 'draft' 
                  ? 'bg-[var(--surface-2)] text-[var(--text)] shadow-sm' 
                  : 'text-[var(--text-4)] hover:text-[var(--text-3)]'
              }`}
            >
              <Lock size={12} />
              Draft
            </button>
            <button
              onClick={() => setStatus('published')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-[var(--r-sm)] text-[11px] font-semibold transition-all ${
                status === 'published' 
                  ? 'bg-[var(--accent)] text-white shadow-md' 
                  : 'text-[var(--text-4)] hover:text-[var(--text-3)]'
              }`}
            >
              <Globe size={12} />
              Publish
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-3 rounded-[var(--r-md)] bg-blue-500/5 border border-blue-500/10 space-y-2">
          <div className="flex items-center gap-2 text-blue-500">
            <Info size={14} />
            <span className="text-[11px] font-bold uppercase tracking-tighter">Publication View</span>
          </div>
          <p className="text-[11px] text-[var(--text-3)] leading-relaxed">
            Changing the status to <strong>Published</strong> will make this document visible to the public via the Carcino API.
          </p>
          <button className="flex items-center gap-1.5 text-[10px] text-blue-500 font-semibold hover:underline mt-1">
            <ExternalLink size={10} />
            Preview Live Site
          </button>
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-[var(--border-med)] bg-[var(--bg-deep)]">
        <div className="flex items-center justify-between text-[10px] text-[var(--text-4)]">
          <span>Last Synced</span>
          <span className="font-mono">Never</span>
        </div>
      </div>
    </div>
  );
}
