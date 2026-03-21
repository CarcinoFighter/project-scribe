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
  const [filter, setFilter] = useState<'all' | 'admin'>('all');
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
    const dark = localStorage.getItem('cs-dark') === 'true';
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const getDeptColor = (dept: string) => {
    switch (dept?.toLowerCase()) {
      case "writers' block": return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'design lab': return 'text-pink-500 bg-pink-500/10 border-pink-500/20';
      case 'development': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'marketing': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-[var(--text-4)] bg-[var(--bg-deep)] border-[var(--border-med)]';
    }
  };

  const filteredMembers = members.filter(m => {
    const matchesFilter = filter === 'all' || m.admin_access;
    const matchesSearch = !search || 
      m.name.toLowerCase().includes(search.toLowerCase()) || 
      m.username.toLowerCase().includes(search.toLowerCase()) ||
      m.department?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className={`app-bg min-h-screen flex flex-col ${isDark ? 'dark' : ''}`}>
      {/* Header */}
      <header className="app-header glass glass-rim flex items-center px-4 h-[52px] border-b border-[var(--border-med)] sticky top-0 z-50">
        <div className="flex items-center gap-2 select-none mr-4">
          <Image src="/logo.svg" alt="Carcino" width={18} height={22} priority />
          <span className="font-bold text-[13.5px] text-[var(--text)] tracking-tight">
            Carcino <span className="text-[var(--accent)]">Team</span>
          </span>
        </div>
        
        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <button className="tb-btn" onClick={() => setShowAccountMenu(!showAccountMenu)}>
             <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center text-white text-[10px] font-bold">
               {currentUser?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
             </div>
          </button>
          {showAccountMenu && (
            <AccountMenu user={currentUser} onClose={() => setShowAccountMenu(false)} onToast={(m) => setToast(m)} />
          )}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-52 border-r border-[var(--border-med)] p-4 space-y-1 hidden md:block">
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
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8 anim-fade-up">
              <div>
                <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">Team Directory</h1>
                <p className="text-sm text-[var(--text-4)] mt-1">Connect with the Carcino Foundation network</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mb-10 anim-fade-up delay-75">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-4)]" size={14} />
                <input 
                  type="text" 
                  placeholder="Search team members..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-med)] rounded-[var(--r-md)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div className="flex items-center gap-2">
                 <button 
                  onClick={() => setToast('Department filtering coming soon')}
                  className="tb-btn border border-[var(--border-med)] bg-[var(--bg-deep)] px-3 py-1.5 text-xs text-[var(--text-3)] flex items-center gap-2"
                >
                  <Filter size={12} />
                  Department
                </button>
                <button 
                  onClick={() => setToast('Sorting options coming soon')}
                  className="tb-btn border border-[var(--border-med)] bg-[var(--bg-deep)] px-3 py-1.5 text-xs text-[var(--text-3)] flex items-center gap-2"
                >
                  <ArrowUpDown size={12} />
                  Sort
                </button>
              </div>
            </div>

            {/* Team Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="glass-raised p-6 rounded-[var(--r-xl)] space-y-4 animate-pulse">
                    <div className="w-16 h-16 bg-[var(--bg-deep)] rounded-full mx-auto" />
                    <div className="h-4 bg-[var(--bg-deep)] w-2/3 mx-auto rounded" />
                    <div className="h-3 bg-[var(--bg-deep)] w-1/3 mx-auto rounded" />
                    <div className="pt-4 flex justify-center gap-3">
                      <div className="w-8 h-8 bg-[var(--bg-deep)] rounded-full" />
                      <div className="w-8 h-8 bg-[var(--bg-deep)] rounded-full" />
                    </div>
                  </div>
                ))
              ) : members.length === 0 ? (
                <div className="col-span-full py-20 text-center glass-raised rounded-[var(--r-xl)] p-12 anim-fade-up">
                   <div className="w-16 h-16 bg-[var(--bg-deep)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--border-med)]">
                     <Users size={28} className="text-[var(--text-4)] opacity-50" />
                   </div>
                   <h3 className="text-lg font-bold text-[var(--text)]">No members found</h3>
                   <p className="text-sm text-[var(--text-4)] mt-2">Try adjusting your search or filters.</p>
                </div>
              ) : (
                filteredMembers.map((member, i) => (
                  <div 
                    key={member.id} 
                    className="glass-raised p-6 rounded-[var(--r-xl)] group hover:scale-[1.02] transition-all anim-fade-up"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
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
                        <div className="absolute top-0 right-0 p-1 bg-amber-500 rounded-full text-white shadow-md shadow-amber-500/20" title="Administrator">
                          <Shield size={12} />
                        </div>
                      )}
                    </div>

                    <div className="text-center mb-6">
                      <h3 className="text-base font-bold text-[var(--text)] mb-1 group-hover:text-[var(--accent)] transition-colors">{member.name}</h3>
                      <p className="text-xs text-[var(--text-4)] font-medium">{member.position || 'Contributor'}</p>
                    </div>

                    <div className="flex flex-col gap-2.5 mb-6">
                      <div className={`flex items-center justify-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getDeptColor(member.department)}`}>
                        {member.department || 'General'}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--text-3)] justify-center">
                        <Mail size={12} />
                        {member.username}@carcino.org
                      </div>
                    </div>

                    <div className="pt-5 border-t border-[var(--border)] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <a href={`https://github.com/${member.username}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-4)] hover:text-[var(--accent)] transition-colors" title="GitHub">
                          <Github size={14} />
                        </a>
                        <a href={`https://twitter.com/${member.username}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-4)] hover:text-[#1DA1F2] transition-colors" title="Twitter">
                          <Twitter size={14} />
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
                          Assign Task
                        </button>
                      )}
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
          member={showAssignModal}
          onClose={() => setShowAssignModal(null)}
          onSuccess={() => { setShowAssignModal(null); setToast('Task assigned successfully'); }}
        />
      )}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
