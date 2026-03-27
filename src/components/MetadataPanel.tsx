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
  AlertCircle,
  Clock,
  MessageSquare
} from 'lucide-react';

interface MetadataPanelProps {
  id: string;
  title: string;
  slug: string;
  setSlug: (s: string) => void;
  status: 'draft' | 'review' | 'published' | 'ready_for_proofreading' | 'proofreading' | 'ready_for_upload' | 'in_review';
  setStatus: (s: 'draft' | 'review' | 'published' | 'ready_for_proofreading' | 'proofreading' | 'ready_for_upload' | 'in_review') => void;
  contentType: 'blogs' | 'survivor_stories' | 'cancer_docs';
  author_id?: string;
  setContentType: (t: 'blogs' | 'survivor_stories' | 'cancer_docs') => void;
  onAutoGenerateSlug: () => void;
  onClose?: () => void;
}

export default function MetadataPanel(props: MetadataPanelProps) {
  const { 
    id, title, slug, setSlug, 
    status, setStatus, 
    contentType, setContentType,
    onAutoGenerateSlug, author_id, onClose
  } = props;
  const { user } = useUser();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState<any[]>([]);

  React.useEffect(() => {
    if (id && id !== 'ls-active' && !id.startsWith('new-')) {
      fetch(`/api/tasks/comments?taskId=${id}`)
        .then(res => res.json())
        .then(data => setComments(data.comments || []))
        .catch(err => console.error('Error fetching comments:', err));
    }
  }, [id]);

  const handleRequestChanges = async () => {
    if (!commentText.trim()) {
      alert('Please add a comment explaining the requested changes.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tasks/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: id,
          content: `Changes Requested: ${commentText}`,
          type: 'status_change'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setComments(prev => [...prev, data.comment]);
        setStatus('draft');
        setCommentText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReadyForUpload = async () => {
    setIsSubmitting(true);
    try {
      if (commentText.trim()) {
        const res = await fetch('/api/tasks/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: id,
            content: `Proofreading Note: ${commentText}`,
            type: 'comment'
          })
        });
        if (res.ok) {
          const data = await res.json();
          setComments(prev => [...prev, data.comment]);
        }
      }
      setStatus('ready_for_upload');
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
              status === 'review' || status === 'in_review' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
              status === 'ready_for_proofreading' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' :
              status === 'proofreading' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' :
              status === 'ready_for_upload' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500' :
              'bg-[var(--bg-deep)] border-[var(--border-med)] text-[var(--text-3)]'
            }`}>
              {status === 'published' ? <Globe size={14} /> : 
               status === 'review' || status === 'in_review' ? <ShieldCheck size={14} /> : 
               status === 'ready_for_proofreading' || status === 'proofreading' || status === 'ready_for_upload' ? <Send size={14} /> :
               <Lock size={14} />}
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-tight opacity-70">Current Status</span>
                <span className="text-xs font-bold capitalize">{status.replace(/_/g, ' ')}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              {(status === 'draft') && (
                <button
                  onClick={() => setStatus('ready_for_proofreading')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-[var(--r-md)] text-xs font-bold transition-all shadow-md active:scale-[0.98]"
                >
                  <Send size={14} />
                  Submit for Proofreading
                </button>
              )}

              {status === 'ready_for_proofreading' && (
                <div className="flex items-center gap-2 p-3 bg-purple-500/5 border border-purple-500/10 rounded-[var(--r-md)] text-[10px] text-purple-600 font-medium">
                  <Info size={12} className="shrink-0" />
                  Awaiting proofreader assignment by Leadership.
                </div>
              )}

              {status === 'proofreading' && (
                <div className="flex flex-col gap-3 p-3 bg-purple-500/5 border border-purple-500/10 rounded-[var(--r-md)]">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-purple-600 flex items-center gap-1.5">
                      <MessageSquare size={10} />
                      Proofreading Feedback
                    </label>
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add notes for the author..."
                      className="w-full bg-white/50 border border-purple-500/10 rounded-[var(--r-md)] p-2 text-xs text-[var(--text)] focus:outline-none focus:border-purple-500/30 transition-all resize-none min-h-[60px]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleReadyForUpload}
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-[var(--r-md)] text-xs font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                    >
                      <ShieldCheck size={14} />
                      {isSubmitting ? 'Processing...' : 'Ready for Upload'}
                    </button>
                    <button
                      onClick={handleRequestChanges}
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-[var(--r-md)] text-xs font-bold transition-all border border-red-500/20 disabled:opacity-50"
                    >
                      <AlertCircle size={14} />
                      {isSubmitting ? 'Processing...' : 'Request Changes'}
                    </button>
                  </div>
                </div>
              )}

              {status === 'ready_for_upload' && (
                <>
                  {user?.department === 'Leadership' || user?.admin_access ? (
                    <button
                      onClick={() => setStatus('published')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-[var(--r-md)] text-xs font-bold transition-all shadow-md active:scale-[0.98]"
                    >
                      <Globe size={14} />
                      Approve & Publish
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-[var(--r-md)] text-[10px] text-cyan-600 font-medium">
                      <Clock size={12} className="shrink-0" />
                      Awaiting final Leadership approval.
                    </div>
                  )}
                </>
              )}

              {(status === 'review' || status === 'in_review') && (
                <>
                  {(user?.admin_access || user?.department === 'Leadership') && user?.id !== author_id ? (
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

              {status === 'published' && (user?.admin_access || user?.department === 'Leadership') && (
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
        </div>

        {/* Activity Feed */}
        {comments.length > 0 && (
          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] flex items-center gap-1.5">
              <Clock size={10} />
              Recent Activity
            </label>
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
              {comments.slice().reverse().map((comment) => (
                <div key={comment.id} className="flex gap-2">
                   <div className="flex-shrink-0 mt-0.5">
                    {comment.user?.avatar_url ? (
                      <img src={comment.user.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[var(--bg-deep)] flex items-center justify-center text-[8px] font-bold text-[var(--text-4)] border border-[var(--border-med)]">
                        {comment.user?.name?.[0] || '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-[var(--text-2)] truncate">{comment.user?.name}</span>
                      <span className="text-[8px] text-[var(--text-4)] font-mono whitespace-nowrap">{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className={`text-[11px] leading-relaxed mt-0.5 ${comment.type === 'status_change' ? 'text-[var(--accent)] font-medium italic' : 'text-[var(--text-3)]'}`}>
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto p-4 border-t border-[var(--border-med)] bg-[var(--bg-deep)]">
        <div className="flex items-center justify-between text-[10px] text-[var(--text-4)]">
          <span>{status === 'published' ? 'Live on Site' : 'Local Draft'}</span>
          <span className="font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
}
