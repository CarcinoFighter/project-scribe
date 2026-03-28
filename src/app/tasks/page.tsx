'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/useTheme';
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
  Trash2,
  Menu,
  X,
  Layers as LayersIcon,
  Star, Zap, Globe, Camera, Music, Video, Mail, Share2, BarChart2,
  Cpu, Microscope, Stethoscope, Landmark, FlaskConical,
  Activity, Airplay, Anchor, Archive, Award, Bell, Bike, Bookmark,
  Box, Brain, Bug, Building, Building2, Bus, Calculator, Cast,
  Clipboard, Clock, Cloud, Coffee, Columns, Compass, CreditCard, Crop,
  Database, Download, Edit, Filter, Flag, Folder, Gift, GitBranch,
  Grid, Hash, Headphones, Home,
  Image as LucideImage, Inbox, Key, Layout,
  LifeBuoy, Link as LucideLink, List, Lock, Map, MapPin, MessageCircle, MessageSquare,
  Monitor, Moon, Package, Phone, Printer, Radio, RefreshCw, Rss,
  Search, Server, Settings, Slack, Sliders, Smartphone, Speaker, Sun,
  Tag, Terminal, Thermometer, ThumbsUp, TrendingUp, Truck,
  Twitter, Type, Umbrella, Upload, User, UserCheck, UserPlus, Volume2,
  Watch, Wifi, Wind, Wrench, Youtube, ZoomIn,
} from 'lucide-react';
import { useUser } from '@/lib/useUser';
import AccountMenu from '@/components/AccountMenu';
import AssignTaskModal from '@/components/AssignTaskModal';
import Toast from '@/components/Toast';
import TaskSubmissionModal from '@/components/TaskSubmissionModal';
import MediaViewerModal from '@/components/MediaViewerModal';
import TaskDetailsModal from '@/components/TaskDetailsModal';
import MultiPersonSelect from '@/components/MultiPersonSelect';
import Header from '@/components/Header';
import { Notif } from '@/components/NotifPanel';
import { Sidebar } from '@/components/Sidebar';
import { DEPARTMENTS } from '@/config/departments';
import {
  loadSettings,
  saveSettings,
  applySettings,
  type AppSettings,
} from '@/components/SettingsModal';

// Custom SVG icons for departments (where we have them in public/icons)
const DEPT_CUSTOM_ICON: Record<string, string> = {
  'Development': '/icons/development.svg',
  'Design Lab':  '/icons/design.svg',
  'Marketing':   '/icons/marketing.svg',
};

interface Assignment {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done' | 'in_review' | 'ready_for_proofreading' | 'proofreading' | 'ready_for_upload';
  priority: 'low' | 'normal' | 'high';
  category: string;
  category_icon?: string;
  department?: string;
  due_date: string;
  document_id?: string;
  created_at: string;
  assignee?: { id: string; name: string; username: string; avatar_url: string | null; department: string };
  assignees?: { id: string; name: string; username: string; avatar_url: string | null; department: string }[];
  assigner?: { id: string; name: string; username: string };
  assigned_by?: string;
}

// DEPARTMENTS imported from @/config/departments


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

// Map stored icon names → Lucide components (mirrors ICON_OPTIONS in AssignTaskModal)
const ICON_NAME_MAP: Record<string, any> = {
  Briefcase, FileText, BookOpen, Heart, Megaphone, Layers: LayersIcon,
  Code2, Palette, PenTool, Users, Star, Zap, Globe, Camera, Music,
  Video, Mail, Share2, BarChart2, Shield, ShieldCheck, Cpu, Microscope,
  Stethoscope, Landmark, FlaskConical, Eye, Send, Activity, Airplay,
  Anchor, Archive, Award, Bell, Bike, Bookmark, Box, Brain, Bug,
  Building, Building2, Bus, Calculator, Cast, Clipboard, Clock, Cloud,
  Coffee, Columns, Compass, CreditCard, Crop, Database, Download, Edit,
  Filter, Flag, Folder, Gift, GitBranch, Grid, Hash, Headphones, Home,
  Image: LucideImage, Inbox, Key, Layout, LifeBuoy, Link: LucideLink,
  List, Lock, Map, MapPin, MessageCircle, MessageSquare, Monitor, Moon,
  Package, Phone, Printer, Radio, RefreshCw, Rss, Search, Server,
  Settings, Slack, Sliders, Smartphone, Speaker, Sun, Tag, Terminal,
  Thermometer, ThumbsUp, TrendingUp, Truck, Twitter, Type, Umbrella,
  Upload, UserCheck, UserPlus, Volume2, Watch, Wifi, Wind, Wrench,
  Youtube, ZoomIn,
};

// Guess a reasonable icon from category name keywords when category_icon isn't stored
function guessIconFromCategoryName(cat: string): any {
  const lower = cat.toLowerCase();
  if (/feature|product|sprint|ticket/.test(lower)) return Star;
  if (/bug|fix|issue|error/.test(lower)) return Bug;
  if (/design|ui|ux|visual|art/.test(lower)) return Palette;
  if (/dev|code|backend|frontend|api/.test(lower)) return Code2;
  if (/market|campaign|ad|promo|seo/.test(lower)) return Megaphone;
  if (/doc|article|write|blog|content/.test(lower)) return FileText;
  if (/social|share|post|media/.test(lower)) return Share2;
  if (/data|analytic|report|metric|chart/.test(lower)) return BarChart2;
  if (/video|film|record|shoot/.test(lower)) return Video;
  if (/photo|image|camera/.test(lower)) return Camera;
  if (/event|conference|meeting|webinar/.test(lower)) return Calendar;
  if (/research|science|study|lab|medical/.test(lower)) return Microscope;
  if (/health|clinical|patient|therapy/.test(lower)) return Stethoscope;
  if (/infra|server|cloud|deploy|ops/.test(lower)) return Server;
  if (/security|auth|access|permission/.test(lower)) return Shield;
  if (/train|learning|education|course/.test(lower)) return BookOpen;
  if (/lead|manage|strategy|plan/.test(lower)) return Users;
  return LayersIcon; // final fallback
}

function getDeptHex(deptKey?: string): string {
  const map: Record<string, string> = {
    "Writers' Block": '#f59e0b',
    'Design Lab':     '#3b82f6',
    'Development':    '#10b981',
    'Marketing':      '#ec4899',
    'Public Relations':'#ec4899',
    'Leadership':     '#6366f1',
  };
  return map[deptKey || ''] || '#6b7280';
}

interface ReviewDoc {
  id: string;
  title: string;
  type: 'blogs' | 'survivor_stories' | 'cancer_docs' | 'tasks';
  status: 'review' | 'in_review' | 'ready_for_proofreading' | 'ready_for_upload';
  updated_at: string;
  author?: { id: string; name: string; avatar_url: string | null };
  submission_media_url?: string;
  assigned_by?: string;
}

function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, ' ');
  return (
    <span className={`db-status ${status}`}>
      {label}
    </span>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const bg = priority === 'high' ? 'var(--red, #b03030)' : priority === 'normal' ? 'var(--mid)' : 'var(--rule)';
  return <div style={{ width: 4, height: 4, background: bg }} title={priority} />;
}

function TaskRow({ task, onCompleteClick, onDeleteClick, completing, deleting, isAdmin, showEditor, onInit, onTaskClick, currentUserId }: {
  task: Assignment;
  onCompleteClick: (task: Assignment) => void;
  onDeleteClick?: (task: Assignment) => void;
  completing: string | null;
  deleting?: string | null;
  isAdmin: boolean;
  showEditor: boolean;
  onInit: (id: string) => void;
  onTaskClick: (task: Assignment) => void;
  currentUserId?: string;
}) {
  const router = useRouter();
  const isDone = task.status === 'done';

  const handleTitleClick = () => {
    if (showEditor && task.document_id) {
      router.push(`/editor?id=${task.document_id}&type=${task.category === 'article' ? 'cancer_docs' : task.category === 'blog' ? 'blogs' : 'survivor_stories'}`);
    }
  };

  return (
    <div className={`db-card flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 border-b border-[var(--border)] last:border-b-0 group ${isDone ? 'opacity-55' : ''}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-7 h-7 flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
          {isDone ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
        </div>
        
        <div 
          className="flex-1 min-w-0 cursor-pointer" 
          onClick={() => onTaskClick(task)}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <PriorityDot priority={task.priority} />
            {showEditor && task.document_id ? (
              <button
                onClick={(e) => { e.stopPropagation(); handleTitleClick(); }}
                className={`text-sm font-semibold text-left hover:text-[var(--accent)] transition-colors truncate ${isDone ? 'line-through' : ''}`}
              >
                {task.title}
              </button>
            ) : (
              <span className={`text-sm font-semibold text-[var(--text)] truncate hover:text-[var(--accent)] transition-colors ${isDone ? 'line-through' : ''}`}>{task.title}</span>
            )}
            <StatusBadge status={task.status} />
          </div>
          {task.description && (
            <p className="text-xs text-[var(--text-4)] truncate mt-0.5">{task.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-10 sm:pl-0">
        <div className="flex items-center gap-3 sm:gap-4">
          {isAdmin && task.assignees && task.assignees.length > 0 && (
            <div className="flex items-center gap-2.5 group/avatars mr-1">
              <div className="flex items-center -space-x-2">
                {task.assignees.slice(0, 3).map((member, idx) => (
                  <div 
                    key={member.id} 
                    className="db-avatar"
                    style={{ zIndex: 10 - idx }}
                    title={member.name}
                  >
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.name} width={20} height={20} />
                    ) : (
                      member.name?.split(' ').map(n => n[0]).join('').slice(0,2)
                    )}
                  </div>
                ))}
                {task.assignees.length > 3 && (
                  <div className="db-avatar" style={{ background: 'var(--surface-2)', color: 'var(--text-4)' }}>
                    +{task.assignees.length - 3}
                  </div>
                )}
              </div>
              <span className="text-[10px] sm:text-xs text-[var(--text-4)] truncate max-w-[60px] sm:max-w-[100px]">
                {task.assignees.length === 1 ? task.assignees[0].name : `${task.assignees.length} people`}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[var(--text-4)] flex-shrink-0">
            <Calendar size={10} />
            {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
          </div>
        </div>

        <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
          {!isDone && (
            <button
              onClick={() => onCompleteClick(task)}
              disabled={completing === task.id || deleting === task.id}
              className="db-btn px-2.5 py-1"
              style={{ background: 'var(--accent-sub)', color: 'var(--accent)', clipPath: 'none' }}
            >
              <div className="flex items-center gap-1">
                {completing === task.id ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                <span>{task.category === 'task' ? 'Submit' : 'Done'}</span>
              </div>
            </button>
          )}

          {isAdmin && task.assigned_by === currentUserId && onDeleteClick && (
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteClick(task); }}
              disabled={deleting === task.id || completing === task.id}
              className="db-icon-btn"
              title="Delete task"
            >
              {deleting === task.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          )}

          {showEditor && !isDone && (
            task.document_id ? (
              <button
                onClick={handleTitleClick}
                className="db-btn px-3 py-1"
              >
                <div className="flex items-center gap-1">
                  <span>Edit</span>
                  <ChevronR size={10} />
                </div>
              </button>
            ) : (
              <button
                onClick={() => onInit(task.id)}
                className="db-ghost"
                title="Create internal document for this assignment"
              >
                Init
              </button>
            )
          )}
        </div>
      </div>
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
          <div className="w-8 h-8 bg-amber-500/10 flex items-center justify-center">
            <ShieldCheck size={16} className="text-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text)]">Review Queue</h2>
            <p className="text-xs text-[var(--text-4)]">Documents awaiting administrator approval</p>
          </div>
        </div>
        <span className="db-status review">
          {docs.length} PENDING
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.map((doc) => {
          const isAuthor = doc.author?.id === currentUserId;
          const isSelfAssignedTask = doc.type === 'tasks' && doc.assigned_by === currentUserId && isAuthor;
          const cannotApprove = isAuthor && !isSelfAssignedTask;
          
          const Icon = doc.type === 'blogs' ? BookOpen : doc.type === 'survivor_stories' ? Heart : doc.type === 'tasks' ? Briefcase : FileText;
          const color = doc.type === 'blogs' ? 'text-[#9875c1]' : doc.type === 'survivor_stories' ? 'text-[#10b981]' : doc.type === 'tasks' ? 'text-amber-500' : 'text-[#3b82f6]';
          const bg = doc.type === 'blogs' ? 'bg-[#9875c118]' : doc.type === 'survivor_stories' ? 'bg-[#10b98118]' : doc.type === 'tasks' ? 'bg-amber-500/10' : 'bg-[#3b82f618]';

          return (
            <div key={doc.id} className="db-card p-4 border border-[var(--border-med)] flex flex-col gap-3 group">
              <div className="flex items-start justify-between gap-3">
                <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${bg}`}>
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

              <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-deep)] border border-[var(--border-med)]">
                {doc.author?.avatar_url ? (
                  <img src={doc.author.avatar_url} alt={doc.author.name || ''} width={18} height={18} />
                ) : (
                  <div className="w-[18px] h-[18px] bg-[var(--accent-subtle)] flex items-center justify-center text-[7px] font-bold text-[var(--accent)]">
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
                  className="flex-1 db-ghost"
                >
                  <div className="flex items-center gap-1.5 justify-center">
                    <Eye size={12} />
                    View
                  </div>
                </button>
                <button
                  onClick={() => onApprove(doc)}
                  disabled={approving === doc.id || cannotApprove}
                  title={cannotApprove ? 'You cannot approve your own work' : 'Approve and Publish'}
                  className={`flex-1 db-btn bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white border border-green-500/20 ${cannotApprove ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
                  style={{ clipPath: 'none' }}
                >
                  <div className="flex items-center gap-1.5 justify-center">
                    {approving === doc.id ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                    Approve
                  </div>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProofreaderQueue({ 
  docs, currentUserId, onToast
}: { 
  docs: ReviewDoc[]; 
  currentUserId: string;
  onToast: (m: string) => void;
}) {
  const router = useRouter();
  if (docs.length === 0) return null;

  return (
    <div className="mb-8 anim-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-500/10 flex items-center justify-center">
            <PenTool size={16} className="text-purple-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text)]">Proofreading Queue</h2>
            <p className="text-xs text-[var(--text-4)]">Articles assigned to you for proofreading</p>
          </div>
        </div>
        <span className="db-status proof">
          {docs.length} ASSIGNED
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.map((doc) => {
          const Icon = doc.type === 'blogs' ? BookOpen : doc.type === 'survivor_stories' ? Heart : FileText;
          const color = doc.type === 'blogs' ? 'text-[#9875c1]' : doc.type === 'survivor_stories' ? 'text-[#10b981]' : 'text-[#3b82f6]';
          const bg = doc.type === 'blogs' ? 'bg-[#9875c118]' : doc.type === 'survivor_stories' ? 'bg-[#10b98118]' : 'bg-[#3b82f618]';

          return (
            <div key={doc.id} className="db-card p-4 border border-[var(--border-med)] flex flex-col gap-3 group">
              <div className="flex items-start justify-between gap-3">
                <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${bg}`}>
                  <Icon size={16} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-bold text-[var(--text)] mb-0.5 truncate group-hover:text-[var(--accent)] cursor-pointer" onClick={() => {
                    router.push(`/editor?id=${doc.id}&type=${doc.type}`);
                  }}>
                    {doc.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--text-4)] capitalize">{doc.type.replace('_', ' ')}</span>
                    <span className="text-[10px] text-[var(--text-4)]">•</span>
                    <span className="text-[10px] text-[var(--text-4)]">by {doc.author?.name || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-auto pt-2">
                <button
                  onClick={() => router.push(`/editor?id=${doc.id}&type=${doc.type}`)}
                  className="flex-1 db-btn bg-purple-500/10 hover:bg-purple-500 text-purple-500 hover:text-white border border-purple-500/20"
                  style={{ clipPath: 'none' }}
                >
                  <div className="flex items-center gap-1.5 justify-center">
                    <PenTool size={12} />
                    Start Proofreading
                  </div>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AssignmentQueue({ 
  docs, onAssign, assigning, isAdmin, onToast
}: { 
  docs: ReviewDoc[]; 
  onAssign: (docId: string, type: string, proofreaderId: string) => void; 
  assigning: string | null;
  isAdmin: boolean;
  onToast: (m: string) => void;
}) {
  if (docs.length === 0) return null;

  return (
    <div className="mb-8 anim-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500/10 flex items-center justify-center">
            <User size={16} className="text-indigo-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text)]">Assignment Queue</h2>
            <p className="text-xs text-[var(--text-4)]">Articles awaiting proofreader assignment</p>
          </div>
        </div>
        <span className="db-status todo">
          {docs.length} AWAITING
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.map((doc) => {
          const Icon = doc.type === 'blogs' ? BookOpen : doc.type === 'survivor_stories' ? Heart : FileText;
          const color = doc.type === 'blogs' ? 'text-[#9875c1]' : doc.type === 'survivor_stories' ? 'text-[#10b981]' : 'text-[#3b82f6]';
          const bg = doc.type === 'blogs' ? 'bg-[#9875c118]' : doc.type === 'survivor_stories' ? 'bg-[#10b98118]' : 'bg-[#3b82f618]';

          return (
            <div key={doc.id} className="db-card p-4 border border-[var(--border-med)] flex flex-col gap-3 group">
              <div className="flex items-start justify-between gap-3">
                <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${bg}`}>
                  <Icon size={16} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-bold text-[var(--text)] mb-0.5 truncate group-hover:text-[var(--accent)]">
                    {doc.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--text-4)] capitalize">{doc.type.replace('_', ' ')}</span>
                    <span className="text-[10px] text-[var(--text-4)]">•</span>
                    <span className="text-[10px] text-[var(--text-4)]">by {doc.author?.name || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-4)]">Select Proofreader</p>
                <MultiPersonSelect 
                  selectedIds={[]}
                  onChange={(ids) => ids[0] && onAssign(doc.id, doc.type as string, ids[0])}
                  maxSelections={1}
                  placeholder="Choose member..."
                />
              </div>

              {assigning === doc.id && (
                <div className="flex items-center justify-center gap-2 py-1 text-[10px] text-[var(--accent)] font-bold animate-pulse">
                  <Loader2 size={10} className="animate-spin" />
                  Assigning...
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionTable({ 
  section, tasks, onCompleteClick, onDeleteClick, completing, deleting, isAdmin, onAssign, onToast, onInit, onTaskClick, currentUserId
}: {
  section: typeof WRITERS_BLOCK_SECTIONS[0];
  tasks: Assignment[];
  onCompleteClick: (task: Assignment) => void;
  onDeleteClick?: (task: Assignment) => void;
  completing: string | null;
  deleting?: string | null;
  isAdmin: boolean;
  onAssign: (category: string) => void;
  onToast: (m: string) => void;
  onInit: (id: string) => void;
  onTaskClick: (task: Assignment) => void;
  currentUserId?: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const Icon = section.icon;
  const pending = tasks.filter((t: Assignment) => t.status !== 'done');
  const done = tasks.filter((t: Assignment) => t.status === 'done');

  return (
    <div className="db-card border border-[var(--border-med)] overflow-hidden mb-4">
      <div
        className="flex items-center gap-3 px-4 py-3 bg-[var(--bg-deep)] cursor-pointer select-none border-b border-[var(--border)]"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="w-7 h-7 flex items-center justify-center flex-shrink-0" style={{ background: `${section.color}18` }}>
          <Icon size={14} style={{ color: section.color }} />
        </div>
        <span className="text-sm font-bold text-[var(--text)] flex-1">{section.label}</span>

        {tasks.length > 0 && (
          <span className="db-status" style={{ background: `${section.color}18`, color: section.color, border: 'none' }}>
            {pending.length} PENDING
          </span>
        )}

        {isAdmin && (
          <button
            onClick={e => { e.stopPropagation(); onAssign(section.key); }}
            className="db-icon-btn p-1"
            title={`Assign ${section.label}`}
          >
            <Plus size={14} />
          </button>
        )}

        <ChevronDown size={14} className={`text-[var(--text-4)] transition-transform ${expanded ? '' : '-rotate-90'}`} />
      </div>

      {expanded && (
        <div className="anim-fade-in">
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
                    onDeleteClick={onDeleteClick}
                    completing={completing}
                    deleting={deleting}
                    isAdmin={isAdmin}
                    showEditor={section.hasEditor}
                    onInit={onInit}
                    onTaskClick={onTaskClick}
                    currentUserId={currentUserId}
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
                      onDeleteClick={onDeleteClick}
                      completing={completing}
                      deleting={deleting}
                      isAdmin={isAdmin}
                      showEditor={section.hasEditor}
                      onInit={onInit}
                      onTaskClick={onTaskClick}
                      currentUserId={currentUserId}
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
    <div className="db-card border border-[var(--border-med)] overflow-hidden mb-4">
      <div className="flex items-center gap-3 px-4 py-3 bg-[var(--bg-deep)] border-b border-[var(--border)]">
        <div className="w-7 h-7 flex items-center justify-center flex-shrink-0" style={{ background: `${dept.color}18` }}>
          <Icon size={14} className={dept.color} />
        </div>
        <span className="text-sm font-bold text-[var(--text)] flex-1">{dept.label} BOARD</span>
        <button 
          onClick={() => onToast('Department tables coming soon')}
          className="db-ghost px-3 py-1.5"
        >
          <Plus size={12} />
          Add Table
        </button>
      </div>
      <div className="py-12 text-center text-[var(--text-4)] border-t border-[var(--rule)]">
        <Icon size={28} className="mx-auto mb-3 opacity-20" />
        <p className="text-xs font-medium italic">This department board is currently under construction.</p>
      </div>
    </div>
  );
}


export default function WorkPage() {
  const router = useRouter();
  const { user, loading: loadingUser } = useUser();
  const [myAssignments, setMyAssignments] = useState<Assignment[]>([]);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [reviewDocs, setReviewDocs] = useState<ReviewDoc[]>([]);
  const [proofreaderDocs, setProofreaderDocs] = useState<ReviewDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<{ category?: string; department?: string } | null>(null);
  const [activeDeptKey, setActiveDeptKey] = useState("Writers' Block");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  
  const isWritersBlock = activeDeptKey === "Writers' Block";
  const [completing, setCompleting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [view, setView] = useState<'my' | 'admin'>('my');
  const [toast, setToast] = useState<string | null>(null);
  const [submittingTask, setSubmittingTask] = useState<{ id: string; title: string } | null>(null);
  const [viewingMedia, setViewingMedia] = useState<{ url: string; title: string } | null>(null);
  const [selectedTask, setSelectedTask] = useState<Assignment | null>(null);
  const [assigningProofreader, setAssigningProofreader] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [counts, setCounts] = useState<{ articles: number; blogs: number }>({ articles: 0, blogs: 0 });
  const [starredDocs, setStarredDocs] = useState<any[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([]);

  const handleMarkAllRead = useCallback(() => {
    setNotifs(ns => ns.map(n => ({ ...n, read: true })));
    setToast('All notifications read');
  }, []);

  useEffect(() => {
    if (!loadingUser && user === null) {
      router.push('/login');
    }
  }, [user, loadingUser, router]);

  // Apply saved settings on mount (theme, accent colour, fonts, etc.)
  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    applySettings(s);
  }, []);

  const fetchWork = useCallback(async () => {
    setLoading(true);
    try {
      const [myRes, allRes] = await Promise.all([
        fetch('/api/tasks'),
        user?.admin_access ? fetch('/api/tasks/all') : Promise.resolve(null),
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
        const reviewRes = await fetch('/api/tasks/review-queue');
        if (reviewRes.ok) {
          const data = await reviewRes.json();
          setReviewDocs(data.documents || []);
        }
      }

      // Always check for proofreader assignments for anyone
      const proofreaderRes = await fetch('/api/tasks/proofreader-queue');
      if (proofreaderRes.ok) {
        const data = await proofreaderRes.json();
        setProofreaderDocs(data.documents || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.admin_access]);

  useEffect(() => {
    if (user !== undefined) fetchWork();
    
    // Set default department to user's department if it exists
    if (user?.department) {
      setActiveDeptKey(user.department);
    }
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
      const res = await fetch('/api/tasks', {
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

  const handleDelete = async (task: Assignment) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setDeleting(task.id);
    try {
      const res = await fetch(`/api/tasks?id=${task.id}`, { method: 'DELETE' });
      if (res.ok) {
        setMyAssignments(prev => prev.filter(a => a.id !== task.id));
        setAllAssignments(prev => prev.filter(a => a.id !== task.id));
        setToast('Task deleted');
      } else {
        const err = await res.json();
        setToast(err.error || 'Failed to delete task');
      }
    } catch (err) {
      setToast('Error deleting task');
    } finally {
      setDeleting(null);
    }
  };

  const handleInitDoc = async (assignmentId: string) => {
    try {
      const res = await fetch('/api/tasks/initialize-doc', {
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
        res = await fetch('/api/tasks/tasks/approve', {
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

  const handleAssignProofreader = async (docId: string, type: string, proofreaderId: string) => {
    setAssigningProofreader(docId);
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: docId,
          status: 'proofreading',
          proofreader_id: proofreaderId,
          type: type
        })
      });

      if (res.ok) {
        // Log activity
        await fetch('/api/tasks/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: docId,
            content: 'Proofreader assigned via dashboard.',
            type: 'status_change'
          })
        });

        setToast('Proofreader assigned successfully');
        setReviewDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'proofreading' as any } : d));
        fetchWork();
      } else {
        const data = await res.json();
        setToast(data.error || 'Failed to assign proofreader');
      }
    } catch (err) {
      setToast('An error occurred');
    } finally {
      setAssigningProofreader(null);
    }
  };

  const isAdmin = !!user?.admin_access;
  const assignments = isAdmin && view === 'admin' ? allAssignments : myAssignments;

  const handleTaskClick = (task: Assignment) => {
    setSelectedTask(task);
  };

  // Filter tasks for the active department
  const activeDeptTasks = assignments.filter(a => {
    // Treat null/undefined as "Writers' Block" for backward compatibility/editorial content
    if (activeDeptKey === "Writers' Block") {
      return a.department === activeDeptKey || !a.department;
    }
    return a.department === activeDeptKey;
  });
  
  const activeDept = DEPARTMENTS.find(d => d.key === activeDeptKey) || DEPARTMENTS[0];

  // Derive existing categories for the active department from ALL assignments (not just filtered view)
  // Use allAssignments so admins see all categories even if not assigned to them
  const deptExistingCategories = React.useMemo((): Array<{ key: string; label: string; iconName?: string }> => {
    const source = allAssignments.length > 0 ? allAssignments : myAssignments;
    const deptTasks = source.filter(a => {
      if (activeDeptKey === "Writers' Block") return a.department === activeDeptKey || !a.department;
      return a.department === activeDeptKey;
    });
    const seen: Record<string, { key: string; label: string; iconName?: string }> = {};
    for (const t of deptTasks) {
      if (!seen[t.category]) {
        seen[t.category] = {
          key: t.category,
          label: t.category.charAt(0).toUpperCase() + t.category.slice(1).replace(/_/g, ' '),
          iconName: t.category_icon ?? undefined,
        };
      }
    }
    return Object.values(seen);
  }, [allAssignments, myAssignments, activeDeptKey]);

  useEffect(() => {
    (window as any).openTaskDetails = (task: Assignment) => setSelectedTask(task);
    
    // Fetch counts for sidebar
    const fetchCounts = async () => {
      try {
        const r = await fetch('/api/documents');
        if (r.ok) {
          const d = await r.json();
          const docs = d.documents || [];
          setCounts({
            articles: docs.filter((doc: any) => doc.type === 'cancer_docs' || doc.type === 'survivor_stories').length,
            blogs: docs.filter((doc: any) => doc.type === 'blogs').length
          });
          setStarredDocs(docs.filter((doc: any) => doc.starred));
        }
      } catch {}
    };
    fetchCounts();
  }, []);

  const isFullSidebar  = isWritersBlock || activeDeptKey === 'Leadership';

  return (
    <div className={`db-root ${isDark ? 'dark' : ''}`}>
      {/* == HEADER ========================================================== */}
      <Header
        user={user}
        notifs={notifs}
        unreadCount={notifs.filter(n => !n.read).length}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenSearch={() => { /* Use global search or page search? For now, we'll keep it consistent */ }}
        onOpenSettings={() => setShowSettings(true)}
        onMarkAllRead={handleMarkAllRead}
        onToast={(m) => setToast(m)}
      >
        {/* Department Selector — specific to Tasks page */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="db-ghost px-2 py-1 flex items-center gap-1.5"
          >
            <Layers size={13} className="text-[var(--accent)]" />
            <span className="text-[11px] font-bold uppercase tracking-tight">{activeDeptKey}</span>
            <ChevronR size={10} className={`ml-1 transition-transform ${isMenuOpen ? 'rotate-90' : 'rotate-0'}`} />
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-[250]" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute top-full left-0 mt-1 w-52 bg-[var(--paper)] border border-[var(--rule)] shadow-xl z-[300]" style={{ borderTop: '2px solid var(--accent)' }}>
                <div className="p-2 border-b border-[var(--rule)]">
                  <span className="db-cap">Select Board</span>
                </div>
                <div className="p-1">
                  {DEPARTMENTS.map(dept => {
                    const isActive = activeDeptKey === dept.key;
                    return (
                      <button
                        key={dept.key}
                        onClick={() => { setActiveDeptKey(dept.key); setIsMenuOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] font-bold text-left hover:bg-[var(--accent-sub)] ${isActive ? 'text-[var(--accent)]' : 'text-[var(--mid)]'}`}
                      >
                        <dept.icon size={13} className={isActive ? dept.color : 'text-current'} />
                        {dept.label.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="db-vr hidden sm:block" />

        <div className="flex items-center gap-2">
          {isAdmin && (
            <div className="hidden sm:flex items-center bg-[var(--accent-sub)] p-0.5 border border-[var(--rule)]">
              <button 
                onClick={() => setView('my')}
                className={`db-filter-btn px-3 py-1 ${view === 'my' ? 'active' : ''}`}
              >
                My Assignments
              </button>
              <button 
                onClick={() => setView('admin')}
                className={`db-filter-btn px-3 py-1 ${view === 'admin' ? 'active' : ''}`}
              >
                Team Board
              </button>
            </div>
          )}
        </div>
      </Header>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <Sidebar 
          activeNav="tasks"
          isFullSidebar={isFullSidebar}
          counts={{
            articles: counts.articles,
            blogs: counts.blogs,
            tasks: (isAdmin && view === 'admin' ? allAssignments : myAssignments).filter(t => t.status !== 'done').length
          }}
          starredDocs={starredDocs}
          onNavClick={(id) => {
             if (id === 'home') router.push('/');
             if (id === 'articles') router.push('/');
             if (id === 'blogs') router.push('/');
          }}
        />

        {/* -- MAIN ---------------------------------------------------------- */}
        <main className="db-main">
          <div className="max-w-5xl mx-auto">

            {/* Editorial Page Title */}
            <div className="mb-8 anim-fade-in">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b-2 border-[var(--ink)]">
                <div>
                  <p className="db-page-sub mb-1">Board · {activeDeptKey}</p>
                  <h1 className="db-page-title">
                    {isAdmin ? (view === 'admin' ? 'TEAM' : 'MY') : 'ASSIGNMENT'} <em>BOARD</em>
                  </h1>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-sub)] border border-[var(--rule)]">
                    <span className="db-cap text-[var(--accent)] font-bold">{assignments.length}</span>
                    <span className="db-cap">Total Tasks</span>
                  </div>
                  {isAdmin && (
                    <button
                       onClick={() => setShowAssignModal({ department: activeDeptKey })}
                       className="db-btn"
                    >
                      <Plus size={12} strokeWidth={2.5} />
                      NEW TASK
                    </button>
                  )}
                </div>
              </div>
              <div className="h-px bg-[var(--rule)] mt-1 opacity-50" />
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4 text-[var(--text-4)]">
                <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent animate-spin" />
                <span className="db-cap">Loading assignments...</span>
              </div>
            ) : (
              <>
                {/* Leadership Queues (Admins only) */}
                {isAdmin && view === 'admin' && (
                  <>
                    <AssignmentQueue 
                      docs={reviewDocs.filter(d => d.status === 'ready_for_proofreading')}
                      onAssign={handleAssignProofreader}
                      assigning={assigningProofreader}
                      isAdmin={isAdmin}
                      onToast={setToast}
                    />
                    <ReviewQueue 
                      docs={reviewDocs.filter(d => d.status !== 'ready_for_proofreading')}
                      onApprove={handleApprove}
                      approving={approving}
                      isAdmin={isAdmin}
                      currentUserId={user?.id || ''}
                      onToast={setToast}
                      onViewMedia={(url, title) => setViewingMedia({ url, title })}
                    />
                  </>
                )}

                {/* Proofreader Queue (For assigned proofreaders) */}
                <ProofreaderQueue 
                  docs={proofreaderDocs}
                  currentUserId={user?.id || ''}
                  onToast={setToast}
                />
                {/* Specialized Content Section (Writers' Block) */}
                {isWritersBlock ? (
                  <div className="anim-fade-in">
                    <div className="flex items-center justify-between mb-4 mt-8 pb-2 border-b-2 border-[var(--ink)]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[var(--accent-sub)] flex items-center justify-center">
                          <PenTool size={16} className="text-[var(--accent)]" />
                        </div>
                        <div>
                          <h2 className="db-page-sub font-bold text-[var(--ink)]">Editorial Workflow</h2>
                          <p className="db-cap text-[8px]">Articles, blogs, and community stories</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowAssignModal({ department: "Writers' Block" })}
                        className="db-ghost px-3 py-1 text-[10px]"
                      >
                        <Plus size={10} />
                        ADD CATEGORY
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
                            onDeleteClick={handleDelete}
                            completing={completing}
                            deleting={deleting}
                            isAdmin={isAdmin}
                            onAssign={(category: string) => setShowAssignModal({ category, department: activeDeptKey })}
                            onToast={(m: string) => setToast(m)}
                            onInit={handleInitDoc}
                            onTaskClick={handleTaskClick}
                            currentUserId={user?.id}
                          />
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="anim-fade-in">
                    <div className="flex items-center justify-between mb-4 mt-8 pb-2 border-b-2 border-[var(--ink)]">
                      <div className="flex items-center gap-3">
                        {DEPT_CUSTOM_ICON[activeDeptKey] ? (
                          <div className={`w-8 h-8 ${activeDept.bg} flex items-center justify-center p-1.5`}>
                            <Image
                              src={DEPT_CUSTOM_ICON[activeDeptKey]}
                              alt={activeDept.label}
                              width={20}
                              height={20}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                          </div>
                        ) : (
                          <div className={`w-8 h-8 ${activeDept.bg} flex items-center justify-center`}>
                            <activeDept.icon size={16} className={activeDept.color} />
                          </div>
                        )}
                        <div>
                          <h2 className="db-page-sub font-bold text-[var(--ink)]">{activeDept.label} Board</h2>
                          <p className="db-cap text-[8px]">Active projects and tasks for {activeDept.label}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowAssignModal({ department: activeDeptKey })}
                         className={`db-ghost px-3 py-1 text-[10px] ${activeDept.color}`}
                      >
                        <Plus size={10} />
                        ADD CATEGORY
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
                            onDeleteClick={handleDelete}
                            completing={completing}
                            deleting={deleting}
                            isAdmin={isAdmin}
                            onAssign={() => setShowAssignModal({ category: 'task', department: activeDeptKey })}
                            onToast={(m: string) => setToast(m)}
                            onInit={handleInitDoc}
                            onTaskClick={handleTaskClick}
                            currentUserId={user?.id}
                          />
                        );
                      }
                      
                      return categories.sort().map(cat => {
                        const sectionTasks = activeDeptTasks.filter(a => a.category === cat);
                        const known = KNOWN_CATEGORIES[cat];
                        // Use stored icon name from the first task in this category
                        const storedIconName = sectionTasks[0]?.category_icon;
                        const storedIcon = storedIconName ? (ICON_NAME_MAP[storedIconName] ?? null) : null;
                        const deptColor = getDeptHex(activeDeptKey);
                        // If no stored icon, try to guess from the category name keywords
                        const resolvedIcon = storedIcon || known?.icon || guessIconFromCategoryName(cat);
                        return (
                          <SectionTable
                            key={cat}
                            section={{
                              key: cat,
                              label: known?.label || cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' '),
                              icon: resolvedIcon,
                              color: known?.color || deptColor,
                              hasEditor: ['article', 'blog', 'survivor_story'].includes(cat),
                              table: null
                            }}
                            tasks={sectionTasks}
                            onCompleteClick={handleCompleteClick}
                            onDeleteClick={handleDelete}
                            completing={completing}
                            deleting={deleting}
                            isAdmin={isAdmin}
                            onAssign={(category: string) => setShowAssignModal({ category, department: activeDeptKey })}
                            onToast={(m: string) => setToast(m)}
                            onInit={handleInitDoc}
                            onTaskClick={handleTaskClick}
                            currentUserId={user?.id}
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
          existingCategories={deptExistingCategories}
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
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          isAdmin={isAdmin}
          userId={user?.id}
          onClose={() => setSelectedTask(null)}
          onUpdate={fetchWork}
          onOpenSubmission={(id, title) => {
            setSelectedTask(null);
            setSubmittingTask({ id, title });
          }}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <nav className="db-mobile-nav">
        <div className="db-mob-inner">
          {[
            { id: 'home',     label: 'Overview',    icon: Home,      href: '/'      },
            { id: 'articles', label: 'Articles',    icon: FileText,  href: '/'      },
            { id: 'blogs',    label: 'Blog Posts',  icon: BookOpen,  href: '/'      },
            { id: 'tasks',    label: 'Assignments', icon: Briefcase, href: '/tasks' },
            { id: 'team',     label: 'Team',        icon: Users,     href: '/team'  },
          ].map(item => {
            const isActive = item.id === 'tasks';
            const inner = (
              <>
                <item.icon size={17} strokeWidth={1.8} />
                <span>{item.label}</span>
              </>
            );
            return <Link key={item.id} href={item.href} className={`db-mob-item${isActive ? ' active' : ''}`}>{inner}</Link>;
          })}
        </div>
      </nav>
    </div>
  );
}
