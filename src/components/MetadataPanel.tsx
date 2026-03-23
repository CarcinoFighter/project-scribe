'use client';

import React, { useState } from 'react';
import { useUser } from '@/lib/useUser';
import { 
  FileText, 
  Globe, 
  Lock, 
  Tag, 
  Layers, 
  ChevronDown, 
  Info,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Send,
  AlertCircle
} from 'lucide-react';

interface MetadataPanelProps {
  title: string;
  slug: string;
  setSlug: (s: string) => void;
  status: 'draft' | 'review' | 'published';
  setStatus: (s: 'draft' | 'review' | 'published') => void;
  contentType: 'blogs' | 'survivor_stories' | 'cancer_docs';
  author_id?: string;
  setContentType: (t: 'blogs' | 'survivor_stories' | 'cancer_docs') => void;
  onAutoGenerateSlug: () => void;
  onClose?: () => void;
}

export default function MetadataPanel(props: MetadataPanelProps) {
  const { 
    title, slug, setSlug, 
    status, setStatus, 
    contentType, setContentType,
    onAutoGenerateSlug, author_id, onClose
  } = props;
  const { user } = useUser();

  return (
    <div className="glass flex flex-col h-full w-full bg-[var(--surface-0)]/95 shadow-2xl rounded-xl overflow-hidden anim-pop border border-[var(--border-med)] text-left">
      <div className="p-4 border-b border-[var(--border-med)] flex items-center justify-between bg-[var(--bg-deep)]">
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-[var(--accent)]" />
          <span className="text-sm font-bold text-[var(--text)]">Document Setup</span>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-[var(--text-4)] hover:text-[var(--text)] transition-colors p-1"
          >
            <ChevronDown size={18} className="rotate-[-90deg]" />
          </button>
        )}
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

        {/* Publication Status & Actions */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] flex items-center gap-1.5">
            <RefreshCw size={10} />
            Publication Flow
          </label>
          
          <div className="space-y-2">
            {/* Current Status Indicator */}
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--r-md)] border ${
              status === 'published' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
              status === 'review' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
              'bg-[var(--bg-deep)] border-[var(--border-med)] text-[var(--text-3)]'
            }`}>
              {status === 'published' ? <Globe size={14} /> : 
               status === 'review' ? <ShieldCheck size={14} /> : 
               <Lock size={14} />}
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-tight opacity-70">Current Status</span>
                <span className="text-xs font-bold capitalize">{status.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              {status === 'draft' && (
                <button
                  onClick={() => setStatus('review')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-[var(--r-md)] text-xs font-bold transition-all shadow-md active:scale-[0.98]"
                >
                  <Send size={14} />
                  Submit for Review
                </button>
              )}

              {status === 'review' && (
                <>
                  {user?.admin_access && user?.id !== author_id ? (
                    <button
                      onClick={() => setStatus('published')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-[var(--r-md)] text-xs font-bold transition-all shadow-md active:scale-[0.98]"
                    >
                      <ShieldCheck size={14} />
                      Approve & Publish
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/10 rounded-[var(--r-md)] text-[10px] text-amber-600 font-medium">
                      <AlertCircle size={12} className="shrink-0" />
                      {user?.id === author_id 
                        ? "Under review. You cannot self-approve your own work." 
                        : "Under review. Admin approval required."}
                    </div>
                  )}
                  <button
                    onClick={() => setStatus('draft')}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-[var(--surface-1)] hover:bg-[var(--surface-2)] text-[var(--text-2)] rounded-[var(--r-md)] text-xs transition-all border border-[var(--border-med)]"
                  >
                    Return to Draft
                  </button>
                </>
              )}

              {status === 'published' && user?.admin_access && (
                <button
                  onClick={() => setStatus('draft')}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-[var(--r-md)] text-xs font-bold transition-all border border-red-500/20"
                >
                  <Lock size={14} />
                  Unpublish to Draft
                </button>
              )}
            </div>
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
