'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Shield,
  Layers,
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
  status: 'todo' | 'in_progress' | 'done' | 'in_review';
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
  { key: 'awareness_post', label: 'Awareness Posts', icon: Megaphone, color: '#f59e0b', hasEditor: false, table: null },
  { key: 'task', label: 'Task Assignments', icon: Briefcase, color: '#6b7280', hasEditor: false, table: null },
];

const KNOWN_CATEGORIES: Record<string, { label: string; icon: any; color: string }> = {
  article: { label: 'Research Articles', icon: FileText, color: '#3b82f6' },
  blog: { label: 'Blog Posts', icon: BookOpen, color: '#9875c1' },
  survivor_story: { label: 'Survivor Stories', icon: Heart, color: '#10b981' },
  awareness_post: { label: 'Awareness Posts', icon: Megaphone, color: '#f59e0b' },
  task: { label: 'Task Assignments', icon: Briefcase, color: '#6b7280' },
};

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
    in_review: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    todo: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
  };
  const label = status.replace('_', ' ');
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border flex-shrink-0 ${map[status] || map.todo}`}>
      {label}
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
            <div key={doc.id} className="glass-raised grain p-4 rounded-[var(--r-lg)] border border-[var(--border-med)] flex flex-col gap-3 hover:border-[var(--accent-subtle)] transition-colors group">
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
    <div className="glass-raised grain rounded-[var(--r-lg)] border border-[var(--border-med)] overflow-hidden mb-4">
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
  const [showAssignModal, setShowAssignModal] = useState<{ category?: string; department?: string } | null>(null);
  const [activeDeptKey, setActiveDeptKey] = useState("Writers' Block");
  const [isDark, setIsDark] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [accountMenuPos, setAccountMenuPos] = useState<{ top: number; right: number } | null>(null);
  const accountBtnRef = useRef<HTMLButtonElement>(null);
  
  const isWritersBlock = activeDeptKey === "Writers' Block";
  const [completing, setCompleting] = useState<string | null>(null);
  const [view, setView] = useState<'my' | 'admin'>('my');
  const [toast, setToast] = useState<string | null>(null);
  const [submittingTask, setSubmittingTask] = useState<{ id: string; title: string } | null>(null);
  const [viewingMedia, setViewingMedia] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cs-settings');
      if (raw) {
        const s = JSON.parse(raw);
        const themes: Record<string,boolean> = {
          'default-dark': true, 'catppuccin-mocha': true, 'solarized-dark': true,
          'default-light': false, 'catppuccin-latte': false, 'solarized-light': false,
        };
        const isDarkTheme = themes[s?.theme] ?? false;
        setIsDark(isDarkTheme);
        document.documentElement.classList.toggle('dark', isDarkTheme);
      }
    } catch {}
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
  const assignments = isAdmin && view === 'admin' ? allAssignments : myAssignments;

  // Filter tasks for the active department
  const activeDeptTasks = assignments.filter(a => a.department === activeDeptKey);
  
  // Special case for Writers' Block: categorization
  const activeDept = DEPARTMENTS.find(d => d.key === activeDeptKey) || DEPARTMENTS[0];

  return (
    <div className={`app-bg min-h-screen flex flex-col ${isDark ? 'dark' : ''}`}>
      {/* Navigation / Header (Unified Style) */}
        <header 
          className="h-[52px] border-b border-[var(--border-med)] bg-[var(--surface-0)] backdrop-blur-xl px-4 flex items-center justify-between sticky top-0 z-[200] shadow-sm anim-slide-down"
          style={{ 
            boxShadow: 'inset 0 -1px 0 var(--border), 0 1px 12px rgba(0,0,0,0.06)' 
          }}
        >
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image src="/logo.svg" alt="Carcino" width={16} height={20} priority />
              <span className="text-[12.5px] font-bold text-[var(--text-4)] uppercase tracking-tight">Scribe</span>
            </Link>
            <ChevronRight size={11} strokeWidth={2.2} className="text-[var(--border-strong)] mx-1" />
            <span className="text-[12.5px] font-bold text-[var(--text-3)] tracking-tight">Dashboard</span>
            <ChevronRight size={11} strokeWidth={2.2} className="text-[var(--border-strong)] mx-1" />
            <span className="text-[12.5px] font-bold text-[var(--text)] tracking-tight">{activeDeptKey}</span>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <button 
                onClick={() => setShowAssignModal({ department: activeDeptKey })}
                className="p-1.5 rounded-lg hover:bg-[var(--accent-subtle)] text-[var(--text-4)] hover:text-[var(--accent)] transition-all"
                title="Assign Task"
              >
                <Plus size={16} strokeWidth={2} />
              </button>
            )}
            
            <div className="w-[1px] h-4 bg-[var(--border-med)] mx-1" />

            <button
              ref={accountBtnRef}
              onClick={() => {
                const r = accountBtnRef.current?.getBoundingClientRect();
                if (r) setAccountMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
                setShowAccountMenu(!showAccountMenu);
              }}
              className="p-0.5 rounded-full hover:ring-2 hover:ring-[var(--accent-subtle)] transition-all"
            >
              {user?.avatar_url ? (
                <div className="w-6 h-6 rounded-full overflow-hidden border border-[var(--border-med)]">
                  <Image src={user.avatar_url} alt="Profile" width={24} height={24} />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center text-white text-[9px] font-bold">
                  {user?.name?.split(' ').map((n: any) => n[0]).join('').slice(0, 2) || 'S'}
                </div>
              )}
            </button>
          </div>
        </header>

        {/* Account Menu Portal */}
        {showAccountMenu && accountMenuPos && (
          <div 
            className="fixed z-[9999]" 
            style={{ top: accountMenuPos.top, right: accountMenuPos.right }}
            onMouseLeave={() => setShowAccountMenu(false)}
          >
            <AccountMenu 
              user={user} 
              onClose={() => setShowAccountMenu(false)} 
              onToast={(m) => setToast(m)} 
            />
          </div>
        )}

      <div className="flex flex-1">
        {/* Mobile nav strip — visible only on small screens */}
        <div className="md:hidden flex items-center gap-3 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-alt)] text-xs">
          <Link href="/" className="text-[var(--text-4)] hover:text-[var(--accent)] flex items-center gap-1 transition-colors">
            <ChevronRight size={12} className="rotate-180" /> Dashboard
          </Link>
          <span className="text-[var(--border-strong)]">/</span>
          <span className="text-[var(--text-3)] font-semibold">Work</span>
        </div>

        {/* Sidebar */}
        <aside className="sidebar-col w-52 p-4 space-y-1 hidden md:flex flex-col" style={{ position: 'sticky', top: 52, height: 'calc(100vh - 52px)', overflowY: 'auto' }}>
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
                  onClick={() => setShowAssignModal({ department: activeDeptKey })}
                  className="bg-[var(--accent)] text-white px-4 py-2 rounded-[var(--r-md)] text-sm font-semibold flex items-center gap-2 shadow-lg shadow-[var(--accent-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Plus size={14} />
                  Assign Task
                </button>
              )}
            </div>

            {/* Department Tabs */}
            <div className="flex items-center gap-1 mb-8 p-1 bg-[var(--bg-deep)] rounded-[var(--r-lg)] border border-[var(--border-med)] overflow-x-auto no-scrollbar">
              {DEPARTMENTS.map((dept) => {
                const isActive = activeDeptKey === dept.key;
                const Icon = dept.icon;
                return (
                  <button
                    key={dept.key}
                    onClick={() => setActiveDeptKey(dept.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-[var(--r-md)] text-xs font-bold transition-all whitespace-nowrap ${
                      isActive 
                        ? 'bg-[var(--surface-0)] text-[var(--accent)] shadow-sm border border-[var(--border-med)]' 
                        : 'text-[var(--text-4)] hover:text-[var(--text-2)] hover:bg-[var(--bg-deep)]'
                    }`}
                  >
                    <Icon size={14} className={isActive ? dept.color : 'text-current'} />
                    {dept.label}
                  </button>
                );
              })}
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
                                {/* Specialized Content Section (Writers' Block) */}
                {isWritersBlock ? (
                  <div className="anim-fade-in">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                          <PenTool size={16} className="text-amber-500" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-[var(--text)]">Editorial Workflow</h2>
                          <p className="text-xs text-[var(--text-4)]">Articles, blogs, and community stories</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowAssignModal({ department: "Writers' Block" })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-md)] text-xs font-bold border border-amber-500/20 text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                      >
                        <Plus size={12} />
                        Add Category / Task
                      </button>
                    </div>

                    {(() => {
                      // 1. Get default sections
                      const renderedSections = [...WRITERS_BLOCK_SECTIONS];
                      // 2. Add any other dynamic categories found in tasks
                      const dynamicCategories = Array.from(new Set(activeDeptTasks.map(t => t.category)))
                        .filter(cat => !WRITERS_BLOCK_SECTIONS.some(s => s.key === cat));
                      
                      const allSections = [
                        ...renderedSections,
                        ...dynamicCategories.map(cat => ({
                          key: cat,
                          label: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' '),
                          icon: Layers,
                          color: '#6b7280',
                          hasEditor: false,
                          table: null
                        }))
                      ];

                      return allSections.map(section => {
                        const sectionTasks = activeDeptTasks.filter(a => a.category === section.key);
                        return (
                          <SectionTable
                            key={section.key}
                            section={section as any}
                            tasks={sectionTasks}
                            onCompleteClick={handleCompleteClick}
                            completing={completing}
                            isAdmin={isAdmin}
                            onAssign={(category: string) => setShowAssignModal({ category, department: activeDeptKey })}
                            onToast={(m: string) => setToast(m)}
                            onInit={handleInitDoc}
                          />
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="anim-fade-in">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl ${activeDept.bg} flex items-center justify-center`}>
                          <activeDept.icon size={16} className={activeDept.color} />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-[var(--text)]">{activeDept.label} Board</h2>
                          <p className="text-xs text-[var(--text-4)]">Active projects and tasks for {activeDept.label}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowAssignModal({ department: activeDeptKey })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-md)] text-xs font-bold border transition-colors ${activeDept.border} ${activeDept.color} ${activeDept.bg} hover:opacity-80`}
                      >
                        <Plus size={12} />
                        Add Category / Task
                      </button>
                    </div>

                    {(() => {
                      const categories = Array.from(new Set(activeDeptTasks.map(t => t.category)));
                      if (categories.length === 0) {
                        return (
                          <SectionTable
                            section={{ key: 'task', label: 'General Tasks', icon: Briefcase, color: '#6b7280', hasEditor: false, table: null }}
                            tasks={[]}
                            onCompleteClick={handleCompleteClick}
                            completing={completing}
                            isAdmin={isAdmin}
                            onAssign={() => setShowAssignModal({ category: 'task', department: activeDeptKey })}
                            onToast={(m: string) => setToast(m)}
                            onInit={handleInitDoc}
                          />
                        );
                      }
                      
                      return categories.sort().map(cat => {
                        const sectionTasks = activeDeptTasks.filter(a => a.category === cat);
                        const known = KNOWN_CATEGORIES[cat];
                        return (
                          <SectionTable
                            key={cat}
                            section={{
                              key: cat,
                              label: known?.label || cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' '),
                              icon: known?.icon || Layers,
                              color: known?.color || '#6b7280',
                              hasEditor: ['article', 'blog', 'survivor_story'].includes(cat),
                              table: null
                            }}
                            tasks={sectionTasks}
                            onCompleteClick={handleCompleteClick}
                            completing={completing}
                            isAdmin={isAdmin}
                            onAssign={(category: string) => setShowAssignModal({ category, department: activeDeptKey })}
                            onToast={(m: string) => setToast(m)}
                            onInit={handleInitDoc}
                          />
                        );
                      });
                    })()}
                  </div>
                )}
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
          defaultDepartment={showAssignModal.department}
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
