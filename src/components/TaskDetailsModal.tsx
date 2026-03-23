'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Calendar, Clock, User, MessageSquare, Send, 
  RefreshCw, ChevronRight, Loader2, AlertCircle,
  Briefcase, FileText, BookOpen, Heart, Megaphone
} from 'lucide-react';
import Image from 'next/image';
import MultiPersonSelect from './MultiPersonSelect';

interface Comment {
  id: string;
  content: string;
  type: 'comment' | 'reassignment' | 'status_change';
  created_at: string;
  user: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

interface TaskDetailsModalProps {
  task: any;
  onClose: () => void;
  onUpdate: () => void;
  isAdmin: boolean;
  userId?: string;
  onOpenSubmission?: (taskId: string, title: string) => void;
}

const CATEGORY_MAP: Record<string, any> = {
  article: { icon: FileText, color: '#3b82f6', label: 'Research Article' },
  blog: { icon: BookOpen, color: '#9875c1', label: 'Blog Post' },
  survivor_story: { icon: Heart, color: '#10b981', label: 'Survivor Story' },
  awareness_post: { icon: Megaphone, color: '#f59e0b', label: 'Awareness Post' },
  task: { icon: Briefcase, color: '#6b7280', label: 'Task Assignment' },
};

export default function TaskDetailsModal({ task, onClose, onUpdate, isAdmin, userId, onOpenSubmission }: TaskDetailsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isReassigning, setIsReassigning] = useState(false);
  const [newAssigneeIds, setNewAssigneeIds] = useState<string[]>(task.assigned_to_ids || []);
  const [reassignReason, setReassignReason] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/tasks/comments?taskId=${task.id}`);
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments || []);
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [task.id]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleAddComment = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!commentText.trim()) return;

    setSubmitting(true);
    setCommentError(null);
    try {
      const res = await fetch('/api/tasks/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          content: commentText.trim(),
          type: 'comment'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setComments(prev => [...prev, data.comment]);
        setCommentText('');
      } else {
        const err = await res.json();
        setCommentError(err.error || 'Failed to post comment');
      }
    } catch (err) {
      console.error(err);
      setCommentError('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReassign = async () => {
    if (newAssigneeIds.length === 0) return;
    
    setSubmitting(true);
    try {
      // 1. Update task assignees
      const taskRes = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          assigned_to_ids: newAssigneeIds
        })
      });

      if (taskRes.ok) {
        // 2. Add reassignment comment
        const commentRes = await fetch('/api/tasks/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: task.id,
            content: reassignReason || 'Task reassigned to new team members.',
            type: 'reassignment'
          })
        });

        if (commentRes.ok) {
          const data = await commentRes.json();
          setComments(prev => [...prev, data.comment]);
          setIsReassigning(false);
          setReassignReason('');
          onUpdate();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const cat = CATEGORY_MAP[task.category] || CATEGORY_MAP['task'];

  return createPortal(
    <div className="fixed inset-0 z-[9900] flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xl anim-fade-in text-[var(--text)]">
      <div className="glass-raised w-full max-w-2xl h-full sm:h-[85vh] sm:rounded-[var(--r-xl)] overflow-hidden flex flex-col anim-slide-down border border-[var(--border-strong)]">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[var(--border-med)] bg-[var(--bg-deep)] flex items-start justify-between">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${cat.color}18` }}>
              <cat.icon size={24} style={{ color: cat.color }} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-[var(--border-med)] bg-[var(--surface-0)] text-[var(--text-4)]">
                   {cat.label}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                  task.status === 'done' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 
                  task.status === 'in_progress' ? 'text-blue-500 bg-blue-500/10 border-blue-500/20' : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                }`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight">{task.title}</h2>
              <div className="flex items-center gap-3 mt-2 text-[var(--text-4)]">
                <div className="flex items-center gap-1.5 text-xs">
                  <Calendar size={12} />
                  <span>Due {new Date(task.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
                <div className="flex items-center gap-1.5 text-xs">
                  <Clock size={12} />
                  <span>Assigned {new Date(task.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--surface-1)] rounded-full transition-colors text-[var(--text-4)]">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Main Feed */}
          <div className="flex-1 flex flex-col border-r border-[var(--border-med)] overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-[var(--bg)]/30">
              {task.description && (
                <div className="p-4 rounded-[var(--r-lg)] bg-[var(--bg-deep)] border border-[var(--border-med)] text-sm text-[var(--text-3)] leading-relaxed shadow-sm">
                  {task.description}
                </div>
              )}

              {loading ? (
                <div className="py-12 flex flex-col items-center gap-3 text-[var(--text-4)]">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-xs">Loading activity...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4">
                      {comment.user.avatar_url ? (
                        <Image src={comment.user.avatar_url} alt={comment.user.name} width={34} height={34} className="rounded-full flex-shrink-0" />
                      ) : (
                        <div className="w-[34px] h-[34px] rounded-full bg-[var(--accent)] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                          {comment.user.name[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs font-bold text-[var(--text)]">{comment.user.name}</span>
                          <span className="text-[10px] text-[var(--text-4)]">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {comment.type === 'reassignment' ? (
                          <div className="group flex items-center gap-3 p-3 rounded-[var(--r-md)] bg-amber-500/5 border border-amber-500/10 text-xs italic text-amber-500/80">
                            <RefreshCw size={12} />
                            <span>{comment.content}</span>
                          </div>
                        ) : (
                          <p className="text-[13px] text-[var(--text-3)] leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={commentsEndRef} />
                </div>
              )}
            </div>

            {/* Comment Input */}
            <div className="p-4 sm:p-6 border-t border-[var(--border-med)] bg-[var(--bg-deep)]">
              {commentError && (
                <div className="mb-3 p-2 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] flex items-center gap-2">
                  <AlertCircle size={12} />
                  {commentError}
                </div>
              )}
              <form onSubmit={handleAddComment} className="relative">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                  className="w-full bg-[var(--surface-0)] border border-[var(--border-med)] rounded-[var(--r-lg)] py-3 pl-4 pr-12 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-all resize-none shadow-inner"
                />
                <button
                  type="submit"
                  disabled={submitting || !commentText.trim()}
                  className="absolute bottom-3 right-3 p-2 bg-[var(--accent)] text-white rounded-lg shadow-lg shadow-[var(--accent-glow)] hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar - Meta & Reassignment */}
          <div className="w-full sm:w-64 bg-[var(--bg-deep)] p-4 sm:p-6 space-y-8 overflow-y-auto">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-4)]">Currently Assigned</h3>
              <div className="space-y-3">
                {task.assignees?.map((member: any) => (
                  <div key={member.id} className="flex items-center gap-3">
                    {member.avatar_url ? (
                      <Image src={member.avatar_url} alt={member.name} width={28} height={28} className="rounded-full" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[10px] font-bold text-[var(--text-4)]">
                        {member.name[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-bold text-[var(--text)] truncate">{member.name}</p>
                      <p className="text-[10px] text-[var(--text-4)] truncate">{member.department}</p>
                    </div>
                  </div>
                ))}
              </div>

              {isAdmin && !isReassigning && (
                <button 
                  onClick={() => setIsReassigning(true)}
                  className="w-full mt-2 py-2 px-3 flex items-center justify-center gap-2 text-xs font-bold text-[var(--accent)] bg-[var(--accent-subtle2)] rounded-[var(--r-md)] border border-[var(--accent-subtle)] hover:bg-[var(--accent-subtle)] transition-all transform hover:-translate-y-0.5"
                >
                  <RefreshCw size={12} />
                  Reassign Task
                </button>
              )}

              {/* Submit Work Section for Assignees */}
              {!isAdmin && task.status !== 'done' && task.status !== 'in_review' && (task.assigned_to_ids?.includes(userId) || task.assigned_to === userId) && (
                <div className="pt-4 mt-4 border-t border-[var(--border-med)] anim-fade-up">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-4)] mb-3">Your Actions</p>
                  <button 
                    onClick={() => onOpenSubmission?.(task.id, task.title)}
                    className="w-full py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-bold text-white bg-[var(--accent)] rounded-[var(--r-md)] shadow-lg shadow-[var(--accent-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <Send size={14} />
                    Submit Proof of Work
                  </button>
                  <p className="text-[10px] text-[var(--text-4)] mt-2 text-center">
                    Upload media to complete task
                  </p>
                </div>
              )}
            </div>

            {isReassigning && (
              <div className="space-y-4 pt-4 border-t border-[var(--border-med)] anim-fade-up">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-4)]">Reassignment</h3>
                  <button onClick={() => setIsReassigning(false)} className="text-[var(--text-4)] hover:text-red-500 p-1">
                    <X size={12} />
                  </button>
                </div>
                <div className="space-y-3">
                  <MultiPersonSelect 
                    selectedIds={newAssigneeIds}
                    onChange={setNewAssigneeIds}
                    maxSelections={(task.category === 'blog' || task.category === 'survivor_story') ? 1 : undefined}
                    placeholder="Search team members..."
                  />
                  <textarea
                    value={reassignReason}
                    onChange={(e) => setReassignReason(e.target.value)}
                    placeholder="Reason for reassignment (optional)"
                    rows={2}
                    className="w-full bg-[var(--surface-0)] border border-[var(--border-med)] rounded-[var(--r-md)] p-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-all resize-none shadow-sm"
                  />
                  <button
                    onClick={handleReassign}
                    disabled={submitting || newAssigneeIds.length === 0}
                    className="w-full py-2 bg-[var(--accent)] text-white text-xs font-black uppercase tracking-widest rounded-[var(--r-md)] shadow-lg shadow-[var(--accent-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    Confirm Reassignment
                  </button>
                </div>
              </div>
            )}
            
            <div className="pt-8 border-t border-[var(--border-med)] flex items-center gap-2">
              <AlertCircle size={12} className="text-[var(--text-4)]" />
              <p className="text-[10px] text-[var(--text-4)] leading-snug">
                All changes and comments are logged for coordination.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
