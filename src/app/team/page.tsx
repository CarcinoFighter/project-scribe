'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Users, 
  Mail, 
  MapPin, 
  Shield, 
  Search,
  ChevronRight,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  ExternalLink,
  Github,
  Twitter,
  Linkedin
} from 'lucide-react';
import { useUser } from '@/lib/useUser';
import AccountMenu from '@/components/AccountMenu';
import AssignTaskModal from '@/components/AssignTaskModal';
import Toast from '@/components/Toast';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar_url: string | null;
  position: string;
  department: string;
  is_active: boolean;
  admin_access: boolean;
}

export default function TeamPage() {
  const { user: currentUser } = useUser();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<TeamMember | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchTeam() {
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
    }
    fetchTeam();
  }, []);

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

  // Fixed departments list
  const DEPARTMENTS = [
    "Leadership",
    "Writers' Block",
    "Public Relations",
    "Design Lab",
    "Development",
    "Other"
  ];

  const filteredMembers = members.filter(m => {
    let matchesFilter = true;
    if (filter === 'admin') matchesFilter = m.admin_access;
    else if (filter !== 'all') matchesFilter = m.department === filter;

    const matchesSearch = !search || 
      m.name.toLowerCase().includes(search.toLowerCase()) || 
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.username.toLowerCase().includes(search.toLowerCase()) ||
      m.department?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const groupedMembers = DEPARTMENTS.reduce((acc, dept) => {
    const list = filteredMembers.filter(m => {
      const mDept = m.department || 'Other';
      if (dept === "Other") return !DEPARTMENTS.slice(0, -1).includes(mDept);
      return mDept === dept;
    });
    if (list.length > 0) acc[dept] = list;
    return acc;
  }, {} as Record<string, TeamMember[]>);

  return (
    <div className={`app-bg min-h-screen flex flex-col ${isDark ? 'dark' : ''}`}>
      {/* Unified Header */}
      <header className="app-header anim-slide-down flex items-center px-4 h-[52px] sticky top-0 z-50 glass glass-rim">
        <div className="flex items-center gap-2 select-none mr-4">
          <Image src="/logo.svg" alt="Vantage" width={18} height={22} priority />
          <span className="font-bold text-[13.5px] text-[var(--text)] tracking-tight">
            Vantage <span className="opacity-40 font-medium mx-1">/</span> <span className="text-[var(--text-4)]">Team</span>
          </span>
        </div>
        
        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <button 
            className="w-8 h-8 rounded-full overflow-hidden border border-[var(--border-med)] hover:border-[var(--accent)] transition-all"
            onClick={() => setShowAccountMenu(!showAccountMenu)}
          >
            {currentUser?.avatar_url ? (
              <Image src={currentUser.avatar_url} alt="Profile" width={32} height={32} className="object-cover" />
            ) : (
              <div className="w-full h-full bg-[var(--accent)] flex items-center justify-center text-white text-[10px] font-bold">
                {currentUser?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
              </div>
            )}
          </button>
          {showAccountMenu && (
            <AccountMenu user={currentUser} onClose={() => setShowAccountMenu(false)} onToast={(m) => setToast(m)} />
          )}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="sidebar-col w-52 p-4 space-y-1 hidden md:block" style={{ position: 'sticky', top: 52, height: 'calc(100vh - 52px)', overflowY: 'auto' }}>
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-4)] hover:text-[var(--text)] rounded-[var(--r-md)] transition-colors">
            <ChevronRight size={14} className="rotate-180" />
            Dashboard
          </Link>
          <div className="pt-4 pb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)]">Directory</div>
          <button 
            onClick={() => setFilter('all')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-[var(--r-md)] font-semibold text-left transition-all ${filter === 'all' ? 'text-[var(--accent)] bg-[var(--accent-subtle2)]' : 'text-[var(--text-4)] hover:text-[var(--text)] hover:bg-[var(--bg-deep)]'}`}
          >
            <Users size={14} />
            Members
          </button>
          <button 
            onClick={() => setFilter('admin')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-[var(--r-md)] transition-all text-left font-semibold ${filter === 'admin' ? 'text-[var(--accent)] bg-[var(--accent-subtle2)]' : 'text-[var(--text-4)] hover:text-[var(--text)] hover:bg-[var(--bg-deep)]'}`}
          >
            <Shield size={14} />
            Admins
          </button>

          <div className="pt-4 pb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)]">Departments</div>
          {DEPARTMENTS.filter(d => d !== 'Other').map(dept => (
            <button 
              key={dept}
              onClick={() => setFilter(dept)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-[var(--r-md)] transition-all text-left font-semibold capitalize ${filter === dept ? 'text-[var(--accent)] bg-[var(--accent-subtle2)]' : 'text-[var(--text-4)] hover:text-[var(--text)] hover:bg-[var(--bg-deep)]'}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${filter === dept ? 'bg-[var(--accent)]' : 'bg-[var(--text-4)]/40'}`} />
              <span className="truncate">{dept}</span>
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8 anim-fade-up">
              <div>
                <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">Team Directory</h1>
                <p className="text-sm text-[var(--text-4)] mt-1">Foundational network of the Carcino Foundation</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mb-10 anim-fade-up delay-75">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-4)]" size={14} />
                <input 
                  type="text" 
                  placeholder="Search name, email, or department..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-med)] rounded-[var(--r-md)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="glass-raised p-6 rounded-[var(--r-xl)] space-y-4 animate-pulse">
                    <div className="w-16 h-16 bg-[var(--bg-deep)] rounded-full mx-auto" />
                    <div className="h-4 bg-[var(--bg-deep)] w-2/3 mx-auto rounded" />
                    <div className="h-3 bg-[var(--bg-deep)] w-1/3 mx-auto rounded" />
                  </div>
                ))}
              </div>
            ) : members.length === 0 ? (
              <div className="col-span-full py-20 text-center glass-raised rounded-[var(--r-xl)] p-12 anim-fade-up">
                 <div className="w-16 h-16 bg-[var(--bg-deep)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--border-med)]">
                   <Users size={28} className="text-[var(--text-4)] opacity-50" />
                 </div>
                 <h3 className="text-lg font-bold text-[var(--text)]">No members found</h3>
              </div>
            ) : (
              <div className="space-y-12">
                {Object.entries(groupedMembers).map(([dept, deptMembers], sectionIdx) => (
                  <div key={dept} className="anim-fade-up" style={{ animationDelay: `${sectionIdx * 0.1}s` }}>
                    <div className="flex items-center gap-4 mb-6">
                      <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--text-4)]">{dept}</h2>
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--border-med)] to-transparent" />
                      <span className="text-[10px] font-bold text-[var(--text-4)] bg-[var(--bg-deep)] px-2 py-0.5 rounded border border-[var(--border)]">{deptMembers.length}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {deptMembers.map((member, i) => (
                        <div 
                          key={member.id} 
                          className="glass-raised grain p-6 rounded-[var(--r-xl)] group hover:-translate-y-0.5 transition-all relative overflow-hidden"
                        >
                          <div className="relative z-10">
                            <div className="relative mb-5">
                              <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-[var(--bg-deep)] shadow-lg shadow-black/10 group-hover:border-[var(--accent-subtle)] transition-colors">
                                {member.avatar_url ? (
                                  <Image src={member.avatar_url} alt={member.name} width={80} height={80} className="object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-[var(--bg-deep)] to-[var(--surface-2)] flex items-center justify-center text-[var(--text-4)] font-bold text-2xl">
                                    {member.name?.split(' ').map(n => n[0]).join('') || '?'}
                                  </div>
                                )}
                              </div>
                              {member.admin_access && (
                                <div className="absolute top-0 right-[35%] p-1 bg-amber-500 rounded-full text-white shadow-md shadow-amber-500/20" title="Administrator">
                                  <Shield size={12} />
                                </div>
                              )}
                            </div>

                            <div className="text-center mb-6">
                              <h3 className="text-base font-bold text-[var(--text)] mb-1 group-hover:text-[var(--accent)] transition-colors">{member.name}</h3>
                              <p className="text-xs text-[var(--text-4)] font-medium capitalize">{member.position || 'Contributor'}</p>
                            </div>

                            <div className="flex flex-col gap-2.5 mb-6">
                              <div className="flex items-center gap-2 text-[11px] text-[var(--text-3)] justify-center bg-white/5 py-1.5 rounded-lg border border-white/5 group-hover:border-[var(--accent-subtle2)] transition-colors">
                                <Mail size={12} className="text-[var(--accent)]" />
                                <span className="truncate max-w-[180px]">{member.email || `${member.username}@carcino.org`}</span>
                              </div>
                            </div>

                            <div className="pt-5 border-t border-[var(--border)] flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <a href={`https://github.com/${member.username}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-4)] hover:text-[var(--text)] transition-colors" title="GitHub">
                                  <Github size={14} />
                                </a>
                                <a href={`https://linkedin.com/in/${member.username}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-4)] hover:text-[#0A66C2] transition-colors" title="LinkedIn">
                                  <Linkedin size={14} />
                                </a>
                              </div>
                              
                              {currentUser?.admin_access && (
                                <button 
                                  onClick={() => setShowAssignModal(member)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-subtle2)] hover:bg-[var(--accent-subtle)] text-[var(--accent)] text-[10px] font-bold uppercase tracking-wider rounded-[var(--r-md)] border border-[var(--accent-subtle)] transition-all"
                                >
                                  Assign
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {showAssignModal && (
        <AssignTaskModal 
          member={showAssignModal}
          onClose={() => setShowAssignModal(null)}
          onSuccess={() => { setShowAssignModal(null); setToast('Task assigned successfully'); }}
        />
      )}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
