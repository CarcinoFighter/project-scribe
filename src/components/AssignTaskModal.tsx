'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Briefcase, 
  FileText, 
  BookOpen, 
  Heart, 
  User, 
  Calendar, 
  AlertTriangle,
  Layers,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  avatar_url: string | null;
  department: string;
}

interface AssignTaskModalProps {
  member?: TeamMember | null;
  onClose: () => void;
  onSuccess: () => void;
  defaultCategory?: 'task' | 'article' | 'blog' | 'survivor_story' | 'awareness_post';
}

export default function AssignTaskModal({ member, onClose, onSuccess, defaultCategory }: AssignTaskModalProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [assigneeId, setAssigneeId] = useState(member?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'task' | 'article' | 'blog' | 'survivor_story' | 'awareness_post'>(defaultCategory || 'task');
  const [department, setDepartment] = useState(member?.department || "Writers' Block");
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [dueDate, setDueDate] = useState('');

  const [mounted, setMounted] = useState(false);
  useEffect(() => { 
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  useEffect(() => {
    if (!member) {
      const fetchMembers = async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/team');
          if (res.ok) {
            const data = await res.json();
            setMembers(data.users);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchMembers();
    }
  }, [member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigneeId || !title || !category || !dueDate) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/work/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned_to: assigneeId,
          title,
          description,
          category,
          department: category === 'task' ? department : null,
          priority,
          due_date: dueDate,
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to assign task');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const CATEGORIES = [
    { id: 'task', label: 'General Task', icon: Briefcase, color: 'var(--text-4)' },
    { id: 'article', label: 'Research Article', icon: FileText, color: '#3b82f6' },
    { id: 'blog', label: 'Blog Post', icon: BookOpen, color: 'var(--accent)' },
    { id: 'survivor_story', label: 'Survivor Story', icon: Heart, color: '#10b981' },
    { id: 'awareness_post', label: 'Awareness Post', icon: Layers, color: '#f59e0b' },
  ];

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9500] flex items-start justify-center p-4 bg-black/80 backdrop-blur-xl anim-fade-in pt-[10vh]">
      <div className="glass-raised w-full max-w-lg rounded-[var(--r-xl)] overflow-hidden shadow-2xl anim-slide-down border-[var(--border-strong)] relative sm:max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-[var(--border-med)] flex items-center justify-between bg-[var(--bg-deep)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-subtle2)] flex items-center justify-center text-[var(--accent)]">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text)] tracking-tight">Assign New Work</h2>
              <p className="text-xs text-[var(--text-4)]">Creation & assignment of editorial tasks</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--text-4)] hover:text-[var(--text)] hover:bg-[var(--bg-deep)] rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-3 rounded-[var(--r-md)] bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          {/* Member Selection */}
          {!member && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] flex items-center gap-1.5">
                <User size={10} />
                Assign To
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-[var(--bg-deep)] border border-[var(--border-med)] rounded-[var(--r-md)] py-2.5 px-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors appearance-none cursor-pointer"
              >
                <option value="">Select a team member...</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.department})</option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)]">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Draft article on immunotherapy advances"
              className="w-full bg-[var(--bg-deep)] border border-[var(--border-med)] rounded-[var(--r-md)] py-2.5 px-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          {/* Category Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)]">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id as any)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--r-md)] text-xs border transition-all ${
                    category === cat.id 
                      ? 'bg-[var(--accent-subtle2)] border-[var(--accent-subtle)] text-[var(--accent)] font-semibold' 
                      : 'bg-transparent border-[var(--border-med)] text-[var(--text-3)] hover:bg-[var(--bg-deep)]'
                  }`}
                >
                  <cat.icon size={14} />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Department (Conditional) */}
          {category === 'task' && (
            <div className="space-y-2 anim-fade-up">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)]">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-[var(--bg-deep)] border border-[var(--border-med)] rounded-[var(--r-md)] py-2.5 px-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors appearance-none cursor-pointer"
              >
                {["Writers' Block", 'Public Relations', 'Design Lab', 'Development', 'Leadership'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          {/* Date & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] flex items-center gap-1.5">
                <Calendar size={10} />
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[var(--bg-deep)] border border-[var(--border-med)] rounded-[var(--r-md)] py-2.5 px-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] flex items-center gap-1.5">
                <CheckCircle size={10} />
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-[var(--bg-deep)] border border-[var(--border-med)] rounded-[var(--r-md)] py-2.5 px-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors appearance-none cursor-pointer"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)]">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details, scope, or context..."
              rows={3}
              className="w-full bg-[var(--bg-deep)] border border-[var(--border-med)] rounded-[var(--r-md)] py-2.5 px-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
            />
          </div>
        </form>

        <div className="p-6 border-t border-[var(--border-med)] bg-[var(--bg-deep)] flex items-center justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[var(--accent)] text-white px-6 py-2 rounded-[var(--r-md)] text-sm font-semibold shadow-lg shadow-[var(--accent-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                Assign Task
                <Layers size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
