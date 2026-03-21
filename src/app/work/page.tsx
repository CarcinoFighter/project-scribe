'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  Search,
  ChevronRight,
  Plus,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Layers
} from 'lucide-react';
import { useUser } from '@/lib/useUser';
import AccountMenu from '@/components/AccountMenu';
import AssignTaskModal from '@/components/AssignTaskModal';

interface Assignment {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'normal' | 'high';
  category: 'task' | 'article' | 'blog' | 'survivor_story';
  department?: string;
  due_date: string;
  created_at: string;
}

export default function WorkPage() {
  const { user } = useUser();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const fetchWork = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/work');
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWork();
  }, []);

  useEffect(() => {
    const dark = localStorage.getItem('cs-dark') === 'true';
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'in-progress': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'normal': return 'text-amber-500';
      default: return 'text-emerald-500';
    }
  };

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
          <button className="tb-btn" onClick={() => setShowAccountMenu(!showAccountMenu)}>
             <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center text-white text-[10px] font-bold">
               {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
             </div>
          </button>
          {showAccountMenu && (
            <AccountMenu user={user} onClose={() => setShowAccountMenu(false)} onToast={() => {}} />
          )}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Mini */}
        <aside className="w-52 border-r border-[var(--border-med)] p-4 space-y-1 hidden md:block">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-4)] hover:text-[var(--text)] rounded-[var(--r-md)] transition-colors">
            <ChevronRight size={14} className="rotate-180" />
            Dashboard
          </Link>
          <div className="pt-4 pb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)]">Assignments</div>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--accent)] bg-[var(--accent-subtle2)] rounded-[var(--r-md)] font-semibold">
            <Briefcase size={14} />
            My Tasks
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-4)] hover:text-[var(--text)] hover:bg-[var(--bg-deep)] rounded-[var(--r-md)] transition-all">
            <CheckCircle2 size={14} />
            Completed
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8 anim-fade-up">
              <div>
                <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">Work Assignments</h1>
                <p className="text-sm text-[var(--text-4)] mt-1">Manage and track your editorial tasks</p>
              </div>
              {user?.admin_access && (
                <button 
                  onClick={() => setShowAssignModal(true)}
                  className="bg-[var(--accent)] text-white px-4 py-2 rounded-[var(--r-md)] text-sm font-semibold flex items-center gap-2 shadow-lg shadow-[var(--accent-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Plus size={16} />
                  Assign Task
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6 anim-fade-up delay-75">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-4)]" size={14} />
                <input 
                  type="text" 
                  placeholder="Filter tasks..." 
                  className="w-full pl-9 pr-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-med)] rounded-[var(--r-md)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <button className="tb-btn border border-[var(--border-med)] bg-[var(--bg-deep)] px-3 py-1.5 text-xs text-[var(--text-3)] flex items-center gap-2">
                <Filter size={12} />
                Status
              </button>
              <button className="tb-btn border border-[var(--border-med)] bg-[var(--bg-deep)] px-3 py-1.5 text-xs text-[var(--text-3)] flex items-center gap-2">
                <ArrowUpDown size={12} />
                Sort
              </button>
            </div>

            {/* Tasks List */}
            <div className="space-y-3">
              {loading ? (
                <div className="py-20 text-center text-[var(--text-4)] flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Loading your assignments...</span>
                </div>
              ) : assignments.length === 0 ? (
                <div className="py-20 text-center glass-raised rounded-[var(--r-xl)] p-12 anim-fade-up">
                   <div className="w-16 h-16 bg-[var(--bg-deep)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--border-med)]">
                     <Briefcase size={28} className="text-[var(--text-4)] opacity-50" />
                   </div>
                   <h3 className="text-lg font-bold text-[var(--text)]">No assignments found</h3>
                   <p className="text-sm text-[var(--text-4)] mt-2 mx-auto max-w-xs">You don't have any work assigned to you at the moment. Enjoy the break!</p>
                </div>
              ) : (
                assignments.map((task, i) => (
                  <div 
                    key={task.id} 
                    className="glass-raised p-5 rounded-[var(--r-lg)] flex items-center gap-6 hover:border-[var(--accent-subtle)] transition-all group anim-fade-up"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {task.status === 'completed' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-bold text-[var(--text)] truncate group-hover:text-[var(--accent)] transition-colors">{task.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(task.status)}`}>
                          {task.status.replace('-', ' ')}
                        </span>
                        {task.category !== 'task' && (
                          <span className="text-[10px] font-bold text-[var(--text-4)] bg-[var(--bg-deep)] px-2 py-0.5 rounded border border-[var(--border-med)] uppercase tracking-wider">
                            {task.category.replace('_', ' ')}
                          </span>
                        )}
                        {task.department && (
                          <span className="text-[10px] font-medium text-[var(--accent)] bg-[var(--accent-subtle2)] px-2 py-0.5 rounded border border-[var(--accent-subtle)] uppercase tracking-wider">
                            {task.department}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-4)] line-clamp-1">{task.description}</p>
                    </div>

                    <div className="flex items-center gap-8 pr-4">
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-4)] mb-1">Priority</div>
                        <div className={`text-xs font-bold capitalize ${getPriorityColor(task.priority)}`}>{task.priority}</div>
                      </div>
                      
                      <div className="text-right whitespace-nowrap">
                        <div className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-4)] mb-1 flex items-center gap-1 justify-end">
                          <Calendar size={10} />
                          Due Date
                        </div>
                        <div className="text-xs font-semibold text-[var(--text-3)]">{new Date(task.due_date).toLocaleDateString()}</div>
                      </div>

                      <button className="text-[var(--text-4)] hover:text-[var(--text)] transition-colors p-2">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {showAssignModal && (
        <AssignTaskModal 
          onClose={() => setShowAssignModal(false)} 
          onSuccess={fetchWork} 
        />
      )}
    </div>
  );
}
