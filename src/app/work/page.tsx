'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  ChevronRight,
  Plus,
  FileText,
  BookOpen,
  Heart,
  Check,
  Loader2,
  Users,
  ChevronDown,
  ChevronRight as ChevronR,
  Palette,
  Code2,
  Megaphone,
  PenTool,
  ShieldCheck,
  Send,
  Eye,
  Trash2
} from 'lucide-react';
import { useUser } from '@/lib/useUser';
import AccountMenu from '@/components/AccountMenu';
import AssignTaskModal from '@/components/AssignTaskModal';
import Toast from '@/components/Toast';
import TaskSubmissionModal from '@/components/TaskSubmissionModal';
import MediaViewerModal from '@/components/MediaViewerModal';

interface Assignment {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'normal' | 'high';
  category: 'task' | 'article' | 'blog' | 'survivor_story' | 'awareness_post';
  department?: string;
  due_date: string;
  document_id?: string;
  created_at: string;
  assignee?: { id: string; name: string; username: string; avatar_url: string | null; department: string };
  assigner?: { id: string; name: string; username: string };
}

const DEPARTMENTS = [
  { key: "Writers' Block", label: "Writers' Block", icon: PenTool, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { key: 'Design Lab', label: 'Design Lab', icon: Palette, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { key: 'Development', label: 'Development', icon: Code2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { key: 'Public Relations', label: 'Public Relations', icon: Megaphone, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  { key: 'Leadership', label: 'Leadership', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
];

const WRITERS_BLOCK_SECTIONS = [
  { key: 'article', label: 'Research Articles', icon: FileText, color: '#3b82f6', hasEditor: true, table: 'cancer_docs' },
  { key: 'blog', label: 'Blog Posts', icon: BookOpen, color: '#9875c1', hasEditor: true, table: 'blogs' },
  { key: 'survivor_story', label: 'Survivors Community', icon: Heart, color: '#10b981', hasEditor: true, table: 'survivor_stories' },
  { key: 'task', label: 'Task Assignments', icon: Briefcase, color: '#6b7280', hasEditor: false, table: null },
  { key: 'awareness_post', label: 'Awareness Posts', icon: Megaphone, color: '#f59e0b', hasEditor: false, table: null },
];

interface ReviewDoc {
  id: string;
  title: string;
  type: 'blogs' | 'survivor_stories' | 'cancer_docs' | 'tasks';
  status: 'review' | 'in_review';
  updated_at: string;
  author?: { id: string; name: string; avatar_url: string | null };
  submission_media_url?: string;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    done: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    in_progress: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    todo: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border flex-shrink-0 ${map[status] || map.todo}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = { high: 'bg-red-500', normal: 'bg-amber-400', low: 'bg-emerald-500' };
  return <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors[priority] || 'bg-gray-400'}`} title={priority} />;
}

function TaskRow({ task, onCompleteClick, completing, isAdmin, showEditor, onInit }: {
  task: Assignment;
  onCompleteClick: (task: Assignment) => void;
  completing: string | null;
  isAdmin: boolean;
  showEditor: boolean;
  onInit: (id: string) => void;
}) {
  const router = useRouter();
  const isDone = task.status === 'done';

  const handleTitleClick = () => {
    if (showEditor && task.document_id) {
      router.push(`/editor?id=${task.document_id}&type=${task.category === 'article' ? 'cancer_docs' : task.category === 'blog' ? 'blogs' : 'survivor_stories'}`);
    }
  };

  return (
    <div className={`flex items-center gap-4 px-4 py-3 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-deep)] transition-colors group ${isDone ? 'opacity-55' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
        {isDone ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <PriorityDot priority={task.priority} />
          {showEditor && task.document_id ? (
            <button
              onClick={handleTitleClick}
              className={`text-sm font-semibold text-left hover:text-[var(--accent)] transition-colors truncate ${isDone ? 'line-through' : ''}`}
            >
              {task.title}
            </button>
          ) : (
            <span className={`text-sm font-semibold text-[var(--text)] truncate ${isDone ? 'line-through' : ''}`}>{task.title}</span>
          )}
          <StatusBadge status={task.status} />
        </div>
        {task.description && (
          <p className="text-xs text-[var(--text-4)] truncate mt-0.5">{task.description}</p>
        )}
      </div>

      {isAdmin && task.assignee && (
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0">
            {task.assignee.name?.split(' ').map(n => n[0]).join('').slice(0,2)}
          </div>
          <span className="text-xs text-[var(--text-4)] truncate max-w-[80px]">{task.assignee.name}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-4)] flex-shrink-0">
        <Calendar size={10} />
        {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
      </div>

      {!isDone && (
        <button
          onClick={() => onCompleteClick(task)}
          disabled={completing === task.id}
          className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wider rounded-[var(--r-md)] border border-emerald-500/20 transition-all disabled:opacity-50 flex-shrink-0"
        >
          {completing === task.id ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
          Complete
        </button>
      )}

      {showEditor && !isDone && (
        task.document_id ? (
          <button
            onClick={handleTitleClick}
            className="flex items-center gap-1 px-2.5 py-1 bg-[var(--accent-subtle2)] hover:bg-[var(--accent-subtle)] text-[var(--accent)] text-[10px] font-bold uppercase tracking-wider rounded-[var(--r-md)] border border-[var(--accent-subtle)] transition-all flex-shrink-0"
          >
            Edit
            <ChevronR size={10} />
          </button>
        ) : (
          <button
            onClick={() => onInit(task.id)}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 text-[10px] font-bold uppercase tracking-wider rounded-[var(--r-md)] border border-amber-500/20 transition-all flex-shrink-0"
            title="Create internal document for this assignment"
          >
            Initialize
          </button>
        )
      )}
    </div>
  );
}

function ReviewQueue({ 
  docs, onApprove, approving, isAdmin, currentUserId, onToast, onViewMedia
}: { 
  docs: ReviewDoc[]; 
  onApprove: (doc: ReviewDoc) => void; 
  approving: string | null; 
  isAdmin: boolean;
  currentUserId: string;
  onToast: (m: string) => void;
  onViewMedia: (url: string, title: string) => void;
}) {
  const router = useRouter();
  if (docs.length === 0) return null;

  return (
    <div className="mb-8 anim-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <ShieldCheck size={16} className="text-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text)]">Review Queue</h2>
            <p className="text-xs text-[var(--text-4)]">Documents awaiting administrator approval</p>
          </div>
        </div>
        <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          {docs.length} pending
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.map((doc) => {
          const isAuthor = doc.author?.id === currentUserId;
          const Icon = doc.type === 'blogs' ? BookOpen : doc.type === 'survivor_stories' ? Heart : doc.type === 'tasks' ? Briefcase : FileText;
          const color = doc.type === 'blogs' ? 'text-[#9875c1]' : doc.type === 'survivor_stories' ? 'text-[#10b981]' : doc.type === 'tasks' ? 'text-amber-500' : 'text-[#3b82f6]';
          const bg = doc.type === 'blogs' ? 'bg-[#9875c118]' : doc.type === 'survivor_stories' ? 'bg-[#10b98118]' : doc.type === 'tasks' ? 'bg-amber-500/10' : 'bg-[#3b82f618]';

          return (
            <div key={doc.id} className="glass-raised p-4 rounded-[var(--r-lg)] border border-[var(--border-med)] flex flex-col gap-3 hover:border-[var(--accent-subtle)] transition-colors group">
              <div className="flex items-start justify-between gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
                  <Icon size={16} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-bold text-[var(--text)] mb-0.5 truncate group-hover:text-[var(--accent)] cursor-pointer" onClick={() => {
                    if (doc.type === 'tasks' && doc.submission_media_url) {
                      onViewMedia(doc.submission_media_url, doc.title);
                    } else if (doc.type !== 'tasks') {
                      router.push(`/editor?id=${doc.id}&type=${doc.type}`);
                    }
                  }}>
                    {doc.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--text-4)] capitalize">{doc.type.replace('_', ' ')}</span>
                    <span className="text-[10px] text-[var(--text-4)]">•</span>
                    <span className="text-[10px] text-[var(--text-4)]">{new Date(doc.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-deep)] rounded-[var(--r-md)] border border-[var(--border-med)]">
                {doc.author?.avatar_url ? (
                  <Image src={doc.author.avatar_url} alt={doc.author.name || ''} width={18} height={18} className="rounded-full" />
                ) : (
                  <div className="w-[18px] h-[18px] rounded-full bg-[var(--accent-subtle)] flex items-center justify-center text-[7px] font-bold text-[var(--accent)]">
                    {doc.author?.name?.[0] || 'U'}
                  </div>
                )}
                <span className="text-[10px] text-[var(--text-3)] font-medium">Author: {doc.author?.name || 'Unknown'}</span>
              </div>

              <div className="flex items-center gap-2 mt-auto pt-2">
                <button
                  onClick={() => {
                    if (doc.type === 'tasks' && doc.submission_media_url) {
                      onViewMedia(doc.submission_media_url, doc.title);
                    } else if (doc.type !== 'tasks') {
                      router.push(`/editor?id=${doc.id}&type=${doc.type}`);
                    }
                  }}
                  disabled={doc.type === 'tasks' && !doc.submission_media_url}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[var(--bg-alt)] hover:bg-[var(--surface-0)] text-[var(--text-3)] text-[10px] font-bold uppercase tracking-wider rounded-[var(--r-md)] border border-[var(--border-med)] transition-all"
                >
                  <Eye size={12} />
                  View
                </button>
                <button
                  onClick={() => onApprove(doc)}
                  disabled={approving === doc.id || isAuthor}
                  title={isAuthor ? 'You cannot approve your own work' : 'Approve and Publish'}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-[var(--r-md)] border border-green-500/20 transition-all ${isAuthor ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
                >
                  {approving === doc.id ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                  Approve
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionTable({ 
  section, tasks, onCompleteClick, completing, isAdmin, onAssign, onToast, onInit
}: {
  section: typeof WRITERS_BLOCK_SECTIONS[0];
  tasks: Assignment[];
  onCompleteClick: (task: Assignment) => void;
  completing: string | null;
  isAdmin: boolean;
  onAssign: (category: string) => void;
  onToast: (m: string) => void;
  onInit: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const Icon = section.icon;
  const pending = tasks.filter((t: Assignment) => t.status !== 'done');
  const done = tasks.filter((t: Assignment) => t.status === 'done');

  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--border-med)] overflow-hidden mb-4">
      <div
        className="flex items-center gap-3 px-4 py-3 bg-[var(--bg-deep)] cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${section.color}18` }}>
          <Icon size={14} style={{ color: section.color }} />
        </div>
        <span className="text-sm font-bold text-[var(--text)] flex-1">{section.label}</span>

        {tasks.length > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${section.color}18`, color: section.color }}>
            {pending.length} pending
          </span>
        )}

        {isAdmin && (
          <button
            onClick={e => { e.stopPropagation(); onAssign(section.key); }}
            className="p-1 rounded-md hover:bg-[var(--surface-2)] text-[var(--text-4)] hover:text-[var(--accent)] transition-colors"
            title={`Assign ${section.label}`}
          >
            <Plus size={14} />
          </button>
        )}

        <ChevronDown size={14} className={`text-[var(--text-4)] transition-transform ${expanded ? '' : '-rotate-90'}`} />
      </div>

      {expanded && (
        <div>
          {tasks.length === 0 ? (
            <div className="py-8 text-center text-[var(--text-4)]">
              <Icon size={22} className="mx-auto mb-2 opacity-30" style={{ color: section.color }} />
              <p className="text-xs">No assignments yet</p>
              {isAdmin && (
                <button
                  onClick={() => onAssign(section.key)}
                  className="mt-2 text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1 mx-auto"
                >
                  <Plus size={11} /> Assign first task
                </button>
              )}
            </div>
          ) : (
            <>
              {pending.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onCompleteClick={onCompleteClick}
                  completing={completing}
                  isAdmin={isAdmin}
                  showEditor={section.hasEditor}
                  onInit={onInit}
                />
              ))}
              {done.length > 0 && (
                <details className="group/done">
                  <summary className="flex items-center gap-2 px-4 py-2 text-xs text-[var(--text-4)] cursor-pointer hover:bg-[var(--bg-deep)] select-none list-none border-t border-[var(--border)]">
                    <ChevronR size={12} className="group-open/done:rotate-90 transition-transform" />
                    {done.length} completed
                  </summary>
                  {done.map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onCompleteClick={onCompleteClick}
                      completing={completing}
                      isAdmin={isAdmin}
                      showEditor={section.hasEditor}
                      onInit={onInit}
                    />
                  ))}
                </details>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DepartmentPlaceholder({ dept, onToast }: { dept: typeof DEPARTMENTS[0], onToast: (m: string) => void }) {
  const Icon = dept.icon;
  return (
    <div className={`rounded-[var(--r-lg)] border ${dept.border} overflow-hidden mb-4`}>
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'var(--bg-deep)' }}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${dept.bg}`}>
          <Icon size={14} className={dept.color} />
        </div>
        <span className="text-sm font-bold text-[var(--text)] flex-1">{dept.label}</span>
        <button 
          onClick={() => onToast('Department tables coming soon')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-md)] text-xs font-bold border transition-colors ${dept.border} ${dept.color} ${dept.bg} hover:opacity-80`}
        >
          <Plus size={12} />
          Add Table
        </button>
      </div>
      <div className="py-8 text-center text-[var(--text-4)] border-t border-[var(--border)]">
        <p className="text-xs">No tables configured for this department yet.</p>
      </div>
    </div>
  );
}


export default function WorkPage() {
  const { user } = useUser();
  const [myAssignments, setMyAssignments] = useState<Assignment[]>([]);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [reviewDocs, setReviewDocs] = useState<ReviewDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<{ category?: string } | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const [view, setView] = useState<'my' | 'admin'>('my');
  const [toast, setToast] = useState<string | null>(null);
  const [submittingTask, setSubmittingTask] = useState<{ id: string; title: string } | null>(null);
  const [viewingMedia, setViewingMedia] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    const dark = localStorage.getItem('cs-dark') === 'true';
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const fetchWork = useCallback(async () => {
    setLoading(true);
    try {
      const [myRes, allRes] = await Promise.all([
        fetch('/api/work'),
        user?.admin_access ? fetch('/api/work/all') : Promise.resolve(null),
      ]);

      if (myRes.ok) {
        const data = await myRes.json();
        setMyAssignments(data.assignments || []);
      }
      if (allRes?.ok) {
        const data = await allRes.json();
        setAllAssignments(data.assignments || []);
      }
      
      if (user?.admin_access) {
        const reviewRes = await fetch('/api/work/review-queue');
        if (reviewRes.ok) {
          const data = await reviewRes.json();
          setReviewDocs(data.documents || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.admin_access]);

  useEffect(() => {
    if (user !== undefined) fetchWork();
  }, [user, fetchWork]);

  const handleCompleteClick = (task: Assignment) => {
    if (task.category === 'task') {
      setSubmittingTask({ id: task.id, title: task.title });
    } else {
      handleComplete(task.id);
    }
  };

  const handleComplete = async (taskId: string) => {
    setCompleting(taskId);
    try {
      const res = await fetch('/api/work', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: 'done' }),
      });
      if (res.ok) {
        const updater = (prev: Assignment[]) =>
          prev.map(a => a.id === taskId ? { ...a, status: 'done' as const } : a);
        setMyAssignments(updater);
        setAllAssignments(updater);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(null);
    }
  };

  const handleInitDoc = async (assignmentId: string) => {
    try {
      const res = await fetch('/api/work/initialize-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast('Document initialized successfully');
        fetchWork(); // Refresh list to get the new document_id
      } else {
        setToast(data.error || 'Failed to initialize document');
      }
    } catch (err) {
      setToast('An error occurred during initialization');
    }
  };
  
  const handleApprove = async (doc: ReviewDoc) => {
    setApproving(doc.id);
    try {
      let res;
      if (doc.type === 'tasks') {
        res = await fetch('/api/work/tasks/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: doc.id, status: 'done' }),
        });
      } else {
        res = await fetch('/api/editor/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: doc.id,
            title: doc.title,
            slug: (doc as any).slug || doc.title.toLowerCase().replace(/\s+/g, '-'),
            content: (doc as any).content || '',
            contentType: doc.type,
            status: 'published',
            author_id: doc.author?.id,
          }),
        });
      }

      if (res.ok) {
        setToast(doc.type === 'tasks' ? 'Task approved and published' : 'Document approved and published');
        setReviewDocs(prev => prev.filter(d => d.id !== doc.id));
        fetchWork(); // Refresh assignments in case status changed
      } else {
        const data = await res.json();
        setToast(data.error || 'Failed to approve');
      }
    } catch (err) {
      setToast('An error occurred during approval');
    } finally {
      setApproving(null);
    }
  };

  const isAdmin = !!user?.admin_access;

  // Tasks to show in Writers' Block view: admins see all, others see their own
  const writersBlockTasks = isAdmin && view === 'admin' ? allAssignments : myAssignments;

  return (
    <div className={`app-bg min-h-screen flex flex-col ${isDark ? 'dark' : ''}`}>
      {/* Header */}
      <header className="app-header glass glass-rim flex items-center px-4 h-[52px] border-b border-[var(--border-med)] sticky top-0 z-50">
        <div className="flex items-center gap-2 select-none mr-4">
          <Image src="/logo.svg" alt="Carcino" width={18} height={22} priority />
          <span className="font-bold text-[13.5px] text-[var(--text)] tracking-tight">
            Carcino <span className="text-[var(--accent)]">Work</span>
          </span>
        </div>
        
        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowAssignModal({})}
              className="bg-[var(--accent)] text-white px-3 py-1.5 rounded-[var(--r-md)] text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-[var(--accent-glow)]"
            >
              <Plus size={13} />
              Assign Task
            </button>
          )}
          <button className="tb-btn" onClick={() => setShowAccountMenu(!showAccountMenu)}>
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center text-white text-[10px] font-bold">
              {user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
            </div>
          </button>
          {showAccountMenu && (
            <AccountMenu user={user} onClose={() => setShowAccountMenu(false)} onToast={(m) => setToast(m)} />
          )}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-52 border-r border-[var(--border-med)] p-4 space-y-1 hidden md:flex flex-col">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-4)] hover:text-[var(--text)] rounded-[var(--r-md)] transition-colors">
            <ChevronRight size={14} className="rotate-180" />
            Dashboard
          </Link>

          <div className="pt-4 pb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)]">Views</div>

          <button
            onClick={() => setView('my')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-[var(--r-md)] font-semibold text-left transition-all ${view === 'my' ? 'text-[var(--accent)] bg-[var(--accent-subtle2)]' : 'text-[var(--text-4)] hover:text-[var(--text)] hover:bg-[var(--bg-deep)]'}`}
          >
            <Briefcase size={14} />
            My Assignments
          </button>

          {isAdmin && (
            <button
              onClick={() => setView('admin')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-[var(--r-md)] font-semibold text-left transition-all ${view === 'admin' ? 'text-[var(--accent)] bg-[var(--accent-subtle2)]' : 'text-[var(--text-4)] hover:text-[var(--text)] hover:bg-[var(--bg-deep)]'}`}
            >
              <Users size={14} />
              All Assignments
            </button>
          )}

          <div className="flex-1" />

          <div className="text-[10px] text-[var(--text-4)] px-3 py-2">
            {myAssignments.filter(a => a.status !== 'done').length} pending tasks
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-[var(--text)] tracking-tight">
                  {view === 'admin' ? 'All Assignments' : 'My Assignments'}
                </h1>
                <p className="text-sm text-[var(--text-4)] mt-0.5">
                  {view === 'admin'
                    ? 'All tasks assigned across the team, organized by department'
                    : 'Your editorial tasks and content assignments'}
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowAssignModal({})}
                  className="bg-[var(--accent)] text-white px-4 py-2 rounded-[var(--r-md)] text-sm font-semibold flex items-center gap-2 shadow-lg shadow-[var(--accent-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Plus size={14} />
                  Assign Task
                </button>
              )}
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4 text-[var(--text-4)]">
                <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading assignments...</span>
              </div>
            ) : (
              <>
                {/* Review Queue (Admins only) */}
                {isAdmin && view === 'admin' && (
                  <ReviewQueue 
                    docs={reviewDocs}
                    onApprove={handleApprove}
                    approving={approving}
                    isAdmin={isAdmin}
                    currentUserId={user?.id || ''}
                    onToast={setToast}
                    onViewMedia={(url, title) => setViewingMedia({ url, title })}
                  />
                )}

                {/* Writers' Block Section */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <PenTool size={16} className="text-amber-500" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[var(--text)]">Writers' Block</h2>
                      <p className="text-xs text-[var(--text-4)]">Editorial content and writing assignments</p>
                    </div>
                  </div>

                  {WRITERS_BLOCK_SECTIONS.map(section => {
                    const sectionTasks = writersBlockTasks.filter(a => {
                      const matchCategory = a.category === section.key;
                      // For Writers' Block: filter by department only in admin view where all departments show
                      if (view === 'admin') {
                        return matchCategory; // admin sees all regardless of department
                      }
                      return matchCategory;
                    });

                    return (
                      <SectionTable
                        key={section.key}
                        section={section}
                        tasks={sectionTasks}
                        onCompleteClick={handleCompleteClick}
                        completing={completing}
                        isAdmin={isAdmin}
                        onAssign={(category: string) => setShowAssignModal({ category })}
                        onToast={(m: string) => setToast(m)}
                        onInit={handleInitDoc}
                      />
                    );
                  })}
                </div>

                {/* Other Departments — Placeholder sections */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-base font-bold text-[var(--text)]">Other Departments</h2>
                    <span className="text-xs text-[var(--text-4)] bg-[var(--bg-deep)] border border-[var(--border-med)] px-2 py-0.5 rounded-full">Coming soon</span>
                  </div>
                  {DEPARTMENTS.filter(d => d.key !== "Writers' Block").map(dept => (
                    <DepartmentPlaceholder key={dept.key} dept={dept} onToast={(m) => setToast(m)} />
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {showAssignModal !== null && (
        <AssignTaskModal
          onClose={() => setShowAssignModal(null)}
          onSuccess={() => { setShowAssignModal(null); fetchWork(); }}
          defaultCategory={showAssignModal.category as any}
        />
      )}
      {submittingTask !== null && (
        <TaskSubmissionModal
          taskId={submittingTask.id}
          taskTitle={submittingTask.title}
          onClose={() => setSubmittingTask(null)}
          onSuccess={(url) => { 
            setSubmittingTask(null); 
            fetchWork(); 
            setToast('Task submitted for review successfully');
          }}
        />
      )}
      {viewingMedia !== null && (
        <MediaViewerModal
          url={viewingMedia.url}
          title={viewingMedia.title}
          onClose={() => setViewingMedia(null)}
        />
      )}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
